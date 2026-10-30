/**
 * Geometry helpers shared by the measured-size and handoff recipes.
 *
 * They are pure so a caller can measure inside the event that starts the
 * transition — before the popup unmounts — and so the clamp rule can be tested
 * without a DOM. The hook that owns the animated motion value belongs with the
 * first consumer (`select`); the math and the safety rule do not.
 */

/** The four numbers a measurement needs; `DOMRect` satisfies it. */
export type OriginRect = Pick<DOMRect, "left" | "top" | "width" | "height">;

export interface Origin {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

/**
 * The inverted transform that starts a handoff at its source.
 *
 * `target` must be the destination's *final* rect, not the rect it has while
 * the surface is still resizing: measuring against an animating box makes the
 * flight drift as the width settles. Capture both rects in the event that
 * starts the handoff, before the source unmounts.
 */
export function measureOrigin(source: OriginRect, target: OriginRect): Origin {
  return {
    x: source.left - target.left,
    y: source.top - target.top,
    scaleX: target.width > 0 ? source.width / target.width : 1,
    scaleY: target.height > 0 ? source.height / target.height : 1,
  };
}

/**
 * Keep a measured spring from dipping under the closed size.
 *
 * A critically damped spring can still cross its target once when it inherits
 * velocity from a fast retarget; a few pixels under the new label's width is
 * enough to ellipsize it and nudge the chevron. Clamp the *rendered* value, not
 * the spring, so the physical motion stays continuous.
 */
export function clampMeasuredSize(value: number, min: number): number {
  return Math.max(value, min);
}
