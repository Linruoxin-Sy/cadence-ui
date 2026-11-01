// Diagnostic only: actual registry Button/preview, React SSR + hydration, no Next runtime.
// Run: node scripts/experiment-react-ssr-budget.mjs
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { measureInitialScripts } from "./site-js-budget.mjs";

const require = createRequire(import.meta.url);
const viteRequire = createRequire(createRequire(require.resolve("vitest/node")).resolve("vite"));
const { build, version: esbuildVersion } = await import(pathToFileURL(viteRequire.resolve("esbuild")));
const root = process.cwd();
const lean = process.argv.includes("--dom-animation");
const fence = process.argv.includes("--fence");
const dir = path.join(root, `.cache/react-ssr-budget${lean ? "-lean" : ""}${fence ? "-fence" : ""}`);
await mkdir(dir, { recursive: true });
if (lean) {
  // Explicit experimental fork; never rewrites registry source or changes public imports.
  const source = await readFile(path.join(root, "registry/cadence/button/index.tsx"), "utf8");
  assert.ok(source.includes('import { motion } from "motion/react";'));
  const fork = source
    .replace(
      'import { motion } from "motion/react";',
      'import * as motion from "motion/react-m";\nimport { LazyMotion, domAnimation } from "motion/react";',
    )
    .replaceAll('"../lib/', '"../../registry/cadence/lib/')
    .replace("    <ButtonPrimitive", "    <LazyMotion features={domAnimation}><ButtonPrimitive")
    .replace("    />\n  );", "    /></LazyMotion>\n  );");
  assert.ok(fork.includes("</LazyMotion>"));
  await writeFile(path.join(dir, "button.tsx"), fork);
}
const app = `import { useState } from "react";
${fence ? 'import { CodeBlock, CodeBlockHeader, CodeBlockTitle, CodeBlockActions, CodeBlockCopyButton, CodeBlockContent } from "../../registry/cadence/code-block";' : ""}
import { ButtonPreview } from "../../components/site/previews/button";
import { Button } from "../../registry/cadence/button";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
export function App() {
  const [count, setCount] = useState(0);
  return <CadenceProvider><main><h1>SSR boundary diagnostic</h1>
    <div data-preview="button"><ButtonPreview /></div>
    <Button onClick={() => setCount(count + 1)}>Count {count}</Button>
    ${fence ? '<CodeBlock><CodeBlockHeader><CodeBlockTitle>Usage</CodeBlockTitle><CodeBlockActions><CodeBlockCopyButton value="example" /></CodeBlockActions></CodeBlockHeader><CodeBlockContent>example</CodeBlockContent></CodeBlock>' : ""}
  </main></CadenceProvider>;
}`;
await writeFile(path.join(dir, "app.jsx"), app);
await writeFile(
  path.join(dir, "client.jsx"),
  `import { hydrateRoot } from "react-dom/client";
import { App } from "./app";
hydrateRoot(document.getElementById("root"), <App />, {
  onRecoverableError(error) { window.__hydrationErrors.push(error.message); }
});`,
);
await writeFile(
  path.join(dir, "server.jsx"),
  `import { renderToString } from "react-dom/server";
import { App } from "./app";
export const html = renderToString(<App />);`,
);
const plugins = lean
  ? [
      {
        name: "diagnostic-button-fork",
        setup(builder) {
          builder.onResolve({ filter: /(?:cadence\/button|@\/registry\/cadence\/button)$/ }, () => ({
            path: path.join(dir, "button.tsx"),
          }));
        },
      },
    ]
  : [];
const common = {
  bundle: true,
  jsx: "automatic",
  plugins,
  tsconfig: path.join(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "error",
};
const client = await build({
  ...common,
  entryPoints: [path.join(dir, "client.jsx")],
  outdir: path.join(dir, "browser"),
  splitting: true,
  platform: "browser",
  format: "esm",
  minify: true,
  metafile: true,
});
await build({
  ...common,
  entryPoints: [path.join(dir, "server.jsx")],
  outfile: path.join(dir, "server.mjs"),
  platform: "node",
  format: "esm",
  packages: "external",
});
const { html } = await import(pathToFileURL(path.join(dir, "server.mjs")));
const document = `<!doctype html><html lang="en"><head><title>SSR diagnostic</title></head><body>
<div id="root">${html}</div><script>window.__hydrationErrors=[]</script>
<script type="module" src="/client.js"></script></body></html>`;
const server = createServer(async (req, res) => {
  const filename = new URL(req.url, "http://fixture.invalid").pathname.slice(1);
  const knownOutput = Object.keys(client.metafile.outputs).some((output) => path.basename(output) === filename);
  if (knownOutput) {
    res.setHeader("Content-Type", "text/javascript");
    res.end(await readFile(path.join(dir, "browser", filename)));
  } else {
    res.setHeader("Content-Type", "text/html");
    res.end(document);
  }
});
// OS-selected unused port; never reuses a user's server.
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge" });
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  const url = `http://127.0.0.1:${server.address().port}/components/button`;
  const report = await measureInitialScripts(page, url);
  console.log(JSON.stringify({ gzipBytes: report.gzipBytes, scripts: report.files.length }));
  assert.equal(report.errors.length, 0);
  assert.ok(report.files.every((file) => file.status === 200));
  assert.equal(await page.locator('[data-preview="button"] [data-slot="button"]').count(), 16);
  await page.getByRole("button", { name: "Count 0", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Count 1", exact: true }).waitFor();
  const modes = [];
  for (const mode of ["full", "reduced", "none"]) {
    await page.getByLabel("Button motion").selectOption(mode);
    await page.waitForFunction(
      (m) =>
        [...document.querySelectorAll('[data-preview="button"] [data-slot="button"]')].every(
          (el) => el.dataset.motion === m,
        ),
      mode,
    );
    const button = page.locator('[data-preview="button"] [data-slot="button"]').first();
    await button.click();
    await button.hover();
    await page.mouse.down();
    await page.waitForTimeout(250);
    const transform = await button.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.up();
    if (mode === "full") {
      const heldScale = await button.evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
      assert.ok(heldScale > 0.96 && heldScale < 0.98, transform);
    } else assert.ok(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)", transform);
    modes.push({ mode, heldTransform: transform });
  }
  assert.deepEqual(await page.evaluate(() => window.__hydrationErrors), []);
  // No JavaScript still exposes every actual preview button: SSR is retained.
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const ssrPage = await noJS.newPage();
  await ssrPage.goto(url);
  assert.equal(await ssrPage.locator('[data-preview="button"] [data-slot="button"]').count(), 16);
  const loaded = new Set(report.files.map((file) => new URL(file.url).pathname.slice(1)));
  const modules = Object.entries(client.metafile.outputs)
    .filter(([output]) => loaded.has(path.basename(output)))
    .map(([, output]) => output)
    .flatMap((output) =>
      Object.entries(output.inputs).map(([module, value]) => ({ module, bytesInOutput: value.bytesInOutput })),
    )
    .sort((a, b) => b.bytesInOutput - a.bytesInOutput);
  const result = {
    scope: "Diagnostic subset, not full site or budget closure",
    lean,
    fence,
    esbuildVersion,
    react: require("react/package.json").version,
    report,
    modes,
    ssrButtons: 16,
    modules,
  };
  await writeFile(path.join(dir, "report.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        gzipBytes: report.gzipBytes,
        scripts: report.files.length,
        modes,
        report: path.relative(root, path.join(dir, "report.json")),
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
