import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";
import { installationPlan } from "../../scripts/installation.mjs";

it("binds a real scalar/native selection controller and rejects stale semantic revisions", async () => {
  const root = process.cwd(),
    base = process.env.CADENCE_GATE_EVIDENCE ?? path.join(root, ".cache");
  await mkdir(base, { recursive: true });
  const fixture = await mkdtemp(path.join(base, "v2-projection-"));
  const put = async (file: string, value: string) => {
    await mkdir(path.dirname(path.join(fixture, file)), { recursive: true });
    await writeFile(path.join(fixture, file), value);
  };
  const original = JSON.parse(await readFile("registry.json", "utf8"));
  const reason = "The persistent selection decoration owns one physical transform writer.";
  const item = {
    name: "fixture",
    type: "registry:ui",
    registryDependencies: ["@cadence/cadence-selection"],
    files: [{ path: "registry/cadence/fixture/index.tsx", target: "@components/cadence/fixture/index.tsx" }],
    meta: {
      motion: [{ recipe: "layout.shared", form: "selection" }],
      intensity: "subtle",
      motionProfile: { scope: "local", travel: "compact", coordination: "independent", reason },
      motionCoverage: {
        schema: 1,
        effects: { "layout.shared/selection": [{ relationship: "default", owner: "fixture", reason }] },
      },
    },
  };
  const installation = installationPlan([item, ...original.items], "fixture");
  await put("registry.json", JSON.stringify({ items: installation.items }));
  for (const file of installation.files)
    await put(
      file.path,
      await readFile(
        file.path === item.files[0]?.path ? "tests/fixtures/motion-v2/projection.tsx.txt" : file.path,
        "utf8",
      ),
    );
  const contract = (await readFile("tests/fixtures/motion-adoption/contract.md.txt", "utf8"))
    .replaceAll("default: `fixture.paint.colour`", "not-applicable: `@paint`")
    .replaceAll("fixture.paint.colour", "fixture.paint.selection")
    .replaceAll("`state.color`", "`layout.selection`")
    .replaceAll("state.color/surface-foreground", "layout.shared/selection");
  await put("docs/motion/components/fixture.md", contract);
  await put("docs/motion/presets.md", await readFile("docs/motion/presets.md", "utf8"));
  await put("docs/motion/README.md", "[Fixture](components/fixture.md)");
  const config = path.join(fixture, "vitest.config.mjs");
  await writeFile(
    config,
    `import react from '@vitejs/plugin-react';import {componentExecutionPlugin} from ${JSON.stringify(path.join(root, "tests/component-execution-plugin.mjs"))};export default {root:${JSON.stringify(fixture)},plugins:[componentExecutionPlugin([{name:'fixture',type:'registry:ui'}]),react()],test:{environment:'jsdom',globals:true,setupFiles:[${JSON.stringify(path.join(root, "tests/setup.ts"))}],reporters:['default',[${JSON.stringify(path.join(root, "tests/motion-contract-reporter.mjs"))},{root:${JSON.stringify(fixture)}}]],maxWorkers:1,include:['tests/components/*.test.tsx']}}`,
  );
  const test = `import {render,cleanup} from '@testing-library/react';import {it,expect,afterEach} from 'vitest';import {CadenceProvider} from '../../registry/cadence/lib/provider';import {Fixture} from '../../registry/cadence/fixture';import {expectV2MotionAction,expectV2NativeBoundaries} from ${JSON.stringify(path.join(root, "tests/motion-v2-contract"))};const root=${JSON.stringify(fixture)};afterEach(()=>cleanup());
const animations=new WeakMap();Object.defineProperty(HTMLElement.prototype,'getAnimations',{configurable:true,value:function(){return (animations.get(this)||[]).filter(a=>a.playState==='running')}});Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:function(frames,options){const effect={target:this,getKeyframes:()=>Array.isArray(frames)?frames:[frames],getTiming:()=>options,setKeyframes(next){frames=next}};const handle={effect,playState:'running',finished:new Promise(()=>{}),cancel(){this.playState='idle'}};animations.set(this,[...(animations.get(this)||[]),handle]);return handle}});
it.each(['full','reduced','none'])('actual scalar %s',async mode=>{const draw=changed=><CadenceProvider mode={mode}><Fixture changed={changed} stale={false}/></CadenceProvider>;const view=render(draw(false));await expectV2MotionAction('fixture','fixture.paint.selection',mode,()=>view.rerender(draw(true)),{root,container:view.container});await expectV2NativeBoundaries('fixture',{root,container:view.container});});`;
  for (const [name, body, expected] of [
    ["actual", test, 0],
    ["stale", test.replace("stale={false}", "stale={changed}"), 1],
  ] as const) {
    await put("tests/components/fixture.test.tsx", body);
    const run = spawnSync(
      process.execPath,
      [path.join(root, "node_modules/vitest/vitest.mjs"), "run", "--config", config],
      { cwd: root, encoding: "utf8", timeout: 120000 },
    );
    const output = run.stdout + run.stderr;
    await put(`${name}.log`, output);
    expect(run.status, output).toBe(expected);
    if (name === "stale") expect(output).toContain("semantic revision must still be current");
  }
  const live =
    test +
    `
import {expectJointMotionEvidence} from ${JSON.stringify(path.join(root, "tests/joint-motion-evidence"))};import {nativeEffects,scalarValues} from ${JSON.stringify(path.join(root, "tests/motion-observer"))};
it.each(['reduced','none'])('live scalar cancellation %s',mode=>{const draw=(policy,changed)=><CadenceProvider mode={policy}><Fixture changed={changed}/></CadenceProvider>;const view=render(draw('full',false));view.rerender(draw('full',true));expect([...scalarValues.values()].some(values=>[...values].some(value=>value.isAnimating()))).toBe(true);
// Isolate the scalar-only proof path used by canvas writers: no WAAPI ledger
// entry may be needed to notice a still-running actual MotionValue.
nativeEffects.clear();view.rerender(draw(mode,true));expectJointMotionEvidence(mode,view.container,[]);});
it('actual scalar teardown after native host removal',()=>{const draw=changed=><CadenceProvider mode="full"><Fixture changed={changed}/></CadenceProvider>;const view=render(draw(false));view.rerender(draw(true));expectJointMotionEvidence('full',view.container,[]);nativeEffects.clear();view.unmount();expectJointMotionEvidence('full',view.container,[]);});`;
  await put("tests/components/fixture.test.tsx", live);
  const selectionFile = "registry/cadence/lib/selection-projection.ts",
    selection = await readFile(path.join(fixture, selectionFile), "utf8");
  for (const broken of [false, true]) {
    await put(
      selectionFile,
      broken
        ? selection
            .replaceAll("for (const edge of edges) edge.stop();", "for (const edge of edges) void edge;")
            .replace("edge.jump(targets[index] ?? 0);", "void targets[index];")
        : selection,
    );
    const run = spawnSync(
      process.execPath,
      [path.join(root, "node_modules/vitest/vitest.mjs"), "run", "--config", config],
      { cwd: root, encoding: "utf8", timeout: 120000 },
    );
    const output = run.stdout + run.stderr;
    await put(broken ? "live-broken.log" : "live-actual.log", output);
    expect(run.status, output).toBe(broken ? 1 : 0);
    if (broken) expect(output).toContain("downgrade must cancel the actual scalar writer");
  }
}, 60000);
