import { highlightSource } from "./highlight";
import { packageManagerCommands } from "./package-manager";
import { PackageManagerBlock, type PackageManagerPanel } from "./package-manager-block";

export interface PackageManagerFenceProps {
  /** The fence's source, exactly as the markdown wrote it. */
  source: string;
  size?: "default" | "sm";
}

/**
 * A fence rendered as the package-manager switcher.
 *
 * The commands are coloured at build time, before the reader can switch, so the block
 * never loads a tokenizer in the browser. The switcher itself is a client component
 * because the selection is shared across every block on the site; this half stays on
 * the server so Shiki never ships to the reader.
 *
 * Returns `null` for a fence without a package-manager command — the callers gate on
 * `hasPackageManagerCommand` / `installTarget` and fall back to a terminal block, so
 * a `package-manager` fence that no rule recognised still renders its source.
 */
export async function PackageManagerFence({ source, size = "default" }: PackageManagerFenceProps) {
  const commands = packageManagerCommands(source);
  if (!commands.length) return null;

  const highlighted = await Promise.all(commands.map((entry) => highlightSource(entry.command, "bash")));
  const panels: PackageManagerPanel[] = commands.map((entry, index) => ({
    ...entry,
    lines: highlighted[index] ?? null,
  }));

  return <PackageManagerBlock panels={panels} size={size} />;
}
