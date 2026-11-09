// Executable evidence-transport fixture, NOT the component-v2 adoption gate.
import { writeFileSync } from "node:fs";
import MotionContractReporter from "../../motion-contract-reporter.mjs";

export default class JointFixtureReporter extends MotionContractReporter {
  async onTestRunEnd(modules) {
    await super.onTestRunEnd(modules);
    const failures = [];
    const report = {};
    for (const module of modules) {
      const name = module.moduleId.replaceAll("\\", "/").split("/").at(-1);
      const records = [...module.children.allTests("passed")].flatMap((test) => test.meta().cadenceJoint ?? []);
      report[name] = records;
      const missing = ["full", "reduced", "none"].filter(
        (mode) =>
          !records.some(
            (record) =>
              record.mode === mode &&
              record.owner.exports.includes("joint-fixture#Paint") &&
              record.host.exports.includes("joint-fixture#Paint") &&
              record.host.slot === "joint-paint" &&
              record.owner.instance === record.host.instance &&
              record.host.physical > 0 &&
              record.controller > 0 &&
              record.form === "state.color/surface-foreground" &&
              record.evidence === "executed-policy" &&
              record.connection === "local" &&
              JSON.stringify(record.properties) === '["background-color","color"]',
          ),
      );
      if (missing.length) failures.push(`${name}: successful joint Paint policy required in ${missing.join(", ")}`);
      else console.log(`${name}: actual joint policy transport PASS`);
    }
    if (process.env.CADENCE_JOINT_REPORT)
      writeFileSync(process.env.CADENCE_JOINT_REPORT, JSON.stringify(report, null, 2));
    if (failures.length) throw new Error(failures.join("\n"));
  }
}
