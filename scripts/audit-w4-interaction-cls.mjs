// Bounded production interaction/scroll observation, not lifetime CLS certification.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { summarizeLayoutShifts } from "./site-js-budget.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:3183";
const dist = process.env.CADENCE_DIST_DIR ?? ".next-motion-runtime";
const manifest = JSON.parse(readFileSync(`${dist}/build-manifest.json`, "utf8"));
const report = {
  source: "f60e7fe",
  buildId: readFileSync(`${dist}/BUILD_ID`, "utf8").trim(),
  scope:
    "Accordion/Tabs/Select; full mode, OS no-preference; desktop/mobile emulation; fresh context; navigation, scroll, specified interactions, 15s final dwell; not all routes/modes/lifetime/real-device certification",
  records: [],
};
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
try {
  for (const width of [1280, 390]) {
    for (const id of ["accordion", "tabs", "select"]) {
      const context = await browser.newContext({
        viewport: { width, height: width === 390 ? 844 : 720 },
        isMobile: width === 390,
        reducedMotion: "no-preference",
      });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        await page.addInitScript(() => {
          window.__w4Shifts = [];
          window.__w4Supported = PerformanceObserver.supportedEntryTypes.includes("layout-shift");
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries())
              window.__w4Shifts.push({
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
          window.__w4Actions = [];
        });
        await page.goto(`${base}/components/${id}?motion=full`);
        await page.waitForLoadState("networkidle");
        const roots = [];
        for (const file of manifest.rootMainFiles) {
          const response = await context.request.get(`${base}/_next/${file}`);
          assert.equal(response.status(), 200);
          const hash = createHash("sha256")
            .update(await response.body())
            .digest("hex");
          assert.equal(
            hash,
            createHash("sha256")
              .update(readFileSync(`${dist}/${file}`))
              .digest("hex"),
          );
          roots.push({ file, sha256: hash });
        }
        const preview = page.locator(`[data-preview="${id}"]`);
        await preview.scrollIntoViewIfNeeded();
        const mark = async (action) =>
          page.evaluate((action) => window.__w4Actions.push({ action, time: performance.now() }), action);
        await mark("scroll preview into view");
        await page.waitForTimeout(1200);
        if (id === "accordion") {
          const trigger = preview.getByRole("button", { name: "Can I reduce the motion?", exact: true });
          await trigger.click();
          await mark("open motion item");
          await preview.getByRole("button", { name: "Toggle details", exact: true }).click();
          await mark("append details");
          await page.waitForTimeout(1200);
          await trigger.click();
          await mark("close motion item");
          assert.equal(await trigger.getAttribute("aria-expanded"), "false");
        } else if (id === "tabs") {
          const tab = preview.getByRole("tab", { name: "Activity", exact: true });
          await tab.click();
          await mark("select Activity");
          assert.equal(await tab.getAttribute("aria-selected"), "true");
          await preview.getByRole("button", { name: "Resize list", exact: true }).click();
          await mark("resize list");
          await page.waitForTimeout(1200);
          await preview.getByRole("tab", { name: "Overview", exact: true }).click();
          await mark("select Overview");
        } else {
          const trigger = preview.getByRole("combobox", { name: "Framework", exact: true });
          await trigger.click();
          await mark("open Framework");
          await page.getByRole("option", { name: "Astro", exact: true }).click();
          await mark("choose Astro");
          assert.match(await trigger.innerText(), /Astro/);
          await page.waitForTimeout(1200);
          await trigger.click();
          await page.keyboard.press("Escape");
          await mark("reopen and Escape");
        }
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await mark("scroll bottom");
        await page.waitForTimeout(1200);
        await page.evaluate(() => window.scrollTo(0, 0));
        await mark("scroll top");
        await page.waitForTimeout(15000);
        const sample = await page.evaluate(() => ({
          supported: window.__w4Supported,
          shifts: window.__w4Shifts,
          actions: window.__w4Actions,
          endTime: performance.now(),
          modes: [
            ...new Set([...document.querySelectorAll("[data-motion]")].map((node) => node.getAttribute("data-motion"))),
          ],
        }));
        assert.ok(sample.supported);
        assert.ok(sample.modes.includes("full"));
        assert.deepEqual(errors, []);
        const cls = summarizeLayoutShifts(sample.shifts);
        report.records.push({
          id,
          width,
          browser: browser.version(),
          roots,
          errors,
          ...sample,
          cls,
          passed: cls < 0.02,
        });
        writeFileSync("docs/evidence/w4-interaction-cls.json", `${JSON.stringify(report, null, 2)}\n`);
        console.log(`${id} ${width}: CLS ${cls}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
process.exitCode = report.records.every((record) => record.passed) ? 0 : 1;
