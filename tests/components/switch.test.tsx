import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Switch } from "@/registry/cadence/switch";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function root(container: HTMLElement) {
  const element = container.querySelector('[data-slot="switch"]');
  if (!element) throw new Error("switch not rendered");
  return element as HTMLElement;
}

function thumb(container: HTMLElement) {
  const element = container.querySelector('[data-slot="switch-thumb"]');
  if (!element) throw new Error("switch thumb not rendered");
  return element as HTMLElement;
}

const measured: (() => void)[] = [];
/**
 * jsdom has no layout engine, so `clientWidth`/`offsetWidth` are always 0. A
 * 32×16 track/thumb is the measured box the browser would report; the stub is
 * scoped to this file and removed afterwards.
 */
beforeAll(() => {
  const prototype = HTMLElement.prototype as unknown as Record<string, PropertyDescriptor | undefined>;
  for (const [name, value] of [
    ["clientWidth", 32],
    ["offsetWidth", 16],
  ] as const) {
    const original = Object.getOwnPropertyDescriptor(prototype, name);
    Object.defineProperty(prototype, name, { configurable: true, get: () => value });
    measured.push(() => {
      if (original) Object.defineProperty(prototype, name, original);
      else delete prototype[name];
    });
  }
});
afterAll(() => {
  for (const restore of measured.splice(0)) restore();
});

describe("Switch", () => {
  it("renders the upstream surface with its size attribute", () => {
    const { container } = render(<Switch aria-label="Public" defaultChecked />);

    expect(root(container)).toHaveAttribute("data-size", "default");
    expect(root(container)).toHaveAttribute("data-motion", "full");
    expect(thumb(container)).toBeInTheDocument();
    expect(thumb(container)).toHaveAttribute("data-slot", "switch-thumb");
    expect(screen.getByRole("switch", { name: "Public" })).toHaveAttribute("aria-checked", "true");
  });

  it("toggles on click and exposes the size variant", async () => {
    const { container } = render(<Switch aria-label="Alerts" size="sm" />);
    const element = root(container);

    expect(element).toHaveAttribute("data-size", "sm");
    await userEvent.click(element);
    expect(element).toHaveAttribute("aria-checked", "true");
    await userEvent.click(element);
    expect(element).toHaveAttribute("aria-checked", "false");
  });

  it("toggles from the keyboard and stops a read-only control", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(
      <>
        <Switch aria-label="Keyboard" onCheckedChange={change} />
        <Switch aria-label="Locked" readOnly />
      </>,
    );
    const keyboard = screen.getByRole("switch", { name: "Keyboard" });
    keyboard.focus();
    await user.keyboard("{ }");
    expect(keyboard).toHaveAttribute("aria-checked", "true");
    expect(change).toHaveBeenCalledTimes(1);

    const locked = screen.getByRole("switch", { name: "Locked" });
    locked.focus();
    await user.keyboard("{ }");
    expect(locked).toHaveAttribute("aria-checked", "false");
    expect(root(container).ownerDocument.activeElement).toBe(locked);
  });

  it("keeps a disabled control out of the tab order and unchanged", async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch aria-label="Unavailable" disabled />);

    await user.tab();
    expect(document.activeElement).toBe(document.body);
    await user.click(root(container));
    expect(root(container)).toHaveAttribute("aria-checked", "false");
    expect(root(container)).toHaveAttribute("data-disabled");
  });

  it("keeps a controlled switch on the caller's accepted value", async () => {
    const change = vi.fn();
    const { container } = render(<Switch aria-label="Owned" checked={false} onCheckedChange={change} />);

    await userEvent.click(root(container));
    // The caller did not accept the request: Base UI keeps the controlled value.
    expect(change).toHaveBeenCalledTimes(1);
    expect(root(container)).toHaveAttribute("aria-checked", "false");
  });

  it("keeps the native form entry and lets Base UI own the reset path", async () => {
    const change = vi.fn();
    const view = render(
      <form>
        <Switch name="alerts" aria-label="Alerts" onCheckedChange={change} />
        <Switch name="silent" aria-label="Silent" value="on" required />
      </form>,
    );
    const form = view.container.querySelector("form") as HTMLFormElement;
    const inputs = [...view.container.querySelectorAll<HTMLInputElement>("input")];

    expect(inputs.map((input) => [input.type, input.name, input.checked])).toEqual([
      ["checkbox", "alerts", false],
      ["checkbox", "silent", false],
    ]);
    expect(inputs[1]?.required).toBe(true);

    await userEvent.click(root(view.container));
    expect(root(view.container)).toHaveAttribute("aria-checked", "true");
    expect(change).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(thumb(view.container).style.transform).toContain("translateX(16px)"));

    await act(async () => {
      form.reset();
    });
    // This is Base UI's own path: Cadence adds no callback, revision or replay.
    // The accepted restoration keeps the visible thumb and the primitive's
    // accepted state in agreement, painted rather than replayed.
    expect(change).toHaveBeenCalledTimes(1);
    expect(root(view.container)).toHaveAttribute("aria-checked", String(inputs[0]?.checked));
    expect(thumb(view.container).style.transform.includes("translateX(16px)")).toBe(
      root(view.container).getAttribute("aria-checked") === "true",
    );
  });

  it("measures each size's own endpoint without an initial sweep", async () => {
    const view = render(
      <CadenceProvider mode="full" timeScale={0}>
        <Switch aria-label="Default on" defaultChecked />
        <Switch aria-label="Small on" size="sm" defaultChecked />
      </CadenceProvider>,
    );
    const [first, second] = [...view.container.querySelectorAll<HTMLElement>('[data-slot="switch"]')];
    if (!first || !second) throw new Error("both switches must render");

    // The first measured endpoint is painted from the committed boxes; jsdom
    // has no layout engine, so the file-level stub supplies a 32×16 track/thumb.
    await vi.waitFor(() => expect(thumb(first).style.transform).toContain("translateX(16px)"));
    await vi.waitFor(() => expect(thumb(second).style.transform).toContain("translateX(16px)"));
    expect(thumb(first).style.transition).toBe("");
  });

  it("retargets one thumb through a rapid toggle reversal", async () => {
    const user = userEvent.setup();
    const view = render(
      <CadenceProvider mode="full">
        <Switch aria-label="Rapid" />
      </CadenceProvider>,
    );
    const host = thumb(view.container);

    await user.click(root(view.container));
    await user.click(root(view.container));
    await user.click(root(view.container));
    expect(root(view.container)).toHaveAttribute("aria-checked", "true");
    // One physical thumb owner: no queued travel hosts were mounted.
    expect(thumb(view.container)).toBe(host);
    expect(view.container.querySelectorAll('[data-slot="switch-thumb"]')).toHaveLength(1);
  });

  it("keeps the checked endpoint when reduced motion settles it immediately", async () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Switch aria-label="Public" />
      </CadenceProvider>,
    );

    await userEvent.click(root(container));
    expect(root(container)).toHaveAttribute("data-motion", "reduced");
    expect(thumb(container)).toHaveAttribute("data-motion", "reduced");
    await vi.waitFor(() => expect(thumb(container).style.transform).toContain("translateX(16px)"));
  });

  it("drops the transition entirely when motion is none", async () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Switch aria-label="Public" />
      </CadenceProvider>,
    );

    await userEvent.click(root(container));
    expect(root(container)).toHaveAttribute("data-motion", "none");
    expect(thumb(container)).toHaveAttribute("data-motion", "none");
    expect(thumb(container).style.transition).toBe("");
    expect(thumb(container).style.transform).toContain("translateX(16px)");
  });

  it("declares one colour owner over the track and one over the thumb", () => {
    const { container } = render(<Switch aria-label="Public" />);

    expect(root(container).getAttribute("data-cadence-color")?.split(", ")).toEqual([
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ]);
    expect(thumb(container).getAttribute("data-cadence-color")).toBe("background-color");
  });

  it("keeps the verified track and thumb colour clocks and settles focus and caller palettes", async () => {
    const view = render(
      <CadenceProvider timeScale={1}>
        <Switch aria-label="Chrome" />
      </CadenceProvider>,
    );
    const host = root(view.container);
    const fill = thumb(view.container);

    // The shipped chrome owns one explicit paint clock on each owner.
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0.16));
    expect(host.style.transitionProperty).not.toContain("all");
    expect(host.style.transitionProperty).toContain("background-color");
    expect(host.style.transitionDelay).toBe("0s");
    await vi.waitFor(() => expect(Number.parseFloat(fill.style.transitionDuration)).toBe(0.16));
    expect(fill.style.transitionProperty).toBe("background-color");

    // Real DOM focus settles the track's whole declared paint at once.
    host.focus();
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0));
    host.blur();
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0.16));

    // A caller palette we cannot prove settles at its target.
    view.rerender(
      <CadenceProvider timeScale={1}>
        <Switch aria-label="Chrome" style={{ backgroundColor: "#333" }} />
      </CadenceProvider>,
    );
    await vi.waitFor(() => expect(Number.parseFloat(host.style.transitionDuration)).toBe(0));
    expect(host.style.backgroundColor).toBe("rgb(51, 51, 51)");
  });

  it("keeps focus and the committed state through a live mode downgrade", async () => {
    const draw = (mode: "full" | "reduced" | "none") => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Switch aria-label="Downgrade" defaultChecked />
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const host = root(view.container);
    const fill = thumb(view.container);

    for (const mode of ["reduced", "none", "full"] as const) {
      view.rerender(draw(mode));
      expect(root(view.container)).toBe(host);
      expect(thumb(view.container)).toBe(fill);
      expect(host).toHaveAttribute("data-motion", mode);
      expect(fill).toHaveAttribute("data-motion", mode);
      if (mode === "none") expect(fill.style.transition).toBe("");
      expectMotionContract(mode);
    }
  });

  it("cleans up on unmount without delaying removal", () => {
    const view = render(<Switch aria-label="Public" />);
    view.unmount();
    expect(document.querySelector('[data-slot="switch"]')).toBeNull();
    expect(document.querySelector('[data-slot="switch-thumb"]')).toBeNull();
    expect(document.querySelector("[data-cadence-geometry-probe]")).toBeNull();
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <Switch aria-label="Enabled" />
    </CadenceProvider>,
  );
  expectMotionContract(mode, { policy: ["color"] });
});

describe("Switch v2", () => {
  beforeAll(() => {
    // jsdom ships no compiled Tailwind: give the thumb's state paint a real
    // computed value so its committed colour revision is observable.
    const style = document.createElement("style");
    style.textContent =
      '[data-slot="switch-thumb"][data-checked]{background-color:rgb(10,20,30)}' +
      '[data-slot="switch-thumb"][data-unchecked]{background-color:rgb(1,2,3)}';
    document.head.append(style);
    prepareV2MotionPlan();
  });

  it.each(["full", "reduced", "none"] as const)("executes each owned action in %s", async (mode) => {
    // A zero clock keeps the three-mode matrix about ownership and mode policy;
    // the verified-chrome case proves the positive colour clock separately.
    const draw = ({
      present = true,
      checked = false,
      size = "default" as "sm" | "default",
      paint,
    }: {
      present?: boolean;
      checked?: boolean;
      size?: "sm" | "default";
      paint?: string;
    } = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Switch
          aria-label="Alerts"
          hidden={!present}
          checked={checked}
          size={size}
          style={paint ? { backgroundColor: paint } : undefined}
        />
      </CadenceProvider>
    );
    const view = render(draw({ present: false }));
    const host = root(view.container);

    // One independent opacity entrance on the control root, never a thumb sweep.
    await expectV2MotionAction("switch", "switch.root.enter", mode, () => view.rerender(draw()));
    expect(root(view.container)).toBe(host);
    expect(host).not.toHaveAttribute("hidden");

    // The accepted checked revision retargets the same thumb host.
    await expectV2MotionAction("switch", "switch.thumb.select", mode, () => view.rerender(draw({ checked: true })));
    expect(host).toHaveAttribute("aria-checked", "true");
    expect(thumb(view.container).style.transform).toContain("translateX(16px)");

    // The track owns one surface family over its declared paint.
    await expectV2MotionAction("switch", "switch.root.colour", mode, () =>
      view.rerender(draw({ checked: true, paint: "#333" })),
    );
    expect(host.style.backgroundColor).toBe("rgb(51, 51, 51)");

    // The thumb owns its own fill on its own physical host.
    await expectV2MotionAction("switch", "switch.thumb.colour", mode, () =>
      view.rerender(draw({ checked: false, paint: "#333" })),
    );

    // An explicit size revision commits the measured track box and endpoint.
    await expectV2MotionAction("switch", "switch.root.resize", mode, () =>
      view.rerender(draw({ paint: "#333", size: "sm" })),
    );
    expect(root(view.container)).toHaveAttribute("data-size", "sm");

    expectMotionContract(mode, {
      policy: ["color"],
      parts: [root(view.container), thumb(view.container)],
    });
    await expectV2NativeBoundaries("switch", { container: view.container });
  });

  it("keeps native ids, exports, props and data-slots", () => {
    const { container } = render(
      <form>
        <Switch name="alerts" aria-label="Alerts" required defaultChecked />
      </form>,
    );
    const input = container.querySelector("input") as HTMLInputElement;

    expect(root(container).tagName).toBe("SPAN");
    expect(root(container)).toHaveAttribute("role", "switch");
    expect(root(container)).toHaveAttribute("data-slot", "switch");
    expect(thumb(container)).toHaveAttribute("data-slot", "switch-thumb");
    expect(input.type).toBe("checkbox");
    expect(input.name).toBe("alerts");
    expect(input.required).toBe(true);
    expect(thumb(container)).toHaveAttribute("data-motion", "full");
  });
});
