import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Badge } from "../../registry/cadence/badge";
import { Button } from "../../registry/cadence/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../registry/cadence/card";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../registry/cadence/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../registry/cadence/tabs";

const mono = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
function Editor() {
  const [count, set] = useState(0);
  useEffect(() => {
    window.pilotMounts = (window.pilotMounts ?? 0) + 1;
    return () => {
      window.pilotUnmounts = (window.pilotUnmounts ?? 0) + 1;
    };
  }, []);
  return (
    <>
      <label htmlFor="memo">Draft</label>
      <textarea id="memo" name="memo" defaultValue="saved draft" aria-describedby="memo-help" />
      <p id="memo-help">Native retained draft</p>
      <Button id="local" type="button" onClick={() => set(count + 1)}>
        Local {count}
      </Button>
    </>
  );
}
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    childMode: undefined,
    label: "Status alpha",
    count: 19,
    size: "default",
    active: "a",
    value: "a",
    show: true,
    later: false,
    wide: true,
    refKey: 0,
  });
  useEffect(() => {
    window.pilotsReady = true;
  }, []);
  if (typeof window !== "undefined") {
    window.pilotsUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  }
  const trackRef = (node) => {
    if (!node) return;
    window.pilotRefs ??= [];
    window.pilotRefs.push({ node, key: s.refKey });
    return () => window.pilotRefs.push({ node, key: s.refKey, cleanup: true });
  };
  return (
    <CadenceProvider mode={s.mode} timeScale={s.clock}>
      <main style={{ ...mono, padding: 16, width: s.wide ? 680 : 350, maxWidth: "100%" }}>
        <h1>Five pilot ownership gate</h1>
        <button id="outside" type="button">
          Outside
        </button>
        <form id="form">
          {s.show && (
            <Card id="outer" size={s.size} ref={trackRef} className="w-full">
              <CardHeader>
                <CardTitle id="title">{s.label}</CardTitle>
                <CardDescription>One semantic tree, independent property owners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-start gap-2">
                  <Button id="label-button" type="button">
                    {s.label}
                  </Button>
                  <Badge id="label-badge">{s.label}</Badge>
                  <Button id="number-button" type="button">
                    {s.count}
                  </Button>
                  <Badge id="number-badge">{s.count}</Badge>
                </div>
              </CardContent>
              <CardContent>
                <CadenceProvider mode={s.childMode}>
                  <Card id="inner" fit="content" size={s.size}>
                    <CardTitle id="inner-title">{s.label}</CardTitle>
                    <CardContent>
                      <Badge id="inner-badge">{s.label}</Badge>
                    </CardContent>
                  </Card>
                </CadenceProvider>
              </CardContent>
              <CardContent>
                <Tabs id="tabs" value={s.active} onValueChange={(active) => set((old) => ({ ...old, active }))}>
                  <TabsList id="list" variant="line" aria-label="Workspace views">
                    <TabsTrigger id="tab-a" value="a">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger id="tab-b" value="b">
                      Details
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent data-pilot-panel="a" value="a" keepMounted>
                    <Editor />
                    <Select
                      name="plan"
                      value={s.value}
                      onValueChange={(value) => {
                        window.pilotSelections = (window.pilotSelections ?? 0) + 1;
                        set((old) => ({ ...old, value }));
                      }}
                      modal={false}
                      onOpenChangeComplete={(open) => {
                        window.pilotOpenCompletions ??= [];
                        window.pilotOpenCompletions.push(open);
                      }}
                    >
                      <SelectTrigger id="select" aria-label="Plan">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent id="popup" style={mono} alignItemWithTrigger={false}>
                        <SelectGroup>
                          <SelectItem id="option-a" value="a">
                            Plan AAA
                          </SelectItem>
                          <SelectItem id="option-b" value="b">
                            Plan BBB
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent data-pilot-panel="b" value="b" keepMounted>
                    <Card id="details" size="sm">
                      <CardContent>
                        <Badge>Details active</Badge>
                        <Button type="button">Continue</Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </form>
        <AnimatePresence>
          {s.later && (
            <Card id="inserted" key="inserted" size="sm">
              <CardHeader>
                <CardTitle>Inserted surface</CardTitle>
              </CardHeader>
              <CardContent>
                <Button id="inserted-button">Action</Button>
                <Badge id="inserted-badge">Ready</Badge>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
        <Card id="independent" size="sm">
          <CardContent>
            <Badge id="independent-badge">{s.label}</Badge>
          </CardContent>
        </Card>
      </main>
    </CadenceProvider>
  );
}
if (typeof window !== "undefined")
  window.pilotsRoot = hydrateRoot(document.getElementById("root"), <App initialMode={window.pilotsInitialMode} />);
