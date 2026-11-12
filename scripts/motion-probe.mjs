#!/usr/bin/env node
/**
 * Prints the gate's action plan for one motion contract, before any source exists.
 *
 * Write the contract, run the probe, then write the source the plan names. The
 * gate recomputes host, slot, property subset and site from the actual bytes, so
 * the plan is cheaper than reverse-engineering the checker after implementing.
 *
 * Usage (internal tooling only; never imported by shipped source or payload builders):
 *   node scripts/motion-probe.mjs --id item
 *   node scripts/motion-probe.mjs --draft docs/motion/components/item.md
 *   node scripts/motion-probe.mjs --id item --json
 *
 * A draft is parsed against the preset table alone: parts, bindings and action
 * references are checked, while host/slot/properties need the contract to be a
 * live catalogue file and its source to be installed. Exit code is 1 when the
 * target has blocking problems.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { checkMotionTargets, parseMotionTarget, parseTargetPresets } from "./motion-targets.mjs";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage:
  node scripts/motion-probe.mjs --id <component> [--json] [--all-problems]
  node scripts/motion-probe.mjs --draft <file.md> [--json]

Prints the action plan the motion gates derive for one contract: per-binding preset,
form, site, slot/parts and property subset, plus the blocking problems. Use --draft
while the contract is still outside the catalogue; host/slot/property columns fill in
only after the contract is live and its source is installed.

Exit code is 1 when the live contract has blocking problems or the draft has broken
references. A native binding has no runtime plan by design.`);
  process.exit(0);
}
const json = args.includes("--json");
const all = args.includes("--all-problems");
const draft = value("draft");
const root = process.cwd();

const table = (head, rows) => {
  const widths = head.map((cell, index) => Math.max(cell.length, ...rows.map((row) => (row[index] ?? "").length)));
  const line = (row) => `| ${row.map((cell, index) => (cell ?? "").padEnd(widths[index])).join(" | ")} |`;
  return [line(head), `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`, ...rows.map(line)].join("\n");
};

const presets = parseTargetPresets(await readFile(path.join(root, "docs/motion/presets.md"), "utf8"));
const presetsOnce = presets.problems.length
  ? [`presets: ${presets.problems.length} problem(s) — fix docs/motion/presets.md first`]
  : [];

let id = value("id");
let contract;
let plan = [];
const notes = [];
const problems = [...presetsOnce];
let scope = "live";

if (draft) {
  id = id ?? path.basename(draft, ".md");
  contract = parseMotionTarget(await readFile(draft, "utf8"), id, presets.presets);
  // A v2 declaration carries a standing "runtime gates" notice at parse time;
  // it is a state of the marker, not a defect in the draft's references.
  for (const problem of contract.problems)
    if (!contract.referenceProblems.includes(problem)) notes.push(`${id}: ${problem}`);
  problems.push(...contract.referenceProblems.map((problem) => `${id}: ${problem}`));
  scope = "draft";
} else {
  if (!id) throw new Error("--id <component> or --draft <file.md> is required");
  const registry = JSON.parse(await readFile(path.join(root, "registry.json"), "utf8"));
  const result = await checkMotionTargets(root, registry);
  contract = result.contracts.get(id);
  if (!contract) throw new Error(`${id} has no catalogue contract in docs/motion/components/`);
  plan = result.v2.actions.filter((action) => action.item === id);
  problems.push(
    ...result.problems.filter((problem) => problem.startsWith(`${id}:`) || problem.startsWith(`${id}.`)),
    ...result.problems.filter((problem) => !/^[\w-]+[.:]/.test(problem)).map((problem) => `inventory: ${problem}`),
  );
}

const foreign = new Map();
const keep = [];
for (const problem of problems) {
  const owner = problem.match(/^([\w-]+)[.:]/)?.[1];
  if (!owner || owner === id || owner === "presets" || owner === "inventory") keep.push(problem);
  else foreign.set(owner, (foreign.get(owner) ?? 0) + 1);
}

const actions = contract.actions.map((action) => [
  action.trigger,
  action.full,
  action.reduced,
  action.none,
  action.bindings.join("; "),
]);
const bindings = [...contract.bindings].map(([name, binding]) => {
  const row = plan.find((action) => action.binding === name);
  // A native binding delegates to CSS/layout; it never produces a runtime record,
  // so "no plan" would read as a defect instead of the intended form.
  const native = binding.preset === "engine.native" || binding.form.startsWith("native/");
  return [
    name,
    binding.preset,
    binding.form,
    row ? row.site : scope === "draft" ? "(draft)" : native ? "(native)" : "(no plan)",
    row?.slot ?? (contract.parts[binding.part] ?? []).join(", "),
    row ? row.properties.join(" ") : native ? "—" : "",
  ];
});

if (json) {
  console.log(
    JSON.stringify(
      {
        id,
        scope,
        migration: contract.migration,
        problems: keep,
        notes,
        foreignProblems: Object.fromEntries(foreign),
        parts: contract.parts,
        regions: contract.regions,
        axes: contract.axes,
        actions: contract.actions,
        bindings: [...contract.bindings].map(([name, binding]) => ({
          name,
          ...binding,
          plan: plan.find((action) => action.binding === name) ?? null,
        })),
      },
      null,
      2,
    ),
  );
} else {
  console.log(`# motion probe: ${id} (${scope}, ${contract.migration})`);
  console.log(
    `${contract.actions.length} actions, ${contract.bindings.size} bindings, ` +
      `${keep.length} blocking problem(s)${foreign.size ? `, ${[...foreign.values()].reduce((sum, n) => sum + n, 0)} in other components` : ""}`,
  );
  console.log(`\n## Actions\n\n${table(["trigger", "full", "reduced", "none", "bindings"], actions)}`);
  console.log(
    `\n## Bindings → plan\n\n${table(["binding", "preset", "target form", "site", "slot/parts", "properties"], bindings)}`,
  );
  console.log(
    `\n## Parts\n\n${table(
      ["part", "anchors"],
      Object.entries(contract.parts).map(([part, anchors]) => [
        part,
        (Array.isArray(anchors) ? anchors : []).join(", "),
      ]),
    )}`,
  );
  for (const [field, map] of [
    ["regions", contract.regions],
    ["axes", contract.axes],
  ])
    if (map)
      console.log(
        `\n${field}: ${Object.entries(map)
          .map(([part, values]) => `${part}=${values.join("+")}`)
          .join(" ")}`,
      );
  if (keep.length) console.log(`\n## Blocking\n\n${keep.map((problem) => `- ${problem}`).join("\n")}`);
  if (notes.length) console.log(`\n## Notes\n\n${notes.map((note) => `- ${note}`).join("\n")}`);
  if (foreign.size && all)
    console.log(
      `\n## Other components (not blocking this probe)\n\n${[...foreign].map(([owner, count]) => `- ${owner}: ${count} problem(s)`).join("\n")}`,
    );
  if (scope === "draft")
    console.log(
      `\nSite, slot and property columns fill in once this contract is at docs/motion/components/${id}.md ` +
        `and its source is installed; until then the plan is the action table plus the part anchors.`,
    );
}

process.exitCode = keep.length ? 1 : 0;
