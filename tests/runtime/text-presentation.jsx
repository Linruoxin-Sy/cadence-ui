import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { captureHandoffOrigin, createCapturedHandoff } from "../../registry/cadence/lib/captured-handoff";
import { useMotionHostRef } from "../../registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { createTextSnapshot } from "../../registry/cadence/lib/text-diff";
import { proveTextLayout } from "../../registry/cadence/lib/text-layout";
import { createTextPresentation } from "../../registry/cadence/lib/text-presentation";
import { useTextPresentation } from "../../registry/cadence/lib/use-text-presentation";

function Owned({ value, entity, characterStagger }) {
  const { node, ref } = useMotionHostRef();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger });
  return (
    <span id="owned" ref={ref} data-slot="internal-text-pilot" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function Policy() {
  const cm = useCadenceMotion();
  if (typeof window !== "undefined") window.textPolicy = cm;
  return null;
}

export function App() {
  const [state, setState] = useState({
    value: "Save",
    mode: "full",
    timeScale: 1,
    entity: "same",
    characterStagger: false,
  });
  if (typeof window !== "undefined")
    window.textUpdate = (patch) => flushSync(() => setState((old) => ({ ...old, ...patch })));
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
  window.textTools = {
    createTextPresentation,
    createMotionTransaction,
    captureHandoffOrigin,
    createCapturedHandoff,
    proveTextLayout,
    createTextSnapshot,
  };
  window.textRoot = hydrateRoot(
    document.getElementById("root"),
    window.textStrict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
}
