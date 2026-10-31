import type { ReactNode } from "react";
import { type Highlighter, loadHighlighter } from "@/registry/cadence/code-highlight/highlight";

/**
 * Build-time highlighting for the docs site.
 *
 * **This runs at build, not in the reader's browser.** Every page that carries a
 * fence is statically rendered, so the tokenizer belongs in the build: the block
 * arrives coloured, and no grammar is downloaded to colour it. That is also why the
 * site's blocks are never given a `language` — the comment would be a lie as far as
 * the content is concerned, and it would make `CodeBlockContent` load the client
 * highlighter to tokenize nodes it did not produce. A fence whose language the item
 * does not bundle falls back to its plain string, which is the whole source.
 *
 * The grammar for a language is loaded once per build and shared by every block that
 * asks for it: 178 `tsx` fences must not each spin up their own highlighter. It is
 * its own module because two callers tokenize now — a fence, and the install
 * switcher, which colours three commands for the same block.
 */
const highlighters = new Map<string, Promise<Highlighter | null>>();

function highlighterFor(language: string): Promise<Highlighter | null> {
  const cached = highlighters.get(language);
  if (cached) return cached;

  // A grammar that fails to load is not an error the reader should meet: the block
  // keeps its plain text. `null` is cached too, so a broken language is asked once.
  const pending = loadHighlighter(language).catch(() => null);
  highlighters.set(language, pending);
  return pending;
}

/** One node per line, or `null` when this source has to render as plain text. */
export async function highlightSource(source: string, language?: string): Promise<ReactNode[][] | null> {
  if (!language || !source) return null;

  const highlighter = await highlighterFor(language);
  if (!highlighter) return null;

  // A trailing newline would render as an extra empty line.
  const trimmed = source.endsWith("\n") ? source.slice(0, -1) : source;
  return highlighter.highlight(trimmed).lines;
}
