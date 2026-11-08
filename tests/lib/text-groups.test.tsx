import { describe, expect, it } from "vitest";
import { changedTextGroups, createTextSnapshot, diffText } from "@/registry/cadence/lib/text-diff";

describe("changed-only word rhythm", () => {
  it("shares word-segment groups without adding retained letters", () => {
    const diff = diffText(createTextSnapshot("ab cd"), "abXY cdPQ");
    const incoming = diff.runs.flatMap((run) => run.incoming);
    const groups = changedTextGroups(diff.snapshot, incoming, true, "en");
    expect(incoming.map((unit) => unit.text)).toEqual(["X", "Y", "P", "Q"]);
    expect(incoming.map((unit) => groups?.get(unit.identity))).toEqual([0, 0, 1, 1]);
    expect(groups?.size).toBe(4);
    expect([...(changedTextGroups(diff.snapshot, incoming, false)?.values() ?? [])]).toEqual([0, 1, 2, 3]);
  });
  it("keeps segmentation failure immediate", () => {
    const snapshot = createTextSnapshot("abc");
    expect(changedTextGroups(snapshot, snapshot.units ?? [], true, "invalid_locale")).toBeNull();
    expect(changedTextGroups({ ...snapshot, units: null }, [], true)).toBeNull();
  });
});
