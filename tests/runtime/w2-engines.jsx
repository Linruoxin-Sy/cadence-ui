import React from "react";
import { createRoot } from "react-dom/client";
import * as R from "recharts";
import { DocumentEntrance } from "../../components/site/document-entrance";
import { Carousel, CarouselContent, CarouselItem } from "../../registry/cadence/carousel";
import { ChartContainer } from "../../registry/cadence/chart";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

const q = new URLSearchParams(location.search),
  kind = q.get("kind") || "chart",
  series = q.get("series") || "Bar";
let request = 0;
const ids = new WeakMap();
let next = 0;
window.w2frames = [];
window.w2nodes = [];
window.w2events = [];
const selectors = {
  chart:
    ".recharts-bar-rectangle path,.recharts-curve,.recharts-sector,.recharts-symbols,.recharts-trapezoid,.recharts-radar-polygon .recharts-polygon",
  carousel: "[data-slot=carousel-content] > div,[data-slot=carousel-item]",
  entrance: "[data-document-entrance]",
};
window.sampleW2 = (phase, state) => {
  const live = [...document.querySelectorAll(selectors[kind])];
  if (live.length) window.w2nodes = live;
  const e = window.embla?.internalEngine();
  return {
    controllers: (window.w2controllers || []).map((c) => ({
      state: c.state,
      nativeState: c.handle.getState(),
      ticks: c.ticks.length,
      updates: c.updates.length,
      value: c.updates.at(-1)?.value,
      appliedDuration: c.applied.at(-1)?.duration,
    })),
    registered: [...(window.w2controllerSets || [])].reduce((count, set) => count + set.size, 0),
    phase,
    request: state?.request ?? request,
    state,
    time: performance.now(),
    engine: e && {
      location: e.location.get(),
      target: e.target.get(),
      offset: e.offsetLocation.get(),
      duration: e.scrollBody.duration(),
      settled: e.scrollBody.settled(),
      loop: e.slideLooper.loopPoints.map((p) => ({ index: p.index, target: p.target() })),
    },
    parts: (live.length ? live : window.w2nodes).map((n) => {
      if (!ids.has(n)) ids.set(n, ++next);
      const css = getComputedStyle(n);
      return {
        id: ids.get(n),
        connected: n.isConnected,
        tag: n.tagName,
        mode: n.dataset.motion,
        html: n.outerHTML,
        inline: n.getAttribute("style"),
        d: n.getAttribute("d"),
        cx: n.getAttribute("cx"),
        cy: n.getAttribute("cy"),
        opacity: +css.opacity,
        transform: css.transform,
        filter: css.filter,
        clip: css.clipPath,
      };
    }),
  };
};
window.w2insertions = [];
const inserted = new WeakSet();
new MutationObserver(() => {
  for (const n of document.querySelectorAll(selectors[kind])) {
    if (inserted.has(n)) continue;
    inserted.add(n);
    const record = (phase) => window.w2insertions.push(window.sampleW2(phase));
    record("insert");
    requestAnimationFrame(() => {
      record("paint1");
      requestAnimationFrame(() => record("paint2"));
    });
  }
}).observe(document.body, { childList: true, subtree: true });
function App() {
  const [s, set] = React.useState({
    request: 0,
    mode: q.get("mode") || "full",
    clock: 8,
    explicit: undefined,
    selected: false,
    mounted: true,
    count: 5,
    offscreen: q.get("offscreen") === "true",
  });
  window.updateW2 = (p) => {
    request++;
    set((old) => ({ ...old, ...p, request }));
    return request;
  };
  React.useLayoutEffect(() => {
    let f,
      count = 0;
    const record = (p) => window.w2frames.push(window.sampleW2(p, s));
    record("commit");
    const tick = () => {
      record(`paint${++count}`);
      if (count < 24) f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  });
  const data = React.useMemo(
    () => [
      { name: "a", value: s.selected ? 80 : 20, x: 10, y: s.selected ? 70 : 20, z: 20 },
      { name: "b", value: s.selected ? 20 : 60, x: 50, y: s.selected ? 20 : 60, z: 60 },
      { name: "c", value: 40, x: 80, y: 40, z: 40 },
    ],
    [s.selected],
  );
  const cb = React.useMemo(
    () => ({
      onAnimationStart: () => window.w2events.push({ event: "start", time: performance.now() }),
      onAnimationEnd: () => window.w2events.push({ event: "end", time: performance.now() }),
    }),
    [],
  );
  let child;
  if (kind === "chart") {
    const Series = R[series];
    const chartProps = { data, width: 400, height: 240 };
    let graph;
    if (["Bar", "Line", "Area"].includes(series)) {
      const Chart = R[`${series}Chart`];
      graph = (
        <Chart {...chartProps}>
          <R.XAxis dataKey="name" />
          <R.YAxis domain={[0, 100]} />
          <Series dataKey="value" {...cb} />
        </Chart>
      );
    }
    if (series === "Scatter")
      graph = (
        <R.ScatterChart {...chartProps}>
          <R.XAxis dataKey="x" type="number" domain={[0, 100]} />
          <R.YAxis dataKey="y" type="number" domain={[0, 100]} />
          <R.Scatter data={data} {...cb} />
        </R.ScatterChart>
      );
    if (series === "Pie")
      graph = (
        <R.PieChart {...chartProps}>
          <R.Pie data={data} dataKey="value" {...cb} />
        </R.PieChart>
      );
    if (series === "Radar")
      graph = (
        <R.RadarChart {...chartProps}>
          <R.PolarAngleAxis dataKey="name" />
          <R.PolarRadiusAxis domain={[0, 100]} />
          <R.Radar dataKey="value" {...cb} />
        </R.RadarChart>
      );
    if (series === "RadialBar")
      graph = (
        <R.RadialBarChart {...chartProps}>
          <R.PolarAngleAxis type="number" domain={[0, 100]} />
          <R.RadialBar dataKey="value" {...cb} />
        </R.RadialBarChart>
      );
    if (series === "Funnel")
      graph = (
        <R.FunnelChart {...chartProps}>
          <R.Funnel data={data} dataKey="value" {...cb} />
        </R.FunnelChart>
      );
    child = (
      <div style={{ width: 400, height: 240 }}>
        <ChartContainer config={{ value: { label: "Value" } }} style={{ width: 400, height: 240 }}>
          {graph}
        </ChartContainer>
      </div>
    );
  }
  if (kind === "carousel")
    child = (
      <Carousel
        opts={{ loop: true }}
        setApi={(api) => {
          window.embla = api;
        }}
        style={{ width: 300 }}
      >
        <CarouselContent>
          {["a", "b", "c", "d", "e"].slice(0, s.count).map((i) => (
            <CarouselItem key={i}>
              <div>{i}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  if (kind === "entrance")
    child = (
      <div style={{ paddingTop: s.offscreen ? 1800 : 0 }}>
        <DocumentEntrance as={q.get("as") || "div"}>Entrance</DocumentEntrance>
      </div>
    );
  return (
    <CadenceProvider mode="none" timeScale={s.clock}>
      <CadenceProvider mode={s.mode} timeScale={s.explicit}>
        {s.mounted && child}
      </CadenceProvider>
    </CadenceProvider>
  );
}
const css = document.createElement("style");
css.textContent =
  "[data-slot=carousel-content]{overflow:hidden;width:300px}[data-slot=carousel-content]>div{display:flex}[data-slot=carousel-item]{flex:0 0 180px;width:180px;height:80px}";
document.head.append(css);
createRoot(document.getElementById("root")).render(<App />);
