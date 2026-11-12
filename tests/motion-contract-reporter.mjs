import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkCatalogIntensity } from "../scripts/catalog-intensity.mjs";
import { checkMotionCoverage } from "../scripts/motion-coverage.mjs";
import { verifiedMotionEvidence } from "../scripts/motion-evidence-authority.mjs";
import { checkMotionImplementations } from "../scripts/motion-implementation.mjs";
import { cssPolicyCapabilities, motionForms, motionRecipes, normaliseMotion } from "../scripts/motion-manifest.mjs";
import { migrationProblems, targetMetadata } from "../scripts/motion-migration.mjs";
import { checkMotionTargets } from "../scripts/motion-targets.mjs";
import { motionV2ExecutionProblems } from "../scripts/motion-v2.mjs";

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));

/** Check successful runtime evidence, including when a whole contract suite is skipped. */
export default class MotionContractReporter {
  constructor(options = {}) {
    // Default to the reporter's own package root, not process.cwd(): a gate
    // fixture copies this file next to its staged registry and must read the
    // staged source it wrote, not the checkout that spawned it.
    this.root = options.root ?? fileURLToPath(new URL("../", import.meta.url));
    this.contractRoot = options.root ?? fileURLToPath(new URL("../", import.meta.url));
    this.registry = options.root ? JSON.parse(readFileSync(path.join(this.root, "registry.json"), "utf8")) : registry;
  }
  async onTestRunEnd(modules) {
    const registry = this.registry;
    const failures = [];
    const ids = modules.map(
      (module) => module.moduleId.replaceAll("\\", "/").match(/\/tests\/components\/([^/]+)\.test\.tsx$/)?.[1],
    );
    const testedItems = registry.items
      .filter((item) => ids.includes(item.name) && item.meta?.motion?.length)
      .map((item) => item.name);
    const implementations = testedItems.length
      ? await checkMotionImplementations(this.root, registry, testedItems)
      : { references: {}, problems: [] };
    const { references } = implementations;
    const selected = { items: registry.items.filter((item) => ids.includes(item.name)) };
    failures.push(
      ...implementations.problems,
      ...checkMotionCoverage(selected, implementations),
      ...checkCatalogIntensity(selected),
    );
    for (const module of modules) {
      if (module.moduleId.replaceAll("\\", "/").endsWith("/tests/lib/motion-policy.test.tsx")) {
        for (const capability of ["color", "loop"]) {
          const modes = new Set(
            [...module.children.allTests("passed")].flatMap((test) => test.meta().cadencePolicy?.[capability] ?? []),
          );
          const missing = ["full", "reduced", "none"].filter((mode) => !modes.has(mode));
          if (missing.length)
            failures.push(
              `shared ${capability}: successful executed policy evidence required in ${missing.join(", ")}`,
            );
        }
      }
      const id = module.moduleId.replaceAll("\\", "/").match(/\/tests\/components\/([^/]+)\.test\.tsx$/)?.[1];
      const item = registry.items.find((item) => item.name === id);
      if (item && ["registry:ui", "registry:block"].includes(item.type)) {
        const target = targetMetadata(
          readFileSync(path.join(this.contractRoot, `docs/motion/components/${id}.md`), "utf8"),
        );
        if (target.metadata?.migration === "v2") {
          const checked = await checkMotionTargets(this.contractRoot, registry);
          failures.push(...target.problems.map((problem) => `${id}: ${problem}`), ...checked.problems);
          if (!checked.v2) {
            failures.push(`${id}: v2 complete source/contract plan required`);
            continue;
          }
          const animated = checked.v2.actions.some((action) => action.item === id);
          failures.push(
            ...motionV2ExecutionProblems(
              id,
              checked.v2,
              [...module.children.allTests("passed")].map((test) => {
                const meta = test.meta();
                const nativeBoundaries = animated
                  ? []
                  : checked.v2.boundaries
                      .filter(
                        (boundary) =>
                          boundary.item === id &&
                          verifiedMotionEvidence(meta.cadenceNativeSigned, test.id, "native").some(
                            (execution) =>
                              execution.live &&
                              execution.module ===
                                path.resolve(this.contractRoot, boundary.file).replaceAll("\\", "/") &&
                              execution.digest === boundary.digest &&
                              execution.exports.includes(boundary.anchor.split("#")[1]) &&
                              boundary.slots.every((slot) => execution.slots.includes(slot)),
                          ),
                      )
                      .map((boundary) => ({ ...boundary, live: true, native: true }));
                return {
                  passed: true,
                  records: verifiedMotionEvidence(meta.cadenceV2Signed, test.id, "actions"),
                  boundaries: [
                    ...verifiedMotionEvidence(meta.cadenceV2Signed, test.id, "boundaries"),
                    ...nativeBoundaries,
                  ],
                };
              }),
            ),
          );
          // The strict helper executes the actual mode policy. Independent legacy
          // tag unions cannot grant or veto a source-bound v2 action.
          continue;
        }
        failures.push(
          ...[...target.problems, ...migrationProblems(target.metadata?.migration)].map(
            (problem) => `${id}: ${problem}`,
          ),
        );
      }
      if (!item) continue;
      const capabilities = new Set(motionRecipes(item.meta?.motion).includes("state.color") ? ["color"] : []);
      for (const file of item.files ?? []) {
        let source;
        try {
          source = readFileSync(new URL(`../${file.path}`, import.meta.url), "utf8");
        } catch {
          source = readFileSync(file.path, "utf8");
        }
        for (const capability of cssPolicyCapabilities(source)) capabilities.add(capability);
      }
      if (!item.meta?.motion?.length && !capabilities.size) continue;
      const passed = [...module.children.allTests("passed")];
      for (const effects of Object.values(item.meta?.motionCoverage?.effects ?? {})) {
        if (!Array.isArray(effects)) continue;
        for (const { owner } of effects) {
          if (owner === id) continue;
          const modes = new Set(passed.flatMap((test) => test.meta().cadenceComponents?.[owner] ?? []));
          const missing = ["full", "reduced", "none"].filter((mode) => !modes.has(mode));
          if (missing.length)
            failures.push(`${id}: execute inherited integration owner ${owner} in ${missing.join(", ")}`);
        }
      }
      for (const entry of normaliseMotion(item.meta?.motion).filter(
        (entry) => entry.form === "css-transition" && entry.recipe !== "state.color",
      )) {
        const reference = references[id]?.find(
          (candidate) => candidate.recipe === entry.recipe && candidate.form === entry.form,
        );
        const owner = reference?.file.match(/registry\/cadence\/([^/]+)\/index\.tsx$/)?.[1];
        const expected = (reference?.exports ?? []).map((part) => `${owner}#${part}`);
        const modes = new Set(
          passed.flatMap((test) => {
            const meta = test.meta();
            return ["full", "reduced", "none"].filter(
              (mode) =>
                expected.some((part) => meta.cadenceExports?.[part]?.includes(mode)) &&
                Object.entries(meta.cadenceCssParts ?? {}).some(
                  ([slot, modes]) =>
                    (slot === id || slot.startsWith(`${id}-`) || slot === owner || slot.startsWith(`${owner}-`)) &&
                    modes.includes(mode),
                ),
            );
          }),
        );
        const missing = ["full", "reduced", "none"].filter((mode) => !modes.has(mode));
        if (missing.length)
          failures.push(
            `${id}: execute ${entry.recipe}/${entry.form} CSS owner in ${missing.join(", ")} (a trigger or copied CSS is insufficient)`,
          );
      }
      const executed = new Set(passed.flatMap((test) => test.meta().cadenceComponents?.[id] ?? []));
      const missingExecution = ["full", "reduced", "none"].filter((mode) => !executed.has(mode));
      if (missingExecution.length)
        failures.push(
          `${id}: mount the actual registry component in ${missingExecution.join(", ")} (attributes alone are not execution)`,
        );
      for (const form of motionForms(item.meta?.motion).filter((form) =>
        [
          "text.change/changed-runs",
          "number.roll/reels",
          "reveal/viewport",
          "layout.shared/selection",
          "data.transition/directional-content",
          "data.transition/month-grid",
          "layout.move/size-linked",
          "geometry.resize/measured",
        ].includes(form),
      )) {
        const modes = new Set(passed.flatMap((test) => test.meta().cadenceForms?.[form] ?? []));
        const missing = ["full", "reduced", "none"].filter((mode) => !modes.has(mode));
        if (missing.length) failures.push(`${id}: execute ${form} controller policy in ${missing.join(", ")}`);
      }
      const partModes = new Set(
        passed.flatMap((test) =>
          id === "reveal-group"
            ? (test.meta().cadenceGroup ?? [])
            : Object.entries(test.meta().cadenceParts ?? {}).flatMap(([slot, modes]) =>
                slot === id || slot.startsWith(`${id}-`) ? modes : [],
              ),
        ),
      );
      const missingParts = ["full", "reduced", "none"].filter((mode) => !partModes.has(mode));
      if (missingParts.length)
        failures.push(
          `${id}: execute actual component parts in ${missingParts.join(", ")} (wrapper or another component cannot certify it)`,
        );
      for (const capability of capabilities) {
        const modes = new Set(
          [...module.children.allTests("passed")].flatMap((test) =>
            Object.entries(test.meta().cadencePolicyParts?.[capability] ?? {}).flatMap(([slot, modes]) =>
              slot === id || slot.startsWith(`${id}-`) ? modes : [],
            ),
          ),
        );
        const missing = ["full", "reduced", "none"].filter((mode) => !modes.has(mode));
        if (missing.length)
          failures.push(
            `${id}: execute ${capability} policy in ${missing.join(", ")} (another recipe cannot certify it)`,
          );
      }
      const modes = new Set();
      for (const test of module.children.allTests("passed")) {
        for (const mode of test.meta().cadenceModes ?? []) modes.add(mode);
      }
      const missing = ["full", "reduced", "none"].filter((mode) => !modes.has(mode));
      if (missing.length)
        failures.push(
          `${id}: execute expectMotionContract in ${missing.join(", ")} (successful runtime calls required)`,
        );
    }
    if (failures.length) throw new Error(failures.join("\n"));
  }
}
