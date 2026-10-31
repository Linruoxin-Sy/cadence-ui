"use client";

import { FileCode2Icon } from "lucide-react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTitle,
} from "@/registry/cadence/code-block";
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
};

/**
 * Two blocks, because the component has two front ends: a titled source with line
 * numbers, a measured fold and a copy button; and a tabbed snippet, where the pill is
 * one shared element and the copy button follows the selected tab.
 */
export function CodeBlockPreview() {
  return (
    <PreviewStack>
      <div className="grid w-full max-w-xl gap-4">
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
          <CodeBlockFooter className="justify-center">
            <CodeBlockExpandButton />
          </CodeBlockFooter>
        </CodeBlock>

        <CodeBlock defaultTab="pnpm" language="bash">
          <CodeBlockHeader>
            <CodeBlockTabs label="Package manager">
              <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
              <CodeBlockTab value="npm">npm</CodeBlockTab>
            </CodeBlockTabs>
            <CodeBlockActions>
              <CodeBlockCopyButton values={INSTALL} />
            </CodeBlockActions>
          </CodeBlockHeader>
          <CodeBlockPanel value="pnpm">{INSTALL.pnpm}</CodeBlockPanel>
          <CodeBlockPanel value="npm">{INSTALL.npm}</CodeBlockPanel>
        </CodeBlock>
      </div>
    </PreviewStack>
  );
}
