/**
 * Verifies that the published registry agrees with the source:
 *
 *   - every file listed in registry.json exists and has the canonical target
 *   - every item has a fresh payload with embedded content and docs
 *   - UI and block items declare `meta.tier`, `meta.batch`, `meta.upstream`, `meta.motion`, `meta.intensity`
 *   - the tier decides the gzip budget (T0 4 KB … T4 14 KB), unless `meta.budget` overrides it
 *   - no component imports a validation library or an alias, and every animated file has a reduced branch
 *   - intra-registry dependencies are namespaced (`@cadence/<id>`) and exist
 *   - export names are unique across items (so one `export *` index works)
 *   - every documented component ships a preview module
 *
 *   node scripts/check-registry.mjs
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import matter from "gray-matter";
import {
  calledRecipes,
  implementedForm,
  MOTION_FORMS,
  motionRecipes,
  normaliseMotion,
  recipeCatalogue,
} from "./motion-manifest.mjs";

const root = process.cwd();
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const problems = [];

const RECIPES = recipeCatalogue(await readFile(path.join(root, "registry", "cadence", "lib", "motion.ts"), "utf8"));
const docsDir = path.join(root, "content", "components");

/** Frontmatter is the human-facing copy of `meta`; the two must not drift. */
async function docFrontmatter(name) {
  try {
    return matter(await readFile(path.join(docsDir, `${name}.mdx`), "utf8")).data;
  } catch {
    return null;
  }
}

const TIER_BUDGET = { T0: 4, T1: 6, T2: 10, T3: 12, T4: 14, T5: 12 };
const NAMESPACE = "@cadence/";
const VALIDATION_DEPS = ["zod", "react-hook-form", "@hookform/resolvers", "yup", "valibot", "joi", "superstruct"];
const VALIDATION_IMPORT =
  /from\s+["'](zod|react-hook-form|@hookform\/resolvers|yup|valibot|joi|superstruct)(\/[^"']*)?["']/;
/**
 * Real animation code, not the word "motion" in a comment: a T0 component is
 * allowed to explain why it stays still. Matches the Motion entry points, the
 * animated JSX elements, and the imperative `animate()` helper.
 */
const ANIMATION_IMPORT =
  /from\s+["']motion(\/react)?["']|AnimatePresence|<motion\.[a-z]|useMotionValue|useScroll\(|useTransform\(|\banimate\(|whileInView|whileTap/;

const names = new Set(registry.items.map((item) => item.name));
const exists = async (file) => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

const expectedTarget = (file) => `@components/cadence/${file.slice("registry/cadence/".length)}`;
const isComponent = (item) => item.type === "registry:ui" || item.type === "registry:block";

for (const item of registry.items) {
  const payloadPath = path.join(root, "public", "r", `${item.name}.json`);
  if (!(await exists(payloadPath))) {
    problems.push(`${item.name}: missing public/r/${item.name}.json (run registry:build)`);
    continue;
  }
  const payload = JSON.parse(await readFile(payloadPath, "utf8"));

  if (isComponent(item) && (!payload.docs || payload.docs.length < 200)) {
    problems.push(`${item.name}: payload is missing a real docs body`);
  }

  if (isComponent(item)) {
    const tier = item.meta?.tier;
    if (!tier || !(tier in TIER_BUDGET)) {
      problems.push(`${item.name}: meta.tier must be one of ${Object.keys(TIER_BUDGET).join(", ")}`);
    }
    if (item.type === "registry:ui") {
      if (!Array.isArray(item.meta?.motion)) problems.push(`${item.name}: meta.motion must be an array`);
      if (item.meta?.tier !== "T0" && !item.meta?.motion?.length) {
        problems.push(`${item.name}: non-T0 components need at least one recipe in meta.motion`);
      }
      if (!item.meta?.intensity) problems.push(`${item.name}: missing meta.intensity`);

      for (const { recipe, form } of normaliseMotion(item.meta?.motion)) {
        if (!RECIPES.includes(recipe)) {
          problems.push(`${item.name}: unknown recipe "${recipe}" — the catalogue lives in lib/motion.ts`);
        }
        if (!MOTION_FORMS.includes(form)) {
          problems.push(`${item.name}: motion form "${form}" must be one of ${MOTION_FORMS.join(", ")}`);
        }
      }
    }
    // The sidebar groups components by batch, so a missing batch hides it from navigation.
    if (!/^B[1-9]$/.test(item.meta?.batch ?? "")) {
      problems.push(`${item.name}: meta.batch must be a batch id (B1–B9) from docs/parity-plan.md §7`);
    }
    if (item.meta?.upstream?.registry !== "shadcn") {
      problems.push(`${item.name}: meta.upstream.registry must be "shadcn"`);
    }
    if (!item.meta?.upstream?.style) problems.push(`${item.name}: missing meta.upstream.style`);

    for (const dependency of item.registryDependencies ?? []) {
      if (!dependency.startsWith(NAMESPACE)) {
        problems.push(`${item.name}: registryDependency "${dependency}" must be namespaced ${NAMESPACE}<id>`);
        continue;
      }
      if (!names.has(dependency.slice(NAMESPACE.length))) {
        problems.push(`${item.name}: unknown registry dependency ${dependency}`);
      }
    }
  }

  for (const dependency of item.dependencies ?? []) {
    const bare = dependency.split("@")[0] ?? dependency;
    if (VALIDATION_DEPS.includes(bare)) {
      problems.push(`${item.name}: validation libraries are out of scope (found "${dependency}")`);
    }
  }

  let bytes = 0;
  const sources = [];
  for (const file of item.files ?? []) {
    const filePath = path.join(root, file.path);
    if (!(await exists(filePath))) {
      problems.push(`${item.name}: missing source ${file.path}`);
      continue;
    }
    if (file.target !== expectedTarget(file.path)) {
      problems.push(`${item.name}: ${file.path} targets ${file.target}, expected ${expectedTarget(file.path)}`);
    }
    const source = await readFile(filePath, "utf8");
    sources.push(source);
    const embedded = payload.files?.find((entry) => entry.path === file.path)?.content;
    if (embedded !== source) problems.push(`${item.name}: payload is stale for ${file.path}`);
    if (source.includes('from "@/') || source.includes("from '@/")) {
      problems.push(`${item.name}: ${file.path} imports through an alias`);
    }
    if (VALIDATION_IMPORT.test(source)) {
      problems.push(`${item.name}: ${file.path} imports a validation library (P11)`);
    }
    if (isComponent(item) && !source.includes("data-slot")) {
      problems.push(`${item.name}: ${file.path} has no data-slot attribute`);
    }

    const animated = isComponent(item) && ANIMATION_IMPORT.test(source);
    if (animated && !/useCadenceMotion|useReducedMotion|data-motion/.test(source)) {
      problems.push(`${item.name}: ${file.path} animates without a reduced-motion branch`);
    }
    if (isComponent(item)) bytes += gzipSync(source).length;
  }

  if (isComponent(item)) {
    const tier = item.meta?.tier ?? "T0";
    const budgetKb = item.meta?.budget ? item.meta.budget / 1024 : (TIER_BUDGET[tier] ?? 8);
    if (bytes > budgetKb * 1024) {
      problems.push(`${item.name}: ${(bytes / 1024).toFixed(1)} KB gzip exceeds the ${budgetKb} KB budget for ${tier}`);
    }
  }

  if (isComponent(item)) {
    // Declared = implemented. A recipe with no implementation is a documentation
    // claim, not a component behaviour; a `transition()` call with no declaration
    // is an undeclared animation.
    const declared = normaliseMotion(item.meta?.motion);
    const called = [...new Set(sources.flatMap(calledRecipes))];

    for (const { recipe, form } of declared) {
      const implemented = sources.map((source) => implementedForm(source, recipe, form)).find(Boolean);
      if (!implemented) {
        problems.push(
          `${item.name}: declares "${recipe}" (${form}) but nothing implements it — ` +
            "add the transition, or mark the form as continuous",
        );
      }
    }

    for (const recipe of called) {
      if (!declared.some((entry) => entry.recipe === recipe)) {
        problems.push(`${item.name}: calls transition("${recipe}") without declaring it in meta.motion`);
      }
    }

    // Declared = documented. The frontmatter is what readers and agents see.
    const frontmatter = isComponent(item) ? await docFrontmatter(item.name) : null;
    if (frontmatter) {
      const pairs = [
        ["title", item.title],
        ["description", item.description],
        ["tier", item.meta?.tier],
        ["since", item.meta?.since],
        ["complexity", item.meta?.complexity],
        ["intensity", item.meta?.intensity],
      ];
      for (const [key, expected] of pairs) {
        if (frontmatter[key] !== expected) {
          problems.push(`${item.name}: docs frontmatter ${key} is "${frontmatter[key]}", registry says "${expected}"`);
        }
      }
      const docRecipes = [...(frontmatter.motion ?? [])].sort().join("|");
      const metaRecipes = motionRecipes(item.meta?.motion).sort().join("|");
      if (docRecipes !== metaRecipes) {
        problems.push(`${item.name}: docs motion [${docRecipes}] != registry motion [${metaRecipes}]`);
      }
    }
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

// Every component needs docs and a preview module on disk.
const docFiles = new Set(
  (await readdir(path.join(root, "content", "components"))).map((file) => file.replace(/\.mdx$/, "")),
);
const previewFiles = new Set(
  (await readdir(path.join(root, "components", "site", "previews")))
    .filter((file) => file.endsWith(".tsx") && file !== "index.tsx")
    .map((file) => file.replace(/\.tsx$/, "")),
);
const previewIndex = await readFile(path.join(root, "components", "site", "previews", "index.tsx"), "utf8");

for (const item of registry.items) {
  if (!isComponent(item)) continue;
  if (!docFiles.has(item.name)) problems.push(`${item.name}: missing content/components/${item.name}.mdx`);
  if (!previewFiles.has(item.name)) problems.push(`${item.name}: missing components/site/previews/${item.name}.tsx`);
  else if (!previewIndex.includes(`"${item.name}"`) && !previewIndex.includes(`${item.name}:`)) {
    problems.push(`${item.name}: preview is not registered in previews/index.tsx`);
  }
}

if (problems.length) {
  console.error(`Registry check failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`);
  process.exit(1);
}

const componentCount = registry.items.filter(isComponent).length;
console.log(
  `Registry OK: ${registry.items.length} items (${componentCount} components), ${docFiles.size} docs, ${previewFiles.size} previews, targets and payloads in sync, tier budgets met, P11 clean.`,
);
