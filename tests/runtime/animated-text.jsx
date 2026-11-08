import { StrictMode, useState } from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import { AnimatedText } from "../../registry/cadence/animated-text";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

export function App() {
  const [state, update] = useState({
    value: "Save",
    mode: "full",
    timeScale: 1,
    granularity: "auto",
    mounted: true,
    entity: 1,
  });
  if (typeof window !== "undefined")
    window.publicTextUpdate = (patch) => flushSync(() => update((old) => ({ ...old, ...patch })));
  return (
    <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
      <button
        id="action"
        type="button"
        onClick={() => update((old) => ({ ...old, value: old.value === "Save" ? "Saved" : "Save" }))}
      >
        {state.mounted && (
          <AnimatedText key={state.entity} id="public" value={state.value} granularity={state.granularity} />
        )}
      </button>
      <a href="#destination" id="rich">
        Rich sibling
      </a>
      <div contentEditable="plaintext-only" suppressContentEditableWarning id="editor">
        <AnimatedText value="Native" id="editable" />
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
