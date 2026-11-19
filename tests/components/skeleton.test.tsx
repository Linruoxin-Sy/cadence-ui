import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

/** jsdom has no layout and no observers. Give the placeholder a real, mutable
 * box so measuring can commit, and make the pulse see an on-screen host. */
let shape = { width: 96, height: 20 };

function installLayout() {
  // jsdom has no Web Animations: the measured box owns one native effect.
  const animate = vi.fn(() => ({
    effect: { setKeyframes: () => {}, getKeyframes: () => [] },
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
  }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = Number(this.dataset.shapeWidth ?? shape.width);
    const height = Number(this.dataset.shapeHeight ?? shape.height);
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON() {},
    } as DOMRect;
  });
  for (const property of ["offsetWidth", "offsetHeight", "clientWidth", "clientHeight"] as const)
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get(this: HTMLElement) {
        const box = property.toLowerCase().includes("height")
          ? Number(this.dataset.shapeHeight ?? shape.height)
          : Number(this.dataset.shapeWidth ?? shape.width);
        return box;
      },
    });
  Object.defineProperty(Element.prototype, "checkVisibility", {
    configurable: true,
    value: () => true,
  });
  Object.defineProperty(Element.prototype, "computedStyleMap", {
    configurable: true,
    value: () => new Map([["height", { toString: () => "auto" }]]),
  });
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
    const host = element as HTMLElement;
    const style = host.style;
    const css = original(element);
    const read = (name: string, fallback = "") =>
      style.getPropertyValue(name) || css.getPropertyValue(name) || fallback;
    return {
      rotate: "none",
      scale: "none",
      perspective: "none",
      transform: "none",
      aspectRatio: "auto",
      display: "flex",
      width: style.width || `${Number(host.dataset.shapeWidth ?? shape.width)}px`,
      height: style.height || `${Number(host.dataset.shapeHeight ?? shape.height)}px`,
      opacity: read("opacity") || "1",
      animation: style.animation,
      animationName: style.animation ? "cadence-pulse" : "none",
      animationDuration: read("animation-duration") || "0s",
      transitionProperty: read("transition-property"),
      transitionDuration: read("transition-duration") || "0s",
      transitionDelay: read("transition-delay") || "0s",
      getPropertyValue: (name: string) => read(name),
    } as unknown as CSSStyleDeclaration;
  });
  Object.defineProperty(Element.prototype, "getClientRects", {
    configurable: true,
    value: function (this: HTMLElement) {
      return [this.getBoundingClientRect()] as unknown as DOMRectList;
    },
  });
  class FakeObserver {
    constructor(private callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ target, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  shape = { width: 96, height: 20 };
});

const slot = () => screen.getByTestId("placeholder");

describe("Skeleton", () => {
  beforeEach(() => {
    installLayout();
  });

  beforeAll(async () => {
    await prepareV2MotionPlan();
  });

  it("renders a decorative placeholder with its slot", () => {
    render(<Skeleton data-testid="placeholder" />);
    const skeleton = slot();
    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
    expect(skeleton).toHaveAttribute("data-motion", "full");
    expect(skeleton).toHaveAttribute("data-state", "busy");
    expect(skeleton.className).toContain("rounded-md");
  });

  it("leaves the loading state to its region", () => {
    render(
      <div aria-busy="true" data-testid="region">
        <Skeleton />
      </div>,
    );
    expect(screen.getByTestId("region")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each(modes)("keeps one mode on the placeholder in %s", (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Skeleton data-testid="placeholder" />
      </CadenceProvider>,
    );
    const skeleton = slot();
    expect(skeleton).toHaveAttribute("data-motion", mode);
    // The loop is CSS-owned: no `animate-*` class decides the mode any more.
    expect(skeleton.className).not.toContain("animate-pulse");
    expect(skeleton.className).not.toContain("animate-none");
    if (mode === "none") expect(skeleton.style.animation).toBe("none");
  });

  it("stops the pulse without unmounting the shape when the region settles", () => {
    const view = render(<Skeleton data-testid="placeholder" busy />);
    expect(slot().style.animation).toContain("--animate-pulse");
    view.rerender(<Skeleton data-testid="placeholder" busy={false} />);
    expect(slot()).toHaveAttribute("data-state", "idle");
    expect(slot().style.animation).toBe("");
  });

  it("reports every owned action in each mode", async () => {
    for (const mode of modes) {
      let frame = { busy: true, width: 96, shape: "a", paint: "" };
      const draw = () => (
        <CadenceProvider mode={mode} timeScale={0}>
          <Skeleton
            data-testid="placeholder"
            busy={frame.busy}
            className={frame.shape === "a" ? "h-5" : "h-11"}
            data-shape-width={frame.width}
            data-shape-height={frame.shape === "a" ? 20 : 44}
            style={frame.paint ? { backgroundColor: frame.paint } : undefined}
          />
        </CadenceProvider>
      );
      const view = render(draw());
      const update = (next: Partial<typeof frame>) => {
        frame = { ...frame, ...next };
        view.rerender(draw());
      };
      const owned = (binding: string, exercise: () => void | Promise<void>) =>
        expectV2MotionAction("skeleton", `skeleton.root.${binding}`, mode, exercise).catch((error) => {
          throw new Error(`${binding}: ${(error as Error).message}\n${(error as Error).stack ?? ""}`);
        });

      await owned("busy", () => update({ busy: false }));
      await owned("resize", () => update({ shape: "b", width: 128 }));
      await owned("colour", () => update({ paint: "rgb(32, 32, 32)" }));

      // The pulse is the mode-owned loop: resume it so the shared contract reads
      // a live owner in every mode rather than the stopped one from `busy`.
      update({ busy: true });
      expectMotionContract(mode, { policy: ["loop", "color"] });
      await expectV2NativeBoundaries("skeleton", { container: view.container });
      view.unmount();
    }
  });
});
