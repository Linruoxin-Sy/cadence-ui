"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface ScrollProgressProps {
  /** Bar thickness in px. Defaults to 2. */
  height?: number;
  /** Pin the bar to the top or bottom of the viewport. */
  position?: "top" | "bottom";
  className?: string;
}

/**
 * A reading-progress bar driven by the page scroll position.
 *
 * Motion contract:
 * - scroll: scrollYProgress → scaleX, smoothed by a spring (`scroll.progress`)
 * - reduced: the raw scroll position, no smoothing
 * - none: same as reduced
 *
 * a11y: decorative (`aria-hidden`), never intercepts pointer events, and hidden
 * when printing.
 */
export function ScrollProgress({ height = 2, position = "top", className }: ScrollProgressProps) {
  const cm = useCadenceMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const scaleX = cm.reduced ? scrollYProgress : smooth;

  return (
    <motion.div
      aria-hidden="true"
      data-slot="scroll-progress"
      data-motion={cm.mode}
      style={{ scaleX, height }}
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 origin-left bg-foreground print:hidden",
        position === "top" ? "top-0" : "bottom-0",
        className,
      )}
    />
  );
}
