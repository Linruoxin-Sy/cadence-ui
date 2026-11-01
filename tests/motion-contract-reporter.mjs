import { readFileSync } from "node:fs";

const registry = JSON.parse(readFileSync(new URL("../registry.json", import.meta.url), "utf8"));

/** Check successful runtime evidence, including when a whole contract suite is skipped. */
export default class MotionContractReporter {
  onTestRunEnd(modules) {
    const failures = [];
    for (const module of modules) {
      const id = module.moduleId.replaceAll("\\", "/").match(/\/tests\/components\/([^/]+)\.test\.tsx$/)?.[1];
      const item = registry.items.find((item) => item.name === id);
      if (!item?.meta?.motion?.length) continue;
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
