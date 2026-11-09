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
import { summarizeLayoutShifts } from "../../scripts/site-js-budget.mjs";

assert(process.env.BADGE_OUTPUT);
const output = path.resolve(process.env.BADGE_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.BADGE_COPY;
let installation;
if (process.env.BADGE_INSTALL) {
  const payloads = new Map();
  const queue = ["badge"];
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
    "badge",
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
  entryPoints: ["tests/runtime/badge-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/badge-pilot-ssr.jsx"],
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
      : `<!doctype html><html><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.badgeInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1200 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.addInitScript(() => {
        window.badgeAnimations = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const a = animate.apply(this, args);
          window.badgeAnimations.push({ node: this, a, frames: args[0] });
          return a;
        };
        window.badgeShifts = [];
        new PerformanceObserver((list) =>
          window.badgeShifts.push(
            ...list
              .getEntries()
              .map((e) => ({ value: e.value, startTime: e.startTime, hadRecentInput: e.hadRecentInput })),
          ),
        ).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(`${url}?mode=${mode}`);
      await page.waitForFunction(() => window.badgeUpdate && document.getElementById("portal").children.length);
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction((m) => document.getElementById("label").dataset.motion === m, effective);
      const first = await page.evaluate(() => ({
        text: document.getElementById("label").textContent,
        number: document.getElementById("number").textContent,
        opacity: getComputedStyle(document.getElementById("label")).opacity,
        animations: window.badgeAnimations.filter(({ node }) => node.id !== "portal-badge").length,
      }));
      assert.equal(first.text, "Status pending");
      assert.equal(first.number, "19");
      assert.equal(first.opacity, "1");
      assert.equal(first.animations, 0, "hydration must not replay first presentation");
      await page.evaluate(() => {
        window.badgeText = document.querySelector('#supported-text [data-slot="badge-text"]').firstChild;
        window.badgeNode = document.getElementById("label");
        window.badgeRich = document.getElementById("rich-child");
        window.badgeUpdate({ label: "Status waiting", number: 20 });
      });
      await page.waitForTimeout(45);
      const content = await page.evaluate(() => ({
        text: document.getElementById("label").textContent,
        number: document.getElementById("number").textContent,
        identity: window.badgeText === document.querySelector('#supported-text [data-slot="badge-text"]').firstChild,
        textPaint: document.querySelectorAll("[data-cadence-text-layer] canvas").length,
        reels: document.querySelectorAll("[data-cadence-reel]").length,
        phases: [...document.querySelectorAll("[data-cadence-reel]")].map((n) => Number(n.dataset.phase)),
        compoundChild: document.getElementById("compound-badge").getAnimations().length,
        unchanged: document.getElementById("version").textContent,
      }));
      assert.equal(content.text, "Status waiting");
      assert.equal(content.number, "20");
      assert(content.identity);
      assert.equal(content.compoundChild, 0);
      assert.equal(content.unchanged, "00123 / v1.2.3");
      if (effective !== "none") assert(content.textPaint > 0, "supported status must draw real changed-run opacity");
      else assert.equal(content.textPaint, 0);
      if (effective === "full")
        assert(
          content.reels > 0 && content.phases.some((p) => p > 0 && p < 1),
          "supported quantity must paint intermediate reels",
        );
      else assert.equal(content.reels, 0);
      await page.screenshot({ path: path.join(output, `${os}-${mode}-content.png`) });
      const refBefore = await page.evaluate(() => ({ ...window.badgeRefs }));
      await page.evaluate(() => window.badgeUpdate({ variant: window.badgeState.variant }));
      const refs = await page.evaluate(() => ({
        ...window.badgeRefs,
        stable: window.badgeNode === document.getElementById("label"),
        rich: window.badgeRich === document.getElementById("rich-child"),
      }));
      assert(refs.stable && refs.rich);
      assert.equal(refs.attached - refBefore.attached, 1);
      assert.equal(refs.cleaned - refBefore.cleaned, 1);
      if (effective === "full")
        assert(
          (await page.locator("[data-cadence-reel]").count()) > 0,
          "a fresh ref does not revoke the physical owner",
        );
      // Same-target live cancellation must settle every participating property.
      await page.evaluate(() => window.badgeUpdate({ clock: 0 }));
      const zero = await page.evaluate(() => ({
        layers: document.querySelectorAll("[data-cadence-text-layer],[data-cadence-number-layer]").length,
        running: document.getAnimations().filter((a) => a.playState === "running").length,
      }));
      assert.equal(zero.layers, 0);
      assert.equal(zero.running, 0);
      // Each committed revision updates exact text immediately, including reversal/sign/width boundaries.
      for (const patch of [
        { label: "Status pending", number: 99 },
        { label: "Status waiting", number: 100 },
        { label: "Status pending", number: -1 },
        { label: "00123", number: 0 },
        { label: "v1.2.3", number: 9 },
        { label: "保存状态 — é 👩‍💻 مرحبا", number: 10 },
      ]) {
        await page.evaluate((p) => window.badgeUpdate(p), patch);
        assert.equal(await page.locator("#label").textContent(), patch.label);
        assert.equal(await page.locator("#number").textContent(), String(patch.number));
      }
      for (const number of [1000, 1.234567, -0, 1e21]) {
        await page.evaluate((number) => window.badgeUpdate({ number }), number);
        assert.equal(
          await page.locator("#number").textContent(),
          String(number),
          "direct numeric output must stay raw",
        );
      }
      const copied = await page.evaluate(() => {
        const host = document.querySelector('#supported-text [data-slot="badge-text"]');
        const range = document.createRange();
        range.selectNodeContents(host);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const text = selection.toString();
        selection.removeAllRanges();
        return { text, semantic: host.textContent, nodes: host.childNodes.length };
      });
      assert.equal(copied.text, copied.semantic);
      assert.equal(copied.nodes, 1);
      await page.evaluate(() => {
        window.badgeUpdate({ label: "A considerably longer status", clock: 0 });
        window.badgeUpdate({ clock: 4 });
        window.badgeUpdate({ label: "Ready" });
      });
      await page.waitForTimeout(40);
      const geometry = await page.evaluate(() => {
        const n = document.getElementById("label"),
          child = n.querySelector('[data-slot="badge-text"]');
        const r = n.getBoundingClientRect(),
          t = child.getBoundingClientRect();
        return {
          width: r.width,
          linkWidthWriters: document
            .getElementById("link-status")
            .getAnimations()
            .filter((a) => a.effect.getKeyframes().some((f) => "width" in f)).length,
          child: t.width,
          readable: t.left >= r.left && t.right <= r.right,
          frames: n.getAnimations().map((a) => a.effect.getKeyframes()),
          compound: document.getElementById("compound").getAnimations().length,
        };
      });
      const layoutSamples = [];
      if (effective === "full")
        for (let frame = 0; frame < 3; frame++) {
          layoutSamples.push(
            await page.evaluate(() => {
              const host = document.querySelector('#supported-text [data-slot="badge-text"]');
              const id = host.getAttribute("data-cadence-layout-anchor");
              const layer = [...document.querySelectorAll("[data-cadence-text-layer]")].find((n) =>
                n.style.left.includes(`--cadence-display-${id} `),
              );
              if (!id || !layer) return null;
              const origin = -Number(layer.style.left.replaceAll(" ", "").match(/(-?[.\d]+)px/)[1]);
              return {
                nativeLeft: host.getBoundingClientRect().left,
                origin,
                layerLeft: layer.getBoundingClientRect().left,
                canvases: layer.querySelectorAll("canvas").length,
              };
            }),
          );
          await page.waitForTimeout(35);
        }
      if (effective === "full") {
        assert(
          layoutSamples.every((s) => s && s.canvases > 0 && Math.abs(s.layerLeft - (s.nativeLeft - s.origin)) < 0.02),
          "changed pixels must follow the moving native label during width shrink",
        );
        assert.notEqual(
          layoutSamples[0].nativeLeft,
          layoutSamples[2].nativeLeft,
          "sample an actual changing shell rather than an endpoint",
        );
      }
      report.inFlight = { mode, os, content, geometry, layoutSamples };
      assert(geometry.readable);
      assert.equal(
        geometry.linkWidthWriters,
        effective === "full" ? 1 : 0,
        "a safe native anchor retains intrinsic width capability",
      );
      if (effective === "full")
        assert(
          geometry.frames.some((fs) => fs.some((f) => "width" in f)),
          "intrinsic shrink must execute measured width",
        );
      else assert.equal(geometry.frames.length, 0);
      await page.evaluate(() => window.badgeUpdate({ mode: "reduced" }));
      assert.equal(await page.locator("[data-cadence-reel]").count(), 0);
      assert.equal(
        await page.locator("#label").evaluate((n) => n.getAnimations().filter((a) => a.playState === "running").length),
        0,
      );
      await page.evaluate(
        (m) =>
          window.badgeUpdate({ mode: m, clock: 0, label: "保存状态 — Lokalisierte lange Statusmeldung", number: 19 }),
        mode,
      );
      const narrow = await page.evaluate(() => ({
        parent: document.getElementById("narrow").clientWidth,
        child: document.getElementById("constrained").getBoundingClientRect().width,
        fixed: document.getElementById("fixed").getAnimations().length,
      }));
      assert(narrow.child <= narrow.parent);
      assert.equal(narrow.fixed, 0);
      // Passive resizes do not manufacture content changes or a new width spring.
      await page.setViewportSize({ width: 390, height: 1200 });
      await page.waitForTimeout(40);
      assert.equal(await page.locator("#label").evaluate((n) => n.getAnimations().length), 0);
      await page.setViewportSize({ width: 1280, height: 1200 });
      await page.evaluate(() => {
        window.badgeUpdate({ clock: 4, label: "Status waiting", later: true, parent: true });
      });
      await page.waitForTimeout(35);
      const insertion = await page.evaluate(() => ({
        later: document
          .getElementById("later")
          .getAnimations()
          .map((a) => ({ state: a.playState, frames: a.effect.getKeyframes() })),
        parent: document.getElementById("parent-child").getAnimations().length,
      }));
      assert.equal(insertion.parent, 0);
      if (effective !== "none") assert(insertion.later.some((a) => a.state === "running"));
      await page.evaluate(() => {
        window.badgeRetained = document.getElementById("retained");
        window.badgeUpdate({ show: false });
      });
      await page.waitForTimeout(25);
      const exit = await page.evaluate(() => {
        const n = document.getElementById("retained");
        return n
          ? { inert: n.inert, hidden: n.getAttribute("aria-hidden"), opacity: getComputedStyle(n).opacity }
          : null;
      });
      if (effective !== "none") {
        assert(exit?.inert && exit.hidden === "true");
        await page.evaluate(() => window.badgeUpdate({ show: true }));
        assert(await page.evaluate(() => window.badgeRetained === document.getElementById("retained")));
      } else assert.equal(exit, null);
      await page.evaluate(() => window.badgeUpdate({ clock: 0, show: false }));
      await page.locator("#retained").waitFor({ state: "detached" });
      await page.evaluate(() => window.badgeUpdate({ clock: 0, richShow: false }));
      await page.waitForFunction(
        () =>
          document.getElementById("rich-retained")?.inert &&
          getComputedStyle(document.getElementById("rich-retained")).opacity === "0",
      );
      await page.evaluate(() => window.badgeUpdate({ mode: "none" }));
      assert.equal(await page.locator("#rich-retained").evaluate((n) => getComputedStyle(n).opacity), "0");
      await page.evaluate(() => window.badgeFinishRich());
      await page.locator("#rich-retained").waitFor({ state: "detached" });
      // Native span stays passive; a real link keeps focus, Enter and caller transforms/selectors.
      assert.equal(await page.locator("#label").getAttribute("tabindex"), null);
      await page.locator("#link").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.evaluate(() => window.badgeClicks), 1);
      await page.locator("#link").focus();
      await page.evaluate(() => window.badgeUpdate({ target: "next" }));
      assert.equal(await page.locator("#link").getAttribute("href"), "#next");
      assert.equal(await page.evaluate(() => document.activeElement.id), "link");
      const anchor = await page.locator("#anchor").evaluate((n) => ({
        translate: getComputedStyle(n).translate,
        rotate: getComputedStyle(n).rotate,
        scale: getComputedStyle(n).scale,
        transform: getComputedStyle(n).transform,
        svg: !!n.querySelector(":scope > svg"),
      }));
      assert(anchor.svg);
      assert.equal(anchor.translate, "3px 4px");
      assert.equal(anchor.scale, "0.95");
      await page.evaluate(() => window.badgeUpdate({ mode: "none", childMode: "full", clock: 4 }));
      const nestedMode = os === "reduce" ? "reduced" : "full";
      await page.waitForFunction((m) => document.getElementById("nested").dataset.motion === m, nestedMode);
      assert.equal(await page.locator("#portal-badge").getAttribute("data-motion"), nestedMode);
      await page.evaluate(() => window.badgeUpdate({ mode: "full", childMode: "none" }));
      assert.equal(await page.locator("#nested").getAttribute("data-motion"), "none");
      assert.equal(await page.locator("#portal-badge").getAttribute("data-motion"), "none");
      const callerClock = await page.locator("#anchor").evaluate((n) => getComputedStyle(n).transitionDuration);
      assert(
        callerClock.split(",").every((clock) => Number.parseFloat(clock) === 0),
        "an unverified custom render palette stays immediate",
      );
      // Real link hover colour; focus and live none cancel current CSS transitions.
      await page.locator("#link").blur();
      await page.locator("h1").hover();
      await page.waitForTimeout(1000);
      await page.locator("#link").hover();
      await page.waitForTimeout(35);
      const colour = await page.locator("#link").evaluate((n) => ({
        duration: getComputedStyle(n).transitionDuration,
        running: n
          .getAnimations()
          .filter((a) => a.playState === "running")
          .map((a) => a.transitionProperty),
      }));
      assert(colour.duration.split(",").some((n) => parseFloat(n) > 0));
      assert(colour.running.includes("background-color"));
      await page.evaluate(() => window.badgeUpdate({ mode: "none" }));
      assert.equal(
        await page.locator("#link").evaluate((n) => n.getAnimations().filter((a) => a.playState === "running").length),
        0,
      );
      await page.evaluate(() => window.badgeStandalone());
      const standalone = await page.locator("#standalone-later").evaluate((n) => ({
        mode: n.dataset.motion,
        running: n.getAnimations().some((a) => a.playState === "running"),
      }));
      assert.equal(standalone.mode, nestedMode);
      assert(standalone.running);
      const shifts = await page.evaluate(() => window.badgeShifts);
      assert.deepEqual(errors, []);
      report.cases.push({
        mode,
        os,
        effective,
        first,
        content,
        refs,
        zero,
        geometry,
        layoutSamples,
        narrow,
        insertion,
        exit,
        anchor,
        colour,
        callerClock,
        standalone,
        shifts,
        cls: summarizeLayoutShifts(shifts),
        errors,
      });
      await page.evaluate(() => window.badgeUnmount());
      assert.equal(await page.evaluate(() => window.badgeRefs.attached - window.badgeRefs.cleaned), 0);
      assert.equal(await page.locator("[data-cadence-text-layer],[data-cadence-number-layer]").count(), 0);
      await context.close();
    }
  for (const width of [390, 1280])
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.goto(url);
      await page.waitForFunction(() => window.badgeUpdate);
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
        window.badgeUpdate({ mode: "none" });
      }, theme);
      await page.screenshot({ path: path.join(output, `${theme}-${width}.png`), fullPage: true });
      await page.close();
    }
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJS.newPage();
  await page.goto(url);
  assert.equal(await page.locator("#label").textContent(), "Status pending");
  assert.equal(await page.locator("#number").textContent(), "19");
  assert.equal(await page.locator("#link").getAttribute("href"), "#target");
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
