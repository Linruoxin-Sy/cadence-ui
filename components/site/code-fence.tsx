import type { ReactNode } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/registry/cadence/code-block";
import { cn } from "@/registry/cadence/lib/cn";
import { fenceTitle, readFence } from "./fence";
import { highlightSource } from "./highlight";
import { hasPackageManagerCommand, INSTALL_FENCE, installTarget, PACKAGE_MANAGER_FENCE } from "./package-manager";
import { PackageManagerFence } from "./package-manager-fence";

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
 * Two info strings are not languages. An `install` fence holds the one command a
 * component page opens with — `npx shadcn@latest add …` — and a `package-manager`
 * fence holds any command whose form depends on the tool: create a project, `init`,
 * add packages. Both become the switcher that shows the same source in pnpm, npm and
 * yarn, so all of them share one remembered choice. The markdown keeps one runnable
 * command per fence, so the payload an agent reads at `/r/<id>.md` is still something
 * it can run; a fence that does not parse falls back to a terminal block rather than
 * a switcher over nothing.
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

  // `install` is read first, and only a fence that actually installs something becomes
  // a switcher. `package-manager` is the wider form, for the docs that show a whole
  // setup sequence rather than one registry item.
  if (fence.language === INSTALL_FENCE && installTarget(fence.source)) {
    return <PackageManagerFence source={fence.source} />;
  }
  if (fence.language === PACKAGE_MANAGER_FENCE && hasPackageManagerCommand(fence.source)) {
    return <PackageManagerFence source={fence.source} />;
  }

  // A marked fence that no rule could read is still a shell transcript. Rendering it
  // with its own info string would label the header "package-manager" and leave the
  // command uncoloured, which is a worse terminal than a terminal.
  const language =
    fence.language === INSTALL_FENCE || fence.language === PACKAGE_MANAGER_FENCE ? "bash" : fence.language;

  return <CodeFence source={fence.source} language={language} />;
}
