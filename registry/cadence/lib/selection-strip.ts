"use client";

import { naturalGeometry } from "./measured-geometry";
import { motionLimits } from "./motion";
import type { SelectionBox } from "./selection-projection";
import type { TabsStripSnapshot } from "./tabs-layout";

/** Derive the actual CSS scale; offsetWidth is integer-rounded and must not
 * invent a fractional scale on an ordinary untransformed strip. */
export function selectionScale(element: HTMLElement) {
  let x = 1,
    y = 1,
    current: HTMLElement | null = element;
  for (let depth = 0; current && depth < 32; depth++, current = current.parentElement) {
    const css = getComputedStyle(current);
    const matrix = css.transform === "none" ? null : new DOMMatrixReadOnly(css.transform);
    if (
      css.rotate !== "none" ||
      css.perspective !== "none" ||
      css.offsetPath !== "none" ||
      (matrix && (!matrix.is2D || matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0))
    )
      return null;
    const scale = css.scale === "none" ? [1, 1] : css.scale.split(/\s+/).map(Number);
    const zoom = css.zoom === "normal" ? 1 : Number(css.zoom);
    const sx = (scale[0] ?? 1) * (matrix?.a ?? 1) * zoom,
      sy = (scale[1] ?? scale[0] ?? 1) * (matrix?.d ?? 1) * zoom;
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx <= 0 || sy <= 0) return null;
    x *= sx;
    y *= sy;
  }
  return current || !Number.isFinite(x) || !Number.isFinite(y) ? null : { x, y };
}

export function selectionStripSnapshot(
  list: HTMLElement,
  strip: HTMLElement,
  records: { host: HTMLElement; active: boolean }[],
  marker: SelectionBox | null,
  orientation: string,
): TabsStripSnapshot | null {
  if (
    records.length > motionLimits.collectionVisuals ||
    !list.getClientRects().length ||
    !strip.getClientRects().length
  )
    return null;
  const css = getComputedStyle(list),
    bounds = list.getBoundingClientRect();
  const axis = orientation === "vertical" ? "height" : "width";
  const intrinsic = list.computedStyleMap?.().get(axis)?.toString();
  if (
    !intrinsic ||
    !["auto", "fit-content", "max-content"].includes(intrinsic) ||
    css.writingMode !== "horizontal-tb" ||
    css.aspectRatio !== "auto"
  )
    return null;
  const native = naturalGeometry(list);
  if (!native) return null;
  const properties = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    properties.some(
      (property, index) =>
        ["all", "width", "height", "transform", "translate", "scale", "rotate"].includes(property) &&
        (durations[index % durations.length] ?? 0) > 0,
    ) ||
    list
      .getAnimations()
      .some((a) =>
        (a.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) => ["width", "height", "transform", "translate", "scale", "rotate"].some((p) => p in frame)),
      )
  )
    return null;
  const scale = selectionScale(list);
  const sx = scale?.x ?? 0,
    sy = scale?.y ?? 0;
  if (!(sx > 0 && sy > 0)) return null;
  const items = new Map<HTMLElement, SelectionBox>();
  for (const { host } of records) {
    if (host.parentElement !== strip || !host.getClientRects().length) return null;
    const paint = getComputedStyle(host);
    if (
      [paint, css].some(
        (s) =>
          s.transform !== "none" ||
          s.translate !== "none" ||
          s.scale !== "none" ||
          s.rotate !== "none" ||
          /fixed|sticky/.test(s.position),
      )
    )
      return null;
    if (
      host
        .getAnimations()
        .some((a) =>
          (a.effect as KeyframeEffect | null)
            ?.getKeyframes()
            .some((f) => ["transform", "translate", "scale", "rotate"].some((p) => p in f)),
        )
    )
      return null;
    const rect = host.getBoundingClientRect();
    items.set(host, {
      x: (rect.left - bounds.left) / sx + list.scrollLeft - list.clientLeft,
      y: (rect.top - bounds.top) / sy + list.scrollTop - list.clientTop,
      width: rect.width / sx,
      height: rect.height / sy,
    });
  }
  return {
    axis,
    size: native[axis],
    items,
    marker,
    strip,
    inlineSize: strip.getBoundingClientRect().width / sx,
    blockSize: strip.getBoundingClientRect().height / sy,
    selected: records.find((record) => record.active)?.host,
    crossWidth:
      orientation === "vertical" &&
      ["auto", "fit-content", "max-content"].includes(list.computedStyleMap?.().get("width")?.toString() ?? "")
        ? native.width
        : undefined,
    crossHeight:
      orientation !== "vertical" &&
      ["auto", "fit-content", "max-content"].includes(list.computedStyleMap?.().get("height")?.toString() ?? "")
        ? native.height
        : undefined,
    clipped: (axis === "width" ? css.overflowX : css.overflowY) !== "visible",
    crossClipped: (axis === "width" ? css.overflowY : css.overflowX) !== "visible",
  };
}
