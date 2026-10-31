/**
 * Scaffolds a parity component:
 *
 *   registry/cadence/<id>/index.tsx
 *   content/components/<id>.mdx
 *   components/site/previews/<id>.tsx   (registered in previews/index.tsx)
 *   tests/components/<id>.test.tsx
 *   a matching item in registry.json
 *
 * Usage:
 *   node scripts/new-item.mjs --name tooltip --tier T2 --batch B4 --title "Tooltip" \
 *     --description "Hints for icon buttons, shortcuts, and truncated values." [--category overlay] \
 *     [--motion popup.anchored] [--intensity subtle] [--complexity M] [--since 0.3.0]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
const previewIndexPath = path.join(root, "components", "site", "previews", "index.tsx");
const registryPath = path.join(root, "registry.json");

const exists = async (file) => {
  try {
    await readFile(file);
    return true;
  } catch {
    return false;
  }
};

for (const file of [sourcePath, docPath, previewPath, testPath]) {
  if (await exists(file)) fail(`${path.relative(root, file)} already exists`);
}

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
| TODO | TODO | \`${motion[0]}\` | TODO |`
  : "No motion. The component is structural: it keeps the focus ring and colour transitions only.";

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

\`\`\`install
npx shadcn@latest add @cadence/${id}
\`\`\`

## Usage

\`\`\`tsx
import { ${pascal} } from "@/components/cadence/${id}";

export function Example() {
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
  ["T2", "T3", "T4", "T5"].includes(tier)
    ? `## Keyboard interactions

| Keys | Action |
| --- | --- |
| Escape | TODO |

## Responsive behavior

TODO.

## Performance

TODO.
`
    : ""
}
## Notes for AI

- TODO: when to pick this component and which mistake to avoid.
`;

const preview = `"use client";

import { ${pascal} } from "@/registry/cadence/${id}";

export function ${pascal}Preview() {
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

describe("${pascal}", () => {
  it("renders with its data-slot", () => {
    render(<${pascal}>Hello</${pascal}>);
    expect(screen.getByText("Hello")).toHaveAttribute("data-slot", "${id}");
  });
});
`;

await mkdir(path.dirname(sourcePath), { recursive: true });
await mkdir(path.dirname(testPath), { recursive: true });
await writeFile(sourcePath, source);
await writeFile(docPath, docs);
await writeFile(previewPath, preview);
await writeFile(testPath, test);

const indexSource = await readFile(previewIndexPath, "utf8");
// The map is built from `dynamic()` entries, so a scaffold adds one more of those. A
// static import here would pull the preview into the initial bundle, and a bare
// identifier (`popover: PopoverPreview`) is not even defined.
const previewKey = /^[a-z][a-zA-Z0-9]*$/.test(id) ? id : JSON.stringify(id);
const previewEntry = `  ${previewKey}: dynamic(() => import("./${id}").then((mod) => ({ default: mod.${pascal}Preview }))),`;
const updatedIndex = indexSource.replace(/\n\};/, `\n${previewEntry}\n};`);
await writeFile(previewIndexPath, updatedIndex);

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
  tests/components/${id}.test.tsx
Next: implement the upstream API, then \`pnpm registry:build && pnpm check\`.`);
