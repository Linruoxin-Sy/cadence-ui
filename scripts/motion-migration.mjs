import remarkParse from "remark-parse";
import { unified } from "unified";

const parser = unified().use(remarkParse);

/** Only the designated section/fence declares metadata; examples elsewhere do not. */
export function targetMetadata(markdown) {
  const problems = [];
  const sections = [];
  let current;
  for (const node of parser.parse(markdown).children) {
    if (node.type === "heading" && node.depth === 2) {
      current = node.children.map((child) => child.value ?? "").join("") === "Contract references" ? [] : undefined;
      if (current) sections.push(current);
    } else if (current) current.push(node);
  }
  const fences = sections
    .flat()
    .filter((node) => node.type === "code" && node.lang === "json" && node.meta === "motion-contract");
  if (sections.length !== 1 || fences.length !== 1)
    return { metadata: null, problems: ["expected one ## Contract references with a json motion-contract fence"] };
  try {
    const metadata = JSON.parse(fences[0].value);
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
      problems.push("motion metadata must be an object");
    return { metadata, problems };
  } catch (error) {
    return { metadata: null, problems: [`invalid target metadata: ${error.message}`] };
  }
}

/** Internal target-state gate; it never changes the meaning of meta.motion. */
export function migrationProblems(migration, gate) {
  if (migration === "legacy") return [];
  if (migration === "v2")
    return gate?.checked
      ? gate.problems
      : ["v2 requires source-bound action and runtime gates; legacy evidence cannot certify v2"];
  return ["migration must explicitly be legacy or v2 (no inferred default)"];
}
