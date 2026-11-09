import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";
import type { JointMotionRecord } from "../joint-motion-evidence";

it("transports actual joint records through the mandatory reporter and rejects dead/skipped/unrelated calls", async () => {
  const root = process.cwd();
  const base = process.env.CADENCE_GATE_EVIDENCE ?? path.join(root, ".cache");
  await mkdir(base, { recursive: true });
  const fixture = await mkdtemp(path.join(base, "joint-motion-reporter-"));
  const testDirectory = path.join(fixture, "tests");
  await mkdir(testDirectory);
  const imports = `import {render,cleanup} from '@testing-library/react';import {it,expect,afterEach} from 'vitest';
import {CadenceProvider} from '@/registry/cadence/lib/provider';
import {Paint,OtherPaint} from '@/tests/fixtures/joint-motion/registry/cadence/joint-fixture';
import {expectMotionContract} from '@/tests/motion-contract';afterEach(()=>cleanup());
const requirement={owner:'joint-fixture#Paint',anchor:'joint-fixture#Paint',slot:'joint-paint',form:'state.color/surface-foreground',properties:['background-color','color']};
`;
  const exercise = `render(<CadenceProvider mode={mode}><Paint/></CadenceProvider>);expectMotionContract(mode,{joint:[requirement],policy:['color']})`;
  const cases = {
    complete: `it.each(['full','reduced','none'])('real %s',mode=>{${exercise}});`,
    dead: `it.each(['full','reduced','none'])('dead %s',mode=>{if(false){${exercise}}expect(true).toBe(true)});`,
    skipped: `it.skip.each(['full','reduced','none'])('skipped %s',mode=>{${exercise}});`,
    unrelated: `it.each(['full','reduced','none'])('unrelated %s',mode=>{render(<CadenceProvider mode={mode}><OtherPaint/></CadenceProvider>);expectMotionContract(mode,{joint:[{...requirement,owner:'joint-fixture#OtherPaint',anchor:'joint-fixture#OtherPaint'}],policy:['color']})});`,
    separate_tags: `it.each(['full','reduced','none'])('old independent tags %s',mode=>{render(<CadenceProvider mode={mode}><Paint/></CadenceProvider>);expectMotionContract(mode,{policy:['color']})});`,
  };
  for (const [name, body] of Object.entries(cases))
    await writeFile(path.join(testDirectory, `${name}.test.tsx`), imports + body);
  const config = path.join(fixture, "vitest.config.mjs");
  const report = path.join(fixture, "joint-records.json");
  await writeFile(
    config,
    `import react from '@vitejs/plugin-react';import {componentExecutionPlugin} from ${JSON.stringify(path.join(root, "tests/component-execution-plugin.mjs"))};
export default {root:${JSON.stringify(fixture)},plugins:[componentExecutionPlugin([{name:'joint-fixture',type:'registry:ui'}]),react()],resolve:{alias:{'@':${JSON.stringify(root)}}},test:{environment:'jsdom',globals:true,setupFiles:[${JSON.stringify(path.join(root, "tests/setup.ts"))}],reporters:['default',${JSON.stringify(path.join(root, "tests/fixtures/joint-motion/reporter.mjs"))}],maxWorkers:2,minWorkers:1,include:['tests/*.test.tsx']}};`,
  );
  const run = spawnSync(
    process.execPath,
    [path.join(root, "node_modules/vitest/vitest.mjs"), "run", "--config", config],
    {
      cwd: root,
      encoding: "utf8",
      timeout: 30000,
      env: { ...process.env, CADENCE_JOINT_REPORT: report },
    },
  );
  const output = run.stdout + run.stderr;
  await writeFile(path.join(fixture, "executed-reporter.log"), output);
  expect(run.status, output).toBe(1);
  expect(output).toContain("complete.test.tsx: actual joint policy transport PASS");
  for (const name of ["dead", "skipped", "unrelated", "separate_tags"])
    expect(output).toContain(`${name}.test.tsx: successful joint Paint policy required in full, reduced, none`);
  const records = JSON.parse(await readFile(report, "utf8")) as Record<string, JointMotionRecord[]>;
  expect(records["complete.test.tsx"]?.map((record) => record.mode).sort()).toEqual(["full", "none", "reduced"]);
  expect(records["separate_tags.test.tsx"]).toEqual([]);
}, 40000);
