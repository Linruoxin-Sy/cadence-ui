import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fireEvent, render } from "@testing-library/react";
import { motion } from "motion/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button";
import { scale } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { controlSamples, motionSamples } from "../motion-observer";

function part(mode: string, classes = "transition-opacity duration-0") {
  const root = document.createElement("section");
  root.innerHTML = `<div data-slot="fixture" data-motion="${mode}" class="${classes}"></div>`;
  return root;
}

describe("expectMotionContract", () => {
  it.each(["full", "reduced", "none"] as const)("observes real Button props in %s", (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Button>Press</Button>
      </CadenceProvider>,
    );
    expect(motionSamples.size).toBeGreaterThan(0);
    const button = [...motionSamples.values()].find((p) => p["data-slot"] === "button-feedback");
    if (!button) throw new Error("real Button Motion host missing");
    const node = document.querySelector("button");
    if (!node) throw new Error("button missing");
    fireEvent.keyDown(node, { key: "Enter" });
    const controls = button?.animate as object;
    expect(controlSamples.get(controls)?.target).toEqual({ scale: mode === "full" ? scale.press : 1 });
    expectMotionContract(mode);
  });
  it("rejects a broken real Motion branch rather than counting its mode attribute", () => {
    render(
      <motion.div data-slot="broken" data-motion="none" animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />,
    );
    expect(() => expectMotionContract("none")).toThrow(/zero clock/);
  });
  it("does not revive a disabled press when the same button is enabled again", () => {
    const draw = (disabled: boolean) => (
      <CadenceProvider mode="full">
        <Button disabled={disabled}>Press</Button>
      </CadenceProvider>
    );
    const { container, rerender } = render(draw(false));
    const node = container.querySelector("button");
    const button = [...motionSamples.values()].find((p) => p["data-slot"] === "button-feedback");
    if (!button) throw new Error("real Button Motion host missing");
    const controls = button.animate as object;
    if (!node) throw new Error("button missing");
    fireEvent.keyDown(node, { key: "Enter" });
    expect(controlSamples.get(controls)?.target).toEqual({ scale: scale.press });
    rerender(draw(true));
    expect(controlSamples.get(controls)?.target).toEqual({ scale: 1 });
    rerender(draw(false));
    expect(controlSamples.get(controls)?.target).toEqual({ scale: 1 });
    expect(container.querySelector("button")).toBe(node);
    const off = (disabled: boolean) => (
      <CadenceProvider mode="none">
        <Button disabled={disabled}>Press</Button>
      </CadenceProvider>
    );
    rerender(off(false));
    const inactive = [...motionSamples.values()].find((p) => p["data-slot"] === "button-feedback");
    if (!inactive) throw new Error("real Button Motion host missing");
    if (!node) throw new Error("button missing");
    fireEvent.keyDown(node, { key: "Enter" });
    rerender(off(true));
    rerender(off(false));
    rerender(draw(false));
    expect(controlSamples.get(controls)?.target).toEqual({ scale: 1 });
  });
  it("allows an instant decorative orientation but rejects its animated downgrade", () => {
    const { rerender } = render(
      <motion.span
        data-slot="glyph"
        data-motion="reduced"
        aria-hidden="true"
        animate={{ rotate: 180 }}
        transition={{ duration: 0 }}
      />,
    );
    expectMotionContract("reduced");
    rerender(
      <motion.span
        data-slot="glyph"
        data-motion="reduced"
        aria-hidden="true"
        animate={{ rotate: 180 }}
        transition={{ duration: 0.16 }}
      />,
    );
    expect(() => expectMotionContract("reduced")).toThrow(/target geometry/);
  });
  it("rejects a wrong mode", () => {
    expect(() => expectMotionContract("none", { root: part("reduced") })).toThrow();
  });
  it.each(["reduced", "none"] as const)("rejects retained geometry in %s", (mode) => {
    motionSamples.set({}, { "data-motion": mode, animate: { scale: 0.8 }, transition: { duration: 0 } });
    expect(() => expectMotionContract(mode, { root: part(mode) })).toThrow(/target geometry/);
  });
  it("rejects an initial transform, gesture and layout projection", () => {
    for (const props of [{ initial: { x: 8 } }, { whileTap: { scale: 0.97 } }, { layoutId: "pill" }]) {
      motionSamples.clear();
      motionSamples.set({}, { "data-motion": "reduced", ...props });
      expect(() => expectMotionContract("reduced", { root: part("reduced") })).toThrow();
    }
  });
  it("rejects a none tween, spring, delay and control start", () => {
    for (const transition of [
      { duration: 0.1 },
      { type: "spring" },
      { duration: 0, delay: 0.1 },
      { duration: 0, opacity: { duration: 0.2 } },
    ]) {
      motionSamples.clear();
      motionSamples.set({}, { "data-motion": "none", animate: { opacity: 1 }, transition });
      expect(() => expectMotionContract("none", { root: part("none") })).toThrow();
    }
    const controls = {};
    controlSamples.set(controls, { target: { opacity: 1 }, transition: { duration: 0.1 } });
    motionSamples.clear();
    motionSamples.set({}, { "data-motion": "none", animate: controls });
    expect(() => expectMotionContract("none", { root: part("none") })).toThrow();
  });
  it("rejects CSS travel, layout duration and continuous motion in downgraded modes", () => {
    for (const classes of [
      "data-[starting-style]:scale-(--motion-scale-in)",
      "transition-[height]",
      "animate-bounce",
    ]) {
      expect(() => expectMotionContract("reduced", { root: part("reduced", classes) })).toThrow();
    }
    expect(() =>
      expectMotionContract("none", { root: part("none", "transition-opacity duration-(--motion-duration-fast)") }),
    ).toThrow(/CSS clock/);
    expect(() => expectMotionContract("none", { root: part("none", "animate-pulse") })).toThrow();
  });
  it("permits static placement and instant positional geometry but rejects a positional tween", () => {
    const props = {
      "data-slot": "progress-indicator",
      "data-motion": "reduced",
      animate: { scaleX: 0.4 },
      transition: { duration: 0 },
    };
    motionSamples.set({}, props);
    expectMotionContract("reduced", { root: part("reduced", "-translate-x-1/2 transition-opacity") });
    props.transition.duration = 0.16;
    expect(() => expectMotionContract("reduced", { root: part("reduced") })).toThrow();
  });
  it("requires a real behavior assertion for an unobservable writer", () => {
    expect(() => expectMotionContract("none", { root: part("none", ""), behavior: () => {} })).toThrow(
      /execute assertions/,
    );
  });
  it("fails the actual Vitest entry for unused, dead, skipped and incomplete adoption", async () => {
    const root = process.cwd();
    const fixture = await mkdtemp(
      path.join(process.env.CADENCE_GATE_EVIDENCE ?? path.join(root, ".cache"), "motion-contract-gate-"),
    );
    try {
      await mkdir(path.join(fixture, "tests/components"), { recursive: true });
      const imports = `import {render,cleanup} from '@testing-library/react';
import {it, describe, expect, afterEach} from 'vitest';afterEach(()=>cleanup());
import {CadenceProvider} from '@/registry/cadence/lib/provider';
import {expectMotionContract} from '@/tests/motion-contract';\n`;
      const colorImports = `import {useRef} from 'react';import {useStateColor} from '@/registry/cadence/lib/css-motion';import {useCadenceMotion} from '@/registry/cadence/lib/provider';function Color(){const ref=useRef(null);const cm=useCadenceMotion(ref);const color=useStateColor(ref,cm,['color']);return <span {...color} data-slot="local-color">State</span>}`;
      const loopImports = `import {useContinuousMotion} from '@/registry/cadence/lib/css-motion';import {useCadenceMotion} from '@/registry/cadence/lib/provider';function Loop(){const cm=useCadenceMotion();const loop=useContinuousMotion(undefined,cm,'pulse');return <div {...loop} data-slot="local-loop">Loading</div>}`;
      const cases = {
        button: `it('unused import',()=>{expect(true).toBe(true)});`,
        toggle: `it('dead call',()=>{if(false) expectMotionContract('full'); expect(true).toBe(true)});`,
        checkbox: `describe.skip('skipped contract',()=>{it.each(['full','reduced','none'])('mode %s',(mode)=>{render(<CadenceProvider mode={mode}><Button>Test</Button></CadenceProvider>);expectMotionContract(mode)})});`,
        switch: `it.each(['full','reduced'])('missing none %s',(mode)=>{render(<CadenceProvider mode={mode}><Button>Test</Button></CadenceProvider>);expectMotionContract(mode)});`,
        spinner: `it.each(['full','reduced','none'])('positive %s',(mode)=>{render(<CadenceProvider mode={mode}><Spinner/></CadenceProvider>);expectMotionContract(mode)});`,
        badge: `it('T0 needs no helper',()=>{expect(true).toBe(true)});`,
        label: `it('static v2 cannot bypass the migration gate',()=>{expect(true).toBe(true)});`,
        "aspect-ratio": `it.each(['full','reduced','none'])('another recipe cannot certify new colour %s',mode=>{render(<CadenceProvider mode={mode}><Button>Existing motion</Button></CadenceProvider>);expectMotionContract(mode)});`,
        input:
          colorImports +
          `it.each(['full','reduced','none'])('executed colour needs explicit policy evidence %s',mode=>{render(<CadenceProvider mode={mode}><Button>Existing motion</Button><Color/></CadenceProvider>);expectMotionContract(mode)});`,
        skeleton:
          loopImports +
          `it.each(['full','reduced','none'])('undeclared loop cannot bypass policy %s',mode=>{render(<CadenceProvider mode={mode}><Button>Existing motion</Button><Loop/></CadenceProvider>);expectMotionContract(mode)});`,
        "animated-text": `it.each(['full','reduced','none'])('wrapper cannot certify text %s',mode=>{render(<span data-slot="animated-text" data-motion={mode}>Same text</span>);expectMotionContract(mode,{behavior:()=>expect(document.body.textContent).toContain('Same text')})});`,
        "animated-number": `import {AnimatedText} from '@/registry/cadence/animated-text';it.each(['full','reduced','none'])('text cannot certify reels %s',mode=>{render(<CadenceProvider mode={mode}><span data-slot="animated-number" data-motion={mode}/><AnimatedText value="123"/></CadenceProvider>);expectMotionContract(mode,{behavior:()=>expect(document.body.textContent).toContain('123')})});`,
        reveal: `it.each(['full','reduced','none'])('attributes cannot certify viewport %s',mode=>{render(<div data-slot="reveal" data-motion={mode}>Visible</div>);expectMotionContract(mode,{behavior:()=>expect(document.body.textContent).toContain('Visible')})});`,
        "reveal-group": `import {Reveal} from '@/registry/cadence/reveal';it.each(['full','reduced','none'])('ungrouped reveal cannot certify a group %s',mode=>{render(<CadenceProvider mode={mode}><Reveal>Visible</Reveal></CadenceProvider>);expectMotionContract(mode,{behavior:()=>expect(document.body.textContent).toContain('Visible')})});`,
        slider: `it.each(['full','reduced','none'])('another component cannot certify a slider %s',mode=>{render(<CadenceProvider mode={mode}><Button>Existing motion</Button></CadenceProvider>);expectMotionContract(mode)});`,
        tabs: `import {Tabs,TabsList,TabsTrigger} from '@/registry/cadence/tabs';it.each(['full','reduced','none'])('selection cannot certify absent panel content %s',mode=>{render(<CadenceProvider mode={mode}><Tabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList></Tabs></CadenceProvider>);expectMotionContract(mode,{behavior:()=>expect(document.body.textContent).toContain('A')})});`,
        popover: `import {Popover,PopoverTrigger} from '@/registry/cadence/popover';it.each(['full','reduced','none'])('trigger and copied CSS cannot certify a popup %s',mode=>{render(<CadenceProvider mode={mode}><Popover><PopoverTrigger>Open</PopoverTrigger><span data-slot="popover-content" data-motion={mode} className="transition-opacity duration-0">Fake panel</span></Popover></CadenceProvider>);expectMotionContract(mode,{behavior:()=>expect(document.body.textContent).toContain('Fake panel')})});`,
      };
      for (const [id, source] of Object.entries(cases))
        await writeFile(
          path.join(fixture, `tests/components/${id}.test.tsx`),
          imports +
            (id === "button" || source.includes("<Button")
              ? "import {Button} from '@/registry/cadence/button';\n"
              : "") +
            (source.includes("<Spinner") ? "import {Spinner} from '@/registry/cadence/spinner';\n" : "") +
            source,
        );
      // Run the actual reporter against isolated markers, without mutating the repository.
      await mkdir(path.join(fixture, "docs/motion/components"), { recursive: true });
      await mkdir(path.join(fixture, "scripts"), { recursive: true });
      for (const file of [
        "registry.json",
        "scripts/motion-migration.mjs",
        "scripts/motion-targets.mjs",
        "scripts/motion-adoption.mjs",
        "scripts/motion-v2.mjs",
        "scripts/motion-evidence-authority.mjs",
        "scripts/installation.mjs",
        "scripts/motion-manifest.mjs",
        "scripts/motion-source.mjs",
        "scripts/motion-implementation.mjs",
        "scripts/motion-coverage.mjs",
        "scripts/catalog-intensity.mjs",
        "tests/motion-contract-reporter.mjs",
      ])
        await writeFile(path.join(fixture, file), await readFile(path.join(root, file), "utf8"));
      const stagedRegistry = JSON.parse(await readFile(path.join(fixture, "registry.json"), "utf8"));
      for (const item of stagedRegistry.items) {
        for (const file of item.files ?? []) {
          await mkdir(path.dirname(path.join(fixture, file.path)), { recursive: true });
          await writeFile(path.join(fixture, file.path), await readFile(path.join(root, file.path)));
        }
        if (["registry:ui", "registry:block"].includes(item.type))
          await writeFile(
            path.join(fixture, `docs/motion/components/${item.name}.md`),
            await readFile(path.join(root, `docs/motion/components/${item.name}.md`)),
          );
      }
      for (const file of ["docs/motion/presets.md", "docs/motion/README.md"])
        await writeFile(path.join(fixture, file), await readFile(path.join(root, file)));
      for (const id of ["aspect-ratio", "input"])
        stagedRegistry.items.find((item: { name: string }) => item.name === id).meta.motion = [
          { recipe: "state.color", form: "css-transition" },
        ];
      const loopItem = stagedRegistry.items.find((item: { name: string }) => item.name === "skeleton");
      const sliderItem = stagedRegistry.items.find((item: { name: string }) => item.name === "slider");
      Object.assign(sliderItem.meta.motionCoverage.effects["feedback.press/one-shot"][0], {
        relationship: "inherited",
        owner: "button",
      });
      sliderItem.registryDependencies.push("@cadence/button");
      delete sliderItem.meta.motionProfile;
      loopItem.meta.motion = [];
      loopItem.files = [{ path: "registry/cadence/skeleton/index.tsx" }];
      await mkdir(path.join(fixture, "registry/cadence/skeleton"), { recursive: true });
      await writeFile(
        path.join(fixture, "registry/cadence/skeleton/index.tsx"),
        'import {useContinuousMotion} from "../lib/css-motion";function Part(){const loop=useContinuousMotion(ref,cm,"pulse");return <div {...loop} data-slot="skeleton"/>}',
      );
      await writeFile(path.join(fixture, "registry.json"), JSON.stringify(stagedRegistry));
      for (const id of Object.keys(cases)) {
        let contract = await readFile(path.join(root, `docs/motion/components/${id}.md`), "utf8");
        if (["spinner", "label"].includes(id))
          contract = contract.replace('"migration": "legacy"', '"migration": "v2"');
        await writeFile(path.join(fixture, `docs/motion/components/${id}.md`), contract);
      }
      const config = path.join(fixture, "vitest.config.mjs");
      await writeFile(
        config,
        `import react from '@vitejs/plugin-react'; import {componentExecutionPlugin} from ${JSON.stringify(path.join(root, "tests/component-execution-plugin.mjs"))}; export default {root:${JSON.stringify(fixture)},plugins:[componentExecutionPlugin(),react()],resolve:{alias:{'@':${JSON.stringify(root)}}},test:{environment:'jsdom',globals:true,setupFiles:[${JSON.stringify(path.join(root, "tests/setup.ts"))}],reporters:['default',${JSON.stringify(path.join(fixture, "tests/motion-contract-reporter.mjs"))}],maxWorkers:2,minWorkers:1,include:['tests/**/*.test.tsx']}}`,
      );
      const result = spawnSync(
        process.execPath,
        [path.join(root, "node_modules/vitest/vitest.mjs"), "run", "--config", config],
        { cwd: root, encoding: "utf8", timeout: 30000 },
      );
      const output = result.stdout + result.stderr;
      if (process.env.CADENCE_GATE_EVIDENCE) await writeFile(path.join(fixture, "executed-reporter.log"), output);
      expect(result.status, output).toBe(1);
      for (const id of ["toggle", "checkbox", "switch"])
        expect(output).toContain(`${id}: execute expectMotionContract`);
      for (const action of [
        "button.root.enter",
        "button.root.exit",
        "button.feedback.press",
        "button.root.colour",
        "button.label.replace",
        "button.label.roll",
        "button.root.resize",
      ])
        for (const mode of ["full", "reduced", "none"])
          expect(output).toMatch(new RegExp(`button: v2 execute ${action} on [^\\n]+ in ${mode}`));
      expect(output).not.toContain("spinner: execute expectMotionContract");
      expect(output).not.toContain("badge: execute expectMotionContract");
      for (const id of ["spinner", "label"])
        expect(output).toContain(`${id}: v2 ${id}.root.enter: no source-bound action plan`);
      for (const id of ["aspect-ratio", "input"])
        expect(output).toContain(`${id}: execute color policy in full, reduced, none`);
      expect(output).toContain("aspect-ratio: state.color/css-transition: missing installed ownership");
      expect(output).toContain(
        "slider: feedback.press/one-shot: owner button is not the reached installed integration",
      );
      expect(output).toContain("slider: explicit authored motionProfile required");
      expect(output).toContain("skeleton: execute loop policy in full, reduced, none");
      for (const [id, form] of [
        ["animated-text", "text.change/changed-runs"],
        ["animated-number", "number.roll/reels"],
        ["reveal", "reveal/viewport"],
      ])
        expect(output).toContain(`${id}: execute ${form} controller policy in full, reduced, none`);
      for (const id of ["slider", "reveal-group"])
        expect(output).toContain(`${id}: execute actual component parts in full, reduced, none`);
      expect(output).not.toContain("reveal-group: execute reveal/viewport controller policy");
      for (const [action, part, slot] of [
        ["tabs.indicator.select", "TabsList", "tabs-indicator"],
        ["tabs.panel.change", "TabsContent", "tabs-content"],
        ["tabs.panel.resize", "TabsContent", "tabs-content"],
        ["tabs.list.resize", "TabsList", "tabs-list"],
        ["tabs.items.reflow", "TabsTrigger", "tabs-trigger"],
        ["tabs.trigger.colour", "TabsTrigger", "tabs-trigger"],
        ["tabs.indicator.colour", "TabsList", "tabs-indicator"],
        ["tabs.list.colour", "TabsList", "tabs-list"],
        ["tabs.label.replace", "TabsTrigger", "tabs-text"],
        ["tabs.label.replace", "TabsContent", "tabs-text"],
        ["tabs.value.change", "TabsTrigger", "tabs-number"],
        ["tabs.value.change", "TabsContent", "tabs-number"],
      ])
        for (const mode of ["full", "reduced", "none"])
          expect(output).toContain(
            `tabs: v2 execute ${action} on tabs#${part}/${slot} with exact source/property/preset policy in ${mode}`,
          );
      expect(output).not.toContain("tabs: execute layout.shared/selection controller policy");
      expect(output).toContain("popover: execute popup.anchored/css-transition CSS owner in full, reduced, none");
      for (const id of ["animated-text", "animated-number", "reveal", "reveal-group", "slider"])
        expect(output).toContain(`${id}: mount the actual registry component in full, reduced, none`);
    } finally {
      if (!process.env.CADENCE_GATE_EVIDENCE) await rm(fixture, { recursive: true, force: true });
    }
  }, 40000);
});
