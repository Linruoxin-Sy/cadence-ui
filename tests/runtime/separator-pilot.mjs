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

assert(process.env.SEPARATOR_OUTPUT);
const output = path.resolve(process.env.SEPARATOR_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.SEPARATOR_COPY;
let installation;
if (process.env.SEPARATOR_INSTALL) {
  const payloads = new Map();
  const queue = ["separator"];
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
    "separator",
  );
  const plan = groupPlan;
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
  entryPoints: ["tests/runtime/separator-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/separator-pilot-ssr.jsx"],
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
if (installation) {
  const consumer = path.join(output, "consumer.tsx");
  await writeFile(
    consumer,
    `import { Separator, type SeparatorProps } from "./installed/components/cadence/separator";
const props: SeparatorProps = { orientation: "vertical", decorative: true, style: state => ({ height: state.orientation === "vertical" ? 80 : 1 }) };
export const consumer = <Separator {...props} render={<hr />} ref={node => { if (!node) return; return () => {}; }} />;`,
  );
  execFileSync(
    process.execPath,
    [
      require.resolve("typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--esModuleInterop",
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
  installation.typecheck = true;
}
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
        "public/r/separator.json",
        "content/components/separator.mdx",
        "docs/motion/components/separator.md",
        "app/globals.css",
        "tests/runtime/separator-pilot.jsx",
        "tests/runtime/separator-pilot-ssr.jsx",
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
      : `<!doctype html><html lang="en"><title>Separator runtime</title><style>${css}</style><div id="root">${render(mode)}</div><div id="portal-root"></div><script>window.separatorSSRHost=document.querySelector("#rule");window.separatorInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const update = (page, patch) => page.evaluate((patch) => window.separatorUpdate(patch), patch);
const snapshot = (page, selector = "#rule") =>
  page.locator(selector).evaluate((node) => {
    const css = getComputedStyle(node),
      box = node.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      opacity: Number(css.opacity),
      colour: css.backgroundColor,
      mode: node.dataset.motion,
      orientation: node.getAttribute("aria-orientation"),
      effects: node.getAnimations().map((a) => ({
        state: a.playState,
        property: a.transitionProperty,
        timing: a.effect.getTiming(),
        frames: a.effect.getKeyframes(),
      })),
    };
  });
const frames = async (page, selector = "#rule", count = 12) => {
  const rows = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    rows.push(await snapshot(page, selector));
  }
  return rows;
};
const has = (row, property) => row.effects.some((a) => a.frames.some((f) => property in f));
try {
  for (const mode of ["full", "reduced", "none"])
    for (const os of [false, true]) {
      const context = await browser.newContext({ reducedMotion: os ? "reduce" : "no-preference" });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      await page.goto(`${base}/?mode=${mode}`);
      await page.waitForFunction(() => window.separatorReady && document.querySelector("#portal"));
      const effective = mode === "none" ? "none" : os ? "reduced" : mode;
      const row = { mode, os, effective };
      assert(await page.locator("#rule").evaluate((n) => n === window.separatorSSRHost), "SSR host retained");
      assert.equal((await snapshot(page)).opacity, 1);
      assert.equal((await snapshot(page)).mode, effective);
      assert.equal((await snapshot(page)).effects.length, 0, "no hydration entry");
      await page.locator("#before").focus();
      await page.keyboard.press("Tab");
      assert(
        await page.locator("#after").evaluate((n) => n === document.activeElement),
        "rule stays outside tab order",
      );
      await update(page, { length: 160 });
      row.grow = await frames(page);
      row.coordinated = await frames(page, "#coordinated-rule", 3);
      assert(
        row.coordinated.every((f) => f.width === 160 && !has(f, "width")),
        "parent geometry consumes descendant axis without second writer",
      );
      if (effective === "full")
        assert(
          row.grow.some((f) => f.width > 80 && f.width < 160 && has(f, "width")),
          "real owned-length middle frames",
        );
      else
        assert(
          row.grow.every((f) => f.width === 160 && !has(f, "width")),
          "restricted geometry is native",
        );
      await update(page, { length: 80 });
      row.shrink = await frames(page);
      if (effective === "full")
        assert(
          row.shrink.some((f) => f.width > 80 && f.width < 160),
          "reverse from current size",
        );
      await update(page, { clock: 0 });
      assert.equal((await snapshot(page)).width, 80);
      assert.equal((await snapshot(page)).effects.length, 0, "same-target zero clock cancels size");
      await update(page, { clock: 4, colour: true });
      row.colour = await frames(page);
      if (effective !== "none")
        assert(
          row.colour.some((f) => f.effects.some((a) => a.property === "background-color")),
          "actual scoped colour clock",
        );
      else assert(row.colour.every((f) => f.colour === "rgb(120, 120, 120)" && !f.effects.length));
      await update(page, { mode: "none" });
      assert.equal((await snapshot(page)).effects.length, 0, "live none cancels colour");
      await update(page, { mode, colour: false, clock: 4, later: true });
      row.enter = await frames(page, "#later", 5);
      if (effective !== "none")
        assert(
          row.enter.some((f) => f.opacity > 0 && f.opacity < 1),
          "independent entry",
        );
      await update(page, { vertical: true });
      row.replace = await frames(page, "#rule", 5);
      assert(row.replace.every((f) => f.orientation === "vertical" && f.width === 1 && f.height === 80));
      if (effective !== "none")
        assert(
          row.replace.some((f) => f.opacity > 0 && f.opacity < 1),
          "replacement opacity",
        );
      await update(page, { shown: false });
      if (effective !== "none") {
        assert.equal(
          await page.locator('#rule[aria-hidden="true"][inert]').count(),
          1,
          "retained exit loses semantics immediately",
        );
        row.exit = await frames(page, "#rule", 3);
        assert(row.exit.some((f) => f.opacity < 1));
        await update(page, { shown: true, vertical: false });
        row.reopen = await frames(page, "#rule", 5);
        assert(row.reopen.every((f) => f.orientation === "horizontal" && f.height === 1));
      } else await update(page, { shown: true, vertical: false });
      await update(page, { clock: 0, decorative: true });
      assert.equal(await page.locator('#rule[role="none"][aria-hidden="true"]').count(), 1);
      await update(page, { decorative: false, passive: 180 });
      assert.equal((await snapshot(page, "#passive")).width, 180);
      assert.equal((await snapshot(page, "#passive")).effects.length, 0);
      await update(page, { passive: 300, clock: 4, length: 160 });
      await page.locator("#stage").evaluate((n) => (n.style.width = "200px"));
      row.passive = await frames(page, "#rule", 4);
      assert(
        row.passive.every((f) => f.width === 160 && !has(f, "width")),
        "passive constraints revoke size",
      );
      await update(page, { hidden: true, length: 80 });
      await update(page, { hidden: false });
      row.recovery = await frames(page, "#rule", 4);
      assert(
        row.recovery.every((f) => f.width === 80 && !has(f, "width")),
        "hidden recovery baseline",
      );
      await update(page, { child: true });
      row.child = await frames(page, "#child", 3);
      if (effective !== "none") assert(row.child.some((f) => f.opacity < 1));
      await update(page, { closed: true });
      await update(page, { closed: false });
      row.parent = await frames(page, "#child", 3);
      assert(
        row.parent.every((f) => f.opacity === 1 && !has(f, "opacity")),
        "parent reopen never replays child insertion",
      );
      assert.equal((await snapshot(page, "#nested-none")).mode, "none");
      assert.equal((await snapshot(page, "#nested-full")).mode, os ? "reduced" : "full");
      assert.equal((await snapshot(page, "#portal")).mode, effective);
      await update(page, { clock: 0, shown: false });
      await page.waitForFunction(() => !document.querySelector("#rule"));
      row.refs = await page.evaluate(() => window.separatorRefs());
      assert(row.refs.cleanups >= 1, "real unmount ref cleanup");
      report.cases.push(row);
      await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
      await context.close();
    }
  const extraContext = await browser.newContext();
  const page = await extraContext.newPage();
  page.on("pageerror", (error) => report.errors.push(String(error)));
  await page.goto(base);
  await page.waitForFunction(() => window.separatorReady);
  await update(page, { vertical: true });
  await update(page, { length: 160 });
  const vertical = await frames(page);
  assert(
    vertical.some((f) => f.height > 80 && f.height < 160 && f.width === 1),
    "vertical definite length interpolates",
  );
  await update(page, { clock: 0, vertical: false, length: 80, classLength: true });
  await update(page, { clock: 4, length: 160 });
  const utility = await frames(page);
  assert(
    utility.some((f) => f.width > 80 && f.width < 160),
    "definite utility lengths interpolate",
  );
  await update(page, { length: 80 });
  await page.locator("#rule").evaluate((node) => {
    window.nativeSize = node.animate([{ width: "110px" }, { width: "130px" }], { duration: 1000, fill: "both" });
  });
  const native = await frames(page);
  assert(
    native.every((f) => f.width >= 110 && f.width <= 130),
    "later caller size engine has sole authority",
  );
  await page.evaluate(() => window.nativeSize.cancel());
  await update(page, { clock: 0, classLength: false, length: 80, vertical: false });
  await page.locator("#stage").evaluate((node) => {
    node.style.width = "max-content";
    node.style.display = "inline-block";
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  await update(page, { clock: 4, length: 160 });
  const intrinsic = await frames(page);
  assert(
    intrinsic.some((f) => f.width > 80 && f.width < 160 && has(f, "width")),
    "native intrinsic parent follows child frames without revoking the length owner",
  );
  const autoParents = [];
  for (const display of ["inline-block", "flex", "grid"]) {
    await update(page, { clock: 0, length: 80 });
    await page.locator("#stage").evaluate((node, display) => {
      node.style.width = "auto";
      node.style.display = display;
    }, display);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await update(page, { clock: 4, length: 160 });
    const samples = await frames(page, "#rule", 6);
    assert(
      samples.some((f) => f.width > 80 && f.width < 160 && has(f, "width")),
      `native auto ${display} keeps its child length owner`,
    );
    autoParents.push({ display, samples });
  }
  await update(page, { length: 80 });
  await page.locator("#stage").evaluate((node) => {
    window.parentSize = node.animate([{ width: "200px" }, { width: "220px" }], { duration: 1000, fill: "both" });
  });
  const parentEngine = await frames(page, "#rule", 4);
  assert(
    parentEngine.every((f) => f.width === 80 && !has(f, "width")),
    "later native ancestor engine revokes child geometry",
  );
  await page.evaluate(() => window.parentSize.cancel());
  await update(page, { clock: 0, length: 80 });
  await page.locator("#rule").evaluate((node) => {
    node.style.maxWidth = "50%";
  });
  await update(page, { clock: 4, length: 160 });
  const dependent = await frames(page, "#rule", 4);
  assert(
    dependent.every((f) => !has(f, "width")),
    "dependent min/max constraints retain native layout",
  );
  await page.locator("#rule").evaluate((node) => node.style.removeProperty("max-width"));
  await page.locator("#stage").evaluate((node) => {
    node.style.width = "240px";
    node.style.display = "block";
  });
  await update(page, { clock: 0, length: 3000 });
  await update(page, { clock: 4, length: 80 });
  const large = await frames(page, "#rule", 5);
  assert(
    large.some((f) => f.width > 1280 && f.width < 3000 && has(f, "width")),
    "finite over-viewport length shrinks continuously without a viewport cap",
  );
  await update(page, { clock: 0, classLength: false, shown: false });
  await page.waitForFunction(() => !document.querySelector("#rule"));
  await update(page, { clock: 4, shown: true, length: 80 });
  await page.evaluate(() => {
    window.insertedRule = document.querySelector("#rule");
  });
  await update(page, { vertical: true });
  await update(page, { shown: false });
  await update(page, { shown: true, vertical: false });
  const interleave = await frames(page, "#rule", 4);
  assert(await page.locator("#rule").evaluate((n) => n === window.insertedRule));
  assert(
    interleave.every(
      (f) =>
        f.orientation === "horizontal" && f.effects.filter((a) => a.frames.some((k) => "opacity" in k)).length <= 1,
    ),
    "replacement/exit/re-entry share one opacity owner",
  );
  await update(page, { length: 160 });
  await update(page, { mode: "reduced" });
  const reduced = await frames(page, "#rule", 3);
  assert(
    reduced.every((f) => f.width === 160 && !has(f, "width")),
    "live reduced cancels same-target geometry",
  );
  await update(page, { mode: "full", vertical: true });
  await update(page, { clock: 0 });
  assert.equal((await snapshot(page)).effects.length, 0, "zero clock cancels replacement opacity");
  await update(page, { clock: 0, render: true });
  assert.equal(await page.locator("hr#rule").count(), 1);
  await update(page, { shown: false });
  await page.waitForFunction(() => !document.querySelector("#rule"));
  await update(page, { clock: 4, shown: true });
  await update(page, { opacity: 0.4 });
  const callerOpacity = await frames(page, "#rule", 3);
  assert(
    callerOpacity.every((f) => f.opacity === 0.4 && !has(f, "opacity")),
    "same React commit releases old opacity to caller paint",
  );
  await update(page, { opacity: 1, colour: true });
  await update(page, { clock: 0 });
  assert.equal((await snapshot(page)).effects.length, 0, "same-target zero clock cancels rule colour");
  await update(page, { clock: 4, length: 160, colour: false });
  await page.evaluate(() => {
    window.forcedReceipt = null;
    matchMedia("(forced-colors: active)").addEventListener(
      "change",
      (event) => {
        window.forcedReceipt = { matches: event.matches, trusted: event.isTrusted };
      },
      { once: true },
    );
  });
  await page.emulateMedia({ forcedColors: "active" });
  await page.waitForFunction(() => window.forcedReceipt?.matches);
  assert.equal(await page.evaluate(() => window.forcedReceipt.trusted), true);
  const forced = await frames(page, "#rule", 3);
  report.pending = {
    callerOpacity,
    forced,
    policy: await page.locator("#rule").evaluate((node) => ({
      forced: matchMedia("(forced-colors: active)").matches,
      style: node.getAttribute("style"),
      duration: getComputedStyle(node).transitionDuration,
    })),
  };
  assert(
    forced.every((f) => !f.effects.length),
    "forced colours use native paint/layout",
  );
  await page.evaluate(() => {
    window.printReceipt = null;
    matchMedia("print").addEventListener(
      "change",
      (event) => {
        window.printReceipt = { matches: event.matches, trusted: event.isTrusted };
      },
      { once: true },
    );
  });
  await page.emulateMedia({ forcedColors: "none", media: "print" });
  await page.waitForFunction(() => window.printReceipt?.matches);
  assert.equal(await page.evaluate(() => window.printReceipt.trusted), true);
  const print = await frames(page, "#rule", 3);
  assert(
    print.every((f) => !f.effects.length),
    "print has no decorative clock",
  );
  await page.emulateMedia({ media: "screen" });
  const axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    axe.violations.map((v) => v.id),
    [],
  );
  report.extra = {
    vertical,
    utility,
    native,
    intrinsic,
    autoParents,
    parentEngine,
    dependent,
    large,
    interleave,
    reduced,
    callerOpacity,
    forced,
    print,
    mediaReceipts: await page.evaluate(() => ({ forced: window.forcedReceipt, print: window.printReceipt })),
    axe: [],
  };
  delete report.pending;
  await extraContext.close();
  const noJS = await browser.newPage({ javaScriptEnabled: false });
  await noJS.goto(base);
  assert(await noJS.locator("#rule").isVisible());
  assert.equal(await noJS.locator('#rule[role="separator"][aria-orientation="horizontal"]').count(), 1);
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
    installed: report.installation?.files.length,
    noJS: report.noJS,
    errors: report.errors,
  }),
);
