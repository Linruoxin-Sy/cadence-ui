"use client";

import { type GeometryDestination, naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";

/**
 * One avatar root or group shell measures its committed native border box on both
 * physical axes. Only an explicit `size` change or a membership revision calls
 * this: image decode, caller CSS and passive parent resizing stay native, and the
 * saved destination is inherited from the real box rather than recomputed.
 */
export function avatarDestination(host: HTMLElement): GeometryDestination | null {
  if (!host.isConnected) return null;
  const box = naturalGeometry(host);
  if (!box || !(box.width > 0) || !(box.height > 0)) return null;
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!css || css.aspectRatio !== "auto") return null;
  if (host.children.length > motionLimits.collectionVisuals) return null;
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) =>
        ["all", "width", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    )
  )
    return null;
  if (
    host
      .getAnimations?.()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) => Object.keys(frame).some((key) => key === "width" || key === "height")),
      )
  )
    return null;
  return {
    width: { size: box.width, min: 0, readable: true, independent: true },
    height: { size: box.height, min: 0, readable: true, independent: true },
  };
}
