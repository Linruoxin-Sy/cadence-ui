// Reuse the retained production build; enumerate HTML routes, never registry/XML/error endpoints.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { assessBudget, PERFORMANCE_POLICY, reportBudget } from "./performance-policy.mjs";
import { measureInitialScripts, summarizeLayoutShifts } from "./site-js-budget.mjs";

const dist = process.env.CADENCE_DIST_DIR ?? ".next-motion-runtime";
const base = process.argv[2] ?? "http://127.0.0.1:3183";
const output = process.argv[3] ?? ".cache/w3-site.json";
const manifest = JSON.parse(readFileSync(path.join(dist, "build-manifest.json"), "utf8"));
const routes = Object.keys(JSON.parse(readFileSync(path.join(dist, "prerender-manifest.json"), "utf8")).routes);
const applicable = routes.filter((route) => route === "/" || /^\/(components|docs)(\/|$)/.test(route));
const report = {
  performancePolicy: PERFORMANCE_POLICY,
  source: process.env.CADENCE_RUNTIME_SOURCE ?? "unspecified",
  buildId: readFileSync(path.join(dist, "BUILD_ID"), "utf8").trim(),
  protocol:
    "fresh Edge per route; cache disabled; all automatic JS; load + networkidle + 10s + networkidle; no interaction/scroll/blocking; gzip6 per decoded entity",
  clsScope:
    "cold-load only; desktop 1280x720 and mobile emulation 390x844; maximum CLS session window (1s gap/5s cap), excludes recent input; not lifetime or real-device FPS certification",
  excludedRoutes: routes.filter((route) => !applicable.includes(route)),
  reports: [],
};
mkdirSync(path.dirname(output), { recursive: true });
await Promise.all(
  [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
  ].map(async (viewport) => {
    for (const route of applicable) {
      const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
      try {
        const page = await browser.newPage({ viewport, isMobile: viewport.width < 500, deviceScaleFactor: 1 });
        await page.addInitScript(() => {
          window.__w3Shifts = [];
          window.__w3CLSSupported = PerformanceObserver.supportedEntryTypes.includes("layout-shift");
          if (window.__w3CLSSupported)
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries())
                window.__w3Shifts.push({
                  value: entry.value,
                  startTime: entry.startTime,
                  hadRecentInput: entry.hadRecentInput,
                  sources: entry.sources?.map((source) => ({
                    slot: source.node?.getAttribute?.("data-slot"),
                    tag: source.node?.tagName,
                    previousRect: source.previousRect,
                    currentRect: source.currentRect,
                  })),
                });
            }).observe({ type: "layout-shift", buffered: true });
        });
        const scripts = await measureInitialScripts(page, `${base}${route}`, "main");
        const roots = manifest.rootMainFiles.map((file) => {
          const sha256 = createHash("sha256")
            .update(readFileSync(path.join(dist, file)))
            .digest("hex");
          assert.equal(scripts.files.find((entry) => new URL(entry.url).pathname === `/_next/${file}`)?.sha256, sha256);
          return { file, sha256 };
        });
        assert.ok(scripts.files.length > 0 && scripts.files.every((entry) => entry.status === 200));
        assert.deepEqual(scripts.errors, []);
        const layout = await page.evaluate(() => ({ supported: window.__w3CLSSupported, shifts: window.__w3Shifts }));
        assert.ok(layout.supported);
        const cls = summarizeLayoutShifts(layout.shifts);
        report.reports.push({
          route,
          viewport,
          browser: browser.version(),
          ...scripts,
          roots,
          layout,
          cls,
          clsPassed: cls < 0.02,
          jsPassed: scripts.gzipBytes <= scripts.limit,
          budgetAssessments: [
            reportBudget(assessBudget(`${route} JS gzip bytes`, scripts.gzipBytes, scripts.limit)),
            reportBudget(assessBudget(`${route} cold CLS`, cls, 0.02, "below")),
          ],
        });
        writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
        console.log(`${viewport.width} ${route}: JS ${scripts.gzipBytes}, CLS ${cls}`);
      } finally {
        await browser.close();
      }
    }
  }),
);
// Structural/browser/provenance assertions remain blocking; numerical comparisons do not.
console.log(
  `Performance ${PERFORMANCE_POLICY.performanceAcceptance}: ${PERFORMANCE_POLICY.enforcement} comparisons (ADR-023).`,
);
