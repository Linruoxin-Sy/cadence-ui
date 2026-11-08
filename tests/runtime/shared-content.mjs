import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

const output = path.resolve(
  process.env.CADENCE_CONTENT_OUTPUT ?? `.cache/motion-v2-execution/s08a-directional-selection/browser-${Date.now()}`,
);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const runner = await readFile(new URL(import.meta.url));
await writeFile(path.join(output, "runner.mjs"), runner);
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const plugins = [];
if (process.env.CONTENT_COPY)
  plugins.push({
    name: "copied-cadence",
    setup(build) {
      build.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
        const target = path.resolve(
          process.env.CONTENT_COPY,
          args.path.replaceAll("\\", "/").split("registry/cadence/")[1],
        );
        const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
        assert(file, "Copied target has no workspace fallback");
        return { path: file };
      });
    },
  });
if (process.env.CONTENT_REACT_ROOT)
  plugins.push({
    name: "consumer-react",
    setup(build) {
      build.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
        path: require.resolve(args.path, { paths: [process.env.CONTENT_REACT_ROOT] }),
      }));
    },
  });
let fault;
if (process.env.CONTENT_FAULT)
  plugins.push({
    name: "same-revision-negative",
    setup(build) {
      build.onLoad({ filter: /content-transition\.ts$/ }, async (args) => {
        const original = await readFile(args.path, "utf8");
        const anchor = "if (same) {";
        assert.equal(original.split(anchor).length, 2);
        const modified = original.replace(
          anchor,
          "if (same && !(month && mode === cm.mode && clock === nextClock && records.length > 0)) {",
        );
        fault = { original: hash(original), modified: hash(modified) };
        await writeFile(path.join(output, "fault.ts"), modified);
        return { contents: modified, loader: "ts" };
      });
    },
  });
const bundle = await build({
  entryPoints: ["tests/runtime/shared-content.jsx"],
  plugins,
  write: false,
  bundle: true,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.CONTENT_STRICT ? "development" : "production") },
});
const css = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
const client = bundle.outputFiles[0].text;
await writeFile(path.join(output, "executed.js"), client);
await writeFile(path.join(output, "compiled.css"), css);
const report = {
  runnerSHA: hash(runner),
  inputs: Object.fromEntries(
    await Promise.all(Object.keys(bundle.metafile.inputs).map(async (file) => [file, hash(await readFile(file))])),
  ),
  cssSHA: hash(css),
  clientSHA: hash(client),
  clientGzip: gzipSync(client).length,
  fault,
  cases: [],
  failures: [],
  errors: [],
  consoleErrors: [],
  pid: process.pid,
};
const ssr = await build({
  entryPoints: ["tests/runtime/shared-content-ssr.jsx"],
  plugins,
  write: false,
  bundle: true,
  metafile: true,
  platform: "node",
  packages: process.env.CONTENT_REACT_ROOT ? undefined : "external",
  jsx: "automatic",
  format: "cjs",
});
await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
const markup = require(path.join(output, "ssr.cjs")).html;
report.ssrInputs = Object.fromEntries(
  await Promise.all(Object.keys(ssr.metafile.inputs).map(async (file) => [file, hash(await readFile(file))])),
);
const server = http.createServer((req, res) => {
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? client
      : `<!doctype html><html class="${process.env.CONTENT_DARK ? "dark" : ""}"><style>${css}</style><div id="root">${markup}</div><script>window.contentSSR=true;window.contentStrict=${Boolean(process.env.CONTENT_STRICT)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
await page.addInitScript(() => {
  window.contentObservers = [];
  const NativeIntersectionObserver = window.IntersectionObserver;
  window.IntersectionObserver = class extends NativeIntersectionObserver {
    constructor(callback, options) {
      super(callback, options);
      this.delivery = callback;
      this.targets = new Set();
      window.contentObservers.push(this);
    }
    observe(target) {
      this.targets.add(target);
      super.observe(target);
    }
  };
  window.contentFrameReads = 0;
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = (callback) =>
    raf.call(window, (time) => {
      window.contentFrame = true;
      try {
        callback(time);
      } finally {
        window.contentFrame = false;
      }
    });
  const rect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (...args) {
    if (window.contentFrame) window.contentFrameReads++;
    return rect.apply(this, args);
  };
});
page.on("pageerror", (error) => report.errors.push(error.stack));
page.on("console", (message) => {
  if (message.type() === "error") report.consoleErrors.push(message.text());
});
const sample = () =>
  page.evaluate(() => {
    const list = document.querySelector('[aria-label="Views"]');
    const marker = list?.querySelector('[data-slot="tabs-indicator"]');
    const paints = [
      ...document.querySelectorAll('[data-slot="calendar-month-grid"], [data-slot="tabs-content"]:not([hidden])'),
    ];
    const read = (node) => ({
      slot: node.dataset.slot,
      name: node.getAttribute("aria-label"),
      opacity: Number(getComputedStyle(node).opacity),
      transform: getComputedStyle(node).transform,
      effects: node.getAnimations().map((a) => ({ frames: a.effect.getKeyframes(), state: a.playState })),
    });
    return {
      marker: marker && {
        ...read(marker),
        hidden: marker.hidden,
        x: marker.getBoundingClientRect().x,
        y: marker.getBoundingClientRect().y,
        width: marker.getBoundingClientRect().width,
      },
      paints: paints.map(read),
      tabs: [...document.querySelectorAll("[role=tab]")].map((n) => ({
        text: n.textContent,
        selected: n.getAttribute("aria-selected"),
      })),
      scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      duplicates: document.querySelectorAll("#original-label").length,
    };
  });
async function check(name, fn) {
  try {
    const evidence = await fn();
    report.cases.push({ name, passed: true, evidence });
  } catch (error) {
    report.cases.push({ name, passed: false });
    report.failures.push({ name, message: error.stack });
  }
}
const update = (patch) => page.evaluate((patch) => window.contentUpdate(patch), patch);
const reset = () => page.evaluate(() => window.contentReset());
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.contentReady);
  await page.waitForTimeout(80);
  report.react = await page.evaluate(() => window.contentReactVersion);
  report.theme = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains("dark"),
    background: getComputedStyle(document.body).backgroundColor,
  }));
  await check("SSR remains readable without script", async () => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const native = await context.newPage();
      await native.goto(`http://127.0.0.1:${server.address().port}`);
      assert.equal(await native.getByRole("grid").count(), 2);
      assert(await native.getByLabel("Draft", { exact: true }).isVisible());
      assert.equal(await native.getByRole("tab", { name: "Alpha", exact: true }).getAttribute("aria-selected"), "true");
      return { grids: 2, readable: true };
    } finally {
      await context.close();
    }
  });
  await check("initial presentation and persistent identities", async () => {
    const s = await sample();
    assert(s.paints.every((p) => p.effects.length === 0));
    assert(
      !s.marker.hidden ||
        (await page
          .getByRole("tab", { name: "Alpha", exact: true })
          .evaluate((node) => getComputedStyle(node, "::after").opacity === "1")),
    );
    await page.evaluate(() => {
      window.markerIdentity = document.querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]');
      window.gridIdentity = document.querySelector('[data-slot="calendar-month-grid"]');
    });
    return s;
  });
  for (const mode of ["full", "reduced", "none"]) {
    await check(`${mode} committed paint and first frame`, async () => {
      await reset();
      await update({ mode });
      await update({ value: "b", month: 11 });
      const s = await sample();
      const grids = s.paints.filter((p) => p.slot === "calendar-month-grid");
      assert.equal(grids.length, 2);
      assert.equal(s.duplicates, 1);
      if (mode === "none") assert(s.paints.every((p) => p.effects.length === 0));
      else {
        assert(grids.every((p) => p.effects.length === 1));
        assert(Math.abs(grids[0].opacity - grids[1].opacity) < 0.001);
        for (const grid of grids) {
          const x = grid.transform === "none" ? 0 : Number(grid.transform.split(",")[4]);
          if (mode === "full") assert(Math.abs(x - 8 * (1 - grid.opacity)) < 0.01);
          else assert.equal(x, 0);
        }
      }
      await page.screenshot({ path: path.join(output, `${mode}.png`) });
      return s;
    });
    await check(`${mode} live downgrade and zero before paint`, async () => {
      await reset();
      await update({ value: "b", month: 11 });
      await page.waitForTimeout(40);
      await update({ mode });
      const first = await sample();
      if (mode !== "full") {
        assert.equal(first.marker.effects.length, 0);
        assert(first.paints.filter((p) => p.slot === "calendar-month-grid").every((p) => p.effects.length === 0));
      }
      await update({ clock: 0 });
      const zero = await sample();
      assert(zero.paints.every((p) => p.effects.length === 0));
      assert.equal(zero.marker.effects.length, 0);
      await update({ mode: "full", clock: 4 });
      const restored = await sample();
      assert(restored.paints.every((p) => p.effects.length === 0));
      return { first, zero, restored };
    });
  }
  await check("same accepted target keeps its existing phase", async () => {
    await reset();
    await update({ month: 11 });
    await page.waitForTimeout(100);
    const a = await sample();
    await page.evaluate(() => {
      window.sameTargetHandle = document.querySelector('[data-slot="calendar-month-grid"]').getAnimations()[0];
    });
    await update({ text: "Alpha renamed" });
    const b = await sample();
    const before = a.paints.find((p) => p.slot === "calendar-month-grid").opacity;
    const after = b.paints.find((p) => p.slot === "calendar-month-grid").opacity;
    assert(after >= before - 0.01, `phase restarted ${before} -> ${after}`);
    assert(
      await page.evaluate(
        () =>
          window.sameTargetHandle === document.querySelector('[data-slot="calendar-month-grid"]').getAnimations()[0],
      ),
      "same target replaced its native phase handle",
    );
    return { a, b };
  });
  await check("retired visibility callbacks cannot cancel a replacement phase", async () => {
    await reset();
    const trace = await page.evaluate(() => {
      window.contentUpdate({ month: 11 });
      const grid = document.querySelector('[data-slot="calendar-month-grid"]');
      const retired = window.contentObservers.filter((observer) => observer.targets.has(grid)).at(-1);
      const oldHandle = grid.getAnimations()[0];
      window.contentUpdate({ month: 9 });
      const replacement = grid.getAnimations()[0];
      retired.delivery([{ target: grid, isIntersecting: false, intersectionRatio: 0 }], retired);
      return {
        replaced: Boolean(oldHandle && replacement && oldHandle !== replacement),
        retired: oldHandle?.playState,
        retained: grid.getAnimations()[0] === replacement,
      };
    });
    assert(trace.replaced && trace.retired === "idle" && trace.retained, JSON.stringify(trace));
    return trace;
  });
  await check("positive clock retimes geometry and captures finite panel paint", async () => {
    await reset();
    await update({ value: "b", month: 11 });
    await page.waitForTimeout(60);
    const trace = await page.evaluate(() => {
      const marker = document.querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]');
      const panel = document.querySelector('[data-slot="tabs-content"]:not([hidden])');
      const oldMarker = marker.getAnimations()[0],
        oldPanel = panel.getAnimations()[0];
      const beforeX = marker.getBoundingClientRect().x;
      window.contentUpdate({ clock: 8 });
      return {
        beforeX,
        afterX: marker.getBoundingClientRect().x,
        retired: oldMarker?.playState === "idle",
        retimed: marker.getAnimations()[0] !== oldMarker,
        captured: panel.getAnimations()[0] === oldPanel,
        calendarEffects: [...document.querySelectorAll('[data-slot="calendar-month-grid"]')].map(
          (node) => node.getAnimations().length,
        ),
      };
    });
    assert(Math.abs(trace.beforeX - trace.afterX) < 0.05, JSON.stringify(trace));
    assert(trace.retired && trace.retimed && trace.captured);
    assert(trace.calendarEffects.every((count) => count === 0));
    return trace;
  });
  await check("real directional panel uses one phase and no outgoing copy", async () => {
    await reset();
    await page.getByRole("tab", { name: "Beta longer", exact: true }).click();
    const s = await sample();
    const panel = s.paints.find((p) => p.slot === "tabs-content");
    assert.equal(panel.effects.length, 1);
    const x = panel.transform === "none" ? 0 : Number(panel.transform.split(",")[4]);
    assert(Math.abs(Math.abs(x) - 4 * (1 - panel.opacity)) < 0.02);
    assert.equal(await page.locator("#original-label").count(), 1);
    return s;
  });
  await check("no layout reads from phase frames or unchanged committed renders", async () => {
    await reset();
    await update({ month: 11, value: "b" });
    await page.evaluate(() => {
      window.contentFrameReads = 0;
    });
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => window.contentFrameReads), 0);
    return { frameReads: 0 };
  });
  await check("RTL and vertical paths preserve native direction", async () => {
    await reset();
    await update({ rtl: true, orientation: "vertical" });
    await update({ month: 11, value: "b" });
    const s = await sample();
    const grid = s.paints.find((p) => p.slot === "calendar-month-grid");
    assert(Number(grid.transform.split(",")[4]) < 0);
    await page.waitForTimeout(80);
    const trace = await page.evaluate(() => {
      const marker = document.querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]');
      const before = marker.getBoundingClientRect().y;
      window.contentUpdate({ value: "a" });
      return { before, after: marker.getBoundingClientRect().y };
    });
    assert(Math.abs(trace.before - trace.after) < 0.05, JSON.stringify(trace));
    return { s, trace };
  });
  await check("filled fallback leaves unchanged labels readable", async () => {
    await reset();
    await update({ variant: "default", value: "b" });
    const s = await sample();
    assert.equal(s.marker.effects.length, 0);
    assert.equal(
      await page
        .getByRole("tab", { name: "Beta longer", exact: true })
        .evaluate((node) => getComputedStyle(node).opacity),
      "1",
    );
    return s;
  });
  await check("parent reveal transform composes with the single local marker writer", async () => {
    await reset();
    await page.evaluate(() => {
      const root = document.querySelector('[data-slot="tabs"]');
      window.parentPaint = root.animate([{ transform: "translateY(12px)" }, { transform: "none" }], {
        duration: 400,
        fill: "both",
      });
      window.parentPaint.pause();
      window.parentPaint.currentTime = 100;
    });
    await update({ value: "b" });
    const s = await sample();
    assert.equal(s.marker.effects.length, 1);
    assert.equal(
      await page.evaluate(() =>
        document.querySelector('[data-slot="tabs"]').getAnimations().includes(window.parentPaint),
      ),
      true,
    );
    await page.evaluate(() => window.parentPaint.cancel());
    return s;
  });
  await check("decorative paths preserve the native scroll extent", async () => {
    await reset();
    await update({ mode: "none", value: "b", month: 11 });
    const native = await sample();
    await reset();
    await update({ value: "b", month: 11 });
    const animated = await sample();
    assert.deepEqual(animated.scroll, native.scroll);
    return { native: native.scroll, animated: animated.scroll };
  });
  await check("common ancestor scrolling preserves a valid local selection path", async () => {
    await reset();
    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.id = "native-scroll-space";
      spacer.style.height = "1800px";
      document.body.append(spacer);
    });
    await update({ value: "b" });
    await page.evaluate(() => {
      window.scrollMarkerHandle = document
        .querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]')
        .getAnimations()[0];
      window.scrollBy(0, 10);
    });
    await page.waitForTimeout(40);
    assert(
      await page.evaluate(
        () =>
          document.querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]').getAnimations()[0] ===
          window.scrollMarkerHandle,
      ),
    );
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.getElementById("native-scroll-space").remove();
    });
    return { sameLocalHandle: true };
  });
  await check("viewport constraint invalidation cancels to current native paint", async () => {
    await reset();
    await update({ value: "b", month: 11 });
    await page.evaluate(() => {
      window.viewportHandles = [...document.getAnimations()];
    });
    await page.setViewportSize({ width: 900, height: 1200 });
    await page.waitForTimeout(40);
    const states = await page.evaluate(() => window.viewportHandles.map((handle) => handle.playState));
    assert(states.every((state) => state === "idle"));
    const s = await sample();
    assert(s.marker.hidden);
    assert.equal(
      await page
        .getByRole("tab", { name: "Beta longer", exact: true })
        .evaluate((node) => getComputedStyle(node, "::after").opacity),
      "1",
    );
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.evaluate(() => {
      document.querySelector("#root section").style.scale = "-1 1";
    });
    await update({ value: "a" });
    const flipped = await sample();
    assert(flipped.marker.hidden);
    await page.evaluate(() => {
      document.querySelector("#root section").style.scale = "";
    });
    await page.getByRole("tab", { name: "Beta longer", exact: true }).evaluate((node) => {
      node.style.position = "sticky";
    });
    await update({ value: "b" });
    const sticky = await sample();
    assert(sticky.marker.hidden);
    await page.evaluate(() => {
      document.querySelector('[aria-label="Views"]').style.position = "static";
    });
    await update({ value: "c" });
    const staticList = await sample();
    assert(staticList.marker.hidden);
    return { states, s, flipped, sticky, staticList };
  });
  await check("source token zero retires existing content before the next frame", async () => {
    await reset();
    await update({ value: "b", month: 11 });
    const evidence = await page.evaluate(async () => {
      for (const node of document.querySelectorAll('[data-slot="tabs"], [data-slot="calendar"]'))
        node.style.setProperty("--motion-source-duration-base", "0s");
      await new Promise(requestAnimationFrame);
      return [...document.querySelectorAll('[data-slot="calendar-month-grid"], [data-slot="tabs-content"]')].map(
        (node) => node.getAnimations().length,
      );
    });
    assert(evidence.every((count) => count === 0));
    return evidence;
  });
  await check("actual grid-local clock zero cancels the shared owner without replay", async () => {
    await reset();
    await update({ month: 11 });
    const counts = await page.evaluate(async () => {
      const grid = document.querySelector('[data-slot="calendar-month-grid"]');
      grid.style.setProperty("--motion-source-duration-base", "0s");
      await new Promise(requestAnimationFrame);
      return [...document.querySelectorAll('[data-slot="calendar-month-grid"]')].map(
        (node) => node.getAnimations().length,
      );
    });
    assert(counts.every((count) => count === 0));
    await page.evaluate(() =>
      document.querySelector('[data-slot="calendar-month-grid"]').style.removeProperty("--motion-source-duration-base"),
    );
    await page.waitForTimeout(40);
    const s = await sample();
    assert(
      s.paints.filter((paint) => paint.slot === "calendar-month-grid").every((paint) => paint.effects.length === 0),
    );
    return { counts, s };
  });
  await check("native press transform survives selection fallback", async () => {
    await reset();
    await update({ press: true });
    const tab = page.getByRole("tab", { name: "Beta longer", exact: true });
    await tab.hover();
    await page.mouse.down();
    await page.waitForTimeout(70);
    const pressed = await tab.evaluate((node) => ({
      transform: getComputedStyle(node).transform,
      animations: node.getAnimations().length,
    }));
    assert.notEqual(pressed.transform, "none");
    await page.mouse.up();
    assert.equal(await tab.getAttribute("aria-selected"), "true");
    return { pressed, selected: await sample() };
  });
  await check("async ready content never replays panel activation", async () => {
    await reset();
    await update({ pending: true, value: "b" });
    await page.waitForTimeout(100);
    const a = await sample();
    await update({ pending: false });
    const b = await sample();
    assert(
      b.paints.find((p) => p.slot === "tabs-content").opacity >=
        a.paints.find((p) => p.slot === "tabs-content").opacity - 0.01,
    );
    assert.equal(await page.locator("#editor").count(), 1);
    return { a, b };
  });
  await check("real popup closure retires subordinate content phase", async () => {
    await reset();
    await update({ popup: true });
    await page.waitForTimeout(80);
    await update({ month: 11, value: "b" });
    await page.evaluate(() => {
      window.closingHandles = document.querySelector('[data-slot="calendar-month-grid"]').getAnimations();
    });
    await update({ popupOpen: false });
    const old = await page.evaluate(() => window.closingHandles.map((handle) => handle.playState));
    assert(old.every((state) => state === "idle"));
    return { old };
  });
  await check("rapid reverse starts at current paint and newest target", async () => {
    await reset();
    await update({ month: 11 });
    await page.waitForTimeout(80);
    const trace = await page.evaluate(() => {
      const grid = document.querySelector('[data-slot="calendar-month-grid"]');
      const x = () => {
        const matrix = getComputedStyle(grid).transform;
        return matrix === "none" ? 0 : Number(matrix.split(",")[4]);
      };
      const before = { opacity: Number(getComputedStyle(grid).opacity), x: x() };
      const old = grid.getAnimations()[0];
      window.contentUpdate({ month: 9 });
      return {
        before,
        after: { opacity: Number(getComputedStyle(grid).opacity), x: x() },
        name: grid.getAttribute("aria-label"),
        retired: old?.playState === "idle",
      };
    });
    assert.equal(trace.name, "October 2026");
    assert(Math.abs(trace.before.opacity - trace.after.opacity) < 0.01, JSON.stringify(trace));
    assert(Math.abs(trace.before.x - trace.after.x) < 0.05, JSON.stringify(trace));
    assert(trace.retired);
    return trace;
  });
  await check("marker identity absent and restored origin", async () => {
    await reset();
    await page.evaluate(() => {
      window.markerIdentity = document.querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]');
    });
    await update({ value: "b" });
    await page.waitForTimeout(50);
    const moving = await sample();
    assert.equal(moving.marker.effects.length, 1);
    await update({ active: false });
    assert((await sample()).marker.hidden);
    await update({ active: true, value: "c" });
    const restored = await sample();
    assert.equal(restored.marker.effects.length, 0);
    assert(
      await page.evaluate(
        () => window.markerIdentity === document.querySelector('[aria-label="Views"] [data-slot="tabs-indicator"]'),
      ),
    );
    return { moving, restored };
  });
  await check("native editors persistence focus and single tree", async () => {
    await reset();
    await page.getByLabel("Draft", { exact: true }).fill("typed");
    await update({ value: "b" });
    await page.getByLabel("Editor", { exact: true }).focus();
    const s = await sample();
    assert.equal(s.paints.find((p) => p.slot === "tabs-content").effects.length, 0);
    await update({ value: "a" });
    assert.equal(await page.getByLabel("Draft", { exact: true }).inputValue(), "typed");
    assert.equal(await page.locator("#editor").count(), 1);
    return s;
  });
  await check("caller grid styles and native engine yield", async () => {
    await reset();
    await update({ caller: true });
    await update({ month: 11 });
    const caller = await sample();
    assert(
      caller.paints
        .filter((p) => p.slot === "calendar-month-grid")
        .every((p) => p.effects.length === 0 && p.opacity === 0.7),
    );
    await update({ caller: false, native: true, month: 9 });
    const native = await sample();
    assert(native.paints.filter((p) => p.slot === "calendar-month-grid").every((p) => p.effects.length === 0));
    return { caller, native };
  });
  await check("aggregate month preflight includes every actual grid", async () => {
    await reset();
    await update({ count: 51 });
    await update({ month: 11 });
    const s = await sample();
    assert.equal(s.paints.filter((p) => p.slot === "calendar-month-grid").length, 51);
    assert(s.paints.filter((p) => p.slot === "calendar-month-grid").every((p) => p.effects.length === 0));
    return { count: 51, effects: 0 };
  });
  await check("month count changes establish native baselines without navigation replay", async () => {
    await reset();
    await update({ count: 3 });
    const s = await sample();
    const grids = s.paints.filter((paint) => paint.slot === "calendar-month-grid");
    assert.equal(grids.length, 3);
    assert(grids.every((paint) => paint.effects.length === 0));
    await update({ month: 11 });
    const moved = await sample();
    assert(
      moved.paints.filter((paint) => paint.slot === "calendar-month-grid").every((paint) => paint.effects.length === 1),
      JSON.stringify(moved),
    );
    return { s, moved };
  });
  await check("unknown reordered month direction uses opacity without fabricated travel", async () => {
    await reset();
    await update({ reverse: true });
    const s = await sample();
    const grids = s.paints.filter((paint) => paint.slot === "calendar-month-grid");
    assert.equal(grids.length, 2);
    assert(grids.every((paint) => paint.effects.length === 1 && paint.transform === "none"));
    return s;
  });
  await check("unmount retires actual native handles", async () => {
    await reset();
    await update({ month: 11, value: "b" });
    await page.evaluate(() => {
      window.oldHandles = [...document.getAnimations()];
    });
    await update({ mounted: false });
    const state = await page.evaluate(() => window.oldHandles.map((a) => a.playState));
    assert(state.every((value) => value === "idle"));
    return state;
  });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.resourcesClosed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    cases: report.cases.length,
    failures: report.failures,
    errors: report.errors,
    consoleErrors: report.consoleErrors,
    resourcesClosed: report.resourcesClosed,
  }),
);
if (report.failures.length || report.errors.length || report.consoleErrors.length) process.exitCode = 1;
