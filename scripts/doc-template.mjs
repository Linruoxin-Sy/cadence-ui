/** Structural body contract; editorial/API truth still requires review. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { visibleLines } from "./motion-docs.mjs";

export const INPUT_DOCS = new Set([
  "input",
  "textarea",
  "field",
  "input-group",
  "checkbox",
  "radio-group",
  "switch",
  "slider",
  "toggle",
  "toggle-group",
  "input-otp",
  "select",
  "combobox",
  "calendar",
  "data-table",
  "date-picker",
  "attachment",
]);

export function validateDocTemplate(body, item, label) {
  const problems = [];
  const fail = (message) => problems.push(`${label}: ${message}`);
  const lines = visibleLines(body);
  for (let index = 0; index < lines.length; index++) {
    if (
      /^ {0,3}(?:=+|-+)\s*$/.test(lines[index]) &&
      index > 0 &&
      lines[index - 1].trim() &&
      !lines[index - 1].trim().startsWith("|")
    ) {
      fail(`line ${index + 1}: use ATX ## headings, not Setext headings`);
    }
    if (/<h[1-6](?:\s|>)/i.test(lines[index].replace(/`+[^`]*`+/g, "")))
      fail(`line ${index + 1}: use Markdown ## headings, not HTML headings`);
  }
  const headings = lines.flatMap((line, index) => {
    const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*$/);
    return match ? [{ depth: match[1].length, title: match[2], index }] : [];
  });
  const sections = headings.filter((heading) => heading.depth === 2);
  if (sections[0]?.title !== "Installation" || sections[1]?.title !== "Usage") {
    fail("body must open with ## Installation then ## Usage");
  }
  let owner;
  for (const heading of headings) {
    if (heading.depth === 2) owner = heading.title;
    else if (
      heading.depth !== 3 ||
      owner !== "API" ||
      !/^`[^`]+`(?:, `[^`]+`)*(?: and `[^`]+`)?$/.test(heading.title)
    ) {
      fail(`line ${heading.index + 1}: only ## sections and ### inline-code part groups inside API are allowed`);
    }
  }
  const names = sections.map((heading) => heading.title);
  const requireOne = (title) => {
    const count = names.filter((name) => name === title).length;
    if (count !== 1) fail(`expected one ## ${title} section, found ${count}`);
  };
  for (const title of ["Installation", "Usage", "When to use", "When not to use", "API", "Motion contract"])
    requireOne(title);
  const pair = (combined, first, second, optionalSecond = false) => {
    if (names.includes(combined)) {
      requireOne(combined);
      if (names.includes(first) || names.includes(second)) fail(`use ## ${combined} or its split sections, not both`);
    } else {
      requireOne(first);
      if (!optionalSecond || names.includes(second)) requireOne(second);
    }
  };
  pair("Keyboard and accessibility", "Accessibility", "Keyboard interactions", ["T0", "T1"].includes(item.meta?.tier));
  pair("Responsiveness and performance", "Responsive behavior", "Performance");
  const ai = names.filter((name) => ["Notes for AI", "AI usage notes"].includes(name));
  if (ai.length !== 1) fail("expected one AI advice section (Notes for AI or AI usage notes)");
  if (INPUT_DOCS.has(item.name) || item.input) requireOne("Validation and data ownership");
  const rank = {
    Installation: 0,
    Usage: 1,
    "When to use": 3,
    "When not to use": 4,
    API: 5,
    "Motion contract": 6,
    Accessibility: 7,
    "Keyboard interactions": 7,
    "Keyboard and accessibility": 7,
    "Responsive behavior": 9,
    Performance: 10,
    "Responsiveness and performance": 9,
    "Notes for AI": 11,
    "AI usage notes": 11,
    "Related components": 12,
  };
  let previous = -1;
  const seen = new Set();
  for (const section of sections) {
    const title = section.title;
    if (seen.has(title)) fail(`duplicate ## ${title}`);
    seen.add(title);
    if (title === "Examples") fail("## Examples wrapper is forbidden; use flat named example sections");
    const order =
      title === "Validation and data ownership"
        ? section.index < (sections.find((entry) => entry.title === "When to use")?.index ?? -1)
          ? 2
          : 8
        : (rank[title] ?? 2);
    if (order < previous)
      fail(`## ${title} is out of template order (examples belong after Usage and before When to use)`);
    previous = Math.max(previous, order);
    const next = sections.find((entry) => entry.index > section.index)?.index ?? lines.length;
    if (
      !lines.slice(section.index + 1, next).some((line) => line.trim()) &&
      !body
        .split(/\r?\n/)
        .slice(section.index + 1, next)
        .some((line) => /^\s*(`{3,}|~{3,})/.test(line))
    ) {
      fail(`## ${title} must have content`);
    }
  }
  return problems;
}

export async function checkDocTemplates(root, registry) {
  const problems = [];
  for (const item of registry.items) {
    if (!["registry:ui", "registry:block"].includes(item.type)) continue;
    const label = `content/components/${item.name}.mdx`;
    try {
      const { content } = matter(await readFile(path.join(root, label), "utf8"));
      problems.push(...validateDocTemplate(content, item, label));
    } catch (error) {
      problems.push(`${label}: cannot read component docs: ${error.message}`);
    }
  }
  return problems;
}
