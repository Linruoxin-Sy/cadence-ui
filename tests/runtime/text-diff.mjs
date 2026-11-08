import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";

// No app/DOM controller is installed by S09. Exercise the pure module in the real
// browser and in a raw relocated relative-import tree; this is NOT a CLI install.
const output = path.resolve(process.env.TEXT_DIFF_OUTPUT);
await mkdir(output, { recursive: false });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const sources = {};
const copy = path.join(output, "relocated", "lib");
await mkdir(copy, { recursive: true });
for (const name of ["text-diff.ts", "motion.ts"]) {
  const file = `registry/cadence/lib/${name}`;
  const bytes = await readFile(file);
  await writeFile(path.join(copy, name), bytes);
  sources[file] = { sha256: hash(bytes), bytes: bytes.length };
  assert.equal(hash(await readFile(path.join(copy, name))), hash(bytes));
}
const report = { sources, scope: "pure algorithm, no component/DOM capability claim", profiles: [], errors: [] };
let browser;
try {
  browser = await chromium.launch({ headless: true });
  for (const [name, entry] of [
    ["source", path.resolve("registry/cadence/lib/text-diff.ts")],
    ["relocated", path.join(copy, "text-diff.ts")],
  ]) {
    const bundle = await build({
      entryPoints: [entry],
      bundle: true,
      write: false,
      metafile: true,
      format: "iife",
      globalName: "textAlgorithms",
      minify: true,
      treeShaking: true,
    });
    const code = bundle.outputFiles[0].text;
    await writeFile(path.join(output, `${name}.js`), code);
    await writeFile(path.join(output, `${name}-metafile.json`), JSON.stringify(bundle.metafile, null, 2));
    const page = await browser.newPage();
    page.on("pageerror", (error) => report.errors.push(String(error)));
    page.on("console", (message) => {
      if (message.type() === "error") report.errors.push(message.text());
    });
    await page.addScriptTag({ content: code });
    const cases = await page.evaluate(() => {
      const {
        createTextSnapshot: baseline,
        diffText: diff,
        shapeTextDiff: shape,
        boundTextRevision: bound,
      } = textAlgorithms;
      const cases = [];
      const check = (name, predicate) => {
        if (!predicate) throw new Error(name);
        cases.push(name);
      };
      for (const [before, after, retained, expected] of [
        ["Save", "Saved", 4, [["", "d"]]],
        ["Send", "Sent", 3, [["d", "t"]]],
        ["aba", "aaba", 3, [["", "a"]]],
        [
          "aXbYc",
          "aPbQc",
          3,
          [
            ["X", "P"],
            ["Y", "Q"],
          ],
        ],
        [
          "a\nb\tc",
          "a\nB\tC",
          3,
          [
            ["b", "B"],
            ["c", "C"],
          ],
        ],
        ["e\u0301👩🏽‍💻", "e\u0301👨‍👩‍👧‍👦", 1, [["👩🏽‍💻", "👨‍👩‍👧‍👦"]]],
      ]) {
        const old = baseline(before);
        const plan = diff(old, after);
        check(
          `${before} → ${after}`,
          plan.immediate === null &&
            plan.snapshot.value === after &&
            plan.snapshot.units.filter((unit) => old.units.includes(unit)).length === retained &&
            JSON.stringify(
              plan.runs.map((run) => [
                run.outgoing.map((u) => u.text).join(""),
                run.incoming.map((u) => u.text).join(""),
              ]),
            ) === JSON.stringify(expected),
        );
        if (before === "aba")
          check(
            "original suffix identities",
            old.units.every((unit, i) => unit === plan.snapshot.units[i + 1]),
          );
      }
      for (const [before, after] of [
        ["سلام", "سليم"],
        ["שָׁלוֹם", "שלום!"],
        ["कर्म", "धर्म"],
        ["office", "offices"],
      ]) {
        const plan = shape(diff(baseline(before), after));
        check(
          `unproven shaping ${before}`,
          plan.immediate === "shaping" && !plan.runs.length && plan.snapshot.value === after,
        );
      }
      const safe = diff(baseline("Save"), "Saved");
      const proof = { before: new Set([4]), after: new Set([4, 5]) };
      check("explicit boundary proof", shape(safe, proof) === safe);
      check("native eligibility wins", shape(safe, proof, true).immediate === "native");
      check("2048 complete graphemes", baseline("👩🏽‍💻".repeat(2048)).units.length === 2048);
      const oversize = "👩🏽‍💻".repeat(2049);
      check(
        "2049 exact immediate",
        baseline(oversize).unavailable === "input" && baseline(oversize).value === oversize,
      );
      const exact = diff(baseline(`X${"a".repeat(62)}Y`), `P${"a".repeat(62)}Q`);
      const excess = diff(baseline(`X${"a".repeat(63)}Y`), `P${"a".repeat(63)}Q`);
      check("4096 comparisons", exact.comparisons === 4096 && exact.immediate === null);
      check(
        "comparison overflow before work",
        excess.comparisons === 0 && excess.immediate === "comparisons" && !excess.runs.length,
      );
      const a = diff(baseline("a".repeat(16)), "b".repeat(16));
      const b = diff(baseline("x".repeat(16)), "y".repeat(16));
      check("64 combined moving units", bound([a, b])[1] === b);
      check(
        "65 with live identity",
        bound([a, b], new Set([{}])).every((p) => p.immediate === "changed" && !p.runs.length),
      );
      const append = diff(baseline("a".repeat(2047)), "a".repeat(2048));
      check(
        "bounded append fast path",
        append.path === "append" && append.comparisons === 0 && append.runs[0].incoming.length === 1,
      );
      const descriptor = Object.getOwnPropertyDescriptor(Intl, "Segmenter");
      Object.defineProperty(Intl, "Segmenter", { value: undefined, configurable: true });
      try {
        const unavailable = diff(safe.snapshot, "exact 👩🏽‍💻");
        check(
          "missing segmenter exact fallback",
          unavailable.immediate === "segmenter" &&
            unavailable.snapshot.value === "exact 👩🏽‍💻" &&
            unavailable.snapshot.units === null,
        );
      } finally {
        Object.defineProperty(Intl, "Segmenter", descriptor);
      }
      return cases;
    });
    report.profiles.push({
      name,
      cases,
      bytes: Buffer.byteLength(code),
      gzipBytes: gzipSync(code).length,
      bundleHash: hash(code),
      inputs: Object.keys(bundle.metafile.inputs),
    });
    await page.close();
  }
  assert.deepEqual(report.errors, []);
  assert.equal(report.profiles[0].bundleHash, report.profiles[1].bundleHash);
} catch (error) {
  report.failure = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  report.browserClosed = true;
  await writeFile(path.join(output, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify(report));
