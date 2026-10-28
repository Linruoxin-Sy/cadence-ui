"use client";

import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useMemo } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface NumberFlowProps {
  /** The value to display. Changes animate from the previous number. */
  value: number;
  /** Fraction digits. Defaults to 0. */
  precision?: number;
  /** BCP 47 locale for grouping and separators. Defaults to the runtime locale. */
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Announce the final value to screen readers. Use for results, not live counters. */
  announce?: boolean;
  className?: string;
}

/**
 * A number that rolls from its previous value to the next one.
 *
 * Motion contract:
 * - change: spring from old to new value, formatted with `Intl.NumberFormat`
 * - reduced / none: the new value is shown directly
 *
 * a11y: the element exposes the formatted final value via `aria-label`; the
 * intermediate frames never reach the accessibility tree. `announce` adds an
 * `aria-live` region for result-style numbers (totals, prices).
 */
export function NumberFlow({
  value,
  precision = 0,
  locale,
  prefix,
  suffix,
  announce = false,
  className,
}: NumberFlowProps) {
  const cm = useCadenceMotion();
  const systemReduced = useReducedMotion();
  const reduced = cm.reduced || systemReduced === true;

  const format = useMemo(() => {
    const options: Intl.NumberFormatOptions = { minimumFractionDigits: precision, maximumFractionDigits: precision };
    return (input: number) => new Intl.NumberFormat(locale, options).format(input);
  }, [locale, precision]);

  const spring = useSpring(value, { stiffness: 140, damping: 22, restDelta: 0.001 });
  const text = useTransform(spring, (latest) => format(latest));

  useEffect(() => {
    if (reduced) {
      spring.jump(value);
      return;
    }
    spring.set(value);
  }, [reduced, spring, value]);

  const final = format(value);
  const content = reduced ? final : text;

  return (
    <span
      data-slot="number-flow"
      data-motion={cm.mode}
      className={cn("inline-flex items-baseline gap-[0.15em] tabular-nums", className)}
      aria-live={announce ? "polite" : undefined}
      aria-atomic={announce ? "true" : undefined}
    >
      {prefix ? <span aria-hidden="true">{prefix}</span> : null}
      <motion.span aria-label={`${prefix ?? ""}${final}${suffix ?? ""}`}>{content}</motion.span>
      {suffix ? <span aria-hidden="true">{suffix}</span> : null}
    </span>
  );
}
