// ADR-026: the v2 budget decision. Changing phase/enforcement requires a new ADR, and
// changing a limit here without one is a documentation bug, not a tuning step.
//
// `performanceAcceptance` stays `pending-f03` after that acceptance was recorded: F03 ran
// it (docs/performance-acceptance.md) and did not meet ADR-026's conditions — three
// monitored metrics are over their limits and the device criterion is unmeasured — so
// acceptance has not been granted to anyone yet. The value records who owed the run, not
// that the run passed; a passed run is a later decision, not an edit to this string.
export const PERFORMANCE_POLICY = Object.freeze({
  phase: "performance-governance",
  enforcement: "budgeted",
  performanceAcceptance: "pending-f03",
  authority: "ADR-026",
});

/**
 * One entry per budgeted metric. `class` is the ADR's classification:
 *
 *   hard-gate  a failing comparison fails the run that measured it
 *   monitored  recorded and compared; a breach is reported and tracked, the run continues
 *   retired    no comparison; the figure may still be reported as an observation
 *
 * A metric that is not in this table cannot be assessed, so no collector can introduce a
 * gate the ADR does not justify. An invalid measurement stays a correctness failure under
 * every class and is rejected before classification is considered.
 */
export const PERFORMANCE_BUDGETS = Object.freeze({
  "component-local-code": Object.freeze({
    limit: 8_000,
    unit: "bytes gzip",
    comparison: "at-most",
    class: "hard-gate",
    protects: "one component's authored code",
    method:
      "the item's entry compiled alone by esbuild (minified ES2020 ESM, gzip6), every other module external; scripts/audit-w3-bundles.mjs localOnly",
  }),
  "component-addition": Object.freeze({
    // A ratchet: the reference is the id's recorded value, not this cap. The cap only
    // bounds an id that enters the catalogue for the first time.
    limit: 224_000,
    ratchetTolerance: 1_024,
    ratchetFixture: "tests/fixtures/performance/consumer-addition.json",
    unit: "bytes gzip",
    comparison: "at-most",
    class: "hard-gate",
    protects: "one component's install cost",
    method:
      "63-entry split consumer graph, declared shared baseline subtracted, dedicated dependencies counted, initial and reachable async output summed; scripts/audit-w3-bundles.mjs",
  }),
  "motion-union": Object.freeze({
    limit: 48_000,
    unit: "bytes gzip",
    comparison: "at-most",
    class: "hard-gate",
    protects: "the Motion runtime union every animated id imports",
    method:
      "production compilation of the exact value exports the registry imports, React external; scripts/audit-w3-bundles.mjs",
  }),
  cls: Object.freeze({
    limit: 0.02,
    unit: "CLS session maximum",
    comparison: "below",
    class: "hard-gate",
    protects: "layout stability during first paint and interaction",
    method:
      "largest session window (gap < 1 s, span < 5 s) excluding recent-input shifts; cold sweep and scripted interaction windows are separate cells",
  }),
  "route-remainder": Object.freeze({
    limit: 40_000,
    unit: "bytes gzip",
    comparison: "at-most",
    class: "monitored",
    protects: "the first-load cost one route adds above the shared shell",
    method:
      "page total minus the chunk set present on all component routes, from the same production sweep; scripts/measure-routes.mjs page",
  }),
  "page-total": Object.freeze({
    limit: 550_000,
    unit: "bytes gzip",
    comparison: "at-most",
    class: "monitored",
    protects: "first load as the user pays it",
    method:
      "every JavaScript HTTP entity the route fetched, gzip6 per entity, load + networkidle + 10 s + networkidle, cache disabled; scripts/measure-routes.mjs page",
  }),
  "frame-share": Object.freeze({
    limit: 0.01,
    unit: "share of frames over 25 ms",
    comparison: "at-most",
    class: "monitored",
    protects: "interaction smoothness on this host",
    method:
      "rAF intervals in a 2 s window after a scripted interaction or a 240 px scroll; scripts/measure-routes.mjs frames",
  }),
  "frame-block": Object.freeze({
    limit: 150,
    unit: "ms, longest long-animation-frame",
    comparison: "at-most",
    class: "monitored",
    protects: "no visible main-thread stall during motion",
    method: "longest long-animation-frame entry in the same window as frame-share",
  }),
  "tier-source": Object.freeze({
    limit: null,
    unit: "bytes gzip",
    comparison: null,
    class: "retired",
    protects: "nothing: the ladder measured shared helpers as component source (ADR-026)",
    method: "gzip6 of every file the item lists; still reported per item by registry:check",
  }),
});

/**
 * @param {keyof typeof PERFORMANCE_BUDGETS | string} id
 * @param {number} actual
 * @param {number} [reference] the id's recorded value for a ratchet, otherwise the budget's limit
 * @param {string} [comparison]
 */
export function assessBudget(id, actual, reference, comparison) {
  const budget = PERFORMANCE_BUDGETS[id];
  if (!budget) throw new Error(`${id}: no ADR-026 budget for this metric`);
  if (budget.class === "retired") throw new Error(`${id}: retired by ADR-026, report the value without comparing it`);
  if (!Number.isFinite(actual) || actual < 0) throw new Error(`${id}: invalid performance measurement`);
  const limit = reference ?? budget.limit;
  if (!Number.isFinite(limit) || limit < 0) throw new Error(`${id}: invalid performance reference`);
  const mode = comparison ?? budget.comparison;
  if (!["at-most", "below", "at-least"].includes(mode)) throw new Error(`${id}: invalid budget comparison`);
  const comparisonPassed = mode === "below" ? actual < limit : mode === "at-least" ? actual >= limit : actual <= limit;
  return {
    ...PERFORMANCE_POLICY,
    id,
    metric: id,
    class: budget.class,
    actual,
    reference: limit,
    comparison: mode,
    comparisonPassed,
    status: comparisonPassed ? `${budget.class}-within` : `${budget.class}-exceeded`,
    blocking: budget.class === "hard-gate" && !comparisonPassed,
  };
}

/** @param {ReturnType<typeof assessBudget>} result */
export function reportBudget(result) {
  if (!result.comparisonPassed && result.class !== "hard-gate") {
    console.warn(
      `[monitored; breach tracked, ${result.authority}] ${result.id}: actual=${result.actual}, reference=${result.reference} (${result.comparison})`,
    );
  }
  return result;
}

/**
 * The hard-gate half of the decision. Callers assess what they measured, write their raw
 * report, then call this so a failure exits non-zero with every breach listed at once.
 * @param {ReturnType<typeof assessBudget>[]} results
 */
export function requireBudgets(results) {
  const failures = results.filter((result) => result.blocking);
  if (!failures.length) return results;
  throw new Error(
    `ADR-026 hard gate failed: ${failures
      .map((result) => `${result.id} ${result.actual} > ${result.reference}`)
      .join("; ")}`,
  );
}
