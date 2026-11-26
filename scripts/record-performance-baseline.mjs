/**
 * Record the `component-addition` ratchet from an audit run (ADR-026).
 *
 *   node scripts/audit-w3-bundles.mjs .cache/audits/adr-026
 *   node scripts/record-performance-baseline.mjs .cache/audits/adr-026/report.json
 *
 * A ratchet without a recorder becomes folklore: the numbers get edited by hand and the
 * reason for the change disappears. This keeps the file derivable from one report, prints
 * the delta for the pull request body, and carries the commit, esbuild version and protocol
 * that produced it. Re-recording is a reviewed change, not a budget amendment.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PERFORMANCE_BUDGETS } from "./performance-policy.mjs";

const budget = PERFORMANCE_BUDGETS["component-addition"];
const reportPath = process.argv[2];
if (!reportPath) {
  console.error("usage: node scripts/record-performance-baseline.mjs <audit report.json>");
  process.exit(2);
}
const report = JSON.parse(await readFile(reportPath, "utf8"));
if (!Array.isArray(report.components) || !report.components.length) {
  throw new Error(`${reportPath}: no components in the report`);
}
const ids = {};
for (const component of [...report.components].sort((a, b) => a.id.localeCompare(b.id))) {
  if (!Number.isSafeInteger(component.gzip) || component.gzip < 0) throw new Error(`${component.id}: invalid gzip`);
  ids[component.id] = component.gzip;
}
const fixture = path.resolve(budget.ratchetFixture);
const previous = await readFile(fixture, "utf8")
  .then(JSON.parse)
  .catch(() => null);
const next = {
  budget: "component-addition",
  unit: budget.unit,
  tolerance: budget.ratchetTolerance,
  protocol: report.protocol,
  source: { report: reportPath, commit: report.sourceCommit, esbuild: report.esbuild },
  ids,
};
await writeFile(fixture, `${JSON.stringify(next, null, 2)}\n`);

if (!previous) {
  console.log(`recorded ${Object.keys(ids).length} ids`);
} else {
  const added = Object.keys(ids).filter((id) => !(id in previous.ids));
  const removed = Object.keys(previous.ids).filter((id) => !(id in ids));
  const changed = Object.keys(ids)
    .filter((id) => id in previous.ids && previous.ids[id] !== ids[id])
    .map(
      (id) =>
        `${id} ${previous.ids[id]} → ${ids[id]} (${ids[id] - previous.ids[id] >= 0 ? "+" : ""}${ids[id] - previous.ids[id]})`,
    );
  console.log(
    [
      `recorded ${Object.keys(ids).length} ids`,
      added.length ? `added: ${added.join(", ")}` : "added: none",
      removed.length ? `removed: ${removed.join(", ")}` : "removed: none",
      changed.length ? `changed:\n  ${changed.join("\n  ")}` : "changed: none",
    ].join("\n"),
  );
}
