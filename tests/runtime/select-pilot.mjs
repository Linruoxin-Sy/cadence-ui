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

assert(process.env.SELECT_OUTPUT);
const output = path.resolve(process.env.SELECT_OUTPUT);
await mkdir(output, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy = process.env.SELECT_COPY;
let installation;
if (process.env.SELECT_INSTALL) {
  const payloads = new Map();
  const queue = ["select", "animated-number"];
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
  const roots = ["select", "animated-number"];
  const plans = roots.map((id) =>
    installationPlan(
      [...payloads.values()].map(({ item }) => item),
      id,
    ),
  );
  const plan = {
    files: [...new Map(plans.flatMap((plan) => plan.files).map((file) => [file.target, file])).values()],
    dependencies: [...new Set(plans.flatMap((plan) => plan.dependencies))],
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
  entryPoints: ["tests/runtime/select-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/select-pilot-ssr.jsx"],
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
      : `<!doctype html><html><style>${css}</style><div id="root">${render(mode)}</div><div id="portal"></div><script>window.selectInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
const sample = () => {
  const trigger = document.getElementById("select"),
    value = trigger?.querySelector('[data-slot="select-value"]'),
    text = value?.querySelector("[data-select-value-text]"),
    popup = document.querySelector('[data-slot="select-content"]'),
    flight = document.querySelector("[data-cadence-handoff-paint]");
  const effects = (n) =>
    (n?.getAnimations() ?? []).map((a) => ({
      state: a.playState,
      frames: a.effect.getKeyframes(),
      duration: a.effect.getTiming().duration,
    }));
  return {
    text: text?.textContent,
    identity: text?.firstChild === window.nativeText,
    mode: trigger?.dataset.motion,
    focus: document.activeElement.id,
    popup: popup
      ? {
          opacity: getComputedStyle(popup).opacity,
          rect: popup.getBoundingClientRect().toJSON(),
          effects: effects(popup),
          open: popup.hasAttribute("data-open"),
        }
      : null,
    flight: flight
      ? {
          text: flight.dataset.cadenceFlightText,
          transform: getComputedStyle(flight).transform,
          rect: flight.getBoundingClientRect().toJSON(),
          effects: effects(flight),
        }
      : null,
    textLayers: document.querySelectorAll("[data-cadence-text-layer]").length,
    reels: document.querySelectorAll("[data-cadence-reel]").length,
    value: value
      ? { width: value.getBoundingClientRect().width, style: value.style.width, effects: effects(value) }
      : null,
    scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
  };
};
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const os of process.env.SELECT_ADVANCED_ONLY ? [] : ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 1000 } }),
        page = await context.newPage();
      page.on("pageerror", (e) => report.errors.push({ mode, os, error: e.stack }));
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode,
        row = { mode, os, effective, checks: [] };
      report.cases.push(row);
      const update = (patch) => page.evaluate((patch) => window.selectUpdate(patch), patch);
      const save = async () => page.evaluate(sample);
      await page.goto(`${url}/?mode=${mode}`);
      await page.waitForFunction(() => window.selectReady);
      await page.evaluate(() => {
        window.nativeText = document.querySelector("#select [data-select-value-text]").firstChild;
      });
      assert.equal((await save()).mode, effective);
      assert.equal((await save()).text, "Plan AAA");
      // Default native focus must be readable, without an entry envelope.
      await page.locator("#select").click();
      await page.waitForTimeout(60);
      const opening = await save();
      assert.equal(opening.popup.opacity, "1");
      assert.equal(opening.focus, "option-a");
      assert(!opening.popup.effects.some((a) => a.state === "running" && a.frames.some((f) => "transform" in f)));
      row.checks.push("native actual-focus entry gate and retained part identity");
      await page.locator("#option-b").click();
      const first = await save();
      assert.equal(first.text, "Plan BBB");
      assert(first.identity);
      if (effective === "full") {
        assert(first.flight, "real contiguous changed-run flight");
        assert.equal(first.flight.text, "BBB");
        assert.equal(first.textLayers, 0);
        await page.waitForTimeout(75);
        const mid = await save();
        assert(mid.flight);
        assert.notEqual(mid.flight.transform, first.flight.transform);
        row.flight = { first, mid };
        await page.screenshot({ path: path.join(output, `${mode}-${os}-flight.png`) });
      } else assert.equal(first.flight, null);
      await page.waitForFunction(() => !document.querySelector("[data-cadence-handoff-paint]"), null, {
        timeout: 10000,
      });
      assert.equal((await save()).flight, null);
      assert.equal((await save()).text, "Plan BBB");
      await page.waitForFunction(
        () => window.selectCompletions?.includes(false) && document.activeElement.id === "select",
        null,
        { timeout: 10000 },
      );
      report.lastNativeClose = await page.evaluate(() => ({
        focus: document.activeElement.id,
        completions: window.selectCompletions,
        popup: document.querySelector('[data-slot="select-content"]')?.outerHTML.slice(0, 800),
      }));
      assert.equal((await save()).focus, "select");
      assert.deepEqual(await page.evaluate(() => [...new FormData(document.getElementById("form"))]), [["plan", "b"]]);
      row.checks.push(
        "single-run source flight, actual intermediate paint, retained Text, native form and final focus",
      );
      // External multi-run and repeated-letter changes never borrow a pointer origin.
      await page.locator("#outside").focus();
      await update({ labelB: "Plum BOB" });
      await page.waitForTimeout(35);
      const diff = await save();
      assert.equal(diff.text, "Plum BOB");
      assert(diff.identity);
      assert.equal(diff.flight, null);
      if (effective !== "none") assert(diff.textLayers > 0, "real local changed-only opacity");
      else assert.equal(diff.textLayers, 0);
      await page.waitForTimeout(750);
      for (const label of ["Plan BBB", "Plan 👩‍💻 B", "é plan", "مرحبا", "Plan BBB"]) {
        await update({ labelB: label });
        assert.equal((await save()).text, label);
        assert((await save()).identity);
        await page.waitForTimeout(700);
      }
      row.checks.push(
        "multiple local runs, retained island/repeated letters, emoji/combining and connected-script fallbacks",
      );
      // Closed visible-value changes keep their independent text/width owners.
      await update({ labelB: "A much longer selected plan" });
      await page.waitForTimeout(30);
      const grown = await save();
      assert.equal(grown.text, "A much longer selected plan");
      assert(!grown.value.effects.some((a) => a.state === "running"), "clipped growth is immediate");
      await page.waitForTimeout(750);
      await update({ labelB: "Plan B" });
      await page.waitForTimeout(40);
      const shrunk = await save();
      if (effective === "full")
        assert(
          shrunk.value.effects.some((a) => a.frames.some((f) => "width" in f)),
          "one real width shrink owner",
        );
      else assert.equal(shrunk.value.effects.length, 0);
      await page.waitForTimeout(1800);
      assert.equal((await save()).value.style, "");
      row.checks.push("readable growth, measured shrink and native width release while popup is closed");
      // Controlled reject and uncorrelated delayed acceptance cannot reuse a capture.
      await update({ labelA: "Plan AAA", labelB: "Plan BBB", value: "a", reject: true });
      await page.locator("#select").click();
      await page.locator("#option-b").click();
      assert.equal((await save()).text, "Plan AAA");
      assert.equal((await save()).flight, null);
      await update({ open: false, reject: false, defer: true });
      await page.waitForTimeout(750);
      await page.locator("#select").click();
      await page.locator("#option-b").click();
      assert.equal((await save()).text, "Plan AAA");
      await page.waitForTimeout(60);
      await page.evaluate(() => window.selectAccept());
      assert.equal((await save()).text, "Plan BBB");
      assert.equal((await save()).flight, null);
      row.checks.push("rejected and delayed controlled request correspondence; no old origin reuse");
      await update({ open: false, defer: false, value: "a", labelA: "Plan AAA", labelB: "Plan BBB" });
      await page.waitForTimeout(900);
      if (effective === "full") {
        await page.locator("#select").click();
        await page.locator("#option-b").click();
        assert((await save()).flight);
        await update({ mode: "reduced" });
        const cancelled = await save();
        assert.equal(cancelled.flight, null);
        assert.equal(cancelled.textLayers, 0);
        await update({ mode: "full" });
        assert.equal((await save()).flight, null);
        await page.waitForTimeout(750);
        await update({ value: "a" });
        await page.waitForTimeout(750);
        await page.locator("#select").click();
        await page.locator("#option-b").click();
        assert((await save()).flight);
        await update({ clock: 0 });
        assert.equal((await save()).flight, null);
        assert.equal((await save()).textLayers, 0);
        await update({ clock: 4 });
        assert.equal((await save()).flight, null);
        row.checks.push("same-target live reduced and zero-clock flight cancellation with no fallback replay");
        await page.waitForTimeout(750);
        await update({ value: "a" });
        await page.waitForTimeout(750);
        await page.locator("#select").click();
        await page.locator("#option-b").click();
        assert((await save()).flight);
        await page.evaluate(() => (document.getElementById("anchor").style.marginLeft = "30px"));
        await page.waitForTimeout(45);
        assert.equal((await save()).flight, null);
        assert.equal((await save()).textLayers, 0);
        await page.evaluate(() => (document.getElementById("anchor").style.marginLeft = ""));
        row.checks.push("changed destination mapping cancels frozen flight without chasing or replay");
      }
      await update({ mode, clock: 4, value: "a", open: false, aligned: true, extra: 16 });
      await page.waitForTimeout(750);
      await page.locator("#select").click();
      await page.keyboard.press("End");
      await page.keyboard.press("Home");
      await page.keyboard.type("Plan B");
      await page.keyboard.press("Enter");
      assert.equal((await save()).flight, null);
      await page.waitForTimeout(750);
      row.checks.push("aligned native list/scroll, keyboard Home/End/typeahead/selection");
      await update({ open: false, nested: true });
      await page.waitForTimeout(50);
      assert.equal(await page.locator("#nested").getAttribute("data-motion"), os === "reduce" ? "reduced" : "full");
      assert.equal(await page.locator("#portaled").getAttribute("data-motion"), "reduced");
      await update({ open: true, aligned: false });
      await page.waitForTimeout(60);
      await update({ mode: "none" });
      await update({ open: false });
      await page.waitForTimeout(100);
      report.noneExit = await page.evaluate(() =>
        [...document.querySelectorAll('[data-slot="select-content"]')].map((n) => ({
          html: n.outerHTML,
          closed: n.hasAttribute("data-closed"),
          effects: n.getAnimations().map((a) => ({
            frames: a.effect.getKeyframes(),
            state: a.playState,
            duration: a.effect.getTiming().duration,
          })),
        })),
      );
      assert.equal(await page.locator('[data-slot="select-content"]').isVisible(), false);
      assert.equal(
        await page.evaluate(() => window.selectCompletions.at(-1)),
        false,
        "native completion, including force-mounted closed content",
      );
      await update({ show: false });
      await page.waitForTimeout(60);
      assert.equal(
        await page.locator("[data-cadence-handoff-layer],[data-cadence-text-layer],[data-cadence-reel]").count(),
        0,
      );
      row.checks.push("nested/portaled policy, native none exit completion and physical unmount cleanup");
      await context.close();
    }
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } }),
      page = await context.newPage();
    page.on("pageerror", (e) => report.errors.push({ advanced: e.stack }));
    await page.goto(url);
    await page.waitForFunction(() => window.selectReady);
    const update = (patch) => page.evaluate((p) => window.selectUpdate(p), patch),
      save = () => page.evaluate(sample),
      checks = [];
    // Native reversal and exit completion observe the actual retained popup.
    await update({ open: true });
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      window.savedPopup = document.querySelector('[data-slot="select-content"]');
      window.falseCompletions = (window.selectCompletions ?? []).filter((v) => !v).length;
    });
    await update({ open: false });
    await page.waitForTimeout(45);
    const closing = await save();
    assert(Number(closing.popup.opacity) > 0 && Number(closing.popup.opacity) < 1, "real full exit intermediate");
    await update({ open: true });
    await page.waitForTimeout(80);
    assert(await page.evaluate(() => window.savedPopup === document.querySelector('[data-slot="select-content"]')));
    assert.equal((await save()).popup.opacity, "1");
    await page.waitForTimeout(750);
    assert.equal(
      await page.evaluate(() => (window.selectCompletions ?? []).filter((v) => !v).length),
      await page.evaluate(() => window.falseCompletions),
    );
    await update({ open: false });
    await page.waitForTimeout(45);
    await update({ mode: "reduced" });
    const reducedExit = await save();
    assert(
      reducedExit.popup.effects.some(
        (a) => a.state === "running" && a.duration > 0 && a.frames.some((f) => "opacity" in f),
      ),
    );
    assert(!reducedExit.popup.effects.some((a) => a.state === "running" && a.frames.some((f) => "transform" in f)));
    await update({ mode: "none" });
    assert.equal((await save()).popup.opacity, "0");
    await page.waitForTimeout(100);
    assert.equal(await page.locator('[data-slot="select-content"]').isVisible(), false);
    checks.push("real exit intermediate, same-host reopen, retired completion and live reduced/none cancellation");
    await update({ mode: "full", open: false, holdClose: true });
    await page.locator("#select").click();
    await page.waitForTimeout(100);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(750);
    const retained = await page.locator('[data-slot="select-content"]').evaluate((n) => ({
      closed: n.hasAttribute("data-closed"),
      opacity: getComputedStyle(n).opacity,
      inert: Boolean(n.closest("[inert]")),
      parentHidden: Boolean(n.closest("[hidden]")),
    }));
    report.retainedDiagnostic = retained;
    assert(retained.closed && retained.inert);
    assert.equal(retained.opacity, "0");
    assert.equal(retained.parentHidden, false, "caller prevent-unmount remains authoritative");
    await page.locator("#outside").focus();
    await update({ labelA: "Plan asynchronously ready" });
    await page.waitForTimeout(30);
    assert((await save()).textLayers > 0, "visible value updates during retained popup close");
    await page.evaluate(() => window.selectUnmount());
    assert((await save()).textLayers > 0, "native popup completion cannot cancel surviving value text");
    await update({ labelA: "Plan ready again" });
    assert.equal((await save()).text, "Plan ready again");
    await page.waitForTimeout(750);
    await update({ holdClose: false, labelA: "Plan AAA" });
    await page.waitForTimeout(750);
    checks.push("native prevented exit and later unmount preserve visible async value transaction");
    // Parent baseline, then a truly new trigger; no SSR replay or synthetic exit.
    await update({ show: false });
    await page.locator("#outside").focus();
    await update({ show: true });
    const entrance = await page.locator("#select").evaluate((n) => ({
      opacity: Number(getComputedStyle(n).opacity),
      animations: n.getAnimations().map((a) => a.effect.getKeyframes()),
    }));
    assert(entrance.animations.some((frames) => frames.some((f) => "opacity" in f)));
    assert(entrance.opacity < 1);
    await page.locator("#select").focus();
    assert.equal(await page.locator("#select").evaluate((n) => getComputedStyle(n).opacity), "1");
    checks.push("later independent trigger entrance and interaction settlement");
    await page.locator("#outside").focus();
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(800);
    await page.mouse.move(900, 50);
    await page.waitForTimeout(800);
    await page.locator("#select").hover();
    await page.waitForTimeout(40);
    const colour = await page.locator("#select").evaluate((n) => ({
      duration: getComputedStyle(n).transitionDuration,
      animations: n
        .getAnimations()
        .map((a) => ({ property: a.transitionProperty, state: a.playState, frames: a.effect.getKeyframes() })),
    }));
    report.colourDiagnostic = colour;
    report.focusDiagnostic = await page.evaluate(() => ({
      focus: document.activeElement.id,
      html: document.getElementById("select").outerHTML,
    }));
    assert(
      colour.animations.some((a) => a.property === "background-color" && a.state === "running"),
      "real scoped hover colour writer",
    );
    await page.locator("#select").focus();
    assert.equal(await page.locator("#select").evaluate((n) => getComputedStyle(n).transitionDuration), "0s");
    await update({ invalid: true });
    assert.equal(await page.locator("#select").evaluate((n) => getComputedStyle(n).transitionDuration), "0s");
    await update({ invalid: false });
    checks.push("computed hover colour and immediate focused/invalid owner priority");
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await update({ open: true, keepOpen: true, extra: 8 });
    await page.waitForTimeout(800);
    await page.locator("#outside").focus();
    await page.waitForTimeout(60);
    const large = (await save()).popup.rect.height;
    await update({ extra: 0 });
    await page.waitForTimeout(45);
    const resize = await save();
    assert(
      resize.popup.effects.some((a) => a.frames.some((f) => "height" in f)),
      "actual free popup shrink owner",
    );
    assert(
      resize.popup.rect.height < large &&
        resize.popup.rect.height >
          (await page.locator('[data-slot="select-list"]').evaluate((n) => n.getBoundingClientRect().height)),
    );
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(60);
    const passive = await save();
    assert(!passive.popup.effects.some((a) => a.state === "running" && a.frames.some((f) => "height" in f)));
    checks.push("unfocused free popup height interpolation and passive viewport invalidation");
    await update({ count: 20 });
    await page.waitForTimeout(40);
    assert((await save()).reels > 0, "explicit option quantity has real reels");
    await update({ mode: "reduced" });
    assert.equal((await save()).reels, 0);
    await update({ count: 21 });
    assert.equal((await save()).reels, 0);
    await update({ mode: "none", count: 22 });
    assert.equal((await save()).reels, 0);
    await update({ mode: "full" });
    assert.equal((await save()).reels, 0);
    checks.push("composed explicit quantity, live reduction and no replay");
    await update({ open: false, keepOpen: false });
    await page.waitForTimeout(750);
    await update({ aligned: true, extra: 32 });
    await page.locator("#select").click();
    await page.waitForTimeout(200);
    await page.locator("#option-a").focus();
    await page.keyboard.press("End");
    await page.waitForTimeout(80);
    const scroll = await page
      .getByRole("listbox")
      .evaluate((n) => ({ top: n.scrollTop, max: n.scrollHeight - n.clientHeight }));
    report.scrollDiagnostic = scroll;
    assert(scroll.max > 0 && scroll.top > 0, "native aligned keyboard scroll remains operational");
    assert(!(await save()).popup.effects.some((a) => a.state === "running" && a.frames.some((f) => "height" in f)));
    await page.keyboard.press("Home");
    checks.push("native aligned-item scrolling owns geometry and keeps focus reveal");
    await update({ open: false, keepOpen: false, aligned: false, extra: 0, value: "a" });
    await page.waitForTimeout(800);
    await page.locator("#select").click();
    await page.waitForFunction(() => document.getElementById("select").getAttribute("aria-expanded") === "true");
    await page.waitForFunction(() => {
      const n = document.querySelector('[data-slot="select-content"]');
      return (
        n?.hasAttribute("data-open") &&
        getComputedStyle(n).opacity === "1" &&
        getComputedStyle(n.parentElement).opacity === "1"
      );
    });
    await page.waitForTimeout(60);
    report.beforeIsolatedFlight = await page.evaluate(() => window.selectProbe());
    await page.locator("#option-b").click();
    report.isolatedFlight = {
      state: await save(),
      candidate: await page.evaluate(() => window.selectCandidate),
      trace: await page.evaluate(() => ({
        flight: window.selectFlightTrace,
        text: window.textFlightTrace,
        value: window.selectValueTrace,
      })),
    };
    assert((await save()).flight);
    await update({ siblingKey: 1 });
    await page.waitForTimeout(45);
    assert((await save()).flight, "sibling cleanup cannot cancel another Select's flight");
    await page.evaluate(() => {
      document.getElementById("form").addEventListener("reset", (e) => e.preventDefault(), { once: true });
      HTMLFormElement.prototype.reset.call(document.getElementById("form"));
    });
    assert((await save()).flight, "cancelled reset keeps current accepted presentation");
    await page.evaluate(() => HTMLFormElement.prototype.reset.call(document.getElementById("form")));
    await page.waitForTimeout(20);
    assert.equal((await save()).flight, null);
    assert.equal((await save()).textLayers, 0);
    assert.equal((await save()).text, "Plan BBB");
    assert.deepEqual(await page.evaluate(() => [...new FormData(document.getElementById("form"))]), [["plan", "b"]]);
    checks.push("instance isolation and accepted/cancelled native reset boundaries without invented values");
    await page.waitForTimeout(800);
    await update({ value: "a", rtl: true, labelA: "خطة", labelB: "خطة جديدة" });
    assert.equal((await save()).text, "خطة");
    assert.equal((await save()).flight, null);
    await update({ fixed: true, labelA: "A very long label that retains the caller's fixed truncation" });
    const fixed = await page
      .locator("#select")
      .evaluate((n) => ({ width: n.getBoundingClientRect().width, scroll: n.scrollWidth, client: n.clientWidth }));
    assert.equal(fixed.width, 192);
    checks.push("RTL/connected-script immediate mapping and fixed caller allocation");
    await update({ open: false, custom: true, value: "b" });
    assert.equal(await page.locator('#select [data-slot="select-value"]').textContent(), "Custom b");
    assert.equal((await save()).flight, null);
    checks.push("rich/function value formatter retains its own native renderer");
    await update({ show: false });
    await page.waitForTimeout(50);
    assert.equal(
      await page.locator("[data-cadence-text-layer],[data-cadence-handoff-layer],[data-cadence-reel]").count(),
      0,
    );
    report.advanced = { checks, entrance, colour, large, resize, passive, scroll, fixed };
    await context.close();
  }
  const native = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } }),
    nojs = await native.newPage();
  await nojs.goto(url);
  assert.equal(await nojs.locator('#select [data-slot="select-value"]').textContent(), "Plan AAA");
  assert.equal(await nojs.locator("[data-cadence-handoff-layer],[data-cadence-text-layer]").count(), 0);
  await nojs.screenshot({ path: path.join(output, "no-js-narrow.png") });
  await native.close();
  report.noJS = true;
  assert.deepEqual(report.errors, []);
} catch (e) {
  report.failure = e.stack;
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
