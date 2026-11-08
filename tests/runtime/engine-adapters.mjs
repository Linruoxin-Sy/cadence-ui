import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import { cubicBezier } from "motion";
import postcss from "postcss";
import { observeAnimate } from "./observe-animate.mjs";
import { observeControllers } from "./observe-controllers.mjs";
import { observeEmbla, observeSeries } from "./observe-series.mjs";

const output = path.resolve(process.env.CADENCE_ENGINE_OUTPUT ?? `.cache/audits/engine-adapters-${Date.now()}`);
await mkdir(output, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const environment = process.env.CADENCE_ENGINE_ENV ?? "production";
const theme = process.env.CADENCE_ENGINE_THEME ?? "light";
assert(["light", "dark"].includes(theme));
const digest = (body) => createHash("sha256").update(body).digest("hex");
const observed = [];
const consumerRoot = process.env.CADENCE_ENGINE_CONSUMER_ROOT && path.resolve(process.env.CADENCE_ENGINE_CONSUMER_ROOT);
const reactRoot = process.env.CADENCE_ENGINE_REACT_ROOT && path.resolve(process.env.CADENCE_ENGINE_REACT_ROOT);
let fault;
const mutation = process.env.CADENCE_ENGINE_FAULT
  ? JSON.parse(await readFile("tests/fixtures/motion/engine-negative.json", "utf8"))[process.env.CADENCE_ENGINE_FAULT]
  : null;
const bundle = await build({
  entryPoints: ["tests/runtime/engine-adapters.jsx"],
  bundle: true,
  write: false,
  minify: environment === "production",
  metafile: true,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": JSON.stringify(environment) },
  plugins: [
    {
      name: "observe-installed-engine-owners",
      setup(builder) {
        builder.onLoad({ filter: /embla-carousel[\\/]esm[\\/]embla-carousel\.esm\.js$/ }, async (args) => {
          const original = await readFile(args.path, "utf8"),
            code = observeEmbla(original, args.path);
          assert(code, "installed Embla clock observer");
          observed.push({
            file: args.path,
            sourceSHA: digest(original),
            observedSHA: digest(code),
            kind: "installed-native-RAF",
          });
          return { contents: code, loader: "js", resolveDir: path.dirname(args.path) };
        });
        if (consumerRoot)
          builder.onResolve({ filter: /^\.\.\/\.\.\/registry\/cadence\// }, (args) => {
            const base = path.join(
              consumerRoot,
              "components/cadence",
              args.path.replace("../../registry/cadence/", ""),
            );
            const target = [`${base}.tsx`, `${base}.ts`, path.join(base, "index.tsx")].find(existsSync);
            assert(target, "required consumer install target; no workspace fallback");
            return { path: target };
          });
        if (reactRoot)
          builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
            path: require.resolve(args.path, { paths: [reactRoot] }),
          }));
        builder.onLoad(
          {
            filter:
              /recharts[\\/]es6[\\/](cartesian|polar)[\\/](Bar|Line|Area|Pie|Scatter|Radar|RadialBar|Funnel)\.js$/,
          },
          async (args) => {
            const original = await readFile(args.path, "utf8");
            const code = observeSeries(original, args.path);
            if (!code) return;
            observed.push({
              file: args.path,
              sourceSHA: digest(original),
              observedSHA: digest(code),
              kind: "installed-native-interpolator",
            });
            return { contents: code, loader: "js", resolveDir: path.dirname(args.path) };
          },
        );
        builder.onLoad(
          {
            filter:
              /(?:registry|components)[\\/]cadence[\\/](?:(chart|toc|calendar|carousel)[\\/]index|lib[\\/]provider)\.tsx$/,
          },
          async (args) => {
            const original = await readFile(args.path, "utf8");
            let source = original;
            if (mutation && args.path.replaceAll("\\", "/").endsWith(mutation.file)) {
              const newline = source.includes("\r\n") ? "\r\n" : "\n";
              const needle = mutation.find.replaceAll("\n", newline);
              assert.equal(source.split(needle).length, 2, "one exact fault anchor");
              source = source.replace(needle, mutation.replace.replaceAll("\n", newline));
              fault = {
                id: process.env.CADENCE_ENGINE_FAULT,
                ...mutation,
                sourceSHA: digest(original),
                executedSHA: digest(source),
              };
              await writeFile(path.join(output, "fault-source.tsx"), source);
            }
            const code =
              observeControllers.transform(source, args.path) ?? observeAnimate.transform(source, args.path) ?? source;
            observed.push({
              file: path.relative(process.cwd(), args.path),
              sourceSHA: digest(original),
              observedSHA: digest(code),
            });
            return { contents: code, loader: "tsx", resolveDir: path.dirname(args.path) };
          },
        );
      },
    },
  ],
});
const css = process.env.CADENCE_ENGINE_CSS
  ? await readFile(process.env.CADENCE_ENGINE_CSS, "utf8")
  : (
      await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
        from: path.resolve("app/globals.css"),
      })
    ).css;
await writeFile(path.join(output, "fixture.js"), bundle.outputFiles[0].contents);
await writeFile(path.join(output, "fixture.css"), css);
await writeFile(path.join(output, "fixture.jsx"), await readFile("tests/runtime/engine-adapters.jsx"));
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const harnessInputs = {};
for (const file of [
  "tests/runtime/engine-adapters.jsx",
  "tests/runtime/engine-adapters.mjs",
  "tests/runtime/observe-animate.mjs",
  "tests/runtime/observe-controllers.mjs",
  "tests/runtime/observe-series.mjs",
  "tests/fixtures/motion/engine-negative.json",
]) {
  const body = await readFile(file);
  harnessInputs[file] = digest(body);
  await writeFile(path.join(output, path.basename(file)), body);
}
const report = {
  environment,
  theme,
  completed: false,
  harnessInputs,
  consumerRoot,
  reactRoot,
  fault,
  observed,
  inputs: Object.fromEntries(
    await Promise.all(Object.keys(bundle.metafile.inputs).map(async (file) => [file, digest(await readFile(file))])),
  ),
  jsSHA: digest(bundle.outputFiles[0].contents),
  cssSHA: digest(css),
  cssSource: process.env.CADENCE_ENGINE_CSS ?? "compiled app/globals.css",
  cases: [],
  failures: [],
  errors: [],
};
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/fixture.js") {
    response.setHeader("content-type", "text/javascript");
    response.end(bundle.outputFiles[0].contents);
  } else if (url.pathname === "/fixture.css") {
    response.setHeader("content-type", "text/css");
    response.end(css);
  } else {
    response.setHeader("content-type", "text/html");
    response.end(
      `<!doctype html><html class="${theme}"><head><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script>window.engineStrict=${environment === "development"};</script><script src="/fixture.js"></script></body></html>`,
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
report.browser = browser.version();
const sample = (page) => page.evaluate(() => window.engineSample());
const frames = (page, count = 2) =>
  page.evaluate(async (count) => {
    for (let i = 0; i < count; i++) await new Promise(requestAnimationFrame);
  }, count);
const patch = async (page, values) => {
  const request = await page.evaluate((values) => window.enginePatch(values), values);
  await page.waitForFunction(
    (request) => window.engineFrames.some((f) => f.request === request && f.phase === "paint2"),
    request,
  );
  return page.evaluate((request) => window.engineFrames.filter((f) => f.request === request), request);
};
const geometry = (sample) => JSON.stringify(sample.geometry);
const settled = (s) => {
  assert(Math.abs(s.engine.location - s.engine.target) < 0.01);
  assert.equal(s.engine.raf.animationId, 0, "no autonomous native RAF remains");
};
const idle = (s) => assert.equal(s.registered, 0);
let page;
let label;
const check = async (name, run) => {
  try {
    const detail = await run();
    report.cases.push({ label, name, sample: await sample(page), detail });
  } catch (error) {
    report.failures.push({ label, name, message: error.stack, sample: await sample(page) });
    await writeFile(
      path.join(output, `failure-${report.failures.length}.json`),
      JSON.stringify(
        await page.evaluate(() => ({
          frames: window.engineFrames,
          nativeInterpolations: window.nativeInterpolations,
          events: window.engineEvents,
        })),
        null,
        2,
      ),
    );
  }
  await writeFile(
    path.join(output, "progress.json"),
    JSON.stringify(
      {
        cases: report.cases.length,
        failures: report.failures.map((f) => ({ label: f.label, name: f.name, message: f.message })),
        last: label,
      },
      null,
      2,
    ),
  );
};
const visit = async (spec, mode = "full", os = "no-preference") => {
  if (page) await page.context().close();
  const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    const NativeObserver = window.IntersectionObserver;
    window.engineIOObservers = [];
    // Preserve real records/callback arguments. The ordering case alone invokes
    // the captured callback explicitly, with its mechanism recorded in evidence.
    window.IntersectionObserver = class extends NativeObserver {
      constructor(callback, options) {
        super(callback, options);
        this.capture = { callback, observer: this, targets: [], active: true };
        window.engineIOObservers.push(this.capture);
      }
      observe(target) {
        this.capture.active = true;
        this.capture.targets.push(target);
        return super.observe(target);
      }
      disconnect() {
        this.capture.active = false;
        return super.disconnect();
      }
    };
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => report.errors.push({ label, error: error.stack }));
  label = [spec.kind, spec.series ?? spec.options ?? "native", mode, os, JSON.stringify(spec)].join("/");
  await page.goto(`${origin}/?${new URLSearchParams({ ...spec, mode })}`);
  await page.waitForFunction(() => window.enginePatch);
  if (spec.kind === "carousel") await page.waitForFunction(() => window.embla);
  if (spec.kind === "chart") await page.waitForFunction(() => window.engineSample().geometry.length);
  await frames(page, 3);
};
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const full = mode === "full" && os === "no-preference";
      for (const series of ["Bar", "Line", "Area", "Pie", "Scatter", "Radar", "RadialBar", "Funnel"]) {
        if (process.env.CADENCE_ENGINE_FILTER && !`chart/${series}`.includes(process.env.CADENCE_ENGINE_FILTER))
          continue;
        await visit({ kind: "chart", series }, mode, os);
        await check("actual series first terminal geometry in immediate modes", async () => {
          if (full) {
            const initial = await sample(page);
            const observed = initial.controllers.filter((c) => c.phaseEase !== undefined);
            assert(observed.length > 0, "an actual full action curve was sampled");
            assert(observed.every((c) => Math.abs(c.phaseEase - cubicBezier(0.1, 0.2, 0.8, 0.9)(0.5)) < 1e-9));
            return {
              legacy:
                "Full series entrance remains its existing data.transition; catalogue first-render migration is separate.",
            };
          }
          const before = await sample(page);
          await frames(page, 8);
          assert.equal(geometry(await sample(page)), geometry(before));
          idle(before);
          const inserted = await page.evaluate(() => window.engineInsertions);
          assert(inserted.length);
          for (const first of inserted.filter((s) => s.geometry.length))
            assert.equal(geometry(first), geometry(before));
          return inserted;
        });
        await patch(page, { clock: 0 });
        await patch(page, { clock: 2, revision: 1 });
        await frames(page, 4);
        await check("real controller owns clock/easing; series duration delay easing cannot bypass", async () => {
          const before = await sample(page);
          if (full) {
            assert(before.registered > 0);
            const active = before.controllers.filter((c) => c.state === "running");
            assert(active.length);
            assert(active.every((c) => Math.abs(c.duration - 1.2) < 0.00001));
            assert(active.every((c) => c.easingType === "function"));
            assert(!before.events.some((e) => e.type === "caller-easing"));
            assert(active.some((c) => c.updates.some((u) => u.value > 0 && u.value < 1)));
          } else idle(before);
          return before.controllers;
        });
        await check("positive clock retains progress and applies new deltas", async () => {
          const before = await sample(page);
          await patch(page, { clock: 4 });
          await frames(page, 3);
          const after = await sample(page);
          if (full) {
            const c = after.controllers.filter((c) => c.state === "running").at(-1);
            assert(c);
            assert.equal(c.duration, 2.4);
            assert(c.applied.some((a) => a.duration === 2400));
            assert(c.progress >= before.controllers.filter((c) => c.state === "running").at(-1).progress);
          }
          return after.controllers;
        });
        await check("zero cancels current target before paint; restore never replays", async () => {
          const zero = await patch(page, { clock: 0 });
          const final = await sample(page);
          idle(final);
          for (const f of zero.filter((f) => f.phase.startsWith("paint")))
            assert.equal(geometry(f.sample), geometry(final));
          const ends = final.events.filter((e) => e.type === "end").length;
          await patch(page, { clock: 2 });
          await frames(page, 4);
          const restored = await sample(page);
          idle(restored);
          assert.equal(geometry(restored), geometry(final));
          assert.equal(restored.events.filter((e) => e.type === "end").length, ends);
          return zero;
        });
        await patch(page, { revision: 2 });
        await frames(page, 4);
        await check("live reduced cancels same data target before first paint", async () => {
          const paints = await patch(page, { mode: "reduced" });
          const final = await sample(page);
          idle(final);
          for (const f of paints.filter((f) => f.phase.startsWith("paint")))
            assert.equal(geometry(f.sample), geometry(final));
          return paints;
        });
        await patch(page, { mode: "full", revision: 3 });
        await frames(page, 3);
        await check("live none cancels and unmount releases actual controllers", async () => {
          const paints = await patch(page, { mode: "none" });
          for (const f of paints.filter((f) => f.phase.startsWith("paint"))) idle(f.sample);
          await patch(page, { mode: "full", revision: 4 });
          await frames(page, 3);
          await patch(page, { mounted: false });
          await frames(page, 3);
          idle(await sample(page));
          return paints;
        });
      }
      if (!process.env.CADENCE_ENGINE_FILTER || "carousel".includes(process.env.CADENCE_ENGINE_FILTER)) {
        await visit({ kind: "carousel" }, mode, os);
        await check("local authored clock and retained engine/plugin identity", async () => {
          const before = await sample(page);
          assert.equal(before.engine.base, 120);
          await page.evaluate(() => window.embla.scrollTo(2));
          await frames(page, 4);
          if (!full) settled(await sample(page));
          const active = await sample(page);
          await patch(page, { clock: 4 });
          const retimed = await sample(page);
          assert.equal(retimed.engine.id, active.engine.id);
          assert.equal(retimed.engine.duration, active.engine.duration);
          assert.equal(retimed.engine.base, 240);
          if (full) assert(Math.abs(retimed.engine.location - retimed.engine.target) > 0.01);
          await patch(page, { mode: mode === "none" ? "reduced" : "none" });
          const after = await sample(page);
          assert.equal(after.engine.id, before.engine.id);
          assert.equal(
            after.events.filter((e) => e.type === "plugin-init").length,
            before.events.filter((e) => e.type === "plugin-init").length,
          );
          settled(after);
          assert(after.engine.plugins.includes("callerPlugin"));
          const completions = after.events.filter((e) => e.type === "settle").length;
          await patch(page, { mode: "reduced", clock: 0 });
          assert.equal(
            (await sample(page)).events.filter((e) => e.type === "settle").length,
            completions,
            "idle clock/mode edits never synthesize native completion",
          );
          await patch(page, { mode, clock: 4 });
          assert.equal((await sample(page)).engine.base, 240);
          return { before, active, retimed, after };
        });
        await check("held native drag survives mode and zero then immediate release", async () => {
          const viewport = page.locator("[data-slot=carousel-content]");
          const box = await viewport.boundingBox();
          await page.mouse.move(box.x + 140, box.y + 60);
          await page.mouse.down();
          await page.mouse.move(box.x + 90, box.y + 60, { steps: 4 });
          await frames(page, 2);
          const before = await sample(page);
          assert(before.engine.held);
          const framesChanged = await patch(page, { mode: "none", clock: 0 });
          const held = await sample(page);
          assert(held.engine.held);
          assert.equal(held.engine.id, before.engine.id);
          await page.mouse.move(box.x + 40, box.y + 60, { steps: 4 });
          await frames(page, 2);
          const moved = await sample(page);
          assert(moved.engine.held);
          assert(Math.abs(moved.engine.location - held.engine.location) > 20);
          await page.mouse.up();
          await frames(page, 2);
          const released = await sample(page);
          assert(!released.engine.held);
          settled(released);
          assert.equal(released.engine.duration, 0);
          return { before, framesChanged, held, moved, released };
        });
        await check("native input selection and cleanup remain available", async () => {
          await page.evaluate(() => window.embla.scrollTo(0, true));
          const input = page.getByLabel("slide a");
          await input.focus();
          await input.evaluate((node) => node.setSelectionRange(2, 8));
          await patch(page, { mode: "full", clock: 2 });
          assert.deepEqual(await input.evaluate((node) => [node.selectionStart, node.selectionEnd]), [2, 8]);
          await input.press("End");
          await input.pressSequentially("!");
          assert.equal(await input.inputValue(), "native selection!");
          await patch(page, { mounted: false });
          assert((await sample(page)).events.some((e) => e.type === "plugin-destroy"));
          assert((await sample(page)).events.some((e) => e.type === "cleanup"));
        });
      }
      if (!process.env.CADENCE_ENGINE_FILTER || "calendar".includes(process.env.CADENCE_ENGINE_FILTER)) {
        await visit({ kind: "calendar" }, mode, os);
        await check("real month table WAAPI tokens and captured handle cancellation", async () => {
          const before = await sample(page);
          await patch(page, { revision: 1 });
          const active = await sample(page);
          assert.equal(active.grid.id, before.grid.id);
          if (mode !== "none") {
            assert(active.grid.animations.length);
            const effect = active.grid.animations[0];
            assert(Math.abs(effect.timing.duration - (full ? 1200 : 720)) < 0.01);
            if (!full) assert(effect.frames.every((f) => !f.transform || f.transform === "none"));
          } else assert.equal(active.grid.animations.length, 0);
          await patch(page, { clock: 4 });
          const settled = await sample(page);
          assert.equal(settled.grid.animations.length, 0);
          assert.equal(settled.grid.opacity, "1");
          assert.equal(settled.grid.transform, "none");
          await patch(page, { clock: 0, revision: 2 });
          assert.equal((await sample(page)).grid.animations.length, 0);
          await patch(page, { clock: 2 });
          assert.equal((await sample(page)).grid.animations.length, 0);
          return { before, active, settled };
        });
        await check("caller paint and DayPicker engine ownership are preserved", async () => {
          await patch(page, { customPaint: true, revision: 3 });
          const paint = await sample(page);
          assert.equal(paint.grid.opacity, "0.7");
          assert.equal(paint.grid.transform, "matrix(1, 0, 0, 1, 3, 0)");
          assert.equal(paint.grid.animations.length, 0);
          await patch(page, { customPaint: false, nativeAnimation: true, revision: 4 });
          assert.equal((await sample(page)).grid.animations.length, 0);
          await patch(page, { mounted: false });
        });
      }
      if (!process.env.CADENCE_ENGINE_FILTER || "drawer".includes(process.env.CADENCE_ENGINE_FILTER)) {
        await visit({ kind: "drawer" }, mode, os);
        await patch(page, { open: true });
        await page.getByRole("dialog").waitFor();
        await page.waitForFunction(() =>
          document
            .querySelector('[data-slot="drawer-popup"]')
            .getAnimations()
            .every((animation) => animation.playState !== "running"),
        );
        await check("Base UI capture/native swipe variables survive same-target downgrade", async () => {
          const box = await page.locator('[data-slot="drawer-swipe-handle"]').boundingBox();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2, box.y + 40, { steps: 5 });
          await frames(page, 2);
          const before = await sample(page);
          assert(before.drawer.swiping);
          assert(before.drawer.capture);
          await patch(page, { mode: "none", clock: 0 });
          const during = await sample(page);
          assert(during.drawer.swiping);
          assert(during.drawer.capture);
          assert.equal(during.root, before.root);
          assert.equal(during.drawer.transform, before.drawer.transform);
          await page.mouse.move(box.x + box.width / 2, box.y + 85, { steps: 4 });
          await frames(page, 2);
          const moved = await sample(page);
          assert.notEqual(moved.drawer.y, during.drawer.y);
          await page.mouse.up();
          await frames(page, 3);
          const released = await sample(page);
          if (released.drawer) {
            assert(!released.drawer.swiping);
            assert(released.drawer.animations.every((a) => a.property !== "transform" || a.duration === 0));
          }
          return { before, during, moved, released };
        });
        await check("native drawer input and unmount refs retain lifecycle", async () => {
          await patch(page, { open: true });
          const input = page.getByLabel("drawer input");
          await input.fill("native editing");
          await input.selectText();
          await patch(page, { mode: "reduced" });
          assert.equal(await input.inputValue(), "native editing");
          await patch(page, { mounted: false });
          assert((await sample(page)).events.some((e) => e.type === "cleanup"));
        });
      }
    }
  if (!process.env.CADENCE_ENGINE_FILTER || "carousel".includes(process.env.CADENCE_ENGINE_FILTER))
    for (const spec of [
      { options: "explicit" },
      { options: "breakpoint" },
      { global: "true" },
      { pluginDuration: "true" },
      { axis: "vertical" },
    ]) {
      await visit({ kind: "carousel", ...spec });
      await check("actual effective options survive API reInit and positive/mode clocks", async () => {
        const before = await sample(page);
        const expected =
          spec.options === "explicit"
            ? 29
            : spec.options === "breakpoint"
              ? 57
              : spec.global
                ? 61
                : spec.pluginDuration
                  ? 67
                  : 120;
        assert.equal(before.engine.base, expected);
        await patch(page, { clock: 4, mode: "reduced" });
        assert.equal((await sample(page)).engine.base, expected === 120 ? 240 : expected);
        await page.evaluate(() =>
          window.embla.reInit({ duration: 73, breakpoints: { "(min-width:600px)": { duration: 79 } } }),
        );
        const reinit = await sample(page);
        assert.notEqual(reinit.engine.id, before.engine.id);
        assert.equal(reinit.engine.base, spec.pluginDuration ? 67 : 79);
        await patch(page, { clock: 2, mode: "full" });
        const after = await sample(page);
        assert.equal(after.engine.id, reinit.engine.id);
        assert.equal(after.engine.base, spec.pluginDuration ? 67 : 79);
        await page.evaluate(() => window.embla.scrollTo(2));
        await frames(page, 3);
        assert.equal((await sample(page)).engine.duration, spec.pluginDuration ? 67 : 79);
        return { before, reinit, after };
      });
      await check("full native release uses actual effective base on both drag axes", async () => {
        const box = await page.locator('[data-slot="carousel-content"]').boundingBox();
        const vertical = spec.axis === "vertical";
        const x = box.x + (vertical ? 30 : 180),
          y = box.y + (vertical ? 180 : 90);
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x - (vertical ? 0 : 65), y - (vertical ? 65 : 0), { steps: 6 });
        await frames(page, 2);
        const held = await sample(page);
        assert(held.engine.held);
        await page.mouse.up();
        const released = await sample(page);
        assert(!released.engine.held);
        assert.equal(released.engine.duration, released.engine.base);
        assert.equal(released.engine.base, spec.pluginDuration ? 67 : 79);
        assert(released.engine.duration !== 25 && released.engine.duration !== 43);
        return { held, released };
      });
    }
  if (!process.env.CADENCE_ENGINE_FILTER || "carousel".includes(process.env.CADENCE_ENGINE_FILTER))
    for (const spec of [{}, { options: "explicit" }, { portal: "true" }]) {
      await visit({ kind: "carousel", ...spec });
      await check("source-zero/full restoration, effective override removal and portal token priority", async () => {
        const before = await sample(page);
        const inherited = spec.options ? 29 : spec.portal ? 140 : 120;
        assert.equal(before.engine.base, inherited);
        await patch(page, { effective: "0.9s", clock: 3 });
        assert.equal((await sample(page)).engine.base, spec.options ? 29 : 90);
        await patch(page, { effective: undefined, base: "0.4s", clock: 2 });
        assert.equal((await sample(page)).engine.base, spec.options ? 29 : 80);
        await patch(page, { base: "0s" });
        await page.evaluate(() => window.embla.scrollTo(3));
        await frames(page, 2);
        const zero = await sample(page);
        assert.equal(zero.mode, "full");
        assert.equal(zero.engine.duration, 0);
        settled(zero);
        await patch(page, { base: spec.portal ? undefined : "0.6s" });
        const restored = await sample(page);
        assert.equal(restored.engine.base, inherited);
        assert.equal(restored.engine.id, before.engine.id);
        assert.equal(restored.engine.selected, zero.engine.selected);
        assert.equal(
          restored.events.filter((e) => e.type === "plugin-init").length,
          before.events.filter((e) => e.type === "plugin-init").length,
        );
        await page.evaluate(() => window.embla.scrollTo(1));
        assert.equal((await sample(page)).engine.duration, inherited);
        return { before, zero, restored };
      });
    }
  if (!process.env.CADENCE_ENGINE_FILTER || "carousel".includes(process.env.CADENCE_ENGINE_FILTER)) {
    for (const surface of ["ordinary", "pointer-events-none", "covered", "narrow-inset"]) {
      await visit({ kind: "carousel", initialOffscreen: "true" });
      await check(`new native command revalidates stale intersection on ${surface}`, async () => {
        const before = await sample(page);
        const boundary = await page.evaluate((surface) => {
          const root = document.querySelector('[data-slot="carousel"]');
          if (surface === "pointer-events-none") root.style.pointerEvents = "none";
          if (surface === "narrow-inset") root.style.clipPath = "inset(0 0 99.99% 0)";
          if (surface === "covered") {
            const cover = document.createElement("div");
            Object.assign(cover.style, { position: "fixed", inset: "0", zIndex: "9999", background: "white" });
            document.body.append(cover);
          }
          const original = HTMLElement.prototype.getBoundingClientRect;
          let reads = 0;
          HTMLElement.prototype.getBoundingClientRect = function (...args) {
            reads++;
            return original.apply(this, args);
          };
          try {
            const setNativeDuration = window.embla.internalEngine().scrollBody.useDuration;
            for (let index = 0; index < 200; index++) setNativeDuration(55);
            const setterReads = reads;
            root.scrollIntoView({ behavior: "instant", block: "center" });
            window.embla.scrollTo(3, false);
            const commandReads = reads - setterReads;
            return { setterReads, commandReads, immediate: window.engineSample() };
          } finally {
            HTMLElement.prototype.getBoundingClientRect = original;
          }
        }, surface);
        assert.equal(boundary.setterReads, 0, "native duration setters never poll layout");
        const { immediate } = boundary;
        assert.equal(immediate.engine.duration, 120);
        assert.equal(immediate.engine.base, 120);
        assert.equal(immediate.engine.selected, 3);
        assert(immediate.engine.raf.animationId > 0);
        assert.notEqual(immediate.engine.location, immediate.engine.target);
        assert(boundary.commandReads > 0 && boundary.commandReads <= 33);
        await frames(page, 6);
        const moving = await sample(page);
        assert.notEqual(moving.engine.location, immediate.engine.location);
        await patch(page, { mode: "none" });
        settled(await sample(page));
        return { before, boundary, moving };
      });
    }
    await visit({ kind: "carousel", initialOffscreen: "true" });
    await check("older delivered records cannot cancel fresh native action; newest batch record wins", async () => {
      const boundary = await page.evaluate(() => {
        const root = document.querySelector('[data-slot="carousel"]');
        root.scrollIntoView({ behavior: "instant", block: "center" });
        window.embla.scrollTo(3, false);
        const observed = window.engineIOObservers.find((record) => record.active && record.targets.includes(root));
        const now = performance.now();
        observed.callback([{ target: root, time: 0, isIntersecting: false, intersectionRatio: 0 }], observed.observer);
        return {
          sample: window.engineSample(),
          now,
          mechanism: "explicit delayed-record callback delivery; real IO remains active",
        };
      });
      assert(boundary.sample.engine.raf.animationId > 0);
      await frames(page, 2);
      const batch = await page.evaluate(() => {
        const root = document.querySelector('[data-slot="carousel"]');
        const observed = window.engineIOObservers.find((record) => record.active && record.targets.includes(root));
        const now = performance.now();
        observed.callback(
          [
            { target: root, time: now - 1, isIntersecting: false, intersectionRatio: 0 },
            { target: root, time: now, isIntersecting: true, intersectionRatio: 1 },
          ],
          observed.observer,
        );
        return { sample: window.engineSample(), now, mechanism: "explicit ordered timestamps in one delivered batch" };
      });
      assert(batch.sample.engine.raf.animationId > 0);
      await patch(page, { appearanceClip: true });
      await frames(page, 3);
      const actualClip = await sample(page);
      settled(actualClip);
      await patch(page, { appearanceClip: false });
      await frames(page, 3);
      settled(await sample(page));
      return { boundary, batch, actualClip };
    });
    for (const hidden of ["appearanceClip", "overflowClip"]) {
      await visit({ kind: "carousel" });
      await patch(page, { [hidden]: true });
      await frames(page, 3);
      await check(`native command revalidation retains actual ${hidden} cancellation`, async () => {
        const hiddenState = await page.evaluate(() => {
          window.embla.scrollTo(3, false);
          return window.engineSample();
        });
        assert.equal(hiddenState.engine.duration, 0);
        settled(hiddenState);
        await patch(page, { [hidden]: false });
        await frames(page, 3);
        const restored = await sample(page);
        settled(restored);
        assert.equal(restored.engine.selected, hiddenState.engine.selected);
        assert.deepEqual(restored.engine.track, hiddenState.engine.track);
        await page.evaluate(() => window.embla.scrollTo(1, false));
        const next = await sample(page);
        assert.equal(next.engine.duration, 120);
        assert(next.engine.raf.animationId > 0);
        return { hiddenState, restored, next };
      });
    }
    await visit({ kind: "carousel", initialOffscreen: "true" });
    await check(
      "a real hide in the revalidation frame is observed even without an intervening visible IO sample",
      async () => {
        const boundary = await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => {
                document
                  .querySelector('[data-slot="carousel"]')
                  .scrollIntoView({ behavior: "instant", block: "center" });
                window.embla.scrollTo(3, false);
                const moving = window.engineSample();
                window.enginePatch({ appearanceClip: true });
                resolve({ moving, time: performance.now(), timeline: document.timeline.currentTime });
              }),
            ),
        );
        assert(boundary.moving.engine.raf.animationId > 0);
        await frames(page, 4);
        const hidden = await sample(page);
        settled(hidden);
        await patch(page, { appearanceClip: false });
        await frames(page, 3);
        settled(await sample(page));
        return { boundary, hidden, mechanism: "actual native IO after a same-frame DOM clip; no injected records" };
      },
    );
    await visit({ kind: "carousel", lifetimeProbe: "true" });
    await page.evaluate(() => {
      const probe = window.engineProbe;
      window.retiredEnvironment = {
        target: probe.target,
        sampledAt: performance.now(),
        hook: window.engineIdentity(probe.blocked),
        record: window.engineIOObservers.find((record) => record.active && record.targets.includes(probe.target)),
      };
    });
    await patch(page, { environmentVersion: 1 });
    await frames(page, 3);
    await check("retired environment callbacks cannot stop a native action after real target replacement", async () => {
      const boundary = await page.evaluate(() => {
        const old = window.retiredEnvironment;
        window.embla.scrollTo(3, false);
        const before = window.engineSample();
        const cancels = window.engineProbeCancels ?? 0;
        old.record.callback(
          [{ target: old.target, time: old.sampledAt, isIntersecting: false, intersectionRatio: 0 }],
          old.record.observer,
        );
        return {
          before,
          after: window.engineSample(),
          oldConnected: old.target.isConnected,
          sameHook: old.hook === window.engineIdentity(window.engineProbe.blocked),
          currentConnected: window.engineProbe.target.isConnected,
          retiredObserverActive: old.record.active,
          blocked: window.engineProbe.blocked.current,
          cancelDelta: (window.engineProbeCancels ?? 0) - cancels,
          recordTime: old.sampledAt,
          deliveredAt: performance.now(),
          mechanism:
            "explicit retired callback delivery after actual DOM replacement/disconnect, driving real Embla cancellation callback",
        };
      });
      assert(boundary.before.engine.raf.animationId > 0);
      assert(boundary.after.engine.raf.animationId > 0);
      assert.equal(boundary.oldConnected, false);
      assert.equal(boundary.sameHook, true);
      assert.equal(boundary.currentConnected, true);
      assert.equal(boundary.retiredObserverActive, false);
      assert.equal(boundary.blocked, false);
      assert.equal(boundary.cancelDelta, 0);
      assert(boundary.recordTime < boundary.deliveredAt);
      await frames(page, 3);
      const moving = await sample(page);
      assert.notEqual(moving.engine.location, boundary.after.engine.location);
      return { boundary, moving };
    });
    await visit({ kind: "carousel" });
    await page.evaluate(() => window.embla.scrollTo(2));
    await frames(page, 4);
    await check("native scroll callback reInit invalidates the old cancellation writer", async () => {
      const before = await sample(page);
      const immediate = await page.evaluate(() => {
        const api = window.embla;
        let invoked = false;
        let inside;
        const callback = () => {
          if (invoked) return;
          invoked = true;
          api.reInit({ startIndex: 1, duration: 67 });
          inside = window.engineSample();
        };
        api.on("scroll", callback);
        window.enginePatch({ mode: "none" });
        api.off("scroll", callback);
        return { invoked, inside, sample: window.engineSample() };
      });
      assert(immediate.invoked);
      assert.deepEqual(
        immediate.sample.engine.track,
        immediate.inside.engine.track,
        "old engine cannot redraw the shared track after reInit",
      );
      await frames(page, 4);
      const after = await sample(page);
      assert.notEqual(after.engine.id, before.engine.id);
      assert.equal(after.engine.selected, 1);
      assert.equal(after.engine.base, 67);
      settled(after);
      assert.equal(after.engine.offset, after.engine.target);
      assert.deepEqual(
        after.engine.track,
        immediate.inside.engine.track,
        "new native track remains at its own target on later frames",
      );
      return { before, immediate, after };
    });
    await visit({ kind: "carousel" });
    await page.evaluate(() => window.embla.scrollTo(2));
    await frames(page, 4);
    await check("native scroll callback starts a successor whose RAF survives old cancellation", async () => {
      const before = await sample(page);
      const boundary = await page.evaluate(() => {
        const api = window.embla;
        let invoked = false;
        const callback = () => {
          if (invoked) return;
          invoked = true;
          window.dispatchEvent(new Event("afterprint"));
          api.scrollTo(1);
        };
        api.on("scroll", callback);
        window.dispatchEvent(new Event("beforeprint"));
        api.off("scroll", callback);
        return {
          invoked,
          sample: window.engineSample(),
          mechanism: "synthetic print lifecycle callback for reentry; actual print media is tested separately",
        };
      });
      assert(boundary.invoked);
      assert(boundary.sample.engine.raf.animationId > 0);
      assert.equal(boundary.sample.engine.selected, 1);
      await frames(page, 4);
      const successor = await sample(page);
      assert(successor.engine.raf.animationId > 0);
      assert.notEqual(successor.engine.location, boundary.sample.engine.location);
      await patch(page, { mode: "none" });
      const after = await sample(page);
      settled(after);
      assert.equal(after.engine.selected, 1);
      return { before, boundary, successor, after };
    });
  }
  if (!process.env.CADENCE_ENGINE_FILTER || "calendar".includes(process.env.CADENCE_ENGINE_FILTER)) {
    await visit({ kind: "calendar", appearanceClip: "true" });
    await check(
      "actual ancestor clip and overflow cancel; visible native month reversal retains one writer",
      async () => {
        await patch(page, { revision: 1 });
        assert.equal((await sample(page)).grid.animations.length, 0);
        await patch(page, { appearanceClip: false });
        await frames(page, 3);
        assert.equal((await sample(page)).grid.animations.length, 0);
        await patch(page, { revision: 0 });
        const reverse = await sample(page);
        assert.equal(reverse.grid.animations.length, 1);
        assert(Number(reverse.grid.transform.split(",")[4]) < 0);
        await patch(page, { revision: 1 });
        const forward = await sample(page);
        assert.equal(forward.grid.animations.length, 1);
        assert(Number(forward.grid.transform.split(",")[4]) > 0);
        await patch(page, { appearanceClip: true });
        await frames(page, 3);
        assert.equal((await sample(page)).grid.animations.length, 0);
        await patch(page, { appearanceClip: false });
        await frames(page, 3);
        assert.equal((await sample(page)).grid.animations.length, 0);
        await patch(page, { revision: 2 });
        assert.equal((await sample(page)).grid.animations.length, 1);
        await patch(page, { overflowClip: true });
        await frames(page, 3);
        assert.equal((await sample(page)).grid.animations.length, 0);
        await patch(page, { overflowClip: false });
        await frames(page, 3);
        assert.equal((await sample(page)).grid.animations.length, 0);
        return { forward, reverse };
      },
    );
  }
  if (!process.env.CADENCE_ENGINE_FILTER || "toc".includes(process.env.CADENCE_ENGINE_FILTER))
    for (const os of ["no-preference", "reduce"])
      for (const mode of ["full", "reduced", "none"]) {
        await visit({ kind: "toc" }, mode, os);
        await check("mode/zero preserve native anchors and valid completion focus", async () => {
          await page.locator('a[href="#last"]').click();
          await patch(page, { clock: 0 });
          const target = await page
            .locator("#last")
            .evaluate((node) => ({ focused: document.activeElement === node, top: node.getBoundingClientRect().top }));
          assert(target.focused);
          assert.equal(await page.evaluate(() => location.hash), "#last");
          assert((await sample(page)).drivers.every((d) => !d.animating));
          return target;
        });
        for (const mutation of ["replace-target", "resize-host", "native-input"]) {
          await patch(page, { mode: "full", clock: 8 });
          await page.locator('a[href="#first"]').click();
          await patch(page, { clock: 0 });
          await patch(page, { clock: 8 });
          await page.locator('a[href="#last"]').click();
          await frames(page, 2);
          await check(`same-frame ${mutation} wins over immediate-mode completion`, async () => {
            const before = await sample(page);
            if (os === "reduce") return { nativeImmediate: true, before };
            const boundary = await page.evaluate((mutation) => {
              const host = document.getElementById("scroll-host");
              if (mutation === "replace-target") {
                const old = document.getElementById("last");
                old.replaceWith(old.cloneNode(true));
              }
              if (mutation === "resize-host") host.style.height = "260px";
              if (mutation === "native-input") window.dispatchEvent(new WheelEvent("wheel"));
              const scroll = host.scrollTop;
              window.enginePatch({ mode: "none" });
              return { scroll };
            }, mutation);
            await frames(page, 4);
            const after = await sample(page);
            assert.equal(after.scroll, boundary.scroll);
            assert.notEqual(after.focus, "last");
            assert(after.drivers.every((d) => !d.animating));
            return { before, boundary, after };
          });
        }
      }
  if (!process.env.CADENCE_ENGINE_FILTER || "toc".includes(process.env.CADENCE_ENGINE_FILTER)) {
    await visit({ kind: "toc", windowHost: "true" });
    await check("native window navigation keeps its target when the trigger scrolls out of view", async () => {
      await page.locator('a[href="#last"]').click();
      await frames(page, 5);
      const moving = await sample(page);
      assert(moving.drivers.some((driver) => driver.numeric && driver.animating));
      await page.waitForFunction(() => document.activeElement?.id === "last");
      const complete = await sample(page);
      assert(complete.windowScroll > 400);
      assert(complete.drivers.every((driver) => !driver.animating));
      return { moving, complete };
    });
  }
  if (!process.env.CADENCE_ENGINE_FILTER || "chart".includes(process.env.CADENCE_ENGINE_FILTER))
    for (const series of ["Bar", "Line", "Area", "Pie", "Scatter", "Radar", "RadialBar", "Funnel"]) {
      await visit({ kind: "chart", series, optOut: "true", composition: "true", native: "true" });
      const nativeComposition = await sample(page);
      await visit({ kind: "chart", series, optOut: "true", composition: "true" });
      await check("real Cell/LabelList children retain native composition geometry and labels", async () => {
        const adapted = await sample(page);
        assert.deepEqual(adapted.geometry, nativeComposition.geometry);
        assert.deepEqual(adapted.labels, nativeComposition.labels);
        assert.deepEqual(adapted.fills, nativeComposition.fills);
        return { native: nativeComposition, adapted };
      });
      await visit({ kind: "chart", series, inline: "true" });
      await check(
        "same data with fresh caller closures does not replay on restoration; next data still animates",
        async () => {
          const initial = await sample(page);
          const current = initial.controllers.filter((c) => c.state === "running").at(-1);
          assert(current);
          const starts = initial.events.filter((e) => e.type === "inline-start").length;
          await patch(page, { clock: 4 });
          await frames(page, 4);
          const retimed = await sample(page);
          const retained = retimed.controllers.filter((c) => c.state === "running").at(-1);
          assert(retained);
          assert.equal(retained.phaseId, current.phaseId);
          assert.equal(retained.duration, 2.4);
          assert(retained.progress >= current.progress);
          assert.equal(retimed.events.filter((e) => e.type === "inline-start").length, starts);
          await patch(page, { clock: 0 });
          const zero = await sample(page);
          idle(zero);
          const endCount = zero.events.filter((e) => e.type === "inline-end").length;
          await patch(page, { clock: 3 });
          const restored = await sample(page);
          idle(restored);
          assert.equal(geometry(restored), geometry(zero));
          assert.equal(restored.events.filter((e) => e.type === "inline-end").length, endCount);
          if (series === "Bar") {
            await page.locator(".recharts-bar-rectangle path").first().click();
            assert((await sample(page)).events.some((e) => e.type === "shape-click" && e.clock === 3));
            await page
              .getByText(/^clock 3: /)
              .first()
              .waitFor();
          }
          await patch(page, { revision: 1 });
          await frames(page, 4);
          const active = await sample(page);
          assert(active.registered > 0);
          assert(active.controllers.some((c) => c.state === "running" && Math.abs(c.duration - 1.8) < 0.000001));
          if (series === "Scatter") await page.waitForFunction(() => window.engineSample().registered === 0);
          else
            await page.waitForFunction(
              (count) => window.engineEvents.filter((e) => e.type === "inline-end").length > count,
              endCount,
            );
          const complete = await sample(page);
          idle(complete);
          if (series === "Scatter") {
            assert(!complete.events.some((e) => e.type === "inline-end" || e.type === "inline-start"));
            assert.equal(complete.controllers.at(-1).native, "completed");
          } else assert.equal(complete.events.filter((e) => e.type === "inline-end").at(-1).clock, 3);
          assert.equal(complete.events.filter((e) => e.type === "inline-ref").at(-1).clock, 3);
          return { initial, retimed, zero, restored, active, complete };
        },
      );
      await visit({ kind: "chart", series, optOut: "true" });
      await check("real series opt-out has terminal first frame and no Cadence controller", async () => {
        const before = await sample(page);
        idle(before);
        assert.equal(before.controllers.length, 0);
        assert(!before.events.some((e) => e.type === "start"));
        await patch(page, { revision: 1 });
        const after = await sample(page);
        idle(after);
        assert.notEqual(geometry(after), geometry(before));
        assert.equal(after.controllers.length, 0);
        return { before, after };
      });
      await visit({ kind: "chart", series, interpolate: "true" }, "reduced");
      await check("caller interpolator receives terminal progress in instantaneous modes", async () => {
        const initial = await sample(page);
        assert(initial.events.some((e) => e.type === "interpolate"));
        assert(initial.events.filter((e) => e.type === "interpolate").every((e) => e.progress === 1));
        await patch(page, { mode: "full", revision: 1 });
        await frames(page, 4);
        const full = await sample(page);
        assert(full.events.some((e) => e.type === "interpolate" && e.progress > 0 && e.progress < 1));
        return { initial, full };
      });
      await visit({ kind: "chart", series, controller: "true" });
      await check("explicit nested caller controller retains its public precedence", async () => {
        const before = await sample(page);
        assert(
          before.events.some(
            (e) => e.type === "caller-controller" && e.duration === 9000 && e.delay === 9000 && e.easing === "function",
          ),
        );
        assert.equal(before.controllers.length, 0);
        await patch(page, { mode: "none", revision: 1 });
        assert.equal((await sample(page)).controllers.length, 0);
        return before;
      });
    }
  if (!process.env.CADENCE_ENGINE_FILTER || "chart".includes(process.env.CADENCE_ENGINE_FILTER))
    for (const series of ["Bar", "Line", "Area", "Pie", "Scatter", "Radar", "RadialBar", "Funnel"]) {
      await visit({ kind: "chart", series, inline: "true" });
      await check(
        "installed native geometry follows original nonlinear curve through repeated caller/positive-clock churn",
        async () => {
          await patch(page, { clock: 0 });
          const first = await page.evaluate(() => window.nativeInterpolations?.length ?? 0);
          await patch(page, { clock: 2, revision: 1 });
          await frames(page, 4);
          const active = await sample(page);
          const phaseId = active.controllers.filter((c) => c.state === "running").at(-1)?.phaseId;
          assert(phaseId);
          const clocks = [];
          for (const clock of [3, 1, 2, 1]) {
            const at = await patch(page, { clock, curve: "cubic-bezier(0.7,0,0.84,0)" });
            await frames(page, 6);
            const current = await sample(page);
            const retained = current.controllers.filter((c) => c.phaseId === phaseId).at(-1);
            assert(Math.abs(retained.phaseEase - cubicBezier(0.1, 0.2, 0.8, 0.9)(0.5)) < 1e-9);
            clocks.push({ clock, at, sample: current });
          }
          await page.waitForFunction(() => window.engineSample().registered === 0);
          await frames(page, 4);
          const rawRows = await page.evaluate(
            ({ first, series, phaseId }) =>
              (window.nativeInterpolations ?? [])
                .slice(first)
                .filter((row) => row.series === series && row.phaseId === phaseId),
            { first, series, phaseId },
          );
          const complete = await sample(page);
          await writeFile(
            path.join(output, `curve-${series}-native.json`),
            JSON.stringify({ phaseId, clocks, rawRows, complete }, null, 2),
          );
          const rows = rawRows.filter((row) => row.associated && row.globalProgress !== null);
          assert(rows.length >= 8, "actual installed geometry samples");
          const groups = new Map(),
            previousNative = new Map(),
            continuity = [];
          let maxError = 0,
            checked = 0,
            moving = 0;
          const easing = cubicBezier(0.1, 0.2, 0.8, 0.9);
          for (const row of rawRows) {
            const key = JSON.stringify(row.target),
              previous = previousNative.get(key);
            if (previous && row.progress === 0 && previous.progress > 0 && previous.progress < 1) {
              let error = 0;
              for (let index = 0; index < (row.geometry?.length ?? 0); index++)
                for (const [property, value] of Object.entries(row.geometry[index] ?? {}))
                  if (Number.isFinite(previous.geometry?.[index]?.[property]))
                    error = Math.max(error, Math.abs(value - previous.geometry[index][property]));
              assert(error <= 0.03, `${series} native zero-frame continuity ${error}`);
              continuity.push({ before: previous, after: row, error });
            }
            previousNative.set(key, row);
          }
          for (const row of rows) {
            const key = `${row.controllerId}/${JSON.stringify(row.target)}`;
            let origin = groups.get(key);
            if (!origin) {
              origin = row.previous;
              groups.set(key, origin);
            }
            if (!origin || !row.target || !row.geometry) continue;
            for (let index = 0; index < row.target.length; index++)
              for (const [property, end] of Object.entries(row.target[index] ?? {})) {
                const start = origin[index]?.[property],
                  actual = row.geometry[index]?.[property];
                if (!Number.isFinite(start) || !Number.isFinite(actual)) continue;
                if (Math.abs(end - start) > 0.01) moving++;
                const e0 = easing(row.origin);
                const fraction = (easing(row.globalProgress) - e0) / (1 - e0);
                const expected = start + (end - start) * fraction;
                const error = Math.abs(actual - expected);
                maxError = Math.max(maxError, error);
                checked++;
                assert(
                  error <= 0.03,
                  `${series} ${property}: actual=${actual},expected=${expected},phase=${row.globalProgress},native=${row.progress},error=${error}`,
                );
              }
          }
          assert(checked > 20 && moving > 8, "real changing coordinates, not a wrapper/clock-only assertion");
          const handles = complete.controllers.filter((c) => c.phaseId === phaseId);
          const applications = handles.flatMap((c) => c.applied).sort((a, b) => a.time - b.time);
          let integrated = 0,
            previousTime;
          for (const at of applications) {
            integrated = Math.min(
              1,
              integrated + (previousTime === undefined ? 0 : at.time - previousTime) / at.duration,
            );
            assert(Math.abs(at.progress - integrated) < 1e-8, `${series} independent positive-clock integral`);
            previousTime = at.time;
          }
          const finished = handles.findLast((c) => c.state === "finished" && c.ticks.length);
          assert(finished);
          const last = applications.at(-1);
          const finishStep = (finished.ticks.at(-1) - last.time) / last.duration;
          const finalIntegral = integrated + finishStep;
          assert(
            finalIntegral >= 1 - 1e-8 && finalIntegral <= 1 + finishStep + 1e-8,
            "native completion uses the unchanged action deadline",
          );
          await patch(page, { revision: 2, clock: 2 });
          await frames(page, 3);
          const nextCurve = await sample(page);
          const nextPhase = nextCurve.controllers.filter((c) => c.state === "running").at(-1);
          assert(nextPhase);
          assert(Math.abs(nextPhase.phaseEase - cubicBezier(0.7, 0, 0.84, 0)(0.5)) < 1e-9);
          await patch(page, { clock: 0 });
          return {
            phaseId,
            clocks,
            rows,
            rawRows,
            continuity,
            handles,
            independentClock: { applications, finalIntegral, finishStep },
            maxError,
            checked,
            moving,
            complete,
          };
        },
      );
    }
  if (!process.env.CADENCE_ENGINE_FILTER || "chart".includes(process.env.CADENCE_ENGINE_FILTER))
    for (const native of [true, false]) {
      await visit({
        kind: "chart",
        series: "Bar",
        optOut: "true",
        objectRef: "true",
        ...(native ? { native: "true" } : {}),
      });
      await check(
        "root object refs are available in the parent's first layout commit and swap before its next layout",
        async () => {
          const initial = await page.evaluate(() => window.engineFrames.filter((f) => f.phase === "commit"));
          assert(initial.length);
          for (const f of initial) {
            assert.equal(f.sample.rootRefs.a, f.sample.root);
            assert.equal(f.sample.rootRefs.b, null);
          }
          const before = await sample(page);
          const swapped = await patch(page, { refVersion: 1 });
          for (const f of swapped.filter((f) => f.phase === "commit")) {
            assert.equal(f.sample.rootRefs.a, null);
            assert.equal(f.sample.rootRefs.b, before.root);
          }
          await patch(page, { mounted: false });
          assert.deepEqual((await sample(page)).rootRefs, { a: null, b: null });
          return { native, initial, swapped };
        },
      );
      await visit({
        kind: "chart",
        series: "Bar",
        optOut: "true",
        inline: "true",
        ...(native ? { native: "true" } : {}),
      });
      await check("root cleanup refs attach before parent layout and replacement retains native ordering", async () => {
        const initial = await page.evaluate(() => window.engineFrames.filter((f) => f.phase === "commit"));
        for (const f of initial) {
          assert(f.sample.events.some((e) => e.type === "inline-ref" && e.id === f.sample.root && e.clock === 2));
        }
        const changed = await patch(page, { clock: 4 });
        const committed = changed.find((f) => f.phase === "commit");
        const relevant = committed.sample.events.filter((e) => e.type.startsWith("inline-ref"));
        assert.equal(relevant.at(-1).type, "inline-ref");
        assert.equal(relevant.at(-1).clock, 4);
        assert(relevant.some((e) => e.type === "inline-ref-cleanup" && e.clock === 2));
        assert.equal(relevant.at(-1).id, committed.sample.root);
        await patch(page, { mounted: false });
        const events = (await sample(page)).events;
        assert.equal(
          events.filter((e) => e.type === "inline-ref").length,
          events.filter((e) => e.type === "inline-ref-cleanup").length,
        );
        return { native, initial, changed, events };
      });
    }
  const engineKinds = ["carousel", "chart", "calendar", "toc"].filter(
    (kind) => !process.env.CADENCE_ENGINE_FILTER || kind.includes(process.env.CADENCE_ENGINE_FILTER),
  );
  let action = 0;
  const start = async (kind) => {
    const revision = ++action;
    await patch(page, { clock: 8, mode: "full", revision, active: revision % 2 ? "last" : "first" });
    if (kind === "carousel") await page.evaluate((index) => window.embla.scrollTo(index), revision % 2 ? 3 : 0);
    if (kind === "toc") await page.locator(`a[href="#${revision % 2 ? "last" : "first"}"]`).click();
    await frames(page, 3);
    return sample(page);
  };
  const stopped = (kind, s) => {
    if (kind === "carousel") settled(s);
    if (kind === "chart") idle(s);
    if (kind === "calendar") assert.equal(s.grid.animations.length, 0);
    if (kind === "toc") assert(s.drivers.every((driver) => !driver.animating));
  };
  for (const kind of engineKinds) {
    await visit({ kind });
    await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    for (const signal of ["forced-colors", "print", "offscreen", "hidden-owner"]) {
      await check(`actual ${signal} cancels active owner and restoration has no backlog`, async () => {
        const before = await start(kind);
        if (kind === "chart") assert(before.registered > 0);
        if (kind === "calendar") assert(before.grid.animations.length);
        if (kind === "toc") assert(before.drivers.some((driver) => driver.animating));
        if (signal === "forced-colors") await page.emulateMedia({ forcedColors: "active" });
        if (signal === "print") await page.emulateMedia({ media: "print" });
        if (signal === "offscreen") await patch(page, { offscreen: true });
        if (signal === "hidden-owner") await patch(page, { hidden: true });
        await frames(page, 4);
        const after = await sample(page);
        const retainedTrip = kind === "toc" && ["offscreen", "hidden-owner"].includes(signal);
        if (retainedTrip) assert(after.drivers.every((driver) => driver.numeric || !driver.animating));
        else stopped(kind, after);
        await page.screenshot({ path: path.join(output, `${kind}-${signal}.png`) });
        if (signal === "forced-colors") await page.emulateMedia({ forcedColors: "none" });
        if (signal === "print") await page.emulateMedia({ media: "screen" });
        if (signal === "offscreen") await patch(page, { offscreen: false });
        if (signal === "hidden-owner") await patch(page, { hidden: false });
        await frames(page, 4);
        const restored = await sample(page);
        if (retainedTrip) assert(restored.drivers.every((driver) => driver.numeric || !driver.animating));
        else stopped(kind, restored);
        if (kind === "chart") {
          if (signal !== "hidden-owner") assert.equal(geometry(after), geometry(restored));
          else {
            const reference = await page.context().newPage();
            reference.on("pageerror", (error) => report.errors.push({ label, error: error.stack }));
            await reference.goto(`${origin}/?kind=chart&mode=none`);
            await reference.waitForFunction(() => window.enginePatch);
            await patch(reference, { revision: action });
            await frames(reference, 4);
            assert.equal(geometry(restored), geometry(await sample(reference)));
            await reference.close();
          }
        }
        if (kind === "toc") {
          if (retainedTrip) {
            await page.waitForFunction((id) => document.activeElement?.id === id, action % 2 ? "last" : "first");
            stopped(kind, await sample(page));
          } else assert.equal(after.scroll, restored.scroll);
        }
        return { before, after, restored };
      });
    }
    await page.context().tracing.stop({ path: path.join(output, `${kind}-paint-trace.zip`) });
  }
  if (engineKinds.length && !mutation) {
    if (page) await page.context().close();
    page = undefined;
    const executable = [
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    ].find(existsSync);
    const profile = path.join(output, "owned-visibility-profile");
    const ownedProcess = spawn(
      executable,
      [
        "--headless=new",
        "--remote-debugging-port=0",
        "--no-first-run",
        "--no-default-browser-check",
        "--edge-skip-compat-layer-relaunch",
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
    let native;
    try {
      let endpoint;
      for (let attempt = 0; attempt < 200; attempt++) {
        try {
          const [port, target] = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8"))
            .trim()
            .split(/\r?\n/);
          endpoint = `ws://127.0.0.1:${port}${target}`;
          break;
        } catch {
          await pause(50);
        }
      }
      assert(endpoint);
      native = await chromium.connectOverCDP(endpoint, { noDefaults: true, timeout: 5000 });
      const context = native.contexts()[0];
      page = context.pages()[0];
      page.setDefaultTimeout(30000);
      for (const kind of engineKinds) {
        label = `${kind}/actual-native-visibility`;
        await page.goto(`${origin}/?${new URLSearchParams({ kind })}`);
        await page.waitForFunction(() => window.enginePatch);
        if (kind === "carousel") await page.waitForFunction(() => window.embla);
        if (kind === "chart") await page.waitForFunction(() => window.engineSample().geometry.length);
        await frames(page, 3);
        await check("real background document cancellation and current-state restoration", async () => {
          await page.evaluate(() => {
            window.visibilityEvents = [];
            document.addEventListener("visibilitychange", () =>
              window.visibilityEvents.push({ state: document.visibilityState, sample: window.engineSample() }),
            );
          });
          const before = await start(kind);
          const background = await context.newPage();
          await background.goto("about:blank");
          await background.bringToFront();
          await pause(100);
          assert.equal(await page.evaluate(() => document.visibilityState), "hidden");
          const hidden = await sample(page);
          stopped(kind, hidden);
          await page.bringToFront();
          await frames(page, 4);
          const restored = await sample(page);
          stopped(kind, restored);
          await background.close();
          return {
            before,
            hidden,
            restored,
            events: await page.evaluate(() => window.visibilityEvents),
            pid: ownedProcess.pid,
            endpoint,
          };
        });
      }
    } finally {
      if (native) {
        const session = await native.newBrowserCDPSession();
        await session.send("Browser.close").catch(() => {});
        await native.close();
      }
      if (ownedProcess.exitCode === null) ownedProcess.kill();
      page = undefined;
    }
  }
  report.completed = true;
} catch (error) {
  report.failures.push({ label, name: "incomplete suite setup/execution", message: error.stack });
  if (page)
    await writeFile(
      path.join(output, "incomplete-raw.json"),
      JSON.stringify(
        await page
          .evaluate(() => ({
            frames: window.engineFrames,
            nativeInterpolations: window.nativeInterpolations,
            events: window.engineEvents,
          }))
          .catch(() => null),
        null,
        2,
      ),
    );
} finally {
  if (page) await page.context().close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    cases: report.cases.length,
    failures: report.failures.map(({ label, name, message }) => ({ label, name, message })),
    errors: report.errors,
  }),
);
if (report.failures.length || report.errors.length) process.exitCode = 1;
