import { AnimatePresence } from "motion/react";
import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Button } from "../../registry/cadence/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "../../registry/cadence/button-group";
import { buttonGroupGeometry } from "../../registry/cadence/lib/button-group-layout";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    child: "full",
    clock: 3,
    order: ["a", "b", "c"],
    label: "Save",
    value: 99,
    vertical: false,
    shown: true,
    editor: false,
    colour: false,
    passive: 700,
    later: false,
    intrinsic: false,
    extra: false,
    capture: false,
    nestedShown: true,
    features: false,
    distribute: false,
    distributedHeight: 1100,
    ruleLength: 80,
    ruleShown: true,
    ruleHorizontal: false,
    ruleColour: false,
    ruleMode: "inherit",
    ruleClock: 3,
    ruleGroupShown: true,
    ruleGroupVertical: false,
  });
  const [ready, markReady] = useState(false);
  const ref = useRef(null);
  const caller = useRef(null);
  useLayoutEffect(() => {
    const label = document.querySelector("#readout-text [data-slot=button-group-label]");
    const number = document.querySelector("#readout [data-slot=button-group-number]");
    if (label) label.id = "group-owned-text";
    if (number) number.id = "group-owned-number";
  });
  if (typeof window !== "undefined") {
    window.groupUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.groupState = s;
    window.groupDescribe = () => {
      const host = document.getElementById("group");
      return {
        geometry: buttonGroupGeometry(host, s.vertical ? "vertical" : "horizontal"),
        children: [...host.children].map((n) => ({ slot: n.dataset.slot, rect: n.getBoundingClientRect().toJSON() })),
        chain: [host, host.parentElement, host.parentElement.parentElement].map((n) => {
          const c = getComputedStyle(n);
          return {
            tag: n.tagName,
            class: n.className,
            width: c.width,
            typed: n.computedStyleMap().get("width").toString(),
            height: c.height,
            display: c.display,
            boxSizing: c.boxSizing,
            transform: c.transform,
            overflow: c.overflow,
            aspectRatio: c.aspectRatio,
            scale: c.scale,
            rotate: c.rotate,
            zoom: c.zoom,
          };
        }),
      };
    };
  }
  useEffect(() => {
    markReady(true);
    window.groupReady = true;
    return () => {
      window.groupReady = false;
    };
  }, []);
  const buttonRef = useRef((node) => {
    if (!node) return;
    window.groupRefMounts = (window.groupRefMounts ?? 0) + 1;
    caller.current = node;
    return () => {
      window.groupRefCleanups = (window.groupRefCleanups ?? 0) + 1;
      if (caller.current === node) caller.current = null;
    };
  }).current;
  const member = (key) =>
    key === "input" ? (
      <input key={key} id="editor" aria-label="Draft" defaultValue="draft value" className="h-9 w-32 border" />
    ) : (
      <Button
        key={key}
        id={`action-${key}`}
        ref={key === "b" ? buttonRef : undefined}
        variant="outline"
        name={`action-${key}`}
        form="native-form"
        onPointerDown={(event) => {
          if (s.capture) {
            window.groupPointer = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
          }
        }}
        onClick={() => {
          window.groupClicks = (window.groupClicks ?? 0) + 1;
        }}
      >
        {key === "a" ? s.label : key === "b" ? "Middle" : "Done"}
      </Button>
    );
  const rule = s.ruleShown && (
    <ButtonGroupSeparator
      key="rule"
      id={s.ruleMode === "inherit" ? "rule" : "nested-rule"}
      orientation={s.ruleHorizontal ? "horizontal" : "vertical"}
      style={{
        [s.ruleHorizontal ? "width" : "height"]: s.ruleLength,
        backgroundColor: s.ruleColour ? "rgb(180,180,180)" : "rgb(80,80,80)",
      }}
    />
  );
  return (
    <StrictMode>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main
          className={`grid justify-items-start gap-8 p-8 min-h-screen ${s.distribute ? "" : "content-start items-start"}`}
          style={{
            fontFamily: '"Courier New", monospace',
            fontFeatureSettings: s.features ? '"liga" 0' : "normal",
            minHeight: s.distribute ? s.distributedHeight : undefined,
          }}
        >
          <h1>Button Group contract</h1>
          <button id="before" type="button">
            Before
          </button>
          <div id="stage" style={{ width: s.intrinsic ? "max-content" : s.passive, maxWidth: "100%" }}>
            <AnimatePresence initial={false}>
              {s.shown && (
                <ButtonGroup
                  ref={ref}
                  id="group"
                  key="group"
                  aria-label="Actions"
                  orientation={s.vertical ? "vertical" : "horizontal"}
                >
                  {(s.editor ? ["a", "input", ...(s.extra ? ["b"] : []), "c"] : s.order).map(member)}
                </ButtonGroup>
              )}
            </AnimatePresence>
          </div>
          <ButtonGroup id="readout-group" aria-label="Readouts" orientation={s.vertical ? "vertical" : "horizontal"}>
            <Button key="label" id="simultaneous" variant="outline">
              {s.label}
            </Button>
            <ButtonGroupText
              key="readout"
              id="readout"
              style={{
                backgroundColor: s.colour ? "rgb(238,238,238)" : "rgb(220,220,220)",
                color: s.colour ? "rgb(30,30,30)" : "rgb(10,10,10)",
              }}
            >
              {s.value}
            </ButtonGroupText>
            <ButtonGroupText key="text" id="readout-text">
              {s.label}
            </ButtonGroupText>
          </ButtonGroup>
          {s.ruleGroupShown && (
            <ButtonGroup
              aria-label="Rule composition"
              id="rules"
              orientation={s.ruleGroupVertical ? "vertical" : "horizontal"}
            >
              <Button variant="outline">Cut</Button>
              {s.ruleMode === "inherit" ? (
                rule
              ) : (
                <CadenceProvider key="rule-scope" mode={s.ruleMode} timeScale={s.ruleClock}>
                  <AnimatePresence initial={false}>{rule}</AnimatePresence>
                </CadenceProvider>
              )}
              <Button variant="outline">Copy</Button>
            </ButtonGroup>
          )}
          <ButtonGroupText id="native-output" render={<output aria-live="polite" />}>
            {s.value}
          </ButtonGroupText>
          <ButtonGroupText id="native-link" render={<a href="#after" />}>
            {s.label}
          </ButtonGroupText>
          <CadenceProvider mode="full">
            {s.nestedShown && (
              <ButtonGroup id="full-none" aria-label="Parent full">
                <CadenceProvider mode="none">
                  <Button key="nested" id="nested-none">
                    {s.label}
                  </Button>
                </CadenceProvider>
              </ButtonGroup>
            )}
          </CadenceProvider>
          <CadenceProvider mode="none">
            {s.nestedShown && (
              <ButtonGroup id="none-full" aria-label="Parent none">
                <CadenceProvider mode="full">
                  <Button key="nested" id="nested-full">
                    {s.label}
                  </Button>
                </CadenceProvider>
              </ButtonGroup>
            )}
          </CadenceProvider>
          <form id="native-form" aria-label="Native association" />
          {s.later && (
            <ButtonGroup id="later" aria-label="Later actions">
              <Button key="later">Later</Button>
            </ButtonGroup>
          )}
          <button id="after" type="button">
            After
          </button>
          {ready &&
            createPortal(
              <CadenceProvider mode={s.child}>
                <ButtonGroup id="portal-group" aria-label="Portal actions">
                  <ButtonGroupText key="text">{s.label}</ButtonGroupText>
                </ButtonGroup>
              </CadenceProvider>,
              document.getElementById("portal-root"),
            )}
        </main>
      </CadenceProvider>
    </StrictMode>
  );
}
if (typeof document !== "undefined")
  window.groupRoot = hydrateRoot(document.getElementById("root"), <App initialMode={window.groupInitialMode} />);
