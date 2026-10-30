import type { ReactNode } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/registry/cadence/code-block/code-block";
import { type Highlighter, loadHighlighter } from "@/registry/cadence/code-highlight/highlight";
import { cn } from "@/registry/cadence/lib/cn";
import { type Fence, fenceTitle, readFence } from "./fence";

/**
 * The docs site's one code surface: a fence, and a command, render through the
 * registry's `code-block` item rather than through a `pre` of our own.
 *
 * **Highlighting runs here, at build time.** Every page that carries a fence is
 * statically rendered, so the tokenizer belongs in the build, not in the reader's
 * browser: the block arrives coloured, and no grammar is downloaded to colour it.
 * That is also why `CodeBlock` is never given a `language` — the comment would be
 * a lie as far as the content is concerned, and it would make `CodeBlockContent`
 * load the client highlighter to tokenize nodes it did not produce. A fence whose
 * language the item does not bundle falls back to its plain string, which is the
 * whole source.
 *
 * The grammar for a language is loaded once per build and shared by every block
 * that asks for it: 178 `tsx` fences must not each spin up their own highlighter.
 */
const highlighters = new Map<string, Promise<Highlighter | null>>();

function highlighterFor(language: string): Promise<Highlighter | null> {
  const cached = highlighters.get(language);
  if (cached) return cached;

  // A grammar that fails to load is not an error the reader should meet: the block
  // keeps its plain text. `null` is cached too, so a broken language is asked once.
  const pending = loadHighlighter(language).catch(() => null);
  highlighters.set(language, pending);
  return pending;
}

/** One node per line, or `null` when this fence has to render as plain text. */
async function highlight(fence: Fence): Promise<ReactNode[][] | null> {
  if (!fence.language || !fence.source) return null;

  const highlighter = await highlighterFor(fence.language);
  if (!highlighter) return null;

  // A trailing newline would render as an extra empty line.
  const source = fence.source.endsWith("\n") ? fence.source.slice(0, -1) : fence.source;
  return highlighter.highlight(source).lines;
}

export interface CodeFenceProps {
  /** The source to show. It is also what the copy button copies — never a shortened form. */
  source: string;
  /** The fence's info string: `tsx`, `bash`, `json`. Omit it and the source stays plain. */
  language?: string;
  /** Override the header label, which defaults to the language (`bash` → "Terminal"). */
  title?: string;
  size?: "default" | "sm";
  className?: string;
}

/**
 * A fence rendered as a code block: language label and copy control above, source
 * below. No line numbers and no fold — a documentation snippet is read whole, and a
 * block that hides its tail behind a control would cost the reader a click on every
 * one of the 224 fences on this site.
 */
export async function CodeFence({ source, language, title, size = "default", className }: CodeFenceProps) {
  const lines = await highlight({ language, source });

  return (
    <CodeBlock size={size} className={cn(className)}>
      <CodeBlockHeader>
        <CodeBlockTitle>{title ?? fenceTitle(language)}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={source} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent>
        {lines
          ? lines.map((line, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a line's identity is its position in the file
              <CodeBlockLine key={index}>{line}</CodeBlockLine>
            ))
          : source}
      </CodeBlockContent>
    </CodeBlock>
  );
}

/**
 * The MDX `pre` override. `pre` is the only element a fence produces, so this is
 * the whole migration: the markdown does not change, and a `pre` that is not a
 * fence (hand-written JSX in a body) still renders as one.
 *
 * The old override made the `pre` focusable by hand, because a block that scrolls
 * sideways has to be reachable from the keyboard. The item's own content owns that
 * now — it is a focusable `pre` with a `data-slot` — so the attribute and its
 * lint suppression are gone with it.
 */
export async function MdxCodeFence({ children }: { children?: ReactNode }) {
  const fence = readFence(children);
  if (!fence) {
    // biome-ignore lint/a11y/noNoninteractiveTabindex: axe's scrollable-region-focusable rule requires a horizontally scrollable code block to be keyboard reachable
    return <pre tabIndex={0}>{children}</pre>;
  }

  return <CodeFence source={fence.source} language={fence.language} />;
}
