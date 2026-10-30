"use client";

import * as React from "react";
import type { GrammarState } from "shiki/core";
import type { Highlighter } from "./highlight";

interface Loaded {
  language: string;
  /** `null` once a language is known to be unbundled, so it is not retried. */
  highlighter: Highlighter | null;
}

interface Cache {
  language: string;
  /** The source already tokenized, always ending on a line boundary. */
  text: string;
  /** One node per line; a line is a list of coloured spans. */
  lines: React.ReactNode[];
  /** The grammar state after `text`, which is where the next chunk starts. */
  state?: GrammarState;
}

const EMPTY: Cache = { language: "", text: "", lines: [] };

/**
 * Highlight `code` for `language`, one node per line. Returns `null` while there is
 * nothing to render — no language, a language this item does not bundle, or the
 * highlighter chunk still loading — and the caller falls back to the plain string.
 *
 * **Streaming is the point of the shape.** Only the lines that are complete are
 * tokenized, and only once: the accumulated result and the grammar state after it
 * are kept, so an assistant appending a token to the last line re-tokenizes one line
 * instead of the whole block. The accumulated state is React state updated during
 * render, which is the supported way to derive state from props without an extra
 * effect round-trip — it re-renders once, sees nothing new to do, and stops.
 *
 * The module is imported dynamically so Shiki stays out of the caller's bundle
 * until a block actually asks for a language.
 */
export function useHighlightedCode(code: string, language?: string): React.ReactNode[] | null {
  // A trailing newline would render as an extra empty line.
  const source = code.endsWith("\n") ? code.slice(0, -1) : code;

  const [loaded, setLoaded] = React.useState<Loaded | null>(null);
  const highlighter = loaded && loaded.language === language ? loaded.highlighter : null;

  React.useEffect(() => {
    if (!language) return;

    let cancelled = false;
    import("./highlight")
      .then((module) => module.loadHighlighter(language))
      .then((value) => {
        if (!cancelled) setLoaded({ language, highlighter: value });
      })
      .catch(() => {
        // An unbundled or broken grammar is not an error the reader should see: the
        // block keeps its plain text, which is still the whole source.
        if (!cancelled) setLoaded({ language, highlighter: null });
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const [cache, setCache] = React.useState<Cache>(EMPTY);

  if (!highlighter || !language) return null;

  let next = cache;
  if (next.language !== language || !source.startsWith(next.text)) {
    next = { ...EMPTY, language };
  }

  // Everything up to the last newline is settled; the line after it is still being
  // written, so it is re-tokenized on every render and never cached.
  const end = source.lastIndexOf("\n") + 1;

  if (end > next.text.length) {
    const chunk = highlighter.highlight(source.slice(next.text.length, end - 1), next.state);
    next = {
      language,
      text: source.slice(0, end),
      lines: [...next.lines, ...chunk.lines],
      state: chunk.state,
    };
  }

  if (next !== cache) setCache(next);

  const tail = highlighter.highlight(source.slice(end), next.state).lines[0] ?? [];

  return [...next.lines, tail];
}
