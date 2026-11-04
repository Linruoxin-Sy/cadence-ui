import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** A separate Next entry keeps each preview out of other pages' client graphs. */
export function componentRouteSource(id) {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid component route: ${id}`);
  const preview = `${id
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")}Preview`;
  return `import { ComponentPage, getComponentMetadata } from "@/components/site/component-page";
import { ${preview} } from "@/components/site/previews/${id}";

export function generateMetadata() {
  return getComponentMetadata("${id}");
}

export default function Page() {
  return <ComponentPage id="${id}" preview={${preview}} />;
}
`;
}

export async function checkComponentRoutes(root, registry) {
  const directory = path.join(root, "app", "(site)", "components");
  const ids = new Set(
    registry.items.filter((item) => ["registry:ui", "registry:block"].includes(item.type)).map((item) => item.name),
  );
  const problems = [];
  for (const id of ids) {
    const file = path.join(directory, id, "page.tsx");
    try {
      const source = await readFile(file, "utf8");
      if (source.replaceAll("\r\n", "\n") !== componentRouteSource(id)) {
        problems.push(`${id}: component route must import only its own preview and use the shared page template`);
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      problems.push(`${id}: missing app/(site)/components/${id}/page.tsx`);
    }
  }
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && !ids.has(entry.name)) problems.push(`Unexpected component route: ${entry.name}`);
  }
  return problems;
}
