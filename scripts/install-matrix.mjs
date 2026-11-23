/**
 * Distribution install matrix.
 *
 * The registry is copied into a consumer project, so "declared" has to equal "installable". Every
 * committed payload is checked against its source entry, and every install plan is resolved as if the
 * consumer had copied exactly the files that plan lists:
 *
 *   - payload files/targets equal `registry.json`, and their content equals the shipped source
 *   - `meta.sourceSha` recomputes from the payload's own files, expanded docs and metadata (ADR-025)
 *   - `/r/<id>.json` and `/r/<id>.md` are consumable alone: schema, name, files with content+target,
 *     namespaced registry dependencies, and the expanded docs body in the markdown
 *   - no docs target or docs source file leaks into a payload
 *   - every import in every planned file resolves inside that plan: a relative import to another
 *     planned target, a namespaced registry dependency to a planned item, or a package the plan
 *     declares. An `@/` alias, a validation library, a Node builtin or an undeclared package fails.
 *
 * `react`, `react-dom` and `next` are the consumer's framework, not Cadence dependencies; the shadcn
 * payload format never lists them and no copy-the-source install can supply them.
 *
 *   node scripts/install-matrix.mjs [--json <report>]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { installationPlan } from "./installation.mjs";
import { componentSha, hashableMeta, stableJson } from "./payload-hash.mjs";

/** The consuming application owns the framework; a registry item cannot install it. */
export const HOST_PACKAGES = new Set(["react", "react-dom", "next"]);
/** P11: Cadence is UI only. A component that imports one of these owns validation it must not own. */
export const VALIDATION_PACKAGES = new Set([
  "zod",
  "react-hook-form",
  "@hookform/resolvers",
  "yup",
  "valibot",
  "joi",
  "superstruct",
]);
const NODE_BUILTINS = new Set([
  "assert",
  "buffer",
  "child_process",
  "crypto",
  "events",
  "fs",
  "http",
  "https",
  "os",
  "path",
  "process",
  "stream",
  "url",
  "util",
  "zlib",
]);
const NAMESPACE = "@cadence/";
const componentTarget = (file) => `@components/cadence/${file.slice("registry/cadence/".length)}`;

/** `@scope/name@1.2.3` → `@scope/name`; `motion/react` → `motion`; `name@^1` → `name`. */
export function packageName(specifier) {
  const at = specifier.lastIndexOf("@");
  const withoutVersion = at > 0 ? specifier.slice(0, at) : specifier;
  const parts = withoutVersion.split("/");
  return withoutVersion.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** Specifiers are read by TypeScript, so a commented-out or stringified import is not a dependency. */
export function importSpecifiers(source) {
  return ts.preProcessFile(source, true, true).importedFiles.map((file) => file.fileName);
}

/** Every installed file lives under this tree; a relative import has to stay inside it. */
export const CADENCE_TREE = "@components/cadence/";

/** The target a relative specifier resolves to, or null when it leaves the installed tree. */
export function resolveTarget(fromTarget, specifier) {
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(fromTarget), specifier));
  return joined.startsWith(CADENCE_TREE) ? joined : null;
}

function targetCandidates(target) {
  if (/\.[cm]?[jt]sx?$/.test(target)) return [target];
  return [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`, `${target}/index.tsx`];
}

/**
 * Resolve one planned file's imports against the files the same plan installs.
 * `read` returns a file's source, so the matrix can be tested without a checkout.
 */
export async function importClosureProblems(plan, read) {
  const problems = [];
  const targets = new Set(plan.files.map((file) => file.target));
  const planned = new Set(plan.items.map((item) => item.name));
  const declared = new Set(plan.dependencies.map(packageName));
  for (const file of plan.files) {
    const source = await read(file.path);
    for (const specifier of importSpecifiers(source)) {
      if (specifier.startsWith("./") || specifier.startsWith("../")) {
        const target = resolveTarget(file.target, specifier);
        if (target === null) {
          problems.push(`${plan.id}: ${file.path} imports "${specifier}", which leaves the installed tree`);
        } else if (!targetCandidates(target).some((candidate) => targets.has(candidate))) {
          problems.push(`${plan.id}: ${file.path} imports "${specifier}" (${target}) but no plan installs it`);
        }
        continue;
      }
      if (specifier.startsWith("@/")) {
        problems.push(`${plan.id}: ${file.path} imports the host alias "${specifier}"`);
        continue;
      }
      if (specifier.startsWith(NAMESPACE)) {
        const id = specifier.slice(NAMESPACE.length).split("/")[0];
        if (!planned.has(id)) problems.push(`${plan.id}: ${file.path} imports "${specifier}" outside its plan`);
        continue;
      }
      if (specifier.startsWith("node:") || NODE_BUILTINS.has(specifier.split("/")[0])) {
        problems.push(`${plan.id}: ${file.path} imports the Node builtin "${specifier}"`);
        continue;
      }
      const name = packageName(specifier);
      if (VALIDATION_PACKAGES.has(name)) {
        problems.push(`${plan.id}: ${file.path} imports the validation library "${name}" (P11)`);
        continue;
      }
      if (!declared.has(name) && !HOST_PACKAGES.has(name)) {
        problems.push(`${plan.id}: ${file.path} imports "${specifier}" but the plan declares no "${name}"`);
      }
    }
  }
  return problems;
}

const fileKey = (file) => `${file.path}->${file.target}:${file.type ?? ""}`;
const fileSet = (files = []) =>
  stableJson([...files].map(fileKey).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)));

const isComponent = (item) => item.type === "registry:ui" || item.type === "registry:block";
const PRIMITIVES = ["animated-number", "animated-text", "reveal", "reveal-group"];

/** One row per registry item: which distribution checks hold, and what failed. */
export async function checkInstallMatrix(root, registry, { readText } = {}) {
  const read = readText ?? ((file) => readFile(path.join(root, file), "utf8"));
  const rows = [];
  for (const item of registry.items) {
    const failures = [];
    const check = (name, detail, ok) => {
      if (!ok) failures.push({ check: name, detail });
    };
    const row = {
      id: item.name,
      type: item.type,
      component: isComponent(item),
      /** Undefined until the plan resolves, so a caller can tell "no plan" from "empty plan". */
      planFiles: undefined,
      planDependencies: undefined,
      planItems: undefined,
      failures,
    };
    rows.push(row);

    let payload;
    try {
      payload = JSON.parse(await read(`public/r/${item.name}.json`));
    } catch (error) {
      check("payload", `unreadable public/r/${item.name}.json (${error.code ?? error.message})`, false);
      continue;
    }

    check("payload-name", `payload name is "${payload.name}"`, payload.name === item.name);
    check("payload-schema", "payload declares a registry schema", Boolean(payload.$schema));
    check(
      "payload-files",
      "payload files (path, target, type) equal registry.json",
      fileSet(payload.files) === fileSet(item.files),
    );
    // A declaration edit that was not rebuilt would otherwise ship the old dependency set.
    check(
      "payload-declarations",
      "payload dependencies and registry dependencies equal registry.json",
      stableJson([...(payload.dependencies ?? [])].sort()) === stableJson([...(item.dependencies ?? [])].sort()) &&
        stableJson([...(payload.registryDependencies ?? [])].sort()) ===
          stableJson([...(item.registryDependencies ?? [])].sort()),
    );
    check(
      "payload-identity",
      "payload type, title, description and categories equal registry.json",
      stableJson([payload.type, payload.title, payload.description, payload.categories ?? []]) ===
        stableJson([item.type, item.title, item.description, item.categories ?? []]),
    );
    for (const file of item.files ?? []) {
      const embedded = (payload.files ?? []).find((entry) => entry.path === file.path);
      check(
        `payload-content:${file.path}`,
        "payload content is the shipped source",
        embedded?.content === (await read(file.path)),
      );
      check(
        `target:${file.path}`,
        `target is ${componentTarget(file.path)}`,
        file.target === componentTarget(file.path) && embedded?.target === file.target,
      );
      check(
        `no-docs-leak:${file.path}`,
        "no docs source file is installed",
        !/^(content|docs|app|components)\//.test(file.path) && /^@components\//.test(file.target ?? ""),
      );
    }
    if (item.meta) {
      // ADR-025: the hash covers this payload's own files, expanded docs and metadata.
      const digest = await componentSha(root, payload);
      check(
        "sourceSha",
        `meta.sourceSha is 8-hex and recomputes to this payload (${digest})`,
        /^[0-9a-f]{8}$/.test(payload.meta?.sourceSha ?? "") && payload.meta?.sourceSha === digest,
      );
      check(
        "meta",
        "payload metadata equals registry.json metadata",
        stableJson(hashableMeta(payload.meta)) === stableJson(hashableMeta(item.meta)),
      );
    }

    const markdown = await read(`public/r/${item.name}.md`).catch(() => "");
    check(
      "markdown-heading",
      `public/r/${item.name}.md opens with "# ${item.title}"`,
      markdown.startsWith(`# ${item.title}\n`),
    );
    check(
      "markdown-install",
      `public/r/${item.name}.md carries the install command`,
      markdown.includes(`npx shadcn@latest add ${NAMESPACE}${item.name}`),
    );
    check(
      "markdown-body",
      isComponent(item) ? "markdown carries the payload docs body" : "markdown explains the support item",
      markdown.includes(isComponent(item) ? (payload.docs ?? "\u0000") : "Registry support item"),
    );

    let plan;
    try {
      plan = installationPlan(registry.items, item.name);
    } catch (error) {
      check("plan", error.message, false);
      continue;
    }
    const targets = plan.files.map((file) => file.target);
    row.planFiles = plan.files.length;
    row.planDependencies = plan.dependencies.length;
    row.planItems = plan.items.length;
    check("plan-targets", "every installed target is unique", new Set(targets).size === targets.length);
    check(
      "plan-namespace",
      "every registry dependency is namespaced",
      plan.items.every((entry) => (entry.registryDependencies ?? []).every((dep) => dep.startsWith(NAMESPACE))),
    );
    for (const detail of await importClosureProblems(plan, read)) check("plan-closure", detail, false);
  }
  return {
    rows,
    problems: rows.flatMap((row) => row.failures.map((failure) => `${row.id}: ${failure.check}: ${failure.detail}`)),
  };
}

function table(rows) {
  const lines = [
    "| id | type | plan files | npm deps | plan items | failed checks | result |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const row of rows) {
    const failed = [...new Set(row.failures.map((failure) => failure.check))];
    lines.push(
      `| ${row.id} | ${row.type} | ${row.planFiles ?? "—"} | ${row.planDependencies ?? "—"} | ${
        row.planItems ?? "—"
      } | ${failed.length ? failed.join(", ") : "—"} | ${failed.length ? "FAIL" : "pass"} |`,
    );
  }
  return lines.join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
  const { rows, problems } = await checkInstallMatrix(root, registry);
  const report = {
    generatedAt: new Date().toISOString(),
    registryItems: registry.items.length,
    components: rows.filter((row) => row.component).length,
    primitives: PRIMITIVES.filter((id) => rows.some((row) => row.id === id)),
    plans: rows.filter((row) => row.planFiles !== undefined).length,
    withoutMeta: rows.filter((row) => !registry.items.find((item) => item.name === row.id).meta).map((row) => row.id),
    failed: rows.filter((row) => row.failures.length).length,
    rows,
  };
  const target = process.argv.indexOf("--json");
  if (target > 0 && process.argv[target + 1]) {
    const file = path.resolve(process.argv[target + 1]);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (problems.length) {
    console.error(`Install matrix failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
    process.exit(1);
  }
  console.log(
    `Install matrix OK: ${report.registryItems} items (${report.components} components incl. ${report.primitives.length} primitives), ${report.plans} install plans, ${report.withoutMeta.length} support items without meta, 0 undeclared dependencies.`,
  );
  if (process.env.INSTALL_MATRIX_TABLE) console.log(`\n${table(rows)}`);
}
