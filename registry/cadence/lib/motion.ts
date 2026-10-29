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
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  morph: { type: "spring", visualDuration: 0.42, bounce: 0 },
} as const;

export const distance = { xs: 4, sm: 8, md: 12, lg: 24, xl: 48 } as const;
export const scale = { in: 0.96, pop: 1.02, press: 0.97 } as const;
export const stagger = { char: 0.012, word: 0.035, item: 0.05 } as const;

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
  | "feedback.press";

export interface MotionOptions {
  /** Delay in seconds. Ignored when motion is disabled. */
  delay?: number;
  /** Override the token duration (tween recipes only). */
  duration?: number;
}

type RecipeSpec =
  | { kind: "tween"; duration: number; ease: readonly number[] }
  | { kind: "spring"; spring: keyof typeof spring };

const recipes: Record<Recipe, RecipeSpec> = {
  reveal: { kind: "tween", duration: duration.base, ease: ease.out },
  "enter.pop": { kind: "spring", spring: "snappy" },
  "exit.fade": { kind: "tween", duration: duration.fast, ease: ease.in },
  "exit.shrink": { kind: "tween", duration: duration.fast, ease: ease.in },
  "popup.anchored": { kind: "spring", spring: "smooth" },
  "layout.move": { kind: "spring", spring: "smooth" },
  "layout.shared": { kind: "spring", spring: "morph" },
  "list.stagger": { kind: "tween", duration: duration.base, ease: ease.out },
  "gesture.drag": { kind: "spring", spring: "snappy" },
  "scroll.progress": { kind: "spring", spring: "smooth" },
  "scroll.story": { kind: "tween", duration: duration.slow, ease: ease.out },
  "text.reveal": { kind: "tween", duration: duration.slow, ease: ease.out },
  "text.split": { kind: "tween", duration: duration.slow, ease: ease.out },
  "number.roll": { kind: "spring", spring: "snappy" },
  "data.transition": { kind: "tween", duration: duration.base, ease: ease.out },
  "state.morph": { kind: "spring", spring: "morph" },
  "feedback.press": { kind: "spring", spring: "press" },
};

/**
 * Resolve a recipe into a Motion `transition` for the current mode.
 *
 * - `full`: the recipe's token as authored.
 * - `reduced`: springs collapse to a short tween, tweens run at 60% duration.
 * - `none`: zero duration, so components jump straight to their end state.
 */
export function transitionFor(recipe: Recipe, mode: CadenceMode, options: MotionOptions = {}): Transition {
  if (mode === "none") return { duration: 0 };
  const delay = options.delay ?? 0;
  const spec = recipes[recipe];

  if (spec.kind === "spring") {
    if (mode === "reduced")
      return { duration: duration.fast, ease: [...ease.out] as [number, number, number, number], delay };
    return { ...spring[spec.spring], delay };
  }

  const scaleFactor = mode === "reduced" ? 0.6 : 1;
  return {
    duration: options.duration ?? spec.duration * scaleFactor,
    ease: [...spec.ease] as [number, number, number, number],
    delay,
  };
}
