import React from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ControlDiv } from "../../registry/cadence/lib/control-animation";
import { useContinuousMotion, useStateColor } from "../../registry/cadence/lib/css-motion";
import { coordinateMotionTheme } from "../../registry/cadence/lib/motion-environment";
import { popupClasses, popupStyle } from "../../registry/cadence/lib/popup-style";
import { CadenceProvider, useCadenceMotion, withCadenceScope } from "../../registry/cadence/lib/provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../registry/cadence/select";
import { createToastManager, Toaster } from "../../registry/cadence/toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../registry/cadence/tooltip";

window.policyReactVersion = React.version;
window.policyLog = { refs: [], native: [], completions: [] };
function Paint({ id = "color", verified = true, svg = false }) {
  const ref = React.useRef(null);
  const cm = useCadenceMotion(ref);
  const color = useStateColor(
    ref,
    cm,
    svg ? ["fill", "stroke"] : ["background-color", "color", "border-bottom-color", "box-shadow"],
    { readability: verified ? "verified" : "immediate" },
  );
  const Tag = svg ? "svg" : "button";
  return (
    <Tag
      {...color}
      data-slot={id}
      data-paint={window.policyState.paint}
      className={`paint${window.policyState.classPaint ? " class-paint" : ""}`}
      aria-invalid={window.policyState.invalid || undefined}
      style={{ ...color.style, ...(id === "local" || svg ? { "--motion-source-duration-fast": "0.3s" } : {}) }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        window.policyLog.native.push(["down", e.pointerId]);
      }}
      onPointerUp={(e) => window.policyLog.native.push(["up", e.pointerId])}
      onLostPointerCapture={(e) => window.policyLog.native.push(["lost", e.pointerId])}
    >
      {svg ? <rect width="40" height="40" /> : "Current readable state"}
    </Tag>
  );
}
function Activity({ id = "loop", spin = false }) {
  const ref = React.useRef(null);
  const cm = useCadenceMotion(ref);
  const loop = useContinuousMotion(ref, cm, spin ? "spin" : "pulse", window.policyState.active);
  const Tag = spin ? "svg" : "div";
  return (
    <Tag
      {...loop}
      data-slot={id}
      className="activity"
      style={{ ...loop.style, opacity: window.policyState.dim ? 0.35 : 1 }}
      role="status"
    >
      {spin ? <circle cx="20" cy="20" r="15" /> : "Loading"}
    </Tag>
  );
}
function Combined() {
  const cm = useCadenceMotion();
  const external = React.useCallback((node) => {
    window.policyLog.combinedRefs ??= [];
    window.policyLog.combinedRefs.push(["attach", node?.tagName]);
    return () => window.policyLog.combinedRefs.push(["cleanup", node?.tagName]);
  }, []);
  const loop = useContinuousMotion(external, cm, "spin");
  const color = useStateColor(loop.ref, cm, ["fill", "stroke"]);
  return (
    <svg {...color} data-slot="combined" className="activity paint" data-paint={window.policyState.paint} role="status">
      <circle cx="20" cy="20" r="15" />
    </svg>
  );
}
function Controls() {
  const cm = useCadenceMotion();
  const target = window.policyState.target;
  const transition = cm.reduced
    ? { duration: 0, delay: 0 }
    : cm.transition("data.transition", { delay: window.policyState.delay });
  const press = cm.transition("feedback.press");
  return (
    <>
      <ControlDiv
        data-slot="finite"
        data-motion={cm.mode}
        target={{ x: target, opacity: window.policyState.fade }}
        transition={transition}
        onAnimationComplete={() => {
          window.policyLog.completions.push(["finite", window.policyState.target, window.policyState.mode]);
        }}
      >
        Finite
      </ControlDiv>
      <ControlDiv
        data-slot="press"
        data-motion={cm.mode}
        target={{ scale: cm.reduced ? 1 : window.policyState.pressed ? cm.scope.tokens.scale.press : 1 }}
        transition={press}
      >
        Held pose
      </ControlDiv>
      <ControlDiv
        data-slot="physics"
        data-motion={cm.mode}
        target={{ x: window.policyState.target }}
        transition={
          cm.reduced
            ? { duration: 0, delay: 0 }
            : cm.transition("layout.move", { delay: window.policyState.physicsDelay ?? 0 })
        }
        onAnimationComplete={() => {
          window.policyLog.completions.push(["physics", window.policyState.target, window.policyState.mode]);
          const next = window.policyNextPhysics;
          if (next !== undefined) {
            window.policyNextPhysics = undefined;
            window.policyPatch({ mode: "full", clock: 8, target: next });
          }
        }}
      >
        Physics
      </ControlDiv>
      <div
        data-slot="css-popup"
        data-motion={cm.mode}
        data-starting-style={window.policyState.starting ? "" : undefined}
        className={popupClasses(
          cm,
          "css-popup transition-[opacity,scale] duration-(--motion-duration-base) ease-cadence-out data-[starting-style]:opacity-0",
          undefined,
        )}
        style={popupStyle(cm, undefined)}
      >
        CSS popup
      </div>
    </>
  );
}
function NativeIntent() {
  const [manager] = React.useState(createToastManager);
  React.useLayoutEffect(() => {
    window.policyAddToast = () => {
      const start = performance.now();
      manager.add({
        title: "Native lifetime",
        timeout: 600,
        onClose: () => {
          window.policyLog.toastClose = performance.now() - start;
        },
      });
    };
  }, [manager]);
  return (
    <>
      <TooltipProvider delay={180} closeDelay={0}>
        <Tooltip
          onOpenChange={(open) => {
            if (open) window.policyLog.intentElapsed = performance.now() - window.policyLog.intentStart;
          }}
        >
          <TooltipTrigger
            onPointerEnter={() => {
              window.policyLog.intentStart = performance.now();
            }}
          >
            Native intent
          </TooltipTrigger>
          <TooltipContent>Native delay</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Toaster toastManager={manager} timeout={600} />
    </>
  );
}
function NativeSelection() {
  return (
    <section data-select-owner="">
      <Select defaultValue="a">
        <SelectTrigger aria-label="Policy selection">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="a">Short</SelectItem>
          <SelectItem value="b">Long selected label</SelectItem>
        </SelectContent>
      </Select>
    </section>
  );
}
function Gate({ binding, id, svg = false }) {
  const [value, set] = React.useState({ open: false, type: svg ? "svg" : "div" });
  React.useLayoutEffect(() => {
    window.policyGates ??= {};
    window.policyGates[id] = (patch) => flushSync(() => set((s) => ({ ...s, ...patch })));
    return () => delete window.policyGates[id];
  }, [id]);
  return value.open
    ? createPortal(
        React.createElement(
          value.type,
          { ...binding, "data-slot": id, className: "activity" },
          value.type === "svg" ? <circle cx="20" cy="20" r="15" /> : "Delayed portal",
        ),
        document.body,
      )
    : null;
}
function DelayedOwners() {
  const cm = useCadenceMotion();
  const callback = React.useCallback((node) => {
    window.policyLog.refs.push(["attach", node?.tagName]);
    return () => window.policyLog.refs.push(["cleanup", node?.tagName]);
  }, []);
  const loop = useContinuousMotion(callback, cm, "pulse");
  const color = useStateColor(undefined, cm, ["fill", "stroke"]);
  return (
    <>
      <Gate binding={loop} id="delayed-loop" />
      <Gate binding={color} id="delayed-color" svg />
    </>
  );
}
function LocalScope() {
  const ref = React.useRef(null);
  const cm = useCadenceMotion(ref);
  return (
    <div ref={ref} style={{ "--motion-source-duration-fast": "0.4s" }}>
      {withCadenceScope(cm, <DelayedOwners />)}
    </div>
  );
}
function App() {
  const [state, set] = React.useState(window.policyState);
  window.policyPatch = (patch) => flushSync(() => set((s) => (window.policyState = { ...s, ...patch })));
  window.policyTheme = () => coordinateMotionTheme(document, () => document.documentElement.classList.toggle("dark"));
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      <main>
        {state.mounted && (
          <>
            <Paint />
            <Paint id="unverified" verified={false} />
            <Paint id="local" />
            <Paint id="svg-color" svg />
            <Activity />
            <Activity id="spinner-owner" spin />
            <Combined />
            <Controls />
            <LocalScope />
            <input data-native-input defaultValue="Native editing" />
            <NativeIntent />
            <NativeSelection />
            <CadenceProvider mode={state.innerMode} timeScale={state.innerClock}>
              <Paint id="nested" />
              <Activity id="nested-loop" />
            </CadenceProvider>
          </>
        )}
      </main>
    </CadenceProvider>
  );
}
window.policyState = {
  mode: "full",
  clock: 1,
  innerMode: "full",
  innerClock: 1,
  target: 0,
  fade: 1,
  pressed: false,
  paint: false,
  invalid: false,
  active: true,
  dim: false,
  delay: 0,
  starting: false,
  mounted: true,
  ...window.policyInitial,
};
const root = createRoot(document.getElementById("root"));
root.render(
  window.policyStrict ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  ),
);
window.policyUnmount = () => flushSync(() => root.unmount());
