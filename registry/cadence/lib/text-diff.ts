import { motionLimits } from "./motion";

/** Internal pure planning only. S10 owns DOM eligibility, rendering and distribution. */
export interface TextUnit {
  readonly identity: object;
  readonly text: string;
}
export interface TextSnapshot {
  readonly value: string;
  readonly units: readonly TextUnit[] | null;
  readonly unavailable?: "segmenter" | "input";
}
export interface TextChangeRun {
  readonly outgoing: readonly TextUnit[];
  readonly incoming: readonly TextUnit[];
  /** UTF-16 offsets in the exact before/after strings, for shaping-boundary proof. */
  readonly before: readonly [number, number];
  readonly after: readonly [number, number];
}
type Fallback = "segmenter" | "input" | "comparisons" | "changed" | "shaping" | "native";
export interface TextDiff {
  readonly snapshot: TextSnapshot;
  readonly runs: readonly TextChangeRun[];
  readonly comparisons: number;
  readonly path: "baseline" | "equal" | "append" | "trim" | "middle";
  /** A null reason is a diff candidate, never permission to split a DOM tree. */
  readonly immediate: Fallback | null;
}

function unit(text: string): TextUnit {
  return { identity: {}, text };
}

export function createTextSnapshot(value: string, locale?: string): TextSnapshot {
  if (typeof Intl.Segmenter !== "function") return { value, units: null, unavailable: "segmenter" };
  try {
    const segments = new Intl.Segmenter(locale, { granularity: "grapheme" }).segment(value);
    const units: TextUnit[] = [];
    for (const { segment } of segments) {
      // Stop on the first excess item; never materialize an oversized iterator.
      if (units.length === motionLimits.diffInput) return { value, units: null, unavailable: "input" };
      units.push(unit(segment));
    }
    return { value, units };
  } catch {
    // Missing locale/segmenter support is exact output, never code-point splitting.
    return { value, units: null, unavailable: "segmenter" };
  }
}

/** Prefix/append + suffix-biased trimming, then a strictly bounded LCS middle. */
export function diffText(previous: TextSnapshot, value: string, locale?: string): TextDiff {
  const result = (snapshot: TextSnapshot, immediate: Fallback | null, path: TextDiff["path"]): TextDiff => ({
    snapshot,
    immediate,
    path,
    runs: [],
    comparisons: 0,
  });
  if (previous.value === value) return result(previous, previous.unavailable ?? null, "equal");
  const next = createTextSnapshot(value, locale);
  if (!next.units || !previous.units)
    return result(next, next.unavailable ?? previous.unavailable ?? "segmenter", "baseline");
  const old = previous.units;
  const incoming = [...next.units];
  let prefix = 0;
  while (prefix < old.length && prefix < incoming.length && old[prefix]?.text === incoming[prefix]?.text) prefix++;
  const append = prefix === old.length;
  let suffix = 0;
  if (!append) {
    while (
      suffix < old.length &&
      suffix < incoming.length &&
      old[old.length - 1 - suffix]?.text === incoming[incoming.length - 1 - suffix]?.text
    )
      suffix++;
    // In ambiguous repeated text, preserve the original suffix (aba -> aaba).
    prefix = Math.min(prefix, old.length - suffix, incoming.length - suffix);
  }
  const matches: [number, number][] = [];
  for (let index = 0; index < prefix; index++) matches.push([index, index]);
  const rows = old.length - prefix - suffix;
  const columns = incoming.length - prefix - suffix;
  const path = append ? "append" : rows && columns ? "middle" : "trim";
  let comparisons = 0;
  const overflow = rows * columns > motionLimits.diffComparisons;
  if (!overflow && rows && columns) {
    // The table has at most 4096 comparison cells, plus its bounded sentinel edges.
    const stride = columns + 1;
    const lcs = new Uint16Array((rows + 1) * stride);
    for (let row = rows - 1; row >= 0; row--) {
      for (let column = columns - 1; column >= 0; column--) {
        comparisons++;
        lcs[row * stride + column] =
          old[prefix + row]?.text === incoming[prefix + column]?.text
            ? 1 + (lcs[(row + 1) * stride + column + 1] ?? 0)
            : Math.max(lcs[(row + 1) * stride + column] ?? 0, lcs[row * stride + column + 1] ?? 0);
      }
    }
    let row = 0;
    let column = 0;
    while (row < rows && column < columns) {
      // Read the table, not a second round of candidate text comparisons.
      const current = lcs[row * stride + column] ?? 0;
      if (current === (lcs[row * stride + column + 1] ?? 0)) column++;
      else if (current === (lcs[(row + 1) * stride + column] ?? 0)) row++;
      else {
        matches.push([prefix + row++, prefix + column++]);
      }
    }
  }
  for (let index = suffix; index > 0; index--) matches.push([old.length - index, incoming.length - index]);
  for (const [before, after] of matches) incoming[after] = old[before] as TextUnit;
  const snapshot: TextSnapshot = { value, units: incoming };
  if (overflow) return result(snapshot, "comparisons", path);

  const runs: TextChangeRun[] = [];
  let before = 0;
  let after = 0;
  let beforeOffset = 0;
  let afterOffset = 0;
  for (const [oldIndex, newIndex] of [...matches, [old.length, incoming.length] as [number, number]]) {
    const outgoing = old.slice(before, oldIndex);
    const arriving = incoming.slice(after, newIndex);
    const beforeEnd = beforeOffset + outgoing.reduce((sum, item) => sum + item.text.length, 0);
    const afterEnd = afterOffset + arriving.reduce((sum, item) => sum + item.text.length, 0);
    if (outgoing.length || arriving.length)
      runs.push({ outgoing, incoming: arriving, before: [beforeOffset, beforeEnd], after: [afterOffset, afterEnd] });
    beforeOffset = beforeEnd + (old[oldIndex]?.text.length ?? 0);
    afterOffset = afterEnd + (incoming[newIndex]?.text.length ?? 0);
    before = oldIndex + 1;
    after = newIndex + 1;
  }
  const changed = runs.reduce((sum, run) => sum + run.outgoing.length + run.incoming.length, 0);
  return {
    snapshot,
    runs: changed > motionLimits.changedGraphemes ? [] : runs,
    comparisons,
    path,
    immediate: changed > motionLimits.changedGraphemes ? "changed" : null,
  };
}

/**
 * An adapter must prove these boundaries against the actual typography/layout.
 * Grapheme/word segmentation alone is NOT that proof (including Latin ligatures).
 * Native/inherited editing and unknown correspondence must never supply a proof.
 */
export function shapeTextDiff(
  diff: TextDiff,
  proof?: { readonly before: ReadonlySet<number>; readonly after: ReadonlySet<number> },
  native = false,
): TextDiff {
  if (native) return { ...diff, runs: [], immediate: "native" };
  if (diff.immediate || diff.runs.length === 0) return diff;
  if (
    !proof ||
    diff.runs.some(
      (run) =>
        run.before.some((offset) => !proof.before.has(offset)) || run.after.some((offset) => !proof.after.has(offset)),
    )
  )
    return { ...diff, runs: [], immediate: "shaping" };
  return diff;
}

/** Pure preflight; the S06 transaction remains the sole lifecycle/work owner. */
export function boundTextRevision(
  diffs: readonly TextDiff[],
  active: ReadonlySet<object> = new Set(),
): readonly TextDiff[] {
  const identities = new Set<object>();
  const add = (identity: object) => {
    identities.add(identity);
    return identities.size <= motionLimits.changedGraphemes;
  };
  let fits = true;
  for (const identity of active) {
    if (!add(identity)) {
      fits = false;
      break;
    }
  }
  if (fits)
    outer: for (const diff of diffs) {
      for (const run of diff.runs) {
        for (const item of [...run.outgoing, ...run.incoming]) {
          if (!add(item.identity)) {
            fits = false;
            break outer;
          }
        }
      }
    }
  return fits ? diffs : diffs.map((diff) => ({ ...diff, runs: [], immediate: diff.immediate ?? "changed" }));
}
