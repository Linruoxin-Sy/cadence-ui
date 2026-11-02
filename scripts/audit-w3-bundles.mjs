// Diagnostic consumer compilation. Does not modify shipped source or install dependencies.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const viteRequire = createRequire(createRequire(require.resolve("vitest/node")).resolve("vite"));
const { build, version } = await import(pathToFileURL(viteRequire.resolve("esbuild")));
const dir = path.resolve(".cache/w3-bundles");
await mkdir(dir, { recursive: true });
const registry = JSON.parse(await readFile("registry.json", "utf8"));
const items = registry.items.filter((item) => item.meta?.tier);
assert.equal(items.length, 58);
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
  esbuild: version,
  protocol:
    "production minified ES2020 ESM; React/ReactDOM external; all public value exports retained; gzip6 per output; no source-byte surrogate",
  limits: { motion: 48000, component: 8000 },
  motion: [],
  components: [],
  sources: [],
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
await writeFile(
  path.join(dir, "shared.js"),
  `${runtime}\n${libs.map((file) => `export * from ${JSON.stringify(path.relative(dir, path.resolve(file)).replaceAll("\\", "/"))};`).join("\n")}\n`,
);
const entryPoints = { shared: path.join(dir, "shared.js") };
for (const item of items) {
  const source = item.files.find((file) => file.path.endsWith("/index.tsx"))?.path;
  assert.ok(source, item.name);
  entryPoints[item.name] = source;
  const body = await readFile(source);
  result.sources.push({ file: source, sha256: createHash("sha256").update(body).digest("hex") });
}
const graph = await build({ ...common, entryPoints, outdir: path.join(dir, "graph"), splitting: true });
const outputs = graph.metafile.outputs;
const key = (file) => path.relative(process.cwd(), file).replaceAll("\\", "/");
const closure = (entry, seen = new Set()) => {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  assert.ok(outputs[entry], entry);
  for (const dependency of outputs[entry].imports.filter((dependency) => !dependency.external))
    closure(dependency.path, seen);
  return seen;
};
const shared = closure(key(path.join(dir, "graph/shared.js")));
const files = Object.fromEntries(graph.outputFiles.map((file) => [key(file.path), summarize(file)]));
result.shared = [...shared].map((file) => files[file]);
result.componentProtocol =
  "58-entry split consumer graph plus explicit baseline of actual Motion API union/all Cadence lib exports; subtract only baseline-reachable outputs; keep component dependencies and other installed Cadence components; includes every emitted reachable async JS output (conservative for on-demand code); React external; not Next chunk attribution";
for (const item of items) {
  const added = [...closure(key(path.join(dir, `graph/${item.name}.js`)))].filter((file) => !shared.has(file));
  const gzip = added.reduce((sum, file) => sum + files[file].gzip, 0);
  result.components.push({ id: item.name, gzip, passed: gzip <= 8000, files: added.map((file) => files[file]) });
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
  console.log(`${item.name}: ${gzip}/8000`);
}
result.graph = graph.metafile;
await writeFile(path.join(dir, "report.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify({
    motion: result.motion.map(({ name, gzip }) => ({ name, gzip })),
    componentsPassed: result.components.filter((item) => item.passed).length,
    total: items.length,
  }),
);
