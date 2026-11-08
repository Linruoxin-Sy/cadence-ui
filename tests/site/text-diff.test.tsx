import { describe, expect, it, vi } from "vitest";
import { motionLimits } from "@/registry/cadence/lib/motion";
import {
  boundTextRevision,
  createTextSnapshot,
  diffText,
  shapeTextDiff,
  type TextDiff,
  type TextSnapshot,
} from "@/registry/cadence/lib/text-diff";

const texts = (snapshot: TextSnapshot) => snapshot.units?.map((item) => item.text).join("");
const changed = (diff: TextDiff) =>
  diff.runs.map((run) => [
    run.outgoing.map((item) => item.text).join(""),
    run.incoming.map((item) => item.text).join(""),
  ]);
const identities = (diff: TextDiff) =>
  new Set(diff.runs.flatMap((run) => [...run.outgoing, ...run.incoming].map((item) => item.identity)));

describe("pure bounded text identities", () => {
  it.each([
    ["Save", "Saved", [["", "d"]], [0, 1, 2, 3]],
    ["Send", "Sent", [["d", "t"]], [0, 1, 2]],
    ["aba", "aaba", [["", "a"]], [1, 2, 3]],
    [
      "aXbYc",
      "aPbQc",
      [
        ["X", "P"],
        ["Y", "Q"],
      ],
      [0, 2, 4],
    ],
    ["aaaa", "aaa", [["a", ""]], [0, 1, 2]],
    ["", "hello", [["", "hello"]], []],
    ["hello", "", [["hello", ""]], []],
    [
      "one\ntwo\nthree",
      "one\nTwo\nThree",
      [
        ["t", "T"],
        ["t", "T"],
      ],
      [0, 1, 2, 3, 5, 6, 7, 9, 10, 11, 12],
    ],
    ["a\tb", "a\t b", [["", " "]], [0, 1, 3]],
  ])("preserves only ordered unchanged units: %s → %s", (before, after, expected, retained) => {
    const previous = createTextSnapshot(before as string);
    const diff = diffText(previous, after as string);
    expect(diff.immediate).toBeNull();
    expect(changed(diff)).toEqual(expected);
    expect(texts(diff.snapshot)).toBe(after);
    expect(diff.snapshot.value).toBe(after);
    const surviving = diff.snapshot.units?.filter((item) => previous.units?.includes(item));
    expect(surviving).toEqual((retained as number[]).map((index) => diff.snapshot.units?.[index]));
    for (const run of diff.runs) {
      expect((before as string).slice(...run.before)).toBe(run.outgoing.map((item) => item.text).join(""));
      expect((after as string).slice(...run.after)).toBe(run.incoming.map((item) => item.text).join(""));
      expect(run.outgoing.every((item) => !diff.snapshot.units?.includes(item))).toBe(true);
    }
  });

  it("preserves the entire original aba suffix and uses fresh opaque inserted identity", () => {
    const previous = createTextSnapshot("aba");
    const diff = diffText(previous, "aaba");
    expect(diff.snapshot.units?.slice(1)).toEqual(previous.units);
    expect(diff.snapshot.units?.[0]?.identity).not.toBe(previous.units?.[0]?.identity);
    expect(diff.snapshot.units?.[0]?.identity).not.toBe(diff.snapshot.units?.[1]?.identity);
  });

  it("does not replay retained content across A→B→A, equal commits, or repeated append", () => {
    const first = createTextSnapshot("Send");
    const second = diffText(first, "Sent");
    const third = diffText(second.snapshot, "Send");
    expect(third.snapshot.units?.slice(0, 3)).toEqual(first.units?.slice(0, 3));
    expect(third.snapshot.units?.[3]?.identity).not.toBe(first.units?.[3]?.identity);
    expect(diffText(third.snapshot, "Send").snapshot).toBe(third.snapshot);
    expect(diffText(third.snapshot, "Send").runs).toEqual([]);
    const append = diffText(first, "Send a");
    const again = diffText(append.snapshot, "Send again");
    expect(append.path).toBe("append");
    expect(again.path).toBe("append");
    expect(again.comparisons).toBe(0);
    expect(again.snapshot.units?.slice(0, 6)).toEqual(append.snapshot.units);
    expect(changed(again)).toEqual([["", "gain"]]);
    expect(new Set(again.snapshot.units?.map((item) => item.identity)).size).toBe(10);
  });

  it.each([
    ["a👩🏽‍💻b", "a👨‍👩‍👧‍👦b", "👩🏽‍💻", "👨‍👩‍👧‍👦"],
    ["ae\u0301b", "ae\u0300b", "e\u0301", "e\u0300"],
    ["🇨🇳", "🇯🇵", "🇨🇳", "🇯🇵"],
    ["a\r\nb", "a\nb", "\r\n", "\n"],
  ])("keeps grapheme clusters intact: %s → %s", (before, after, outgoing, incoming) => {
    const diff = diffText(createTextSnapshot(before), after);
    expect(changed(diff)).toEqual([[outgoing, incoming]]);
    expect(diff.runs[0]?.outgoing).toHaveLength(1);
    expect(diff.runs[0]?.incoming).toHaveLength(1);
    expect(texts(diff.snapshot)).toBe(after);
  });

  it("enforces input bounds while iterating, including emoji and combining clusters", () => {
    for (const cluster of ["a", "e\u0301", "👩🏽‍💻"]) {
      const exact = createTextSnapshot(cluster.repeat(motionLimits.diffInput));
      expect(exact.units).toHaveLength(2048);
      const over = createTextSnapshot(cluster.repeat(motionLimits.diffInput + 1));
      expect(over.units).toBeNull();
      expect(over.unavailable).toBe("input");
      expect(over.value).toBe(cluster.repeat(2049));
    }
    const real = Intl.Segmenter;
    let reads = 0;
    vi.stubGlobal("Intl", {
      ...Intl,
      Segmenter: class {
        segment() {
          return {
            *[Symbol.iterator]() {
              for (let index = 0; index < 100000; index++) {
                reads++;
                yield { segment: "a" };
              }
            },
          };
        }
      },
    });
    try {
      expect(createTextSnapshot("oversized").unavailable).toBe("input");
      expect(reads).toBe(2049);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(Intl.Segmenter).toBe(real);
  });

  it("admits exactly 4096 middle comparisons, rejects larger tables before allocation/work", () => {
    // Common 62-unit middle survives; only the two ends change.
    const before = `X${"a".repeat(62)}Y`;
    const exact = diffText(createTextSnapshot(before), `P${"a".repeat(62)}Q`);
    expect(exact.comparisons).toBe(4096);
    expect(exact.immediate).toBeNull();
    expect(changed(exact)).toEqual([
      ["X", "P"],
      ["Y", "Q"],
    ]);
    const value = `P${"a".repeat(63)}Q`;
    const over = diffText(createTextSnapshot(`X${"a".repeat(63)}Y`), value);
    expect(over.comparisons).toBe(0);
    expect(over.immediate).toBe("comparisons");
    expect(over.runs).toEqual([]);
    expect(over.snapshot.value).toBe(value);
    expect(texts(over.snapshot)).toBe(value);
  });

  it("counts outgoing and incoming at 64 and never truncates overflow targets", () => {
    const previous = createTextSnapshot("a".repeat(32));
    const exact = diffText(previous, "b".repeat(32));
    expect(identities(exact).size).toBe(64);
    expect(exact.immediate).toBeNull();
    const over = diffText(previous, "b".repeat(33));
    expect(over.immediate).toBe("changed");
    expect(over.runs).toEqual([]);
    expect(texts(over.snapshot)).toBe("b".repeat(33));
    const oversized = diffText(previous, "b".repeat(2049));
    expect(oversized.immediate).toBe("input");
    expect(oversized.snapshot.value).toBe("b".repeat(2049));
    expect(oversized.runs).toEqual([]);
    const recovered = diffText(oversized.snapshot, "Save");
    expect(recovered.immediate).toBe("input");
    expect(diffText(recovered.snapshot, "Saved").immediate).toBeNull();
  });

  it("aggregates a known revision and still-active identities, without resetting capacity", () => {
    const a = diffText(createTextSnapshot("a".repeat(16)), "b".repeat(16));
    const b = diffText(createTextSnapshot("x".repeat(16)), "y".repeat(16));
    expect(boundTextRevision([a, b])).toEqual([a, b]);
    const active = identities(a);
    expect(boundTextRevision([a, b], active)).toEqual([a, b]); // same unit counts once
    const over = boundTextRevision([a, b], new Set([...active, {}]));
    expect(over.every((diff) => diff.immediate === "changed" && diff.runs.length === 0)).toBe(true);
    expect(over.map((diff) => diff.snapshot)).toEqual([a.snapshot, b.snapshot]);
    expect(active.size).toBe(32);
    const fresh = diffText(createTextSnapshot("new"), "next");
    expect(boundTextRevision([fresh], new Set(Array.from({ length: 65 }, () => ({}))))[0]?.immediate).toBe("changed");
    expect(boundTextRevision([fresh])[0]).toBe(fresh);
  });

  it("fails closed without a segmenter, including unsupported locale, and never splits code points", () => {
    const previous = createTextSnapshot("👩🏽‍💻");
    vi.stubGlobal("Intl", { ...Intl, Segmenter: undefined });
    try {
      const diff = diffText(previous, "👨‍👩‍👧‍👦");
      expect(diff.immediate).toBe("segmenter");
      expect(diff.snapshot.units).toBeNull();
      expect(diff.snapshot.value).toBe("👨‍👩‍👧‍👦");
      expect(diff.runs).toEqual([]);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(createTextSnapshot("exact", "_").unavailable).toBe("segmenter");
  });

  it.each([
    ["سلام", "سليم"],
    ["שָׁלוֹם", "שלום!"],
    ["a العربية b", "a العبرية b"],
    ["office", "offices"],
    ["कर्म", "धर्म"],
  ])("requires shaping proof even with valid graphemes: %s → %s", (before, after) => {
    const raw = diffText(createTextSnapshot(before), after);
    const safe = shapeTextDiff(raw);
    expect(safe.immediate).toBe("shaping");
    expect(safe.runs).toEqual([]);
    expect(safe.snapshot).toBe(raw.snapshot);
    expect(texts(safe.snapshot)).toBe(after);
    // A whole-run boundary does not authorize splitting a connected/ligature run.
    expect(
      shapeTextDiff(raw, { before: new Set([0, before.length]), after: new Set([0, after.length]) }).immediate,
    ).toBe("shaping");
  });

  it("allows only changed safe runs; never widens a change to fade retained text", () => {
    const raw = diffText(createTextSnapshot("Save"), "Saved");
    expect(shapeTextDiff(raw, { before: new Set([4]), after: new Set([4, 5]) })).toBe(raw);
    expect(shapeTextDiff(raw, { before: new Set([0, 4]), after: new Set([0, 5]) }).immediate).toBe("shaping");
    const native = shapeTextDiff(raw, { before: new Set([4]), after: new Set([4, 5]) }, true);
    expect(native.immediate).toBe("native");
    expect(native.runs).toEqual([]);
    expect(native.snapshot).toBe(raw.snapshot);
  });

  it("preserves maximal ordered identity and exact output exhaustively on small repeated strings", () => {
    const strings = [""];
    for (let length = 1; length <= 5; length++)
      for (let bits = 0; bits < 2 ** length; bits++)
        strings.push(Array.from({ length }, (_, index) => ((bits >> index) & 1 ? "a" : "b")).join(""));
    const lcs = (a: string, b: string): number => {
      const rows = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
      for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
          (rows[i] as number[])[j] =
            a[i - 1] === b[j - 1]
              ? 1 + (rows[i - 1]?.[j - 1] ?? 0)
              : Math.max(rows[i - 1]?.[j] ?? 0, rows[i]?.[j - 1] ?? 0);
      return rows[a.length]?.[b.length] ?? 0;
    };
    for (const before of strings) {
      const previous = createTextSnapshot(before);
      for (const after of strings) {
        const diff = diffText(previous, after);
        const survivors = diff.snapshot.units?.filter((item) => previous.units?.includes(item)) ?? [];
        expect(survivors.length, `${before} → ${after}`).toBe(lcs(before, after));
        expect(texts(diff.snapshot)).toBe(after);
        expect(survivors.map((item) => previous.units?.indexOf(item))).toEqual(
          survivors.map((item) => previous.units?.indexOf(item)).sort((a, b) => (a ?? 0) - (b ?? 0)),
        );
        expect(diff.comparisons).toBeLessThanOrEqual(4096);
      }
    }
  });
});
