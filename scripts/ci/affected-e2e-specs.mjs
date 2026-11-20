#!/usr/bin/env node
/**
 * Selects the browser specs a pull request actually has to run.
 *
 * The `browser` job in `.github/workflows/check.yml` is evidence, not a gate: it
 * replays the Playwright spec of each component the diff touches so a reviewer can
 * download full/reduced/none screenshots instead of trusting prose. A docs-only
 * pull request must not pay for `pnpm build`, so the scope is computed before the
 * install, and an empty scope is a skip with a printed reason, never a failure.
 *
 * A component is affected when the diff names it in one of three places, the three
 * a component's behaviour can be edited from:
 *
 *   registry/cadence/<id>/**             the shipped source
 *   content/components/<id>.mdx          the documented contract
 *   components/site/previews/<id>.tsx    the preview the spec drives
 *
 * Only ids with an existing `tests/e2e/<id>.spec.ts` produce a spec. Shared files
 * (`registry/cadence/lib/motion.ts`) name no component; they are reported as
 * "no browser spec" rather than silently dropped, because the honest answer for
 * them is that this job has nothing scoped to run.
 *
 * Usage:
 *   node scripts/ci/affected-e2e-specs.mjs --base origin/main   # specs, one per line
 *   node scripts/ci/affected-e2e-specs.mjs --self-test          # fixtures, no git
 *
 * Exit code is always 0: the caller decides whether an empty list means "skip".
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** The three edit surfaces of one component, each capturing its `<id>`. */
const COMPONENT_PATHS = [
  /^registry\/cadence\/([^/]+)\/./,
  /^content\/components\/([^/]+)\.mdx$/,
  /^components\/site\/previews\/([^/]+)\.tsx$/,
];

/** Ordered, de-duplicated component ids named by a `git diff --name-only` listing. */
export function affectedIds(paths) {
  const ids = new Set();
  for (const changed of paths) {
    const file = String(changed).trim().replace(/^"|"$/g, "");
    for (const pattern of COMPONENT_PATHS) {
      const match = pattern.exec(file);
      if (match) {
        ids.add(match[1]);
        break;
      }
    }
  }
  return [...ids].sort();
}

/**
 * Maps ids to the specs that exist. `exists` is injected so a self-test does not
 * need a checkout; the return value keeps both halves of the answer so the caller
 * can print the ids that were left out and why.
 */
export function selectSpecs(ids, exists = (file) => existsSync(file)) {
  const specs = [];
  const uncovered = [];
  for (const id of ids) {
    const spec = `tests/e2e/${id}.spec.ts`;
    if (exists(spec)) specs.push(spec);
    else uncovered.push(id);
  }
  return { specs: specs.sort(), uncovered };
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    const detail = (result.stderr ?? "").trim();
    throw new Error(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return result.stdout;
}

function changedPaths(base) {
  // Three-dot diff: the merge base, not the base tip, so a long-lived branch is not
  // charged for the commits `main` gained after it forked.
  const output = git(["diff", "--name-only", `${base}...HEAD`]);
  return output.split(/\r?\n/).filter(Boolean);
}

function selfTest() {
  const changed = [
    "registry/cadence/accordion/index.tsx",
    "content/components/accordion.mdx",
    "registry/cadence/lib/motion.ts",
    "registry/cadence/alert-dialog/alert-dialog.tsx",
    "components/site/previews/tabs.tsx",
    "docs/README.md",
    "content/components/not-a-component.mdx.bak",
    "registry/cadence/button/README.md",
  ];
  const ids = affectedIds(changed);
  const expectedIds = ["accordion", "alert-dialog", "button", "lib", "tabs"];
  if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) {
    throw new Error(`affectedIds: expected ${expectedIds.join(",")}; got ${ids.join(",")}`);
  }

  const present = new Set(["tests/e2e/accordion.spec.ts", "tests/e2e/tabs.spec.ts"]);
  const { specs, uncovered } = selectSpecs(ids, (file) => present.has(file));
  const expectedSpecs = ["tests/e2e/accordion.spec.ts", "tests/e2e/tabs.spec.ts"];
  if (JSON.stringify(specs) !== JSON.stringify(expectedSpecs)) {
    throw new Error(`selectSpecs: expected ${expectedSpecs.join(",")}; got ${specs.join(",")}`);
  }
  const expectedUncovered = ["alert-dialog", "button", "lib"];
  if (JSON.stringify(uncovered) !== JSON.stringify(expectedUncovered)) {
    throw new Error(`uncovered: expected ${expectedUncovered.join(",")}; got ${uncovered.join(",")}`);
  }

  if (affectedIds(["docs/parity-plan.md"]).length !== 0) {
    throw new Error("a docs-only diff must name no component");
  }

  process.stdout.write("affected-e2e-specs: self-test passed\n");
}

function main(argv) {
  if (argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const flag = argv.indexOf("--base");
  const base = flag === -1 ? "origin/HEAD" : argv[flag + 1];
  if (!base) throw new Error("--base needs a git ref, for example `--base origin/main`");

  const ids = affectedIds(changedPaths(base));
  if (ids.length === 0) {
    process.stderr.write(`no component paths in \`git diff ${base}...HEAD\`; no browser spec to run\n`);
    return;
  }

  const { specs, uncovered } = selectSpecs(ids);
  for (const id of uncovered) process.stderr.write(`no browser spec for ${id}\n`);

  if (specs.length === 0) {
    process.stderr.write(`none of ${ids.join(", ")} has a tests/e2e/<id>.spec.ts; skipping browser evidence\n`);
    return;
  }

  process.stdout.write(`${specs.join("\n")}\n`);
  process.stderr.write(`${ids.length} affected component(s), ${specs.length} spec(s)\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
