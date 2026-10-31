import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MeasuredHeight } from "@/components/site/measured-height";

/**
 * jsdom lays nothing out, so the measured size has to be handed to the component:
 * the stub records what was observed and lets a test deliver a change on demand,
 * while `getBoundingClientRect` reports a height the test can move.
 */
class StubResizeObserver {
  static instances: StubResizeObserver[] = [];
  elements: Element[] = [];
  private callback: () => void;

  constructor(callback: () => void) {
    this.callback = callback;
    StubResizeObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.push(element);
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((entry) => entry !== element);
  }

  disconnect() {
    this.elements = [];
  }

  fire() {
    this.callback();
  }
}

function stubContentHeight(height: { current: number }) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        width: 480,
        height: height.current,
        top: 0,
        left: 0,
        right: 480,
        bottom: height.current,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );
}

function setup(height: number) {
  const measured = { current: height };
  vi.stubGlobal("ResizeObserver", StubResizeObserver);
  stubContentHeight(measured);

  const { container, unmount } = render(
    <MeasuredHeight className="p-6">
      <p>Preview</p>
    </MeasuredHeight>,
  );

  const box = container.querySelector("[data-preview-body]") as HTMLElement;
  return { measured, box, unmount };
}

describe("MeasuredHeight", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    StubResizeObserver.instances = [];
  });

  it("takes the height its content measures, before paint", () => {
    const { box } = setup(240);
    expect(box.style.height).toBe("240px");
  });

  it("observes the content, not the wrapper it sizes", () => {
    const { box } = setup(240);
    expect(StubResizeObserver.instances[0]?.elements).toEqual([box.firstElementChild]);
  });

  it("applies each later measurement exactly, with nothing in between", () => {
    const { measured, box } = setup(240);

    measured.current = 312;
    StubResizeObserver.instances[0]?.fire();
    expect(box.style.height).toBe("312px");

    measured.current = 198;
    StubResizeObserver.instances[0]?.fire();
    expect(box.style.height).toBe("198px");
  });

  it("leaves the height to the layout when nothing has been laid out", () => {
    const { box } = setup(0);
    expect(box.style.height).toBe("");
  });

  it("releases the height and the observer on unmount", () => {
    const { box, unmount } = setup(240);
    expect(box.style.height).toBe("240px");

    unmount();
    expect(box.style.height).toBe("");
    expect(StubResizeObserver.instances[0]?.elements).toEqual([]);
  });
});
