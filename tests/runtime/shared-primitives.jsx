import { StrictMode, useEffect, useState, version } from "react";
import { createPortal, flushSync } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
import { AnimatedNumber } from "../../registry/cadence/animated-number";
import { AnimatedText } from "../../registry/cadence/animated-text";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { Reveal } from "../../registry/cadence/reveal";
import { RevealGroup } from "../../registry/cadence/reveal-group";

function Values({ state, prefix }) {
  return (
    <>
      <AnimatedText id={`${prefix}-text`} value={state.text} />
      <AnimatedNumber id={`${prefix}-number`} value={state.number} />
    </>
  );
}

export function App({ initialMode }) {
  const [state, set] = useState({
    mode: initialMode,
    childMode: undefined,
    clock: 3,
    text: "Save",
    number: 12,
    entity: 0,
    mounted: true,
  });
  const [portal, attachPortal] = useState(false);
  useEffect(() => {
    window.sharedLifecycle ??= { setups: 0, cleanups: 0 };
    window.sharedLifecycle.setups++;
    attachPortal(true);
    return () => window.sharedLifecycle.cleanups++;
  }, []);
  if (typeof window !== "undefined") {
    window.sharedReactVersion = version;
    window.sharedUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  }
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      <button type="button" id="action" onClick={() => set((s) => ({ ...s, text: "Saved", number: 13 }))}>
        Commit
      </button>
      {state.mounted && (
        <div key={state.entity}>
          <Values state={state} prefix="local" />
          <CadenceProvider mode={state.childMode}>
            <Values state={state} prefix="nested" />
            {portal && createPortal(<Values state={state} prefix="portal" />, document.getElementById("portal"))}
          </CadenceProvider>
          <div id="editor" contentEditable="plaintext-only" suppressContentEditableWarning>
            <AnimatedText id="editable-text" value="Native" />
            <AnimatedNumber id="editable-number" value={123} />
          </div>
          <RevealGroup stagger="cycle">
            <Reveal id="first">First screen</Reveal>
            <Reveal id="later" render={<section />} style={{ position: "absolute", top: 1800 }}>
              <input aria-label="Native input" defaultValue="Native" />
              <Reveal id="nested-reveal">Nested entrance</Reveal>
            </Reveal>
          </RevealGroup>
          <Reveal id="solo" style={{ position: "absolute", top: 2200 }}>
            Independent reveal
          </Reveal>
        </div>
      )}
    </CadenceProvider>
  );
}

if (typeof document !== "undefined") {
  const content = () => (
    <StrictMode>
      <App initialMode={window.sharedInitialMode} />
    </StrictMode>
  );
  window.sharedRoot = hydrateRoot(document.getElementById("root"), content());
  window.sharedRemount = () => {
    flushSync(() => window.sharedRoot.unmount());
    window.sharedRoot = createRoot(document.getElementById("root"));
    flushSync(() => window.sharedRoot.render(content()));
  };
}
