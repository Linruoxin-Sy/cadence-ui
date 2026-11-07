import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { observeAnimate } from "./observe-animate.mjs";

const output = process.argv.find((argument) => argument.endsWith(".json")) ?? ".cache/audits/w2-toc.json";
mkdirSync(path.dirname(output), { recursive: true });
const require = createRequire(import.meta.url);
const { createServer } = await import(
  pathToFileURL(require.resolve("vite", { paths: [path.dirname(require.resolve("vitest/node"))] }))
);
const config = (await import("./vite.config.mjs")).default;
const port = Number(process.env.W2_TOC_PORT ?? 3182);
const sourceFile = process.env.W2_TOC_SOURCE ?? "registry/cadence/toc/index.tsx";
const source = readFileSync(sourceFile, "utf8");
const report = {
  source: { file: sourceFile, text: source, sha256: createHash("sha256").update(source).digest("hex") },
  cases: [],
  failures: [],
  errors: [],
};
const server = await createServer({
  ...config,
  plugins: [
    observeAnimate,
    ...(process.env.W2_TOC_SOURCE
      ? [
          {
            name: "w2-toc-exact-source",
            enforce: "pre",
            load(id) {
              if (id.replaceAll("\\", "/").endsWith("/registry/cadence/toc/index.tsx")) return source;
            },
          },
        ]
      : []),
  ],
  configFile: false,
  logLevel: "error",
  esbuild: { jsx: "automatic" },
  server: { ...config.server, port },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
report.browser = browser.version();
const frames = (page, count = 3) =>
  page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
try {
  await server.listen();
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const label = `${mode}/${os}`;
      const page = await browser.newPage({ reducedMotion: os });
      page.on("pageerror", (error) => report.errors.push(`${label}: ${error.stack}`));
      const full = mode === "full" && os === "no-preference";
      const check = async (name, run) => {
        try {
          await run();
          report.cases.push({ label, name, sample: await page.evaluate(() => window.sampleToc()) });
        } catch (error) {
          report.failures.push(`${label}/${name}: ${error.stack}`);
        }
      };
      await page.goto(`http://127.0.0.1:${port}/w2-toc.html?mode=${mode}&keep=yes`);
      await page.waitForFunction(
        () => window.patchToc && document.querySelector("[data-slot=toc-indicator]")?.style.visibility === "visible",
      );
      await check("actual endpoint drivers, reversal and zero clock", async () => {
        assert.equal(await page.evaluate(() => (window.w2drivers || []).length), 0);
        await page.evaluate(() => window.patchToc({ active: "end", clock: 4 }));
        await frames(page, 4);
        const sample = await page.evaluate(() => window.sampleToc());
        if (full) {
          assert.equal(sample.drivers.length, 2);
          assert(sample.drivers.some((driver) => driver.animating));
          assert(sample.marker.top > 0 && sample.marker.top < sample.active.top);
        } else {
          assert.equal(sample.drivers.length, 0);
          assert.equal(sample.marker.transform, "none");
        }
        const reverse = await page.evaluate(() => {
          const before = window.sampleToc();
          window.patchToc({ active: "middle" });
          return { before, after: window.sampleToc() };
        });
        if (full) assert(Math.abs(reverse.after.marker.top - reverse.before.marker.top) < 1);
        await page.evaluate(() => window.patchToc({ clock: 0 }));
        await frames(page);
        const settled = await page.evaluate(() => window.sampleToc());
        assert(Math.abs(settled.marker.top - settled.active.top) < 1);
        assert(Math.abs(settled.marker.height - settled.active.height) < 1);
        assert(settled.drivers.every((driver) => !driver.animating));
      });
      await check("natural scroll completion and original history/focus", async () => {
        await page.evaluate(() => {
          window.patchToc({ clock: 1 });
          history.replaceState({ kept: true }, "", location.href);
          document.getElementById("host").scrollLeft = 5;
          window.tocFrames.length = 0;
        });
        await page.locator('a[href="#end"]').click();
        await page.waitForFunction(() => document.activeElement?.id === "end");
        const result = await page.evaluate(() => ({
          sample: window.sampleToc(),
          hash: location.hash,
          search: location.search,
          state: history.state,
          frames: window.tocFrames,
          events: window.tocEvents,
        }));
        assert.equal(result.hash, "#end");
        assert(result.search.includes("keep=yes"));
        assert.equal(result.state.kept, true);
        assert.equal(result.sample.left, 5);
        assert.equal(await page.locator("h2#end").getAttribute("tabindex"), "0");
        const numeric = result.sample.drivers.filter((driver) => driver.numeric);
        if (full) {
          assert(numeric.length > 0, "Expected observed real scroll driver");
          assert(new Set(result.frames.map((frame) => frame.scroll)).size > 3);
        } else assert.equal(numeric.length, 0);
        assert(result.sample.drivers.every((driver) => !driver.animating));
      });
      if (full) {
        for (const input of ["wheel", "touchstart", "pointerdown", "resize", "popstate", "hashchange", "keydown"])
          await check(`cancel by ${input}`, async () => {
            await page.evaluate(() => {
              document.getElementById("input").focus();
              window.patchToc({ clock: 4 });
            });
            await page.locator('a[href="#intro"]').click();
            await frames(page, 4);
            await page.evaluate(
              (input) =>
                window.dispatchEvent(
                  input === "keydown" ? new KeyboardEvent(input, { key: "Escape" }) : new Event(input),
                ),
              input,
            );
            const before = await page.evaluate(() => window.sampleToc());
            await frames(page, 10);
            const after = await page.evaluate(() => window.sampleToc());
            assert.equal(after.scroll, before.scroll);
            assert.notEqual(after.focus, "intro");
            assert(after.drivers.every((driver) => !driver.animating));
          });
        for (const boundary of ["before", "queued", "after", "retime-queued"])
          await check(`completion/stop boundary ${boundary}`, async () => {
            await page.evaluate(() => {
              window.patchToc({ clock: 1 });
              document.getElementById("host").scrollTop = 0;
            });
            await page.locator('a[href="#end"]').click();
            const trace = await page.evaluate(async (boundary) => {
              const entry = window.w2drivers.filter((driver) => typeof driver.value === "number").at(-1);
              if (!entry?.controls) throw new Error("Missing real scroll controls");
              const controls = window.w2groups?.at(-1)?.controls ?? entry.controls;
              const before = window.sampleToc();
              const completion = controls.finished;
              let delivered = false;
              completion.then(() => {
                delivered = true;
              });
              let atBoundary;
              let sync;
              if (boundary === "queued" || boundary === "retime-queued") {
                controls.complete();
                await new Promise((resolve) =>
                  window.afterTocUpdate(() => {
                    atBoundary = { state: controls.state, delivered, sample: window.sampleToc() };
                    if (boundary === "retime-queued") window.patchToc({ clock: 4 });
                    else window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
                    sync = window.sampleToc();
                    resolve();
                  }),
                );
                await completion;
              }
              if (boundary === "after") {
                await completion;
                await Promise.resolve();
              }
              if (boundary === "before" || boundary === "after") {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
                sync = window.sampleToc();
              }
              for (let i = 0; i < 5; i++) await Promise.resolve();
              return { before, atBoundary, delivered, sync, after: window.sampleToc() };
            }, boundary);
            report.cases.push({ label, name: `raw boundary ${boundary}`, trace });
            if (boundary === "before" || boundary === "queued") {
              assert.equal(trace.after.scroll, trace.sync.scroll);
              assert.notEqual(trace.after.focus, "end");
            }
            if (boundary === "after") assert.equal(trace.after.focus, "end");
            if (boundary === "queued" || boundary === "retime-queued") {
              assert.equal(trace.atBoundary.state, "finished");
              assert.equal(trace.atBoundary.delivered, false);
              assert.equal(trace.delivered, true, "The real queued completion must actually be delivered");
            }
            if (boundary === "retime-queued") {
              // The old trip already reached this same destination before retiming.
              // Its queued finish remains asynchronous and cleans up the replacement.
              assert.notEqual(trace.sync.focus, "end");
              assert.equal(trace.after.focus, "end");
              assert.equal(trace.after.scroll, trace.sync.scroll);
              assert(trace.after.drivers.filter((driver) => driver.numeric).every((driver) => !driver.animating));
            }
            await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
          });
        await check("positive live retime then immediate downgrade and cleanup", async () => {
          await page.evaluate(() => window.patchToc({ clock: 4 }));
          await page.locator('a[href="#intro"]').click();
          await frames(page, 4);
          const before = await page.evaluate(() => window.sampleToc());
          await page.evaluate(() => window.patchToc({ clock: 2 }));
          const retimed = await page.evaluate(() => window.sampleToc());
          assert(
            retimed.drivers.filter((driver) => driver.numeric).length >
              before.drivers.filter((driver) => driver.numeric).length,
          );
          await page.evaluate(() => window.patchToc({ mode: "none" }));
          await frames(page);
          const after = await page.evaluate(() => window.sampleToc());
          assert.equal(after.focus, "intro");
          assert(after.drivers.every((driver) => !driver.animating));
          await page.evaluate(() => {
            window.patchToc({ mode: "full", clock: 4 });
            document.getElementById("input").focus();
          });
          await page.locator('a[href="#end"]').click();
          await frames(page, 4);
          await page.evaluate(() => window.patchToc({ mounted: false }));
          const stopped = await page.evaluate(() => window.sampleToc());
          await frames(page, 10);
          const detached = await page.evaluate(() => window.sampleToc());
          assert.equal(detached.scroll, stopped.scroll);
          assert(detached.drivers.every((driver) => !driver.animating));
        });
      }
      report.cases.push({
        label,
        name: "raw frames",
        frames: await page.evaluate(() => window.tocFrames),
        events: await page.evaluate(() => window.tocEvents),
      });
      await page.close();
    }
} finally {
  await browser.close();
  await server.close();
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
