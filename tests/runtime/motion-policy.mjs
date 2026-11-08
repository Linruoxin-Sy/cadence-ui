import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { setTimeout as pause } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

const output = path.resolve(process.env.CADENCE_MOTION_AUDIT_DIR ?? `.cache/audits/motion-policy-${Date.now()}`);
await mkdir(output, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const environment = process.env.CADENCE_MOTION_REACT_ENV ?? "production";
let fault;
const plugins = [];
if (process.env.CADENCE_POLICY_FAULT) {
  const definitions = JSON.parse(await readFile("tests/fixtures/motion/policy-negative.json", "utf8"));
  const definition = definitions[process.env.CADENCE_POLICY_FAULT];
  assert(definition, "known policy fault");
  plugins.push({
    name: "owned-policy-fault",
    setup(builder) {
      builder.onLoad({ filter: /control-animation\.tsx$/ }, async (args) => {
        const original = await readFile(args.path, "utf8");
        assert.equal(original.split(definition.find).length, 2, "exact fault anchor");
        const executed = original.replace(definition.find, definition.replace);
        await writeFile(path.join(output, "fault-control.tsx"), executed);
        fault = {
          id: process.env.CADENCE_POLICY_FAULT,
          ...definition,
          source: args.path,
          originalSHA: createHash("sha256").update(original).digest("hex"),
          executedSHA: createHash("sha256").update(executed).digest("hex"),
        };
        return { contents: executed, loader: "tsx", resolveDir: path.dirname(args.path) };
      });
    },
  });
}
const entry = process.env.CADENCE_POLICY_ENTRY ?? "tests/runtime/motion-policy.jsx";
const bundle = await build({
  plugins,
  entryPoints: [entry],
  metafile: true,
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": JSON.stringify(environment) },
});
const base = process.env.CADENCE_SERVED_CSS
  ? await readFile(process.env.CADENCE_SERVED_CSS, "utf8")
  : (
      await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
        from: path.resolve("app/globals.css"),
      })
    ).css;
const css = `${base}\n${await readFile("tests/runtime/motion-policy.css", "utf8")}`;
await writeFile(path.join(output, "fixture.js"), bundle.outputFiles[0].text);
await writeFile(path.join(output, "compiled.css"), css);
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
await writeFile(path.join(output, "fixture.jsx"), await readFile(entry));
const report = {
  environment,
  fault,
  entry,
  inputs: Object.fromEntries(
    await Promise.all(
      Object.keys(bundle.metafile.inputs).map(async (file) => [
        file,
        createHash("sha256")
          .update(await readFile(file))
          .digest("hex"),
      ]),
    ),
  ),
  cssSource: process.env.CADENCE_SERVED_CSS ?? "compiled app/globals.css",
  hashes: {
    baseCSS: createHash("sha256").update(base).digest("hex"),
    css: createHash("sha256").update(css).digest("hex"),
    js: createHash("sha256").update(bundle.outputFiles[0].text).digest("hex"),
  },
  cases: [],
  failures: [],
  errors: [],
};
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/fixture.js") {
    response.setHeader("content-type", "text/javascript");
    response.end(bundle.outputFiles[0].text);
  } else if (url.pathname === "/fixture.css") {
    response.setHeader("content-type", "text/css");
    response.end(css);
  } else {
    response.setHeader("content-type", "text/html");
    response.end(
      `<!doctype html><html><head><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script>window.policyInitial=${url.searchParams.get("state") ?? "{}"};window.policyStrict=${environment === "development"};window.firstFrames=[];function capture(){const n=document.querySelector('[data-slot="loop"]');if(n&&window.firstFrames.length<5){window.firstFrames.push({mode:n.dataset.motion,name:getComputedStyle(n).animationName,colorDuration:getComputedStyle(document.querySelector('[data-slot="color"]')).transitionDuration});}if(window.firstFrames.length<5)requestAnimationFrame(capture)}requestAnimationFrame(capture);</script><script src="/fixture.js"></script></body></html>`,
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
let page;
const snapshot = () =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll("[data-slot]")].map((n) => {
        const s = getComputedStyle(n);
        return [
          n.dataset.slot,
          {
            mode: n.dataset.motion,
            transform: s.transform,
            opacity: s.opacity,
            color: s.color,
            background: s.backgroundColor,
            shadow: s.boxShadow,
            duration: s.transitionDuration,
            delay: s.transitionDelay,
            property: s.transitionProperty,
            animation: s.animationName,
            animations: n.getAnimations().map((a) => ({
              state: a.playState,
              name: a.animationName,
              property: a.transitionProperty,
              duration: a.effect?.getTiming().duration,
              current: a.currentTime,
            })),
            capture: window.policyPointer ? n.hasPointerCapture(window.policyPointer) : false,
          },
        ];
      }),
    ),
  );
const patch = async (p) => page.evaluate((p) => window.policyPatch(p), p);
const frame = async (n = 2) =>
  page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame);
  }, n);
const record = async (label, check) => {
  const data = await snapshot();
  report.cases.push({ label, data });
  check?.(data);
  return data;
};
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const context = await browser.newContext({ reducedMotion: os, viewport: { width: 1280, height: 800 } });
      page = await context.newPage();
      page.on("pageerror", (e) => report.errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") report.errors.push(m.text());
      });
      await page.goto(
        `${origin}/?state=${encodeURIComponent(JSON.stringify({ mode, clock: 4, innerMode: "full", innerClock: 2 }))}`,
      );
      await page.locator('[data-slot="color"]').waitFor();
      await frame(5);
      report.reactVersion = await page.evaluate(() => window.policyReactVersion);
      if (process.env.CADENCE_EXPECT_REACT) assert.equal(report.reactVersion, process.env.CADENCE_EXPECT_REACT);
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      await record(`${mode}/${os} first paint`, (s) => {
        assert.equal(s.color.mode, effective);
        assert.equal(s.loop.animation, effective === "full" ? "pulse" : "none");
        assert.equal(s["spinner-owner"].animation, effective === "full" ? "spin" : "none");
        assert.equal(s.combined.animation, effective === "full" ? "spin" : "none");
        assert.equal(s.unverified.duration, "0s");
        assert.equal(s["svg-color"].duration, effective === "none" ? "0s" : effective === "reduced" ? "0.72s" : "1.2s");
        assert.equal(s["nested-loop"].animation, os === "reduce" ? "none" : "pulse");
        assert.equal(s.nested.mode, os === "reduce" ? "reduced" : "full");
      });
      const frames = await page.evaluate(() => window.firstFrames);
      report.cases.push({ label: `${mode}/${os} initial frames`, frames });
      if (effective !== "full") assert(frames.every((f) => f.name === "none"));
      await patch({ paint: true, target: 400, fade: 0.4, pressed: true, starting: true, delay: 0.1 });
      await frame(2);
      await record(`${mode}/${os} actual action`);
      await page.evaluate(() => {
        window.oldPolicyAnimations = [
          ...document.querySelector('[data-slot="color"]').getAnimations(),
          ...document.querySelector('[data-slot="loop"]').getAnimations(),
        ];
      });
      await patch({ mode: "none", clock: 0 });
      const zero = await record(`${mode}/${os} same target none before frame`, (s) => {
        assert.equal(s.color.duration, "0s");
        assert.equal(s.color.delay, "0s");
        assert.equal(s.loop.animation, "none");
        assert.equal(s.press.transform, "none");
      });
      await frame(4);
      await record(`${mode}/${os} no queued old write`, (s) => {
        assert.equal(s.color.color, zero.color.color);
        assert.equal(s.finite.transform, "matrix(1, 0, 0, 1, 400, 0)");
        assert.equal(s.loop.animation, "none");
      });
      assert(
        await page.evaluate(() =>
          window.oldPolicyAnimations.every((a) => a.playState === "idle" || a.playState === "finished"),
        ),
      );
      await patch({ mode: "full", clock: 2 });
      await frame(2);
      await record(`${mode}/${os} restoration baseline`, (s) => {
        assert.equal(s.color.animations.length, 0);
      });
      await page.screenshot({ path: path.join(output, `${mode}-${os}.png`), fullPage: true });
      await context.close();
    }
  const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 800 } });
  page = await context.newPage();
  page.on("pageerror", (e) => report.errors.push(e.message));
  await page.goto(origin);
  await page.locator('[data-slot="loop"]').waitFor();
  await frame(3);
  await patch({ clock: 4, classPaint: true });
  await frame(2);
  const classClock = await page.evaluate(() => {
    const n = document.querySelector('[data-slot="color"]');
    window.classHandle = n.getAnimations().find((a) => a.transitionProperty === "background-color");
    const duration = window.classHandle?.effect.getTiming().duration;
    window.policyPatch({ clock: 2 });
    return {
      duration,
      same: n.getAnimations().includes(window.classHandle),
      after: window.classHandle?.effect.getTiming().duration,
    };
  });
  assert.equal(classClock.duration, 640);
  assert.equal(classClock.after, 640);
  assert.equal(classClock.same, true);
  report.cases.push({
    label: "class colour target plus new clock captures 640ms; clock-only retains handle",
    data: classClock,
  });
  await patch({ clock: 0, classPaint: false });
  await frame(2);
  await patch({ clock: 1 });
  await frame(2);
  await patch({ clock: 4, paint: true, target: 600 });
  await page.waitForTimeout(60);
  await page.evaluate(() => {
    window.cssClock = document
      .querySelector('[data-slot="color"]')
      .getAnimations()
      .find((a) => a.transitionProperty === "background-color");
    window.oldCSSDuration = window.cssClock.effect.getTiming().duration;
  });
  const positive = await page.evaluate(() => {
    const n = document.querySelector('[data-slot="color"]');
    const before = getComputedStyle(n).color;
    const handle = window.cssClock;
    window.policyPatch({ clock: 2 });
    return {
      before,
      after: getComputedStyle(n).color,
      same: n.getAnimations().includes(handle),
      state: handle.playState,
    };
  });
  const before = positive.before;
  const after = positive.after;
  assert.equal(await page.evaluate(() => window.cssClock.effect.getTiming().duration), 640);
  assert.equal(before, after);
  assert.equal(positive.same, true);
  assert.equal(positive.state, "running");
  report.cases.push({ label: "positive captured CSS/Motion clock", before, after });
  await page.waitForTimeout(250);
  await record("finite action retains its captured positive clock", (s) =>
    assert.notEqual(s.finite.transform, "matrix(1, 0, 0, 1, 600, 0)"),
  );
  const contrast = await page.evaluate(async () => {
    const out = [];
    const luminance = (rgb) => {
      const a = rgb
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      const css = getComputedStyle(document.querySelector('[data-slot="color"]'));
      const f = luminance(css.color),
        b = luminance(css.backgroundColor);
      out.push({
        color: css.color,
        background: css.backgroundColor,
        ratio: (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05),
      });
    }
    return out;
  });
  assert(contrast.every((s) => s.ratio >= 4.5));
  report.cases.push({
    label: "verified palette remains readable through actual intermediate frames",
    frames: contrast,
  });
  await page.evaluate(() => document.querySelector('[data-slot="color"]').classList.add("unsafe-shadow"));
  await frame(1);
  await record("unsupported shadow geometry settles before its first frame", (s) => {
    assert(s.color.shadow.includes("14px"));
    assert(!s.color.animations.some((a) => a.property === "box-shadow"));
  });
  await page.evaluate(() => document.querySelector('[data-slot="color"]').classList.remove("unsafe-shadow"));
  await frame(1);
  await patch({ clock: 0, pressed: true });
  await frame(3);
  await record("zero preserves full held pose and independent theme loop", (s) => {
    assert.equal(s.press.transform, "matrix(0.97, 0, 0, 0.97, 0, 0)");
    assert.equal(s.loop.animation, "pulse");
  });
  await patch({ clock: 4, paint: false, pressed: false, target: 100 });
  await frame(2);
  await patch({ mode: "reduced" });
  await record("same target reduced cancels old colour writer", (s) => {
    assert.equal(s.color.animations.length, 0);
    assert.equal(s.loop.animation, "none");
  });
  await patch({ mode: "full", clock: 4, paint: true });
  await frame(2);
  await page.locator('[data-slot="color"]').focus();
  await record("focus border/shadow immediate first state frame", (s) => {
    assert.equal(s.color.duration, "0s");
    assert.equal(s.color.animations.length, 0);
  });
  await page.locator("[data-native-input]").focus();
  await patch({ invalid: true });
  await record("invalid paint immediate first state frame", (s) => assert.equal(s.color.duration, "0s"));
  await patch({ invalid: false });
  await page.evaluate(() => window.policyTheme());
  await record("coordinated theme no local replay", (s) => assert.equal(s.color.animations.length, 0));
  await page.evaluate(() =>
    document.querySelector('[data-slot="svg-color"]').style.removeProperty("--motion-source-duration-fast"),
  );
  await frame(3);
  await record("SVG override removal restores inherited clock", (s) => assert.equal(s["svg-color"].duration, "0.64s"));
  await patch({ active: false });
  await frame(2);
  await record("inactive status owns no autonomous work", (s) => assert.equal(s.loop.animation, "none"));
  await patch({ active: true });
  await frame(2);
  await page.evaluate(() => window.policyGates["delayed-loop"]({ open: true }));
  await frame(2);
  await record("delayed portal connects through real callback ref", (s) =>
    assert.equal(s["delayed-loop"].animation, "pulse"),
  );
  await page.evaluate(() => window.policyGates["delayed-loop"]({ type: "span" }));
  await frame(2);
  await record("render replacement keeps policy ownership", (s) => assert.equal(s["delayed-loop"].animation, "pulse"));
  await page.evaluate(() => window.policyGates["delayed-loop"]({ open: false }));
  await page.evaluate(() => window.policyGates["delayed-loop"]({ open: true }));
  await frame(2);
  await record("portal reopen reconnects policy", (s) => assert.equal(s["delayed-loop"].animation, "pulse"));
  await page.evaluate(() => window.policyGates["delayed-color"]({ open: true }));
  await frame(2);
  await record("SVG colour portal inherits logical local clock", (s) =>
    assert.equal(s["delayed-color"].duration, "1.6s"),
  );
  await page.evaluate(() => {
    document.querySelector('[data-slot="loop"]').style.position = "fixed";
    document.querySelector('[data-slot="loop"]').style.top = "2000px";
  });
  await frame(4);
  await record("offscreen loop cancelled", (s) => assert.equal(s.loop.animation, "none"));
  await page.evaluate(() => (document.querySelector('[data-slot="loop"]').style.top = "20px"));
  await frame(4);
  await record("visible activity resumes without backlog", (s) => {
    assert.equal(s.loop.animation, "pulse");
    assert(s.loop.animations[0].current < 300);
  });
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await record("page suspension signal cancels only owned work", (s) => {
    assert.equal(s.loop.animation, "none");
    assert.equal(s.color.duration, "0s");
  });
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await frame(2);
  await record("page restoration establishes current paint", (s) => {
    assert.equal(s.color.animations.length, 0);
    assert.equal(s.loop.animation, "pulse");
  });
  const button = page.locator('[data-slot="color"]');
  const box = await button.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.evaluate(() => {
    window.policyPointer = window.policyLog.native.find((x) => x[0] === "down")[1];
  });
  assert(
    await page.evaluate(() => document.querySelector('[data-slot="color"]').hasPointerCapture(window.policyPointer)),
  );
  await patch({ mode: "none", clock: 0 });
  assert(
    await page.evaluate(() => document.querySelector('[data-slot="color"]').hasPointerCapture(window.policyPointer)),
  );
  await page.mouse.move(900, 600);
  await page.mouse.up();
  report.cases.push({
    label: "native pointer capture survives mode/clock changes",
    events: await page.evaluate(() => window.policyLog.native),
  });
  await patch({ mode: "full", clock: 2, invalid: false, paint: false, dim: false });
  await page.evaluate(() => {
    window.foreignHandles = [
      document.querySelector('[data-slot="color"]'),
      document.querySelector('[data-slot="loop"]'),
    ].map((n) =>
      n.animate([{ transform: "translateX(0px)" }, { transform: "translateX(30px)" }], {
        duration: 10000,
        fill: "both",
      }),
    );
  });
  await patch({ paint: true });
  await frame(2);
  await patch({ mode: "none", clock: 0 });
  assert(await page.evaluate(() => window.foreignHandles.every((a) => a.playState === "running")));
  await record("colour and pulse stop preserve disjoint native transform handles");
  await page.evaluate(() => {
    document.querySelector('[data-slot="color"]').classList.add("foreign-color");
    document.querySelector('[data-slot="loop"]').classList.add("foreign-loop");
  });
  await frame(2);
  for (const [mode, clock] of [
    ["full", 4],
    ["none", 0],
    ["reduced", 2],
    ["full", 1],
  ]) {
    await patch({ mode, clock });
    await frame(2);
    await record(`dynamic caller CSS family retains ownership ${mode}/${clock}`, (s) => {
      assert.equal(s.color.property, "transform");
      assert.equal(s.color.duration, "2s");
      assert.equal(s.color.delay, "0.2s");
      assert.equal(s.loop.animation, "foreign-orbit");
    });
  }
  await page.evaluate(() => {
    document.querySelector('[data-slot="color"]').classList.remove("foreign-color");
    document.querySelector('[data-slot="loop"]').classList.remove("foreign-loop");
  });
  await frame(3);
  await record("class override removal restores shared ownership", (s) => {
    assert.equal(s.color.property, "background-color, color, border-bottom-color, box-shadow");
    assert.equal(s.loop.animation, "pulse");
  });
  await page.evaluate(() => {
    document.querySelector('[data-slot="color"]').style.transition = "transform 2s linear 0.2s";
    document.querySelector('[data-slot="loop"]').style.animation = "foreign-orbit 3s linear infinite";
  });
  await frame(2);
  await patch({ mode: "none", clock: 0 });
  await frame(2);
  await record("inline caller family survives live none/zero", (s) => {
    assert.equal(s.color.property, "transform");
    assert.equal(s.color.duration, "2s");
    assert.equal(s.loop.animation, "foreign-orbit");
  });
  await page.evaluate(() => {
    document.querySelector('[data-slot="color"]').style.removeProperty("transition");
    document.querySelector('[data-slot="loop"]').style.removeProperty("animation");
  });
  await frame(3);
  await record("inline override removal restores current none baseline", (s) => {
    assert.equal(s.color.duration, "0s");
    assert.equal(s.loop.animation, "none");
  });
  await patch({ mode: "full", clock: 2, dim: true });
  await frame(3);
  await record("semantic dimming remains static and readable", (s) => {
    assert.equal(s.loop.opacity, "0.35");
    assert.equal(s.loop.animation, "none");
  });
  await patch({ mode: "reduced" });
  await record("reduced cleanup preserves caller resting opacity", (s) => assert.equal(s.loop.opacity, "0.35"));
  await patch({ mode: "full", dim: false });
  await frame(2);
  assert(await page.evaluate(() => window.foreignHandles.every((a) => a.playState === "running")));
  await page.evaluate(() =>
    window.foreignHandles.forEach((a) => {
      a.cancel();
    }),
  );
  await page.evaluate(() => {
    const n = document.querySelector('[data-slot="loop"]');
    n.style.removeProperty("opacity");
    n.classList.add("dim-status");
  });
  await frame(3);
  await record("class/cascade semantic dimming stays static", (s) => {
    assert.equal(s.loop.opacity, "0.35");
    assert.equal(s.loop.animation, "none");
  });
  await page.evaluate(() => document.querySelector('[data-slot="loop"]').classList.remove("dim-status"));
  await frame(3);
  await record("class dim removal resumes eligible theme loop", (s) => assert.equal(s.loop.animation, "pulse"));
  const lifecycle = await context.newCDPSession(page);
  await page.evaluate(() => {
    window.visibilityEvidence = [];
    document.addEventListener("visibilitychange", () =>
      window.visibilityEvidence.push({
        state: document.visibilityState,
        animation: document.querySelector('[data-slot="loop"]')
          ? getComputedStyle(document.querySelector('[data-slot="loop"]')).animationName
          : "unmounted",
      }),
    );
  });
  await lifecycle.send("Page.setWebLifecycleState", { state: "frozen" });
  await page.waitForTimeout(50);
  await lifecycle.send("Page.setWebLifecycleState", { state: "active" });
  await frame(3);
  report.cases.push({
    label: "actual browser lifecycle freeze/resume",
    visibility: await page.evaluate(() => window.visibilityEvidence),
  });
  await lifecycle.detach();
  // Reopening creates a new owner whose first resting paint is inline dimmed.
  await patch({ mounted: false, dim: true });
  await patch({ mounted: true });
  await frame(3);
  await record("initial inline dimmed owner is static", (s) => assert.equal(s.loop.animation, "none"));
  await page.evaluate(() => document.querySelector('[data-slot="loop"]').style.removeProperty("opacity"));
  await frame(3);
  await record("removing initial inline opacity restores eligible full loop", (s) =>
    assert.equal(s.loop.animation, "pulse"),
  );
  const editor = page.locator("[data-native-input]");
  await editor.fill("Native editing stays current");
  await editor.focus();
  await editor.evaluate((n) => {
    window.retainedEditor = n;
    n.setSelectionRange(7, 14);
  });
  await patch({ mode: "none", clock: 0 });
  const nativeInput = await editor.evaluate((n) => ({
    same: n === window.retainedEditor,
    focused: n === document.activeElement,
    value: n.value,
    start: n.selectionStart,
    end: n.selectionEnd,
  }));
  assert.deepEqual(nativeInput, {
    same: true,
    focused: true,
    value: "Native editing stays current",
    start: 7,
    end: 14,
  });
  report.cases.push({ label: "native editing/focus/selection survive mode/clock commit", data: nativeInput });
  for (const [mode, clock] of [
    ["none", 0],
    ["full", 4],
  ]) {
    await patch({ mounted: false });
    await patch({ mounted: true, mode, clock, paint: false, target: 0 });
    await frame(3);
    await page.getByText("Native intent", { exact: true }).hover();
    await page.waitForTimeout(80);
    assert.equal(await page.getByRole("tooltip").count(), 0);
    await page.getByRole("tooltip").waitFor({ state: "attached", timeout: 1000 });
    const intent = await page.evaluate(() => window.policyLog.intentElapsed);
    assert(intent >= 150 && intent < 600);
    await page.mouse.move(900, 600);
    await page.waitForTimeout(40);
    await page.evaluate(() => {
      window.policyLog.toastClose = null;
      window.policyAddToast();
    });
    await page.getByText("Native lifetime", { exact: true }).waitFor();
    await page.waitForTimeout(150);
    assert(await page.getByText("Native lifetime", { exact: true }).isVisible());
    await page.waitForFunction(() => window.policyLog.toastClose !== null, {}, { timeout: 1500 });
    const lifetime = await page.evaluate(() => window.policyLog.toastClose);
    assert(lifetime >= 550 && lifetime < 1100);
    report.cases.push({ label: `native intent/lifetime independent of ${mode}/${clock}`, intent, lifetime });
  }
  await patch({ mode: "full", clock: 4, target: 0, delay: 0.1, fade: 1 });
  await frame(3);
  await page.evaluate(() => (window.policyLog.completions = []));
  await patch({ target: 800, fade: 0.3 });
  await frame(2);
  await patch({ mode: "none", clock: 0 });
  const cancelledFrames = await page.evaluate(async () => {
    const samples = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      const n = document.querySelector('[data-slot="finite"]');
      samples.push({ transform: getComputedStyle(n).transform, opacity: getComputedStyle(n).opacity });
    }
    return samples;
  });
  assert(cancelledFrames.every((s) => s.transform === "matrix(1, 0, 0, 1, 800, 0)" && s.opacity === "0.3"));
  const settledCompletion = await page.evaluate(() => window.policyLog.completions.length);
  await page.waitForTimeout(1400);
  assert.equal(await page.evaluate(() => window.policyLog.completions.length), settledCompletion);
  report.cases.push({
    label: "cancelled delayed writer has no old completion or per-frame write",
    frames: cancelledFrames,
    completions: settledCompletion,
  });
  await patch({ mode: "full", clock: 2 });
  await frame(3);
  const completedCount = await page.evaluate(() => window.policyLog.completions.length);
  await patch({ clock: 4 });
  await frame(4);
  const afterClockCount = await page.evaluate(() => window.policyLog.completions.length);
  report.cases.push({
    label: "settled physics clock edit cannot manufacture completion",
    before: completedCount,
    after: afterClockCount,
  });
  assert.equal(afterClockCount, completedCount);
  const physicsCount = () =>
    page.evaluate(() => window.policyLog.completions.filter((row) => row[0] === "physics").length);
  const startPhysics = async () => {
    await patch({ mode: "none", clock: 0, target: 0, physicsDelay: 0 });
    await frame(3);
    await patch({ mode: "full", clock: 8, target: 500 });
    await frame(2);
  };
  await startPhysics();
  const naturalBefore = await physicsCount();
  const retiming = await page.evaluate(() => {
    const n = document.querySelector('[data-slot="physics"]');
    const before = getComputedStyle(n).transform;
    window.physicsNode = n;
    window.policyPatch({ clock: 1 });
    return {
      before,
      after: getComputedStyle(n).transform,
      same: n === document.querySelector('[data-slot="physics"]'),
    };
  });
  assert.equal(retiming.before, retiming.after);
  assert(retiming.same);
  await page.waitForFunction(
    (before) => window.policyLog.completions.filter((row) => row[0] === "physics").length > before,
    naturalBefore,
    { timeout: 1200 },
  );
  const naturalAfter = await physicsCount();
  await patch({ clock: 2 });
  await frame(4);
  assert.equal(await physicsCount(), naturalAfter);
  report.cases.push({
    label: "active physics retimes; natural completion does not replay on clock edit",
    retiming,
    completions: naturalAfter,
  });
  await patch({ mode: "none", clock: 0, target: 0, physicsDelay: 0.9 });
  await frame(3);
  await patch({ mode: "full", clock: 8, target: 500 });
  await frame(2);
  const pendingBefore = await physicsCount();
  await patch({ clock: 1 });
  await page.waitForFunction(
    (before) => window.policyLog.completions.filter((row) => row[0] === "physics").length > before,
    pendingBefore,
    { timeout: 1200 },
  );
  report.cases.push({
    label: "pending physics retime consumes the old entrance delay",
    completions: await physicsCount(),
  });
  await patch({ physicsDelay: 0 });
  for (const cause of ["none", "reduced", "zero", "print"]) {
    await startPhysics();
    const before = await physicsCount();
    if (cause === "print") await page.emulateMedia({ media: "print" });
    else await patch(cause === "zero" ? { clock: 0 } : { mode: cause });
    await frame(2);
    if (cause === "print") await page.emulateMedia({ media: "screen" });
    await patch({ mode: "full", clock: 2 });
    await frame(3);
    await patch({ clock: 4 });
    await frame(4);
    assert.equal(await physicsCount(), before);
    await record(`${cause} settlement cannot manufacture a physics completion`);
  }
  await patch({ mode: "none", clock: 0, target: 0 });
  await frame(3);
  await page.evaluate(() => (window.policyNextPhysics = 600));
  await patch({ mode: "full", clock: 0.5, target: 100 });
  await page.waitForFunction(() => window.policyState.target === 600, {}, { timeout: 1200 });
  await frame(1);
  const successor = await page.evaluate(() => ({
    clock: window.policyState.clock,
    target: window.policyState.target,
    transform: getComputedStyle(document.querySelector('[data-slot="physics"]')).transform,
  }));
  assert.equal(successor.clock, 8);
  assert.equal(successor.target, 600);
  const chainBefore = await physicsCount();
  await patch({ clock: 1 });
  await page.waitForFunction(
    (before) => window.policyLog.completions.filter((row) => row[0] === "physics").length > before,
    chainBefore,
    { timeout: 1200 },
  );
  report.cases.push({
    label: "old completion cannot mark its synchronously started successor settled",
    successor,
    events: await page.evaluate(() => window.policyLog.completions.filter((row) => row[0] === "physics").slice(-2)),
  });
  await page.emulateMedia({ forcedColors: "active" });
  await patch({ mode: "full", clock: 2, paint: false });
  await record("forced colours immediate", (s) => {
    assert.equal(s.loop.animation, "none");
    assert.equal(s.color.duration, "0s");
  });
  await page.emulateMedia({ forcedColors: "none", media: "print" });
  await record("print immediate", (s) => assert.equal(s.loop.animation, "none"));
  await page.emulateMedia({ media: "screen" });
  await page.screenshot({ path: path.join(output, "dark.png"), fullPage: true });
  await page.evaluate(() => window.policyUnmount());
  await frame(3);
  assert.equal(await page.locator("[data-slot]").count(), 0);
  report.cases.push({
    label: "unmount cleans owners and callback refs",
    refs: await page.evaluate(() => window.policyLog.refs),
  });
  const combinedRefs = await page.evaluate(() => window.policyLog.combinedRefs);
  assert.equal(
    combinedRefs.filter((row) => row[0] === "attach").length,
    combinedRefs.filter((row) => row[0] === "cleanup").length,
  );
  report.cases.push({ label: "combined managed refs have balanced React19 cleanup", events: combinedRefs });
  await context.close();
  // Default Playwright pages force visibility/focus. Use the native default CDP
  // context with noDefaults for actual background-tab visibility evidence.
  const executable = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  const profile = path.join(output, "owned-visibility-profile");
  const ownedProcess = spawn(
    executable,
    [
      "--headless=new",
      "--remote-debugging-port=0",
      "--no-first-run",
      "--no-default-browser-check",
      "--edge-skip-compat-layer-relaunch",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  let native;
  try {
    let endpoint;
    for (let attempt = 0; attempt < 200; attempt++) {
      try {
        const [port, target] = (await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/);
        endpoint = `ws://127.0.0.1:${port}${target}`;
        break;
      } catch {
        await pause(50);
      }
    }
    assert(endpoint, "native browser CDP endpoint");
    native = await chromium.connectOverCDP(endpoint, { noDefaults: true, timeout: 5000 });
    const context = native.contexts()[0];
    page = context.pages()[0];
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.goto(origin);
    await page.locator('[data-slot="loop"]').waitFor();
    await frame(3);
    await page.evaluate(() => {
      window.visibilityEvidence = [];
      document.addEventListener("visibilitychange", () => {
        const node = document.querySelector('[data-slot="loop"]');
        window.visibilityEvidence.push({
          state: document.visibilityState,
          animation: node ? getComputedStyle(node).animationName : "unmounted",
        });
      });
    });
    await patch({ clock: 8 });
    await page.getByRole("combobox", { name: "Policy selection" }).click();
    await page.getByRole("option", { name: "Long selected label", exact: true }).click();
    await page.locator('[data-slot="select-handoff"]').waitFor({ state: "attached" });
    await page.evaluate(() => (window.retainedSelectTrigger = document.querySelector('[data-slot="select-trigger"]')));
    await patch({ target: 500 });
    await frame(2);
    const hiddenPhysicsBefore = await physicsCount();
    const background = await context.newPage();
    await background.goto("about:blank");
    await background.bringToFront();
    await pause(100);
    assert.equal(await page.evaluate(() => document.visibilityState), "hidden");
    await record("actual hidden document cancels owned loop and colour", (s) => {
      assert.equal(s.loop.animation, "none");
      assert.equal(s.color.duration, "0s");
    });
    await patch({ paint: true, target: 250 });
    await page.bringToFront();
    await frame(4);
    await record("actual visible restoration has current targets and no backlog", (s) => {
      assert.equal(s.color.animations.length, 0);
      assert.equal(s.finite.transform, "matrix(1, 0, 0, 1, 250, 0)");
      assert.equal(s.loop.animation, "pulse");
    });
    assert.equal(await page.locator('[data-slot="select-handoff"]').count(), 0);
    const selected = await page.locator('[data-slot="select-value"]').evaluate((n) => ({
      text: n.textContent,
      opacity: getComputedStyle(n).opacity,
      width: n.getBoundingClientRect().width,
      natural: n.firstElementChild.getBoundingClientRect().width,
      sameTrigger: document.querySelector('[data-slot="select-trigger"]') === window.retainedSelectTrigger,
    }));
    assert.equal(selected.text, "Long selected label");
    assert.equal(selected.opacity, "1");
    assert(selected.sameTrigger);
    assert(selected.width >= selected.natural - 1);
    report.cases.push({ label: "actual Select hidden settlement releases ghost and current value", selected });
    await patch({ clock: 2 });
    await frame(3);
    await patch({ clock: 4 });
    await frame(4);
    assert.equal(await physicsCount(), hiddenPhysicsBefore);
    report.cases.push({
      label: "actual hidden settlement cannot replay after subsequent positive clocks",
      completions: hiddenPhysicsBefore,
    });
    report.cases.push({
      label: "native visibility events",
      pid: ownedProcess.pid,
      endpoint,
      events: await page.evaluate(() => window.visibilityEvidence),
    });
  } finally {
    if (native) {
      const session = await native.newBrowserCDPSession();
      await session.send("Browser.close").catch(() => {});
      await native.close();
    }
    if (ownedProcess.exitCode === null) ownedProcess.kill();
  }
} catch (error) {
  report.failures.push(error.stack);
  if (page && !page.isClosed()) {
    await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true });
    await writeFile(path.join(output, "failure.html"), await page.content());
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
}
console.log({ output, cases: report.cases.length, failures: report.failures, errors: report.errors });
if (report.failures.length || report.errors.length) process.exitCode = 1;
