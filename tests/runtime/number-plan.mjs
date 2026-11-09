import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

// Pure S11 browser/Intl and relative-import relocation proof. NOT a registry
// install, reel/DOM/mode/physics proof, or certification of production budgets.
assert.ok(process.env.NUMBER_PLAN_OUTPUT, "NUMBER_PLAN_OUTPUT must name a fresh directory");
const output = path.resolve(process.env.NUMBER_PLAN_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const copy = path.join(output, "relocated", "lib");
await mkdir(copy, { recursive: true });
const sources = {};
for (const name of ["number-plan.ts", "motion.ts"]) {
  const file = `registry/cadence/lib/${name}`,
    bytes = await readFile(file);
  await writeFile(path.join(copy, name), bytes);
  sources[file] = { sha256: hash(bytes), bytes: bytes.length };
  assert.equal(hash(await readFile(path.join(copy, name))), hash(bytes));
}
for (const file of ["tests/fixtures/number-plan-cases.ts", "tests/runtime/number-plan.mjs"]) {
  const bytes = await readFile(file);
  sources[file] = { sha256: hash(bytes), bytes: bytes.length };
}
const report = {
  sources,
  browser: null,
  scope: "Pure algorithms only; raw relocation, no installable numeric helper or DOM/mode evidence",
  profiles: [],
  errors: [],
  resourcesClosed: false,
};
let browser;
try {
  browser = await chromium.launch({ headless: true });
  report.browser = browser.version();
  for (const [name, entry] of [
    ["source", path.resolve("registry/cadence/lib/number-plan.ts")],
    ["relocated", path.join(copy, "number-plan.ts")],
  ]) {
    const library = await build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      metafile: true,
      format: "iife",
      globalName: "numberAlgorithms",
      minify: true,
      treeShaking: true,
    });
    const code = library.outputFiles[0].text;
    await writeFile(path.join(output, `${name}.js`), code);
    await writeFile(path.join(output, `${name}-metafile.json`), JSON.stringify(library.metafile, null, 2));
    const fixture = await build({
      entryPoints: [path.resolve("tests/fixtures/number-plan-cases.ts")],
      bundle: true,
      write: false,
      format: "iife",
      globalName: "numericCases",
      minify: true,
    });
    const page = await browser.newPage();
    page.on("pageerror", (error) => report.errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push(message.text());
    });
    await page.addScriptTag({ content: code });
    await page.addScriptTag({ content: fixture.outputFiles[0].text });
    const cases = await page.evaluate(() => {
      const passed = [];
      numericCases.numberPlanCases(numberAlgorithms, (name, condition) => {
        if (!condition) throw new Error(name);
        passed.push(name);
      });
      let rejected = false;
      try {
        numberAlgorithms.createNumberSnapshot("00123");
      } catch (error) {
        rejected = error instanceof TypeError;
      }
      if (!rejected) throw new Error("numeric strings must never be coerced");
      passed.push("numeric strings rejected");
      return passed;
    });
    report.profiles.push({
      name,
      passed: cases.length,
      cases,
      bundle: {
        bytes: Buffer.byteLength(code),
        gzip: gzipSync(code).length,
        sha256: hash(code),
        diagnosticAllExports: true,
      },
    });
    await page.close();
  }
  assert.equal(
    report.profiles[0].bundle.sha256,
    report.profiles[1].bundle.sha256,
    "Relocated executable bytes must match source",
  );
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = String(error.stack ?? error);
  throw error;
} finally {
  await browser?.close();
  report.resourcesClosed = true;
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
}
console.log(
  JSON.stringify({
    passed: report.profiles.map(({ name, passed, bundle }) => ({ name, passed, diagnosticGzip: bundle.gzip })),
    errors: report.errors,
    resourcesClosed: report.resourcesClosed,
  }),
);
