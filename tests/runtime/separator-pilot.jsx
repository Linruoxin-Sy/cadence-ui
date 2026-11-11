import { AnimatePresence } from "motion/react";
import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../../registry/cadence/lib/motion";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";
import { Separator } from "../../registry/cadence/separator";

function Parent({ closed, child, children }) {
  const ref = useRef(null);
  const [scope] = useState(() => createPresentationScope(ref));
  useLayoutEffect(() => {
    if (closed) scope.transaction.close();
    else scope.transaction.open();
  }, [scope, closed]);
  return (
    <MotionPresentation scope={scope}>
      <section
        ref={ref}
        id="parent"
        data-ending-style={closed ? "" : undefined}
        hidden={closed}
        style={{ width: 240, height: 200 }}
      >
        {children}
        {child && <Separator id="child" style={{ width: 120 }} />}
      </section>
    </MotionPresentation>
  );
}

function Coordinated({ length }) {
  const node = useRef(null);
  const cm = useCadenceMotion(node);
  const [scope] = useState(() => createPresentationScope(node));
  const [group] = useState(() => ({
    transaction: scope.transaction,
    controller: createMeasuredGeometry(scope.transaction),
  }));
  useLayoutEffect(() => {
    const unregister = group.controller.register({
      host: node,
      content: node.current,
      axes: ["width"],
      observeChildren: true,
      measure: () => {
        const box = naturalGeometry(node.current);
        return box ? { width: { size: box.width, min: 0, max: 400, readable: true, independent: true } } : null;
      },
    });
    return unregister;
  }, [group]);
  useLayoutEffect(() => {
    const p = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    group.controller.commit(scope.transaction.revision("content", length), {
      reduced: cm.reduced,
      transition: p.transition,
    });
  });
  return (
    <MotionPresentation scope={scope}>
      <GeometryScope.Provider value={group}>
        <div id="coordinated" ref={node} style={{ display: "inline-block" }}>
          <Separator id="coordinated-rule" style={{ width: length }} />
        </div>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}

export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    length: 80,
    vertical: false,
    shown: true,
    colour: false,
    decorative: false,
    passive: 240,
    hidden: false,
    later: false,
    child: false,
    closed: false,
    render: false,
    classLength: false,
    opacity: 1,
  });
  const [ready, hydrated] = useState(false);
  const cleanups = useRef(0),
    mounts = useRef(0);
  const [ref] = useState(() => (node) => {
    if (!node) return;
    mounts.current++;
    return () => {
      cleanups.current++;
    };
  });
  useEffect(() => {
    hydrated(true);
    window.separatorReady = true;
  }, []);
  if (typeof window !== "undefined") {
    window.separatorState = s;
    window.separatorUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.separatorRefs = () => ({ mounts: mounts.current, cleanups: cleanups.current });
  }
  return (
    <StrictMode>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main className="grid justify-items-start gap-8 p-8" style={{ minHeight: "100vh" }}>
          <h1>Separator contract</h1>
          <button id="before" type="button">
            Before rule
          </button>
          <div
            id="stage"
            hidden={s.hidden}
            style={{ width: s.passive, height: 200, display: s.hidden ? "none" : "block" }}
          >
            <AnimatePresence initial={false}>
              {s.shown && (
                <Separator
                  id="rule"
                  key="rule"
                  ref={ref}
                  decorative={s.decorative}
                  render={s.render ? <hr /> : undefined}
                  orientation={s.vertical ? "vertical" : "horizontal"}
                  className={
                    s.classLength
                      ? s.length === 80
                        ? "data-[orientation=horizontal]:w-20"
                        : "data-[orientation=horizontal]:w-40"
                      : undefined
                  }
                  style={{
                    ...(s.classLength ? {} : { [s.vertical ? "height" : "width"]: s.length }),
                    backgroundColor: s.colour ? "rgb(120,120,120)" : "rgb(60,60,60)",
                    opacity: s.opacity,
                  }}
                />
              )}
            </AnimatePresence>
            <Separator id="passive" />
          </div>
          <button id="after" type="button">
            After rule
          </button>
          {s.later && <Separator id="later" style={{ width: 140 }} />}
          <Parent closed={s.closed} child={s.child}>
            <Separator id="retained" style={{ width: 140 }} />
          </Parent>
          <Coordinated length={s.length} />
          <CadenceProvider mode="none">
            <Separator id="nested-none" />
          </CadenceProvider>
          <CadenceProvider mode="none">
            <CadenceProvider mode="full">
              <Separator id="nested-full" />
            </CadenceProvider>
          </CadenceProvider>
          {ready &&
            createPortal(<Separator id="portal" style={{ width: s.length }} />, document.querySelector("#portal-root"))}
        </main>
      </CadenceProvider>
    </StrictMode>
  );
}
if (typeof document !== "undefined")
  hydrateRoot(document.getElementById("root"), <App initialMode={window.separatorInitialMode} />);
