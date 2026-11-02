import React from "react";
import { createRoot } from "react-dom/client";
import { DocumentEntrance } from "../../components/site/document-entrance";
import { Button } from "../../registry/cadence/button";
import { Checkbox } from "../../registry/cadence/checkbox";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
} from "../../registry/cadence/code-block";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../registry/cadence/input-otp";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import { RadioGroup, RadioGroupItem } from "../../registry/cadence/radio-group";
import { Slider } from "../../registry/cadence/slider";
import { Toggle } from "../../registry/cadence/toggle";
import { ToggleGroup, ToggleGroupItem } from "../../registry/cadence/toggle-group";

// Deliberately external, asynchronous React updates. No act(), flushSync(), or
// interaction event can flush passive effects before the commit/paint probe.
function App() {
  const [state, setState] = React.useState({
    mode: "full",
    checked: false,
    value: "",
    disabled: false,
    timeScale: 8,
    expanded: false,
  });
  window.updateRuntime = (patch) => setState((old) => ({ ...old, ...patch }));
  React.useLayoutEffect(() => {
    window.runtimeCommits ??= [];
    const sample = (phase) =>
      window.runtimeCommits.push({
        phase,
        state,
        time: performance.now(),
        parts: [
          ...document.querySelectorAll(
            "[data-slot$='indicator'],[data-slot='input-otp-slot'] > span,[data-document-entrance],button,[data-slot='code-block-actions'],[data-slot='code-block-copy-button'] span[data-motion],[data-slot='code-block-expand-button'] > span[data-motion],[data-slot='code-block-viewport']",
          ),
        ].map((node) => {
          const css = getComputedStyle(node);
          return {
            slot: node.getAttribute("data-slot"),
            text: node.textContent,
            opacity: css.opacity,
            transform: css.transform,
            filter: css.filter,
            clip: css.clipPath,
            height: css.height,
            animations: node.getAnimations().map((a) => ({ state: a.playState, time: a.currentTime })),
          };
        }),
      });
    sample("commit");
    requestAnimationFrame(() => {
      sample("paint1");
      requestAnimationFrame(() => sample("paint2"));
    });
  });
  return (
    <CadenceProvider mode="none">
      <CadenceProvider mode={state.mode} timeScale={state.timeScale}>
        <Checkbox aria-label="Check" checked={state.checked} />
        <RadioGroup value={state.checked ? "a" : "b"}>
          <RadioGroupItem value="a" aria-label="A" />
          <RadioGroupItem value="b" aria-label="B" />
        </RadioGroup>
        <InputOTP maxLength={1} value={state.value} onChange={() => {}}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
        <Button disabled={state.disabled}>Press</Button>
        <Button disabled={state.disabled} focusableWhenDisabled>
          Focusable press
        </Button>
        <Toggle disabled={state.disabled}>Toggle</Toggle>
        <ToggleGroup disabled={state.disabled}>
          <ToggleGroupItem value="a">Group</ToggleGroupItem>
        </ToggleGroup>
        <Slider aria-label="Drag" defaultValue={50} disabled={state.disabled} style={{ width: 300, height: 24 }} />
        <DocumentEntrance as="article">Article</DocumentEntrance>
        <DocumentEntrance as="section">Section</DocumentEntrance>
        <DocumentEntrance>Div</DocumentEntrance>
        <CodeBlock maxLines={2} expanded={state.expanded} style={{ width: 400 }}>
          <CodeBlockActions>
            <CodeBlockCopyButton value="sample" />
          </CodeBlockActions>
          <CodeBlockContent style={{ lineHeight: "20px", padding: 8 }}>
            {Array.from({ length: 10 }, (_, i) => `line ${i}`).join("\n")}
          </CodeBlockContent>
          <CodeBlockExpandButton />
        </CodeBlock>
      </CadenceProvider>
    </CadenceProvider>
  );
}
createRoot(document.getElementById("root")).render(<App />);
