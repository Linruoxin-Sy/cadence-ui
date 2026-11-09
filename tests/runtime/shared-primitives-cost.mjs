import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import ts from "typescript";

assert(process.env.SHARED_PRIMITIVES_COST_OUTPUT && process.env.SHARED_PRIMITIVES_INSTALLATION);
const out = path.resolve(process.env.SHARED_PRIMITIVES_COST_OUTPUT);
const installation = path.resolve(process.env.SHARED_PRIMITIVES_INSTALLATION);
await mkdir(out, { recursive: false });
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  limits: { dedicated: 8000, motion: 48000, page: 120000 },
  consumer: {},
  inputs: {},
  actualMotionImports: {},
};
const bundle = async (name, contents, extra = {}) => {
  const entry = path.join(out, `${name}.jsx`);
  await writeFile(entry, contents);
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    metafile: true,
    format: "esm",
    splitting: true,
    outdir: path.join(out, name),
    minify: true,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    ...extra,
  });
  const chunks = [];
  for (const file of result.outputFiles) {
    await mkdir(path.dirname(file.path), { recursive: true });
    await writeFile(file.path, file.contents);
    chunks.push({
      file: file.path,
      bytes: file.contents.length,
      gzip: gzipSync(file.contents, { level: 6 }).length,
      sha256: hash(file.contents),
    });
  }
  for (const f of Object.keys(result.metafile.inputs)) {
    report.inputs[f] = hash(await readFile(f));
    assert(!f.replaceAll("\\", "/").includes("registry/cadence/"), "No workspace-source fallback");
  }
  await writeFile(path.join(out, `${name}-metafile.json`), JSON.stringify(result.metafile, null, 2));
  return { gzip: chunks.reduce((n, c) => n + c.gzip, 0), chunks, inputs: Object.keys(result.metafile.inputs) };
};
const native = "<main>Baseline</main>";
const mount = "import {createRoot} from 'react-dom/client';";
const providerPath = path.join(installation, "union/components/cadence/lib/provider.tsx").replaceAll("\\", "/");
const providerImport = `import {CadenceProvider} from ${JSON.stringify(providerPath)};`;
report.consumer.empty = await bundle("empty", `${mount}createRoot(document.getElementById('root')).render(${native});`);
report.consumer.provider = await bundle(
  "provider",
  `${mount}${providerImport}createRoot(document.getElementById('root')).render(<CadenceProvider>${native}</CadenceProvider>);`,
);
for (const [id, name, props] of [
  ["animated-text", "AnimatedText", 'value="Baseline"'],
  ["animated-number", "AnimatedNumber", "value={19}"],
  ["reveal", "Reveal", ""],
  ["reveal-group", "RevealGroup", 'stagger="cycle"'],
]) {
  const root = path.join(installation, id, "components/cadence").replaceAll("\\", "/");
  const imported = `import {${name}} from ${JSON.stringify(`${root}/${id}/index.tsx`)};`;
  const extra = id === "reveal-group" ? `import {Reveal} from ${JSON.stringify(`${root}/reveal/index.tsx`)};` : "";
  const body = id === "reveal-group" ? "<Reveal>Baseline</Reveal>" : id === "reveal" ? "Baseline" : "";
  const specificProvider = `import {CadenceProvider} from ${JSON.stringify(`${root}/lib/provider.tsx`)};`;
  // Keep the original text/number consumer's component-before-provider import
  // order: identifier allocation alone otherwise changes compressed totals.
  const imports = id.startsWith("animated-") ? imported + specificProvider : specificProvider + imported;
  const element = body ? `<${name} ${props}>${body}</${name}>` : `<${name} ${props} />`;
  const cost = await bundle(
    id,
    `${mount}${imports}${extra}createRoot(document.getElementById('root')).render(<CadenceProvider>${element}</CadenceProvider>);`,
  );
  assert(cost.inputs.some((f) => f.endsWith(`${id}/index.tsx`)));
  cost.dedicated = cost.gzip - report.consumer.provider.gzip;
  cost.totalOverEmpty = cost.gzip - report.consumer.empty.gzip;
  cost.passedDedicated = cost.dedicated <= report.limits.dedicated;
  report.consumer[id] = cost;
}
// Measure the actual Motion API surface required by shipped value imports. React
// is the already-declared peer baseline, never a proportional mixed-chunk share.
const actual = new Set();
const shipped = execFileSync("git", ["ls-files", "registry/cadence"], { encoding: "utf8", windowsHide: true })
  .trim()
  .split("\n");
for (const f of shipped.filter((f) => /\.tsx?$/.test(f))) {
  const text = await readFile(f, "utf8");
  const ast = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true);
  for (const node of ast.statements) {
    if (!ts.isImportDeclaration(node) || node.moduleSpecifier.text !== "motion/react" || node.importClause?.isTypeOnly)
      continue;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const spec of bindings.elements.filter((s) => !s.isTypeOnly)) {
      const imported = (spec.propertyName ?? spec.name).text;
      actual.add(imported);
      report.actualMotionImports[f] ??= [];
      report.actualMotionImports[f].push(imported);
    }
  }
}
const exports = [...actual].sort();
assert(exports.includes("motion") && exports.includes("animateSingleValue") && exports.includes("MotionConfig"));
report.motion = await bundle(
  "required-motion",
  `import {${exports.join(",")}} from 'motion/react';globalThis.cadenceRequiredMotion={${exports.join(",")}};`,
  { external: ["react", "react-dom", "react/jsx-runtime"] },
);
report.motion.requiredExports = exports;
report.motion.passed = report.motion.gzip <= report.limits.motion;
report.motion.boundary =
  "Actual union of shipped Motion value imports, with the declared React peer external; package contents and all chunks retained. Conservative required-runtime measurement, not exact package allocation from mixed production chunks or a page-budget pass.";
report.measuredBundleLimitsPassed =
  Object.values(report.consumer)
    .filter((c) => c.passedDedicated !== undefined)
    .every((c) => c.passedDedicated) && report.motion.passed;
report.performanceAccepted = false;
report.open = {
  owners: ["S02", "F03-performance"],
  realMidrange55FPS: "unmeasured",
  remediation:
    "Reduce dedicated numeric planner/renderer/proof and Motion scalar reachability, shared provider/token/dependency and complete framework-route cost; remeasure with the original empty/provider baselines and unchanged 8000/48000/120000 gates. No performance acceptance, exclusions or baseline replacement.",
};
await writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    consumer: Object.fromEntries(
      Object.entries(report.consumer).map(([id, c]) => [
        id,
        { gzip: c.gzip, dedicated: c.dedicated, passed: c.passedDedicated },
      ]),
    ),
    motion: { gzip: report.motion.gzip, passed: report.motion.passed, exports },
    performanceAccepted: report.performanceAccepted,
  }),
);
