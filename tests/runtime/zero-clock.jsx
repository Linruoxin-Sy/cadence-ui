import { animate, frame, motion, motionValue } from "motion/react";
import React from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../../registry/cadence/button";
import { physicalSpring } from "../../registry/cadence/lib/motion";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";

const recipes = [
  "reveal",
  "enter.pop",
  "exit.fade",
  "exit.shrink",
  "popup.anchored",
  "layout.move",
  "layout.shared",
  "list.stagger",
  "gesture.drag",
  "scroll.progress",
  "scroll.story",
  "text.reveal",
  "text.split",
  "number.roll",
  "data.transition",
  "state.morph",
  "geometry.resize",
  "handoff",
  "feedback.press",
];
window.clockSamples = [];
window.clockStarts = 0;
const useCommittedEffect = React.useLayoutEffect;
function Probe({ state }) {
  const cm = useCadenceMotion();
  const x = React.useMemo(() => motionValue(0), []);
  const transition = state.direct
    ? physicalSpring(state.clock)
    : cm.transition(state.recipe, { delay: 0.3, ...(state.override === null ? {} : { timeScale: state.override }) });
  const signature = JSON.stringify([transition, state.target]);
  // Value signature intentionally prevents unrelated renders from restarting Motion.
  useCommittedEffect(() => {
    window.clockStarts += 1;
    const controller = animate(x, state.target, transition);
    window.clockController = controller;
    window.clockValue = x;
    return () => {
      controller.stop();
      window.clockCleanup = { value: x.get(), running: x.isAnimating() };
      const stopped = window.clockCleanup;
      stopped.frames = [];
      frame.postRender(() => {
        stopped.frames.push({ value: x.get(), running: x.isAnimating() });
        frame.postRender(() => stopped.frames.push({ value: x.get(), running: x.isAnimating() }));
      });
    };
  }, [signature, x]);
  React.useLayoutEffect(() => {
    const capture = (phase) =>
      window.clockSamples.push({
        request: state.request,
        starts: window.clockStarts,
        phase,
        value: x.get(),
        velocity: x.getVelocity(),
        state: x.isAnimating() ? "running" : "idle",
        mode: cm.mode,
        reduced: cm.reduced,
        disabled: cm.disabled,
        clock: cm.timeScale,
        transition,
        transform: document.querySelector("[data-clock-host]").style.transform,
      });
    capture("commit");
    frame.postRender(() => {
      capture("paint1");
      frame.postRender(() => capture("paint2"));
    });
  });
  return (
    <>
      <motion.div data-clock-host style={{ x }}>
        actual MotionValue host
      </motion.div>
      <Button>Zero press</Button>
    </>
  );
}
function App() {
  const [state, set] = React.useState({
    recipe: recipes[0],
    clock: 0,
    nested: null,
    override: null,
    target: 100,
    request: 0,
    mounted: true,
    direct: false,
  });
  window.setClock = (patch) => set((s) => ({ ...s, ...patch, request: s.request + 1 }));
  return (
    <CadenceProvider mode="full" timeScale={state.clock}>
      <CadenceProvider timeScale={state.nested ?? undefined}>
        {state.mounted && <Probe state={state} />}
      </CadenceProvider>
    </CadenceProvider>
  );
}
window.clockRecipes = recipes;
createRoot(document.getElementById("root")).render(<App />);
