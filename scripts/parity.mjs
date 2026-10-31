/**
 * Compares every Cadence component with the pinned upstream surface:
 *
 *   - exports:      an upstream export we do not have is a rename or a removal (P8)
 *   - data-slot:    an upstream slot we do not render breaks consumers' CSS (P8)
 *   - props:        an upstream part's prop names and declared defaults, per part, so a
 *                   prop that was dropped or a default that moved is not invisible
 *   - additive:     extra exports, slots and props are allowed, and reported, not failed
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
import { extractExports, extractProps, extractSlots } from "./upstream-surface.mjs";

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
      props: extractProps(source),
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
const accepted = [];
const checked = [];

const pinMonth = typeof manifest.pin?.date === "string" ? manifest.pin.date.slice(0, 7) : null;

/**
 * A deviation an item records in `meta.parity.props`, because upstream's Base UI API
 * and its `new-york-v4` visuals disagree and Cadence followed the visuals. Silence is
 * not an option twice: the entry must carry a reason, and it is a problem once the
 * deviation it describes no longer exists.
 */
function recordedDeviations(item) {
  const entries = item.meta?.parity?.props ?? [];
  const byPath = new Map();
  for (const entry of entries) {
    const deviation = typeof entry === "string" ? { path: entry, reason: "" } : entry;
    if (!deviation?.path?.includes(".") || !deviation.reason) {
      problems.push(`${item.name}: meta.parity.props entries need a "Part.prop" path and a reason`);
      continue;
    }
    byPath.set(deviation.path, deviation);
  }
  return byPath;
}

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

  // Props, part by part. A part missing locally is already an export failure, so only
  // the parts both files declare are compared. A prop without a default may be
  // forwarded through `...props` upstream and read on our side; a prop upstream gives
  // a default to is one it acts on, and a dropped one changes behaviour silently.
  const props = extractProps(source);
  const declaredProps = upstream.props ?? {};
  const deviations = recordedDeviations(item);
  const deviated = new Set();
  const extraProps = [];
  for (const [part, declared] of Object.entries(declaredProps)) {
    const mine = props[part];
    if (!mine) continue;
    for (const [prop, fallback] of Object.entries(declared)) {
      const key = `${part}.${prop}`;
      const missing = !(prop in mine);
      const drifted = !missing && fallback !== null && mine[prop] !== null && fallback !== mine[prop];
      if (!missing && !drifted) continue;

      const deviation = deviations.get(key);
      if (deviation) {
        deviated.add(key);
        accepted.push({ name: item.name, path: key, reason: deviation.reason });
        continue;
      }
      if (missing) problems.push(`${item.name}: upstream prop "${key}" is missing or renamed`);
      else problems.push(`${item.name}: prop default drifted — ${key}: ${mine[prop]} != upstream ${fallback}`);
    }
    const extra = Object.keys(mine).filter((prop) => !(prop in declared));
    if (extra.length) extraProps.push(`${part}.{${extra.join(",")}}`);
  }
  for (const path of deviations.keys()) {
    if (!deviated.has(path)) {
      problems.push(`${item.name}: meta.parity.props records "${path}", but it no longer differs from upstream`);
    }
  }

  if (extraExports.length || extraSlots.length || extraProps.length) {
    additive.push({ name: item.name, exports: extraExports, slots: extraSlots, props: extraProps });
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
  console.log(JSON.stringify({ ok: problems.length === 0, checked, problems, additive, accepted }, null, 2));
} else {
  if (accepted.length) {
    const lines = accepted.map(({ name, path: key, reason }) => `  · ${name}: ${key} — ${reason}`);
    const tail = verbose ? `:\n${lines.join("\n")}` : ` (+${accepted.length}, pass --verbose to list)`;
    console.log(`parity: recorded prop deviations, allowed by meta.parity${tail}`);
  }
  if (additive.length) {
    const lines = additive.map(
      ({ name, exports: extraE, slots: extraS, props: extraP = [] }) =>
        `  · ${name}: ${[
          ...extraE.map((n) => `export ${n}`),
          ...extraS.map((s) => `slot ${s}`),
          ...extraP.map((p) => `prop ${p}`),
        ].join(", ")}`,
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
