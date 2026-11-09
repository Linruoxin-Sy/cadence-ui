import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { calledRecipes, cssImplementationExports, implementedForm, normaliseMotion } from "./motion-manifest.mjs";
import { motionSource } from "./motion-source.mjs";

/** Resolve only live value imports of the actual component exports, inside the
 * installed file closure. Merely listing a registryDependency supplies no proof.
 * References are diagnostic implementation anchors, not capability metadata.
 */
export async function checkMotionImplementations(
  root,
  registry,
  names,
  cacheDirectory = process.env.CADENCE_IMPLEMENTATION_CACHE,
) {
  const problems = [];
  /** @type {Record<string, {recipe: string, form: string, file: string, via: string[], exports?: string[]}[]>} */
  const references = {};
  const files = new Map();
  const read = async (file) => {
    if (!files.has(file)) files.set(file, await readFile(path.join(root, file), "utf8"));
    return files.get(file);
  };
  const hash = (value) => createHash("sha256").update(value).digest("hex");
  let cacheFile, inputHashes;
  if (cacheDirectory) {
    // Cache static analysis only. Every source, declaration, selected root,
    // recogniser and compiler byte is rebound before reuse; runtime evidence is
    // never cached here. Writable test fixtures can share unchanged facts across
    // their CLI runs without weakening any negative assertion or deadline.
    inputHashes = {
      registry: hash(JSON.stringify(registry)),
      roots: hash(JSON.stringify(names?.slice().sort() ?? null)),
    };
    for (const module of ["motion-implementation.mjs", "motion-manifest.mjs", "motion-source.mjs"])
      inputHashes[`algorithm/${module}`] = hash(await readFile(new URL(module, import.meta.url)));
    inputHashes.compiler = hash(await readFile(createRequire(import.meta.url).resolve("typescript")));
    for (const file of [
      ...new Set(registry.items.flatMap((item) => (item.files ?? []).map((file) => file.path))),
    ].sort())
      inputHashes[file] = hash(await read(file));
    const key = hash(JSON.stringify(inputHashes));
    cacheFile = path.join(cacheDirectory, `${key}.json`);
    try {
      const entry = JSON.parse(await readFile(cacheFile, "utf8"));
      if (entry.key === key && entry.resultHash === hash(JSON.stringify(entry.result))) return entry.result;
    } catch {
      /* Missing or invalid cache is a fresh mandatory analysis. */
    }
  }
  for (const item of registry.items) {
    if (!["registry:ui", "registry:block"].includes(item.type)) continue;
    if (names && !names.includes(item.name)) continue;
    const declared = normaliseMotion(item.meta?.motion);
    references[item.name] = [];
    for (const file of item.files ?? []) {
      if (!/\.[jt]sx?$/.test(file.path)) continue;
      for (const recipe of new Set(calledRecipes(await read(file.path))))
        if (!declared.some((entry) => entry.recipe === recipe))
          problems.push(`${item.name}: calls transition("${recipe}") without declaring it in meta.motion`);
    }
    // A static composition does not declare every dependency's recipes. Its own
    // undeclared calls still fail above, without scanning irrelevant executors.
    if (!declared.length) continue;
    const installed = new Set();
    const install = (entry) => {
      for (const file of entry.files ?? []) installed.add(file.path);
      for (const dep of entry.registryDependencies ?? []) {
        const target = registry.items.find((entry) => dep === `@cadence/${entry.name}`);
        if (target && !seen.has(target.name)) {
          seen.add(target.name);
          install(target);
        }
      }
    };
    const seen = new Set([item.name]);
    install(item);
    const reachable = new Map();
    const visit = async (file, names, via) => {
      const key = `${file}#${names?.slice().sort().join(",") ?? "*"}`;
      if (reachable.has(key)) return;
      const scanned = motionSource(await read(file), names);
      reachable.set(key, { file, source: scanned.source, via });
      for (const dependency of scanned.imports) {
        if (!dependency.path.startsWith(".")) continue;
        const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), dependency.path));
        const target = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.tsx`].find((candidate) =>
          installed.has(candidate),
        );
        if (target) await visit(target, [dependency.name], [...via, `${file}#${dependency.local}`]);
      }
    };
    const entry = `registry/cadence/${item.name}/index.tsx`;
    if (installed.has(entry)) await visit(entry, undefined, []);
    for (const { recipe, form } of declared) {
      // Policy/text/number adoption is local. Its executor's availability alone
      // never implements a component; a composition can reach an actual adapter.
      const match = [...reachable.values()].find((entry) => implementedForm(entry.source, recipe, form) === form);
      if (!match)
        problems.push(
          `${item.name}: declares "${recipe}" (${form}) but nothing implements it on a live installed import path`,
        );
      else
        references[item.name].push({
          recipe,
          form,
          file: match.file,
          via: match.via,
          ...(form === "css-transition" ? { exports: cssImplementationExports(match.source, recipe) } : {}),
        });
    }
  }
  const result = { problems, references };
  if (cacheFile) {
    await mkdir(cacheDirectory, { recursive: true });
    await writeFile(
      cacheFile,
      JSON.stringify({
        key: path.basename(cacheFile, ".json"),
        inputHashes,
        resultHash: hash(JSON.stringify(result)),
        result,
      }),
    );
  }
  return result;
}
