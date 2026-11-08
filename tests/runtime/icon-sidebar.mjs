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
import { runIconSidebar } from "./icon-sidebar-cases.mjs";

const output = path.resolve(
  process.env.SIDEBAR_OUTPUT ?? `.cache/motion-v2-execution/s08b2-icon/browser-${Date.now()}`,
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
        // biome-ignore lint/suspicious/noTemplateCurlyInString: exact source fault-injection anchor
        const anchor = "width: `${projected()}px`";
        assert.equal(source.split(anchor).length, 2);
        // biome-ignore lint/suspicious/noTemplateCurlyInString: intentionally emits literal source
        const changed = source.replace(anchor, "width: `${baseline.width}px`");
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
  define: {
    SIDEBAR_ICON_SSR: "true",
    "process.env.NODE_ENV": JSON.stringify(process.env.SIDEBAR_STRICT ? "development" : "production"),
  },
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
  define: { SIDEBAR_ICON_SSR: "true" },
});
await writeFile(path.join(output, "ssr.cjs"), ssr.outputFiles[0].text);
const markup = require(path.join(output, "ssr.cjs")).html;
const inputs = async (meta) =>
  Object.fromEntries(
    await Promise.all(Object.keys(meta.inputs).map(async (file) => [file, hash(await readFile(file))])),
  );
const report = {
  casesSHA: hash(await readFile(new URL("./icon-sidebar-cases.mjs", import.meta.url))),
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
      : `<!doctype html><html class="${process.env.SIDEBAR_DARK ? "dark" : ""}"><style>${css}body{margin:0}#editor{margin:20px;width:250px}main{min-width:0}</style><body class="bg-background text-foreground font-sans"><div id="root">${markup}</div><script>window.sidebarSSR=true;window.sidebarStrict=${Boolean(process.env.SIDEBAR_STRICT)}</script><script src="/bundle.js"></script></body>`,
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
    const group = document.querySelector('[data-slot="sidebar-group-label"]');
    const label = document.querySelector('[data-slot="sidebar-menu-button"] > span:last-child');
    return {
      gap: gap.getBoundingClientRect().width,
      width: panel.getBoundingClientRect().width,
      effects: gap.getAnimations().length + panel.getAnimations().length,
      labels: label
        ? {
            opacity: getComputedStyle(label).opacity,
            paintWidth: Math.max(
              0,
              Math.min(label.getBoundingClientRect().right, label.parentElement.getBoundingClientRect().right) -
                Math.max(label.getBoundingClientRect().left, label.parentElement.getBoundingClientRect().left),
            ),
            width: getComputedStyle(label).width,
            text: label.textContent,
            effects: label.getAnimations().length,
          }
        : null,
      group: group
        ? {
            opacity: getComputedStyle(group.firstElementChild).opacity,
            scroll: group.scrollWidth,
            width: group.clientWidth,
          }
        : null,
      scroll: document.documentElement.scrollWidth,
      viewport: innerWidth,
      contentScroll: document.querySelector('[data-slot="sidebar-content"]').scrollWidth,
      contentWidth: document.querySelector('[data-slot="sidebar-content"]').clientWidth,
    };
  });
const reset = async () => {
  await page.evaluate(() => window.sidebarReset());
  await page.waitForTimeout(80);
};
const check = async (name, run) => {
  try {
    const evidence = await run();
    report.cases.push({ name, passed: true, evidence });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.cases.push({ name, passed: false });
    report.failures.push({ name, message: error.stack });
    console.log(`FAIL ${name}: ${error.message}`);
  }
};
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => Boolean(window.sidebarUpdate));
  report.react = await page.evaluate(() => window.sidebarReact);
  await runIconSidebar({ page, update, sample, reset, check, output });
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
