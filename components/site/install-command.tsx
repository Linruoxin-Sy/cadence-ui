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
import { highlightSource } from "./highlight";
import { installCommands } from "./install";

/**
 * The docs site's install command: the same `shadcn add` in pnpm, npm and yarn,
 * behind the code block's tab switcher.
 *
 * It is the code block, not a second implementation of one — the tabs, the pill that
 * travels between them, the copy button that follows the selection and the
 * focusable source are all the registry item's. This file only decides what the
 * three commands are and that pnpm is the one shown first.
 *
 * `CodeBlockCopyButton` gets `values` rather than a single `value`: the button copies
 * whichever command the reader is looking at, which is the entire point of putting
 * them in one block.
 */
export async function InstallCommand({ source }: { source: string }) {
  const commands = installCommands(source);
  if (!commands.length) return null;

  // All three are coloured at build time, before the reader can switch. The block
  // never loads a tokenizer in the browser.
  const highlighted = await Promise.all(commands.map((entry) => highlightSource(entry.command, "bash")));
  const copyable = Object.fromEntries(commands.map((entry) => [entry.value, entry.command]));

  return (
    <CodeBlock defaultTab={commands[0]?.value}>
      <CodeBlockHeader>
        <CodeBlockTabs label="Package manager">
          {commands.map((entry) => (
            <CodeBlockTab key={entry.value} value={entry.value}>
              {entry.label}
            </CodeBlockTab>
          ))}
        </CodeBlockTabs>
        <CodeBlockActions>
          <CodeBlockCopyButton values={copyable} />
        </CodeBlockActions>
      </CodeBlockHeader>
      {commands.map((entry, index) => (
        <CodeBlockPanel key={entry.value} value={entry.value}>
          {highlighted[index]
            ? highlighted[index].map((line, position) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: a line's identity is its position in the command
                <CodeBlockLine key={position}>{line}</CodeBlockLine>
              ))
            : entry.command}
        </CodeBlockPanel>
      ))}
    </CodeBlock>
  );
}
