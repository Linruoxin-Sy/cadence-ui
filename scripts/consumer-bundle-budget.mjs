import assert from "node:assert/strict";

export const COMPONENT_ADDITION_LIMIT = 8000;

/** @typedef {{path: string, kind: string, external?: boolean}} ImportEdge */
/** @typedef {{imports: ImportEdge[], inputs: Record<string, {bytesInOutput: number}>}} EmittedOutput */
/** @typedef {{file: string, gzip: number, bytes?: number, sha256?: string}} MeasuredOutput */
/** @typedef {{from: string, to: string, kind: string}[]} ImportPath */

// The last node_modules segment identifies the actual package even with pnpm's
// nested store, or with a nested dependency from another package manager.
/** @param {string} input */
function packageName(input) {
  const local = input.replaceAll("\\", "/");
  const marker = "node_modules/";
  const index = local.lastIndexOf(marker);
  if (index < 0) return null;
  const parts = local.slice(index + marker.length).split("/");
  return parts[0].startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

// Shortest real emitted import paths explain inclusion, including a dynamic
// import reached through another chunk. External imports never become outputs.
/** @param {Record<string, EmittedOutput>} outputs @param {string} entry @param {boolean} includeAsync */
function pathsFrom(outputs, entry, includeAsync) {
  /** @type {Map<string, ImportPath>} */
  const paths = new Map([[entry, []]]);
  const queue = [entry];
  for (let index = 0; index < queue.length; index++) {
    const file = queue[index];
    assert.ok(outputs[file], `Missing emitted output: ${file}`);
    for (const edge of outputs[file].imports) {
      if (edge.external || (!includeAsync && edge.kind === "dynamic-import")) continue;
      if (paths.has(edge.path)) continue;
      paths.set(edge.path, [...paths.get(file), { from: file, to: edge.path, kind: edge.kind }]);
      queue.push(edge.path);
    }
  }
  return paths;
}

/**
 * Account for a split consumer graph against an explicit shared entry. Each
 * output is gzip-compressed independently by the caller. Source composition is
 * raw esbuild bytesInOutput only, never an allocation of a mixed file's gzip.
 * @param {{outputs: Record<string, EmittedOutput>, files: Record<string, MeasuredOutput>, baseline: string, entries: Record<string, string>}} graph
 */
export function analyzeConsumerBundles({ outputs, files, baseline, entries }) {
  const baselinePaths = pathsFrom(outputs, baseline, true);
  /** @param {string} file @param {Map<string, ImportPath>} paths */
  const describeOutput = (file, paths) => {
    const measured = files[file];
    assert.ok(measured, `Missing measured output: ${file}`);
    assert.ok(Number.isSafeInteger(measured.gzip) && measured.gzip >= 0, `Invalid gzip size: ${file}`);
    return {
      ...measured,
      importPath: paths.get(file),
      inputs: Object.entries(outputs[file].inputs)
        .filter(([, value]) => value.bytesInOutput > 0)
        .map(([input, value]) => ({ input, package: packageName(input), bytesInOutput: value.bytesInOutput })),
    };
  };
  const shared = [...baselinePaths.keys()].map((file) => describeOutput(file, baselinePaths));
  const components = Object.entries(entries).map(([id, entry]) => {
    const reachable = pathsFrom(outputs, entry, true);
    const initial = pathsFrom(outputs, entry, false);
    const added = [...reachable.keys()].filter((file) => !baselinePaths.has(file));
    const measured = added.map((file) => ({
      ...describeOutput(file, reachable),
      initial: initial.has(file),
      // A file reachable both ways is initial; its shortest general path may
      // happen to be dynamic. Retain a separate static path as proof.
      initialImportPath: initial.get(file) ?? null,
    }));
    const gzip = measured.reduce((sum, file) => sum + file.gzip, 0);
    const initialGzip = measured.filter((file) => file.initial).reduce((sum, file) => sum + file.gzip, 0);
    return {
      id,
      gzip,
      initialGzip,
      reachableAsyncGzip: gzip - initialGzip,
      passed: gzip <= COMPONENT_ADDITION_LIMIT,
      addedOutputPackages: [...new Set(measured.flatMap((file) => file.inputs.map((input) => input.package)))]
        .filter((name) => name !== null)
        .sort(),
      files: measured,
    };
  });
  return { shared, components };
}
