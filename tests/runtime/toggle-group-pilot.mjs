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

assert(process.env.GROUP_OUTPUT);
const output = path.resolve(process.env.GROUP_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.GROUP_COPY;
let installation;
if (process.env.GROUP_INSTALL) {
  const payloads = new Map();
  const queue = ["toggle-group", "animated-number"];
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
  const groupPlan = installationPlan(
    [...payloads.values()].map(({ item }) => item),
    "toggle-group",
  );
  const numericPlan = installationPlan(
    [...payloads.values()].map(({ item }) => item),
    "animated-number",
  );
  const plan = {
    ...groupPlan,
    files: [...new Map([...groupPlan.files, ...numericPlan.files].map((f) => [f.target, f])).values()],
  };
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
  entryPoints: ["tests/runtime/toggle-group-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/toggle-group-pilot-ssr.jsx"],
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
        "public/r/toggle-group.json",
        "content/components/toggle-group.mdx",
        "docs/motion/components/toggle-group.md",
        "app/globals.css",
        "tests/runtime/toggle-group-pilot.jsx",
        "tests/runtime/toggle-group-pilot-ssr.jsx",
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
      : `<!doctype html><html lang="en"><title>Toggle Group runtime</title><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.groupInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;

let browser;
const _box = (node) => node.getBoundingClientRect().toJSON();
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.stack));
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
      await page.waitForFunction(() => window.groupReady && document.getElementById("portal-group"));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"));
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      const update = (patch) => page.evaluate((value) => window.groupUpdate(value), patch);
      const frames = (count = 6, ancestorExtent = false) =>
        page.evaluate(
          async ({ count, ancestorExtent }) => {
            const result = [];
            for (let i = 0; i < count; i++) {
              if (ancestorExtent) document.getElementById("native-form").style.height = `${150 + i}px`;
              await new Promise(requestAnimationFrame);
              const root = document.getElementById("main-group"),
                marker = root.querySelector(':scope > [data-slot="toggle-group-indicator"]');
              const target = root.querySelector('[aria-pressed="true"]');
              result.push({
                marker: marker.getBoundingClientRect().toJSON(),
                rootHeight: root.getBoundingClientRect().height,
                target: target?.getBoundingClientRect().toJSON(),
                hidden: marker.hidden,
                transform: getComputedStyle(marker).transform,
                selected: [...root.querySelectorAll('[aria-pressed="true"]')].map((n) => n.id),
                itemTransform: getComputedStyle(document.getElementById("item-b")).transform,
                markerWriters: marker
                  .getAnimations()
                  .filter((a) => a.effect?.getKeyframes().some((f) => "transform" in f)).length,
                readable: window.groupReadable(),
                otherTransform: getComputedStyle(
                  document.querySelector('#other-group > [data-slot="toggle-group-indicator"]'),
                ).transform,
              });
            }
            if (ancestorExtent) document.getElementById("native-form").style.removeProperty("height");
            return result;
          },
          { count, ancestorExtent },
        );
      const aligned = async () => {
        await page.waitForFunction(() => {
          const root = document.getElementById("main-group"),
            marker = root.querySelector(':scope > [data-slot="toggle-group-indicator"]'),
            target = root.querySelector('[aria-pressed="true"]');
          if (!target) return marker.hidden;
          const a = marker.getBoundingClientRect(),
            b = target.getBoundingClientRect();
          return (
            !marker.hidden &&
            Math.abs(a.x - b.x) < 1 &&
            Math.abs(a.y - b.y) < 1 &&
            Math.abs(a.width - b.width) < 1 &&
            Math.abs(a.height - b.height) < 1
          );
        });
      };
      assert.equal(await page.locator("#main-group").getAttribute("data-motion"), effective);
      await aligned();
      assert.equal(await page.locator("#main-group").evaluate((n) => getComputedStyle(n).opacity), "1");
      await update({ size: "lg" });
      const sizeFrames = await frames(8);
      assert(
        sizeFrames.every((f) => f.target.height === 40),
        "native item size is final while its group shell interpolates",
      );
      if (effective === "full")
        assert(
          sizeFrames.some((f) => f.rootHeight > 44 && f.rootHeight < 48),
          "horizontal explicit size owns measured shell height",
        );
      else assert(sizeFrames.every((f) => f.rootHeight === 48));
      await update({ clock: 0, size: "default" });
      await update({ clock: 4 });
      await page.evaluate(() => {
        window.original = document.getElementById("item-b");
        window.changedText = document.querySelector('#item-a [data-slot="toggle-group-text"]').firstChild;
        window.textNode = document.querySelector('#item-b [data-slot="toggle-group-text"]').firstChild;
      });
      // Independent changed-run paint is distinct from the required concurrent safety case.
      await update({ label: "Alpha summary" });
      await page.waitForTimeout(60);
      const textPaint = await page.evaluate(() => {
        const anchor = document
          .querySelector('#item-a [data-slot="toggle-group-text"]')
          .getAttribute("data-cadence-layout-anchor");
        return anchor
          ? [...document.querySelectorAll("[data-cadence-text-layer]")]
              .filter((layer) => layer.style.left.includes(`--cadence-display-${anchor} `))
              .reduce((n, layer) => n + layer.querySelectorAll("canvas").length, 0)
          : 0;
      });
      if (effective !== "none" && !textPaint) {
        console.log(JSON.stringify(await page.evaluate(() => window.groupProbe()), null, 2));
        console.log(
          JSON.stringify(
            await page.evaluate(() => ({
              anchor: document.querySelector('#item-a [data-slot="toggle-group-text"]').outerHTML,
              layers: [...document.querySelectorAll("[data-cadence-text-layer]")].map((n) => ({
                left: n.style.left,
                html: n.outerHTML.slice(0, 160),
              })),
              ancestry: [
                ...(function* (n) {
                  while (n) {
                    yield n;
                    n = n.parentElement;
                  }
                })(document.getElementById("item-a")),
              ].map((n) => ({
                slot: n.dataset.slot,
                transform: getComputedStyle(n).transform,
                animations: n.getAnimations().map((a) => ({ state: a.playState, frames: a.effect?.getKeyframes() })),
              })),
            })),
            null,
            2,
          ),
        );
      }
      if (effective !== "none") assert(textPaint > 0, "owned primitive changed runs execute");
      const knownGeometry = await page.evaluate(() => window.groupProbe());
      let unknownCancellation;
      if (effective !== "none") {
        await page.evaluate(() => {
          window.foreignGeometry = document
            .getElementById("main-group")
            .animate([{ transform: "translateX(0px)" }, { transform: "translateX(8px)" }], {
              duration: 1500,
              fill: "both",
            });
        });
        await page.waitForFunction(
          () =>
            !document
              .querySelector('#item-a [data-slot="toggle-group-text"]')
              .hasAttribute("data-cadence-layout-anchor"),
        );
        const translation = await page.evaluate(() => ({
          same: window.changedText === document.querySelector('#item-a [data-slot="toggle-group-text"]').firstChild,
          text: document.querySelector('#item-a [data-slot="toggle-group-text"]').textContent,
        }));
        assert(translation.same);
        assert.equal(translation.text, "Alpha summary");
        await page.evaluate(() => window.foreignGeometry.cancel());
        await update({ label: "Alpha overview" });
        await page.waitForFunction(() =>
          document.querySelector('#item-a [data-slot="toggle-group-text"]').hasAttribute("data-cadence-layout-anchor"),
        );
        await page.evaluate(() => {
          window.foreignGeometry = document
            .getElementById("main-group")
            .animate([{ transform: "scale(1)" }, { transform: "scale(0.98)" }], { duration: 1500, fill: "both" });
        });
        await page.waitForFunction(
          () =>
            !document
              .querySelector('#item-a [data-slot="toggle-group-text"]')
              .hasAttribute("data-cadence-layout-anchor"),
        );
        const scale = await page.evaluate(() => ({
          same: window.changedText === document.querySelector('#item-a [data-slot="toggle-group-text"]').firstChild,
          text: document.querySelector('#item-a [data-slot="toggle-group-text"]').textContent,
        }));
        assert(scale.same);
        assert.equal(scale.text, "Alpha overview");
        await page.evaluate(() => window.foreignGeometry.cancel());
        unknownCancellation = { translation, scale };
      }
      await update({ clock: 0, label: "Alpha overview" });
      await update({ clock: 4, value: ["c"] });
      await page.evaluate(() => {
        window.otherMarker = document.querySelector('#other-group > [data-slot="toggle-group-indicator"]');
        document.querySelectorAll("#other-group button")[1].click();
      });
      const selection = await frames(8);
      assert(
        selection.every((f) => f.markerWriters <= 1),
        "one plate transform owner",
      );
      if (effective === "full")
        assert(
          selection.some((f) => f.transform !== "none" && f.readable),
          "actual safe travelling plate",
        );
      else
        assert(
          selection.every((f) => f.transform === "none"),
          "restricted plate places immediately",
        );
      if (effective === "full")
        assert(
          selection.some((f) => f.transform !== "none" && f.otherTransform !== "none"),
          "two equal-value groups project independently at the same time",
        );
      await update({ value: ["a"] });
      const reversal = await frames(6);
      await update({ clock: 0, value: ["b"] });
      await aligned();
      await update({ clock: 4 });
      // Fixed selection: shrink the preceding label, then reorder. Plate shares the item's reflow.
      await update({ label: "A" });
      const reflow = await frames(9);
      for (const frame of reflow) {
        assert(Math.abs(frame.marker.x - frame.target.x) < 1, "plate stays attached during fixed-value reflow");
        assert(frame.markerWriters <= 1);
      }
      if (effective === "full")
        assert(
          reflow.some((f) => f.transform !== "none"),
          "strip projection actually runs",
        );
      await update({ reorder: true });
      const reordered = await frames(5);
      await update({ clock: 0, label: "Alpha overview", reorder: false, value: ["b"] });
      await update({ clock: 4 });
      await update({ value: ["c"], label: "A" });
      const combined = await frames(7, true);
      assert(combined.every((f) => f.markerWriters <= 1));
      if (effective === "full")
        assert(
          combined.some((f) => f.transform !== "none" && f.itemTransform !== "none"),
          "safe combined selection and strip changes keep their coupled full effect",
        );
      if (effective === "full")
        assert(
          combined.every((f) => f.markerWriters === 1),
          "common ancestor extent changes preserve the safe coupled writer",
        );
      else assert(combined.every((f) => f.transform === "none"));
      const beforeRetarget = await page
        .locator('#main-group > [data-slot="toggle-group-indicator"]')
        .evaluate((n) => n.getBoundingClientRect().x);
      await update({ value: ["a"], label: "Al" });
      const afterRetarget = await page
        .locator('#main-group > [data-slot="toggle-group-indicator"]')
        .evaluate((n) => n.getBoundingClientRect().x);
      if (effective === "full")
        assert(Math.abs(beforeRetarget - afterRetarget) < 6, "combined retarget continues from its displayed origin");
      await frames(3);
      await update({ clock: 0 });
      await aligned();
      assert.equal(await page.evaluate(() => window.original === document.getElementById("item-b")), true);
      assert.equal(
        await page.evaluate(
          () => window.textNode === document.querySelector('#item-b [data-slot="toggle-group-text"]').firstChild,
        ),
        true,
      );
      assert.equal(
        await page.evaluate(
          () => window.changedText === document.querySelector('#item-a [data-slot="toggle-group-text"]').firstChild,
        ),
        true,
      );
      // A held key is native state; zero full clock preserves its authored pose.
      await update({ value: ["b"], clock: 4 });
      await page.locator("#item-b").focus();
      await page.keyboard.down("Space");
      await update({ label: "Latest label", value: ["c"], size: "sm" });
      await update({ clock: 0 });
      const held = await page
        .locator('#item-b [data-slot="toggle-group-content"]')
        .evaluate((n) => getComputedStyle(n).transform);
      assert.equal(held, effective === "full" ? "matrix(0.97, 0, 0, 0.97, 0, 0)" : "none");
      const concurrent = await frames(3);
      assert(
        concurrent.every((f) => f.transform === "none" && f.markerWriters === 0 && f.selected.join() === "item-c"),
        "held geometry settles atomically at the latest selection with no old plate writer",
      );
      assert.equal(await page.locator("#main-group").evaluate((n) => n.getBoundingClientRect().height), 40);
      assert.equal(
        await page
          .locator("#item-b")
          .evaluate(
            (n) => n.getAnimations().filter((a) => a.effect?.getKeyframes().some((f) => "transform" in f)).length,
          ),
        0,
      );
      await page.keyboard.up("Space");
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('#item-b [data-slot="toggle-group-content"]')).transform === "none",
      );
      assert.equal(await page.locator("#item-b").evaluate((n) => document.activeElement === n), true);
      await page.evaluate(() => {
        const button = document.getElementById("item-b");
        const host = button.querySelector('[data-slot="toggle-group-text"]');
        window.disabledIdentity = { button, host, text: host.firstChild };
      });
      await page.keyboard.down("Space");
      await update({ disabled: true });
      assert(await page.locator("#item-b").isDisabled());
      assert(
        await page.evaluate(() => {
          const { button, host, text } = window.disabledIdentity;
          return (
            document.getElementById("item-b") === button &&
            button.querySelector('[data-slot="toggle-group-text"]') === host &&
            host.firstChild === text &&
            getComputedStyle(button.querySelector('[data-slot="toggle-group-content"]')).transform === "none"
          );
        }),
        "disabling held item retains native button, content host and Text while clearing press",
      );
      await page.keyboard.up("Space");
      await update({ disabled: false });
      // Pointer capture belongs to the native target and survives a timing downgrade.
      await update({ clock: 4, value: ["b"] });
      await page.locator("#item-b").hover();
      await page.mouse.down();
      await update({ clock: 0, label: "Captured label", size: "lg", value: ["c"] });
      assert.equal(await page.locator("#item-b").evaluate((n) => n.hasPointerCapture(window.groupPointer)), true);
      assert.equal(await page.locator("#item-c").getAttribute("aria-pressed"), "true");
      assert.equal(
        await page.locator('#item-b [data-slot="toggle-group-content"]').evaluate((n) => getComputedStyle(n).transform),
        effective === "full" ? "matrix(0.97, 0, 0, 0.97, 0, 0)" : "none",
      );
      await page.mouse.up();
      assert.equal(await page.locator("#item-b").evaluate((n) => n.hasPointerCapture(window.groupPointer)), false);
      // Live downgrade and zero clock cancel the SAME physical marker and item hosts.
      await update({ mode: "full", clock: 4, value: ["a"] });
      await frames(3);
      await update({ mode: "none" });
      assert((await frames(3)).every((f) => f.transform === "none" && f.markerWriters === 0));
      await update({ mode, multiple: false, value: ["b"], clock: 4 });
      await frames(1);
      await update({ value: ["a"] });
      await page.evaluate(() => document.querySelectorAll("#other-group button")[0].click());
      await frames(2);
      await update({ mode, multiple: true, value: ["a", "b"], clock: 4 });
      if (effective === "full")
        assert(
          (await frames(2)).some((f) => f.otherTransform !== "none"),
          "retiring this group's shared plate cannot retire another group's active plate",
        );
      assert.equal(await page.locator('#main-group > [data-slot="toggle-group-indicator"]').getAttribute("hidden"), "");
      assert.equal(await page.locator('#main-group [data-slot="toggle-group-local-indicator"]').count(), 4);
      await update({ label: "A", reorder: false });
      await frames(4);
      const local = await page.locator('#main-group [data-slot="toggle-group-local-indicator"]').evaluateAll((nodes) =>
        nodes.map((n) => ({
          parent: n.parentElement.id,
          parentTransform: getComputedStyle(n.parentElement).transform,
          transform: getComputedStyle(n).transform,
        })),
      );
      await update({ clock: 0 });
      await page.locator("#item-c").click();
      assert.equal(await page.locator("#item-c").getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator("#other-group [aria-pressed=true]").textContent(), "Alpha");
      await update({ multiple: false, value: [], key: 1 });
      await frames(2);
      assert.equal(
        await page.evaluate(
          () => window.otherMarker === document.querySelector('#other-group > [data-slot="toggle-group-indicator"]'),
        ),
        true,
      );
      assert((await frames(1))[0].hidden, "empty value never invents selection");
      await update({ value: ["b"] });
      await aligned();
      await update({ value: ["a"], removed: true });
      assert((await frames(1))[0].hidden);
      await update({ removed: false, value: ["b"] });
      await aligned();
      // Roving focus skips disabled items without selecting; form defaults remain native.
      await page.locator("#item-c").focus();
      await page.keyboard.press("Home");
      assert.equal(await page.locator("#item-a").evaluate((n) => document.activeElement === n), true);
      assert.equal(await page.locator("#item-b").getAttribute("aria-pressed"), "true");
      await page.keyboard.press("End");
      assert.equal(await page.locator("#item-c").evaluate((n) => document.activeElement === n), true);
      await page.keyboard.press("Space");
      assert.equal(await page.locator("#item-c").getAttribute("aria-pressed"), "true");
      assert.equal(await page.evaluate(() => window.submissions ?? 0), 0);
      await page.locator("input").fill("Native editing");
      assert.equal(await page.locator("input").inputValue(), "Native editing");
      // Scroll uses group-content coordinates; invalid relative mapping settles as one unit.
      await update({ rtl: true, vertical: true, scroll: true, clock: 4, value: ["b"], label: "A" });
      await aligned();
      await update({ value: ["c"], label: "Alpha detail" });
      await page.locator("#item-c").focus();
      await page.evaluate(() => (document.getElementById("main-group").scrollTop = 40));
      await frames(3);
      await update({ clock: 0 });
      await aligned();
      const scrollExtent = await page.locator("#main-group").evaluate((n) => ({ w: n.scrollWidth, h: n.scrollHeight }));
      await update({ value: ["a"] });
      await aligned();
      const scrollExtentAfter = await page
        .locator("#main-group")
        .evaluate((n) => ({ w: n.scrollWidth, h: n.scrollHeight }));
      assert.deepEqual(scrollExtentAfter, scrollExtent, "decoration does not extend scroll extent");
      await update({ vertical: false, value: ["c"] });
      await page.locator("#item-c").focus();
      await page.evaluate(() => {
        document.getElementById("main-group").scrollLeft = -60;
        window.scrollTo(0, 40);
      });
      await aligned();
      await update({ transform: true, value: ["b"] });
      assert(
        (await frames(2)).every((f) => f.transform === "none"),
        "unsafe coordinate map is immediate",
      );
      // Numeric-looking option stays text; explicit quantity is its separately composed renderer.
      await update({
        transform: false,
        rtl: false,
        vertical: false,
        scroll: false,
        number: 20,
        quantity: 20,
        clock: 4,
      });
      assert.equal(await page.locator("#number-option").textContent(), "20");
      assert.equal(await page.locator('#number-option [data-slot="animated-number"]').count(), 0);
      assert.equal(await page.locator('#rich-option [data-slot="toggle-group-text"]').count(), 0);
      assert.equal(await page.locator('#quantity-option [data-slot="animated-number"]').count(), 1);
      assert.equal(await page.locator("#edited-option").textContent(), "Alpha detail");
      await update({ custom: true, clock: 0 });
      assert.equal(await page.locator('#item-b [data-slot="toggle-group-content"]').count(), 0);
      assert.equal(await page.locator("#item-b").getAttribute("data-custom"), "yes");
      await update({ custom: false, variant: "outline", palette: true, value: ["b"], clock: 4 });
      await page.locator("#item-b").focus();
      const colourSafety = await frames(4);
      assert(colourSafety.every((f) => f.markerWriters <= 1));
      await update({ multiple: true, value: ["a", "b"], variant: "default" });
      await update({ multiple: false, clock: 0 });
      await page.locator("#uncontrolled button").nth(1).click();
      assert.equal(await page.locator("#uncontrolled button").nth(1).getAttribute("aria-pressed"), "true");
      await update({ later: true, parent: true, clock: 4 });
      const entrance = await page
        .locator("#later-group")
        .evaluate((n) => n.getAnimations().filter((a) => a.effect?.getKeyframes().some((f) => "opacity" in f)).length);
      if (effective !== "none" && !entrance)
        console.log(
          JSON.stringify(
            await page.evaluate(() => ({
              flights: window.flights
                .filter((f) => f.node.id === "later-group")
                .map((f) => ({ frames: f.frames, state: f.a.playState })),
              mode: document.querySelector("#later-group")?.dataset.motion,
              clock: window.groupState.clock,
            })),
            null,
            2,
          ),
        );
      if (effective !== "none") assert(entrance > 0, "one real group entrance");
      assert.equal(
        await page
          .locator("#inherited-group")
          .evaluate(
            (n) => n.getAnimations().filter((a) => a.effect?.getKeyframes().some((f) => "opacity" in f)).length,
          ),
        0,
      );
      const axe = await new AxeBuilder({ page })
        .include("#main-group")
        .include("#identities")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(axe.violations, []);
      await page.evaluate(() => window.groupUnmount());
      assert.equal(
        await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
        0,
      );
      assert.deepEqual(errors, []);
      report.cases.push({
        mode,
        os,
        effective,
        textPaint,
        knownGeometry,
        unknownCancellation,
        sizeFrames,
        selection,
        reversal,
        reflow,
        reordered,
        combined,
        held,
        concurrent,
        local,
        colourSafety,
        entrance,
        passed: true,
      });
      await context.close();
    }
  for (const dark of [false, true])
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.goto(url);
      await page.waitForFunction(() => window.groupReady);
      await page.evaluate((dark) => {
        document.documentElement.classList.toggle("dark", dark);
        window.groupUpdate({ label: "Alpha details", value: ["c"] });
      }, dark);
      await page.waitForTimeout(80);
      await page.screenshot({
        path: path.join(output, `${dark ? "dark" : "light"}-${width}-intermediate.png`),
        fullPage: true,
      });
      await page.evaluate(() => window.groupUpdate({ clock: 0, label: "Alpha", value: ["b"] }));
      await page.screenshot({ path: path.join(output, `${dark ? "dark" : "light"}-${width}.png`), fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      report.cases.push({ dark, width, passed: true });
      await page.close();
    }
  const nojs = await browser.newPage({ javaScriptEnabled: false });
  await nojs.goto(url);
  assert.equal(await nojs.locator("#item-b").getAttribute("aria-pressed"), "true");
  assert.equal(
    await nojs.locator('#item-b [data-slot="toggle-group-fallback"]').evaluate((n) => getComputedStyle(n).display),
    "block",
  );
  assert.equal(await nojs.locator("#main-group").evaluate((n) => getComputedStyle(n).opacity), "1");
  report.noJS = true;
  await nojs.close();
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ cases: report.cases.length, noJS: report.noJS, files: installation?.files.length }));
