import React from "react";
import { createRoot } from "react-dom/client";
import { Calendar } from "../../registry/cadence/calendar";
import * as K from "../../registry/cadence/code-block";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import * as S from "../../registry/cadence/select";
import { Sidebar, SidebarContent, SidebarProvider } from "../../registry/cadence/sidebar";
import * as T from "../../registry/cadence/tabs";

const q = new URLSearchParams(location.search),
  kind = q.get("kind") || "select";
const ids = new WeakMap();
let next = 0,
  request = 0;
window.w2frames = [];
window.w2nodes = [];
const selectors = {
  select: "[data-slot=select-value], [data-slot=select-handoff]",
  code: "[data-slot=code-block-viewport], [data-slot=code-block-actions], [data-slot=code-block-copy-button] span[data-motion], [data-slot=code-block-expand-button] span[data-motion], [data-slot=code-block-tab-indicator]",
  sidebar: "[data-slot=sidebar-container]",
  calendar: "[data-slot=calendar-month-grid]",
  tabs: "[data-slot=tabs-indicator]",
};
window.sampleW2 = (phase, state) => {
  const live = [...document.querySelectorAll(selectors[kind])];
  if (live.length) window.w2nodes = live;
  return {
    drivers: [...new Set((window.w2drivers || []).map((d) => d.value))].map((value) => ({
      value: value.get(),
      animating: value.isAnimating(),
    })),
    phase,
    request: state?.request ?? request,
    state,
    time: performance.now(),
    parts: (live.length ? live : window.w2nodes).map((n) => {
      if (!ids.has(n)) ids.set(n, ++next);
      const css = getComputedStyle(n),
        m = new DOMMatrix(css.transform === "none" ? undefined : css.transform),
        r = n.getBoundingClientRect();
      return {
        id: ids.get(n),
        slot: n.dataset.slot,
        connected: n.isConnected,
        html: n.outerHTML,
        inline: n.getAttribute("style"),
        mode: n.dataset.motion,
        opacity: +css.opacity,
        scale: m.a,
        x: m.e,
        y: m.f,
        transform: css.transform,
        width: r.width,
        left: r.left,
        top: r.top,
        layoutWidth: n.offsetWidth,
        parentWidth: n.parentElement?.clientWidth,
        parentLayoutWidth: n.parentElement?.offsetWidth,
        height: r.height,
        naturalWidth: n.firstElementChild?.scrollWidth,
        naturalHeight: n.firstElementChild?.scrollHeight,
        animations: n.getAnimations().map((a) => ({
          state: a.playState,
          time: a.currentTime,
          timing: a.effect.getComputedTiming(),
          frames: a.effect.getKeyframes(),
        })),
      };
    }),
  };
};
function App() {
  const [s, set] = React.useState({
    request: 0,
    mode: q.get("mode") || "full",
    clock: 8,
    explicit: undefined,
    selected: false,
    mounted: true,
    open: false,
    width: 300,
    lines: 15,
  });
  window.updateW2 = (patch) => {
    request++;
    set((old) => ({ ...old, ...patch, request }));
    return request;
  };
  React.useLayoutEffect(() => {
    const record = (phase) => window.w2frames.push(window.sampleW2(phase, s));
    record("commit");
    let f,
      count = 0;
    const tick = () => {
      record(`paint${++count}`);
      if (count < 24) f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  });
  let content;
  if (kind === "select")
    content = (
      <S.Select
        value={s.selected ? "a" : "b"}
        open={s.open}
        onValueChange={(v) => set((old) => ({ ...old, selected: v === "a" }))}
      >
        <S.SelectTrigger>
          <S.SelectValue />
        </S.SelectTrigger>
        <S.SelectContent>
          <S.SelectGroup>
            <S.SelectItem value="a">A long Framework label</S.SelectItem>
            <S.SelectItem value="b">B</S.SelectItem>
          </S.SelectGroup>
        </S.SelectContent>
      </S.Select>
    );
  if (kind === "code")
    content = (
      <K.CodeBlock maxLines={3} expanded={s.selected} tab={s.selected ? "b" : "a"} style={{ width: s.width }}>
        <K.CodeBlockTabs>
          <K.CodeBlockTab value="a">A</K.CodeBlockTab>
          <K.CodeBlockTab value="b" style={{ width: s.width }}>
            Another tab
          </K.CodeBlockTab>
        </K.CodeBlockTabs>
        <K.CodeBlockActions>
          <K.CodeBlockCopyButton value={s.selected ? "second" : "first"} />
        </K.CodeBlockActions>
        <K.CodeBlockContent style={{ lineHeight: "20px", padding: "12px" }}>
          {Array.from({ length: s.lines }, (_, i) => `Line ${i}`).join("\n")}
        </K.CodeBlockContent>
        <K.CodeBlockExpandButton />
      </K.CodeBlock>
    );
  if (kind === "tabs")
    content = (
      <T.Tabs value={s.selected ? "b" : "a"}>
        <T.TabsList>
          <T.TabsTrigger value="a">A</T.TabsTrigger>
          <T.TabsTrigger value="b" style={{ width: s.width }}>
            Another tab
          </T.TabsTrigger>
        </T.TabsList>
      </T.Tabs>
    );
  if (kind === "sidebar")
    content = (
      <SidebarProvider open={!s.selected}>
        <Sidebar>
          <SidebarContent>Sidebar</SidebarContent>
        </Sidebar>
      </SidebarProvider>
    );
  if (kind === "calendar") content = <Calendar month={new Date(2026, s.selected ? 10 : 9, 1)} />;
  return (
    <CadenceProvider mode="none" timeScale={s.clock}>
      <CadenceProvider mode={s.mode} timeScale={s.explicit}>
        {s.mounted && content}
      </CadenceProvider>
    </CadenceProvider>
  );
}
const css = document.createElement("style");
css.textContent =
  "[data-slot=select-trigger]{display:inline-flex;position:relative}[data-slot=select-trigger]>svg{position:absolute;right:0}[data-slot=select-value]{flex:none}[data-slot=select-value]{display:block;overflow:hidden;white-space:nowrap}[data-slot=select-value]>span{display:block;width:max-content}[data-slot=code-block-viewport]{overflow:hidden}[data-slot=code-block-tabs],[data-slot=tabs-list]{display:flex;position:relative;width:500px}[data-slot=code-block-tab],[data-slot=tabs-trigger]{position:relative;flex-shrink:0;width:150px;height:32px}[data-slot$=tab-indicator],[data-slot=tabs-indicator]{position:absolute;inset:0}[data-slot=sidebar-container]{width:250px;position:fixed;left:0;top:0}";
document.head.append(css);
createRoot(document.getElementById("root")).render(<App />);
