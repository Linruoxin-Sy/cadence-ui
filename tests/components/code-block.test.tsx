import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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
} from "@/registry/cadence/code-block/code-block";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

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
    });
    return style;
  });
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(contentHeight);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CodeBlock", () => {
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

    // No `layoutId` means no shared-element travel: the pill is painted where the
    // selection landed, which is information; the journey is decoration.
    const pill = slot(container, "code-block-tab-indicator");
    expect(pill).toBeInTheDocument();
    expect(pill.style.transform).toBe("");
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
    for (const name of ["code-block", "code-block-tab", "code-block-viewport", "code-block-copy-button"]) {
      expect(slot(container, name)).toHaveAttribute("data-motion", mode);
    }
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
