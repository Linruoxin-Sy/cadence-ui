"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { clampMeasuredSize } from "@/registry/cadence/lib/geometry";
import { useCadenceMotion } from "@/registry/cadence/lib/provider";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface MeasuredHeightProps {
  children: ReactNode;
  /**
   * Classes for the measured box. Padding belongs here rather than on a parent:
   * the wrapper clips as the height grows, so a focus ring or a card shadow the
   * preview paints just outside its own box has to stay inside the padding.
   */
  className?: string;
}

/**
 * A box that follows its content's height instead of snapping to it.
 *
 * The preview frame shows a `Skeleton` while the page's `dynamic()` import
 * resolves; the real preview then commits at a different height and the card
 * jumped in a single frame, moving every heading below it. This wrapper animates
 * that change.
 *
 * Recipe: `geometry.resize` — measured, clamped, and instant under `reduced` /
 * `none` (see animation-system §3.2). Two details keep it from flashing:
 *
 * 1. **The height is explicit after the first measurement.** The wrapper never
 *    returns to `auto`, so when new content commits the browser lays it out
 *    *inside the previous height*; the spring then starts from a size the reader
 *    is already looking at, not from the new one.
 * 2. **It observes the content, not the wrapper.** The `ResizeObserver` watches
 *    the inner box, whose height is still `auto`. Animating the wrapper does not
 *    resize the observed element, so the observer cannot feed its own animation
 *    (the same rule `select` relies on for its trigger width).
 *
 * The measurement is seeded in a layout effect as well, because the observer's
 * first delivery is a frame late: without it the first paint would show the
 * wrapper at `auto` and the seed would arrive as a second, unanimated layout.
 * That seed jumps rather than animates — it is the placeholder's own height, and
 * a card that grows out of nothing on arrival would be the wrong entrance.
 *
 * This is site chrome, not shipped component code: it uses the recipe and the
 * clamp from `lib/`, and adds no token of its own.
 */
export function MeasuredHeight({ children, className }: MeasuredHeightProps) {
  const cm = useCadenceMotion();
  const height = useMotionValue<number | "auto">("auto");
  const boxRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  /** The size a settling spring must not cross: the new height while shrinking. */
  const floor = useRef(0);

  const rendered = useTransform(height, (value) =>
    typeof value === "number" ? clampMeasuredSize(value, floor.current) : value,
  );

  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const settle = (next: number) => {
      if (!next) return;
      const current = height.get();

      // First measurement, and every mode that must not animate geometry.
      if (current === "auto" || cm.reduced) {
        floor.current = 0;
        height.jump(next);
        target.current = next;
        return;
      }

      // A spring that inherits velocity can cross its target once. Below the
      // target on the way up is the animation itself; on the way down it would
      // clip the content, so clamp in that direction only.
      floor.current = next < current ? next : 0;
      if (target.current === next) return;
      target.current = next;
      animate(height, next, cm.transition("geometry.resize"));
    };

    settle(box.getBoundingClientRect().height);

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const block = entry.borderBoxSize[0];
      settle(block ? block.blockSize : box.getBoundingClientRect().height);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [cm, height]);

  return (
    <motion.div data-preview-body="" data-motion={cm.mode} style={{ height: rendered }} className="overflow-hidden">
      <div ref={boxRef} className={className}>
        {children}
      </div>
    </motion.div>
  );
}
