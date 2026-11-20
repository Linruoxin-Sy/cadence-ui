import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "@/registry/cadence/progress";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

const parts = (container: HTMLElement) => ({
  root: container.querySelector('[data-slot="progress"]') as HTMLElement,
  track: container.querySelector('[data-slot="progress-track"]') as HTMLElement,
  fill: container.querySelector('[data-slot="progress-indicator"]') as HTMLElement,
  label: container.querySelector('[data-slot="progress-label"]') as HTMLElement,
  value: container.querySelector('[data-slot="progress-value"]') as HTMLElement,
});

/**
 * jsdom has no layout, no Web Animations and no observers. Give every host a real
 * mutable box so a measured height can commit, a pulse can see an on-screen host,
 * and a scoped palette can be read back from the document stylesheet.
 */
function installLayout() {
  const animate = vi.fn((keyframes: Keyframe[] | PropertyIndexedKeyframes | null) => ({
    effect: { setKeyframes: () => {}, getKeyframes: () => (Array.isArray(keyframes) ? keyframes : []) },
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
    onfinish: null,
  }));
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  const box = (element: HTMLElement) => ({
    width: Number(element.dataset.shapeWidth ?? 320),
    height: Number(element.dataset.shapeHeight ?? 8),
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const { width, height } = box(this);
    return { x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height, toJSON() {} } as DOMRect;
  });
  for (const property of ["offsetWidth", "offsetHeight", "clientWidth", "clientHeight"] as const)
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get(this: HTMLElement) {
        const { width, height } = box(this);
        return property.toLowerCase().includes("height") ? height : width;
      },
    });
  Object.defineProperty(Element.prototype, "checkVisibility", {
    configurable: true,
    value: function (this: Element) {
      return !this.closest("[hidden]");
    },
  });
  Object.defineProperty(Element.prototype, "computedStyleMap", {
    configurable: true,
    value: () => new Map([["height", { toString: () => "auto" }]]),
  });
  Object.defineProperty(Element.prototype, "getClientRects", {
    configurable: true,
    value: function (this: HTMLElement) {
      return [this.getBoundingClientRect()] as unknown as DOMRectList;
    },
  });
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
    const host = element as HTMLElement;
    const css = original(element);
    const read = (name: string, fallback = "") =>
      host.style.getPropertyValue(name) || css.getPropertyValue(name) || fallback;
    return {
      rotate: "none",
      scale: "none",
      perspective: "none",
      transform: "none",
      aspectRatio: "auto",
      display: "flex",
      visibility: "visible",
      width: `${box(host).width}px`,
      height: `${box(host).height}px`,
      opacity: read("opacity") || "1",
      overflowY: css.getPropertyValue("overflow-y"),
      animation: host.style.animation,
      animationName: host.style.animation ? "cadence-pulse" : "none",
      transitionProperty: read("transition-property"),
      transitionDuration: read("transition-duration") || "0s",
      transitionDelay: read("transition-delay") || "0s",
      getPropertyValue: (name: string) => read(name),
    } as unknown as CSSStyleDeclaration;
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

/** A scoped palette, so a committed colour revision is readable per physical host. */
function installPalette() {
  const style = document.createElement("style");
  style.textContent = [
    '.tone-a [data-slot="progress-track"]{background-color:rgb(11,12,13)}',
    '.tone-b [data-slot="progress-track"]{background-color:rgb(21,22,23)}',
    '.tone-a [data-slot="progress-label"]{color:rgb(31,32,33)}',
    '.tone-b [data-slot="progress-label"]{color:rgb(41,42,43)}',
    '.tone-a [data-slot="progress-value"]{color:rgb(51,52,53)}',
    '.tone-b [data-slot="progress-value"]{color:rgb(61,62,63)}',
  ].join("");
  document.head.append(style);
  return () => style.remove();
}

beforeAll(async () => {
  await prepareV2MotionPlan();
});

let removePalette: (() => void) | undefined;
beforeEach(() => {
  installLayout();
  removePalette = installPalette();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  removePalette?.();
  removePalette = undefined;
});

function indicator(container: HTMLElement) {
  const element = container.querySelector('[data-slot="progress-indicator"]');
  if (!element) throw new Error("indicator not rendered");
  return element as HTMLElement;
}

describe("Progress", () => {
  it("renders the track, the indicator, and the value for assistive tech", () => {
    const { container } = render(
      <Progress value={40} aria-label="Upload">
        <ProgressLabel>Upload</ProgressLabel>
        <ProgressValue />
      </Progress>,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    expect(container.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="progress-label"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="progress-value"]')).toBeInTheDocument();
    expect(indicator(container)).toHaveAttribute("data-slot", "progress-indicator");
  });

  it("fills by transform, not width", () => {
    const { container } = render(<Progress value={40} aria-label="Upload" />);
    const fill = indicator(container);

    expect(fill.style.width).toBe("100%");
    expect(fill.style.transform).toContain("scaleX");
    expect(fill.style.transform).toContain("0.4");
  });

  it("keeps one host through rapid retargets and a reversal", () => {
    const draw = (value: number) => (
      <CadenceProvider timeScale={0}>
        <Progress value={value} aria-label="Upload" />
      </CadenceProvider>
    );
    const view = render(draw(40));
    const fill = indicator(view.container);
    view.rerender(draw(80));
    view.rerender(draw(20));
    expect(indicator(view.container)).toBe(fill);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "20");
  });

  it("pulses while indeterminate and stops the pulse under reduced and none", () => {
    for (const mode of modes) {
      const view = render(
        <CadenceProvider mode={mode}>
          <Progress value={null} aria-label="Preparing" />
        </CadenceProvider>,
      );
      const fill = indicator(view.container);
      expect(fill).toHaveAttribute("data-motion", mode);
      expect(fill.style.animation).toBe(mode === "full" ? "var(--animate-pulse)" : "none");
      expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
      view.unmount();
    }
  });

  it("returns from indeterminate without inventing a zero baseline", () => {
    const draw = (value: number | null) => (
      <CadenceProvider timeScale={0}>
        <Progress value={value} aria-label="Upload" />
      </CadenceProvider>
    );
    const view = render(draw(null));
    const fill = indicator(view.container);
    view.rerender(draw(64));
    expect(indicator(view.container)).toBe(fill);
    expect(fill.style.animation).toBe("");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "64");
  });

  it("replaces only changed label characters and keeps rich children untouched", () => {
    const draw = (label: string) => (
      <Progress value={40} aria-label="Upload">
        <ProgressLabel>{label}</ProgressLabel>
      </Progress>
    );
    const view = render(draw("Uploading assets"));
    const label = parts(view.container).label;
    const text = label.querySelector('[data-slot="progress-label-text"]') as HTMLElement;
    expect(text.textContent).toBe("Uploading assets");
    view.rerender(draw("Uploaded assets"));
    expect(parts(view.container).label).toBe(label);
    expect(text.textContent).toBe("Uploaded assets");

    view.rerender(
      <Progress value={40} aria-label="Upload">
        <ProgressLabel>
          <em>Uploading</em>
        </ProgressLabel>
      </Progress>,
    );
    expect(view.container.querySelector('[data-slot="progress-label-text"]')).toBeNull();
    expect(screen.getByText("Uploading").tagName).toBe("EM");
  });

  it("formats the determinate readout and settles it when normalization changes", () => {
    const draw = (value: number, max = 100, format?: Intl.NumberFormatOptions) => (
      <CadenceProvider timeScale={0}>
        <Progress value={value} min={0} max={max} format={format} aria-label="Steps">
          <ProgressValue />
        </Progress>
      </CadenceProvider>
    );
    const view = render(draw(3, 5));
    expect(parts(view.container).value.textContent).toBe("60%");
    view.rerender(draw(3, 5, { style: "decimal" }));
    expect(parts(view.container).value.textContent).toBe("3");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });

  it("keeps a caller-fixed height out of the measured content shell", () => {
    const view = render(
      <Progress value={40} aria-label="Upload" style={{ height: "2rem" }}>
        <ProgressLabel className="block w-full">
          A label long enough to wrap onto a second line inside a narrow shell.
        </ProgressLabel>
      </Progress>,
    );
    const root = parts(view.container).root;
    expect(root.style.height).toBe("2rem");
    expect(root.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();
  });
});

it.each(modes)("asserts the shared %s motion contract", (mode) => {
  render(
    <CadenceProvider mode={mode}>
      <Progress value={40} aria-label="Upload">
        <ProgressLabel>Upload</ProgressLabel>
        <ProgressValue />
      </Progress>
    </CadenceProvider>,
  );
  expectMotionContract(mode, { policy: ["color"] });
});

describe("Progress v2", () => {
  /** One root, one auto bar, one composed indicator, one label and one value. */
  const scene = (
    mode: Mode,
    frame: { value: number | null; label: string; tone: "a" | "b"; height: number; timeScale?: number },
  ) => (
    <CadenceProvider mode={mode} timeScale={frame.timeScale ?? 0}>
      <div className={frame.tone === "a" ? "tone-a" : "tone-b"}>
        <Progress value={frame.value} aria-label="Upload" data-shape-height={frame.height}>
          <div className="flex w-full items-center justify-between">
            <ProgressLabel>{frame.label}</ProgressLabel>
            <ProgressValue />
          </div>
          <ProgressIndicator />
        </Progress>
      </div>
    </CadenceProvider>
  );

  it.each(modes)("executes every owned action in %s", async (mode) => {
    // Start indeterminate: both integration paths own a live pulse, so a stop is
    // itself the observable change each activity action executes.
    const frame = { value: null as number | null, label: "Uploading", tone: "a" as "a" | "b", height: 40 };
    const draw = () => scene(mode, frame);
    const view = render(draw());
    const update = (next: Partial<typeof frame>) => {
      Object.assign(frame, next);
      view.rerender(draw());
    };

    await expectV2MotionAction("progress", "progress.bar.activity", mode, () => update({ value: 40 }));
    await expectV2MotionAction("progress", "progress.bar.update", mode, () => update({ value: 62 }));

    // Resume the second path's pulse, then stop it again from its own host.
    update({ value: 40 });
    update({ value: null });
    await expectV2MotionAction("progress", "progress.indicator.activity", mode, () => update({ value: 30 }));
    await expectV2MotionAction("progress", "progress.indicator.update", mode, () => update({ value: 55 }));

    await expectV2MotionAction("progress", "progress.value.change", mode, () => update({ value: 45 }));
    await expectV2MotionAction("progress", "progress.label.change", mode, () => update({ label: "Uploaded" }));

    // A colour revision reaches the track, the label and the value on their own
    // hosts; the indicator's own paint is caller-owned and stays untouched.
    await expectV2MotionAction("progress", "progress.surface.colour", mode, () => update({ tone: "b" }));
    await expectV2MotionAction("progress", "progress.foreground.colour", mode, () => update({ tone: "a" }));

    await expectV2MotionAction("progress", "progress.root.resize", mode, () => update({ height: 64 }));
    expect(parts(view.container).root.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();

    // The loop and the palette are both live again on their own hosts.
    update({ value: null });
    expectMotionContract(mode, {
      policy: ["loop", "color"],
      parts: [
        parts(view.container).root,
        parts(view.container).track,
        parts(view.container).label,
        parts(view.container).value,
      ],
    });
    view.unmount();
  });

  it.each(modes)("rolls a direct numeric label in %s", async (mode) => {
    const frame = { quantity: 42 };
    const draw = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Progress value={40} aria-label="Steps">
          <ProgressLabel>{frame.quantity}</ProgressLabel>
        </Progress>
      </CadenceProvider>
    );
    const view = render(draw());
    await expectV2MotionAction("progress", "progress.label.roll", mode, () => {
      frame.quantity = 45;
      view.rerender(draw());
    });
    expect(view.container.querySelector('[data-slot="progress-label-number"]')?.textContent).toBe("45");
    view.unmount();
  });

  it.each(modes)("plays one root entrance in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode}>
        <Progress value={40} hidden={!present} aria-label="Upload" />
      </CadenceProvider>
    );
    const view = render(draw(false));
    // The root is not presented while hidden; the reveal is the one insertion a
    // progress root may animate, and it fades from the already-correct fill.
    await expectV2MotionAction("progress", "progress.root.enter", mode, () => view.rerender(draw(true)));
    expect(parts(view.container).root).not.toHaveAttribute("hidden");
    expect(parts(view.container).root).toHaveAttribute("data-motion", mode);
  });
});
