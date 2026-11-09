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

const output = path.resolve(process.env.ANIMATED_NUMBER_OUTPUT);
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
  queue = ["animated-number"];
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
      include: ["components/**/*.ts", "components/**/*.tsx", "consumer.tsx"],
    },
    null,
    2,
  ),
);
await writeFile(
  path.join(output, "installed", "consumer.tsx"),
  (await readFile("tests/runtime/animated-number-types.tsx", "utf8")).replace(
    "../../registry/cadence/animated-number",
    "./components/cadence/animated-number",
  ),
);
const plugin = {
  name: "actual-payload-install",
  setup(builder) {
    builder.onResolve({ filter: /registry[\\/]cadence[\\/]/ }, (args) => ({
      path: path.join(
        installed,
        args.path.replaceAll("\\", "/").split("registry/cadence/")[1] +
          (args.path.endsWith("animated-number") ? "/index.tsx" : ".tsx"),
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
        `<!doctype html><html lang="en"><head><title>Animated number runtime</title><style>${installedCss}</style><style>body{font:20px 'Courier New',monospace;margin:30px}button{font:inherit;color:inherit}a{color:inherit} @media(prefers-color-scheme:dark){body{color:#eee;background:#111}button{background:#222}}#editor{margin-top:20px}</style></head><body><header><h1>Animated number runtime</h1></header><main id="root">${markup}</main><script>window.publicStrict=${strict}</script><script src="/client.js"></script></body></html>`,
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
    const ssr = await compile("tests/runtime/animated-number-ssr.jsx", profile.copy, true, profile.strict);
    const ssrPath = path.join(output, `${profile.name}-ssr.cjs`);
    await writeFile(ssrPath, ssr.outputFiles[0].contents);
    markup = require(ssrPath).render();
    const bundle = await compile("tests/runtime/animated-number.jsx", profile.copy, false, profile.strict);
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
    assert.equal(await native.locator("#public").textContent(), "12");
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
    await page.waitForFunction(() => window.publicNumberUpdate);
    const checks = await page.evaluate(
      async ({ dpr }) => {
        const checks = [],
          check = (name, passed, actual) => checks.push({ name, passed: !!passed, actual });
        const host = () => document.getElementById("public"),
          layer = () => document.querySelector('[data-cadence-number-owner="public"]');
        const reels = () => [...(layer()?.querySelectorAll("[data-cadence-reel]") ?? [])];
        const frame = () => new Promise((r) => requestAnimationFrame(r));
        const frames = async (n = 2) => {
          for (let i = 0; i < n; i++) await frame();
        };
        let entity = 1;
        const baseline = (value, patch = {}) =>
          window.publicNumberUpdate({
            value,
            mode: "full",
            timeScale: 3,
            direction: "trend",
            locales: undefined,
            format: undefined,
            entity: ++entity,
            ...patch,
          });
        check(
          "SSR hydration actual native baseline",
          host().textContent === "12" && host().childNodes.length === 1 && !layer(),
        );
        for (const [before, after, columns] of [
          [12, 13, 1],
          [9, 10, 2],
          [10, 9, 2],
          [99, 100, 3],
          [100, 99, 3],
          [-19, -20, 2],
          [-1, 1, 1],
          [19n, 20n, 2],
        ]) {
          baseline(before);
          const text = host().firstChild;
          window.publicNumberUpdate({ value: after });
          check(
            `${String(before)} to ${String(after)} native semantics`,
            host().textContent === String(after) && host().firstChild === text && host().childNodes.length === 1,
          );
          check(
            `${String(before)} to ${String(after)} bounded cells`,
            reels().length <= columns && reels().every((r) => r.querySelectorAll("canvas").length <= 2),
          );
          if (before === 12 || typeof before === "bigint")
            check(`${String(before)} real reel or DPR ceiling`, dpr === 1 ? reels().length === columns : !layer(), {
              reels: reels().length,
            });
          if (layer())
            check(
              "decorative cells inert and text-free",
              layer().inert && layer().getAttribute("aria-hidden") === "true" && layer().textContent === "",
            );
        }
        for (const direction of ["trend", "up", "down", "shortest"]) {
          baseline(1, { direction });
          window.publicNumberUpdate({ value: 6 });
          const target = reels()[0]?.querySelector('[data-cadence-number-cell="target"]');
          check(
            `${direction} real direction`,
            dpr === 1
              ? !!target &&
                  (direction === "down" ? target.style.transform.includes("-") : !target.style.transform.includes("-"))
              : !layer(),
            target?.style.transform,
          );
        }
        baseline(12);
        window.publicNumberUpdate({ value: 13 });
        await frames(5);
        let reel = reels()[0],
          offsets = reel && [...reel.querySelectorAll("canvas")].map((n) => n.style.transform),
          phase = Number(reel?.dataset.phase);
        check(
          "real subpixel in-flight offsets",
          dpr === 1 ? phase > 0 && phase < 1 && offsets.some((s) => s.includes(".")) : !layer(),
          phase,
        );
        window.publicNumberUpdate({ value: 12 });
        check(
          "reversal preserves actual cells and offsets",
          dpr === 1
            ? reels()[0] === reel &&
                JSON.stringify([...reel.querySelectorAll("canvas")].map((n) => n.style.transform)) ===
                  JSON.stringify(offsets)
            : !layer(),
        );
        await frame();
        const reverse = Number(reels()[0]?.dataset.phase);
        check("reverse drops opposing velocity", dpr === 1 ? reverse <= phase : !layer(), { phase, reverse });
        offsets = reels()[0] && [...reels()[0].querySelectorAll("canvas")].map((n) => n.style.transform);
        window.publicNumberUpdate({ timeScale: 5 });
        check(
          "positive clock rebase keeps painted offsets",
          dpr === 1
            ? reels()[0] === reel &&
                JSON.stringify([...reel.querySelectorAll("canvas")].map((n) => n.style.transform)) ===
                  JSON.stringify(offsets)
            : !layer(),
        );
        baseline(12);
        window.publicNumberUpdate({ value: 13 });
        window.publicNumberUpdate({ value: 14 });
        check("unsafe third digit settles latest immediately", host().textContent === "14" && !layer());
        for (const mode of ["full", "reduced", "none"]) {
          baseline(12, { mode });
          window.publicNumberUpdate({ value: 13 });
          check(`${mode} actual value and data-motion`, host().textContent === "13" && host().dataset.motion === mode);
          check(`${mode} real roll policy`, mode === "full" && dpr === 1 ? reels().length === 1 : !layer());
        }
        for (const patch of [{ mode: "reduced" }, { mode: "none" }, { timeScale: 0 }]) {
          baseline(12);
          window.publicNumberUpdate({ value: 13 });
          await frames();
          window.publicNumberUpdate(patch);
          check(
            `live cancel ${JSON.stringify(patch)}`,
            !layer() && CSS.highlights.size === 0 && host().textContent === "13",
          );
          window.publicNumberUpdate({ mode: "full", timeScale: 3 });
          await frames(3);
          check(
            `no replay or retired writer ${JSON.stringify(patch)}`,
            !layer() && CSS.highlights.size === 0 && host().textContent === "13",
          );
        }
        baseline(12, { timeScale: 0 });
        window.publicNumberUpdate({ value: 13 });
        check("initial zero clock allocates no reel", !layer());
        baseline(12);
        window.publicNumberUpdate({ value: 13 });
        window.publicNumberUpdate({ entity: ++entity, value: 42 });
        check("keyed entity is a current baseline", host().textContent === "42" && !layer());
        for (const value of [1234.56789, 123456789012345678901234567890n, NaN, Infinity, -Infinity, 1e30, -0]) {
          baseline(12);
          window.publicNumberUpdate({ value });
          check(`exact raw ${String(value)}`, host().textContent === String(value));
        }
        const policies = [
          ["en-US", { style: "currency", currency: "USD" }],
          ["de-DE", { style: "currency", currency: "EUR" }],
          ["en-US", { style: "percent", maximumFractionDigits: 2 }],
          ["en-US", { notation: "compact" }],
          ["en-US", { style: "unit", unit: "kilometer" }],
          ["ar-EG", {}],
          ["en-US", { signDisplay: "always", maximumFractionDigits: 4 }],
        ];
        for (const [locales, format] of policies) {
          baseline(19, { locales, format });
          window.publicNumberUpdate({ value: 20 });
          check(
            `native Intl ${locales} ${JSON.stringify(format)}`,
            host().textContent === new Intl.NumberFormat(locales, format).format(20),
          );
          window.publicNumberUpdate({ format: { ...format, minimumFractionDigits: 3, maximumFractionDigits: 3 } });
          check(
            `format-only no fictitious trend ${locales}`,
            !layer() &&
              host().textContent ===
                new Intl.NumberFormat(locales, {
                  ...format,
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                }).format(20),
          );
        }
        baseline(1.001, { format: { maximumFractionDigits: 2 } });
        window.publicNumberUpdate({ value: 1.002 });
        check("equal rounded output has no reel", host().textContent === "1" && !layer());
        baseline(-0, { format: { signDisplay: "always" } });
        window.publicNumberUpdate({ value: 0 });
        check("negative-zero sign is immediate affix text", host().textContent === "+0" && !layer());
        baseline(999, { locales: "en-US", format: { notation: "compact" } });
        window.publicNumberUpdate({ value: 1000 });
        check("compact scale changes exact and immediate", host().textContent === "1K" && !layer());
        baseline(111111111111);
        host().style.fontSize = "10px";
        await frames();
        window.publicNumberUpdate({ value: 222222222222 });
        check("actual twelve-column display", dpr === 1 ? reels().length === 12 : !layer(), reels().length);
        baseline(1111111111111);
        window.publicNumberUpdate({ value: 2222222222222 });
        check("thirteen-column overflow exact native", host().textContent === "2222222222222" && !layer());
        baseline(12);
        window.publicNumberUpdate({ value: 13 });
        host().hidden = true;
        await frames();
        check("hidden cancels actual layer", !layer() && CSS.highlights.size === 0);
        host().hidden = false;
        await frames();
        check("visibility restoration never replays", !layer());
        baseline(12);
        host().style.position = "relative";
        host().style.left = ".5px";
        window.publicNumberUpdate({ value: 13 });
        check(
          "fractional origin keeps exact current value and active bounded reels",
          host().textContent === "13" && (dpr === 1 ? !!layer() : !layer()),
        );
        if (dpr === 1)
          check(
            "fractional resting raster has pixel-aligned canvas origins",
            [...layer().querySelectorAll("canvas")].every((node) =>
              Number.isInteger(node.getBoundingClientRect().left),
            ),
          );
        baseline(12);
        host().dir = "rtl";
        window.publicNumberUpdate({ value: 13 });
        check("RTL native fallback", host().textContent === "13" && !layer());
        baseline(12);
        window.publicNumberUpdate({ value: 13 });
        const range = document.createRange();
        range.selectNodeContents(host());
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        document.dispatchEvent(new Event("selectionchange"));
        check("selection cancels decoration with exact current text", getSelection().toString() === "13" && !layer());
        getSelection().removeAllRanges();
        baseline(12);
        window.publicNumberUpdate({ value: 13 });
        window.publicNumberUpdate({ mounted: false });
        check(
          "unmount releases actual writer and mask",
          !host() && !document.querySelector("[data-cadence-number-layer]") && CSS.highlights.size === 0,
        );
        window.publicNumberUpdate({ mounted: true, entity: ++entity, value: 12 });
        check("display adds no announcement", !host().hasAttribute("aria-live"));
        check("rich sibling remains a native link", document.getElementById("rich").tagName === "A");
        check(
          "editable display keeps one native Text",
          document.getElementById("editable").childNodes.length === 1 &&
            document.getElementById("editable").firstChild.nodeType === 3,
        );
        return checks;
      },
      { dpr: profile.dpr },
    );
    await page.locator("#action").focus();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#public").textContent(), "13");
    assert.equal(await page.locator("#action").evaluate((e) => e === document.activeElement), true);
    await page.evaluate(() => {
      const r = document.createRange();
      r.selectNodeContents(document.getElementById("public"));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
    });
    await page.keyboard.press("Control+c");
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "13");
    await page.evaluate(() => {
      getSelection().removeAllRanges();
      return window.find("13");
    });
    assert.equal(await page.evaluate(() => getSelection().toString()), "13");
    await page.locator("#editor").click();
    await page.keyboard.press("End");
    await page.keyboard.type(" edit");
    await page.keyboard.press("Control+z");
    assert.equal(await page.locator("#editable").textContent(), "123");
    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => {
      window.compositions = [];
      document
        .getElementById("editor")
        .addEventListener("compositionstart", (e) => window.compositions.push(e.isTrusted));
      window.editNode = document.getElementById("editable").firstChild;
    });
    await page.keyboard.press("End");
    await cdp.send("Input.imeSetComposition", { text: "あ", selectionStart: 1, selectionEnd: 1 });
    assert.equal(await page.locator("#editable").textContent(), "123あ");
    for (const patch of [{ mode: "none" }, { mode: "reduced" }, { mode: "full", timeScale: 0 }, { timeScale: 3 }]) {
      await page.evaluate((patch) => window.publicNumberUpdate(patch), patch);
      assert.equal(await page.locator("#editable").textContent(), "123あ");
      assert(
        await page.locator("#editable").evaluate((e) => e.firstChild === window.editNode && e.childNodes.length === 1),
      );
    }
    assert.deepEqual(await page.evaluate(() => window.compositions), [true]);
    await cdp.send("Input.insertText", { text: "あ" });
    await page.keyboard.press("Control+z");
    assert.equal(await page.locator("#editable").textContent(), "123");
    await cdp.detach();
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
      trustedIMEAcrossModeAndClock: true,
      axeViolations: axe.violations.length,
    });
    report.failures.push(...checks.filter((c) => !c.passed).map((c) => ({ profile: profile.name, ...c })));
    await context.close();
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(url);
  await reducedPage.waitForFunction(() => window.publicNumberUpdate);
  await reducedPage.evaluate(() => window.publicNumberUpdate({ value: 13 }));
  report.osReduced = await reducedPage.locator("#public").evaluate((e) => ({
    text: e.textContent,
    mode: e.dataset.motion,
    layers: document.querySelectorAll("[data-cadence-number-layer]").length,
  }));
  assert.deepEqual(report.osReduced, { text: "13", mode: "reduced", layers: 0 });
  await reduced.close();
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
