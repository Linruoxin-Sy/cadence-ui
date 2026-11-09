/**
 * Scaffolds a parity component:
 *
 *   registry/cadence/<id>/index.tsx
 *   content/components/<id>.mdx
 *   components/site/previews/<id>.tsx
 *   app/(site)/components/<id>/page.tsx
 *   tests/components/<id>.test.tsx
 *   a matching item in registry.json
 *
 * Usage:
 *   node scripts/new-item.mjs --name tooltip --tier T2 --batch B4 --title "Tooltip" \
 *     --description "Hints for icon buttons, shortcuts, and truncated values." [--category overlay] \
 *     [--input] [--motion popup.anchored] [--intensity subtle] [--complexity M] [--since 0.3.0]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { componentRouteSource } from "./component-routes.mjs";
import { INPUT_DOCS, validateDocTemplate } from "./doc-template.mjs";
import { appendMotionIndex, motionTargetTemplate } from "./motion-target-template.mjs";

const root = process.cwd();
const args = process.argv.slice(2);

function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
}

const id = flag("name");
const tier = flag("tier", "T0");
const title = flag(
  "title",
  id ? id.replace(/(^|-)([a-z])/g, (_, dash, letter) => `${dash ? " " : ""}${letter.toUpperCase()}`) : undefined,
);
const description = flag("description");
const batch = flag("batch");
const category = flag("category", "layout");
const motion = (flag("motion", "") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const intensity = flag("intensity", tier === "T0" ? "subtle" : "medium");
const complexity = flag("complexity", ["T0", "T1"].includes(tier) ? "S" : "M");
const since = flag("since", "0.2.0");

const TIERS = new Set(["T0", "T1", "T2", "T3", "T4", "T5"]);

function fail(message) {
  console.error(`new-item: ${message}`);
  process.exit(1);
}

if (!id || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) fail("--name must be kebab-case");
if (!title) fail("--title is required");
if (!description) fail("--description is required (it must match registry.json exactly)");
if (!TIERS.has(tier)) fail(`--tier must be one of ${[...TIERS].join(", ")}`);
if (!/^B[1-9]$/.test(batch ?? "")) fail("--batch is required (B1–B9, see docs/parity-plan.md §7)");
if (motion.length === 0 && tier !== "T0") fail("non-T0 components need --motion <recipe>[,<recipe>]");

const pascal = id
  .split("-")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join("");

const sourcePath = path.join(root, "registry", "cadence", id, "index.tsx");
const docPath = path.join(root, "content", "components", `${id}.mdx`);
const previewPath = path.join(root, "components", "site", "previews", `${id}.tsx`);
const testPath = path.join(root, "tests", "components", `${id}.test.tsx`);
const routePath = path.join(root, "app", "(site)", "components", id, "page.tsx");
const exampleCatalogPath = path.join(root, "components", "site", "previews", "examples.json");
const exampleCatalog = JSON.parse(await readFile(exampleCatalogPath, "utf8"));
const registryPath = path.join(root, "registry.json");
const targetPath = path.join(root, "docs", "motion", "components", `${id}.md`);
const targetIndexPath = path.join(root, "docs", "motion", "README.md");
const targetIndex = appendMotionIndex(await readFile(targetIndexPath, "utf8"), id, title);

const exists = async (file) => {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
};

for (const file of [sourcePath, docPath, previewPath, testPath, routePath, targetPath]) {
  if (await exists(file)) fail(`${path.relative(root, file)} already exists`);
}

const input = args.includes("--input") || INPUT_DOCS.has(id);
const motionLine = `[${motion.join(", ")}]`;

const source = `"use client";

import { cn } from "../lib/cn";

export interface ${pascal}Props extends React.ComponentProps<"div"> {}

/**
 * TODO: match shadcn's ${id} API (exports, props, data-slot values) before writing motion.
 *
 * a11y: TODO
 */
export function ${pascal}({ className, ...props }: ${pascal}Props) {
  return <div data-slot="${id}" className={cn("", className)} {...props} />;
}
`;

const apiRow = `| \`className\` | \`string\` | – | Merged last. |`;
const motionSection = motion.length
  ? `| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
${motion.map((recipe) => `| TODO | TODO | \`${recipe}/one-shot\` | TODO |`).join("\n")}`
  : `No motion. The component is structural: it keeps the focus ring and colour transitions only.

| Mode | Authored motion |
| --- | --- |
| full | none |
| reduced | none |
| none | none |`;

const docs = `---
title: ${title}
description: ${description}
category: ${category}
motion: ${motionLine}
intensity: ${intensity}
complexity: ${complexity}
tier: ${tier}
since: ${since}
deps: ["@base-ui/react", "motion"]
registryDeps: ["@cadence/cadence-motion", "@cadence/cadence-utils", "@cadence/cadence-provider"]
---

## Installation

**Command**

\`\`\`install
npx shadcn@latest add @cadence/${id}
\`\`\`

**Manual**

[Manual installation files](https://cadence.dev/r/${id}.json)

## Usage

\`\`\`tsx
import { ${pascal} } from "@/components/cadence/${id}";

export function Example() {
  return <${pascal}>Hello</${pascal}>;
}
\`\`\`

## Composition

TODO: explain this composition and when it is useful. Keep the top card focused on common usage.

<ComponentExample name="composition" />

\`\`\`tsx
import { ${pascal} } from "@/components/cadence/${id}";

export function CompositionExample() {
  return <${pascal}>Hello</${pascal}>;
}
\`\`\`

## When to use

- TODO: three to five concrete scenarios.

## When not to use

- TODO: name the alternative component.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
${apiRow}

## Motion contract

${motionSection}

## Accessibility

- TODO: role, keyboard, focus, screen-reader behaviour.

${
  !["T0", "T1"].includes(tier)
    ? `## Keyboard interactions

| Keys | Action |
| --- | --- |
| Escape | TODO |

`
    : ""
}
${
  input
    ? `## Validation and data ownership

TODO: caller owns values, validation, errors and submission; render supplied invalid attributes only.
`
    : ""
}
## Responsiveness and performance

TODO: describe actual parent sizing, overflow, breakpoint and SSR behavior, installed runtime
and source budget. Tier selects the source ceiling and documentation profile; describe only implemented motion.

## Notes for AI

- TODO: when to pick this component and which mistake to avoid.
`;

exampleCatalog[id] = ["composition"];
const templateProblems = validateDocTemplate(
  matter(docs).content,
  { name: id, meta: { tier }, input },
  docPath,
  exampleCatalog,
);
if (templateProblems.length) fail(templateProblems.join("\n"));

const preview = `"use client";

import { ${pascal} } from "@/registry/cadence/${id}";

export function ${pascal}Preview({ example }: { example?: string }) {
  // TODO: give each named example its fixed, source-backed composition.
  if (example === "composition") return <${pascal}>Hello</${pascal}>;
  return (
    <${pascal}>
      TODO: show the component's main shape.
    </${pascal}>
  );
}
`;

const test = `import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ${pascal} } from "@/registry/cadence/${id}";
${
  motion.length
    ? `import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
`
    : ""
}
describe("${pascal}", () => {
  it("renders with its data-slot", () => {
    render(<${pascal}>Hello</${pascal}>);
    expect(screen.getByText("Hello")).toHaveAttribute("data-slot", "${id}");
  });
${
  motion.length
    ? `  // TODO: mount and exercise the actual animated parts (including portals).
  // This deliberately fails until the static source stub implements its motion contract.
  it.each(["full", "reduced", "none"] as const)("honours %s motion", (mode) => {
    render(<CadenceProvider mode={mode}><${pascal}>Hello</${pascal}></CadenceProvider>);
    expectMotionContract(mode);
  });
`
    : ""
}});
`;

await mkdir(path.dirname(sourcePath), { recursive: true });
await mkdir(path.dirname(targetPath), { recursive: true });
await writeFile(targetPath, motionTargetTemplate(id, title, pascal));
await writeFile(targetIndexPath, targetIndex);
await mkdir(path.dirname(testPath), { recursive: true });
await writeFile(sourcePath, source);
await writeFile(docPath, docs);
await writeFile(previewPath, preview);
await writeFile(testPath, test);
await mkdir(path.dirname(routePath), { recursive: true });
await writeFile(routePath, componentRouteSource(id));
await writeFile(exampleCatalogPath, `${JSON.stringify(exampleCatalog, null, 2)}\n`);

const registry = JSON.parse(await readFile(registryPath, "utf8"));
registry.items.push({
  name: id,
  type: "registry:ui",
  title,
  description,
  categories: [category],
  dependencies: ["@base-ui/react", "motion"],
  registryDependencies: ["@cadence/cadence-motion", "@cadence/cadence-utils", "@cadence/cadence-provider"],
  files: [
    {
      path: `registry/cadence/${id}/index.tsx`,
      type: "registry:ui",
      target: `@components/cadence/${id}/index.tsx`,
    },
  ],
  meta: {
    since,
    tier,
    batch,
    motion,
    intensity,
    complexity,
    upstream: { registry: "shadcn", style: "base-ui", version: "2026-10" },
  },
});
await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log(`✓ ${id} scaffolded
  registry/cadence/${id}/index.tsx
  content/components/${id}.mdx
  components/site/previews/${id}.tsx
  app/(site)/components/${id}/page.tsx
  tests/components/${id}.test.tsx
  docs/motion/components/${id}.md and motion index
Next: author the target contract (placeholders fail registry:check), implement the upstream API,
then \`pnpm registry:build && pnpm check\`.`);
