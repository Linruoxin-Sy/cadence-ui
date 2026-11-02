import React from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../registry/cadence/button";
import { Checkbox } from "../../registry/cadence/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../registry/cadence/input-otp";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { Progress, ProgressIndicator, ProgressTrack } from "../../registry/cadence/progress";
import { RadioGroup, RadioGroupItem } from "../../registry/cadence/radio-group";
import { Slider } from "../../registry/cadence/slider";
import { Switch } from "../../registry/cadence/switch";
import { Toggle } from "../../registry/cadence/toggle";
import { ToggleGroup, ToggleGroupItem } from "../../registry/cadence/toggle-group";

const params = new URLSearchParams(location.search);
const ids = new WeakMap();
let nextId = 0;
window.controlFrames = [];
window.refEvents = [];
window.controlNodes = [];
window.sampleControls = (phase) => {
  const nodes = [...document.querySelectorAll("[data-probe]")];
  if (nodes.length) window.controlNodes = nodes;
  return {
    phase,
    time: performance.now(),
    parts: (nodes.length ? nodes : window.controlNodes).map((node) => {
      if (!ids.has(node)) ids.set(node, ++nextId);
      // Keep button identity/focus assertions on the native host; its press now animates content only.
      const motionNode =
        node.dataset.probe === "group" ? node.querySelector('[data-slot="press-button-content"]') : node;
      if (!motionNode) throw Error("Missing press content");
      const css = getComputedStyle(motionNode);
      const matrix = css.transform === "none" ? new DOMMatrix() : new DOMMatrix(css.transform);
      return {
        id: ids.get(node),
        probe: node.dataset.probe,
        connected: node.isConnected,
        tag: node.tagName,
        slot: node.dataset.slot,
        mode: node.dataset.motion,
        text: node.textContent,
        opacity: Number(css.opacity),
        scale: matrix.a,
        x: matrix.e,
        transform: css.transform,
        inline: motionNode.getAttribute("style"),
        width: node.clientWidth,
        parentWidth: node.parentElement?.clientWidth,
        checked: node.getAttribute("aria-checked"),
        value: node.getAttribute("aria-valuenow"),
        focus: document.activeElement === node,
        animations: motionNode.getAnimations().map((a) => ({
          state: a.playState,
          time: a.currentTime,
          timing: (() => {
            const t = a.effect?.getComputedTiming();
            return (
              t && {
                duration: t.duration,
                delay: t.delay,
                progress: t.progress,
                localTime: t.localTime,
                endTime: t.endTime,
              }
            );
          })(),
          keyframes: a.effect?.getKeyframes(),
        })),
      };
    }),
  };
};
const buttonRef = (node) => {
  window.refEvents.push({ phase: "attach", node: !!node });
  return () => window.refEvents.push({ phase: "cleanup" });
};
function App() {
  const [s, set] = React.useState({
    mode: params.get("mode") || "full",
    clock: 8,
    explicit: undefined,
    checked: false,
    value: 20,
    char: "",
    disabled: false,
    width: 48,
    mounted: true,
    unrelated: 0,
  });
  window.updateControls = (patch) => set((old) => ({ ...old, ...patch }));
  React.useLayoutEffect(() => {
    const record = (phase) => window.controlFrames.push({ ...window.sampleControls(phase), state: s });
    record("commit");
    let frame;
    let count = 0;
    const tick = () => {
      record(`paint${++count}`);
      if (count < 24) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });
  return (
    <CadenceProvider mode="none" timeScale={s.clock}>
      <CadenceProvider mode={s.mode} timeScale={s.explicit}>
        {s.mounted && (
          <>
            <Button ref={buttonRef} data-probe="button" disabled={s.disabled}>
              Press
            </Button>
            <Button data-probe="focusable" disabled={s.disabled} focusableWhenDisabled>
              Focusable
            </Button>
            <Toggle data-probe="toggle" disabled={s.disabled}>
              Toggle
            </Toggle>
            <ToggleGroup disabled={s.disabled}>
              <ToggleGroupItem data-probe="group" value="a">
                Group
              </ToggleGroupItem>
            </ToggleGroup>
            <Checkbox aria-label="Check" checked={s.checked} />
            <RadioGroup value={s.checked ? "a" : "b"}>
              <RadioGroupItem value="a" aria-label="A" />
              <RadioGroupItem value="b" aria-label="B" />
            </RadioGroup>
            <Switch checked={s.checked} style={{ width: s.width, height: 24 }} />
            <Progress value={s.value} data-testid="default" />
            <Progress value={s.value} data-testid="composed">
              <ProgressTrack>
                <ProgressIndicator data-probe="composed" />
              </ProgressTrack>
            </Progress>
            <Slider
              aria-label="Drag"
              className={(state) => {
                window.sliderState = state;
                return undefined;
              }}
              value={s.value}
              onValueChange={(value) => set((old) => ({ ...old, value }))}
              disabled={s.disabled}
              style={{ width: 300, height: 24 }}
            />
            <InputOTP maxLength={1} value={s.char} onChange={(char) => set((old) => ({ ...old, char }))}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
              </InputOTPGroup>
            </InputOTP>
          </>
        )}
      </CadenceProvider>
    </CadenceProvider>
  );
}
// Real host selectors: no provider/root/static SVG can satisfy these probes.
const mark = () => {
  for (const [selector, name] of [
    ["[data-slot=checkbox-indicator]", "checkbox"],
    ["[data-slot=radio-group-item][aria-label=A] [data-slot=radio-group-indicator]", "radio-a"],
    ["[data-slot=radio-group-item][aria-label=B] [data-slot=radio-group-indicator]", "radio-b"],
    ["[data-slot=switch-thumb]", "switch"],
    ["[data-testid=default] [data-slot=progress-indicator]", "progress"],
    [
      "[data-testid=composed] > [data-slot=progress-track]:nth-child(2) [data-slot=progress-indicator]",
      "composed-default",
    ],
    ["[data-slot=slider-thumb]", "slider"],
    ["[data-slot=input-otp-slot] > span", "otp"],
  ])
    document.querySelector(selector)?.setAttribute("data-probe", name);
};
new MutationObserver(() => {
  mark();
}).observe(document.getElementById("root"), { childList: true, subtree: true });
const css = document.createElement("style");
css.textContent =
  "[data-slot=switch-thumb]{display:block;width:16px;height:16px}[data-slot=switch]{padding:0;border:0;display:block}[data-slot=slider] > div{position:relative;width:300px;height:24px}[data-slot=slider-track]{width:300px;height:6px}[data-slot=slider-thumb]{width:16px;height:16px}[data-slot=progress-track]{width:300px;height:8px}[data-slot=progress-indicator]{height:8px;transform-origin:left}button{margin:5px}";
document.head.append(css);
createRoot(document.getElementById("root")).render(<App />);
