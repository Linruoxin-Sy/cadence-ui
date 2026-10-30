/**
 * Builds the Cadence registry:
 *
 *   1. reads registry.json and the component docs in content/components/*.mdx
 *   2. validates that install metadata and docs agree
 *   3. injects the doc body into every item (`docs`) and stamps `meta.since`
 *   4. runs `shadcn build` to produce public/r/<id>.json with embedded source
 *   5. finalizes payloads (docs, sourceSha), writes /r/<id>.md, catalog and llms files
 *
 *   node scripts/build-registry.mjs
 */
import { execFileSync, execSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import { motionRecipes } from "./motion-manifest.mjs";

const root = process.cwd();
const publicDir = path.join(root, "public");
const outDir = path.join(publicDir, "r");
const docsDir = path.join(root, "content", "components");

const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));

function sourceSha() {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

async function readDocs() {
  const entries = await readdir(docsDir).catch(() => []);
  const docs = new Map();
  for (const entry of entries) {
    if (!entry.endsWith(".mdx")) continue;
    const raw = await readFile(path.join(docsDir, entry), "utf8");
    const { data, content } = matter(raw);
    docs.set(entry.replace(/\.mdx$/, ""), { data, body: content.trim() });
  }
  return docs;
}

const docs = await readDocs();
const problems = [];
const same = (a = [], b = []) => [...a].sort().join("|") === [...b].sort().join("|");

for (const item of registry.items) {
  if (item.type !== "registry:ui") continue;
  const doc = docs.get(item.name);
  if (!doc) {
    problems.push(`${item.name}: missing content/components/${item.name}.mdx`);
    continue;
  }
  if (doc.data.title !== item.title)
    problems.push(`${item.name}: doc title "${doc.data.title}" != registry title "${item.title}"`);
  if (doc.data.description !== item.description)
    problems.push(`${item.name}: doc description differs from registry description`);
  if (!same(doc.data.deps ?? [], item.dependencies ?? []))
    problems.push(
      `${item.name}: doc deps ${JSON.stringify(doc.data.deps)} != registry deps ${JSON.stringify(item.dependencies)}`,
    );
  if (!same(doc.data.registryDeps ?? [], item.registryDependencies ?? []))
    problems.push(`${item.name}: doc registryDeps differ from registry`);
  if (!Array.isArray(doc.data.motion)) problems.push(`${item.name}: frontmatter needs a motion recipe list`);
  if (!doc.data.intensity) problems.push(`${item.name}: frontmatter needs an intensity`);

  // The frontmatter is the human copy of `meta`; compare every field, not just the
  // ones that happen to be convenient. `check-registry` repeats this check so the
  // gate also runs without a rebuild.
  for (const key of ["tier", "since", "complexity", "intensity"]) {
    if (doc.data[key] !== item.meta?.[key]) {
      problems.push(
        `${item.name}: doc ${key} "${doc.data[key]}" != registry ${key} "${item.meta?.[key] ?? "missing"}"`,
      );
    }
  }
  const docMotion = [...(doc.data.motion ?? [])].sort().join("|");
  const metaMotion = motionRecipes(item.meta?.motion).sort().join("|");
  if (docMotion !== metaMotion) {
    problems.push(`${item.name}: doc motion [${docMotion}] != registry motion [${metaMotion}]`);
  }
}

if (problems.length) {
  console.error(`Registry docs check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}

const sha = sourceSha();
const staged = {
  ...registry,
  items: registry.items.map((item) => {
    const doc = docs.get(item.name);
    if (!doc) return item;
    return {
      ...item,
      docs: doc.body,
      meta: { ...item.meta, since: item.meta?.since ?? doc.data.since ?? "0.1.0", sourceSha: sha },
    };
  }),
};

const tmpDir = await mkdtemp(path.join(os.tmpdir(), "cadence-registry-"));
const tmpRegistry = path.join(tmpDir, "registry.json");
await writeFile(tmpRegistry, JSON.stringify(staged, null, 2));
await mkdir(outDir, { recursive: true });

console.log(`• building ${staged.items.length} items with shadcn build`);
const shadcnBin = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "shadcn.cmd" : "shadcn");
try {
  await stat(shadcnBin);
} catch {
  throw new Error("shadcn is not installed. Run `pnpm install` first.");
}
execFileSync(shadcnBin, ["build", tmpRegistry, "-o", outDir], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

// Finalize payloads: keep docs/meta even if a future CLI drops them, and add a source stamp.
const built = [];
for (const item of staged.items) {
  const payloadPath = path.join(outDir, `${item.name}.json`);
  let payload;
  try {
    payload = JSON.parse(await readFile(payloadPath, "utf8"));
  } catch {
    if (item.files?.length) throw new Error(`shadcn build did not emit ${path.relative(root, payloadPath)}`);
    payload = { $schema: "https://ui.shadcn.com/schema/registry-item.json", ...item };
  }
  if (item.docs) payload.docs = item.docs;
  if (item.meta) payload.meta = { ...payload.meta, ...item.meta, sourceSha: sha };
  await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`);
  built.push(payload);
}

// Per-item markdown: what an agent or `curl` reads.
for (const item of staged.items) {
  const doc = docs.get(item.name);
  if (!doc) continue;
  const install = `npx shadcn@latest add @cadence/${item.name}`;
  const md = [
    `# ${item.title}`,
    "",
    `> ${item.description}`,
    "",
    `- Registry item: /r/${item.name}.json`,
    `- Install: \`${install}\``,
    `- Type: ${item.type}`,
    `- Since: ${item.meta?.since ?? "0.1.0"}`,
    item.meta?.motion?.length ? `- Motion recipes: ${motionRecipes(item.meta.motion).join(", ")}` : "",
    "",
    doc.body,
    "",
    "---",
    "",
    `Full index: /llms.txt`,
    "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
  await writeFile(path.join(outDir, `${item.name}.md`), md);
}

// Registry index and machine-readable catalog.
const index = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: registry.name,
  homepage: registry.homepage,
  items: built.map((item) => ({
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    categories: item.categories ?? [],
    meta: item.meta ?? {},
  })),
};
await writeFile(path.join(outDir, "registry.json"), `${JSON.stringify(index, null, 2)}\n`);
await writeFile(
  path.join(outDir, "catalog.json"),
  `${JSON.stringify(
    built.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      categories: item.categories ?? [],
      dependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
      ...item.meta,
      docs: `/r/${item.name}.md`,
      item: `/r/${item.name}.json`,
    })),
    null,
    2,
  )}\n`,
);

// llms.txt files.
const components = staged.items.filter((item) => item.type === "registry:ui" || item.type === "registry:block");
const overview = [
  "# Cadence UI",
  "",
  "> Animation-first React components for shadcn. Base UI + Tailwind CSS v4 + Motion.",
  "> Install with `npx shadcn@latest add @cadence/<id>`. Every component ships its motion contract and a reduced-motion branch.",
  "",
  "## Install",
  "",
  "```json",
  '{ "registries": { "@cadence": "https://cadence.dev/r/{name}.json" } }',
  "```",
  "",
  "```bash",
  "npx shadcn@latest add @cadence/button",
  "```",
  "",
  "## Rules for agents",
  "",
  "- Prefer an existing Cadence component over writing new animation code.",
  "- Read the item's `docs` and `meta.motion` before changing motion.",
  "- Keep the reduced-motion branch; never remove `data-motion`.",
  "- Use presets from `components/cadence/lib/motion.ts`; do not invent durations.",
  "- Cadence is UI only: never pass a schema, resolver, or validation rule to a component (P11).",
  "",
  "## Components",
  "",
  ...components.map(
    (item) => `- [${item.title}](/r/${item.name}.md): ${item.description} (${(item.categories ?? []).join(", ")})`,
  ),
  "",
  "## Docs",
  "",
  "- [/r/registry.json](/r/registry.json): install index",
  "- [/r/catalog.json](/r/catalog.json): machine-readable catalog",
  "- [/llms-full.txt](/llms-full.txt): every component doc inline",
  "",
].join("\n");
await writeFile(path.join(publicDir, "llms.txt"), overview);

const full = [
  "# Cadence UI — full context",
  "",
  overview,
  "",
  "---",
  "",
  ...components.map((item) => {
    const doc = docs.get(item.name);
    return `# ${item.title}\n\n${item.description}\n\n${doc?.body ?? ""}\n`;
  }),
].join("\n");
await writeFile(path.join(publicDir, "llms-full.txt"), full);

await rm(tmpDir, { recursive: true, force: true });
console.log(`✓ registry built: ${built.length} payloads, ${components.length} documented components`);
console.log(`  public/r/registry.json  public/r/catalog.json  public/llms.txt  public/llms-full.txt`);
