import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
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
import RootReact from "react";
import { renderToString as renderRoot } from "react-dom/server";
import { observeControllers } from "./observe-controllers.mjs";

const output = path.resolve(process.env.CADENCE_SEMANTIC_OUTPUT ?? `.cache/audits/semantic-presence-${Date.now()}`);
await mkdir(output, { recursive: false });
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const environment = process.env.CADENCE_SEMANTIC_ENV ?? "production";
const theme = process.env.CADENCE_SEMANTIC_THEME ?? "light";
const report = { environment, theme, cases: [], failures: [], errors: [], inputs: {}, resources: {} };
report.filter = process.env.CADENCE_SEMANTIC_FILTER;
report.filterRegex = process.env.CADENCE_SEMANTIC_FILTER_REGEX;
report.instrumented = process.env.CADENCE_SEMANTIC_TRACE !== "off";
const consumerRoot = process.env.CADENCE_SEMANTIC_CONSUMER_ROOT;
const reactRoot = process.env.CADENCE_SEMANTIC_REACT_ROOT;
report.consumerRoot = consumerRoot;
report.reactRoot = reactRoot;
report.expectedReactVersion = JSON.parse(
  await readFile(require.resolve("react/package.json", reactRoot ? { paths: [reactRoot] } : undefined), "utf8"),
).version;
const React = reactRoot ? require(require.resolve("react", { paths: [reactRoot] })) : RootReact;
const renderToString = reactRoot
  ? require(require.resolve("react-dom/server", { paths: [reactRoot] })).renderToString
  : renderRoot;
const resolution = [
  {
    name: "actual-copied-installation",
    setup(builder) {
      if (consumerRoot)
        builder.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => {
          const marker = "registry/cadence/";
          const source = args.path.replaceAll("\\", "/");
          const base = path.resolve(
            consumerRoot,
            "components/cadence",
            source.slice(source.indexOf(marker) + marker.length),
          );
          const target = [
            base,
            `${base}.tsx`,
            `${base}.ts`,
            path.join(base, "index.tsx"),
            path.join(base, "index.ts"),
          ].find((file) => existsSync(file) && /\.[cm]?[jt]sx?$/.test(file));
          assert(target, "required installed target; no workspace fallback");
          return { path: target };
        });
      if (reactRoot)
        builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
          path: require.resolve(args.path, { paths: [reactRoot] }),
          external: builder.initialOptions.platform === "node",
        }));
    },
  },
];
report.nativeLifecycle = {
  version: JSON.parse(await readFile("node_modules/@base-ui/react/package.json", "utf8")).version,
  declaredRange: JSON.parse(await readFile("package.json", "utf8")).dependencies["@base-ui/react"],
  lockSHA256: sha(await readFile("pnpm-lock.yaml")),
  sources: Object.fromEntries(
    await Promise.all(
      ["internals/useUnmountAfterClose.js", "utils/popups/popupStoreUtils.js", "utils/getFiniteAnimations.js"].map(
        async (file) => [file, sha(await readFile(`node_modules/@base-ui/react/${file}`))],
      ),
    ),
  ),
};
const snapshot = async (page, selector) =>
  page.locator(selector).evaluate((node) => {
    const css = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    return {
      text: node.textContent,
      opacity: css.opacity,
      transform: css.transform,
      scale: css.scale,
      translate: css.translate,
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      clip: css.clipPath,
      property: css.transitionProperty,
      duration: css.transitionDuration,
      delay: css.transitionDelay,
      color: css.color,
      background: css.backgroundColor,
      active: node.contains(document.activeElement),
      entrySettled: node.hasAttribute("data-cadence-entry-settled"),
      animations: node.getAnimations().map((animation) => ({
        property: animation.transitionProperty ?? null,
        state: animation.playState,
        time: animation.currentTime,
        duration: animation.effect?.getTiming().duration,
        keyframes: animation.effect?.getKeyframes(),
      })),
    };
  });
const frame = async (page, count = 2) =>
  page.evaluate(async (count) => {
    for (let index = 0; index < count; index++) await new Promise(requestAnimationFrame);
  }, count);
const patch = (page, value) => page.evaluate((value) => window.semanticPatch(value), value);
const plugins = [
  {
    name: "observe-native-chart",
    setup(builder) {
      builder.onLoad({ filter: /chart[\\/]index\.tsx$/ }, async ({ path: file }) => {
        const code = await readFile(file, "utf8");
        const result = observeControllers.transform(code, file);
        return { contents: result ?? code, loader: "tsx", resolveDir: path.dirname(file) };
      });
    },
  },
];
plugins.push({
  name: "diagnostic-control-lifetime",
  setup(builder) {
    builder.onLoad({ filter: /control-animation\.tsx$/ }, async ({ path: file }) => {
      const original = await readFile(file, "utf8");
      let code = original;
      const anchors = [
        [
          "const presented = current.current !== null;",
          'const presented = current.current !== null; traceControl("create", host?.current, {presented, current:current.current,target});',
        ],
        [
          "host.invalidate = () => {",
          'host.invalidate = () => { traceControl("invalidate", host?.current, {equal:owner.current===record,current:current.current,target:latest.current});',
        ],
        [
          "record.lease = lease;",
          'record.lease = lease; traceControl("lease", host?.current, {valid:lease?.current(),current:current.current,target});',
        ],
      ];
      for (const [find, replacement] of anchors) {
        const matches = code.split(find).length - 1;
        assert(matches >= 1, "diagnostic source anchor");
        code = code.replaceAll(find, replacement);
      }
      code = code.replaceAll(
        "controls.set(target)",
        '(traceControl("set-before", host?.current, {target}), controls.set(target), traceControl("set-after", host?.current, {target}))',
      );
      code = code.replace(
        "controls.start(target, timing)",
        '(traceControl("start", host?.current, {target,current:current.current}), controls.start(target, timing))',
      );
      code +=
        '\nfunction traceControl(kind, node, value) { if(node?.getAttribute("data-slot")!=="external-value")return; (window.semanticControlTrace??=[]).push({kind,value,time:performance.now(),paint:getComputedStyle(node).transform}); }\n';
      report.controlDiagnostic = { sourceSHA: sha(original), observedSHA: sha(code) };
      await writeFile(path.join(output, "control-diagnostic.tsx"), code);
      return { contents: code, loader: "tsx", resolveDir: path.dirname(file) };
    });
  },
});
if (!report.instrumented) plugins.length = 0;
if (process.env.CADENCE_SEMANTIC_FAULT) {
  const definition = JSON.parse(await readFile("tests/fixtures/motion/semantic-negative.json", "utf8"))[
    process.env.CADENCE_SEMANTIC_FAULT
  ];
  assert(definition, "known semantic negative variant");
  plugins.push({
    name: "semantic-negative",
    setup(builder) {
      builder.onLoad({ filter: /motion-presence\.tsx$/ }, async ({ path: file }) => {
        const original = await readFile(file, "utf8");
        assert.equal(original.split(definition.find).length, 2, "one exact semantic fault anchor");
        const executed = original.replace(definition.find, definition.replace);
        report.fault = {
          ...definition,
          id: process.env.CADENCE_SEMANTIC_FAULT,
          matches: original.split(definition.find).length - 1,
          sourceSHA: sha(original),
          executedSHA: sha(executed),
        };
        await writeFile(path.join(output, "fault-source.tsx"), executed);
        return { contents: executed, loader: "tsx", resolveDir: path.dirname(file) };
      });
    },
  });
}
const common = {
  plugins: resolution,
  entryPoints: ["tests/runtime/semantic-presence.jsx"],
  bundle: true,
  jsx: "automatic",
  alias: { "@": process.cwd() },
};
const browserBundle = await build({
  ...common,
  plugins: [...resolution, ...plugins],
  metafile: true,
  write: false,
  format: "iife",
  platform: "browser",
  define: { "process.env.NODE_ENV": JSON.stringify(environment) },
});
const serverFile = path.join(output, "server-fixture.cjs");
await build({
  ...common,
  outfile: serverFile,
  format: "cjs",
  platform: "node",
  packages: reactRoot ? undefined : "external",
});
const { Fixture, initialState } = require(serverFile);
const css =
  (
    await postcss([tailwind()]).process(await readFile("app/globals.css", "utf8"), {
      from: path.resolve("app/globals.css"),
    })
  ).css +
  `
body{margin:0;padding:20px;font-family:Arial}.document{padding:12px}.fixture-color{background-color:rgb(250,250,250);color:rgb(15,15,15)}
.fixture-color[data-paint=true]{background-color:rgb(180,200,220);color:rgb(25,25,25)}
.fixture-color[aria-invalid=true]{background-color:rgb(240,190,190);color:rgb(50,0,0)}
.fixture-layout{min-width:300px}
.native-dialog{position:fixed;top:20%;left:20%;padding:24px;background:white;transition:opacity .11s}.native-dialog[data-closed]{opacity:0}
.caller-transition{transition-property:all;transition-duration:7s;transition-delay:0.2s}
.caller-curve{transition-property:opacity;transition-duration:1.76s;transition-timing-function:linear;transition-delay:0s}.caller-curve[data-paint=true]{opacity:0.35}
@keyframes caller-breathe{from{opacity:0.6}to{opacity:0.9}}.caller-loop{animation:caller-breathe 7s linear infinite}
`;
await writeFile(path.join(output, "fixture.js"), browserBundle.outputFiles[0].contents);
await writeFile(path.join(output, "fixture.css"), css);
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
await writeFile(path.join(output, "fixture.jsx"), await readFile("tests/runtime/semantic-presence.jsx"));
for (const file of Object.keys(browserBundle.metafile.inputs)) report.inputs[file] = sha(await readFile(file));
if (consumerRoot)
  assert(
    !Object.keys(report.inputs).some((file) => file.replaceAll("\\", "/").startsWith("registry/cadence/")),
    "all shipped imports resolve to actual copied targets",
  );
report.hashes = { js: sha(browserBundle.outputFiles[0].contents), css: sha(css) };
const html = (state, hydrate = true) =>
  `<!doctype html><html class="${theme === "dark" ? "dark" : ""}"><head><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"></head><body><div id="root">${hydrate ? renderToString(React.createElement(Fixture, { initial: state })) : ""}</div><script>window.semanticInitial=${JSON.stringify(state)};window.semanticHydrate=${hydrate};window.semanticStrict=${environment === "development"};window.semanticFrames=[];requestAnimationFrame(function tick(){const n=document.querySelector('[data-document-entrance]');if(n){const s=getComputedStyle(n);window.semanticFrames.push({opacity:s.opacity,transform:s.transform,clip:s.clipPath});}requestAnimationFrame(tick);});</script><script src="/fixture.js"></script></body></html>`;
const server = http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/fixture.js") {
    response.setHeader("content-type", "text/javascript");
    response.end(browserBundle.outputFiles[0].contents);
  } else if (url.pathname === "/fixture.css") {
    response.setHeader("content-type", "text/css");
    response.end(css);
  } else {
    response.setHeader("content-type", "text/html");
    response.end(
      html(
        { ...initialState, ...JSON.parse(url.searchParams.get("state") ?? "{}") },
        url.searchParams.get("csr") !== "1",
      ),
    );
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge", headless: true });
report.resources = { pid: process.pid, ppid: process.ppid, origin, started: new Date().toISOString() };
try {
  report.resources.originalProcesses = JSON.parse(
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$all=Get-CimInstance Win32_Process; $ids=@(${process.pid}); do{$new=@($all|Where-Object{$_.ParentProcessId -in $ids -and $_.ProcessId -notin $ids});$ids+=$new.ProcessId}while($new.Count);$all|Where-Object{$_.ProcessId -in $ids}|Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine|ConvertTo-Json -Depth 4`,
      ],
      { encoding: "utf8" },
    ),
  );
} catch (error) {
  report.resources.bindingError = String(error);
}
await writeFile(path.join(output, "resource-binding.json"), JSON.stringify(report.resources, null, 2));
let context,
  page,
  label = "setup";
const check = async (name, run) => {
  if (report.filter && !name.includes(report.filter)) return;
  if (report.filterRegex && !new RegExp(report.filterRegex).test(name)) return;
  try {
    const evidence = await run();
    report.cases.push({ label, name, evidence });
  } catch (error) {
    report.failures.push({
      label,
      name,
      error: error.stack,
      diagnostic: await page
        .evaluate(() => ({
          state: window.semanticState,
          loop: window.loopBoundary,
          controls: window.semanticControlTrace,
        }))
        .catch(() => null),
    });
    await writeFile(path.join(output, `failure-${report.failures.length}.html`), await page.content());
  }
};
async function visit(state = {}, options = {}) {
  const { csr = false, capturePopups = false, ...browserOptions } = options;
  await context?.close();
  context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...browserOptions });
  page = await context.newPage();
  if (capturePopups)
    await page.addInitScript(() => {
      window.zeroPopupFrames = [];
      const sample = () => {
        for (const node of document.querySelectorAll(
          '[data-slot="dialog-content"],[data-slot="popover-content"],[data-slot="tooltip-content"]',
        )) {
          const css = getComputedStyle(node);
          window.zeroPopupFrames.push({
            slot: node.dataset.slot,
            opacity: css.opacity,
            scale: css.scale,
            animations: node.getAnimations().length,
            closed: node.hasAttribute("data-closed"),
          });
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  page.on("pageerror", (error) => report.errors.push({ label, error: error.stack }));
  await page.goto(`${origin}/?csr=${csr ? 1 : 0}&state=${encodeURIComponent(JSON.stringify(state))}`);
  await page.waitForFunction(() => window.semanticReady);
  report.reactVersion = await page.evaluate(() => window.semanticReactVersion);
  assert.equal(report.reactVersion, report.expectedReactVersion, "actual rendered React version");
  await frame(page, 3);
}
try {
  for (const os of ["no-preference", "reduce"])
    for (const mode of ["full", "reduced", "none"]) {
      const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
      label = `${mode}/${os}`;
      await visit({ mode }, { reducedMotion: os });
      await check("natural SSR hydration never hides first screen; real Calendar input is immediate", async () => {
        const first = await snapshot(page, "[data-document-entrance]");
        assert.equal(first.opacity, "1", "natural first-screen opacity must remain at the readable resting target");
        assert.equal(first.clip, "none");
        assert.equal(first.transform, "none");
        const frames = await page.evaluate(() => window.semanticFrames);
        assert(frames.length);
        assert(
          frames.every((sample) => sample.opacity === "1" && sample.clip === "none" && sample.transform === "none"),
          "natural first-screen geometry and opacity must stay readable through hydration",
        );
        await page.getByRole("button", { name: /next month/i }).click();
        assert.equal(await page.locator("table").getAttribute("aria-label"), "December 2026");
        assert.equal((await snapshot(page, "[data-document-entrance]")).active, true);
        return { first, frames };
      });
      await check("later insertion has one envelope and reduced retains short opacity", async () => {
        await patch(page, { showDoc: false });
        await patch(page, { showDoc: true, bubble: true });
        await frame(page);
        const article = await snapshot(page, "[data-document-entrance]"),
          bubble = await snapshot(page, '[data-probe="bubble"]');
        assert.equal(bubble.animations.length, 0, "same-cause child consumes the parent's entry only");
        if (effective === "none") assert.equal(article.animations.length, 0);
        else {
          assert(article.animations.some((animation) => animation.state === "running"));
          assert(Number(article.opacity) < 1);
          if (effective === "reduced") assert.equal(article.transform, "none");
        }
        return { article, bubble };
      });
      await check("early real focus settles its envelope without moving/delaying focus", async () => {
        const value = await page.locator('input[aria-label="Document editor"]').evaluate((input) => {
          input.focus();
          input.value = "native edit";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          const node = input.closest("[data-document-entrance]");
          return {
            focus: document.activeElement === input,
            opacity: getComputedStyle(node).opacity,
            transform: getComputedStyle(node).transform,
            value: input.value,
            animations: node.getAnimations().length,
          };
        });
        assert.deepEqual(value, { focus: true, opacity: "1", transform: "none", value: "native edit", animations: 0 });
        return value;
      });
      await check(
        "independent later child insertion remains eligible; pointer activation retains capture",
        async () => {
          await patch(page, { bubble: false });
          await patch(page, { bubble: true, entity: "B" });
          await frame(page);
          const bubble = await snapshot(page, '[data-probe="bubble"]');
          if (effective !== "none") assert(bubble.animations.length);
          await page.locator('[data-probe="native"]').click();
          const log = await page.evaluate(() => window.semanticLog);
          assert(log.some((entry) => entry[0] === "down"));
          assert(log.some((entry) => entry[0] === "up"));
          assert(log.some((entry) => entry[0] === "click"));
          return { bubble, log };
        },
      );
      await check("default popup presence and explicit colour share disjoint native properties", async () => {
        await patch(page, { dialog: true });
        await page.locator('[data-slot="dialog-content"]').waitFor();
        await frame(page, 3);
        const popup = await snapshot(page, '[data-slot="dialog-content"]');
        assert(popup.property.includes("background-color"), popup.property);
        if (effective !== "none") {
          assert(popup.property.includes("opacity"), popup.property);
          assert(
            popup.animations.some((animation) => animation.property === "opacity" && animation.state === "running"),
          );
          assert(Number(popup.opacity) < 1);
          if (effective === "full") assert(popup.animations.some((animation) => animation.property === "scale"));
        } else {
          assert.equal(popup.opacity, "1");
          assert.equal(popup.animations.length, 0);
        }
        await patch(page, { paint: true });
        await frame(page);
        const color = await snapshot(page, '[data-slot="dialog-content"]');
        if (effective !== "none")
          assert(color.animations.some((animation) => animation.property === "background-color"));
        else assert.equal(color.animations.length, 0);
        assert.equal((await snapshot(page, '[data-probe="nested-bubble"]')).animations.length, 0);
        return { popup, color };
      });
      await check(
        "native autofocus/focus instantly exposes panel and colour; independent backdrop continues",
        async () => {
          const before = await snapshot(page, '[data-slot="dialog-overlay"]');
          await page.locator('input[aria-label="Popup editor"]').evaluate((input) => input.focus());
          const panel = await snapshot(page, '[data-slot="dialog-content"]'),
            backdrop = await snapshot(page, '[data-slot="dialog-overlay"]');
          assert.equal(panel.opacity, "1");
          assert(["none", "1"].includes(panel.scale));
          assert.equal(panel.transform, "none");
          assert(Math.abs(panel.box.x + panel.box.width / 2 - 640) < 1, "dialog keeps centered native placement");
          assert(Math.abs(panel.box.y + panel.box.height / 2 - 450) < 1, "dialog keeps centered native placement");
          assert(panel.active);
          assert(
            !panel.animations.some((animation) =>
              ["opacity", "scale", "color", "background-color"].includes(animation.property),
            ),
          );
          if (effective !== "none" && before.animations.length)
            assert(backdrop.animations.length, "unrelated backdrop keeps its clock");
          return { panel, backdrop };
        },
      );
      await check(
        "exit/reopen invalidates obsolete completion; closing scope preserves external revision",
        async () => {
          await patch(page, { external: 160, dialog: false });
          await frame(page);
          const external = await snapshot(page, '[data-slot="external-value"]');
          if (effective === "full") assert(external.animations.length || external.transform !== "none");
          else assert.equal(external.animations.length, 0);
          await patch(page, { dialog: true });
          await frame(page, 3);
          await patch(page, { mode: "none" });
          await frame(page, 3);
          assert.equal(await page.getByRole("dialog").count(), 1);
          assert.equal(await page.getByRole("dialog").getAttribute("data-open"), "");
          await patch(page, { dialog: false });
          await page.locator('[data-slot="dialog-content"]').waitFor({ state: "detached" });
          return { external, events: await page.evaluate(() => window.semanticLog) };
        },
      );
      await check("Popover focus and Tooltip no-interaction envelope use native lifecycle", async () => {
        await patch(page, { mode, popover: true, tooltip: true });
        await page.locator('[data-slot="popover-content"]').waitFor();
        await page.getByRole("tooltip").waitFor();
        await frame(page, 3);
        await page.getByLabel("Popover editor").evaluate((input) => input.focus());
        const popup = await snapshot(page, '[data-slot="popover-content"]'),
          hint = await snapshot(page, '[data-slot="tooltip-content"]');
        assert.equal(popup.opacity, "1");
        assert(["none", "1"].includes(popup.scale));
        if (effective !== "none") assert(hint.animations.length || Number(hint.opacity) > 0);
        await patch(page, { popover: false, tooltip: false, clock: 0 });
        await page.getByRole("tooltip").waitFor({ state: "detached" });
        return { popup, hint };
      });
    }
  label = "native coordination";
  await check(
    "accepted targets preserve equal and batched renders and reverse only committed actions in all modes",
    async () => {
      const results = [];
      for (const mode of ["full", "reduced", "none"]) {
        await visit({ mode, clock: 8, showDoc: false, chart: false });
        await patch(page, { external: 160 });
        await frame(page, 3);
        const first = await snapshot(page, '[data-slot="external-value"]');
        await patch(page, { external: 160, paint: true });
        await page.evaluate(() => window.semanticBatch([{ external: 320 }, { external: 160 }]));
        await frame(page, 2);
        const equal = await snapshot(page, '[data-slot="external-value"]');
        const beforeReverse = await page.evaluate(() =>
          window.semanticControlTrace.filter((event) => event.kind === "start").map((event) => event.value.target.x),
        );
        assert.equal(beforeReverse.filter((value) => value === 320).length, 0, "uncommitted B has no action");
        assert.equal(beforeReverse.filter((value) => value === 160).length, mode === "full" ? 1 : 0);
        if (mode === "full") {
          const x = await page
            .locator('[data-slot="external-value"]')
            .evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
          assert(x > 0 && x < 160, "equal accepted targets retain the legal flight");
        } else assert.equal(equal.transform, "matrix(1, 0, 0, 1, 160, 0)");
        await patch(page, { external: 320 });
        await frame(page, 2);
        await patch(page, { external: 160 });
        await frame(page, 2);
        const afterReverse = await page.evaluate(() =>
          window.semanticControlTrace.filter((event) => event.kind === "start").map((event) => event.value.target.x),
        );
        assert.equal(afterReverse.filter((value) => value === 320).length, mode === "full" ? 1 : 0);
        assert.equal(afterReverse.filter((value) => value === 160).length, mode === "full" ? 2 : 0);
        await patch(page, { external: 80, mode: "none" });
        await frame(page, 2);
        assert.equal(
          (await snapshot(page, '[data-slot="external-value"]')).transform,
          "matrix(1, 0, 0, 1, 80, 0)",
          "a later accepted caller value is never discarded by request age",
        );
        results.push({ mode, first, equal, beforeReverse, afterReverse });
      }
      return results;
    },
  );
  for (const behavior of ["hold", "cancel", "replace", "accept"]) {
    await check(
      `Select accepted commit ${behavior} keeps request origins scoped to their real host and value`,
      async () => {
        const results = [];
        for (const mode of ["full", "reduced", "none"]) {
          await visit({
            selectControlled: true,
            selectBehavior: behavior,
            mode,
            clock: 8,
            chart: false,
            showDoc: false,
          });
          const trigger = page.getByRole("combobox", { name: "Flight framework" });
          await trigger.click();
          await page.getByRole("option", { name: "Remix", exact: true }).click();
          await frame(page, 2);
          const count = await page.locator('[data-slot="select-handoff"]').count();
          assert.equal(count, behavior === "accept" && mode === "full" ? 1 : 0);
          assert.equal(
            await trigger.locator('[data-slot="select-value"]').textContent(),
            ["hold", "cancel"].includes(behavior) ? "Next.js" : "Remix",
          );
          if (count) {
            await page.locator('[data-slot="select-handoff"]').evaluate((node) => {
              window.acceptedFlight = node;
            });
            await patch(page, { paint: true, selectValue: "remix" });
            await frame(page, 2);
            assert(
              await page.locator('[data-slot="select-handoff"]').evaluate((node) => node === window.acceptedFlight),
              "equal accepted value preserves its existing flight",
            );
          } else {
            await patch(page, { selectValue: "remix" });
            await frame(page, 2);
            assert.equal(
              await page.locator('[data-slot="select-handoff"]').count(),
              0,
              "unrelated later same-value commit has no old origin",
            );
            assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "Remix");
          }
          const requests = await page.evaluate(() =>
            window.semanticLog.filter((event) => event[0] === "select-request"),
          );
          assert.equal(requests.length, 1);
          results.push({ mode, count, requests });
        }
        return results;
      },
    );
  }
  for (const parent of ["full", "none"]) {
    await visit({ mode: parent, childMode: parent === "full" ? "none" : "full", showDoc: false, chart: false });
    await check(`owner-local ${parent} parent retains its envelope and nested policy`, async () => {
      await patch(page, { showDoc: true });
      await frame(page, 2);
      const parentEntry = await snapshot(page, "[data-document-entrance]");
      const childEntry = await snapshot(page, '[data-slot="local-value"]');
      assert.equal(parentEntry.animations.length > 0, parent === "full");
      assert.equal(childEntry.animations.length, 0);
      await patch(page, { external: 160 });
      await frame(page, 3);
      const childUpdate = await snapshot(page, '[data-slot="local-value"]');
      const parentUpdate = await snapshot(page, "[data-document-entrance]");
      if (parent === "full") {
        assert.equal(childUpdate.transform, "matrix(1, 0, 0, 1, 160, 0)");
        assert(parentUpdate.animations.some((animation) => animation.state === "running"));
      } else {
        assert.equal(parentUpdate.opacity, "1");
        assert.equal(parentUpdate.transform, "none");
        const x = await page
          .locator('[data-slot="local-value"]')
          .evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
        assert(x > 0 && x < 160);
      }
      return { parentEntry, childEntry, parentUpdate, childUpdate };
    });
  }
  await visit({ showDoc: false, chart: false });
  await check(
    "caller ref transfer keeps its action; committed scope and physical replacements establish fresh baselines",
    async () => {
      await patch(page, { external: 160 });
      await frame(page, 3);
      const moving = await snapshot(page, '[data-slot="external-value"]');
      assert.notEqual(moving.transform, "matrix(1, 0, 0, 1, 160, 0)");
      const boundary = await page.evaluate(() => {
        const node = document.querySelector('[data-slot="external-value"]');
        window.replacedRefNode = node;
        window.semanticPatch({ reference: 1 });
        return {
          sameDOM: node === document.querySelector('[data-slot="external-value"]'),
        };
      });
      await frame(page);
      const replacement = await snapshot(page, '[data-slot="external-value"]');
      assert(boundary.sameDOM);
      const positions = await page.evaluate(() => ({
        current: new DOMMatrixReadOnly(getComputedStyle(window.replacedRefNode).transform).m41,
        starts: window.semanticControlTrace.filter((event) => event.kind === "start" && event.value.target.x === 160)
          .length,
      }));
      assert(
        positions.current > 0 && positions.current < 160,
        "ordinary observer ref replacement must not settle a valid action",
      );
      assert.equal(positions.starts, 1, "ordinary observer ref replacement must not restart the action");
      const transferred = await page.evaluate(() =>
        window.semanticLog.filter((event) => event[1] === "external-value"),
      );
      const transfers = transferred.slice(
        transferred.findLastIndex((event) => event[0] === "value-ref" && event[2] === 0) + 1,
      );
      assert.deepEqual(transfers, [
        ["value-ref-cleanup", "external-value", 0],
        ["value-ref", "external-value", 1, "DIV"],
      ]);
      await patch(page, { external: 320 });
      await frame(page, 2);
      const next = await snapshot(page, '[data-slot="external-value"]');
      assert.notEqual(next.transform, "matrix(1, 0, 0, 1, 320, 0)");
      assert.equal(
        await page.evaluate(() => document.querySelector('[data-slot="external-value"]') === window.replacedRefNode),
        true,
      );
      await patch(page, { paint: true });
      await frame(page);
      const ordinary = await snapshot(page, '[data-slot="external-value"]');
      assert.equal(
        await page.evaluate(
          () =>
            window.semanticLog.filter(
              (event) => event[0] === "value-ref" && event[1] === "external-value" && event[2] === 1,
            ).length,
        ),
        1,
        "ordinary render retains the ref lifetime",
      );
      await patch(page, { controlScope: 1 });
      await frame(page);
      const scoped = await snapshot(page, '[data-slot="external-value"]');
      assert.equal(
        scoped.transform,
        "matrix(1, 0, 0, 1, 320, 0)",
        "a new committed semantic owner establishes its actual baseline",
      );
      assert.equal(
        await page.evaluate(() => document.querySelector('[data-slot="external-value"]') === window.replacedRefNode),
        true,
      );
      const retiredPaint = await page.evaluate(() => {
        window.semanticPatch({ controlEntity: 1 });
        return window.replacedRefNode.style.transform;
      });
      await frame(page, 3);
      const newEntity = await snapshot(page, '[data-slot="external-value"]');
      const retired = await page.evaluate(() => ({
        connected: window.replacedRefNode.isConnected,
        paint: window.replacedRefNode.style.transform,
        same: document.querySelector('[data-slot="external-value"]') === window.replacedRefNode,
      }));
      assert.deepEqual(retired, { connected: false, paint: retiredPaint, same: false });
      assert.equal(newEntity.transform, "matrix(1, 0, 0, 1, 320, 0)");
      await patch(page, { external: 480 });
      await frame(page, 2);
      const nextEntity = await snapshot(page, '[data-slot="external-value"]');
      assert.notEqual(nextEntity.transform, "matrix(1, 0, 0, 1, 480, 0)");
      return {
        moving,
        boundary,
        replacement,
        next,
        ordinary,
        positions,
        scoped,
        retired,
        newEntity,
        nextEntity,
        events: await page.evaluate(() => window.semanticLog),
      };
    },
  );
  await visit({ showDoc: false, chart: false, inlineRef: true, persist: true, clock: 8 });
  await check("inline popup refs hand off during native entry and exit without replacing either writer", async () => {
    await patch(page, { dialog: true });
    await frame(page, 2);
    const entry = await page.locator('[role="dialog"]').evaluate((node) => {
      window.inlinePopup = node;
      window.inlineEntry = node.getAnimations().find((animation) => animation.transitionProperty === "opacity");
      return { state: window.inlineEntry?.playState, opacity: getComputedStyle(node).opacity };
    });
    assert.equal(entry.state, "running");
    assert(Number(entry.opacity) > 0 && Number(entry.opacity) < 1);
    await patch(page, { text: "Entry observer" });
    await frame(page, 2);
    assert(
      await page.evaluate(
        () =>
          window.inlinePopup === document.querySelector('[role="dialog"]') &&
          window.inlinePopup.getAnimations().includes(window.inlineEntry) &&
          window.inlineEntry.playState === "running",
      ),
    );
    await page.evaluate(async () => {
      await Promise.all(window.inlinePopup.getAnimations().map((animation) => animation.finished));
    });
    await page.getByRole("button", { name: "Close dialog", exact: true }).evaluate((node) => node.click());
    await frame(page, 2);
    const exit = await page.evaluate(() => {
      window.inlineExit = window.inlinePopup
        .getAnimations()
        .find((animation) => animation.transitionProperty === "opacity");
      return { state: window.inlineExit?.playState, closed: window.inlinePopup.hasAttribute("data-closed") };
    });
    assert.equal(exit.state, "running");
    assert(exit.closed);
    await patch(page, { text: "Exit observer" });
    await frame(page, 2);
    assert(
      await page.evaluate(
        () =>
          window.inlinePopup === document.querySelector('[role="dialog"]') &&
          window.inlinePopup.getAnimations().includes(window.inlineExit) &&
          window.inlineExit.playState === "running",
      ),
    );
    const refs = await page.evaluate(() => window.semanticLog.filter((event) => event[0].startsWith("popup-ref")));
    for (const value of ["Entry observer", "Exit observer"])
      assert(refs.some((event) => event[0] === "popup-ref" && event[1] === value && event[2] === "DIV"));
    assert(refs.some((event) => event[0] === "popup-ref-cleanup" && event[1] === "Entry observer"));
    await patch(page, { mode: "none" });
    await frame(page, 2);
    assert(
      await page.evaluate(() => window.inlinePopup.isConnected && getComputedStyle(window.inlinePopup).opacity === "0"),
    );
    return { entry, exit, refs };
  });
  const retainedPaint = () =>
    page.locator('[role="dialog"]').evaluate((node) => {
      const css = getComputedStyle(node),
        box = node.getBoundingClientRect();
      return {
        connected: node.isConnected,
        closed: node.hasAttribute("data-closed"),
        opacity: css.opacity,
        visibility: css.visibility,
        display: css.display,
        pointerEvents: css.pointerEvents,
        duration: css.transitionDuration,
        delay: css.transitionDelay,
        hit: node.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)),
        animations: node.getAnimations().filter((animation) => animation.playState === "running").length,
      };
    });
  await visit({ nativeDialog: true, dialog: true, persist: true, showDoc: false, chart: false });
  await page.evaluate(async () => {
    await Promise.all(
      document
        .querySelector('[role="dialog"]')
        .getAnimations()
        .map((animation) => animation.finished),
    );
  });
  await page.getByRole("button", { name: "Close dialog", exact: true }).evaluate((node) => node.click());
  await page.evaluate(async () => {
    await Promise.all(
      document
        .querySelector('[role="dialog"]')
        .getAnimations()
        .map((animation) => animation.finished),
    );
  });
  const nativeRetainedPaint = await retainedPaint();
  for (const policy of ["none", "zero"])
    for (const boundary of ["initial", "closing", "closed"]) {
      const immediate = policy === "none" ? { mode: "none" } : { clock: 0 };
      await visit({
        dialog: boundary !== "initial",
        persist: true,
        showDoc: false,
        chart: false,
        ...(boundary === "initial" ? immediate : { clock: 8 }),
      });
      await check(
        `retained popup ${policy} at ${boundary} preserves native closed paint and completion ownership`,
        async () => {
          if (boundary === "initial") {
            await patch(page, { dialog: true });
            await frame(page, 2);
            const opened = await snapshot(page, '[role="dialog"]');
            assert.equal(opened.opacity, "1");
            assert.equal(opened.animations.length, 0);
          } else
            await page.evaluate(async () => {
              await Promise.all(
                document
                  .querySelector('[role="dialog"]')
                  .getAnimations()
                  .map((animation) => animation.finished),
              );
            });
          await page.getByRole("button", { name: "Close dialog", exact: true }).evaluate((node) => node.click());
          if (boundary === "closed")
            await page.evaluate(async () => {
              await Promise.all(
                document
                  .querySelector('[role="dialog"]')
                  .getAnimations()
                  .map((animation) => animation.finished),
              );
            });
          else await frame(page, 2);
          await patch(page, immediate);
          await frame(page, 2);
          const closed = await retainedPaint();
          assert.equal(closed.connected, true);
          assert.equal(closed.closed, true);
          assert.equal(closed.opacity, "0");
          assert.equal(closed.animations, 0);
          assert(closed.duration.split(",").every((value) => Number.parseFloat(value) === 0));
          assert(closed.delay.split(",").every((value) => Number.parseFloat(value) === 0));
          assert.equal(closed.hit, nativeRetainedPaint.hit, "preserve actual native retention hit behavior");
          assert.equal(
            await page.evaluate(
              () => window.semanticLog.filter((event) => event[0] === "dialog-complete" && event[1] === false).length,
            ),
            0,
          );
          await page.evaluate(() => window.semanticUnmountPopup());
          await page.getByRole("dialog").waitFor({ state: "detached" });
          assert.equal(
            await page.evaluate(
              () => window.semanticLog.filter((event) => event[0] === "dialog-complete" && event[1] === false).length,
            ),
            1,
          );
          return {
            closed,
            native: nativeRetainedPaint,
            events: await page.evaluate(() => window.semanticLog.filter((event) => event[0].startsWith("dialog-"))),
          };
        },
      );
    }
  await visit({ clock: 0, dialog: true, popover: true, tooltip: true, chart: false }, { capturePopups: true });
  await check(
    "default zero-clock popup first paints are natural and native close completes before the next paint",
    async () => {
      const frames = await page.evaluate(() => window.zeroPopupFrames);
      for (const slot of ["dialog-content", "popover-content", "tooltip-content"]) {
        const paints = frames.filter((frame) => frame.slot === slot && !frame.closed);
        assert(paints.length, `missing native zero-clock first paint for ${slot}`);
        assert(
          paints.every(
            (frame) => frame.opacity === "1" && ["none", "1"].includes(frame.scale) && frame.animations === 0,
          ),
        );
      }
      await patch(page, { dialog: false, popover: false, tooltip: false });
      await frame(page, 1);
      const remaining = await page
        .locator('[data-slot="dialog-content"],[data-slot="popover-content"],[data-slot="tooltip-content"]')
        .count();
      assert.equal(remaining, 0);
      return { frames, remaining, events: await page.evaluate(() => window.semanticLog) };
    },
  );
  await visit({ clock: 8 });
  await check("real Select pointer handoff paints pseudo text with one accessible/copyable current label", async () => {
    const copyPage = () =>
      page.evaluate(() => {
        const range = document.createRange();
        range.selectNodeContents(document.body);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        const text = selection.toString();
        selection.removeAllRanges();
        return text;
      });
    await visit({ mode: "none", clock: 0 });
    await page.getByRole("combobox", { name: "Flight framework" }).click();
    await page.getByRole("option", { name: "Remix", exact: true }).click();
    await page.getByRole("listbox").waitFor({ state: "detached" });
    const defaultStatic = await copyPage();
    assert.equal(defaultStatic.match(/Remix/g)?.length ?? 0, 0, "default native trigger is select-none");
    await visit({ clock: 8 });
    const trigger = page.getByRole("combobox", { name: "Flight framework" });
    await trigger.click();
    await page.getByRole("option", { name: "Remix", exact: true }).click();
    const flight = page.locator('[data-slot="select-handoff"]');
    await flight.waitFor({ state: "attached" });
    const painted = await flight.evaluate((node) => ({
      text: node.textContent,
      attr: node.getAttribute("data-cadence-flight-text"),
      pseudo: getComputedStyle(node, "::before").content,
      hidden: node.getAttribute("aria-hidden"),
      select: getComputedStyle(node).userSelect,
    }));
    assert.deepEqual(painted, { text: "", attr: "Remix", pseudo: '"Remix"', hidden: "true", select: "none" });
    assert.equal(await trigger.locator('[data-slot="select-value"]').textContent(), "Remix");
    await page.getByRole("listbox").waitFor({ state: "detached" });
    const defaultAnimated = await copyPage();
    assert.equal(defaultAnimated, defaultStatic, "default animation adds no selectable duplicate");
    const accessible = await trigger.ariaSnapshot();
    assert.equal(accessible.match(/Remix/g)?.length, 1);
    await visit({ clock: 8, copyable: true });
    await page.getByRole("combobox", { name: "Flight framework" }).click();
    await page.getByRole("option", { name: "Remix", exact: true }).click();
    await page.locator('[data-slot="select-handoff"]').waitFor({ state: "attached" });
    await page.getByRole("listbox").waitFor({ state: "detached" });
    const copied = await copyPage();
    assert.equal(copied.match(/Remix/g)?.length, 1, JSON.stringify(copied));
    return {
      painted,
      defaultStatic,
      defaultAnimated,
      copied,
      accessible,
      callerOverride: 'SelectTrigger className="select-text"',
    };
  });
  const chartGeometry = () =>
    page
      .locator(".recharts-line-curve")
      .evaluateAll((nodes) =>
        nodes.map((n) => ({ d: n.getAttribute("d"), dash: getComputedStyle(n).strokeDasharray })),
      );
  await visit({ nativeChart: true, fixedAxes: true, samples: 40, series: 2, secondSamples: 240, showDoc: false });
  await check("Chart counts unchanged-data series when real native geometry handles participate", async () => {
    const nativeRecords = () =>
      page.evaluate(() =>
        window.semanticNativeControllers.map(({ getState, ...item }) => ({ ...item, state: getState() })),
      );
    const waitNativeTarget = () =>
      page.waitForFunction(() => {
        const current = window.semanticNativeControllers?.filter((item) => !item.retired);
        return current?.length && current.every((item) => item.getState() === "completed" && item.updates.at(-1) === 1);
      });
    await waitNativeTarget();
    const before = await page.evaluate(() => {
      window.staticSeriesData = window.semanticChartData.b;
      return window.semanticNativeControllers.map(({ getState, ...item }) => ({ ...item, state: getState() }));
    });
    const geometry = await chartGeometry();
    await patch(page, { data: 1 });
    await frame(page, 5);
    const after = await nativeRecords();
    const participants = after.slice(before.length);
    assert.deepEqual([...new Set(participants.map((item) => item.series))].sort(), ["a", "b"]);
    for (const series of ["a", "b"])
      assert(
        participants.some(
          (item) => item.series === series && !item.retired && item.updates.some((value) => value > 0 && value < 1),
        ),
      );
    assert(await page.evaluate(() => window.staticSeriesData === window.semanticChartData.b));
    await waitNativeTarget();
    const terminal = await nativeRecords();
    assert(
      terminal.filter((item) => !item.retired).every((item) => item.state === "completed" && item.updates.at(-1) === 1),
    );
    assert(
      terminal
        .filter((item) => item.retired)
        .every((item) => item.lateUpdates === 0 && item.updates.length === item.retiredUpdates),
    );
    const finalGeometry = await chartGeometry();
    await patch(page, { optOut: true });
    await frame(page, 3);
    const nativeTerminal = await chartGeometry();
    assert.deepEqual(finalGeometry, nativeTerminal);
    assert(nativeTerminal.length === 2 && nativeTerminal.every((part) => part.d?.length > 10));
    return {
      before,
      after,
      terminal,
      finalGeometry,
      nativeTerminal,
      geometry,
      updatedGeometry: await chartGeometry(),
      unchangedDataIdentity: true,
      fixedAxes: true,
    };
  });
  await visit({ samples: 40, series: 1, data: 1, opaqueSeries: true, optOut: true, showDoc: false });
  const opaqueTerminal = await chartGeometry();
  await visit({ samples: 40, series: 1, opaqueSeries: true, clock: 8, showDoc: false });
  await check("Chart unknown caller wrapper settles exact native data without a zero-work loop", async () => {
    await patch(page, { data: 1 });
    await frame(page, 4);
    const geometry = await chartGeometry();
    assert(opaqueTerminal[0]?.d?.length > 10);
    assert.deepEqual(geometry, opaqueTerminal);
    const controllers = await page.evaluate(() =>
      window.w2controllers.map((item) => ({
        phase: item.phase,
        state: item.state,
        ticks: item.ticks,
        updates: item.updates,
      })),
    );
    assert(controllers.length > 0);
    assert(controllers.every((item) => item.phase === null && item.state === "finished" && item.ticks.length === 0));
    return {
      geometry,
      native: opaqueTerminal,
      controllers,
      renders: await page.evaluate(() => window.semanticLog.filter((item) => item[0] === "opaque-render")),
    };
  });
  await visit({ samples: 120, series: 2, secondSamples: 100, data: 1, optOut: true, clock: 8 });
  const nativeOverflow = await chartGeometry();
  assert.equal(nativeOverflow.length, 2);
  assert(nativeOverflow.every((part) => part.d?.length > 10));
  await visit({ samples: 120, series: 1, clock: 8 });
  await check(
    "Chart adding a real series over live sample budget settles every series to native nonempty terminal geometry",
    async () => {
      await patch(page, { data: 1 });
      await frame(page, 4);
      const middle = await page.evaluate(() =>
        window.w2controllers.filter((c) => c.state === "running").map((c) => c.phase.progress),
      );
      assert(middle.some((p) => p > 0 && p < 1));
      await patch(page, { series: 2, secondSamples: 100 });
      await frame(page, 4);
      const final = await chartGeometry();
      assert.deepEqual(final, nativeOverflow);
      const active = await page.evaluate(() =>
        window.w2controllers.filter((c) => c.state === "running").map((c) => c.phase.progress),
      );
      assert.equal(active.length, 0);
      return { middle, final, native: nativeOverflow, active };
    },
  );
  await visit({ showDoc: false, clock: 8 }, { csr: true });
  await check("first CSR is natural; standalone and independent roots use committed document baseline", async () => {
    await page.evaluate(() => window.semanticStandalone("first"));
    await frame(page, 3);
    const first = await snapshot(page, '[data-standalone="first"] [data-slot="bubble"]');
    assert.equal(first.opacity, "1");
    assert.equal(first.animations.length, 0);
    await page.evaluate(() => window.semanticStandalone("second"));
    await frame(page);
    const second = await snapshot(page, '[data-standalone="second"] [data-slot="bubble"]');
    assert(second.animations.some((a) => a.state === "running"));
    await page.evaluate(() => window.semanticStandalone("first", false));
    await page.evaluate(() => window.semanticStandalone("first"));
    await frame(page);
    const inserted = await snapshot(page, '[data-standalone="first"] [data-slot="bubble"]');
    assert(inserted.animations.length);
    return { first, second, inserted };
  });
  await visit({ showDoc: false, clock: 8 });
  await check(
    "real input autofocus and Base UI default initialFocus expose current ancestors on insertion",
    async () => {
      await patch(page, { showDoc: true, autofocus: true });
      const article = await snapshot(page, "[data-document-entrance]");
      assert(article.active);
      assert.equal(article.opacity, "1");
      assert.equal(article.animations.length, 0);
      await patch(page, { dialog: true });
      await page.waitForFunction(() =>
        document.querySelector('[data-slot="dialog-content"]')?.contains(document.activeElement),
      );
      const popup = await snapshot(page, '[data-slot="dialog-content"]');
      assert(popup.active);
      assert.equal(popup.opacity, "1");
      assert(["none", "1"].includes(popup.scale));
      assert(!popup.animations.some((a) => ["opacity", "scale"].includes(a.property)));
      return { article, popup };
    },
  );
  await visit({ showDoc: false, clock: 8 });
  await check("native beforematch and selection settle only the matching later document", async () => {
    await patch(page, { showDoc: true });
    await frame(page);
    assert((await snapshot(page, "[data-document-entrance]")).animations.length);
    await page
      .locator("#find-target")
      .evaluate((node) => node.dispatchEvent(new Event("beforematch", { bubbles: true })));
    const matched = await snapshot(page, "[data-document-entrance]");
    assert.equal(matched.opacity, "1");
    assert.equal(matched.animations.length, 0);
    await patch(page, { showDoc: false });
    await patch(page, { showDoc: true });
    await frame(page);
    await page.locator("#find-target").evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
    });
    await frame(page);
    const selected = await snapshot(page, "[data-document-entrance]");
    assert.equal(selected.opacity, "1");
    assert.equal(selected.animations.length, 0);
    return {
      matched,
      selected,
      mechanism:
        "explicit native beforematch event plus real DOM Selection; browser UI search is a separate live audit",
    };
  });
  await visit({ showDoc: false, clock: 8 });
  await check("native finished promise queued before replacement cannot finish the new entrance", async () => {
    await patch(page, { showDoc: true });
    await frame(page);
    const boundary = await page.evaluate(() => {
      const old = document.querySelector("[data-document-entrance]");
      const animation = old.getAnimations()[0];
      if (!animation) throw new Error("Expected native running entrance");
      animation.finish();
      window.semanticPatch({ showDoc: false });
      window.semanticPatch({ showDoc: true });
      return { oldConnected: old.isConnected, oldState: animation.playState };
    });
    await frame(page);
    const replacement = await snapshot(page, "[data-document-entrance]");
    assert.equal(boundary.oldConnected, false);
    assert(replacement.animations.some((a) => a.state === "running"));
    assert(Number(replacement.opacity) < 1);
    return { boundary, replacement };
  });
  await visit({ dialog: false, persist: true, clock: 8 });
  await check(
    "quick exit reversal retains node and commits the current child target without unrelated render",
    async () => {
      await patch(page, { dialog: true });
      await frame(page, 3);
      await page.evaluate(() => {
        window.keptPopup = document.querySelector('[data-slot="dialog-content"]');
      });
      await patch(page, { external: 120 });
      await frame(page, 3);
      const moving = await snapshot(page, '[data-slot="independent-child"]');
      await patch(page, { dialog: false });
      await patch(page, { external: 240 });
      await patch(page, { dialog: true });
      await frame(page);
      const reopened = await snapshot(page, '[data-slot="independent-child"]');
      assert.equal(
        await page.evaluate(() => document.querySelector('[data-slot="dialog-content"]') === window.keptPopup),
        true,
      );
      assert.equal(reopened.transform, "matrix(1, 0, 0, 1, 240, 0)");
      assert.equal(reopened.animations.length, 0);
      await patch(page, { external: 300 });
      await frame(page, 3);
      const next = await snapshot(page, '[data-slot="independent-child"]');
      assert.notEqual(next.transform, "matrix(1, 0, 0, 1, 300, 0)");
      await patch(page, { clock: 0, dialog: false });
      await page.evaluate(() => window.semanticUnmountPopup());
      await page.locator('[data-slot="dialog-content"]').waitFor({ state: "detached" });
      return { moving, reopened, next };
    },
  );
  await visit({ showDoc: false, clock: 8 });
  await check(
    "real Close preventUnmountOnClose finishes native exit, retains hidden node and reopens at latest child target",
    async () => {
      await patch(page, { dialog: true, persist: true, clock: 0.5 });
      await page.getByRole("button", { name: "Close dialog", exact: true }).waitFor();
      await page.evaluate(() => {
        window.persistedPopup = document.querySelector('[data-slot="dialog-content"]');
      });
      await page.getByRole("button", { name: "Close dialog", exact: true }).click();
      await page.waitForFunction(() => window.semanticLog.some((event) => event[0] === "dialog-prevent-unmount"));
      await page.waitForFunction(() => {
        const node = window.persistedPopup;
        return (
          node?.hasAttribute("data-closed") &&
          getComputedStyle(node).opacity === "0" &&
          node
            .getAnimations({ subtree: true })
            .every((animation) => animation.playState !== "running" && animation.playState !== "pending")
        );
      });
      const closed = await page.evaluate(() => {
        const n = window.persistedPopup;
        return {
          connected: n.isConnected,
          closed: n.hasAttribute("data-closed"),
          opacity: getComputedStyle(n).opacity,
          events: window.semanticLog,
        };
      });
      assert(closed.connected && closed.closed);
      assert.equal(closed.opacity, "0");
      const prevented = closed.events.findIndex((e) => e[0] === "dialog-prevent-unmount");
      const completed = closed.events.findIndex((e) => e[0] === "dialog-complete" && e[1] === false);
      assert(prevented >= 0);
      assert.equal(
        completed,
        -1,
        "resolved Base UI defers close completion until actions unmount when retention is requested",
      );
      await patch(page, { external: 240 });
      await patch(page, { dialog: true });
      const first = await page.locator('[data-slot="independent-child"]').evaluate(async (n) => {
        await new Promise(requestAnimationFrame);
        return {
          transform: getComputedStyle(n).transform,
          animations: n.getAnimations().length,
          same: n.closest('[data-slot="dialog-content"]') === window.persistedPopup,
        };
      });
      assert.deepEqual(first, { transform: "matrix(1, 0, 0, 1, 240, 0)", animations: 0, same: true });
      await patch(page, { clock: 8, external: 320 });
      await frame(page, 2);
      const next = await snapshot(page, '[data-slot="independent-child"]');
      assert.notEqual(next.transform, "matrix(1, 0, 0, 1, 320, 0)");
      await patch(page, { clock: 0 });
      await page.getByRole("button", { name: "Close dialog", exact: true }).click();
      await page.evaluate(() => window.semanticUnmountPopup());
      await page.locator('[data-slot="dialog-content"]').waitFor({ state: "detached" });
      const events = await page.evaluate(() => window.semanticLog);
      assert.equal(events.filter((e) => e[0] === "dialog-complete" && e[1] === false).length, 1);
      assert(events.findIndex((e) => e[0] === "dialog-complete" && e[1] === false) > prevented);
      return {
        closed,
        first,
        next,
        events,
        completionProtocol:
          "Resolved Base UI native retention defers onOpenChangeComplete(false) until actionsRef.unmount; no synthesized completion",
      };
    },
  );
  await visit({ showDoc: false, nativeDialog: true, clock: 0.5 });
  await check("unwrapped resolved Base UI confirms retained-close callback ordering", async () => {
    await patch(page, { dialog: true, persist: true });
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
    await page.waitForFunction(() => {
      const node = document.querySelector(".native-dialog");
      return (
        node?.hasAttribute("data-closed") &&
        getComputedStyle(node).opacity === "0" &&
        node.getAnimations().every((a) => a.playState !== "running")
      );
    });
    const retained = await snapshot(page, ".native-dialog");
    const before = await page.evaluate(() => window.semanticLog);
    assert(before.some((e) => e[0] === "dialog-prevent-unmount"));
    assert.equal(before.filter((e) => e[0] === "dialog-complete" && e[1] === false).length, 0);
    await page.evaluate(() => window.semanticUnmountPopup());
    await page.locator(".native-dialog").waitFor({ state: "detached" });
    const after = await page.evaluate(() => window.semanticLog);
    assert.equal(after.filter((e) => e[0] === "dialog-complete" && e[1] === false).length, 1);
    return { retained, before, after, nativeLifecycle: report.nativeLifecycle };
  });
  await visit({ showDoc: false, clock: 8 });
  await check(
    "live reduced preserves a short opacity remnant, zero settles, restoring full never replays",
    async () => {
      await patch(page, { showDoc: true });
      await frame(page, 3);
      const moving = await snapshot(page, "[data-document-entrance]");
      assert(moving.transform !== "none");
      await patch(page, { mode: "reduced" });
      await frame(page);
      const reduced = await snapshot(page, "[data-document-entrance]");
      assert.equal(reduced.transform, "none");
      assert(reduced.animations.length);
      assert(Number(reduced.opacity) < 1);
      await patch(page, { clock: 0 });
      const zero = await snapshot(page, "[data-document-entrance]");
      assert.equal(zero.opacity, "1");
      assert.equal(zero.animations.length, 0);
      await patch(page, { mode: "full", clock: 8 });
      await frame(page);
      assert.equal((await snapshot(page, "[data-document-entrance]")).animations.length, 0);
      return { moving, reduced, zero };
    },
  );
  await check(
    "same ref with actual tag replacement retires old animation/listeners and preserves caller resting opacity",
    async () => {
      await patch(page, { showDoc: false });
      await patch(page, { showDoc: true });
      await frame(page);
      await page.evaluate(() => {
        window.retiredArticle = document.querySelector("[data-document-entrance]");
        window.retiredAnimation = window.retiredArticle.getAnimations()[0];
        if (!window.retiredAnimation) throw new Error("Missing native old animation");
      });
      await patch(page, { tag: "section" });
      await frame(page);
      const retired = await page.evaluate(() => ({
        connected: window.retiredArticle.isConnected,
        animations: window.retiredArticle.getAnimations().length,
        oldState: window.retiredAnimation.playState,
      }));
      assert.deepEqual(
        retired,
        { connected: false, animations: 0, oldState: "idle" },
        "retired native entrance must be cancelled before same-ref replacement",
      );
      await page.locator("[data-document-entrance]").evaluate((node) => {
        node.style.opacity = "0.35";
        node.querySelector("input").focus();
      });
      const replacement = await snapshot(page, "[data-document-entrance]");
      assert.equal(replacement.opacity, "0.35");
      assert(replacement.active);
      return { retired, replacement };
    },
  );
  await visit({ samples: 120, series: 2, data: 1, optOut: true });
  const allOverflowTerminal = await chartGeometry();
  await visit({ samples: 40, series: 2, clock: 8 });
  await check(
    "aggregate native Chart samples overflow settles all series without a queue or data omission",
    async () => {
      await patch(page, { data: 1, samples: 120, series: 2 });
      await frame(page, 4);
      const over = await page.evaluate(() => ({
        controllers: window.w2controllers?.map((item) => ({
          phase: item.phase,
          updates: item.updates,
          state: item.state,
        })),
        points: document.querySelectorAll(".recharts-line-curve").length,
        events: window.semanticLog,
      }));
      assert.equal(over.points, 2);
      assert.deepEqual(await chartGeometry(), allOverflowTerminal);
      assert.equal(over.controllers?.length ?? 0, 0, "preflight rejects before native animation controller allocation");
      await patch(page, { samples: 40, data: 2 });
      await frame(page, 4);
      const moving = await page.evaluate(() =>
        window.w2controllers
          .filter((item) => item.state === "running")
          .map((item) => ({ progress: item.phase.progress, work: item.phase.work })),
      );
      assert(moving.some((item) => item.progress > 0 && item.progress < 1));
      await patch(page, { mode: "none" });
      await frame(page);
      const terminal = await page.evaluate(() => window.w2controllers.slice(-2).map((item) => item.phase.progress));
      assert(terminal.every((value) => value === 1));
      return { over, moving, terminal };
    },
  );
  await check("unknown caller family is retained without a wrapper", async () => {
    const results = [];
    for (const callback of [false, true])
      for (const nativeDialog of [false, true]) {
        const custom = {
          caller: !callback,
          callbackClass: callback,
          callbackStyle: callback,
          callbackFamily: callback,
        };
        await visit({ dialog: true, mode: "full", ...custom, paint: false, nativeDialog });
        await frame(page, 3);
        const native = await snapshot(page, '[role="dialog"]');
        assert.equal(native.property, "all");
        assert.equal(native.duration, "7s");
        await patch(page, { paint: true });
        await frame(page, 2);
        await page.evaluate(() => {
          const node = document.querySelector('[role="dialog"]');
          window.callerPopup = node;
          window.callerAnimation = node.getAnimations().find((a) => a.transitionProperty === "background-color");
          if (!window.callerAnimation) throw new Error("Missing native caller transition");
        });
        const policies = [];
        for (const next of [{ mode: "reduced" }, { mode: "none" }, { mode: "full", clock: 0 }, { clock: 8 }]) {
          await patch(page, next);
          await frame(page, 2);
          const policy = await snapshot(page, '[role="dialog"]');
          assert.equal(policy.property, "all");
          assert.equal(policy.duration, "7s");
          assert.equal(policy.delay, "0.2s");
          assert.equal(
            await page.evaluate(() => window.callerPopup.getAnimations().includes(window.callerAnimation)),
            true,
          );
          policies.push(policy);
        }
        await patch(page, { dialog: false });
        await frame(page);
        await patch(page, { dialog: true });
        await frame(page);
        assert.equal(await page.evaluate(() => document.querySelector('[role="dialog"]') === window.callerPopup), true);
        assert.equal(
          await page.evaluate(() => window.callerPopup.getAnimations().includes(window.callerAnimation)),
          true,
        );
        await patch(page, { dialog: false });
        await page.evaluate(() => window.semanticUnmountPopup());
        await page.locator('[role="dialog"]').waitFor({ state: "detached" });
        await visit({ mode: "none", ...custom, dialog: true, nativeDialog });
        const initialNone = await snapshot(page, '[role="dialog"]');
        assert.equal(initialNone.property, "all");
        assert.equal(initialNone.duration, "7s");
        assert.equal(initialNone.opacity, "1");
        results.push({ nativeDialog, callback, native, policies, initialNone });
      }
    return results;
  });
  await check(
    "same-property same-duration caller linear curve survives focus and every mode like native Base UI",
    async () => {
      const results = [];
      for (const nativeDialog of [false, true]) {
        await visit({ dialog: true, callerCurve: true, clock: 8, nativeDialog });
        await page.waitForFunction(
          () =>
            !document
              .querySelector('[role="dialog"]')
              .getAnimations()
              .some((a) => a.transitionProperty === "opacity" && a.playState === "running"),
        );
        await patch(page, { paint: true });
        await frame(page, 2);
        const clock = await page.evaluate(() => {
          const n = document.querySelector('[role="dialog"]');
          window.callerCurveAnimation = n.getAnimations().find((a) => a.transitionProperty === "opacity");
          if (!window.callerCurveAnimation) throw new Error("Expected native opacity transition");
          return {
            duration: window.callerCurveAnimation.effect.getTiming().duration,
            easing: window.callerCurveAnimation.effect.getTiming().easing,
          };
        });
        assert.deepEqual(clock, { duration: 1760, easing: "linear" });
        await page.getByLabel("Popup editor").evaluate((n) => n.focus());
        const policies = [];
        for (const next of [{ mode: "reduced" }, { mode: "none" }, { mode: "full", clock: 0 }, { clock: 8 }]) {
          await patch(page, next);
          await frame(page);
          assert.equal(
            await page.evaluate(() =>
              document.querySelector('[role="dialog"]').getAnimations().includes(window.callerCurveAnimation),
            ),
            true,
          );
          policies.push(await snapshot(page, '[role="dialog"]'));
        }
        results.push({ nativeDialog, clock, policies });
      }
      return results;
    },
  );
  await visit({ fine: true, clock: 1 });
  await check(
    "fine decimal duration and easing tokens still own default presence with ordinary custom paint class",
    async () => {
      await patch(page, { dialog: true });
      await frame(page, 3);
      const before = await snapshot(page, '[data-slot="dialog-content"]');
      assert(before.animations.some((a) => a.property === "opacity" && a.state === "running"));
      await page.getByLabel("Popup editor").evaluate((n) => n.focus());
      const settled = await snapshot(page, '[data-slot="dialog-content"]');
      assert.equal(settled.opacity, "1");
      assert.equal(settled.animations.length, 0);
      return { before, settled };
    },
  );
  await visit({ callbackClass: true, callbackStyle: true, clock: 8 });
  await check(
    "ordinary Base UI className and style callbacks retain default presence and explicit colour",
    async () => {
      await patch(page, { dialog: true });
      await frame(page, 3);
      const before = await snapshot(page, '[data-slot="dialog-content"]');
      assert(before.animations.some((a) => a.property === "opacity" && a.state === "running"));
      assert(before.property.includes("background-color"));
      await patch(page, { paint: true });
      await frame(page, 2);
      const paint = await snapshot(page, '[data-slot="dialog-content"]');
      assert(paint.animations.some((a) => a.property === "background-color"));
      await page.getByLabel("Popup editor").evaluate((n) => n.focus());
      const settled = await snapshot(page, '[data-slot="dialog-content"]');
      assert.equal(settled.opacity, "1");
      assert.equal(settled.animations.length, 0);
      return { before, paint, settled };
    },
  );
  await check("caller CSS animation keeps its native handle through mode clocks and close/reopen", async () => {
    const results = [];
    for (const nativeDialog of [true, false]) {
      await visit({ dialog: true, callerLoop: true, nativeDialog, showDoc: false, chart: false });
      await page.evaluate(() => {
        const node = document.querySelector('[role="dialog"]');
        window.callerLoopAnimation = node.getAnimations().find((a) => a.animationName === "caller-breathe");
        if (!window.callerLoopAnimation) throw new Error("Missing native caller CSS animation");
      });
      const clocks = [];
      for (const next of [{ mode: "reduced" }, { mode: "none" }, { mode: "full", clock: 0 }, { clock: 8 }]) {
        await patch(page, next);
        await frame(page);
        const clock = await page.evaluate(() => ({
          same: document.querySelector('[role="dialog"]')?.getAnimations().includes(window.callerLoopAnimation),
          state: window.callerLoopAnimation.playState,
          duration: window.callerLoopAnimation.effect.getTiming().duration,
          time: window.callerLoopAnimation.currentTime,
          connected: window.callerLoopAnimation.effect.target.isConnected,
          domSame: document.querySelector('[role="dialog"]') === window.callerLoopAnimation.effect.target,
          display: getComputedStyle(window.callerLoopAnimation.effect.target).display,
          animations: window.callerLoopAnimation.effect.target
            .getAnimations()
            .map((a) => ({ name: a.animationName, property: a.transitionProperty, state: a.playState })),
        }));
        await page.evaluate(
          (boundary) => {
            window.loopBoundary = boundary;
          },
          { nativeDialog, next, clock },
        );
        assert(clock.same, JSON.stringify({ nativeDialog, next, clock }));
        assert.equal(clock.state, "running");
        assert.equal(clock.duration, 7000);
        if (clocks.length) assert(clock.time >= clocks.at(-1).time);
        clocks.push(clock);
      }
      await patch(page, { dialog: false });
      await frame(page);
      const closed = await page.evaluate(() => {
        const old = window.callerLoopAnimation;
        return {
          connected: old.effect.target.isConnected,
          same: old.effect.target.getAnimations().includes(old),
          state: old.playState,
        };
      });
      if (closed.connected) {
        assert(closed.same);
        assert.equal(closed.state, "running");
      } else assert.equal(closed.state, "idle");
      await patch(page, { dialog: true });
      await frame(page);
      const reopened = await page.evaluate(() => {
        const node = document.querySelector('[role="dialog"]');
        const current = node?.getAnimations().find((a) => a.animationName === "caller-breathe");
        return {
          sameDOM: node === window.callerLoopAnimation.effect.target,
          sameAnimation: current === window.callerLoopAnimation,
          state: current?.playState,
          duration: current?.effect.getTiming().duration,
          oldState: window.callerLoopAnimation.playState,
          open: node?.hasAttribute("data-open"),
        };
      });
      assert(reopened.open);
      assert.equal(reopened.state, "running");
      assert.equal(reopened.duration, 7000);
      if (closed.connected) assert(reopened.sameDOM && reopened.sameAnimation);
      else {
        assert(!reopened.sameDOM && !reopened.sameAnimation);
        assert.equal(reopened.oldState, "idle");
      }
      const completedBefore = await page.evaluate(
        () => window.semanticLog.filter((event) => event[0] === "dialog-complete" && event[1] === false).length,
      );
      await patch(page, { dialog: false });
      await page.evaluate(() => window.semanticUnmountPopup());
      await page.getByRole("dialog").waitFor({ state: "detached" });
      const completedAfter = await page.evaluate(
        () => window.semanticLog.filter((event) => event[0] === "dialog-complete" && event[1] === false).length,
      );
      assert.equal(completedAfter, completedBefore + 1);
      results.push({
        nativeDialog,
        clocks,
        closed,
        reopened,
        completedBefore,
        completedAfter,
        lifecycle: report.nativeLifecycle,
      });
    }
    return results;
  });
  for (const cause of ["print", "forced-colors"]) {
    await visit({ showDoc: false, clock: 8 });
    await check(`actual ${cause} settles a native entrance and restoration does not replay`, async () => {
      await patch(page, { showDoc: true });
      await frame(page, 2);
      const before = await snapshot(page, "[data-document-entrance]");
      assert(before.animations.length);
      await page.emulateMedia(cause === "print" ? { media: "print" } : { forcedColors: "active" });
      const settled = await snapshot(page, "[data-document-entrance]");
      assert.equal(settled.opacity, "1");
      assert.equal(settled.transform, "none");
      assert.equal(settled.animations.length, 0);
      await page.emulateMedia({ media: "screen", forcedColors: "none" });
      await frame(page, 3);
      const restored = await snapshot(page, "[data-document-entrance]");
      assert.equal(restored.animations.length, 0);
      return { before, settled, restored };
    });
  }
  for (const width of [390, 1280]) {
    label = `no-JS/${width}`;
    await context?.close();
    context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    page = await context.newPage();
    await page.goto(origin);
    await check("readable no-JS natural document", async () => {
      const natural = await snapshot(page, "[data-document-entrance]");
      assert.equal(natural.opacity, "1");
      assert.equal(natural.transform, "none");
      assert.equal(natural.clip, "none");
      await page.screenshot({ path: path.join(output, `nojs-${width}.png`), fullPage: true });
      return natural;
    });
  }
  label = "native default-context visibility";
  await context?.close();
  context = null;
  const executable = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
  assert(executable, "installed browser");
  const profile = path.join(output, "owned-native-visibility-profile");
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
  report.resources.nativeVisibility = { pid: ownedProcess.pid, started: new Date().toISOString(), profile };
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
    assert(endpoint, "owned native browser endpoint");
    native = await chromium.connectOverCDP(endpoint, { noDefaults: true, timeout: 5000 });
    const nativeContext = native.contexts()[0];
    page = nativeContext.pages()[0];
    report.resources.nativeVisibility.endpoint = endpoint;
    report.resources.nativeVisibility.processes = JSON.parse(
      execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          `$all=Get-CimInstance Win32_Process; $ids=@(${ownedProcess.pid}); do{$new=@($all|Where-Object{$_.ParentProcessId -in $ids -and $_.ProcessId -notin $ids});$ids+=$new.ProcessId}while($new.Count);$all|Where-Object{$_.ProcessId -in $ids}|Select-Object ProcessId,ParentProcessId,CreationDate,CommandLine|ConvertTo-Json -Depth 4`,
        ],
        { encoding: "utf8" },
      ),
    );
    await page.goto(
      `${origin}/?state=${encodeURIComponent(JSON.stringify({ showDoc: false, clock: 8, bubble: true }))}`,
    );
    await page.waitForFunction(() => window.semanticReady);
    await check(
      "actual hidden document cancels native entrance and restores latest content without replay",
      async () => {
        await page.evaluate(() => {
          window.presenceVisibility = [];
          document.addEventListener("visibilitychange", () => window.presenceVisibility.push(document.visibilityState));
        });
        await patch(page, { showDoc: true });
        await frame(page, 2);
        const before = await snapshot(page, "[data-document-entrance]");
        assert(before.animations.length);
        const background = await nativeContext.newPage();
        await background.goto("about:blank");
        await background.bringToFront();
        await pause(100);
        assert.equal(await page.evaluate(() => document.visibilityState), "hidden");
        const hidden = await snapshot(page, "[data-document-entrance]");
        assert.equal(hidden.animations.length, 0);
        assert.equal(hidden.opacity, "1");
        assert.equal(hidden.transform, "none");
        await patch(page, { text: "Latest hidden content", external: 240 });
        await page.bringToFront();
        await frame(page, 3);
        const restored = await snapshot(page, "[data-document-entrance]");
        assert.equal(restored.animations.length, 0);
        assert.equal(await page.locator('[data-slot="bubble-content"]').textContent(), "Latest hidden content");
        assert.equal((await snapshot(page, '[data-slot="external-value"]')).transform, "matrix(1, 0, 0, 1, 240, 0)");
        return { before, hidden, restored, visibility: await page.evaluate(() => window.presenceVisibility) };
      },
    );
  } finally {
    if (native) {
      const session = await native.newBrowserCDPSession();
      await session.send("Browser.close").catch(() => {});
      await native.close();
    }
    if (ownedProcess.exitCode === null) ownedProcess.kill();
    report.resources.nativeVisibility.closed = new Date().toISOString();
  }
} catch (error) {
  report.failures.push({ label, error: error.stack });
} finally {
  await context?.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  report.resources.closed = new Date().toISOString();
  await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ output, cases: report.cases.length, failures: report.failures, errors: report.errors }));
if (report.failures.length || report.errors.length) process.exitCode = 1;
