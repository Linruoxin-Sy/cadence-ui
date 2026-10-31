/**
 * The package-manager side of the docs fences: which managers exist, how a fence
 * declares that its commands depend on one, and how one command is restated for the
 * other two.
 *
 * Kept apart from the component — and free of React and the registry — because the
 * rewrite is the part that can silently change a command's meaning, and it is the
 * part worth a test.
 */

/**
 * The info string that marks a shadcn install: the one command a component page opens
 * with. It stays its own name rather than joining `package-manager` because the
 * payload an agent reads at `/r/<id>.md` should keep saying "this installs the item",
 * and because that distinction is what `installTarget` reads.
 */
export const INSTALL_FENCE = "install";

/**
 * The info string for a fence that runs any package-manager command — create a
 * project, initialize shadcn, add packages. The installation guide is made of these;
 * a `bash` fence stays a literal terminal transcript, because most shell snippets on
 * this site are not install commands and rewriting them would be a guess.
 */
export const PACKAGE_MANAGER_FENCE = "package-manager";

/** The three managers the switcher offers, in the order the tabs show them. */
export type PackageManager = "pnpm" | "npm" | "yarn";

export interface PackageManagerEntry {
  value: PackageManager;
  /** The tab text. Kept separate from `value` so a future manager can show a brand name. */
  label: string;
}

/**
 * pnpm first: it is what this repository builds with, and the first tab is what a
 * reader sees before choosing. npm and yarn follow in the order shadcn documents them.
 */
export const PACKAGE_MANAGERS = [
  { value: "pnpm", label: "pnpm" },
  { value: "npm", label: "npm" },
  { value: "yarn", label: "yarn" },
] as const satisfies readonly PackageManagerEntry[];

/** What every switcher shows before the reader has chosen, and the fallback for a bad stored value. */
export const DEFAULT_PACKAGE_MANAGER: PackageManager = "pnpm";

/**
 * The site-wide choice, remembered across visits like the theme. It is deliberately
 * not per block: someone who runs pnpm does not want to pick it again on every page.
 */
export const PACKAGE_MANAGER_KEY = "cadence-package-manager";

export function isPackageManager(value: unknown): value is PackageManager {
  return value === "pnpm" || value === "npm" || value === "yarn";
}

/** One command the switcher can show. */
export interface PackageManagerCommand {
  /** The tab's value, and the key its copy button looks the command up by. */
  value: PackageManager;
  label: string;
  /** The whole fence restated for this manager, without its trailing newline. */
  command: string;
}

/**
 * `npx shadcn@latest add @cadence/button` → `@cadence/button`.
 *
 * The pin is matched but not captured: `add` is what makes a command an install, and
 * the registry spec is what makes it *this* install. `init` is not an install, and a
 * different CLI is not ours to rewrite.
 */
const ADD = /shadcn(?:@[\w.-]+)?\s+add\s+(\S+)/;

/**
 * The registry spec a fence installs, or `null` when the fence is not an install
 * command. A fence that fails this test renders as a literal terminal block: a
 * switcher over a command we could not read would show three wrong commands.
 */
export function installTarget(source: string): string | null {
  return source.match(ADD)?.[1] ?? null;
}

/**
 * The one-shot runner forms, which are the same operation under three names:
 * `npx`, `pnpm dlx`, `yarn dlx` — plus the pnpm/bun shorthands a reader may paste.
 * The binary and everything after it are kept verbatim; only the runner changes.
 */
const RUNNER = /^\s*(?:npx|pnpm\s+dlx|yarn\s+dlx|pnpx|bunx)\s+(\S+)((?:\s.*)?)$/;

/**
 * Adding packages. `npm install` and `npm i` are the same verb as `pnpm add` and
 * `yarn add`; the package list is kept verbatim so a pin or a range survives.
 */
const PACKAGES = /^\s*(?:pnpm\s+(?:add|install)|npm\s+(?:add|install|i)|yarn\s+add)\s+(\S.*)$/;

/** The fence's lines without the trailing newline a fence always carries. */
function commandLines(source: string): string[] {
  return source.replace(/\n$/, "").split("\n");
}

/** A line the rewriter knows how to say in another manager's words. */
function isPackageManagerLine(line: string): boolean {
  return RUNNER.test(line) || PACKAGES.test(line);
}

/**
 * Whether this fence has at least one line the switcher would change. A fence made
 * only of `cd`, `mkdir`, or a script invocation stays literal: those lines are the
 * same for every manager, and a fence with no package-manager line would be three
 * identical panels pretending to be a choice.
 */
export function hasPackageManagerCommand(source: string): boolean {
  return commandLines(source).some(isPackageManagerLine);
}

/** Restate one line for `manager`; a line the rules do not know is left exactly as written. */
function restate(line: string, manager: PackageManager): string {
  const runner = line.match(RUNNER);
  if (runner) {
    const [, binary, rest = ""] = runner;
    if (manager === "pnpm") return `pnpm dlx ${binary}${rest}`;
    if (manager === "npm") return `npx ${binary}${rest}`;
    return `yarn dlx ${binary}${rest}`;
  }

  const packages = line.match(PACKAGES);
  if (packages) {
    if (manager === "pnpm") return `pnpm add ${packages[1]}`;
    if (manager === "npm") return `npm install ${packages[1]}`;
    return `yarn add ${packages[1]}`;
  }

  return line;
}

/**
 * The same fence for the three package managers, pnpm first. Lines are rewritten one
 * at a time and the rest of the fence is preserved, so a setup sequence — create,
 * `cd`, initialize — stays one copyable block per manager instead of three separate
 * install commands a reader has to assemble themselves.
 *
 * Returns `[]` when no line is a package-manager command; the caller then renders the
 * fence as the terminal block it was written as.
 */
export function packageManagerCommands(source: string): PackageManagerCommand[] {
  const lines = commandLines(source);
  if (!lines.some(isPackageManagerLine)) return [];

  return PACKAGE_MANAGERS.map(({ value, label }) => ({
    value,
    label,
    command: lines.map((line) => restate(line, value)).join("\n"),
  }));
}
