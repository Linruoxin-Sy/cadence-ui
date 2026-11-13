/**
 * Keeps `main` merge-only: no commits on it, no pushes into it, and every branch that
 * carries a change has a name from the policy in CONTRIBUTING.md.
 *
 * The same predicate runs in three places so a local mistake cannot reach the remote:
 *
 *   node scripts/branch-policy.mjs --commit   # pre-commit / pre-merge-commit hook
 *   node scripts/branch-policy.mjs --push     # pre-push hook, reads the refs on stdin
 *   node scripts/branch-policy.mjs --ci       # CI: pull request head branch
 *   node scripts/branch-policy.mjs --branch feature/x   # validate one name
 *   node scripts/branch-policy.mjs            # validate the checked-out branch
 *
 * Hooks are the husky files in `.husky/`, installed by `"prepare": "husky"` on
 * `pnpm install`. They are a guard rail, not the authority: branch protection on the
 * remote still rejects a push that skips a hook with `--no-verify`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const PROTECTED_BRANCHES = ["main", "master"];

/** A work branch: documented prefix, lowercase kebab topic, no trailing separator. */
export const BRANCH_PATTERN =
  /^(?:feature|feat|bugfix|fix|hotfix|release|chore|docs|refactor)\/[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

const BRANCH_HINT = `  git switch -c feature/<topic>          # one of feature|bugfix|hotfix|release|chore|docs|refactor
  git switch -c feature/<topic> <commit> # when the work already exists on main
See CONTRIBUTING.md#branch-and-merge-policy.`;

/**
 * Returns why `name` may not carry a change, or `null` when it may.
 * Pure: used by the hooks, by CI, and by the unit test.
 */
export function branchProblem(name) {
  const branch = (name ?? "").trim();
  if (!branch || branch === "HEAD") {
    return `the checkout is not on a branch (detached HEAD).
Create one before changing anything:
${BRANCH_HINT}`;
  }
  if (PROTECTED_BRANCHES.includes(branch)) {
    return `\`${branch}\` is protected: it only receives pull request merges, so nothing is committed on it.
${BRANCH_HINT}`;
  }
  if (!BRANCH_PATTERN.test(branch)) {
    return `\`${branch}\` is not a work branch name. Use a documented prefix and a lowercase
kebab topic, for example \`feature/avatar-motion\` or \`docs/pr-only-workflow\`.
${BRANCH_HINT}`;
  }
  return null;
}

/** Parses pre-push stdin: `<local ref> <local sha> <remote ref> <remote sha>` per line. */
export function parsePushRefs(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
      return { localRef, localSha, remoteRef, remoteSha };
    })
    .filter((ref) => ref.remoteRef);
}

/**
 * Returns why these refs may not be pushed, or `null` when the push is allowed.
 * Branch destinations are checked; tags, notes and other refs pass through.
 */
export function pushProblem(refs) {
  const problems = [];
  for (const { remoteRef } of refs) {
    if (!remoteRef.startsWith("refs/heads/")) continue;
    const branch = remoteRef.slice("refs/heads/".length);
    if (PROTECTED_BRANCHES.includes(branch)) {
      problems.push(
        `refusing to push into \`${branch}\`: it only receives pull request merges, and a direct,
forced or deleting push there is rejected by branch protection as well.
Push the branch that carries the change and open a pull request:
  git push -u origin <branch>
  gh pr create --base ${branch} --head <branch>`,
      );
      continue;
    }
    const problem = branchProblem(branch);
    if (problem) problems.push(`refusing to push branch \`${branch}\`: ${problem}`);
  }
  return problems.length ? problems.join("\n\n") : null;
}

/** The current branch, or `null` outside a work tree / on an unborn HEAD. */
export function currentBranch(run = defaultGit) {
  try {
    return run(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  } catch {
    return null;
  }
}

function defaultGit(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function fail(title, detail) {
  console.error(`branch-policy: ${title}\n\n${detail}\n`);
  return 1;
}

function pass(message) {
  console.log(`branch-policy: ${message}`);
  return 0;
}

export function run(argv = process.argv.slice(2), env = process.env) {
  const args = argv;
  if (args.includes("--branch")) {
    const name = args[args.indexOf("--branch") + 1];
    if (!name) return fail("--branch needs a name", "Usage: node scripts/branch-policy.mjs --branch feature/topic");
    const problem = branchProblem(name);
    return problem ? fail(`\`${name}\` is rejected`, problem) : pass(`\`${name}\` is a work branch`);
  }

  if (args.includes("--push")) {
    let input = "";
    try {
      input = readFileSync(0, "utf8");
    } catch {
      input = "";
    }
    const refs = parsePushRefs(input);
    if (!refs.length) return pass("no branch refs to check");
    const problem = pushProblem(refs);
    return problem ? fail("this push is not allowed", problem) : pass(`push to ${refs.length} ref(s) is allowed`);
  }

  if (args.includes("--ci")) {
    const event = env.GITHUB_EVENT_NAME ?? "";
    // A `push` run on main is the merge commit of an approved PR: already through the flow.
    if (!event.startsWith("pull_request")) return pass(`\`${event || "local"}\` run does not check a head branch`);
    const head = env.GITHUB_HEAD_REF ?? "";
    const problem = branchProblem(head);
    return problem
      ? fail(`pull request head \`${head || "(empty)"}\` is not a work branch`, problem)
      : pass(`pull request head \`${head}\` is a work branch`);
  }

  const branch = currentBranch();
  if (branch === null) return fail("not a git work tree", "Run this from the repository checkout.");

  const problem = branchProblem(branch);
  if (problem) {
    // `--commit` is the hook path; the bare command is the read-only form.
    return args.includes("--commit")
      ? fail(`cannot commit on \`${branch}\``, problem)
      : fail(`\`${branch}\` is rejected`, problem);
  }
  return pass(`\`${branch}\` is a work branch`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(run());
}
