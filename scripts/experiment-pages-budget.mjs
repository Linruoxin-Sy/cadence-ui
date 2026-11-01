// Diagnostic Next Pages boundary; does not modify the product app/config.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "@playwright/test";
import { measureInitialScripts } from "./site-js-budget.mjs";

const require = createRequire(import.meta.url);
const preview = process.argv.includes("--preview");
const root = process.cwd();
const dir = path.join(root, preview ? ".cache/js-pages-preview" : ".cache/js-pages-counter");
await mkdir(path.join(dir, "pages"), { recursive: true });
await writeFile(path.join(dir, "package.json"), '{"private":true,"type":"module"}\n');
await writeFile(
  path.join(dir, "next.config.mjs"),
  `export default {
  reactCompiler: true, experimental: {cpus: 2, optimizePackageImports: ["lucide-react", "motion"]}
};\n`,
);
await writeFile(
  path.join(dir, "jsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      baseUrl: "../..",
      paths: { "@/*": ["./*"] },
    },
  }),
);
await writeFile(
  path.join(dir, "pages/index.jsx"),
  preview
    ? `import { ButtonPreview } from "../../../components/site/previews/button";
export default function Page() { return <div data-preview="button"><ButtonPreview /></div>; }`
    : `import { useState } from "react";
export default function Page() { const [n, setN] = useState(0);
return <div data-preview="button"><button onClick={() => setN(n + 1)}>Count {n}</button></div>; }`,
);
const env = { ...process.env, RAYON_NUM_THREADS: "2", NODE_OPTIONS: "--max-old-space-size=768" };
delete env.CADENCE_DIST_DIR;
const next = require.resolve("next/dist/bin/next");
const builder = spawn(process.execPath, [next, "build", dir], { env, stdio: "inherit" });
assert.equal(await new Promise((resolve) => builder.on("exit", resolve)), 0, "fixture build failed");
const server = spawn(process.execPath, [next, "start", dir, "--hostname", "127.0.0.1", "--port", "0"], { env });
let browser;
try {
  const url = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => reject(new Error("fixture server not ready")), 30_000);
    server.stdout.on("data", (data) => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match && output.includes("Ready")) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited ${code}`));
    });
    server.stderr.on("data", (data) => process.stderr.write(data));
  });
  browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge" });
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  const report = await measureInitialScripts(page, url);
  assert.deepEqual(report.errors, []);
  assert.ok(report.files.every((file) => file.status === 200));
  if (preview) {
    assert.equal(await page.locator('[data-slot="button"]').count(), 16);
    await page.getByLabel("Button motion").selectOption("none");
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[data-slot="button"]')].every((el) => el.dataset.motion === "none"),
    );
  } else {
    await page.getByRole("button", { name: "Count 0" }).focus();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Count 1" }).waitFor();
  }
  const result = {
    scope: "Diagnostic subset, not full site or budget closure",
    preview,
    next: require("next/package.json").version,
    react: require("react/package.json").version,
    buildId: (await readFile(path.join(dir, ".next/BUILD_ID"), "utf8")).trim(),
    report,
  };
  await writeFile(path.join(dir, "report.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(
    JSON.stringify({
      gzipBytes: report.gzipBytes,
      scripts: report.files.length,
      report: path.relative(root, path.join(dir, "report.json")),
    }),
  );
} finally {
  await browser?.close();
  server.kill();
  await new Promise((resolve) => (server.exitCode !== null ? resolve() : server.once("exit", resolve)));
}
