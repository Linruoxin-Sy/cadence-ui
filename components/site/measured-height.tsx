"use client";

import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface MeasuredHeightProps {
  children: ReactNode;
  /**
   * Classes for the measured box. Padding belongs here rather than on a parent:
   * the wrapper clips the content it measures, so a focus ring or a card shadow
   * the preview paints just outside its own box has to stay inside the padding.
   */
  className?: string;
}

/**
 * A box that is as tall as its content, measured instead of animated.
 *
 * Two things arrive at a height that is not what is on screen: the `Skeleton`
 * the frame shows while a page's `dynamic()` import resolves, and every example
 * that changes its own size afterwards — a folded code block unfolding, a select
 * whose trigger grows with its value. This wrapper keeps *its own* height equal
 * to what it measures, so the border around the preview never lags behind the
 * thing the reader is watching.
 *
 * It used to tween that height with `geometry.resize`, which was the wrong tool,
 * and the trace says why: the content it watches is itself animated on the same
 * recipe, so the target moved on every `ResizeObserver` delivery — about 95 a
 * second — and each delivery started a new spring. A restart throws away the
 * progress the last one made, so the spring never accelerated: it crawled at a
 * near-constant rate (an exponential lag, τ ≈ 0.8s) until the content stopped,
 * and only then ran one real spring for the last three quarters of the distance.
 * On screen that reads as an easing curve: 0.9s after the click the card was
 * still sliding while the code block had long since settled.
 *
 * So there is no tween here, and no recipe or token: the height is written in the
 * frame the content changed, and the only motion on screen is the motion the
 * content itself is doing. That is measured geometry applied at once, which
 * ADR-015 separates from motion — `full`, `reduced` and `none` therefore render
 * exactly the same box.
 *
 * Two details keep it honest:
 *
 * 1. **It observes the content, not the wrapper.** The wrapper's height is
 *    explicit, so watching it would report the number this code just wrote.
 * 2. **The first measurement lands before paint.** It is seeded in a layout
 *    effect, because the observer's first delivery is a frame late, and a frame
 *    of the placeholder's height around the new content is a visible flash.
 */
export function MeasuredHeight({ children, className }: MeasuredHeightProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;

    /**
     * Written to the node rather than to state: React commits after the frame,
     * and a size that arrives a frame late is a size the reader sees twice.
     * `auto` until there is a real number — a hidden preview, or one mounted
     * inside a collapsed panel, reports zero, and pinning to it would collapse
     * the frame the reader is about to see.
     */
    const sync = () => {
      const height = content.getBoundingClientRect().height;
      if (!height) {
        box.style.removeProperty("height");
        return;
      }
      box.style.height = `${height}px`;
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(content);
    return () => {
      observer.disconnect();
      box.style.removeProperty("height");
    };
  }, []);

  return (
    <div ref={boxRef} data-preview-body="" className="overflow-hidden">
      <div ref={contentRef} className={className}>
        {children}
      </div>
    </div>
  );
}
