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

assert(process.env.ALERT_OUTPUT);
const output = path.resolve(process.env.ALERT_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy;
const report = { cases: [], errors: [], screenshots: [], inputs: {}, installation: null };
if (process.env.ALERT_INSTALL) {
  const items = new Map(),
    queue = ["alert", "card"];
  while (queue.length) {
    const id = queue.shift();
    if (items.has(id)) continue;
    const bytes = await readFile(`public/r/${id}.json`),
      item = JSON.parse(bytes);
    items.set(id, item);
    report.inputs[`public/r/${id}.json`] = hash(bytes);
    for (const dep of item.registryDependencies ?? []) {
      assert(dep.startsWith("@cadence/"));
      queue.push(dep.slice(9));
    }
  }
  const group = installationPlan([...items.values()], "alert"),
    button = installationPlan([...items.values()], "card");
  const files = new Map([...group.files, ...button.files].map((file) => [file.target, file]));
  copy = path.join(output, "installed/components/cadence");
  for (const file of files.values()) {
    assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
    const target = path.resolve(copy, file.target.slice(20));
    assert(target.startsWith(copy + path.sep));
    assert.equal(file.content, await readFile(file.path, "utf8"));
    assert(!/from\s+["']@\//.test(file.content));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
  report.installation = {
    items: [...items.keys()],
    files: [...files.values()].map((file) => ({ target: file.target, sha: hash(file.content) })),
  };
  const consumer = path.join(output, "consumer.tsx");
  await writeFile(
    consumer,
    'import {Alert,AlertTitle,AlertDescription,AlertAction,type AlertProps} from "./installed/components/cadence/alert";const props:AlertProps={variant:"destructive",ref:node=>{if(node)return()=>{};}};export const example=<Alert {...props}><AlertTitle>Current</AlertTitle><AlertDescription>{19}</AlertDescription><AlertAction><button type="button">Retry</button></AlertAction></Alert>',
  );
  execFileSync(
    process.execPath,
    [
      require.resolve("typescript/bin/tsc"),
      "--noEmit",
      "--skipLibCheck",
      "--strict",
      "--jsx",
      "react-jsx",
      "--target",
      "ES2022",
      "--module",
      "ESNext",
      "--moduleResolution",
      "bundler",
      "--lib",
      "ES2022,DOM,DOM.Iterable",
      consumer,
    ],
    { windowsHide: true, stdio: "pipe" },
  );
  report.installation.typecheck = true;
}
const plugins = copy
  ? [
      {
        name: "copied-only",
        setup(builder) {
          builder.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
            const target = path.resolve(copy, args.path.replaceAll("\\", "/").split("registry/cadence/")[1]);
            const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
            assert(file, "no workspace source fallback");
            return { path: file };
          });
        },
      },
    ]
  : [];
const client = await build({
  entryPoints: ["tests/runtime/alert-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/alert-pilot-ssr.jsx"],
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
const { render } = require(path.join(output, "ssr.cjs"));
const css = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
const js = client.outputFiles[0].text;
await writeFile(path.join(output, "executed.js"), js);
await writeFile(path.join(output, "compiled.css"), css);
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
for (const file of [
  ...Object.keys(client.metafile.inputs),
  "registry.json",
  "docs/motion/components/alert.md",
  "content/components/alert.mdx",
  "tests/runtime/alert-pilot.mjs",
  "app/globals.css",
  "upstream/manifest.json",
])
  report.inputs[file] = hash(await readFile(file));
report.clientGzip = gzipSync(js).length;
const server = http.createServer((req, res) => {
  const mode = new URL(req.url, "http://localhost").searchParams.get("mode") ?? "full";
  const dark = new URL(req.url, "http://localhost").searchParams.get("theme") === "dark";
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? js
      : `<!doctype html><html lang="en" class="${dark ? "dark" : ""}"><title>Alert runtime</title><style>${css}</style><div id="root">${render(mode)}</div><aside id="portal" aria-label="Portal example"></aside><script>window.alertSSRHost=document.querySelector('#message');window.alertSSRText=document.querySelector('#title [data-slot="alert-text"]').firstChild;window.alertInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const update = (page, patch) => page.evaluate((patch) => window.alertUpdate(patch), patch);
const paint = (page) =>
  page.evaluate(() => {
    const root = document.getElementById("message"),
      icon = root?.querySelector(":scope > svg"),
      layer = root?.querySelector('[data-slot="alert-icon-visual"]');
    const anchors = [
      ...document.querySelectorAll(
        "#message [data-cadence-layout-anchor],#quantity [data-cadence-layout-anchor],#identifier [data-cadence-layout-anchor]",
      ),
    ].map((n) => n.getAttribute("data-cadence-layout-anchor"));
    const layers = [...document.querySelectorAll("[data-cadence-text-layer],[data-cadence-number-layer]")].filter((n) =>
      anchors.some((id) => n.style.left.includes(`--cadence-display-${id} `)),
    );
    const textHosts = layers
      .filter((n) => n.hasAttribute("data-cadence-text-layer"))
      .map((layer) => {
        const native = [...document.querySelectorAll("[data-cadence-layout-anchor]")].find((host) =>
          layer.style.left.includes(`--cadence-display-${host.getAttribute("data-cadence-layout-anchor")} `),
        );
        return {
          host: native?.parentElement?.id,
          paint: [...layer.querySelectorAll("canvas")].some((canvas) =>
            canvas
              .getContext("2d")
              .getImageData(0, 0, canvas.width, canvas.height)
              .data.some((v, i) => i % 4 === 3 && v > 0),
          ),
        };
      });
    const reels = layers.flatMap((n) => [...n.querySelectorAll("[data-cadence-reel]")]);
    const numberHosts = layers
      .filter((n) => n.hasAttribute("data-cadence-number-layer"))
      .map((layer) => {
        const native = [...document.querySelectorAll("[data-cadence-layout-anchor]")].find((host) =>
          layer.style.left.includes(`--cadence-display-${host.getAttribute("data-cadence-layout-anchor")} `),
        );
        return {
          host: native?.parentElement?.id,
          paint: [...layer.querySelectorAll("canvas")].some((canvas) =>
            canvas
              .getContext("2d")
              .getImageData(0, 0, canvas.width, canvas.height)
              .data.some((v, i) => i % 4 === 3 && v > 0),
          ),
        };
      });
    const pixels = layers
      .flatMap((n) => [...n.querySelectorAll("canvas")])
      .map((canvas) => {
        const bytes = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let alpha = 0,
          signature = 0;
        for (let i = 0; i < bytes.length; i++) {
          signature = (signature * 31 + bytes[i]) >>> 0;
          if (i % 4 === 3) alpha += bytes[i];
        }
        return { alpha, signature, width: canvas.width, height: canvas.height };
      });
    return {
      height: root?.getBoundingClientRect().height,
      root: root && getComputedStyle(root).color,
      surface: root && getComputedStyle(root).backgroundColor,
      title: document.getElementById("title")?.textContent,
      description: document.getElementById("description")?.textContent,
      quantity: document.getElementById("number-description").textContent,
      text: layers.filter((n) => n.hasAttribute("data-cadence-text-layer")).length,
      reels: reels.length,
      phases: reels.map((n) => +n.dataset.phase),
      pixels,
      textHosts,
      numberHosts,
      icon: icon && getComputedStyle(icon).opacity,
      outgoing: layer?.childElementCount,
      overlay: layer && getComputedStyle(layer).opacity,
      heightFrames: root
        ?.getAnimations()
        .filter((a) => a.effect.getKeyframes().some((f) => "height" in f))
        .map((a) => ({ time: a.currentTime, frames: a.effect.getKeyframes() })),
      live: root?.getAttribute("role"),
      directIcons: root?.querySelectorAll(":scope > svg").length,
      identity: root === window.alertSSRHost,
      textIdentity: document.querySelector('#title [data-slot="alert-text"]')?.firstChild === window.alertSSRText,
    };
  });
const frames = async (page, count = 14) => {
  const rows = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    rows.push(await paint(page));
  }
  return rows;
};
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1100 } }),
        page = await context.newPage();
      const record = { os, mode };
      report.cases.push(record);
      page.on("pageerror", (e) => report.errors.push(e.stack));
      page.on("console", (m) => {
        if (m.type() === "error") report.errors.push(m.text());
      });
      await page.addInitScript(() => {
        window.alertAnimations = [];
        const animate = Element.prototype.animate;
        Element.prototype.animate = function (...args) {
          const a = animate.apply(this, args);
          window.alertAnimations.push({ node: this, a, frames: args[0] });
          return a;
        };
      });
      await page.goto(`${base}?mode=${mode}`);
      await page.waitForFunction(() => window.alertReady && document.getElementById("portal-message"));
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await page.waitForFunction((m) => document.getElementById("message").dataset.motion === m, effective);
      record.initial = await paint(page);
      assert(record.initial.identity && record.initial.textIdentity && record.initial.height > 0);
      assert.equal(record.initial.text, 0);
      assert.equal(record.initial.reels, 0);
      assert.equal(
        await page.evaluate(() => window.alertAnimations.filter((r) => r.node.closest("#message")).length),
        0,
        "SSR hydration is visible without replay",
      );
      await update(page, {
        title: "Deploy ready",
        description: "Review ready",
        count: 20,
        pad: 64,
        icon: "warning",
      });
      record.frames = await frames(page);
      assert(
        record.frames.every(
          (r) =>
            r.title === "Deploy ready" &&
            r.description === "Review ready" &&
            r.quantity === "20" &&
            r.identity &&
            r.textIdentity &&
            r.directIcons === 1,
        ),
      );
      if (effective === "full") {
        for (const host of ["number-title", "number-description"])
          assert(
            record.frames.some((row) => row.numberHosts.some((number) => number.host === host && number.paint)),
            `${host} actual numeric glyph pixels`,
          );
        assert(
          record.frames.some((r) => r.reels > 0 && r.phases.some((p) => p > 0 && p < 1)),
          "actual compact reel phase",
        );
        assert(
          record.frames.some((r) => r.heightFrames.length > 0),
          "root owns an actual height writer",
        );
        assert(new Set(record.frames.map((r) => r.height)).size > 2, "real middle heights change");
        assert(
          record.frames.some((r) => r.pixels.some((p) => p.alpha > 0)),
          "actual drawn glyph pixels",
        );
        assert(
          new Set(record.frames.flatMap((r) => r.pixels.map((p) => p.signature))).size > 2,
          "glyph raster changes over time",
        );
      } else {
        assert(
          record.frames.every((r) => r.reels === 0 && r.heightFrames.length === 0),
          "restricted geometry and number are immediate",
        );
      }
      if (effective !== "none") {
        assert(
          record.frames.some((row) => row.textHosts.some((text) => text.host === "title" && text.paint)),
          "actual AlertTitle glyph pixels, with original tracking-tight",
        );
        assert(
          record.frames.some((row) => row.textHosts.some((text) => text.host === "description" && text.paint)),
          "actual AlertDescription glyph pixels in the same resize transaction",
        );
        assert(
          record.frames.some((r) => r.text > 0 && r.pixels.some((p) => p.alpha > 0)),
          "changed message text has visible raster",
        );
        assert(
          record.frames.some((r) => r.outgoing === 1 && +r.icon > 0 && +r.icon < 1 && +r.overlay > 0 && +r.overlay < 1),
          "two genuine icon middle opacities",
        );
      } else assert(record.frames.every((r) => r.text === 0 && r.outgoing === 0 && r.icon === "1"));
      await update(page, { mode: "none" });
      record.none = await paint(page);
      assert.equal(record.none.text, 0);
      assert.equal(record.none.reels, 0);
      assert.equal(record.none.outgoing, 0);
      assert.equal(
        await page.evaluate(
          () =>
            document
              .getAnimations()
              .filter((a) => a.playState === "running" && a.effect?.target?.closest?.("#message,#quantity,#identifier"))
              .length,
        ),
        0,
        "live none cancels all owners including colour",
      );
      await update(page, {
        mode: "full",
        clock: 4,
        pad: 12,
        icon: "info",
        variant: "default",
        title: "Deploy pending",
        description: "Review pending",
        count: 19,
      });
      await page.waitForTimeout(60);
      await update(page, { clock: 0 });
      assert.equal((await paint(page)).outgoing, 0);
      assert.equal((await paint(page)).text, 0);
      assert.equal((await paint(page)).reels, 0);
      await update(page, { clock: 4 });
      await page.waitForTimeout(40);
      assert.equal((await paint(page)).text, 0, "restoring a settled clock does not replay");
      await update(page, { pad: 64, count: 20, icon: "warning", title: "Policy ready" });
      await page.waitForTimeout(30);
      await update(page, { mode: "reduced" });
      record.liveReduced = await paint(page);
      assert.equal(record.liveReduced.reels, 0);
      assert.equal(record.liveReduced.heightFrames.length, 0);
      if (os === "no-preference") assert.equal(record.liveReduced.outgoing, 0);
      await update(page, { mode: "none" });
      await update(page, { mode: "full", clock: 0, pad: 12, icon: "info", title: "Deploy pending", count: 19 });
      await update(page, { clock: 4 });
      if (os === "no-preference") {
        await update(page, { pad: 64, count: 20, icon: "warning", title: "OS ready" });
        await page.waitForTimeout(30);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => document.getElementById("message").dataset.motion === "reduced");
        record.liveOS = await paint(page);
        assert.equal(record.liveOS.reels, 0);
        assert.equal(record.liveOS.heightFrames.length, 0);
        assert.equal(record.liveOS.outgoing, 0);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.waitForFunction(() => document.getElementById("message").dataset.motion === "full");
        await update(page, { clock: 0, pad: 12, count: 19, icon: "info", title: "Deploy pending" });
        await update(page, { clock: 4 });
      }
      await update(page, { rootInk: true, foreground: true });
      record.inheritedPaint = [];
      for (let index = 0; index < 8; index++) {
        await page.evaluate(() => new Promise(requestAnimationFrame));
        record.inheritedPaint.push(
          await page.locator("#paint-owner").evaluate((n) => ({
            root: getComputedStyle(n).color,
            title: getComputedStyle(n.querySelector("#inherited-title")).color,
            icon: getComputedStyle(n.querySelector(":scope > svg")).color,
            description: getComputedStyle(n.querySelector("#independent-description")).color,
            rootOwners: n.getAnimations().filter((a) => a.transitionProperty === "color").length,
            titleOwners: n
              .querySelector("#inherited-title")
              .getAnimations()
              .filter((a) => a.transitionProperty === "color").length,
            descriptionOwners: n
              .querySelector("#independent-description")
              .getAnimations()
              .filter((a) => a.transitionProperty === "color").length,
          })),
        );
      }
      assert(
        record.inheritedPaint.every(
          (row) =>
            row.root === row.title &&
            row.root === row.icon &&
            row.titleOwners === 0 &&
            row.rootOwners <= 1 &&
            row.descriptionOwners <= 1,
        ),
      );
      assert(
        record.inheritedPaint.some(
          (row) => row.root !== row.description && row.rootOwners === 1 && row.descriptionOwners === 1,
        ),
        "one root writer feeds inherited ink while description owns its independent colour",
      );
      await update(page, { clock: 0, foreground: false, rootInk: false });
      await update(page, { clock: 4 });
      await update(page, { surface: true, foreground: true, variant: "destructive" });
      record.colour = await frames(page, 8);
      if (effective !== "none") {
        // The explicit full request remains subject to the OS ceiling.
        assert(new Set(record.colour.map((r) => r.root)).size > 1, "root foreground has actual middle paint");
        assert(new Set(record.colour.map((r) => r.surface)).size > 1, "surface has actual middle paint");
      }
      await update(page, { clock: 0, surface: false, foreground: false, variant: "default", icon: "info", pad: 12 });
      await update(page, { clock: 4 });
      await page.locator("#retry").focus();
      const beforeAction = await page.locator("#retry").boundingBox();
      await update(page, {
        icon: "warning",
        description:
          "A much longer current description that expands to several lines while the original action remains focused and operable.",
        pad: 64,
      });
      await page.waitForTimeout(35);
      record.focused = await paint(page);
      assert(await page.locator("#retry").evaluate((n) => n === document.activeElement));
      assert.equal(record.focused.heightFrames.length, 0, "focused action forces affected size immediate");
      const afterAction = await page.locator("#retry").boundingBox();
      assert.equal(beforeAction.x, afterAction.x);
      assert.equal(beforeAction.y, afterAction.y);
      assert.equal(await page.locator("#message > svg").count(), 1);
      await update(page, { show: false });
      assert.equal(await page.locator('#message[role="alert"]').count(), 0, "outgoing live region retires immediately");
      if (await page.locator("#message").count()) {
        assert(await page.locator("#message").evaluate((n) => n.inert));
        assert.equal(await page.locator('#message [data-slot="alert-icon-visual"] > svg').count(), 0);
      }
      await update(page, { show: true, title: "Newest message", icon: "latest" });
      assert.equal(await page.locator("#title").textContent(), "Newest message");
      assert.equal(
        await page.locator("#message").evaluate((n) => n === window.alertSSRHost),
        true,
        "reopen keeps the retained surface",
      );
      await page.locator("#retry").press("Enter");
      assert.equal(await page.evaluate(() => window.alertClicks), 1);
      await page.locator("#outside").focus();
      await update(page, { clock: 0, rich: true, pad: 12 });
      await page.locator("#memo").fill("user draft");
      await page.evaluate(() => {
        window.alertNativeInput = document.getElementById("memo");
        window.alertNativeRich = document.getElementById("rich-body");
      });
      await update(page, { clock: 4, title: "Native update", count: 21, pad: 64, icon: "info" });
      assert.equal(await page.locator("#memo").inputValue(), "user draft");
      assert(
        await page.evaluate(
          () =>
            document.getElementById("memo") === window.alertNativeInput &&
            document.getElementById("rich-body") === window.alertNativeRich,
        ),
      );
      await page.locator("#outside").focus();
      const arbitrary = await page.locator("#arbitrary").elementHandle();
      await update(page, {
        action: false,
        title: "Action removed",
        description: "The newest message no longer has an action.",
        icon: "none",
      });
      assert.equal(await page.locator("#retry").count(), 0, "removed action has no retained tab stop or clone");
      assert.equal(await page.locator("#message > svg").count(), 0);
      assert.equal((await paint(page)).outgoing, 0);
      const withoutIcon = await page.locator("#message").evaluate((n) => getComputedStyle(n).gridTemplateColumns);
      assert.equal(Number.parseFloat(withoutIcon), 0, "native icon column collapses");
      await update(page, { action: true, title: "Action restored", icon: "warning" });
      assert.equal(await page.locator("#retry").count(), 1);
      assert.equal(await page.locator("#message > svg").count(), 1);
      assert(await page.locator("#arbitrary").evaluate((n, original) => n === original, arbitrary));
      assert.equal(
        await page.locator("#message > svg").evaluate((n) => n.parentElement.querySelectorAll(":scope > svg").length),
        1,
      );
      await update(page, { clock: 0, pad: 12 });
      await update(page, { clock: 4 });
      await page.evaluate(() => window.alertPassive());
      await page.waitForTimeout(40);
      assert.equal((await paint(page)).heightFrames.length, 0, "passive child resize is native");
      await update(page, { rich: false, title: 19, description: 19, edit: true });
      await page.evaluate(() => {
        const span = document.querySelector('#title [data-slot="alert-number"]');
        window.alertEditSpan = span;
        window.alertEditText = span.firstChild;
        span.firstChild.replaceData(0, span.firstChild.length, "Native buffer");
        getSelection().setBaseAndExtent(span.firstChild, 3, span.firstChild, 3);
      });
      for (const title of ["ERR_042", 20, "Changed", 22]) await update(page, { title });
      assert(
        await page.evaluate(
          () =>
            window.alertEditSpan ===
              document.querySelector('#title [data-slot="alert-text"],#title [data-slot="alert-number"]') &&
            window.alertEditText === window.alertEditSpan.firstChild &&
            window.alertEditText.data === "Native buffer" &&
            getSelection().anchorNode === window.alertEditText,
        ),
      );
      assert.equal(await page.locator("#message [data-cadence-text-layer],#message [data-cadence-reel]").count(), 0);
      await page.evaluate(() => getSelection().removeAllRanges());
      await update(page, { edit: false, title: 22 });
      await update(page, { title: 23 });
      assert.equal(await page.locator("#title").textContent(), "23");
      await update(page, { clock: 0, title: "Clamped title ".repeat(12), features: false });
      await update(page, { clock: 4, title: "Clamped newest title ".repeat(12) });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.equal(await page.locator("#title").evaluate((n) => getComputedStyle(n).webkitLineClamp), "1");
      assert.equal(
        (await paint(page)).textHosts.filter((row) => row.host === "title").length,
        0,
        "long clamped title keeps native clipping and exact text",
      );
      assert.equal(await page.locator("#title").textContent(), "Clamped newest title ".repeat(12));
      await update(page, { clock: 0, features: true, title: "Unknown feature" });
      await update(page, { clock: 4, title: "Latest native feature", description: "Latest native description" });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.equal(
        (await paint(page)).textHosts.filter((row) => ["title", "description"].includes(row.host)).length,
        0,
        "unknown caller font feature keeps native paint",
      );
      assert.equal(await page.locator("#title").textContent(), "Latest native feature");
      assert.equal(await page.locator("#message").evaluate((n) => getComputedStyle(n).fontFeatureSettings), '"ss01"');
      await update(page, { clock: 0, features: false });
      await update(page, { clock: 0, title: "Safe message", description: "Safe body", pad: 12, icon: "info" });
      await update(page, { clock: 4, mode: "full", outer: "none", child: "full", childClock: 4 });
      await update(page, { pad: 64, title: "Nested ready" });
      await page.waitForTimeout(40);
      const nested = await page
        .locator("#nested")
        .evaluate((n) => ({ mode: n.dataset.motion, frames: n.getAnimations().map((a) => a.effect.getKeyframes()) }));
      record.nested = nested;
      assert.equal(nested.mode, os === "reduce" ? "reduced" : "full");
      if (os === "no-preference")
        assert(
          nested.frames.some((f) => f.some((k) => "height" in k)),
          "full child owns geometry beneath none parent",
        );
      await update(page, { clock: 0, pad: 12, child: "none", outer: "full" });
      await update(page, { clock: 4 });
      await update(page, { pad: 64, title: "Nested immediate" });
      await page.waitForTimeout(40);
      assert.equal(
        await page
          .locator("#nested")
          .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length),
        0,
        "none child never borrows parent permission",
      );
      for (const guard of ["fixed", "ratio", "unknown"]) {
        await update(page, { clock: 0, pad: 12, [guard]: true });
        await update(page, { clock: 4 });
        await update(page, { pad: 64, description: "Guard latest" });
        await page.waitForTimeout(40);
        assert.equal((await paint(page)).heightFrames.length, 0, `${guard} geometry retains native control`);
        await update(page, { clock: 0, [guard]: false });
      }
      await update(page, { clock: 0, pad: 12 });
      await page.locator("#message").evaluate((n) => {
        window.alertNativeHeight = n.animate([{ height: "160px" }, { height: "160px" }], {
          duration: 10000,
          fill: "both",
        });
      });
      await update(page, { clock: 4, pad: 64 });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      assert.equal(
        await page.locator("#message").evaluate((n) => n.getBoundingClientRect().height),
        160,
        "pre-existing native height remains authoritative",
      );
      assert.equal(
        await page
          .locator("#message")
          .evaluate((n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length),
        1,
      );
      await page.evaluate(() => window.alertNativeHeight.cancel());
      if (os === "no-preference") {
        await update(page, { clock: 0, pad: 12, title: "Geometry source pending" });
        await update(page, { clock: 4, pad: 64, title: "Geometry source ready" });
        await page.waitForTimeout(35);
        assert((await paint(page)).heightFrames.length > 0);
        assert(
          (await paint(page)).textHosts.some((row) => row.host === "title" && row.paint),
          "known root height lease preserves actual title pixels",
        );
        await page.locator("#message").evaluate((n) => {
          window.alertNativeHeight = n.animate([{ height: "170px" }, { height: "170px" }], {
            duration: 10000,
            fill: "both",
          });
        });
        await page.evaluate(
          () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        assert.equal(await page.evaluate(() => window.alertNativeHeight.playState), "running");
        assert.equal(
          await page
            .locator("#message")
            .evaluate(
              (n) => n.getAnimations().filter((a) => a.effect.getKeyframes().some((f) => "height" in f)).length,
            ),
          1,
          "live native geometry revokes only the shared writer",
        );
        assert.equal(
          (await paint(page)).textHosts.filter((row) => row.host === "title").length,
          0,
          "foreign height authority also cancels the opted-in title paint",
        );
        assert.equal(await page.locator("#message").evaluate((n) => n.getBoundingClientRect().height), 170);
        await page.evaluate(() => window.alertNativeHeight.cancel());
        await update(page, { clock: 0, pad: 12, title: "Mirror pending", count: 19 });
        await update(page, { clock: 4, pad: 64, title: "Mirror ready", count: 20 });
        await page.waitForTimeout(35);
        assert(
          (await paint(page)).textHosts.some((row) => row.host === "title" && row.paint),
          "real native mirror keeps title paint during the root resize",
        );
        for (const host of ["number-title", "number-description"])
          assert(
            (await paint(page)).numberHosts.some((row) => row.host === host && row.paint),
            "real native mirror keeps each numeric owner's pixels during the sibling resize",
          );
        await page.locator("#form [data-preview-body]").evaluate((node) => {
          node.style.height = `${Number.parseFloat(getComputedStyle(node).height) + 1.25}px`;
        });
        await page.evaluate(
          () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        assert.equal(
          (await paint(page)).textHosts.filter((row) => row.host === "title").length,
          0,
          "an unissued mirror-host height write cannot borrow the genuine receipt",
        );
        assert.equal(await page.locator("#title").textContent(), "Mirror ready");
        assert.equal((await paint(page)).numberHosts.length, 0, "an unissued height write cancels numeric pixels too");
      }
      await update(page, { clock: 0, pad: 12, icon: "info", unsafe: true });
      await update(page, { clock: 4 });
      await update(page, { icon: "warning" });
      assert.equal((await paint(page)).outgoing, 0, "unsupported SVG is never copied");
      await update(page, { clock: 0, unsafe: false, unkeyed: true, icon: "info" });
      await update(page, { clock: 4 });
      await update(page, { icon: "warning" });
      assert.equal((await paint(page)).outgoing, 0, "unkeyed replacement has no icon effect");
      await update(page, { clock: 0, decoy: true, icon: "info" });
      await update(page, { clock: 4, icon: "warning" });
      assert.equal((await paint(page)).outgoing, 0, "keyed non-SVG cannot lend source authority to an unkeyed SVG");
      assert.equal(await page.locator("#decoy").textContent(), "Decorative label");
      await update(page, { clock: 0, decoy: false });
      await update(page, { clock: 0, unkeyed: false, icon: "info" });
      await update(page, { clock: 4, icon: "" });
      assert.equal((await paint(page)).outgoing, 1, "an explicit empty React key remains a valid replacement identity");
      await update(page, { clock: 0, unkeyed: false, icon: "info", mode: "full" });
      await page.locator("#message > svg").evaluate((n) => {
        window.alertNativeIcon = n.animate([{ opacity: 1 }, { opacity: 0.8 }], { duration: 10000, fill: "both" });
      });
      await update(page, { clock: 4, icon: "warning" });
      assert.equal((await paint(page)).outgoing, 0, "native source opacity is not eligible");
      await page.evaluate(() => window.alertNativeIcon.cancel());
      await update(page, { clock: 0, icon: "info" });
      await update(page, { clock: 4, icon: "warning" });
      await page.locator("#message > svg").evaluate((n) => {
        window.alertTakeover = n.animate([{ opacity: 0.7 }, { opacity: 0.4 }], { duration: 10000, fill: "both" });
      });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal((await paint(page)).outgoing, 0, "native incoming opacity retires owned visuals");
      assert.equal(
        await page.evaluate(() => window.alertTakeover.playState),
        "running",
        "native engine survives takeover",
      );
      await page.evaluate(() => window.alertTakeover.cancel());
      await update(page, { clock: 0, icon: "info" });
      await update(page, { clock: 4, icon: "warning" });
      await update(page, { icon: "newest" });
      assert.equal((await paint(page)).outgoing, 0, "rapid icon changes retire obsolete layers without backlog");
      if (os === "no-preference") {
        await update(page, { clock: 0, pad: 12, icon: "info" });
        await update(page, { clock: 4, pad: 64, icon: "warning" });
        await page.waitForTimeout(1000);
        record.decorationAfterCompletion = await paint(page);
        assert.equal(record.decorationAfterCompletion.outgoing, 0);
        assert(
          record.decorationAfterCompletion.heightFrames.length > 0,
          "completed inert icon visual cannot cancel the longer root geometry flight",
        );
        await page.locator("#arbitrary").evaluate((n) => {
          const span = document.createElement("span");
          span.id = "native-new-content";
          span.textContent = " New native content";
          n.append(span);
        });
        await page.evaluate(() => new Promise(requestAnimationFrame));
        assert.equal(
          (await paint(page)).heightFrames.length,
          0,
          "ordinary caller content mutation still settles geometry",
        );
        await page.locator("#native-new-content").evaluate((n) => n.remove());
      }
      await update(page, { clock: 0, later: false });
      await update(page, { clock: 4, later: true });
      record.entrance = await page.locator("#later").evaluate((n) => ({
        opacity: getComputedStyle(n).opacity,
        frames: n.getAnimations().map((a) => a.effect.getKeyframes()),
      }));
      if (os === "no-preference")
        assert(
          record.entrance.frames.some((f) => f.some((k) => "opacity" in k)),
          "dynamic insertion uses real opacity",
        );
      await update(page, { mode: "none" });
      const axe = await new AxeBuilder({ page }).disableRules(["region"]).analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
      );
      record.axe = [];
      await page.evaluate(() => window.alertUnmount());
      assert.equal(
        await page
          .locator('[data-cadence-text-layer],[data-cadence-reel],[data-slot="alert-icon-visual"] > svg')
          .count(),
        0,
      );
      assert.equal(
        await page.evaluate(() => window.alertAnimations.filter((r) => r.a.playState === "running").length),
        0,
        "unmount retires actual native handles",
      );
      await context.close();
    }
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.goto(`${base}?theme=${theme}`);
      await page.waitForFunction(() => window.alertReady);
      await page.evaluate(() => {
        window.alertUpdate({
          mode: "none",
          title: "Deploy failed",
          description: "Review the current build output before retrying. The previous release remains live.",
          variant: "destructive",
          icon: "warning",
        });
      });
      const file = `${theme}-${width}.png`;
      await page.screenshot({ path: path.join(output, file), fullPage: true });
      report.screenshots.push(file);
      await page.close();
    }
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(base);
  assert.equal(await noJS.locator("#title").textContent(), "Deploy pending");
  assert.equal(await noJS.locator("#number-description").textContent(), "19");
  assert(await noJS.locator("#message").isVisible());
  assert.equal(await noJS.locator("#arbitrary a").getAttribute("href"), "#destination");
  await noJS.close();
  report.noJS = true;
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.stack;
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.closed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    passed: report.passed,
    cases: report.cases.length,
    installed: report.installation?.files.length,
    noJS: report.noJS,
  }),
);
