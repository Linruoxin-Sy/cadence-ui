// Reconcile retained evidence with current source without rerunning closed browser matrices.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import ts from "typescript";
import { summarizeLayoutShifts } from "./site-js-budget.mjs";

const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readArchive = (file) => JSON.parse(gunzipSync(readFileSync(file)));
const summary = json("docs/evidence/w3-performance.json");
const archives = summary.raw.map((entry) => {
  const bytes = gunzipSync(readFileSync(entry.file));
  assert.equal(bytes.length, entry.bytes);
  assert.equal(hash(bytes), entry.sha256);
  return { file: entry.file, bytes: bytes.length, sha256: hash(bytes) };
});
const site = readArchive(summary.raw[0].file);
const bundles = readArchive(summary.raw[1].file);
const closure = json("docs/evidence/engine-runtime-closure.json");
const retainedArchives = [];
for (const name of readdirSync("docs/evidence").filter((name) => name.endsWith(".json"))) {
  const entry = json(`docs/evidence/${name}`).raw;
  if (!entry?.path || !entry.sha256 || !Number.isInteger(entry.bytes)) continue;
  const bytes = gunzipSync(readFileSync(entry.path));
  assert.equal(bytes.length, entry.bytes, entry.path);
  assert.equal(hash(bytes), entry.sha256, entry.path);
  retainedArchives.push({ file: entry.path, bytes: bytes.length, sha256: entry.sha256 });
}
for (const [file, expected] of Object.entries(closure.sourceHashes))
  assert.equal(hash(readFileSync(file)), expected, file);
for (const entry of bundles.sources) assert.equal(hash(readFileSync(entry.file)), entry.sha256, entry.file);
const productPaths = [
  "registry",
  "content",
  "components",
  "app",
  "lib",
  "public/r",
  "public/llms.txt",
  "public/llms-full.txt",
  "registry.json",
  "registry-snapshots.json",
  ".gitattributes",
  "upstream/manifest.json",
  "package.json",
  "pnpm-lock.yaml",
  "next.config.ts",
];
assert.equal(execFileSync("git", ["diff", "5372576", "--", ...productPaths], { encoding: "utf8" }), "");
const registry = json("registry.json");
const items = registry.items.filter((item) => item.meta?.tier);
assert.equal(items.length, 58);
assert.equal(registry.items.length, 65);
const ledger = json("docs/evidence/compatibility-ledger.json");
const entries = Object.values(ledger.items).flatMap((item) => Object.values(item));
assert.equal(entries.length, 466);
assert.ok(entries.every((entry) => entry.status.startsWith("reviewed-")));
assert.equal(json("upstream/manifest.json").pin.ref, ledger.pin);
assert.deepEqual(json("registry-snapshots.json"), ["84cc78703b354b29c815c3970cb26973e4760dea398fdf48756b8a24c996b2f1"]);
const motionValues = new Set();
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(file)) {
      const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
      for (const node of source.statements) {
        if (
          !ts.isImportDeclaration(node) ||
          node.moduleSpecifier.text !== "motion/react" ||
          node.importClause?.isTypeOnly
        )
          continue;
        for (const element of node.importClause?.namedBindings?.elements ?? [])
          if (!element.isTypeOnly) motionValues.add((element.propertyName ?? element.name).text);
      }
    }
  }
}
walk("registry/cadence");
const measured = readFileSync("scripts/audit-w3-bundles.mjs", "utf8")
  .match(/const motionExports =\s*"([^"]+)"/)[1]
  .split(",");
assert.deepEqual([...motionValues].sort(), measured.sort());
assert.equal(motionValues.size, 10);
const outputs = bundles.graph.outputs;
const reachable = (file, seen = new Set()) => {
  if (seen.has(file)) return seen;
  assert.ok(outputs[file], file);
  seen.add(file);
  for (const edge of outputs[file].imports) if (!edge.external) reachable(edge.path, seen);
  return seen;
};
const baseline = reachable(".cache/w3-bundles/graph/shared.js");
let dynamicEdges = 0;
for (const output of Object.values(outputs))
  dynamicEdges += output.imports.filter((edge) => edge.kind === "dynamic-import" && !edge.external).length;
assert.ok(dynamicEdges > 0);
for (const component of bundles.components) {
  const expected = [...reachable(`.cache/w3-bundles/graph/${component.id}.js`)]
    .filter((file) => !baseline.has(file))
    .sort();
  assert.deepEqual(component.files.map((file) => `.cache/w3-bundles/${file.file}`).sort(), expected);
  assert.equal(
    component.gzip,
    component.files.reduce((sum, file) => sum + file.gzip, 0),
  );
  assert.equal(component.passed, component.gzip <= 8000);
  assert.equal(summary.components.find((item) => item.id === component.id).gzip, component.gzip);
}
assert.equal(site.reports.length, 138);
assert.equal(new Set(site.reports.map((entry) => `${entry.route}:${entry.viewport.width}`)).size, 138);
for (const entry of site.reports) {
  assert.equal(entry.cls, summarizeLayoutShifts(entry.layout.shifts));
  assert.equal(
    entry.gzipBytes,
    entry.files.reduce((sum, file) => sum + file.gzip, 0),
  );
  assert.deepEqual(entry.errors, []);
  for (const root of entry.roots) assert.equal(hash(readFileSync(`.next-motion-runtime/${root.file}`)), root.sha256);
}
const result = {
  date: "2026-11-02 Asia/Shanghai",
  startHead: "5c9d7f5",
  runtime: "f60e7fe",
  payloadCommit: "201975a",
  unchangedProductSince: "5372576",
  productPaths,
  archives,
  retainedArchives,
  w2SourceHashesVerified: Object.keys(closure.sourceHashes).length,
  w3ComponentSourceHashesVerified: bundles.sources.length,
  registryItems: registry.items.length,
  components: items.length,
  finiteAPIEntries: entries.length,
  pin: ledger.pin,
  snapshots: json("registry-snapshots.json"),
  motionValueAPIs: [...motionValues].sort(),
  motionScope: "registry/cadence only, not site-exclusive useInView or all possible caller APIs",
  dynamicEdges,
  graphStatus:
    "PASS: all nonexternal edges, including emitted async outputs, traversed; baseline only subtracted; standalone modules remain separate metric",
  modes:
    "Compilation retains all exported code; does not simulate modes or prove runtime behavior; W2 source-matched scoped evidence and unit checks cover runtime modes",
  performance: {
    initialJS: { status: "FAIL", records: 138, passed: site.reports.filter((entry) => entry.jsPassed).length },
    motionNext: { status: "UNPROVEN", consumerGzip: 47294 },
    components: { status: "FAIL", passed: bundles.components.filter((entry) => entry.passed).length, total: 58 },
    physicalMobileFPS: "UNPROVEN",
    coldCLS: { status: "PASS", records: 138, max: Math.max(...site.reports.map((entry) => entry.cls)) },
    lifetimeCLS: "UNPROVEN",
  },
  overall: "INCOMPLETE: W4 reconciliation does not close W3 failures or unproven requirements",
};
writeFileSync("docs/evidence/w4-verification.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
