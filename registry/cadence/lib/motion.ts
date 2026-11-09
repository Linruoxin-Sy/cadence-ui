import type { Transition } from "motion/react";

/**
 * Motion tokens for Cadence. Every animation must use one of these values so
 * timing stays coherent across components. Durations are seconds.
 */
export const duration = {
  instant: 0.1,
  fast: 0.16,
  base: 0.22,
  slow: 0.32,
  page: 0.45,
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.7, 0, 0.84, 0],
} as const;

/** CSS keyword equivalents, not additional authored purpose presets. */
export const cssEasing: Record<string, readonly [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

export const spring = {
  press: { type: "spring", visualDuration: 0.24, bounce: 0.12 },
  snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
  travel: { type: "spring", visualDuration: 0.3, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
  sizeCompact: { type: "spring", visualDuration: 0.28, bounce: 0 },
  sizePanel: { type: "spring", visualDuration: 0.36, bounce: 0 },
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24, xl: 48 } as const;
export const scale = { in: 0.96, pop: 1.02, press: 0.97 } as const;
export const rotation = { halfTurn: 180 } as const;
/** Embla attraction units, calibrated against the data.transition duration (not ms). */
export const carouselClock = { unitsPerSecond: 100 } as const;

export const reducedDurationScale = 0.6;
/** Generated theme/scope protocol, separate from recipe and registry versions. */
export const motionCssVersion = 1;

export const stagger = { char: 0.012, word: 0.035, item: 0.05 } as const;

/** Parameter budgets only; the owning controllers enforce visible work and rendered bounds. */
export const motionLimits = {
  staggerElements: 20,
  staggerDelay: 0.4,
  characterDelay: 0.12,
  changedGraphemes: 64,
  diffInput: 2048,
  diffComparisons: 4096,
  numericColumns: 12,
  chartSamples: 200,
  collectionVisuals: 50,
  pendingTargets: 1,
} as const;

/** Commit-time text correspondence allocation ceilings; not motion parameters. */
export const textProofLimits = { pixels: 262144, axis: 4096 } as const;

/**
 * The point at which a spring is ~97% of the way to its target, relative to
 * the authored `visualDuration`. Copied from motion-dom 13.5.1 (`spring.ts`);
 * re-check that source when Motion is upgraded.
 */
const VISUAL_SETTLE = 1.2;

/**
 * Restate a token spring as stiffness / damping / mass.
 *
 * A `visualDuration` spring is time-defined: when Motion starts a new
 * animation from an interrupted one it discards the inherited velocity, so a
 * retarget begins from rest. Physics-defined springs keep it. Only recipes
 * marked `continuity: "velocity"` use this form; small-range springs keep the
 * time-defined shape because Motion deliberately ignores inherited velocity
 * there.
 *
 * Apply `timeScale` to `visualDuration` before calling this, so the physical
 * parameters scale with the rest of the system. The conversion is exact for
 * `0 <= bounce <= 0.95`; the tokens never leave that range.
 */
export function physicalSpring(visualDuration: number, bounce = 0): Transition {
  if (!Number.isFinite(visualDuration) || visualDuration < 0)
    throw new RangeError("visualDuration must be finite and non-negative");
  if (visualDuration === 0) return { duration: 0 };
  const dampingRatio = Math.max(1 - bounce, 0.05);
  const undamped = (2 * Math.PI) / (visualDuration * VISUAL_SETTLE);
  const stiffness = undamped * undamped;
  const damping = 2 * dampingRatio * undamped;
  if (!Number.isFinite(stiffness) || stiffness <= 0 || !Number.isFinite(damping) || damping <= 0)
    throw new RangeError("spring duration exceeds the finite physics range");
  return {
    type: "spring",
    stiffness,
    damping,
    mass: 1,
  };
}

export type CadenceMode = "full" | "reduced" | "none";

/** Only the existing Recharts/Calendar owners convert seconds to native milliseconds. */
export function motionMilliseconds(seconds: number): number {
  return nonNegative(nonNegative(seconds, "seconds") * 1000, "native milliseconds");
}

export type Recipe =
  | "reveal"
  | "enter.pop"
  | "exit.fade"
  | "exit.shrink"
  | "popup.anchored"
  | "layout.move"
  | "layout.shared"
  | "list.stagger"
  | "gesture.drag"
  | "scroll.progress"
  | "scroll.navigate"
  | "scroll.story"
  | "text.reveal"
  | "text.change"
  | "text.split"
  | "number.roll"
  | "data.transition"
  | "state.morph"
  | "state.color"
  | "geometry.resize"
  | "handoff"
  | "feedback.press";

export interface MotionOptions {
  /** Delay in seconds. Ignored when motion is disabled. */
  delay?: number;
  /** Override the token duration (tween recipes only). */
  duration?: number;
  /**
   * Multiplies every duration, spring `visualDuration`, and delay. `1` is the
   * authored timing; `4` is the "slow motion" used by the docs site.
   * Finite and non-negative; zero reaches the target immediately without changing mode.
   */
  timeScale?: number;
}

type RecipeSpec =
  | { kind: "tween"; duration: keyof typeof duration; ease: keyof typeof ease; reduced?: "jump" }
  | {
      kind: "spring";
      spring: keyof typeof spring;
      /**
       * Mark a recipe whose element can be retargeted while it is still
       * moving. It is resolved into a physics-defined spring so Motion carries
       * the current velocity into the new target instead of restarting from
       * rest. Reserved for large-travel recipes (see animation-system §3).
       */
      continuity?: "velocity";
      /**
       * `jump` resolves to zero duration under `reduced` instead of a short
       * tween. Measured geometry (width/height) uses it: the size is
       * information, and tweening layout under reduced motion is still layout
       * motion.
       */
      reduced?: "jump";
    };

const recipes: Record<Recipe, RecipeSpec> = {
  reveal: { kind: "tween", duration: "base", ease: "out" },
  "enter.pop": { kind: "spring", spring: "snappy" },
  "exit.fade": { kind: "tween", duration: "fast", ease: "in" },
  "exit.shrink": { kind: "tween", duration: "fast", ease: "in" },
  "popup.anchored": { kind: "spring", spring: "smooth" },
  "layout.move": { kind: "spring", spring: "smooth", continuity: "velocity" },
  "layout.shared": { kind: "spring", spring: "morph", continuity: "velocity" },
  "list.stagger": { kind: "tween", duration: "base", ease: "out" },
  "gesture.drag": { kind: "spring", spring: "snappy" },
  "scroll.progress": { kind: "spring", spring: "smooth" },
  "scroll.navigate": { kind: "tween", duration: "page", ease: "inOut", reduced: "jump" },
  "scroll.story": { kind: "tween", duration: "slow", ease: "out" },
  "text.reveal": { kind: "tween", duration: "slow", ease: "out" },
  "text.change": { kind: "tween", duration: "fast", ease: "out" },
  "text.split": { kind: "tween", duration: "slow", ease: "out" },
  "number.roll": { kind: "spring", spring: "smooth", continuity: "velocity", reduced: "jump" },
  "data.transition": { kind: "tween", duration: "base", ease: "out" },
  "state.morph": { kind: "spring", spring: "morph" },
  "state.color": { kind: "tween", duration: "fast", ease: "out" },
  "geometry.resize": { kind: "spring", spring: "morph", continuity: "velocity", reduced: "jump" },
  handoff: { kind: "spring", spring: "travel", continuity: "velocity" },
  "feedback.press": { kind: "spring", spring: "press" },
};

/**
 * Resolve a recipe into a Motion `transition` for the current mode.
 *
 * - `full`: the token as authored, except continuity recipes, which are restated as physics so an
 *   interrupted animation keeps its velocity.
 * - `reduced`: springs collapse to a short tween, tweens run at 60% duration.
 * - `none`: zero duration, so components jump straight to their end state.
 */
export function transitionFor(
  recipe: Recipe,
  mode: CadenceMode,
  options: MotionOptions = {},
  scope?: { tokens?: MotionParameterTokens; effectiveDurations?: EffectiveMotionDurations },
): Transition {
  if (mode === "none") return { duration: 0 };
  const timeScale = options.timeScale ?? 1;
  if (!Number.isFinite(timeScale) || timeScale < 0) throw new RangeError("timeScale must be finite and non-negative");
  if (timeScale === 0) return { duration: 0, delay: 0 };
  if (recipe === "number.roll" && mode === "reduced") return { duration: 0, delay: 0 };
  const delay =
    recipe === "state.color" || recipe === "number.roll"
      ? 0
      : nonNegative((options.delay ?? 0) * timeScale, "effective delay");
  motionMilliseconds(delay);
  const spec = recipes[recipe];

  if (spec.kind === "spring") {
    if (mode === "reduced") {
      if (spec.reduced === "jump") return { duration: 0, delay };
      const seconds = nonNegative(
        scope?.effectiveDurations?.fast ?? (scope?.tokens?.duration?.fast ?? duration.fast) * timeScale,
        "effective reduced duration",
      );
      motionMilliseconds(seconds);
      return {
        duration: seconds,
        ease: [...(scope?.tokens?.ease?.out ?? ease.out)] as [number, number, number, number],
        delay,
      };
    }
    const token = scope?.tokens?.spring?.[spec.spring] ?? spring[spec.spring];
    const visualDuration = nonNegative(token.visualDuration * timeScale, "effective spring duration");
    if (visualDuration === 0) return { duration: 0, delay: 0 };
    motionMilliseconds(visualDuration);
    if (spec.continuity === "velocity") return { ...physicalSpring(visualDuration, token.bounce), delay };
    physicalSpring(visualDuration, token.bounce);
    return { ...token, type: "spring", visualDuration, delay };
  }

  if (mode === "reduced" && spec.reduced === "jump") return { duration: 0, delay: 0 };
  const scaleFactor = mode === "reduced" ? reducedDurationScale : 1;
  const resolvedDuration =
    options.duration === undefined && scope?.effectiveDurations?.[spec.duration] !== undefined
      ? scope.effectiveDurations[spec.duration]
      : (options.duration ?? (scope?.tokens?.duration?.[spec.duration] ?? duration[spec.duration]) * scaleFactor) *
        timeScale;
  motionMilliseconds(resolvedDuration ?? 0);
  return {
    duration: nonNegative(resolvedDuration ?? 0, "effective duration"),
    ease: [...(scope?.tokens?.ease?.[spec.ease] ?? ease[spec.ease])] as [number, number, number, number],
    delay,
  };
}

/** Resolve a CSS form's own token clock without substituting another recipe. */
export function cssDurationFor(
  token: keyof typeof duration,
  mode: CadenceMode,
  timeScale: number,
  scope?: { tokens?: MotionParameterTokens; effectiveDurations?: EffectiveMotionDurations },
) {
  if (mode === "none" || timeScale === 0) return 0;
  const seconds =
    scope?.effectiveDurations?.[token] ??
    (scope?.tokens?.duration?.[token] ?? duration[token]) * (mode === "reduced" ? reducedDurationScale : 1) * timeScale;
  motionMilliseconds(seconds);
  return nonNegative(seconds, "effective CSS duration");
}

/**
 * Internal parameter catalogue. These forms are deliberately separate from Recipe:
 * resolving a target form does not install its controller or extend legacy recognition.
 * Named exports let static consumers select a purpose without a component catalogue.
 */
type TweenParameters = {
  kind: "visual" | "color" | "scroll" | "data";
  duration: keyof typeof duration;
  ease: keyof typeof ease;
  distance?: keyof typeof distance;
  scale?: keyof typeof scale;
  exit?: true;
};
type SpringParameters = {
  kind: "press" | "indicator" | "layout" | "geometry" | "reel" | "handoff" | "progress";
  spring: keyof typeof spring;
};
type ParameterSpec =
  | TweenParameters
  | SpringParameters
  | { kind: "text" }
  | { kind: "continuous" }
  | { kind: "native" };
type ParameterDefinition = ParameterSpec & { readonly id: string; readonly forms: readonly string[] };

export const presenceInline = {
  id: "presence.inline",
  forms: ["data.transition/opacity"],
  kind: "visual",
  duration: "fast",
  ease: "out",
} as const satisfies ParameterDefinition;
export const presenceSurface = {
  id: "presence.surface",
  forms: ["enter.pop/surface", "enter.pop/opacity"],
  kind: "visual",
  duration: "base",
  ease: "out",
  scale: "in",
} as const satisfies ParameterDefinition;
export const presencePopup = {
  id: "presence.popup",
  forms: ["popup.anchored/presence"],
  kind: "visual",
  duration: "base",
  ease: "out",
  distance: "xs",
  scale: "in",
} as const satisfies ParameterDefinition;
export const presenceTooltip = {
  id: "presence.tooltip",
  forms: ["popup.anchored/opacity-enter", "popup.anchored/opacity-exit"],
  kind: "visual",
  duration: "instant",
  ease: "out",
} as const satisfies ParameterDefinition;
export const presenceMenu = {
  id: "presence.menu",
  forms: ["popup.anchored/presence"],
  kind: "visual",
  duration: "fast",
  ease: "out",
  distance: "xs",
} as const satisfies ParameterDefinition;
export const presenceSheet = {
  id: "presence.sheet",
  forms: ["popup.anchored/edge"],
  kind: "visual",
  duration: "slow",
  ease: "out",
} as const satisfies ParameterDefinition;
export const presenceExit = {
  id: "presence.exit",
  forms: ["exit.fade/opacity", "popup.anchored/ending"],
  kind: "visual",
  duration: "fast",
  ease: "in",
  exit: true,
} as const satisfies ParameterDefinition;
export const presenceSheetExit = {
  id: "presence.sheet-exit",
  forms: ["popup.anchored/edge-exit", "exit.fade/opacity"],
  kind: "visual",
  duration: "base",
  ease: "in",
  exit: true,
} as const satisfies ParameterDefinition;
export const stateColor = {
  id: "state.color",
  forms: ["state.color/surface", "state.color/foreground", "state.color/surface-foreground"],
  kind: "color",
  duration: "fast",
  ease: "out",
} as const satisfies ParameterDefinition;
export const feedbackPress = {
  id: "feedback.press",
  forms: ["feedback.press/scale"],
  kind: "press",
  spring: "press",
} as const satisfies ParameterDefinition;
export const stateIndicator = {
  id: "state.indicator",
  forms: ["state.morph/indicator"],
  kind: "indicator",
  spring: "snappy",
} as const satisfies ParameterDefinition;
export const layoutReflow = {
  id: "layout.reflow",
  forms: ["layout.move/position"],
  kind: "layout",
  spring: "smooth",
} as const satisfies ParameterDefinition;
export const layoutCompact = {
  id: "layout.compact",
  forms: ["layout.move/position"],
  kind: "layout",
  spring: "snappy",
} as const satisfies ParameterDefinition;
export const layoutSidebar = {
  id: "layout.sidebar",
  forms: ["layout.move/size-linked"],
  kind: "layout",
  spring: "sizeCompact",
} as const satisfies ParameterDefinition;
export const layoutSelection = {
  id: "layout.selection",
  forms: ["layout.shared/selection"],
  kind: "layout",
  spring: "smooth",
} as const satisfies ParameterDefinition;
export const geometryContent = {
  id: "geometry.content",
  forms: ["geometry.resize/measured"],
  kind: "geometry",
  spring: "morph",
} as const satisfies ParameterDefinition;
export const geometryCompact = {
  id: "geometry.compact",
  forms: ["geometry.resize/measured"],
  kind: "geometry",
  spring: "sizeCompact",
} as const satisfies ParameterDefinition;
export const geometryPanel = {
  id: "geometry.panel",
  forms: ["geometry.resize/measured"],
  kind: "geometry",
  spring: "sizePanel",
} as const satisfies ParameterDefinition;
export const textReplace = {
  id: "text.replace",
  forms: ["text.change/changed-runs"],
  kind: "text",
} as const satisfies ParameterDefinition;
export const numberRoll = {
  id: "number.roll",
  forms: ["number.roll/reels"],
  kind: "reel",
  spring: "smooth",
} as const satisfies ParameterDefinition;
export const numberCompact = {
  id: "number.compact",
  forms: ["number.roll/reels"],
  kind: "reel",
  spring: "snappy",
} as const satisfies ParameterDefinition;
export const contentSwitch = {
  id: "content.switch",
  forms: ["data.transition/directional-content"],
  kind: "visual",
  duration: "base",
  ease: "out",
  distance: "xs",
} as const satisfies ParameterDefinition;
export const contentMonth = {
  id: "content.month",
  forms: ["data.transition/month-grid"],
  kind: "visual",
  duration: "base",
  ease: "out",
  distance: "sm",
} as const satisfies ParameterDefinition;
export const dataUpdate = {
  id: "data.update",
  forms: ["data.transition/opacity", "data.transition/embla", "data.transition/recharts"],
  kind: "data",
  duration: "base",
  ease: "out",
} as const satisfies ParameterDefinition;
export const dataProgress = {
  id: "data.progress",
  forms: ["data.transition/determinate"],
  kind: "progress",
  spring: "snappy",
} as const satisfies ParameterDefinition;
export const statusLoop = {
  id: "status.loop",
  forms: ["data.transition/continuous"],
  kind: "continuous",
} as const satisfies ParameterDefinition;
export const handoffValue = {
  id: "handoff.value",
  forms: ["handoff/value"],
  kind: "handoff",
  spring: "smooth",
} as const satisfies ParameterDefinition;
export const scrollNavigate = {
  id: "scroll.navigate",
  forms: ["scroll.navigate/scroll"],
  kind: "scroll",
  duration: "page",
  ease: "inOut",
} as const satisfies ParameterDefinition;
export const engineNative = {
  id: "engine.native",
  forms: [
    "native/css-layout",
    "native/embla",
    "native/recharts",
    "native/base-ui-combobox",
    "native/cmdk",
    "native/base-ui-context-menu",
    "native/base-ui-drawer",
    "native/base-ui-menu",
    "native/base-ui-preview-card",
    "native/input",
    "native/input-otp",
    "native/base-ui-popover",
    "native/resizable-panels",
    "native/base-ui-scroll-area",
    "native/base-ui-select",
    "native/base-ui-slider",
    "native/table",
    "native/textarea",
    "native/base-ui-toast",
    "native/base-ui-tooltip",
  ],
  kind: "native",
} as const satisfies ParameterDefinition;

export type MotionParameterPreset =
  | typeof presenceInline
  | typeof presenceSurface
  | typeof presencePopup
  | typeof presenceTooltip
  | typeof presenceMenu
  | typeof presenceSheet
  | typeof presenceExit
  | typeof presenceSheetExit
  | typeof stateColor
  | typeof feedbackPress
  | typeof stateIndicator
  | typeof layoutReflow
  | typeof layoutCompact
  | typeof layoutSidebar
  | typeof layoutSelection
  | typeof geometryContent
  | typeof geometryCompact
  | typeof geometryPanel
  | typeof textReplace
  | typeof numberRoll
  | typeof numberCompact
  | typeof contentSwitch
  | typeof contentMonth
  | typeof dataUpdate
  | typeof dataProgress
  | typeof statusLoop
  | typeof handoffValue
  | typeof scrollNavigate
  | typeof engineNative;

export interface MotionParameterBinding<P extends MotionParameterPreset = MotionParameterPreset> {
  readonly preset: P;
  readonly form: P["forms"][number];
}

/** Exact parameter/form selection, with a runtime guard for untyped inputs. */
export function bindMotionParameters<P extends MotionParameterPreset>(
  preset: P,
  form: P["forms"][number],
): MotionParameterBinding<P> {
  if (!(preset.forms as readonly string[]).includes(form))
    throw new RangeError(`${preset.id} does not support ${form}`);
  return { preset, form };
}

/** Authored, unscaled values. Computed legacy mode outputs are not this type. */
export interface MotionParameterTokens {
  duration?: Partial<Record<keyof typeof duration, number>>;
  ease?: Partial<Record<keyof typeof ease, readonly [number, number, number, number]>>;
  spring?: Partial<Record<keyof typeof spring, { visualDuration: number; bounce: number }>>;
  distance?: Partial<Record<keyof typeof distance, number>>;
  scale?: Partial<Record<keyof typeof scale, number>>;
  rotation?: Partial<Record<keyof typeof rotation, number>>;
  stagger?: Partial<Record<keyof typeof stagger, number>>;
}

export interface MotionTokenValues {
  duration: Record<keyof typeof duration, number>;
  ease: Record<keyof typeof ease, readonly [number, number, number, number]>;
  spring: Record<keyof typeof spring, { type: "spring"; visualDuration: number; bounce: number }>;
  distance: Record<keyof typeof distance, number>;
  scale: Record<keyof typeof scale, number>;
  rotation: Record<keyof typeof rotation, number>;
  stagger: Record<keyof typeof stagger, number>;
}

export type EffectiveMotionDurations = Partial<Record<keyof typeof duration, number>>;

export interface MotionTokenEntry {
  name: string;
  group: keyof MotionTokenValues;
  key: string;
  field?: "visualDuration" | "bounce";
  unit: "s" | "px" | "deg" | "number" | "ease";
  value: number | readonly [number, number, number, number];
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** Shared CSS naming/serialization metadata; contains no component bindings or executors. */
export function motionTokenEntries(): MotionTokenEntry[] {
  const numeric = (
    group: "duration" | "distance" | "scale" | "rotation" | "stagger",
    values: Record<string, number>,
    unit: MotionTokenEntry["unit"],
  ) =>
    Object.entries(values).map(([key, value]) => ({
      name: `--motion-${group === "duration" ? "source-duration" : group}-${kebab(key)}`,
      group,
      key,
      value,
      unit,
    }));
  return [
    ...numeric("duration", duration, "s"),
    ...numeric("distance", distance, "px"),
    ...numeric("scale", scale, "number"),
    ...numeric("rotation", rotation, "deg"),
    ...numeric("stagger", stagger, "s"),
    ...Object.entries(ease).map(([key, value]) => ({
      name: `--ease-cadence-${kebab(key)}`,
      group: "ease" as const,
      key,
      value,
      unit: "ease" as const,
    })),
    ...Object.entries(spring).flatMap(([key, value]) => [
      {
        name: `--motion-spring-${kebab(key)}-duration`,
        group: "spring" as const,
        key,
        field: "visualDuration" as const,
        value: value.visualDuration,
        unit: "s" as const,
      },
      {
        name: `--motion-spring-${kebab(key)}-bounce`,
        group: "spring" as const,
        key,
        field: "bounce" as const,
        value: value.bounce,
        unit: "number" as const,
      },
    ]),
  ];
}

export function defaultMotionTokens(): MotionTokenValues {
  return {
    duration: { ...duration },
    ease: { ...ease },
    spring: { ...spring },
    distance: { ...distance },
    scale: { ...scale },
    rotation: { ...rotation },
    stagger: { ...stagger },
  };
}

export function motionTokenCss(entry: MotionTokenEntry, value = entry.value): string {
  return Array.isArray(value)
    ? `cubic-bezier(${value.join(", ")})`
    : `${value}${entry.unit === "number" ? "" : entry.unit}`;
}

export const inheritedMotionTokenName = (name: string) => `--cadence-inherited-${name.slice(2)}`;
export const effectiveMotionTokenName = (key: string) => `--cadence-effective-${key}`;
export const generatedMotionTime = (value: string, origin: 1 | 2 = 1) =>
  `calc(${value}${origin === 2 ? " * var(--cadence-recipe-enabled, 1)" : ""} + 0s * ${origin})`;
export const isGeneratedMotionTime = (value: string) => /\+\s*0s\s*\*\s*[12]\s*\)$/.test(value);

export interface MotionParameterOptions {
  timeScale?: number;
  delay?: number;
  tokens?: MotionParameterTokens;
  /** Already-effective legacy CSS overrides. Never multiply this clock again. */
  effectiveDurations?: EffectiveMotionDurations;
  /** Embla owns explicit option/breakpoint attraction units, never CSS seconds/easing. */
  emblaDuration?: number;
}

export type ResolvedMotionParameters =
  | { kind: "visual"; opacity: Transition; spatial: Transition; distance: number; scale: number }
  | { kind: "color" | "scroll" | "layout" | "geometry" | "reel" | "progress"; transition: Transition }
  | { kind: "press"; transition: Transition; scale: number }
  | { kind: "indicator"; opacity: Transition; spatial: Transition; scale: number; rotation: number }
  | { kind: "handoff"; opacity: Transition; spatial: Transition }
  | { kind: "text"; enter: Transition; exit: Transition; stagger: "none" }
  | { kind: "embla"; clock: "attraction"; units: number }
  | { kind: "recharts"; clock: "progress"; seconds: number; ease: readonly [number, number, number, number] }
  | { kind: "continuous"; clock: "theme"; allowed: boolean }
  | { kind: "native"; clock: "owner"; form: string; mode: CadenceMode };

function nonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and non-negative`);
  return value;
}

function parameterEase(value: readonly [number, number, number, number]) {
  if (
    value.length !== 4 ||
    !value.every(Number.isFinite) ||
    value[0] < 0 ||
    value[0] > 1 ||
    value[2] < 0 ||
    value[2] > 1
  )
    throw new RangeError("easing must be a finite CSS cubic-bezier with x in [0, 1]");
  return value;
}

/**
 * Pure parameter resolution, not an animation executor. The mode chooses allowed
 * targets first; zero then bypasses physics. Theme loops and native intent/lifetime
 * clocks are never converted into recipe milliseconds. Controllers own cancellation.
 */
export function resolveMotionParameters(
  binding: MotionParameterBinding,
  mode: CadenceMode,
  options: MotionParameterOptions = {},
): ResolvedMotionParameters {
  const { form } = binding;
  const preset: ParameterDefinition = binding.preset;
  if (!preset.forms.includes(form)) throw new RangeError(`${preset.id} does not support ${form}`);
  if (preset.kind === "native") return { kind: "native", clock: "owner", form, mode };
  if (preset.kind === "continuous") return { kind: "continuous", clock: "theme", allowed: mode === "full" };
  const full = mode === "full";
  const clock = mode === "none" ? 0 : nonNegative(options.timeScale ?? 1, "timeScale");
  const tokens = options.tokens;
  const zero = (): Transition => ({ duration: 0, delay: 0 });
  const tween = (key: keyof typeof duration, curve: keyof typeof ease, spatial = false, exit = false): Transition => {
    if (clock === 0 || (spatial && !full)) return zero();
    const seconds = nonNegative(tokens?.duration?.[key] ?? duration[key], `duration.${key}`);
    const delay = exit ? 0 : nonNegative(nonNegative(options.delay ?? 0, "delay") * clock, "effective delay");
    const resolvedDuration = nonNegative(
      options.effectiveDurations?.[key] ?? seconds * clock * (full ? 1 : reducedDurationScale),
      "effective duration",
    );
    motionMilliseconds(resolvedDuration);
    motionMilliseconds(delay);
    return {
      duration: resolvedDuration,
      delay,
      ease: [...parameterEase(tokens?.ease?.[curve] ?? ease[curve])],
    };
  };
  const physics = (key: keyof typeof spring, continuity = true): Transition => {
    if (!full || clock === 0) return zero();
    const token = tokens?.spring?.[key] ?? spring[key];
    const seconds = nonNegative(
      nonNegative(token.visualDuration, `spring.${key}.visualDuration`) * clock,
      "effective spring duration",
    );
    if (!Number.isFinite(token.bounce) || token.bounce < 0 || token.bounce > 0.95)
      throw new RangeError("spring bounce must be in [0, 0.95]");
    if (seconds === 0) return zero();
    const delay = nonNegative(nonNegative(options.delay ?? 0, "delay") * clock, "effective delay");
    motionMilliseconds(seconds);
    motionMilliseconds(delay);
    if (!continuity) physicalSpring(seconds, token.bounce);
    return {
      ...(continuity
        ? physicalSpring(seconds, token.bounce)
        : { type: "spring", visualDuration: seconds, bounce: token.bounce }),
      delay,
    };
  };
  const tokenScale = (key: keyof typeof scale) => nonNegative(tokens?.scale?.[key] ?? scale[key], `scale.${key}`);
  switch (preset.kind) {
    case "color":
    case "scroll":
      return { kind: preset.kind, transition: tween(preset.duration, preset.ease, preset.kind === "scroll") };
    case "data": {
      if (form === "data.transition/embla") {
        const units =
          !full || clock === 0
            ? 0
            : options.emblaDuration === undefined
              ? nonNegative(
                  (options.effectiveDurations?.[preset.duration] ??
                    nonNegative(tokens?.duration?.[preset.duration] ?? duration[preset.duration], "Embla duration") *
                      clock) * carouselClock.unitsPerSecond,
                  "effective Embla attraction units",
                )
              : nonNegative(options.emblaDuration, "Embla attraction units");
        return { kind: "embla", clock: "attraction", units };
      }
      if (form === "data.transition/recharts") {
        const transition = tween(preset.duration, preset.ease, true);
        motionMilliseconds(transition.duration ?? 0);
        return {
          kind: "recharts",
          clock: "progress",
          seconds: transition.duration ?? 0,
          ease: parameterEase(tokens?.ease?.[preset.ease] ?? ease[preset.ease]),
        };
      }
      return { kind: "visual", opacity: tween(preset.duration, preset.ease), spatial: zero(), distance: 0, scale: 1 };
    }
    case "visual": {
      const opacityOnly = form.endsWith("/opacity") || form.includes("/opacity-");
      const exit = preset.exit || form.endsWith("/opacity-exit");
      return {
        kind: "visual",
        opacity: tween(preset.duration, preset.ease, false, exit),
        spatial: opacityOnly ? zero() : tween(preset.duration, preset.ease, true, exit),
        distance:
          full && !opacityOnly && preset.distance
            ? nonNegative(
                tokens?.distance?.[preset.distance] ?? distance[preset.distance],
                `distance.${preset.distance}`,
              )
            : 0,
        scale: full && !opacityOnly && preset.scale ? tokenScale(preset.scale) : 1,
      };
    }
    case "text":
      return { kind: "text", enter: tween("fast", "out"), exit: tween("instant", "in", false, true), stagger: "none" };
    case "press":
      return { kind: "press", transition: physics(preset.spring, false), scale: full ? tokenScale("press") : 1 };
    case "indicator":
      return {
        kind: "indicator",
        opacity: full ? physics(preset.spring, false) : tween("fast", "out"),
        spatial: physics(preset.spring, false),
        scale: full ? tokenScale("in") : 1,
        rotation: nonNegative(tokens?.rotation?.halfTurn ?? rotation.halfTurn, "rotation.halfTurn"),
      };
    case "handoff":
      return {
        kind: "handoff",
        opacity: full ? physics(preset.spring) : tween("fast", "out"),
        spatial: physics(preset.spring),
      };
    default:
      return { kind: preset.kind, transition: physics(preset.spring) };
  }
}

/** Final delays, capped after timeScale. Overflow receives its semantic target immediately. */
export function resolveStaggerParameters(
  count: number,
  unit: keyof typeof stagger,
  mode: CadenceMode,
  timeScale = 1,
  tokens: MotionParameterTokens = {},
): { moving: number; step: number; finalDelay: number } {
  if (!Number.isSafeInteger(count) || count < 0)
    throw new RangeError("stagger count must be a non-negative safe integer");
  nonNegative(timeScale, "timeScale");
  if (mode !== "full" || timeScale === 0) return { moving: 0, step: 0, finalDelay: 0 };
  const moving = Math.min(count, motionLimits.staggerElements);
  const last = Math.max(0, moving - 1);
  const cap = unit === "char" ? motionLimits.characterDelay : motionLimits.staggerDelay;
  const step =
    last === 0
      ? 0
      : Math.min(nonNegative(tokens.stagger?.[unit] ?? stagger[unit], `stagger.${unit}`) * timeScale, cap / last);
  return { moving, step, finalDelay: step * last };
}

/** Pure bound resolution only. The geometry owner must clamp every rendered frame. */
export function resolveGeometryBounds(
  min: number,
  max: number,
  available = max,
):
  | { feasible: true; min: number; max: number }
  | { feasible: false; min: number; max: number; reason: "available-below-minimum" } {
  nonNegative(min, "geometry minimum");
  nonNegative(max, "geometry maximum");
  nonNegative(available, "available geometry");
  if (min > max) throw new RangeError("geometry minimum cannot exceed maximum");
  const upper = Math.min(max, available);
  return min > upper
    ? { feasible: false, min, max: upper, reason: "available-below-minimum" }
    : { feasible: true, min, max: upper };
}
