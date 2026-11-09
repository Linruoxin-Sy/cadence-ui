import useEmblaCarousel from "embla-carousel-react";
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import * as R from "recharts";
import { Calendar } from "../../registry/cadence/calendar";
import { Carousel, CarouselContent, CarouselItem } from "../../registry/cadence/carousel";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../registry/cadence/chart";
import { Drawer, DrawerContent, DrawerTitle } from "../../registry/cadence/drawer";
import { CadenceProvider, useEngineEnvironment } from "../../registry/cadence/lib/provider";
import { Toc } from "../../registry/cadence/toc";

const query = new URLSearchParams(location.search);
const kind = query.get("kind") ?? "carousel";
const series = query.get("series") ?? "Bar";
const seriesComponents = {
  Bar: R.Bar,
  Line: R.Line,
  Area: R.Area,
  Pie: R.Pie,
  Scatter: R.Scatter,
  Radar: R.Radar,
  RadialBar: R.RadialBar,
  Funnel: R.Funnel,
};
const chartComponents = { Bar: R.BarChart, Line: R.LineChart, Area: R.AreaChart };
const events = [];
window.engineEvents = events;
const nodes = new WeakMap();
let sequence = 0;
const identity = (node) => {
  if (!nodes.has(node)) nodes.set(node, ++sequence);
  return nodes.get(node);
};
window.engineIdentity = identity;
const ref = (node) => {
  if (!node) return;
  const id = identity(node);
  events.push({ type: "ref", id });
  return () => events.push({ type: "cleanup", id });
};
if (query.has("global")) useEmblaCarousel.globalOptions = { breakpoints: { "(min-width: 600px)": { duration: 61 } } };
let pluginCleanup = () => {};
const plugin = {
  name: "callerPlugin",
  options: {},
  init(api) {
    events.push({ type: "plugin-init", engine: identity(api.internalEngine()) });
    window.pluginApi = api;
    const settled = () =>
      events.push({ type: "settle", time: performance.now(), engine: identity(api.internalEngine()) });
    api.on("settle", settled);
    pluginCleanup = () => api.off("settle", settled);
    if (query.has("pluginDuration")) api.internalEngine().options.duration = 67;
  },
  destroy() {
    pluginCleanup();
    events.push({ type: "plugin-destroy" });
  },
};
const chartSelector =
  ".recharts-bar-rectangle path,.recharts-curve,.recharts-sector,.recharts-symbols,.recharts-trapezoid,.recharts-radar-polygon .recharts-polygon,.recharts-area clipPath rect,.recharts-line-dot,.recharts-area-dot,.recharts-radar-dot";
window.engineSample = () => {
  const engine = window.embla?.internalEngine();
  const root = document.querySelector(
    `[data-slot=${kind === "chart" ? "chart" : kind === "drawer" ? "drawer-popup" : kind}]`,
  );
  const grid = document.querySelector("[data-slot=calendar-month-grid]");
  const indicator = document.querySelector("[data-slot=toc-indicator]");
  const track = window.embla?.containerNode();
  return {
    time: performance.now(),
    react: React.version,
    root: root && identity(root),
    mode: root?.dataset.motion,
    engine: engine && {
      id: identity(engine),
      location: engine.location.get(),
      target: engine.target.get(),
      offset: engine.offsetLocation.get(),
      velocity: engine.scrollBody.velocity(),
      duration: engine.scrollBody.duration(),
      base: engine.options.duration,
      held: engine.dragHandler.pointerDown(),
      selected: window.embla.selectedScrollSnap(),
      plugins: Object.keys(window.embla.plugins()),
      raf: engine.animation.__cadenceObserve?.(),
      track: track && {
        inline: track.style.transform,
        computed: getComputedStyle(track).transform,
        slides: [...track.children].map((node) => node.style.transform),
      },
    },
    geometry: [...document.querySelectorAll(chartSelector)].map((n) => ({
      tag: n.tagName,
      d: n.getAttribute("d"),
      width: n.getAttribute("width"),
      height: n.getAttribute("height"),
      cx: n.getAttribute("cx"),
      cy: n.getAttribute("cy"),
      dash: getComputedStyle(n).strokeDasharray,
      transform: getComputedStyle(n).transform,
    })),
    grid: grid && {
      id: identity(grid),
      month: grid.getAttribute("aria-label"),
      opacity: getComputedStyle(grid).opacity,
      transform: getComputedStyle(grid).transform,
      animations: grid.getAnimations().map((a) => ({
        state: a.playState,
        current: a.currentTime,
        timing: a.effect.getTiming(),
        frames: a.effect.getKeyframes(),
      })),
    },
    drawer: root &&
      kind === "drawer" && {
        swiping: root.hasAttribute("data-swiping"),
        transform: getComputedStyle(root).transform,
        transition: getComputedStyle(root).transitionProperty,
        duration: getComputedStyle(root).transitionDuration,
        y: root.style.getPropertyValue("--drawer-swipe-movement-y"),
        capture: window.lastPointer && root.hasPointerCapture(window.lastPointer),
        animations: root.getAnimations().map((a) => ({
          state: a.playState,
          property: a.transitionProperty,
          duration: a.effect.getTiming().duration,
        })),
      },
    indicator: indicator && {
      transform: getComputedStyle(indicator).transform,
      top: indicator.getBoundingClientRect().top,
      height: indicator.getBoundingClientRect().height,
    },
    controllers: (window.w2controllers ?? []).map((c) => ({
      id: identity(c),
      phaseId: c.phase && identity(c.phase),
      progress: c.phase?.progress,
      origin: c.origin,
      created: c.created,
      ticks: c.ticks,
      nativeId: c.handle.getAnimationId(),
      phaseEase: c.phase?.easing?.(0.5),
      state: c.state,
      native: c.handle.getState(),
      updates: c.updates,
      applied: c.applied,
      duration: c.readClock().duration,
      ease: c.readClock().easing(0.5),
      easingType: typeof c.handle.getEasing(),
    })),
    registered: [...(window.w2controllerSets ?? [])].reduce((count, set) => count + set.size, 0),
    drivers: (window.w2drivers ?? []).map((d) => ({
      numeric: typeof d.value === "number",
      animating: typeof d.value === "number" ? d.controls.state === "running" : d.value.isAnimating(),
      value: typeof d.value === "number" ? d.controls.time : d.value.get(),
    })),
    contentDrivers: (window.engineContentDrivers ?? []).map((d) => ({
      id: identity(d.controls),
      state: d.controls.state,
      duration: d.options.duration,
      target: d.target,
      value: d.value.get(),
      animating: d.value.isAnimating(),
    })),
    rootRefs:
      window.engineRootRefs &&
      Object.fromEntries(
        Object.entries(window.engineRootRefs).map(([key, ref]) => [key, ref.current ? identity(ref.current) : null]),
      ),
    labels: [...document.querySelectorAll(".recharts-label-list text")].map((node) => ({
      text: node.textContent,
      x: node.getAttribute("x"),
      y: node.getAttribute("y"),
    })),
    fills: [...document.querySelectorAll(chartSelector)].map((node) => node.getAttribute("fill")),
    focus: document.activeElement?.id,
    scroll: document.querySelector("#scroll-host")?.scrollTop,
    windowScroll: window.scrollY,
    events: events.slice(),
  };
};
window.engineFrames = [];
window.engineInsertions = [];
const inserted = new WeakSet();
new MutationObserver(() => {
  for (const n of document.querySelectorAll(
    `${chartSelector},[data-slot=calendar-month-grid],[data-slot=carousel-content]`,
  )) {
    if (inserted.has(n)) continue;
    inserted.add(n);
    requestAnimationFrame(() => window.engineInsertions.push(window.engineSample()));
  }
}).observe(document.body, { childList: true, subtree: true });
function EnvironmentOwnerProbe({ version }) {
  const [target, setTarget] = React.useState(null);
  const cancel = React.useCallback(() => {
    window.engineProbeCancels = (window.engineProbeCancels ?? 0) + 1;
    window.embla?.internalEngine().animation.stop();
  }, []);
  const environment = useEngineEnvironment(target, cancel);
  window.engineProbe = { target, blocked: environment.blocked, unavailable: environment.unavailable };
  return <div key={version} data-engine-owner-probe ref={setTarget} style={{ width: 100, height: 16 }} />;
}
function App() {
  const rootA = React.useRef(null),
    rootB = React.useRef(null);
  window.engineRootRefs = { a: rootA, b: rootB };
  const [state, set] = React.useState({
    mode: query.get("mode") ?? "full",
    clock: 2,
    base: query.has("portal") ? undefined : "0.6s",
    effective: undefined,
    curve: "cubic-bezier(0.1,0.2,0.8,0.9)",
    revision: 0,
    mounted: true,
    count: 5,
    options: query.get("options") ?? "default",
    axis: query.get("axis") ?? "horizontal",
    active: "first",
    open: false,
    hidden: false,
    offscreen: query.has("initialOffscreen"),
    appearanceClip: query.has("appearanceClip"),
    overflowClip: false,
    environmentVersion: 0,
    refVersion: 0,
    nativeAnimation: false,
    customPaint: false,
    optOut: query.has("optOut"),
    customController: query.has("controller"),
  });
  const revision = React.useRef(0);
  window.enginePatch = (patch) => {
    const request = ++revision.current;
    flushSync(() => set((old) => ({ ...old, ...patch, request })));
    return request;
  };
  React.useLayoutEffect(() => {
    const record = (phase) =>
      window.engineFrames.push({ request: state.request, phase, sample: window.engineSample() });
    record("commit");
    let frame = requestAnimationFrame(() => {
      record("paint1");
      frame = requestAnimationFrame(() => record("paint2"));
    });
    return () => cancelAnimationFrame(frame);
  });
  const opts = React.useMemo(
    () => ({
      loop: true,
      ...(state.options === "explicit" ? { duration: 29 } : {}),
      ...(state.options === "breakpoint"
        ? { duration: 29, breakpoints: { "(min-width: 600px)": { duration: 57 } } }
        : {}),
    }),
    [state.options],
  );
  const data = React.useMemo(
    () => [
      { name: "a", value: state.revision % 2 ? 80 : 20, x: 10, y: state.revision % 2 ? 70 : 20, z: 20 },
      { name: "b", value: state.revision % 2 ? 20 : 60, x: 50, y: state.revision % 2 ? 20 : 60, z: 60 },
      { name: "c", value: 40, x: 80, y: 40, z: 40 },
    ],
    [state.revision],
  );
  const callbacks = React.useMemo(
    () => ({
      isAnimationActive: true,
      animationDuration: 9000,
      animationBegin: 9000,
      animationEasing: (x) => {
        events.push({ type: "caller-easing", x });
        return x;
      },
      onAnimationStart: () => events.push({ type: "start", time: performance.now() }),
      onAnimationEnd: () => events.push({ type: "end", time: performance.now() }),
    }),
    [],
  );
  const controller = React.useCallback((_timeout, handle, listener) => {
    events.push({
      type: "caller-controller",
      easing: typeof handle.getEasing(),
      duration: handle.getAnimationDuration(),
      delay: handle.getAnimationBegin(),
    });
    handle.tick(0);
    handle.tick(handle.getAnimationBegin());
    listener(handle.getTo());
    handle.complete();
    return () => events.push({ type: "caller-controller-cleanup" });
  }, []);
  const interpolate = React.useCallback((items, progress, layout) => {
    events.push({ type: "interpolate", progress, layout });
    return items?.flatMap((item) => (item.status === "removed" ? [] : [item.next])) ?? [];
  }, []);
  const local = {
    "--motion-source-duration-base": state.base,
    "--motion-duration-base": state.effective,
    "--ease-cadence-out": state.curve,
  };
  let child;
  if (kind === "carousel")
    child = (
      <Carousel
        ref={ref}
        opts={opts}
        plugins={[plugin]}
        setApi={(api) => {
          window.embla = api;
        }}
        orientation={state.axis}
        style={{ ...local, width: 300 }}
        onPointerDown={(event) => events.push({ type: "pointer", id: event.pointerId })}
      >
        <CarouselContent style={{ height: state.axis === "vertical" ? 240 : undefined }}>
          {["a", "b", "c", "d", "e"].slice(0, state.count).map((i) => (
            <CarouselItem key={i}>
              <div style={{ height: 120 }}>
                {i}
                <input aria-label={`slide ${i}`} defaultValue="native selection" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  if (kind === "chart") {
    const Series = seriesComponents[series];
    const common = {
      ...callbacks,
      ...(query.has("inline")
        ? {
            onAnimationStart: () => events.push({ type: "inline-start", clock: state.clock, time: performance.now() }),
            onAnimationEnd: () => events.push({ type: "inline-end", clock: state.clock, time: performance.now() }),
            onClick: () => events.push({ type: "inline-click", clock: state.clock }),
            ...(series === "Bar"
              ? {
                  shape: (props) => (
                    <R.Rectangle {...props} onClick={() => events.push({ type: "shape-click", clock: state.clock })} />
                  ),
                }
              : {}),
          }
        : {}),
      isAnimationActive: !state.optOut,
      dataKey: "value",
      ...(query.has("interpolate") ? { animationInterpolateFn: interpolate } : {}),
      ...(query.has("composition")
        ? {
            children: [
              ...data.map((datum, index) => <R.Cell key={datum.name} fill={["red", "green", "blue"][index]} />),
              <R.LabelList key="labels" dataKey="value" position="top" />,
            ],
          }
        : {}),
    };
    let graph;
    if (["Bar", "Line", "Area"].includes(series)) {
      const Chart = chartComponents[series];
      graph = (
        <Chart width={400} height={240} data={data}>
          <R.XAxis dataKey="name" />
          <R.YAxis domain={[0, 100]} />
          <Series {...common} />
          {!query.has("native") && (
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={query.has("inline") ? (value) => `clock ${state.clock}: ${value}` : undefined}
                />
              }
            />
          )}
        </Chart>
      );
    }
    if (series === "Scatter")
      graph = (
        <R.ScatterChart width={400} height={240}>
          <R.XAxis dataKey="x" type="number" domain={[0, 100]} />
          <R.YAxis dataKey="y" type="number" domain={[0, 100]} />
          <R.Scatter data={data} {...common} />
        </R.ScatterChart>
      );
    if (series === "Pie")
      graph = (
        <R.PieChart width={400} height={240}>
          <R.Pie data={data} {...common} />
        </R.PieChart>
      );
    if (series === "Radar")
      graph = (
        <R.RadarChart width={400} height={240} data={data}>
          <R.PolarAngleAxis dataKey="name" />
          <R.PolarRadiusAxis domain={[0, 100]} />
          <R.Radar {...common} />
        </R.RadarChart>
      );
    if (series === "RadialBar")
      graph = (
        <R.RadialBarChart width={400} height={240} data={data}>
          <R.PolarAngleAxis type="number" domain={[0, 100]} />
          <R.RadialBar {...common} />
        </R.RadialBarChart>
      );
    if (series === "Funnel")
      graph = (
        <R.FunnelChart width={400} height={240}>
          <R.Funnel data={data} {...common} />
        </R.FunnelChart>
      );
    if (state.customController)
      graph = <R.AnimationControllerProvider value={controller}>{graph}</R.AnimationControllerProvider>;
    const chartRef = query.has("objectRef")
      ? state.refVersion
        ? rootB
        : rootA
      : query.has("inline")
        ? (node) => {
            if (node) {
              const id = identity(node);
              events.push({ type: "inline-ref", clock: state.clock, id });
              return () => events.push({ type: "inline-ref-cleanup", clock: state.clock, id });
            }
          }
        : ref;
    child = query.has("native") ? (
      <div
        data-slot="chart"
        ref={chartRef}
        className="flex aspect-video justify-center text-xs"
        style={{ width: 400, height: 240 }}
      >
        <R.ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>{graph}</R.ResponsiveContainer>
      </div>
    ) : (
      <ChartContainer
        ref={chartRef}
        config={{ value: { label: "Value" } }}
        style={{ ...local, width: 400, height: 240 }}
      >
        {graph}
      </ChartContainer>
    );
  }
  if (kind === "calendar")
    child = (
      <Calendar
        month={new Date(2026, 10 + state.revision, 1)}
        mode="single"
        animate={state.nativeAnimation}
        styles={{
          root: local,
          month_grid: state.customPaint ? { transform: "translateX(3px)", opacity: 0.7 } : undefined,
        }}
        onDayClick={() => events.push({ type: "day-click" })}
      />
    );
  if (kind === "toc")
    child = (
      <Toc
        ref={ref}
        activeId={state.active}
        items={[
          { id: "first", title: "First" },
          { id: "last", title: "Last long section" },
        ]}
        style={{ ...local, width: 160 }}
      />
    );
  if (kind === "drawer")
    child = (
      <Drawer
        showSwipeHandle
        open={state.open}
        onOpenChange={(open) => set((old) => ({ ...old, open }))}
        snapPoints={[0.5, 1]}
      >
        <DrawerContent
          ref={ref}
          style={{ height: 400 }}
          onPointerDown={(event) => {
            window.lastPointer = event.pointerId;
            events.push({ type: "pointer", id: event.pointerId });
          }}
        >
          <DrawerTitle>Native drawer</DrawerTitle>
          <input aria-label="drawer input" defaultValue="native drawer edit" />
          <p>Swipe content</p>
        </DrawerContent>
      </Drawer>
    );
  if (query.has("portal"))
    child = (
      <Drawer open>
        <DrawerContent initialFocus={false} style={{ "--motion-source-duration-base": "0.7s", height: 400 }}>
          <DrawerTitle>Portal carousel</DrawerTitle>
          {child}
        </DrawerContent>
      </Drawer>
    );
  return (
    <>
      <CadenceProvider mode="none" timeScale={state.clock}>
        <CadenceProvider mode={state.mode}>
          <div
            style={{
              display: state.hidden ? "none" : undefined,
              paddingTop: state.offscreen ? 1800 : undefined,
              clipPath: state.appearanceClip ? "inset(0 0 100% 0)" : undefined,
              height: state.overflowClip ? 0 : undefined,
              overflow: state.overflowClip ? "hidden" : undefined,
            }}
          >
            {query.has("lifetimeProbe") && <EnvironmentOwnerProbe version={state.environmentVersion} />}
            {state.mounted && child}
          </div>
        </CadenceProvider>
      </CadenceProvider>
      <input id="native-input" aria-label="native input" defaultValue="native selection" />
      {kind === "toc" && (
        <div
          id="scroll-host"
          style={{
            height: query.has("windowHost") ? undefined : 240,
            width: 400,
            overflow: query.has("windowHost") ? undefined : "auto",
          }}
        >
          <section style={{ height: 700 }}>
            <h2 id="first">First</h2>
          </section>
          <section style={{ height: 700 }}>
            <h2 id="last">Last</h2>
          </section>
        </div>
      )}
    </>
  );
}
const style = document.createElement("style");
style.textContent =
  "[data-slot=carousel-content]{overflow:hidden;width:300px}[data-slot=carousel-content]>div{display:flex}[data-slot=carousel-item]{flex:0 0 180px;width:180px;height:120px}[data-slot=carousel][aria-orientation=vertical]>div>div{flex-direction:column}input{background:white;color:black} [data-slot=toc-track]{position:relative}";
document.head.append(style);
const tree = <App />;
createRoot(document.getElementById("root")).render(
  window.engineStrict ? <React.StrictMode>{tree}</React.StrictMode> : tree,
);
