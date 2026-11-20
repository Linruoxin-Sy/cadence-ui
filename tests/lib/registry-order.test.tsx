import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  duplicateItemProblems,
  registryOrderProblems,
  reorderItemsText,
  sortRegistryItems,
} from "../../scripts/registry-order.mjs";

const live = readFileSync("registry.json", "utf8");
const liveRegistry = JSON.parse(live);

/** Reordering must not be a reformat: the diff of a merge resolution is the entries themselves. */
const lineMultiset = (text: string) => text.split("\n").sort();

describe("registry item order", () => {
  it("writes the committed file in registry id order", () => {
    expect(registryOrderProblems(liveRegistry.items)).toEqual([]);
    expect(duplicateItemProblems(liveRegistry.items)).toEqual([]);
    expect(sortRegistryItems(liveRegistry.items).map((item: { name: string }) => item.name)).toEqual(
      liveRegistry.items.map((item: { name: string }) => item.name),
    );
  });

  it("names the pair that breaks the order, and reports a repeated id", () => {
    const items = [{ name: "button" }, { name: "badge" }];
    expect(registryOrderProblems(items)).toEqual([expect.stringContaining('"badge" follows "button"')]);
    expect(duplicateItemProblems([{ name: "button" }, { name: "button" }])).toEqual([
      expect.stringContaining('duplicate item "button"'),
    ]);
  });

  it("moves whole entries and nothing else", () => {
    // The file is Biome-formatted; re-serialising it would expand every inline array.
    const ordered = sortRegistryItems(liveRegistry.items);
    const text = reorderItemsText(live, liveRegistry.items, ordered);
    expect(JSON.parse(text).items.map((item: { name: string }) => item.name)).toEqual(
      ordered.map((item: { name: string }) => item.name),
    );
    expect(lineMultiset(text)).toEqual(lineMultiset(live));
    // A rebuild on an already sorted file is a no-op, byte for byte.
    expect(reorderItemsText(text, ordered, ordered)).toBe(text);
    expect(reorderItemsText(live, liveRegistry.items, liveRegistry.items)).toBe(live);
  });

  it("refuses a file it cannot match to its parsed items", () => {
    expect(() => reorderItemsText("{}", [], [])).toThrow(/no top-level "items"/);
    expect(() => reorderItemsText(live, liveRegistry.items, [])).toThrow(/empty items array/);
  });
});
