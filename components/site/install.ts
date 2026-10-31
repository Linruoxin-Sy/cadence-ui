/**
 * The install command in a docs fence, read and restated.
 *
 * Kept apart from the component — and free of React and the registry — because the
 * extraction is the part that can silently lose a package or invent a runner, and it
 * is the part worth a test.
 */

/** The info string that marks a fence as an install command rather than a language. */
export const INSTALL_FENCE = "install";

export interface PackageManagerCommand {
  /** The tab's value, and the key its copy button looks the command up by. */
  value: "pnpm" | "npm" | "yarn";
  label: string;
  command: string;
}

/** `npx shadcn@latest add @cadence/button` → runner `shadcn@latest`, target `@cadence/button`. */
const ADD = /shadcn(@[\w.-]+)?\s+add\s+(\S+)/;

/**
 * The registry spec a fence installs, or `null` when the fence is not an install
 * command. A fence that fails this test is rendered as a plain terminal block: a
 * switcher over a command we could not read would show three wrong commands.
 */
export function installTarget(source: string): string | null {
  return source.match(ADD)?.[2] ?? null;
}

/**
 * The same install for the three package managers a reader might use, in the order
 * the site's own tooling prefers. The runner and its pin come from the fence, so the
 * page cannot drift from the command a reader copies.
 */
export function installCommands(source: string): PackageManagerCommand[] {
  const match = source.match(ADD);
  if (!match) return [];

  const runner = `shadcn${match[1] ?? "@latest"}`;
  const target = match[2];

  return [
    { value: "pnpm", label: "pnpm", command: `pnpm dlx ${runner} add ${target}` },
    // `npx` rather than `npm exec`: it is the form shadcn documents, and the one in
    // every reader's shell history.
    { value: "npm", label: "npm", command: `npx ${runner} add ${target}` },
    { value: "yarn", label: "yarn", command: `yarn dlx ${runner} add ${target}` },
  ];
}
