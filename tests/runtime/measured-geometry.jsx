import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { CodeBlock, CodeBlockContent } from "../../registry/cadence/code-block";
import { createMeasuredGeometry, naturalGeometry } from "../../registry/cadence/lib/measured-geometry";
import { transitionFor } from "../../registry/cadence/lib/motion";
import { createMotionTransaction } from "../../registry/cadence/lib/motion-transaction";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { Popover, PopoverContent, PopoverTrigger } from "../../registry/cadence/popover";

function App() {
  const [state, set] = React.useState({ expanded: false, mode: "full", clock: 3, lines: 20, mounted: true });
  window.updateGeometry = (patch) => set((old) => ({ ...old, ...patch }));
  React.useLayoutEffect(() => {
    window.geometryReady = true;
    const snapshot = () => {
      const n = document.querySelector("[data-slot=code-block-viewport]");
      const pre = document.querySelector("pre"),
        css = n && getComputedStyle(n);
      return {
        ...state,
        height: n?.offsetHeight,
        full: pre
          ? pre.offsetHeight +
            (css
              ? [css.paddingTop, css.paddingBottom, css.borderTopWidth, css.borderBottomWidth].reduce(
                  (sum, v) => sum + (Number.parseFloat(v) || 0),
                  0,
                )
              : 0)
          : undefined,
        effects: n?.getAnimations().length,
      };
    };
    window.geometryCommits ??= [];
    window.geometryCommits.push(snapshot());
    const f = requestAnimationFrame(() => {
      window.geometryPaints ??= [];
      window.geometryPaints.push(snapshot());
    });
    return () => cancelAnimationFrame(f);
  });
  const content = state.mounted && (
    <CodeBlock maxLines={2} expanded={state.expanded}>
      <CodeBlockContent style={{ lineHeight: "20px", padding: "10px", ...state.preStyles }}>
        {state.rich ? (
          <span>{Array.from({ length: state.lines }, (_, i) => `Line ${i}`).join("\n")}</span>
        ) : (
          Array.from({ length: state.lines }, (_, i) => `Line ${i}`).join("\n")
        )}
      </CodeBlockContent>
    </CodeBlock>
  );
  return (
    <CadenceProvider mode={state.mode} timeScale={state.clock}>
      {state.popup ? (
        <Popover open={state.open}>
          <PopoverTrigger>Geometry popup</PopoverTrigger>
          <PopoverContent initialFocus={false}>{content}</PopoverContent>
        </Popover>
      ) : (
        content
      )}
    </CadenceProvider>
  );
}
const tree = window.geometryStrict ? (
  <React.StrictMode>
    <App />
  </React.StrictMode>
) : (
  <App />
);
window.geometryReactVersion = React.version;
if (window.geometrySSR) hydrateRoot(document.getElementById("root"), tree);
else createRoot(document.getElementById("root")).render(tree);

const transaction = createMotionTransaction();
let controller;
const disposals = [];
window.mountCompound = (kind = "nested") => {
  controller?.dispose();
  document.getElementById("compound").innerHTML =
    `<div id="outer"><div id="natural"><div id="inner"><div id="leaf">Text <input id="editor" name="unique" value="selection"></div></div></div></div>`;
  controller = createMeasuredGeometry(transaction);
  window.reads = 0;
  for (const id of kind === "nested" ? ["outer", "inner"] : ["outer"]) {
    const host = document.getElementById(id);
    const content = host.firstElementChild;
    disposals.push(
      controller.register({
        host: { current: host },
        content,
        axes: kind === "width" ? ["width", "height"] : ["height"],
        measure() {
          if (window.failGeometryMeasure) throw new Error("expected adapter failure");
          window.reads++;
          const box = naturalGeometry(host);
          return box
            ? {
                height: {
                  size: box.height,
                  readable: kind !== "unsafe",
                  independent: kind !== "cycle" && !host.style.height,
                },
                ...(kind === "width" ? { width: { size: box.width, readable: false } } : {}),
              }
            : null;
        },
      }),
    );
  }
  window.commitCompound(0);
};
window.commitCompound = (target, mode = "full", clock = 3) =>
  controller.commit(transaction.revision("content", target), {
    reduced: mode !== "full",
    transition: transitionFor("geometry.resize", mode, { timeScale: clock }),
  });
window.disposeCompound = () => controller.dispose();
window.mountCollection = (count, descendants = false) => {
  controller?.dispose();
  const form = document.querySelector("#compound");
  form.replaceChildren();
  controller = createMeasuredGeometry(transaction);
  window.reads = 0;
  for (let i = 0; i < (descendants ? 1 : count); i++) {
    const host = document.createElement("div"),
      content = document.createElement("div");
    host.dataset.geometryHost = "";
    host.style.outline = "1px solid";
    content.textContent = `Member ${i}`;
    content.style.height = "20px";
    host.append(content);
    form.append(host);
    if (descendants) for (let j = 0; j < count; j++) content.append(document.createElement("span"));
    controller.register({
      host: { current: host },
      content,
      axes: ["height"],
      measure() {
        window.reads++;
        return { height: { size: content.offsetHeight, readable: true, independent: true } };
      },
    });
  }
  window.commitCompound("collection-baseline");
};
window.mountDelegated = (count) => {
  window.mountCollection(0, true);
  const content = document.querySelector("[data-geometry-host]>div");
  content.style.height = "auto";
  for (let i = 0; i < count; i++) {
    const host = document.createElement("div"),
      natural = document.createElement("div");
    natural.style.height = "20px";
    host.append(natural);
    content.append(host);
    controller.register({
      host: { current: host },
      content: natural,
      axes: ["height"],
      measure() {
        window.reads++;
        return { height: { size: natural.offsetHeight, independent: true, readable: true } };
      },
    });
  }
  controller.settle();
  window.reads = 0;
};
window.addCollectionOwner = () => {
  const host = document.createElement("div"),
    content = document.createElement("div");
  host.dataset.geometryHost = "";
  host.style.outline = "1px solid";
  content.textContent = "Additional member";
  content.style.height = "20px";
  host.append(content);
  document.querySelector("#compound").append(host);
  controller.register({
    host: { current: host },
    content,
    axes: ["height"],
    measure() {
      window.reads++;
      return { height: { size: content.offsetHeight, readable: true, independent: true } };
    },
  });
};
window.mountSafeWidth = (mode) => {
  controller?.dispose();
  document.querySelector("#compound").innerHTML =
    '<button type="button" data-slot="geometry-width-native" style="display:inline-flex;justify-content:flex-start;overflow:visible;padding:4px 8px;border:1px solid"><span style="display:block;width:max-content;white-space:nowrap;flex-shrink:0">Short</span></button>';
  const host = document.querySelector("[data-slot=geometry-width-native]"),
    content = host.firstElementChild;
  host.dataset.motion = mode;
  controller = createMeasuredGeometry(transaction);
  controller.register({
    host: { current: host },
    content,
    axes: ["width"],
    measure() {
      const box = naturalGeometry(host);
      return box ? { width: { size: box.width, min: 0, max: box.width, independent: true, readable: true } } : null;
    },
  });
  window.commitCompound("width-baseline", mode);
};
customElements.define(
  "s07-geometry-owner",
  class extends HTMLElement {
    connectedCallback() {
      this.scope = createMeasuredGeometry(transaction);
      this.scope.register({
        host: { current: this },
        content: this.firstElementChild,
        axes: ["height"],
        measure: () => {
          const box = naturalGeometry(this);
          return box ? { height: { size: box.height, readable: true, independent: true } } : null;
        },
      });
      this.scope.commit(transaction.revision("environment", {}, this), { reduced: true, transition: { duration: 0 } });
    }
    disconnectedCallback() {
      this.scope.dispose();
    }
  },
);
window.mountNativeLifetimes = () => {
  document.querySelector("#compound").replaceChildren();
  for (let i = 0; i < 2; i++) {
    const node = document.createElement("s07-geometry-owner"),
      content = document.createElement("div");
    node.id = `native-life-${i}`;
    node.style.cssText = "display:block;width:200px";
    content.style.height = "20px";
    node.append(content);
    document.querySelector("#compound").append(node);
  }
};
window.updateNativeLife = (node, height) => {
  node.firstElementChild.style.height = `${height}px`;
  node.scope.commit(transaction.revision("content", height, node), {
    reduced: false,
    transition: transitionFor("geometry.resize", "full", { timeScale: 3 }),
  });
};
