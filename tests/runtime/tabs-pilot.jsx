import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Suspense, use, useEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { tabsColourReadable } from "../../registry/cadence/lib/tabs-colour";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../registry/cadence/tabs";

function Editor() {
  const [count, set] = useState(0);
  useEffect(() => {
    window.tabsMounts = (window.tabsMounts ?? 0) + 1;
    return () => {
      window.tabsUnmounts = (window.tabsUnmounts ?? 0) + 1;
    };
  }, []);
  return (
    <>
      <label htmlFor="draft">Draft</label>
      <textarea id="draft" name="draft" defaultValue="saved draft" aria-describedby="draft-help" />
      <p id="draft-help">Retained original editor</p>
      <button id="local-state" type="button" onClick={() => set(count + 1)}>
        Local {count}
      </button>
    </>
  );
}
function Small({ id, mode }) {
  return (
    <CadenceProvider mode={mode}>
      <Tabs id={id} defaultValue="a">
        <TabsList variant="line" aria-label={id}>
          <TabsTrigger value="a">Alpha</TabsTrigger>
          <TabsTrigger value="b">Beta</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Inner alpha</TabsContent>
        <TabsContent value="b">Inner beta</TabsContent>
      </Tabs>
    </CadenceProvider>
  );
}
function AsyncBody({ resource }) {
  const value = use(resource);
  return (
    <div id="async-content" style={{ height: 120 }}>
      {value}
    </div>
  );
}
export function App({ initialMode = "full" }) {
  const [resource, setResource] = useState(null);
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    active: "b",
    label: "Alpha overview",
    content: "Panel pending",
    quantity: 19,
    variant: "line",
    vertical: false,
    wide: false,
    nested: false,
    innerMode: "none",
    transform: false,
    removed: false,
    reorder: false,
    show: true,
    key: 0,
    richHeight: 36,
    invalid: false,
    ink: false,
    loading: false,
    rtl: false,
    scroll: false,
    panelKey: 0,
  });
  const [portal, ready] = useState(false);
  useEffect(() => {
    ready(true);
    window.tabsReady = true;
  }, []);
  if (typeof window !== "undefined")
    window.tabsUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  if (typeof window !== "undefined")
    window.tabsPaletteReadable = () => tabsColourReadable(document.getElementById("tab-b"));
  if (typeof window !== "undefined")
    window.tabsBegin = () => {
      let resolve;
      const promise = new Promise((done) => {
        resolve = done;
      });
      window.tabsResolve = () => resolve("Asynchronously resolved");
      flushSync(() => setResource(promise));
    };
  const first = (
    <TabsTrigger key="a" id="tab-a" value="a">
      {s.label}
    </TabsTrigger>
  );
  const second = (
    <TabsTrigger
      key="b"
      id="tab-b"
      value="b"
      aria-invalid={s.invalid || undefined}
      className={s.ink ? "text-muted-foreground" : "text-foreground"}
    >
      Beta
    </TabsTrigger>
  );
  return (
    <CadenceProvider mode={s.mode} timeScale={s.clock}>
      <DirectionProvider direction={s.rtl ? "rtl" : "ltr"}>
        <main
          style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal", maxWidth: 700, padding: 24 }}
        >
          <form id="form">
            {s.show && (
              <Tabs
                id="primary"
                key={s.key}
                value={s.active}
                onValueChange={(active) => set((old) => ({ ...old, active }))}
                orientation={s.vertical ? "vertical" : "horizontal"}
                className="p-3"
                style={{ width: s.vertical ? 600 : 360, maxWidth: "100%" }}
              >
                <TabsList
                  id="list"
                  aria-label="Views"
                  variant={s.variant}
                  className={[s.wide ? "w-full" : "", s.scroll ? "max-w-[180px] overflow-x-auto" : ""].join(" ")}
                  style={{ transform: s.transform ? "translateX(8px) scale(0.9)" : undefined }}
                >
                  {s.reorder ? [second, ...(s.removed ? [] : [first])] : [...(s.removed ? [] : [first]), second]}
                  <TabsTrigger id="tab-c" value="c">
                    Gamma
                  </TabsTrigger>
                  <TabsTrigger value="disabled" disabled>
                    Locked
                  </TabsTrigger>
                </TabsList>
                <TabsContent id="panel-a" value="a" keepMounted>
                  <Editor />
                  {s.nested && <Small id="nested" mode={s.innerMode} />}
                </TabsContent>
                <TabsContent id="panel-b" value="b" keepMounted className="whitespace-pre-line">
                  {s.content}
                </TabsContent>
                <TabsContent key={s.panelKey} id="panel-c" value="c" className="p-3">
                  {resource ? (
                    <Suspense
                      fallback={
                        <div id="async-fallback" style={{ height: 30 }}>
                          Loading real fallback
                        </div>
                      }
                    >
                      <AsyncBody resource={resource} />
                    </Suspense>
                  ) : (
                    <div id="async-content" style={{ height: s.richHeight }}>
                      {s.loading ? "Loading" : "Resolved content"}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </form>
          <Tabs id="quantity" defaultValue="count" className="mt-6">
            <TabsList aria-label="Quantity">
              <TabsTrigger value="count">{s.quantity}</TabsTrigger>
            </TabsList>
            <TabsContent value="count">{s.quantity}</TabsContent>
          </Tabs>
          <Small id="sibling" />
          {portal && createPortal(<Small id="portal-tabs" />, document.getElementById("portal"))}
        </main>
      </DirectionProvider>
    </CadenceProvider>
  );
}
if (typeof window !== "undefined" && document.getElementById("root")) {
  const root = hydrateRoot(document.getElementById("root"), <App initialMode={window.tabsInitialMode} />);
  window.tabsUnmount = () => flushSync(() => root.unmount());
}
