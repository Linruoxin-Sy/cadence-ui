/**
 * Compares every Cadence component with the pinned upstream surface:
 *
 *   - exports:      an upstream export we do not have is a rename or a removal (P8)
 *   - data-slot:    an upstream slot we do not render breaks consumers' CSS (P8)
 *   - additive:     extra exports and slots are allowed, and reported, not failed
 *   - meta.upstream.version must still match the pinned commit's month
 *
 * Reads the committed upstream/manifest.json, so it runs offline. Refresh that
 * file with `pnpm upstream:sync`.
 *
 *   node scripts/parity.mjs            # check (default)
 *   node scripts/parity.mjs --check    # same thing, explicit
 *   node scripts/parity.mjs --write    # rebuild manifest items from .cache/shadcn
 *   node scripts/parity.mjs --json     # machine-readable report
 *   node scripts/parity.mjs --verbose  # list additive exports and slots
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractExports, extractSlots } from "./upstream-surface.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const mode = args.includes("--write") ? "write" : "check";
const verbose = args.includes("--verbose");
const asJson = args.includes("--json");

const manifestPath = path.join(root, "upstream", "manifest.json");
const cacheDir = path.join(root, ".cache", "shadcn", "base");
const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));

const components = registry.items.filter((item) => item.type === "registry:ui" || item.type === "registry:block");
const localPath = (item) => item.files?.[0]?.path ?? `registry/cadence/${item.name}/index.tsx`;

const readOrNull = async (file) => {
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
};

const manifest = JSON.parse((await readOrNull(manifestPath)) ?? "null");
if (!manifest?.items) {
  console.error("parity: upstream/manifest.json is missing. Run `pnpm upstream:sync` first.");
  process.exit(1);
}

if (mode === "write") {
  const items = {};
  const unreadable = [];
  for (const item of components) {
    const source = await readOrNull(path.join(cacheDir, `${item.name}.tsx`));
    if (source === null) {
      unreadable.push(`${item.name}: nothing in .cache/shadcn/base — run \`pnpm upstream:sync\``);
      continue;
    }
    items[item.name] = {
      path: `apps/v4/registry/bases/${manifest.primitiveBase ?? "base"}/ui/${item.name}.tsx`,
      exports: extractExports(source),
      slots: extractSlots(source),
    };
  }
  if (unreadable.length) {
    console.error(`parity: cannot write the manifest:\n${unreadable.map((line) => `  - ${line}`).join("\n")}`);
    process.exit(1);
  }
  await writeFile(manifestPath, `${JSON.stringify({ ...manifest, items }, null, 2)}\n`);
  console.log(`parity: wrote ${Object.keys(items).length} item surfaces to upstream/manifest.json`);
  process.exit(0);
}

const problems = [];
const additive = [];
const checked = [];

const pinMonth = typeof manifest.pin?.date === "string" ? manifest.pin.date.slice(0, 7) : null;

for (const item of components) {
  const upstream = manifest.items[item.name];
  if (!upstream) {
    problems.push(`${item.name}: not pinned — run \`pnpm upstream:sync\``);
    continue;
  }

  const source = await readOrNull(path.join(root, localPath(item)));
  if (source === null) {
    problems.push(`${item.name}: missing local source ${localPath(item)}`);
    continue;
  }

  const exports = extractExports(source);
  const slots = extractSlots(source);
  const missingExports = upstream.exports.filter((name) => !exports.includes(name));
  const missingSlots = upstream.slots.filter((slot) => !slots.includes(slot));
  const extraExports = exports.filter((name) => !upstream.exports.includes(name));
  const extraSlots = slots.filter((slot) => !upstream.slots.includes(slot));

  for (const name of missingExports) problems.push(`${item.name}: upstream export "${name}" is missing or renamed`);
  for (const slot of missingSlots) problems.push(`${item.name}: upstream data-slot="${slot}" is missing or renamed`);
  if (extraExports.length || extraSlots.length) {
    additive.push({ name: item.name, exports: extraExports, slots: extraSlots });
  }

  const declared = item.meta?.upstream?.version;
  if (pinMonth && declared !== pinMonth) {
    problems.push(`${item.name}: meta.upstream.version "${declared}" does not match the pinned ${pinMonth}`);
  }

  checked.push(item.name);
}

const stale = Object.keys(manifest.items).filter((name) => !components.some((item) => item.name === name));
for (const name of stale) problems.push(`${name}: pinned upstream item has no registry item any more`);

if (asJson) {
  console.log(JSON.stringify({ ok: problems.length === 0, checked, problems, additive }, null, 2));
} else {
  if (additive.length) {
    const lines = additive.map(
      ({ name, exports: extraE, slots: extraS }) =>
        `  · ${name}: ${[...extraE.map((n) => `export ${n}`), ...extraS.map((s) => `slot ${s}`)].join(", ")}`,
    );
    const tail = verbose ? `:\n${lines.join("\n")}` : ` (+${additive.length} items, pass --verbose to list)`;
    console.log(`parity: additive surface, allowed by P8${tail}`);
  }
  if (problems.length) {
    console.error(
      `Parity check failed against ${manifest.repository}@${manifest.pin?.ref?.slice(0, 12)}:\n${problems
        .map((problem) => `  - ${problem}`)
        .join("\n")}`,
    );
    process.exit(1);
  }
  console.log(
    `Parity OK: ${checked.length} components match shadcn@${manifest.pin?.ref?.slice(0, 12)} (${manifest.primitiveBase ?? "base"} API, ${manifest.visualStyle} visuals).`,
  );
}
