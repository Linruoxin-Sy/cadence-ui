import { act, fireEvent, render, screen } from "@testing-library/react";
import { createContext, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Bar, BarChart, JavascriptAnimation } from "recharts";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartContainer, ChartLegendContent, ChartStyle, ChartTooltipContent } from "@/registry/cadence/chart";
import { documentPresentation } from "@/registry/cadence/lib/motion-presence";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { visibleEngineViewport } from "../engine-viewport";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionInsertion, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

beforeEach(visibleEngineViewport);

const engine = vi.hoisted(() => ({ controller: null as import("recharts").AnimationController | null }));
vi.mock("recharts", async (original) => {
  const actual = await original<typeof import("recharts")>();
  return {
    ...actual,
    AnimationControllerProvider: ({
      value,
      children,
    }: {
      value: import("recharts").AnimationController;
      children: React.ReactNode;
    }) => {
      engine.controller = value;
      return <actual.AnimationControllerProvider value={value}>{children}</actual.AnimationControllerProvider>;
    },
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
const config = { visits: { label: "Visits", theme: { light: "red", dark: "blue" } } };
const payload = [
  { graphicalItemId: "visits", name: "visits", dataKey: "visits", value: 42, color: "red", payload: { month: "Jan" } },
] as const;
function Content() {
  return (
    <>
      <ChartTooltipContent active payload={payload} label="Jan" />
      <ChartLegendContent payload={[{ ...payload[0], value: "visits" }]} />
    </>
  );
}
describe("Chart", () => {
  it("preserves context render children across motion modes and context updates", () => {
    const Context = createContext("initial");
    const tree = (mode: "full" | "reduced" | "none", value: string) => (
      <CadenceProvider mode={mode}>
        <Context.Provider value={value}>
          <ChartContainer config={config}>
            <svg aria-label="Context chart">
              <Context.Consumer>{(current) => <text>{current}</text>}</Context.Consumer>
            </svg>
          </ChartContainer>
        </Context.Provider>
      </CadenceProvider>
    );
    const { container, rerender } = render(tree("full", "initial"));
    const svg = screen.getByLabelText("Context chart");
    const text = screen.getByText("initial");
    for (const mode of ["reduced", "none", "full"] as const) {
      rerender(tree(mode, `updated-${mode}`));
      expect(screen.getByText(`updated-${mode}`)).toBe(text);
      expect(screen.getByLabelText("Context chart")).toBe(svg);
      expect(container.querySelector('[data-slot="chart"]')).toHaveAttribute("data-motion", mode);
    }
  });
  it("preserves div ref, caller styles/classes and scoped theme", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ChartContainer
        config={config}
        id="test"
        ref={ref}
        className="h-80"
        style={{ marginTop: 7 }}
        initialDimension={{ width: 400, height: 250 }}
      >
        <BarChart width={400} height={250} data={[{ visits: 42 }]}>
          <Bar dataKey="visits" isAnimationActive={false} />
        </BarChart>
      </ChartContainer>,
    );
    expect(ref.current).toHaveAttribute("data-slot", "chart");
    expect(ref.current).toHaveAttribute("data-chart", "chart-test");
    expect(ref.current).toHaveClass("h-80");
    expect(ref.current).toHaveStyle({ marginTop: "7px" });
    expect(container.querySelector("style")?.textContent).toContain("--color-visits: blue");
  });
  for (const mode of ["full", "reduced", "none"] as const) {
    it(`renders complete information in ${mode}`, () => {
      const { container } = render(
        <CadenceProvider mode={mode}>
          <ChartContainer config={config}>
            <Content />
          </ChartContainer>
        </CadenceProvider>,
      );
      const listener = vi.fn();
      const handle = new JavascriptAnimation({
        animationId: "contract",
        from: 0,
        to: 1,
        animationDuration: 5000,
        animationBegin: 5000,
        easing: (x) => x,
        onAnimationStart: undefined,
        onAnimationEnd: undefined,
      });
      act(() => {
        engine.controller?.({ setTimeout: () => () => {} }, handle, listener);
      });
      expectMotionContract(mode, {
        behavior: () => {
          // This injected entry has no ChartSeriesOwner/work descriptor. It
          // must settle in every mode rather than claim a zero-sample loop.
          expect(listener).toHaveBeenLastCalledWith(1);
          expect(handle.getState()).toBe("completed");
        },
      });
      expect(container.querySelector('[data-slot="chart"]')).toHaveAttribute("data-motion", mode);
      expect(screen.getByText("42")).toBeVisible();
      expect(screen.getAllByText("Visits")).toHaveLength(2);
      expect(container.querySelector('[data-slot="chart"]')).not.toHaveStyle({ transform: "scale(0.96)" });
    });
  }
  it("supports formatters, nested labels, hidden indicators and omitted entries", () => {
    const { container } = render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          payload={[...payload, { ...payload[0], type: "none" }]}
          indicator="dashed"
          labelFormatter={(value) => `Month ${value}`}
          formatter={(value) => `Value ${value}`}
        />
      </ChartContainer>,
    );
    expect(screen.getByText("Value 42")).toBeVisible();
    expect(container.textContent).toContain("Month Visits");
  });
  it("returns empty content for inactive or empty payload and unconfigured styles", () => {
    const { container } = render(
      <ChartContainer config={{}}>
        <div>
          <ChartTooltipContent active={false} payload={payload} />
          <ChartLegendContent payload={[]} />
          <ChartStyle id="empty" config={{}} />
        </div>
      </ChartContainer>,
    );
    expect(container.querySelector("style")).toBeNull();
    expect(container.textContent).toBe("");
  });
  it.each(["none", "zero"] as const)(
    "settles an unknown controller entry before scheduling work and retains completion on %s",
    (ending) => {
      const callbacks: FrameRequestCallback[] = [];
      vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
        callbacks.push(callback);
        return callbacks.length;
      });
      vi.stubGlobal("cancelAnimationFrame", vi.fn());
      const onEnd = vi.fn();
      const listener = vi.fn();
      const { rerender } = render(
        <CadenceProvider mode="full">
          <ChartContainer config={config}>
            <Content />
          </ChartContainer>
        </CadenceProvider>,
      );
      const handle = new JavascriptAnimation({
        animationId: "test",
        from: 0,
        to: 1,
        animationDuration: 5000,
        animationBegin: 5000,
        easing: (x) => x,
        onAnimationStart: undefined,
        onAnimationEnd: onEnd,
      });
      act(() => {
        engine.controller?.({ setTimeout: () => () => {} }, handle, listener);
        callbacks.shift()?.(0);
        callbacks.shift()?.(110);
      });
      expect(listener).toHaveBeenLastCalledWith(1);
      expect(callbacks).toHaveLength(0);
      expect(onEnd).toHaveBeenCalledOnce();
      act(() =>
        rerender(
          <CadenceProvider mode={ending === "none" ? "none" : "full"} timeScale={ending === "zero" ? 0 : 1}>
            <ChartContainer config={config}>
              <Content />
            </ChartContainer>
          </CadenceProvider>,
        ),
      );
      expect(listener).toHaveBeenLastCalledWith(1);
      expect(onEnd).toHaveBeenCalledOnce();
      expect(handle.getState()).toBe("completed");
      vi.unstubAllGlobals();
    },
  );
  it("updates context without remounting its div", () => {
    const { container, rerender } = render(
      <ChartContainer config={config}>
        <Content />
      </ChartContainer>,
    );
    const root = container.firstChild;
    act(() =>
      rerender(
        <ChartContainer config={{ visits: { label: "Sessions", color: "green" } }}>
          <Content />
        </ChartContainer>,
      ),
    );
    expect(container.firstChild).toBe(root);
    expect(screen.getAllByText("Sessions")).toHaveLength(2);
  });
});

it.each(["tooltip", "legend"] as const)(
  "forwards %s content native props and ref cleanup without leaking engine metadata",
  (kind) => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const capture = vi.fn();
    const drag = vi.fn((event) => event.preventDefault());
    const native = {
      ref,
      style: { color: "red" },
      "data-testid": "content",
      onDragStartCapture: capture,
      onDragStart: drag,
    };
    const tree = (color: string) => (
      <ChartContainer config={config}>
        {kind === "tooltip" ? (
          <ChartTooltipContent
            {...native}
            style={{ color }}
            active
            payload={payload}
            animationDuration={900}
            wrapperStyle={{ opacity: 0.1 }}
          />
        ) : (
          <ChartLegendContent
            {...native}
            style={{ color }}
            payload={[{ ...payload[0], value: "visits" }]}
            iconSize={20}
          />
        )}
      </ChartContainer>
    );
    const view = render(tree("red"));
    const node = screen.getByTestId("content");
    expect(ref).toHaveBeenCalledWith(node);
    expect(node.style.color).toBe("red");
    expect(node).not.toHaveAttribute("animationDuration");
    expect(node).not.toHaveAttribute("wrapperStyle");
    expect(node).not.toHaveAttribute("iconSize");
    const event = new Event("dragstart", { bubbles: true, cancelable: true });
    fireEvent(node, event);
    expect(capture).toHaveBeenCalledOnce();
    expect(drag).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    view.rerender(tree("blue"));
    expect(screen.getByTestId("content")).toBe(node);
    expect(node.style.color).toBe("blue");
    view.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  },
);

it("uses Recharts legend formatter and entry callback signatures with keyboard activation", () => {
  const click = vi.fn();
  const enter = vi.fn();
  const item = { ...payload[0], value: "visits" };
  render(
    <ChartContainer config={config}>
      <ChartLegendContent
        payload={[item]}
        onClick={click}
        onMouseEnter={enter}
        formatter={(value, entry, index) => `${value} ${entry.value} ${index}`}
      />
    </ChartContainer>,
  );
  const entry = screen.getByRole("button", { name: "Visits visits 0" });
  fireEvent.mouseEnter(entry);
  expect(enter).toHaveBeenCalledWith(item, 0, expect.objectContaining({ type: "mouseenter" }));
  fireEvent.keyDown(entry, { key: "Enter" });
  fireEvent.keyDown(entry, { key: " " });
  expect(click).toHaveBeenCalledTimes(2);
  expect(click).toHaveBeenLastCalledWith(item, 0, expect.objectContaining({ type: "click" }));
});

/**
 * jsdom has no Web Animations API, so the presence envelope would settle
 * immediately. Supply the minimal native surface it calls and leave the
 * envelope in flight so an entrance is observable.
 */
function stubNativeAnimation() {
  const handles: { cancel: ReturnType<typeof vi.fn>; playState: string }[] = [];
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: (frames: Keyframe[]) => {
      let reject: ((reason?: unknown) => void) | undefined;
      const finished = new Promise<void>((_, no) => {
        reject = no;
      });
      finished.catch(() => {});
      const handle = {
        finished,
        playState: "running",
        effect: { getKeyframes: () => frames, getTiming: () => ({ duration: 100 }) },
        cancel: vi.fn(() => reject?.(new Error("cancelled"))),
        finish: vi.fn(),
      };
      handles.push(handle);
      return handle as unknown as Animation;
    },
  });
  return {
    handles,
    restore: () => {
      Reflect.deleteProperty(HTMLElement.prototype, "animate");
    },
  };
}

describe("Chart v2 owners", () => {
  beforeAll(async () => {
    await prepareV2MotionPlan();
  });
  afterEach(() => vi.unstubAllGlobals());

  const page = (mode: "full" | "reduced" | "none", content: React.ReactNode) => (
    <CadenceProvider mode={mode}>
      <ChartContainer config={config}>{content}</ChartContainer>
    </CadenceProvider>
  );

  for (const mode of ["full", "reduced", "none"] as const) {
    it(`owns one entrance for a chart surface inserted after the baseline in ${mode}`, async () => {
      const stub = stubNativeAnimation();
      try {
        const view = render(
          <CadenceProvider mode={mode}>
            <div />
          </CadenceProvider>,
        );
        // A page that already painted presents its successors; only a later
        // insertion owns the entrance.
        documentPresentation(document).presented = true;
        await expectV2MotionInsertion(
          "chart",
          "chart.surface.enter",
          mode,
          () =>
            act(() => {
              view.rerender(page(mode, <Content />));
            }),
          {
            // The owned writer is a raw WAAPI opacity envelope, not a Motion prop.
            behavior: () => {
              const host = view.container.querySelector('[data-slot="chart"]');
              expect(host).toHaveAttribute("data-motion", mode);
            },
          },
        );
      } finally {
        stub.restore();
      }
    });

    it(`fades tooltip and legend introduced after the chart baseline in ${mode}`, async () => {
      const stub = stubNativeAnimation();
      try {
        const view = render(page(mode, <div />));
        documentPresentation(document).presented = true;
        await expectV2MotionInsertion(
          "chart",
          "chart.annotation.enter",
          mode,
          () =>
            act(() => {
              view.rerender(page(mode, <Content />));
            }),
          {
            // The owned writer is a raw WAAPI opacity envelope, not a Motion prop.
            behavior: () => {
              const host = view.container.querySelector('[data-slot="chart-tooltip"]');
              expect(host).toHaveAttribute("data-motion", mode);
            },
          },
        );
      } finally {
        stub.restore();
      }
    });
  }

  it("cancels the live surface entrance when the same chart downgrades to none", () => {
    const stub = stubNativeAnimation();
    try {
      const view = render(
        <CadenceProvider mode="full">
          <div />
        </CadenceProvider>,
      );
      documentPresentation(document).presented = true;
      act(() => {
        view.rerender(page("full", <Content />));
      });
      const surface = view.container.querySelector('[data-slot="chart"]') as HTMLElement;
      expect(surface.dataset.motion).toBe("full");
      const running = stub.handles.filter((handle) => handle.playState === "running");
      expect(running.length).toBeGreaterThan(0);
      act(() => {
        view.rerender(page("none", <Content />));
      });
      expect(surface.dataset.motion).toBe("none");
      for (const handle of running) expect(handle.cancel).toHaveBeenCalled();
    } finally {
      stub.restore();
    }
  });

  it("keeps server markup and first paint natural without a hidden entrance", () => {
    const markup = renderToStaticMarkup(
      <CadenceProvider mode="full">
        <ChartContainer config={config}>
          <Content />
        </ChartContainer>
      </CadenceProvider>,
    );
    expect(markup).toContain('data-slot="chart"');
    expect(markup).toContain('data-motion="full"');
    expect(markup).not.toMatch(/opacity:0|opacity="0"|style="[^"]*opacity: 0/);
  });

  it("certifies native and not-applicable capability boundaries on their actual hosts", async () => {
    const view = render(page("full", <Content />));
    await expectV2NativeBoundaries("chart", { container: view.container });
  });
});
