import React from "react";
import { createRoot } from "react-dom/client";
import * as B from "../../registry/cadence/combobox";
import * as C from "../../registry/cadence/context-menu";
import * as D from "../../registry/cadence/dropdown-menu";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import * as S from "../../registry/cadence/select";

const query = new URLSearchParams(location.search),
  kind = query.get("kind") || "dropdown";
const ids = new WeakMap();
let next = 0,
  request = 0;
window.w2frames = [];
window.w2nodes = [];
const selector =
  kind === "dropdown"
    ? '[data-slot$="item-indicator"] > span[data-motion]'
    : kind === "context"
      ? '[data-slot$="item-indicator"] > span[data-motion]'
      : `[data-slot="${kind}-item-indicator"]`;
window.sampleW2 = (phase, state) => {
  const live = [...document.querySelectorAll(selector)];
  if (live.length) window.w2nodes = live;
  return {
    phase,
    request: state?.request ?? request,
    state,
    time: performance.now(),
    parts: (live.length ? live : window.w2nodes).map((n) => {
      if (!ids.has(n)) ids.set(n, ++next);
      const css = getComputedStyle(n),
        m = new DOMMatrix(css.transform === "none" ? undefined : css.transform);
      return {
        id: ids.get(n),
        connected: n.isConnected,
        html: n.outerHTML,
        inline: n.getAttribute("style"),
        mode: n.dataset.motion,
        opacity: +css.opacity,
        scale: m.a,
        transform: css.transform,
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
window.w2insertions = [];
const seen = new WeakSet();
new MutationObserver(() => {
  for (const n of document.querySelectorAll(selector)) {
    if (seen.has(n)) continue;
    seen.add(n);
    const record = (phase) => window.w2insertions.push({ ...window.sampleW2(phase), node: n.outerHTML });
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
    mode: query.get("mode") || "full",
    clock: 8,
    explicit: undefined,
    selected: false,
    mounted: true,
    open: true,
  });
  window.updateW2 = (patch) => {
    request++;
    set((old) => ({ ...old, ...patch, request }));
    return request;
  };
  React.useLayoutEffect(() => {
    const record = (phase) => window.w2frames.push(window.sampleW2(phase, s));
    record("commit");
    let frame,
      count = 0;
    const tick = () => {
      record(`paint${++count}`);
      if (count < 24) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });
  let content;
  if (kind === "dropdown")
    content = (
      <D.DropdownMenu open={s.open}>
        <D.DropdownMenuTrigger>Dropdown</D.DropdownMenuTrigger>
        <D.DropdownMenuContent>
          <D.DropdownMenuCheckboxItem checked={s.selected}>Check</D.DropdownMenuCheckboxItem>
          <D.DropdownMenuRadioGroup value={s.selected ? "a" : "b"}>
            <D.DropdownMenuRadioItem value="a">A</D.DropdownMenuRadioItem>
            <D.DropdownMenuRadioItem value="b">B</D.DropdownMenuRadioItem>
          </D.DropdownMenuRadioGroup>
        </D.DropdownMenuContent>
      </D.DropdownMenu>
    );
  if (kind === "context")
    content = (
      <C.ContextMenu open={s.open}>
        <C.ContextMenuTrigger>Context</C.ContextMenuTrigger>
        <C.ContextMenuContent>
          <C.ContextMenuCheckboxItem checked={s.selected}>Check</C.ContextMenuCheckboxItem>
          <C.ContextMenuRadioGroup value={s.selected ? "a" : "b"}>
            <C.ContextMenuRadioItem value="a">A</C.ContextMenuRadioItem>
            <C.ContextMenuRadioItem value="b">B</C.ContextMenuRadioItem>
          </C.ContextMenuRadioGroup>
        </C.ContextMenuContent>
      </C.ContextMenu>
    );
  if (kind === "select")
    content = (
      <S.Select open={s.open} value={s.selected ? "a" : "b"}>
        <S.SelectTrigger>
          <S.SelectValue />
        </S.SelectTrigger>
        <S.SelectContent>
          <S.SelectGroup>
            <S.SelectItem value="a">A long Framework</S.SelectItem>
            <S.SelectItem value="b">B</S.SelectItem>
          </S.SelectGroup>
        </S.SelectContent>
      </S.Select>
    );
  if (kind === "combobox")
    content = (
      <B.Combobox open={s.open} items={["a", "b"]} value={s.selected ? "a" : "b"}>
        <B.ComboboxInput aria-label="Framework" />
        <B.ComboboxContent>
          <B.ComboboxList>
            {(item) => (
              <B.ComboboxItem key={item} value={item}>
                {item}
              </B.ComboboxItem>
            )}
          </B.ComboboxList>
        </B.ComboboxContent>
      </B.Combobox>
    );
  return (
    <CadenceProvider mode="none" timeScale={s.clock}>
      <CadenceProvider mode={s.mode} timeScale={s.explicit}>
        {s.mounted && content}
      </CadenceProvider>
    </CadenceProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
