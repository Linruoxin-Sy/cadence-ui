import { AnimatePresence, usePresence } from "motion/react";
import { StrictMode, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Button } from "../../registry/cadence/button";
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
          <Button id="compound-button">{label}</Button>
        </div>
      </div>
    </GeometryScope.Provider>
  );
}

function Standalone() {
  const [later, setLater] = useState(false);
  if (typeof window !== "undefined") window.buttonStandalone = () => flushSync(() => setLater(true));
  return (
    <div>
      <Button id="standalone-initial">Without a provider</Button>
      {later && <Button id="standalone-later">Independent action</Button>}
    </div>
  );
}
function RetainingLabel() {
  const [, complete] = usePresence();
  useEffect(() => {
    window.buttonFinishRich = () => complete?.();
  }, [complete]);
  return <span>Retained rich label</span>;
}

export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    label: "Save changes",
    number: 19,
    size: "default",
    variant: "default",
    disabled: false,
    show: true,
    later: false,
    key: 0,
    target: "save",
    childMode: undefined,
    parent: false,
    richShow: true,
  });
  const [portal, attach] = useState(false);
  const [scope] = useState(createPresentationScope);
  useEffect(() => {
    attach(true);
  }, []);
  if (typeof window !== "undefined") {
    window.buttonUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.buttonState = s;
    window.buttonProof = () =>
      ["label", "number", "supported-text", "supported-number"].map((id) => {
        const n = document.querySelector(
          `#${id} [data-slot="${id === "label" || id === "supported-text" ? "button-text" : "button-number"}"]`,
        );
        const css = getComputedStyle(n);
        const chain = [];
        for (let p = n; p; p = p.parentElement) {
          const c = getComputedStyle(p);
          chain.push({
            tag: p.tagName,
            id: p.id,
            transform: c.transform,
            scale: c.scale,
            translate: c.translate,
            rotate: c.rotate,
            opacity: c.opacity,
            animations: p.getAnimations().length,
            overflow: c.overflow,
            borderRadius: c.borderRadius,
            contain: c.contain,
          });
        }
        return {
          id,
          font: css.font,
          features: css.fontFeatureSettings,
          variation: css.fontVariationSettings,
          variant: css.fontVariant,
          zoom: css.zoom,
          check: css.font ? document.fonts.check(css.font, n.textContent) : false,
          fontLonghands: {
            family: css.fontFamily,
            size: css.fontSize,
            weight: css.fontWeight,
            style: css.fontStyle,
            stretch: css.fontStretch,
            lineHeight: css.lineHeight,
            kerning: css.fontKerning,
            optical: css.fontOpticalSizing,
            adjust: css.fontSizeAdjust,
          },
          chain,
        };
      });
  }
  const register = (node) => {
    if (!node) return;
    window.buttonRefs ??= { attached: 0, cleaned: 0 };
    window.buttonRefs.attached++;
    return () => window.buttonRefs.cleaned++;
  };
  const icon = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16M4 12h16" stroke="currentColor" />
    </svg>
  );
  return (
    <>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main className="flex min-h-screen flex-col items-start gap-8 bg-background p-8 text-foreground">
          <h1>Button motion pilot</h1>
          <div id="space" className="flex h-24 w-full items-center gap-8">
            <Button
              key={s.key}
              id="label"
              type="submit"
              ref={register}
              size={s.size}
              variant={s.variant}
              disabled={s.disabled}
              formAction={s.target}
              onClick={() => {
                window.buttonClicks = (window.buttonClicks ?? 0) + 1;
              }}
            >
              {s.label}
            </Button>
            <span id="sibling">Stable sibling</span>
          </div>
          <Button id="number" aria-label={undefined}>
            {s.number}
          </Button>
          <Button id="supported-text" style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
            {s.label}
          </Button>
          <Button
            id="supported-number"
            style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
          >
            {s.number}
          </Button>
          <Compound label={s.label} />
          <Button id="rich">
            {icon}
            <span>Rich label</span>
          </Button>
          <Button id="icon" size="icon" aria-label="Add">
            {icon}
          </Button>
          <Button id="fixed" className="w-48">
            {s.label}
          </Button>
          <Button
            id="anchor"
            nativeButton={false}
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
            {icon}
            <span>Anchor</span>
          </Button>
          <div id="narrow" className="w-44 overflow-hidden">
            <Button id="constrained" className="max-w-full overflow-hidden text-ellipsis">
              {s.label}
            </Button>
          </div>
          <CadenceProvider mode={s.childMode}>
            <Button id="nested">{s.number}</Button>
            {portal && createPortal(<Button id="portal-button">{s.label}</Button>, document.getElementById("portal"))}
          </CadenceProvider>
          <AnimatePresence>
            {s.show && (
              <Button key="retained" id="retained" disabled={s.disabled}>
                {s.label}
              </Button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {s.richShow && (
              <Button key="rich-retained" id="rich-retained">
                <RetainingLabel />
              </Button>
            )}
          </AnimatePresence>
          {s.later && (
            <Button id="later" disabled={s.disabled}>
              Later
            </Button>
          )}
          {s.parent && (
            <MotionPresentation scope={scope}>
              <div id="parent">
                <Button id="parent-child">Inherited entrance</Button>
              </div>
            </MotionPresentation>
          )}
          <input id="editor" aria-label="Native editor" defaultValue="Unchanged" />
          <div id="target">Target</div>
        </main>
      </CadenceProvider>
      <Standalone />
    </>
  );
}
if (typeof document !== "undefined") {
  window.buttonRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.buttonInitialMode} />
    </StrictMode>,
  );
  window.buttonUnmount = () => flushSync(() => window.buttonRoot.unmount());
}
