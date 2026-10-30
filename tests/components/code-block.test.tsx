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
        <CodeBlock maxLines={3}>
          <CodeBlockActions>
            <CodeBlockCopyButton value={SOURCE} />
          </CodeBlockActions>
          <CodeBlockContent>{SOURCE}</CodeBlockContent>
        </CodeBlock>
      </CadenceProvider>,
    );

    for (const name of ["code-block", "code-block-actions", "code-block-viewport", "code-block-copy-button"]) {
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
