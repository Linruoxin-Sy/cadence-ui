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

assert(process.env.BUTTON_OUTPUT);
const output = path.resolve(process.env.BUTTON_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.BUTTON_COPY;
let installation;
if (process.env.BUTTON_INSTALL) {
  const payloads = new Map();
  const queue = ["button"];
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
    "button",
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
  entryPoints: ["tests/runtime/button-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/button-pilot-ssr.jsx"],
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
      : `<!doctype html><html><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.buttonInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
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
      await page.addInitScript(
        ({ mode }) => {
          window.buttonInitialMode = mode;
          window.buttonAnimations = [];
          const animate = Element.prototype.animate;
          Element.prototype.animate = function (...args) {
            const a = animate.apply(this, args);
            window.buttonAnimations.push({ node: this, a, frames: args[0] });
            return a;
          };
          window.buttonShifts = [];
          new PerformanceObserver((list) =>
            window.buttonShifts.push(
              ...list
                .getEntries()
                .map((e) => ({ value: e.value, startTime: e.startTime, hadRecentInput: e.hadRecentInput })),
            ),
          ).observe({ type: "layout-shift", buffered: true });
        },
        { mode },
      );
      await page.goto(`${url}?mode=${mode}`);
      await page.waitForFunction(() => window.buttonUpdate && document.getElementById("portal").children.length);
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction(
        (effective) => document.getElementById("label").dataset.motion === effective,
        effective,
      );
      const first = await page.evaluate(() => ({
        text: document.getElementById("label").textContent,
        opacity: getComputedStyle(document.getElementById("label")).opacity,
        root: getComputedStyle(document.getElementById("label")).transform,
        animations: window.buttonAnimations.length,
        proof: window.buttonProof(),
      }));
      assert.equal(first.text, "Save changes");
      assert.equal(first.opacity, "1");
      assert.equal(first.root, "none");
      await page.evaluate(() => {
        window.buttonText = document.querySelector('#label [data-slot="button-text"]').firstChild;
        window.buttonNode = document.getElementById("label");
        window.buttonUpdate({ label: "Saved", number: 20 });
      });
      await page.waitForTimeout(50);
      const content = await page.evaluate(() => ({
        text: document.getElementById("label").textContent,
        number: document.getElementById("number").textContent,
        identity: window.buttonText === document.querySelector('#label [data-slot="button-text"]').firstChild,
        animations: window.buttonAnimations.map(({ node, a, frames }) => ({
          slot: node.dataset.slot,
          tag: node.tagName,
          frames,
          state: a.playState,
        })),
        layers: document.querySelectorAll("[data-cadence-text-layer],[data-cadence-number-layer]").length,
        textPaint: document.querySelectorAll("[data-cadence-text-layer] canvas").length,
        numberPaint: document.querySelectorAll("[data-cadence-reel]").length,
        phases: [...document.querySelectorAll("[data-cadence-reel]")].map((node) => Number(node.dataset.phase)),
        proof: window.buttonProof(),
      }));
      assert.equal(content.text, "Saved");
      assert.equal(content.number, "20");
      assert(content.identity);
      const compound = await page.evaluate(() => ({
        parent: document.getElementById("compound").getAnimations().length,
        child: document
          .getElementById("compound-button")
          .getAnimations()
          .filter((a) => a.effect.getKeyframes().some((f) => "width" in f || "height" in f)).length,
      }));
      assert.equal(compound.child, 0, "known compound scope must have one outer geometry writer");
      if (effective !== "none")
        assert(content.textPaint > 0, "supported changed text must execute native opacity paint");
      if (effective === "full" && !content.numberPaint) {
        await writeFile(path.join(output, "content-failure.json"), JSON.stringify(content, null, 2));
        assert.fail("supported quantity must execute actual compact reels");
      }
      await page.locator("#rich").hover();
      await page.waitForTimeout(35);
      if (effective === "full")
        assert(
          (await page.locator("[data-cadence-reel]").count()) > 0,
          "sibling colour feedback must not cancel reels",
        );
      if (effective === "full")
        assert(
          (await page.locator("[data-cadence-text-layer] canvas").count()) > 0,
          "sibling colour feedback must not cancel changed text",
        );
      let raster;
      if (effective === "full") {
        await page.evaluate(() => window.buttonUpdate({ clock: 0, number: 19 }));
        const native = await page.locator('#supported-number [data-slot="button-number"]').screenshot();
        await page.evaluate(() => {
          window.buttonUpdate({ clock: 100000 });
          window.buttonUpdate({ number: 20 });
        });
        const painted = await page.locator('#supported-number [data-slot="button-number"]').screenshot();
        raster = await page.evaluate(
          async ({ native, painted }) => {
            const read = async (data) => {
              const image = new Image();
              image.src = `data:image/png;base64,${data}`;
              await image.decode();
              const c = document.createElement("canvas");
              c.width = image.width;
              c.height = image.height;
              const x = c.getContext("2d");
              x.drawImage(image, 0, 0);
              return { width: c.width, height: c.height, data: [...x.getImageData(0, 0, c.width, c.height).data] };
            };
            const a = await read(native),
              b = await read(painted);
            const ink = (image) => {
              const points = [];
              for (let y = 0; y < image.height; y++)
                for (let x = 0; x < image.width; x++) {
                  const i = (y * image.width + x) * 4;
                  if ((image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3 > 128) points.push([x, y]);
                }
              return points;
            };
            const ap = ink(a),
              bp = ink(b);
            const unmatched = (p, q) =>
              p.filter(([x, y]) => !q.some(([u, v]) => Math.abs(x - u) <= 1 && Math.abs(y - v) <= 1)).length;
            return {
              width: a.width,
              height: a.height,
              sameSize: a.width === b.width && a.height === b.height,
              nativeInk: ap.length,
              paintInk: bp.length,
              missing: unmatched(ap, bp),
              extra: unmatched(bp, ap),
              phases: [...document.querySelectorAll("[data-cadence-reel]")].map((n) => Number(n.dataset.phase)),
              cells: [...document.querySelectorAll("[data-cadence-number-cell]")].map((n) => ({
                left: n.getBoundingClientRect().left,
                top: n.getBoundingClientRect().top,
              })),
            };
          },
          { native: native.toString("base64"), painted: painted.toString("base64") },
        );
        await writeFile(path.join(output, "fractional-native.png"), native);
        await writeFile(path.join(output, "fractional-paint.png"), painted);
        await writeFile(path.join(output, "fractional-raster.json"), JSON.stringify(raster, null, 2));
        assert(
          raster.sameSize && raster.nativeInk > 0 && raster.paintInk > 0 && raster.missing === 0 && raster.extra === 0,
          "fractional raster coverage must stay at its native glyph origin",
        );
        assert(raster.phases.length > 0 && raster.phases.every((p) => p < 0.001));
        await page.evaluate(() => window.buttonUpdate({ clock: 4 }));
      }
      await page.locator("#label").hover();
      const colour = await page.evaluate(() => {
        const node = document.getElementById("label");
        const before = getComputedStyle(node).transitionDuration;
        node.focus();
        return { before, focused: getComputedStyle(node).transitionDuration };
      });
      assert(colour.focused.split(",").every((duration) => parseFloat(duration) === 0));
      await page.locator("#label").blur();
      await page.evaluate(() => document.getElementById("label").setAttribute("aria-invalid", "true"));
      await page.waitForFunction(() =>
        getComputedStyle(document.getElementById("label"))
          .transitionDuration.split(",")
          .every((duration) => parseFloat(duration) === 0),
      );
      await page.evaluate(() => document.getElementById("label").removeAttribute("aria-invalid"));
      for (const patch of [
        { label: "Saving changes", number: 99, size: "lg" },
        { label: "Saved", number: 100, size: "sm" },
        { label: "保存更改 — Lokalisierte Änderungen speichern", number: 9, size: "default" },
        { label: "Save changes", number: 19 },
      ]) {
        await page.evaluate((patch) => window.buttonUpdate(patch), patch);
        assert.equal(await page.locator("#label").textContent(), patch.label);
        assert.equal(await page.locator("#number").textContent(), String(patch.number));
      }
      const constrained = await page.evaluate(() => {
        const parent = document.getElementById("narrow").getBoundingClientRect();
        const child = document.getElementById("constrained").getBoundingClientRect();
        return { parent: parent.width, child: child.width };
      });
      assert(constrained.child <= constrained.parent, "externally constrained axes keep native width");
      await page.evaluate(() => {
        window.buttonUpdate({ clock: 0 });
        window.buttonUpdate({ clock: 4 });
      });
      const hit = await page.locator("#label").boundingBox();
      await page.mouse.down();
      await page.waitForTimeout(60);
      const press = await page.evaluate(() => ({
        root: getComputedStyle(document.getElementById("label")).transform,
        visual: getComputedStyle(document.querySelector('#label [data-slot="button-feedback"]')).transform,
      }));
      assert.equal(press.root, "none");
      if (effective === "full") assert.notEqual(press.visual, "none");
      assert.deepEqual(await page.locator("#label").boundingBox(), hit, "press preserves actual root hit geometry");
      const refsBefore = await page.evaluate(() => ({ ...window.buttonRefs }));
      await page.evaluate(() => window.buttonUpdate({ variant: window.buttonState.variant }));
      assert(await page.evaluate(() => window.buttonNode === document.getElementById("label")));
      const refHandoff = await page.evaluate(() => ({ ...window.buttonRefs }));
      assert.equal(refHandoff.attached - refsBefore.attached, 1);
      assert.equal(refHandoff.cleaned - refsBefore.cleaned, 1);
      await page.evaluate(() => window.buttonUpdate({ clock: 0 }));
      const zero = await page.evaluate(() => ({
        visual: getComputedStyle(document.querySelector('#label [data-slot="button-feedback"]')).transform,
        node: window.buttonNode === document.getElementById("label"),
      }));
      assert(zero.node);
      assert.equal(zero.visual, effective === "full" ? "matrix(0.97, 0, 0, 0.97, 0, 0)" : "none");
      await page.evaluate(() => window.buttonUpdate({ target: "replacement" }));
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.querySelector('#label [data-slot="button-feedback"]')).transform,
        ),
        "none",
        "native target replacement releases the obsolete press",
      );
      const clicksBefore = await page.evaluate(() => window.buttonClicks ?? 0);
      await page.mouse.up();
      assert.equal(
        await page.evaluate(() => window.buttonClicks ?? 0),
        clicksBefore,
        "obsolete held action cannot activate the new target",
      );
      await page.evaluate(() =>
        window.buttonUpdate({ clock: 4, label: "Save changes", number: 29, later: true, parent: true }),
      );
      await page.waitForTimeout(40);
      const insertion = await page.evaluate(() => ({
        later: document
          .getElementById("later")
          .getAnimations()
          .map((a) => ({ frames: a.effect.getKeyframes(), state: a.playState })),
        parent: document
          .getElementById("parent-child")
          .getAnimations()
          .map((a) => ({ frames: a.effect.getKeyframes(), state: a.playState })),
      }));
      assert.equal(insertion.parent.length, 0, "same-cause parent presence suppresses duplicate child entrance");
      if (effective !== "none") assert(insertion.later.some((a) => a.state === "running"));
      await page.evaluate(() => window.buttonUpdate({ disabled: true }));
      await page.waitForTimeout(20);
      const disabledEntry = await page.evaluate(() => ({
        opacity: getComputedStyle(document.getElementById("later")).opacity,
        running: document
          .getElementById("later")
          .getAnimations()
          .filter((a) => a.playState === "running").length,
      }));
      assert.equal(disabledEntry.opacity, "0.5");
      assert.equal(disabledEntry.running, 0);
      await page.evaluate(() => window.buttonUpdate({ disabled: false }));
      await page.evaluate(() => window.buttonUpdate({ show: false }));
      await page.waitForTimeout(20);
      const exit = await page.evaluate(() => {
        const n = document.getElementById("retained");
        return n
          ? {
              inert: n.inert,
              hidden: n.getAttribute("aria-hidden"),
              animations: n.getAnimations().map((a) => ({ frames: a.effect.getKeyframes(), state: a.playState })),
            }
          : null;
      });
      if (effective !== "none") assert(exit?.inert && exit.hidden === "true");
      else assert.equal(exit, null, "none must remove the actual retained host");
      await page.evaluate(() => window.buttonUpdate({ show: true }));
      await page.waitForTimeout(30);
      assert.equal(await page.locator("#retained").getAttribute("aria-hidden"), null);
      await page.evaluate(() => window.buttonUpdate({ clock: 0, show: false }));
      await page.locator("#retained").waitFor({ state: "detached" });
      await page.evaluate(() => window.buttonUpdate({ clock: 4, show: true }));
      if (effective !== "none") {
        await page.evaluate(() => window.buttonUpdate({ show: false }));
        await page.evaluate(() => {
          const node = document.getElementById("retained");
          node.style.transition = "opacity 0.01s linear";
          node.style.opacity = "0.25";
        });
        await page.waitForTimeout(20);
        assert.equal(await page.locator("#retained").count(), 0, "caller paint revokes an exiting opacity writer");
        await page.evaluate(() => window.buttonUpdate({ show: true }));
      }
      await page.evaluate(() => window.buttonUpdate({ mode: "full", childMode: "none", number: 31 }));
      const retained = [];
      for (const clock of [0, 1]) {
        await page.evaluate(({ clock, mode }) => window.buttonUpdate({ clock, mode, richShow: false }), {
          clock,
          mode,
        });
        await page.waitForFunction(() => {
          const node = document.getElementById("rich-retained");
          return (
            node?.inert &&
            getComputedStyle(node).opacity === "0" &&
            node.getAnimations().every((a) => a.playState === "finished")
          );
        });
        retained.push(
          await page.locator("#rich-retained").evaluate((node) => ({
            mode: node.dataset.motion,
            opacity: getComputedStyle(node).opacity,
            clocks: node.getAnimations().map((animation) => animation.effect.getTiming().duration),
          })),
        );
        await page.evaluate(() => window.buttonUpdate({ mode: "none" }));
        await page.waitForTimeout(20);
        assert.equal(
          await page.locator("#rich-retained").evaluate((node) => getComputedStyle(node).opacity),
          "0",
          "a finished exit stays hidden while the parent retains another descendant",
        );
        await page.evaluate(() => {
          const node = document.getElementById("rich-retained");
          node.style.transition = "opacity 0.01s linear";
          node.style.opacity = "0.25";
        });
        await page.waitForFunction(() => getComputedStyle(document.getElementById("rich-retained")).opacity === "0.25");
        assert.equal(
          await page.locator("#rich-retained").evaluate((node) => getComputedStyle(node).opacity),
          "0.25",
          "caller opacity takes authority over the finished envelope",
        );
        await page.evaluate(() => window.buttonFinishRich());
        await page.locator("#rich-retained").waitFor({ state: "detached" });
        await page.evaluate(() => window.buttonUpdate({ richShow: true, mode: "full", clock: 4 }));
      }
      assert.equal(await page.locator("#nested").getAttribute("data-motion"), "none");
      assert.equal(await page.locator("#portal-button").getAttribute("data-motion"), "none");
      await page.evaluate(() => window.buttonUpdate({ mode: "none", childMode: "full" }));
      await page.waitForFunction(
        (expected) => document.getElementById("nested").dataset.motion === expected,
        os === "reduce" ? "reduced" : "full",
      );
      assert.equal(
        await page.locator("#portal-button").getAttribute("data-motion"),
        os === "reduce" ? "reduced" : "full",
      );
      await page.evaluate(() => window.buttonUpdate({ childMode: "none" }));
      await page.evaluate(() => window.buttonUpdate({ mode: "none" }));
      await page.waitForTimeout(35);
      assert.equal(
        await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length),
        0,
      );
      await page.locator("#label").focus();
      await page.keyboard.press("Space");
      assert.equal(await page.evaluate(() => document.activeElement.id), "label");
      assert.equal(await page.locator("#standalone-initial").evaluate((node) => getComputedStyle(node).opacity), "1");
      await page.evaluate(() => window.buttonStandalone());
      const standalone = await page.locator("#standalone-later").evaluate((node) => ({
        mode: node.dataset.motion,
        animations: node.getAnimations().map((animation) => animation.playState),
      }));
      assert.equal(standalone.mode, os === "reduce" ? "reduced" : "full");
      assert(standalone.animations.includes("running"), "later insertion also works without a provider");
      const anchor = await page.evaluate(() => {
        const n = document.getElementById("anchor"),
          c = getComputedStyle(n);
        return {
          translate: c.translate,
          rotate: c.rotate,
          scale: c.scale,
          transform: c.transform,
          svg: n.querySelector(":scope > svg") !== null,
          feedback: !!n.querySelector('[data-slot="button-feedback"]'),
        };
      });
      assert(anchor.svg && !anchor.feedback);
      await page.locator("#anchor").hover();
      await page.mouse.down();
      await page.evaluate(() => window.buttonUpdate({ mode: "full", clock: 0 }));
      await page.mouse.up();
      assert.equal(
        await page.evaluate(() => getComputedStyle(document.getElementById("anchor")).translate),
        anchor.translate,
      );
      await page.evaluate(() => window.buttonUpdate({ key: 1 }));
      assert.equal(await page.evaluate(() => window.buttonNode === document.getElementById("label")), false);
      const shifts = await page.evaluate(() => window.buttonShifts);
      const cls = summarizeLayoutShifts(shifts);
      report.cases.push({
        os,
        mode,
        effective,
        first,
        content,
        compound,
        raster,
        press,
        zero,
        colour,
        constrained,
        standalone,
        retained,
        refHandoff,
        insertion,
        disabledEntry,
        exit,
        anchor,
        cls,
        shifts,
        errors,
      });
      assert.deepEqual(errors, []);
      await page.evaluate(() => window.buttonUnmount());
      assert.equal(
        await page.evaluate(() => window.buttonRefs.attached - window.buttonRefs.cleaned),
        0,
        "all callback ref registrations must close",
      );
      await context.close();
    }
  for (const width of [390, 1280])
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.goto(url);
      await page.waitForFunction(() => window.buttonUpdate);
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await page.waitForFunction(() =>
        document.getAnimations().every((animation) => animation.playState !== "running"),
      );
      await page.screenshot({ path: path.join(output, `${theme}-${width}.png`), fullPage: true });
      await page.close();
    }
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const page = await noJS.newPage();
  await page.goto(url);
  assert.equal(await page.locator("#label").textContent(), "Save changes");
  assert.equal(await page.locator("#number").textContent(), "19");
  await noJS.close();
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
