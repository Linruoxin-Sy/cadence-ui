import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { analyzeConsumerBundles, COMPONENT_ADDITION_LIMIT } from "../../scripts/consumer-bundle-budget.mjs";
import { assessBudget } from "../../scripts/performance-policy.mjs";

type Edge = { path: string; kind: string; external?: boolean };
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing test fixture value");
  return value;
}
function fixture() {
  const output = (
    imports: Edge[] = [],
    inputs: Record<string, { bytesInOutput: number }> = {
      "registry/cadence/example/index.tsx": { bytesInOutput: 10 },
    },
  ) => ({
    imports,
    inputs,
  });
  const edge = (path: string, kind = "import-statement"): Edge => ({ path, kind });
  const outputs = {
    "shared.js": output([edge("runtime.js"), edge("shared-async.js", "dynamic-import")]),
    "runtime.js": output(),
    "shared-async.js": output(),
    "component.js": output([
      edge("runtime.js"),
      edge("shared-async.js"),
      edge("dedicated.js", "dynamic-import"),
      edge("bridge.js"),
      edge("async-only.js", "dynamic-import"),
      { ...edge("react"), external: true },
    ]),
    "bridge.js": output([edge("dedicated.js")]),
    "dedicated.js": output([edge("component.js")], {
      "node_modules/.pnpm/@base-ui+react@1/node_modules/@base-ui/react/esm/input/Input.js": { bytesInOutput: 30 },
      "registry/cadence/input/index.tsx": { bytesInOutput: 10 },
      "node_modules/removed/index.js": { bytesInOutput: 0 },
    }),
    "async-only.js": output([edge("dedicated.js")], {
      "node_modules/parent/node_modules/highlighter/index.js": { bytesInOutput: 50 },
    }),
  };
  const files = Object.fromEntries(
    Object.keys(outputs).map((file) => [file, { file, gzip: file === "runtime.js" ? 90000 : 2000 }]),
  );
  return { outputs, files, baseline: "shared.js", entries: { example: "component.js" } };
}

describe("compiled consumer addition accounting", () => {
  it("subtracts only the declared baseline and counts dedicated mixed chunks and reachable async output once", () => {
    const result = analyzeConsumerBundles(fixture());
    expect(result.shared.map((file) => file.file).sort()).toEqual(["runtime.js", "shared-async.js", "shared.js"]);
    const component = required(result.components[0]);
    expect(COMPONENT_ADDITION_LIMIT).toBe(8000);
    expect(component.gzip).toBe(8000);
    expect(component.initialGzip).toBe(6000);
    expect(component.reachableAsyncGzip).toBe(2000);
    expect(component.passed).toBe(true);
    expect(component.addedOutputPackages).toEqual(["@base-ui/react", "highlighter"]);
    const dedicated = required(component.files.find((file) => file.file === "dedicated.js"));
    expect(dedicated.initial).toBe(true);
    expect(dedicated.importPath).toEqual([{ from: "component.js", to: "dedicated.js", kind: "dynamic-import" }]);
    expect(dedicated.initialImportPath).toEqual([
      { from: "component.js", to: "bridge.js", kind: "import-statement" },
      { from: "bridge.js", to: "dedicated.js", kind: "import-statement" },
    ]);
    expect(dedicated.inputs.map((input) => input.package)).toEqual(["@base-ui/react", null]);
    expect(required(component.files.find((file) => file.file === "async-only.js")).initialImportPath).toBeNull();
    const over = fixture();
    required(over.files["async-only.js"]).gzip += 1;
    const exceeded = required(analyzeConsumerBundles(over).components[0]);
    expect(exceeded).toMatchObject({ gzip: 8001, passed: false });
    expect(assessBudget("consumer addition", exceeded.gzip, COMPONENT_ADDITION_LIMIT)).toMatchObject({
      actual: 8001,
      reference: 8000,
      comparisonPassed: false,
      status: "advisory-exceeded",
      blocking: false,
      performanceAcceptance: "deferred",
    });
  });

  it("sums separately compressed outputs and does not divide gzip by source or package proportions", () => {
    const data = fixture();
    const body = Buffer.from("identical compiled code ".repeat(100));
    const gzip = gzipSync(body, { level: 6 }).length;
    for (const file of Object.values(data.files)) file.gzip = gzip;
    const component = required(analyzeConsumerBundles(data).components[0]);
    expect(component.gzip).toBe(4 * gzip);
    expect(component.gzip).toBeGreaterThan(gzipSync(Buffer.concat([body, body, body, body]), { level: 6 }).length);
    expect(required(component.files.find((file) => file.file === "dedicated.js")).gzip).toBe(gzip);
    expect(required(component.files.find((file) => file.file === "dedicated.js")).inputs).toHaveLength(2);
  });

  it("rejects missing emitted files or measurements, even behind dynamic imports or the shared baseline", () => {
    const missingOutput = fixture();
    missingOutput.outputs["component.js"].imports.push({ path: "missing.js", kind: "dynamic-import" });
    expect(() => analyzeConsumerBundles(missingOutput)).toThrow("Missing emitted output: missing.js");
    const missingMeasurement = fixture();
    delete missingMeasurement.files["shared-async.js"];
    expect(() => analyzeConsumerBundles(missingMeasurement)).toThrow("Missing measured output: shared-async.js");
    const invalidSize = fixture();
    required(invalidSize.files["async-only.js"]).gzip = Number.NaN;
    expect(() => analyzeConsumerBundles(invalidSize)).toThrow("Invalid gzip size: async-only.js");
  });
});
