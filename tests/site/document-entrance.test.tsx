import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DocumentEntrance } from "@/components/site/document-entrance";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { controlSamples } from "../motion-observer";

describe("DocumentEntrance server state", () => {
  for (const as of ["article", "section", "div"] as const) {
    it.each(["full", "reduced", "none"] as const)(`${as} renders the explicit %s initial state`, (mode) => {
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
      expect(host?.style.opacity).toBe(mode === "none" ? "1" : "0");
      expect(host?.style.filter).toBe(mode === "full" ? "blur(4px)" : "none");
      expect(host?.style.clipPath).toBe(mode === "full" ? "inset(0% 0% 100% 0%)" : "none");
    });
  }
});

import { act, render } from "@testing-library/react";

describe("DocumentEntrance intersection trigger", () => {
  it.each(["article", "section", "div"] as const)("observes the unclipped layout box around %s", (as) => {
    let deliver: IntersectionObserverCallback | undefined;
    const observe = vi.fn();
    const unobserve = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          deliver = callback;
        }
        observe = observe;
        unobserve = unobserve;
        disconnect = disconnect;
      },
    );
    try {
      const { container, rerender, unmount } = render(
        <CadenceProvider mode="full">
          <DocumentEntrance as={as} className="document-layout">
            <input aria-label="Draft" defaultValue="Keep me" />
          </DocumentEntrance>
        </CadenceProvider>,
      );
      const host = container.querySelector<HTMLElement>("[data-document-entrance]");
      const frame = container.querySelector<HTMLElement>("[data-document-entrance-frame]");
      const input = container.querySelector("input");
      expect(host?.tagName.toLowerCase()).toBe(as);
      expect(host).toHaveClass("document-layout");
      expect(frame).toBe(host?.parentElement);
      expect(frame?.style.clipPath).toBe("");
      expect(observe).toHaveBeenCalledWith(frame);
      expect(observe).not.toHaveBeenCalledWith(host);
      if (!frame) throw new Error("Missing entrance frame");
      const entry = (isIntersecting: boolean): IntersectionObserverEntry => ({
        target: frame,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: new DOMRect(),
        intersectionRect: new DOMRect(),
        rootBounds: null,
        time: 0,
      });
      act(() => deliver?.([entry(false)], {} as IntersectionObserver));
      expect([...controlSamples.values()].at(-1)?.target.opacity).toBe(0);
      act(() => deliver?.([entry(true)], {} as IntersectionObserver));
      expect([...controlSamples.values()].at(-1)?.target.opacity).toBe(1);
      expect(unobserve).toHaveBeenCalledWith(frame);
      input?.focus();
      rerender(
        <CadenceProvider mode="none">
          <DocumentEntrance as={as} className="document-layout">
            <input aria-label="Draft" defaultValue="Keep me" />
          </DocumentEntrance>
        </CadenceProvider>,
      );
      expect(container.querySelector("[data-document-entrance]")).toBe(host);
      expect(container.querySelector("input")).toBe(input);
      expect(input).toHaveFocus();
      expect([...controlSamples.values()].at(-1)?.target).toMatchObject({
        opacity: 1,
        filter: "none",
        clipPath: "none",
      });
      unmount();
      expect(disconnect).toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("DocumentEntrance hash destinations without an intersection delivery", () => {
  it.each(["full", "reduced", "none"] as const)("reveals a cold deep link in %s", (mode) => {
    window.history.replaceState(null, "", "#entrance-target");
    try {
      render(
        <CadenceProvider mode={mode}>
          <DocumentEntrance as="article">
            <h2 id="entrance-target">Example</h2>
          </DocumentEntrance>
        </CadenceProvider>,
      );
      const targets = [...controlSamples.values()].map((sample) => sample.target);
      expect(targets.some((target) => target.opacity === 1 && target.clipPath !== "inset(0% 0% 100% 0%)")).toBe(true);
    } finally {
      window.history.replaceState(null, "", window.location.pathname);
    }
  });

  it("ignores unrelated and malformed hashes, then responds to an in-document destination", () => {
    window.history.replaceState(null, "", "#outside");
    try {
      render(
        <DocumentEntrance as="article">
          <h2 id="entrance-target">Example</h2>
        </DocumentEntrance>,
      );
      const opacity = () => [...controlSamples.values()].at(-1)?.target.opacity;
      expect(opacity()).toBe(0);
      act(() => {
        window.history.replaceState(null, "", "#%bad");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(opacity()).toBe(0);
      act(() => {
        window.history.replaceState(null, "", "#entrance-target");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      });
      expect(opacity()).toBe(1);
    } finally {
      window.history.replaceState(null, "", window.location.pathname);
    }
  });
});
