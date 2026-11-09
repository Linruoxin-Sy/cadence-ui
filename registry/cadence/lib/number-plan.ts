import { motionLimits } from "./motion";

/** Internal pure candidates only. No DOM, physics, public API or renderer eligibility. */
export type NumericValue = number | bigint;
export type NumberDisplay = { readonly kind: "raw" } | { readonly kind: "intl"; readonly formatter: Intl.NumberFormat };
export type ReelDirection = "trend" | "up" | "down" | "shortest";
export type ReadoutCause =
  | "independent"
  | "selection"
  | "query"
  | "filter"
  | "direct-input"
  | "reset"
  | "restore"
  | "unknown";
type Unavailable = "nonfinite" | "digits" | "parts" | "formatter" | "input";
export interface NumberColumn {
  /** Decimal exponent: units 0, tens 1, tenths -1. Never an array/value key. */
  readonly place: number;
  readonly identity: object;
  readonly digit: string;
  readonly start: number;
  readonly end: number;
}
export interface NumberSnapshot {
  readonly value: NumericValue;
  /** Authoritative exact output, including bidi literals and every significant digit. */
  readonly text: string;
  readonly parts: readonly Intl.NumberFormatPart[];
  readonly columns: readonly NumberColumn[] | null;
  readonly formatKey: string;
  readonly localeKey: string;
  readonly scaleKey: string;
  readonly unavailable?: Unavailable;
}
export interface ReelLane {
  readonly identity: object;
  readonly place: number;
  readonly direction: "up" | "down";
  /** Coordinates are cell heights, NOT pixels or authored motion parameters. */
  readonly outgoing: { readonly digit: string; readonly from: 0; readonly to: -1 | 1 } | null;
  readonly incoming: { readonly digit: string; readonly from: -1 | 1; readonly to: 0 } | null;
}
export interface NumberPlan {
  readonly snapshot: NumberSnapshot;
  readonly lanes: readonly ReelLane[];
  readonly trend: "up" | "down" | null;
  readonly changedColumns: number;
  readonly immediate:
    | Unavailable
    | "baseline"
    | "equal"
    | "domain"
    | "entity"
    | "format"
    | "scale"
    | "cause"
    | "no-trend"
    | "columns"
    | null;
}

const rawDisplay: NumberDisplay = { kind: "raw" };
const affixTypes = new Set([
  "minusSign",
  "plusSign",
  "percentSign",
  "currency",
  "unit",
  "literal",
  "compact",
  "exponentSeparator",
  "exponentMinusSign",
  "exponentInteger",
]);
const scaleTypes = new Set([
  "compact",
  "exponentSeparator",
  "exponentMinusSign",
  "exponentInteger",
  "currency",
  "unit",
]);

/** Only called on String(original numeric value), never arbitrary user strings. */
function rawParts(text: string): Intl.NumberFormatPart[] | null {
  const match = /^(-?)([0-9]+)(?:\.([0-9]+))?$/.exec(text);
  if (!match) return null;
  const parts: Intl.NumberFormatPart[] = [];
  if (match[1]) parts.push({ type: "minusSign", value: match[1] });
  parts.push({ type: "integer", value: match[2] as string });
  if (match[3]) parts.push({ type: "decimal", value: "." }, { type: "fraction", value: match[3] });
  return parts;
}

/** Format once per committed target, never per animation frame. Formatting errors propagate. */
export function createNumberSnapshot(value: NumericValue, display: NumberDisplay = rawDisplay): NumberSnapshot {
  if (typeof value !== "number" && typeof value !== "bigint")
    throw new TypeError("Expected an original number or bigint");
  const text = display.kind === "raw" ? String(value) : display.formatter.format(value);
  let formatKey = "raw",
    localeKey = "raw",
    scaleKey = "raw";
  const fallback = (unavailable: Unavailable, parts: readonly Intl.NumberFormatPart[] = []): NumberSnapshot => ({
    value,
    text,
    parts,
    columns: null,
    formatKey,
    localeKey,
    scaleKey,
    unavailable,
  });
  if (typeof value === "number" && !Number.isFinite(value)) return fallback("nonfinite");
  // Reuse the conservative text-input ceiling BEFORE part/column decomposition.
  // Exact formatting itself is never truncated, even for a huge BigInt.
  if (text.length > motionLimits.diffInput) return fallback("input");
  let parts: readonly Intl.NumberFormatPart[];
  if (display.kind === "raw") {
    const parsed = rawParts(text);
    if (!parsed) return fallback("parts"); // Raw exponent spelling remains exact/immediate.
    parts = parsed;
  } else {
    try {
      // Custom/foreign part interpreters have no correspondence proof. Their
      // authoritative format() output still survives as an exact fallback.
      if (
        display.formatter.formatToParts !== Intl.NumberFormat.prototype.formatToParts ||
        display.formatter.resolvedOptions !== Intl.NumberFormat.prototype.resolvedOptions
      )
        return fallback("formatter");
      const options = display.formatter.resolvedOptions();
      formatKey = JSON.stringify(Object.entries(options).sort(([a], [b]) => a.localeCompare(b)));
      localeKey = JSON.stringify([options.locale, options.numberingSystem]);
      parts = display.formatter.formatToParts(value);
      if (parts.length > text.length || parts.map((part) => part.value).join("") !== text) return fallback("parts");
      if (options.numberingSystem !== "latn") return fallback("digits", parts);
      scaleKey = JSON.stringify(
        parts.filter((part) => scaleTypes.has(part.type)).map(({ type, value }) => [type, value]),
      );
    } catch {
      return fallback("formatter");
    }
  }
  let integerLength = 0,
    fractionLength = 0,
    decimal = false,
    offset = 0;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    if (!part?.value) return fallback("parts", parts);
    if (part.type === "integer" || part.type === "fraction") {
      if (!/^[0-9]+$/.test(part.value)) return fallback("digits", parts);
      if (part.type === "integer") {
        if (decimal) return fallback("parts", parts);
        integerLength += part.value.length;
      } else {
        if (!decimal || fractionLength) return fallback("parts", parts);
        fractionLength += part.value.length;
      }
    } else if (part.type === "decimal") {
      if (decimal || !integerLength || parts[index + 1]?.type !== "fraction") return fallback("parts", parts);
      decimal = true;
    } else if (part.type === "group") {
      if (decimal || parts[index - 1]?.type !== "integer" || parts[index + 1]?.type !== "integer")
        return fallback("parts", parts);
    } else if (!affixTypes.has(part.type)) return fallback("parts", parts);
  }
  if (!integerLength) return fallback("parts", parts);
  const columns: NumberColumn[] = [];
  let integerIndex = 0,
    fractionIndex = 0;
  for (const part of parts) {
    if (part.type === "integer" || part.type === "fraction") {
      for (const digit of part.value) {
        const place = part.type === "integer" ? integerLength - ++integerIndex : -++fractionIndex;
        columns.push({ place, identity: {}, digit, start: offset, end: ++offset });
      }
    } else offset += part.value.length;
  }
  return { value, text, parts, columns, formatKey, localeKey, scaleKey };
}

/**
 * Compares exactly two committed snapshots. No origin-from-zero, target queue,
 * string inference or Number(bigint). Caller supplies accepted cause/entity truth.
 * A candidate still requires S12's native/layout/mode/continuity eligibility.
 */
export function planNumberChange(
  previous: NumberSnapshot | null,
  next: NumberSnapshot,
  options: { readonly direction?: ReelDirection; readonly cause?: ReadoutCause; readonly sameEntity?: boolean } = {},
): NumberPlan {
  let snapshot = next;
  const result = (
    immediate: NumberPlan["immediate"],
    trend: NumberPlan["trend"] = null,
    changedColumns = 0,
    lanes: readonly ReelLane[] = [],
  ): NumberPlan => ({ snapshot, immediate, trend, changedColumns, lanes });
  if (!previous) return result("baseline");
  if (options.sameEntity === false) return result("entity");
  if (typeof previous.value !== typeof next.value) return result("domain");
  if (
    previous.columns &&
    next.columns &&
    previous.localeKey === next.localeKey &&
    previous.scaleKey === next.scaleKey
  ) {
    const retained = new Map(previous.columns.map((column) => [column.place, column.identity]));
    snapshot = {
      ...next,
      columns: next.columns.map((column) => ({ ...column, identity: retained.get(column.place) ?? column.identity })),
    };
  }
  if (previous.text === next.text) return result("equal");
  if (next.unavailable || previous.unavailable) return result(next.unavailable ?? previous.unavailable ?? "parts");
  if (previous.formatKey !== next.formatKey) return result("format");
  if (previous.scaleKey !== next.scaleKey) return result("scale");
  if (options.cause !== "independent" && options.cause !== "selection") return result("cause");
  const trend = next.value > previous.value ? "up" : next.value < previous.value ? "down" : null;
  if (!trend) return result("no-trend"); // Includes -0↔0; sign is affix text only.
  const before = new Map(previous.columns?.map((column) => [column.place, column]));
  const after = new Map(snapshot.columns?.map((column) => [column.place, column]));
  let changedColumns = 0;
  for (const [place, column] of after) if (column.digit !== before.get(place)?.digit) changedColumns++;
  for (const place of before.keys()) if (!after.has(place)) changedColumns++;
  if (changedColumns > motionLimits.numericColumns) return result("columns", trend, changedColumns);
  const lanes: ReelLane[] = [];
  const lane = (old: NumberColumn | undefined, target: NumberColumn | undefined) => {
    if (old?.digit === target?.digit) return;
    let direction = options.direction ?? "trend";
    if (direction === "shortest" && old && target) {
      const up = (Number(target.digit) - Number(old.digit) + 10) % 10;
      direction = up <= 10 - up ? "up" : "down";
    }
    if (direction === "trend" || direction === "shortest") direction = trend;
    const edge = direction === "up" ? 1 : -1;
    const column = target ?? (old as NumberColumn);
    lanes.push({
      identity: column.identity,
      place: column.place,
      direction,
      outgoing: old ? { digit: old.digit, from: 0, to: edge === 1 ? -1 : 1 } : null,
      incoming: target ? { digit: target.digit, from: edge, to: 0 } : null,
    });
  };
  for (const [place, column] of after) lane(before.get(place), column);
  for (const [place, column] of before) if (!after.has(place)) lane(column, undefined);
  return result(null, trend, changedColumns, lanes);
}

/** Known finite transaction preflight, including still-live columns; S06 owns lifecycle. */
export function boundNumberRevision(
  plans: readonly NumberPlan[],
  active: ReadonlySet<object> = new Set(),
): readonly NumberPlan[] {
  if (!(active instanceof Set)) throw new RangeError("Numeric preflight requires a known identity Set");
  const identities = new Set<object>();
  let fits = active.size <= motionLimits.numericColumns;
  if (fits) {
    for (const identity of Set.prototype.values.call(active)) identities.add(identity);
    outer: for (const plan of plans)
      for (const lane of plan.lanes) {
        identities.add(lane.identity);
        if (identities.size > motionLimits.numericColumns) {
          fits = false;
          break outer;
        }
      }
  }
  return fits ? plans : plans.map((plan) => ({ ...plan, lanes: [], immediate: plan.immediate ?? "columns" }));
}
