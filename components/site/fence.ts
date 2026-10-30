import { isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * What MDX hands the renderer for one fenced block.
 *
 * Kept apart from the renderer — and free of the registry, Motion, and Shiki — so
 * the extraction, which is the part that can silently lose a language or a line,
 * is testable on its own. `pre` arrives as `pre > code.language-<id> > "source"`;
 * the source is already a single string, because MDX parses a fence as literal
 * text and never as JSX.
 */
export interface Fence {
  /** The info string after the fence, lowercased by nothing: `tsx`, `bash`, `ts`. */
  language?: string;
  /** The source exactly as written, trailing newline included. */
  source: string;
}

/** MDX writes `className="language-tsx"`; a mapped `code` component might append more. */
const LANGUAGE_CLASS = /language-([\w+#.-]+)/;

/**
 * The header label for a fence. A shell fence is a terminal, not a language — the
 * reader is looking at a command to run, and "bash" would name the wrong thing.
 * Everything else is title-cased so `json` does not sit next to `TSX`.
 */
const TITLES: Record<string, string> = {
  bash: "Terminal",
  css: "CSS",
  diff: "Diff",
  html: "HTML",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  markdown: "Markdown",
  md: "Markdown",
  python: "Python",
  py: "Python",
  sh: "Terminal",
  shell: "Terminal",
  sql: "SQL",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Terminal",
};

export function fenceTitle(language?: string): string {
  if (!language) return "Code";
  return TITLES[language.toLowerCase()] ?? language;
}

/** A `code` element, or an element that at least carries the fence's language class. */
function isCode(element: ReactElement<{ className?: string }>): boolean {
  return element.type === "code" || LANGUAGE_CLASS.test(element.props.className ?? "");
}

function firstElement(node: ReactNode): ReactElement<{ className?: string; children?: ReactNode }> | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = firstElement(child);
      if (found) return found;
    }
    return null;
  }
  return isValidElement(node) ? (node as ReactElement<{ className?: string; children?: ReactNode }>) : null;
}

/** Every text node, in order. A highlighted or JSX-built `code` keeps its text. */
function readText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(readText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return readText(node.props.children);
  return "";
}

/**
 * Read a fence out of the children of `pre`.
 *
 * Returns `null` for a `pre` that is not a fence — hand-written JSX in an MDX body
 * wrapping something other than a `code` — and the caller renders it the way the
 * page always did. A `pre` whose child is the text itself is still a fence: MDX
 * always wraps, so that is a block written by hand and it should get the block's
 * chrome rather than a bare `pre`. An empty fence stays a fence, and renders empty.
 */
export function readFence(children: ReactNode): Fence | null {
  const element = firstElement(children);
  if (element && !isCode(element)) return null;

  const source = readText(element ? element.props.children : children);
  // Nothing to render at all: leave the element as the page always rendered it.
  if (!element && source === "") return null;

  const className = element?.props.className;
  const language = typeof className === "string" ? className.match(LANGUAGE_CLASS)?.[1] : undefined;

  return { language: language?.toLowerCase(), source };
}
