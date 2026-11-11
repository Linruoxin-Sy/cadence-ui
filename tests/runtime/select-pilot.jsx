import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { AnimatedNumber } from "../../registry/cadence/animated-number";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { SelectMotion, selectOrigin } from "../../registry/cadence/lib/select-motion";
import { createTextSnapshot } from "../../registry/cadence/lib/text-diff";
import { proveTextLayout } from "../../registry/cadence/lib/text-layout";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../registry/cadence/select";

function Probe() {
  const scope = useContext(SelectMotion);
  if (typeof window !== "undefined") window.selectScope = scope;
  return null;
}
function Small({ id, mode = "full" }) {
  return (
    <CadenceProvider mode={mode}>
      <Select defaultValue="a" modal={false}>
        <SelectTrigger id={id} aria-label={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="a">Plan A</SelectItem>
          <SelectItem value="b">Plan B</SelectItem>
        </SelectContent>
      </Select>
    </CadenceProvider>
  );
}
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    value: "a",
    labelA: "Plan AAA",
    labelB: "Plan BBB",
    group: "Plans pending",
    count: 19,
    open: false,
    aligned: false,
    show: true,
    fixed: false,
    invalid: false,
    disabled: false,
    rich: false,
    extra: 0,
    key: 0,
    nested: false,
    rtl: false,
    reject: false,
    defer: false,
    custom: false,
    ink: false,
    keepOpen: false,
    siblingKey: 0,
    holdClose: false,
  });
  const [ready, mark] = useState(false);
  const delayed = useRef(null);
  const actions = useRef(null);
  useEffect(() => {
    mark(true);
    window.selectReady = true;
  }, []);
  if (typeof window !== "undefined") {
    window.selectUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.selectProbe = () => {
      const node = document.querySelector('#option-b [data-slot="select-text"]');
      const capture = selectOrigin(
        node,
        document.querySelector('#select [data-slot="select-value"]').textContent,
        node.textContent,
      );
      const proof = Boolean(proveTextLayout(node, createTextSnapshot(node.textContent)));
      const result = {
        capture: Boolean(capture),
        proof,
        style: Object.fromEntries(
          [
            "font",
            "fontVariant",
            "fontFeatureSettings",
            "fontVariationSettings",
            "letterSpacing",
            "wordSpacing",
            "textTransform",
            "textShadow",
            "textDecorationLine",
            "direction",
            "writingMode",
          ].map((k) => [k, getComputedStyle(node)[k]]),
        ),
        chain: [
          ...(function* (n) {
            while (n) {
              yield n;
              n = n.parentElement;
            }
          })(node),
        ].map((n) => ({
          tag: n.tagName,
          slot: n.dataset.slot,
          animations: n.getAnimations().map((a) => a.effect.getKeyframes()),
          opacity: getComputedStyle(n).opacity,
          transform: getComputedStyle(n).transform,
        })),
      };
      capture?.dispose();
      return result;
    };
    window.selectUnmount = () => flushSync(() => actions.current?.unmount());
    window.selectAccept = () => flushSync(() => set((old) => ({ ...old, value: delayed.current })));
  }
  const items = [
    { value: "a", label: s.labelA },
    { value: "b", label: s.labelB },
  ];
  return (
    <DirectionProvider direction={s.rtl ? "rtl" : "ltr"}>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main style={{ padding: 40 }}>
          <h1>Select motion pilot</h1>
          <button id="outside" type="button">
            Outside
          </button>
          <div id="anchor" style={{ marginTop: 80 }}>
            <form id="form">
              <label id="field-label" htmlFor="select">
                Plan
              </label>
              {s.show && (
                <Select
                  key={s.key}
                  items={items}
                  value={s.value}
                  open={s.open}
                  modal={false}
                  name="plan"
                  actionsRef={actions}
                  disabled={s.disabled}
                  onOpenChange={(open, details) => {
                    if (!open && s.holdClose) details.preventUnmountOnClose();
                    if (!s.keepOpen || open) set((old) => ({ ...old, open }));
                  }}
                  onOpenChangeComplete={(open) => {
                    window.selectCompletions ??= [];
                    window.selectCompletions.push(open);
                  }}
                  onValueChange={(value, details) => {
                    window.selectRequests ??= [];
                    window.selectRequests.push(value);
                    window.selectCandidate = {
                      capture: Boolean(window.selectScope?.candidate?.capture),
                      approved: window.selectScope?.candidate?.approved,
                    };
                    if (s.reject) details.cancel();
                    else if (s.defer) delayed.current = value;
                    else set((old) => ({ ...old, value }));
                  }}
                >
                  <Probe />
                  <SelectTrigger
                    style={{ fontFamily: '"Courier New",monospace', fontFeatureSettings: "normal" }}
                    id="select"
                    aria-labelledby="field-label"
                    aria-invalid={s.invalid || undefined}
                    className={s.fixed ? "w-48" : undefined}
                  >
                    <SelectValue>{s.custom ? (value) => `Custom ${value}` : undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    style={{ fontFamily: '"Courier New",monospace', fontFeatureSettings: "normal" }}
                    alignItemWithTrigger={s.aligned}
                    className={s.ink ? "text-muted-foreground" : undefined}
                  >
                    <SelectGroup>
                      <SelectLabel>{s.group}</SelectLabel>
                      <SelectItem id="option-a" value="a">
                        {s.labelA}
                      </SelectItem>
                      <SelectItem id="option-b" value="b">
                        {s.labelB}
                      </SelectItem>
                      <SelectItem value="disabled" disabled>
                        Blocked
                      </SelectItem>
                      <SelectSeparator />
                      <SelectItem value="quantity">
                        <span>
                          Seats <AnimatedNumber value={s.count} />
                        </span>
                      </SelectItem>
                      {Array.from({ length: s.extra }, (_, i) => `extra-${i}`).map((value) => (
                        <SelectItem key={value} value={value}>
                          Extra {value}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              <button type="reset" id="reset">
                Reset
              </button>
              <output id="semantic">{s.value}</output>
            </form>
          </div>
          <Small key={s.siblingKey} id="sibling" />
          {s.nested && (
            <CadenceProvider mode="none">
              <Small id="nested" mode="full" />
              {ready && createPortal(<Small id="portaled" mode="reduced" />, document.getElementById("portal"))}
            </CadenceProvider>
          )}
        </main>
      </CadenceProvider>
    </DirectionProvider>
  );
}
if (typeof document !== "undefined" && document.getElementById("root"))
  hydrateRoot(document.getElementById("root"), <App initialMode={window.selectInitialMode ?? "full"} />);
