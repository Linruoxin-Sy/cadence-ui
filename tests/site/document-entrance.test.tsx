import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DocumentEntrance } from "@/components/site/document-entrance";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

describe("DocumentEntrance natural presentation", () => {
  for (const as of ["article", "section", "div"] as const)
    it.each(["full", "reduced", "none"] as const)(`${as} keeps %s server content readable`, (mode) => {
      const html = renderToString(
        <CadenceProvider mode={mode}>
          <DocumentEntrance as={as}>Readable</DocumentEntrance>
        </CadenceProvider>,
      );
      const root = document.createElement("div");
      root.innerHTML = html;
      const host = root.querySelector<HTMLElement>(`${as}[data-document-entrance]`);
      expect(host).not.toBeNull();
      expect(host?.dataset.motion).toBe(mode);
      for (const property of ["opacity", "filter", "clipPath", "transform"] as const)
        expect(host?.style[property]).toBe("");
      expect(host?.textContent).toBe("Readable");
    });

  it.each(["full", "reduced", "none"] as const)(
    "first CSR in %s stays natural and preserves native editor identity",
    (mode) => {
      const tree = (text: string) => (
        <StrictMode>
          <CadenceProvider mode={mode}>
            <DocumentEntrance as="article">
              <input aria-label="Draft" defaultValue="keep this" />
              <p>{text}</p>
            </DocumentEntrance>
          </CadenceProvider>
        </StrictMode>
      );
      const { container, rerender } = render(tree("First"));
      const article = container.querySelector("article"),
        input = container.querySelector("input");
      input?.focus();
      rerender(tree("Latest"));
      expect(container.querySelector("article")).toBe(article);
      expect(container.querySelector("input")).toBe(input);
      expect(input).toHaveFocus();
      expect(input?.value).toBe("keep this");
      expect(article?.style.opacity).toBe("");
      expect(article?.style.clipPath).toBe("");
    },
  );

  it("cancels only its handle on zero/ref replacement; old completion cannot clear a replacement", async () => {
    const handles: { cancel: ReturnType<typeof vi.fn>; resolve(): void }[] = [];
    const animate = vi.fn(() => {
      let resolve = () => {};
      const finished = new Promise<void>((done) => {
        resolve = done;
      });
      const handle = { cancel: vi.fn(), resolve, finished };
      handles.push(handle);
      return handle as unknown as Animation;
    });
    const original = HTMLElement.prototype.animate;
    HTMLElement.prototype.animate = animate;
    try {
      const tree = (show: boolean, as: "article" | "section" = "article", clock = 8) => (
        <CadenceProvider mode="full" timeScale={clock}>
          {show && (
            <DocumentEntrance as={as}>
              <input aria-label="Draft" />
            </DocumentEntrance>
          )}
        </CadenceProvider>
      );
      const { container, rerender, unmount } = render(tree(false));
      rerender(tree(true));
      expect(animate).toHaveBeenCalledOnce();
      const old = handles[0];
      if (!old) throw new Error("Missing native entrance handle");
      const node = container.querySelector("article");
      rerender(tree(true, "section"));
      expect(old.cancel).toHaveBeenCalledOnce();
      expect(node?.isConnected).toBe(false);
      const replacement = container.querySelector("section");
      await act(async () => {
        old.resolve();
        await Promise.resolve();
      });
      expect(container.querySelector("section")).toBe(replacement);
      expect(animate).toHaveBeenCalledOnce();
      replacement?.querySelector("input")?.focus();
      expect(replacement?.style.opacity).toBe("");
      rerender(tree(false));
      rerender(tree(true));
      const active = handles.at(-1);
      expect(animate).toHaveBeenCalledTimes(2);
      rerender(tree(true, "article", 0));
      expect(active?.cancel).toHaveBeenCalledOnce();
      unmount();
      expect(active?.cancel).toHaveBeenCalledOnce();
    } finally {
      HTMLElement.prototype.animate = original;
    }
  });
});
