import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export interface DocFrontmatter {
  title: string;
  description: string;
  category?: string;
  tier?: "T0" | "T1" | "T2" | "T3" | "T4" | "T5";
  motion?: string[];
  intensity?: "subtle" | "medium" | "expressive";
  complexity?: "S" | "M" | "L";
  since?: string;
  deps?: string[];
  registryDeps?: string[];
}

export interface Doc extends DocFrontmatter {
  slug: string;
  body: string;
  /** Build batch from `meta.batch`, the sidebar's grouping key. */
  batch?: string;
}

/** The sidebar's second level: one batch of components, in build order. */
export interface ComponentGroup {
  id: string;
  title: string;
  components: Doc[];
}

/**
 * Batches in build order. Mirrors docs/parity-plan.md §7; an item declares its batch
 * with `meta.batch`, so a new component lands in the right group without touching this
 * table. Batches that ship nothing are not rendered.
 */
export const BATCHES = [
  { id: "B1", title: "Atoms" },
  { id: "B2", title: "Structure and feedback" },
  { id: "B3", title: "Form controls" },
  { id: "B4", title: "Overlays" },
  { id: "B5", title: "Menus and selection" },
  { id: "B6", title: "Disclosure and collections" },
  { id: "B7", title: "Heavy data and navigation" },
  { id: "B8", title: "Compositions" },
  { id: "B9", title: "AI first" },
] as const;

const contentRoot = path.join(process.cwd(), "content");

async function readDoc(file: string): Promise<Doc> {
  const raw = await readFile(file, "utf8");
  const { data, content } = matter(raw);
  return {
    ...(data as DocFrontmatter),
    slug: path.basename(file).replace(/\.mdx?$/, ""),
    body: content.trim(),
  };
}

/** Component docs in registry order, so the site and the CLI list items the same way. */
export async function listComponents(): Promise<Doc[]> {
  const registry = JSON.parse(await readFile(path.join(process.cwd(), "registry.json"), "utf8")) as {
    items: Array<{ name: string; type: string; meta?: { batch?: string } }>;
  };
  const dir = path.join(contentRoot, "components");
  const files = await readdir(dir);
  const docs = new Map<string, Doc>();
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const doc = await readDoc(path.join(dir, file));
    docs.set(doc.slug, doc);
  }
  const components: Doc[] = [];
  for (const item of registry.items) {
    if (item.type !== "registry:ui" && item.type !== "registry:block") continue;
    const doc = docs.get(item.name);
    if (doc) components.push({ ...doc, batch: item.meta?.batch });
  }
  return components;
}

/**
 * The same components, nested one level: grouped by batch, empty batches dropped, and any
 * batch this table does not know yet appended last instead of disappearing.
 */
export async function listComponentGroups(): Promise<ComponentGroup[]> {
  const components = await listComponents();
  const grouped = new Map<string, Doc[]>();
  for (const component of components) {
    const id = component.batch ?? "";
    grouped.set(id, [...(grouped.get(id) ?? []), component]);
  }

  const known = new Set<string>(BATCHES.map((batch) => batch.id));
  const groups: ComponentGroup[] = BATCHES.filter((batch) => grouped.has(batch.id)).map((batch) => ({
    id: batch.id,
    title: batch.title,
    components: grouped.get(batch.id) ?? [],
  }));

  for (const [id, items] of grouped) {
    if (known.has(id)) continue;
    groups.push({ id, title: id ? `Batch ${id}` : "Unscheduled", components: items });
  }

  return groups;
}

export async function getComponent(slug: string): Promise<Doc | null> {
  try {
    return await readDoc(path.join(contentRoot, "components", `${slug}.mdx`));
  } catch {
    return null;
  }
}

const guideOrder = ["installation", "theming", "motion", "validation"];

export async function listGuides(): Promise<Doc[]> {
  const dir = path.join(contentRoot, "docs");
  const files = await readdir(dir);
  const docs: Doc[] = [];
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    docs.push(await readDoc(path.join(dir, file)));
  }
  return docs.sort((a, b) => guideOrder.indexOf(a.slug) - guideOrder.indexOf(b.slug));
}

export async function getGuide(slug: string): Promise<Doc | null> {
  try {
    return await readDoc(path.join(contentRoot, "docs", `${slug}.mdx`));
  } catch {
    return null;
  }
}
