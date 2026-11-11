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

assert(process.env.KBD_OUTPUT);
const output = path.resolve(process.env.KBD_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.KBD_COPY;
let installation;
if (process.env.KBD_INSTALL) {
  const payloads = new Map();
  const queue = ["kbd", "tooltip"];
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
    "kbd",
  );
  const numericPlan = installationPlan(
    [...payloads.values()].map(({ item }) => item),
    "tooltip",
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
  entryPoints: ["tests/runtime/kbd-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/kbd-pilot-ssr.jsx"],
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
        "public/r/kbd.json",
        "content/components/kbd.mdx",
        "docs/motion/components/kbd.md",
        "app/globals.css",
        "tests/runtime/kbd-pilot.jsx",
        "tests/runtime/kbd-pilot-ssr.jsx",
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
      : `<!doctype html><html lang="en"><title>Kbd runtime</title><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.kbdSSRKey=document.querySelector('#key-a');window.kbdSSRText=document.querySelector('#key-a [data-slot=kbd-text]').firstChild;window.kbdInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const update = (page, patch) => page.evaluate((patch) => window.kbdUpdate(patch), patch);
const frames = (page) =>
  page.evaluate(async () => {
    const rows = [];
    for (let i = 0; i < 18; i++) {
      await new Promise(requestAnimationFrame);
      const key = document.querySelector("#key-a"),
        end = document.querySelector("#key-c"),
        group = document.querySelector("#chord");
      const paints = (id) => {
        const host = document.querySelector(id + " [data-slot=kbd-text]"),
          anchor = host?.getAttribute("data-cadence-layout-anchor");
        if (!anchor) return 0;
        return [...document.querySelectorAll("[data-cadence-text-layer]")]
          .filter((layer) => layer.style.left.includes("anchor(--cadence-display-" + anchor + " left)"))
          .reduce((sum, layer) => sum + layer.querySelectorAll("[data-cadence-text-kind]").length, 0);
      };
      rows.push({
        width: key.getBoundingClientRect().width,
        x: end.getBoundingClientRect().x,
        group: group.getBoundingClientRect().width,
        canvas: document.querySelectorAll("[data-cadence-text-kind]").length,
        mainPaint: paints("#key-a"),
        nestedNonePaint: paints("#nested-none"),
        nestedFullPaint: paints("#nested-full"),
        portalPaint: paints("#portal-chord [data-slot=kbd]"),
        effects: [key, end, group].flatMap((node) => node.getAnimations()).map((a) => a.effect.getKeyframes()),
      });
    }
    return rows;
  });
try {
  for (const mode of ["full", "reduced", "none"])
    for (const os of ["no-preference", "reduce"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1000, height: 850 } });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      page.on("console", (message) => {
        if (message.type() === "error") report.errors.push(message.text());
      });
      await page.goto(`${base}/?mode=${mode}`);
      await page.waitForFunction(() => window.kbdReady);
      assert(
        await page.evaluate(
          () =>
            window.kbdSSRKey === document.querySelector("#key-a") &&
            window.kbdSSRText === document.querySelector("#key-a [data-slot=kbd-text]").firstChild,
        ),
        "hydration preserves the actual server key and Text",
      );
      const effective = os === "reduce" && mode === "full" ? "reduced" : mode;
      assert.equal(await page.locator("#chord").getAttribute("data-motion"), effective);
      assert.equal(await page.locator("#nested-none").getAttribute("data-motion"), "none");
      assert.equal(
        await page.locator("#nested-full").getAttribute("data-motion"),
        os === "reduce" ? "reduced" : "full",
      );
      assert.equal(await page.locator("#portal-chord").getAttribute("data-motion"), effective);
      await page.waitForFunction(() =>
        document
          .querySelector("#portal-chord")
          .getAnimations()
          .every((a) => a.playState !== "running"),
      );
      assert.equal(
        await page.locator("#key-a").evaluate((n) => n.getAnimations().length),
        0,
        "hydration entrance must not replay",
      );
      await page.evaluate(() => {
        window.originalKey = document.querySelector("#key-a");
        window.originalText = document.querySelector("#key-a [data-slot=kbd-text]").firstChild;
      });
      await update(page, { label: "Ctrl", second: "Alt" });
      const sampled = await frames(page);
      if (effective === "full") {
        const low = Math.min(...sampled.map((frame) => frame.width)),
          high = Math.max(...sampled.map((frame) => frame.width));
        assert(
          sampled.some((frame) => frame.mainPaint > 0 && frame.width > low && frame.width < high),
          "the same key's changed text and width have a genuine common middle frame",
        );
        assert(
          Math.max(...sampled.map((x) => x.width)) - Math.min(...sampled.map((x) => x.width)) > 1,
          "key width must have real middle frames",
        );
        assert(
          Math.max(...sampled.map((x) => x.x)) - Math.min(...sampled.map((x) => x.x)) > 1,
          "surviving key must move",
        );
        assert(
          Math.max(...sampled.map((x) => x.group)) - Math.min(...sampled.map((x) => x.group)) > 1,
          "group width must move",
        );
      } else
        assert(
          sampled.every((x) => x.effects.every((frames) => frames.every((f) => !f.transform && !f.width))),
          "reduced/none have no spatial writer",
        );
      if (effective !== "none")
        assert(
          sampled.some((frame) => frame.mainPaint > 0),
          "changed runs must paint during simultaneous key geometry",
        );
      else assert(sampled.every((frame) => frame.mainPaint === 0));
      assert(sampled.every((frame) => frame.nestedNonePaint === 0));
      assert(
        sampled.some((frame) => frame.nestedFullPaint > 0),
        "nested explicit full executes its real label replacement under every outer mode",
      );
      if (effective !== "none")
        assert(
          sampled.some((frame) => frame.portalPaint > 0),
          "portal label replacement uses its actual native anchor",
        );
      await update(page, { label: "Control", second: "Shift", clock: 0 });
      assert.equal(
        await page.locator("[data-cadence-text-layer]").count(),
        0,
        "zero clock removes body-level changed-run opacity writers too",
      );
      assert.equal(
        await page.locator("#chord").evaluate((n) => n.getAnimations({ subtree: true }).length),
        0,
        "same target zero clock cancels before paint",
      );
      assert(
        await page.evaluate(
          () =>
            window.originalKey === document.querySelector("#key-a") &&
            window.originalText === document.querySelector("#key-a [data-slot=kbd-text]").firstChild,
        ),
      );
      await update(page, { clock: 4, extra: true });
      const inserted = await page
        .locator("#key-b")
        .evaluate((n) => n.getAnimations().map((a) => a.effect.getKeyframes()));
      if (effective !== "none")
        assert(
          inserted.some((f) => f.some((k) => "opacity" in k)),
          "inserted key owns opacity",
        );
      await update(page, { label: "Ctrl", second: "Alt" });
      await page.waitForTimeout(70);
      const exitBefore = await page.locator("#key-b").evaluate((node) => node.getBoundingClientRect().x);
      await update(page, { extra: false });
      if (effective !== "none") {
        const exitAfter = await page.locator("#key-b").evaluate((node) => node.getBoundingClientRect().x);
        report.exitMid = { effective, exitBefore, exitAfter };
        assert(Math.abs(exitAfter - exitBefore) < 2, "retained exit freezes its visible projected position");
      }
      if (effective !== "none") assert.equal(await page.locator("#key-b").count(), 1, "exit retained");
      await update(page, { extra: true });
      assert.equal(await page.locator("#key-b").count(), 1, "restoration keeps one key");
      await update(page, { clock: 0, extra: false, reverse: true, number: 10 });
      await page.waitForFunction(() => !document.querySelector("#key-b"));
      assert.equal(await page.locator("#numeric").textContent(), "10");
      await page.keyboard.press("Control+K");
      assert.equal(await page.locator("[data-pressed]").count(), 0);
      await page.locator("#native").focus();
      await page.keyboard.press("Tab");
      assert(await page.locator("#tooltip-trigger").evaluate((n) => n === document.activeElement));
      await update(page, { open: true, clock: 4, label: "Ctrl", second: "Alt" });
      await page.locator("[role=tooltip]").waitFor();
      await page.waitForTimeout(750);
      await update(page, { label: "Control", second: "Shift" });
      const tooltipFrames = await page.locator("#tooltip-chord").evaluate(async (node) => {
        const rows = [];
        for (let i = 0; i < 12; i++) {
          await new Promise(requestAnimationFrame);
          rows.push({
            width: node.getBoundingClientRect().width,
            keys: [...node.querySelectorAll("[data-slot=kbd]")].map((n) => ({
              width: n.getBoundingClientRect().width,
              text: n.textContent,
              scroll: n.scrollWidth,
              client: n.clientWidth,
              ink: n.querySelector("[data-slot=kbd-text]").getBoundingClientRect().toJSON(),
              clipped: /hidden|clip/.test(getComputedStyle(n).overflowX),
            })),
            animations: node.getAnimations({ subtree: true }).length,
          });
        }
        return rows;
      });
      await update(page, { clock: 0 });
      assert.equal(await page.locator("#tooltip-chord").evaluate((n) => n.getAnimations({ subtree: true }).length), 0);
      report.current = { mode, os, sampled, tooltipFrames };
      await page.screenshot({ path: path.join(output, "current.png"), fullPage: true });
      assert(
        tooltipFrames.every((f) =>
          f.keys.every((k, index) => !k.clipped && (!f.keys[index + 1] || k.ink.right <= f.keys[index + 1].ink.left)),
        ),
        "two growing tooltip labels remain readable",
      );
      await update(page, { clock: 4, label: "Ctrl", second: "Alt" });
      await page.waitForTimeout(50);
      const closing = await page.locator("#tooltip-chord").elementHandle();
      const closingCount = await closing.evaluate((node) => {
        window.kbdClosingHandles = node
          .getAnimations({ subtree: true })
          .filter((animation) => !("transitionProperty" in animation));
        return window.kbdClosingHandles.length;
      });
      await update(page, { open: false });
      const closingStates = await page.evaluate(() => window.kbdClosingHandles.map((animation) => animation.playState));
      assert(
        closingStates.every((state) => state === "idle"),
        "popup close cancels the actual captured native child handles, including after unmount",
      );
      assert.equal(await closing.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
      await update(page, { open: true, clock: 0 });
      await page.keyboard.press("Escape");
      await page.locator("[role=tooltip]").waitFor({ state: "detached" });
      await update(page, { open: true });
      await page.locator("[role=tooltip]").waitFor();
      await update(page, { open: false });
      await update(page, { clock: 4, label: "Ctrl", second: "Alt", reverse: false });
      await update(page, { mode: "none" });
      assert.equal(await page.locator("#chord").evaluate((n) => n.getAnimations({ subtree: true }).length), 0);
      await update(page, { mode, clock: 0, narrow: true });
      await update(page, { label: "⌘", second: "⇧" });
      assert.equal(await page.locator("#key-a").textContent(), "⌘");
      await update(page, { label: "Control", second: "Shift" });
      await update(page, { clock: 4, later: true });
      const entrance = await page.locator("#later").evaluate((node) => ({
        root: node.getAnimations().map((a) => a.effect.getKeyframes()),
        child: node
          .querySelector("kbd")
          .getAnimations()
          .map((a) => a.effect.getKeyframes()),
      }));
      if (effective !== "none") assert(entrance.root.some((frames) => frames.some((frame) => "opacity" in frame)));
      assert(
        !entrance.child.some((frames) => frames.some((frame) => "opacity" in frame)),
        "parent consumes the initial child entrance",
      );
      if (effective !== "none")
        assert(
          await page
            .locator("#later-alone")
            .evaluate((node) =>
              node.getAnimations().some((a) => a.effect.getKeyframes().some((frame) => "opacity" in frame)),
            ),
        );
      await update(page, { clock: 0, later: false });
      await update(page, { label: "Ctrl", second: "Alt" });
      await update(page, { clock: 4, label: "Control", second: "Shift" });
      await page.waitForTimeout(75);
      const beforeRetarget = await page.locator("#key-a").evaluate((node) => node.getBoundingClientRect().width);
      await update(page, { label: "Command" });
      const afterRetarget = await page.locator("#key-a").evaluate((node) => node.getBoundingClientRect().width);
      if (effective === "full")
        assert(Math.abs(afterRetarget - beforeRetarget) < 4, "retarget starts at the visible width");
      await update(page, { mode: "reduced" });
      assert(
        await page
          .locator("#chord")
          .evaluate((node) =>
            node
              .getAnimations({ subtree: true })
              .every((a) => a.effect.getKeyframes().every((frame) => !frame.width && !frame.transform)),
          ),
      );
      await update(page, { mode: "none" });
      assert.equal(await page.locator("#chord").evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
      await update(page, { mode, clock: 0, rich: true });
      assert.equal(await page.locator("#key-a strong").textContent(), "Command");
      await update(page, { rich: false });
      await update(page, { clock: 4, label: "Ctrl", second: "Alt", vertical: true });
      const vertical = await page.locator("#chord").evaluate((node) => ({
        positions: [...node.querySelectorAll("[data-slot=kbd]")].map((n) => n.getBoundingClientRect().toJSON()),
        effects: node.getAnimations({ subtree: true }).flatMap((a) => a.effect.getKeyframes()),
      }));
      assert(vertical.positions[1].top > vertical.positions[0].bottom, "caller vertical layout remains native");
      assert(vertical.effects.every((frame) => !frame.width && !frame.transform));
      await update(page, { vertical: false, custom: true, label: "Control" });
      assert.notEqual(await page.locator("#key-a").evaluate((node) => getComputedStyle(node).transform), "none");
      assert(
        await page
          .locator("#key-a")
          .evaluate((node) =>
            node
              .getAnimations()
              .every((a) => a.effect.getKeyframes().every((frame) => !frame.width && !frame.transform)),
          ),
        "caller transform has no second writer",
      );
      await update(page, { custom: false, clock: 0, label: "Control" });
      await update(page, { clock: 4, label: "Ctrl" });
      await page.waitForTimeout(40);
      await update(page, { fontSize: 18 });
      await page.waitForTimeout(80);
      assert.equal(
        await page
          .locator("#key-a")
          .evaluate(
            (node) =>
              node
                .getAnimations()
                .filter((a) => a.effect.getKeyframes().some((frame) => frame.width || frame.transform)).length,
          ),
        0,
        "passive font sizing cancels key projection",
      );
      await update(page, { clock: 0, fontSize: 12, features: true, label: "Ctrl" });
      await update(page, { clock: 4, label: "Control" });
      assert(
        await page
          .locator("#key-a")
          .evaluate(
            (node) =>
              node.textContent === "Control" && node.querySelector("[data-slot=kbd-text]").childNodes.length === 1,
          ),
        "unverified font features retain exact native text",
      );
      await update(page, { clock: 0, features: false, hidden: true });
      await update(page, { hidden: false });
      await page.waitForTimeout(50);
      assert(await page.locator("#key-a").isVisible());
      await update(page, { palette: true });
      const colourClock = await page.locator("#key-a").evaluate((node) => getComputedStyle(node).transitionDuration);
      assert(
        colourClock.split(",").every((value) => Number.parseFloat(value) === 0),
        "zero clock includes every scoped colour property",
      );
      await page.setViewportSize({ width: 390, height: 850 });
      assert(await page.locator("#wrapping").evaluate((n) => n.getBoundingClientRect().width <= 220));
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      assert.deepEqual(axe.violations, []);
      await update(page, { show: false });
      assert.equal(await page.locator("#chord").count(), 0);
      report.cases.push({
        mode,
        os,
        effective,
        sampled,
        inserted,
        tooltipFrames,
        exitMid: effective === "none" ? null : report.exitMid,
        closing: { count: closingCount, states: closingStates },
      });
      await page.close();
    }
  const capPage = await browser.newPage();
  await capPage.goto(base);
  await capPage.waitForFunction(() => window.kbdReady);
  await update(capPage, { clock: 0, count: 46 });
  assert.equal(await capPage.locator("#chord [data-slot=kbd]").count(), 48);
  await update(capPage, { clock: 4, label: "Ctrl", second: "Alt" });
  const boundFrames = await frames(capPage);
  assert(
    boundFrames.some((frame) => frame.effects.some((frames) => frames.some((f) => f.width))),
    "the exact 50-visual set remains eligible",
  );
  await capPage.evaluate(() => {
    window.memberReads = 0;
    for (const name of ["getBoundingClientRect", "getClientRects"]) {
      const original = HTMLElement.prototype[name];
      HTMLElement.prototype[name] = function (...args) {
        if (this.getAttribute("data-slot") === "kbd" && this.closest("#chord")) window.memberReads++;
        return original.apply(this, args);
      };
    }
  });
  await update(capPage, { count: 47 });
  const overflow = await capPage.locator("#chord").evaluate((node) => ({
    reads: window.memberReads,
    animations: node.getAnimations({ subtree: true }).length,
    keys: node.querySelectorAll("[data-slot=kbd]").length,
  }));
  assert.equal(overflow.keys, 49);
  assert.equal(overflow.reads, 0, "overflow is rejected before member boxes are read");
  assert.equal(overflow.animations, 0, "overflow converges without an entrance backlog");
  report.bound = { boundFrames, overflow };
  await capPage.close();
  for (const theme of ["light", "dark"])
    for (const width of [390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 850 }, colorScheme: theme });
      await page.goto(base);
      await page.waitForFunction(() => window.kbdReady);
      await page.evaluate((theme) => document.documentElement.classList.toggle("dark", theme === "dark"), theme);
      await update(page, { label: "Ctrl", second: "Alt", extra: true });
      await page.waitForTimeout(100);
      await page.screenshot({ path: path.join(output, `${theme}-${width}-middle.png`), fullPage: true });
      await update(page, { clock: 0, open: true });
      await page.screenshot({ path: path.join(output, `${theme}-${width}-tooltip.png`), fullPage: true });
      await page.close();
    }
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(base);
  assert.equal(await noJS.locator("#key-a").textContent(), "Control");
  assert(await noJS.locator("#key-a").isVisible());
  await noJS.close();
  report.noJS = true;
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
