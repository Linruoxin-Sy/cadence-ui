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

assert(process.env.LABEL_OUTPUT);
const output = path.resolve(process.env.LABEL_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.LABEL_COPY;
let installation;
if (process.env.LABEL_INSTALL) {
  const payloads = new Map();
  const queue = ["label", "field"];
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
    "label",
  );
  const numericPlan = installationPlan(
    [...payloads.values()].map(({ item }) => item),
    "field",
  );
  const plan = {
    ...groupPlan,
    dependencies: [...new Set([...groupPlan.dependencies, ...numericPlan.dependencies])],
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
  entryPoints: ["tests/runtime/label-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/label-pilot-ssr.jsx"],
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
        "public/r/label.json",
        "content/components/label.mdx",
        "docs/motion/components/label.md",
        "app/globals.css",
        "tests/runtime/label-pilot.jsx",
        "tests/runtime/label-pilot-ssr.jsx",
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
      : `<!doctype html><html lang="en"><title>Label runtime</title><style>${css}</style><div id="root">${render(mode)}</div><div id="portal-root"></div><input id="portal-input" /><script>window.labelSSRHost=document.querySelector("#external");window.labelSSRText=document.querySelector("#external [data-slot=label-text]").firstChild;window.labelInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const update = (page, patch) => page.evaluate((patch) => window.labelUpdate(patch), patch);
const frames = (page) =>
  page.evaluate(async () => {
    const rows = [];
    for (let i = 0; i < 18; i++) {
      await new Promise(requestAnimationFrame);
      const host = document.querySelector("#external"),
        display = host?.querySelector("[data-slot=label-text]");
      const anchor = display?.getAttribute("data-cadence-layout-anchor");
      const number = document
        .querySelector("#quantity [data-slot=label-number]")
        ?.getAttribute("data-cadence-layout-anchor");
      const paints = (key, selector) =>
        key
          ? [...document.querySelectorAll(selector)].filter((layer) =>
              layer.style.left.includes(`anchor(--cadence-display-${key} left)`),
            ).length
          : 0;
      rows.push({
        text: host?.textContent,
        width: host?.getBoundingClientRect().width,
        height: host?.getBoundingClientRect().height,
        textPaint: paints(anchor, "[data-cadence-text-layer]"),
        numberPaint: paints(number, "[data-cadence-number-layer]"),
        frames: host?.getAnimations().map((a) => a.effect.getKeyframes()),
        layers: document.querySelectorAll("[data-cadence-text-kind],[data-cadence-number-layer]").length,
      });
    }
    return rows;
  });
try {
  for (const mode of ["full", "reduced", "none"])
    for (const os of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 1000 },
        reducedMotion: os ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      await page.goto(`${base}/?mode=${mode}`);
      await page.waitForFunction(() => window.labelReady);
      const effective = mode === "none" ? "none" : os ? "reduced" : mode;
      assert.equal(await page.locator("#external").getAttribute("data-motion"), effective);
      assert(
        await page.evaluate(
          () =>
            window.labelSSRHost === document.querySelector("#external") &&
            window.labelSSRText === document.querySelector("#external [data-slot=label-text]").firstChild,
        ),
      );
      assert.equal(
        await page.locator("[data-cadence-text-kind],[data-cadence-number-layer]").count(),
        0,
        "visible native hydration baseline",
      );
      await page.evaluate(() => {
        window.nativeLabelText = document.querySelector("#external [data-slot=label-text]").firstChild;
        window.nativeQuantity = document.querySelector("#quantity [data-slot=label-number]").firstChild;
      });
      await update(page, { value: "Work email address", number: 20 });
      const middle = await frames(page);
      report.pending = { mode, os, middle };
      assert.equal(await page.locator("#external-input").getAttribute("value"), "native draft");
      for (const id of ["external-input", "field-input", "portal-input"])
        assert.equal(
          await page.locator(`#${id}`).evaluate((n) => [...n.labels].map((l) => l.textContent).join(" ")),
          "Work email address",
          "external, Field and portal names update immediately",
        );
      if (effective === "full") {
        assert(
          middle.some((f) => f.textPaint > 0),
          "exact label owner renders changed runs",
        );
        assert(
          middle.some((f) => f.numberPaint > 0),
          "exact quantity owner renders reels",
        );
        assert(new Set(middle.map((f) => f.width)).size > 2, "content and intrinsic size have actual middle frames");
        assert(
          middle.some((f) => f.textPaint > 0 && f.frames.length),
          "same frames compose text and geometry",
        );
      } else {
        assert(
          middle.every((f) => f.numberPaint === 0 && f.frames.length === 0),
          "nonfull has no geometry/reels",
        );
        if (effective === "none")
          assert(
            middle.every((f) => f.textPaint === 0),
            "none leaves this native text unmasked",
          );
      }
      assert(
        await page.evaluate(
          () =>
            window.nativeLabelText === document.querySelector("#external [data-slot=label-text]").firstChild &&
            window.nativeQuantity === document.querySelector("#quantity [data-slot=label-number]").firstChild,
        ),
      );
      await update(page, { value: "Email", number: 21 });
      const reverse = await frames(page);
      if (effective === "full")
        assert(new Set(reverse.map((f) => f.width)).size > 2, "rapid reversal retargets current size");
      await update(page, { clock: 0 });
      assert.equal(await page.locator("[data-cadence-text-kind],[data-cadence-number-layer]").count(), 0);
      assert.equal(await page.locator("#external").evaluate((n) => n.getAnimations().length), 0);
      await page.locator("#external").click();
      await page.locator("#external-input").fill("retained draft");
      await page.locator("#external-input").evaluate((n) => n.setSelectionRange(2, 5));
      await update(page, { value: "Work e-mail · 收件地址" });
      assert.equal(await page.locator("#external").textContent(), "Work e-mail · 收件地址");
      assert(
        await page
          .locator("#external-input")
          .evaluate((n) => n === document.activeElement && n.selectionStart === 2 && n.selectionEnd === 5),
      );
      assert.equal(await page.locator("#external-input").inputValue(), "retained draft");
      await update(page, { clock: 4, foreground: true });
      const nativeColour = await page.locator("#external").evaluate(async (node) => {
        await new Promise(requestAnimationFrame);
        return {
          duration: getComputedStyle(node).transitionDuration,
          transitions: node.getAnimations().map((a) => a.transitionProperty),
        };
      });
      if (effective === "none") assert.equal(nativeColour.duration, "0s");
      else
        assert(
          nativeColour.transitions.includes("color"),
          "eligible native foreground follows full/reduced colour clocks despite external control focus",
        );
      await update(page, { clock: 0 });
      assert.equal(
        await page.locator("#external").evaluate((node) => node.getAnimations().length),
        0,
        "same-target zero cancels native colour",
      );
      await page.locator("#wrapped").click();
      assert(await page.locator("#wrapped-input").isChecked());
      await update(page, { clock: 4, foreground: false });
      assert.equal(
        await page.locator("#wrapped").evaluate((node) => getComputedStyle(node).transitionDuration),
        "0s",
        "true focus-within suppresses native paint in every mode",
      );
      await update(page, { clock: 0 });
      await page.locator("#rich a").focus();
      await update(page, { value: "Latest name", number: 1000 });
      assert(await page.locator("#rich a").evaluate((n) => n === document.activeElement));
      assert.equal(await page.locator("#quantity").textContent(), "1000");
      assert.equal(await page.locator("#identifier").textContent(), "1000");
      await update(page, { number: 7 });
      assert.equal(await page.locator("#identifier").textContent(), "007");
      assert.equal(await page.locator("#quantity [data-slot=label-number]").count(), 1);
      assert.equal(await page.locator("#identifier [data-slot=label-number]").count(), 0);
      for (const value of [1.234567, -0, 1e21, Number.NaN, Number.POSITIVE_INFINITY]) {
        await page.evaluate(
          (kind) =>
            window.labelUpdate({ number: kind === "NaN" ? NaN : kind === "Infinity" ? Infinity : Number(kind) }),
          String(value),
        );
        assert.equal(await page.locator("#quantity").textContent(), String(value));
      }
      await update(page, { clock: 0, number: 19 });
      await update(page, { clock: 4, target: true, number: 20 });
      assert.equal(
        await page.locator("#quantity [data-cadence-layout-anchor]").count(),
        0,
        "a new htmlFor entity establishes an immediate quantity baseline",
      );
      await page.locator("#native").focus();
      await update(page, { clock: 4, value: "Email address", later: true });
      const entrance = await page
        .locator("#later")
        .evaluate((n) => n.getAnimations().map((a) => a.effect.getTiming().duration));
      assert.equal(entrance.length > 0, effective !== "none");
      assert.equal(
        await page.locator("#consumed").evaluate((n) => n.getAnimations().length),
        0,
        "new parent consumes its initial child entrance",
      );
      await update(page, { clock: 0 });
      await update(page, {
        clock: 4,
        value: "A much longer label that wraps across several lines in its clipped Field",
        clip: true,
      });
      const clipped = await page.locator("#external").evaluate((n) => ({
        height: n.getBoundingClientRect().height,
        content: n.firstElementChild.getBoundingClientRect().height,
        text: n.textContent,
        frames: n.getAnimations().map((a) => a.effect.getKeyframes()),
      }));
      assert(clipped.height >= clipped.content, "clipped multiline growth exposes the full final name immediately");
      assert.equal(clipped.text, "A much longer label that wraps across several lines in its clipped Field");
      assert.equal(
        await page
          .locator("#coordinated [data-slot=field-label]")
          .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length),
        0,
        "Field owns the shared block axis",
      );
      await update(page, { value: "Email" });
      const coordinated = await page.locator("#coordinated").evaluate(async (node) => {
        const samples = [];
        for (let i = 0; i < 18; i++) {
          await new Promise(requestAnimationFrame);
          samples.push({
            height: node.getBoundingClientRect().height,
            childHeightWriters: node
              .querySelector("[data-slot=field-label]")
              .getAnimations()
              .filter((a) => a.effect.getKeyframes().some((frame) => "height" in frame)).length,
          });
        }
        return samples;
      });
      if (effective === "full")
        assert(
          new Set(coordinated.map((sample) => sample.height)).size > 2,
          "coordinated Field block shrink has real middle frames",
        );
      assert(
        coordinated.every((sample) => sample.childHeightWriters === 0),
        "the same content cause has one block owner",
      );
      await update(page, { clock: 0, clip: false, value: "Email address" });
      await update(page, { clock: 4, value: "Work email address" });
      await page.setViewportSize({ width: 900, height: 1000 });
      await page.waitForTimeout(40);
      assert.equal(
        await page.locator("#external").evaluate((n) => n.getAnimations().length),
        0,
        "passive viewport reflow settles geometry",
      );
      const passive = [];
      for (const kind of ["parent", "root", "font", "engine"]) {
        let native = null;
        if (kind !== "engine") {
          await update(page, { clock: 0, value: "Work email address" });
          await page.evaluate((kind) => {
            const host = document.querySelector("#external");
            if (kind === "parent") host.parentElement.style.width = "90px";
            if (kind === "root") host.style.width = "90px";
            if (kind === "font") host.style.fontFamily = "Arial";
          }, kind);
          native = await page.locator("#external").evaluate((host) => ({
            width: host.getBoundingClientRect().width,
            height: host.getBoundingClientRect().height,
          }));
          await page.evaluate((kind) => {
            const host = document.querySelector("#external");
            if (kind === "parent") host.parentElement.style.width = "230px";
            if (kind === "root") host.style.removeProperty("width");
            if (kind === "font") host.style.fontFamily = '"Courier New", monospace';
          }, kind);
        }
        await update(page, { clock: 0, value: "Email address" });
        await update(page, { clock: 4, value: "Work email address" });
        await page.evaluate((kind) => {
          const host = document.querySelector("#external");
          if (kind === "parent") host.parentElement.style.width = "90px";
          if (kind === "root") host.style.width = "90px";
          if (kind === "font") host.style.fontFamily = "Arial";
          if (kind === "engine")
            window.lateCallerWidth = host.animate([{ width: "90px" }, { width: "110px" }], {
              duration: 2000,
              fill: "both",
            });
        }, kind);
        await page.evaluate(async () => {
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
        });
        const sample = await page.locator("#external").evaluate(
          (host, kind) => ({
            kind,
            width: host.getBoundingClientRect().width,
            height: host.getBoundingClientRect().height,
            font: getComputedStyle(host).fontFamily,
            libraryWriters: host
              .getAnimations()
              .filter((animation) => kind !== "engine" || animation !== window.lateCallerWidth).length,
            callerRunning: kind !== "engine" || window.lateCallerWidth.playState === "running",
            text: host.textContent,
          }),
          kind,
        );
        report.passivePending = { mode, os, sample, native };
        assert.equal(sample.libraryWriters, 0, "passive constraints yield native dimensions before paint");
        assert.equal(sample.text, "Work email address");
        if (native)
          assert.deepEqual(
            { width: sample.width, height: sample.height },
            native,
            "passive reflow matches the exact native zero-clock destination without changing caller layout",
          );
        if (kind === "font") assert.equal(sample.font, "Arial", "caller typography remains authoritative");
        assert(sample.callerRunning, "a later native dimension engine is never cancelled by Label");
        passive.push({ ...sample, native });
        await page.evaluate((kind) => {
          const host = document.querySelector("#external");
          if (kind === "parent") host.parentElement.style.width = "230px";
          if (kind === "root") host.style.removeProperty("width");
          if (kind === "font") host.style.fontFamily = '"Courier New", monospace';
          if (kind === "engine") window.lateCallerWidth.cancel();
        }, kind);
      }
      await update(page, { clock: 0, value: "Email address" });
      await page.locator("#external [data-slot=label-text]").evaluate((node) => {
        window.callerLabelWidth = node.animate([{ width: "150px" }, { width: "180px" }], {
          duration: 2000,
          fill: "both",
        });
      });
      await update(page, { clock: 4, value: "Work email address" });
      assert.equal(
        await page
          .locator("#external")
          .evaluate(
            (node) =>
              node.getAnimations().filter((a) => a.effect.getKeyframes().some((frame) => "width" in frame)).length,
          ),
        0,
        "caller content geometry retains its sole native writer",
      );
      assert.equal(await page.evaluate(() => window.callerLabelWidth.playState), "running");
      await page.evaluate(() => window.callerLabelWidth.cancel());
      await update(page, { clock: 0, features: true, value: "Email address" });
      await update(page, { clock: 4, value: "Work email address" });
      const unsupported = await frames(page);
      assert(
        unsupported.every((f) => f.textPaint === 0),
        "unknown font features preserve native paint",
      );
      await update(page, { clock: 0, features: false, value: "Personal workspace email address" });
      await update(page, { clock: 4, value: "Work email address" });
      await page.locator("#coordinated [data-slot=field-label]").evaluate((node) => {
        window.retainedParentLabel = node;
        window.retainedParentText = node.querySelector("[data-slot=label-text]").firstChild;
      });
      const parentBeforeClose = await page
        .locator("#coordinated")
        .evaluate((node) => node.getAnimations({ subtree: true }).map((animation) => animation.effect.getKeyframes()));
      if (effective === "full")
        assert(
          parentBeforeClose.some((frames) => frames.some((frame) => "height" in frame)),
          "the parent has an actual running size writer before close",
        );
      await update(page, { closed: true });
      assert.equal(
        await page.locator("#coordinated").evaluate((node) => node.getAnimations({ subtree: true }).length),
        0,
        "parent close settles actual measured owners",
      );
      assert.equal(
        await page.locator("#coordinated [data-cadence-layout-anchor]").count(),
        0,
        "parent close cancels child paint",
      );
      await update(page, { closed: false });
      assert(
        await page
          .locator("#coordinated [data-slot=field-label]")
          .evaluate(
            (node) =>
              node === window.retainedParentLabel &&
              node.querySelector("[data-slot=label-text]").firstChild === window.retainedParentText,
          ),
        "reopen preserves the physical label and native Text",
      );
      const parentReopen = await page
        .locator("#coordinated [data-slot=field-label]")
        .evaluate((node) => node.getAnimations().map((a) => a.effect.getKeyframes()));
      report.parentReopen = { mode, os, frames: parentReopen };
      assert(
        !parentReopen.some((frames) => frames.some((frame) => "opacity" in frame)),
        "parent-owned reopen must not replay a child entrance",
      );
      await update(page, { clock: 0, show: false, hidden: true });
      await update(page, { clock: 4, show: true });
      assert.equal(
        await page.locator("#external").evaluate((node) => node.getAnimations().length),
        0,
        "hidden insertion establishes a native baseline",
      );
      await page.locator("#external").evaluate((node) => {
        window.hiddenLabel = node;
        window.hiddenText = node.firstElementChild.firstChild;
      });
      await update(page, { hidden: false });
      assert(
        await page
          .locator("#external")
          .evaluate(
            (node) =>
              node === window.hiddenLabel &&
              node.firstElementChild.firstChild === window.hiddenText &&
              !node.getAnimations().length,
          ),
        "hidden recovery preserves native identity without entry replay",
      );
      await update(page, { mode: "none", features: false });
      assert.equal(await page.locator("#nested-none").getAttribute("data-motion"), "none");
      assert.equal(await page.locator("#nested-full").getAttribute("data-motion"), os ? "reduced" : "full");
      assert.equal(await page.locator("#portal").getAttribute("data-motion"), "none");
      await update(page, { mode, clock: 4, value: "Email address" });
      await update(page, { value: "Final work email address" });
      await update(page, { mode: "reduced" });
      await update(page, { mode: "none" });
      assert.equal(await page.locator("#external").evaluate((n) => n.getAnimations().length), 0);
      for (const id of ["external", "quantity", "coordinated", "nested-none", "portal"])
        assert.equal(
          await page.locator(`#${id} [data-cadence-layout-anchor],#${id}[data-cadence-layout-anchor]`).count(),
          0,
          "same-target downgrade removes the actual owner's layers",
        );
      assert(
        await page.evaluate(() => {
          const anchor = document
            .querySelector("#nested-full [data-slot=label-text]")
            ?.getAttribute("data-cadence-layout-anchor");
          return [...document.querySelectorAll("[data-cadence-text-layer],[data-cadence-number-layer]")].every(
            (layer) => anchor && layer.style.left.includes(`anchor(--cadence-display-${anchor} left)`),
          );
        }),
        "only the explicitly full nested provider may retain paint",
      );
      await update(page, { show: false, parent: false });
      assert.equal(await page.locator("#external").count(), 0);
      assert.equal(await page.locator("#external,#coordinated").count(), 0);
      report.cases.push({
        mode,
        os,
        effective,
        middle,
        reverse,
        clipped,
        entrance,
        unsupported,
        nativeColour,
        coordinated,
        parentBeforeClose,
        parentReopen,
        passive,
      });
      await context.close();
    }
  const colourContext = await browser.newContext();
  const page = await colourContext.newPage();
  await page.goto(base);
  await page.waitForFunction(() => window.labelReady);
  const colour = [];
  for (const target of ["external", "wrapped"]) {
    await page.locator(target === "external" ? "#external-input" : "#wrapped-input").focus();
    await update(page, { foreground: true });
    const row = await page.locator(`#${target}`).evaluate(async (n) => {
      await new Promise(requestAnimationFrame);
      return {
        duration: getComputedStyle(n).transitionDuration,
        colour: getComputedStyle(n).color,
        animations: n.getAnimations().map((a) => ({ property: a.transitionProperty, frames: a.effect.getKeyframes() })),
      };
    });
    if (target === "external")
      assert(
        row.animations.some((a) => a.property === "color"),
        "htmlFor target focus alone permits native colour transition",
      );
    else {
      assert.equal(row.duration, "0s");
      assert.equal(row.animations.length, 0, "actual focus-within cancels paint");
    }
    colour.push({ target, ...row });
    await update(page, { clock: 0, foreground: false });
    await update(page, { clock: 4 });
  }
  await page.locator("#native").focus();
  await update(page, { invalid: true, foreground: true });
  assert.equal(await page.locator("#external").evaluate((n) => getComputedStyle(n).transitionDuration), "0s");
  const axe = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
  assert.deepEqual(
    axe.violations.map((v) => v.id),
    [],
  );
  report.colour = colour;
  report.axe = [];
  await colourContext.close();
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(base);
  await noJS.locator("#external").click();
  assert(await noJS.locator("#external-input").evaluate((n) => n === document.activeElement));
  await noJS.locator("#wrapped").click();
  assert(await noJS.locator("#wrapped-input").isChecked());
  assert(await noJS.locator("#external").isVisible());
  await noJS.close();
  report.noJS = true;
  delete report.pending;
  assert.deepEqual(report.errors, []);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    cases: report.cases.length,
    noJS: report.noJS,
    errors: report.errors,
    installed: report.installation?.files.length,
  }),
);
