import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PERFORMANCE_BUDGETS, PERFORMANCE_POLICY } from "../../scripts/performance-policy.mjs";

// ADR-026 makes three bundle metrics hard gates. They are only gates if the required
// status runs them, so this suite compiles the real 63-entry consumer graph instead of
// asserting against a fixture: a component that grows past its recorded addition, or past
// 8 000 B of its own code, fails here rather than in a report nobody reads.
const root = process.cwd();
const registry = JSON.parse(readFileSync("registry.json", "utf8"));
const fixture = JSON.parse(readFileSync(PERFORMANCE_BUDGETS["component-addition"].ratchetFixture, "utf8"));
const ids = registry.items
  .filter((item: { meta?: { tier?: string } }) => item.meta?.tier)
  .map((item: { name: string }) => item.name)
  .sort();

describe("ADR-026 performance budgets", () => {
  it("classifies every metric the collectors measure, and no gate without a class", () => {
    expect(PERFORMANCE_POLICY).toMatchObject({
      phase: "performance-governance",
      enforcement: "budgeted",
      performanceAcceptance: "pending-f03",
      authority: "ADR-026",
    });
    const classes = Object.values(PERFORMANCE_BUDGETS).map((budget) => budget.class);
    expect(new Set(classes)).toEqual(new Set(["hard-gate", "monitored", "retired"]));
    for (const [id, budget] of Object.entries(PERFORMANCE_BUDGETS)) {
      // No unexplained number: a compared metric carries a limit, a method and a purpose.
      if (budget.class !== "retired") {
        expect(Number.isFinite(budget.limit as number), id).toBe(true);
        expect(budget.method, id).toBeTruthy();
        expect(budget.protects, id).toBeTruthy();
        expect(budget.comparison, id).toBeTruthy();
      }
    }
  });

  it("records one addition ratchet per catalogue id", () => {
    expect(Object.keys(fixture.ids).sort()).toEqual(ids);
    expect(fixture.tolerance).toBe(PERFORMANCE_BUDGETS["component-addition"].ratchetTolerance);
    expect(fixture.source.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(fixture.protocol).toContain("gzip6");
  });

  it("compiles the real consumer graph and keeps every hard gate green", () => {
    const dir = path.join(".cache", "perf-budgets", `${process.pid}-${Date.now()}`);
    const run = spawnSync(process.execPath, ["scripts/audit-w3-bundles.mjs", dir], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    expect(run.stderr, run.stderr).not.toContain("ADR-026 hard gate failed");
    expect(run.status, `${run.stdout}\n${run.stderr}`).toBe(0);

    const summaryLine = run.stdout
      .trim()
      .split("\n")
      .find((line) => line.startsWith('{"motion"'));
    expect(summaryLine, run.stdout.slice(-2000)).toBeTruthy();
    const summary = JSON.parse(summaryLine ?? "{}");
    expect(summary.total).toBe(ids.length);
    expect(summary.localWithin).toBe(summary.total);
    expect(summary.additionRatchetWithin).toBe(summary.total);
    const limit = PERFORMANCE_BUDGETS["motion-union"].limit as number;
    for (const union of summary.motion as { name: string; gzip: number }[]) {
      expect(union.gzip, union.name).toBeLessThanOrEqual(limit);
    }
  });
});
