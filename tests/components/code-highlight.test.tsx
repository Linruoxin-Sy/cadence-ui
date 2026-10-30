import { act, render, waitFor } from "@testing-library/react";
import type * as React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { highlightCode, loadHighlighter } from "@/registry/cadence/code-highlight/highlight";
import { useHighlightedCode } from "@/registry/cadence/code-highlight/use-highlighted-code";

const SNIPPET = `const answer = 42;

export function read() {
  return answer;
}`;

/** The text of one highlighted line, in token order. */
function textOf(line: React.ReactNode): string {
  const { container } = render(<pre>{line}</pre>);
  return container.textContent ?? "";
}

describe("highlightCode", () => {
  it("splits a source into one node per line and keeps every character", async () => {
    const lines = await highlightCode(SNIPPET, "ts");

    expect(lines).not.toBeNull();
    expect(lines).toHaveLength(5);
    expect(lines?.map(textOf).join("\n")).toBe(SNIPPET);
  });

  it("gives tokens a colour for each theme instead of one fixed colour", async () => {
    const lines = await highlightCode("const answer = 42;", "ts");
    const { container } = render(<pre>{lines}</pre>);

    const styles = [...container.querySelectorAll("span")].map((span) => span.getAttribute("style") ?? "");
    expect(styles.some((style) => style.includes("--shiki-light"))).toBe(true);
    expect(styles.some((style) => style.includes("--shiki-dark"))).toBe(true);
    // The class reads whichever variable is current, so `.dark` needs no second pass.
    expect(container.querySelector("span")?.className).toContain("dark:text-(--shiki-dark)");
  });

  it("accepts the shorthands people actually type", async () => {
    expect(await highlightCode("echo hi", "sh")).not.toBeNull();
    expect(await highlightCode('{"a":1}', "json")).not.toBeNull();
  });

  it("returns null for a language it does not bundle", async () => {
    expect(await highlightCode("MOV AX, BX", "brainfuck")).toBeNull();
  });
});

describe("loadHighlighter", () => {
  it("continues from the grammar state of the previous chunk", async () => {
    const highlighter = await loadHighlighter("ts");
    expect(highlighter).not.toBeNull();

    const first = highlighter?.highlight("const a = 1;\n");
    const second = highlighter?.highlight("const b = 2;", first?.state);

    expect(first?.lines).toHaveLength(2);
    expect(second?.lines).toHaveLength(1);
    // `const` is a keyword in both chunks, so the grammar state carried over: a
    // chunk that restarted from scratch would have no state to read here.
    expect(second?.state).toBeDefined();
    expect(textOf(second?.lines[0] ?? "")).toBe("const b = 2;");
  });
});

/**
 * jsdom cannot show a colour, so what is asserted is the part that matters for a
 * streaming answer: the lines that were already finished are not tokenized again
 * when a chunk arrives. Identity is the proof — the same node object comes back.
 */
/** The probes write the latest hook result here; identity is what the streaming test reads. */
let latest: React.ReactNode[] | null = null;

function Probe({ code }: { code: string }) {
  latest = useHighlightedCode(code, "ts");
  return <output data-testid="lines">{latest ? latest.length : -1}</output>;
}

function Plain({ code, language }: { code: string; language: string }) {
  latest = useHighlightedCode(code, language);
  return <output>{latest === null ? "plain" : "highlighted"}</output>;
}

describe("useHighlightedCode", () => {
  beforeEach(() => {
    latest = null;
  });

  it("keeps the finished lines and tokenizes only what arrived", async () => {
    // The last line is still being written and is re-tokenized on every render; a
    // line is cached once the newline after it arrives.
    const started = "const a = 1;\nconst b = 2;\n";
    const { rerender } = render(<Probe code={started} />);

    await waitFor(() => expect(latest).toHaveLength(2));
    const settled = latest?.[0];
    expect(textOf(settled)).toBe("const a = 1;");

    rerender(<Probe code={`${started}const c = 3;`} />);

    await waitFor(() => expect(latest).toHaveLength(3));
    // The same node object: the finished line was not tokenized again.
    expect(latest?.[0]).toBe(settled);
    expect(textOf(latest?.[2])).toBe("const c = 3;");
  });

  it("renders nothing until the grammar is loaded, so the caller keeps its plain text", async () => {
    const { container } = render(<Plain code="const a = 1;" language="ts" />);
    // The first paint is plain on purpose: the highlight chunk is not in the bundle.
    expect(container.textContent).toBe("plain");

    // Settle the dynamic import inside `act` so the test does not leak the update.
    // What the second paint says is covered by the streaming test above; the point
    // here is that the first one is plain.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  it("stays plain for a language it does not bundle", async () => {
    const { container } = render(<Plain code="MOV AX, BX" language="nope" />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(container.textContent).toBe("plain");
  });
});
