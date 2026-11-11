"use client";

import { motionLimits } from "./motion";

type Neutral = { value: number; alpha: number };
type Interval = [number, number];
const contexts = new WeakMap<Document, CanvasRenderingContext2D>();

export function toggleGroupColourScope(node: Element) {
  return node.closest<HTMLElement>('[data-slot="toggle-group"]');
}

/** A bounded proof of the named rendered regions, not a text/colour scanner.
 * Neutral endpoint intervals cover arbitrary relative clocks, including one
 * foreground settling on focus while a separate plate is still transitioning.
 * Unknown/final caller palettes are preserved through immediate cascade paint.
 */
export function toggleGroupColourReadable(node: Element) {
  const list = toggleGroupColourScope(node);
  if (!list) return false;
  const background = backdrop(list);
  if (!background) return false;
  const targets = list.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
  if (targets.length > motionLimits.collectionVisuals) return false;
  const marker = list.querySelector<HTMLElement>('[data-slot="toggle-group-indicator"]');
  for (const trigger of targets) {
    if (
      toggleGroupColourScope(trigger) !== list ||
      (node.getAttribute("data-slot") === "toggle-group-item" && trigger !== node)
    )
      continue;
    let surface = composite(colours(trigger, "background-color"), background);
    if (marker && !marker.hidden && marker.getAttribute("data-variant") !== "line")
      surface = composite(colours(marker, "background-color"), background);
    const local = trigger.querySelector<HTMLElement>('[data-slot="toggle-group-local-indicator"]');
    if (local) {
      const filled = composite(colours(local, "background-color"), background);
      if (!filled || !surface) return false;
      surface = [Math.min(surface[0], filled[0]), Math.max(surface[1], filled[1])];
    }
    const foreground = colours(trigger, "color");
    if (!surface || !foreground) return false;
    const ink = composite(foreground, surface);
    if (!ink || (ink[0] <= surface[1] && ink[1] >= surface[0])) return false;
    const luminance = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    const low = ink[1] < surface[0] ? luminance(ink[1]) : luminance(surface[1]);
    const high = ink[1] < surface[0] ? luminance(surface[0]) : luminance(ink[0]);
    if ((high + 0.05) / (low + 0.05) < 4.5) return false;
  }
  return true;
}

function colours(node: Element, property: "background-color" | "color"): Neutral[] | null {
  const view = node.ownerDocument.defaultView;
  if (!view || typeof view.CanvasRenderingContext2D === "undefined") return null;
  if (property === "background-color" && view.getComputedStyle(node).backgroundImage !== "none") return null;
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
