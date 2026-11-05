"use client";

import { type ReactNode, useState } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/registry/cadence/code-block";

export const SOURCE_MAX_LINES = 16;

/** Fold state belongs to this file and survives installation tab changes. */
export function SourceBlock({ source, target, children }: { source: string; target: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const long = source.replace(/\n$/, "").split("\n").length > SOURCE_MAX_LINES;
  return (
    <CodeBlock
      data-installation-source={target}
      maxLines={SOURCE_MAX_LINES}
      expanded={expanded}
      onExpandedChange={setExpanded}
    >
      <CodeBlockHeader>
        <CodeBlockTitle className="min-w-0 break-all whitespace-normal">{target}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={source} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers>{children}</CodeBlockContent>
      {long && (
        <CodeBlockFooter className="min-h-[calc(--spacing(12)+1px)]">
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      )}
    </CodeBlock>
  );
}
