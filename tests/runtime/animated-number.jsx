import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { AnimatedNumber } from "../../registry/cadence/animated-number";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

export function App() {
  const [state, update] = useState({
    value: 12,
    mode: "full",
    timeScale: 3,
    direction: "trend",
    mounted: true,
    entity: 1,
  });
  if (typeof window !== "undefined")
    window.publicNumberUpdate = (patch) => flushSync(() => update((old) => ({ ...old, ...patch })));
  return (
    <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
      <button
        id="action"
        type="button"
        onClick={() => update((old) => ({ ...old, value: old.value === 12 ? 13 : 12 }))}
      >
        {state.mounted && (
          <AnimatedNumber
            key={state.entity}
            id="public"
            value={state.value}
            locales={state.locales}
            format={state.format}
            direction={state.direction}
          />
        )}
      </button>
      <a href="#destination" id="rich">
        Rich sibling
      </a>
      <div contentEditable="plaintext-only" suppressContentEditableWarning id="editor">
        <AnimatedNumber value={123} id="editable" />
      </div>
    </CadenceProvider>
  );
}

if (typeof document !== "undefined")
  window.publicRoot = hydrateRoot(
    document.getElementById("root"),
    window.publicStrict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
