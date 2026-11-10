import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
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
import { installationPlan } from "../../scripts/installation.mjs";

assert(process.env.TABS_OUTPUT);
const output = path.resolve(process.env.TABS_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.TABS_COPY;
let installation;
if (process.env.TABS_INSTALL) {
  const payloads = new Map();
  const queue = ["tabs"];
  while (queue.length) {
    const id = queue.shift();
    if (payloads.has(id)) continue;
    const bytes = await readFile(`public/r/${id}.json`);
    const item = JSON.parse(bytes);
    payloads.set(id, { item, sha: hash(bytes) });
    for (const dependency of item.registryDependencies ?? []) {
      assert(dependency.startsWith("@cadence/"));
      queue.push(dependency.slice(9));
    }
  }
  const plan = installationPlan(
    [...payloads.values()].map(({ item }) => item),
    "tabs",
  );
  copy = path.join(output, "installed", "components", "cadence");
  const files = [];
  for (const file of plan.files) {
    assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
    const target = path.resolve(copy, file.target.slice("@components/cadence/".length));
    assert(target.startsWith(copy + path.sep));
    assert.equal(file.content, await readFile(file.path, "utf8"), "payload must match shipped source");
    assert(!/from\s+["']@\//.test(file.content), "copied source must use relative imports");
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
    files.push({ target: file.target, sha: hash(file.content) });
  }
  installation = {
    items: [...payloads].map(([id, { sha }]) => ({ id, sha })),
    dependencies: plan.dependencies,
    files,
  };
}
const plugins = [];
if (copy)
  plugins.push({
    name: "copied",
    setup(b) {
      b.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
        const target = path.resolve(copy, args.path.replaceAll("\\", "/").split("registry/cadence/")[1]);
        const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
        assert(file, "No workspace fallback");
        return { path: file };
      });
    },
  });
const client = await build({
  entryPoints: ["tests/runtime/tabs-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/tabs-pilot-ssr.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  platform: "node",
  packages: "external",
  format: "cjs",
});
await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
const render = require(path.join(output, "ssr.cjs")).render;
const css = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
const js = client.outputFiles[0].text;
await writeFile(path.join(output, "executed.js"), js);
await writeFile(path.join(output, "compiled.css"), css);
const report = {
  runnerSHA: hash(await readFile(new URL(import.meta.url))),
  inputs: Object.fromEntries(
    await Promise.all(Object.keys(client.metafile.inputs).map(async (f) => [f, hash(await readFile(f))])),
  ),
  clientGzip: gzipSync(js).length,
  cases: [],
  errors: [],
  installation,
  resources: {
    pid: process.pid,
    identity: JSON.parse(
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `Get-CimInstance Win32_Process -Filter 'ProcessId = ${process.pid}' | Select-Object ProcessId,CreationDate,CommandLine | ConvertTo-Json -Compress`,
        ],
        { encoding: "utf8", windowsHide: true },
      ),
    ),
  },
};
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
const server = http.createServer((req, res) => {
  const mode = new URL(req.url, "http://localhost").searchParams.get("mode") ?? "full";
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? js
      : `<!doctype html><html><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.tabsInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
const sample = () => {
  const list = document.getElementById("list"),
    marker = list.querySelector('[data-slot="tabs-indicator"]');
  const target = list.querySelector('[aria-selected="true"]'),
    panel = document.querySelector('#primary [role="tabpanel"]:not([hidden])');
  const rect = (n) =>
    n ? Object.fromEntries(["x", "y", "width", "height"].map((key) => [key, n.getBoundingClientRect()[key]])) : null;
  const animations = (n) =>
    (n?.getAnimations() ?? [])
      .filter((a) => a.playState !== "idle")
      .map((a) => ({ state: a.playState, frames: a.effect.getKeyframes(), property: a.transitionProperty }));
  return {
    list: rect(list),
    marker: rect(marker),
    target: rect(target),
    panel: rect(panel),
    hidden: marker.hidden,
    listEffects: animations(list),
    markerEffects: animations(marker),
    panelEffects: animations(panel),
    items: [...list.querySelectorAll('[role="tab"]')].map((n) => ({
      text: n.textContent,
      rect: rect(n),
      effects: animations(n),
    })),
    layers: document.querySelectorAll("[data-cadence-text-layer]").length,
    reels: document.querySelectorAll("[data-cadence-reel]").length,
    scroll: [list.scrollWidth, list.scrollHeight, list.scrollLeft, list.scrollTop],
  };
};
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1200 } });
      const page = await context.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const update = (patch) => page.evaluate((p) => window.tabsUpdate(p), patch);
      await page.goto(`${url}?mode=${mode}`);
      await page.waitForFunction(() => window.tabsReady);
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction((m) => document.querySelector("#list")?.dataset.motion === m, effective);
      const initial = await page.evaluate(sample);
      report.initialDiagnostic = await page.evaluate(() => {
        const list = document.getElementById("list"),
          target = list.querySelector('[aria-selected="true"]');
        return {
          html: list.outerHTML,
          bounds: [list.offsetWidth, list.offsetHeight, target?.offsetWidth, target?.offsetHeight],
          styles: [list, target, list.parentElement].map((n) => {
            const c = getComputedStyle(n);
            return {
              position: c.position,
              transform: c.transform,
              translate: c.translate,
              scale: c.scale,
              rotate: c.rotate,
              perspective: c.perspective,
              offsetPath: c.offsetPath,
            };
          }),
        };
      });
      assert(!initial.hidden, "real initial marker placement");
      assert.equal(
        initial.markerEffects.filter((a) => a.frames.some((f) => f.transform)).length,
        0,
        "no SSR selection replay",
      );
      await page.evaluate(() => {
        window.tabsText = document.querySelector('#tab-a [data-slot="tabs-text"]').firstChild;
        window.tabsMarker = document.querySelector('#list [data-slot="tabs-indicator"]');
      });
      await update({ label: "Alpha", content: "Panel ready\nSecond line\nThird line" });
      await page.waitForTimeout(60);
      const revision = await page.evaluate(sample);
      report.revisionDiagnostic = revision;
      assert.equal(await page.locator("#tab-a").textContent(), "Alpha");
      assert(
        await page.evaluate(
          () => window.tabsText === document.querySelector('#tab-a [data-slot="tabs-text"]').firstChild,
        ),
      );
      if (effective === "full") {
        assert(
          revision.listEffects.some((a) => a.frames.some((f) => f.width)),
          "actual intrinsic strip size writer",
        );
        assert(
          revision.items.some((i) => i.effects.some((a) => a.frames.some((f) => f.transform))),
          "actual retained trigger reflow",
        );
        assert(
          Math.abs(revision.marker.x - (revision.target.x + 1)) < 1.5,
          "marker follows current trigger projection without second spring",
        );
        assert.equal(
          revision.panelEffects.filter((a) => a.frames.some((f) => f.height)).length,
          0,
          "native content minimum commits growth without a fake size tween",
        );
      } else assert.equal(revision.listEffects.filter((a) => a.frames.some((f) => f.width || f.height)).length, 0);
      const retime = await page.evaluate(() => {
        const node = document.getElementById("list"),
          before = node.getBoundingClientRect().width;
        window.tabsUpdate({ clock: 2 });
        return { before, after: node.getBoundingClientRect().width };
      });
      assert(Math.abs(retime.before - retime.after) < 1.5, "positive clock retimes current geometry");
      const shrink = await page.evaluate(async () => {
        const panel = document.getElementById("panel-b"),
          before = panel.getBoundingClientRect().height;
        const policy = {
          min: getComputedStyle(panel).minHeight,
          overflow: getComputedStyle(panel).overflowY,
          parent: getComputedStyle(panel.parentElement).display,
          direction: getComputedStyle(panel.parentElement).flexDirection,
          beforeFrames: panel.getAnimations().map((a) => a.effect.getKeyframes()),
        };
        window.tabsUpdate({ content: "Panel ready" });
        const committed = panel.getBoundingClientRect().height,
          target = panel.firstElementChild.getBoundingClientRect().height,
          frames = [];
        for (let i = 0; i < 8; i++) {
          await new Promise(requestAnimationFrame);
          frames.push(panel.getBoundingClientRect().height);
        }
        return { before, committed, target, frames, policy };
      });
      report.shrinkDiagnostic = shrink;
      if (effective === "full") {
        assert(
          Math.abs(shrink.before - shrink.committed) < 1.5,
          "native automatic minimum cannot reveal a stale raw spring value on revision",
        );
        assert(
          shrink.frames.some((height) => height > shrink.target + 1 && height < shrink.before),
          "actual rendered panel intermediate height",
        );
        await page.waitForFunction(
          () =>
            !document
              .getElementById("panel-b")
              .getAnimations()
              .some((a) => a.effect.getKeyframes().some((f) => "height" in f || "flexBasis" in f)),
        );
        const released = await page.locator("#panel-b").evaluate((n) => ({
          height: n.getBoundingClientRect().height,
          natural: n.firstElementChild.getBoundingClientRect().height,
          flex: getComputedStyle(n).flex,
          inline: n.style.flex,
        }));
        assert.equal(released.height, released.natural);
        assert.equal(released.flex, "1 1 0%");
        assert.equal(released.inline, "");
      } else
        assert(
          shrink.frames.every((height) => Math.abs(height - shrink.target) < 1),
          "downgraded actual geometry is immediate",
        );
      await update({ active: "a" });
      const duringReflow = await page.evaluate(sample);
      assert.equal(
        duringReflow.listEffects.filter((a) => a.frames.some((f) => f.width || f.height)).length,
        0,
        "selection during reflow settles coupled geometry",
      );
      await page.locator("#draft").fill("changed native draft");
      await page.locator("#local-state").click();
      await page.evaluate(() => {
        window.tabsEditor = document.getElementById("draft");
        window.tabsState = document.getElementById("local-state");
      });
      await update({ active: "c", loading: true, richHeight: 30 });
      await page.waitForTimeout(40);
      const activation = await page.evaluate(sample);
      if (effective !== "none")
        assert(
          activation.panelEffects.some((a) => a.frames.some((f) => f.opacity !== undefined)),
          "actual incoming panel opacity",
        );
      if (effective === "full") {
        await update({ mode: "reduced" });
        const live = await page.evaluate(sample);
        assert(
          live.panelEffects.some((a) => a.frames.some((f) => f.opacity !== undefined)),
          "live reduced retains the proven running panel opacity",
        );
        assert(
          !live.panelEffects.some((a) => a.frames.some((f) => f.transform && f.transform !== "none")),
          "live reduced removes panel travel",
        );
        await update({ mode });
      }
      await update({ active: "b" });
      await update({ loading: false, richHeight: 120 });
      await update({ active: "c" });
      assert.equal(await page.locator("#async-content").textContent(), "Resolved content");
      await page.evaluate(() => window.tabsBegin());
      await page.locator("#async-fallback").waitFor();
      await page.evaluate(() => {
        window.tabsFallbackHost = document.getElementById("panel-c");
        window.tabsResolve();
      });
      await page.getByText("Asynchronously resolved", { exact: true }).waitFor();
      assert(
        await page.evaluate(() => window.tabsFallbackHost === document.getElementById("panel-c")),
        "Suspense retains its actual panel host",
      );
      await page.evaluate(() => window.tabsBegin());
      await update({ active: "b" });
      await page.evaluate(() => window.tabsResolve());
      await update({ active: "c", panelKey: 1 });
      await page.getByText("Asynchronously resolved", { exact: true }).waitFor();
      assert(
        await page.evaluate(() => window.tabsFallbackHost !== document.getElementById("panel-c")),
        "replacement cannot borrow retired measurements",
      );
      await update({ active: "a", nested: true });
      assert.equal(await page.locator("#draft").inputValue(), "changed native draft");
      assert(
        await page.evaluate(
          () =>
            window.tabsEditor === document.getElementById("draft") &&
            window.tabsState === document.getElementById("local-state"),
        ),
      );
      assert.deepEqual(await page.evaluate(() => new FormData(document.getElementById("form")).getAll("draft")), [
        "changed native draft",
      ]);
      assert.equal(await page.locator("#draft").count(), 1);
      assert.equal(await page.locator("#draft-help").count(), 1);
      await page.locator("#sibling").getByRole("tab", { name: "Beta", exact: true }).click();
      await page.locator("#portal-tabs").getByRole("tab", { name: "Beta", exact: true }).click();
      await page.locator("#nested").getByRole("tab", { name: "Beta", exact: true }).click();
      assert.equal(await page.locator("#tab-a").getAttribute("aria-selected"), "true");
      assert.equal(await page.locator('#nested [data-slot="tabs-indicator"]').getAttribute("data-motion"), "none");
      await update({ wide: true });
      await page.waitForFunction(() =>
        [document.getElementById("tab-a"), document.getElementById("list")].every(
          (n) => !n.getAnimations().some((a) => a.playState === "running"),
        ),
      );
      await update({ label: "Alpha revised" });
      await page.waitForTimeout(45);
      const independentText = await page.locator("[data-cadence-text-layer]").count();
      if (effective !== "none") assert(independentText > 0, "independent direct label must paint changed-only text");
      await update({ wide: false, active: "b", label: "Alpha", quantity: 20 });
      await page.waitForTimeout(50);
      const quantity = await page
        .locator("#quantity")
        .evaluate((n) => ({ text: n.textContent, reels: document.querySelectorAll("[data-cadence-reel]").length }));
      if (effective === "full") assert(quantity.reels > 0, "direct trigger and panel quantities execute real reels");
      report.beforeReduction = await page.evaluate(sample);
      await update({ mode: "reduced" });
      const reduced = await page.evaluate(sample);
      report.reducedDiagnostic = reduced;
      assert(!reduced.markerEffects.some((a) => a.frames.some((f) => f.transform)));
      assert.equal(await page.locator("[data-cadence-reel]").count(), 0);
      await update({ mode: "none" });
      assert.equal(await page.locator("[data-cadence-text-layer]").count(), 0);
      await update({ mode, label: "Alpha overview extended" });
      await page.waitForTimeout(40);
      await update({ clock: 0 });
      const zero = await page.evaluate(sample);
      assert(!zero.listEffects.some((a) => a.frames.some((f) => f.width || f.height)));
      await update({ clock: 4, active: "a", variant: "default", invalid: true });
      assert.equal(
        await page
          .locator('#list [data-slot="tabs-indicator"]')
          .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => f.transform)).length),
        0,
        "filled plate readable immediate placement",
      );
      const paint = await page.evaluate(async () => {
        const marker = document.querySelector('#list [data-slot="tabs-indicator"]'),
          tab = document.getElementById("tab-b");
        marker.style.setProperty("--motion-source-duration-fast", "0.05s");
        tab.style.setProperty("--motion-source-duration-fast", "1s");
        document.documentElement.classList.add("dark");
        tab.focus();
        const frames = [];
        for (let i = 0; i < 5; i++) {
          await new Promise(requestAnimationFrame);
          frames.push({
            readable: window.tabsPaletteReadable(),
            foreground: getComputedStyle(tab).color,
            marker: getComputedStyle(marker).backgroundColor,
          });
        }
        document.documentElement.style.setProperty("--foreground", "red");
        await new Promise(requestAnimationFrame);
        const unknown = {
          color: getComputedStyle(tab).color,
          clock: getComputedStyle(tab).transitionDuration,
          inline: tab.style.color,
        };
        document.documentElement.style.removeProperty("--foreground");
        document.documentElement.classList.remove("dark");
        marker.style.removeProperty("--motion-source-duration-fast");
        tab.style.removeProperty("--motion-source-duration-fast");
        return { frames, unknown };
      });
      assert(
        paint.frames.every((frame) => frame.readable),
        "independent marker/foreground clocks and immediate focus keep the actual neutral pair readable",
      );
      assert.equal(paint.unknown.color, "rgb(255, 0, 0)");
      assert.equal(paint.unknown.inline, "");
      assert(
        paint.unknown.clock.split(",").every((v) => parseFloat(v) === 0),
        "unknown palette commits exact immediate cascade",
      );
      await page.locator("#tab-a").focus();
      await page.keyboard.press("ArrowRight");
      assert.equal(await page.locator("#tab-b").evaluate((n) => n === document.activeElement), true);
      assert.equal(
        await page.locator("#tab-a").getAttribute("aria-selected"),
        "true",
        "manual activation is unchanged",
      );
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#tab-b").getAttribute("aria-selected"), "true");
      const focused = await page.locator("#tab-b").evaluate((n) => getComputedStyle(n).transitionDuration);
      assert(
        focused.split(",").every((v) => parseFloat(v) === 0),
        "focus/invalid entire trigger paint is immediate",
      );
      await update({ rtl: true, scroll: true, variant: "line", invalid: false, active: "a" });
      await page.locator("#tab-a").focus();
      await page.keyboard.press("ArrowLeft");
      assert(await page.locator("#tab-b").evaluate((n) => n === document.activeElement), "native RTL arrow direction");
      await page.keyboard.press("Enter");
      const scrolling = await page.locator("#list").evaluate(async (n) => {
        const before = [n.scrollWidth, n.scrollHeight];
        n.scrollLeft -= 30;
        await new Promise(requestAnimationFrame);
        return { before, after: [n.scrollWidth, n.scrollHeight] };
      });
      assert.deepEqual(scrolling.after, scrolling.before, "decorative marker preserves scroll extent");
      await update({ transform: true, wide: true, reorder: true, vertical: true });
      const fallback = await page.evaluate(sample);
      assert(!fallback.markerEffects.some((a) => a.frames.some((f) => f.transform)));
      assert.equal(await page.locator("#list").evaluate((n) => n.style.transform), "translateX(8px) scale(0.9)");
      await update({ active: null });
      assert.equal(await page.locator('#list [data-slot="tabs-indicator"]').evaluate((n) => n.hidden), true);
      await update({ transform: false, wide: false, active: "a", vertical: false, removed: true });
      await update({ removed: false });
      assert(
        await page.evaluate(() => window.tabsMarker === document.querySelector('#list [data-slot="tabs-indicator"]')),
      );
      await update({ key: 1, active: "a" });
      assert.equal(await page.locator("#draft").inputValue(), "saved draft", "replacement follows native mount policy");
      await page.evaluate(() => window.tabsUnmount());
      assert.equal(await page.locator("[data-cadence-text-layer],[data-cadence-reel]").count(), 0);
      assert.deepEqual(errors, []);
      report.cases.push({
        os,
        mode,
        effective,
        initial,
        revision,
        duringReflow,
        activation,
        reduced,
        zero,
        fallback,
        focused,
        quantity,
        paint,
        shrink,
        errors,
      });
      await context.close();
    }
  for (const width of [390, 1280])
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.goto(url);
      await page.waitForFunction(() => window.tabsReady);
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
        window.tabsUpdate({ mode: "none", clock: 0, active: "a", nested: true });
      }, theme);
      await page.screenshot({ path: path.join(output, `${theme}-${width}.png`), fullPage: true });
      await page.close();
    }
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJS.newPage();
  await page.goto(url);
  assert.equal(await page.locator("#tab-b").getAttribute("aria-selected"), "true");
  assert.equal(await page.locator("#panel-b").textContent(), "Panel pending");
  assert((await page.locator("#panel-b").boundingBox()).height > 0);
  await noJS.close();
  report.noJS = true;
  report.passed = true;
} catch (error) {
  report.errors.push(error.stack);
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  report.resources.closed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
