import { FolderIcon, InboxIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { StrictMode, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Card, CardContent } from "../../registry/cadence/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../registry/cadence/empty";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { bindMotionParameters, geometryContent } from "../../registry/cadence/lib/motion";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider, useCadenceMotion } from "../../registry/cadence/lib/provider";

const font = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
/** Caller-owned final-width state-region size. Empty supplies no second height. */
function StateRegion({ children }) {
  const node = useRef(null),
    delivery = useRef(null),
    cm = useCadenceMotion(node);
  const [group] = useState(() => {
    const transaction = createMotionTransaction();
    let pending = false;
    return {
      transaction,
      controller: createMeasuredGeometry(transaction),
      request() {
        if (pending) return;
        pending = true;
        queueMicrotask(() => {
          pending = false;
          delivery.current?.();
        });
      },
    };
  });
  useInsertionEffect(() => group.controller.prepare());
  committed(() => {
    const release = group.controller.register({
      host: node,
      content: node.current,
      axes: ["height"],
      observeChildren: true,
      textGeometry: true,
      measure() {
        const box = naturalGeometry(node.current);
        return box
          ? {
              height: {
                size: box.height,
                min: Math.max(0, box.height - 12),
                max: Infinity,
                readable: true,
                independent: true,
              },
            }
          : null;
      },
    });
    return () => {
      release();
      group.controller.settle();
    };
  }, [group]);
  committed(() => {
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    delivery.current = () =>
      group.controller.commit(group.transaction.revision("content", node.current.textContent, node), {
        transition: parameters.transition,
        reduced: cm.reduced,
        available: true,
      });
    delivery.current();
  });
  return (
    <GeometryScope.Provider value={group}>
      <div ref={node} id="outer" data-motion={cm.mode} className="border p-3">
        {children}
      </div>
    </GeometryScope.Provider>
  );
}
function Recovery() {
  const [clicks, set] = useState(0);
  useEffect(() => {
    window.emptyMounts = (window.emptyMounts ?? 0) + 1;
    return () => {
      window.emptyUnmounts = (window.emptyUnmounts ?? 0) + 1;
    };
  }, []);
  return (
    <>
      <button id="recover" type="button" onClick={() => set((x) => x + 1)}>
        Recover {clicks}
      </button>
      <input id="memo" name="memo" aria-label="Memo" defaultValue="draft" />
      <a href="#destination">Native route</a>
    </>
  );
}
function Passive() {
  const [size, set] = useState(false);
  if (typeof window !== "undefined") window.emptyPassive = () => flushSync(() => set((x) => !x));
  return <div id="passive" style={{ height: size ? 75 : 0 }} />;
}
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    show: true,
    title: "Nothing pending",
    description: "Review pending",
    content: "Collection pending",
    count: 19,
    media: "inbox",
    pad: 48,
    tone: false,
    rich: false,
    edit: false,
    fixed: false,
    ratio: false,
    transform: false,
    hidden: false,
    features: false,
    wide: false,
    later: false,
    outer: "none",
    child: "full",
    childClock: 4,
    mediaVariant: "icon",
    refKey: 0,
  });
  const [portal, attach] = useState(false);
  useEffect(() => {
    attach(true);
    window.emptyReady = true;
  }, []);
  if (typeof window !== "undefined")
    window.emptyUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  const rootRef = (node) => {
    window.emptyRefs ??= [];
    window.emptyRefs.push({ node, key: s.refKey });
    return () => window.emptyRefs.push({ node, key: s.refKey, cleanup: true });
  };
  const media =
    s.media === "late" ? (
      <img key="late" src="/late.svg" width="40" height="40" alt="" />
    ) : s.media === "inbox" ? (
      <InboxIcon key="inbox" aria-hidden="true" />
    ) : (
      <FolderIcon key={s.media} aria-hidden="true" />
    );
  const body = (
    <Empty
      key="empty"
      id="message"
      ref={rootRef}
      className={s.tone ? "border bg-muted text-muted-foreground" : "border bg-card text-foreground"}
      style={{
        ...font,
        fontFeatureSettings: s.features ? '"ss01" 1' : "normal",
        paddingBottom: s.pad,
        height: s.fixed ? 360 : undefined,
        aspectRatio: s.ratio ? "2" : undefined,
        transform: s.transform ? "rotate(4deg)" : undefined,
      }}
    >
      <EmptyHeader id="header">
        <EmptyMedia
          id="media"
          variant={s.mediaVariant}
          className={s.tone ? "bg-card text-muted-foreground" : "bg-muted text-foreground"}
        >
          {media}
        </EmptyMedia>
        <EmptyTitle id="title" className={s.tone ? "text-muted-foreground" : "text-foreground"}>
          {s.title}
        </EmptyTitle>
        <EmptyDescription id="description" className={s.tone ? "text-foreground" : "text-muted-foreground"}>
          {s.rich ? (
            <em id="rich-description">
              Rich <a href="#destination">description</a>
            </em>
          ) : (
            s.description
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent id="content" className={s.tone ? "text-muted-foreground" : "text-foreground"}>
        {s.content}
      </EmptyContent>
      <EmptyContent id="actions">
        <Recovery />
        <Passive />
      </EmptyContent>
    </Empty>
  );
  return (
    <CadenceProvider mode={s.mode} timeScale={s.clock}>
      <main
        style={{ ...font, width: s.wide ? 700 : 540, maxWidth: "100%", padding: 16 }}
        className="flex flex-col gap-4"
      >
        <h1>Empty runtime</h1>
        <button id="outside" type="button">
          Outside
        </button>
        <form id="form">
          <div
            id="edit"
            contentEditable={s.edit}
            suppressContentEditableWarning
            style={{ display: s.hidden ? "none" : undefined }}
          >
            <AnimatePresence>
              {s.show ? (
                body
              ) : (
                <p key="populated" id="populated">
                  Current populated results
                </p>
              )}
            </AnimatePresence>
          </div>
        </form>
        <Empty id="quantity" style={font}>
          <EmptyHeader>
            <EmptyTitle id="number-title">{s.count}</EmptyTitle>
            <EmptyDescription id="number-description">{s.count}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent id="number-content">{s.count}</EmptyContent>
        </Empty>
        <Empty id="identifier" style={font}>
          <EmptyTitle>{`ID_0${s.count}`}</EmptyTitle>
        </Empty>
        <CadenceProvider mode={s.outer}>
          <StateRegion>
            <CadenceProvider mode={s.child} timeScale={s.childClock}>
              <Empty id="nested" style={{ ...font, paddingBottom: s.pad }}>
                <EmptyHeader>
                  <EmptyTitle id="nested-title">{s.title}</EmptyTitle>
                  <EmptyDescription id="nested-description">{s.description}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CadenceProvider>
          </StateRegion>
        </CadenceProvider>
        <Card>
          <CardContent>
            <Empty>
              <EmptyTitle>Rich Card composition</EmptyTitle>
              <EmptyDescription>
                <em>Native rich content</em>
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
        <AnimatePresence>
          {s.later && (
            <Empty key="later" id="later">
              <EmptyTitle>New empty result</EmptyTitle>
              <EmptyContent>
                <button type="button">New recovery</button>
              </EmptyContent>
            </Empty>
          )}
        </AnimatePresence>
        {portal &&
          createPortal(
            <CadenceProvider mode={s.child} timeScale={s.childClock}>
              <Empty id="portal-empty" style={font}>
                <EmptyHeader>
                  <EmptyTitle>{s.title}</EmptyTitle>
                  <EmptyDescription>{s.count}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CadenceProvider>,
            document.getElementById("portal"),
          )}
        <div id="destination">Destination</div>
      </main>
    </CadenceProvider>
  );
}
if (typeof document !== "undefined") {
  window.emptyRoot = hydrateRoot(
    document.getElementById("root"),
    <StrictMode>
      <App initialMode={window.emptyInitialMode} />
    </StrictMode>,
  );
  window.emptyUnmount = () => flushSync(() => window.emptyRoot.unmount());
}
