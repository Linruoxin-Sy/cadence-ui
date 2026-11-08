import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const output = path.resolve(
  process.env.SIDEBAR_COST_OUTPUT ?? `.cache/motion-v2-execution/s08b-size-linked/copy-cost-${Date.now()}`,
);
await mkdir(output, { recursive: false });
const baseline = "3bc2bb880e92a598eaaa97135d9de3969c98d7d3";
const previous = process.env.SIDEBAR_COST_PREVIOUS ?? "1be0ebda851a3b9b62e3d9018a5a1f0f6c65df59";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const require = createRequire(import.meta.url);
const vite = require.resolve("vite", { paths: [require.resolve("vitest/node")] });
const { build } = await import(pathToFileURL(require.resolve("esbuild", { paths: [vite] })));
const report = { baseline, previous, runnerSHA: hash(await readFile(new URL(import.meta.url))), phases: {}, costs: [] };
await writeFile(path.join(output, "runner.mjs"), await readFile(new URL(import.meta.url)));
for (const phase of ["baseline", "previous", "current"]) {
  const target = path.join(output, phase);
  await mkdir(target);
  const queue = ["sidebar"],
    names = new Set(),
    inputs = {};
  while (queue.length) {
    const name = queue.shift();
    if (names.has(name)) continue;
    names.add(name);
    const location = `public/r/${name}.json`;
    const source =
      phase !== "current"
        ? spawnSync("git", ["show", `${phase === "previous" ? previous : baseline}:${location}`], {
            encoding: "utf8",
            maxBuffer: 16 * 1024 * 1024,
          })
        : null;
    if (source) assert.equal(source.status, 0, source.stderr);
    const bytes = source ? source.stdout : await readFile(location, "utf8");
    const item = JSON.parse(bytes);
    for (const dep of item.registryDependencies ?? []) if (dep.startsWith("@cadence/")) queue.push(dep.slice(9));
    for (const file of item.files ?? []) {
      const relative = file.target?.replace(/^@components\/cadence\//, "");
      assert(relative && relative !== file.target && !relative.includes(".."));
      const dest = path.resolve(target, relative);
      assert(dest.startsWith(`${target}${path.sep}`));
      await mkdir(path.dirname(dest), { recursive: true });
      await writeFile(dest, file.content);
      inputs[file.path] = { installed: dest, sha: hash(file.content), payload: location, payloadSHA: hash(bytes) };
    }
  }
  report.phases[phase] = { target, items: [...names], inputs };
  for (const id of ["empty", "sidebar"]) {
    const entry = path.join(target, `${id}-cost.jsx`);
    const view =
      id === "empty"
        ? "<main>Baseline</main>"
        : '<SidebarProvider><Sidebar><SidebarInput aria-label="Search" /></Sidebar><SidebarInset><SidebarTrigger /></SidebarInset></SidebarProvider>';
    const parts =
      id === "empty"
        ? ""
        : 'import {SidebarProvider,Sidebar,SidebarInput,SidebarInset,SidebarTrigger} from "./sidebar/index";';
    await writeFile(
      entry,
      `import {createRoot} from "react-dom/client"; ${parts} createRoot(document.getElementById("root")).render(${view});`,
    );
    const bundled = await build({
      entryPoints: [entry],
      write: false,
      bundle: true,
      minify: true,
      splitting: true,
      format: "esm",
      outdir: path.join(target, `bundle-${id}`),
      metafile: true,
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
    });
    const chunks = bundled.outputFiles.map((file) => ({
      name: path.basename(file.path),
      bytes: file.contents.length,
      gzip: gzipSync(file.contents).length,
      sha: hash(file.contents),
      initial: Object.values(bundled.metafile.outputs).some(
        (item) =>
          item.entryPoint && file.path.endsWith(item.entryPoint.replace(/.*[\\/]/, "").replace(/\.jsx$/, ".js")),
      ),
    }));
    const total = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0);
    report.costs.push({
      phase,
      id,
      totalGzip: total,
      limit: 8000,
      passed: false,
      chunks,
      sourceGzip: Object.entries(inputs)
        .filter(([file]) => file.includes(`/${id}/`))
        .reduce((sum, [, value]) => sum + gzipSync(require("node:fs").readFileSync(value.installed)).length, 0),
      inputSHA: Object.fromEntries(
        await Promise.all(Object.keys(bundled.metafile.inputs).map(async (file) => [file, hash(await readFile(file))])),
      ),
    });
  }
}
for (const cost of report.costs) {
  cost.additionGzip =
    cost.totalGzip - report.costs.find((base) => base.phase === cost.phase && base.id === "empty").totalGzip;
  cost.passed = cost.additionGzip <= 8000;
}
report.protocol =
  "Same minified ReactDOM createRoot baseline, real copied static component render; component addition is all emitted JS gzip minus empty consumer, not source gzip.";
for (const cost of report.costs.filter((cost) => cost.phase === "current"))
  cost.delta = cost.totalGzip - report.costs.find((old) => old.phase !== "current" && old.id === cost.id).totalGzip;
await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2));
console.log(
  JSON.stringify({
    output,
    costs: report.costs.map(({ phase, id, totalGzip, delta, sourceGzip }) => ({
      phase,
      id,
      totalGzip,
      delta,
      sourceGzip,
    })),
  }),
);
