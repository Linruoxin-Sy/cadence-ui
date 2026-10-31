"use client";

import { FileCode2 } from "lucide-react";
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
} from "@/registry/cadence/code-block/code-block";

const STREAM = `export async function stream({ prompt, signal }: StreamOptions) {
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

const PATCH = [
  { variant: "removed" as const, text: "const chunks = await reader.read();" },
  { variant: "added" as const, text: "for await (const chunk of reader) {" },
  { variant: "default" as const, text: "  controller.enqueue(chunk);" },
  { variant: "added" as const, text: "  if (signal.aborted) break;" },
  { variant: "added" as const, text: "}" },
];

const INSTALL = {
  pnpm: "pnpm dlx shadcn@latest add @cadence/code-block",
  npm: "npx shadcn@latest add @cadence/code-block",
  yarn: "yarn dlx shadcn@latest add @cadence/code-block",
};

const FAILURE = `TypeError: Cannot read properties of undefined (reading 'chunk')
    at consume (app/api/chat/route.ts:42:18)
    at async POST (app/api/chat/route.ts:18:5)

Upstream responded 502 after 2 retries; the stream was closed.`;

export function CodeBlockPreview() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Header, numbering, fold, highlighting
        </p>
        <CodeBlock maxLines={8} language="tsx">
          <CodeBlockHeader>
            <CodeBlockTitle>
              <FileCode2 />
              app/api/chat/route.ts
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton value={STREAM} />
            </CodeBlockActions>
          </CodeBlockHeader>
          <CodeBlockContent lineNumbers>{STREAM}</CodeBlockContent>
          <CodeBlockFooter className="justify-center">
            <CodeBlockExpandButton />
          </CodeBlockFooter>
        </CodeBlock>
        <p className="text-xs text-muted-foreground">
          The fold is measured, not assumed: eight lines of source, a spring to unfold, and a chevron that turns once.
          The colours come from a highlighter that loads only because this block asked for <code>tsx</code>, and the
          finished lines are never tokenized twice while a stream arrives.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Tabs — one snippet, three package managers
        </p>
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
        <p className="text-xs text-muted-foreground">
          The pill is one shared element, so it travels to the tab that was pressed instead of a second pill fading in;
          the copy button follows the selection, and the panels are hidden rather than unmounted.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Diff</p>
          <CodeBlock>
            <CodeBlockHeader>
              <CodeBlockTitle>reader.ts</CodeBlockTitle>
            </CodeBlockHeader>
            <CodeBlockContent lineNumbers>
              {PATCH.map((line) => (
                <CodeBlockLine key={line.text} variant={line.variant}>
                  {line.text}
                </CodeBlockLine>
              ))}
            </CodeBlockContent>
          </CodeBlock>
          <p className="text-xs text-muted-foreground">
            A diff is a list of lines, not a tokenized string: the <code>+</code> / <code>−</code> markers and the tint
            carry it, in colour and in a monochrome print.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tool output</p>
          <CodeBlock variant="destructive" size="sm">
            <CodeBlockHeader>
              <CodeBlockTitle>run_shell</CodeBlockTitle>
            </CodeBlockHeader>
            <CodeBlockContent wrap className="max-h-52">
              {FAILURE}
            </CodeBlockContent>
          </CodeBlock>
          <p className="text-xs text-muted-foreground">
            Tool output is not highlighted and does not need to be; it wraps instead of scrolling, and the destructive
            variant says the run failed without recolouring the text.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Floating actions, no header
        </p>
        <CodeBlock language="tsx">
          <CodeBlockActions>
            <CodeBlockCopyButton value={STREAM} />
          </CodeBlockActions>
          <CodeBlockContent>{STREAM}</CodeBlockContent>
        </CodeBlock>
        <p className="text-xs text-muted-foreground">
          With no header, the actions float over the corner and fade in on hover or focus — and stay put on a touch
          screen, where neither exists.
        </p>
      </div>
    </div>
  );
}
