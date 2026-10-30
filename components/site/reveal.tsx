"use client";

import { motion, useInView } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { distance, duration, scale } from "@/registry/cadence/lib/motion";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";
import { SIDEBAR_EASE, SIDEBAR_TIMING } from "./easing";

/**
 * Site-only entrance for a row: the element owns the trigger, so a row plays
 * when it first becomes visible instead of when an ancestor tells it to.
 *
 * Two details are deliberate.
 *
 * 1. `useInView` + `animate`, not `whileInView` + `initial`. The sidebar's
 *    `AnimatePresence initial={false}` publishes `initial: false` through the
 *    presence context; on a fresh mount (opening the top-level "Components"
 *    panel, for example) Motion swaps a descendant's `initial` for its
 *    `animate` target, so a `whileInView` row starts already settled and never
 *    plays. Driving `animate` from an observer is independent of that context.
 *
 * 2. `painted` keeps the first paint settled. Without it every row would render
 *    at `opacity: 0` in the server HTML and only animate after hydration. Rows
 *    mounted after the first frame — a disclosure opening — get the entrance;
 *    content that was already on the page is left alone.
 *
 * This is site chrome, not shipped component code: the blur radius stays local
 * rather than becoming a public token. Do not lift this into `registry/cadence`
 * without adding a recipe to `docs/animation-system.md` first.
 */
let painted = false;

const ITEM_BLUR_PX = 2;

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds after the row enters the viewport. Keep it small; this is not an index. */
  delay?: number;
  /** Horizontal travel in px. Defaults to `distance.md`. */
  x?: number;
  /** Scale the row grows from. Defaults to `scale.in`. */
  from?: number;
  /** Blur radius in px at the start of the entrance. */
  blur?: number;
}

export function Reveal({
  children,
  className,
  delay = 0,
  x = distance.md,
  from = scale.in,
  blur = ITEM_BLUR_PX,
}: RevealProps) {
  const cm = useCadenceMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(performance.now());
  const [armed] = useState(() => painted);
  const inView = useInView(ref, { once: true, amount: "some" });

  /**
   * A row that appears near the bottom of the panel has less of the panel's
   * 0.5s left. Scale its entrance down so it lands with the container instead
   * of becoming a second fade after the height has settled. The duration is
   * frozen when the row enters view; later renders must not shorten a running
   * animation.
   *
   * This is a timestamp latch, not render memoization: `useMemo` is the only
   * thing that keeps `performance.now()` from being re-read on every render.
   * React Compiler does not replace it, and neither does a compiler bailout.
   */
  const revealScale = useMemo(() => {
    if (!inView) return 1;
    const elapsed = (performance.now() - mountedAt.current) / 1000;
    const remaining = SIDEBAR_TIMING.panel - elapsed;
    const rowDuration = Math.min(Math.max(remaining, SIDEBAR_TIMING.rowMin), SIDEBAR_TIMING.rowMax);
    return rowDuration / duration.base;
  }, [inView]);

  useEffect(() => {
    // One frame after mount, so StrictMode's double effect cannot arm the first batch.
    const id = requestAnimationFrame(() => {
      painted = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // First-paint rows never animate, so they never need a filter layer; only a
  // row that mounts later carries the blur, and it clears to 0px as it settles.
  const blurry = armed && !cm.reduced;
  const hidden = cm.reduced
    ? { opacity: 0 }
    : { opacity: 0, x, scale: from, ...(blurry ? { filter: `blur(${blur}px)` } : {}) };
  const shown = cm.reduced
    ? { opacity: 1 }
    : { opacity: 1, x: 0, scale: 1, ...(blurry ? { filter: "blur(0px)" } : {}) };

  // `none` and first-paint rows jump straight to the end state; only a row that
  // mounts later waits for its own observer.
  const show = cm.disabled || !armed || inView;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={false}
      animate={show ? shown : hidden}
      transition={
        show
          ? {
              ...cm.transition("reveal", { delay: cm.reduced ? 0 : delay, timeScale: revealScale }),
              ease: SIDEBAR_EASE,
            }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}
