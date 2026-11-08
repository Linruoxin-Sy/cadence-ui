import React from "react";
import { flushSync } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Button } from "../../registry/cadence/button";
import { Calendar } from "../../registry/cadence/calendar";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { Popover, PopoverContent, PopoverTrigger } from "../../registry/cadence/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../registry/cadence/tabs";

const initial = {
  mode: "full",
  clock: 4,
  value: "a",
  month: 10,
  count: 2,
  mounted: true,
  orientation: "horizontal",
  variant: "line",
  text: "Alpha",
  active: true,
  rtl: false,
  caller: false,
  native: false,
  reject: false,
  pending: false,
  rootKey: 0,
  press: false,
  popup: false,
  popupOpen: true,
  reverse: false,
};
function Boundary({ popup, open, children }) {
  if (!popup) return children;
  return (
    <Popover open={open}>
      <PopoverTrigger>Open pilot</PopoverTrigger>
      <PopoverContent>{children}</PopoverContent>
    </Popover>
  );
}
export function App() {
  const [state, set] = React.useState(initial);
  if (typeof window !== "undefined") {
    window.contentUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
    window.contentReset = () => flushSync(() => set({ ...initial, rootKey: Date.now() }));
  }
  React.useLayoutEffect(() => {
    window.contentReady = true;
    window.contentReactVersion = React.version;
  });
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      <Boundary popup={state.popup} open={state.popupOpen}>
        {state.mounted && (
          <section key={state.rootKey} dir={state.rtl ? "rtl" : "ltr"}>
            <Tabs
              value={state.active ? state.value : null}
              orientation={state.orientation}
              onValueChange={(value, details) => {
                if (state.reject) details.cancel();
                else set((old) => ({ ...old, value }));
              }}
              style={{ padding: 16, width: 420 }}
            >
              <TabsList variant={state.variant} style={{ maxWidth: 380 }} aria-label="Views">
                <TabsTrigger value="a">{state.text}</TabsTrigger>
                <TabsTrigger value="b" render={state.press ? <Button /> : undefined}>
                  Beta longer
                </TabsTrigger>
                <TabsTrigger value="c">Charlie</TabsTrigger>
              </TabsList>
              <TabsContent value="a" keepMounted>
                <input name="draft" aria-label="Draft" defaultValue="retained" />
                <span id="original-label">First panel</span>
              </TabsContent>
              <TabsContent value="b" keepMounted>
                {state.pending ? (
                  <span>Loading</span>
                ) : (
                  <>
                    <label htmlFor="editor">Editor</label>
                    <textarea id="editor" name="editor" defaultValue="saved" />
                  </>
                )}
              </TabsContent>
              <TabsContent value="c">Third panel</TabsContent>
            </Tabs>
            <Calendar
              aria-label="Month pilot"
              month={new Date(2026, state.month, 1)}
              onMonthChange={(date) => set((old) => ({ ...old, month: date.getMonth() }))}
              numberOfMonths={state.count}
              reverseMonths={state.reverse}
              dir={state.rtl ? "rtl" : "ltr"}
              animate={state.native}
              styles={state.caller ? { month_grid: { transform: "translateX(3px)", opacity: 0.7 } } : undefined}
            />
            <Tabs defaultValue="a">
              <TabsList variant="line" aria-label="Independent">
                <TabsTrigger value="a">Other A</TabsTrigger>
                <TabsTrigger value="b">Other B</TabsTrigger>
              </TabsList>
              <TabsContent value="a">Other panel</TabsContent>
              <TabsContent value="b">Independent panel</TabsContent>
            </Tabs>
          </section>
        )}
      </Boundary>
    </CadenceProvider>
  );
}
const content = <App />;
if (typeof document !== "undefined") {
  const tree = window.contentStrict ? <React.StrictMode>{content}</React.StrictMode> : content;
  if (window.contentSSR) hydrateRoot(document.getElementById("root"), tree);
  else createRoot(document.getElementById("root")).render(tree);
}
