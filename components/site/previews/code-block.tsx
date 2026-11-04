"use client";

import { FileCode2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTitle,
} from "@/registry/cadence/code-block";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

const SOURCE = `export async function stream({ prompt, signal }: StreamOptions) {
  const response = await fetch("/api/chat", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) throw new Error(await response.text());

  const reader = response.body?.pipeThrough(new TextDecoderStream());

  for await (const chunk of reader) {
    controller.enqueue(chunk);
    if (signal.aborted) break;
  }
};`;

const INSTALL = {
  pnpm: "pnpm dlx shadcn@latest add @cadence/code-block",
  npm: "npx shadcn@latest add @cadence/code-block",
  yarn: "yarn dlx shadcn@latest add @cadence/code-block",
};

export function SourceExample() {
  return (
    <CodeBlock maxLines={6} language="tsx">
      <CodeBlockHeader>
        <CodeBlockTitle>
          <FileCode2Icon />
          app/api/chat/route.ts
        </CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={SOURCE} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
      <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)] justify-center">
        <CodeBlockExpandButton />
      </CodeBlockFooter>
    </CodeBlock>
  );
}

export function LineNumbersExample() {
  const source = "const response = await fetch(url);\n\nreturn response.json();";
  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>Lines 42–44</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={source} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers startLine={42}>
        {source}
      </CodeBlockContent>
    </CodeBlock>
  );
}

export function DiffExample() {
  const result = "for await (const chunk of reader) {\n  controller.enqueue(chunk);\n}";
  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>Stream change</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={result} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>
        <CodeBlockLine variant="removed">const chunks = await reader.read();</CodeBlockLine>
        <CodeBlockLine variant="added">{"for await (const chunk of reader) {"}</CodeBlockLine>
        <CodeBlockLine variant="highlighted">{"  controller.enqueue(chunk);"}</CodeBlockLine>
        <CodeBlockLine>{"}"}</CodeBlockLine>
      </CodeBlockContent>
    </CodeBlock>
  );
}

export function FoldingExample() {
  return (
    <div className="grid gap-4">
      <SourceExample />
      <CodeBlock maxLines={3} defaultExpanded>
        <CodeBlockHeader>
          <CodeBlockTitle>Initially expanded</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]">
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>
      <CodeBlock maxLines={3}>
        <CodeBlockHeader>
          <CodeBlockTitle>A short file needs no toggle</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{"export const ready = true;"}</CodeBlockContent>
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]">
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>
    </div>
  );
}

export function ToolOutputExample() {
  const stderr =
    "Error: Unable to write the generated report because the destination directory is read-only. Choose a writable destination and run the command again.\n\nNo files were changed.";
  return (
    <CodeBlock variant="destructive" size="sm">
      <CodeBlockHeader>
        <CodeBlockTitle>run_shell · exit 1</CodeBlockTitle>
      </CodeBlockHeader>
      <CodeBlockContent wrap className="max-h-48">
        {stderr}
      </CodeBlockContent>
    </CodeBlock>
  );
}

export function FloatingActionsExample() {
  const output = "Build complete.\nGenerated 74 routes.\nNo deployment was requested.";
  return (
    <CodeBlock>
      <CodeBlockActions>
        <CodeBlockCopyButton value={output} />
      </CodeBlockActions>
      <CodeBlockContent>{output}</CodeBlockContent>
    </CodeBlock>
  );
}

export function ContentTabsExample() {
  return (
    <CodeBlock defaultTab="pnpm" language="bash">
      <CodeBlockHeader>
        <CodeBlockTabs label="Package manager">
          <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
          <CodeBlockTab value="npm">npm</CodeBlockTab>
          <CodeBlockTab value="yarn">yarn</CodeBlockTab>
        </CodeBlockTabs>
        <CodeBlockActions>
          <CodeBlockCopyButton values={INSTALL} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockPanel value="pnpm">{INSTALL.pnpm}</CodeBlockPanel>
      <CodeBlockPanel value="npm">{INSTALL.npm}</CodeBlockPanel>
      <CodeBlockPanel value="yarn">{INSTALL.yarn}</CodeBlockPanel>
    </CodeBlock>
  );
}

export function HighlightingExample() {
  const source = "export const greeting = (name: string) => name.toUpperCase();";
  return (
    <div className="grid gap-4">
      <CodeBlock language="tsx">
        <CodeBlockHeader>
          <CodeBlockTitle>TypeScript highlighting</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers>{source}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock language="tsx">
        <CodeBlockHeader>
          <CodeBlockTitle>Content language override</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent language="json">{'{ "ready": true }'}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock language="unbundled-example-language">
        <CodeBlockHeader>
          <CodeBlockTitle>Unknown language stays readable</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{source}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

export function VisualVariantsExample() {
  return (
    <div className="grid gap-4">
      <CodeBlock variant="default">
        <CodeBlockHeader>
          <CodeBlockTitle>Successful output</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{"Report generated."}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock variant="destructive">
        <CodeBlockHeader>
          <CodeBlockTitle>Failed output</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{"Error: Destination is read-only."}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

export function SizesExample() {
  return (
    <div className="grid gap-4">
      <CodeBlock size="default">
        <CodeBlockHeader>
          <CodeBlockTitle>Default source</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{"export const ready = true;"}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock size="sm">
        <CodeBlockHeader>
          <CodeBlockTitle>Compact output</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent>{"Task completed."}</CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

export function ControlledFoldExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setExpanded(true)}>
          Expand from outside
        </Button>
        <Button variant="outline" onClick={() => setExpanded(false)}>
          Collapse from outside
        </Button>
      </div>
      <CodeBlock maxLines={4} expanded={expanded} onExpandedChange={setExpanded}>
        <CodeBlockHeader>
          <CodeBlockTitle>Caller-owned fold</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]">
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>
    </div>
  );
}

export function ControlledTabsExample() {
  const [tab, setTab] = useState("source");
  const values = { source: "export const ready = true;", output: "ready: true" };
  return (
    <div className="grid gap-3">
      <Button variant="outline" onClick={() => setTab("output")}>
        Show output from outside
      </Button>
      <CodeBlock tab={tab} onTabChange={setTab}>
        <CodeBlockHeader>
          <CodeBlockTabs label="Source or output">
            <CodeBlockTab value="source">Source</CodeBlockTab>
            <CodeBlockTab value="output">Output</CodeBlockTab>
          </CodeBlockTabs>
          <CodeBlockActions>
            <CodeBlockCopyButton values={values} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockPanel value="source">{values.source}</CodeBlockPanel>
        <CodeBlockPanel value="output">{values.output}</CodeBlockPanel>
      </CodeBlock>
    </div>
  );
}

export function UpdatingTextExample() {
  const [chunks, setChunks] = useState(0);
  const output = `Build started.\n${"Checked another route.\n".repeat(chunks)}`;
  const source = `export const ready = true;\n${"// Checked another route.\n".repeat(chunks)}`;
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setChunks((count) => count + 1)}>
          Append a local chunk
        </Button>
        <Button variant="outline" onClick={() => setChunks(0)}>
          Reset text
        </Button>
      </div>
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>Plain output</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={output} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent className="max-h-48">{output}</CodeBlockContent>
      </CodeBlock>
      <CodeBlock language="tsx">
        <CodeBlockHeader>
          <CodeBlockTitle>Highlighted source</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={source} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers className="max-h-48">
          {source}
        </CodeBlockContent>
      </CodeBlock>
    </div>
  );
}

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <div className="grid gap-4">
        <SourceExample />
        <CadenceProvider mode="full">
          <ContentTabsExample />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

const examples = {
  "line-numbers": LineNumbersExample,
  diff: DiffExample,
  folding: FoldingExample,
  "tool-output": ToolOutputExample,
  "floating-actions": FloatingActionsExample,
  "content-tabs": ContentTabsExample,
  highlighting: HighlightingExample,
  "visual-variants": VisualVariantsExample,
  sizes: SizesExample,
  "controlled-fold": ControlledFoldExample,
  "controlled-tabs": ControlledTabsExample,
  "updating-text": UpdatingTextExample,
  "without-motion": WithoutMotionExample,
};

export function CodeBlockPreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : SourceExample;
  if (!Example) return null;
  return (
    <PreviewStack>
      <div className="grid w-full max-w-xl gap-4">
        <Example />
      </div>
    </PreviewStack>
  );
}
