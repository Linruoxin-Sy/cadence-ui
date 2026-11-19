import { render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Spinner } from "@/registry/cadence/spinner";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

/** jsdom has no layout, no Web Animations and no visibility API. Give the icon a
 * real, mutable box so the measured icon-size revision can commit and the loop
 * can see an on-screen host. */
let box = 16;

function installLayout() {
  Element.prototype.animate = vi.fn(() => ({
    effect: {
      setKeyframes: () => {},
      getKeyframes: () => [],
      getTiming: () => ({ duration: 0, delay: 0 }),
      getComputedTiming: () => ({ duration: 0, delay: 0 }),
    },
    cancel: () => {},
    play: () => {},
    pause: () => {},
    finish: () => {},
    playState: "finished",
    currentTime: 0,
    startTime: 0,
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof Element.prototype.animate;
  const side = (element: Element) => {
    const declared = Number((element as HTMLElement).dataset?.box ?? box);
    return Number.isFinite(declared) && declared > 0 ? declared : box;
  };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
    const size = side(this);
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: size,
      bottom: size,
      width: size,
      height: size,
      toJSON() {},
    } as DOMRect;
  });
  Object.defineProperty(Element.prototype, "checkVisibility", { configurable: true, value: () => true });
  Object.defineProperty(Element.prototype, "getClientRects", {
    configurable: true,
    value: function (this: Element) {
      return [this.getBoundingClientRect()] as unknown as DOMRectList;
    },
  });
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
    const host = element as HTMLElement;
    const style = host.style;
    const css = original(element);
    const read = (name: string, fallback = "") =>
      style?.getPropertyValue?.(name) || css.getPropertyValue(name) || fallback;
    const size = side(element);
    return {
      width: style?.width || `${size}px`,
      height: style?.height || `${size}px`,
      opacity: read("opacity") || "1",
      color: read("color"),
      transform: read("transform") || "none",
      animation: style?.animation ?? "",
      animationName: style?.animation ? "cadence-spin" : "none",
      animationDuration: read("animation-duration") || "0s",
      transitionProperty: read("transition-property"),
      transitionDuration: read("transition-duration") || "0s",
      transitionDelay: read("transition-delay") || "0s",
      display: "inline",
      visibility: "visible",
      getPropertyValue: (name: string) => read(name),
    } as unknown as CSSStyleDeclaration;
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  box = 16;
});

const slot = () => screen.getByTestId("spinner");
const classes = (element: Element) => element.getAttribute("class") ?? "";

beforeEach(() => {
  installLayout();
});

describe("Spinner", () => {
  it("keeps the upstream icon surface and its status name", () => {
    render(<Spinner data-testid="spinner" width={20} height={20} data-extra="kept" />);
    const spinner = slot();
    expect(spinner.tagName.toLowerCase()).toBe("svg");
    expect(spinner).toHaveAttribute("data-slot", "spinner");
    expect(spinner).toHaveAttribute("data-motion", "full");
    expect(spinner).toHaveAttribute("role", "status");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
    expect(spinner).toHaveAttribute("width", "20");
    expect(spinner).toHaveAttribute("data-extra", "kept");
    expect(classes(spinner)).toContain("size-4");
    expect(screen.getByRole("status")).toBe(spinner);
  });

  it("lets the caller own the label, the size class and the ref", () => {
    let captured: SVGSVGElement | null = null;
    const cleanup = vi.fn();
    const ref = (element: SVGSVGElement | null) => {
      captured = element;
      return cleanup;
    };
    const view = render(<Spinner ref={ref} data-testid="spinner" aria-label="Saving invoice" className="size-6" />);
    const spinner = slot();
    expect(spinner).toHaveAttribute("aria-label", "Saving invoice");
    expect(classes(spinner)).toContain("size-6");
    expect(classes(spinner)).not.toContain("size-4");
    expect(captured).toBe(spinner);
    view.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it.each(modes)("keeps one mode on the glyph in %s", (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Spinner data-testid="spinner" />
      </CadenceProvider>,
    );
    const spinner = slot();
    expect(spinner).toHaveAttribute("data-motion", mode);
    // The loop is a theme-clock policy, not an `animate-*` utility class.
    expect(classes(spinner)).not.toContain("animate-spin");
    expect(classes(spinner)).not.toContain("animate-none");
    expect(spinner.style.animation).toBe(mode === "full" ? "var(--animate-spin)" : "none");
  });

  it("stops rotation before a retained removal and restores the status name", () => {
    const draw = (present: boolean) => (
      <PresenceContext.Provider
        value={{
          id: "spinner",
          initial: false,
          isPresent: present,
          register: () => () => {},
          onExitComplete: () => {},
        }}
      >
        <Spinner data-testid="spinner" />
      </PresenceContext.Provider>
    );
    const view = render(draw(true));
    expect(slot().style.animation).toBe("var(--animate-spin)");
    view.rerender(draw(false));
    const spinner = slot();
    expect(spinner.style.animation).toBe("");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    view.rerender(draw(true));
    expect(slot()).not.toHaveAttribute("aria-hidden");
    expect(slot().style.animation).toBe("var(--animate-spin)");
  });

  it("keeps the visible glyph still and named under reduced and none", () => {
    for (const mode of ["reduced", "none"] as const) {
      const view = render(
        <CadenceProvider mode={mode}>
          <Spinner data-testid="spinner" />
        </CadenceProvider>,
      );
      const spinner = slot();
      expect(spinner.style.animation).toBe("none");
      expect(spinner).toHaveAccessibleName("Loading");
      view.unmount();
    }
  });
});

describe("Spinner v2", () => {
  beforeAll(async () => {
    await prepareV2MotionPlan();
  });

  it.each(modes)("executes every owned action in %s", async (mode) => {
    let frame = { present: true, large: false, paint: false };
    const draw = (state: typeof frame) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "spinner",
            initial: false,
            isPresent: state.present,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Spinner
            data-testid="spinner"
            className={state.large ? "size-6" : "size-4"}
            data-box={state.large ? 24 : 16}
            style={state.paint ? { color: "rgb(32, 32, 32)" } : undefined}
          />
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(frame));
    const update = (next: Partial<typeof frame>) => {
      frame = { ...frame, ...next };
      view.rerender(draw(frame));
    };
    const host = slot();
    const owned = (binding: string, exercise: () => void) =>
      expectV2MotionAction("spinner", `spinner.${binding}`, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}\n${(error as Error).stack ?? ""}`);
      });

    await owned("root.exit", () => update({ present: false }));
    await owned("root.enter", () => update({ present: true }));
    await owned("root.resize", () => update({ large: true }));
    await owned("glyph.colour", () => update({ paint: true }));
    // The busy state is the rotation itself: removal stops it on the same host.
    await owned("glyph.busy", () => update({ present: false }));

    expect(slot()).toBe(host);
    expect(host).toHaveAttribute("aria-label", "Loading");
    expectMotionContract(mode, { policy: ["color"], ownerLocal: [host] });
    view.rerender(draw({ ...frame, present: true }));
    await expectV2NativeBoundaries("spinner", { container: view.container });
    view.unmount();
  });
});
