import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import { assessBudget, PERFORMANCE_POLICY, reportBudget } from "./performance-policy.mjs";
import { measureInitialScripts } from "./site-js-budget.mjs";

// Run from the repository root after an isolated production build/start.
// Output, base URL and comma-separated component IDs are positional arguments.
const output = process.argv[2] ?? ".cache/site-pages-js.json";
const base = process.argv[3] ?? "http://127.0.0.1:3167";
const ids = (process.argv[4] ?? "button,chart,calendar,code-block").split(",");
const dist = process.env.CADENCE_DIST_DIR ?? ".next";
const manifest = JSON.parse(readFileSync(path.join(dist, "build-manifest.json"), "utf8"));
const reports = [];
for (const id of ids) {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL, headless: true });
  try {
    const page = await browser.newPage();
    const report = await measureInitialScripts(page, `${base}/components/${id}`, `[data-preview="${id}"]`);
    const roots = manifest.rootMainFiles.map((file) => {
      const body = readFileSync(path.join(dist, file));
      const gzip = gzipSync(body, { level: 6 }).length;
      const sha256 = createHash("sha256").update(body).digest("hex");
      const loaded = report.files.find((entry) => new URL(entry.url).pathname === `/_next/${file}`);
      assert.equal(loaded?.gzip, gzip);
      assert.equal(loaded?.sha256, sha256);
      return { file, gzip, sha256 };
    });
    assert.ok(report.files.length > 0);
    assert.ok(report.files.every((entry) => entry.status === 200));
    assert.deepEqual(report.errors, []);
    reports.push({
      id,
      ...report,
      roots,
      browser: browser.version(),
      budgetPassed: report.gzipBytes <= report.limit,
      budgetAssessment: reportBudget(assessBudget(`${id} initial JS gzip bytes`, report.gzipBytes, report.limit)),
    });
    console.log(`${id}: ${report.gzipBytes}/${report.limit} gzip bytes, ${report.files.length} scripts`);
  } finally {
    await browser.close();
  }
}
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(
  output,
  `${JSON.stringify(
    {
      performancePolicy: PERFORMANCE_POLICY,
      source: process.env.CADENCE_RUNTIME_SOURCE ?? "unspecified",
      buildId: readFileSync(path.join(dist, "BUILD_ID"), "utf8").trim(),
      protocol:
        "fresh browser per page; cache disabled; all scripts; load + networkidle + 10s + networkidle; no interaction; root manifest/hash verification",
      reports,
    },
    null,
    2,
  )}\n`,
);
// Measurement/provenance assertions still throw; numeric exceedances remain advisory.
console.log(
  `Performance ${PERFORMANCE_POLICY.performanceAcceptance}: ${PERFORMANCE_POLICY.enforcement} comparisons (ADR-023).`,
);
