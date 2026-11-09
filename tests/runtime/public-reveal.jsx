import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Button } from "../../registry/cadence/button";
import { createMeasuredGeometry } from "../../registry/cadence/lib/measured-geometry";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { createSizeLinkedGeometry } from "../../registry/cadence/lib/size-linked-geometry";
import { Reveal } from "../../registry/cadence/reveal";
import { RevealGroup } from "../../registry/cadence/reveal-group";

function Policy() {
  const cm = useCadenceMotion();
  if (typeof window !== "undefined") window.publicMotion = cm;
  return null;
}
export function App({ initialMode = "full" }) {
  const [state, set] = useState({
    mode: initialMode,
    timeScale: 4,
    mounted: true,
    replay: "once",
    stagger: "cycle",
    amount: 0.08,
    insetTop: 0.03,
    insetBottom: 0.08,
    root: null,
    ids: ["a", "b", "c"],
    version: 0,
    refVersion: 0,
    extra: false,
    parentVersion: 0,
  });
  if (typeof window !== "undefined")
    window.publicUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  const note = (kind) => {
    if (typeof window !== "undefined") window.publicEvents.push(kind);
  };
  const callerRef = state.refVersion
    ? (n) => {
        if (n) {
          note("ref2");
          return () => note("cleanup2");
        }
      }
    : (n) => {
        if (n) {
          note("ref1");
          return () => note("cleanup1");
        }
      };
  return (
    <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
      <Policy />
      {state.mounted && (
        <RevealGroup
          replay={state.replay}
          stagger={state.stagger}
          amount={state.amount}
          insetTop={state.insetTop}
          insetBottom={state.insetBottom}
          root={state.root}
        >
          <Reveal id="first" render={<section />} style={{ position: "absolute", top: 20, width: 280, height: 70 }}>
            First screen
          </Reveal>
          {state.ids.map((id, index) => (
            <Reveal key={id} id={id} style={{ position: "absolute", top: 1500 + index * 100, width: 280, height: 80 }}>
              <button type="button" onClick={() => note(id)}>
                Native {id}
              </button>
              <input aria-label={`Edit ${id}`} defaultValue={id} />
            </Reveal>
          ))}
          <Reveal
            key={state.parentVersion}
            id="parent"
            render={<section />}
            className="outer"
            style={{ position: "absolute", top: 2200, width: 320, height: 180 }}
          >
            <RevealGroup replay="repeat">
              <Reveal id="nested">
                <Button type="button" id="press" onClick={() => note("press")}>
                  Press
                </Button>
                <input aria-label="Nested edit" defaultValue="Native" />
              </Reveal>
              {state.extra && (
                <Reveal id="later-nested" style={{ position: "absolute", top: 600, width: 200, height: 40 }}>
                  Later child
                </Reveal>
              )}
            </RevealGroup>
            <div id="geometry" style={{ width: 80, height: 20 }}>
              <div id="geometry-content" style={{ width: 80, height: 20 }}>
                Geometry
              </div>
            </div>
            <div id="gap" style={{ width: 80, height: 5 }} />
            <div id="panel" style={{ width: 150, height: 20 }}>
              Layout
            </div>
          </Reveal>
          <Reveal
            id="rendered"
            ref={callerRef}
            render={
              <button
                type="button"
                ref={(n) => {
                  if (n) note("renderRef");
                }}
                onClick={() => note("renderClick")}
                className="render-class"
              />
            }
            className="caller-class"
            onClick={() => note("callerClick")}
            style={{ position: "absolute", top: 2700 }}
          >
            Native render
          </Reveal>
          <Reveal
            id="callback"
            render={(props, state) => <article {...props} data-render-state={state.slot} />}
            style={{ position: "absolute", top: 2900 }}
          >
            Render callback
          </Reveal>
          <Reveal
            id="editable"
            render={<div contentEditable suppressContentEditableWarning />}
            style={{ position: "absolute", top: 3100 }}
          >
            Native editable
          </Reveal>
        </RevealGroup>
      )}
      {state.mounted && (
        <Reveal id="solo" style={{ position: "absolute", top: 3500, width: 280, height: 80 }}>
          Standalone
        </Reveal>
      )}
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.publicEvents = [];
  window.publicTools = { createMeasuredGeometry, createMotionTransaction, createSizeLinkedGeometry };
  window.publicRoot = hydrateRoot(
    document.getElementById("root"),
    window.publicStrict ? (
      <StrictMode>
        <App initialMode={window.publicInitialMode} />
      </StrictMode>
    ) : (
      <App initialMode={window.publicInitialMode} />
    ),
  );
}
