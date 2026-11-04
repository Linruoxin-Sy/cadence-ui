import type { CSSProperties } from "react";
import { cn } from "./cn";
import { duration, reducedDurationScale } from "./motion";
import type { CadenceMotion } from "./provider";

/** Evaluate Base UI state callbacks before merging; caller utilities win. */
export function stateClasses<S>(base: string, value: string | ((state: S) => string | undefined) | undefined) {
  return typeof value === "function" ? (state: S) => cn(base, value(state)) : cn(base, value);
}

/** Each portal owns its effective clock, including full inside a none scope. */
export function popupStyle<S>(
  cm: CadenceMotion,
  value: CSSProperties | ((state: S) => CSSProperties | undefined) | undefined,
) {
  const factor = (cm.disabled ? 0 : cm.reduced ? reducedDurationScale : 1) * cm.timeScale;
  const clock = Object.fromEntries(
    Object.entries(duration).map(([key, seconds]) => [`--motion-duration-${key}`, `${seconds * factor}s`]),
  ) as CSSProperties;
  return typeof value === "function" ? (state: S) => ({ ...clock, ...value(state) }) : { ...clock, ...value };
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
