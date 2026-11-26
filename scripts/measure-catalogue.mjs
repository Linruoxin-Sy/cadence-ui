/**
 * S02-A static cost of the migrated catalogue.
 *
 * Measures four metrics per registry id without a browser:
 *
 *   source     raw and minified-gzip bytes of the id's own payload files
 *   installed  the bundle increment of a real copy-install into an empty React app,
 *              with the plan's declared packages resolved by pnpm (no hand-built bundle)
 *   runtime    the union of motion/react value imports reachable from that install
 *   caps       the workload ceilings the installed files actually reference
 *
 * Every number is produced by this command from the current checkout; nothing is
 * compared against a budget. Raw output goes to `.cache/s02-a/`.
 *
 *   node scripts/measure-catalogue.mjs source|installed|caps [--out <dir>]
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import ts from "typescript";
import { installationPlan } from "./installation.mjs";

const require = createRequire(import.meta.url);
const viteRequire = createRequire(createRequire(require.resolve("vitest/node")).resolve("vite"));
const esbuild = await import(pathToFileURL(viteRequire.resolve("esbuild")));

const root = process.cwd();
const args = process.argv.slice(2);
const metric = args[0];
const outIndex = args.indexOf("--out");
const out = path.resolve(outIndex > 0 ? args[outIndex + 1] : ".cache/s02-a");
const commit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const gzip = (value) => gzipSync(value, { level: 6 }).length;
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
const items = registry.items.filter((item) => item.meta?.tier);

/** Value imports of motion/react in one file, as the bundler would see them. */
function motionValueImports(filePath, text) {
  const source = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const names = new Set();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "motion/react") continue;
    const clause = statement.importClause;
    if (!clause || clause.isTypeOnly) continue;
    if (!clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
    for (const specifier of clause.namedBindings.elements)
      if (!specifier.isTypeOnly) names.add((specifier.propertyName ?? specifier.name).text);
  }
  return [...names];
}

const header = (name, protocol) => ({
  metric: name,
  protocol,
  commit,
  generatedAt: new Date().toISOString(),
  esbuild: esbuild.version,
  node: process.version,
});

if (metric === "source") {
  const rows = [];
  for (const item of items) {
    const files = (item.files ?? []).filter((file) => /\.(ts|tsx)$/.test(file.path));
    const perFile = [];
    for (const file of files) {
      const body = await readFile(path.join(root, file.path));
      const minified = await esbuild.transform(body.toString("utf8"), {
        loader: file.path.endsWith(".tsx") ? "tsx" : "ts",
        minify: true,
        jsx: "automatic",
      });
      perFile.push({
        path: file.path,
        raw: body.length,
        rawGzip: gzip(body),
        minifiedBytes: Buffer.byteLength(minified.code),
        minifiedGzip: gzip(minified.code),
        sha256: createHash("sha256").update(body).digest("hex"),
      });
    }
    rows.push({
      id: item.name,
      tier: item.meta.tier,
      files: perFile.length,
      raw: perFile.reduce((sum, file) => sum + file.raw, 0),
      rawGzip: perFile.reduce((sum, file) => sum + file.rawGzip, 0),
      minifiedBytes: perFile.reduce((sum, file) => sum + file.minifiedBytes, 0),
      minifiedGzip: perFile.reduce((sum, file) => sum + file.minifiedGzip, 0),
      detail: perFile,
    });
  }
  const report = {
    ...header(
      "source",
      "own registry payload files (.ts/.tsx) only, registry dependencies excluded; raw = file bytes; gzip6 per file, summed; minified = esbuild transform(minify) per file with imports left intact (no tree shaking of dependencies); sums are per-file sums, not one bundle",
    ),
    ids: rows.length,
    rows,
  };
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, "source.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ metric, ids: rows.length, out: path.relative(root, path.join(out, "source.json")) }));
}

if (metric === "installed") {
  const consumer = path.join(out, "consumer");
  await mkdir(path.join(consumer, "src"), { recursive: true });
  // The union of everything any plan can declare: one install, but each component
  // still only reaches the packages its own files import. Versions come from this
  // repository's own manifest so the consumer resolves the same ranges the library
  // is developed and audited against; a bare specifier with no repo entry is an error.
  const repoManifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  const known = { ...repoManifest.devDependencies, ...repoManifest.dependencies };
  const declared = new Set(["react", "react-dom"]);
  for (const item of items)
    for (const dep of installationPlan(registry.items, item.name).dependencies) declared.add(dep);
  const dependencies = {};
  const unpinned = [];
  for (const spec of [...declared].sort()) {
    const at = spec.lastIndexOf("@");
    const name = at > 0 ? spec.slice(0, at) : spec;
    const version = at > 0 ? spec.slice(at + 1) : known[name];
    if (!version) unpinned.push(name);
    dependencies[name] = version ?? "latest";
  }
  const packageJson = { name: "s02-a-consumer", private: true, type: "module", dependencies };
  await writeFile(path.join(consumer, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
  if (!(await readdir(consumer)).includes("node_modules")) {
    // `shell` resolves pnpm's Windows .CMD shim as well as a POSIX launcher.
    execFileSync("pnpm", ["install", "--ignore-workspace", "--reporter", "silent"], {
      cwd: consumer,
      stdio: "inherit",
      shell: true,
    });
  }

  const common = {
    bundle: true,
    write: false,
    metafile: true,
    platform: "browser",
    format: "esm",
    minify: true,
    jsx: "automatic",
    target: "es2020",
    absWorkingDir: consumer,
    external: ["react", "react/*", "react-dom", "react-dom/*"],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "error",
  };
  const baselineEntry = path.join(consumer, "baseline.js");
  await writeFile(baselineEntry, "export const baseline = 1;\n");
  const baseline = await esbuild.build({ ...common, entryPoints: [baselineEntry] });
  const baselineGzip = gzip(baseline.outputFiles[0].contents);

  const rows = [];
  for (const item of items) {
    const plan = installationPlan(registry.items, item.name);
    for (const file of plan.files) {
      const target = path.join(consumer, file.target.replace(/^@components\//, "src/components/"));
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, await readFile(path.join(root, file.path)));
    }
    const entry = path.join(consumer, "src", "components", "cadence", item.name, "index.tsx");
    const built = await esbuild.build({ ...common, entryPoints: [entry] });
    const contents = built.outputFiles[0].contents;
    const motion = new Set();
    for (const file of plan.files) {
      const text = await readFile(path.join(root, file.path), "utf8");
      for (const name of motionValueImports(file.path, text)) motion.add(name);
    }
    const names = [...motion].sort();
    let motionGzip = 0;
    if (names.length) {
      const runtimeEntry = path.join(consumer, `runtime-${item.name}.js`);
      await writeFile(runtimeEntry, `export { ${names.join(", ")} } from "motion/react";\n`);
      const runtime = await esbuild.build({ ...common, entryPoints: [runtimeEntry] });
      motionGzip = gzip(runtime.outputFiles[0].contents);
      await rm(runtimeEntry, { force: true });
    }
    const packages = new Set();
    for (const input of Object.keys(built.metafile.inputs)) {
      const local = input.replaceAll("\\", "/");
      const index = local.lastIndexOf("node_modules/");
      if (index < 0) continue;
      const parts = local.slice(index + "node_modules/".length).split("/");
      packages.add(parts[0].startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]);
    }
    rows.push({
      id: item.name,
      tier: item.meta.tier,
      planFiles: plan.files.length,
      planItems: plan.items.map((entry) => entry.name),
      dependencies: plan.dependencies,
      bundleBytes: contents.length,
      bundleGzip: gzip(contents),
      incrementGzip: gzip(contents) - baselineGzip,
      resolvedPackages: [...packages].sort(),
      motionImports: names,
      motionGzip,
    });
  }
  const report = {
    ...header(
      "installed",
      `real copy-install: registry.json payload files for the id and its registry dependencies copied to @components/cadence/** in an empty app (${path.relative(root, consumer)}), declared npm dependencies resolved by pnpm install; one esbuild production ESM bundle (minify, es2020, react/react-dom external) from the component's index.tsx with all public exports retained; gzip6; increment = component bundle minus the empty-app baseline (${
        baselineGzip
      } bytes)`,
    ),
    consumer: path.relative(root, consumer),
    unpinned,
    baselineGzip,
    ids: rows.length,
    rows,
  };
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, "installed.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({
      metric,
      ids: rows.length,
      baselineGzip,
      out: path.relative(root, path.join(out, "installed.json")),
    }),
  );
}

if (metric === "caps") {
  const motionSource = await readFile(path.join(root, "registry/cadence/lib/motion.ts"), "utf8");
  // Read the constants from source rather than restating them here.
  const limitsMatch = motionSource.match(/export const motionLimits = \{([^}]+)\}/);
  const literals = [...(limitsMatch?.[1] ?? "").matchAll(/([A-Za-z][A-Za-z0-9]*):\s*([0-9.]+),/g)].map((match) => [
    match[1],
    Number(match[2]),
  ]);
  const limits = Object.fromEntries(literals);
  const staggerMatch = motionSource.match(/export const stagger = \{([^}]+)\}/);
  const stagger = Object.fromEntries(
    [...(staggerMatch?.[1] ?? "").matchAll(/([a-z]+):\s*([0-9.]+)/g)].map((match) => [match[1], Number(match[2])]),
  );
  const revealMatch = motionSource.match(/export const revealPolicy = \{([^}]+)\}/);
  const revealPolicy = Object.fromEntries(
    [...(revealMatch?.[1] ?? "").matchAll(/([a-zA-Z]+):\s*([0-9.]+)/g)].map((match) => [match[1], Number(match[2])]),
  );
  const proofMatch = motionSource.match(/export const textProofLimits = \{([^}]+)\}/);
  const proof = Object.fromEntries(
    [...(proofMatch?.[1] ?? "").matchAll(/([a-zA-Z]+):\s*([0-9./ ]+)/g)].map((match) => [match[1], match[2].trim()]),
  );
  const names = Object.keys(limits);
  const rows = [];
  for (const item of items) {
    const plan = installationPlan(registry.items, item.name);
    const texts = await Promise.all(plan.files.map((file) => readFile(path.join(root, file.path), "utf8")));
    // Shared Cadence libs are installed with almost every component, so the reachable
    // set is nearly constant. Split the id's own references from what it inherits.
    const own = plan.files
      .map((file, index) => ({ file, text: texts[index] }))
      .filter((entry) => entry.file.item === item.name);
    const ownText = own.map((entry) => entry.text).join("\n");
    const joined = texts.join("\n");
    const referenced = names.filter((name) => new RegExp(`motionLimits\\.${name}\\b`).test(joined));
    const ownReferenced = names.filter((name) => new RegExp(`motionLimits\\.${name}\\b`).test(ownText));
    rows.push({
      id: item.name,
      tier: item.meta.tier,
      ownFiles: own.map((entry) => entry.file.path),
      ownLimits: Object.fromEntries(ownReferenced.map((name) => [name, limits[name]])),
      reachableLimits: Object.fromEntries(referenced.map((name) => [name, limits[name]])),
      stagger: /staggerDelay|characterDelay|staggerElements/.test(joined) ? stagger : {},
      revealCycle: /revealPolicy/.test(joined) ? revealPolicy.cycle : null,
      textProofPixels: /textProofLimits/.test(joined) ? proof.pixels : null,
    });
  }
  const report = {
    ...header(
      "caps",
      "static extraction from registry/cadence/lib/motion.ts plus the id's install plan: ownLimits = motionLimits.<name> referenced by the id's own payload files; reachableLimits = referenced by any file the plan installs (shared libs dominate, so this is near constant). Values are source constants at this commit. Static reference only — runtime clamped values were not traced per component",
    ),
    limits,
    stagger,
    revealPolicy,
    textProofLimits: proof,
    rows,
    enforcementNote:
      "Concurrency of simultaneously animating elements and total stagger duration are bounded by motionLimits.staggerElements/staggerDelay/characterDelay in staggerDelayFor(); no per-route runtime sample of concurrent animations is included in this metric",
  };
  await mkdir(out, { recursive: true });
  await writeFile(path.join(out, "caps.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({ metric, ids: rows.length, limits, out: path.relative(root, path.join(out, "caps.json")) }),
  );
}

if (!["source", "installed", "caps"].includes(metric)) {
  console.error("usage: node scripts/measure-catalogue.mjs source|installed|caps [--out <dir>]");
  process.exit(1);
}
