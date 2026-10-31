"use client";

import type { ReactNode } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
} from "@/registry/cadence/code-block";
import { isPackageManager, type PackageManager } from "./package-manager";
import { usePackageManager } from "./package-manager-preference";

/** One package manager's version of the fence. */
export interface PackageManagerPanel {
  value: PackageManager;
  label: string;
  /** The whole fence restated for this manager. This is what the copy button copies. */
  command: string;
  /** The command coloured at build time; `null` keeps it plain. */
  lines: ReactNode[] | null;
}

export interface PackageManagerBlockProps {
  panels: PackageManagerPanel[];
  size?: "default" | "sm";
}

/**
 * The docs site's package-manager switcher: the same command in pnpm, npm and yarn,
 * behind the code block's own tab switcher.
 *
 * It is the code block, not a second implementation of one — the tabs, the pill that
 * travels between them, the copy button that follows the selection and the focusable
 * source are all the registry item's. This file only decides what the panels are and
 * that the selection is the site's, not the block's.
 *
 * That is the one thing it adds to a plain `CodeBlock`: `tab` / `onTabChange` are
 * controlled by `usePackageManager`, so every block on the page reads the same value.
 * Switching npm here switches the next fence down, and the choice survives the visit.
 *
 * `CodeBlockCopyButton` gets `values` rather than a single `value`: the button copies
 * whichever command the reader is looking at, which is the entire point of putting
 * them in one block.
 */
export function PackageManagerBlock({ panels, size = "default" }: PackageManagerBlockProps) {
  const { manager, setManager } = usePackageManager();
  const copyable = Object.fromEntries(panels.map((panel) => [panel.value, panel.command]));

  return (
    <CodeBlock
      size={size}
      tab={manager}
      onTabChange={(value) => {
        if (isPackageManager(value)) setManager(value);
      }}
    >
      <CodeBlockHeader>
        <CodeBlockTabs label="Package manager">
          {panels.map((panel) => (
            <CodeBlockTab key={panel.value} value={panel.value}>
              {panel.label}
            </CodeBlockTab>
          ))}
        </CodeBlockTabs>
        <CodeBlockActions>
          <CodeBlockCopyButton values={copyable} />
        </CodeBlockActions>
      </CodeBlockHeader>
      {panels.map((panel) => (
        <CodeBlockPanel key={panel.value} value={panel.value}>
          {panel.lines
            ? panel.lines.map((line, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a line's identity is its position in the command
                <CodeBlockLine key={index}>{line}</CodeBlockLine>
              ))
            : panel.command}
        </CodeBlockPanel>
      ))}
    </CodeBlock>
  );
}
