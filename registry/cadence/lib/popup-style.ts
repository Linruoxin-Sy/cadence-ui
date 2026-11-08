import type { CSSProperties } from "react";
import { cn } from "./cn";
import { cssDurationFor, duration } from "./motion";
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
  return {
    ...clock,
    ...Object.fromEntries(
      Object.keys(duration).map((key) => [
        `--motion-duration-${key}`,
        `${cssDurationFor(key as keyof typeof duration, cm.mode, cm.timeScale, cm.scope)}s`,
      ]),
    ),
  } as CSSProperties;
}

/** Evaluate Base UI state callbacks before merging; caller utilities win. */
export function stateClasses<S>(base: string, value: string | ((state: S) => string | undefined) | undefined) {
  return typeof value === "function" ? (state: S) => cn(base, value(state)) : cn(base, value);
}

/** Each portal owns its effective clock, including full inside a none scope. */
export function popupStyle(cm: CadenceMotion, value: CSSProperties | undefined, callerFamily?: boolean): CSSProperties;
export function popupStyle<S>(
  cm: CadenceMotion,
  value: (state: S) => CSSProperties | undefined,
  callerFamily?: boolean,
): (state: S) => CSSProperties;
export function popupStyle<S>(
  cm: CadenceMotion,
  value: CSSProperties | ((state: S) => CSSProperties | undefined) | undefined,
  callerFamily?: boolean,
): CSSProperties | ((state: S) => CSSProperties);
export function popupStyle<S>(
  cm: CadenceMotion,
  value: CSSProperties | ((state: S) => CSSProperties | undefined) | undefined,
  callerFamily?: boolean,
) {
  const { transition, ...transport } = popupClockStyle(cm);
  // Explicitly coordinated surfaces use token-backed CSS for their own none/zero
  // policy. An inline shorthand would outrank arbitrary caller CSS families.
  const clock =
    callerFamily === undefined ? { ...transport, ...(transition === undefined ? {} : { transition }) } : transport;
  const merge = (caller: CSSProperties | undefined): CSSProperties => {
    const merged = { ...clock, ...caller };
    if (callerFamily === undefined && (cm.disabled || cm.timeScale === 0)) {
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
  callerFamily = false,
) {
  const token = base.match(/duration-\(--motion-duration-(\w+)\)/)?.[1] as keyof typeof duration | undefined;
  const localClock = token ? (cm.scope.effectiveDurations[token] ?? cm.scope.tokens.duration[token]) : undefined;
  const immediate = cm.disabled || cm.timeScale === 0 || localClock === 0;
  const baseClasses = callerFamily
    ? base
        .split(" ")
        .filter(
          (part) =>
            !/^(?:(?:transition|duration|delay|ease)(?:-|$)|data-\[(?:starting|ending)-style\]:.*(?:opacity-0|scale-\S+|translate-\S+)$)/.test(
              part,
            ),
        )
        .join(" ")
    : base;
  const classes = immediate
    ? baseClasses
        .split(" ")
        // Enter visibly, but retain the semantic closed opacity of a native
        // keep-mounted popup. Its exit endpoint is immediate, not an entrance pose.
        .filter(
          (part) =>
            /^data-(?:\[ending-style\]|ending-style):opacity-0$/.test(part) ||
            !/^data-(?:\[(?:starting|ending)-style\]|(?:starting|ending)-style):.*(?:opacity-0|scale-\S+|translate-\S+)$/.test(
              part,
            ),
        )
        .join(" ")
    : baseClasses;
  return stateClasses(
    cn(classes, !callerFamily && (immediate ? "transition-none" : cm.reduced ? "transition-opacity" : undefined)),
    value,
  );
}
