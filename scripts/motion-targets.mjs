/** Internal design references only. Never imported into shipped source or payload builders. */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { checkMotionPartAdoption } from "./motion-adoption.mjs";
import { MOTION_RELATIONSHIPS } from "./motion-coverage.mjs";
import { migrationProblems, targetMetadata } from "./motion-migration.mjs";
import { valueExports } from "./motion-source.mjs";

export { valueExports } from "./motion-source.mjs";

export const CAPABILITIES = ["Appearance", "Size", "Surface colour", "Text colour", "Changed text", "Changed numbers"];
const SECTIONS = [
  "Capability ownership",
  "Choreography and modes",
  "Interruption and lifecycle",
  "Geometry and performance",
  "Acceptance scenarios",
];
const CAPABILITY_RECIPES = {
  Appearance: ["reveal", "enter.pop", "exit.fade", "popup.anchored", "data.transition", "layout.move"],
  Size: ["geometry.resize", "native"],
  "Surface colour": ["state.color"],
  "Text colour": ["state.color"],
  "Changed text": ["text.change", "handoff"],
  "Changed numbers": ["number.roll"],
};
const parser = unified().use(remarkParse).use(remarkGfm);
const plain = (node) => node.value ?? (node.children ?? []).map(plain).join("");
const codes = (node) => (node.type === "inlineCode" ? [node.value] : (node.children ?? []).flatMap(codes));
const meaningful = (value) =>
  typeof value === "string" && value.trim().length > 0 && !/\b(?:TODO|TBD|FIXME)\b/i.test(value);

// Required prose must be visible narrative, not an HTML comment or fenced specimen.
function narrative(node) {
  if (["html", "code", "table"].includes(node.type)) return "";
  if (node.type === "paragraph")
    return node.children
      .filter((child) => child.type !== "html")
      .map(plain)
      .join("");
  return (node.children ?? []).map(narrative).join(" ");
}

function sections(markdown, problems) {
  const nodes = parser.parse(markdown).children;
  const result = new Map();
  let section;
  for (const node of nodes) {
    if (node.type === "heading" && node.depth === 2) {
      section = plain(node);
      if (result.has(section)) problems.push(`duplicate section ${section}`);
      result.set(section, []);
    } else if (section) result.get(section).push(node);
  }
  return result;
}

function table(nodes, count, label, problems) {
  const tables = (nodes ?? []).filter((node) => node.type === "table");
  if (tables.length !== 1) problems.push(`${label}: expected one real Markdown table`);
  const rows = tables[0]?.children ?? [];
  for (const row of rows) if (row.children.length !== count) problems.push(`${label}: expected ${count} cells`);
  return rows.map((row) => row.children);
}

/** The final column explicitly enumerates design recipe/forms, independently of MOTION_FORMS. */
export function parseTargetPresets(markdown) {
  const problems = [];
  const nodes = sections(markdown, problems).get("3. Default preset catalogue") ?? [];
  const tables = nodes.filter((node) => node.type === "table" && plain(node.children[0].children[0]) === "Preset key");
  if (tables.length !== 1) problems.push("expected one preset catalogue table");
  const presets = new Map();
  for (const row of tables[0]?.children.slice(1) ?? []) {
    const cells = row.children;
    const key = codes(cells[0])[0];
    const forms = cells[3] ? codes(cells[3]) : [];
    if (!key || presets.has(key)) problems.push(`missing/duplicate preset ${key}`);
    if (cells.length !== 4 || !forms.length || forms.some((form) => !/^[a-z][\w.-]*\/[a-z][\w-]*$/.test(form)))
      problems.push(`${key}: exact target recipe/forms required`);
    if (new Set(forms).size !== forms.length) problems.push(`${key}: duplicate target form`);
    // The authored recipe description must agree with its typed references (native is not a recipe).
    const described = codes(cells[1]).filter((code) => /^[a-z][\w.-]*$/.test(code));
    for (const form of forms)
      if (!form.startsWith("native/") && !described.includes(form.split("/")[0]))
        problems.push(`${key}: form ${form} absent from recipe description`);
    presets.set(key, forms);
  }
  return { presets, problems };
}

export function parseMotionTarget(markdown, id, presets) {
  const problems = [];
  const { metadata: meta, problems: metadataProblems } = targetMetadata(markdown);
  problems.push(...metadataProblems);
  if (meta?.schema !== 1 || meta.target !== "motion-v2")
    problems.push("motion schema: 1 and target: motion-v2 required");
  if (meta && Object.keys(meta).some((key) => !["schema", "target", "migration", "parts"].includes(key)))
    problems.push("unknown motion schema field");
  const migration = migrationProblems(meta?.migration);
  const parts = meta?.parts;
  if (!parts || typeof parts !== "object" || Array.isArray(parts) || !Object.keys(parts).length)
    problems.push("nonempty parts reference map required");
  const safeParts = parts && typeof parts === "object" && !Array.isArray(parts) ? parts : {};
  for (const [part, refs] of Object.entries(safeParts)) {
    if (
      !/^[a-z][\w-]*$/.test(part) ||
      !Array.isArray(refs) ||
      !refs.length ||
      refs.some((ref) => typeof ref !== "string" || !/^[a-z][\w-]*#[A-Z]\w*$/.test(ref))
    )
      problems.push(`${part}: expected component#Export part references`);
    if (Array.isArray(refs) && new Set(refs).size !== refs.length) problems.push(`${part}: duplicate part reference`);
  }
  const blocks = sections(markdown, problems);
  for (const heading of SECTIONS) {
    const body = blocks.get(heading);
    const prose = body?.map(narrative).join(" ") ?? "";
    const needsProse = !["Capability ownership", "Choreography and modes"].includes(heading);
    if (!body?.length || (needsProse && (!meaningful(prose) || prose.trim().length < 40)))
      problems.push(`${heading}: substantive content required (no scaffold placeholders)`);
  }
  const actionRows = table(blocks.get("Choreography and modes"), 5, "actions", problems);
  if (actionRows[0]?.slice(1, 4).map(plain).join("/").toLowerCase() !== "full/reduced/none")
    problems.push("actions: full/reduced/none must be independent columns");
  const bindings = new Map();
  const actions = [];
  for (const [index, cells] of actionRows.slice(1).entries()) {
    const values = cells.map(plain);
    if (values.some((value) => !meaningful(value)))
      problems.push(`action ${index + 1}: trigger/owner and all mode outcomes required`);
    const references = [];
    // AST excludes comments/code fences; each semicolon-delimited chain must be complete.
    for (const chain of (values[4] ?? "").split(";")) {
      const match = chain
        .trim()
        .match(/^([\w-]+\.[\w-]+\.[\w.-]+) → ([\w.-]+) → ([a-z][\w.-]*\/[a-z][\w-]*)(?: \([^\n]+\))?$/);
      if (!match) {
        problems.push(`action ${index + 1}: incomplete binding → preset → recipe/form: ${chain}`);
        continue;
      }
      const [, binding, preset, form] = match;
      const [component, part] = binding.split(".");
      if (component !== id || !Object.hasOwn(safeParts, part))
        problems.push(`${binding}: missing actual part reference`);
      if (!presets.get(preset)?.includes(form))
        problems.push(`${binding}: ${preset} does not allow exact form ${form}`);
      const previous = bindings.get(binding);
      if (previous && (previous.preset !== preset || previous.form !== form))
        problems.push(`${binding}: conflicting repeated binding`);
      bindings.set(binding, { preset, form, part });
      references.push(binding);
    }
    actions.push({ trigger: values[0], full: values[1], reduced: values[2], none: values[3], bindings: references });
  }
  if (!actions.length) problems.push("at least one authored action required");
  const capabilityRows = table(blocks.get("Capability ownership"), 3, "capabilities", problems);
  const seen = new Set();
  const capabilities = [];
  for (const cells of capabilityRows.slice(1)) {
    const [name, reason, refs = ""] = cells.map(plain);
    if (!CAPABILITIES.includes(name) || seen.has(name)) problems.push(`unknown/duplicate capability ${name}`);
    seen.add(name);
    if (!meaningful(reason) || reason.length < 20) problems.push(`${name}: ownership/applicability reason required`);
    const references = [];
    const relationships = new Map();
    for (const clause of refs.split(";")) {
      const match = clause.trim().match(/^(default|inherited|composed|not-applicable): (.+)$/);
      if (!match || !MOTION_RELATIONSHIPS.includes(match[1])) {
        problems.push(`${name}: explicit coverage and references required`);
        continue;
      }
      const [, coverage, list] = match;
      const targets = list.split(", ");
      if (new Set(targets).size !== targets.length) problems.push(`${name}: duplicate capability reference`);
      for (const target of targets) {
        const previous = relationships.get(target);
        if (previous === coverage || (previous && !target.startsWith("@")))
          problems.push(`${name}: duplicate/conflicting relationship for ${target}`);
        relationships.set(target, coverage);
        const binding = bindings.get(target);
        if (target.startsWith("@")) {
          if (coverage === "default" || !Object.hasOwn(safeParts, target.slice(1)))
            problems.push(
              `${name}: ${coverage} requires a real ${coverage === "default" ? "action" : "part"} reference`,
            );
        } else if (!binding) problems.push(`${name}: dangling action ${target}`);
        else if (!CAPABILITY_RECIPES[name]?.includes(binding.form.split("/")[0]))
          problems.push(`${name}: unrelated action ${target} (${binding.form})`);
        else if (coverage === "default" && binding.form.startsWith("native/"))
          problems.push(`${name}: native delegation is inherited, not a default local effect`);
        else if (name === "Appearance" && /\/(continuous|determinate|embla|recharts)$/.test(binding.form))
          problems.push(`${name}: data update is not an entrance ${target}`);
        else if (
          name === "Appearance" &&
          binding.form.startsWith("layout.move/") &&
          binding.form !== "layout.move/size-linked"
        )
          problems.push(`${name}: ordinary reflow is not a visibility action ${target}`);
        else if (name === "Surface colour" && binding.form === "state.color/foreground")
          problems.push(`${name}: foreground-only action ${target}`);
        else if (name === "Text colour" && binding.form === "state.color/surface")
          problems.push(`${name}: surface-only action ${target}`);
        if (
          binding &&
          coverage === "default" &&
          !(
            Array.isArray(safeParts[binding.part]) &&
            safeParts[binding.part].some((ref) => typeof ref === "string" && ref.startsWith(`${id}#`))
          )
        )
          problems.push(
            `${name}: default action ${target} needs a local integration anchor; foreign-only ownership is inherited/composed`,
          );
        if (coverage === "not-applicable" && !target.startsWith("@"))
          problems.push(`${name}: not-applicable must name a part, not an effect`);
      }
      const owners = [
        ...new Set(
          targets.flatMap((target) => {
            const part = target.startsWith("@") ? target.slice(1) : bindings.get(target)?.part;
            return safeParts[part] ?? [];
          }),
        ),
      ];
      references.push({ coverage, targets, owners });
    }
    capabilities.push({ name, reason, references });
  }
  for (const name of CAPABILITIES) if (!seen.has(name)) problems.push(`missing capability ${name}`);
  const usedParts = new Set([...bindings.values()].map((binding) => binding.part));
  for (const capability of capabilities)
    for (const ref of capability.references)
      for (const target of ref.targets) if (target.startsWith("@")) usedParts.add(target.slice(1));
  for (const part of Object.keys(safeParts)) if (!usedParts.has(part)) problems.push(`${part}: unused part reference`);
  return {
    problems: [...problems, ...migration],
    referenceProblems: problems,
    migration: meta?.migration,
    parts: safeParts,
    bindings,
    actions,
    capabilities,
  };
}

export async function checkMotionTargets(root, registry) {
  const problems = [];
  const read = (file) => readFile(path.join(root, file), "utf8");
  const items = registry.items.filter((item) => ["registry:ui", "registry:block"].includes(item.type));
  let presetResult;
  let index;
  let files;
  try {
    presetResult = parseTargetPresets(await read("docs/motion/presets.md"));
    index = parser.parse(await read("docs/motion/README.md"));
    files = await readdir(path.join(root, "docs/motion/components"));
  } catch (error) {
    return { problems: [`motion target inventory: ${error.message}`], contracts: new Map() };
  }
  problems.push(...presetResult.problems.map((problem) => `presets: ${problem}`));
  const links = [];
  function walk(node) {
    if (node.type === "link" && /^components\//.test(node.url)) links.push(node.url);
    for (const child of node.children ?? []) walk(child);
  }
  walk(index);
  const expected = items.map((item) => `${item.name}.md`).sort();
  if (JSON.stringify(files.filter((file) => file.endsWith(".md")).sort()) !== JSON.stringify(expected))
    problems.push("motion target files must exactly match current registry UI/block inventory");
  if (JSON.stringify(links.map((link) => link.slice("components/".length)).sort()) !== JSON.stringify(expected))
    problems.push("motion index must link each current registry UI/block contract exactly once");
  const surfaces = new Map();
  for (const item of items) {
    const source = (
      await Promise.all(item.files.filter((file) => /\.[cm]?[jt]sx?$/.test(file.path)).map((file) => read(file.path)))
    ).join("\n");
    surfaces.set(item.name, valueExports(source));
  }
  const contracts = new Map();
  for (const item of items) {
    try {
      const contract = parseMotionTarget(
        await read(`docs/motion/components/${item.name}.md`),
        item.name,
        presetResult.presets,
      );
      contracts.set(item.name, contract);
      problems.push(...contract.problems.map((problem) => `${item.name}: ${problem}`));
      for (const [part, refs] of Object.entries(contract.parts)) {
        if (!Array.isArray(refs)) continue;
        for (const ref of refs) {
          if (typeof ref !== "string") continue;
          const [owner, name] = ref.split("#");
          if (!surfaces.get(owner)?.has(name)) problems.push(`${item.name}.${part}: unknown actual part ${ref}`);
          if (owner !== item.name && !item.registryDependencies?.includes(`@cadence/${owner}`))
            problems.push(`${item.name}.${part}: ${ref} is not an explicit component dependency`);
        }
      }
    } catch (error) {
      problems.push(`${item.name}: cannot read target contract: ${error.message}`);
    }
  }
  const adoption = await checkMotionPartAdoption(root, registry, contracts);
  problems.push(...adoption.problems);
  return { problems, contracts, presets: presetResult.presets, adoption };
}
