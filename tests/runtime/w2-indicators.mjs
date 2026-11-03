import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync as ensureAuditDirectory, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

ensureAuditDirectory(".cache/audits", { recursive: true });

const require = createRequire(import.meta.url);
const { createServer } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const report = { sources: {}, cases: [], failures: [], errors: [], rawFrames: [] };
for (const id of ["dropdown-menu", "context-menu", "select", "combobox", "lib/control-animation"]) {
  const text = readFileSync(`registry/cadence/${id}${id.startsWith("lib/") ? ".tsx" : "/index.tsx"}`, "utf8");
  report.sources[id] = { text, sha256: createHash("sha256").update(text).digest("hex") };
}
const server = await createServer({
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
    for (const mode of ["full", "reduced", "none"])
      for (const kind of ["dropdown", "context", "select", "combobox"]) {
        const page = await browser.newPage({ reducedMotion: os });
        page.on("pageerror", (e) => report.errors.push(e.stack));
        const label = `${kind}/${mode}/${os}`;
        const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
        const record = async (name, patch, verify) => {
          let samples;
          if (patch) {
            const r = await page.evaluate((p) => window.updateW2(p), patch);
            await page.waitForFunction((r) => window.w2frames.some((s) => s.request === r && s.phase === "paint2"), r);
            samples = await page.evaluate((r) => window.w2frames.filter((s) => s.request === r), r);
          } else samples = await page.evaluate(() => window.w2frames.filter((s) => s.request === 0));
          report.cases.push({ label, name, samples });
          try {
            const paints = samples.filter((s) => ["paint1", "paint2"].includes(s.phase));
            assert.equal(paints.length, 2);
            assert(paints.every((s) => s.parts.length === (kind === "dropdown" || kind === "context" ? 3 : 2)));
            verify?.(paints);
          } catch (e) {
            report.failures.push(`${label}/${name}: ${e.message}`);
          }
          return samples;
        };
        await page.goto(`http://127.0.0.1:3181/w2-indicators.html?kind=${kind}&mode=${mode}`);
        await page.waitForFunction(() => window.w2frames.some((s) => s.phase === "paint2" && s.parts.length));
        const target = (paints, selected, instant) => {
          for (const s of paints)
            for (const [i, p] of s.parts.entries()) {
              const checked =
                kind === "dropdown" || kind === "context"
                  ? i < 2
                    ? selected
                    : !selected
                  : i === 0
                    ? selected
                    : !selected;
              assert.equal(p.mode, effective);
              if (effective !== "full") assert(Math.abs(p.scale - 1) < 0.001);
              if (instant) assert.equal(p.opacity, checked ? 1 : 0);
            }
        };
        await page.waitForFunction(
          (n) => window.w2insertions.some((s) => s.phase === "paint2" && s.parts.length === n),
          kind === "dropdown" || kind === "context" ? 3 : 2,
        );
        const insertion = await page.evaluate(() => window.w2insertions);
        report.cases.push({ label, name: "actual host insertion", samples: insertion });
        try {
          const paints = insertion.filter(
            (s) =>
              s.phase.startsWith("paint") && s.parts.length === (kind === "dropdown" || kind === "context" ? 3 : 2),
          );
          assert(paints.length >= 2);
          target(paints, false, true);
        } catch (e) {
          report.failures.push(`${label}/initial actual hosts: ${e.message}`);
        }
        await record("async controlled selection", { selected: true }, (p) => target(p, true, effective === "none"));
        await page.waitForTimeout(70);
        await record("same-target inherited clock zero", { clock: 0 }, (p) => target(p, true, true));
        await record("explicit clock override", { explicit: 8, selected: false }, (p) =>
          target(p, false, effective === "none"),
        );
        await page.waitForTimeout(70);
        await record("same-target explicit zero", { explicit: 0 }, (p) => target(p, false, true));
        await record("restore and reverse", { explicit: 8, selected: true }, (p) =>
          target(p, true, effective === "none"),
        );
        await page.waitForTimeout(70);
        await record("async none cancellation", { mode: "none" }, (p) => {
          for (const s of p)
            for (const [i, n] of s.parts.entries()) {
              assert.equal(n.mode, "none");
              assert.equal(n.scale, 1);
              assert.equal(n.opacity, (kind === "dropdown" || kind === "context" ? i < 2 : i === 0) ? 1 : 0);
            }
        });
        await record("partial restart", { mode: "full", selected: false, explicit: 8 });
        await page.waitForTimeout(60);
        const partial = await page.evaluate(() => window.sampleW2("before-unmount"));
        report.cases.push({ label, name: "real partial before cleanup", samples: [partial] });
        const detached = await record("cleanup", { mounted: false }, (p) => {
          for (const s of p)
            for (const n of s.parts) {
              assert.equal(n.connected, false);
              assert.equal(n.animations.filter((a) => a.state === "running").length, 0);
            }
        });
        await page.waitForTimeout(70);
        const after = await page.evaluate(() => window.sampleW2("after-unmount"));
        const before = detached.at(-1);
        report.cases.push({ label, name: "detached trajectory", before, after });
        try {
          assert(after.parts.length > 0);
          for (const [i, p] of after.parts.entries()) {
            assert.equal(p.id, before.parts[i].id);
            assert.equal(p.inline, before.parts[i].inline);
          }
        } catch (e) {
          report.failures.push(`${label}/detached: ${e.message}`);
        }
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
  writeFileSync(process.argv[2] || ".cache/audits/w2-indicators-initial.json", JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
