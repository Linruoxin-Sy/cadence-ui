import { act, render, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeBlock, CodeBlockContent } from "@/registry/cadence/code-block";
import * as engine from "@/registry/cadence/code-highlight/highlight";
import { useHighlightedCode } from "@/registry/cadence/code-highlight/use-highlighted-code";

const realLoad = engine.loadHighlighter;
const SOURCE = "const answer = 42;";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function Probe({ language, code = SOURCE }: { language?: string; code?: string }) {
  const lines = useHighlightedCode(code, language);
  return <pre data-language={language}>{lines ?? code}</pre>;
}

function tokens(container: HTMLElement) {
  return container.querySelectorAll('span[style*="--shiki-light"]');
}

afterEach(() => vi.restoreAllMocks());

describe("real highlighter readiness and hook lifecycle", () => {
  it("reproduces the old 1s DOM deadline while a cold real loader is pending, then completes", async () => {
    // Only delivery is held. No substitute tokens, module or grammar: release
    // calls the actual cold Shiki core/themes/language and actual tokenizer.
    const gate = deferred();
    const requests: Promise<engine.Highlighter | null>[] = [];
    vi.spyOn(engine, "loadHighlighter").mockImplementation((language) => {
      const request = gate.promise.then(() => realLoad(language));
      requests.push(request);
      return request;
    });
    const { container } = render(
      <CodeBlock language="ts">
        <CodeBlockContent>{SOURCE}</CodeBlockContent>
      </CodeBlock>,
    );
    await vi.dynamicImportSettled();
    expect(requests).toHaveLength(1);
    expect(container.textContent).toBe(SOURCE);
    try {
      // The unchanged old assertion/deadline demonstrably rejects, even though
      // a valid load is in flight. This is not a product latency assertion.
      await expect(waitFor(() => expect(tokens(container).length).toBeGreaterThan(0))).rejects.toThrow();
      expect(container.textContent).toBe(SOURCE);
      expect(tokens(container)).toHaveLength(0);
    } finally {
      await act(async () => {
        gate.resolve();
        await Promise.all(requests);
      });
    }
    expect(tokens(container).length).toBeGreaterThan(0);
    expect(container.textContent).toBe(SOURCE);
  });

  it("loads concurrent new grammars and aliases with the real shared core and complete themed tokens", async () => {
    const highlighters = await Promise.all([realLoad("python"), realLoad("py"), realLoad("json")]);
    for (const highlighter of highlighters) {
      expect(highlighter).not.toBeNull();
      const { container, unmount } = render(<pre>{highlighter?.highlight(SOURCE).lines}</pre>);
      expect(container.textContent).toBe(SOURCE);
      expect(tokens(container).length).toBeGreaterThan(0);
      expect(container.querySelector('span[style*="--shiki-dark"]')).not.toBeNull();
      unmount();
    }
  });

  it("ignores stale language completion and uses the latest source after loading", async () => {
    const stale = deferred();
    const current = deferred();
    const requests: Promise<engine.Highlighter | null>[] = [];
    vi.spyOn(engine, "loadHighlighter").mockImplementation((language) => {
      const request = (language === "ts" ? stale : current).promise.then(() => realLoad(language));
      requests.push(request);
      return request;
    });
    const { container, rerender } = render(<Probe language="ts" />);
    await vi.dynamicImportSettled();
    rerender(<Probe language="json" code={'{"latest":42}'} />);
    await vi.dynamicImportSettled();
    expect(requests).toHaveLength(2);
    rerender(<Probe language="json" code={'{"latest":43}'} />);
    await act(async () => {
      current.resolve();
      await requests[1];
    });
    expect(tokens(container).length).toBeGreaterThan(0);
    expect(container.textContent).toBe('{"latest":43}');
    const markup = container.innerHTML;
    await act(async () => {
      stale.resolve();
      await requests[0];
    });
    expect(container.innerHTML).toBe(markup);
    rerender(<Probe code="plain again" />);
    expect(tokens(container)).toHaveLength(0);
    expect(container.textContent).toBe("plain again");
  });

  it("cancels StrictMode and unmounted consumers without poisoning the next mount", async () => {
    const gate = deferred();
    const requests: Promise<engine.Highlighter | null>[] = [];
    vi.spyOn(engine, "loadHighlighter").mockImplementation((language) => {
      const request = gate.promise.then(() => realLoad(language));
      requests.push(request);
      return request;
    });
    const first = render(
      <React.StrictMode>
        <Probe language="ts" />
      </React.StrictMode>,
    );
    await vi.dynamicImportSettled();
    expect(requests).toHaveLength(2);
    first.unmount();
    await act(async () => {
      gate.resolve();
      await Promise.all(requests);
    });
    expect(first.container).toBeEmptyDOMElement();
    const next = render(<Probe language="ts" />);
    await act(async () => {
      await vi.dynamicImportSettled();
      await Promise.all(requests);
    });
    expect(tokens(next.container).length).toBeGreaterThan(0);
    expect(next.container.textContent).toBe(SOURCE);
  });

  it("keeps complete plain text on rejection and supports the next valid language", async () => {
    // A failed delivery is injected only to exercise the catch branch; recovery
    // still runs the real engine. Unknown-language handling also remains real.
    vi.spyOn(engine, "loadHighlighter").mockImplementation((language) =>
      language === "broken" ? Promise.reject(new Error("chunk unavailable")) : realLoad(language),
    );
    const { container, rerender } = render(<Probe language="broken" />);
    await act(async () => {
      await vi.dynamicImportSettled();
    });
    expect(container.textContent).toBe(SOURCE);
    expect(tokens(container)).toHaveLength(0);
    rerender(<Probe language="unknown" />);
    await act(async () => {
      await vi.dynamicImportSettled();
    });
    expect(tokens(container)).toHaveLength(0);
    rerender(<Probe language="ts" />);
    await act(async () => {
      await vi.dynamicImportSettled();
      await realLoad("ts");
    });
    expect(tokens(container).length).toBeGreaterThan(0);
    expect(container.textContent).toBe(SOURCE);
  });
});
