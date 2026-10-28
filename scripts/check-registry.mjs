/**
 * Verifies that the published registry agrees with the source:
 *
 *   - every file listed in registry.json exists and has the canonical target
 *   - every item has a fresh payload with embedded content and docs
 *   - component docs, motion metadata, and intensity are present
 *   - no component imports through an alias, and every animated file has a reduced branch
 *   - export names are unique across items (so one `export *` index works)
 *   - each component stays inside the 8 KB gzip budget
 *
 *   node scripts/check-registry.mjs
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const problems = [];
const exists = async (file) => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

const expectedTarget = (file) => `@components/cadence/${file.slice("registry/cadence/".length)}`;

for (const item of registry.items) {
  const payloadPath = path.join(root, "public", "r", `${item.name}.json`);
  if (!(await exists(payloadPath))) {
    problems.push(`${item.name}: missing public/r/${item.name}.json (run registry:build)`);
    continue;
  }
  const payload = JSON.parse(await readFile(payloadPath, "utf8"));

  if (item.type === "registry:ui" && (!payload.docs || payload.docs.length < 200))
    problems.push(`${item.name}: payload is missing a real docs body`);
  if (item.type === "registry:ui") {
    if (!item.meta?.motion?.length) problems.push(`${item.name}: missing meta.motion`);
    if (!item.meta?.intensity) problems.push(`${item.name}: missing meta.intensity`);
  }

  let bytes = 0;
  for (const file of item.files ?? []) {
    if (!(await exists(path.join(root, file.path)))) {
      problems.push(`${item.name}: missing source ${file.path}`);
      continue;
    }
    if (file.target !== expectedTarget(file.path)) {
      problems.push(`${item.name}: ${file.path} targets ${file.target}, expected ${expectedTarget(file.path)}`);
    }
    const source = await readFile(path.join(root, file.path), "utf8");
    const embedded = payload.files?.find((entry) => entry.path === file.path)?.content;
    if (embedded !== source) problems.push(`${item.name}: payload is stale for ${file.path}`);
    if (source.includes('from "@/') || source.includes("from '@/"))
      problems.push(`${item.name}: ${file.path} imports through an alias`);

    const animated = item.type === "registry:ui" && /\bmotion\b|\banimate\(|AnimatePresence/.test(source);
    if (animated && !/useCadenceMotion|useReducedMotion|data-motion/.test(source)) {
      problems.push(`${item.name}: ${file.path} animates without a reduced-motion branch`);
    }
    if (item.type === "registry:ui") bytes += gzipSync(source).length;
  }

  if (item.type === "registry:ui" && bytes > 8 * 1024) {
    problems.push(`${item.name}: ${(bytes / 1024).toFixed(1)} KB gzip exceeds the 8 KB component budget`);
  }
}

// Export names must be unique per item folder so consumers can re-export everything.
const exporters = new Map();
const folderOf = (file) => file.split("/").slice(2, 3)[0] ?? file;
for (const file of new Set(registry.items.flatMap((item) => (item.files ?? []).map((entry) => entry.path)))) {
  if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
  if (!(await exists(path.join(root, file)))) continue;
  const source = await readFile(path.join(root, file), "utf8");
  const names = new Set();
  for (const match of source.matchAll(
    /export\s+(?:async\s+)?(?:function|class|const|let|type|interface)\s+([A-Za-z0-9_]+)/g,
  )) {
    names.add(match[1]);
  }
  for (const name of names) {
    if (!exporters.has(name)) exporters.set(name, new Set());
    exporters.get(name).add(folderOf(file));
  }
}
for (const [name, folders] of exporters) {
  if (folders.size > 1) problems.push(`export name "${name}" is exported by ${[...folders].sort().join(" and ")}`);
}

// Every UI item must have a doc file on disk.
const docFiles = new Set(
  (await readdir(path.join(root, "content", "components"))).map((file) => file.replace(/\.mdx$/, "")),
);
for (const item of registry.items) {
  if (item.type === "registry:ui" && !docFiles.has(item.name))
    problems.push(`${item.name}: missing content/components/${item.name}.mdx`);
}

if (problems.length) {
  console.error(`Registry check failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
  process.exit(1);
}

console.log(
  `Registry OK: ${registry.items.length} items, ${docFiles.size} component docs, targets and payloads in sync, export names unique, size budgets met.`,
);
