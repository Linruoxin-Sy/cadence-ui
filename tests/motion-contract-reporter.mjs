import { readFileSync } from "node:fs";
import { cssPolicyCapabilities, motionRecipes } from "../scripts/motion-manifest.mjs";
import { migrationProblems, targetMetadata } from "../scripts/motion-migration.mjs";

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));

/** Check successful runtime evidence, including when a whole contract suite is skipped. */
export default class MotionContractReporter {
  onTestRunEnd(modules) {
    const failures = [];
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
          readFileSync(new URL(`../docs/motion/components/${id}.md`, import.meta.url), "utf8"),
        );
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
      for (const capability of capabilities) {
        const modes = new Set(
          [...module.children.allTests("passed")].flatMap((test) => test.meta().cadencePolicy?.[capability] ?? []),
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
