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
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";
import { installationPlan } from "../../scripts/installation.mjs";

assert(process.env.TOGGLE_OUTPUT);
const output = path.resolve(process.env.TOGGLE_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.TOGGLE_COPY;
let installation;
if (process.env.TOGGLE_INSTALL) {
  const payloads = new Map();
  const queue = ["toggle"];
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
    "toggle",
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
  entryPoints: ["tests/runtime/toggle-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/toggle-pilot-ssr.jsx"],
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
  evidenceInputs: Object.fromEntries(
    await Promise.all(
      [
        "registry.json",
        "public/r/toggle.json",
        "content/components/toggle.mdx",
        "docs/motion/components/toggle.md",
        "app/globals.css",
        "tests/runtime/toggle-pilot.jsx",
        "tests/runtime/toggle-pilot-ssr.jsx",
        "upstream/manifest.json",
        "pnpm-lock.yaml",
      ].map(async (f) => [f, hash(await readFile(f))]),
    ),
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
      : `<!doctype html><html lang="en"><title>Toggle runtime</title><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.toggleInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      await page.addInitScript(() => {
        window.flights = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const a = animate.apply(this, args);
          window.flights.push({ node: this, a, frames: args[0] });
          return a;
        };
      });
      await page.goto(`${url}?mode=${mode}`);
      await page.waitForFunction(() => window.toggleUpdate && document.getElementById("portal-toggle"));
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      const host = page.locator("#label");
      assert.equal(await host.getAttribute("data-motion"), effective);
      assert.equal(await host.evaluate((n) => getComputedStyle(n).opacity), "1");
      assert.equal(await host.getAttribute("aria-pressed"), "false");
      await page.evaluate(() => window.toggleUpdate({ label: "Preview mode" }));
      await page.waitForTimeout(40);
      const ownedLabelPaint = await page.evaluate(() => {
        const anchor = document
          .querySelector('#label [data-slot="toggle-text"]')
          .getAttribute("data-cadence-layout-anchor");
        return anchor
          ? [...document.querySelectorAll("[data-cadence-text-layer]")]
              .filter((layer) => layer.style.left.includes(`--cadence-display-${anchor} `))
              .reduce((n, layer) => n + layer.querySelectorAll("canvas").length, 0)
          : 0;
      });
      if (effective !== "none") assert(ownedLabelPaint > 0, "exact Toggle label owns actual canvas paint");
      await page.evaluate(() => window.toggleUpdate({ label: "Preview", clock: 0 }));
      await page.waitForTimeout(30);
      await page.evaluate(() => window.toggleUpdate({ clock: 4 }));
      await page.evaluate(() => window.toggleUpdate({ label: "Preview with formatting", size: "lg" }));
      await page.waitForTimeout(60);
      const independent = await page.evaluate(() => ({
        flights: window.flights.map((f) => ({ slot: f.node.dataset.slot, frames: f.frames })),
        paint: document.querySelectorAll("[data-cadence-text-layer] canvas").length,
      }));
      if (effective === "full")
        assert(
          independent.flights.some(
            (f) => Array.isArray(f.frames) && f.frames.some((k) => "width" in k || "height" in k),
          ),
          "unfocused semantic geometry",
        );
      if (effective !== "none") assert(independent.paint > 0, "actual changed-run canvas");
      if (effective === "full")
        assert(
          (await page.locator("#compound").evaluate((n) => n.getAnimations().length)) > 0,
          "one outer group geometry flight",
        );
      await page.screenshot({ path: path.join(output, `${mode}-${os}-text-geometry.png`) });
      await page.evaluate(() => window.toggleUpdate({ label: "Preview", size: "sm", clock: 0 }));
      await page.waitForTimeout(30);
      await page.evaluate(() => window.toggleUpdate({ clock: 4 }));
      const colourBefore = await page.locator("#uncontrolled").evaluate((n) => getComputedStyle(n).backgroundColor);
      await page.locator("#uncontrolled").evaluate((n) => n.click());
      await page.waitForTimeout(35);
      const colourMiddle = await page.locator("#uncontrolled").evaluate((n) => ({
        value: getComputedStyle(n).backgroundColor,
        running: n.getAnimations().some((a) => a instanceof CSSTransition),
      }));
      await page.waitForTimeout(900);
      const colourAfter = await page.locator("#uncontrolled").evaluate((n) => getComputedStyle(n).backgroundColor);
      assert.notEqual(colourBefore, colourAfter);
      if (effective !== "none") {
        assert(colourMiddle.running, "native CSS colour clock");
        assert.notEqual(colourMiddle.value, colourAfter, "intermediate palette");
      } else assert.equal(colourMiddle.value, colourAfter);
      await page.locator("#uncontrolled").evaluate((n) => n.click());
      await page.waitForTimeout(900);
      const compound = await page
        .locator("#compound-button")
        .evaluate(
          (n) =>
            n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f)).length,
        );
      assert.equal(compound, 0, "compound owns shared geometry, never its Toggle descendant");
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
      );
      await host.focus();
      await page.keyboard.press("Space");
      assert.equal(await host.getAttribute("aria-pressed"), "true");
      assert.equal(await page.evaluate(() => window.submissions ?? 0), 0);
      await page.evaluate(() => {
        window.original = document.getElementById("label");
        window.text = document.querySelector('#label [data-slot="toggle-text"]').firstChild;
      });
      await host.hover();
      await page.mouse.down();
      await page.waitForTimeout(100);
      const held = await host.evaluate((n) => ({
        root: getComputedStyle(n).transform,
        inner: getComputedStyle(n.querySelector('[data-slot="toggle-feedback"]')).transform,
      }));
      assert.equal(held.root, "none");
      if (effective === "full") assert.notEqual(held.inner, "none");
      await page.evaluate(() =>
        window.toggleUpdate({ label: "Preview with formatting", size: "lg", number: 20, pressed: true }),
      );
      await page.waitForTimeout(65);
      const middle = await page.evaluate(() => ({
        text: document.querySelector('#label [data-slot="toggle-text"]').textContent,
        same: window.original === document.getElementById("label"),
        stableText: window.text === document.querySelector('#label [data-slot="toggle-text"]').firstChild,
        flights: window.flights.map((f) => ({ slot: f.node.dataset.slot, frames: f.frames, state: f.a.playState })),
        copied: document.getElementById("number").textContent,
        reels: document.querySelectorAll("[data-cadence-reel]").length,
      }));
      assert(middle.same && middle.stableText);
      assert.equal(middle.text, "Preview with formatting");
      const concurrent = await host.evaluate((n) => ({
        height: n.getBoundingClientRect().height,
        width: n.getBoundingClientRect().width,
        scrollWidth: n.scrollWidth,
        clientWidth: n.clientWidth,
        geometry: n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f))
          .length,
        anchor: n.querySelector('[data-slot="toggle-text"]').getAttribute("data-cadence-layout-anchor"),
      }));
      assert.equal(concurrent.height, 40, "focused concurrent size reaches lg immediately");
      assert(
        concurrent.width > 0 && concurrent.scrollWidth <= concurrent.clientWidth,
        "concurrent label stays readable",
      );
      assert.equal(concurrent.geometry, 0, "focused native shell has no retained geometry writer");
      if (effective === "full") assert.equal(concurrent.anchor, null, "held transform cancels unsafe text paint");
      assert.equal(middle.copied, "20");
      assert.equal(middle.reels, 0);
      // Focused native interaction intentionally settles shell/text presentation;
      // the independent unfocused action above proves the actual engines.
      await page.screenshot({ path: path.join(output, `${mode}-${os}-intermediate.png`) });
      // Latest target coalesces while held, then zero clock snaps without losing pressed state.
      await page.evaluate(() => window.toggleUpdate({ label: "Preview now", clock: 0 }));
      await page.waitForTimeout(40);
      assert.equal(await host.getAttribute("aria-pressed"), "true");
      assert.equal(await host.textContent(), "Preview now");
      const zeroHeld = await host.evaluate(
        (n) => getComputedStyle(n.querySelector('[data-slot="toggle-feedback"]')).transform,
      );
      assert.equal(zeroHeld, effective === "full" ? "matrix(0.97, 0, 0, 0.97, 0, 0)" : "none");
      await host.blur();
      await page.evaluate(() => window.toggleUpdate({ disabled: true }));
      await page.mouse.up();
      assert.equal(await host.getAttribute("aria-pressed"), "true");
      assert.equal(await host.evaluate((n) => getComputedStyle(n).transform), "none");
      assert.equal(
        await host.evaluate((n) => getComputedStyle(n.querySelector('[data-slot="toggle-feedback"]')).transform),
        "none",
      );
      // Independent insertion and parent ownership, portal and nested policy.
      await page.evaluate(() => window.toggleUpdate({ disabled: false, clock: 4, later: true, parent: true }));
      assert.equal(await page.locator("#nested").getAttribute("data-motion"), "none");
      assert.equal(await page.locator("#portal-toggle").getAttribute("data-motion"), effective);
      await page.waitForTimeout(60);
      if (effective !== "none") assert((await page.locator("#later").evaluate((n) => n.getAnimations().length)) > 0);
      assert.equal(await page.locator("#inherited").evaluate((n) => n.getAnimations().length), 0);
      const optional = page.locator("#optional");
      const optionalNode = await optional.elementHandle();
      await page.evaluate(() => window.toggleUpdate({ show: false }));
      await page.waitForTimeout(40);
      if (effective !== "none") {
        assert.equal(await optional.getAttribute("inert"), "");
        const opacity = await optional.evaluate((n) => Number(getComputedStyle(n).opacity));
        assert(opacity > 0 && opacity < 1, "retained exit paints an intermediate opacity");
      } else assert.equal(await optional.count(), 0);
      await page.evaluate(() => window.toggleUpdate({ show: true }));
      if (effective !== "none")
        assert(
          await optional.evaluate((n, previous) => n === previous, optionalNode),
          "retained reversal keeps native node",
        );
      await page.evaluate(() => window.toggleUpdate({ label: "Preview with formatting again", size: "lg" }));
      await page.waitForTimeout(30);
      await page.evaluate(() => window.toggleUpdate({ mode: "reduced" }));
      await page.waitForTimeout(30);
      assert.equal(
        await host.evaluate(
          (n) =>
            n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f)).length,
        ),
        0,
      );
      await page.setViewportSize({ width: 800, height: 900 });
      assert.equal(
        await host.evaluate(
          (n) =>
            n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f)).length,
        ),
        0,
      );
      // Same target downgrade cancels every actual clock.
      await page.evaluate(() => window.toggleUpdate({ mode: "none", label: "Latest label", size: "sm", show: false }));
      await page.waitForTimeout(50);
      assert.equal(await host.textContent(), "Latest label");
      assert.equal(await page.locator("#optional").count(), 0);
      assert.equal(
        await host.evaluate((n) => n.getAnimations({ subtree: true }).filter((a) => a.playState === "running").length),
        0,
      );
      // Custom render changes no native host and has no injected press layer.
      await page.evaluate(() => window.toggleUpdate({ custom: true }));
      assert.equal(await host.getAttribute("data-custom"), "yes");
      assert.equal(await host.locator('[data-slot="toggle-feedback"]').count(), 0);
      assert.equal(await page.evaluate(() => window.original === document.getElementById("label")), true);
      assert.equal(await page.locator("#rich").locator('[data-slot="toggle-feedback"]').count(), 0);
      await page.locator("#uncontrolled").click();
      assert.equal(await page.locator("#uncontrolled").getAttribute("aria-pressed"), "false");
      await page.locator("input").fill("Native editing");
      assert.equal(await page.locator("input").inputValue(), "Native editing");
      await page.evaluate(() => window.toggleUnmount());
      assert.equal(
        await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
        0,
      );
      assert.deepEqual(errors, []);
      report.cases.push({
        mode,
        os,
        effective,
        independent,
        ownedLabelPaint,
        concurrent,
        colourBefore,
        colourMiddle,
        colourAfter,
        held,
        middle,
        passed: true,
      });
      await context.close();
    }
  for (const dark of [false, true])
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(url);
      await page.waitForFunction(() => window.toggleUpdate);
      await page.evaluate((dark) => {
        document.documentElement.classList.toggle("dark", dark);
        window.toggleUpdate({ pressed: true, label: "Preview with formatting", size: "lg" });
      }, dark);
      await page.waitForTimeout(1000);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `${dark ? "dark" : "light"}-${width}.png`), fullPage: true });
      report.cases.push({ dark, width, passed: true });
      await page.close();
    }
  const nojs = await browser.newPage({ javaScriptEnabled: false });
  await nojs.goto(url);
  assert.equal(await nojs.locator("#label").textContent(), "Preview");
  assert.equal(await nojs.locator("#label").evaluate((n) => getComputedStyle(n).opacity), "1");
  report.noJS = true;
  await nojs.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ cases: report.cases.length, noJS: report.noJS, files: installation?.files.length }));
