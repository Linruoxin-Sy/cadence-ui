import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
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
} from "@/registry/cadence/code-block";
import { loadHighlighter } from "@/registry/cadence/code-highlight/highlight";
import { documentPresentation } from "@/registry/cadence/lib/motion-presence";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2MotionInsertion, prepareV2MotionPlan } from "../motion-v2-contract";

const SOURCE = `export function read() {
  return 1;
}`;

function slot(container: HTMLElement, name: string) {
  const element = container.querySelector(`[data-slot="${name}"]`);
  if (!element) throw new Error(`${name} was not rendered`);
  return element as HTMLElement;
}

/**
 * jsdom has no layout, so the fold's measurement is stubbed: 20px lines, 16px of
 * padding, and a content height of 400px. The computed style is a real one with
 * three properties shadowed, because the accessibility-name helpers read the same
 * object through `getPropertyValue`.
 */
function stubMeasurement(contentHeight = 400) {
  const compute = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
    const style = Object.create(compute(element, pseudo)) as CSSStyleDeclaration;
    Object.defineProperties(style, {
      lineHeight: { value: "20px" },
      paddingTop: { value: "16px" },
      paddingBottom: { value: "16px" },
      ...(element.tagName === "PRE"
        ? {
            height: { value: `${contentHeight}px` },
            boxSizing: { value: "border-box" },
            borderTopWidth: { value: "0px" },
            borderBottomWidth: { value: "0px" },
          }
        : {}),
    });
    return style;
  });
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(contentHeight);
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([new DOMRect()] as unknown as DOMRectList);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CodeBlock", () => {
  it.each(["full", "reduced", "none"] as const)("defers a hidden tab's first fold measurement: %s", (mode) => {
    stubMeasurement();
    let visible = false;
    let resize: ResizeObserverCallback | undefined;
    vi.mocked(HTMLElement.prototype.getClientRects).mockImplementation(() =>
      visible ? ([new DOMRect()] as unknown as DOMRectList) : ([] as unknown as DOMRectList),
    );
    vi.spyOn(globalThis, "ResizeObserver").mockImplementation((callback: ResizeObserverCallback) => {
      resize = callback;
      return { observe() {}, unobserve() {}, disconnect() {} };
    });
    const { container } = render(
      <CadenceProvider mode={mode}>
        <CodeBlock maxLines={2}>
          <CodeBlockContent>{SOURCE}</CodeBlockContent>
        </CodeBlock>
      </CadenceProvider>,
    );
    const viewport = slot(container, "code-block-viewport");
    expect(viewport.style.height).toBe("");
    visible = true;
    act(() => resize?.([], {} as ResizeObserver));
    expect(viewport.style.height).toBe("56px");
    expectMotionContract(mode, {
      behavior: () => {
        expect(viewport.style.height).toBe("56px");
        expect(viewport.getAnimations?.() ?? []).toHaveLength(0);
      },
    });
  });

  beforeAll(async () => {
    // This suite tests rendering, not cold module/grammar throughput. Await real
    // readiness before starting Testing Library's DOM-update clock. Cold loading,
    // delayed fallback and cancellation have separate real-engine lifecycle tests.
    expect(await loadHighlighter("ts")).not.toBeNull();
  });

  it.each(["full", "reduced", "none"] as const)(
    "reserves the initial SSR fold without hiding no-JS source: %s",
    (mode) => {
      const tree = (
        <CadenceProvider mode={mode}>
          <CodeBlock maxLines={2}>
            <CodeBlockContent>{SOURCE}</CodeBlockContent>
          </CodeBlock>
        </CadenceProvider>
      );
      const html = renderToStaticMarkup(tree);
      expect(html).toContain("--code-block-max-lines:2");
      expect(html).toContain("scripting:enabled");
      expect(html).toContain("--leading-relaxed");
      expect(html).toContain("return 1;");
      const expanded = renderToStaticMarkup(
        <CadenceProvider mode={mode}>
          <CodeBlock maxLines={2} defaultExpanded>
            <CodeBlockContent>{SOURCE}</CodeBlockContent>
          </CodeBlock>
        </CadenceProvider>,
      );
      expect(expanded).not.toContain("--code-block-max-lines:");
      const { container } = render(tree);
      expectMotionContract(mode, {
        behavior: () => {
          expect(slot(container, "code-block-viewport").style.height).toBe("");
          expect(slot(container, "code-block-content")).toHaveTextContent("return 1;");
        },
      });
    },
  );

  it("renders the upstream surface with every slot", () => {
    const { container } = render(
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTitle>route.ts</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={SOURCE} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter>footer</CodeBlockFooter>
      </CodeBlock>,
    );

    expect(slot(container, "code-block")).toHaveAttribute("data-variant", "default");
    expect(slot(container, "code-block")).toHaveAttribute("data-size", "default");
    expect(slot(container, "code-block-header")).toBeInTheDocument();
    expect(slot(container, "code-block-title")).toHaveTextContent("route.ts");
    expect(slot(container, "code-block-actions")).toBeInTheDocument();
    expect(slot(container, "code-block-content").tagName).toBe("PRE");
    expect(slot(container, "code-block-code").tagName).toBe("CODE");
    expect(slot(container, "code-block-footer")).toHaveTextContent("footer");
  });

  it("numbers a string child and keeps the code left to right", () => {
    const { container } = render(
      <CodeBlock>
        <CodeBlockContent lineNumbers startLine={42}>
          {SOURCE}
        </CodeBlockContent>
      </CodeBlock>,
    );

    const content = slot(container, "code-block-content");
    expect(content).toHaveAttribute("data-numbered", "true");
    expect(content).toHaveAttribute("dir", "ltr");
    expect(content.style.counterReset).toBe("line 41");
    expect(container.querySelectorAll('[data-slot="code-block-line"]')).toHaveLength(3);
  });

  it("highlights a string source once it is given a language", async () => {
    const { container } = render(
      <CodeBlock language="ts">
        <CodeBlockContent>{SOURCE}</CodeBlockContent>
      </CodeBlock>,
    );

    await waitFor(() =>
      expect(container.querySelector('[data-slot="code-block-code"] span[style*="--shiki-light"]')).not.toBeNull(),
    );

    const lines = [...container.querySelectorAll('[data-slot="code-block-line"]')];
    expect(lines).toHaveLength(3);
    expect(lines.map((line) => line.textContent).join("\n")).toBe(SOURCE);
  });

  it("leaves the source as one text node when no language is given", () => {
    const { container } = render(<CodeBlockContent>{SOURCE}</CodeBlockContent>);

    // Output, not source: no tokenizer, no per-line tree — one node to append to
    // while a stream arrives.
    expect(container.querySelector('[data-slot="code-block-code"]')?.childElementCount).toBe(0);
  });

  it("keeps a blank line in the copyable text", () => {
    const { container } = render(
      <CodeBlockContent>
        <CodeBlockLine>a</CodeBlockLine>
        <CodeBlockLine />
        <CodeBlockLine>b</CodeBlockLine>
      </CodeBlockContent>,
    );

    const lines = container.querySelectorAll('[data-slot="code-block-line"]');
    expect(lines[1]?.textContent).toBe("\n");
  });

  it("marks diff lines with a variant, not only a tint", () => {
    const { container } = render(
      <CodeBlockContent>
        <CodeBlockLine variant="added">+ one</CodeBlockLine>
        <CodeBlockLine variant="removed">- two</CodeBlockLine>
      </CodeBlockContent>,
    );

    const lines = container.querySelectorAll('[data-slot="code-block-line"]');
    expect(lines[0]).toHaveAttribute("data-variant", "added");
    expect(lines[1]?.getAttribute("data-variant")).toBe("removed");
  });

  it("copies its value and announces the result", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    const { container } = render(
      <CodeBlock>
        <CodeBlockActions>
          <CodeBlockCopyButton value={SOURCE} />
        </CodeBlockActions>
        <CodeBlockContent>{SOURCE}</CodeBlockContent>
      </CodeBlock>,
    );

    const button = screen.getByRole("button", { name: "Copy" });
    expect(button).toHaveAttribute("data-slot", "code-block-copy-button");

    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledWith(SOURCE);
    expect(button).toHaveAttribute("aria-label", "Copied");
    expect(button).toHaveAttribute("data-copied", "true");
    expect(within(container).getByText("Copied")).toHaveAttribute("aria-live", "polite");

    vi.unstubAllGlobals();
  });

  it("does not claim a copy the browser refused", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(<CodeBlockCopyButton value={SOURCE} />);
    const button = screen.getByRole("button", { name: "Copy" });

    await userEvent.click(button);

    expect(writeText).toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-label", "Copy");
    expect(button).not.toHaveAttribute("data-copied");

    vi.unstubAllGlobals();
  });

  it("switches variants with a tab list that follows the tabs pattern", async () => {
    const { container } = render(
      <CodeBlock defaultTab="pnpm">
        <CodeBlockHeader>
          <CodeBlockTabs label="Package manager">
            <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
            <CodeBlockTab value="npm">npm</CodeBlockTab>
          </CodeBlockTabs>
        </CodeBlockHeader>
        <CodeBlockPanel value="pnpm">pnpm dlx shadcn@latest add @cadence/button</CodeBlockPanel>
        <CodeBlockPanel value="npm">npx shadcn@latest add @cadence/button</CodeBlockPanel>
      </CodeBlock>,
    );

    const list = screen.getByRole("tablist", { name: "Package manager" });
    const pnpm = within(list).getByRole("tab", { name: "pnpm" });
    const npm = within(list).getByRole("tab", { name: "npm" });

    expect(pnpm).toHaveAttribute("aria-selected", "true");
    // One tab stop for the whole list: the unselected tab is not a stop of its own.
    expect(pnpm).toHaveAttribute("tabindex", "0");
    expect(npm).toHaveAttribute("tabindex", "-1");

    const shown = screen.getByRole("tabpanel");
    expect(shown).toHaveTextContent("pnpm dlx");
    expect(pnpm).toHaveAttribute("aria-controls", shown.id);
    expect(shown).toHaveAttribute("aria-labelledby", pnpm.id);

    await userEvent.click(npm);

    expect(npm).toHaveAttribute("aria-selected", "true");
    expect(pnpm).toHaveAttribute("aria-selected", "false");

    // Both panels stay in the tree; the unselected one is hidden, which is also what
    // takes its focusable source out of the tab order.
    const panels = [...container.querySelectorAll('[data-slot="code-block-panel"]')];
    expect(panels).toHaveLength(2);
    expect(panels[0]).toHaveAttribute("hidden");
    expect(panels[1]).not.toHaveAttribute("hidden");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("npx shadcn@latest");
  });

  it("selects the first tab when the block was given no defaultTab", () => {
    const { container } = render(
      <CodeBlock>
        <CodeBlockHeader>
          <CodeBlockTabs>
            <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
            <CodeBlockTab value="npm">npm</CodeBlockTab>
          </CodeBlockTabs>
        </CodeBlockHeader>
        <CodeBlockPanel value="pnpm">pnpm add</CodeBlockPanel>
        <CodeBlockPanel value="npm">npm i</CodeBlockPanel>
      </CodeBlock>,
    );

    expect(screen.getByRole("tab", { name: "pnpm" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("pnpm add");

    // Each variant's source needs its own id: three panels sharing the block's
    // `contentId` would put the same id on three `pre` elements.
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("moves between tabs with the arrow keys and Home/End", async () => {
    render(
      <CodeBlock defaultTab="pnpm">
        <CodeBlockTabs label="Package manager">
          <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
          <CodeBlockTab value="npm">npm</CodeBlockTab>
          <CodeBlockTab value="yarn">yarn</CodeBlockTab>
        </CodeBlockTabs>
        <CodeBlockPanel value="pnpm">pnpm</CodeBlockPanel>
        <CodeBlockPanel value="npm">npm</CodeBlockPanel>
        <CodeBlockPanel value="yarn">yarn</CodeBlockPanel>
      </CodeBlock>,
    );

    const pnpm = screen.getByRole("tab", { name: "pnpm" });
    // The selected tab is the list's only tab stop, so one Tab lands on it.
    await userEvent.tab();
    expect(pnpm).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "npm" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "npm" })).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(pnpm).toHaveAttribute("aria-selected", "true");

    // Wrapping is part of the pattern: one step back from the first tab is the last.
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "yarn" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{Home}");
    expect(pnpm).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "yarn" })).toHaveAttribute("aria-selected", "true");
  });

  it("copies the variant the reader is looking at", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(
      <CodeBlock defaultTab="pnpm">
        <CodeBlockHeader>
          <CodeBlockTabs>
            <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
            <CodeBlockTab value="npm">npm</CodeBlockTab>
          </CodeBlockTabs>
          <CodeBlockActions>
            <CodeBlockCopyButton values={{ pnpm: "pnpm add", npm: "npm i" }} />
          </CodeBlockActions>
        </CodeBlockHeader>
        <CodeBlockPanel value="pnpm">pnpm add</CodeBlockPanel>
        <CodeBlockPanel value="npm">npm i</CodeBlockPanel>
      </CodeBlock>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenLastCalledWith("pnpm add");

    await userEvent.click(screen.getByRole("tab", { name: "npm" }));
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenLastCalledWith("npm i");
    vi.unstubAllGlobals();
  });

  it("does not animate the tab pill's travel under reduced motion", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <CodeBlock defaultTab="pnpm">
          <CodeBlockTabs>
            <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
            <CodeBlockTab value="npm">npm</CodeBlockTab>
          </CodeBlockTabs>
          <CodeBlockPanel value="pnpm">pnpm</CodeBlockPanel>
          <CodeBlockPanel value="npm">npm</CodeBlockPanel>
        </CodeBlock>
      </CadenceProvider>,
    );

    // No shared-element travel under reduced motion: the one persistent marker is
    // committed straight to the selected tab's rectangle, which is information.
    // The journey between tabs is decoration.
    const pill = slot(container, "code-block-tab-indicator");
    expect(pill).toBeInTheDocument();
    expect(pill.getAnimations?.() ?? []).toHaveLength(0);
  });

  it("folds to maxLines and reports the state on the toggle", async () => {
    stubMeasurement();

    const { container } = render(
      <CodeBlock maxLines={5}>
        <CodeBlockContent lineNumbers>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter>
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>,
    );

    // 5 lines × 20px plus the 16px top padding; the bottom padding is not part of
    // the fold, so the cut lands on a line boundary instead of mid-line.
    expect(slot(container, "code-block-viewport").style.height).toBe("116px");

    const toggle = screen.getByRole("button", { name: "Show all" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", slot(container, "code-block-content").id);

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Show less");
  });

  it("hides the fold toggle when the content already fits", () => {
    stubMeasurement(72);

    render(
      <CodeBlock maxLines={5}>
        <CodeBlockContent>{SOURCE}</CodeBlockContent>
        <CodeBlockFooter>
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>,
    );

    expect(screen.queryByRole("button", { name: /Show (all|less)/ })).not.toBeInTheDocument();
  });

  it("leaves the source focusable so it can be scrolled by keyboard", () => {
    const { container } = render(<CodeBlockContent>{SOURCE}</CodeBlockContent>);

    expect(slot(container, "code-block-content")).toHaveAttribute("tabindex", "0");
  });

  it("paints the source's scrollbar from theme tokens, not the OS palette", () => {
    const { container } = render(<CodeBlockContent>{SOURCE}</CodeBlockContent>);
    const className = slot(container, "code-block-content").className;

    // A native bar follows the operating system, so a dark page on a light system
    // gets a white bar down the code. Both the width and the colour have to come
    // from the theme for the two to agree.
    expect(className).toContain("scrollbar-width:thin");
    expect(className).toContain("var(--muted-foreground)");
  });

  it.each(["full", "reduced", "none"] as const)("carries data-motion=%s on every animated part", (mode) => {
    const { container } = render(
      <CadenceProvider mode={mode}>
        <CodeBlock maxLines={3} defaultTab="pnpm">
          <CodeBlockHeader>
            <CodeBlockTabs>
              <CodeBlockTab value="pnpm">pnpm</CodeBlockTab>
              <CodeBlockTab value="npm">npm</CodeBlockTab>
            </CodeBlockTabs>
            <CodeBlockActions>
              <CodeBlockCopyButton value={SOURCE} />
            </CodeBlockActions>
          </CodeBlockHeader>
          <CodeBlockPanel value="pnpm">{SOURCE}</CodeBlockPanel>
          <CodeBlockPanel value="npm">{SOURCE}</CodeBlockPanel>
        </CodeBlock>
      </CadenceProvider>,
    );

    // The header's actions do not move — only the floating row fades — so the tab
    // and the copy button are the animated parts a tabbed block adds.
    expectMotionContract(mode, {
      instantImperative: true,
      parts: ["code-block", "code-block-tab", "code-block-viewport", "code-block-copy-button"].map((name) =>
        slot(container, name),
      ),
    });
  });

  it("announces clipboard rejection and supports retry", async () => {
    const writeText = vi.fn().mockRejectedValueOnce(new Error("denied")).mockResolvedValueOnce(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });
    render(
      <CadenceProvider mode="none">
        <CodeBlockCopyButton value={SOURCE} />
      </CadenceProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect(await screen.findByText("Copy failed. Select and copy manually.")).toHaveAttribute("aria-live", "polite");
    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument());
    expect(writeText).toHaveBeenLastCalledWith(SOURCE);
    vi.unstubAllGlobals();
  });

  it("keeps the copy state without the scale under reduced motion", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, clipboard: { writeText } });

    render(
      <CadenceProvider mode="reduced">
        <CodeBlockCopyButton value={SOURCE} />
      </CadenceProvider>,
    );

    const button = screen.getByRole("button", { name: "Copy" });
    await userEvent.click(button);

    // M5: the tick is information, the scale is decoration.
    expect(button).toHaveAttribute("aria-label", "Copied");
    const glyphs = button.querySelectorAll("span > span");
    for (const glyph of glyphs) {
      expect((glyph as HTMLElement).style.transform).not.toContain("scale(0.96)");
    }

    vi.unstubAllGlobals();
  });
});

/** jsdom has no layout: a stable box for every host and distinct tab rectangles
 * give the persistent marker a real destination to commit. */
function stubLayout() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const tall = this.dataset.slot === "code-block-content" || this.dataset.slot === "code-block-code";
    return {
      x: 0,
      y: 0,
      width: 640,
      height: tall ? 320 : 40,
      top: 0,
      left: 0,
      right: 640,
      bottom: tall ? 320 : 40,
      toJSON: () => "",
    } as DOMRect;
  });
  const offsets: Record<string, number> = { a: 0, b: 64, c: 128 };
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get(this: HTMLElement) {
      return offsets[this.getAttribute("data-value") ?? ""] ?? 0;
    },
  });
  for (const [name, value] of [
    ["offsetWidth", 64],
    ["offsetHeight", 24],
    ["offsetTop", 0],
  ] as const)
    Object.defineProperty(HTMLElement.prototype, name, {
      configurable: true,
      get() {
        return value;
      },
    });
}

/** Readable computed paint per owned token class, so a colour family commits its
 * endpoints instead of settling every host immediately. */
const v2Paint: Record<string, Record<string, string>> = {
  "bg-muted": { "background-color": "rgb(244, 244, 245)" },
  "bg-popover": { "background-color": "rgb(255, 255, 255)" },
  "text-foreground": { color: "rgb(9, 9, 11)" },
  "text-muted-foreground": { color: "rgb(113, 113, 122)" },
  "text-destructive": { color: "rgb(220, 38, 38)" },
};

function stubV2Paint() {
  const compute = window.getComputedStyle.bind(window);
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element) => {
    const host = element as HTMLElement;
    const css = compute(element);
    const tokens: Record<string, string> = {};
    for (const name of host.classList ?? []) Object.assign(tokens, v2Paint[name]);
    const read = (name: string, fallback = "") =>
      host.style?.getPropertyValue?.(name) || tokens[name] || css.getPropertyValue(name) || fallback;
    return {
      width: css.width,
      height: css.height,
      opacity: read("opacity") || "1",
      color: read("color"),
      backgroundColor: read("background-color"),
      transform: read("transform") || "none",
      display: css.display || "block",
      visibility: css.visibility || "visible",
      transitionProperty: read("transition-property") || "none",
      transitionDuration: read("transition-duration") || "0s",
      transitionDelay: read("transition-delay") || "0s",
      transitionTimingFunction: read("transition-timing-function") || "ease",
      animation: "",
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s",
      animationIterationCount: "1",
      getPropertyValue: (name: string) => read(name),
    } as unknown as CSSStyleDeclaration;
  });
}

function stubClipboard() {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn(async () => {}) },
  });
}

/**
 * jsdom has no Web Animations API. Presence adapters settle immediately without
 * it, so a test that certifies a real entrance supplies the minimal native
 * surface the adapter calls and lets the envelope stay in flight.
 */
function stubNativeAnimation() {
  const previous = HTMLElement.prototype.animate;
  const animate = vi.fn(function (this: HTMLElement, frames: Keyframe[]) {
    let reject: ((reason?: unknown) => void) | undefined;
    const finished = new Promise<void>((_, no) => {
      reject = no;
    });
    finished.catch(() => {});
    return {
      finished,
      playState: "running",
      effect: { getKeyframes: () => frames, getTiming: () => ({ duration: 100 }) },
      cancel() {
        reject?.(new Error("cancelled"));
      },
      finish() {},
    } as unknown as Animation;
  });
  HTMLElement.prototype.animate = animate as unknown as typeof HTMLElement.prototype.animate;
  return () => {
    HTMLElement.prototype.animate = previous;
  };
}

/** The floating actions only have a hidden resting state on a hovering device. */
function stubHoverCapable() {
  const previous = window.matchMedia;
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === "(hover: hover)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  })) as unknown as typeof window.matchMedia;
  return () => {
    window.matchMedia = previous;
  };
}

type V2Mode = "full" | "reduced" | "none";
const v2Modes = ["full", "reduced", "none"] as const;

/** One committed tab revision: the marker travels, the labels stay. */
function TabsScene({ mode }: { mode: V2Mode }) {
  const [tab, setTab] = useState("a");
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <CodeBlock tab={tab} onTabChange={setTab} defaultTab="a">
        <CodeBlockHeader>
          <CodeBlockTabs label="Variant">
            <CodeBlockTab value="a">First</CodeBlockTab>
            <CodeBlockTab value="b">Second</CodeBlockTab>
            <CodeBlockTab value="c">Third</CodeBlockTab>
          </CodeBlockTabs>
        </CodeBlockHeader>
        <CodeBlockPanel value="a">first source</CodeBlockPanel>
        <CodeBlockPanel value="b">second source</CodeBlockPanel>
        <CodeBlockPanel value="c">third source</CodeBlockPanel>
      </CodeBlock>
    </CadenceProvider>
  );
}

/** A capped block whose measured content owns the fold transition. */
function FoldScene({ mode }: { mode: V2Mode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <CodeBlock maxLines={2} expanded={expanded} onExpandedChange={setExpanded} defaultExpanded={false}>
        <CodeBlockContent>{"a\nb\nc\nd\ne"}</CodeBlockContent>
        <CodeBlockFooter>
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>
    </CadenceProvider>
  );
}

type LabelFrame = { title: string; tab: string; footer: string };
const labelFrame: LabelFrame = { title: "index.ts", tab: "TypeScript", footer: "12 lines" };

/** Four plain label hosts on one retained identity each; the fold toggle is native. */
function LabelsScene({ mode, frame }: { mode: V2Mode; frame: LabelFrame }) {
  const [open, setOpen] = useState(false);
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <CodeBlock maxLines={2} expanded={open} onExpandedChange={setOpen}>
        <CodeBlockHeader>
          <CodeBlockTitle>{frame.title}</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockTabs label="Variant">
          <CodeBlockTab value="a">{frame.tab}</CodeBlockTab>
        </CodeBlockTabs>
        <CodeBlockContent>{"const answer = 42;"}</CodeBlockContent>
        <CodeBlockFooter>{frame.footer}</CodeBlockFooter>
        <CodeBlockFooter>
          <CodeBlockExpandButton />
        </CodeBlockFooter>
      </CodeBlock>
    </CadenceProvider>
  );
}

/** A directly supplied quantity in the non-code Footer region. */
function QuantityScene({ mode, count }: { mode: V2Mode; count: number }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <CodeBlock>
        <CodeBlockFooter>{count}</CodeBlockFooter>
        <CodeBlockContent>const answer = 42;</CodeBlockContent>
      </CodeBlock>
    </CadenceProvider>
  );
}

type PaintFrame = { root: string; header: string; footer: string; tab: string };
const paintFrame: PaintFrame = {
  root: "text-muted-foreground",
  header: "text-muted-foreground",
  footer: "text-muted-foreground",
  tab: "text-muted-foreground",
};

/** Four colour regions, one class change per region, no second writer. */
function PaintScene({ mode, frame }: { mode: V2Mode; frame: PaintFrame }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <CodeBlock className={frame.root}>
        <CodeBlockHeader className={frame.header}>
          <CodeBlockTitle>index.ts</CodeBlockTitle>
        </CodeBlockHeader>
        <CodeBlockTabs label="Variant">
          <CodeBlockTab value="a" className={frame.tab}>
            First
          </CodeBlockTab>
        </CodeBlockTabs>
        <CodeBlockContent>
          <CodeBlockLine variant="added">+ added line</CodeBlockLine>
        </CodeBlockContent>
        <CodeBlockFooter className={frame.footer}>12 lines</CodeBlockFooter>
      </CodeBlock>
    </CadenceProvider>
  );
}

type ControlFrame = { label: string | number; present: boolean; paint: boolean };
const controlFrame: ControlFrame = { label: "Copy", present: true, paint: false };

/** A plain child hands the label, quantity, surface, press and retained exit to Button. */
function ControlScene({ mode, frame }: { mode: V2Mode; frame: ControlFrame }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <CodeBlock>
        <CodeBlockActions>
          <PresenceContext.Provider
            value={{
              id: "code-block-control",
              initial: false as const,
              isPresent: frame.present,
              register: () => () => {},
              onExitComplete: () => {},
            }}
          >
            <CodeBlockCopyButton
              value="const answer = 42;"
              className={frame.paint ? "bg-muted" : "bg-popover"}
              onClick={(event) => event.preventDefault()}
            >
              {frame.label}
            </CodeBlockCopyButton>
          </PresenceContext.Provider>
        </CodeBlockActions>
        <CodeBlockContent>const answer = 42;</CodeBlockContent>
      </CodeBlock>
    </CadenceProvider>
  );
}

describe("Code block v2 owners", () => {
  beforeEach(() => {
    stubLayout();
    stubV2Paint();
    stubClipboard();
  });
  afterEach(() => vi.restoreAllMocks());
  beforeAll(async () => {
    await prepareV2MotionPlan();
  });

  it.each(["full", "reduced", "none"] as const)("pops an independently inserted block in %s", async (mode) => {
    const stub = stubNativeAnimation();
    try {
      const view = render(
        <CadenceProvider mode={mode}>
          <div data-testid="scene" />
        </CadenceProvider>,
      );
      // A page that already painted presents its successors: only an independent
      // late insertion owns the entrance.
      documentPresentation(document).presented = true;
      await expectV2MotionInsertion("code-block", "code-block.root.enter", mode, () =>
        act(() => {
          view.rerender(
            <CadenceProvider mode={mode}>
              <CodeBlock>
                <CodeBlockContent>{"const answer = 42;\nconsole.log(answer);"}</CodeBlockContent>
              </CodeBlock>
            </CadenceProvider>,
          );
        }),
      );
      view.unmount();
    } finally {
      stub();
    }
  });

  it.each(["full", "reduced", "none"] as const)("reveals and hides the floating actions in %s", async (mode) => {
    const hover = stubHoverCapable();
    try {
      const view = render(
        <CadenceProvider mode={mode} timeScale={0}>
          <CodeBlock>
            <CodeBlockActions>
              <CodeBlockCopyButton value="const answer = 42;" />
            </CodeBlockActions>
            <CodeBlockContent>{"const answer = 42;\nconsole.log(answer);"}</CodeBlockContent>
          </CodeBlock>
        </CadenceProvider>,
      );
      const block = document.querySelector('[data-slot="code-block"]') as HTMLElement;
      await expectV2MotionAction("code-block", "code-block.actions.enter", mode, () =>
        act(() => {
          fireEvent.pointerEnter(block);
        }),
      );
      await expectV2MotionAction("code-block", "code-block.actions.exit", mode, () =>
        act(() => {
          fireEvent.pointerLeave(block);
        }),
      );
      view.unmount();
    } finally {
      hover();
    }
  });

  it.each(["full", "reduced", "none"] as const)(
    "morphs both copy glyphs and the expand chevron in %s",
    async (mode) => {
      stubMeasurement();
      const view = render(
        <CadenceProvider mode={mode} timeScale={0}>
          <CodeBlock maxLines={2}>
            <CodeBlockActions>
              <CodeBlockCopyButton value="const answer = 42;" />
              <CodeBlockExpandButton />
            </CodeBlockActions>
            <CodeBlockContent>{"const answer = 42;\nconsole.log(answer);\nreturn answer;"}</CodeBlockContent>
          </CodeBlock>
        </CadenceProvider>,
      );
      const copy = document.querySelector('[data-slot="code-block-copy-button"]') as HTMLButtonElement;
      await expectV2MotionAction("code-block", "code-block.copy.change", mode, () =>
        act(() => {
          fireEvent.click(copy);
        }),
      );
      const expand = document.querySelector('[data-slot="code-block-expand-button"]') as HTMLButtonElement;
      expect(expand).toBeTruthy();
      await expectV2MotionAction("code-block", "code-block.expand.change", mode, () =>
        act(() => {
          fireEvent.click(expand);
        }),
      );
      view.unmount();
    },
  );

  it.each(v2Modes)("moves one marker to the committed tab in %s", async (mode) => {
    const view = render(<TabsScene mode={mode} />);
    const second = document.querySelector('[data-value="b"]') as HTMLButtonElement;
    await expectV2MotionAction("code-block", "code-block.indicator.select", mode, () =>
      act(() => {
        fireEvent.click(second);
      }),
    );
    view.unmount();
  });

  it.each(v2Modes)("folds the measured viewport in %s", async (mode) => {
    stubMeasurement();
    const view = render(<FoldScene mode={mode} />);
    const expand = document.querySelector('[data-slot="code-block-expand-button"]') as HTMLButtonElement;
    expect(expand).toBeTruthy();
    await expectV2MotionAction(
      "code-block",
      "code-block.viewport.resize",
      mode,
      () =>
        act(() => {
          fireEvent.click(expand);
        }),
      { properties: ["height"] },
    );
    view.unmount();
  });

  it.each(v2Modes)("replaces owned plain labels in %s", async (mode) => {
    stubMeasurement();
    let frame = labelFrame;
    let view: ReturnType<typeof render>;
    const draw = () => <LabelsScene mode={mode} frame={frame} />;
    view = render(draw());
    const update = (next: Partial<LabelFrame>) =>
      act(() => {
        frame = { ...frame, ...next };
        view.rerender(draw());
      });
    await expectV2MotionAction("code-block", "code-block.title.change", mode, () => update({ title: "index.tsx" }));
    await expectV2MotionAction("code-block", "code-block.tab-label.change", mode, () =>
      update({ tab: "TypeScript React" }),
    );
    await expectV2MotionAction("code-block", "code-block.footer-label.change", mode, () =>
      update({ footer: "14 lines" }),
    );
    const expand = document.querySelector('[data-slot="code-block-expand-button"]') as HTMLButtonElement;
    expect(expand).toBeTruthy();
    await expectV2MotionAction("code-block", "code-block.expand-label.change", mode, () =>
      act(() => {
        fireEvent.click(expand);
      }),
    );
    view.unmount();
  });

  it.each(v2Modes)("rolls one Footer quantity in %s", async (mode) => {
    let count = 3;
    let view: ReturnType<typeof render>;
    const draw = () => <QuantityScene mode={mode} count={count} />;
    view = render(draw());
    await expectV2MotionAction("code-block", "code-block.value.change", mode, () =>
      act(() => {
        count = 9;
        view.rerender(draw());
      }),
    );
    view.unmount();
  });

  it.each(v2Modes)("owns each colour region without a second writer in %s", async (mode) => {
    let frame = paintFrame;
    let view: ReturnType<typeof render>;
    const draw = () => <PaintScene mode={mode} frame={frame} />;
    view = render(draw());
    const update = (next: Partial<PaintFrame>) =>
      act(() => {
        frame = { ...frame, ...next };
        view.rerender(draw());
      });
    await expectV2MotionAction("code-block", "code-block.surface.colour", mode, () =>
      update({ root: "text-foreground" }),
    );
    await expectV2MotionAction("code-block", "code-block.header.colour", mode, () =>
      update({ header: "text-foreground" }),
    );
    await expectV2MotionAction("code-block", "code-block.footer.colour", mode, () =>
      update({ footer: "text-foreground" }),
    );
    await expectV2MotionAction("code-block", "code-block.tab.colour", mode, () => update({ tab: "text-foreground" }));
    view.unmount();
  });

  it.each(v2Modes)("keeps Button's own owners inside a block composition in %s", async (mode) => {
    let frame = controlFrame;
    let view: ReturnType<typeof render>;
    const draw = () => <ControlScene mode={mode} frame={frame} />;
    view = render(draw());
    const update = (next: Partial<ControlFrame>) =>
      act(() => {
        frame = { ...frame, ...next };
        view.rerender(draw());
      });
    const button = document.querySelector('[data-slot="code-block-copy-button"]') as HTMLButtonElement;
    await expectV2MotionAction("code-block", "code-block.control-label.replace", mode, () =>
      update({ label: "Copy code" }),
    );
    update({ label: 7 });
    await expectV2MotionAction("code-block", "code-block.control-quantity.roll", mode, () => update({ label: 8 }));
    await expectV2MotionAction("code-block", "code-block.control-surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("code-block", "code-block.control.press", mode, () => {
      fireEvent.pointerDown(button.querySelector('[data-slot="button-feedback"]') ?? button, {
        button: 0,
        pointerId: 1,
        isPrimary: true,
      });
    });
    await expectV2MotionAction("code-block", "code-block.control-resize.resize", mode, () =>
      update({ label: "Copy the whole snippet" }),
    );
    await expectV2MotionAction("code-block", "code-block.control-exit.exit", mode, () => update({ present: false }));
    await expectV2MotionAction("code-block", "code-block.control-enter.enter", mode, () => update({ present: true }));
    view.unmount();
  });
});
