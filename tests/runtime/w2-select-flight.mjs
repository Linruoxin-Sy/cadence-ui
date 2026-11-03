import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync as ensureAuditDirectory, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { readEvidence } from "./evidence-file.mjs";

ensureAuditDirectory(".cache/audits", { recursive: true });

const require = createRequire(import.meta.url);
const { createServer, transformWithEsbuild } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const report = { sources: {}, cases: [], failures: [], errors: [], rawFrames: [] };
for (const id of ["select", "code-block", "sidebar", "calendar", "tabs"]) {
  const text = readFileSync(`registry/cadence/${id}/index.tsx`, "utf8");
  report.sources[id] = { text, sha256: createHash("sha256").update(text).digest("hex") };
}
const negative = process.argv.includes("--negative");
if (negative) report.sources.select = readEvidence("tests/fixtures/motion/select-flight.json").sources.select;
const server = await createServer({
  plugins: negative
    ? [
        {
          name: "w2-flight-exact-negative",
          enforce: "pre",
          async load(id) {
            if (id.replaceAll("\\", "/").endsWith("/registry/cadence/select/index.tsx"))
              return (await transformWithEsbuild(report.sources.select.text, id, { loader: "tsx", jsx: "automatic" }))
                .code;
          },
        },
      ]
    : [],
  ...config,
  configFile: false,
  logLevel: "error",
  esbuild: { jsx: "automatic" },
  server: { ...config.server, port: 3181 },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  await server.listen();
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const page = await browser.newPage({ reducedMotion: os });
      const label = `${mode}/${os}`;
      page.on("pageerror", (e) => report.errors.push(e.stack));
      await page.goto(`http://127.0.0.1:3181/w2-geometry.html?kind=select&mode=${mode}`);
      await page.waitForFunction(() => window.updateW2);
      await page.evaluate(() => window.updateW2({ open: true }));
      await page.getByRole("option", { name: "A long Framework label" }).click();
      await page.waitForTimeout(60);
      const partial = await page.evaluate(() => window.sampleW2("flight partial"));
      report.cases.push({ label, name: "pointer flight", samples: [partial] });
      try {
        if (mode === "full" && os === "no-preference") {
          const flight = partial.parts.find((p) => p.slot === "select-handoff");
          assert(flight);
          assert(Math.abs(flight.x) + Math.abs(flight.y) > 0);
        }
      } catch (e) {
        report.failures.push(`${label}/partial: ${e.message}`);
      }
      const update = async (name, patch) => {
        const r = await page.evaluate((p) => window.updateW2(p), patch);
        await page.waitForFunction((r) => window.w2frames.some((s) => s.request === r && s.phase === "paint2"), r);
        const samples = await page.evaluate((r) => window.w2frames.filter((s) => s.request === r), r);
        report.cases.push({ label, name, samples });
        return samples;
      };
      const zero = await update("same flight target clock zero", { clock: 0 });
      try {
        const paints = zero.filter((s) => ["paint1", "paint2"].includes(s.phase));
        assert.equal(paints.length, 2);
        for (const f of paints) {
          assert(!f.parts.some((p) => p.slot === "select-handoff"));
          assert.equal(f.parts.find((p) => p.slot === "select-value").opacity, 1);
        }
      } catch (e) {
        report.failures.push(`${label}/zero: ${e.message}`);
      }
      if (mode === "full" && os === "no-preference") {
        const finishCheck = (name, samples) => {
          try {
            const paints = samples.filter((s) => ["paint1", "paint2"].includes(s.phase));
            assert.equal(paints.length, 2);
            for (const f of paints) {
              assert(!f.parts.some((p) => p.slot === "select-handoff"));
              assert.equal(f.parts.find((p) => p.slot === "select-value").opacity, 1);
            }
          } catch (e) {
            report.failures.push(`${label}/${name}: ${e.message}`);
          }
        };
        await update("explicit flight setup", { clock: 4, explicit: 8 });
        await page.getByRole("option", { name: "B", exact: true }).click();
        await page.waitForTimeout(60);
        report.cases.push({
          label,
          name: "explicit partial flight",
          samples: [await page.evaluate(() => window.sampleW2("explicit partial"))],
        });
        finishCheck("explicit zero", await update("explicit flight zero", { explicit: 0 }));
        await update("live none setup", { explicit: 8 });
        await page.getByRole("option", { name: "A long Framework label" }).click();
        await page.waitForTimeout(60);
        finishCheck("async none", await update("async flight none", { mode: "none" }));
        await update("active cleanup setup", { mode: "full", explicit: 8 });
        await page.getByRole("option", { name: "B", exact: true }).click();
        await page.waitForTimeout(60);
      }
      await update("cleanup", { mounted: false });
      report.rawFrames.push({
        label,
        frames: await page.evaluate(() => window.w2frames),
        insertions: await page.evaluate(() => window.w2insertions || []),
      });
      await page.close();
    }
} finally {
  await browser.close();
  await server.close();
  writeFileSync(
    process.argv.find((a) => a.endsWith(".json")) || ".cache/audits/w2-select-flight.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
