type Algorithms = typeof import("../../registry/cadence/lib/number-plan");

/** Shared Node/actual-browser regression inputs; no DOM or renderer assertion. */
export function numberPlanCases(api: Algorithms, check: (name: string, condition: boolean) => void) {
  const { createNumberSnapshot: snapshot, planNumberChange: plan, boundNumberRevision: bound } = api;
  const independent = { cause: "independent" } as const;
  const intl = (locale: string, options: Intl.NumberFormatOptions = {}) =>
    ({ kind: "intl", formatter: new Intl.NumberFormat(locale, options) }) as const;
  const change = (a: number | bigint, b: number | bigint, display?: Parameters<typeof snapshot>[1]) =>
    plan(snapshot(a, display), snapshot(b, display), independent);
  const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  for (const [a, b, places] of [
    [9, 10, [1, 0]],
    [10, 9, [0, 1]],
    [99, 100, [2, 1, 0]],
    [100, 99, [1, 0, 2]],
  ] as const) {
    const old = snapshot(a),
      result = plan(old, snapshot(b), independent);
    check(
      `${a}→${b} carry places`,
      result.immediate === null &&
        equal(
          result.lanes.map((lane) => lane.place),
          places,
        ),
    );
    check(
      `${a}→${b} retained units`,
      result.snapshot.columns?.find((column) => column.place === 0)?.identity ===
        old.columns?.find((column) => column.place === 0)?.identity,
    );
    const added = result.lanes.find((lane) => lane.outgoing === null);
    const removed = result.lanes.find((lane) => lane.incoming === null);
    check(
      `${a}→${b} no invented zero`,
      a < b
        ? added?.incoming?.digit === "1" && added.outgoing === null
        : removed?.outgoing?.digit === "1" && removed.incoming === null,
    );
  }
  for (const [a, b, direction] of [
    [-20, -19, "up"],
    [-19, -20, "down"],
    [-1, 2, "up"],
    [2, -1, "down"],
    [19, 20, "up"],
    [100, 2, "down"],
  ] as const) {
    const result = change(a, b);
    check(
      `${a}→${b} whole-value trend`,
      result.trend === direction && result.lanes.every((lane) => lane.direction === direction),
    );
  }
  const decimals = intl("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const old = snapshot(12.34, decimals),
    tenths = plan(old, snapshot(12.35, decimals), independent);
  check(
    "hundredth changes alone",
    tenths.lanes.length === 1 &&
      tenths.lanes[0]?.place === -2 &&
      tenths.snapshot.columns?.every(
        (column) => column.identity === old.columns?.find((item) => item.place === column.place)?.identity,
      ) === true,
  );
  const rounded = change(1.231, 1.234, decimals);
  check(
    "equal rounded output has no reel",
    rounded.immediate === "equal" && rounded.lanes.length === 0 && rounded.snapshot.value === 1.234,
  );
  const carry = change(9.995, 10.005, decimals);
  check(
    "rounded carry keeps formatted precision",
    carry.snapshot.text === decimals.formatter.format(10.005) && carry.immediate === null,
  );
  const precision = plan(
    old,
    snapshot(12.34, intl("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })),
    independent,
  );
  check(
    "precision change immediate shared place identities",
    precision.immediate === "format" &&
      !precision.lanes.length &&
      precision.snapshot.columns?.find((column) => column.place === -1)?.identity ===
        old.columns?.find((column) => column.place === -1)?.identity,
  );
  const zero = plan(snapshot(-0, decimals), snapshot(0, decimals), independent);
  check(
    "negative zero has no trend",
    zero.immediate === "no-trend" &&
      !zero.trend &&
      !zero.lanes.length &&
      zero.snapshot.text === decimals.formatter.format(0),
  );
  for (const [value, text] of [
    [1000, "1000"],
    [1.234567, "1.234567"],
    [-0, "0"],
    [1e21, "1e+21"],
    [1e-7, "1e-7"],
  ] as const)
    check(`raw exact ${text}`, snapshot(value).text === text);
  check("raw exponents never expanded", snapshot(1e21).unavailable === "parts" && snapshot(1e-7).columns === null);
  const big = 900719925474099200000000000000000000000n;
  const bigResult = change(big, big + 1n);
  check(
    "BigInt no significant digit loss",
    bigResult.snapshot.text === String(big + 1n) &&
      bigResult.trend === "up" &&
      bigResult.lanes.length === 1 &&
      bigResult.lanes[0]?.place === 0,
  );
  const bigIntl = change(big, big + 1n, intl("en-US"));
  check(
    "BigInt formatToParts exact",
    bigIntl.immediate === null &&
      bigIntl.snapshot.text === new Intl.NumberFormat("en-US").format(big + 1n) &&
      bigIntl.lanes.length === 1,
  );
  check("numeric domain baseline", plan(snapshot(1), snapshot(2n), independent).immediate === "domain");
  for (const display of [
    intl("en-US", { style: "currency", currency: "USD", currencySign: "accounting" }),
    intl("de-DE", { style: "percent", maximumFractionDigits: 2 }),
    intl("fr-FR", { style: "unit", unit: "meter", unitDisplay: "short" }),
    intl("hi-IN"),
    intl("ar-EG", { numberingSystem: "latn" }),
  ]) {
    const result = change(-1234.56, 2345.67, display);
    check(
      `formatToParts ${display.formatter.resolvedOptions().locale}/${display.formatter.resolvedOptions().style}`,
      result.immediate === null &&
        result.snapshot.text === display.formatter.format(2345.67) &&
        result.snapshot.parts.map((part) => part.value).join("") === result.snapshot.text &&
        result.snapshot.columns?.every(
          (column) => result.snapshot.text.slice(column.start, column.end) === column.digit,
        ) === true,
    );
  }
  const percent = change(0.09, 0.1, intl("en-US", { style: "percent" }));
  check(
    "stable percentage scale trend",
    percent.trend === "up" && percent.snapshot.text === "10%" && percent.lanes.length === 2,
  );
  const compact = intl("en-US", { notation: "compact" });
  check("stable compact scale can plan", change(1200, 1300, compact).immediate === null);
  check("compact suffix change immediate", change(990000, 1000000, compact).immediate === "scale");
  const exponent = intl("en-US", { notation: "scientific" });
  check("stable exponent scale can plan", change(1200, 1300, exponent).immediate === null);
  check("exponent change immediate", change(9900, 10000, exponent).immediate === "scale");
  const locale = plan(
    snapshot(12.34, decimals),
    snapshot(13.45, intl("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
    independent,
  );
  check("locale revision immediate", locale.immediate === "format" && !locale.lanes.length);
  for (const locale of ["ar-EG", "fa-IR", "bn-BD"]) {
    const display = intl(locale),
      result = change(12, 23, display);
    check(
      `unsupported digit output ${locale}`,
      result.immediate === "digits" &&
        result.snapshot.text === display.formatter.format(23) &&
        result.snapshot.columns === null &&
        !result.lanes.length,
    );
  }
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const display = intl("ar-EG"),
      result = change(1, value, display);
    check(
      `nonfinite exact ${value}`,
      result.immediate === "nonfinite" &&
        result.snapshot.text === display.formatter.format(value) &&
        !result.lanes.length,
    );
  }
  for (const direction of ["up", "down", "shortest"] as const) {
    const result = plan(snapshot(8), snapshot(2), { ...independent, direction });
    check(
      `explicit ${direction}`,
      result.trend === "down" && result.lanes[0]?.direction === (direction === "shortest" ? "up" : direction),
    );
  }
  check(
    "shortest tie upward",
    plan(snapshot(0), snapshot(5), { ...independent, direction: "shortest" }).lanes[0]?.direction === "up",
  );
  check("trend never shortest", change(2, 8).lanes[0]?.direction === "up");
  for (const cause of ["query", "filter", "direct-input", "reset", "restore", "unknown"] as const) {
    const delayedAccepted = plan(snapshot(1), snapshot(2), { cause });
    check(
      `accepted ${cause} remains immediate`,
      delayedAccepted.immediate === "cause" && !delayedAccepted.lanes.length && delayedAccepted.snapshot.value === 2,
    );
  }
  check("unknown cause default immediate", plan(snapshot(1), snapshot(2)).immediate === "cause");
  check("discrete selection eligible", plan(snapshot(1), snapshot(2), { cause: "selection" }).immediate === null);
  check("first value exact baseline", plan(null, snapshot(99), independent).immediate === "baseline");
  const entity = plan(old, snapshot(99, decimals), { ...independent, sameEntity: false });
  check(
    "cross entity retires identities",
    entity.immediate === "entity" &&
      !entity.lanes.length &&
      entity.snapshot.columns?.every((column) => !old.columns?.some((prior) => prior.identity === column.identity)) ===
        true,
  );
  const twelve = change(111111111111n, 222222222222n),
    thirteen = change(1111111111111n, 2222222222222n);
  check("12 columns allowed", twelve.lanes.length === 12 && twelve.immediate === null);
  check(
    "13 columns exact fallback",
    thirteen.immediate === "columns" &&
      !thirteen.lanes.length &&
      thirteen.snapshot.text === "2222222222222" &&
      thirteen.snapshot.columns?.length === 13,
  );
  const a = change(111111, 222222),
    b = change(333333, 444444);
  check("12 transaction columns allowed", bound([a, b])[1] === b);
  check(
    "13 with active column immediate",
    bound([a, b], new Set([{}])).every((plan) => plan.immediate === "columns" && !plan.lanes.length),
  );
  check(
    "active retarget identity counted once",
    bound([twelve], new Set(twelve.lanes.map((lane) => lane.identity)))[0] === twelve,
  );
  check("transaction overflow never drops digits", bound([a, thirteen])[1]?.snapshot.text === "2222222222222");
  const huge = 10n ** 2048n,
    hugeSnapshot = snapshot(huge);
  check(
    "oversized exact output no decomposition",
    hugeSnapshot.text === String(huge) && hugeSnapshot.unavailable === "input" && hugeSnapshot.columns === null,
  );
  check("2048 input boundary", snapshot(10n ** 2047n).columns?.length === 2048);
  const rounding = intl("en-US", { maximumFractionDigits: 1, roundingMode: "floor" });
  check(
    "explicit rounding policy exact",
    change(1.29, 1.31, rounding).snapshot.text === "1.3" && change(1.29, 1.31, rounding).lanes[0]?.place === -1,
  );
  const roundingRevision = plan(
    snapshot(1.29, rounding),
    snapshot(1.29, intl("en-US", { maximumFractionDigits: 1, roundingMode: "ceil" })),
    independent,
  );
  check(
    "rounding configuration change no invented trend",
    roundingRevision.immediate === "format" &&
      !roundingRevision.lanes.length &&
      roundingRevision.snapshot.text === "1.3",
  );
  const significant = intl("en-US", { maximumSignificantDigits: 4 });
  check(
    "explicit significant precision authoritative",
    change(12345, 12355, significant).snapshot.text === significant.formatter.format(12355),
  );
  const unsafe = new Intl.NumberFormat("en-US");
  Object.defineProperty(unsafe, "formatToParts", { value: () => [{ type: "integer", value: "WRONG" }] });
  const exactUnsafe = snapshot(123, { kind: "intl", formatter: unsafe });
  check(
    "custom part interpreter exact immediate",
    exactUnsafe.text === "123" && exactUnsafe.unavailable === "formatter" && exactUnsafe.columns === null,
  );
  const latest = plan(tenths.snapshot, snapshot(12.36, decimals), independent);
  const reversed = plan(latest.snapshot, snapshot(12.34, decimals), independent);
  check(
    "latest only no intermediate queue",
    latest.snapshot.value === 12.36 &&
      latest.lanes.length === 1 &&
      reversed.trend === "down" &&
      reversed.lanes[0]?.outgoing?.digit === "6" &&
      reversed.lanes[0]?.incoming?.digit === "4",
  );
  for (const result of [twelve, tenths, percent, bigResult, ...[change(9, 10), change(10, 9)]])
    for (const lane of result.lanes) {
      check(
        `bounded two-cell lane ${lane.place}`,
        (lane.incoming ? Math.abs(lane.incoming.from - lane.incoming.to) === 1 : true) &&
          (lane.outgoing ? Math.abs(lane.outgoing.from - lane.outgoing.to) === 1 : true) &&
          Boolean(lane.incoming || lane.outgoing),
      );
    }
}
