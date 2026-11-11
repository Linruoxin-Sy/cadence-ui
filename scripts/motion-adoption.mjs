/** Static adoption subgate. It cannot issue component-v2/runtime acceptance. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { implementationOwner, motionCoverageProblems } from "./motion-coverage.mjs";
import { cssPolicyBindings, implementedForm, motionForms, parameterWriterForms } from "./motion-manifest.mjs";
import { motionSource, valueExports } from "./motion-source.mjs";

// These forms have the SAME installed and target meaning. Property-qualified
// presence/gesture/native forms must acquire an explicit recogniser; a matching
// recipe name or duration cannot turn a legacy one-shot into that target form.
const EXACT_FORMS = new Set([
  "text.change/changed-runs",
  "number.roll/reels",
  "reveal/viewport",
  "layout.shared/selection",
  "data.transition/directional-content",
  "data.transition/month-grid",
  "layout.move/size-linked",
  "geometry.resize/measured",
  "data.transition/continuous",
]);
const SURFACE = new Set([
  "background-color",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "box-shadow",
]);
const FOREGROUND = new Set(["color", "fill", "stroke", "text-decoration-color", "text-shadow"]);
const TARGET_CAPABILITIES = new Map([
  ["text.change/changed-runs", ["Changed text"]],
  ["number.roll/reels", ["Changed numbers"]],
  ["reveal/viewport", ["Appearance"]],
  ["geometry.resize/measured", ["Size"]],
  ["state.color/surface", ["Surface colour"]],
  ["state.color/foreground", ["Text colour"]],
  ["state.color/surface-foreground", ["Surface colour", "Text colour"]],
]);

export function installedTargetForm(form, parameterized = false) {
  if (EXACT_FORMS.has(form)) return form;
  if (["state.color/surface", "state.color/foreground", "state.color/surface-foreground"].includes(form))
    return "state.color/css-transition";
  if (
    parameterized &&
    /^(data\.transition\/(opacity|determinate)|enter\.pop\/(opacity|surface)|exit\.fade\/opacity|feedback\.press\/scale|state\.morph\/indicator|layout\.move\/position|popup\.anchored\/(presence|edge|edge-exit|ending|opacity-enter|opacity-exit)|handoff\/value|scroll\.navigate\/scroll)$/.test(
      form,
    )
  )
    return `${form.split("/")[0]}/one-shot`;
  return null;
}

function targetImplementation(source, targetForm, installedForm) {
  const [recipe, form] = installedForm.split("/");
  if (implementedForm(source, recipe, form) !== form) return false;
  if (form === "one-shot" && parameterWriterForms(source).includes(targetForm)) return true;
  // v2 loops require the real policy, never the legacy animate-* exception.
  if (targetForm === "data.transition/continuous")
    return cssPolicyBindings(source).some((binding) => binding.kind === "useContinuousMotion");
  if (!targetForm.startsWith("state.color/")) return true;
  return cssPolicyBindings(source).some(({ kind, properties, slot }) => {
    if (kind !== "useStateColor" || !slot || !properties.length) return false;
    const surface = properties.some((property) => SURFACE.has(property));
    const foreground = properties.some((property) => FOREGROUND.has(property));
    if (targetForm === "state.color/surface") return surface && !foreground;
    if (targetForm === "state.color/foreground") return foreground && !surface;
    return surface && foreground;
  });
}

/** Each selected root is scanned separately; a sibling export cannot certify it.
 * Paths retain actual import names, including aliases, and installation closure.
 * No persisted report/JSON declaration can supply a positive source reference.
 */
async function partScanner(root, registry) {
  const files = new Map();
  const read = async (file) => {
    if (!files.has(file)) files.set(file, await readFile(path.join(root, file), "utf8"));
    return files.get(file);
  };
  const items = new Map(registry.items.map((item) => [item.name, item]));
  const scans = new Map();
  const exportSets = new Map();
  return async (id, exported, targetForm, installedForm) => {
    const key = JSON.stringify([id, exported, targetForm, installedForm]);
    if (scans.has(key)) return scans.get(key);
    const installed = new Set();
    const seenItems = new Set();
    const install = (id) => {
      if (seenItems.has(id)) return;
      seenItems.add(id);
      const item = items.get(id);
      if (!item) throw new Error(`unknown installed item ${id}`);
      for (const file of item.files ?? []) installed.add(file.path);
      for (const dep of item.registryDependencies ?? [])
        if (dep.startsWith("@cadence/")) install(dep.slice("@cadence/".length));
    };
    install(id);
    const references = [];
    const visit = async (file, selected, via, anchors, visiting, selections = []) => {
      const key = JSON.stringify([file, selected]);
      if (visiting.has(key)) return;
      const source = await read(file);
      if (!exportSets.has(file)) exportSets.set(file, valueExports(source));
      if (selected.some((name) => !exportSets.get(file).has(name))) return;
      const owner = file.match(/^registry\/cadence\/([^/]+)\/index\.tsx$/)?.[1];
      const route = owner ? [...anchors, ...selected.map((name) => `${owner}#${name}`)] : anchors;
      const scanned = motionSource(source, selected);
      const pathSelections = [...selections, { file, selected }];
      if (targetImplementation(scanned.source, targetForm, installedForm)) {
        const [recipe, form] = installedForm.split("/");
        references.push({ recipe, form, file, via, anchors: route, selections: pathSelections });
      }
      for (const dependency of scanned.imports) {
        if (!dependency.path.startsWith(".")) continue;
        const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), dependency.path));
        const target = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.tsx`].find((file) => installed.has(file));
        if (target)
          await visit(
            target,
            [dependency.name],
            [...via, `${file}#${dependency.local}`],
            route,
            new Set([...visiting, key]),
            pathSelections,
          );
      }
    };
    const entry = `registry/cadence/${id}/index.tsx`;
    if (installed.has(entry)) await visit(entry, [exported], [], [], new Set());
    scans.set(key, references);
    return references;
  };
}

/** Capability -> action -> exact installed form -> selected exported part ->
 * nearest integration owner. This subgate is intentionally NOT migrationProblems:
 * independent strict host/property/mode and browser evidence remains mandatory.
 */
export async function checkMotionPartAdoption(root, registry, contracts) {
  const problems = [];
  const bindings = [];
  const boundaries = [];
  const nativeActions = [];
  const scanner = await partScanner(root, registry);
  const items = new Map(registry.items.map((item) => [item.name, item]));
  for (const [id, contract] of contracts) {
    if (contract.migration !== "v2") continue;
    const report = (message) => problems.push(`${id}: adoption: ${message}`);
    if (!Array.isArray(contract.referenceProblems) || contract.referenceProblems.length) {
      report("valid parsed target references required before adoption analysis");
      continue;
    }
    const item = items.get(id);
    if (!item) {
      report("no installed item");
      continue;
    }
    problems.push(...motionCoverageProblems(item).map((message) => `${id}: adoption: ${message}`));
    const forms = motionForms(item.meta?.motion);
    const effects = item.meta?.motionCoverage?.effects ?? {};
    const covered = new Set();
    for (const capability of contract.capabilities)
      for (const ref of capability.references)
        for (const target of ref.targets)
          if (target.startsWith("@"))
            boundaries.push({
              item: id,
              capability: capability.name,
              relationship: ref.coverage,
              part: target.slice(1),
              reason: capability.reason,
            });
    for (const [name, binding] of contract.bindings) {
      if (binding.form.startsWith("native/")) {
        const engine = binding.form.slice("native/".length);
        const modules = {
          embla: "embla-carousel-react",
          recharts: "recharts",
          cmdk: "cmdk",
          "input-otp": "input-otp",
          "resizable-panels": "react-resizable-panels",
        };
        let valid = true;
        for (const anchor of contract.parts[binding.part] ?? []) {
          const [owner, exported] = anchor.split("#");
          const file = `registry/cadence/${owner}/index.tsx`;
          const selected = motionSource(await readFile(path.join(root, file), "utf8"), [exported]);
          const module =
            modules[engine] ?? (engine.startsWith("base-ui-") ? `@base-ui/react/${engine.slice(8)}` : undefined);
          const nativeTag = { input: "input", textarea: "textarea", table: "table" }[engine];
          const adopted = module
            ? selected.imports.some((entry) => entry.path === module)
            : nativeTag
              ? new RegExp(`<${nativeTag}\\b`).test(selected.source)
              : engine === "css-layout" && /<[a-z][\w-]*\b/.test(selected.source);
          if (!adopted) {
            report(`${name}: actual native ${engine} owner required on ${anchor}`);
            valid = false;
          } else
            nativeActions.push({
              item: id,
              binding: name,
              part: binding.part,
              anchor,
              file,
              preset: binding.preset,
              form: binding.form,
            });
        }
        if (!valid) continue;
        continue;
      }
      const installedForm = installedTargetForm(binding.form, true);
      if (!installedForm) {
        report(`${name}: no exact installed recogniser for target ${binding.form}`);
        continue;
      }
      if (!forms.includes(installedForm)) {
        report(`${name}: target ${binding.form} requires declared installed ${installedForm}`);
        continue;
      }
      const missingCapabilities = (TARGET_CAPABILITIES.get(binding.form) ?? []).filter(
        (capabilityName) =>
          !contract.capabilities.some(
            (capability) =>
              capability.name === capabilityName && capability.references.some((ref) => ref.targets.includes(name)),
          ),
      );
      if (missingCapabilities.length) {
        report(`${name}: ${binding.form} requires capability action references for ${missingCapabilities.join(", ")}`);
        continue;
      }
      const anchors = contract.parts[binding.part];
      if (!Array.isArray(anchors) || !anchors.length) {
        report(`${name}: missing part anchors`);
        continue;
      }
      const relationships = new Set(
        contract.capabilities.flatMap((capability) =>
          capability.references.filter((ref) => ref.targets.includes(name)).map((ref) => ref.coverage),
        ),
      );
      // Ancillary actions (press/loop/indicator) still need implementation even
      // when they do not belong in one of the six baseline summary rows.
      if (!relationships.size)
        relationships.add(anchors.every((ref) => ref.startsWith(`${id}#`)) ? "default" : "inherited");
      if (relationships.size !== 1) {
        report(`${name}: conflicting capability integration relationships`);
        continue;
      }
      const relationship = [...relationships][0];
      if (relationship === "composed") {
        // Explicit viewport composition is a real context-provided scope. A
        // nearby group, a dependency declaration or an arbitrary wrapper cannot
        // supply this source edge; runtime still requires its registered host.
        const scopeAnchor = contract.parts.scope?.find((anchor) => anchor.startsWith(`${id}#`));
        const scopeSource = await readFile(path.join(root, `registry/cadence/${id}/index.tsx`), "utf8");
        const scopePart = scopeAnchor?.split("#")[1];
        const selected = scopePart ? motionSource(scopeSource, [scopePart]).source : "";
        if (
          binding.form !== "reveal/viewport" ||
          !scopeAnchor ||
          !selected.includes("createViewportReveal(options)") ||
          !selected.includes("<RevealScopeContext value={scope}>")
        ) {
          report(`${name}: composed action requires a real scope provider and registered target path`);
          continue;
        }
        const coverage = effects[installedForm];
        if (!coverage?.some((effect) => effect.owner === id && effect.relationship === "composed")) {
          report(`${name}: composed scope must retain its actual installed owner ${id}`);
          continue;
        }
        for (const anchor of anchors) {
          const [hostOwner, exported] = anchor.split("#");
          const hostSource = await readFile(path.join(root, `registry/cadence/${hostOwner}/index.tsx`), "utf8");
          const target = motionSource(hostSource, [exported]).source;
          const adopted = contracts.get(hostOwner);
          if (
            !item.registryDependencies?.includes(`@cadence/${hostOwner}`) ||
            adopted?.migration !== "v2" ||
            !target.includes("useContext(RevealScopeContext)") ||
            !target.includes("inherited ?? local") ||
            ![...adopted.bindings.values()].some((own) => own.form === binding.form && own.preset === binding.preset)
          ) {
            report(
              `${name}: composed target ${anchor} must consume the actual scope and retain its migrated form/preset`,
            );
            continue;
          }
          const references = [
            ...(await scanner(id, scopePart, binding.form, installedForm)),
            ...(await scanner(hostOwner, exported, binding.form, installedForm)),
          ];
          if (references.length < 2) {
            report(`${name}: real scope and host implementation paths required`);
            continue;
          }
          covered.add(`${installedForm}\0${id}`);
          bindings.push({
            item: id,
            binding: name,
            targetForm: binding.form,
            installedForm,
            relationship,
            anchor,
            owner: id,
            hostOwner,
            scopeAnchor,
            references,
          });
        }
        continue;
      }
      const ownership = Array.isArray(effects[installedForm]) ? effects[installedForm] : [];
      for (const anchor of anchors) {
        const [owner, exported] = anchor.split("#");
        if (relationship === "default" && owner !== id) {
          report(`${name}: default cannot claim foreign part ${anchor}`);
          continue;
        }
        if (relationship === "inherited" && owner === id) {
          report(`${name}: inherited effect requires a foreign part, not ${anchor}`);
          continue;
        }
        if (!ownership.some((effect) => effect.owner === owner && effect.relationship === relationship)) {
          report(`${name}: ${installedForm} lacks ${relationship} installed owner ${owner}`);
          continue;
        }
        if (owner !== id) {
          if (!item.registryDependencies?.includes(`@cadence/${owner}`)) {
            report(`${name}: ${owner} is not an explicit dependency`);
            continue;
          }
          const inherited = contracts.get(owner);
          const ownerItem = items.get(owner);
          const ownerEffects = ownerItem?.meta?.motionCoverage?.effects?.[installedForm];
          if (
            inherited?.migration !== "v2" ||
            !Array.isArray(inherited.referenceProblems) ||
            inherited.referenceProblems.length ||
            !motionForms(ownerItem?.meta?.motion).includes(installedForm) ||
            !Array.isArray(ownerEffects) ||
            !ownerEffects.some((effect) => effect.owner === owner && effect.relationship === "default") ||
            ![...inherited.bindings.values()].some(
              (own) =>
                own.form === binding.form &&
                own.preset === binding.preset &&
                inherited.parts[own.part]?.includes(anchor),
            )
          ) {
            report(
              `${name}: inherited ${anchor} must retain its migrated owner's exact preset/form and responsibility`,
            );
            continue;
          }
        }
        try {
          const roots =
            owner === id
              ? [exported]
              : [...valueExports(await readFile(path.join(root, `registry/cadence/${id}/index.tsx`), "utf8"))];
          const references = (await Promise.all(roots.map((part) => scanner(id, part, binding.form, installedForm))))
            .flat()
            .filter((reference) => reference.anchors.includes(anchor) && implementationOwner(reference) === owner);
          if (!references.length) {
            report(`${name}: ${binding.form} is not adopted by actual ${anchor} on a live installed path`);
            continue;
          }
          covered.add(`${installedForm}\0${owner}`);
          bindings.push({
            item: id,
            binding: name,
            targetForm: binding.form,
            installedForm,
            relationship,
            anchor,
            owner,
            references,
          });
        } catch (error) {
          report(`${name}: cannot resolve ${anchor}: ${error.message}`);
        }
      }
    }
    // Removing defaults from the capability row cannot hide shipped effects
    // behind composed/@part or N/A. Additional effects still need action chains.
    for (const [form, ownership] of Object.entries(effects))
      for (const effect of Array.isArray(ownership) ? ownership : [])
        if (!covered.has(`${form}\0${effect.owner}`))
          report(`${form}: installed owner ${effect.owner} has no verified target action`);
  }
  return { problems, bindings, boundaries, nativeActions };
}
