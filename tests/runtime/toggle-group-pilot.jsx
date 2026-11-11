import { DirectionProvider } from "@base-ui/react/direction-provider";
import { StrictMode, useEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { AnimatedNumber } from "../../registry/cadence/animated-number";
import { createPresentationScope, MotionPresentation } from "../../registry/cadence/lib/motion-presence";
import { knownTextGeometry, textGeometryProperties } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { toggleGroupColourReadable } from "../../registry/cadence/lib/toggle-group-colour";
import { ToggleGroup, ToggleGroupItem } from "../../registry/cadence/toggle-group";

function Small({ id, mode }) {
  const group = (
    <ToggleGroup id={id} defaultValue={["a"]} aria-label={id} variant="segmented">
      <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
      <ToggleGroupItem value="b">Beta</ToggleGroupItem>
    </ToggleGroup>
  );
  return mode ? <CadenceProvider mode={mode}>{group}</CadenceProvider> : group;
}
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    value: ["b"],
    label: "Alpha overview",
    size: "default",
    variant: "segmented",
    multiple: false,
    vertical: false,
    rtl: false,
    scroll: false,
    removed: false,
    reorder: false,
    custom: false,
    disabled: false,
    show: true,
    key: 0,
    later: false,
    parent: false,
    quantity: 19,
    number: 19,
    transform: false,
    palette: false,
  });
  const [portal, ready] = useState(false);
  const [scope] = useState(createPresentationScope);
  useEffect(() => {
    ready(true);
    window.groupReady = true;
  }, []);
  if (typeof window !== "undefined") {
    window.groupUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.groupState = s;
    window.groupProbe = () => {
      const host = document.querySelector('#item-a [data-slot="toggle-group-text"]');
      return {
        mode: s.mode,
        clock: s.clock,
        nodes: [
          ...(function* (n) {
            while (n) {
              yield n;
              n = n.parentElement;
            }
          })(host),
        ].map((n) => ({
          slot: n.dataset.slot,
          properties: [...textGeometryProperties(n, s.mode)],
          animations: n
            .getAnimations()
            .map((a) => ({ known: knownTextGeometry(a, s.mode), frames: a.effect?.getKeyframes() })),
        })),
      };
    };
    window.groupReadable = () =>
      toggleGroupColourReadable(document.querySelector('#main-group > [data-slot="toggle-group-indicator"]'));
  }
  const a = (
    <ToggleGroupItem key="a" id="item-a" value="a">
      {s.label}
    </ToggleGroupItem>
  );
  const b = (
    <ToggleGroupItem
      key="b"
      id="item-b"
      value="b"
      size="lg"
      disabled={s.disabled}
      style={s.palette ? { "--motion-duration-fast": "0.42s" } : undefined}
      onPointerDown={(event) => {
        window.groupPointer = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      render={s.custom ? <button type="button" data-custom="yes" /> : undefined}
    >
      Beta
    </ToggleGroupItem>
  );
  return (
    <CadenceProvider mode={s.mode} timeScale={s.clock}>
      <DirectionProvider direction={s.rtl ? "rtl" : "ltr"}>
        <main
          className="grid justify-items-start gap-6 p-6"
          style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
        >
          <form
            id="native-form"
            onSubmit={(event) => {
              event.preventDefault();
              window.submissions = (window.submissions ?? 0) + 1;
            }}
          >
            {s.show && (
              <ToggleGroup
                key={s.key}
                id="main-group"
                aria-label="Modes"
                value={s.value}
                onValueChange={(value) => set((old) => ({ ...old, value }))}
                multiple={s.multiple}
                orientation={s.vertical ? "vertical" : "horizontal"}
                variant={s.variant}
                size={s.size}
                className={s.scroll ? "max-w-[180px] max-h-[130px] overflow-auto" : undefined}
                style={s.transform ? { transform: "rotate(2deg)" } : undefined}
              >
                {s.reorder ? [b, ...(s.removed ? [] : [a])] : [...(s.removed ? [] : [a]), b]}
                <ToggleGroupItem id="item-c" value="c">
                  Gamma
                </ToggleGroupItem>
                <ToggleGroupItem value="d" disabled>
                  Locked
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            <input aria-label="Native editor" defaultValue="Saved draft" />
            <button type="submit">Submit</button>
          </form>
          <Small id="other-group" />
          <ToggleGroup id="uncontrolled" defaultValue={["a"]} aria-label="Uncontrolled">
            <ToggleGroupItem value="a">First</ToggleGroupItem>
            <ToggleGroupItem value="b">Second</ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup id="identities" aria-label="Identities">
            <ToggleGroupItem id="number-option" value="number">
              {s.number}
            </ToggleGroupItem>
            <ToggleGroupItem id="rich-option" value="rich">
              <span data-rich="yes">Rich exact label</span>
            </ToggleGroupItem>
            <ToggleGroupItem id="quantity-option" value="quantity">
              <AnimatedNumber value={s.quantity} />
            </ToggleGroupItem>
          </ToggleGroup>
          <div contentEditable suppressContentEditableWarning id="editable">
            <ToggleGroup aria-label="Editable context">
              <ToggleGroupItem id="edited-option" value="edited">
                {s.label}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <CadenceProvider mode="none">
            <Small id="nested-group" mode="none" />
          </CadenceProvider>
          {s.later && <Small id="later-group" />}
          {s.parent && (
            <MotionPresentation scope={scope}>
              <div id="parent">
                <Small id="inherited-group" />
              </div>
            </MotionPresentation>
          )}
          {portal && createPortal(<Small id="portal-group" />, document.getElementById("portal"))}
        </main>
      </DirectionProvider>
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.groupRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.groupInitialMode} />
    </StrictMode>,
  );
  window.groupUnmount = () => flushSync(() => window.groupRoot.unmount());
}
