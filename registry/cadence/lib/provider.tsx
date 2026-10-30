"use client";

import type { Transition } from "motion/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { cn } from "./cn";
import { type CadenceMode, distance, type MotionOptions, type Recipe, spring, transitionFor } from "./motion";

export interface CadenceMotion {
  /** The effective mode: full, reduced (system preference or prop), or none. */
  mode: CadenceMode;
  /** True when transforms and layout animations should be dropped. */
  reduced: boolean;
  /**
   * True only for `mode === "none"`. `reduced` still allows opacity and colour
   * feedback, so a CSS-driven component must check this — not `reduced` — before
   * deciding that a transition has zero duration.
   */
  disabled: boolean;
  /** The multiplier applied to every duration in this subtree. */
  timeScale: number;
  /** Resolve a recipe into a Motion transition for the current mode. */
  transition: (recipe: Recipe, options?: MotionOptions) => Transition;
  distance: typeof distance;
  spring: typeof spring;
}

const CadenceContext = createContext<CadenceMotion | null>(null);

const FALLBACK_MODE: CadenceMode = "full";

function createMotion(mode: CadenceMode, timeScale = 1): CadenceMotion {
  return {
    mode,
    reduced: mode !== "full",
    disabled: mode === "none",
    timeScale,
    transition: (recipe, options) => transitionFor(recipe, mode, { timeScale, ...options }),
    distance,
    spring,
  };
}

export interface CadenceProviderProps {
  /**
   * Motion intensity for everything inside. `reduced` halves travel and shortens
   * timing; `none` disables animation entirely. The system
   * `prefers-reduced-motion` setting always wins over `full`.
   *
   * Omit it to inherit the enclosing provider's mode; pass it to override the
   * enclosing scope (a preview that must show motion inside a `none` page).
   */
  mode?: CadenceMode;
  /**
   * Multiplies every duration and spring. `1` (default) is the authored timing;
   * the docs site passes `4` for its 0.25× preview. Additive: it does not change
   * any token, so a component looks the same at `1`. Omitting it inherits the
   * enclosing scale.
   */
  timeScale?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Optional provider. It wires `prefers-reduced-motion` into one `MotionConfig`
 * and exposes the resolved mode to components. Components work without it; they
 * then follow the system preference only.
 *
 * Nesting is how a subtree specialises: an inner provider inherits whatever it
 * does not set, so `<CadenceProvider timeScale={4}>` slows a region down without
 * resetting the page's mode to `full`.
 */
export function CadenceProvider({ mode, timeScale, children, className }: CadenceProviderProps) {
  const parent = useContext(CadenceContext);
  const requested = mode ?? parent?.mode ?? FALLBACK_MODE;
  const scale = timeScale ?? parent?.timeScale ?? 1;
  const systemReduced = useReducedMotion();
  const effective: CadenceMode = requested === "none" ? "none" : systemReduced ? "reduced" : requested;
  const value = useMemo(() => createMotion(effective, scale), [effective, scale]);

  return (
    <CadenceContext.Provider value={value}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.22 * scale, ease: [0.22, 1, 0.36, 1] }}>
        <div data-motion={effective} className={cn("contents", className)}>
          {children}
        </div>
      </MotionConfig>
    </CadenceContext.Provider>
  );
}

/** The resolved motion config. Falls back to the system preference when no provider is present. */
export function useCadenceMotion(): CadenceMotion {
  const context = useContext(CadenceContext);
  const systemReduced = useReducedMotion();
  return useMemo(() => context ?? createMotion(systemReduced ? "reduced" : FALLBACK_MODE), [context, systemReduced]);
}
