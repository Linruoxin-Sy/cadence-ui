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

export const spring = {
  press: { type: "spring", visualDuration: 0.24, bounce: 0.12 },
  snappy: { type: "spring", visualDuration: 0.26, bounce: 0 },
  travel: { type: "spring", visualDuration: 0.3, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24, xl: 48 } as const;
export const scale = { in: 0.96, pop: 1.02, press: 0.97 } as const;
export const stagger = { char: 0.012, word: 0.035, item: 0.05 } as const;

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
  const dampingRatio = Math.max(1 - bounce, 0.05);
  const undamped = (2 * Math.PI) / (visualDuration * VISUAL_SETTLE);
  return {
    type: "spring",
    stiffness: undamped * undamped,
    damping: 2 * dampingRatio * undamped,
    mass: 1,
  };
}

export type CadenceMode = "full" | "reduced" | "none";

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
  | "scroll.story"
  | "text.reveal"
  | "text.split"
  | "number.roll"
  | "data.transition"
  | "state.morph"
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
   */
  timeScale?: number;
}

type RecipeSpec =
  | { kind: "tween"; duration: number; ease: readonly number[] }
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
  reveal: { kind: "tween", duration: duration.base, ease: ease.out },
  "enter.pop": { kind: "spring", spring: "snappy" },
  "exit.fade": { kind: "tween", duration: duration.fast, ease: ease.in },
  "exit.shrink": { kind: "tween", duration: duration.fast, ease: ease.in },
  "popup.anchored": { kind: "spring", spring: "smooth" },
  "layout.move": { kind: "spring", spring: "smooth", continuity: "velocity" },
  "layout.shared": { kind: "spring", spring: "morph", continuity: "velocity" },
  "list.stagger": { kind: "tween", duration: duration.base, ease: ease.out },
  "gesture.drag": { kind: "spring", spring: "snappy" },
  "scroll.progress": { kind: "spring", spring: "smooth" },
  "scroll.story": { kind: "tween", duration: duration.slow, ease: ease.out },
  "text.reveal": { kind: "tween", duration: duration.slow, ease: ease.out },
  "text.split": { kind: "tween", duration: duration.slow, ease: ease.out },
  "number.roll": { kind: "spring", spring: "snappy" },
  "data.transition": { kind: "tween", duration: duration.base, ease: ease.out },
  "state.morph": { kind: "spring", spring: "morph" },
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
export function transitionFor(recipe: Recipe, mode: CadenceMode, options: MotionOptions = {}): Transition {
  if (mode === "none") return { duration: 0 };
  const timeScale = options.timeScale ?? 1;
  const delay = (options.delay ?? 0) * timeScale;
  const spec = recipes[recipe];

  if (spec.kind === "spring") {
    if (mode === "reduced") {
      if (spec.reduced === "jump") return { duration: 0, delay };
      return { duration: duration.fast * timeScale, ease: [...ease.out] as [number, number, number, number], delay };
    }
    const token = spring[spec.spring];
    const visualDuration = token.visualDuration * timeScale;
    if (spec.continuity === "velocity") return { ...physicalSpring(visualDuration, token.bounce), delay };
    return { ...token, visualDuration, delay };
  }

  const scaleFactor = mode === "reduced" ? 0.6 : 1;
  return {
    duration: (options.duration ?? spec.duration * scaleFactor) * timeScale,
    ease: [...spec.ease] as [number, number, number, number],
    delay,
  };
}
