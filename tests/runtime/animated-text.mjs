import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { installationCss } from "../../scripts/installation.mjs";

const output = path.resolve(process.env.ANIMATED_TEXT_OUTPUT);
await mkdir(output, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  inputs: {},
  installation: { items: [], files: [], dependencies: [] },
  profiles: [],
  failures: [],
  errors: [],
  resources: {},
};
const installed = path.join(output, "installed", "components", "cadence");
const seen = new Set(),
  queue = ["animated-text"];
const styles = [];
while (queue.length) {
  const id = queue.shift();
  if (seen.has(id)) continue;
  seen.add(id);
  const bytes = await readFile(`public/r/${id}.json`),
    item = JSON.parse(bytes);
  if (item.css || item.cssVars) styles.push(installationCss(item));
  report.installation.items.push({ id, payloadSHA: hash(bytes) });
  for (const dependency of item.dependencies ?? [])
    if (!report.installation.dependencies.includes(dependency)) report.installation.dependencies.push(dependency);
  for (const dependency of item.registryDependencies ?? []) {
    assert(dependency.startsWith("@cadence/"));
    queue.push(dependency.slice(9));
  }
  for (const file of item.files ?? []) {
    assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
    const dest = path.resolve(installed, file.target.slice("@components/cadence/".length));
    assert(dest.startsWith(installed + path.sep));
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, file.content);
    assert.equal(hash(await readFile(dest)), hash(await readFile(file.path)));
    report.installation.files.push({ target: file.target, sha: hash(file.content), path: dest });
  }
}
await writeFile(
  path.join(output, "installed", "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      dependencies: Object.fromEntries(
        [...report.installation.dependencies, "react", "react-dom"].map((dep) => {
          const name = dep.startsWith("@") ? dep.split("@").slice(0, 2).join("@") : dep.split("@")[0];
          return [
            name,
            JSON.parse(require("node:fs").readFileSync(path.resolve("node_modules", name, "package.json"), "utf8"))
              .version,
          ];
        }),
      ),
    },
    null,
    2,
  ),
);
const cssInput = `@import "tailwindcss";\n@source "./components";\n${styles.join("\n")}`;
await writeFile(path.join(output, "installed", "theme.css"), cssInput);
const installedCss = (
  await require("postcss")([require("@tailwindcss/postcss")()]).process(cssInput, {
    from: path.join(output, "installed", "theme.css"),
  })
).css;
await writeFile(path.join(output, "installed", "theme-built.css"), installedCss);
report.installation.css = {
  authored: hash(cssInput),
  built: hash(installedCss),
  source: "actual registry theme compiled with Tailwind v4",
};
await writeFile(
  path.join(output, "installed", "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        lib: ["DOM", "DOM.Iterable", "ES2022", "ESNext.Intl"],
      },
      include: ["components/**/*.ts", "components/**/*.tsx"],
    },
    null,
    2,
  ),
);
const plugin = {
  name: "actual-payload-install",
  setup(builder) {
    builder.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => ({
      path: path.join(
        installed,
        args.path.replaceAll("\\", "/").split("registry/cadence/")[1] +
          (args.path.endsWith("animated-text") ? "/index.tsx" : ".tsx"),
      ),
    }));
  },
};
// Only the component and provider are fixture imports; all transitive imports stay installed-relative.
const compile = async (entry, copy, ssr = false, development = false) =>
  build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    metafile: true,
    format: ssr ? "cjs" : "iife",
    platform: ssr ? "node" : "browser",
    packages: ssr ? "external" : undefined,
    jsx: "automatic",
    minify: !ssr,
    plugins: copy ? [plugin] : [],
    define: { "process.env.NODE_ENV": JSON.stringify(development ? "development" : "production") },
  });
let browser,
  server,
  client = "",
  markup = "",
  strict = false;
try {
  server = http.createServer((req, res) => {
    if (req.url === "/client.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(client);
    } else if (req.url === "/favicon.ico") {
      res.writeHead(204);
      res.end();
    } else {
      res.setHeader("Content-Type", "text/html");
      res.end(
        `<!doctype html><html lang="en"><head><title>Animated text runtime</title><style>${installedCss}</style><style>body{font:20px 'Courier New',monospace;margin:30px}button{font:inherit;color:inherit}a{color:inherit} @media(prefers-color-scheme:dark){body{color:#eee;background:#111}button{background:#222}}#editor{margin-top:20px}</style></head><body><header><h1>Animated text runtime</h1></header><main id="root">${markup}</main><script>window.publicStrict=${strict}</script><script src="/client.js"></script></body></html>`,
      );
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  for (const profile of [
    { name: "source", copy: false, width: 1280, dpr: 1 },
    { name: "installed", copy: true, width: 1280, dpr: 1 },
    { name: "strict", copy: true, width: 1280, dpr: 1, strict: true },
    { name: "dark", copy: true, width: 1280, dpr: 1, dark: true },
    { name: "narrow", copy: true, width: 390, dpr: 1 },
    { name: "DPR2-native-fallback", copy: true, width: 390, dpr: 2 },
  ]) {
    strict = !!profile.strict;
    const ssr = await compile("tests/runtime/animated-text-ssr.jsx", profile.copy, true, profile.strict);
    const ssrPath = path.join(output, `${profile.name}-ssr.cjs`);
    await writeFile(ssrPath, ssr.outputFiles[0].contents);
    markup = require(ssrPath).render();
    const bundle = await compile("tests/runtime/animated-text.jsx", profile.copy, false, profile.strict);
    client = bundle.outputFiles[0].text;
    await writeFile(path.join(output, `${profile.name}.js`), client);
    for (const input of Object.keys(bundle.metafile.inputs)) report.inputs[input] = hash(await readFile(input));
    assert(
      !Object.keys(bundle.metafile.inputs).some((p) => p.includes("captured-handoff")),
      "ordinary public text must not load handoff engine",
    );
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const native = await noJS.newPage();
    await native.goto(url);
    assert.equal(await native.locator("#public").textContent(), "Save");
    assert.equal(await native.locator("#public").evaluate((e) => e.childNodes.length), 1);
    await noJS.close();
    const context = await browser.newContext({
      viewport: { width: profile.width, height: 800 },
      deviceScaleFactor: profile.dpr,
      colorScheme: profile.dark ? "dark" : "light",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push({ profile: profile.name, error: String(error) }));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push({ profile: profile.name, error: message.text() });
    });
    await page.goto(url);
    await page.waitForFunction(() => window.publicTextUpdate);
    const checks = await page.evaluate(
      async ({ dpr }) => {
        const checks = [];
        const check = (name, condition, actual) => {
          checks.push({ name, passed: !!condition, actual });
        };
        const host = () => document.getElementById("public");
        const animations = () =>
          [...document.querySelectorAll('[data-cadence-text-owner="public"] canvas')].flatMap((e) => e.getAnimations());
        let entity = 1;
        const baseline = (value, extra = {}) =>
          window.publicTextUpdate({
            value,
            mode: "full",
            timeScale: 1,
            granularity: "auto",
            entity: ++entity,
            ...extra,
          });
        check(
          "hydrated visible native baseline",
          host().textContent === "Save" && host().childNodes.length === 1 && animations().length === 0,
        );
        for (const [before, after, mask] of [
          ["Save", "Saved", "d"],
          ["Send", "Sent", "t"],
          ["aba", "aaba", "a"],
          ["aXbYc", "aPbQc", "PQ"],
        ]) {
          baseline(before);
          const node = host().firstChild;
          window.publicTextUpdate({ value: after });
          const masks = [...CSS.highlights.values()].flatMap((h) => [...h].map((r) => r.toString())).join("");
          check(
            `${before} to ${after}: immediate one native string`,
            host().textContent === after && host().firstChild === node && host().childNodes.length === 1,
          );
          check(`${before} to ${after}: changed-only mask`, dpr === 1 ? masks === mask : masks === "", masks);
          check(
            `${before} to ${after}: actual opacity or certified fallback`,
            dpr === 1 ? animations().length > 0 : animations().length === 0,
          );
        }
        for (const mode of ["full", "reduced", "none"]) {
          baseline("a", { mode });
          window.publicTextUpdate({ value: "abcd" });
          const effects = animations();
          effects.forEach((a) => {
            a.pause();
          });
          check(`${mode}: current text`, host().textContent === "abcd" && host().dataset.motion === mode);
          check(
            `${mode}: native WAAPI mode branch`,
            dpr === 1 && mode !== "none" ? effects.length === 3 : effects.length === 0,
            effects.length,
          );
          check(
            `${mode}: opacity only`,
            effects.every((a) => a.effect.getKeyframes().every((k) => !("transform" in k))),
          );
          check(
            `${mode}: delay contract`,
            effects.every((a) =>
              mode === "full" ? a.effect.getTiming().delay <= 120 : a.effect.getTiming().delay === 0,
            ),
          );
        }
        baseline("a");
        window.publicTextUpdate({ value: "abcd" });
        let effects = animations();
        effects.forEach((a) => {
          a.pause();
        });
        if (dpr === 1)
          check(
            "default12ms character step",
            effects[1].effect.getTiming().delay === 12,
            effects.map((a) => a.effect.getTiming().delay),
          );
        window.publicTextUpdate({ timeScale: 0 });
        check("zero cancels before frame", animations().length === 0 && host().textContent === "abcd");
        window.publicTextUpdate({ timeScale: 1 });
        check("restoration does not replay", animations().length === 0);
        baseline("a", { timeScale: 4 });
        window.publicTextUpdate({ value: "abcdefghijklmnopqrstuv" });
        effects = animations();
        check(
          "20 changed grapheme concurrency",
          effects.length <= 20 && (dpr !== 1 || effects.length === 20),
          effects.length,
        );
        check(
          "final120ms after scale",
          effects.every((a) => a.effect.getTiming().delay <= 120),
        );
        baseline("ab cd", { granularity: "word" });
        window.publicTextUpdate({ value: "abXY cdPQ" });
        effects = animations();
        effects.forEach((a) => {
          a.pause();
        });
        const delays = effects.map((a) => a.effect.getTiming().delay);
        if (dpr === 1)
          check("word segments share changed-only clocks", JSON.stringify(delays) === "[0,0,35,35]", delays);
        window.publicTextUpdate({ mode: "reduced" });
        check("live downgrade cancels active paint", animations().length === 0 && CSS.highlights.size === 0);
        baseline("Save");
        window.publicTextUpdate({ value: "Saved" });
        window.publicTextUpdate({ value: "Saved!" });
        window.publicTextUpdate({ value: "Save" });
        check("latest rapid revision exact", host().textContent === "Save");
        window.publicTextUpdate({ mode: "none" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        check("no retired writer after next frames", animations().length === 0 && host().textContent === "Save");
        baseline("Save");
        window.publicTextUpdate({ value: "Saved" });
        window.publicTextUpdate({ mounted: false });
        check(
          "unmount removes mask and pixel layers",
          !host() && CSS.highlights.size === 0 && !document.querySelector("[data-cadence-text-layer]"),
        );
        window.publicTextUpdate({ mounted: true, value: "Save", entity: ++entity });
        for (const value of ["مرحبا", "漢字", "e\u0301", "👨‍👩‍👧‍👦"]) {
          window.publicTextUpdate({ value });
          check(`unsupported native ${value}`, host().textContent === value && animations().length === 0);
        }
        baseline("Save");
        window.publicTextUpdate({ value: "x".repeat(2049) });
        check(
          "input overflow is exact immediate",
          host().textContent === "x".repeat(2049) && animations().length === 0,
        );
        baseline("Save");
        window.publicTextUpdate({ value: "Saved" });
        const range = document.createRange();
        range.selectNodeContents(host());
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        document.dispatchEvent(new Event("selectionchange"));
        check("native selection cancels paint", getSelection().toString() === "Saved" && animations().length === 0);
        getSelection().removeAllRanges();
        baseline("Save");
        check("no default announcement", !host().hasAttribute("aria-live"));
        check(
          "rich sibling remains native link",
          document.getElementById("rich").tagName === "A" &&
            document.getElementById("rich").textContent === "Rich sibling",
        );
        check(
          "editable tree has one native Text",
          document.getElementById("editable").childNodes.length === 1 &&
            document.getElementById("editable").firstChild.nodeType === 3,
        );
        return checks;
      },
      { dpr: profile.dpr },
    );
    await page.locator("#action").focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#public").textContent(), "Saved");
    assert.equal(await page.locator("#action").evaluate((e) => e === document.activeElement), true);
    await page.evaluate(() => {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById("public"));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
    });
    await page.keyboard.press("Control+c");
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "Saved");
    await page.evaluate(() => {
      getSelection().removeAllRanges();
      return window.find("Saved");
    });
    assert.equal(await page.evaluate(() => getSelection().toString()), "Saved");
    await page.locator("#editor").click();
    await page.keyboard.press("End");
    await page.keyboard.type(" edit");
    await page.keyboard.press("Control+z");
    assert.equal(await page.locator("#editable").textContent(), "Native");
    const axe = await new AxeBuilder({ page }).analyze();
    assert.equal(axe.violations.length, 0, JSON.stringify(axe.violations));
    await page.screenshot({ path: path.join(output, `${profile.name}.png`), fullPage: true });
    report.profiles.push({
      ...profile,
      checks,
      passed: checks.filter((c) => c.passed).length,
      failed: checks.filter((c) => !c.passed),
      bundleDiagnosticGzip: gzipSync(client).length,
      noJS: true,
      keyboardClipboardFindUndo: true,
      axeViolations: axe.violations.length,
    });
    report.failures.push(...checks.filter((c) => !c.passed).map((c) => ({ profile: profile.name, ...c })));
    await context.close();
  }
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  report.resources = { browserClosed: true, httpServerClosed: true, persistentProcesses: 0, deletionAttempts: 0 };
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
assert.equal(report.failures.length, 0, JSON.stringify(report.failures));
console.log(
  JSON.stringify({
    output,
    profiles: report.profiles.map(({ name, passed, failed }) => ({ name, passed, failed })),
    resources: report.resources,
  }),
);
