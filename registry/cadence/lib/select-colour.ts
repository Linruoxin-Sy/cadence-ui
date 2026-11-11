"use client";

import { motionLimits } from "./motion";

type Neutral = { value: number; alpha: number };
type Interval = [number, number];
const contexts = new WeakMap<Document, CanvasRenderingContext2D>();

export function selectColourScope(node: Element) {
  return (
    node.closest<HTMLElement>('[data-slot="select-trigger"],[data-slot="select-content"]') ?? (node as HTMLElement)
  );
}

/** Prove this actual region against its rendered neutral backdrop and all endpoints.
 * Unknown/custom palettes settle to their native cascade, independently of other regions. */
export function selectColourReadable(node: Element) {
  const surface = backdrop(node);
  const foreground = colours(node, "color");
  const ink = composite(foreground, surface);
  if (!surface || !ink || (ink[0] <= surface[1] && ink[1] >= surface[0])) return false;
  const luminance = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const low = ink[1] < surface[0] ? luminance(ink[1]) : luminance(surface[1]);
  const high = ink[1] < surface[0] ? luminance(surface[0]) : luminance(ink[0]);
  return (high + 0.05) / (low + 0.05) >= 4.5;
}

export function safeSelectPaint(props: { className?: unknown; style?: unknown }) {
  if (typeof props.className === "function" || typeof props.style === "function") return false;
  if (
    Object.keys(props.style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !String(props.className ?? "")
    .split(/\s+/)
    .some((token) => {
      const name = token.split(":").pop() ?? "";
      return (
        /^(bg-|text-|border-|shadow-|ring-)/.test(name) &&
        !/^(?:bg-(?:transparent|input\/(?:30|50)|popover|accent|border)|text-(?:popover-foreground|accent-foreground|muted-foreground|foreground|sm|xs)|border-(?:input|ring|destructive)|shadow-(?:xs|md)|ring-(?:ring\/50|destructive\/(?:20|40)|\[3px\]))$/.test(
          name,
        )
      );
    });
}

function colours(node: Element, property: "background-color" | "color"): Neutral[] | null {
  const view = node.ownerDocument.defaultView;
  if (!view || typeof view.CanvasRenderingContext2D === "undefined") return null;
  let context = contexts.get(node.ownerDocument);
  if (!context) {
    const canvas = node.ownerDocument.createElement("canvas");
    canvas.width = canvas.height = 1;
    context = canvas.getContext("2d", { willReadFrequently: true }) ?? undefined;
    if (!context) return null;
    contexts.set(node.ownerDocument, context);
  }
  const values = [view.getComputedStyle(node).getPropertyValue(property)];
  const key = property === "color" ? "color" : "backgroundColor";
  for (const animation of node.getAnimations()) {
    if (!("transitionProperty" in animation) || animation.transitionProperty !== property) continue;
    for (const frame of (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [])
      if (typeof frame[key] === "string") values.push(frame[key]);
  }
  const result: Neutral[] = [];
  for (const value of new Set(values)) {
    if (!view.CSS.supports("color", value)) return null;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
    if (a && Math.max(r, g, b) !== Math.min(r, g, b)) return null;
    result.push({ value: (r + g + b) / (3 * 255), alpha: a / 255 });
  }
  return result;
}
function composite(colours: Neutral[] | null, background: Interval | null): Interval | null {
  if (!colours?.length || (!background && colours.some((colour) => colour.alpha !== 1))) return null;
  const values = colours.flatMap(({ value, alpha }) =>
    (background ?? [0, 0]).map((base) => value * alpha + base * (1 - alpha)),
  );
  return [Math.min(...values), Math.max(...values)];
}
function backdrop(node: Element) {
  const ancestry: Element[] = [];
  for (let current: Element | null = node; current; current = current.parentElement) {
    if (ancestry.length >= motionLimits.collectionVisuals) return null;
    ancestry.push(current);
  }
  let interval: Interval | null = null;
  for (const current of ancestry.reverse()) {
    const values = colours(current, "background-color");
    if (!values) return null;
    if (!interval && values.every((value) => value.alpha === 0)) continue;
    interval = composite(values, interval);
    if (!interval) return null;
  }
  return interval;
}
