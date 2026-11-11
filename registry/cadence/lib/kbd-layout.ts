"use client";

import { animateSingleValue, motionValue } from "motion/react";
import { bindMotionParameters, geometryCompact, layoutCompact, motionLimits } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import {
  createMotionTransaction,
  type MotionLease,
  type MotionRevision,
  registerTextGeometry,
} from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type KbdBox = { width: number; x: number };
type Sample = KbdBox & { widthVelocity: number; xVelocity: number };

/** The chord reserves final strip allocation; it never observes spring frames as targets. */
export function createKbdExtent(
  host: MotionHostRef<HTMLElement>,
  content: HTMLElement,
  transaction = createMotionTransaction(),
) {
  const node = host.current;
  if (!node) throw new Error("Kbd extent requires a committed group");
  const owner = transaction.register(node),
    allocation = transaction.register(content);
  const width = motionValue(0);
  let baseline: number | null = null,
    effect: Animation | null = null,
    strip: Animation | null = null;
  let lease: MotionLease | null = null,
    stripLease: MotionLease | null = null;
  let alive = true,
    restricted = false,
    bounds = [0, 0];
  let height = 0,
    passive = () => {};
  const value = () => Math.min(bounds[1] ?? 0, Math.max(bounds[0] ?? 0, width.get()));
  const stop = () => {
    width.stop();
    effect?.cancel();
    strip?.cancel();
    effect = strip = null;
    const a = lease,
      b = stripLease;
    lease = stripLease = null;
    a?.cancel();
    b?.cancel();
  };
  const off = width.on("change", () => {
    if (alive && node === host.current && lease?.current())
      (effect?.effect as KeyframeEffect | null)?.setKeyframes({ width: `${value()}px` });
  });
  const observer = new ResizeObserver((entries) => {
    const box = entries.find((entry) => entry.target === node)?.borderBoxSize?.[0];
    if (baseline === null || !box) return;
    if (Math.abs(box.inlineSize - (effect ? value() : baseline)) > 1 || Math.abs(box.blockSize - height) > 1) {
      stop();
      baseline = null;
      passive();
    }
  });
  observer.observe(node, { box: "border-box" });
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    restricted = environment.hidden || environment.reduced || environment.immediate;
    if (restricted) {
      stop();
      baseline = null;
    }
  });
  return {
    prepare() {
      const sample =
        baseline === null ? null : { width: effect ? value() : baseline, velocity: effect ? width.getVelocity() : 0 };
      stop();
      return sample;
    },
    commit(input: {
      cm: CadenceMotion;
      revision: MotionRevision;
      destination: number | null;
      allocation: number | null;
      origin: { width: number; velocity: number } | null;
      available: boolean;
      clipped: boolean;
      delegate?: boolean;
      complete?: () => void;
      passive?: () => void;
    }) {
      const geometry = input.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
      if (geometry.kind !== "geometry") return;
      stop();
      baseline = input.destination;
      height = node.offsetHeight;
      passive = input.passive ?? (() => {});
      const target = input.destination,
        start = input.origin;
      if (
        !alive ||
        node !== host.current ||
        !node.isConnected ||
        target === null ||
        input.allocation === null ||
        !Number.isFinite(input.allocation) ||
        input.allocation <= 0 ||
        !start ||
        !input.available ||
        restricted ||
        input.cm.reduced ||
        geometry.transition.duration === 0 ||
        !input.revision.current() ||
        !node.animate ||
        !content.animate ||
        ![start.width, target].every(Number.isFinite) ||
        Math.min(start.width, target) <= 0 ||
        (input.clipped && target > start.width)
      )
        return;
      const visuals = new Set([node, content]);
      stripLease = allocation.begin(input.revision, ["width"], { collectionVisuals: visuals }, stop);
      if (!stripLease) {
        stop();
        return;
      }
      strip = content.animate({ width: `${input.allocation}px` }, { duration: 0, fill: "both" });
      registerTextGeometry(strip, stripLease, input.cm.mode);
      if (input.delegate || target === start.width) return;
      lease = owner.begin(input.revision, ["width"], { collectionVisuals: visuals }, stop);
      if (!lease) {
        stop();
        return;
      }
      bounds = [Math.min(start.width, target), Math.max(start.width, target)];
      width.jump(start.width);
      effect = node.animate({ width: `${start.width}px` }, { duration: 0, fill: "both" });
      registerTextGeometry(effect, lease, input.cm.mode);
      const active = lease;
      animateSingleValue(width, target, {
        ...geometry.transition,
        velocity: start.velocity,
        onComplete: () => {
          if (active.current()) {
            effect?.cancel();
            effect = null;
            lease?.finish();
            lease = null;
            input.complete?.();
          }
        },
      });
    },
    releaseAllocation() {
      if (effect) return;
      strip?.cancel();
      strip = null;
      const held = stripLease;
      stripLease = null;
      held?.finish();
    },
    dispose() {
      alive = false;
      stop();
      owner.dispose();
      allocation.dispose();
      off();
      unsubscribe();
      observer.disconnect();
    },
  };
}

/** A key's border box and sibling projection have disjoint property leases.
 * The chord supplies final boxes once; scalar callbacks never measure layout. */
export function createKbdKey(host: MotionHostRef<HTMLElement>, transaction = createMotionTransaction()) {
  const node = host.current;
  if (!node) throw new Error("Kbd requires a committed key");
  const identity = host.identity;
  const owner = transaction.register(node);
  const positionOwner = transaction.register(node);
  const width = motionValue(0),
    x = motionValue(0);
  let baseline: KbdBox | null = null;
  let sizeEffect: Animation | null = null,
    positionEffect: Animation | null = null;
  let sizeLease: MotionLease | null = null,
    positionLease: MotionLease | null = null;
  let bounds = [0, 0];
  let alive = true,
    restricted = false;
  let previous: MotionRevision | null = null,
    signature = "";
  let offset = () => 0;
  let changed = () => {};
  let passive = () => {};
  let height = 0;
  let label: HTMLElement | null = null,
    labelWidth = 0,
    labelHeight = 0;
  const current = () => alive && node.isConnected && host.current === node && host.identity === identity;
  const renderedWidth = () => Math.min(bounds[1] ?? 0, Math.max(bounds[0] ?? 0, width.get()));
  const stop = () => {
    width.stop();
    x.stop();
    sizeEffect?.cancel();
    positionEffect?.cancel();
    sizeEffect = positionEffect = null;
    const a = sizeLease,
      b = positionLease;
    sizeLease = positionLease = null;
    a?.cancel();
    b?.cancel();
  };
  const write = () => {
    if (!current()) return;
    if (sizeLease?.current())
      (sizeEffect?.effect as KeyframeEffect | null)?.setKeyframes({ width: `${renderedWidth()}px` });
    if (positionLease?.current())
      (positionEffect?.effect as KeyframeEffect | null)?.setKeyframes({
        transform: `translate(${x.get() - offset()}px,0px)`,
      });
  };
  const offWidth = width.on("change", () => {
    write();
    changed();
  });
  const offX = x.on("change", write);
  const settleNative = () => {
    stop();
    baseline = null;
    changed();
    passive();
  };
  const observer = new ResizeObserver((entries) => {
    const ink = entries.find((entry) => entry.target === label)?.borderBoxSize?.[0];
    if (ink && (Math.abs(ink.inlineSize - labelWidth) > 1 || Math.abs(ink.blockSize - labelHeight) > 1)) {
      settleNative();
      return;
    }
    const box = entries.find((entry) => entry.target === node)?.borderBoxSize?.[0];
    if (!box || !baseline) return;
    const expected = sizeEffect ? renderedWidth() : baseline.width;
    if (Math.abs(box.inlineSize - expected) > 1 || Math.abs(box.blockSize - height) > 1) settleNative();
  });
  observer.observe(node, { box: "border-box" });
  node.ownerDocument.defaultView?.addEventListener("resize", settleNative);
  node.ownerDocument.fonts?.addEventListener("loadingdone", settleNative);
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    restricted = environment.hidden || environment.reduced || environment.immediate;
    if (restricted) {
      stop();
      baseline = null;
      changed();
    }
  });
  const sample = (): Sample | null =>
    baseline
      ? {
          width: sizeEffect ? renderedWidth() : baseline.width,
          x: baseline.x + (positionEffect ? x.get() : 0),
          widthVelocity: sizeEffect ? width.getVelocity() : 0,
          xVelocity: positionEffect ? x.getVelocity() : 0,
        }
      : null;
  return {
    get width() {
      return sizeEffect ? renderedWidth() : (baseline?.width ?? 0);
    },
    get running() {
      return !!(sizeEffect || positionEffect);
    },
    get settling() {
      return !!sizeEffect || x.isAnimating();
    },
    sample,
    prepare(): Sample | null {
      const current = sample();
      stop();
      if (current) baseline = current;
      return current;
    },
    write,
    commit(input: {
      revision: MotionRevision;
      cm: CadenceMotion;
      destination: KbdBox | null;
      origin: Sample | null;
      available: boolean;
      moving: boolean;
      readable: boolean;
      offset?: () => number;
      changed?: () => void;
      passive?: () => void;
    }) {
      const geometry = input.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
      const layout = input.cm.parameters(bindMotionParameters(layoutCompact, "layout.move/position"));
      if (geometry.kind !== "geometry" || layout.kind !== "layout") return;
      const clock = JSON.stringify([
        geometry.transition,
        layout.transition,
        input.cm.mode,
        input.available,
        input.destination,
        input.readable,
        input.moving,
      ]);
      if (previous === input.revision && signature === clock) return;
      previous = input.revision;
      signature = clock;
      stop();
      baseline = input.destination;
      offset = input.offset ?? (() => 0);
      changed = input.changed ?? (() => {});
      passive = input.passive ?? (() => {});
      const target = input.destination,
        start = input.origin;
      if (!target || !current()) return;
      height = node.offsetHeight;
      const child = node.firstElementChild;
      const next = child instanceof HTMLElement && child.getAttribute("data-slot") === "kbd-text" ? child : null;
      if (next !== label) {
        if (label) observer.unobserve(label);
        label = next;
        if (label) observer.observe(label, { box: "border-box" });
      }
      labelWidth = label?.offsetWidth ?? 0;
      labelHeight = label?.offsetHeight ?? 0;

      width.jump(target.width);
      x.jump(0);
      if (
        !start ||
        !input.available ||
        restricted ||
        input.cm.reduced ||
        geometry.transition.duration === 0 ||
        !input.revision.current() ||
        !node.animate
      )
        return;
      const valid =
        [start.width, start.x, target.width, target.x].every(Number.isFinite) &&
        Math.min(start.width, target.width) > 0;
      if (!valid) return;
      const visuals = new Set([node]);
      if (!transaction.preflightVisuals(visuals)) return;
      if (input.readable && start.width !== target.width) {
        sizeLease = owner.begin(input.revision, ["width"], { collectionVisuals: visuals }, stop);
        if (sizeLease) {
          bounds = [Math.min(start.width, target.width), Math.max(start.width, target.width)];
          width.jump(start.width);
          sizeEffect = node.animate({ width: `${start.width}px` }, { duration: 0, fill: "both" });
          registerTextGeometry(sizeEffect, sizeLease, input.cm.mode);
          const lease = sizeLease;
          animateSingleValue(width, target.width, {
            ...geometry.transition,
            velocity: start.widthVelocity,
            onComplete: () => {
              if (!lease.current()) return;
              sizeEffect?.cancel();
              sizeEffect = null;
              lease.finish();
              sizeLease = null;
              changed();
            },
          });
        }
      }
      if (input.moving && layout.transition.duration !== 0) {
        positionLease = positionOwner.begin(input.revision, ["transform"], { collectionVisuals: visuals }, stop);
        if (positionLease) {
          x.jump(start.x - target.x);
          positionEffect = node.animate(
            { transform: `translate(${x.get() - offset()}px,0px)` },
            { duration: 0, fill: "both" },
          );
          registerTextGeometry(positionEffect, positionLease, input.cm.mode);
          const lease = positionLease;
          animateSingleValue(x, 0, {
            ...layout.transition,
            velocity: start.xVelocity,
            onComplete: () => {
              // Keep compensation until all key widths have reached their destinations.
              if (!lease.current()) return;
              x.jump(0);
              write();
              changed();
            },
          });
        }
      }
      write();
    },
    settlePosition() {
      positionEffect?.cancel();
      positionEffect = null;
      const lease = positionLease;
      positionLease = null;
      lease?.finish();
    },
    dispose() {
      alive = false;
      stop();
      owner.dispose();
      positionOwner.dispose();
      offWidth();
      offX();
      unsubscribe();
      observer.disconnect();
      node.ownerDocument.defaultView?.removeEventListener("resize", settleNative);
      node.ownerDocument.fonts?.removeEventListener("loadingdone", settleNative);
    },
  };
}

/** Positive axis-aligned native coordinates, including translated popup ancestors. */
export function kbdScale(element: HTMLElement) {
  let x = 1,
    y = 1,
    current: HTMLElement | null = element;
  for (let depth = 0; current && depth < 32; depth++, current = current.parentElement) {
    const css = getComputedStyle(current);
    if (!css.transform || (css.transform !== "none" && typeof DOMMatrixReadOnly === "undefined")) return null;
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

type Neutral = { value: number; alpha: number };
type Interval = [number, number];
const contexts = new WeakMap<Document, CanvasRenderingContext2D>();

/** A single named key palette, including its actual neutral ancestor backdrop. */
export function kbdColourReadable(node: Element) {
  const background = node.parentElement && backdrop(node.parentElement);
  const surface = composite(colours(node, "background-color"), background);
  const ink = composite(colours(node, "color"), surface);
  if (!surface || !ink || (ink[0] <= surface[1] && ink[1] >= surface[0])) return false;
  const luminance = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const low = luminance(ink[1] < surface[0] ? ink[1] : surface[1]);
  const high = luminance(ink[1] < surface[0] ? surface[0] : ink[0]);
  return (high + 0.05) / (low + 0.05) >= 4.5;
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
