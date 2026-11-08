import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

const output = path.resolve(
  process.env.SIDEBAR_OUTPUT ?? `.cache/motion-v2-execution/s08b-size-linked/browser-${Date.now()}`,
);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const runner = await readFile(new URL(import.meta.url));
await writeFile(path.join(output, "runner.mjs"), runner);
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const plugins = [];
if (process.env.SIDEBAR_COPY)
  plugins.push({
    name: "installed",
    setup(builder) {
      builder.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
        const target = path.resolve(
          process.env.SIDEBAR_COPY,
          args.path.replaceAll("\\", "/").split("registry/cadence/")[1],
        );
        const file = [`${target}.tsx`, `${target}.ts`, path.join(target, "index.tsx")].find(existsSync);
        assert(file, "Installed source without workspace fallback");
        return { path: file };
      });
    },
  });
if (process.env.SIDEBAR_REACT_ROOT)
  plugins.push({
    name: "react19",
    setup(builder) {
      builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
        path: require.resolve(args.path, { paths: [process.env.SIDEBAR_REACT_ROOT] }),
      }));
    },
  });
let fault;
if (process.env.SIDEBAR_FAULT)
  plugins.push({
    name: "projection-negative",
    setup(builder) {
      builder.onLoad({ filter: /size-linked-geometry\.ts$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");
        const anchor = "-baseline.sign * (visible - baseline.gap)";
        assert.equal(source.split(anchor).length, 2);
        const changed = source.replace(anchor, "0");
        fault = { original: hash(source), executed: hash(changed) };
        await writeFile(path.join(output, "fault.ts"), changed);
        return { contents: changed, loader: "ts" };
      });
    },
  });
const bundle = await build({
  entryPoints: ["tests/runtime/size-linked-sidebar.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.SIDEBAR_STRICT ? "development" : "production") },
});
const client = bundle.outputFiles[0].text;
const css = (
  await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
    from: path.resolve("app/globals.css"),
  })
).css;
await writeFile(path.join(output, "executed.js"), client);
await writeFile(path.join(output, "compiled.css"), css);
const ssr = await build({
  entryPoints: ["tests/runtime/size-linked-sidebar-ssr.jsx"],
  plugins,
  write: false,
  bundle: true,
  metafile: true,
  platform: "node",
  packages: process.env.SIDEBAR_REACT_ROOT ? undefined : "external",
  jsx: "automatic",
  format: "cjs",
});
await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
const markup = require(path.join(output, "ssr.cjs")).html;
const inputs = async (meta) =>
  Object.fromEntries(
    await Promise.all(Object.keys(meta.inputs).map(async (file) => [file, hash(await readFile(file))])),
  );
const report = {
  runnerSHA: hash(runner),
  inputs: await inputs(bundle.metafile),
  ssrInputs: await inputs(ssr.metafile),
  clientSHA: hash(client),
  cssSHA: hash(css),
  fault,
  cases: [],
  failures: [],
  errors: [],
  consoleErrors: [],
  pid: process.pid,
};
const server = http.createServer((req, res) => {
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? client
      : `<!doctype html><html class="${process.env.SIDEBAR_DARK ? "dark" : ""}"><style>${css}body{margin:0}#editor{margin:20px;width:250px}main{min-width:0}</style><div id="root">${markup}</div><script>window.sidebarSSR=true;window.sidebarStrict=${Boolean(process.env.SIDEBAR_STRICT)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => report.errors.push(e.stack));
page.on("console", (message) => {
  if (message.type() === "error") report.consoleErrors.push(message.text());
});
const update = (patch) => page.evaluate((value) => window.sidebarUpdate(value), patch);
const sample = () =>
  page.evaluate(() => {
    const gap = document.querySelector('[data-slot="sidebar-gap"]'),
      panel = document.querySelector('[data-slot="sidebar-container"]');
    if (!gap || !panel) return { missing: true };
    const box = panel.getBoundingClientRect(),
      size = gap.getBoundingClientRect().width;
    const visible = panel.dataset.side === "left" ? box.right : window.innerWidth - box.left;
    return {
      gap: size,
      visible,
      width: box.width,
      effects: gap.getAnimations().length + panel.getAnimations().length,
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
      input: document.querySelector("#editor")?.value,
    };
  });
const coherent = (value) => {
  assert(Math.abs(value.gap - value.visible) < 0.05, JSON.stringify(value));
  assert(value.scroll <= value.viewport, "No root horizontal overflow");
};
const reset = async () => {
  await page.evaluate(() => window.sidebarReset());
  await page.waitForTimeout(80);
};
const check = async (name, run) => {
  try {
    const evidence = await run();
    report.cases.push({ name, passed: true, evidence });
  } catch (error) {
    report.cases.push({ name, passed: false });
    report.failures.push({ name, message: error.stack });
  }
};
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => Boolean(window.sidebarUpdate));
  report.react = await page.evaluate(() => window.sidebarReact);
  await check("SSR/hydration establishes immediate native geometry", async () => {
    const s = await sample();
    coherent(s);
    assert.equal(s.effects, 0);
    return s;
  });
  for (const side of ["left", "right"])
    for (const variant of ["sidebar", "floating", "inset"]) {
      await check(`${side}/${variant}: shared intermediate size, reversal, same-target identity`, async () => {
        await reset();
        await update({ side, variant });
        await page.waitForTimeout(40);
        await update({ open: false });
        await page.waitForTimeout(100);
        const first = await sample();
        coherent(first);
        assert.equal(first.effects, 2);
        assert(first.gap > 0 && first.gap < first.width);
        await page.evaluate(() => {
          window.sidebarHandles = document.querySelector('[data-slot="sidebar-container"]').getAnimations();
          window.sidebarUpdate({ unrelated: 1 });
        });
        assert(
          await page.evaluate(
            () =>
              document.querySelector('[data-slot="sidebar-container"]').getAnimations()[0] === window.sidebarHandles[0],
          ),
        );
        await update({ open: true });
        await page.waitForTimeout(80);
        const reverse = await sample();
        coherent(reverse);
        assert.equal(reverse.effects, 2);
        await update({ clock: 2 });
        await page.waitForTimeout(50);
        const retimed = await sample();
        coherent(retimed);
        await update({ mode: "none" });
        const end = await sample();
        coherent(end);
        assert.equal(end.gap, end.width);
        assert.equal(end.effects, 0);
        await update({ mode: "full" });
        assert.equal((await sample()).effects, 0);
        return { first, reverse, retimed, end };
      });
    }
  for (const mode of ["full", "reduced", "none"])
    await check(`${mode}: effective mode, zero clock and no replay`, async () => {
      await reset();
      await update({ mode, clock: mode === "full" ? 0 : 4 });
      await update({ open: false });
      const s = await sample();
      coherent(s);
      assert.equal(s.gap, 0);
      assert.equal(s.effects, 0);
      await update({ mode: "full", clock: 4 });
      assert.equal((await sample()).effects, 0);
      return s;
    });
  await check("spring overrides clamp every rendered gap/projection frame", async () => {
    await reset();
    await update({ clock: 1 });
    await page
      .locator('[data-slot="sidebar-container"]')
      .evaluate((node) => node.style.setProperty("--motion-spring-size-compact-bounce", "0.3"));
    await page.waitForTimeout(40);
    await update({ open: false });
    const frames = await page.evaluate(async () => {
      const gap = document.querySelector('[data-slot="sidebar-gap"]'),
        panel = document.querySelector('[data-slot="sidebar-container"]');
      const frames = [];
      for (let index = 0; index < 40; index++) {
        await new Promise(requestAnimationFrame);
        if (index === 5) window.sidebarUpdate({ open: true });
        const box = panel.getBoundingClientRect();
        frames.push({
          gap: gap.getBoundingClientRect().width,
          visible: box.right,
          width: box.width,
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
        });
      }
      return frames;
    });
    for (const frame of frames) {
      coherent(frame);
      assert(frame.gap >= 0 && frame.gap <= frame.width);
    }
    return frames;
  });
  await check("live reduced cancels both native effects before paint", async () => {
    await reset();
    await update({ open: false });
    await page.waitForTimeout(80);
    assert.equal((await sample()).effects, 2);
    await update({ mode: "reduced" });
    const s = await sample();
    coherent(s);
    assert.equal(s.effects, 0);
    assert.equal(s.gap, 0);
    return s;
  });
  await check("aggregate50 includes actual gap/panel and still-active outgoing visuals before reads", async () => {
    await reset();
    await page.evaluate(() => {
      window.sidebarReserve(49);
      window.sidebarReads = 0;
      for (const slot of ["sidebar-gap", "sidebar-container"]) {
        const host = document.querySelector(`[data-slot="${slot}"]`);
        const read = host.getClientRects.bind(host);
        host.getClientRects = () => {
          window.sidebarReads++;
          return read();
        };
      }
      window.sidebarUpdate({ open: false });
    });
    const overflow = await sample();
    coherent(overflow);
    assert.equal(overflow.effects, 0);
    assert.equal(await page.evaluate(() => window.sidebarReads), 0, "Overflow rejects before geometry reads");
    await page.evaluate(() => window.sidebarRelease());
    await reset();
    await page.evaluate(() => window.sidebarReserve(48));
    await update({ open: false });
    await page.waitForTimeout(60);
    const bound = await sample();
    coherent(bound);
    assert.equal(bound.effects, 2);
    await page.evaluate(() => window.sidebarRelease());
    return { overflow, bound };
  });
  await check("native pointer capture settles the dependent transaction", async () => {
    await reset();
    await page
      .locator("#editor")
      .evaluate((node) =>
        node.addEventListener("pointerdown", (event) => node.setPointerCapture(event.pointerId), { once: true }),
      );
    const editor = await page.locator("#editor").boundingBox();
    await page.mouse.move(editor.x + 20, editor.y + 10);
    await page.mouse.down();
    await page.mouse.move(editor.x + 22, editor.y + 10);
    assert(await page.locator("#editor").evaluate((node) => node.hasPointerCapture(1)));
    await update({ open: false });
    const s = await sample();
    coherent(s);
    assert.equal(s.effects, 0);
    await page.mouse.up();
    return s;
  });
  await check("focused editor, focus acquired mid-flight, and stationary trigger", async () => {
    await reset();
    await page.locator("#editor").focus();
    await update({ open: false });
    const focused = await sample();
    coherent(focused);
    assert.equal(focused.effects, 0);
    assert.equal(focused.input, "persistent draft");
    await update({ open: true });
    await page.locator('[data-slot="sidebar-trigger"]').focus();
    await update({ open: false });
    await page.waitForTimeout(60);
    const eligible = await sample();
    coherent(eligible);
    assert.equal(eligible.effects, 2);
    await page.locator("#editor").focus();
    const acquired = await sample();
    coherent(acquired);
    assert.equal(acquired.effects, 0);
    await page.locator("#editor").blur();
    await update({ unrelated: 2 });
    assert.equal((await sample()).effects, 0);
    return { focused, eligible, acquired };
  });
  await check("width token, side, viewport changes cancel obsolete endpoints", async () => {
    await reset();
    await update({ open: false });
    await page.waitForTimeout(60);
    await update({ width: "224px" });
    await page.waitForTimeout(30);
    const width = await sample();
    coherent(width);
    assert.equal(width.effects, 0);
    await update({ open: true });
    await page.waitForTimeout(60);
    assert.equal((await sample()).effects, 2);
    await update({ side: "right" });
    const side = await sample();
    coherent(side);
    assert.equal(side.effects, 0);
    await update({ open: false });
    await page.waitForTimeout(60);
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.waitForTimeout(30);
    const viewport = await sample();
    coherent(viewport);
    assert.equal(viewport.effects, 0);
    await page.setViewportSize({ width: 1280, height: 800 });
    return { width, side, viewport };
  });
  await check("caller transform, icon and static paths preserve native ownership", async () => {
    await reset();
    await update({ caller: true, open: false });
    const caller = await sample();
    assert.equal(caller.effects, 0);
    assert.equal(
      await page.locator('[data-slot="sidebar-container"]').evaluate((node) => node.style.transform),
      "none",
    );
    await update({ caller: false, kind: "icon" });
    const icon = await sample();
    assert.equal(icon.effects, 0);
    await update({ kind: "none" });
    assert.equal(await page.locator('[data-slot="sidebar-container"]').count(), 0);
    return { caller, icon };
  });
  await check("hidden/restored and unsafe ancestor mapping establish native baselines", async () => {
    await reset();
    await update({ open: false });
    await page.waitForTimeout(50);
    await page.locator('[data-slot="sidebar-wrapper"]').evaluate((node) => {
      node.style.display = "none";
    });
    await page.waitForTimeout(30);
    assert.equal((await sample()).effects, 0);
    await page.locator('[data-slot="sidebar-wrapper"]').evaluate((node) => {
      node.style.display = "";
    });
    await page.waitForTimeout(30);
    const restored = await sample();
    coherent(restored);
    assert.equal(restored.effects, 0);
    await update({ open: true });
    await page.waitForTimeout(50);
    assert.equal((await sample()).effects, 2);
    await page.locator('[data-slot="sidebar-wrapper"]').evaluate((node) => {
      node.style.transform = "rotate(2deg)";
    });
    await page.waitForTimeout(30);
    assert.equal((await sample()).effects, 0);
    await update({ open: false });
    assert.equal((await sample()).effects, 0);
    await page.locator('[data-slot="sidebar-wrapper"]').evaluate((node) => {
      node.style.transform = "";
    });
    await page.waitForTimeout(30);
    await update({ open: true });
    await page.waitForTimeout(50);
    const recovered = await sample();
    coherent(recovered);
    assert.equal(recovered.effects, 2);
    return { restored, recovered };
  });
  await check("identity3d containing block preserves the real preview projection", async () => {
    await reset();
    await page.locator('[data-slot="sidebar-wrapper"]').evaluate((node) => {
      node.style.transform = "translateZ(0)";
    });
    await page.waitForTimeout(30);
    await update({ open: false });
    await page.waitForTimeout(70);
    const s = await sample();
    coherent(s);
    assert.equal(s.effects, 2);
    await page.locator('[data-slot="sidebar-wrapper"]').evaluate((node) => {
      node.style.transform = "";
    });
    return s;
  });
  await check("breakpoint and unmount retire all old effect handles", async () => {
    await reset();
    await update({ open: false });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
      window.retiredSidebar = [
        document.querySelector('[data-slot="sidebar-gap"]'),
        document.querySelector('[data-slot="sidebar-container"]'),
      ];
    });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.waitForTimeout(100);
    assert(
      await page.evaluate(() =>
        window.retiredSidebar.every((node) => !node.isConnected && node.getAnimations().length === 0),
      ),
    );
    await page.locator('[data-slot="sidebar-trigger"]').click();
    await page.getByRole("dialog", { name: "Sidebar", exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog", { name: "Sidebar", exact: true }).waitFor({ state: "hidden" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(80);
    assert.equal((await sample()).effects, 0);
    await update({ open: true });
    await page.waitForTimeout(50);
    await update({ mounted: false });
    assert.equal(await page.locator('[data-slot="sidebar-container"]').count(), 0);
    return { retired: true };
  });
  await check("RTL physical side and input identity survive toggles", async () => {
    await reset();
    await update({ rtl: true });
    await page.evaluate(() => {
      window.savedEditor = document.querySelector("#editor");
    });
    await update({ open: false });
    await page.waitForTimeout(70);
    const s = await sample();
    coherent(s);
    assert(await page.evaluate(() => window.savedEditor === document.querySelector("#editor")));
    return s;
  });
  await reset();
  await page.screenshot({ path: path.join(output, "sidebar.png"), fullPage: true });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.verdict = report.failures.length || report.errors.length || report.consoleErrors.length ? "failed" : "passed";
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    output,
    verdict: report.verdict,
    cases: report.cases.length,
    failures: report.failures,
    errors: report.errors,
    consoleErrors: report.consoleErrors,
  }),
);
if (report.verdict !== "passed") process.exitCode = 1;
