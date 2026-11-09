// ADR-023: changing phase/enforcement requires an explicit post-migration budget decision.
export const PERFORMANCE_POLICY = Object.freeze({
  phase: "functional-migration",
  enforcement: "advisory",
  performanceAcceptance: "deferred",
  authority: "ADR-023",
});

/**
 * Retain the original comparison without treating a successful command as performance acceptance.
 * Invalid measurements are correctness failures, never advisory results.
 * @param {string} metric
 * @param {number} actual
 * @param {number} reference
 * @param {"at-most" | "below" | "at-least"} comparison
 */
export function assessBudget(metric, actual, reference, comparison = "at-most") {
  if (![actual, reference].every((value) => Number.isFinite(value) && value >= 0)) {
    throw new Error(`${metric}: invalid performance measurement/reference`);
  }
  if (!["at-most", "below", "at-least"].includes(comparison)) {
    throw new Error(`${metric}: invalid budget comparison`);
  }
  const comparisonPassed =
    comparison === "below" ? actual < reference : comparison === "at-least" ? actual >= reference : actual <= reference;
  return {
    ...PERFORMANCE_POLICY,
    metric,
    actual,
    reference,
    comparison,
    comparisonPassed,
    status: comparisonPassed ? "advisory-within-reference" : "advisory-exceeded",
    blocking: false,
  };
}

/** @param {ReturnType<typeof assessBudget>} result */
export function reportBudget(result) {
  if (!result.comparisonPassed) {
    console.warn(
      `[${result.status}; performance deferred] ${result.metric}: actual=${result.actual}, reference=${result.reference}, comparison=${result.comparison} (${result.authority})`,
    );
  }
  return result;
}
