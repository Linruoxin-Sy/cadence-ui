import { AnimatePresence } from "motion/react";
import { StrictMode, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../../registry/cadence/lib/motion";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { useMotionHostRef } from "../../registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { Toggle } from "../../registry/cadence/toggle";

function Compound({ label }) {
  const { node, ref } = useMotionHostRef();
  const content = useRef(null);
  const cm = useCadenceMotion(node);
  const [group] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  useLayoutEffect(
    () =>
      group.controller.register({
        host: node,
        content: content.current,
        axes: ["width"],
        measure() {
          const box = naturalGeometry(content.current);
          return box
            ? { width: { size: box.width, min: box.width, max: innerWidth, readable: true, independent: true } }
            : null;
        },
      }),
    [group, node],
  );
  useLayoutEffect(() => {
    const p = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    group.controller.commit(group.transaction.revision("content", label), {
      reduced: cm.reduced,
      transition: p.transition,
    });
  });
  useInsertionEffect(() => () => group.controller.dispose(), [group]);
  return (
    <GeometryScope.Provider value={group}>
      <div ref={ref} id="compound" data-motion={cm.mode} className="inline-block">
        <div ref={content} className="inline-block">
          <Toggle id="compound-button">{label}</Toggle>
        </div>
      </div>
    </GeometryScope.Provider>
  );
}

export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    label: "Preview",
    size: "sm",
    pressed: false,
    disabled: false,
    later: false,
    show: true,
    number: 19,
    custom: false,
    parent: false,
  });
  const [portal, attach] = useState(false);
  const [scope] = useState(createPresentationScope);
  useEffect(() => attach(true), []);
  if (typeof window !== "undefined") {
    window.toggleUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.toggleState = s;
  }
  return (
    <>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main
          style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
          className="flex flex-wrap items-start gap-6 p-6"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.submissions = (window.submissions ?? 0) + 1;
            }}
          >
            <AnimatePresence>
              <Toggle
                key="main"
                id="label"
                pressed={s.pressed}
                onPressedChange={(pressed) => set((old) => ({ ...old, pressed }))}
                disabled={s.disabled}
                size={s.size}
                render={s.custom ? <button type="button" data-custom="yes" /> : undefined}
              >
                {s.label}
              </Toggle>
            </AnimatePresence>
            <input aria-label="Native editor" defaultValue="Unchanged" />
          </form>
          <Compound label={s.label} />
          <Toggle id="number">{s.number}</Toggle>
          <Toggle id="rich" variant="outline">
            <svg aria-hidden="true" viewBox="0 0 10 10">
              <path d="M1 5h8" />
            </svg>
            <span>Rich label</span>
          </Toggle>
          <Toggle id="icon" aria-label="Italic">
            <svg aria-hidden="true" viewBox="0 0 10 10">
              <path d="M1 5h8" />
            </svg>
          </Toggle>
          <Toggle id="constrained" className="w-60">
            {s.label}
          </Toggle>
          <Toggle id="uncontrolled" defaultPressed>
            Uncontrolled
          </Toggle>
          {s.later && <Toggle id="later">Independent insertion</Toggle>}
          <AnimatePresence>{s.show && <Toggle id="optional">Optional</Toggle>}</AnimatePresence>
          {s.parent && (
            <MotionPresentation scope={scope}>
              <div id="parent">
                <Toggle id="inherited">Parent appearance</Toggle>
              </div>
            </MotionPresentation>
          )}
          <CadenceProvider mode="none">
            <Toggle id="nested">Nested static</Toggle>
          </CadenceProvider>
          {portal && createPortal(<Toggle id="portal-toggle">Portalled</Toggle>, document.getElementById("portal"))}
        </main>
      </CadenceProvider>
      <Toggle id="standalone">Standalone</Toggle>
    </>
  );
}
if (typeof document !== "undefined") {
  window.toggleRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.toggleInitialMode} />
    </StrictMode>,
  );
  window.toggleUnmount = () => flushSync(() => window.toggleRoot.unmount());
}
