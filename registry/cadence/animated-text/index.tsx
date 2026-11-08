"use client";

import type { ComponentProps } from "react";
import { cn } from "../lib/cn";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useTextPresentation } from "../lib/use-text-presentation";

export interface AnimatedTextProps extends Omit<ComponentProps<"span">, "children" | "dangerouslySetInnerHTML"> {
  value: string;
  locale?: string;
  granularity?: "auto" | "grapheme" | "word";
}

/** One native string with changed-only decorative opacity; initial text is visible. */
function AnimatedText({ value, locale, granularity = "auto", className, ref: external, ...props }: AnimatedTextProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external);
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, node, {
    locale,
    granularity,
    characterStagger: cm.reduced ? false : true,
  });
  return (
    <span {...props} ref={ref} className={cn(className)} data-slot="animated-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { AnimatedText };
