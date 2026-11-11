import { StrictMode, useEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { Kbd, KbdGroup } from "../../registry/cadence/kbd";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../registry/cadence/tooltip";

const extraKeys = Array.from({ length: 50 }, (_, index) => `extra-${index}`);
const font = { fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" };
export function App({ initialMode = "full" }) {
  const [s, set] = useState({
    mode: initialMode,
    clock: 4,
    label: "Control",
    second: "Shift",
    extra: false,
    reverse: false,
    show: true,
    later: false,
    number: 9,
    open: false,
    narrow: false,
    rich: false,
    palette: false,
    vertical: false,
    custom: false,
    features: false,
    fontSize: 12,
    hidden: false,
    clip: false,
    count: 0,
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    window.kbdReady = true;
  }, []);
  if (typeof window !== "undefined") {
    window.kbdState = s;
    window.kbdUpdate = (patch) => flushSync(() => set((old) => ({ ...old, ...patch })));
  }
  const keys = [
    <Kbd
      id="key-a"
      key="a"
      style={{
        ...font,
        fontSize: s.fontSize,
        transform: s.custom ? "rotate(5deg)" : undefined,
        fontFeatureSettings: s.features ? '"liga" 0' : "normal",
        ...(s.palette ? { backgroundColor: "rgb(250,250,250)", color: "rgb(32,32,32)" } : {}),
      }}
    >
      {s.rich ? <strong>{s.label}</strong> : s.label}
    </Kbd>,
    s.extra && (
      <Kbd id="key-b" key="b" style={font}>
        Alt
      </Kbd>
    ),
    <Kbd id="key-c" key="c" style={font}>
      {s.second}
    </Kbd>,
  ].filter(Boolean);
  if (s.reverse) keys.reverse();
  return (
    <StrictMode>
      <CadenceProvider mode={s.mode} timeScale={s.clock}>
        <main className="flex flex-col items-start gap-8 p-8" style={{ width: s.narrow ? 220 : "100%" }}>
          <h1>Keyboard shortcut changes</h1>
          <button id="native" type="button">
            Native focus target
          </button>
          {s.show && (
            <KbdGroup
              id="chord"
              className={s.vertical ? "flex-col gap-12" : "gap-12"}
              style={{ display: s.hidden ? "none" : undefined, overflow: s.clip ? "hidden" : undefined }}
            >
              {keys}
              {extraKeys.slice(0, s.count).map((id) => (
                <Kbd key={id} data-extra-key="" style={font}>
                  K
                </Kbd>
              ))}
            </KbdGroup>
          )}
          <Kbd id="standalone" style={font}>
            {s.label}
          </Kbd>
          <Kbd id="numeric" style={font}>
            {s.number}
          </Kbd>
          {s.later && (
            <>
              <Kbd id="later-alone" style={font}>
                New key
              </Kbd>
              <KbdGroup id="later">
                <Kbd key="new" style={font}>
                  New
                </Kbd>
              </KbdGroup>
            </>
          )}
          <div id="wrapping" className="w-full text-sm">
            A longer command description wrapping around{" "}
            <KbdGroup id="wrap-chord">
              <Kbd style={font}>{s.label}</Kbd>
              <Kbd style={font}>{s.second}</Kbd>
            </KbdGroup>{" "}
            safely.
          </div>
          <Tooltip open={s.open} onOpenChange={(open) => set((old) => ({ ...old, open }))}>
            <TooltipTrigger id="tooltip-trigger">Inspect shortcut</TooltipTrigger>
            <TooltipContent>
              Command{" "}
              <KbdGroup id="tooltip-chord" className="gap-12">
                <Kbd key="a" id="tooltip-a" style={font}>
                  {s.label}
                </Kbd>
                <Kbd key="b" id="tooltip-b" style={font}>
                  {s.second}
                </Kbd>
              </KbdGroup>
            </TooltipContent>
          </Tooltip>
          <CadenceProvider mode="none">
            <Kbd id="nested-none" style={font}>
              {s.label}
            </Kbd>
          </CadenceProvider>
          <CadenceProvider mode="full">
            <Kbd id="nested-full" style={font}>
              {s.label}
            </Kbd>
          </CadenceProvider>
          {ready &&
            createPortal(
              <KbdGroup id="portal-chord">
                <Kbd style={font}>{s.label}</Kbd>
              </KbdGroup>,
              document.querySelector("#portal"),
            )}
        </main>
      </CadenceProvider>
    </StrictMode>
  );
}
if (typeof document !== "undefined")
  hydrateRoot(document.getElementById("root"), <App initialMode={window.kbdInitialMode} />);
