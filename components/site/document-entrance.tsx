"use client";

import { motion, useInView } from "motion/react";
import { type ReactNode, type RefObject, useRef, useState } from "react";
import { distance, duration, ease } from "@/registry/cadence/lib/motion";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";

/**
 * Site-only entrance for the page's content `<article>`. It animates that
 * element from the outside; the `.typeset` container and the document elements
 * inside it are not animated individually. On a component page the article also
 * holds the breadcrumb, header, and preview, so the entrance covers the whole
 * article rather than a markdown-only slot.
 *
 * It is deliberately outside `registry/cadence/**`: a document is not a
 * component a reader installs, and the reveal is louder than the shipped motion
 * contract allows (a whole-body blur and a clip wipe). The tokens still decide
 * the timing — `timeScale` ratios keep the reduced 0.6 factor and the `none`
 * zero — but the travel and blur are local.
 *
 * The effect is four properties on one layer:
 *
 * 1. `y` travels up from `distance.lg`, so the body rises into place;
 * 2. `opacity` settles from 0, so it arrives rather than appears;
 * 3. `filter: blur()` clears, so the first readable frame is still moving;
 * 4. `clipPath` starts as a zero-height window (`inset(0 0 100% 0)`) and opens
 *    downward. It runs on `duration.slow` with `ease.inOut` rather than the
 *    body's `duration.page` with `ease.out`: the edge moves immediately and
 *    steadily, and the content's lift, fade, and blur are already in progress as
 *    it uncovers them, instead of finishing behind a still-closed clip.
 *
 * The clip is a measured-geometry idea without a measurement: the box keeps its
 * full height, so the page does not reflow and nothing below is pulled upward.
 * It is also the reason `useInView`, not a mount effect, owns the trigger — a
 * clipped body that is below the fold should stay for the reader who scrolls to
 * it, not play unseen when the page loads.
 *
 * Two hygiene details:
 *
 * - `initial` is the hidden state, not `false`, so the server HTML paints the
 *   body hidden and hydration has no visible frame to undo. A `<noscript>` rule
 *   in the root layout restores it when JavaScript never runs.
 * - `onAnimationComplete` settles the target to `filter: none`, `clip-path:
 *   none`, and `transform: none`. They are visually identical to the end values,
 *   but a permanent `clip-path` would clip focus rings and a permanent filter
 *   layer would keep the whole document composited. A zero-duration second pass
 *   makes those the target, so a later render (the component page's preview can
 *   re-render after the entrance) cannot re-apply the entrance values.
 *
 * Under `reduced` the neutral motion values are kept in the target rather than
 * omitted. They are not animated; they overwrite whatever the server painted
 * with the full-mode initial state before hydration, and they keep a mid-flight
 * mode change from stranding a clip or filter on the element.
 */

/** The body is a page-sized block, so it rides `duration.page`, not `duration.base`. */
const ENTRANCE_TIME_SCALE = duration.page / duration.base;

/** The wipe is quicker than the body it uncovers, so the two motions overlap. */
const CLIP_TIME_SCALE = duration.slow / duration.base;
const CLIP_EASE = [...ease.inOut] as [number, number, number, number];

/** Site-only: the library caps blur at 4px, which is the whole budget for one layer. */
const BODY_BLUR_PX = 4;

const CLIP_HIDDEN = "inset(0% 0% 100% 0%)";
const CLIP_SHOWN = "inset(0% 0% 0% 0%)";

/** The settled target: the entrance properties are gone, not just at zero. */
const RESTING = { opacity: 1, y: 0, filter: "none", clipPath: "none" } as const;

export interface DocumentEntranceProps {
  children: ReactNode;
  className?: string;
  /** Match the element the page already uses for the document slot. */
  as?: "article" | "div" | "section";
}

export function DocumentEntrance({ children, className, as = "div" }: DocumentEntranceProps) {
  const cm = useCadenceMotion();
  const ref = useRef<HTMLElement>(null);
  const [settled, setSettled] = useState(false);
  const inView = useInView(ref, { once: true, amount: "some" });

  /**
   * `reduced` names the neutral values instead of omitting them. The element may
   * already hold the server's full-mode styles, and Motion re-applies whatever a
   * property's target says; `none` is the resting value that keeps the document
   * unclipped and unfiltered for the rest of the visit.
   */
  const hidden = cm.reduced
    ? { opacity: 0, y: 0, filter: "none", clipPath: "none" }
    : { opacity: 0, y: distance.lg, filter: `blur(${BODY_BLUR_PX}px)`, clipPath: CLIP_HIDDEN };

  const shown = cm.reduced ? RESTING : { opacity: 1, y: 0, filter: "blur(0px)", clipPath: CLIP_SHOWN };

  /**
   * These ratios are relative to the site, not absolute: a per-call `timeScale`
   * replaces the provider's, so the header's speed gear has to be multiplied in
   * here or the page entrance would keep its authored timing while every
   * component around it slowed down.
   */
  const scale = ENTRANCE_TIME_SCALE * cm.timeScale;
  const clipScale = CLIP_TIME_SCALE * cm.timeScale;
  const entrance = cm.transition("reveal", { timeScale: scale });
  const clip = { ...cm.transition("reveal", { timeScale: clipScale }), ease: CLIP_EASE };
  const transition = cm.reduced
    ? {
        ...entrance,
        // The full-mode server styles must disappear in the frame the mode
        // resolves, not over the fade. Opacity is the only property that animates.
        y: { duration: 0 },
        filter: { duration: 0 },
        clipPath: { duration: 0 },
      }
    : { ...entrance, clipPath: clip };

  const show = cm.disabled || inView;
  const target = show ? (settled ? RESTING : shown) : hidden;
  const activeTransition = show ? (settled ? { duration: 0 } : transition) : { duration: 0 };

  const motionProps = {
    "data-document-entrance": true,
    className,
    initial: hidden,
    animate: target,
    transition: activeTransition,
    onAnimationComplete: show && !settled ? () => setSettled(true) : undefined,
  };

  if (as === "article") {
    return (
      <motion.article ref={ref} {...motionProps}>
        {children}
      </motion.article>
    );
  }

  if (as === "section") {
    return (
      <motion.section ref={ref} {...motionProps}>
        {children}
      </motion.section>
    );
  }

  return (
    <motion.div ref={ref as RefObject<HTMLDivElement>} {...motionProps}>
      {children}
    </motion.div>
  );
}
