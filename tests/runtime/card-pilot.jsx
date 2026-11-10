import { AnimatePresence } from "motion/react";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../registry/cadence/card";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

const mono = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
function Stateful() {
  const [v, set] = useState(0);
  useEffect(() => {
    window.cardMounts = (window.cardMounts ?? 0) + 1;
    return () => {
      window.cardUnmounts = (window.cardUnmounts ?? 0) + 1;
    };
  }, []);
  return (
    <button id="stateful" type="button" onClick={() => set((x) => x + 1)}>
      Local {v}
    </button>
  );
}
function PassiveBody() {
  const [expanded, setExpanded] = useState(false);
  if (typeof window !== "undefined") window.cardPassiveBody = () => flushSync(() => setExpanded((value) => !value));
  return <div id="passive-body" style={{ height: expanded ? 90 : 0 }} />;
}
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    title: "Status pending",
    description: "Review pending",
    number: 19,
    size: "default",
    show: true,
    later: false,
    nested: false,
    childMode: undefined,
    edit: false,
    hidden: false,
    empty: false,
    fixed: false,
    overflow: false,
    min: 0,
    ink: false,
    fit: true,
    wide: false,
    refKey: 0,
  });
  const [portal, attach] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    attach(true);
    window.cardReady = true;
  }, []);
  if (typeof window !== "undefined")
    window.cardUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  const callerRef = (n) => {
    window.cardRefCalls ??= [];
    window.cardRefCalls.push({ key: s.refKey, node: n });
    ref.current = n;
    return () => window.cardRefCalls.push({ key: s.refKey, cleanup: true, node: n });
  };
  const record = (
    <Card
      id="fit"
      fit={s.fit ? "content" : undefined}
      size={s.size}
      ref={callerRef}
      className={s.ink ? "bg-muted" : "bg-card"}
      style={{
        ...mono,
        maxWidth: "100%",

        minHeight: s.min,
        overflow: s.overflow ? "visible" : undefined,
      }}
    >
      <CardHeader id="surface-header" className={s.ink ? "border-b bg-muted" : "border-b"}>
        <CardTitle id="title" className="whitespace-nowrap">
          {s.title}
        </CardTitle>
        <CardDescription
          id="description"
          className={s.ink ? "whitespace-nowrap text-foreground" : "whitespace-nowrap text-muted-foreground"}
        >
          {s.description}
        </CardDescription>
        <CardAction id="action">
          <a href="#destination">Open</a>
        </CardAction>
      </CardHeader>
      <CardContent id="quantity" className="whitespace-nowrap">
        {s.number}
      </CardContent>
      <CardContent id="body">
        {s.empty ? null : (
          <div>
            <label htmlFor="native-memo">Memo</label>
            <input id="native-memo" name="memo" defaultValue="draft" />
            <Stateful />
            <textarea id="native-editor" name="notes" defaultValue={"Long native draft\n".repeat(6)} />
          </div>
        )}
      </CardContent>
      {s.nested && (
        <CadenceProvider mode={s.childMode}>
          <Card id="nested" fit="content" size={s.size}>
            <CardTitle className="whitespace-nowrap">{s.title}</CardTitle>
            <CardContent>{s.number}</CardContent>
          </Card>
        </CadenceProvider>
      )}
      <CardFooter id="surface-footer" className={s.ink ? "border-t bg-muted" : "border-t"}>
        Workspace seats
      </CardFooter>
    </Card>
  );
  return (
    <CadenceProvider mode={s.mode} timeScale={s.clock}>
      <main className="flex flex-col items-start gap-6 p-4" style={{ ...mono, maxWidth: s.wide ? 600 : 440 }}>
        <button id="outside" type="button">
          Outside
        </button>
        <form id="native-form">
          <div id="hidden-shell" style={{ display: s.hidden ? "none" : undefined }}>
            <AnimatePresence>{s.show && record}</AnimatePresence>
          </div>
        </form>
        <Card id="sizing" fit="content" size={s.size} className="max-w-full" style={mono}>
          <CardHeader>
            <CardTitle id="sizing-title" className="whitespace-nowrap">
              {s.title}
            </CardTitle>
            <CardDescription className="whitespace-nowrap">{s.description}</CardDescription>
          </CardHeader>
          <CardContent className="whitespace-nowrap">{s.number}</CardContent>
        </Card>
        <Card id="normal" size={s.size} className="w-full" style={{ ...mono, ...(s.fixed ? { height: 160 } : {}) }}>
          <CardTitle className="whitespace-nowrap">{s.title}</CardTitle>
          <CardContent>{s.description}</CardContent>
          <CardContent>
            {/* biome-ignore lint/performance/noImgElement: Native decoding is the regression subject. */}
            <img id="late-media" alt="" />
          </CardContent>
          <CardContent>
            <PassiveBody />
          </CardContent>
        </Card>
        <div contentEditable={s.edit} suppressContentEditableWarning id="editable">
          <Card id="editable-card" size={s.size}>
            <CardTitle id="edit-title">{s.title}</CardTitle>
            <CardDescription id="edit-number">{s.number}</CardDescription>
            <CardContent>{s.description}</CardContent>
            <CardContent id="noneditable-display" contentEditable={false}>
              {s.number}
            </CardContent>
          </Card>
        </div>
        <div contentEditable="plaintext-only" suppressContentEditableWarning id="plaintext">
          <Card>
            <CardContent id="plaintext-content">{s.title}</CardContent>
          </Card>
        </div>
        <Card id="wrapping" fit="content" className="max-w-full">
          <CardContent>{`${s.title} A long body wraps in the parent without a second measurement tree.`}</CardContent>
        </Card>
        <CadenceProvider mode="none">
          <Card id="none-child">
            <CardTitle>{s.title}</CardTitle>
          </Card>
        </CadenceProvider>
        <AnimatePresence>
          {s.later && (
            <Card key="inserted" id="later">
              <CardTitle>Inserted record</CardTitle>
              <CardContent>
                <Card id="later-nested">
                  <CardTitle>Nested new record</CardTitle>
                </Card>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
        <div id="destination">Destination</div>
        {portal &&
          createPortal(
            <CadenceProvider mode={s.childMode}>
              <Card id="portal-card">
                <CardTitle>{s.title}</CardTitle>
                <CardContent>{s.number}</CardContent>
              </Card>
            </CadenceProvider>,
            document.getElementById("portal"),
          )}
      </main>
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.cardRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.cardInitialMode} />
    </StrictMode>,
  );
  window.cardUnmount = () => flushSync(() => window.cardRoot.unmount());
}
