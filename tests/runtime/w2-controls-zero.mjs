import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
const { createServer } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const report = { sources: {}, cases: [], failures: [], errors: [], rawFrames: [] };
for (const id of [
  "checkbox/index",
  "radio-group/index",
  "switch/index",
  "slider/index",
  "progress/index",
  "input-otp/index",
  "lib/control-animation",
  "lib/provider",
  "lib/press-button",
]) {
  const text = readFileSync(`registry/cadence/${id}.tsx`, "utf8");
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
  for (const os of ["no-preference", "reduce"]) {
    const page = await browser.newPage({ reducedMotion: os });
    page.on("pageerror", (e) => report.errors.push(e.stack));
    const label = `full zero/${os}`;
    await page.goto("http://127.0.0.1:3181/controls.html?mode=full");
    await page.waitForFunction(() => window.controlFrames?.some((f) => f.phase === "paint2"));
    let request = 0;
    const update = async (name, patch, verify) => {
      const probeRequest = ++request;
      await page.evaluate((p) => window.updateControls(p), { ...patch, probeRequest });
      await page.waitForFunction(
        (r) => window.controlFrames.some((f) => f.state.probeRequest === r && f.phase === "paint2"),
        probeRequest,
      );
      const samples = await page.evaluate(
        (r) => window.controlFrames.filter((f) => f.state.probeRequest === r),
        probeRequest,
      );
      report.cases.push({ label, name, samples });
      try {
        const paints = samples.filter((f) => ["paint1", "paint2"].includes(f.phase));
        assert.equal(paints.length, 2);
        for (const f of paints) {
          assert(f.parts.length >= 13);
          verify?.(f);
        }
      } catch (e) {
        report.failures.push(`${label}/${name}: ${e.message}`);
      }
      return samples;
    };
    const final = (f) => {
      const part = (n) => {
        const p = f.parts.find((p) => p.probe === n);
        assert(p, `missing ${n}`);
        return p;
      };
      assert.equal(part("otp").opacity, 1);
      assert.equal(part("otp").scale, 1);
      assert.equal(part("otp").text, f.state.char);
      assert.equal(part("checkbox").opacity, 1);
      assert.equal(part("radio-a").opacity, 1);
      assert.equal(part("radio-b").opacity, 0);
      assert.equal(part("radio-b").scale, os === "reduce" ? 1 : 0.96);
      assert.equal(part("switch").x, 32);
      for (const n of ["progress", "composed", "composed-default"]) assert(Math.abs(part(n).scale - 0.8) < 0.0001);
      assert.equal(part("slider").scale, 1);
    };
    await update("async full zero new values and character", { clock: 0, checked: true, value: 80, char: "7" }, final);
    await update("positive reset", { clock: 8, checked: false, value: 20, char: "" });
    await update("positive moving values", { checked: true, value: 80, char: "9" });
    await page.waitForTimeout(60);
    report.cases.push({
      label,
      name: "actual positive partial",
      samples: [await page.evaluate(() => window.sampleControls("partial"))],
    });
    await update("same targets explicit zero", { explicit: 0 }, final);
    await update("unmount", { mounted: false });
    report.rawFrames.push({ label, frames: await page.evaluate(() => window.controlFrames) });
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
  writeFileSync(process.argv[2] || "docs/evidence/w2-controls-zero.json", JSON.stringify(report, null, 2) + "\n");
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
