import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { RadioGroup, RadioGroupItem } from "@/registry/cadence/radio-group";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function group(container: HTMLElement) {
  const root = container.querySelector('[data-slot="radio-group"]');
  if (!root) throw new Error("radio group not rendered");
  return root as HTMLElement;
}

function items(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>('[data-slot="radio-group-item"]')];
}

function item(container: HTMLElement, index = 0) {
  const node = items(container)[index];
  if (!node) throw new Error("radio item not rendered");
  return node;
}

function indicator(container: HTMLElement, index = 0) {
  const node = items(container)[index]?.querySelector('[data-slot="radio-group-indicator"]');
  if (!node) throw new Error("radio indicator not rendered");
  return node as HTMLElement;
}

function content(container: HTMLElement, index = 0) {
  const node = indicator(container, index).querySelector("span");
  if (!node) throw new Error("radio dot not rendered");
  return node as HTMLElement;
}

describe("RadioGroup", () => {
  it("renders the upstream surface with one group and a mounted indicator per item", () => {
    const { container } = render(
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="team" aria-label="Team" />
        <RadioGroupItem value="scale" aria-label="Scale" />
      </RadioGroup>,
    );
    const root = group(container);

    expect(root).toHaveAttribute("data-motion", "full");
    expect(root).toHaveAttribute("role", "radiogroup");
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBe(root);
    expect(screen.getByRole("radio", { name: "Team" })).toBe(item(container, 0));
    // `keepMounted` keeps both dots so each item owns its own writer.
    expect(items(container)).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="radio-group-indicator"]')).toHaveLength(2);
    expect(item(container, 0)).toHaveAttribute("aria-checked", "true");
    expect(item(container, 1)).toHaveAttribute("aria-checked", "false");
  });

  it("selects through the pointer and reports the committed value", async () => {
    const change = vi.fn();
    const { container } = render(
      <RadioGroup aria-label="Plan" defaultValue="team" onValueChange={change}>
        <RadioGroupItem value="team" aria-label="Team" />
        <RadioGroupItem value="scale" aria-label="Scale" />
      </RadioGroup>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "Scale" }));
    expect(item(container, 0)).toHaveAttribute("aria-checked", "false");
    expect(item(container, 1)).toHaveAttribute("aria-checked", "true");
    expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith("scale", expect.anything());
  });

  it("moves selection and roving focus from the keyboard", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="team" aria-label="Team" />
        <RadioGroupItem value="scale" aria-label="Scale" />
        <RadioGroupItem value="growth" aria-label="Growth" />
      </RadioGroup>,
    );

    item(container, 0).focus();
    expect(item(container, 0)).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item(container, 1)).toHaveFocus();
    expect(item(container, 1)).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowDown}");
    expect(item(container, 2)).toHaveFocus();
    expect(item(container, 2)).toHaveAttribute("aria-checked", "true");
    // Home/End are disabled by the group; repeated arrows retarget one exchange.
    expect(items(container).filter((node) => node.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });

  it("keeps one tab stop for the group", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RadioGroup aria-label="Plan" defaultValue="scale">
        <RadioGroupItem value="team" aria-label="Team" />
        <RadioGroupItem value="scale" aria-label="Scale" />
      </RadioGroup>,
    );

    await user.tab();
    const active = document.activeElement;
    expect(active).not.toBe(document.body);
    expect(group(container).contains(active)).toBe(true);
    await user.keyboard("{ArrowUp}");
    expect(item(container, 0)).toHaveAttribute("aria-checked", "true");
  });

  it("skips a disabled option and stops read-only groups from changing", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(
      <>
        <RadioGroup aria-label="Available" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" disabled />
          <RadioGroupItem value="growth" aria-label="Growth" />
        </RadioGroup>
        <RadioGroup aria-label="Locked" defaultValue="team" readOnly onValueChange={change}>
          <RadioGroupItem value="team" aria-label="Locked team" />
          <RadioGroupItem value="scale" aria-label="Locked scale" />
        </RadioGroup>
      </>,
    );

    item(container, 0).focus();
    await user.keyboard("{ArrowDown}");
    // The disabled option is skipped, keeping one selection and one focus target.
    expect(item(container, 2)).toHaveFocus();
    expect(item(container, 2)).toHaveAttribute("aria-checked", "true");
    expect(item(container, 1)).toHaveAttribute("aria-checked", "false");

    await user.click(screen.getByRole("radio", { name: "Locked scale" }));
    expect(item(container, 2)).toHaveAttribute("aria-checked", "true");
    expect(change).not.toHaveBeenCalled();
  });

  it("keeps the dot at full size under reduced motion", async () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <RadioGroup aria-label="Plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </CadenceProvider>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "Scale" }));
    expect(group(container)).toHaveAttribute("data-motion", "reduced");
    expect(item(container, 1)).toHaveAttribute("data-motion", "reduced");
    expect(indicator(container, 1)).toHaveAttribute("data-motion", "reduced");
    expect(indicator(container, 1).style.transform).not.toContain("0.96");
    await vi.waitFor(() => expect(indicator(container, 1).style.opacity).toBe("1"));
  });

  it("drops the transition entirely when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <RadioGroup aria-label="Plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" />
        </RadioGroup>
      </CadenceProvider>,
    );

    expect(group(container)).toHaveAttribute("data-motion", "none");
    expect(item(container, 0)).toHaveAttribute("data-motion", "none");
    expect(indicator(container, 0)).toHaveAttribute("data-motion", "none");
    expect(indicator(container, 0).style.transition).toBe("");
  });

  it("declares one colour owner over the item paint, never the indicator", () => {
    const { container } = render(
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="team" aria-label="Team" />
      </RadioGroup>,
    );

    expect(item(container, 0).getAttribute("data-cadence-color")?.split(", ")).toEqual([
      "background-color",
      "color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ]);
    expect(indicator(container, 0)).not.toHaveAttribute("data-cadence-color");
    // The dot reads currentColor, so that single transaction owns its paint.
    expect(content(container, 0).className).toContain("bg-current");
  });

  it("styles the invalid state from the attribute only", () => {
    const { container } = render(
      <RadioGroup aria-invalid="true" aria-label="Required plan">
        <RadioGroupItem value="team" aria-label="Team" aria-invalid="true" />
      </RadioGroup>,
    );

    expect(group(container)).toHaveAttribute("aria-invalid", "true");
    expect(item(container, 0)).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps independent selection in two groups with identical option values", async () => {
    const { container } = render(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="First plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="First team" />
          <RadioGroupItem value="scale" aria-label="First scale" />
        </RadioGroup>
        <RadioGroup aria-label="Second plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Second team" />
          <RadioGroupItem value="scale" aria-label="Second scale" />
        </RadioGroup>
      </CadenceProvider>,
    );
    const [first, second] = [...container.querySelectorAll<HTMLElement>('[data-slot="radio-group"]')];
    if (!first || !second) throw new Error("both radio groups must render");

    await userEvent.click(screen.getByRole("radio", { name: "First scale" }));
    expect(within(first).getByRole("radio", { name: "First scale" })).toHaveAttribute("aria-checked", "true");
    expect(within(first).getByRole("radio", { name: "First team" })).toHaveAttribute("aria-checked", "false");
    // Equal values in the other group are independent: it keeps its own selection.
    expect(within(second).getByRole("radio", { name: "Second team" })).toHaveAttribute("aria-checked", "true");
    expect(within(second).getByRole("radio", { name: "Second scale" })).toHaveAttribute("aria-checked", "false");
    const dots = [...container.querySelectorAll<HTMLElement>('[data-slot="radio-group-indicator"]')];
    expect(dots.map((dot) => dot.style.opacity)).toEqual(["0", "1", "1", "0"]);
  });

  it("shows no dot for an unmatched controlled value and restores the actual state on remount", () => {
    const view = render(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="Plan" value="missing">
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </CadenceProvider>,
    );
    const indicators = () =>
      items(view.container).map((node) => node.querySelector<HTMLElement>('[data-slot="radio-group-indicator"]'));

    // An accepted unmatched value selects nothing: no incoming dot is invented.
    expect(items(view.container).map((node) => node.getAttribute("aria-checked"))).toEqual(["false", "false"]);
    expect(indicators().map((dot) => dot?.style.opacity)).toEqual(["0", "0"]);

    view.rerender(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="Plan" value="">
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </CadenceProvider>,
    );
    expect(indicators().map((dot) => dot?.style.opacity)).toEqual(["0", "0"]);

    view.unmount();
    const remount = render(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="Plan" value="scale">
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </CadenceProvider>,
    );
    expect(items(remount.container).map((node) => node.getAttribute("aria-checked"))).toEqual(["false", "true"]);
    expect(
      [...remount.container.querySelectorAll<HTMLElement>('[data-slot="radio-group-indicator"]')].map(
        (dot) => dot.style.opacity,
      ),
    ).toEqual(["0", "1"]);
  });

  it("retargets one indicator through a rapid selection reversal", async () => {
    const user = userEvent.setup();
    const view = render(
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="team" aria-label="Team" />
        <RadioGroupItem value="scale" aria-label="Scale" />
      </RadioGroup>,
    );
    const first = indicator(view.container, 0);
    const second = indicator(view.container, 1);

    item(view.container, 0).focus();
    await user.keyboard("{ArrowDown}{ArrowUp}{ArrowDown}");
    expect(item(view.container, 1)).toHaveAttribute("aria-checked", "true");
    // Both indicators are the same physical hosts; no extra dots were mounted.
    expect(indicator(view.container, 0)).toBe(first);
    expect(indicator(view.container, 1)).toBe(second);
    expect(view.container.querySelectorAll('[data-slot="radio-group-indicator"]')).toHaveLength(2);
  });

  it("removes the selected option without restoring a stale dot", () => {
    const draw = (values: string[]) => (
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="Plan" value="scale">
          {values.map((value) => (
            <RadioGroupItem key={value} value={value} aria-label={value} />
          ))}
        </RadioGroup>
      </CadenceProvider>
    );
    const view = render(draw(["team", "scale"]));
    expect(item(view.container, 1)).toHaveAttribute("aria-checked", "true");

    view.rerender(draw(["team"]));
    expect(items(view.container)).toHaveLength(1);
    // The absent accepted value produces no offscreen origin or synthetic dot.
    expect(indicator(view.container, 0).style.opacity).toBe("0");

    // Reinserting the option renders its actual current selection, not a replay.
    view.rerender(draw(["team", "scale"]));
    expect(item(view.container, 1)).toHaveAttribute("aria-checked", "true");
    expect(indicator(view.container, 1).style.opacity).toBe("1");
  });

  it("keeps a selected dot when the selected option is disabled", () => {
    const view = render(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="Plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" />
        </RadioGroup>
      </CadenceProvider>,
    );
    expect(indicator(view.container, 0).style.opacity).toBe("1");

    view.rerender(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup aria-label="Plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" disabled />
        </RadioGroup>
      </CadenceProvider>,
    );
    expect(item(view.container, 0)).toHaveAttribute("aria-checked", "true");
    expect(item(view.container, 0)).toHaveAttribute("data-disabled");
    expect(indicator(view.container, 0).style.opacity).toBe("1");
  });

  it("does not select a rejected controlled change", async () => {
    const change = vi.fn();
    const view = render(
      <CadenceProvider mode="full" timeScale={0}>
        <RadioGroup
          aria-label="Plan"
          value="team"
          onValueChange={(next, details) => {
            change(next);
            details.cancel();
          }}
        >
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </CadenceProvider>,
    );

    await userEvent.click(screen.getByRole("radio", { name: "Scale" }));
    expect(change).toHaveBeenCalledTimes(1);
    // The rejected request changes no presentation target and invents no callback.
    expect(item(view.container, 0)).toHaveAttribute("aria-checked", "true");
    expect(item(view.container, 1)).toHaveAttribute("aria-checked", "false");
  });

  it("keeps the native form entry and lets Base UI own the reset path", async () => {
    const change = vi.fn();
    const view = render(
      <form>
        <RadioGroup name="plan" defaultValue="team" aria-label="Plan" required onValueChange={change}>
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </form>,
    );
    const form = view.container.querySelector("form") as HTMLFormElement;
    const inputs = [...view.container.querySelectorAll<HTMLInputElement>("input")];

    expect(inputs.map((input) => [input.type, input.name, input.value])).toEqual([
      ["radio", "plan", "team"],
      ["radio", "plan", "scale"],
    ]);
    expect(inputs.every((input) => input.required)).toBe(true);

    await userEvent.click(screen.getByRole("radio", { name: "Scale" }));
    expect(item(view.container, 1)).toHaveAttribute("aria-checked", "true");
    expect(change).toHaveBeenCalledTimes(1);

    await act(async () => {
      form.reset();
    });
    // This is Base UI's own path: Cadence adds no reset writer, callback or replay.
    expect(change).toHaveBeenCalledTimes(1);
    expect(items(view.container).filter((node) => node.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });

  it("keeps focus and the committed selection through a live mode downgrade", async () => {
    const draw = (mode: "full" | "reduced" | "none") => (
      <CadenceProvider mode={mode} timeScale={0}>
        <RadioGroup aria-label="Plan" defaultValue="scale">
          <RadioGroupItem value="team" aria-label="Team" />
          <RadioGroupItem value="scale" aria-label="Scale" />
        </RadioGroup>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const scale = screen.getByRole("radio", { name: "Scale" });
    scale.focus();

    for (const mode of ["reduced", "none", "full"] as const) {
      view.rerender(draw(mode));
      expect(screen.getByRole("radio", { name: "Scale" })).toBe(scale);
      expect(scale).toHaveFocus();
      expect(indicator(view.container, 1)).toHaveAttribute("data-motion", mode);
      if (mode === "none") expect(indicator(view.container, 1).style.transition).toBe("");
      expectMotionContract(mode);
    }
  });

  it("keeps the verified item colour clock and settles focus, invalid paint and a caller palette", async () => {
    const view = render(
      <CadenceProvider timeScale={1}>
        <RadioGroup aria-label="Plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" />
        </RadioGroup>
      </CadenceProvider>,
    );
    const root = item(view.container, 0);

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
        <RadioGroup aria-label="Plan" aria-invalid="true" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" aria-invalid="true" />
        </RadioGroup>
      </CadenceProvider>,
    );
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0));

    // A caller palette we cannot prove also settles at its target.
    view.rerender(
      <CadenceProvider timeScale={1}>
        <RadioGroup aria-label="Plan" defaultValue="team">
          <RadioGroupItem value="team" aria-label="Team" style={{ backgroundColor: "#333" }} />
        </RadioGroup>
      </CadenceProvider>,
    );
    await vi.waitFor(() => expect(parseFloat(root.style.transitionDuration)).toBe(0));
    expect(root.style.backgroundColor).toBe("rgb(51, 51, 51)");
  });

  it("cleans up on unmount without delaying removal", () => {
    const view = render(
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="team" aria-label="Team" />
      </RadioGroup>,
    );
    view.unmount();
    expect(document.querySelector('[data-slot="radio-group"]')).toBeNull();
    expect(document.querySelector('[data-slot="radio-group-indicator"]')).toBeNull();
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <RadioGroup aria-label="Plan" defaultValue="team">
        <RadioGroupItem value="team" aria-label="Team" />
      </RadioGroup>
    </CadenceProvider>,
  );
  expectMotionContract(mode, { policy: ["color"] });
});

describe("RadioGroup v2", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    // A zero clock keeps the three-mode matrix about ownership and mode policy;
    // positive clocks are proven by the verified-chrome and reduced-dot cases.
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
        <RadioGroup aria-label="Cost centre" hidden={!present} value={checked ? "team" : "other"}>
          <RadioGroupItem value="team" aria-label="Team" style={paint ? { backgroundColor: paint } : undefined} />
        </RadioGroup>
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const root = group(view.container);

    // One independent opacity entrance on the group root, never a per-item replay.
    await expectV2MotionAction("radio-group", "radio-group.root.enter", mode, () => view.rerender(draw()));
    expect(root).not.toHaveAttribute("hidden");

    // The accepted selection revision retargets the same indicator host.
    await expectV2MotionAction("radio-group", "radio-group.indicator.select", mode, () =>
      view.rerender(draw({ checked: true })),
    );
    expect(item(view.container, 0)).toHaveAttribute("aria-checked", "true");
    expect(indicator(view.container, 0)).toHaveAttribute("data-slot", "radio-group-indicator");

    // The item owns one surface-foreground family over its declared paint.
    await expectV2MotionAction("radio-group", "radio-group.item.colour", mode, () =>
      view.rerender(draw({ checked: true, paint: "#333" })),
    );
    expect(item(view.container, 0).style.backgroundColor).toBe("rgb(51, 51, 51)");

    expectMotionContract(mode, {
      policy: ["color"],
      parts: [root, indicator(view.container, 0)],
    });
    await expectV2NativeBoundaries("radio-group", { container: view.container });
  });

  it("keeps native ids, exports, props and data-slots", () => {
    const { container } = render(
      <form>
        <RadioGroup name="plan" aria-label="Plan" required defaultValue="team">
          <RadioGroupItem id="plan-team" value="team" aria-label="Team" />
        </RadioGroup>
      </form>,
    );
    const input = container.querySelector("input") as HTMLInputElement;

    expect(group(container).tagName).toBe("DIV");
    expect(group(container)).toHaveAttribute("role", "radiogroup");
    expect(item(container, 0).tagName).toBe("SPAN");
    expect(item(container, 0)).toHaveAttribute("role", "radio");
    expect(input.type).toBe("radio");
    expect(input.id).toBe("plan-team");
    expect(input.name).toBe("plan");
    expect(input.required).toBe(true);
    expect(indicator(container, 0)).toHaveAttribute("data-motion", "full");
  });
});
