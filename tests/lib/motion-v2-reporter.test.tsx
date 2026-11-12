import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, it } from "vitest";
import { installationPlan } from "../../scripts/installation.mjs";
import { checkMotionTargets } from "../../scripts/motion-targets.mjs";

async function exerciseGate(phase: "controls" | "ownership") {
  const root = process.cwd();
  const base = process.env.CADENCE_GATE_EVIDENCE ?? path.join(root, ".cache");
  await mkdir(base, { recursive: true });
  const fixture = await mkdtemp(path.join(base, "v2-enforcer-"));
  const put = async (file: string, value: string) => {
    await mkdir(path.dirname(path.join(fixture, file)), { recursive: true });
    await writeFile(path.join(fixture, file), value);
  };
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const reason = "The same bounded palette writer responds to native state updates.";
  const item = {
    name: "fixture",
    type: "registry:ui",
    registryDependencies: ["@cadence/cadence-provider"],
    files: [{ path: "registry/cadence/fixture/index.tsx", target: "@components/cadence/fixture/index.tsx" }],
    meta: {
      motion: [{ recipe: "state.color", form: "css-transition" }],
      intensity: "subtle",
      motionProfile: { scope: "local", travel: "none", coordination: "independent", reason },
      motionCoverage: {
        schema: 1,
        effects: { "state.color/css-transition": [{ relationship: "default", owner: "fixture", reason }] },
      },
    },
  };
  const items = installationPlan([item, ...registry.items], "fixture").items;
  await put("registry.json", JSON.stringify({ items }));
  for (const entry of installationPlan([item, ...registry.items], "fixture").files) {
    await put(
      entry.path,
      await readFile(
        entry.path === item.files[0]?.path ? "tests/fixtures/motion-v2/source.tsx.txt" : entry.path,
        "utf8",
      ),
    );
  }
  await put("docs/motion/presets.md", await readFile("docs/motion/presets.md", "utf8"));
  await put("docs/motion/README.md", "[Fixture](components/fixture.md)");
  await put(
    "docs/motion/components/fixture.md",
    await readFile("tests/fixtures/motion-adoption/contract.md.txt", "utf8"),
  );
  const imports = `import {render,cleanup} from '@testing-library/react';import {it,expect,afterEach} from 'vitest';
import {CadenceProvider} from '../registry/cadence/lib/provider';import {Fixture,Unrelated} from '../registry/cadence/fixture';
import {expectV2MotionAction,expectV2NativeBoundaries} from ${JSON.stringify(path.join(root, "tests/motion-v2-contract"))};
afterEach(()=>cleanup());const root=${JSON.stringify(fixture)};
`;
  const complete = `it.each(['full','reduced','none'])('real %s',async mode=>{const draw=changed=><CadenceProvider mode={mode}><Fixture changed={changed}/></CadenceProvider>;const view=render(draw(false));await expectV2MotionAction('fixture','fixture.paint.colour',mode,()=>view.rerender(draw(true)),{root,container:view.container});await expectV2NativeBoundaries('fixture',{root,container:view.container});});`;
  const cases = {
    complete,
    dead: `it('dead',()=>{if(false){${complete}}expect(true).toBe(true)});`,
    skipped: complete.replace("it.each", "it.skip.each"),
    noop: complete.replace("draw(true)", "draw(false)"),
    remount: complete.replace("view.rerender(draw(true))", "(view.unmount(),render(draw(true)))"),
    unrelated: complete.replaceAll("<Fixture changed={changed}/>", "<Unrelated/>"),
    missing_mode: complete.replace("['full','reduced','none']", "['full','reduced']"),
    mutated_return: `it('returned observation cannot invent unexecuted modes',async()=>{const draw=changed=><CadenceProvider mode="full"><Fixture changed={changed}/></CadenceProvider>;const view=render(draw(false));const rows=await expectV2MotionAction('fixture','fixture.paint.colour','full',()=>view.rerender(draw(true)),{root,container:view.container});rows.push({...rows[0],mode:'reduced'},{...rows[0],mode:'none'});await expectV2NativeBoundaries('fixture',{root,container:view.container});});`,
    missing_boundary: complete.replace(
      "await expectV2NativeBoundaries('fixture',{root,container:view.container});",
      "",
    ),
    forged: `import {readFileSync} from 'node:fs';import {checkMotionTargets} from ${JSON.stringify(path.join(root, "scripts/motion-targets.mjs"))};it.each(['full','reduced','none'])('hand filled %s',async(mode,context)=>{const plan=(await checkMotionTargets(root,JSON.parse(readFileSync(root+'/registry.json','utf8')))).v2;const rows=plan.actions.map(action=>({item:'fixture',binding:action.binding,preset:action.preset,form:action.targetForm,mode,relationship:action.relationship,anchor:action.anchor,slot:action.slot,site:action.site,properties:action.properties,sources:action.sources,changed:true,policy:true,live:true,controller:1,host:1,instance:1,scope:1}));context.task.meta.cadenceV2=rows;context.task.meta.cadenceV2Boundaries=plan.boundaries.map(boundary=>({...boundary,live:true,native:true}));context.task.meta.cadenceV2Signed=[{test:context.task.id,kind:'actions',rows,signature:'0'.repeat(64)}];expect(rows).toHaveLength(1)});`,
  };
  const config = path.join(fixture, "vitest.config.mjs");
  await writeFile(
    config,
    `import react from '@vitejs/plugin-react';import {componentExecutionPlugin} from ${JSON.stringify(path.join(root, "tests/component-execution-plugin.mjs"))};export default {root:${JSON.stringify(fixture)},plugins:[componentExecutionPlugin([{name:'fixture',type:'registry:ui'},{name:'inheritor',type:'registry:ui'}]),react()],test:{environment:'jsdom',globals:true,setupFiles:[${JSON.stringify(path.join(root, "tests/setup.ts"))}],reporters:['default',[${JSON.stringify(path.join(root, "tests/motion-contract-reporter.mjs"))},{root:${JSON.stringify(fixture)}}]],maxWorkers:1,include:['tests/components/*.test.tsx']}};`,
  );
  const execute = async (name: string, expected: number, files = ["tests/components/fixture.test.tsx"]) => {
    const run = spawnSync(
      process.execPath,
      [path.join(root, "node_modules/vitest/vitest.mjs"), "run", ...files, "--config", config],
      { cwd: root, encoding: "utf8", timeout: 120000 },
    );
    const output = run.stdout + run.stderr;
    await put(`${name}.log`, output);
    expect(run.status, `${name}\n${output}`).toBe(expected);
    return output;
  };
  const originalContract = await readFile("tests/fixtures/motion-adoption/contract.md.txt", "utf8");
  if (phase === "controls") {
    for (const [name, body] of Object.entries(cases)) {
      await put("tests/components/fixture.test.tsx", imports.replaceAll("'../registry/", "'../../registry/") + body);
      const output = await execute(name, name === "complete" ? 0 : 1);
      if (["dead", "skipped", "missing_mode", "missing_boundary"].includes(name)) expect(output).toContain("v2 ");
    }
    const paletteSource = await readFile("tests/fixtures/motion-v2/source.tsx.txt", "utf8");
    await put(
      item.files[0]?.path ?? "",
      paletteSource.replace(
        /style=\{\{[\s\S]*?\}\}/,
        'className={changed?"palette-b":"palette-a"} style={paint.style}',
      ),
    );
    const paletteEnvironment = `import {beforeEach} from 'vitest';let palette;beforeEach(()=>{palette=document.createElement('style');palette.textContent='.palette-a{color:#111;background-color:#fff}.palette-b{color:#222;background-color:#eee}';document.head.append(palette)});afterEach(()=>palette.remove());`;
    await put(
      "tests/components/fixture.test.tsx",
      imports.replaceAll("'../registry/", "'../../registry/") + paletteEnvironment + complete,
    );
    await execute("palette_class_action", 0);
    const pressSource =
      'import {bindMotionParameters,feedbackPress} from "../lib/motion";import {ControlSpan} from "../lib/control-animation";import {useCadenceMotion} from "../lib/provider";export function Fixture({changed=false}){const cm=useCadenceMotion();const p=cm.parameters(bindMotionParameters(feedbackPress,"feedback.press/scale"));if(p.kind!=="press")return null;return <ControlSpan role="button" aria-pressed={changed} data-slot="fixture" data-motion={cm.mode} transition={p.transition} target={{scale:cm.reduced?1:changed?p.scale:1}}>State</ControlSpan>};export function Unrelated(){return null}';
    const pressContract = originalContract
      .replaceAll("default: `fixture.paint.colour`", "not-applicable: `@paint`")
      .replaceAll("fixture.paint.colour", "fixture.paint.press")
      .replaceAll("state.color/surface-foreground", "feedback.press/scale")
      .replaceAll("→ `state.color` →", "→ `feedback.press` →")
      .replaceAll("Palette revision / paint", "Pressed state revision / paint")
      .replaceAll("Scoped background and foreground feedback.", "Token scale feedback on the native control.")
      .replaceAll("Short colour feedback without travel.", "Native state without scale.");
    Object.assign(item.meta, {
      motion: [{ recipe: "feedback.press", form: "one-shot" }],
      motionCoverage: {
        schema: 1,
        effects: { "feedback.press/one-shot": [{ relationship: "default", owner: "fixture", reason }] },
      },
    });
    await put("registry.json", JSON.stringify({ items }));
    await put(item.files[0]?.path ?? "", pressSource);
    await put("docs/motion/components/fixture.md", pressContract);
    const pressTests = complete.replaceAll("fixture.paint.colour", "fixture.paint.press");
    await put(
      "tests/components/fixture.test.tsx",
      imports.replaceAll("'../registry/", "'../../registry/") + pressTests,
    );
    await execute("parameter_control", 0);
    await put(
      "tests/components/fixture.test.tsx",
      `import {vi} from 'vitest';vi.mock('../../registry/cadence/lib/control-animation',async()=>{await vi.importActual('../../registry/cadence/lib/control-animation');return await vi.importActual(${JSON.stringify(path.join(root, "registry/cadence/lib/control-animation").replaceAll("\\", "/"))})});` +
        imports.replaceAll("'../registry/", "'../../registry/") +
        pressTests,
    );
    const foreignModule = await execute("parameter_wrong_actual_module", 1);
    expect(foreignModule).toContain("actual controller: actual module must belong to the same installed action graph");
    await put(
      "tests/components/fixture.test.tsx",
      `import {act} from '@testing-library/react';` +
        imports.replaceAll("'../registry/", "'../../registry/") +
        `it('a prior live flight cannot certify a no-op update',async()=>{const draw=changed=><CadenceProvider mode="full" timeScale={30}><Fixture changed={changed}/></CadenceProvider>;const view=render(draw(false));view.rerender(draw(true));await expectV2MotionAction('fixture','fixture.paint.press','full',()=>act(async()=>{view.rerender(draw(true));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))}),{root,container:view.container});});`,
    );
    const priorFlight = await execute("parameter_prior_flight_noop", 1);
    expect(priorFlight).toContain("full controls must execute this update");
    await put(
      "tests/components/fixture.test.tsx",
      imports.replaceAll("'../registry/", "'../../registry/") + pressTests,
    );
    const nativeRender =
      'import {Button as Primitive} from "@base-ui/react/button";' +
      pressSource
        .replace("return <ControlSpan role=", "return <Primitive nativeButton={false} render={<ControlSpan role=")
        .replace("State</ControlSpan>};export", "State</ControlSpan>}/>};export");
    Object.assign(item, { dependencies: ["@base-ui/react"] });
    await put("registry.json", JSON.stringify({ items }));
    await put(item.files[0]?.path ?? "", nativeRender);
    await execute("parameter_native_render", 0);
    Object.assign(item, { dependencies: [] });
    await put("registry.json", JSON.stringify({ items }));
    await put(
      item.files[0]?.path ?? "",
      pressSource
        .replace(
          "<ControlSpan role=",
          '<><ControlSpan data-slot="unclaimed" data-motion={cm.mode} target={{scale:cm.reduced?1:changed?p.scale:1}} transition={p.transition}/><ControlSpan role=',
        )
        .replace("</ControlSpan>};export", "</ControlSpan></>};export"),
    );
    await put(
      "docs/motion/components/fixture.md",
      pressContract.replace('"parts":', '"regions":{"paint":["fixture"]},"parts":'),
    );
    const unclaimed = await execute("unclaimed_control_region", 1);
    expect(unclaimed).toContain("live parameter writer has no exact physical target action");
    await put("docs/motion/components/fixture.md", pressContract);
    await put(
      item.files[0]?.path ?? "",
      pressSource.replace("target={{scale:cm.reduced?1:changed?p.scale:1}}", "target={{opacity:changed?0:1}}"),
    );
    const wrongProperty = await execute("parameter_wrong_property", 1);
    expect(wrongProperty).toContain('"transform"');
    const indicator = pressSource
      .replaceAll("feedbackPress", "stateIndicator")
      .replaceAll("feedback.press/scale", "state.morph/indicator")
      .replaceAll('p.kind!=="press"', 'p.kind!=="indicator"')
      .replaceAll("transition={p.transition}", "transition={p.spatial}")
      .replaceAll("scale:cm.reduced?1:changed?p.scale:1", "rotate:cm.reduced?0:changed?p.rotation:0");
    Object.assign(item.meta, {
      motion: [{ recipe: "state.morph", form: "one-shot" }],
      motionCoverage: {
        schema: 1,
        effects: { "state.morph/one-shot": [{ relationship: "default", owner: "fixture", reason }] },
      },
    });
    await put("registry.json", JSON.stringify({ items }));
    await put(item.files[0]?.path ?? "", indicator);
    await put(
      "docs/motion/components/fixture.md",
      pressContract
        .replaceAll("feedback.press/scale", "state.morph/indicator")
        .replaceAll("`feedback.press`", "`state.indicator`"),
    );
    await execute("parameter_optional_indicator_property", 0);
    await put(item.files[0]?.path ?? "", indicator.replace("rotate:cm.reduced", "rotateFake:cm.reduced"));
    const invented = await execute("parameter_invented_property", 1);
    expect(invented).toContain("exact allowed properties");
    const moving = pressSource
      .replaceAll("feedbackPress", "layoutCompact")
      .replaceAll("feedback.press/scale", "layout.move/position")
      .replaceAll('p.kind!=="press"', 'p.kind!=="layout"')
      .replace("scale:cm.reduced?1:changed?p.scale:1", "x:cm.reduced?0:changed?cm.distance.sm:0");
    Object.assign(item.meta, {
      motion: [{ recipe: "layout.move", form: "one-shot" }],
      motionCoverage: {
        schema: 1,
        effects: { "layout.move/one-shot": [{ relationship: "default", owner: "fixture", reason }] },
      },
    });
    await put("registry.json", JSON.stringify({ items }));
    await put(item.files[0]?.path ?? "", moving);
    await put(
      "docs/motion/components/fixture.md",
      pressContract
        .replaceAll("feedback.press/scale", "layout.move/position")
        .replaceAll("`feedback.press`", "`layout.reflow`"),
    );
    const wrongPreset = await execute("parameter_wrong_preset", 1);
    expect(wrongPreset).toContain("layout.compact");
    Object.assign(item.meta, {
      motion: [{ recipe: "state.color", form: "css-transition" }],
      motionCoverage: {
        schema: 1,
        effects: { "state.color/css-transition": [{ relationship: "default", owner: "fixture", reason }] },
      },
    });
    await put("registry.json", JSON.stringify({ items }));
    await put(item.files[0]?.path ?? "", await readFile("tests/fixtures/motion-v2/source.tsx.txt", "utf8"));
    await put("docs/motion/components/fixture.md", originalContract);
    return;
  }
  const inheritor = {
    ...structuredClone(item),
    name: "inheritor",
    registryDependencies: ["@cadence/fixture"],
    files: [{ path: "registry/cadence/inheritor/index.tsx", target: "@components/cadence/inheritor/index.tsx" }],
  };
  inheritor.meta.motionCoverage.effects["state.color/css-transition"] = [
    { relationship: "inherited", owner: "fixture", reason },
  ];
  await put("registry.json", JSON.stringify({ items: [...items, inheritor] }));
  await put("docs/motion/README.md", "[Fixture](components/fixture.md)\n[Inherited](components/inheritor.md)");
  await put(
    "docs/motion/components/inheritor.md",
    originalContract
      .replace('"parts":', '"regions":{"paint":["fixture"]},"parts":')
      .replaceAll("fixture.paint", "inheritor.paint")
      .replaceAll("default: `inheritor.paint.colour`", "inherited: `inheritor.paint.colour`"),
  );
  await put(
    inheritor.files[0]?.path ?? "",
    'import {Fixture} from "../fixture";export function Inherited({show=true,...props}){return show?<Fixture {...props}/>:<span data-slot="inheritor"/>}',
  );
  const inheritedImports =
    imports.replaceAll("'../registry/", "'../../registry/") +
    `import {Inherited} from '../../registry/cadence/inheritor';`;
  const inherited = complete
    .replaceAll("<Fixture changed={changed}/>", "<Inherited changed={changed}/>")
    .replaceAll("'fixture'", "'inheritor'")
    .replaceAll("fixture.paint.colour", "inheritor.paint.colour");
  await put("tests/components/fixture.test.tsx", imports.replaceAll("'../registry/", "'../../registry/") + complete);
  await put("tests/components/inheritor.test.tsx", inheritedImports + inherited);
  await execute("inherited", 0, ["tests/components/fixture.test.tsx", "tests/components/inheritor.test.tsx"]);
  await put(
    "tests/components/inheritor.test.tsx",
    inheritedImports +
      inherited.replaceAll(
        "<Inherited changed={changed}/>",
        "<><Inherited show={false}/><Fixture changed={changed}/></>",
      ),
  );
  const borrowed = await execute("inherited_borrow", 1, ["tests/components/inheritor.test.tsx"]);
  expect(borrowed).toContain("actual inherited instance path");

  // A native-only contract executes no motion helper or provider. Its real
  // original component and host are observed automatically by the test compiler.
  const nativeContract = originalContract
    .replaceAll("default: `fixture.paint.colour`", "not-applicable: `@paint`")
    .replace("inherited: `@paint`", "inherited: `fixture.paint.edit`")
    .replaceAll(
      "`fixture.paint.colour` → `state.color` → `state.color/surface-foreground`",
      "`fixture.paint.edit` → `engine.native` → `native/input`",
    );
  for (const candidate of [item, inheritor]) {
    candidate.meta.motion = [];
    Object.assign(candidate.meta.motionCoverage, { effects: {} });
    candidate.meta.motionProfile.scope = "static";
  }
  await put(
    "registry.json",
    JSON.stringify({
      items: [...items.filter((candidate: { name: string }) => candidate.name !== "fixture"), item, inheritor],
    }),
  );
  await put("docs/motion/components/fixture.md", nativeContract);
  await put(
    "docs/motion/components/inheritor.md",
    (await readFile(path.join(fixture, "docs/motion/components/inheritor.md"), "utf8")).replace(
      '"migration": "v2"',
      '"migration": "legacy"',
    ),
  );
  await put(
    item.files[0]?.path ?? "",
    'export function Fixture({onChange}){return <input data-slot="fixture" aria-label="Native" defaultValue="keep" onChange={onChange}/>};export function Unrelated(){return null}',
  );
  await put(
    "tests/components/fixture.test.tsx",
    `import {render,fireEvent,cleanup} from '@testing-library/react';import {it,expect,afterEach,vi} from 'vitest';import {Fixture} from '../../registry/cadence/fixture';afterEach(()=>cleanup());it('native editing without a motion helper/provider',()=>{const changed=vi.fn();const view=render(<Fixture onChange={changed}/>);const input=view.getByRole('textbox');input.focus();fireEvent.change(input,{target:{value:'edited'}});expect(input).toHaveValue('edited');expect(input).toHaveFocus();expect(changed).toHaveBeenCalledTimes(1);});`,
  );
  await execute("native_only", 0);
  const nativeTest = path.join(fixture, "tests/components/fixture.test.tsx"),
    retainedTest = path.join(fixture, "tests/components/native-only.review.txt");
  await rename(nativeTest, retainedTest);
  const missingNativeTest = await checkMotionTargets(
    fixture,
    JSON.parse(await readFile(path.join(fixture, "registry.json"), "utf8")),
  );
  expect(missingNativeTest.problems).toContain(
    "fixture: v2 requires its named actual component test, including native-only items",
  );
  await put("missing-native-test.json", JSON.stringify(missingNativeTest.problems));
  await rename(retainedTest, nativeTest);
  await put(
    "tests/components/fixture.test.tsx",
    `import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';it('fake native source claims',context=>{const file=${JSON.stringify(path.join(fixture, "registry/cadence/fixture/index.tsx").replaceAll("\\", "/"))};context.task.meta.cadenceNativeExecutions=[{item:'fixture',exports:['Fixture'],module:file,digest:createHash('sha256').update(readFileSync(file)).digest('hex'),slots:['fixture'],live:true}];expect(true).toBe(true)});`,
  );
  const forgedNative = await execute("native_forged", 1);
  expect(forgedNative).toContain("verify Native fixture.paint.edit");

  const groupInstall = installationPlan(registry.items, "reveal-group");
  for (const entry of groupInstall.files) await put(entry.path, await readFile(entry.path, "utf8"));
  const combined = [
    ...new Map([...items, item, inheritor, ...groupInstall.items].map((entry) => [entry.name, entry])).values(),
  ];
  await put("registry.json", JSON.stringify({ items: combined }));
  await put("docs/motion/components/fixture.md", nativeContract.replace('"migration": "v2"', '"migration": "legacy"'));
  for (const id of ["reveal", "reveal-group"])
    await put(
      `docs/motion/components/${id}.md`,
      (await readFile(`docs/motion/components/${id}.md`, "utf8")).replace('"migration": "legacy"', '"migration": "v2"'),
    );
  await put(
    "docs/motion/README.md",
    ["fixture", "inheritor", "reveal", "reveal-group"].map((id) => `[${id}](components/${id}.md)`).join("\n"),
  );
  const composition = `import {render,cleanup,act} from '@testing-library/react';import {it,expect,afterEach,vi} from 'vitest';
import {CadenceProvider} from '../../registry/cadence/lib/provider';import {Reveal} from '../../registry/cadence/reveal';import {RevealGroup} from '../../registry/cadence/reveal-group';
import {expectV2MotionAction,expectV2NativeBoundaries} from ${JSON.stringify(path.join(root, "tests/motion-v2-contract"))};
const root=${JSON.stringify(fixture)};afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
it.each(['full','reduced','none'])('real registered composition %s',async mode=>{
let y=1200;const box=()=>({x:0,y,left:0,top:y,right:100,bottom:y+20,width:100,height:20,toJSON(){return {}}});
vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(box);
Object.defineProperty(document.documentElement,'clientHeight',{configurable:true,value:800});Object.defineProperty(document.documentElement,'clientWidth',{configurable:true,value:1200});
const style=document.createElement('style');style.textContent='[data-slot="reveal"]{opacity:1;transform:none;visibility:visible;animation-name:none;transition-duration:0s}';document.head.append(style);
const animations=new WeakMap();Object.defineProperty(HTMLElement.prototype,'getAnimations',{configurable:true,value:function(){return (animations.get(this)||[]).filter(animation=>animation.playState==='running')}});
Object.defineProperty(HTMLElement.prototype,'animate',{configurable:true,value:function(frames,options){const handle={playState:'running',finished:new Promise(()=>{}),effect:{target:this,getKeyframes:()=>frames,getTiming:()=>options},cancel(){this.playState='idle'}};animations.set(this,[...(animations.get(this)||[]),handle]);return handle}});
const observers=[];class Observer{constructor(callback){this.callback=callback;this.nodes=new Set();observers.push(this)}observe(node){this.nodes.add(node)}unobserve(node){this.nodes.delete(node)}disconnect(){this.nodes.clear()}takeRecords(){return []}}
vi.stubGlobal('IntersectionObserver',Observer);
const draw=()=> <CadenceProvider mode={mode}><RevealGroup><Reveal>Registered</Reveal></RevealGroup></CadenceProvider>;
const view=render(draw());
await expectV2MotionAction('reveal-group','reveal-group.target.enter',mode,()=>act(()=>{y=0;for(const observer of observers)observer.callback([...observer.nodes].map(target=>({target,isIntersecting:true,intersectionRatio:1,boundingClientRect:box(),intersectionRect:box(),rootBounds:box(),time:0})));view.rerender(draw())}),{root,container:view.container});
await expectV2NativeBoundaries('reveal-group',{root,container:view.container});style.remove();
});`;
  await put("tests/components/reveal-group.test.tsx", composition);
  await put(
    "tests/components/reveal.test.tsx",
    composition
      .replace("<RevealGroup><Reveal>Registered</Reveal></RevealGroup>", "<Reveal>Registered</Reveal>")
      .replaceAll("'reveal-group'", "'reveal'")
      .replaceAll("reveal-group.target.enter", "reveal.target.enter"),
  );
  await execute("composition", 0, ["tests/components/reveal.test.tsx", "tests/components/reveal-group.test.tsx"]);
  await put(
    "tests/components/reveal-group.test.tsx",
    composition.replace(
      "<RevealGroup><Reveal>Registered</Reveal></RevealGroup>",
      "<><RevealGroup><span>Unregistered</span></RevealGroup><Reveal>Registered</Reveal></>",
    ),
  );
  const fakeComposition = await execute("unrelated_composition", 1, ["tests/components/reveal-group.test.tsx"]);
  expect(fakeComposition).toContain("registered-scope");
}

it("conditionally enforces real source-bound policies and control actions", () => exerciseGate("controls"), 180000);
it(
  "conditionally enforces real inherited, native and registered composition ownership",
  () => exerciseGate("ownership"),
  180000,
);
