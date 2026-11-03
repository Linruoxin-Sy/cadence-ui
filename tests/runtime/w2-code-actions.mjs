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
for (const id of ["select", "code-block", "sidebar", "calendar", "tabs"]) {
  const text = readFileSync(`registry/cadence/${id}/index.tsx`, "utf8");
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
    for (const mode of ["full", "reduced", "none"]) {
      const page = await browser.newPage({ reducedMotion: os, permissions: ["clipboard-read", "clipboard-write"] });
      const label = `${mode}/${os}`;
      page.on("pageerror", (e) => report.errors.push(e.stack));
      await page.goto(`http://127.0.0.1:3181/w2-geometry.html?kind=code&mode=${mode}`);
      await page.waitForFunction(() => window.w2frames?.some((s) => s.phase === "paint2" && s.parts.length === 6));
      const action = async (name, run, attr) => {
        await page.evaluate(
          ({ attr }) => {
            window.w2actions = [];
            const o = new MutationObserver((records) => {
              if (!records.some((r) => r.attributeName === attr)) return;
              o.disconnect();
              const sample = (p) => window.w2actions.push(window.sampleW2(p));
              sample("commit");
              requestAnimationFrame(() => {
                sample("paint1");
                requestAnimationFrame(() => sample("paint2"));
              });
            });
            o.observe(document.body, { attributes: true, subtree: true, attributeFilter: [attr] });
          },
          { attr },
        );
        await run();
        await page.waitForFunction(() => window.w2actions.some((s) => s.phase === "paint2"));
        const samples = await page.evaluate(() => window.w2actions);
        report.cases.push({ label, name, samples });
        return samples;
      };
      const update = async (name, patch) => {
        const r = await page.evaluate((p) => window.updateW2(p), patch);
        await page.waitForFunction((r) => window.w2frames.some((s) => s.request === r && s.phase === "paint2"), r);
        const samples = await page.evaluate((r) => window.w2frames.filter((s) => s.request === r), r);
        report.cases.push({ label, name, samples });
        return samples;
      };
      const check = (name, samples, verify) => {
        try {
          const paints = samples.filter((s) => ["paint1", "paint2"].includes(s.phase));
          assert.equal(paints.length, 2);
          assert(paints.every((s) => s.parts.length === 6));
          verify(paints);
        } catch (e) {
          report.failures.push(`${label}/${name}: ${e.message}`);
        }
      };
      const hover = await action(
        "native hover floating actions",
        () => page.locator("[data-slot=code-block]").hover(),
        "data-revealed",
      );
      if (mode === "none")
        check("initial none hover", hover, (p) => {
          for (const f of p) assert.equal(f.parts.find((n) => n.slot === "code-block-actions").opacity, 1);
        });
      await page.waitForTimeout(60);
      const zero = await update("same target floating clock zero", { clock: 0 });
      check("floating zero", zero, (p) => {
        for (const f of p) assert.equal(f.parts.find((n) => n.slot === "code-block-actions").opacity, 1);
      });
      await update("restore clock", { clock: 8 });
      await action(
        "real clipboard copy glyphs",
        () => page.locator("[data-slot=code-block-copy-button]").click(),
        "data-copied",
      );
      await page.waitForTimeout(60);
      const copyZero = await update("copy glyph same target zero", { clock: 0 });
      check("copy zero", copyZero, (p) => {
        for (const f of p) {
          const spans = f.parts.filter((n) => !n.slot);
          assert.equal(spans[0].opacity, 0);
          assert.equal(spans[1].opacity, 1);
          assert.equal(spans[0].scale, mode === "full" && os === "no-preference" ? 0.96 : 1);
          assert.equal(spans[1].scale, 1);
        }
      });
      await update("controlled expand and tab reverse", { clock: 8, selected: true });
      await page.waitForTimeout(60);
      const cancel = await update("async glyph and viewport none", { mode: "none" });
      check("glyph none", cancel, (p) => {
        for (const f of p) {
          const spans = f.parts.filter((n) => !n.slot);
          assert.equal(spans[0].opacity, 1);
          assert.equal(spans[1].opacity, 0);
          assert.equal(spans[2].scale, -1);
          assert.equal(f.parts.find((n) => n.slot === "code-block-viewport").height, 324);
        }
      });
      await update("reentry and reverse", { mode: "full", selected: false, clock: 8 });
      await page.mouse.move(700, 500);
      await page.waitForTimeout(60);
      const before = await update("cleanup", { mounted: false });
      await page.waitForTimeout(80);
      const after = await page.evaluate(() => window.sampleW2("detached"));
      report.cases.push({ label, name: "detached", before: before.at(-1), after });
      try {
        assert(after.parts.length === 6);
        for (const [i, n] of after.parts.entries()) {
          assert(!n.connected);
          assert.equal(n.inline, before.at(-1).parts[i].inline);
        }
      } catch (e) {
        report.failures.push(`${label}/cleanup: ${e.message}`);
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
  writeFileSync(
    process.argv[2] || ".cache/audits/w2-code-actions-current.json",
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
