import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { useMotionHostRef } from "../../registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { observeReveal } from "../../registry/cadence/lib/reveal-observer";
import { useViewportReveal } from "../../registry/cadence/lib/use-viewport-reveal";
import { createViewportReveal } from "../../registry/cadence/lib/viewport-reveal";

function Item({ group, id, top }) {
  const { node, ref } = useMotionHostRef();
  const cm = useCadenceMotion(node);
  useViewportReveal(node, cm, group);
  return (
    <section
      ref={ref}
      id={id}
      data-slot="internal-reveal-pilot"
      data-motion={cm.mode}
      style={{ position: "absolute", top, width: 280, height: 80 }}
    >
      <button type="button" onClick={() => window.revealClicks++}>
        Native {id}
      </button>
      <span contentEditable suppressContentEditableWarning>
        Editable {id}
      </span>
    </section>
  );
}
function Policy() {
  const cm = useCadenceMotion();
  if (typeof window !== "undefined") window.revealMotion = cm;
  return null;
}
export function App() {
  const [group] = useState(() => createViewportReveal());
  const [state, set] = useState({ mode: "full", timeScale: 4, mounted: true });
  if (typeof window !== "undefined")
    window.revealUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  return (
    <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
      <Policy />
      {state.mounted && (
        <>
          <Item group={group} id="first" top={30} />
          <Item group={group} id="later" top={1600} />
        </>
      )}
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.revealClicks = 0;
  window.revealTools = { createViewportReveal, observeReveal, createMotionTransaction };
  window.revealRoot = hydrateRoot(
    document.getElementById("root"),
    window.revealStrict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
}
