import type { CSSProperties } from "react";
import { cn } from "./cn";
import { duration, reducedDurationScale } from "./motion";
import { defaultMotionScope, motionScopeStyle } from "./motion-scope";
import type { CadenceMotion } from "./provider";

/** CSS variables stay local override surfaces; transport uses private fallbacks. */
export function popupClockStyle(cm: CadenceMotion): CSSProperties {
  const scope = cm.inheritedScope ?? cm.scope ?? defaultMotionScope;
  const transport = motionScopeStyle(
    { ...scope, effectiveDurations: cm.scope?.effectiveDurations ?? scope.effectiveDurations },
    cm.timeScale,
  );
  const clock = cm.disabled || cm.timeScale === 0 ? { ...transport, transition: "none" } : transport;
  if (scope.supported || !scope.ready) return clock;
  // Existing source-only consumers without the updated generated theme keep their defaults.
  const factor = (cm.disabled ? 0 : cm.reduced ? reducedDurationScale : 1) * cm.timeScale;
  return {
    ...clock,
    ...Object.fromEntries(
      Object.entries(duration).map(([key, seconds]) => [`--motion-duration-${key}`, `${seconds * factor}s`]),
    ),
  } as CSSProperties;
}

/** Evaluate Base UI state callbacks before merging; caller utilities win. */
export function stateClasses<S>(base: string, value: string | ((state: S) => string | undefined) | undefined) {
  return typeof value === "function" ? (state: S) => cn(base, value(state)) : cn(base, value);
}

/** Each portal owns its effective clock, including full inside a none scope. */
export function popupStyle(cm: CadenceMotion, value: CSSProperties | undefined): CSSProperties;
export function popupStyle<S>(
  cm: CadenceMotion,
  value: (state: S) => CSSProperties | undefined,
): (state: S) => CSSProperties;
export function popupStyle<S>(
  cm: CadenceMotion,
  value: CSSProperties | ((state: S) => CSSProperties | undefined) | undefined,
): CSSProperties | ((state: S) => CSSProperties);
export function popupStyle<S>(
  cm: CadenceMotion,
  value: CSSProperties | ((state: S) => CSSProperties | undefined) | undefined,
) {
  const clock = popupClockStyle(cm);
  const merge = (caller: CSSProperties | undefined): CSSProperties => {
    const merged = { ...clock, ...caller };
    if (cm.disabled || cm.timeScale === 0) {
      // Base UI temporarily writes the transition shorthand during popup mounting.
      // Keep that family in one shorthand instead of conflicting longhand writers.
      delete merged.transitionDuration;
      delete merged.transitionDelay;
      delete merged.transitionProperty;
      delete merged.transitionTimingFunction;
      delete merged.transitionBehavior;
      merged.transition = "none";
    }
    return merged;
  };
  return typeof value === "function" ? (state: S) => merge(value(state)) : merge(value);
}

/** Removing a native transition property cancels that running transition. */
export function popupClasses<S>(
  cm: CadenceMotion,
  base: string,
  value: string | ((state: S) => string | undefined) | undefined,
) {
  const classes = cm.disabled
    ? base
        .split(" ")
        // Suppress entry/exit fades, while preserving visibility states such as Toast limited.
        .filter((part) => !/^data-(?:\[(?:starting|ending)-style\]|(?:starting|ending)-style):opacity-0$/.test(part))
        .join(" ")
    : base;
  return stateClasses(
    cn(classes, cm.disabled ? "transition-none" : cm.reduced ? "transition-opacity" : undefined),
    value,
  );
}
