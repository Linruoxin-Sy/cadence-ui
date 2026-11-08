import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spring as motionSpring } from "motion/react";
import { describe, expect, it } from "vitest";
import * as parameters from "../../registry/cadence/lib/motion";
import {
  bindMotionParameters as bind,
  type CadenceMode,
  type MotionParameterPreset,
  resolveMotionParameters as resolve,
} from "../../registry/cadence/lib/motion";
import { parseTargetPresets } from "../../scripts/motion-targets.mjs";
import { loadMotionSource } from "../../scripts/motion-token-source.mjs";

const catalogue = (Object.values(parameters) as unknown[]).filter(
  (value): value is MotionParameterPreset =>
    typeof value === "object" && value !== null && "id" in value && "forms" in value,
);
const resolvePreset = (preset: MotionParameterPreset, mode: CadenceMode, options = {}) =>
  resolve(bind(preset, preset.forms[0] ?? ""), mode, options);

it("matches all reviewed exact forms without extending installed recipes", async () => {
  const { presets, problems } = parseTargetPresets(await readFile("docs/motion/presets.md", "utf8"));
  expect(problems).toEqual([]);
  expect(catalogue).toHaveLength(29);
  expect(new Map(catalogue.map(({ id, forms }) => [id, [...forms]]))).toEqual(presets);
  // @ts-expect-error A colour binding cannot claim a geometry form.
  expect(() => bind(parameters.stateColor, "geometry.resize/measured")).toThrow(/does not support/);
  // @ts-expect-error Untyped invalid bindings must also fail at runtime.
  expect(() => resolve({ preset: parameters.stateColor, form: "unknown" }, "full")).toThrow(/does not support/);
});

describe("mode targets and independent clocks", () => {
  it("keeps full held-press targets at zero clock while reduction removes decorative scale", () => {
    expect(resolvePreset(parameters.feedbackPress, "full", { timeScale: 0, delay: 9 })).toEqual({
      kind: "press",
      scale: 0.97,
      transition: { duration: 0, delay: 0 },
    });
    expect(resolvePreset(parameters.feedbackPress, "reduced", { delay: 9 })).toEqual({
      kind: "press",
      scale: 1,
      transition: { duration: 0, delay: 0 },
    });
    for (const preset of catalogue)
      for (const form of preset.forms) {
        const result = resolve(bind(preset, form), "none", { delay: 9, timeScale: 4 });
        for (const value of Object.values(result)) {
          if (value && typeof value === "object" && "duration" in value)
            expect(value).toEqual({ duration: 0, delay: 0 });
        }
      }
  });
  it("separates opacity, colour, spatial and text channels", () => {
    const popup = resolvePreset(parameters.presencePopup, "reduced", { timeScale: 4, delay: 0.1 });
    expect(popup).toMatchObject({
      kind: "visual",
      opacity: { duration: 0.528, delay: 0.4 },
      spatial: { duration: 0, delay: 0 },
      distance: 0,
      scale: 1,
    });
    expect(resolvePreset(parameters.stateColor, "reduced", { timeScale: 4 })).toMatchObject({
      transition: { duration: 0.384 },
    });
    expect(resolvePreset(parameters.textReplace, "reduced", { timeScale: 4, delay: 0.2 })).toMatchObject({
      enter: { duration: 0.384, delay: 0.8 },
      exit: { duration: 0.24, delay: 0 },
      stagger: "none",
    });
    for (const preset of [
      parameters.layoutReflow,
      parameters.geometryCompact,
      parameters.geometryPanel,
      parameters.numberRoll,
      parameters.scrollNavigate,
      parameters.dataProgress,
    ])
      expect(resolvePreset(preset, "reduced", { timeScale: 4, delay: 9 })).toMatchObject({
        transition: { duration: 0, delay: 0 },
      });
    expect(resolvePreset(parameters.stateIndicator, "reduced")).toMatchObject({
      spatial: { duration: 0, delay: 0 },
      rotation: 180,
    });
  });
  it("does not convert theme loops, native intent or lifetime into recipe clocks", () => {
    expect(resolvePreset(parameters.statusLoop, "full", { timeScale: 0 })).toEqual({
      kind: "continuous",
      clock: "theme",
      allowed: true,
    });
    expect(resolvePreset(parameters.statusLoop, "reduced", { timeScale: 4 })).toMatchObject({ allowed: false });
    expect(resolve(bind(parameters.engineNative, "native/base-ui-toast"), "none", { timeScale: 0 })).toEqual({
      kind: "native",
      clock: "owner",
      form: "native/base-ui-toast",
      mode: "none",
    });
    expect(resolve(bind(parameters.dataUpdate, "data.transition/embla"), "full", { timeScale: 4 })).toEqual({
      kind: "embla",
      clock: "attraction",
      units: 88,
    });
    expect(
      resolve(bind(parameters.dataUpdate, "data.transition/embla"), "full", { timeScale: 4, emblaDuration: 43 }),
    ).toMatchObject({ units: 43 });
    expect(
      resolve(bind(parameters.dataUpdate, "data.transition/embla"), "reduced", { emblaDuration: 43 }),
    ).toMatchObject({ units: 0 });
    expect(resolve(bind(parameters.dataUpdate, "data.transition/recharts"), "reduced")).toMatchObject({
      kind: "recharts",
      clock: "progress",
      seconds: 0,
    });
    expect(resolve(bind(parameters.contentMonth, "data.transition/month-grid"), "reduced")).toMatchObject({
      kind: "visual",
      opacity: { duration: 0.132 },
      spatial: { duration: 0, delay: 0 },
    });
  });
});

it("uses actual Motion physics with exactly one clock conversion and reviewed size refinements", () => {
  for (const preset of [
    parameters.geometryCompact,
    parameters.geometryPanel,
    parameters.layoutSidebar,
    parameters.layoutSelection,
    parameters.numberCompact,
  ]) {
    const unit = resolvePreset(preset, "full");
    const slow = resolvePreset(preset, "full", { timeScale: 4 });
    if (!("transition" in unit) || !("transition" in slow)) throw new Error("expected a physics transition");
    const a = motionSpring({ ...unit.transition, keyframes: [0, 100] } as Parameters<typeof motionSpring>[0]);
    const b = motionSpring({ ...slow.transition, keyframes: [0, 100] } as Parameters<typeof motionSpring>[0]);
    for (const time of [20, 50, 100, 150]) expect(b.next(time * 4).value).toBeCloseTo(a.next(time).value, 8);
    expect(resolvePreset(preset, "full", { timeScale: 0 })).toMatchObject({ transition: { duration: 0, delay: 0 } });
  }
  expect(resolvePreset(parameters.geometryCompact, "full")).not.toEqual(
    resolvePreset(parameters.geometryPanel, "full"),
  );
  expect(parameters.spring.morph.visualDuration).toBe(0.42);
  expect(parameters.transitionFor("layout.shared", "full")).toEqual({ ...parameters.physicalSpring(0.42), delay: 0 });
});

it("validates authored overrides and never treats native unit options as milliseconds", () => {
  expect(
    resolvePreset(parameters.stateColor, "reduced", { timeScale: 4, tokens: { duration: { fast: 0.5 } } }),
  ).toMatchObject({ transition: { duration: 1.2 } });
  for (const timeScale of [-1, Number.NaN, Number.POSITIVE_INFINITY])
    expect(() => resolvePreset(parameters.geometryPanel, "full", { timeScale })).toThrow(RangeError);
  expect(() =>
    resolvePreset(parameters.geometryPanel, "full", {
      tokens: { spring: { sizePanel: { visualDuration: 0.2, bounce: 1 } } },
    }),
  ).toThrow(RangeError);
  expect(() => resolvePreset(parameters.stateColor, "full", { tokens: { ease: { out: [-1, 1, 0.5, 1] } } })).toThrow(
    RangeError,
  );
  expect(() => resolvePreset(parameters.contentMonth, "full", { tokens: { distance: { sm: -1 } } })).toThrow(
    RangeError,
  );
  expect(() => resolvePreset(parameters.stateColor, "full", { delay: -1 })).toThrow(RangeError);
});

it("keeps all 20 installed recipe outputs equal to the frozen pre-preset runtime", async () => {
  const parent = path.resolve(process.env.CADENCE_MOTION_TOKEN_TEST_DIR ?? ".cache/tests/motion-tokens");
  await mkdir(parent, { recursive: true });
  const temp = await mkdtemp(path.join(parent, "legacy-"));
  await mkdir(path.join(temp, "registry/cadence/lib"), { recursive: true });
  const source = await readFile("tests/fixtures/motion/legacy-parameters.ts.txt", "utf8");
  await writeFile(path.join(temp, "registry/cadence/lib/motion.ts"), source);
  const legacy = await loadMotionSource(temp);
  const ids = source
    .match(/export type Recipe =([\s\S]*?);/)?.[1]
    ?.match(/"[a-z.]+"/g)
    ?.map((value) => JSON.parse(value));
  expect(ids).toHaveLength(20);
  for (const id of ids ?? [])
    for (const mode of ["full", "reduced", "none"] as const)
      for (const timeScale of [0, 1, 4])
        for (const options of [{ timeScale }, { timeScale, delay: 0.3 }, { timeScale, delay: 0.3, duration: 0.5 }])
          expect(parameters.transitionFor(id, mode, options), `${id}/${mode}/${JSON.stringify(options)}`).toEqual(
            legacy.transitionFor(id, mode, options),
          );
});

it("handles effective overrides and unrepresentable engine clocks without Infinity or default physics", () => {
  expect(
    resolve(bind(parameters.dataUpdate, "data.transition/embla"), "full", {
      timeScale: 4,
      effectiveDurations: { base: 0.7 },
    }),
  ).toMatchObject({ units: 70 });
  expect(
    resolve(bind(parameters.dataUpdate, "data.transition/embla"), "full", {
      timeScale: 4,
      effectiveDurations: { base: 0.7 },
      emblaDuration: 43,
    }),
  ).toMatchObject({ units: 43 });
  expect(() =>
    resolve(bind(parameters.dataUpdate, "data.transition/embla"), "full", { timeScale: Number.MAX_VALUE }),
  ).toThrow(RangeError);
  expect(() =>
    resolve(bind(parameters.dataUpdate, "data.transition/recharts"), "full", {
      effectiveDurations: { base: Number.MAX_VALUE },
    }),
  ).toThrow(RangeError);
  for (const seconds of [1e-320, Number.MAX_VALUE])
    expect(() => parameters.physicalSpring(seconds)).toThrow(RangeError);
  expect(
    parameters.transitionFor(
      "state.morph",
      "full",
      { delay: 1 },
      { tokens: { spring: { morph: { visualDuration: 0, bounce: 0 } } } },
    ),
  ).toEqual({ duration: 0, delay: 0 });
  expect(
    parameters.transitionFor("exit.fade", "full", { timeScale: 0 }, { effectiveDurations: { fast: 0.7 } }),
  ).toEqual({ duration: 0, delay: 0 });
  expect(() =>
    parameters.transitionFor("reveal", "full", { timeScale: 4 }, { tokens: { duration: { base: Number.MAX_VALUE } } }),
  ).toThrow(RangeError);
});

it("caps final stagger after scaling and resolves geometry constraints without claiming a controller", () => {
  for (const unit of ["char", "word", "item"] as const)
    for (const timeScale of [0, 1, 4, 1e12]) {
      const result = parameters.resolveStaggerParameters(1000, unit, "full", timeScale);
      expect(result.moving).toBeLessThanOrEqual(20);
      expect(result.finalDelay).toBeLessThanOrEqual(unit === "char" ? 0.12 : 0.4);
    }
  expect(parameters.resolveStaggerParameters(5, "char", "full")).toEqual({ moving: 5, step: 0.012, finalDelay: 0.048 });
  expect(parameters.resolveStaggerParameters(5, "char", "reduced", 4)).toEqual({ moving: 0, step: 0, finalDelay: 0 });
  expect(parameters.resolveGeometryBounds(100, 200, 50)).toEqual({
    feasible: false,
    min: 100,
    max: 50,
    reason: "available-below-minimum",
  });
  expect(parameters.resolveGeometryBounds(40, 500, 200)).toEqual({ feasible: true, min: 40, max: 200 });
  expect(parameters.resolveGeometryBounds(0, 500, 0)).toEqual({ feasible: true, min: 0, max: 0 });
  expect(() => parameters.resolveGeometryBounds(50, 20)).toThrow(RangeError);
  expect(() => parameters.resolveGeometryBounds(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  expect(() => parameters.resolveStaggerParameters(-1, "item", "full")).toThrow(RangeError);
});
