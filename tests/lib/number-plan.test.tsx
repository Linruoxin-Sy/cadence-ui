import { describe, expect, it, vi } from "vitest";
import * as algorithms from "@/registry/cadence/lib/number-plan";
import { numberPlanCases } from "@/tests/fixtures/number-plan-cases";

const { createNumberSnapshot: snapshot, planNumberChange: plan, boundNumberRevision: bound } = algorithms;
const independent = { cause: "independent" } as const;

describe("pure numeric formatting and bounded place plans", () => {
  it("executes the shared exact-format/identity/direction/boundary vectors", () => {
    let checks = 0;
    numberPlanCases(algorithms, (name, condition) => {
      expect(condition, name).toBe(true);
      checks++;
    });
    expect(checks).toBeGreaterThan(90);
  });
  it("compares every decimal pair in both semantic and explicit directions", () => {
    for (let a = 0; a < 10; a++)
      for (let b = 0; b < 10; b++) {
        const previous = snapshot(a),
          next = snapshot(b);
        for (const direction of ["trend", "up", "down", "shortest"] as const) {
          const result = plan(previous, next, { ...independent, direction });
          if (a === b) {
            expect(result.immediate).toBe("equal");
            expect(result.lanes).toEqual([]);
            continue;
          }
          const lane = result.lanes[0];
          const distances = direction === "shortest" ? [(b - a + 10) % 10, (a - b + 10) % 10] : null;
          const expected =
            direction === "trend"
              ? b > a
                ? "up"
                : "down"
              : distances
                ? (distances[0] as number) <= (distances[1] as number)
                  ? "up"
                  : "down"
                : direction;
          expect(lane?.direction, `${a}→${b} ${direction}`).toBe(expected);
          expect([lane?.outgoing?.digit, lane?.incoming?.digit]).toEqual([String(a), String(b)]);
          expect(result.snapshot.columns?.[0]?.identity).toBe(previous.columns?.[0]?.identity);
        }
      }
  });
  it("uses resolved options rather than formatter object identity and preserves affixes verbatim", () => {
    const display = () =>
      ({
        kind: "intl",
        formatter: new Intl.NumberFormat("ar-EG-u-nu-latn", {
          style: "currency",
          currency: "USD",
          currencySign: "accounting",
        }),
      }) as const;
    const result = plan(snapshot(-1234.5, display()), snapshot(-1234.6, display()), independent);
    expect(result.immediate).toBeNull();
    expect(result.lanes.map((lane) => lane.place)).toEqual([-1]);
    expect(result.snapshot.parts).toEqual(display().formatter.formatToParts(-1234.6));
  });
  it("does not parse numeric-looking strings or coerce unsupported values", () => {
    for (const value of ["00123", "1.2", "NaN", null, {}, true])
      expect(() => snapshot(value as number)).toThrow(TypeError);
  });
  it("keeps exact authoritative output when part APIs are unsafe or unavailable", () => {
    for (const replacement of [
      () => [{ type: "integer", value: "WRONG" }],
      () => [{ type: "unknown", value: "12" }],
      () => [{ type: "fraction", value: "12" }],
      () => [
        { type: "integer", value: "1" },
        { type: "decimal", value: "2" },
      ],
      () => {
        throw new Error("parts unavailable");
      },
    ]) {
      const formatter = new Intl.NumberFormat("en-US");
      vi.spyOn(formatter, "formatToParts").mockImplementation(replacement as typeof formatter.formatToParts);
      const current = snapshot(12, { kind: "intl", formatter });
      expect(current.text).toBe("12");
      expect(current.columns).toBeNull();
      expect(plan(snapshot(1), current, independent).lanes).toEqual([]);
    }
    const formatter = new Intl.NumberFormat("en-US");
    vi.spyOn(formatter, "resolvedOptions").mockImplementation(() => {
      throw new Error("unknown options");
    });
    expect(snapshot(12, { kind: "intl", formatter })).toMatchObject({
      text: "12",
      unavailable: "formatter",
      columns: null,
    });
  });
  it("preflights huge output before calling part decomposition", () => {
    const formatter = new Intl.NumberFormat("en-US", { useGrouping: false });
    const parts = vi.spyOn(formatter, "formatToParts");
    const value = 10n ** 4096n;
    expect(snapshot(value, { kind: "intl", formatter })).toMatchObject({
      text: String(value),
      unavailable: "input",
      columns: null,
    });
    expect(parts).not.toHaveBeenCalled();
  });
  it("does not turn sign-only or formatter-only changes into numeric growth", () => {
    const display = { kind: "intl", formatter: new Intl.NumberFormat("en-US", { signDisplay: "always" }) } as const;
    const result = plan(snapshot(-1, display), snapshot(1, display), independent);
    expect(result.lanes).toEqual([]);
    expect(result.snapshot.text).toBe("+1");
    const currency = (currency: string) =>
      ({ kind: "intl", formatter: new Intl.NumberFormat("en-US", { style: "currency", currency }) }) as const;
    expect(plan(snapshot(1, currency("USD")), snapshot(2, currency("EUR")), independent).immediate).toBe("format");
    const precision = (maximumSignificantDigits: number) =>
      ({ kind: "intl", formatter: new Intl.NumberFormat("en-US", { maximumSignificantDigits }) }) as const;
    expect(
      plan(snapshot(1.234, precision(2)), snapshot(1.234, precision(4)), { ...independent, direction: "up" }).lanes,
    ).toEqual([]);
  });
  it("preserves units/tenths across changed padding; removed place never resurrects an old identity", () => {
    const formatter = (minimumIntegerDigits: number) =>
      ({ kind: "intl", formatter: new Intl.NumberFormat("en-US", { minimumIntegerDigits }) }) as const;
    const old = snapshot(1.2, formatter(1));
    const padded = plan(old, snapshot(1.2, formatter(3)), independent);
    expect(padded.immediate).toBe("format");
    for (const column of old.columns ?? [])
      expect(padded.snapshot.columns?.find((item) => item.place === column.place)?.identity).toBe(column.identity);
    const a = snapshot(100),
      b = plan(a, snapshot(99), independent),
      c = plan(b.snapshot, snapshot(100), independent);
    expect(c.snapshot.columns?.find((column) => column.place === 2)?.identity).not.toBe(
      a.columns?.find((column) => column.place === 2)?.identity,
    );
    expect(c.snapshot.columns?.find((column) => column.place === 0)?.identity).toBe(
      a.columns?.find((column) => column.place === 0)?.identity,
    );
  });
  it("preflights active overflow before enumerating and deduplicates only real stable identities", () => {
    const active = new Set(Array.from({ length: 13 }, () => ({})));
    const iterator = vi.spyOn(active, Symbol.iterator).mockImplementation(() => {
      throw new Error("must not enumerate overflow");
    });
    const result = plan(snapshot(1), snapshot(2), independent);
    expect(bound([result], active)[0]).toMatchObject({ immediate: "columns", lanes: [], snapshot: result.snapshot });
    expect(iterator).not.toHaveBeenCalled();
    expect(bound(Array.from({ length: 13 }, () => result))[0]).toBe(result);
    const independentDisplays = Array.from({ length: 13 }, () => plan(snapshot(1), snapshot(2), independent));
    expect(bound(independentDisplays).every((item) => !item.lanes.length && item.immediate === "columns")).toBe(true);
    expect(() => bound([result], { size: 0 } as ReadonlySet<object>)).toThrow(RangeError);
  });
});
