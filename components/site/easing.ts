import { duration, ease } from "@/registry/cadence/lib/motion";

/**
 * Site-only ease: the library's `ease.out`, `cubic-bezier(0.22, 1, 0.36, 1)`,
 * tried against the synchronized 0.5s panel and adaptive row timing.
 *
 * It is more front-loaded than the power curve (`1 - (1 - x)^1.5`): the panel
 * reaches ~99% by 60% of the timeline, so its own last 100ms is almost static.
 * The adaptive row timing removes the old post-panel fade, but it cannot make
 * the container's tail move. If the stop still reads as a pause, switch this
 * back to the power curve — it leaves ~3% of the travel for the last 10%.
 *
 * Not a Cadence token in the sense of a public API: the library's `ease.out`
 * is shared, but this panel-specific timing decision stays here.
 */
export const SIDEBAR_EASE: [number, number, number, number] = [...ease.out] as [number, number, number, number];

/**
 * Site-tuned timing for the sidebar. The panel runs slightly past the page
 * token so the last row — which only becomes visible at the bottom — has time
 * to finish. `rowMax` is the slow-token ceiling; the adaptive row timing shortens
 * a row that appears when the panel is already nearly open, so the row and the
 * container stop together instead of the row fading on after the height ends.
 */
export const SIDEBAR_TIMING = {
  panel: 0.5,
  rowMax: duration.slow,
  rowMin: 0.12,
} as const;

/**
 * The exaggerated item entrance: 32px in from the right, 12% smaller, 6px blur.
 * This is deliberately outside the library's shipped limits (`distance.md` is
 * 12px, `scale.in` is 0.96, and the motion doc caps blur at 4px); the sidebar is
 * site chrome, not a component a user installs.
 */
export const SIDEBAR_ITEM = {
  x: 32,
  from: 0.88,
  blur: 6,
} as const;
