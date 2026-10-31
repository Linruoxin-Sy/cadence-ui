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
import { cn } from "@/registry/cadence/lib/cn";
import { fenceTitle, readFence } from "./fence";
import { highlightSource } from "./highlight";
import { INSTALL_FENCE, installTarget } from "./install";
import { InstallCommand } from "./install-command";

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
  const lines = await highlightSource(source, language);

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
 * An `install` fence is the one info string that is not a language. It holds the one
 * command a reader came for — `npx shadcn@latest add …` — and becomes the switcher
 * that shows the same install in pnpm, npm and yarn. The markdown keeps the command
 * itself, so the payload an agent reads at `/r/<id>.md` still carries something
 * runnable, and a fence that does not parse as an install falls back to a plain
 * terminal block rather than a switcher over nothing.
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

  // `install` is the one info string that is not a language: the command is read
  // first, and only a fence that actually installs something becomes a switcher.
  if (fence.language === INSTALL_FENCE && installTarget(fence.source)) {
    return <InstallCommand source={fence.source} />;
  }

  return <CodeFence source={fence.source} language={fence.language} />;
}
