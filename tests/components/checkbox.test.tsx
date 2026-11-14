import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Checkbox } from "@/registry/cadence/checkbox";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function slot(container: HTMLElement) {
  const root = container.querySelector('[data-slot="checkbox"]');
  if (!root) throw new Error("checkbox not rendered");
  return root as HTMLElement;
}

function indicator(container: HTMLElement) {
  const node = container.querySelector('[data-slot="checkbox-indicator"]');
  if (!node) throw new Error("indicator not rendered");
  return node as HTMLElement;
}

describe("Checkbox", () => {
  it("renders the upstream surface and keeps the indicator mounted", () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    const root = slot(container);

    expect(root).toHaveAttribute("data-motion", "full");
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBe(root);
    expect(container.querySelector('[data-slot="checkbox-indicator"]')).toBeInTheDocument();
  });

  it("toggles through the pointer and reports the checked state", async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    const root = slot(container);

    expect(root).toHaveAttribute("data-unchecked");
    await userEvent.click(root);
    expect(root).toHaveAttribute("data-checked");
    expect(root).toHaveAttribute("aria-checked", "true");
  });

  it("declares one colour owner over the box paint, never the indicator", () => {
    const { container } = render(<Checkbox aria-label="Accept terms" defaultChecked />);
    const root = slot(container);

    expect(root.getAttribute("data-cadence-color")?.split(", ")).toEqual([
      "background-color",
      "color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ]);
    expect(indicator(container)).not.toHaveAttribute("data-cadence-color");
  });

  it("keeps the tick at full size under reduced motion", async () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Checkbox aria-label="Accept terms" />
      </CadenceProvider>,
    );
    const root = slot(container);

    await userEvent.click(root);
    expect(root).toHaveAttribute("data-motion", "reduced");
    expect(indicator(container).style.transform).not.toContain("0.96");
  });

  it("drops the transition entirely when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Checkbox aria-label="Accept terms" defaultChecked />
      </CadenceProvider>,
    );

    expect(slot(container)).toHaveAttribute("data-motion", "none");
    expect(indicator(container).style.transition).toBe("");
  });

  it("styles the invalid state from the attribute only", () => {
    const { container } = render(<Checkbox aria-label="Accept terms" aria-invalid />);
    expect(slot(container)).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps the mixed glyph and the native form entry", async () => {
    const { container } = render(
      <form>
        <Checkbox aria-label="Rows" name="rows" value="all" indeterminate />
      </form>,
    );
    const root = slot(container);
    const input = container.querySelector("input") as HTMLInputElement;

    expect(root).toHaveAttribute("aria-checked", "mixed");
    expect(container.querySelector(".lucide-minus")).not.toBeNull();
    // `indeterminate` never sets a submitted value by itself.
    expect(input.checked).toBe(false);
    expect(input.name).toBe("rows");
  });

  it("toggles from the keyboard and honours readOnly without a second writer", async () => {
    const view = render(
      <>
        <Checkbox aria-label="Keyboard" />
        <Checkbox aria-label="Locked" readOnly defaultChecked />
      </>,
    );
    const keyboard = screen.getByRole("checkbox", { name: "Keyboard" });
    const locked = screen.getByRole("checkbox", { name: "Locked" });

    keyboard.focus();
    await userEvent.keyboard(" ");
    expect(keyboard).toHaveAttribute("aria-checked", "true");
    expect(keyboard).toHaveFocus();

    locked.focus();
    await userEvent.keyboard(" ");
    expect(locked).toHaveAttribute("aria-checked", "true");
    view.unmount();
  });

  it("retargets one indicator through a rapid checked → mixed → unchecked revision", () => {
    const view = render(<Checkbox aria-label="Rapid" checked />);
    const root = slot(view.container);
    const mark = indicator(view.container);

    expect(root).toHaveAttribute("aria-checked", "true");
    view.rerender(<Checkbox aria-label="Rapid" checked indeterminate />);
    expect(root).toHaveAttribute("aria-checked", "mixed");
    expect(view.container.querySelector(".lucide-minus")).not.toBeNull();
    view.rerender(<Checkbox aria-label="Rapid" checked={false} />);
    expect(root).toHaveAttribute("aria-checked", "false");
    // The glyph is replaced in place; there is never a second decorative mark.
    expect(view.container.querySelectorAll('[data-slot="checkbox-indicator"]')).toHaveLength(1);
    expect(indicator(view.container)).toBe(mark);
    expect(view.container.querySelector(".lucide-check")).not.toBeNull();
  });

  it("keeps the verified box colour clock and settles focus, invalid paint and a reset", async () => {
    const view = render(
      <CadenceProvider timeScale={1}>
        <form>
          <Checkbox aria-label="Chrome" />
        </form>
      </CadenceProvider>,
    );
    const root = slot(view.container);
    const mark = indicator(view.container);
    const form = view.container.querySelector("form") as HTMLFormElement;

    // The shipped chrome owns one explicit paint clock while it is eligible.
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0.16));
    expect(root.style.transitionProperty).not.toContain("all");
    expect(root.style.transitionProperty).toContain("border-top-color");
    expect(root.style.transitionProperty).toContain("box-shadow");
    expect(root.style.transitionDelay).toBe("0s");

    // Real DOM focus on the colour owner settles every declared property at once.
    root.focus();
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0));
    root.blur();
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0.16));

    view.rerender(
      <CadenceProvider timeScale={1}>
        <form>
          <Checkbox aria-label="Chrome" aria-invalid="true" />
        </form>
      </CadenceProvider>,
    );
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0));

    // A caller palette we cannot prove also settles at its target.
    view.rerender(
      <CadenceProvider timeScale={1}>
        <form>
          <Checkbox aria-label="Chrome" style={{ backgroundColor: "#333" }} />
        </form>
      </CadenceProvider>,
    );
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0));
    expect(root.style.backgroundColor).toBe("rgb(51, 51, 51)");

    // A native reset is Base UI's own state: this design adds no reset writer, no
    // synthesized revision and no replay of the accepted mark.
    const change = vi.fn();
    view.rerender(
      <CadenceProvider timeScale={1}>
        <form>
          <Checkbox aria-label="Chrome" onCheckedChange={change} />
        </form>
      </CadenceProvider>,
    );
    await userEvent.click(root);
    expect(root).toHaveAttribute("aria-checked", "true");
    expect(change).toHaveBeenCalledTimes(1);
    await act(async () => {
      form.reset();
    });
    expect(root).toHaveAttribute("aria-checked", "true");
    expect(change).toHaveBeenCalledTimes(1);
    expect(indicator(view.container)).toBe(mark);
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <Checkbox aria-label="Terms" />
    </CadenceProvider>,
  );
  expectMotionContract(mode, { policy: ["color"] });
});

describe("Checkbox v2", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    // A zero clock keeps the three-mode matrix about ownership and mode policy;
    // the positive clock is proven by the verified-chrome case above.
    const draw = ({
      present = true,
      checked = false,
      paint,
    }: {
      present?: boolean;
      checked?: boolean;
      paint?: string;
    } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Checkbox
          aria-label="Terms"
          checked={checked}
          hidden={!present}
          style={paint ? { backgroundColor: paint } : undefined}
        />
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const root = slot(view.container);

    // One independent opacity entrance on the same root, never a per-part replay.
    await expectV2MotionAction("checkbox", "checkbox.root.enter", mode, () => view.rerender(draw()));
    expect(root).not.toHaveAttribute("hidden");

    // The accepted checked revision retargets the same indicator host.
    await expectV2MotionAction("checkbox", "checkbox.indicator.change", mode, () =>
      view.rerender(draw({ checked: true })),
    );
    expect(root).toHaveAttribute("aria-checked", "true");
    expect(indicator(view.container)).toHaveAttribute("data-slot", "checkbox-indicator");

    // The box owns one surface-foreground family over its declared paint.
    await expectV2MotionAction("checkbox", "checkbox.root.colour", mode, () =>
      view.rerender(draw({ checked: true, paint: "#333" })),
    );
    expect(root.style.backgroundColor).toBe("rgb(51, 51, 51)");
    expectMotionContract(mode, { policy: ["color"], parts: [root, indicator(view.container)] });
    await expectV2NativeBoundaries("checkbox", { container: view.container });
  });

  it("keeps native ids, exports, props and data-slots", () => {
    const { container } = render(
      <form>
        <Checkbox aria-label="Parity" id="consent" name="consent" value="yes" required defaultChecked />
      </form>,
    );
    const root = slot(container);
    const input = container.querySelector("input") as HTMLInputElement;

    expect(root.tagName).toBe("SPAN");
    expect(root).toHaveAttribute("role", "checkbox");
    expect(input.type).toBe("checkbox");
    expect(input.id).toBe("consent");
    expect(input.checked).toBe(true);
    expect(input.required).toBe(true);
    expect(indicator(container)).toHaveAttribute("data-motion", "full");
  });
});
