import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { StrictMode, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { MeasuredHeight } from "../../components/site/measured-height";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "../../registry/cadence/alert";
import { Card, CardContent } from "../../registry/cadence/card";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

const font = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
function Stateful() {
  const [count, set] = useState(0);
  useEffect(() => {
    window.alertMounts = (window.alertMounts ?? 0) + 1;
    return () => {
      window.alertUnmounts = (window.alertUnmounts ?? 0) + 1;
    };
  }, []);
  return (
    <button
      id="retry"
      type="button"
      onClick={() => {
        window.alertClicks = (window.alertClicks ?? 0) + 1;
        set((x) => x + 1);
      }}
    >
      Retry {count}
    </button>
  );
}
function Passive() {
  const [size, set] = useState(false);
  if (typeof window !== "undefined") window.alertPassive = () => flushSync(() => set((x) => !x));
  return <div id="passive" style={{ height: size ? 70 : 0 }} />;
}
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    title: "Deploy pending",
    description: "Review pending",
    count: 19,
    icon: "info",
    variant: "default",
    show: true,
    later: false,
    pad: 12,
    foreground: false,
    rootInk: false,
    surface: false,
    rich: false,
    action: true,
    edit: false,
    fixed: false,
    ratio: false,
    unknown: false,
    hidden: false,
    native: false,
    outer: "none",
    child: "full",
    childClock: 4,
    nested: false,
    refKey: 0,
    wide: false,
    unkeyed: false,
    unsafe: false,
    decoy: false,
    features: false,
  });
  const [portal, attach] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    attach(true);
    window.alertReady = true;
  }, []);
  if (typeof window !== "undefined")
    window.alertUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  const hostRef = (node) => {
    window.alertRefs ??= [];
    window.alertRefs.push({ key: s.refKey, node });
    ref.current = node;
    return () => window.alertRefs.push({ key: s.refKey, node, cleanup: true });
  };
  const icon =
    s.icon === "none" ? null : s.unsafe ? (
      <svg key={s.unkeyed ? undefined : s.icon} aria-hidden="true" viewBox="0 0 24 24">
        <foreignObject width="20" height="20">
          <div>Unsafe</div>
        </foreignObject>
      </svg>
    ) : s.icon === "info" ? (
      <CircleAlertIcon key={s.unkeyed ? undefined : "info"} aria-hidden="true" />
    ) : (
      <TriangleAlertIcon key={s.unkeyed ? undefined : s.icon} aria-hidden="true" />
    );
  const message = (
    <Alert
      key="message"
      id="message"
      ref={hostRef}
      variant={s.variant}
      className={s.surface ? "bg-muted" : undefined}
      style={{
        ...font,
        fontFeatureSettings: s.features ? '"ss01" 1' : "normal",
        paddingBottom: s.pad,
        height: s.fixed ? 120 : undefined,
        aspectRatio: s.ratio ? "2" : undefined,
        transform: s.unknown ? "rotate(4deg)" : undefined,
      }}
    >
      {icon}
      {s.decoy && (
        <span key="decoy" aria-hidden="true" id="decoy" className="col-start-2">
          Decorative label
        </span>
      )}
      <AlertTitle id="title" className={s.foreground ? "text-muted-foreground" : "text-foreground"}>
        {s.title}
      </AlertTitle>
      <AlertDescription id="description" className={s.foreground ? "text-foreground" : "text-muted-foreground"}>
        {s.rich ? (
          <div id="rich-body">
            <em>Rich current body</em>
            <label htmlFor="memo">Memo</label>
            <input id="memo" name="memo" defaultValue="draft" />
            <textarea id="editor" name="notes" aria-label="Notes" defaultValue="native draft" />
            <Passive />
          </div>
        ) : (
          s.description
        )}
      </AlertDescription>
      {s.action && (
        <AlertAction id="action">
          <Stateful />
        </AlertAction>
      )}
      <span id="arbitrary" className="col-start-2">
        <a href="#destination">Native link</a>
      </span>
    </Alert>
  );
  return (
    <CadenceProvider mode={s.mode} timeScale={s.clock}>
      <main
        style={{ ...font, width: s.wide ? 620 : 420, maxWidth: "100%", padding: 16 }}
        className="flex flex-col gap-6"
      >
        <h1>Alert runtime</h1>
        <button id="outside" type="button">
          Outside
        </button>
        <form id="form">
          <MeasuredHeight>
            <div className="grid gap-6">
              <div
                id="edit"
                contentEditable={s.edit}
                suppressContentEditableWarning
                style={{ display: s.hidden ? "none" : undefined }}
              >
                <AnimatePresence>{s.show && message}</AnimatePresence>
              </div>
              <Alert id="quantity" style={font}>
                <AlertTitle id="number-title">{s.count}</AlertTitle>
                <AlertDescription id="number-description">{s.count}</AlertDescription>
              </Alert>
            </div>
          </MeasuredHeight>
        </form>
        <Alert id="identifier" style={font}>
          <AlertTitle>{`ERR_0${s.count}`}</AlertTitle>
          <AlertDescription>Identifier stays text</AlertDescription>
        </Alert>
        <Alert id="paint-owner" style={font} className={s.rootInk ? "text-muted-foreground" : "text-card-foreground"}>
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle id="inherited-title">Inherited colour</AlertTitle>
          <AlertDescription
            id="independent-description"
            className={s.foreground ? "text-foreground" : "text-muted-foreground"}
          >
            Independent colour
          </AlertDescription>
        </Alert>
        <CadenceProvider mode={s.outer}>
          <Card id="outer">
            <CardContent>
              <CadenceProvider mode={s.child} timeScale={s.childClock}>
                <Alert id="nested" style={{ ...font, paddingBottom: s.pad }}>
                  <AlertTitle>{s.title}</AlertTitle>
                  <AlertDescription>{s.description}</AlertDescription>
                </Alert>
              </CadenceProvider>
            </CardContent>
          </Card>
        </CadenceProvider>
        <AnimatePresence>
          {s.later && (
            <Alert key="later" id="later">
              <AlertTitle>New message</AlertTitle>
              <AlertDescription>New current description</AlertDescription>
            </Alert>
          )}
        </AnimatePresence>
        {portal &&
          createPortal(
            <CadenceProvider mode={s.child} timeScale={s.childClock}>
              <Alert id="portal-message" style={font}>
                <AlertTitle>{s.title}</AlertTitle>
                <AlertDescription>{s.count}</AlertDescription>
              </Alert>
            </CadenceProvider>,
            document.getElementById("portal"),
          )}
        <div id="destination">Destination</div>
      </main>
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.alertRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.alertInitialMode} />
    </StrictMode>,
  );
  window.alertUnmount = () => flushSync(() => window.alertRoot.unmount());
}
