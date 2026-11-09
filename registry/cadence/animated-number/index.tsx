"use client";

import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";

export interface AnimatedNumberProps extends Omit<ComponentProps<"span">, "children" | "dangerouslySetInnerHTML"> {
  value: number | bigint;
  locales?: Intl.LocalesArgument;
  format?: Intl.NumberFormatOptions;
  direction?: "trend" | "up" | "down" | "shortest";
}

/** An explicitly owned independent quantity, with one current native value. */
function AnimatedNumber({
  value,
  locales,
  format,
  direction = "trend",
  className,
  ref: external,
  ...props
}: AnimatedNumberProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external);
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, node, {
    cause: "independent",
    direction: cm.reduced ? undefined : direction,
    display:
      locales === undefined && format === undefined
        ? { kind: "raw" }
        : { kind: "intl", formatter: new Intl.NumberFormat(locales, format) },
  });
  return (
    <span {...props} ref={ref} className={cn(className)} data-slot="animated-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { AnimatedNumber };
