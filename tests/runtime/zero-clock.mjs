import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
const { createServer, transformWithEsbuild } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const negative = process.argv.includes("--negative");
const currentSource = readFileSync("registry/cadence/lib/motion.ts", "utf8");
const sourceText = negative
  ? JSON.parse(readFileSync("docs/evidence/zero-clock-generator-negative.json", "utf8")).sourceText
  : currentSource;
const report = {
  sourceText,
  sourceSha256: createHash("sha256").update(sourceText).digest("hex"),
  cases: [],
  failures: [],
  warnings: [],
};
const server = await createServer({
  ...config,
  configFile: false,
  plugins: negative
    ? [
        {
          name: "exact-old-clock",
          enforce: "pre",
          async load(id) {
            if (id.replaceAll("\\", "/").endsWith("/registry/cadence/lib/motion.ts"))
              return (await transformWithEsbuild(sourceText, id, { loader: "ts" })).code;
          },
        },
      ]
    : [],
  logLevel: "error",
  esbuild: { jsx: "automatic" },
  server: { ...config.server, port: 3179 },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  await server.listen();
  const page = await browser.newPage({ reducedMotion: "no-preference" });
  page.on("console", (msg) => {
    if (["warning", "error"].includes(msg.type())) report.warnings.push(msg.text());
  });
  page.on("pageerror", (e) => report.failures.push(e.stack));
  await page.goto("http://127.0.0.1:3179/zero-clock.html");
  await page.waitForFunction(() => window.clockSamples?.some((s) => s.phase === "paint2"));
  const update = async (patch) => {
    const request = await page.evaluate((patch) => {
      window.setClock(patch);
      return window.clockSamples.at(-1).request + 1;
    }, patch);
    await page.waitForFunction(
      (r) => window.clockSamples.some((s) => s.request === r && s.phase === "paint2"),
      request,
    );
    const samples = await page.evaluate((r) => window.clockSamples.filter((s) => s.request === r), request);
    return samples;
  };
  const check = (label, samples, target) => {
    report.cases.push({ label, target, samples });
    try {
      const paints = samples.filter((s) => s.phase.startsWith("paint"));
      assert.equal(paints.length, 2);
      for (const s of paints) {
        assert.equal(s.value, target);
        assert.equal(s.transform, target === 0 ? "none" : `translateX(${target}px)`);
        assert.equal(s.state, "idle");
        assert.equal(s.mode, "full");
        assert.equal(s.reduced, false);
        assert.equal(s.disabled, false);
      }
    } catch (e) {
      report.failures.push(`${label}: ${e.message}`);
    }
  };
  check("initial inherited zero", await page.evaluate(() => window.clockSamples.filter((s) => s.request === 0)), 100);
  const recipes = await page.evaluate(() => window.clockRecipes);
  for (const recipe of recipes) {
    await update({ recipe, clock: 1, nested: null, override: null, target: 0 });
    await page.waitForTimeout(400);
    check(`${recipe}: retarget zero removes delay`, await update({ clock: 0, target: 100 }), 100);
    check(`${recipe}: unrelated render stays settled`, await update({}), 100);
    check(`${recipe}: nested zero overrides positive`, await update({ clock: 4, nested: 0, target: 0 }), 0);
    check(
      `${recipe}: per-call zero overrides positive`,
      await update({ clock: 4, nested: null, override: 0, target: 100 }),
      100,
    );
  }
  for (const recipe of ["geometry.resize", "state.morph", "feedback.press", "reveal"]) {
    await update({ recipe, clock: 1, nested: null, override: null, target: 0 });
    await page.waitForTimeout(1800);
    await update({ target: 100 });
    await page.waitForFunction(() => window.clockValue.get() > 0 && window.clockValue.get() < 100);
    const partial = await page.evaluate(() => ({
      value: window.clockValue.get(),
      state: window.clockValue.isAnimating() ? "running" : "idle",
    }));
    assert(partial.value > 0 && partial.value < 100);
    report.cases.push({ label: `${recipe}: real partial positive control`, partial });
    const starts = await page.evaluate(() => window.clockStarts);
    const unrelated = await update({});
    assert(unrelated.length >= 3);
    for (const sample of unrelated) assert.equal(sample.starts, starts);
    report.cases.push({ label: `${recipe}: positive unrelated render does not restart`, samples: unrelated });
    check(`${recipe}: same-target positive to zero`, await update({ clock: 0 }), 100);
  }
  check("direct physicalSpring zero", await update({ direct: true, clock: 0, target: 0 }), 0);
  await update({ direct: false, recipe: "feedback.press", clock: 0, target: 100 });
  const button = page.getByRole("button", { name: "Zero press" });
  await button.hover();
  await page.mouse.down();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const held = await button.evaluate((n) => new DOMMatrixReadOnly(getComputedStyle(n).transform).a);
  report.cases.push({ label: "actual Base Button full zero held", held });
  try {
    assert(Math.abs(held - 0.97) < 0.00001);
  } catch (e) {
    report.failures.push(e.stack);
  }
  await page.mouse.up();
  await update({ recipe: "geometry.resize", clock: 1, target: 0 });
  await page.waitForFunction(() => window.clockValue.get() > 0 && window.clockValue.get() < 100);
  const old = await page.evaluate(() => window.clockValue.get());
  await page.evaluate(() => window.setClock({ mounted: false }));
  await page.waitForTimeout(80);
  const cleanup = await page.evaluate(() => ({
    stopped: window.clockCleanup,
    value: window.clockValue.get(),
    running: window.clockValue.isAnimating(),
  }));
  report.cases.push({ label: "cleanup from actual partial motion", old, ...cleanup });
  assert.equal(cleanup.stopped.frames.length, 2);
  for (const sample of cleanup.stopped.frames) assert.equal(sample.value, cleanup.stopped.value);
  assert.equal(cleanup.running, false);
  assert.equal(cleanup.value, cleanup.stopped.value);
  report.rawSamples = await page.evaluate(() => window.clockSamples);
  assert.equal(currentSource, readFileSync("registry/cadence/lib/motion.ts", "utf8"));
} catch (e) {
  report.failures.push(e.stack);
} finally {
  await browser.close();
  await server.close();
}
writeFileSync(
  `docs/evidence/zero-clock-${negative ? "negative" : "runtime"}.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log({ cases: report.cases.length, failures: report.failures.length, warnings: report.warnings.length });
if (report.failures.length) process.exitCode = 1;
