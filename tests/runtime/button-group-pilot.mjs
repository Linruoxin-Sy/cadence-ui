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

assert(process.env.BUTTON_GROUP_OUTPUT);
const output = path.resolve(process.env.BUTTON_GROUP_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
let copy;
const report = { cases: [], errors: [], screenshots: [], inputs: {}, installation: null };
if (process.env.BUTTON_GROUP_INSTALL) {
  const items = new Map(),
    queue = ["button-group", "button"];
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
  const group = installationPlan([...items.values()], "button-group"),
    button = installationPlan([...items.values()], "button");
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
    'import { ButtonGroup, ButtonGroupText, ButtonGroupSeparator, type ButtonGroupProps } from "./installed/components/cadence/button-group"; import {Button} from "./installed/components/cadence/button"; const props: ButtonGroupProps={orientation:"vertical",ref:node=>{if(node)return()=>{};}}; export const specimen=<ButtonGroup {...props}><Button key="a">Act</Button><ButtonGroupSeparator style={state=>({height:state.orientation==="vertical"?80:1})}/><ButtonGroupText render={<output/>}>{12}</ButtonGroupText></ButtonGroup>;',
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
  entryPoints: ["tests/runtime/button-group-pilot.jsx"],
  plugins,
  bundle: true,
  write: false,
  metafile: true,
  jsx: "automatic",
  format: "iife",
  define: { "process.env.NODE_ENV": '"production"' },
});
const ssr = await build({
  entryPoints: ["tests/runtime/button-group-pilot-ssr.jsx"],
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
  "docs/motion/components/button-group.md",
  "content/components/button-group.mdx",
  "tests/runtime/button-group-pilot.mjs",
  "app/globals.css",
  "upstream/manifest.json",
])
  report.inputs[file] = hash(await readFile(file));
report.clientGzip = gzipSync(js).length;
const server = http.createServer((req, res) => {
  const mode = new URL(req.url, "http://localhost").searchParams.get("mode") ?? "full";
  res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
  res.end(
    req.url === "/bundle.js"
      ? js
      : `<!doctype html><html lang="en"><title>Button Group runtime</title><style>${css}</style><div id="root">${render(mode)}</div><aside id="portal-root" aria-label="Portal examples"></aside><script>window.groupSSRHost=document.querySelector('#action-b');window.groupInitialMode=${JSON.stringify(mode)}</script><script src="/bundle.js"></script>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const update = (page, patch) => page.evaluate((patch) => window.groupUpdate(patch), patch);
const sample = (page, selector = "#group") =>
  page.locator(selector).evaluate((node) => {
    const css = getComputedStyle(node),
      box = node.getBoundingClientRect();
    const textCanvases = [...document.querySelectorAll('[data-cadence-text-owner="group-owned-text"] canvas')];
    const numberCanvases = [...document.querySelectorAll('[data-cadence-number-owner="group-owned-number"] canvas')];
    const ink = (canvas) => {
      const context = canvas.getContext("2d");
      return (
        !!context &&
        context
          .getImageData(0, 0, canvas.width, canvas.height)
          .data.some((value, index) => index % 4 === 3 && value > 0)
      );
    };
    const readout = document.querySelector("#readout"),
      palette = readout && getComputedStyle(readout);
    return {
      width: box.width,
      height: box.height,
      x: box.x,
      y: box.y,
      opacity: Number(css.opacity),
      background: css.backgroundColor,
      ending: node.hasAttribute("data-ending-style"),
      hidden: node.getAttribute("aria-hidden"),
      inert: node.inert,
      ruleParent:
        node.dataset.slot === "button-group-separator"
          ? {
              height: node.parentElement.getBoundingClientRect().height,
              width: node.parentElement.getBoundingClientRect().width,
              effects: node.parentElement.getAnimations().flatMap((animation) => animation.effect.getKeyframes()),
            }
          : null,
      mode: node.dataset.motion,
      scrollWidth: document.documentElement.scrollWidth,
      numberPaint: [...document.querySelectorAll('[data-cadence-number-owner="group-owned-number"] [data-phase]')].map(
        (node) => Number(node.dataset.phase),
      ),
      numberPixels: numberCanvases.map((canvas) => ({
        ink: ink(canvas),
        transform: getComputedStyle(canvas).transform,
      })),
      textPaint: textCanvases.length,
      textPixels: textCanvases.map((canvas) => ({
        ink: ink(canvas),
        opacity: Number(getComputedStyle(canvas).opacity),
        kind: canvas.dataset.cadenceTextKind,
        width: canvas.getBoundingClientRect().width,
      })),
      palette: palette ? { background: palette.backgroundColor, foreground: palette.color } : null,
      members: [...node.children]
        .filter((child) => child.getAttribute("data-slot") === "button-group-segment")
        .map((child) => {
          const rect = child.getBoundingClientRect(),
            style = getComputedStyle(child);
          return {
            key: child.getAttribute("data-group-key"),
            id: child.querySelector("button")?.id,
            ending: child.hasAttribute("data-ending-style"),
            x: rect.x - box.x,
            y: rect.y - box.y,
            width: rect.width,
            height: rect.height,
            opacity: Number(style.opacity),
            position: style.position,
          };
        }),
      effects: node.getAnimations({ subtree: true }).map((a) => ({
        target: a.effect.target?.dataset.slot,
        id: a.effect.target?.id,
        state: a.playState,
        timing: a.effect.getTiming(),
        frames: a.effect.getKeyframes(),
        native: a === window.groupNativeEngine,
      })),
    };
  });
const frames = async (page, selector = "#group", count = 18) => {
  const rows = [];
  for (let i = 0; i < count; i++) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    rows.push(await sample(page, selector));
  }
  return rows;
};
const has = (row, property, slot) =>
  row.effects.some((effect) => (!slot || effect.target === slot) && effect.frames.some((frame) => property in frame));
try {
  for (const mode of process.env.BUTTON_GROUP_BOUNDARY_ONLY ? [] : ["full", "reduced", "none"])
    for (const os of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 1100 },
        reducedMotion: os ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(String(error)));
      await page.addInitScript(() => {
        const original = Element.prototype.animate;
        window.groupNative = [];
        Element.prototype.animate = function (...args) {
          const row = { slot: this.dataset.slot, id: this.id, frames: args[0], at: performance.now() };
          window.groupNative.push(row);
          const a = original.apply(this, args);
          const cancel = a.cancel.bind(a);
          a.cancel = () => {
            row.cancelled = performance.now();
            return cancel();
          };
          return a;
        };
      });
      await page.goto(`${base}/?mode=${mode}`);
      await page.waitForFunction(() => window.groupReady && document.querySelector("#portal-group"));
      const effective = mode === "none" ? "none" : os ? "reduced" : mode,
        row = { mode, os, effective };
      report.cases.push(row);
      assert(await page.locator("#action-b").evaluate((n) => n === window.groupSSRHost), "SSR native host retained");
      assert.equal((await sample(page)).mode, effective);
      assert.equal((await sample(page)).opacity, 1);
      assert.equal((await sample(page)).effects.length, 0, "no hydration entrance");
      await page.locator("#before").focus();
      await page.keyboard.press("Tab");
      assert(await page.locator("#action-a").evaluate((n) => n === document.activeElement), "native tab order");
      await page.locator("#before").focus();
      await update(page, { order: ["a", "x", "b", "c"] });
      row.insertion = await frames(page);
      const inserted = row.insertion.flatMap((frame) => frame.members.filter((member) => member.id === "action-x"));
      const retained = row.insertion.flatMap((frame) => frame.members.filter((member) => member.id === "action-b"));
      if (effective !== "none")
        assert(
          inserted.some((member) => member.opacity > 0 && member.opacity < 1) &&
            new Set(inserted.map((member) => member.opacity)).size > 2,
          "actual segment entrance opacity changes",
        );
      else
        assert(
          inserted.every((member) => member.opacity === 1),
          "none segment entrance is immediately opaque",
        );
      if (effective === "full")
        assert(
          new Set(retained.map((member) => member.x)).size > 2,
          "retained sibling actually moves on its own layer",
        );
      else
        assert(
          new Set(retained.map((member) => member.x)).size === 1,
          "restricted retained placement is immediately final",
        );
      row.diagnostic = await page.evaluate(() => ({ describe: window.groupDescribe(), native: window.groupNative }));
      assert.equal(await page.locator("#action-b").evaluate((n) => n === window.groupSSRHost), true);
      assert.deepEqual(
        await page.evaluate(() => [
          window.groupRefMounts,
          window.groupRefCleanups ?? 0,
          document.getElementById("native-form").elements.namedItem("action-b") === window.groupSSRHost,
        ]),
        [1, 0, true],
      );
      assert.equal(await page.locator("#action-x").count(), 1);
      if (effective === "full")
        assert(
          row.insertion.some((r) => has(r, "width", "button-group")),
          "group has actual measured width clock",
        );
      else
        assert(
          row.insertion.every((r) => !has(r, "width", "button-group") && !has(r, "transform", "button-group-segment")),
          "restricted geometry immediate",
        );
      await update(page, { order: ["a", "c"] });
      row.immediateRemoval = await page.evaluate(() => [
        !!document.querySelector("#action-b"),
        !!document.getElementById("native-form").elements.namedItem("action-b"),
        window.groupRefCleanups,
      ]);
      assert.deepEqual(
        row.immediateRemoval,
        [false, false, 1],
        "semantic removal retires native registration before exit paint",
      );
      row.removal = await frames(page);
      const outgoing = row.removal.flatMap((frame) => frame.members.filter((member) => member.ending));
      if (effective !== "none")
        assert(
          outgoing.some((member) => member.opacity > 0 && member.opacity < 1) &&
            new Set(outgoing.map((member) => member.opacity)).size > 2,
          "actual retained exit opacity changes",
        );
      else assert(outgoing.length === 0, "none has no decorative exit hold at paint");
      assert.equal(await page.locator("#action-b").count(), 0, "real removed control retired immediately");
      assert.equal(await page.locator("button#action-x").count(), 0);
      assert(
        row.removal.every((r) => r.scrollWidth === 1280),
        "outgoing paint does not enlarge scroll extent",
      );
      await update(page, { order: ["c", "a", "b"] });
      row.reorder = await frames(page);
      await page.waitForFunction(() =>
        document.getAnimations().every((animation) => animation.playState !== "running"),
      );
      await page.evaluate(() => {
        window.groupReadoutNode = document.querySelector("#readout [data-slot=button-group-number]").firstChild;
        window.groupLabelNode = document.querySelector("#readout-text [data-slot=button-group-label]").firstChild;
      });
      // Deliberately slow this visual sample; native reduced fades can finish
      // between protocol round-trips when a production build is also active.
      row.readoutEffectiveClock = 8;
      await update(page, { label: "Saved", value: 100, clock: 8 });
      row.readout = await frames(page, "#readout-group");
      await update(page, { ruleLength: 160 });
      row.composedRuleResize = await frames(page, "#rule", 12);
      assert(
        effective === "full"
          ? new Set(row.composedRuleResize.map((frame) => frame.height)).size > 2
          : row.composedRuleResize.every((frame) => frame.height === 160),
        "composed inherited rule owns real definite cross-axis length frames or the effective immediate target",
      );
      assert(
        row.composedRuleResize.every(
          (frame) =>
            Math.abs(frame.height - frame.ruleParent.height) < 1 &&
            frame.ruleParent.effects.every((effect) => !("height" in effect)),
        ),
        "rule cross-axis length is not replaced by a second parent height writer",
      );
      await update(page, { ruleColour: true });
      row.composedRuleColour = await frames(page, "#rule", 12);
      assert(
        effective === "none"
          ? row.composedRuleColour.every((frame) => frame.background === "rgb(180, 180, 180)")
          : row.composedRuleColour.some(
              (frame) => !["rgb(80, 80, 80)", "rgb(180, 180, 180)"].includes(frame.background),
            ),
        "composed rule has actual scoped colour intermediates or the immediate none target",
      );
      await update(page, { ruleHorizontal: true });
      row.composedRuleReplacement = await frames(page, "#rule", 12);
      assert(
        effective === "none"
          ? row.composedRuleReplacement.every((frame) => frame.opacity === 1)
          : row.composedRuleReplacement.some((frame) => frame.opacity > 0 && frame.opacity < 1),
        "composed orientation replacement uses the one real rule opacity owner",
      );
      await page.locator("#rule").evaluate((node) => (window.groupRuleForResume = node));
      await update(page, { ruleShown: false });
      if (effective === "none") assert.equal(await page.locator("#rule").count(), 0);
      else {
        row.composedRuleExit = await frames(page, "#rule", 12);
        assert(
          row.composedRuleExit.some((frame) => frame.opacity > 0 && frame.opacity < 1) &&
            row.composedRuleExit.every((frame) => frame.ending && frame.inert && frame.hidden === "true"),
          "actual retained rule exits with inert hidden intermediate paint",
        );
      }
      row.composedRuleReentry = await page.evaluate(() => {
        const before = document.querySelector("#rule"),
          opacity = before ? Number(getComputedStyle(before).opacity) : null;
        window.groupUpdate({ ruleShown: true });
        const after = document.querySelector("#rule");
        return { same: before === after, opacity, next: Number(getComputedStyle(after).opacity) };
      });
      assert(
        effective === "none"
          ? row.composedRuleReentry.next === 1
          : row.composedRuleReentry.same &&
              Math.abs(row.composedRuleReentry.opacity - row.composedRuleReentry.next) < 0.02,
        "rule re-entry resumes its real retained host and current opacity",
      );
      await update(page, { ruleShown: false });
      await page.locator("#rule").waitFor({ state: "detached" });
      await update(page, { ruleShown: true });
      row.composedRuleEnter = await frames(page, "#rule", 12);
      assert(
        effective === "none"
          ? row.composedRuleEnter.every((frame) => frame.opacity === 1)
          : row.composedRuleEnter.some((frame) => frame.opacity > 0 && frame.opacity < 1),
        "fresh rule insertion has actual independent inherited opacity feedback",
      );
      await update(page, { ruleGroupVertical: true, ruleLength: 80 });
      await update(page, { ruleLength: 160 });
      row.composedRuleWidth = await frames(page, "#rule", 12);
      assert(
        effective === "full"
          ? new Set(row.composedRuleWidth.map((frame) => frame.width)).size > 2
          : row.composedRuleWidth.every((frame) => frame.width === 160),
        "the vertical group's inherited horizontal rule owns real width frames in its cross axis",
      );
      assert(
        row.composedRuleWidth.every(
          (frame) =>
            Math.abs(frame.width - frame.ruleParent.width) < 1 &&
            frame.ruleParent.effects.every((effect) => !("width" in effect)),
        ),
        "vertical group does not create a competing cross-axis width writer",
      );
      await update(page, { ruleGroupVertical: false, ruleHorizontal: false, ruleLength: 80 });
      assert(
        await page.evaluate(
          () =>
            document.querySelector("#readout [data-slot=button-group-number]").firstChild === window.groupReadoutNode &&
            document.querySelector("#readout-text [data-slot=button-group-label]").firstChild === window.groupLabelNode,
        ),
      );
      if (effective === "full")
        assert(
          row.readout.some((r) => r.numberPaint.some((p) => p > 0 && p < 1)),
          "actual quantity reel intermediate phase",
        );
      else
        assert(
          row.readout.every((r) => r.numberPaint.length === 0),
          "restricted quantity has no reel layer",
        );
      if (effective !== "none")
        assert(
          row.readout.some((r) => r.textPaint > 0),
          "actual changed-only text paint",
        );
      if (effective === "full") {
        assert(
          row.readout.some((frame) => frame.numberPixels.some((pixel) => pixel.ink)),
          "correct quantity owner paints real glyph pixels",
        );
        assert(
          new Set(row.readout.flatMap((frame) => frame.numberPixels.map((pixel) => pixel.transform))).size > 2,
          "correct quantity glyphs actually translate",
        );
      }
      if (effective !== "none") {
        assert(
          row.readout.some(
            (frame) => frame.textPixels.length === 1 && frame.textPixels[0].kind === "enter" && frame.textPixels[0].ink,
          ),
          "Save to Saved paints only the inserted run",
        );
        assert(
          row.readout.some((frame) => frame.textPixels.some((pixel) => pixel.opacity > 0 && pixel.opacity < 1)),
          "correct text owner has actual opacity intermediates",
        );
      } else
        assert(
          row.readout.every((frame) => frame.textPixels.length === 0),
          "none leaves no changed-text paint",
        );
      await update(page, { label: "Saved successfully", value: 100, colour: true });
      row.simultaneous = await frames(page, "#readout-group");
      if (effective !== "none")
        assert(
          row.simultaneous.some(
            (frame) =>
              frame.palette.background !== "rgb(220, 220, 220)" && frame.palette.background !== "rgb(238, 238, 238)",
          ) && new Set(row.simultaneous.map((frame) => frame.palette.background)).size > 2,
          "scoped colour has actual intermediate paint",
        );
      else
        assert(
          row.simultaneous.every(
            (frame) =>
              frame.palette.background === "rgb(238, 238, 238)" && frame.palette.foreground === "rgb(30, 30, 30)",
          ),
          "none colour commits its final palette",
        );
      assert.equal(await page.locator("#readout").textContent(), "100");
      assert.equal(await page.locator("#native-output").textContent(), "100");
      assert.equal(await page.locator("#native-link").getAttribute("href"), "#after");
      await update(page, { vertical: true });
      row.vertical = await frames(page);
      assert.equal(await page.locator("#group").getAttribute("data-orientation"), "vertical");
      await update(page, { order: ["a", "b", "c", "x"] });
      row.verticalInsertion = await frames(page);
      if (effective === "full")
        assert(
          new Set(row.verticalInsertion.map((row) => row.height)).size > 2,
          "vertical membership has actual intermediate heights",
        );
      await page.waitForFunction(() => {
        const root = document.querySelector("#group");
        const natural = [...root.children]
          .filter((node) => !node.hasAttribute("data-ending-style"))
          .reduce((sum, node) => sum + node.offsetHeight, 0);
        return Math.abs(root.getBoundingClientRect().height - natural) < 0.7;
      });
      assert(
        await page
          .locator("#group > [data-slot=button-group-segment]:not([data-ending-style])")
          .evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).position !== "fixed")),
        "reentered segments return to native layout",
      );
      await update(page, { vertical: false, editor: true });
      const input = page.locator("#editor");
      await input.focus();
      await input.evaluate((n) => {
        n.setSelectionRange(2, 5);
        n.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "x" }));
        window.groupNativeEditor = n;
      });
      await update(page, { label: "Localized command", value: 101, extra: true });
      row.editing = await frames(page);
      assert.deepEqual(
        await input.evaluate((n) => [
          n === window.groupNativeEditor,
          n === document.activeElement,
          n.selectionStart,
          n.selectionEnd,
          n.value,
        ]),
        [true, true, 2, 5, "draft value"],
      );
      assert(
        row.editing.every((r) => !has(r, "width", "button-group") && !has(r, "height", "button-group")),
        "focused/composing editor geometry remains native",
      );
      await input.evaluate((n) => n.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })));
      await page.locator("#before").focus();
      await update(page, { editor: false, order: ["a", "b", "c"], intrinsic: true });
      await frames(page);
      await update(page, { label: "Go", order: ["a", "c"] });
      row.intrinsic = await frames(page);
      await update(page, { mode: "none", clock: 0 });
      row.none = await frames(page);
      assert(
        row.none.every((r) => r.effects.every((e) => Number(e.timing.duration) === 0)),
        "none cancels live effects",
      );
      await update(page, { mode: "full", clock: 3, order: ["a", "x", "c"] });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await update(page, { mode: "reduced" });
      row.downgrade = await frames(page);
      assert(
        row.downgrade.every(
          (r) =>
            !has(r, "width", "button-group") &&
            !has(r, "height", "button-group") &&
            !has(r, "transform", "button-group-segment"),
        ),
        "live reduction cancels geometry",
      );
      await update(page, { mode: "full", clock: 3 });
      await update(page, { value: 999, label: "Latest destination", order: ["a", "b", "c"] });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await update(page, { clock: 0 });
      row.zero = await frames(page, "#readout-group");
      assert(
        row.zero.every((r) => r.effects.every((e) => Number(e.timing.duration) === 0)),
        "zero cancels same-target clocks",
      );
      assert.equal(await page.locator("#nested-none").getAttribute("data-motion"), "none");
      assert.equal(await page.locator("#nested-full").getAttribute("data-motion"), os ? "reduced" : "full");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await frames(page);
      assert.equal(await page.locator("#nested-full").getAttribute("data-motion"), "reduced");
      await update(page, { shown: false });
      await page.waitForFunction(() => !document.querySelector("#group"));
      assert.equal(await page.locator("#action-b").count(), 0);
      const axe = await new AxeBuilder({ page }).analyze();
      assert.deepEqual(axe.violations, []);
      row.axe = 0;
      await context.close();
    }
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const boundary = await context.newPage();
  boundary.on("pageerror", (error) => report.errors.push(String(error)));
  await boundary.goto(base);
  await boundary.waitForFunction(() => window.groupReady);
  const row = { kind: "contract-boundaries" };
  report.cases.push(row);
  const settled = () =>
    boundary.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  await boundary.locator("#action-b").focus();
  await update(boundary, { order: ["a", "x", "b", "c"] });
  row.focused = await frames(boundary);
  assert(
    row.focused.some((r) => has(r, "width", "button-group")),
    "ordinary focused button permits actual group resize",
  );
  assert(
    await boundary.locator("#action-b").evaluate((n) => n === document.activeElement && n === window.groupSSRHost),
  );
  await settled();
  await update(boundary, { order: ["a", "b", "c"], capture: true });
  await settled();
  const box = await boundary.locator("#action-b").boundingBox();
  await boundary.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await boundary.mouse.down();
  assert(
    await boundary.locator("#action-b").evaluate((n) => n.hasPointerCapture(window.groupPointer)),
    "real native pointer capture",
  );
  await update(boundary, { order: ["c", "a", "b"] });
  row.captured = await frames(boundary);
  assert(
    row.captured.every((r) => !has(r, "width", "button-group") && !has(r, "transform", "button-group-segment")),
    "held/captured reorder commits native geometry",
  );
  assert(await boundary.locator("#action-b").evaluate((n) => n === window.groupSSRHost));
  await boundary.mouse.up();
  row.released = await frames(boundary);
  assert(
    row.released.every((r) => !has(r, "transform", "button-group-segment")),
    "release does not replay consumed reflow",
  );
  await boundary.locator("#before").focus();
  await update(boundary, { capture: false, order: ["a", "b", "c"] });
  await frames(boundary, "#group", 3);
  row.rapidExit = await boundary.evaluate(() => {
    const native = document.querySelector("#action-b"),
      layer = native.closest("[data-slot=button-group-segment]");
    window.groupRapidLayer = layer;
    window.groupRapidA = document.querySelector("#action-a");
    const before = layer.getBoundingClientRect().toJSON();
    window.groupUpdate({ order: ["a", "c"] });
    const after = layer.getBoundingClientRect().toJSON();
    return {
      before,
      after,
      nativeRetired: !native.isConnected,
      hidden: layer.getAttribute("aria-hidden"),
      inert: layer.inert,
      paint: layer.querySelector("[data-cadence-group-paint]")?.getAttribute("data-cadence-group-label"),
      semantic: document.querySelector("#group").textContent,
      generated: getComputedStyle(layer.querySelector("[data-cadence-group-paint]"), "::before").content,
    };
  });
  assert(
    row.rapidExit.nativeRetired &&
      row.rapidExit.hidden === "true" &&
      row.rapidExit.inert &&
      row.rapidExit.paint === "Middle",
  );
  assert(
    !row.rapidExit.semantic.includes("Middle") && row.rapidExit.generated.includes("Middle"),
    "outgoing glyphs are generated paint, without duplicate native text",
  );
  for (const axis of ["x", "y"])
    assert(
      Math.abs(row.rapidExit.before[axis] - row.rapidExit.after[axis]) < 0.6,
      "exit captures the current projected source before DOM removal",
    );
  await frames(boundary, "#group", 2);
  row.rapidReentry = await boundary.evaluate(() => {
    const layer = window.groupRapidLayer,
      before = layer.getBoundingClientRect().toJSON(),
      opacity = Number(getComputedStyle(layer).opacity);
    window.groupUpdate({ order: ["b", "a", "c"] });
    return {
      before,
      after: layer.getBoundingClientRect().toJSON(),
      opacity,
      nextOpacity: Number(getComputedStyle(layer).opacity),
      sameLayer: document.querySelector("#action-b").closest("[data-slot=button-group-segment]") === layer,
      sameA: document.querySelector("#action-a") === window.groupRapidA,
    };
  });
  assert(row.rapidReentry.sameLayer && row.rapidReentry.sameA);
  for (const axis of ["x", "y"])
    assert(
      Math.abs(row.rapidReentry.before[axis] - row.rapidReentry.after[axis]) < 0.8,
      "reentry resumes the actual outgoing geometry",
    );
  assert(Math.abs(row.rapidReentry.opacity - row.rapidReentry.nextOpacity) < 0.08, "reentry resumes current opacity");
  assert(
    await boundary
      .locator("#action-b")
      .evaluate(
        (node) =>
          Number(getComputedStyle(node).opacity) === 1 &&
          node.getAnimations().every((a) => !a.effect.getKeyframes().some((f) => "opacity" in f)),
      ),
    "reentered real Button consumes its segment entrance without duplicate opacity",
  );
  await settled();
  await boundary.waitForFunction(() =>
    [...document.querySelector("#group").children].every((node) =>
      node.getAnimations().every((animation) => !animation.effect.getKeyframes().some((frame) => "transform" in frame)),
    ),
  );
  assert(
    await boundary.locator("#action-b").evaluate((node) => {
      const layer = node.closest("[data-slot=button-group-segment]"),
        root = document.querySelector("#group");
      return (
        getComputedStyle(layer).position !== "fixed" &&
        Math.abs(layer.getBoundingClientRect().x - root.getBoundingClientRect().x) < 0.7
      );
    }),
    "reentry converges to its current first-slot native destination",
  );
  await update(boundary, { capture: false, intrinsic: true, label: "Very long action name", order: ["a", "b", "c"] });
  await settled();
  const wide = (await sample(boundary)).width;
  await update(boundary, { label: "Go", order: ["a", "c"] });
  row.intrinsicShrink = await frames(boundary);
  const narrow = row.intrinsicShrink.at(-1).width;
  assert(
    row.intrinsicShrink.some((r) => r.width > narrow + 1 && r.width < wide - 1),
    "intrinsic parent echo keeps genuine shrink intermediates",
  );
  assert(
    row.intrinsicShrink.filter((r) => has(r, "width", "button-group")).length > 3,
    "intrinsic parent does not cancel its own child-size echo",
  );
  await update(boundary, { intrinsic: false, order: ["a", "b", "c"], clock: 6 });
  await settled();
  await update(boundary, { order: ["a", "x", "b", "c"] });
  await boundary.evaluate(() => new Promise(requestAnimationFrame));
  await boundary.evaluate(
    () =>
      (window.groupNativeEngine = document
        .querySelector("#stage")
        .animate([{ width: "700px" }, { width: "400px" }], { duration: 1200, fill: "forwards" })),
  );
  row.parentEngine = await frames(boundary, "#group", 8);
  assert(
    row.parentEngine.slice(2).every((r) => !has(r, "width", "button-group")),
    "native ancestor size engine cancels group interpolation",
  );
  assert.equal(await boundary.evaluate(() => window.groupNativeEngine.playState), "running");
  await boundary.evaluate(() => window.groupNativeEngine.cancel());
  await update(boundary, { intrinsic: false, order: ["a", "b", "c"], clock: 3 });
  await boundary.locator("#stage").evaluate((node) => (node.style.overflow = "hidden"));
  await settled();
  await update(boundary, { order: ["a", "x", "b", "c"] });
  row.staticClip = await frames(boundary, "#group", 8);
  assert(
    new Set(row.staticClip.map((frame) => frame.width)).size > 2,
    "measured unchanged outer clip retains real group width interpolation",
  );
  await update(boundary, { intrinsic: true, order: ["a", "b", "c"] });
  await settled();
  await update(boundary, { order: ["a", "x", "b", "c"] });
  row.intrinsicClip = await frames(boundary, "#group", 8);
  assert(
    new Set(row.intrinsicClip.map((frame) => frame.width)).size === 1,
    "clip whose natural extent follows the group keeps the safe immediate growth target",
  );
  assert(
    await boundary.locator("#stage").evaluate((stage) => stage.scrollWidth === stage.clientWidth),
    "intrinsic clip cannot hide its new semantic controls",
  );
  await boundary.locator("#stage").evaluate((node) => node.style.removeProperty("overflow"));
  await update(boundary, { intrinsic: false, order: ["a", "b", "c"] });
  await settled();
  await update(boundary, { order: ["a", "b", "c"] });
  await settled();
  await update(boundary, { order: ["a", "x", "b", "c"] });
  await boundary.evaluate(
    () =>
      (window.groupNativeEngine = document
        .querySelector("#action-b")
        .animate([{ width: "80px" }, { width: "160px" }], { duration: 1200, fill: "forwards" })),
  );
  row.childEngine = await frames(boundary, "#group", 8);
  assert(
    row.childEngine
      .slice(2)
      .every(
        (r) => !r.effects.some((e) => !e.native && e.target === "button-group" && e.frames.some((f) => "width" in f)),
      ),
    "native child size engine takes allocation back",
  );
  assert.equal(await boundary.evaluate(() => window.groupNativeEngine.playState), "running");
  await boundary.evaluate(() => window.groupNativeEngine.cancel());
  await update(boundary, { clock: 3, order: ["a", "b", "c"], label: "Go", value: 99, colour: false });
  await settled();
  await update(boundary, { order: ["a", "b", "c", "z"], label: "Go ahead", value: 100, colour: true });
  row.noop = await boundary.evaluate(() => {
    const root = document.querySelector("#group");
    const before = root.getAnimations().find((a) => a.effect.getKeyframes().some((f) => "width" in f));
    const width = root.getBoundingClientRect().width;
    window.groupUpdate({ passive: window.groupState.passive });
    const after = root.getAnimations().find((a) => a.effect.getKeyframes().some((f) => "width" in f));
    return { same: Boolean(before && before === after), before: width, after: root.getBoundingClientRect().width };
  });
  assert(
    row.noop.same && Math.abs(row.noop.before - row.noop.after) < 0.1,
    "same semantic rerender keeps the actual dimension animation and painted value",
  );
  row.concurrent = await frames(boundary, "#group", 3);
  assert(
    row.concurrent.some((frame) =>
      frame.members.some((member) => member.id === "action-z" && member.opacity > 0 && member.opacity < 1),
    ),
    "simultaneous inserted segment has real opacity feedback",
  );
  assert(
    row.concurrent.some((frame) =>
      frame.textPixels.some((pixel) => pixel.ink && pixel.opacity > 0 && pixel.opacity < 1),
    ),
    "simultaneous changed text has real eligible opacity",
  );
  row.reducedOrigin = await boundary.evaluate(() => {
    const read = () => ({
      opacity: Number(
        getComputedStyle(
          document.querySelector('[data-cadence-text-owner="group-owned-text"] canvas[data-cadence-text-kind="enter"]'),
        ).opacity,
      ),
      colour: getComputedStyle(document.querySelector("#readout"))
        .backgroundColor.match(/[\d.]+/g)
        .map(Number),
    });
    const before = read();
    window.groupUpdate({ mode: "reduced" });
    return { before, after: read() };
  });
  assert(
    Math.abs(row.reducedOrigin.before.opacity - row.reducedOrigin.after.opacity) < 0.02 &&
      row.reducedOrigin.before.colour.every(
        (channel, index) => Math.abs(channel - row.reducedOrigin.after.colour[index]) <= 1,
      ),
    "live reduced starts from the actual current glyph opacity and colour",
  );
  row.concurrentReduced = await frames(boundary, "#group", 3);
  assert(
    row.concurrentReduced.every(
      (frame) =>
        !has(frame, "width", "button-group") &&
        !has(frame, "height", "button-group") &&
        !has(frame, "transform", "button-group-segment"),
    ),
    "simultaneous downgrade settles all group spatial writers",
  );
  assert(
    row.concurrentReduced.some((frame) => frame.textPixels.some((pixel) => pixel.opacity > 0 && pixel.opacity < 1)),
    "eligible changed text continues with reduced opacity",
  );
  row.reducedPalette = await frames(boundary, "#readout-group", 3);
  assert(
    [...row.concurrentReduced, ...row.reducedPalette].some(
      (frame) => frame.palette.background !== "rgb(238, 238, 238)",
    ),
    "eligible reduced colour keeps actual intermediate feedback",
  );
  await update(boundary, { mode: "none" });
  row.concurrentNone = await frames(boundary, "#group", 3);
  assert(
    row.concurrentNone.every(
      (frame) =>
        frame.numberPixels.length === 0 &&
        frame.textPixels.length === 0 &&
        !has(frame, "width", "button-group") &&
        !has(frame, "transform", "button-group-segment"),
    ),
    "none removes current glyph and spatial writers",
  );
  assert(
    await boundary.locator("#group").evaluate((root) => {
      const children = [...root.children].filter((node) => !node.hasAttribute("data-ending-style"));
      return (
        children.every((node) => getComputedStyle(node).position !== "fixed") &&
        Math.abs(
          root.getBoundingClientRect().width -
            children.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0),
        ) < 1
      );
    }),
    "none converges to the current semantic natural layout",
  );
  await update(boundary, { mode: "full" });
  await frames(boundary, "#group", 3);
  await update(boundary, { nestedShown: false, clock: 3 });
  await frames(boundary, "#group", 3);
  await update(boundary, { nestedShown: true });
  row.parentFull = await frames(boundary, "#full-none", 5);
  row.parentNone = await frames(boundary, "#none-full", 5);
  assert(
    row.parentFull.some((frame) => frame.opacity > 0 && frame.opacity < 1) &&
      new Set(row.parentFull.map((frame) => frame.opacity)).size > 2,
    "independent group envelope has actual opacity intermediates",
  );
  assert(
    row.parentFull.some((r) => has(r, "opacity", "button-group")),
    "full parent owns independent insertion envelope",
  );
  assert(
    row.parentNone.every((r) => !has(r, "opacity", "button-group")),
    "none parent has no envelope",
  );
  assert.equal(
    await boundary.locator("#nested-none").evaluate((n) => n.getAnimations().length),
    0,
    "none child has no local entrance",
  );
  assert.equal(
    await boundary.locator("#nested-full").evaluate((n) => n.getAnimations().length),
    0,
    "same insertion does not replay child entry",
  );
  await boundary.locator("#nested-full [data-slot=button-text]").evaluate((n) => (n.id = "nested-full-text"));
  await boundary.locator("#nested-none [data-slot=button-text]").evaluate((n) => (n.id = "nested-none-text"));
  await update(boundary, { label: "Go ahead now" });
  row.nestedLater = await frames(boundary, "#none-full", 8);
  assert(
    (await boundary.locator('[data-cadence-text-owner="nested-full-text"]').count()) > 0,
    "full child retains eligible independent update under none group",
  );
  assert.equal(await boundary.locator('[data-cadence-text-owner="nested-none-text"]').count(), 0);
  assert(
    row.nestedLater.every((r) => !has(r, "width", "button-group")),
    "none parent does not chase the child text",
  );
  await boundary.emulateMedia({ reducedMotion: "reduce" });
  await frames(boundary, "#none-full", 3);
  assert.equal(await boundary.locator("#nested-full").getAttribute("data-motion"), "reduced");
  await boundary.emulateMedia({ reducedMotion: "no-preference" });
  await update(boundary, {
    ruleGroupShown: false,
    ruleMode: "inherit",
    ruleHorizontal: false,
    ruleLength: 80,
    ruleColour: false,
    ruleShown: true,
    clock: 3,
    mode: "full",
  });
  await boundary.evaluate(() => new Promise(requestAnimationFrame));
  await update(boundary, { ruleGroupShown: true });
  row.ruleGroupEnter = await frames(boundary, "#rules", 5);
  assert(
    row.ruleGroupEnter.some((frame) => frame.opacity > 0 && frame.opacity < 1),
    "a real later group owns its one envelope including the initial rule",
  );
  assert(
    await boundary
      .locator("#rule")
      .evaluate(
        (node) =>
          Number(getComputedStyle(node).opacity) === 1 &&
          node
            .getAnimations()
            .every((animation) => animation.effect.getKeyframes().every((frame) => !("opacity" in frame))),
      ),
    "the initial inherited rule does not add a duplicate group entrance",
  );
  await update(boundary, { ruleLength: 160 });
  row.ruleBeforeForeign = await frames(boundary, "#rule", 3);
  assert(
    new Set(row.ruleBeforeForeign.map((frame) => frame.height)).size > 1,
    "live composed rule has a real length flight before native takeover",
  );
  await boundary.locator("#rule").evaluate(
    (node) =>
      (window.groupNativeEngine = node.animate([{ height: "200px" }, { height: "240px" }], {
        duration: 1500,
        fill: "both",
      })),
  );
  row.ruleForeign = await frames(boundary, "#rule", 8);
  assert(
    row.ruleForeign
      .slice(1)
      .every((frame) =>
        frame.effects.every((effect) => effect.native || effect.frames.every((key) => !("height" in key))),
      ),
    "foreign native height engine revokes the composed rule lease rather than borrowing its echo proof",
  );
  assert.equal(await boundary.evaluate(() => window.groupNativeEngine.playState), "running");
  await boundary.evaluate(() => window.groupNativeEngine.cancel());
  row.ruleAfterForeign = await frames(boundary, "#rule", 3);
  assert(
    row.ruleAfterForeign.every((frame) => frame.height === 160),
    "native takeover cancellation exposes the latest physical rule target",
  );
  await update(boundary, { ruleGroupShown: false, ruleMode: "none", ruleLength: 80 });
  await boundary.evaluate(() => new Promise(requestAnimationFrame));
  await update(boundary, { ruleGroupShown: true });
  row.ruleFullNone = await frames(boundary, "#rules", 5);
  assert(
    row.ruleFullNone.some((frame) => frame.opacity > 0 && frame.opacity < 1),
    "full group still owns its envelope around an explicit none rule",
  );
  assert.equal(await boundary.locator("#nested-rule").getAttribute("data-motion"), "none");
  assert(
    await boundary.locator("#nested-rule").evaluate((node) => node.getAnimations().length === 0),
    "none rule has no local appearance, colour or geometry writer",
  );
  await update(boundary, { mode: "none", ruleMode: "full", ruleShown: false, ruleClock: 3 });
  await boundary.locator("#nested-rule").waitFor({ state: "detached" });
  await update(boundary, { ruleShown: true });
  row.ruleNoneFull = await frames(boundary, "#nested-rule", 5);
  assert(
    row.ruleNoneFull.some((frame) => frame.opacity > 0 && frame.opacity < 1) &&
      row.ruleNoneFull.every((frame) => frame.mode === "full"),
    "independent full rule entrance survives a none group without a parent envelope",
  );
  assert(
    await boundary.locator("#rules").evaluate((node) => node.getAnimations().length === 0),
    "none parent does not replay or follow the independent rule's paint",
  );
  await update(boundary, { ruleColour: true });
  row.ruleNestedColour = await frames(boundary, "#nested-rule", 3);
  assert(
    row.ruleNestedColour.some((frame) => !["rgb(80, 80, 80)", "rgb(180, 180, 180)"].includes(frame.background)),
    "nested rule resolves its own actual full colour clock",
  );
  await update(boundary, { ruleClock: 0 });
  row.ruleNestedZero = await frames(boundary, "#nested-rule", 3);
  assert(
    row.ruleNestedZero.every(
      (frame) =>
        frame.opacity === 1 &&
        frame.background === "rgb(180, 180, 180)" &&
        frame.effects.every((effect) => Number(effect.timing.duration) === 0),
    ),
    "local zero clock cancels actual rule paint at the semantic target",
  );
  await update(boundary, { ruleClock: 3 });
  assert(
    await boundary.locator("#nested-rule").evaluate((node) => node.getAnimations().length === 0),
    "restored local clock does not replay a consumed rule entrance or colour",
  );
  await boundary.emulateMedia({ reducedMotion: "reduce" });
  await update(boundary, { ruleShown: false });
  await boundary.locator("#nested-rule").waitFor({ state: "detached" });
  await update(boundary, { ruleShown: true });
  row.ruleOS = await frames(boundary, "#nested-rule", 3);
  assert(
    row.ruleOS.every((frame) => frame.mode === "reduced") &&
      row.ruleOS.some((frame) => frame.opacity > 0 && frame.opacity < 1),
    "OS reduction caps the explicit full inherited rule at real reduced opacity",
  );
  await boundary.emulateMedia({ reducedMotion: "no-preference" });
  await update(boundary, { mode: "full", ruleMode: "inherit" });
  await update(boundary, {
    distribute: true,
    label: "Save",
    value: 99,
    clock: 3,
    mode: "full",
    order: ["a", "b", "c"],
  });
  await settled();
  const gridNative = await boundary.locator("#group-owned-text").elementHandle();
  await update(boundary, { label: "Saved", value: 100, order: ["a", "x", "b", "c"] });
  row.gridBeforePassive = await frames(boundary, "#readout-group", 3);
  await update(boundary, { distributedHeight: 1500 });
  row.gridPassive = await frames(boundary, "#readout-group", 3);
  assert(
    row.gridPassive.every((frame) => frame.textPixels.length === 0 && frame.numberPixels.length === 0),
    "external automatic-grid allocation cancels raster decorations",
  );
  await update(boundary, { mode: "none" });
  assert(
    await boundary
      .locator("#group-owned-text")
      .evaluate((node, original) => node === original && node.textContent === "Saved", gridNative),
    "original auto grid preserves the native text identity and semantic target",
  );
  assert.equal(await boundary.locator("#readout").textContent(), "100");
  assert(
    await boundary
      .locator("#readout-group")
      .evaluate(
        (root) =>
          root.getAnimations({ subtree: true }).every((a) => a.playState !== "running") &&
          [...root.children].every(
            (child) => !child.hasAttribute("data-ending-style") && getComputedStyle(child).position !== "fixed",
          ),
      ),
    "automatic grid reaches its actual native final layout without stale holds",
  );
  await update(boundary, { distribute: false, mode: "full" });
  await settled();
  await boundary.locator("main").evaluate((node) => (node.style.transform = "scale(1.05)"));
  await update(boundary, { label: "Scaled native", value: 120 });
  row.scaled = await frames(boundary, "#readout-group", 3);
  assert(
    row.scaled.every(
      (frame) =>
        frame.textPixels.length === 0 && frame.numberPixels.length === 0 && !has(frame, "width", "button-group"),
    ),
    "unknown scale cannot borrow quantized anchor admission",
  );
  await boundary.locator("main").evaluate((node) => node.style.removeProperty("transform"));
  await boundary
    .locator("#readout-group")
    .evaluate(
      (node) =>
        (window.groupNativeEngine = node.animate(
          [{ transform: "translateX(10px)" }, { transform: "translateX(20px)" }],
          { duration: 1500, fill: "both" },
        )),
    );
  await update(boundary, { label: "Native movement", value: 121 });
  row.unknownMovement = await frames(boundary, "#readout-group", 3);
  assert(
    row.unknownMovement.every((frame) => frame.textPixels.length === 0 && frame.numberPixels.length === 0),
    "unknown native movement is rejected even when translation maps to a layout unit",
  );
  assert.equal(await boundary.evaluate(() => window.groupNativeEngine.playState), "running");
  await boundary.evaluate(() => window.groupNativeEngine.cancel());
  await update(boundary, { features: true, value: 1200, label: "Unknown features remain native" });
  await frames(boundary, "#readout-group", 3);
  assert.equal(await boundary.locator("#readout").evaluate((n) => getComputedStyle(n).fontFeatureSettings), '"liga" 0');
  assert.equal(
    await boundary.locator("[data-cadence-number-layer]").count(),
    0,
    "unknown feature configuration remains native",
  );
  assert.equal(await boundary.locator("[data-cadence-text-layer]").count(), 0);
  await update(boundary, { features: false, clock: 0, order: Array.from({ length: 50 }, (_, index) => String(index)) });
  assert.equal(await boundary.locator("#group button").count(), 50);
  row.bounded = await frames(boundary, "#group", 3);
  assert(
    row.bounded.every((r) => !has(r, "width", "button-group") && !has(r, "transform", "button-group-segment")),
    "oversized shell plus members stays immediate",
  );
  await update(boundary, { order: ["a", "b", "c"], clock: 3, value: 99, label: "Send" });
  await frames(boundary, "#group", 3);
  await update(boundary, { order: ["a", "x", "b", "c"], value: 100, label: "Sent" });
  await boundary.evaluate(() => new Promise(requestAnimationFrame));
  await boundary.evaluate(() => {
    window.groupDetached = [
      ...document.querySelectorAll("#group,#group *,#readout-group,#readout-group *,#rules,#rules *"),
    ];
    window.groupDetachedAnimations = document.getAnimations();
    window.groupRoot.unmount();
    window.groupDetachedPaint = window.groupDetached.map((n) => n.getAttribute("style"));
  });
  await boundary.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert(
    await boundary.evaluate(() =>
      window.groupDetached.every(
        (node, index) => !node.isConnected && node.getAttribute("style") === window.groupDetachedPaint[index],
      ),
    ),
    "unmount retires detached style writers",
  );
  assert.equal(
    await boundary.locator("[data-cadence-number-layer],[data-cadence-text-layer]").count(),
    0,
    "unmount clears subordinate text and reel paint",
  );
  assert(
    await boundary.evaluate(() => window.groupDetachedAnimations.every((animation) => animation.playState === "idle")),
    "parent unmount cancels the actual inherited and local native animation handles",
  );
  row.unmount = true;
  await context.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const page = await nojs.newPage();
  await page.goto(base);
  assert(await page.locator("#group").isVisible());
  assert.equal(await page.locator("#action-b").textContent(), "Middle");
  await nojs.close();
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
    installation: report.installation?.files.length,
    errors: report.errors,
    noJS: report.noJS,
  }),
);
