// biome-ignore-all lint/a11y/noStaticElementInteractions: the root only tracks hover and focus to reveal a control that floats over the source; the region itself has nothing to activate, so it takes no role.
// biome-ignore-all lint/a11y/noNoninteractiveTabindex: the source is a scroll container; axe's scrollable-region-focusable rule requires it to be keyboard reachable.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { animate, type HTMLMotionProps, motion, useMotionValue } from "motion/react";
import * as React from "react";
import { Button } from "../button";
import { useHighlightedCode } from "../code-highlight/use-highlighted-code";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

/** How long the copy button shows its tick before returning to the copy glyph. */
const COPIED_RESET_MS = 2000;

/**
 * A native bar takes the OS palette, not the page's — a dark page on a light OS gets
 * a white bar down the code. `::-webkit-*` is only the Safari-17 fallback: Chromium
 * ignores it once `scrollbar-width` is set.
 */
const scrollBar = [
  "[scrollbar-width:thin]",
  "[scrollbar-color:color-mix(in_oklab,var(--muted-foreground)_30%,transparent)_transparent]",
  "[&::-webkit-scrollbar]:size-2.5",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30",
].join(" ");

/** The tab strip keeps its sideways scroll but not the bar: a 24px row would grow, and draw a second seam, only where it overflows. */
const scrollStrip = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const HOVER_QUERY = "(hover: hover)";

function subscribeHover(onChange: () => void) {
  const query = window.matchMedia(HOVER_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether the pointing device can hover at all. The floating actions are revealed
 * on hover and on focus, so on a touch screen — where neither exists — they have to
 * be visible from the start, or the copy button is unreachable.
 *
 * `useSyncExternalStore` rather than a render-time `matchMedia` read: the server
 * cannot answer, and answering inside render is a hydration mismatch on every
 * block. The server snapshot says `true` (assume a mouse), so a desktop reader
 * never sees the actions flash in; a touch device reveals them after hydration.
 */
function useCanHover(): boolean {
  return React.useSyncExternalStore(
    subscribeHover,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => true,
  );
}

/** `useLayoutEffect` warns on the server; the fallback keeps SSR quiet without a first-paint flash. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

interface CodeBlockContextValue {
  /** The id `CodeBlockExpandButton` points `aria-controls` at. Also prefixes every tab and panel id. */
  contentId: string;
  /** Set by `CodeBlock`; a fold only exists when this is a number. */
  maxLines?: number;
  /** The default language for the source; `CodeBlockContent` can override it. */
  language?: string;
  expanded: boolean;
  toggle: () => void;
  /** True when the content is taller than `maxLines`, and the toggle therefore does something. */
  overflowing: boolean;
  setOverflowing: (next: boolean) => void;
  /** The variant `CodeBlockTabs` currently shows. `undefined` when the block has no tabs. */
  tab?: string;
  setTab: (tab: string) => void;
}

const CodeBlockContext = React.createContext<CodeBlockContextValue | null>(null);

/**
 * Whether the actions sit in a header. Upstream decides this with a CSS child
 * selector (`[[data-slot=code-block]>&]`); a context says the same thing without
 * asking an element to inspect its parent, and lets the actions branch on it.
 */
const CodeBlockHeaderContext = React.createContext(false);

/** Numbering is decided by the content, and the gutter belongs to each line. */
const CodeBlockContentContext = React.createContext(false);

/**
 * Hover/focus reveal, kept in its own context so a pointer moving across the block
 * does not re-render the code itself — the content is the largest subtree here.
 */
const CodeBlockRevealContext = React.createContext(true);

/**
 * A value folded into something an `id` can hold: a tab value is a human word
 * (`pnpm`, `ts`, `@cadence/button`), and the id has to survive all of them.
 */
function idPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

/** The tab and panel parts are meaningless without the selection they share. */
function useCodeBlockPart(part: string): CodeBlockContextValue {
  const block = React.useContext(CodeBlockContext);
  if (!block) throw new Error(`${part} has to be rendered inside <CodeBlock>.`);
  return block;
}

/**
 * The three ids one variant needs. Built in one place because the tab, its panel
 * and the content inside it have to agree, and because a second panel sharing the
 * block's `contentId` would put the same `id` on two `pre` elements.
 */
function partIds(contentId: string, value: string) {
  const base = `${contentId}-${idPart(value)}`;
  return { tab: `${base}-tab`, panel: `${base}-panel`, content: `${base}-content` };
}

/**
 * The value of the block's first tab, read from its children.
 *
 * `defaultTab` is the way to choose; this exists so a block that forgets it is not
 * a block with every variant showing at once. The walk goes through the header and
 * any wrapper around the tab list, and stops at a panel, whose content is source
 * rather than a tab.
 *
 * A render-time read rather than an effect, on purpose: a static page is already in
 * the HTML before hydration, and selecting on mount would paint every variant for a
 * frame and then hide all but one.
 */
function firstTabValue(children: React.ReactNode): string | undefined {
  let found: string | undefined;

  const visit = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (found || !React.isValidElement<{ children?: React.ReactNode; value?: string }>(child)) return;
      if (child.type === CodeBlockTab) {
        if (child.props.value) found = child.props.value;
        return;
      }
      if (child.type === CodeBlockPanel) return;
      visit(child.props.children);
    });
  };

  visit(children);
  return found;
}

const codeBlockVariants = cva(
  "group/code-block relative flex w-full min-w-0 flex-col overflow-hidden rounded-lg text-sm has-[[data-slot=code-block-content]:focus-visible]:ring-3",
  {
    variants: {
      variant: {
        default:
          "border border-input text-foreground has-[[data-slot=code-block-content]:focus-visible]:border-ring has-[[data-slot=code-block-content]:focus-visible]:ring-ring/50 dark:bg-input/30",
        destructive:
          "border border-destructive/30 text-destructive has-[[data-slot=code-block-content]:focus-visible]:border-destructive/40 has-[[data-slot=code-block-content]:focus-visible]:ring-destructive/20 dark:border-destructive/40",
      },
      size: {
        default: "",
        sm: "text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface CodeBlockProps extends React.ComponentProps<"div">, VariantProps<typeof codeBlockVariants> {
  /**
   * Additive, not in upstream shadcn: fold the content to this many lines and let
   * `CodeBlockExpandButton` unfold it. Measured, so it follows wrapped lines and
   * whatever font size the page uses.
   */
  maxLines?: number;
  /** Controlled fold. Omit it and the block keeps its own state. */
  expanded?: boolean;
  /** Uncontrolled starting state. Closed by default, so a long file stays scannable. */
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /**
   * Additive: the language to highlight, for a string child. An alias (`ts`, `sh`,
   * `yml`) or one of the bundled names in `highlight.tsx`. Omitted, or unknown, the
   * source renders as plain text — which is what tool output wants.
   */
  language?: string;
  /**
   * Additive: the tab shown first. Only meaningful with `CodeBlockTabs` and
   * `CodeBlockPanel`; a block with neither is a single source and ignores it.
   */
  defaultTab?: string;
  /** Controlled tab. Omit it and the block keeps its own state. */
  tab?: string;
  onTabChange?: (tab: string) => void;
}

/**
 * A code surface: header, scrollable source, footer, and a copy button.
 *
 * Highlighting is deliberately not bundled. Upstream splits it into a Shiki hook so
 * a block that only shows tool output stays small; the same split holds here, and
 * the parts take any node — a plain string, the lines a highlighter returns, or
 * `CodeBlockLine`s for a diff.
 *
 * Motion contract:
 * - fold / unfold: the viewport's measured height, `geometry.resize`
 * - floating actions: fade in on hover and focus, `data.transition`
 * - copy tick and chevron: swap in place, `state.morph`
 * - tab indicator: one pill shared between tabs, `layout.shared`
 * - reduced: opacity and rotation stay, the height jumps (size is information),
 *   and the tab pill changes tabs without travelling
 * - none: every transition resolves to zero duration
 *
 * a11y: the block is a plain region; the source is focusable so a keyboard user can
 * scroll it, and the copy button announces its own result through a live region.
 */
function CodeBlock({
  className,
  variant = "default",
  size = "default",
  maxLines,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  language,
  defaultTab,
  tab,
  onTabChange,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  children,
  ...props
}: CodeBlockProps) {
  const cm = useCadenceMotion();
  const canHover = useCanHover();
  const contentId = React.useId();

  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
  const [uncontrolledTab, setUncontrolledTab] = React.useState(defaultTab);
  const [overflowing, setOverflowing] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const isExpanded = expanded ?? uncontrolledExpanded;
  const activeTab = tab ?? uncontrolledTab ?? firstTabValue(children);

  const toggle = React.useCallback(() => {
    const next = !isExpanded;
    if (expanded === undefined) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  }, [expanded, isExpanded, onExpandedChange]);

  const setTab = React.useCallback(
    (next: string) => {
      if (tab === undefined) setUncontrolledTab(next);
      onTabChange?.(next);
    },
    [onTabChange, tab],
  );

  const value = React.useMemo<CodeBlockContextValue>(
    () => ({
      contentId,
      maxLines,
      language,
      expanded: isExpanded,
      toggle,
      overflowing,
      setOverflowing,
      tab: activeTab,
      setTab,
    }),
    [activeTab, contentId, isExpanded, language, maxLines, overflowing, setTab, toggle],
  );

  // A pointer-driven reveal is meaningless without a pointer that hovers; those
  // devices get the actions permanently instead of a control they cannot summon.
  const revealed = !canHover || hovered || focused;

  return (
    <CodeBlockContext.Provider value={value}>
      <CodeBlockRevealContext.Provider value={revealed}>
        <div
          data-slot="code-block"
          data-variant={variant}
          data-size={size}
          data-motion={cm.mode}
          className={cn(codeBlockVariants({ variant, size }), className)}
          onPointerEnter={(event) => {
            setHovered(true);
            onPointerEnter?.(event);
          }}
          onPointerLeave={(event) => {
            setHovered(false);
            onPointerLeave?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            // Focus moving between two controls inside the block is not a blur of
            // the block: React bubbles `focusout`, so check where focus landed.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        >
          {children}
        </div>
      </CodeBlockRevealContext.Provider>
    </CodeBlockContext.Provider>
  );
}

export interface CodeBlockHeaderProps extends React.ComponentProps<"div"> {}

/**
 * The row above the source: a label on the start side, actions on the end side,
 * and a rule between the label and the code.
 *
 * The rule is a border on the header rather than a `Separator` part: the seam has
 * to span the block's full width, and the header is the only element that already
 * does — a `Separator` would have to be pulled out of the header's padding the way
 * `CodeBlockLine` is. The header is padded equally top and bottom, and the source's
 * top padding repeats the header's bottom one, so the label and the first line sit
 * the same distance from the rule and from the block's edges.
 */
function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps) {
  return (
    <CodeBlockHeaderContext.Provider value={true}>
      <div
        data-slot="code-block-header"
        className={cn(
          "flex min-w-0 shrink-0 items-center gap-2 border-b border-border px-4 py-3 text-muted-foreground group-data-[variant=destructive]/code-block:border-destructive/20 group-data-[variant=destructive]/code-block:text-destructive group-data-[size=sm]/code-block:px-3 group-data-[size=sm]/code-block:py-2",
          className,
        )}
        {...props}
      />
    </CodeBlockHeaderContext.Provider>
  );
}

export interface CodeBlockTitleProps extends React.ComponentProps<"div"> {}

/**
 * A filename or label. It truncates rather than wrapping, because the header is a
 * fixed-height row; wrap it in an anchor to make it a link to the file.
 *
 * It carries the selected tab's text style — `text-xs`, medium, foreground, on the
 * same 24px line box — so a block with a switcher and a block without one have the
 * same header. A title that set its own size made the two read as different
 * components: the label sat larger next to a row of tabs that were smaller. The
 * line box is the height, not the text: 12px type on its default 16px line would
 * make a titled header shorter than a tabbed one, and the two would step apart
 * again the moment they sat side by side.
 */
function CodeBlockTitle({ className, ...props }: CodeBlockTitleProps) {
  return (
    <div
      data-slot="code-block-title"
      className={cn(
        "min-w-0 truncate font-sans text-xs font-medium leading-6 text-foreground group-data-[variant=destructive]/code-block:text-destructive",
        "[&_svg]:pointer-events-none [&_svg]:me-1.5 [&_svg]:inline-block [&_svg]:align-middle [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

export interface CodeBlockTabsProps extends React.ComponentProps<"div"> {
  /** The tab list's accessible name. Override it when the tabs are not about a language. */
  label?: string;
}

/**
 * The switcher: one row of tabs over the source, for the cases where a snippet has
 * more than one right form — a language and its compiled output, a file and its
 * test, and most often an install command in three package managers.
 *
 * The selection lives on `CodeBlock`, not here, because the header's copy button
 * has to follow it: a switcher whose copy button still copies the first variant is
 * worse than no switcher at all.
 *
 * Motion contract:
 * - indicator: one `bg-muted` pill shared between tabs, `layout.shared`; it travels
 *   to the selected tab and is retargeted mid-flight if another is pressed
 * - reduced: the pill is per tab instead of shared, so it appears in place with no
 *   travel; `none` resolves the shared transition to zero duration
 *
 * a11y: a real `tablist` of `role="tab"` buttons with a roving `tabindex` — only the
 * selected tab is a tab stop, and Arrow keys / Home / End move between them, which
 * is the pattern a screen reader announces as tabs rather than as a radio group.
 */
function CodeBlockTabs({ className, label = "Language", children, onKeyDown, ...props }: CodeBlockTabsProps) {
  const block = useCodeBlockPart("CodeBlockTabs");
  const listRef = React.useRef<HTMLDivElement>(null);

  const move = (step: number | "first" | "last") => {
    const tabs = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    if (!tabs.length) return;
    const current = tabs.findIndex((tab) => tab.dataset.active !== undefined);
    const index =
      step === "first" ? 0 : step === "last" ? tabs.length - 1 : (current + step + tabs.length) % tabs.length;
    const next = tabs[index];
    if (!next?.dataset.value) return;
    block.setTab(next.dataset.value);
    next.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      data-slot="code-block-tabs"
      className={cn("flex min-w-0 items-center gap-0.5 overflow-x-auto", scrollStrip, className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;

        const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
        const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
        const edge = event.key === "Home" || event.key === "End";
        if (!forward && !backward && !edge) return;

        // A tab list is a single tab stop, so once one of its tabs has focus the
        // arrow keys move within the list — the ARIA tabs pattern, not a radio group.
        event.preventDefault();
        if (event.key === "Home") move("first");
        else if (event.key === "End") move("last");
        else move(forward ? 1 : -1);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CodeBlockTabProps extends React.ComponentProps<"button"> {
  /** What this tab selects. A `CodeBlockPanel` with the same value is the panel it shows. */
  value: string;
}

/**
 * One tab. The pill under it is the only animated part, and only the selected tab
 * renders one: Motion matches the two `layoutId`s and plays the travel between
 * them, so there is never a second pill to cross-fade.
 *
 * The label is on its own layer (`z-10`) while the pill stays at `auto`, and that is
 * load-bearing rather than decoration. The pill belongs to the tab being entered; when
 * that tab sits to the right of the one being left, its button comes later in the DOM,
 * so an unlayered pill paints over the previous tab's label and wipes it for the length
 * of the slide. Raising every label above every pill makes the travel symmetric: the
 * highlight moves underneath the words, whichever direction it is going.
 */
function CodeBlockTab({ value, className, children, onClick, ...props }: CodeBlockTabProps) {
  const cm = useCadenceMotion();
  const block = useCodeBlockPart("CodeBlockTab");
  const active = block.tab === value;
  const ids = partIds(block.contentId, value);

  return (
    <button
      type="button"
      role="tab"
      id={ids.tab}
      aria-selected={active}
      aria-controls={ids.panel}
      tabIndex={active ? 0 : -1}
      data-slot="code-block-tab"
      data-value={value}
      data-active={active || undefined}
      data-motion={cm.mode}
      className={cn(
        "relative inline-flex h-6 shrink-0 cursor-pointer items-center rounded-sm px-2 text-xs font-medium leading-6 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[active]:text-foreground",
        className,
      )}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        block.setTab(value);
      }}
    >
      {active ? (
        <motion.span
          aria-hidden="true"
          data-slot="code-block-tab-indicator"
          // A shared element is the travel; under reduced motion there is no travel
          // to keep, so the pill mounts where the selection landed.
          layoutId={cm.reduced ? undefined : `${block.contentId}-tab-indicator`}
          transition={cm.reduced ? { duration: 0 } : cm.transition("layout.shared")}
          className="absolute inset-0 rounded-sm bg-muted"
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface CodeBlockActionsProps extends React.ComponentProps<"div"> {}

/**
 * Holds the header's buttons. As a direct child of `CodeBlock` — no header — it
 * floats over the source's top-end corner and is revealed on hover or focus.
 */
function CodeBlockActions({ className, children, ...props }: CodeBlockActionsProps) {
  const cm = useCadenceMotion();
  const inHeader = React.useContext(CodeBlockHeaderContext);
  const revealed = React.useContext(CodeBlockRevealContext);

  if (inHeader) {
    return (
      <div
        data-slot="code-block-actions"
        className={cn("ms-auto flex shrink-0 items-center gap-1 -my-1 -me-1.5", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      data-slot="code-block-actions"
      data-motion={cm.mode}
      data-revealed={revealed || undefined}
      initial={false}
      animate={{ opacity: revealed ? 1 : 0 }}
      transition={cm.transition("data.transition")}
      className={cn(
        "absolute end-3 top-3 z-10 flex shrink-0 items-center gap-1 group-data-[size=sm]/code-block:end-2 group-data-[size=sm]/code-block:top-2",
        // A floating control needs its own surface, or it reads as part of the code.
        "[&_button]:bg-background [&_button]:ring-1 [&_button]:ring-foreground/10",
        // Invisible but still tabbable: focusing it reveals the row again.
        !revealed && "pointer-events-none",
        className,
      )}
      {...(props as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/** Exactly one source of truth: a single value, or one per tab. */
type CodeBlockCopyValue =
  | { value: string; values?: never }
  | {
      /** The text to copy, per tab value. The button copies the tab the block is showing. */
      values: Record<string, string>;
      value?: never;
    };

export type CodeBlockCopyButtonProps = Omit<React.ComponentProps<typeof Button>, "value"> & CodeBlockCopyValue;

/**
 * Copies the block's text and swaps its glyph to a tick. The two glyphs are stacked
 * rather than swapped in and out, so the state change cannot resize the button
 * mid-press.
 *
 * With `values`, it follows the block's tab — the reason the selection lives on
 * `CodeBlock` rather than on the tab list. A tab whose value is missing from the
 * map copies nothing rather than a neighbouring variant's text.
 *
 * The visible glyph is `aria-hidden`; the button's name carries the state
 * ("Copy" / "Copied") and a polite live region repeats it, so the tick is never the
 * only signal.
 */
function CodeBlockCopyButton({
  value,
  values,
  className,
  variant = "ghost",
  size = "icon-xs",
  onClick,
  children,
  ...props
}: CodeBlockCopyButtonProps) {
  const cm = useCadenceMotion();
  const block = React.useContext(CodeBlockContext);
  // The text that was copied, not a flag: a tick that survived a tab switch would
  // claim the variant the reader is now looking at was the one copied.
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const text = values ? (block?.tab ? (values[block.tab] ?? "") : (Object.values(values)[0] ?? "")) : (value ?? "");
  const copied = copiedText !== null && copiedText === text;

  React.useEffect(() => {
    if (copiedText === null) return;
    const timeout = window.setTimeout(() => setCopiedText(null), COPIED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [copiedText]);

  const swap = cm.transition("state.morph");
  const tickOnly = cm.reduced;

  return (
    <>
      <Button
        data-slot="code-block-copy-button"
        data-copied={copied || undefined}
        data-motion={cm.mode}
        variant={variant}
        size={size}
        aria-label={copied ? "Copied" : "Copy"}
        className={className}
        {...props}
        onClick={(event) => {
          onClick?.(event);
          // A clipboard write can be refused (permission, an insecure origin); the
          // glyph then stays on "copy" instead of claiming a success.
          void navigator.clipboard
            ?.writeText(text)
            .then(() => setCopiedText(text))
            .catch(() => {});
        }}
      >
        {children ?? (
          <span aria-hidden="true" className="grid place-items-center">
            <motion.span
              className="col-start-1 row-start-1 flex"
              initial={false}
              animate={{ opacity: copied ? 0 : 1, scale: copied && !tickOnly ? scale.in : 1 }}
              transition={swap}
            >
              <CopyIcon />
            </motion.span>
            <motion.span
              className="col-start-1 row-start-1 flex"
              initial={false}
              animate={{ opacity: copied ? 1 : 0, scale: copied || tickOnly ? 1 : scale.in }}
              transition={swap}
            >
              <CheckIcon />
            </motion.span>
          </span>
        )}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </>
  );
}

export interface CodeBlockContentProps extends React.ComponentProps<"pre"> {
  /** Wrap long lines instead of scrolling them. Use it for output, not for source. */
  wrap?: boolean;
  /** Number the lines. A string child is split for you. */
  lineNumbers?: boolean;
  /** The number of the first line, when numbering a snippet from the middle of a file. */
  startLine?: number;
  /** Override the block's `language` for this source — two files in one block, or a tab per file. */
  language?: string;
}

/**
 * The scrollable source. A string child renders as one text node, which is what
 * keeps a streaming block cheap; `CodeBlockLine` children are for diffs and
 * highlighted lines.
 *
 * With a `language` — from the block or from this part — the string is tokenized by
 * `useHighlightedCode` and rendered one line at a time. Highlighting and streaming
 * pull in opposite directions (a tokenizer wants the whole file, a stream has only
 * the first half), so the hook keeps the grammar state after the last finished line
 * and re-tokenizes only what arrived: the cost per chunk is one line, not the file.
 *
 * When `CodeBlock` is given `maxLines`, this is the part that folds: the viewport
 * around the `pre` takes a measured height, so the fold follows wrapped lines and
 * whatever font the page uses. The measurement lives in a `ResizeObserver` — a
 * layout read in render would be a synchronous reflow on every chunk of a stream.
 */
function CodeBlockContent({
  className,
  children,
  style,
  wrap = false,
  lineNumbers = false,
  startLine = 1,
  language: languageProp,
  id,
  ...props
}: CodeBlockContentProps) {
  const cm = useCadenceMotion();
  const block = React.useContext(CodeBlockContext);
  const preRef = React.useRef<HTMLPreElement>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const height = useMotionValue(0);
  const [measured, setMeasured] = React.useState(false);

  const maxLines = block?.maxLines;
  const language = languageProp ?? block?.language;
  // Called unconditionally: a hook cannot be hidden behind `typeof children ===
  // "string"`, and an empty source costs nothing (the hook returns `null` and never
  // loads a grammar for it).
  const highlighted = useHighlightedCode(typeof children === "string" ? children : "", language);
  const expanded = block?.expanded ?? true;
  const folded = maxLines !== undefined && !expanded;
  const setOverflowing = block?.setOverflowing;

  useIsomorphicLayoutEffect(() => {
    const pre = preRef.current;
    if (!pre || maxLines === undefined) return;

    const measure = () => {
      const styles = window.getComputedStyle(pre);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      const top = Number.parseFloat(styles.paddingTop);
      const full = pre.scrollHeight;
      // `lineHeight` is the computed pixel value, so a page that changes
      // `leading-*` or the font size moves the fold with it. The bottom padding is
      // deliberately not part of the fold: the source continues below the cut, and
      // including it shows the top of the next line instead of ending on a line
      // boundary. `floor` keeps a fractional line height from spilling the same way.
      const foldedHeight = Number.isFinite(lineHeight) ? top + Math.floor(lineHeight * maxLines) : full;
      const target = Math.min(folded ? foldedHeight : full, full);

      setOverflowing?.(full - foldedHeight > 1);

      if (!measured) {
        // The first measurement is not a movement: paint the folded height and let
        // later toggles animate from it, or the block would unfold itself on load.
        // Motion applies a motion value on the next frame, so the first fold is
        // written to the node now — one frame at full height is a layout shift the
        // reader sees, and Motion overwrites the same property with the same number.
        height.jump(target);
        if (viewportRef.current) viewportRef.current.style.height = `${target}px`;
        setMeasured(true);
        return;
      }

      animate(height, target, cm.transition("geometry.resize"));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(pre);
    return () => observer.disconnect();
  }, [cm, folded, height, maxLines, measured, setOverflowing]);

  return (
    <motion.div
      ref={viewportRef}
      data-slot="code-block-viewport"
      data-motion={cm.mode}
      style={measured ? { height } : undefined}
      className="min-h-0 overflow-hidden"
    >
      <pre
        ref={preRef}
        data-slot="code-block-content"
        data-wrap={wrap || undefined}
        data-numbered={lineNumbers || undefined}
        id={id ?? block?.contentId}
        dir="ltr"
        tabIndex={0}
        style={{ counterReset: `line ${startLine - 1}`, ...style }}
        className={cn(
          "min-h-0 min-w-0 overflow-auto px-4 py-3 font-mono leading-relaxed text-start outline-none",
          scrollBar,
          "group-data-[size=sm]/code-block:px-3 group-data-[size=sm]/code-block:py-2",
          wrap && "whitespace-pre-wrap break-words",
          className,
        )}
        {...props}
      >
        <CodeBlockContentContext.Provider value={lineNumbers}>
          <code
            data-slot="code-block-code"
            className={cn(
              "block content-start",
              // `min-w-max` is what makes a non-wrapping block scroll instead of
              // squeezing; it is also what would stop `wrap` from wrapping, because
              // the code box would still be as wide as its longest line.
              wrap ? "min-w-0" : "min-w-max",
              lineNumbers && "grid grid-cols-[auto_1fr] gap-x-3",
            )}
          >
            {typeof children === "string" && (highlighted || lineNumbers)
              ? (highlighted ?? children.replace(/\n$/, "").split("\n")).map((line, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a line's identity *is* its position; a stream appends, it never reorders
                  <CodeBlockLine key={index}>{line}</CodeBlockLine>
                ))
              : children}
          </code>
        </CodeBlockContentContext.Provider>
      </pre>
    </motion.div>
  );
}

export interface CodeBlockPanelProps extends CodeBlockContentProps {
  /** Which tab shows this panel. A panel whose value is not selected is hidden, not unmounted. */
  value: string;
}

/**
 * One variant of the snippet, shown while its tab is selected. It renders the
 * source itself — the panel and the `role="tabpanel"` wrapper are the same element
 * a block without tabs would have had anyway — so a switched block keeps the copy
 * affordance, the focus ring, and the fold the plain content has.
 *
 * Every panel stays mounted, hidden with the `hidden` attribute: a tab switch is a
 * look at what is already there, and remounting would throw away the panel's
 * scroll position. `hidden` also takes the inactive panels out of the tab order, so
 * only the visible source is focusable. The height is the selected panel's; it is
 * not animated, because the size of the block is information.
 */
function CodeBlockPanel({ value, className, ...props }: CodeBlockPanelProps) {
  const block = useCodeBlockPart("CodeBlockPanel");
  const ids = partIds(block.contentId, value);
  // No tab at all means no switcher, and a panel is then just the source in its
  // `tabpanel` wrapper: hiding it would leave a block with nothing in it.
  const selected = block.tab === undefined || block.tab === value;

  return (
    <div
      role="tabpanel"
      id={ids.panel}
      aria-labelledby={ids.tab}
      hidden={!selected}
      data-slot="code-block-panel"
      className={cn("min-w-0", className)}
    >
      <CodeBlockContent id={ids.content} {...props} />
    </div>
  );
}

const codeBlockLineVariants = cva(
  "relative block -mx-4 px-4 after:absolute after:start-1 after:top-0 after:select-none after:text-muted-foreground group-data-[size=sm]/code-block:-mx-3 group-data-[size=sm]/code-block:px-3",
  {
    variants: {
      variant: {
        default: "",
        added: "bg-muted after:content-['+']",
        removed: "bg-destructive/10 after:text-destructive after:content-['−']",
        highlighted: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CodeBlockLineProps extends React.ComponentProps<"span">, VariantProps<typeof codeBlockLineVariants> {}

/**
 * One line of source. `added` and `removed` carry a `+` / `−` marker as well as a
 * tint, so a diff reads without colour; `highlighted` marks a line to call out. The
 * line is full-bleed inside the padded `pre`, which is why it pulls itself out by
 * the same padding it puts back.
 */
function CodeBlockLine({ className, variant = "default", children, ...props }: CodeBlockLineProps) {
  const numbered = React.useContext(CodeBlockContentContext);

  // An empty line still holds a newline, so copying a selection keeps blank lines.
  const empty =
    children === undefined || children === null || children === "" || (Array.isArray(children) && !children.length);

  return (
    <span
      data-slot="code-block-line"
      data-variant={variant}
      className={cn(
        codeBlockLineVariants({ variant }),
        numbered &&
          "col-span-2 grid grid-cols-subgrid [counter-increment:line] before:min-w-6 before:select-none before:text-end before:text-muted-foreground before:content-[counter(line)]",
        className,
      )}
      {...props}
    >
      <span data-slot="code-block-line-content" className="min-w-0">
        {empty ? "\n" : children}
      </span>
    </span>
  );
}

export interface CodeBlockFooterProps extends React.ComponentProps<"div"> {}

/**
 * The row below the source — where the fold toggle and secondary actions go. It
 * mirrors the header: a rule above it, and padding equal to the header's, so a
 * folded block has the same seam on both sides of the code.
 */
function CodeBlockFooter({ className, ...props }: CodeBlockFooterProps) {
  return (
    <div
      data-slot="code-block-footer"
      className={cn(
        "flex min-w-0 shrink-0 items-center gap-2 border-t border-border px-4 py-3 text-muted-foreground group-data-[variant=destructive]/code-block:border-destructive/20 group-data-[size=sm]/code-block:px-3 group-data-[size=sm]/code-block:py-2",
        className,
      )}
      {...props}
    />
  );
}

export interface CodeBlockExpandButtonProps extends React.ComponentProps<typeof Button> {}

/**
 * Unfolds a block that `CodeBlock` capped with `maxLines`. Renders nothing when the
 * content fits — a "Show all" that shows nothing new is worse than no control.
 *
 * The label swaps and the chevron turns once, on `state.morph`; under reduced
 * motion the chevron flips without travelling, because which way it points is the
 * state, not the decoration.
 */
function CodeBlockExpandButton({ className, children, onClick, ...props }: CodeBlockExpandButtonProps) {
  const cm = useCadenceMotion();
  const block = React.useContext(CodeBlockContext);

  if (!block || block.maxLines === undefined || !block.overflowing) return null;

  const { expanded, toggle, contentId, tab } = block;

  // In a tabbed block each variant owns its own `pre`, so the control names the
  // panel that is showing rather than a source id only one variant could carry.
  const controls = tab ? partIds(contentId, tab).panel : contentId;

  return (
    <Button
      type="button"
      data-slot="code-block-expand-button"
      data-motion={cm.mode}
      variant="ghost"
      size="xs"
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn("gap-1 text-muted-foreground", className)}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        toggle();
      }}
    >
      {children ?? (expanded ? "Show less" : "Show all")}
      <motion.span
        aria-hidden="true"
        className="flex"
        initial={false}
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={cm.reduced ? { duration: 0 } : cm.transition("state.morph")}
      >
        <ChevronDownIcon />
      </motion.span>
    </Button>
  );
}

export {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockExpandButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockPanel,
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTitle,
};
