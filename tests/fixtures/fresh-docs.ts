import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { expandInstallation } from "../../scripts/installation.mjs";

/** Keep positive checker fixtures fresh without mutating the real public tree. */
export function freshDocs(root: string, id: string, source: string) {
  const registry = JSON.parse(readFileSync(path.join(root, "registry.json"), "utf8"));
  const body = expandInstallation(matter(source).content.trim(), registry.items, id);
  const file = path.join(root, "public/r", `${id}.json`);
  const payload = JSON.parse(readFileSync(file, "utf8"));
  const previous = payload.docs;
  payload.docs = body;
  writeFileSync(file, JSON.stringify(payload));
  const md = path.join(root, "public/r", `${id}.md`);
  writeFileSync(md, readFileSync(md, "utf8").replace(previous, body));
  const full = path.join(root, "public/llms-full.txt");
  writeFileSync(full, readFileSync(full, "utf8").replace(previous, body));
}
