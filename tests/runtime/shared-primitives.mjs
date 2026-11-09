import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import ts from "typescript";
import { installationCss } from "../../scripts/installation.mjs";
import { componentExecutionPlugin } from "../component-execution-plugin.mjs";

assert(process.env.SHARED_PRIMITIVES_OUTPUT, "Use a fresh evidence directory");
const out = path.resolve(process.env.SHARED_PRIMITIVES_OUTPUT);
await mkdir(out, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const reactRoot = process.env.SHARED_PRIMITIVES_REACT_ROOT;
const expectedReact = JSON.parse(
  await readFile(require.resolve("react/package.json", { paths: [reactRoot ?? process.cwd()] })),
).version;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = { inputs: {}, installations: {}, matrix: [], failures: [], errors: [] };
report.instrumented = process.env.SHARED_PRIMITIVES_OBSERVER === "1";
report.reactDependencyRoot = reactRoot ?? "workspace dependency graph";
const styles = new Map();
const union = path.join(out, "union/components/cadence");
for (const entry of ["animated-text", "animated-number", "reveal", "reveal-group"]) {
  const root = path.join(out, entry, "components/cadence");
  const seen = new Set();
  const queue = [entry];
  const files = [];
  const runtimeImports = [];
  const dependencies = new Set(["react", "react-dom"]);
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    const bytes = await readFile(`public/r/${id}.json`);
    report.inputs[`public/r/${id}.json`] = hash(bytes);
    const item = JSON.parse(bytes);
    for (const dep of item.dependencies ?? []) dependencies.add(dep);
    if (item.css || item.cssVars) styles.set(id, installationCss(item));
    for (const dep of item.registryDependencies ?? []) {
      assert(dep.startsWith("@cadence/"), "Only explicit same-registry dependencies");
      queue.push(dep.slice(9));
    }
    for (const file of item.files ?? []) {
      assert(file.target.startsWith("@components/cadence/") && !file.target.includes(".."));
      const relative = file.target.slice("@components/cadence/".length);
      for (const destination of [path.resolve(root, relative), path.resolve(union, relative)]) {
        assert(destination.startsWith(out + path.sep));
        await mkdir(path.dirname(destination), { recursive: true });
        if (existsSync(destination)) assert.equal(hash(await readFile(destination)), hash(file.content));
        else await writeFile(destination, file.content);
      }
      assert.equal(hash(file.content), hash(await readFile(file.path)), "Payload/source freshness");
      // Installing beneath this repository must not conceal an undeclared host
      // package. Check every copied runtime import against the payload closure.
      const ast = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
      for (const node of ast.statements) {
        if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly) continue;
        const specifier = node.moduleSpecifier.text;
        if (specifier.startsWith(".")) continue;
        const bindings = node.importClause?.namedBindings;
        if (
          bindings &&
          ts.isNamedImports(bindings) &&
          !node.importClause.name &&
          bindings.elements.every((element) => element.isTypeOnly)
        )
          continue;
        const name = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
        runtimeImports.push({ runtimePackage: name, source: file.path });
      }
      files.push({ source: file.path, sha256: hash(file.content) });
    }
  }
  for (const file of runtimeImports)
    assert(dependencies.has(file.runtimePackage), `${entry}: undeclared package ${file.runtimePackage}`);
  const name = {
    "animated-text": "AnimatedText",
    "animated-number": "AnimatedNumber",
    reveal: "Reveal",
    "reveal-group": "RevealGroup",
  }[entry];
  const usage =
    entry === "animated-text"
      ? 'value="Native"'
      : entry === "animated-number"
        ? "value={12n}"
        : entry === "reveal"
          ? "render={<section />}"
          : 'replay="repeat" stagger="cycle"';
  await writeFile(
    path.join(out, entry, "consumer.tsx"),
    `import {${name}} from './components/cadence/${entry}';export const Example=()=> <${name} ${usage} />;`,
  );
  const config = path.join(out, entry, "tsconfig.json");
  await writeFile(
    config,
    JSON.stringify({
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
      include: ["components/**/*", "consumer.tsx"],
    }),
  );
  const tsc = spawnSync(process.execPath, [require.resolve("typescript/bin/tsc"), "--project", config], {
    encoding: "utf8",
    windowsHide: true,
  });
  await writeFile(path.join(out, entry, "typecheck.log"), tsc.stdout + tsc.stderr);
  assert.equal(tsc.status, 0, tsc.stdout + tsc.stderr);
  report.installations[entry] = {
    items: [...seen],
    files,
    runtimeImports,
    dependencies: [...dependencies],
    typecheck: tsc.status,
  };
}
const sourceRoot = path.resolve("registry/cadence");
const plugin = {
  name: "installed-only-no-workspace-fallback",
  setup(builder) {
    if (report.instrumented) {
      const observer = componentExecutionPlugin();
      builder.onResolve({ filter: /^(vitest|node:crypto|.*motion-observer)$/ }, () => ({
        path: path.resolve("tests/fixtures/motion-v2/browser-observations.mjs"),
      }));
      builder.onLoad({ filter: /[\\/]components[\\/]cadence[\\/].*\.[jt]sx?$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");
        const transformed = observer.transform(source, args.path);
        return {
          contents: transformed?.code ?? source,
          loader: args.path.endsWith("x") ? "tsx" : "ts",
          resolveDir: path.dirname(args.path),
        };
      });
    }
    if (reactRoot)
      builder.onResolve({ filter: /^(react|react-dom)(\/.*)?$/ }, (args) => ({
        path: require.resolve(args.path, { paths: [reactRoot] }),
      }));
    builder.onResolve({ filter: /^\./ }, (args) => {
      const source = path.resolve(args.resolveDir, args.path);
      if (!source.startsWith(sourceRoot + path.sep)) return;
      const target = path.join(union, path.relative(sourceRoot, source));
      const installed = [target, `${target}.ts`, `${target}.tsx`, path.join(target, "index.tsx")].find(
        (p) => existsSync(p) && /\.[jt]sx?$/.test(p),
      );
      assert(installed, `Missing installed dependency ${source}`);
      return { path: installed };
    });
  },
};
const compile = async (options) => {
  const bundle = await build({
    bundle: true,
    write: false,
    metafile: true,
    jsx: "automatic",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    ...options,
  });
  for (const input of Object.keys(bundle.metafile.inputs)) {
    if (existsSync(input)) report.inputs[input] = hash(await readFile(input));
    assert(!input.replaceAll("\\", "/").includes("registry/cadence/"), "No source fallback in copied consumer");
  }
  return bundle;
};
const fixture = "tests/runtime/shared-primitives.jsx";
report.inputs[fixture] = hash(await readFile(fixture));
report.inputs["tests/runtime/shared-primitives.mjs"] = hash(await readFile(new URL(import.meta.url)));
if (report.instrumented)
  for (const file of ["tests/component-execution-plugin.mjs", require.resolve("typescript")])
    report.inputs[file] = hash(await readFile(file));
const ssr = await compile({
  entryPoints: ["tests/runtime/shared-primitives-ssr.jsx"],
  platform: "node",
  format: "cjs",
  packages: reactRoot ? undefined : "external",
  plugins: [
    report.instrumented
      ? {
          ...plugin,
          setup(builder) {
            const was = report.instrumented;
            report.instrumented = false;
            plugin.setup(builder);
            report.instrumented = was;
          },
        }
      : plugin,
  ],
});
await writeFile(path.join(out, "ssr.cjs"), ssr.outputFiles[0].contents);
const render = require(path.join(out, "ssr.cjs")).render;
const client = await compile({
  entryPoints: [fixture],
  format: "iife",
  plugins: [plugin],
  define: { "process.env.NODE_ENV": '"development"' },
});
await writeFile(path.join(out, "client.js"), client.outputFiles[0].contents);
await writeFile(path.join(out, "client-metafile.json"), JSON.stringify(client.metafile, null, 2));
const cssInput = `@import "tailwindcss";\n${[...styles.values()].join("\n")}`;
await writeFile(path.join(out, "theme.css"), cssInput);
const css = (
  await require("postcss")([require("@tailwindcss/postcss")()]).process(cssInput, { from: path.join(out, "theme.css") })
).css;
await writeFile(path.join(out, "theme-built.css"), css);
let browser,
  server,
  initialMode = "full";
try {
  server = http.createServer((req, res) => {
    res.setHeader("Content-Type", req.url === "/client.js" ? "text/javascript" : "text/html");
    res.end(
      req.url === "/client.js"
        ? client.outputFiles[0].contents
        : `<!doctype html><meta charset="utf-8"><title>Shared primitives</title><style>${css}body{margin:40px;min-height:2600px;font:20px 'Courier New',monospace} [data-slot="animated-text"],[data-slot="animated-number"]{display:block;width:max-content} @media(prefers-color-scheme:dark){body{color:#eee;background:#111}}</style><main id="root">${render(initialMode)}</main><div id="portal"></div><script>window.sharedInitialMode=${JSON.stringify(initialMode)}</script><script src="/client.js"></script>`,
    );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  for (const theme of ["light", "dark"])
    for (const os of ["no-preference", "reduce"])
      for (const mode of ["full", "reduced", "none"]) {
        initialMode = mode;
        const context = await browser.newContext({
          colorScheme: theme,
          reducedMotion: os,
          viewport: { width: 1280, height: 900 },
        });
        const page = await context.newPage();
        const row = { theme, os, mode, checks: [] };
        report.matrix.push(row);
        const check = (name, actual) => {
          row.checks.push({ name, passed: !!actual });
          assert(actual, `${theme}/${os}/${mode}: ${name}`);
        };
        page.on("pageerror", (e) => report.errors.push(String(e)));
        page.on("console", (m) => {
          if (m.type() === "error") report.errors.push(m.text());
        });
        await page.route("**/client.js", (route) => route.fulfill({ body: "", contentType: "text/javascript" }));
        await page.goto(url);
        check(
          "SSR first paint is exact readable native content",
          await page.evaluate(
            () =>
              ["local", "nested"].every(
                (p) =>
                  document.getElementById(`${p}-text`).textContent === "Save" &&
                  document.getElementById(`${p}-number`).textContent === "12",
              ) &&
              [...document.querySelectorAll('[data-slot="reveal"]')].every(
                (n) => getComputedStyle(n).opacity === "1" && getComputedStyle(n).transform === "none",
              ),
          ),
        );
        await page.unroute("**/client.js");
        await page.addScriptTag({ url: `${url}/client.js` });
        await page.waitForFunction(() => window.sharedUpdate && document.getElementById("portal-text"));
        report.reactVersion = await page.evaluate(() => window.sharedReactVersion);
        assert.equal(report.reactVersion, expectedReact, "actual consumer React version");
        // Hydration and client insertion have distinct native lifecycles in
        // React19.0. Prove hydration, then actual createRoot StrictMode replay;
        // never manufacture replay by invoking effect callbacks ourselves.
        const hydrated = await page.evaluate(() => ({ ...window.sharedLifecycle }));
        row.hydrationLifecycle = hydrated;
        check(
          "hydration preserves exact native current values before client replacement",
          await page.evaluate(
            () =>
              document.getElementById("local-text").textContent === "Save" &&
              document.getElementById("local-number").textContent === "12",
          ),
        );
        await page.evaluate(() => window.sharedRemount());
        await page.waitForFunction(
          (before) =>
            window.sharedLifecycle?.setups >= before.setups + 2 &&
            window.sharedLifecycle.cleanups >= before.cleanups + 2 &&
            document.getElementById("portal-text"),
          hydrated,
        );
        row.lifecycle = await page.evaluate(() => ({ ...window.sharedLifecycle }));
        check(
          "development StrictMode executes real setup/cleanup replay",
          row.lifecycle.setups >= hydrated.setups + 2 && row.lifecycle.cleanups >= hydrated.cleanups + 2,
        );
        const full = mode === "full" && os === "no-preference";
        const effective = mode === "none" ? "none" : os === "reduce" ? "reduced" : mode;
        check(
          "nested and portalled effective mode",
          await page.evaluate(
            (expected) =>
              ["local", "nested", "portal"].every(
                (p) =>
                  document.getElementById(`${p}-text`).dataset.motion === expected &&
                  document.getElementById(`${p}-number`).dataset.motion === expected,
              ),
            effective,
          ),
        );
        if (full)
          await page.waitForFunction(() => document.getElementById("later").hasAttribute("data-cadence-reveal"));
        check(
          "first screen never replays",
          await page
            .locator("#first")
            .evaluate((n) => !n.hasAttribute("data-cadence-reveal") && !n.getAnimations().length),
        );
        await page.evaluate(() => window.sharedUpdate({ text: "Saved", number: 13 }));
        const active = await page.evaluate(() =>
          ["local", "nested", "portal"].map((prefix) => ({
            text: [...document.querySelectorAll(`[data-cadence-text-owner="${prefix}-text"] canvas`)].flatMap((n) =>
              n.getAnimations(),
            ).length,
            numbers: document.querySelectorAll(`[data-cadence-number-owner="${prefix}-number"] [data-cadence-reel]`)
              .length,
          })),
        );
        check(
          "actual text and number policy",
          active.every((owner) => owner.text > 0 === (effective !== "none") && owner.numbers > 0 === full),
        );
        check(
          "current values remain single native Text nodes",
          await page.evaluate(() =>
            ["local", "nested", "portal"].every((p) =>
              ["text", "number"].every((kind) => {
                const n = document.getElementById(`${p}-${kind}`);
                return (
                  n.childNodes.length === 1 &&
                  n.firstChild.nodeType === 3 &&
                  n.textContent === (kind === "text" ? "Saved" : "13")
                );
              }),
            ),
          ),
        );
        await page.evaluate(() => window.sharedUpdate({ clock: 5 }));
        await page.evaluate(() => window.sharedUpdate({ clock: 0 }));
        check(
          "same-target zero cancels every primitive before another frame",
          await page.evaluate(
            () =>
              !document.querySelector("[data-cadence-text-layer],[data-cadence-number-layer],[data-cadence-reveal]") &&
              CSS.highlights.size === 0,
          ),
        );
        await page.evaluate(() => window.sharedUpdate({ clock: 3 }));
        check(
          "positive restoration does not replay",
          await page.evaluate(
            () =>
              !document.querySelector("[data-cadence-text-layer],[data-cadence-number-layer],[data-cadence-reveal]"),
          ),
        );
        await page.evaluate(() => window.sharedUpdate({ text: "Save", number: 12 }));
        await page.evaluate(() => window.sharedUpdate({ mode: "none" }));
        check(
          "live none cancels all registered owners synchronously",
          await page.evaluate(
            () =>
              !document.querySelector("[data-cadence-text-layer],[data-cadence-number-layer],[data-cadence-reveal]") &&
              CSS.highlights.size === 0,
          ),
        );
        await page.evaluate(() => window.sharedUpdate({ childMode: "full" }));
        check(
          "explicit nested full uses authored input with OS ceiling",
          (await page.locator("#portal-number").getAttribute("data-motion")) === (os === "reduce" ? "reduced" : "full"),
        );
        await page.locator("#editor").click();
        await page.keyboard.press("End");
        await page.keyboard.type(" edit");
        const edited = await page.locator("#editor").textContent();
        await page.evaluate(() => window.sharedUpdate({ clock: 0, mode: "reduced" }));
        check("live restrictions preserve native editing", (await page.locator("#editor").textContent()) === edited);
        await page.keyboard.press("Control+z");
        check("native undo remains intact", (await page.locator("#editor").textContent()) === "Native123");
        const cdp = await context.newCDPSession(page);
        await page.evaluate(() => {
          const editor = document.getElementById("editor");
          window.sharedCompositionEvents = [];
          editor.addEventListener("compositionstart", (e) => window.sharedCompositionEvents.push(e.isTrusted));
          window.sharedEditingNodes = [...editor.querySelectorAll("span")].map((n) => n.firstChild);
        });
        await page.keyboard.press("End");
        await cdp.send("Input.imeSetComposition", { text: "あ", selectionStart: 1, selectionEnd: 1 });
        const composing = await page.locator("#editor").textContent();
        await page.evaluate(() => window.sharedUpdate({ mode: "full", childMode: undefined, clock: 5 }));
        check(
          "trusted IME and editing nodes survive live policy restoration",
          composing.includes("あ") &&
            (await page.locator("#editor").textContent()) === composing &&
            (await page.evaluate(() => {
              const nodes = [...document.getElementById("editor").querySelectorAll("span")];
              return nodes.every((n, index) => n.firstChild === window.sharedEditingNodes[index]);
            })),
        );
        assert.deepEqual(await page.evaluate(() => window.sharedCompositionEvents), [true]);
        await cdp.send("Input.insertText", { text: "あ" });
        await page.keyboard.press("Control+z");
        check("IME undo retains exact native content", (await page.locator("#editor").textContent()) === "Native123");
        await cdp.detach();
        await page.evaluate(() => {
          const range = document.createRange();
          range.selectNodeContents(document.getElementById("local-text"));
          getSelection().removeAllRanges();
          getSelection().addRange(range);
        });
        await page.evaluate(() => window.sharedUpdate({ mode: "none", clock: 3 }));
        check(
          "native selection survives same-target policy edit",
          await page.evaluate(() => getSelection().toString() === "Save"),
        );
        await page.evaluate(() => getSelection().removeAllRanges());
        await page.locator("#action").focus();
        await page.keyboard.press("Space");
        check(
          "keyboard commit keeps native focus and exact values",
          await page.evaluate(
            () =>
              document.activeElement.id === "action" && document.getElementById("local-number").textContent === "13",
          ),
        );
        await page.evaluate(() => window.sharedUpdate({ mounted: false }));
        check(
          "StrictMode physical cleanup releases portal, masks and all decoration",
          await page.evaluate(
            () =>
              !document.querySelector(
                '[data-slot="animated-text"],[data-slot="animated-number"],[data-slot="reveal"],[data-cadence-text-layer],[data-cadence-number-layer]',
              ) && CSS.highlights.size === 0,
          ),
        );
        await page.evaluate(() => window.sharedRoot.unmount());
        check(
          "actual root unmount balances every replayed effect",
          await page.evaluate(() => window.sharedLifecycle.cleanups === window.sharedLifecycle.setups),
        );
        await context.close();
      }
  assert.deepEqual(report.errors, []);
} catch (e) {
  report.failures.push(String(e.stack));
} finally {
  await browser?.close();
  if (server) await new Promise((r) => server.close(r));
  report.resourcesClosed = true;
  await writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    installations: Object.keys(report.installations),
    reactVersion: report.reactVersion,
    matrix: report.matrix.map(({ theme, os, mode, checks }) => ({ theme, os, mode, passed: checks.length })),
    failures: report.failures,
    errors: report.errors,
  }),
);
if (report.failures.length || report.errors.length) process.exitCode = 1;
