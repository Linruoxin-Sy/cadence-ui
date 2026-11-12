"use client";

import { type GeometryDestination, naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";
import { nativeTextContext } from "./text-layout";

/** One row's own committed block size: known children, native auto height and no
 * caller dimension engine. Anything unresolved keeps native layout. */
export function itemDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const box = naturalGeometry(host);
  const css = getComputedStyle(host);
  if (
    !box ||
    !["auto", "fit-content", "max-content"].includes(host.computedStyleMap?.().get("height")?.toString() ?? "") ||
    css.aspectRatio !== "auto"
  )
    return null;
  const parts = Array.from(host.children);
  if (parts.length > motionLimits.collectionVisuals) return null;
  let depth = 0;
  for (let ancestor: HTMLElement | null = host; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > motionLimits.collectionVisuals) return null;
    const style = getComputedStyle(ancestor);
    if (
      style.rotate !== "none" ||
      style.perspective !== "none" ||
      style.transform.startsWith("matrix3d") ||
      (style.scale !== "none" && style.scale.split(/\s+/).some((value) => !(Number.parseFloat(value) > 0)))
    )
      return null;
    if (style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return null;
    }
  }
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => ["all", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    ) ||
    host
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "height" in frame),
      )
  )
    return null;
  const rect = host.getBoundingClientRect();
  const scale = rect.height / host.offsetHeight;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  // Preserve the destination's visible text, line clamp and action/focus room.
  const required = Math.max(0, ...parts.map((part) => (part.getBoundingClientRect().bottom - rect.top) / scale));
  let max = Number.POSITIVE_INFINITY;
  const parent = host.parentElement;
  if (parent && /^(hidden|clip)$/.test(getComputedStyle(parent).overflowY)) {
    max = (parent.getBoundingClientRect().bottom - rect.top) / scale;
    if (!Number.isFinite(max) || max < box.height) return null;
  }
  return { height: { size: box.height, min: Math.min(box.height, required), max, readable: true, independent: true } };
}
