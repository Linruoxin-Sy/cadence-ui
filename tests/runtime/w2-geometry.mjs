import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync as ensureAuditDirectory, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { readEvidence } from "./evidence-file.mjs";
import { observeAnimate } from "./observe-animate.mjs";

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
const old = negative ? readEvidence("tests/fixtures/motion/geometry.json").sources : null;
if (negative) report.sources = old;
const server = await createServer({
  ...config,
  plugins: negative
    ? [
        observeAnimate,
        {
          name: "w2-exact-negative",
          enforce: "pre",
          async load(id) {
            const match = Object.keys(old).find((k) =>
              id.replaceAll("\\", "/").endsWith(`/registry/cadence/${k}/index.tsx`),
            );
            if (match)
              return (await transformWithEsbuild(old[match].text, id, { loader: "tsx", jsx: "automatic" })).code;
          },
        },
      ]
    : [observeAnimate],
  configFile: false,
  logLevel: "error",
  esbuild: { jsx: "automatic" },
  server: { ...config.server, port: 3181 },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  await server.listen();
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"])
      for (const kind of ["select", "code", "sidebar", "calendar", "tabs"]) {
        const page = await browser.newPage({ reducedMotion: os });
        page.on("pageerror", (e) => report.errors.push(`${kind}: ${e.stack}`));
        const label = `${kind}/${mode}/${os}`;
        if (process.env.W2_FILTER && !label.includes(process.env.W2_FILTER)) {
          await page.close();
          continue;
        }
        const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
        const record = async (name, patch, verify) => {
          const r = await page.evaluate((p) => window.updateW2(p), patch);
          await page.waitForFunction((r) => window.w2frames?.some((s) => s.request === r && s.phase === "paint2"), r);
          const samples = await page.evaluate((r) => window.w2frames.filter((s) => s.request === r), r);
          report.cases.push({ label, name, samples });
          try {
            const paints = samples.filter((s) => ["paint1", "paint2"].includes(s.phase));
            assert.equal(paints.length, 2);
            assert(paints.every((s) => s.parts.length > 0));
            verify?.(paints);
          } catch (e) {
            report.failures.push(`${label}/${name}: ${e.message}`);
          }
          return samples;
        };
        await page.goto(`http://127.0.0.1:3181/w2-geometry.html?kind=${kind}&mode=${mode}`);
        await page.waitForFunction(() => window.w2frames?.some((s) => s.phase === "paint2" && s.parts.length));
        report.cases.push({
          label,
          name: "initial",
          samples: await page.evaluate(() => window.w2frames.filter((s) => s.request === 0)),
        });
        await record("async controlled target", { selected: true });
        await page.waitForTimeout(90);
        const partial = await page.evaluate(() => window.sampleW2("partial"));
        report.cases.push({ label, name: "partial target", samples: [partial] });
        if (kind === "code" && effective === "full")
          try {
            const viewport = partial.parts.find((p) => p.slot === "code-block-viewport");
            assert(viewport.height > 72 && viewport.height < viewport.naturalHeight);
          } catch (e) {
            report.failures.push(`${label}/actual partial height: ${e.message}`);
          }
        if (kind === "code" || kind === "tabs") {
          const slot = kind === "code" ? "code-block-tab-indicator" : "tabs-indicator";
          const moving = partial.parts.find((p) => p.slot === slot);
          await record("actual in-flight projection reversal", { selected: false }, (paints) => {
            if (effective === "full") {
              for (const f of paints) {
                const p = f.parts.find((p) => p.slot === slot);
                assert(p);
                assert(Math.abs(p.left - moving.left) < 10);
              }
            }
          });
          await page.waitForTimeout(60);
          await record("actual second reversal", { selected: true });
          await page.waitForTimeout(60);
        }
        const final = (paints) => {
          for (const s of paints)
            for (const p of s.parts) {
              if (kind === "select") assert(Math.abs(p.width - p.naturalWidth) < 1);
              if (kind === "code" && p.slot === "code-block-viewport") assert(Math.abs(p.height - p.naturalHeight) < 1);
              if (kind === "sidebar") assert(Math.abs(p.x - (effective === "full" ? -250 : 0)) < 1);
              if (kind === "calendar") {
                assert.equal(p.opacity, 1);
                assert.equal(p.x, 0);
                assert.equal(p.animations.filter((a) => a.state === "running").length, 0);
              }
              if (kind === "tabs" || p.slot === "code-block-tab-indicator") {
                assert.equal(p.x, 0);
                assert.equal(p.scale, 1);
              }
            }
        };
        await record("same target inherited clock zero", { clock: 0 }, final);
        await record("explicit positive and reverse", { explicit: 8, selected: false });
        await page.waitForTimeout(90);
        await record("explicit zero same target", { explicit: 0 }, (paints) => {
          for (const s of paints)
            for (const p of s.parts) {
              if (kind === "select") assert(Math.abs(p.width - p.naturalWidth) < 1);
              if (kind === "code" && p.slot === "code-block-viewport") assert.equal(p.height, 72);
              if (kind === "sidebar") assert.equal(p.x, 0);
              if (kind === "calendar") assert.equal(p.animations.length, 0);
            }
        });
        await record("partial again", { explicit: 8, selected: true });
        await page.waitForTimeout(90);
        if (kind === "code" || kind === "tabs")
          await record("actual active host resize", { width: 400, lines: 20 }, (paints) => {
            for (const f of paints) {
              const indicator = f.parts.find(
                (p) => p.slot === (kind === "code" ? "code-block-tab-indicator" : "tabs-indicator"),
              );
              assert(indicator);
              assert.equal(indicator.parentLayoutWidth, 400);
              assert.equal(indicator.layoutWidth, indicator.parentWidth);
            }
          });
        await record("async downgrade none", { mode: "none" }, (paints) => {
          for (const s of paints)
            for (const p of s.parts) {
              if (kind === "select") assert(Math.abs(p.width - p.naturalWidth) < 1);
              if (kind === "code" && p.slot === "code-block-viewport") assert(Math.abs(p.height - p.naturalHeight) < 1);
              if (kind === "sidebar" || kind === "calendar") {
                assert.equal(p.x, 0);
                assert.equal(p.animations.filter((a) => a.state === "running").length, 0);
              }
              if (kind === "tabs" || p.slot === "code-block-tab-indicator") {
                assert.equal(p.x, 0);
                assert.equal(p.scale, 1);
              }
            }
        });
        await record("reverse resize", { mode: "full", explicit: 8, selected: false, width: 400, lines: 20 });
        await page.waitForTimeout(90);
        if (kind === "sidebar") {
          await record("active scalar cleanup setup", { selected: true });
          await page.waitForTimeout(60);
          const active = await page.evaluate(() => window.sampleW2("active scalar before cleanup"));
          report.cases.push({ label, name: "active scalar before cleanup", samples: [active] });
          if (os === "no-preference")
            try {
              assert(active.drivers.length > 0);
              assert(active.drivers.some((d) => d.animating && d.value < 0 && d.value > -100));
            } catch (e) {
              report.failures.push(`${label}/actual active scalar: ${e.message}`);
            }
        }
        const detached = await record("unmount", { mounted: false }, (p) => {
          for (const s of p)
            for (const n of s.parts) {
              assert.equal(n.connected, false);
              assert.equal(n.animations.filter((a) => a.state === "running").length, 0);
            }
        });
        await page.waitForTimeout(100);
        const after = await page.evaluate(() => window.sampleW2("detached later"));
        const before = detached.at(-1);
        try {
          assert(after.drivers);
          for (const d of after.drivers) assert.equal(d.animating, false);
        } catch (e) {
          report.failures.push(`${label}/public driver cleanup: ${e.message}`);
        }
        report.cases.push({ label, name: "detached cancellation", before, after });
        try {
          assert(after.parts.length > 0);
          for (const [i, p] of after.parts.entries()) assert.equal(p.inline, before.parts[i].inline);
        } catch (e) {
          report.failures.push(`${label}/cleanup: ${e.message}`);
        }
        if (kind === "calendar")
          await record("reopen stable month", { mounted: true }, (paints) => {
            for (const f of paints) {
              assert(f.parts.length > 0);
              for (const p of f.parts) {
                assert(p.connected);
                assert.equal(p.animations.length, 0);
                assert.equal(p.opacity, 1);
                assert.equal(p.x, 0);
              }
            }
          });
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
    process.argv.find((a) => a.endsWith(".json")) || ".cache/audits/w2-geometry-current.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
