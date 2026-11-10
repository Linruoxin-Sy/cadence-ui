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

assert(process.env.CARD_OUTPUT);
const output = path.resolve(process.env.CARD_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.CARD_COPY;
let installation;
if (process.env.CARD_INSTALL) {
  const payloads = new Map();
  const queue = ["card"];
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
    "card",
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
  entryPoints: ["tests/runtime/card-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/card-pilot-ssr.jsx"],
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
      : `<!doctype html><html><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.cardInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1400 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.addInitScript(() => {
        window.cardAnimations = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const a = animate.apply(this, args);
          window.cardAnimations.push({ node: this, a, frames: args[0] });
          return a;
        };
      });
      await page.goto(`${url}?mode=${mode}`);
      await page.waitForFunction(() => window.cardReady && document.getElementById("portal-card"));
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction((m) => document.getElementById("fit").dataset.motion === m, effective);
      const first = await page.evaluate(() => ({
        text: document.getElementById("title").textContent,
        number: document.getElementById("quantity").textContent,
        opacity: getComputedStyle(document.getElementById("fit")).opacity,
        animations: window.cardAnimations.filter((r) => !r.node.closest("#portal-card")).length,
      }));
      assert.equal(first.text, "Status pending");
      assert.equal(first.number, "19");
      assert.equal(first.opacity, "1");
      assert.equal(first.animations, 0, "SSR hydration must not replay or allocate geometry");
      await page.evaluate(() => {
        window.originalCard = document.getElementById("fit");
        window.originalText = document.querySelector('#sizing-title [data-slot="card-text"]').firstChild;
        window.originalInput = document.getElementById("native-memo");
        window.originalMounts = window.cardMounts;
        window.cardUpdate({ title: "Status ready", description: "Review ready", number: 20, size: "sm" });
      });
      await page.waitForTimeout(45);
      const change = await page.evaluate(() => ({
        title: document.getElementById("title").textContent,
        number: document.getElementById("quantity").textContent,
        identity: window.originalText === document.querySelector('#sizing-title [data-slot="card-text"]').firstChild,
        textPaint: document.querySelectorAll("[data-cadence-text-layer] canvas").length,
        reels: document.querySelectorAll("[data-cadence-reel]").length,
        phases: [...document.querySelectorAll("[data-cadence-reel]")].map((n) => +n.dataset.phase),
        size: document.getElementById("sizing").getBoundingClientRect().height,
        writers: document
          .getElementById("sizing")
          .getAnimations()
          .map((a) => a.effect.getKeyframes()),
        normalWriters: document
          .getElementById("normal")
          .getAnimations()
          .map((a) => a.effect.getKeyframes()),
      }));
      report.lastChange = change;
      assert.equal(change.title, "Status ready");
      assert.equal(change.number, "20");
      assert(change.identity);
      if (effective !== "none") assert(change.textPaint > 0, "full and reduced must paint changed text");
      else assert.equal(change.textPaint, 0);
      if (effective === "full") {
        assert(change.textPaint > 0, "changed text must be actually painted");
        assert(change.reels > 0 && change.phases.some((p) => p > 0 && p < 1), "quantity must draw a moving reel");
        assert(
          change.writers.some((frames) => frames.some((f) => "height" in f)),
          "Card fit must interpolate height",
        );
        assert(
          change.normalWriters.some((frames) => frames.some((f) => "height" in f)),
          "wrapper-free Card must interpolate height",
        );
      } else {
        assert.equal(change.reels, 0);
        assert(!change.writers.some((frames) => frames.some((f) => "height" in f || "width" in f)));
      }
      const samples = [];
      if (effective === "full")
        for (let frame = 0; frame < 3; frame++) {
          samples.push(
            await page.evaluate(() => {
              const host = document.querySelector('#sizing-title [data-slot="card-text"]'),
                id = host.getAttribute("data-cadence-layout-anchor"),
                layer = [...document.querySelectorAll("[data-cadence-text-layer]")].find((n) =>
                  n.style.left.includes(`--cadence-display-${id} `),
                );
              if (!id || !layer) return null;
              const x = layer.style.left.replaceAll(" ", "").match(/(-?[.\d]+)px/),
                y = layer.style.top.replaceAll(" ", "").match(/(-?[.\d]+)px/);
              return {
                nativeLeft: host.getBoundingClientRect().left,
                nativeTop: host.getBoundingClientRect().top,
                layerLeft: layer.getBoundingClientRect().left,
                layerTop: layer.getBoundingClientRect().top,
                originX: -Number(x?.[1]),
                originY: -Number(y?.[1]),
                canvases: layer.querySelectorAll("canvas").length,
              };
            }),
          );
          await page.waitForTimeout(35);
        }
      if (effective === "full")
        assert(
          samples.every(
            (s) =>
              s &&
              s.canvases > 0 &&
              Math.abs(s.layerLeft - (s.nativeLeft - s.originX)) < 0.05 &&
              Math.abs(s.layerTop - (s.nativeTop - s.originY)) < 0.05,
          ),
          "text pixels must track natural layout while Card size changes",
        );
      await page.evaluate(() => {
        window.cardUpdate({ mode: "none" });
      });
      const cancelled = await page.evaluate(() => ({
        layers: document.querySelectorAll("[data-cadence-reel],[data-cadence-text-layer]").length,
        running: document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === "running" &&
              ["fit", "sizing", "normal", "portal-card"].some((id) =>
                document.getElementById(id)?.contains(a.effect?.target),
              ),
          ).length,
      }));
      assert.equal(cancelled.layers, 0);
      assert.equal(cancelled.running, 0);
      await page.evaluate(() =>
        window.cardUpdate({
          mode: "full",
          clock: 4,
          nested: true,
          childMode: "none",
          size: "default",
          title: "Nested ready",
        }),
      );
      await page.waitForTimeout(30);
      const nestedGeometry = await page.evaluate(() => ({
        root: document
          .getElementById("fit")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "height" in f || "width" in f)).length,
        child: document.getElementById("nested").getAnimations().length,
      }));
      if (os === "no-preference")
        assert(nestedGeometry.root > 0, "none child must not cancel the full parent geometry");
      assert.equal(nestedGeometry.child, 0);
      await page.evaluate(() => window.cardUpdate({ mode: "none", clock: 0, childMode: "full", number: 19 }));
      await page.evaluate(() => window.cardUpdate({ clock: 4, number: 20 }));
      await page.waitForTimeout(35);
      const independentChild = await page.evaluate(() => ({
        reels: document.querySelectorAll("#nested [data-cadence-reel]").length,
        parent: document
          .getElementById("fit")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "height" in f || "width" in f)).length,
        mode: document.querySelector('#nested [data-slot="card-number"]').dataset.motion,
      }));
      // Reel paint is transported to the document layer, identified by its host anchor.
      const childReel = await page.evaluate(() => {
        const host = document.querySelector('#nested [data-slot="card-number"]'),
          id = host.getAttribute("data-cadence-layout-anchor");
        return (
          !!id &&
          [...document.querySelectorAll("[data-cadence-number-layer]")].some((n) =>
            n.style.left.includes(`--cadence-display-${id} `),
          )
        );
      });
      assert.equal(independentChild.parent, 0);
      assert.equal(independentChild.mode, os === "reduce" ? "reduced" : "full");
      if (os === "no-preference") assert(childReel, "explicit full child may roll independently under a none parent");
      await page.evaluate(() => window.cardUpdate({ nested: false, childMode: undefined, clock: 0, size: "sm" }));
      await page.evaluate(() =>
        window.cardUpdate({
          mode: "full",
          clock: 0,
          title: "A considerably longer record",
          description: "Review pending",
          number: 99,
          size: "default",
        }),
      );
      await page.evaluate(() => window.cardUpdate({ clock: 4, title: "Ready", number: 100, size: "sm" }));
      await page.waitForTimeout(35);
      const beforeRef = await page.evaluate(() => {
        const n = document.getElementById("sizing");
        window.savedCardGeometry = document
          .getElementById("fit")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f));
        window.savedGeometry = n
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f));
        return window.savedGeometry.length;
      });
      await page.evaluate(() => window.cardUpdate({ refKey: 1 }));
      if (effective === "full")
        assert(
          await page.evaluate(() =>
            window.savedGeometry.every((a) => document.getElementById("sizing").getAnimations().includes(a)),
          ),
          "ref-only rerender must retain actual geometry handles",
        );
      if (os === "no-preference")
        assert(
          await page.evaluate(
            () =>
              window.savedCardGeometry.length > 0 &&
              window.savedCardGeometry.every((a) => document.getElementById("fit").getAnimations().includes(a)),
          ),
          "rebound caller ref must preserve the same Card's active size writer",
        );
      await page.evaluate(() => window.cardUpdate({ clock: 0 }));
      assert.equal(await page.locator("[data-cadence-reel],[data-cadence-text-layer]").count(), 0);
      for (const patch of [
        { title: "Status pending", number: 99 },
        { title: "Status ready", number: 100 },
        { title: "00123", number: -1 },
        { title: "v1.2.3", number: 0 },
        { title: "保存状态 — é 👩‍💻 مرحبا", number: 1.234567 },
        { title: "Ready", number: 1e21 },
      ]) {
        await page.evaluate((p) => window.cardUpdate(p), patch);
        assert.equal(await page.locator("#title").textContent(), patch.title);
        assert.equal(await page.locator("#quantity").textContent(), String(patch.number));
      }
      // Native form tree, selection, refs and lifetimes survive measurement and mode edits.
      await page.locator("#native-memo").fill("user draft");
      await page.locator("#native-editor").focus();
      await page.locator("#native-editor").evaluate((n) => {
        n.selectionStart = 8;
        n.selectionEnd = 8;
        n.scrollTop = 24;
        window.savedEditor = { n, start: n.selectionStart, scroll: n.scrollTop };
      });
      await page.evaluate(() =>
        window.cardUpdate({
          size: "default",
          nested: true,
          childMode: "none",
          title: "Focused body keeps native geometry",
          clock: 4,
        }),
      );
      const native = await page.evaluate(() => ({
        same:
          window.originalInput === document.getElementById("native-memo") &&
          window.originalCard === document.getElementById("fit"),
        ids: document.querySelectorAll("#native-memo").length,
        values: new FormData(document.getElementById("native-form")).getAll("memo"),
        mounts: window.cardMounts,
        originalMounts: window.originalMounts,
        selection: document.getElementById("native-editor").selectionStart,
        scroll: document.getElementById("native-editor").scrollTop,
        savedScroll: window.savedEditor.scroll,
        focused: document.activeElement === window.savedEditor.n,
        rootSize: document
          .getElementById("fit")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "height" in f || "width" in f)).length,
        nested: document.getElementById("nested").getAnimations().length,
        none: document.getElementById("none-child").getAnimations().length,
      }));
      assert(native.same && native.focused);
      assert.equal(native.ids, 1);
      assert.deepEqual(native.values, ["user draft"]);
      assert.equal(native.mounts, native.originalMounts);
      assert.equal(native.selection, 8);
      assert.equal(native.scroll, native.savedScroll);
      assert.equal(native.rootSize, 0);
      assert.equal(native.nested, 0);
      assert.equal(native.none, 0);
      await page.locator("#stateful").click();
      assert.equal(await page.locator("#stateful").textContent(), "Local 1");
      await page.locator("#outside").focus();
      await page.evaluate(() =>
        window.cardUpdate({ mode: "full", clock: 0, size: "default", title: "Editing baseline", edit: false }),
      );
      await page.evaluate(() => window.cardUpdate({ clock: 4, size: "sm", title: "Editing soon" }));
      await page.waitForTimeout(35);
      const editorBefore = await page
        .locator("#editable-card")
        .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length);
      if (os === "no-preference") assert(editorBefore > 0);
      await page.locator("#editable").evaluate((n) => (n.contentEditable = "true"));
      await page.waitForTimeout(25);
      assert.equal(
        await page
          .locator("#editable-card")
          .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length),
        0,
        "inherited editing retires the active geometry writer without a React commit",
      );
      await page.evaluate(() =>
        window.cardUpdate({ mode: "none", clock: 0, title: "Editable baseline", number: 19, edit: true }),
      );
      await page.locator("#edit-title").evaluate((n) => {
        const t = n.querySelector('[data-slot="card-text"]').firstChild;
        t.textContent = "Native edit";
        const r = document.createRange();
        r.setStart(t, 3);
        r.collapse(true);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        window.editText = t;
      });
      await page.locator("#edit-number").evaluate((n) => {
        window.editedNumber = n.querySelector('[data-slot="card-number"]').firstChild;
        window.editedNumber.textContent = "Native quantity";
      });
      await page.evaluate(() => window.cardUpdate({ mode: "full", clock: 4 }));
      await page.waitForTimeout(35);
      await page.evaluate(() => window.cardUpdate({ title: "Caller display revision", number: 20 }));
      await page.waitForTimeout(35);
      assert.equal(await page.locator("#edit-title").textContent(), "Native edit");
      assert.equal(await page.locator("#edit-number").textContent(), "Native quantity");
      assert.equal(await page.locator("#plaintext-content").textContent(), "Caller display revision");
      assert.equal(await page.locator("#editable [data-cadence-reel],#plaintext [data-cadence-reel]").count(), 0);
      const islandReel = await page.locator('#noneditable-display [data-slot="card-number"]').evaluate((host) => {
        const id = host.getAttribute("data-cadence-layout-anchor");
        return (
          !!id &&
          [...document.querySelectorAll("[data-cadence-number-layer]")].some((n) =>
            n.style.left.includes(`--cadence-display-${id} `),
          )
        );
      });
      if (os === "no-preference") assert(islandReel, "a noneditable display island keeps independent numeric paint");
      for (const value of ["Identifier", 20]) {
        await page.evaluate((value) => window.cardUpdate({ number: value }), value);
        const editorTypeChange = await page.locator("#edit-number").evaluate((n) => ({
          same: n.querySelector('[data-slot="card-number"],[data-slot="card-text"]').firstChild === window.editedNumber,
          text: n.textContent,
        }));
        assert(editorTypeChange.same);
        assert.equal(editorTypeChange.text, "Native quantity");
      }
      await page.evaluate(() => window.cardUpdate({ edit: false }));
      assert.equal(await page.locator("#edit-title").textContent(), "Native edit");
      assert.equal(await page.locator("#edit-number").textContent(), "Native quantity");
      await page.evaluate(() => window.cardUpdate({ title: "Display restored", number: 21 }));
      assert.equal(await page.locator("#edit-title").textContent(), "Display restored");
      assert.equal(await page.locator("#edit-number").textContent(), "21");
      await page.locator("#outside").focus();
      await page.evaluate(() =>
        window.cardUpdate({
          mode: "none",
          clock: 0,
          title: "Status pending",
          description: "Review pending",
          size: "default",
          hidden: true,
        }),
      );
      await page.evaluate(() => window.cardUpdate({ hidden: false }));
      assert((await page.locator("#fit").boundingBox()).height > 0);
      assert.equal(await page.locator("#fit").evaluate((n) => n.style.height), "fit-content");
      await page.evaluate(() => window.cardUpdate({ empty: true }));
      assert.equal(await page.locator("#body").textContent(), "");
      assert((await page.locator("#fit").boundingBox()).height > 0);
      await page.evaluate(() => window.cardUpdate({ empty: false, fixed: true }));
      assert(Math.abs((await page.locator("#normal").boundingBox()).height - 160) < 1);
      await page.evaluate(() => window.cardUpdate({ fixed: false, min: 260, overflow: true }));
      assert.equal(await page.locator("#fit").evaluate((n) => n.style.minHeight), "260px");
      assert.equal(await page.locator("#fit").evaluate((n) => n.style.overflow), "visible");
      await page.evaluate(() =>
        window.cardUpdate({
          min: 0,
          overflow: false,
          mode: "full",
          clock: 4,
          title: "Longer natural responsive record",
          size: "default",
          nested: false,
        }),
      );
      await page.evaluate(() => window.cardUpdate({ title: "Ready", size: "sm" }));
      await page.waitForTimeout(45);
      await page.evaluate(() => window.cardUpdate({ min: 300, overflow: true }));
      await page.waitForTimeout(80);
      assert.equal(await page.locator("#fit").evaluate((n) => n.style.minHeight), "300px");
      assert.equal(await page.locator("#fit").evaluate((n) => n.style.overflow), "visible");
      await page.evaluate(() =>
        window.cardUpdate({
          mode: "none",
          clock: 0,
          min: 0,
          overflow: false,
          title: "A record that wraps with its available parent space",
        }),
      );
      await page.setViewportSize({ width: 390, height: 1400 });
      const narrow = await page.locator("#wrapping").boundingBox();
      await page.setViewportSize({ width: 1280, height: 1400 });
      const wide = await page.locator("#wrapping").boundingBox();
      assert(wide.width > narrow.width, "settled Card must release width to responsive native sizing");
      assert.equal(await page.locator("#wrapping").evaluate((n) => n.style.width), "");
      await page.evaluate(() =>
        window.cardUpdate({ mode: "full", clock: 4, size: "default", title: "Passive media arrival" }),
      );
      await page.locator("#late-media").evaluate(async (n) => {
        n.src =
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="120"><rect width="20" height="120" fill="gray"/></svg>';
        await n.decode();
      });
      await page.waitForTimeout(50);
      const passiveMedia = await page.locator("#normal").evaluate((n) => ({
        height: n.getBoundingClientRect().height,
        effects: n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f || "width" in f))
          .length,
        media: document.getElementById("late-media").naturalHeight,
      }));
      assert.equal(passiveMedia.media, 120);
      assert.equal(passiveMedia.effects, 0, "late decoding settles the wrapper-free Card natively");
      await page.evaluate(() => window.cardUpdate({ size: "sm" }));
      await page.evaluate(() => window.cardPassiveBody());
      await page.waitForTimeout(50);
      assert.equal(
        await page
          .locator("#normal")
          .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length),
        0,
        "unknown internal body resize is native even during an earlier flight",
      );
      // A later surface is the only opacity entrance; nested parts do not cascade.
      await page.evaluate(() => {
        window.cardAnimations = [];
        window.cardUpdate({ mode: window.cardInitialMode, clock: 4, later: true, title: "Ready" });
      });
      await page.waitForTimeout(30);
      const insertion = await page.evaluate(() => ({
        root: document
          .getElementById("later")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "opacity" in f)).length,
        nested: document
          .getElementById("later-nested")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "opacity" in f)).length,
      }));
      if (effective !== "none") assert(insertion.root > 0);
      assert.equal(insertion.nested, 0);
      await page.evaluate(() => {
        window.retained = document.getElementById("later");
        window.cardUpdate({ later: false });
      });
      if (effective !== "none") {
        assert(await page.locator("#later").count());
        assert.equal(await page.locator("#later").getAttribute("aria-hidden"), "true");
        assert(await page.locator("#later").evaluate((n) => n.inert));
      }
      await page.evaluate(() => window.cardUpdate({ later: true }));
      if (effective !== "none") assert(await page.evaluate(() => window.retained === document.getElementById("later")));
      await page.evaluate(() => window.cardUpdate({ later: false, clock: 0 }));
      await page.waitForFunction(() => !document.getElementById("later"));
      await page.evaluate(() => window.cardUpdate({ mode: "full", clock: 4, show: false, nested: false }));
      await page.waitForTimeout(20);
      await page.evaluate(() => window.cardUpdate({ show: true, nested: true, childMode: "full" }));
      await page.waitForTimeout(25);
      const reopening = await page.evaluate(() => ({
        root: document
          .getElementById("fit")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "opacity" in f)).length,
        child: document
          .getElementById("nested")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "opacity" in f)).length,
      }));
      assert(reopening.root > 0);
      assert.equal(reopening.child, 0, "new nested Card inherits its retained parent's reopening envelope");
      await page.evaluate(() => window.cardUpdate({ nested: false, childMode: undefined }));
      await page.evaluate(() => window.cardUpdate({ mode: "full", clock: 4, title: "Working", number: 21, ink: true }));
      await page.waitForTimeout(30);
      const colour = await page.evaluate(() =>
        ["fit", "surface-header", "surface-footer", "description"].map((id) => ({
          id,
          duration: getComputedStyle(document.getElementById(id)).transitionDuration,
          properties: document
            .getElementById(id)
            .getAnimations()
            .filter((a) => "transitionProperty" in a && a.playState === "running")
            .map((a) => a.transitionProperty),
        })),
      );
      assert(
        colour.every((owner) => owner.properties.length > 0),
        "known neutral palette changes must execute each actual colour owner",
      );
      await page.evaluate(() => window.cardUpdate({ mode: "reduced" }));
      assert.equal(await page.locator("[data-cadence-reel]").count(), 0);
      await page.evaluate(() => window.cardUpdate({ mode: "none" }));
      assert.equal(await page.locator("[data-cadence-text-layer]").count(), 0);
      assert.equal(
        await page.evaluate(
          () => document.getAnimations().filter((a) => "transitionProperty" in a && a.playState === "running").length,
        ),
        0,
        "none cancels actual CSS colour transitions before paint",
      );
      assert.deepEqual(errors, []);
      report.cases.push({
        os,
        mode,
        effective,
        first,
        change,
        samples,
        cancelled,
        native,
        beforeRef,
        insertion,
        colour,
        editorBefore,
        islandReel,
        reopening,
        errors,
      });
      await page.evaluate(() => window.cardUnmount());
      assert.equal(await page.locator("[data-cadence-text-layer],[data-cadence-reel]").count(), 0);
      await context.close();
    }
  for (const width of [390, 1280])
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 1500 } });
      await page.goto(url);
      await page.waitForFunction(() => window.cardReady);
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
        window.cardUpdate({ mode: "none", clock: 0, title: "Ready", nested: true });
      }, theme);
      await page.screenshot({ path: path.join(output, `${theme}-${width}.png`), fullPage: true });
      await page.close();
    }
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJS.newPage();
  await page.goto(url);
  assert.equal(await page.locator("#title").textContent(), "Status pending");
  assert.equal(await page.locator("#quantity").textContent(), "19");
  assert.equal(await page.locator("#action a").getAttribute("href"), "#destination");
  assert((await page.locator("#fit").boundingBox()).height > 0);
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
