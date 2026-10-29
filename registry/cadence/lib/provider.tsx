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
  /** Resolve a recipe into a Motion transition for the current mode. */
  transition: (recipe: Recipe, options?: MotionOptions) => Transition;
  distance: typeof distance;
  spring: typeof spring;
}

const CadenceContext = createContext<CadenceMotion | null>(null);

const FALLBACK_MODE: CadenceMode = "full";

function createMotion(mode: CadenceMode): CadenceMotion {
  return {
    mode,
    reduced: mode !== "full",
    transition: (recipe, options) => transitionFor(recipe, mode, options),
    distance,
    spring,
  };
}

export interface CadenceProviderProps {
  /**
   * Motion intensity for everything inside. `reduced` halves travel and shortens
   * timing; `none` disables animation entirely. The system
   * `prefers-reduced-motion` setting always wins over `full`.
   */
  mode?: Exclude<CadenceMode, "reduced"> | "reduced";
  children: ReactNode;
  className?: string;
}

/**
 * Optional provider. It wires `prefers-reduced-motion` into one `MotionConfig`
 * and exposes the resolved mode to components. Components work without it; they
 * then follow the system preference only.
 */
export function CadenceProvider({ mode = "full", children, className }: CadenceProviderProps) {
  const systemReduced = useReducedMotion();
  const effective: CadenceMode = mode === "none" ? "none" : systemReduced ? "reduced" : mode;
  const value = useMemo(() => createMotion(effective), [effective]);

  return (
    <CadenceContext.Provider value={value}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
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
