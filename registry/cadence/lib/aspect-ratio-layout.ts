"use client";

import { type GeometryDestination, naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";
import { knownTextGeometry } from "./motion-transaction";

export type RatioAxis = "width" | "height";
/** Physical border-box frame, independent of writing mode. */
export type RatioFrame = { width: number; height: number };

const replaced = new Set(["IMG", "VIDEO", "CANVAS", "IFRAME", "OBJECT", "EMBED"]);
const sizeProperties =
  /^(width|height|min-width|max-width|min-height|max-height|flex-basis|transform|translate|scale|rotate)$/;

/** An authored physical width/height ratio. `auto`/content ratios stay native. */
export function ratioValue(host: HTMLElement) {
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  const text = css?.aspectRatio.trim() ?? "";
  if (!text || text.startsWith("auto")) return null;
  const [width, height = "1"] = text.split("/").map((part) => part.trim());
  const numerator = Number.parseFloat(width ?? "");
  const denominator = Number.parseFloat(height);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || numerator <= 0 || denominator <= 0) return null;
  const ratio = numerator / denominator;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/** Current native frame. Unknown layout is absent, never zero. */
export function ratioFrame(host: HTMLElement): RatioFrame | null {
  const box = naturalGeometry(host);
  return box ? { width: box.width, height: box.height } : null;
}

/** The one axis a ratio change actually moved; a simultaneous parent constraint
 * or an unmoved frame names no dependent axis and stays native. */
export function ratioAxis(host: HTMLElement, previous: RatioFrame | null): RatioAxis | null {
  const box = ratioFrame(host);
  if (!box || !previous) return null;
  const width = Math.abs(box.width - previous.width) > 0.5;
  const height = Math.abs(box.height - previous.height) > 0.5;
  return width === height ? null : width ? "width" : "height";
}

/** Resolve one native destination for the supported definite/auto layout. The
 * observed box already contains box-sizing, intrinsic and min/max results. */
export function ratioGeometry(host: HTMLElement | null, axis: RatioAxis | null): GeometryDestination | null {
  if (!axis || !host || !host.isConnected) return null;
  if (host.closest("[hidden],[inert]")) return null;
  const box = ratioFrame(host);
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!box || !css) return null;
  if (css.display === "none" || css.visibility === "hidden" || css.boxSizing !== "border-box") return null;
  if (!ratioValue(host)) return null;
  const family = css.transitionProperty.split(",").map((name) => name.trim());
  const times = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some((name, index) => ["all", axis].includes(name) && (times[index % times.length] ?? 0) > 0) ||
    (host.getAnimations?.() ?? []).some(
      (handle) =>
        !knownTextGeometry(handle, "full") &&
        ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) =>
          Object.keys(frame).some((key) => sizeProperties.test(key)),
        ),
    )
  )
    return null;
  const size = box[axis];
  if (!Number.isFinite(size) || size <= 0) return null;
  return { [axis]: { size, min: 0, readable: mediaReadable(host), independent: true } };
}

/** Stretching replaced media through intermediate heights is not a readable
 * intermediate state; the observed destination still commits immediately. */
function mediaReadable(host: HTMLElement) {
  const media = Array.from(host.querySelectorAll("*")).filter((node) => replaced.has(node.tagName));
  if (media.length > motionLimits.collectionVisuals) return false;
  return media.every((node) => {
    const css = host.ownerDocument.defaultView?.getComputedStyle(node);
    return !!css && css.objectFit !== "fill";
  });
}

/** The native frame between commits, so a later ratio change can name its one
 * dependent axis. An in-flight owned size writer is not a passive cause. */
export function observeRatioFrame(host: HTMLElement, record: (frame: RatioFrame) => void) {
  const observer = new ResizeObserver((entries) => {
    const box = entries.find((entry) => entry.target === host)?.borderBoxSize?.[0];
    if (!box || !host.isConnected) return;
    if (
      (host.getAnimations?.() ?? []).some((handle) =>
        ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) =>
          Object.keys(frame).some((key) => key === "width" || key === "height"),
        ),
      )
    )
      return;
    record({ width: box.inlineSize, height: box.blockSize });
  });
  observer.observe(host, { box: "border-box" });
  return () => observer.disconnect();
}
