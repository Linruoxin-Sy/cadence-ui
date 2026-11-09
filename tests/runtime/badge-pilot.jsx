import { AnimatePresence, usePresence } from "motion/react";
import { StrictMode, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Badge } from "../../registry/cadence/badge";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../../registry/cadence/lib/motion";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { useMotionHostRef } from "../../registry/cadence/lib/motion-ref";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";

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
          <Badge id="compound-badge">{label}</Badge>
        </div>
      </div>
    </GeometryScope.Provider>
  );
}

function RetainingLabel() {
  const [, complete] = usePresence();
  useEffect(() => {
    window.badgeFinishRich = () => complete?.();
  }, [complete]);
  return <span>Retained rich status</span>;
}
function Standalone() {
  const [later, setLater] = useState(false);
  if (typeof window !== "undefined") window.badgeStandalone = () => flushSync(() => setLater(true));
  return (
    <div>
      <Badge id="standalone-initial">Initial status</Badge>
      {later && <Badge id="standalone-later">Later status</Badge>}
    </div>
  );
}
const font = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    label: "Status pending",
    number: 19,
    show: true,
    later: false,
    parent: false,
    richShow: true,
    childMode: undefined,
    key: 0,
    variant: "secondary",
    target: "target",
  });
  const [portal, attach] = useState(false);
  const [scope] = useState(createPresentationScope);
  useEffect(() => {
    attach(true);
  }, []);
  if (typeof window !== "undefined") {
    window.badgeUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.badgeState = s;
  }
  const register = (node) => {
    if (!node) return;
    window.badgeRefs ??= { attached: 0, cleaned: 0 };
    window.badgeRefs.attached++;
    return () => window.badgeRefs.cleaned++;
  };
  return (
    <>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main className="flex min-h-screen flex-col items-start gap-6 bg-background p-6 text-foreground">
          <h1>Badge motion pilot</h1>
          <div id="row" className="flex w-full flex-wrap items-center gap-4">
            <Badge id="label" key={s.key} ref={register} variant={s.variant}>
              {s.label}
            </Badge>
            <Badge id="number">{s.number}</Badge>
            <Badge id="version" variant="outline">
              00123 / v1.2.3
            </Badge>
          </div>
          <Badge id="supported-text" variant="secondary" style={font}>
            {s.label}
          </Badge>
          <Badge id="supported-number" style={font}>
            {s.number}
          </Badge>
          <Badge id="link-status" render={<a href="#target" />} style={font}>
            {s.label}
          </Badge>
          <Compound label={s.label} />
          <Badge id="rich" variant="outline">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h16" stroke="currentColor" />
            </svg>
            <span id="rich-child">Rich status</span>
          </Badge>
          <Badge
            id="link"
            variant="outline"
            render={<a href={`#${s.target}`} />}
            onClick={() => {
              window.badgeClicks = (window.badgeClicks ?? 0) + 1;
            }}
          >
            Release notes
          </Badge>
          <Badge
            id="anchor"
            variant="outline"
            render={(props) => (
              <a
                {...props}
                href="#target"
                style={{
                  ...props.style,
                  translate: "3px 4px",
                  rotate: "2deg",
                  scale: "0.95",
                  transform: "translateX(2px)",
                }}
              />
            )}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h16" stroke="currentColor" />
            </svg>
            <span>Native anchor</span>
          </Badge>
          <div id="narrow" className="w-44 overflow-hidden">
            <Badge id="constrained" className="max-w-full text-ellipsis">
              {s.label}
            </Badge>
          </div>
          <Badge id="fixed" className="w-48">
            {s.label}
          </Badge>
          <CadenceProvider mode={s.childMode}>
            <Badge id="nested" style={font}>
              {s.number}
            </Badge>
            {portal &&
              createPortal(
                <Badge id="portal-badge" style={font}>
                  {s.label}
                </Badge>,
                document.getElementById("portal"),
              )}
          </CadenceProvider>
          <AnimatePresence>
            {s.show && (
              <Badge key="retained" id="retained" style={font}>
                {s.label}
              </Badge>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {s.richShow && (
              <Badge key="rich-retained" id="rich-retained">
                <RetainingLabel />
              </Badge>
            )}
          </AnimatePresence>
          {s.later && <Badge id="later">Independent status</Badge>}
          {s.parent && (
            <MotionPresentation scope={scope}>
              <div id="parent">
                <Badge id="parent-child">Inherited entrance</Badge>
              </div>
            </MotionPresentation>
          )}
          <input aria-label="Native editor" defaultValue="Unchanged" />
          <div id="target">Target</div>
          <div id="next">Next</div>
        </main>
      </CadenceProvider>
      <Standalone />
    </>
  );
}
if (typeof document !== "undefined") {
  window.badgeRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.badgeInitialMode} />
    </StrictMode>,
  );
  window.badgeUnmount = () => flushSync(() => window.badgeRoot.unmount());
}
