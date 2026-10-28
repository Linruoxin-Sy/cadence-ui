"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { distance as scaleDistance } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

export interface FadeInProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "children" | "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
  > {
  /** Stagger offset in seconds. Ignored when motion is reduced or off. */
  delay?: number;
  /** Distance in px the content travels while fading in. */
  distance?: number;
  /** Replay the reveal every time the element re-enters the viewport. */
  once?: boolean;
  children: ReactNode;
}

/**
 * Reveals its children once, when they scroll into view.
 *
 * Motion contract:
 * - enter: opacity 0 → 1, y `distance` → 0, `reveal` token (0.22s, ease.out)
 * - reduced: opacity only, `fast` duration, no offset
 * - none: end state immediately
 *
 * a11y: purely visual; it never changes the semantic element or hides content
 * from assistive technology.
 */
export function FadeIn({
  delay = 0,
  distance = scaleDistance.md,
  once = true,
  className,
  children,
  ...props
}: FadeInProps) {
  const cm = useCadenceMotion();
  const hidden = cm.reduced ? { opacity: 0 } : { opacity: 0, y: distance };

  return (
    <motion.div
      data-slot="fade-in"
      data-motion={cm.mode}
      className={cn("will-change-[opacity,transform]", className)}
      initial={hidden}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-10% 0px" }}
      transition={cm.transition("reveal", { delay })}
      {...props}
    >
      {children}
    </motion.div>
  );
}
