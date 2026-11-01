/** Structural docs validation. Only designated table cells declare recipes. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { motionRecipes } from "./motion-manifest.mjs";

function visibleLines(markdown) {
  let fence = null;
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/\r?\n/)
    .map((line) => {
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
        return "";
      }
      return fence ? "" : line;
    });
}

function tableRecipes(markdown, heading, catalogue, label, guide = false) {
  const problems = [];
  const lines = visibleLines(markdown);
  const starts = lines.flatMap((line, index) => (line.trim() === `## ${heading}` ? [index] : []));
  if (starts.length !== 1)
    return { recipes: [], problems: [`${label}: expected one ## ${heading} section, found ${starts.length}`] };
  const start = starts[0] + 1;
  const end = lines.findIndex((line, index) => index >= start && /^#{1,2}\s/.test(line));
  const section = lines.slice(start, end < 0 ? undefined : end);
  const cells = (line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split(/(?<!\\)\|/)
      .map((cell) => cell.trim());
  const recipes = [];
  let tables = 0;
  for (let i = 0; i < section.length - 1; i++) {
    if (!section[i].trim().startsWith("|") || !/^\s*\|[\s:|-]+\|\s*$/.test(section[i + 1])) continue;
    const headers = cells(section[i]);
    const column = headers.findIndex((cell) =>
      (guide ? ["Recipe"] : ["Token", "Recipe", "Recipe / cause", "Recipe / tokens"]).includes(cell),
    );
    const staticTable = !guide && ["Mode|Authored motion", "Mode|Animated properties"].includes(headers.join("|"));
    if (column < 0 && !staticTable) continue;
    tables++;
    i += 2;
    let rows = 0;
    for (; i < section.length && section[i].trim().startsWith("|"); i++) {
      rows++;
      const row = cells(section[i]);
      if (row.length !== headers.length) problems.push(`${label}: malformed ${heading} table row: ${section[i]}`);
      const cell = row[column < 0 ? 1 : column] ?? "";
      const codes = [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
      const found = codes.filter(
        (code) => !/^(duration|ease|spring|distance)\./.test(code) && /^[a-z][a-z.]*$/.test(code),
      );
      if (guide && found.length !== 1) problems.push(`${label}: catalogue row must name exactly one recipe: ${cell}`);
      for (const recipe of found) {
        if (!catalogue.includes(recipe)) problems.push(`${label}: unknown recipe "${recipe}" in ${heading} table`);
      }
      problems.push(...duplicates(found, `${label}: ${heading} table cell`));
      recipes.push(...found);
    }
    if (!rows) problems.push(`${label}: empty ${heading} table`);
    i--;
  }
  if (tables !== 1) problems.push(`${label}: expected one ${heading} recipe table, found ${tables}`);
  if (guide) problems.push(...duplicates(recipes, label));
  return { recipes: [...new Set(recipes)], problems };
}

function duplicates(values, label) {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))].map(
    (value) => `${label}: duplicate recipe "${value}"`,
  );
}

function compare(actual, expected, label, catalogue) {
  const problems = duplicates(actual, label);
  for (const recipe of actual) {
    if (!catalogue.includes(recipe)) problems.push(`${label}: unknown recipe "${recipe}"`);
    if (!expected.includes(recipe)) problems.push(`${label}: extra recipe "${recipe}"`);
  }
  for (const recipe of expected) if (!actual.includes(recipe)) problems.push(`${label}: missing recipe "${recipe}"`);
  return problems;
}

/** Called by registry:check and exercised with isolated mutated fixtures in tests. */
export async function checkMotionDocs(root, registry, catalogue) {
  const problems = [];
  for (const item of registry.items) {
    if (!["registry:ui", "registry:block"].includes(item.type)) continue;
    const label = `content/components/${item.name}.mdx`;
    let doc;
    try {
      doc = matter(await readFile(path.join(root, label), "utf8"));
    } catch {
      problems.push(`${label}: missing or invalid document`);
      continue;
    }
    const declared = motionRecipes(item.meta?.motion);
    problems.push(...compare(declared, declared, `${item.name}: meta.motion`, catalogue));
    if (!Array.isArray(doc.data.motion) || !doc.data.motion.every((recipe) => typeof recipe === "string")) {
      problems.push(`${label}: frontmatter motion must be an array of recipe names`);
    } else problems.push(...compare(doc.data.motion, declared, `${label}: frontmatter motion`, catalogue));
    const table = tableRecipes(doc.content, "Motion contract", catalogue, label);
    problems.push(...table.problems, ...compare(table.recipes, declared, `${label}: Motion contract table`, catalogue));
  }
  const label = "content/docs/motion.mdx";
  try {
    const table = tableRecipes(await readFile(path.join(root, label), "utf8"), "Recipes", catalogue, label, true);
    problems.push(...table.problems, ...compare(table.recipes, catalogue, `${label}: Recipes table`, catalogue));
  } catch {
    problems.push(`${label}: missing or invalid document`);
  }
  return problems;
}
