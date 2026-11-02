import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { act, render } from "@testing-library/react";
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
    const button = [...motionSamples.values()].find((p) => p["data-slot"] === "button");
    if (!button) throw new Error("real Button Motion host missing");
    expect(typeof button?.onTapStart).toBe("function");
    act(() => (button.onTapStart as () => void)());
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
    const fixture = await mkdtemp(path.join(root, ".cache", "motion-contract-gate-"));
    try {
      await mkdir(path.join(fixture, "tests/components"), { recursive: true });
      const imports = `import {render} from '@testing-library/react';
import {it, describe, expect} from 'vitest';
import {Button} from '@/registry/cadence/button';
import {Spinner} from '@/registry/cadence/spinner';
import {CadenceProvider} from '@/registry/cadence/lib/provider';
import {expectMotionContract} from '@/tests/motion-contract';\n`;
      const cases = {
        button: `it('unused import',()=>{expect(true).toBe(true)});`,
        toggle: `it('dead call',()=>{if(false) expectMotionContract('full'); expect(true).toBe(true)});`,
        checkbox: `describe.skip('skipped contract',()=>{it.each(['full','reduced','none'])('mode %s',(mode)=>{render(<CadenceProvider mode={mode}><Button>Test</Button></CadenceProvider>);expectMotionContract(mode)})});`,
        switch: `it.each(['full','reduced'])('missing none %s',(mode)=>{render(<CadenceProvider mode={mode}><Button>Test</Button></CadenceProvider>);expectMotionContract(mode)});`,
        spinner: `it.each(['full','reduced','none'])('positive %s',(mode)=>{render(<CadenceProvider mode={mode}><Spinner/></CadenceProvider>);expectMotionContract(mode)});`,
        badge: `it('T0 needs no helper',()=>{expect(true).toBe(true)});`,
      };
      for (const [id, source] of Object.entries(cases))
        await writeFile(path.join(fixture, `tests/components/${id}.test.tsx`), imports + source);
      const config = path.join(fixture, "vitest.config.mjs");
      await writeFile(
        config,
        `import react from '@vitejs/plugin-react'; export default {root:${JSON.stringify(fixture)},plugins:[react()],resolve:{alias:{'@':${JSON.stringify(root)}}},test:{environment:'jsdom',globals:true,setupFiles:[${JSON.stringify(path.join(root, "tests/setup.ts"))}],reporters:['default',${JSON.stringify(path.join(root, "tests/motion-contract-reporter.mjs"))}],maxWorkers:1,minWorkers:1,include:['tests/**/*.test.tsx']}}`,
      );
      const result = spawnSync(
        process.execPath,
        [path.join(root, "node_modules/vitest/vitest.mjs"), "run", "--config", config],
        { cwd: root, encoding: "utf8", timeout: 30000 },
      );
      const output = result.stdout + result.stderr;
      expect(result.status, output).toBe(1);
      for (const id of ["button", "toggle", "checkbox", "switch"])
        expect(output).toContain(`${id}: execute expectMotionContract`);
      expect(output).not.toContain("spinner: execute expectMotionContract");
      expect(output).not.toContain("badge: execute expectMotionContract");
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  }, 40000);
});
