import React from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
import { captureHandoffOrigin, createCapturedHandoff } from "../../registry/cadence/lib/captured-handoff";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../registry/cadence/select";

const initial = {
  mode: "full",
  clock: 8,
  value: "AAA",
  reject: false,
  delay: false,
  mounted: true,
  rich: false,
  key: 0,
};
function Pilot({ state, set }) {
  const cm = useCadenceMotion();
  React.useLayoutEffect(() => {
    window.handoffCM = cm;
    window.handoffReady = true;
  });
  return (
    <form id="native-form">
      <label htmlFor="native-editor">Editor</label>
      <input id="native-editor" name="draft" defaultValue="saved" />
      {state.mounted && (
        <Select
          key={state.key}
          name="choice"
          value={state.object ? { key: state.value, label: state.value } : state.value}
          isItemEqualToValue={state.object ? (a, b) => a.key === b.key : undefined}
          itemToStringValue={state.object ? (value) => value.key : undefined}
          modal={false}
          onValueChange={(value, details) => {
            window.handoffRequests++;
            if (state.reject) details.cancel();
            else if (state.delay) window.handoffPending = state.object ? value.label : value;
            else set((old) => ({ ...old, value: state.object ? value.label : value }));
          }}
        >
          <SelectTrigger aria-label="Pilot" className="font-mono" style={{ width: 200 }}>
            <SelectValue>{state.object ? (value) => value?.label : undefined}</SelectValue>
          </SelectTrigger>
          <SelectContent className="font-mono" alignItemWithTrigger={false}>
            <SelectItem value={state.object ? { key: "AAA", label: "AAA" } : "AAA"}>AAA</SelectItem>
            <SelectItem value={state.object ? { key: "BBB", label: "BBB" } : "BBB"}>
              {state.rich ? <b>BBB</b> : "BBB"}
            </SelectItem>
            <SelectItem value="AAB">AAB</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Select defaultValue="AAA" modal={false}>
        <SelectTrigger aria-label="Independent" className="font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="font-mono" alignItemWithTrigger={false}>
          <SelectItem value="AAA">AAA</SelectItem>
          <SelectItem value="BBB">BBB</SelectItem>
        </SelectContent>
      </Select>
    </form>
  );
}
export function App() {
  const [state, set] = React.useState(initial);
  if (typeof window !== "undefined") {
    window.handoffRequests ??= 0;
    window.handoffUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.handoffReset = () => flushSync(() => set({ ...initial, key: Date.now() }));
  }
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      <Pilot state={state} set={set} />
      <div id="direct" />
      <div style={{ height: 900 }} />
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  const root = document.getElementById("root");
  if (window.handoffSSR)
    hydrateRoot(
      root,
      window.handoffStrict ? (
        <React.StrictMode>
          <App />
        </React.StrictMode>
      ) : (
        <App />
      ),
    );
  else createRoot(root).render(<App />);
  window.handoffReact = React.version;
  window.captureDisposalIsolation = () => {
    const frame = document.createElement("iframe");
    frame.style.cssText = "width:600px;height:400px";
    document.body.append(frame);
    const doc = frame.contentDocument,
      source = doc.createElement("span");
    source.textContent = "BBB";
    source.style.cssText = "position:absolute;left:30px;top:20px";
    doc.body.append(source);
    const listeners = new Set(),
      add = doc.addEventListener.bind(doc),
      remove = doc.removeEventListener.bind(doc);
    doc.addEventListener = (type, listener, ...rest) => {
      if (type === "visibilitychange") listeners.add(listener);
      return add(type, listener, ...rest);
    };
    doc.removeEventListener = (type, listener, ...rest) => {
      if (type === "visibilitychange") listeners.delete(listener);
      return remove(type, listener, ...rest);
    };
    const old = captureHandoffOrigin(source, "BBB");
    if (!old) throw new Error("Fresh isolated source is required");
    old.dispose();
    const next = captureHandoffOrigin(source, "BBB");
    if (!next) throw new Error("Fresh second source is required");
    old.dispose();
    const afterRepeatedDispose = listeners.size;
    const other = captureHandoffOrigin(source, "BBB");
    const afterNewCapture = listeners.size;
    next.dispose();
    other?.dispose();
    const afterCleanup = listeners.size;
    frame.remove();
    return { afterRepeatedDispose, afterNewCapture, afterCleanup };
  };
  let dispose;
  window.directSetup = (options = {}) => {
    dispose?.();
    const container = document.getElementById("direct");
    container.replaceChildren();
    const outer = document.createElement("div"),
      frame = document.createElement("div"),
      source = document.createElement("span"),
      dest = document.createElement("span");
    outer.style.cssText = "width:520px;height:240px;overflow:auto;position:relative;margin-top:20px";
    frame.style.cssText = "width:500px;height:400px;position:relative";
    source.style.cssText =
      "position:absolute;left:30px;top:20px;width:100px;height:20px;display:block;font:16px monospace";
    dest.style.cssText =
      "position:absolute;left:220px;top:160px;width:100px;height:20px;display:block;font:16px monospace";
    if (options.coincident) {
      source.style.left = "220px";
      source.style.top = "160px";
    }
    source.textContent = "BBB";
    dest.textContent = "AAA";
    frame.append(source, dest);
    outer.append(frame);
    container.append(outer);
    const tx = createMotionTransaction(),
      owner = createCapturedHandoff(tx),
      events = [];
    let live = true,
      sourceReads = 0,
      destReads = 0;
    const original = source.getBoundingClientRect.bind(source);
    source.getBoundingClientRect = () => {
      sourceReads++;
      return original();
    };
    const originalDest = dest.getBoundingClientRect.bind(dest);
    dest.getBoundingClientRect = () => {
      destReads++;
      return originalDest();
    };
    if (options.hidden) source.hidden = true;
    if (options.editable) frame.contentEditable = "plaintext-only";
    if (options.unsafe) source.innerHTML = '<label for="native-editor"><input name="ghost" value="bad" />BBB</label>';
    const capture = captureHandoffOrigin(source, "BBB", options.local ? frame : null);
    if (options.disposed) capture?.dispose();
    if (options.hidden) source.hidden = false;
    if (options.retire) source.remove();
    let prior;
    if (options.work) {
      prior = tx.register({});
      prior.begin(
        tx.revision("content", 1, {}),
        ["transform"],
        { collectionVisuals: new Set(Array.from({ length: options.work }, () => ({}))) },
        () => events.push("prior-cancel"),
      );
    }
    dest.textContent = "BBB";
    const revision = tx.revision("value", 1, dest);
    const settings = {
      revision,
      capture,
      destination: dest,
      transition: window.handoffCM.transition("handoff"),
      immediate: window.handoffCM.reduced,
      sourceRetired: Boolean(options.retire),
      current: () => live,
      fallback: () => events.push("fallback"),
      terminal: (reason) => events.push(reason),
      slot: "direct-handoff",
    };
    const commit = (patch) => owner.commit({ ...settings, ...patch });
    const sample = () => {
      const paint = document.querySelector("[data-cadence-handoff-paint]");
      return {
        events: [...events],
        sourceReads,
        destReads,
        paint: Boolean(paint),
        transform: paint ? getComputedStyle(paint).transform : null,
        opacity: getComputedStyle(dest).opacity,
        extent: [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
          outer.scrollWidth,
          outer.scrollHeight,
        ],
        ids: [...document.querySelectorAll("[id]")].map((n) => n.id),
        fields: [...new FormData(document.getElementById("native-form"))],
        decoration: paint
          ? {
              text: paint.textContent,
              children: paint.childElementCount,
              layerChildren: paint.parentElement.childElementCount,
              inert: paint.parentElement.inert,
              hidden: paint.parentElement.getAttribute("aria-hidden"),
              ids: paint.parentElement.querySelectorAll("[id],[name],input,button,label,a,video,img").length,
            }
          : null,
      };
    };
    let other;
    const startOther = () => {
      const source2 = document.createElement("span"),
        dest2 = document.createElement("span");
      source2.style.cssText = source.style.cssText;
      dest2.style.cssText = dest.style.cssText;
      source2.style.top = "60px";
      dest2.style.top = "200px";
      source2.textContent = "CCC";
      dest2.textContent = "CCC";
      frame.append(source2, dest2);
      const capture2 = captureHandoffOrigin(source2, "CCC");
      const owner2 = createCapturedHandoff(tx);
      owner2.commit({
        ...settings,
        capture: capture2,
        destination: dest2,
        revision: tx.revision("value", 1, dest2),
        terminal: (reason) => events.push(`other-${reason}`),
      });
      other = { owner: owner2, source: source2, dest: dest2, capture: capture2 };
      return Boolean(document.querySelectorAll("[data-cadence-handoff-paint]").length === 2);
    };
    const before = sample();
    window.direct = {
      startOther,
      source,
      dest,
      frame,
      outer,
      capture,
      tx,
      owner,
      settings,
      events,
      commit,
      sample,
      cancel: () => owner.cancel(),
      retire: () => source.remove(),
      invalidate: () => {
        live = false;
        owner.cancel();
      },
    };
    commit();
    dispose = () => {
      other?.owner.dispose();
      other?.capture?.dispose();
      owner.dispose();
      capture?.dispose();
      prior?.dispose();
      live = false;
      dest.remove();
      source.remove();
      outer.remove();
    };
    return { before, after: sample() };
  };
}
