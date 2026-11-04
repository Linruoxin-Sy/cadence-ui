// Optional isolated research pass; never imported by the Next product.
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function rechunkButtonPrototype(dir, metafile, transform) {
  const require = createRequire(import.meta.url);
  const viteRequire = createRequire(createRequire(require.resolve("vitest/node")).resolve("vite"));
  const { rollup, VERSION } = await import(pathToFileURL(viteRequire.resolve("rollup")));
  const outputs = Object.entries(metafile.outputs);
  const entry = outputs.find(([file]) => path.basename(file) === "client.js");
  const button = outputs.find(([, output]) => output.entryPoint?.endsWith("components/site/previews/button.tsx"));
  assert.ok(entry && button, "complete client and actual Button preview entries are required");
  const outputByPath = new Map(outputs.map(([file, output]) => [path.resolve(file), output]));
  const initial = new Set();
  function visit(file) {
    const absolute = path.resolve(file);
    if (initial.has(absolute)) return;
    initial.add(absolute);
    const output = outputByPath.get(absolute);
    assert.ok(output, `missing static dependency ${file}`);
    for (const dependency of output.imports)
      if (dependency.kind !== "dynamic-import" && !dependency.external) visit(dependency.path);
  }
  visit(entry[0]);
  visit(button[0]);
  const warnings = [];
  const bundle = await rollup({
    input: path.resolve(entry[0]),
    onwarn(warning, report) {
      warnings.push({ code: warning.code, message: warning.message });
      report(warning);
    },
  });
  try {
    const generated = await bundle.generate({
      format: "esm",
      entryFileNames: "client.js",
      chunkFileNames: "[name]-[hash].js",
      onlyExplicitManualChunks: true,
      manualChunks: (id) => (initial.has(path.resolve(id)) ? "initial-runtime" : undefined),
    });
    const browserDirectory = path.join(dir, "browser-compact");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(browserDirectory);
    const chunks = [];
    for (const output of generated.output) {
      assert.equal(output.type, "chunk", "research pass only expects JavaScript chunks");
      const file = path.join(browserDirectory, output.fileName);
      const minified = await transform(output.code, { minify: true, format: "esm", target: "esnext" });
      await writeFile(file, minified.code);
      chunks.push({
        file,
        fileName: output.fileName,
        isEntry: output.isEntry,
        imports: output.imports,
        dynamicImports: output.dynamicImports,
        stageOneOutputs: Object.keys(output.modules),
      });
    }
    return {
      version: VERSION,
      warnings,
      strategy:
        "Group only the complete initial static graph plus the actual Button preview; retain every dynamic route and shared identity",
      initialStageOneOutputs: [...initial].sort(),
      chunks,
    };
  } finally {
    await bundle.close();
  }
}
