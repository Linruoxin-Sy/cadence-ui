/**
 * The CSS motion tokens are declared three times — `app/globals.css`, the
 * `cadence-theme` registry item, and `docs/animation-system.md` §2.3 — and until
 * this module existed nothing compared them, so they drifted (the doc promised a
 * `--animate-shimmer` and a `--motion-scale-in` that no file contained).
 *
 * Three formats cannot be textually identical, so "equivalent" means the same
 * `scope → variable → value` map. Every parser below produces that shape and
 * `check-registry.mjs` fails on anything that is missing, extra, or different.
 *
 * Scopes:
 *   theme          `@theme inline` — the easing utilities
 *   root           `:root` — the authored durations
 *   reduced        `[data-motion="reduced"]`
 *   none           `[data-motion="none"]`
 *   system-reduced `@media (prefers-reduced-motion: reduce) :root`
 *
 * Motion tokens are deliberately theme-independent: there is no `.dark` scope, so
 * a duration declared under `.dark` is reported as unknown instead of being
 * silently dropped.
 */

/** Variables the ecosystem actually reads. Colours and radii are shadcn's. */
const MOTION_TOKEN = /^--(motion-|ease-cadence-|animate-)/;

const REDUCED_MEDIA = /^@media\b.*prefers-reduced-motion/;

/** Selector → scope. Anything else that declares a motion token is an unknown scope. */
const SCOPE_SELECTORS = new Map([
  [":root", "root"],
  ["@theme", "theme"],
  ["@theme inline", "theme"],
  ['[data-motion="reduced"]', "reduced"],
  ['[data-motion="none"]', "none"],
]);

const normaliseSelector = (text) => text.replace(/'/g, '"').replace(/\s+/g, " ").trim();

const normaliseValue = (value) => value.replace(/\s+/g, " ").trim();

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Split one nesting level into its child blocks and the declarations that sit
 * outside them. Declarations inside a child block belong to that block, not here.
 */
function readLevel(text) {
  const blocks = [];
  let outside = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] === "{") {
      let depth = 0;
      let end = index;
      for (; end < text.length; end += 1) {
        if (text[end] === "{") depth += 1;
        else if (text[end] === "}") {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      blocks.push({ header: outside.split(";").pop().trim(), body: text.slice(index + 1, end) });
      outside = "";
      index = end + 1;
      continue;
    }
    outside += text[index];
    index += 1;
  }
  return { blocks, outside };
}

function declarationsOf(text) {
  return [...text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;{}]+);/gi)].map((match) => [match[1], normaliseValue(match[2])]);
}

function scopeOf(chain) {
  const selector = normaliseSelector(chain.at(-1) ?? "");
  if (chain.some((header) => REDUCED_MEDIA.test(normaliseSelector(header)))) {
    return selector === ":root" ? "system-reduced" : null;
  }
  return SCOPE_SELECTORS.get(selector) ?? null;
}

function collect(text, chain, result) {
  const { blocks, outside } = readLevel(text);
  const declared = declarationsOf(outside);
  const scope = scopeOf(chain);

  if (scope) {
    result.tokens[scope] ??= {};
    for (const [name, value] of declared) {
      if (MOTION_TOKEN.test(name)) result.tokens[scope][name] = value;
    }
  } else if (declared.some(([name]) => MOTION_TOKEN.test(name))) {
    result.unknown.push(chain.map(normaliseSelector).join(" > ") || "(top level)");
  }

  for (const { header, body } of blocks) collect(body, [...chain, header], result);
}

/** Parse a stylesheet (or a bare block) into `{ tokens, unknown }`. */
export function parseCss(text) {
  const result = { tokens: {}, unknown: [] };
  collect(stripComments(text), [], result);
  return result;
}

/** Serialise the registry item's `cssVars` + `css` back into a stylesheet. */
function themeItemToCss(item) {
  const declarations = (map = {}) =>
    Object.entries(map)
      .map(([name, value]) => `${name}: ${value};`)
      .join(" ");

  const blocks = (node) =>
    Object.entries(node)
      .map(([key, value]) => {
        if (!value || typeof value !== "object") return `${key}: ${value};`;
        const isDeclarationMap = Object.keys(value).every((name) => name.startsWith("--"));
        return isDeclarationMap ? `${key} { ${declarations(value)} }` : `${key} { ${blocks(value)} }`;
      })
      .join("\n");

  return [
    `@theme inline { ${declarations(item.cssVars?.theme)} }`,
    `:root { ${declarations(item.cssVars?.light)} }`,
    blocks(item.css ?? {}),
  ].join("\n");
}

/** Parse the `cadence-theme` registry item. */
export function parseRegistryTheme(item) {
  return parseCss(themeItemToCss(item));
}

/** Parse the `css` fence under §2.3 of `docs/animation-system.md`. */
export function parseDocTokens(markdown) {
  const section = markdown.split("### 2.3 CSS-side exposure")[1];
  if (!section) throw new Error("docs/animation-system.md: cannot find `### 2.3 CSS-side exposure`");
  const fence = section.match(/```css\n([\s\S]*?)```/);
  if (!fence) throw new Error("docs/animation-system.md §2.3: no ```css fence");
  return parseCss(fence[1]);
}

/**
 * Compare every source against the union of what they declare.
 * `sources` is `[{ name, parsed: { tokens, unknown } }]`; the return value is a
 * list of human-readable problems, empty when the three agree.
 */
export function compareTokenSources(sources) {
  const problems = [];

  for (const source of sources) {
    for (const selector of source.parsed.unknown) {
      problems.push(
        `${source.name}: motion tokens under "${selector}", a scope the other copies do not declare ` +
          "(durations are theme-independent; add the scope to scripts/motion-tokens.mjs only if that changes)",
      );
    }
  }

  const scopes = [...new Set(sources.flatMap((source) => Object.keys(source.parsed.tokens)))].sort();
  if (!scopes.length) problems.push("no motion tokens found in any of the three sources");

  for (const scope of scopes) {
    const perSource = sources.map((source) => [source.name, source.parsed.tokens[scope] ?? {}]);
    const names = [...new Set(perSource.flatMap(([, vars]) => Object.keys(vars)))].sort();

    for (const name of names) {
      const declared = perSource
        .filter(([, vars]) => vars[name] !== undefined)
        .map(([sourceName, vars]) => `${sourceName} = ${vars[name]}`);

      for (const [sourceName, vars] of perSource) {
        if (vars[name] === undefined) problems.push(`${sourceName}: ${scope} is missing ${name}`);
      }
      if (new Set(declared.map((entry) => entry.split(" = ")[1])).size > 1) {
        problems.push(`${scope} ${name} disagrees: ${declared.join(" | ")}`);
      }
    }
  }

  return problems;
}
