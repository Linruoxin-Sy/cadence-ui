import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { Bar, BarChart, JavascriptAnimation } from "recharts";
import { describe, expect, it, vi } from "vitest";
import { ChartContainer, ChartLegendContent, ChartStyle, ChartTooltipContent } from "@/registry/cadence/chart";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

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
          if (mode === "full") expect(handle.getState()).not.toBe("completed");
          else {
            expect(listener).toHaveBeenLastCalledWith(1);
            expect(handle.getState()).toBe("completed");
          }
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
  it("uses the token clock, cancels on downgrade and honours completion callbacks", () => {
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
    expect(listener.mock.lastCall?.[0]).toBeGreaterThan(0.5);
    expect(listener.mock.lastCall?.[0]).toBeLessThan(1);
    act(() =>
      rerender(
        <CadenceProvider mode="none">
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
  });
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
