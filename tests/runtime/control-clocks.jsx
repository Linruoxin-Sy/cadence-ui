import { visualElementStore } from "motion/react";
import { StrictMode, useLayoutEffect, useState, version } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { ControlSpan } from "../../registry/cadence/lib/control-animation";
import { bindMotionParameters, contentSwitch, layoutReflow } from "../../registry/cadence/lib/motion";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";

function Probe({ state, id }) {
  const cm = useCadenceMotion();
  const p = cm.parameters(bindMotionParameters(contentSwitch, "data.transition/directional-content"));
  const target = { x: cm.reduced ? 0 : state.changed ? p.distance : 0, opacity: state.changed ? 1 : 0 };
  return (
    <ControlSpan
      id={id}
      tabIndex={0}
      data-motion={cm.mode}
      target={target}
      transition={{ ...p.spatial, opacity: p.opacity }}
    >
      Native content
    </ControlSpan>
  );
}

function App() {
  const [state, set] = useState({
    mode: window.clockMode,
    childMode: undefined,
    changed: false,
    timeScale: 3,
    mounted: true,
  });
  useLayoutEffect(() => {
    window.clockUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.clockReact = version;
  }, []);
  return (
    <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
      <button id="commit" type="button" onClick={() => set((old) => ({ ...old, changed: !old.changed }))}>
        Commit
      </button>
      {state.mounted && (
        <>
          <Probe id="clock-local" state={state} />
          <SpringProbe state={state} />
          <CadenceProvider mode={state.childMode}>
            <Probe id="clock-nested" state={state} />
          </CadenceProvider>
        </>
      )}
    </CadenceProvider>
  );
}
function SpringProbe({ state }) {
  const cm = useCadenceMotion();
  const p = cm.parameters(bindMotionParameters(layoutReflow, "layout.move/position"));
  return (
    <ControlSpan
      id="clock-spring"
      data-motion={cm.mode}
      target={{ x: cm.reduced ? 0 : state.changed ? 80 : 0 }}
      transition={{ duration: 0, x: { ...p.transition, delay: p.transition.duration === 0 ? 0 : 0.5 } }}
    >
      Spring
    </ControlSpan>
  );
}
window.clockSnapshot = (id) => {
  const node = document.getElementById(id),
    visual = visualElementStore.get(node);
  return {
    mode: node.dataset.motion,
    values: Object.fromEntries(
      ["x", "opacity"].map((key) => [
        key,
        { value: visual?.getValue(key)?.get(), active: visual?.getValue(key)?.isAnimating() },
      ]),
    ),
    transform: getComputedStyle(node).transform,
    opacity: getComputedStyle(node).opacity,
    handles: node.getAnimations().map((handle) => ({ state: handle.playState, frames: handle.effect?.getKeyframes() })),
  };
};
window.clockRoot = createRoot(document.getElementById("root"));
window.clockRoot.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
