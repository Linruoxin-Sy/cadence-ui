import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Field, FieldLabel } from "../../registry/cadence/field";
import { Label } from "../../registry/cadence/label";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../../registry/cadence/lib/motion";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";

const font = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
function CoordinatedField({ value, clip, closed }) {
  const node = useRef(null);
  const cm = useCadenceMotion(node);
  const [scope] = useState(() => createPresentationScope(node));
  const [controller] = useState(() => createMeasuredGeometry(scope.transaction));
  const [group] = useState(() => ({ controller, transaction: scope.transaction }));
  useLayoutEffect(() => {
    const unregister = controller.register({
      host: node,
      content: node.current,
      axes: ["width", "height"],
      textGeometry: true,
      observeChildren: true,
      measure() {
        const box = naturalGeometry(node.current);
        return box
          ? { height: { size: box.height, min: box.height, max: 600, readable: true, independent: true } }
          : null;
      },
    });
    return () => {
      unregister();
      controller.dispose();
    };
  }, [controller]);
  useLayoutEffect(() => {
    if (closed) scope.transaction.close();
    else scope.transaction.open();
    const p = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    controller.commit(scope.transaction.revision("content", value), {
      reduced: cm.reduced,
      transition: p.transition,
      available: !closed,
    });
  });
  return (
    <MotionPresentation scope={scope}>
      <GeometryScope.Provider value={group}>
        <Field
          ref={node}
          id="coordinated"
          data-ending-style={closed ? "" : undefined}
          inert={closed || undefined}
          aria-hidden={closed || undefined}
          style={{ width: 180, overflow: clip ? "hidden" : "visible" }}
        >
          <FieldLabel htmlFor="field-input" style={font}>
            {value}
          </FieldLabel>
          <input id="field-input" defaultValue="field draft" />
        </Field>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}

export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    value: "Email address",
    number: 19,
    foreground: false,
    invalid: false,
    show: true,
    later: false,
    width: 230,
    clip: false,
    features: false,
    hidden: false,
    parent: true,
    target: false,
    closed: false,
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    window.labelReady = true;
  }, []);
  if (typeof window !== "undefined") {
    window.labelState = s;
    window.labelUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  }
  const palette = { color: s.foreground ? "rgb(80,80,80)" : "rgb(24,24,24)" };
  return (
    <StrictMode>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main
          className="flex flex-col items-start gap-8 p-8"
          style={{ backgroundColor: "white", color: "rgb(24,24,24)", minHeight: "100vh" }}
        >
          <h1>Label contract</h1>
          <button id="native" type="button">
            Native focus
          </button>
          {s.show && (
            <div
              id="external-field"
              className="grid gap-3"
              style={{
                width: s.width,
                overflow: s.clip ? "hidden" : "visible",
                display: s.hidden ? "none" : undefined,
              }}
            >
              <Label
                id="external"
                htmlFor="external-input"
                className="w-fit select-text"
                data-invalid={s.invalid || undefined}
                style={{ ...font, ...palette, fontFeatureSettings: s.features ? '"liga" 0' : "normal" }}
              >
                {s.value}
              </Label>
              <input id="external-input" defaultValue="native draft" />
            </div>
          )}
          <Label
            id="quantity"
            htmlFor={s.target ? "new-quantity-input" : "quantity-input"}
            className="w-fit"
            style={font}
          >
            {s.number}
          </Label>
          <input id={s.target ? "new-quantity-input" : "quantity-input"} type="checkbox" />
          <Label id="identifier" htmlFor="identifier-input" style={font}>
            {String(s.number).padStart(3, "0")}
          </Label>
          <input id="identifier-input" />
          <Label id="wrapped" data-invalid={s.invalid || undefined} style={palette}>
            <input id="wrapped-input" type="checkbox" />
            Email me about releases
          </Label>
          <Label id="rich">
            <input id="rich-input" type="checkbox" />
            Read <a href="#terms">terms</a>
            <span aria-hidden="true">*</span>
          </Label>
          <div className="group" data-disabled="true">
            <Label id="disabled" htmlFor="disabled-input" style={palette}>
              Disabled field
            </Label>
            <input id="disabled-input" disabled />
          </div>
          {s.parent && <CoordinatedField value={s.value} clip={s.clip} closed={s.closed} />}
          {s.later && (
            <>
              <Label id="later" htmlFor="later-input" style={font}>
                New label
              </Label>
              <input id="later-input" />
              <MotionPresentation>
                <Label id="consumed">New parent label</Label>
              </MotionPresentation>
            </>
          )}
          <CadenceProvider mode="none">
            <Label id="nested-none" style={font}>
              {s.value}
            </Label>
          </CadenceProvider>
          <CadenceProvider mode="full">
            <Label id="nested-full" style={font}>
              {s.value}
            </Label>
          </CadenceProvider>
          {ready &&
            createPortal(
              <Label id="portal" htmlFor="portal-input" style={font}>
                {s.value}
              </Label>,
              document.querySelector("#portal-root"),
            )}
        </main>
      </CadenceProvider>
    </StrictMode>
  );
}
if (typeof document !== "undefined")
  hydrateRoot(document.getElementById("root"), <App initialMode={window.labelInitialMode} />);
