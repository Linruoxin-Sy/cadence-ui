/**
 * Points this checkout at the committed hooks in `.githooks/`.
 *
 * The hooks are shipped in the repository rather than copied into `.git/hooks`, so
 * updating them does not need a per-clone migration: `core.hooksPath` is the only
 * local state. `pnpm install` runs this through the `prepare` script; run
 * `pnpm hooks:install` to repair a checkout that was cloned before the hooks existed.
 *
 * Outside a git work tree (a packaged copy, CI with a shallow export) this is a no-op
 * with exit code 0 — installing hooks must never fail an install.
 */
import { execFileSync } from "node:child_process";
import { chmodSync, readdirSync } from "node:fs";
import path from "node:path";

const HOOKS_DIR = ".githooks";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

let root;
try {
  root = git(["rev-parse", "--show-toplevel"]);
} catch {
  process.exit(0);
}

const hooks = path.join(root, HOOKS_DIR);
const previous = (() => {
  try {
    return git(["config", "--local", "--get", "core.hooksPath"]);
  } catch {
    return "";
  }
})();

if (previous && previous !== HOOKS_DIR) {
  console.warn(`hooks: replacing core.hooksPath \`${previous}\` with \`${HOOKS_DIR}\``);
}

git(["config", "--local", "core.hooksPath", HOOKS_DIR]);

// Git refuses to run a hook without the executable bit on POSIX. A Windows checkout
// does not record file modes, so set it here instead of relying on the index.
for (const name of readdirSync(hooks)) {
  if (name.endsWith(".md")) continue;
  try {
    chmodSync(path.join(hooks, name), 0o755);
  } catch {
    // A filesystem without POSIX modes is fine: git for Windows runs hooks through sh.
  }
}

console.log(`hooks: core.hooksPath -> ${HOOKS_DIR} (commits on main and pushes into main are refused)`);
