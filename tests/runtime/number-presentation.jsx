import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { createMeasuredGeometry, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { bindMotionParameters, numberRoll } from "../../registry/cadence/lib/motion";
import { useMotionHostRef } from "../../registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { createNumberSnapshot } from "../../registry/cadence/lib/number-plan";
import { commitNumberPresentations, createNumberPresentation } from "../../registry/cadence/lib/number-presentation";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { createTextPresentation } from "../../registry/cadence/lib/text-presentation";
import { useNumberPresentation } from "../../registry/cadence/lib/use-number-presentation";

function Owned({ value, entity, cause, direction, mounted, display }) {
  const { node, ref } = useMotionHostRef();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { cause, direction, display });
  return (
    mounted && (
      <span id="owned" ref={ref} data-slot="internal-number-pilot" data-motion={cm.mode}>
        {text}
      </span>
    )
  );
}
function Policy() {
  const cm = useCadenceMotion();
  if (typeof window !== "undefined") window.numberPolicy = cm;
  return null;
}
export function App() {
  const [state, set] = useState({
    value: 12,
    mode: "full",
    timeScale: 3,
    entity: "same",
    cause: "independent",
    direction: "trend",
    mounted: true,
  });
  if (typeof window !== "undefined")
    window.numberUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  return (
    <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
      <Policy />
      <button type="button" id="native-button">
        <Owned {...state} />
      </button>
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.numberTools = {
    createNumberPresentation,
    commitNumberPresentations,
    createNumberSnapshot,
    createMotionTransaction,
    createTextPresentation,
    createMeasuredGeometry,
    naturalGeometry,
    bindMotionParameters,
    numberRoll,
  };
  window.numberRoot = hydrateRoot(
    document.getElementById("root"),
    window.numberStrict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
}
