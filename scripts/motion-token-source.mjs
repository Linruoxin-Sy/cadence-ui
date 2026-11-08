/** Load the authored TS parameter source on every supported build Node version. */

import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import ts from "typescript";

const require = createRequire(import.meta.url);
const biome = path.join(path.dirname(require.resolve("@biomejs/biome/package.json")), "bin/biome");
const formatConfig = `--config-path=${path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../biome.json")}`;

export async function loadMotionSource(root = process.cwd()) {
  const source = await readFile(path.join(root, "registry/cadence/lib/motion.ts"), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, verbatimModuleSyntax: true },
  });
  // motion.ts has type-only imports. Runtime imports would need an explicit distribution decision.
  const tree = ts.createSourceFile("motion.js", result.outputText, ts.ScriptTarget.ES2022, true);
  if (
    tree.statements.some(
      (node) => ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier),
    )
  )
    throw new Error("motion token source must remain a standalone parameter module");
  return import(`data:text/javascript;base64,${Buffer.from(result.outputText).toString("base64")}`);
}

/** Existing effective CSS compatibility surface, derived rather than authored here. */
export function authoredCssTokens(source) {
  const entries = source.motionTokenEntries();
  const theme = Object.fromEntries(
    entries.filter((entry) => entry.group === "ease").map((entry) => [entry.name, source.motionTokenCss(entry)]),
  );
  const inputs = Object.fromEntries(
    entries.filter((entry) => entry.group !== "ease").map((entry) => [entry.name, source.motionTokenCss(entry)]),
  );
  const aliases = Object.fromEntries(
    entries.map((entry) => [entry.name, `var(${source.inheritedMotionTokenName(entry.name)}, inherit)`]),
  );
  const clock = (factor) =>
    Object.fromEntries(
      Object.keys(source.duration).map((key) => [
        `--motion-duration-${key}`,
        factor === 0
          ? source.generatedMotionTime("0s")
          : `var(${source.effectiveMotionTokenName(key)}, ${source.generatedMotionTime(`var(--motion-source-duration-${key}) * ${factor} * var(--cadence-time-scale, 1)`)})`,
      ]),
    );
  return {
    theme,
    root: { "--motion-source-version": String(source.motionCssVersion), ...inputs, ...clock(1) },
    scope: aliases,
    full: clock(1),
    reduced: clock(source.reducedDurationScale),
    none: clock(0),
    "system-reduced": clock(source.reducedDurationScale),
    "system-reduced-full": clock(source.reducedDurationScale),
  };
}

export function renderMotionCss(tokens) {
  const block = (selector, vars) =>
    `${selector} {\n${Object.entries(vars)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n")}\n}`;
  const indent = (text) =>
    text
      .split("\n")
      .map((line) => (line ? `  ${line}` : line))
      .join("\n");
  const scopes = [
    block(":root", tokens.root),
    block("[data-cadence-scope]", tokens.scope),
    block('[data-motion="full"]', tokens.full),
    block('[data-motion="reduced"]', tokens.reduced),
    block('[data-motion="none"]', tokens.none),
    `@media (prefers-reduced-motion: reduce) {\n${indent([block(":root", tokens["system-reduced"]), block('[data-motion="full"]', tokens["system-reduced-full"])].join("\n\n"))}\n}`,
  ];
  return `/* Generated from registry/cadence/lib/motion.ts; pnpm motion:tokens. */\n${block("@theme static", tokens.theme)}\n\n@layer base {\n${indent(scopes.join("\n\n"))}\n}\n`;
}

// Theme loop clocks are owned by the theme, not this recipe-token generator.
const motionToken = /^--(motion-|ease-cadence-)/;
const mergeMotion = (existing = {}, expected) => {
  const result = { ...existing };
  for (const key of Object.keys(result)) if (motionToken.test(key) && expected[key] === undefined) delete result[key];
  return Object.assign(result, expected);
};

/** Changes only the generated motion declarations; semantic theme defaults remain untouched. */
export async function generateMotionTokens(root = process.cwd()) {
  const tokens = authoredCssTokens(await loadMotionSource(root));
  const cssPath = path.join(root, "app/globals.css");
  const css = postcss.parse(await readFile(cssPath, "utf8"));
  // Own only motion declarations in the supported scopes. Leave semantic theme and loop clocks alone.
  const selectors = new Set([
    ":root",
    "[data-motion]",
    "[data-cadence-scope]",
    '[data-motion="full"]',
    '[data-motion="reduced"]',
    '[data-motion="none"]',
  ]);
  css.walkRules((rule) => {
    if (!selectors.has(rule.selector)) return;
    for (let parent = rule.parent; parent && parent !== css; parent = parent.parent)
      if (parent.type === "atrule" && parent.name === "media" && parent.params !== "(prefers-reduced-motion: reduce)")
        return;
    for (const declaration of [...rule.nodes])
      if (declaration.type === "decl" && motionToken.test(declaration.prop)) declaration.remove();
    if (!rule.nodes.some((node) => node.type !== "comment")) rule.remove();
  });
  css.walkAtRules("theme", (rule) => {
    for (const declaration of [...(rule.nodes ?? [])])
      if (declaration.type === "decl" && motionToken.test(declaration.prop)) declaration.remove();
    if (!rule.nodes?.length) rule.remove();
  });
  css.walkComments((comment) => {
    if (comment.text.startsWith("Generated from registry/cadence/lib/motion.ts;")) comment.remove();
  });
  css.walkAtRules((rule) => {
    if (rule.nodes && !rule.nodes.length) rule.remove();
  });
  const generated = postcss.parse(renderMotionCss(tokens));
  generated.nodes[0].raws.before = "\n\n";
  for (const node of [...generated.nodes]) css.append(node);
  css.raws.after = "\n";

  const registryPath = path.join(root, "registry.json");
  const rawRegistry = await readFile(registryPath, "utf8");
  const registry = JSON.parse(rawRegistry);
  const theme = registry.items.find((item) => item.name === "cadence-theme");
  if (!theme) throw new Error("missing cadence-theme registry item");
  theme.cssVars.theme = mergeMotion(theme.cssVars.theme, {});
  if (theme.css["@theme"]) {
    theme.css["@theme"] = mergeMotion(theme.css["@theme"], {});
    if (!Object.keys(theme.css["@theme"]).length) delete theme.css["@theme"];
  }
  theme.css["@theme static"] = mergeMotion(theme.css["@theme static"], tokens.theme);
  theme.cssVars.light = mergeMotion(theme.cssVars.light, {});
  const base = theme.css["@layer base"];
  base[":root"] = mergeMotion(base[":root"], tokens.root);
  if (base["[data-motion]"]) {
    base["[data-motion]"] = mergeMotion(base["[data-motion]"], {});
    if (!Object.keys(base["[data-motion]"]).length) delete base["[data-motion]"];
  }
  base["[data-cadence-scope]"] = mergeMotion(base["[data-cadence-scope]"], tokens.scope);
  base["[data-motion='full']"] = mergeMotion(base["[data-motion='full']"], tokens.full);
  base["[data-motion='reduced']"] = mergeMotion(base["[data-motion='reduced']"], tokens.reduced);
  base["[data-motion='none']"] = mergeMotion(base["[data-motion='none']"], tokens.none);
  base["@media (prefers-reduced-motion: reduce)"][":root"] = mergeMotion(
    base["@media (prefers-reduced-motion: reduce)"][":root"],
    tokens["system-reduced"],
  );

  base["@media (prefers-reduced-motion: reduce)"]["[data-motion='full']"] = mergeMotion(
    base["@media (prefers-reduced-motion: reduce)"]["[data-motion='full']"],
    tokens["system-reduced-full"],
  );
  const owned = new Set([
    ":root",
    "[data-cadence-scope]",
    "[data-motion='full']",
    "[data-motion='reduced']",
    "[data-motion='none']",
    "@media (prefers-reduced-motion: reduce)",
  ]);
  theme.css["@layer base"] = {
    ...Object.fromEntries(Object.entries(base).filter(([key]) => !owned.has(key))),
    ":root": base[":root"],
    "[data-cadence-scope]": base["[data-cadence-scope]"],
    "[data-motion='full']": base["[data-motion='full']"],
    "[data-motion='reduced']": base["[data-motion='reduced']"],
    "[data-motion='none']": base["[data-motion='none']"],
    "@media (prefers-reduced-motion: reduce)": base["@media (prefers-reduced-motion: reduce)"],
  };

  const docsPath = path.join(root, "docs/animation-system.md");
  const docs = await readFile(docsPath, "utf8");
  const section = docs.indexOf("### 2.3 CSS-side exposure");
  const start = docs.indexOf("```css", section);
  const end = docs.indexOf("```", start + 6);
  if (section < 0 || start < 0 || end < 0) throw new Error("missing CSS documentation generation fence");
  // Parse all inputs before writing any output. Never partially update on malformed input.
  const formattedCss = execFileSync(
    process.execPath,
    [biome, "format", formatConfig, "--stdin-file-path=app/globals.css"],
    {
      input: css.toString(),
      encoding: "utf8",
    },
  );
  const formattedDocCss = execFileSync(
    process.execPath,
    [biome, "format", formatConfig, "--stdin-file-path=app/globals.css"],
    {
      input: renderMotionCss(tokens),
      encoding: "utf8",
    },
  );
  await writeFile(cssPath, formattedCss);
  // Preserve the hand-formatted registry when no token value changed.
  if (JSON.stringify(registry) !== JSON.stringify(JSON.parse(rawRegistry)))
    await writeFile(
      registryPath,
      execFileSync(process.execPath, [biome, "format", formatConfig, "--stdin-file-path=registry.json"], {
        input: `${JSON.stringify(registry, null, 2)}\n`,
        encoding: "utf8",
      }),
    );
  await writeFile(docsPath, `${docs.slice(0, start)}\`\`\`css\n${formattedDocCss}${docs.slice(end)}`);
  return tokens;
}
