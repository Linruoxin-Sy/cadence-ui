import type * as React from "react";
import type { GrammarState, HighlighterCore } from "shiki/core";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/**
 * The syntax highlighter behind `code-block`. It lives in its own module for one
 * reason: this is the only file that imports Shiki, and `use-highlighted-code`
 * imports it **dynamically**. A block that shows tool output therefore pays nothing
 * for a tokenizer, and a block with a `language` loads one chunk on demand instead
 * of putting Shiki in the page's initial JavaScript.
 *
 * Two decisions are worth recording:
 *
 * - **The JavaScript regex engine, not the WASM one.** A registry item is copied
 *   into someone's project, and a `.wasm` asset that has to be found at runtime is
 *   a path that breaks. `createJavaScriptRegexEngine` gives up a little speed on
 *   very large files and removes the whole asset problem; `forgiving: true` lets a
 *   grammar whose pattern the JS engine cannot express degrade to plain text
 *   instead of throwing.
 * - **Two themes, colour as a CSS variable.** `defaultColor: false` makes every
 *   token carry `--shiki-light` / `--shiki-dark` instead of one fixed colour, so the
 *   block follows the page's `.dark` class without re-tokenizing and without a
 *   second highlighter. `tokenClass` reads the variable; the inline style supplies
 *   it. The two are written next to each other because a token is only legible if
 *   its class and its variable agree.
 * - **The high-contrast variants of both GitHub themes, not the plain ones.**
 *   `github-light` paints parameters in `#E36209`, which is 3.5:1 on white — a
 *   `color-contrast` violation on every block with a function signature, and the
 *   first thing `@axe-core` reported here. The high-contrast pair clears 4.5:1 on
 *   every token in both themes and costs nothing but a slightly deeper palette.
 */

/**
 * The bundled languages. Each is a dynamic import, so a page that shows `bash`
 * never downloads the `tsx` grammar. Add a language by adding a row here and
 * nothing else; a language that is not listed renders as plain text.
 */
const languages = {
  bash: () => import("shiki/langs/shellscript.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
};

type Language = keyof typeof languages;

const aliases: Record<string, Language> = {
  js: "javascript",
  md: "markdown",
  py: "python",
  sh: "bash",
  shell: "bash",
  shellscript: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

/** `color: var(--shiki-light)`, swapped to the dark variable under `.dark`. */
const tokenClass = "text-(--shiki-light) dark:text-(--shiki-dark)";

let core: Promise<HighlighterCore> | undefined;

function getCore() {
  core ??= createHighlighterCore({
    themes: [
      import("shiki/themes/github-light-high-contrast.mjs"),
      import("shiki/themes/github-dark-high-contrast.mjs"),
    ],
    // Languages load on demand in `loadHighlighter`; bundling them here would ship
    // thirteen grammars to a page that shows one.
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });

  return core;
}

/** A language name or alias, resolved to a bundled id; `null` means "render plainly". */
export function resolveLanguage(language: string): Language | null {
  const name = language.toLowerCase();
  if (name in languages) return name as Language;
  return aliases[name] ?? null;
}

export interface HighlightedChunk {
  /** One entry per line; a line is a list of coloured spans. */
  lines: React.ReactNode[][];
  /** The grammar state after the last line, so the next chunk continues where this one stopped. */
  state: GrammarState;
}

export interface Highlighter {
  /** Tokenize a piece of source, optionally continuing from an earlier chunk. */
  highlight: (code: string, state?: GrammarState) => HighlightedChunk;
}

/**
 * Load the highlighter for one language, or `null` when this item does not bundle
 * it. The result is cheap to call and synchronous, which is what lets a streaming
 * block tokenize only the lines that arrived.
 */
export async function loadHighlighter(language: string): Promise<Highlighter | null> {
  const lang = resolveLanguage(language);
  if (!lang) return null;

  const shiki = await getCore();
  if (!shiki.getLoadedLanguages().includes(lang)) await shiki.loadLanguage(languages[lang]);

  return {
    highlight: (code, state) => {
      const result = shiki.codeToTokens(code, {
        lang,
        themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
        defaultColor: false,
        grammarState: state,
      });

      return {
        lines: result.tokens.map((line) =>
          line.map((token) => (
            // A token's offset in the source is unique within its line and survives
            // re-tokenization, which an array index does not.
            <span key={token.offset} className={tokenClass} style={token.htmlStyle as React.CSSProperties}>
              {token.content}
            </span>
          )),
        ),
        state: result.grammarState as GrammarState,
      };
    },
  };
}

/**
 * Highlight a whole string and return one node per line, for a Server Component or
 * any other place that can await. `null` means the language is not bundled, so the
 * caller can fall back to plain text it already has.
 */
export async function highlightCode(code: string, language: string): Promise<React.ReactNode[][] | null> {
  const highlighter = await loadHighlighter(language);
  if (!highlighter) return null;

  // A trailing newline would render as an extra empty line.
  return highlighter.highlight(code.endsWith("\n") ? code.slice(0, -1) : code).lines;
}
