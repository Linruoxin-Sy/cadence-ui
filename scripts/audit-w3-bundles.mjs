// Diagnostic consumer compilation. Does not modify shipped source or install dependencies.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const viteRequire = createRequire(createRequire(require.resolve("vitest/node")).resolve("vite"));
const { build, version } = await import(pathToFileURL(viteRequire.resolve("esbuild")));
const dir = path.resolve(process.argv[2] ?? `.cache/audits/consumer-bundles-${Date.now()}`);
// Every run owns a fresh directory; never overwrite an earlier audit.
await mkdir(path.dirname(dir), { recursive: true });
await mkdir(dir, { recursive: false });
const registry = JSON.parse(await readFile("registry.json", "utf8"));
const items = registry.items.filter((item) => item.meta?.tier);
assert.equal(items.length, registry.items.filter((item) => /registry:(ui|block)/.test(item.type)).length);
const common = {
  bundle: true,
  write: false,
  metafile: true,
  platform: "browser",
  format: "esm",
  minify: true,
  jsx: "automatic",
  target: "es2020",
  external: ["react", "react/*", "react-dom", "react-dom/*"],
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "error",
};
const motionExports =
  "motion,animate,useMotionValue,useTransform,useAnimationControls,LayoutGroup,MotionConfig,frame,cancelFrame,cubicBezier";
const runtime = `export { ${motionExports} } from "motion/react";`;
await writeFile(path.join(dir, "runtime.js"), runtime);
const result = {
  source: process.env.CADENCE_RUNTIME_SOURCE ?? "unspecified",
  sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  esbuild: version,
  protocol:
    "production minified ES2020 ESM; React/ReactDOM external; all public value exports retained; gzip6 per output; no source-byte surrogate",
  limits: { motion: 48000, component: 8000 },
  motion: [],
  components: [],
  sources: [],
  motionScope:
    "Reference consumer compilations of the required value imports; not certification of the initial Motion bytes in a mixed Next production chunk.",
};
function summarize(output) {
  return {
    file: path.relative(dir, output.path).replaceAll("\\", "/"),
    bytes: output.contents.length,
    gzip: gzipSync(output.contents, { level: 6 }).length,
    sha256: createHash("sha256").update(output.contents).digest("hex"),
  };
}
for (const [name, contents] of [
  ["actual-api-union", runtime],
  // The page also uses useInView for document entrance. This is a separate
  // reference compilation, never a proportional attribution of Next chunks.
  ["registry-and-site-api-union", `${runtime}\nexport { useInView } from "motion/react";`],
  [
    "public-m-domMax-candidate",
    `export * as m from "motion/react-m"; export { LazyMotion,domMax,${motionExports
      .split(",")
      .filter((name) => name !== "motion")
      .join(",")} } from "motion/react";`,
  ],
]) {
  const built = await build({
    ...common,
    stdin: { contents, resolveDir: process.cwd(), sourcefile: `${name}.js` },
    outfile: path.join(dir, `${name}.js`),
  });
  const files = built.outputFiles.map(summarize);
  for (const file of built.outputFiles) await writeFile(file.path, file.contents);
  result.motion.push({
    name,
    files,
    gzip: files.reduce((sum, file) => sum + file.gzip, 0),
    inputs: built.metafile.inputs,
  });
}
// Include the real shared Cadence helpers in the baseline, not a made-up source tier allowance.
const { readdir } = await import("node:fs/promises");
async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => (entry.isDirectory() ? walk(path.join(root, entry.name)) : path.join(root, entry.name))),
    )
  ).flat();
}
const libs = (await walk("registry/cadence/lib")).filter((file) => /\.tsx?$/.test(file));
const registryFiles = (await walk("registry/cadence")).filter((file) => /\.tsx?$/.test(file));
const siteFiles = (await walk("components/site")).filter((file) => /\.tsx?$/.test(file));
async function motionImports(paths) {
  const names = new Set();
  for (const file of paths) {
    const body = await readFile(file, "utf8");
    const source = ts.createSourceFile(file, body, ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "motion/react") continue;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly) continue;
      assert.ok(clause.namedBindings && ts.isNamedImports(clause.namedBindings), `Unmeasured Motion import: ${file}`);
      for (const specifier of clause.namedBindings.elements)
        if (!specifier.isTypeOnly) names.add((specifier.propertyName ?? specifier.name).text);
    }
  }
  return [...names].sort();
}
result.requiredMotionImports = {
  registry: await motionImports(registryFiles),
  site: await motionImports(siteFiles),
};
assert.deepEqual(result.requiredMotionImports.registry, motionExports.split(",").sort());
assert.deepEqual(result.requiredMotionImports.site, ["motion", "useInView"]);
for (const file of [...registryFiles, ...siteFiles, "package.json", "pnpm-lock.yaml"]) {
  const body = await readFile(file);
  result.sources.push({ file, sha256: createHash("sha256").update(body).digest("hex") });
}
await writeFile(
  path.join(dir, "shared.js"),
  `${runtime}\n${libs.map((file) => `export * from ${JSON.stringify(path.relative(dir, path.resolve(file)).replaceAll("\\", "/"))};`).join("\n")}\n`,
);
const entryPoints = { shared: path.join(dir, "shared.js") };
for (const item of items) {
  const source = item.files.find((file) => file.path.endsWith("/index.tsx"))?.path;
  assert.ok(source, item.name);
  entryPoints[item.name] = source;
}
const graph = await build({ ...common, entryPoints, outdir: path.join(dir, "graph"), splitting: true });
const outputs = graph.metafile.outputs;
const key = (file) => path.relative(process.cwd(), file).replaceAll("\\", "/");
const closure = (entry, includeAsync = true, seen = new Set()) => {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  assert.ok(outputs[entry], entry);
  for (const dependency of outputs[entry].imports.filter(
    (dependency) => !dependency.external && (includeAsync || dependency.kind !== "dynamic-import"),
  ))
    closure(dependency.path, includeAsync, seen);
  return seen;
};
const shared = closure(key(path.join(dir, "graph/shared.js")));
const files = Object.fromEntries(graph.outputFiles.map((file) => [key(file.path), summarize(file)]));
result.shared = [...shared].map((file) => files[file]);
result.componentProtocol = `${items.length}-entry split consumer graph plus explicit baseline of actual registry Motion API union/all Cadence lib exports; subtract only baseline-reachable outputs; keep dedicated dependencies and other installed Cadence components; report initial and reachable async output separately; React/ReactDOM external; not Next chunk attribution or an independent package installation`;
for (const item of items) {
  const added = [...closure(key(path.join(dir, `graph/${item.name}.js`)))].filter((file) => !shared.has(file));
  const initial = [...closure(key(path.join(dir, `graph/${item.name}.js`)), false)].filter((file) => !shared.has(file));
  const gzip = added.reduce((sum, file) => sum + files[file].gzip, 0);
  const initialGzip = initial.reduce((sum, file) => sum + files[file].gzip, 0);
  result.components.push({
    id: item.name,
    gzip,
    initialGzip,
    reachableAsyncGzip: gzip - initialGzip,
    passed: gzip <= 8000,
    files: added.map((file) => ({ ...files[file], initial: initial.includes(file) })),
  });
  const local = await build({
    ...common,
    entryPoints: [entryPoints[item.name]],
    outfile: path.join(dir, `local/${item.name}.js`),
    plugins: [
      {
        name: "local-code-only",
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) =>
            args.kind === "entry-point" ? undefined : { path: args.path, external: true },
          );
        },
      },
    ],
  });
  result.components.at(-1).localOnly = local.outputFiles.map(summarize);
  await mkdir(path.dirname(local.outputFiles[0].path), { recursive: true });
  for (const file of local.outputFiles) await writeFile(file.path, file.contents);
  console.log(`${item.name}: ${gzip}/8000`);
}
result.graph = graph.metafile;
await mkdir(path.join(dir, "graph"), { recursive: true });
for (const file of graph.outputFiles) await writeFile(file.path, file.contents);
await writeFile(path.join(dir, "report.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify({
    motion: result.motion.map(({ name, gzip }) => ({ name, gzip })),
    componentsPassed: result.components.filter((item) => item.passed).length,
    total: items.length,
  }),
);
// A diagnostic that finds an exceeded budget must not exit successfully.
if (result.components.some((item) => !item.passed) || result.motion.slice(0, 2).some((item) => item.gzip > 48000))
  process.exitCode = 1;
