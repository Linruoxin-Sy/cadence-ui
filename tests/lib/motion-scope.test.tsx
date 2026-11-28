import { afterEach, describe, expect, it, vi } from "vitest";
import { withBatch } from "@/registry/cadence/lib/invalidation";
import { motionCssVersion, motionTokenCss, motionTokenEntries } from "@/registry/cadence/lib/motion";
import { defaultMotionScope, readMotionTokenScope } from "@/registry/cadence/lib/motion-scope";

/**
 * A token-scope publish used to read every scope's own chain, so a page with 113 scopes read the same
 * ancestors 113 times. The scope now reads through the same batch as the text hosts, which is only a saving
 * if a shared batch turns `scopes × chain depth` into `distinct nodes`. These tests pin that, and pin the
 * other half of the contract: a read taken without a batch still reads for itself.
 */

const declaration = (() => {
  const values = new Map<string, string>([["--motion-source-version", String(motionCssVersion)]]);
  for (const entry of motionTokenEntries()) values.set(entry.name, motionTokenCss(entry));
  return { getPropertyValue: (name: string) => values.get(name) ?? "" } as unknown as CSSStyleDeclaration;
})();

function chain() {
  const outer = document.createElement("div");
  const middle = document.createElement("div");
  const leaf = document.createElement("div");
  document.body.append(outer);
  outer.append(middle);
  middle.append(leaf);
  return { outer, middle, leaf, dispose: () => outer.remove() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shared token-scope reads", () => {
  it("reads each distinct chain node once for every scope in one batch", () => {
    const nodes = chain();
    const style = vi.spyOn(window, "getComputedStyle").mockReturnValue(declaration);
    style.mockClear();
    try {
      // The production path: a token publish opens one batch, the listeners take no argument, and each
      // scope's read joins the batch the publish opened.
      withBatch(window, () => {
        readMotionTokenScope(nodes.leaf, defaultMotionScope);
        readMotionTokenScope(nodes.middle, defaultMotionScope);
        readMotionTokenScope(nodes.outer, defaultMotionScope);
      });
      // leaf, middle, outer, body, html — five distinct nodes, not 5 + 4 + 3 reads.
      expect(style.mock.calls.length).toBe(5);
    } finally {
      nodes.dispose();
    }
  });

  it("keeps reading its own chain when no batch is open", () => {
    const nodes = chain();
    const style = vi.spyOn(window, "getComputedStyle").mockReturnValue(declaration);
    style.mockClear();
    try {
      readMotionTokenScope(nodes.leaf, defaultMotionScope);
      readMotionTokenScope(nodes.middle, defaultMotionScope);
      readMotionTokenScope(nodes.outer, defaultMotionScope);
      expect(style.mock.calls.length).toBe(12);
    } finally {
      nodes.dispose();
    }
  });
});
