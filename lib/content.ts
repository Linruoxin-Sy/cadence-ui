import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

export interface DocFrontmatter {
  title: string;
  description: string;
  category?: string;
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
}

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
    items: Array<{ name: string; type: string }>;
  };
  const dir = path.join(contentRoot, "components");
  const files = await readdir(dir);
  const docs = new Map<string, Doc>();
  for (const file of files) {
    if (!file.endsWith(".mdx")) continue;
    const doc = await readDoc(path.join(dir, file));
    docs.set(doc.slug, doc);
  }
  return registry.items
    .filter((item) => item.type === "registry:ui" || item.type === "registry:block")
    .map((item) => docs.get(item.name))
    .filter((doc): doc is Doc => Boolean(doc));
}

export async function getComponent(slug: string): Promise<Doc | null> {
  try {
    return await readDoc(path.join(contentRoot, "components", `${slug}.mdx`));
  } catch {
    return null;
  }
}

const guideOrder = ["installation", "theming", "motion"];

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
