import { frame } from "motion/react";
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { Toc } from "../../registry/cadence/toc";

const query = new URLSearchParams(location.search);
const items = [
  { id: "intro", title: "Introduction" },
  { id: "middle", title: "A wrapped middle section title" },
  { id: "end", title: "Final section" },
];
window.tocFrames = [];
window.afterTocUpdate = (callback) => frame.postRender(callback);
window.tocEvents = [];
window.addEventListener("hashchange", () => window.tocEvents.push({ type: "hash", hash: location.hash }));
window.addEventListener("focusin", (event) => window.tocEvents.push({ type: "focus", id: event.target.id }));
window.sampleToc = () => {
  const marker = document.querySelector("[data-slot=toc-indicator]");
  const track = document.querySelector("[data-slot=toc-track]");
  const active = document.querySelector("[aria-current=location]");
  const host = document.getElementById("host");
  return {
    time: performance.now(),
    scroll: host.scrollTop,
    left: host.scrollLeft,
    focus: document.activeElement?.id,
    marker: marker && {
      top: marker.getBoundingClientRect().top - track.getBoundingClientRect().top,
      height: marker.getBoundingClientRect().height,
      inline: marker.getAttribute("style"),
      transform: getComputedStyle(marker).transform,
    },
    active: active && { top: active.offsetTop, height: active.offsetHeight },
    drivers: (window.w2drivers || []).map(({ api, value, controls }) => ({
      api,
      numeric: typeof value === "number",
      value: typeof value === "number" ? controls?.time : value.get(),
      animating: typeof value === "number" ? controls?.state === "running" : value.isAnimating(),
      state: controls?.state,
    })),
  };
};
function App() {
  const [state, setState] = React.useState({
    mode: query.get("mode") || "full",
    clock: 1,
    active: "intro",
    mounted: true,
  });
  window.patchToc = (patch) => flushSync(() => setState((old) => ({ ...old, ...patch })));
  React.useEffect(() => {
    let frame;
    const tick = () => {
      window.tocFrames.push(window.sampleToc());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <>
      <CadenceProvider mode={state.mode} timeScale={state.clock}>
        {state.mounted && <Toc items={items} activeId={state.active} />}
      </CadenceProvider>
      <input id="input" aria-label="Input after navigation" />
      <div id="host" style={{ height: 240, width: 400, overflow: "auto", scrollPaddingTop: 10 }}>
        {items.map(({ id, title }) => (
          <section key={id} style={{ height: 700, width: 600 }}>
            <h2 id={id} tabIndex={id === "end" ? 0 : undefined} style={{ scrollMarginTop: 20 }}>
              {title}
            </h2>
          </section>
        ))}
      </div>
    </>
  );
}
const style = document.createElement("style");
style.textContent =
  "nav{width:140px}[data-slot=toc-track]{position:relative}[data-slot=toc-list]{list-style:none;padding:0;margin:0}[data-slot=toc-link]{display:block;position:relative;padding:7px} [data-slot=toc-rail]{position:absolute;left:0;top:0;bottom:0;width:1px;overflow:hidden}[data-slot=toc-indicator]{position:absolute;left:0;top:0;width:1px;height:1px;transform-origin:top;background:black}h2{margin:0}";
document.head.append(style);
createRoot(document.getElementById("root")).render(<App />);
