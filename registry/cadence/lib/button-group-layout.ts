"use client";

import { animateSingleValue, motionValue } from "motion/react";
import { labelGeometry } from "./label-layout";
import { bindMotionParameters, layoutCompact, motionLimits } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import {
  createMotionTransaction,
  knownTextGeometry,
  type MotionLease,
  type MotionRevision,
  registerTextGeometry,
} from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type GroupPosition = { x: number; y: number; width: number; height: number; velocity?: number };

/** One scalar projection, separate from the control's native host/press layer.
 * The adapter supplies final boxes once; scalar callbacks never read layout. */
export function createGroupPositions(transaction = createMotionTransaction()) {
  const phase = motionValue(1);
  let target = new Map<HTMLElement, GroupPosition>();
  let origin = new Map<HTMLElement, GroupPosition>();
  const effects = new Map<HTMLElement, { animation: Animation; lease: MotionLease; dispose(): void }>();
  let revision: MotionRevision | null = null;
  let clock = "";
  let axis: "x" | "y" = "x";
  const sample = () =>
    new Map(
      [...target].map(([host, box]) => {
        const before = origin.get(host) ?? box;
        const p = Math.max(0, Math.min(1, phase.get()));
        return [
          host,
          {
            ...box,
            x: axis === "x" ? before.x + (box.x - before.x) * p : box.x,
            y: axis === "y" ? before.y + (box.y - before.y) * p : box.y,
            velocity: (box[axis] - before[axis]) * phase.getVelocity(),
          },
        ];
      }),
    );
  const cancel = () => {
    phase.stop();
    const previous = [...effects.values()];
    effects.clear();
    for (const effect of previous) effect.dispose();
  };
  const write = () => {
    const current = sample();
    for (const [host, effect] of effects) {
      const box = current.get(host),
        end = target.get(host);
      if (box && end && effect.lease.current())
        (effect.animation.effect as KeyframeEffect).setKeyframes({
          transform: `translate(${box.x - end.x}px,${box.y - end.y}px)`,
        });
    }
  };
  const off = phase.on("change", write);
  let unsubscribe = () => {};
  return {
    owns(animation: Animation) {
      return [...effects].some(
        ([host, effect]) =>
          effect.animation === animation &&
          effect.lease.current() &&
          (animation.effect as KeyframeEffect | null)?.target === host &&
          knownTextGeometry(animation, "full"),
      );
    },
    prepare() {
      const current = sample();
      cancel();
      return current;
    },
    commit(input: {
      host: MotionHostRef<HTMLElement>;
      revision: MotionRevision;
      cm: CadenceMotion;
      boxes: Map<HTMLElement, GroupPosition>;
      from: Map<HTMLElement, GroupPosition>;
      available: boolean;
      axis: "x" | "y";
    }) {
      const parameters = input.cm.parameters(bindMotionParameters(layoutCompact, "layout.move/position"));
      if (parameters.kind !== "layout") return;
      const nextClock = JSON.stringify([input.cm.mode, parameters.transition]);
      const same = revision === input.revision;
      const changedClock = clock !== nextClock;
      revision = input.revision;
      clock = nextClock;
      cancel();
      target = input.boxes;
      origin = input.from;
      axis = input.axis;
      unsubscribe();
      unsubscribe = input.host.current
        ? subscribeMotionEnvironment(input.host.current.ownerDocument, (environment) => {
            if (environment.hidden || environment.reduced || environment.immediate) {
              cancel();
              origin = target;
            }
          })
        : () => {};
      const visuals = new Set([...(input.host.current ? [input.host.current] : []), ...target.keys()]);
      if (
        !input.available ||
        input.cm.reduced ||
        parameters.transition.duration === 0 ||
        (same && !changedClock) ||
        !transaction.preflightVisuals(visuals)
      ) {
        origin = target;
        return;
      }
      for (const [host, box] of target) {
        const before = origin.get(host);
        if (!before || before[input.axis] === box[input.axis] || !host.animate) continue;
        const owner = transaction.register(host);
        const lease = owner.begin(input.revision, ["transform"], { collectionVisuals: visuals }, cancel);
        if (!lease) {
          owner.dispose();
          cancel();
          return;
        }
        const animation = host.animate({}, { duration: 0, fill: "both" });
        registerTextGeometry(animation, lease, input.cm.mode);
        effects.set(host, {
          animation,
          lease,
          dispose() {
            animation.cancel();
            lease.cancel();
            owner.dispose();
          },
        });
      }
      phase.jump(0);
      write();
      const rates = [...target].flatMap(([host, box]) => {
        const before = origin.get(host),
          delta = box[axis] - (before?.[axis] ?? box[axis]);
        return delta ? [(before?.velocity ?? 0) / delta] : [];
      });
      const rate = rates[0] ?? 0;
      const coherent = rates.every(
        (value) => Math.abs(value - rate) <= Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(rate)),
      );
      if (effects.size)
        animateSingleValue(phase, 1, {
          ...parameters.transition,
          velocity: coherent ? Math.max(0, rate) : 0,
          onComplete: cancel,
        });
    },
    settle() {
      cancel();
      origin = target;
    },
    dispose() {
      cancel();
      off();
      unsubscribe();
      target.clear();
      origin.clear();
    },
  };
}

/** Exact cross-axis native stretch, caused by this scope's leased direct rule.
 * Neither a matching attribute nor an unrelated dimension engine grants it. */
export function groupStretchEcho(
  host: HTMLElement,
  source: HTMLElement,
  target: HTMLElement,
  axis: "width" | "height",
  owns: (animation: Animation) => boolean,
) {
  if (source.parentElement !== host || (target !== host && target.parentElement !== host)) return false;
  const parent = getComputedStyle(host),
    css = getComputedStyle(source);
  if (
    !parent.display.includes("flex") ||
    !(
      (parent.flexDirection.startsWith("row") && axis === "height") ||
      (parent.flexDirection.startsWith("column") && axis === "width")
    )
  )
    return false;
  const vertical = axis === "height";
  const content =
    (vertical ? host.clientHeight : host.clientWidth) -
    Number.parseFloat(parent[vertical ? "paddingTop" : "paddingLeft"]) -
    Number.parseFloat(parent[vertical ? "paddingBottom" : "paddingRight"]);
  const extent =
    (vertical ? source.offsetHeight : source.offsetWidth) +
    Number.parseFloat(css[vertical ? "marginTop" : "marginLeft"]) +
    Number.parseFloat(css[vertical ? "marginBottom" : "marginRight"]);
  if (!Number.isFinite(content) || !Number.isFinite(extent) || Math.round(content) !== Math.round(extent)) return false;
  if (target === host) return true;
  const child = getComputedStyle(target);
  const alignment = child.alignSelf === "auto" ? parent.alignItems : child.alignSelf;
  if (
    target.dataset.slot !== "button-group-segment" ||
    target.computedStyleMap?.().get(axis)?.toString() !== "auto" ||
    alignment !== "stretch" ||
    ["absolute", "fixed"].includes(child.position)
  )
    return false;
  const expected =
    content -
    Number.parseFloat(child[vertical ? "marginTop" : "marginLeft"]) -
    Number.parseFloat(child[vertical ? "marginBottom" : "marginRight"]);
  if (!Number.isFinite(expected) || Math.round(expected) !== (vertical ? target.offsetHeight : target.offsetWidth))
    return false;
  const handles = target.getAnimations();
  return (
    handles.length <= motionLimits.collectionVisuals &&
    handles.every((animation) => {
      if (owns(animation)) return true;
      const frames = (animation.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
      return (
        frames.length <= motionLimits.collectionVisuals &&
        frames.every(
          (frame) =>
            !Object.keys(frame).some((key) =>
              /^(?:width|height|minWidth|maxWidth|minHeight|maxHeight|flexBasis|transform|translate|scale|rotate|padding|gap)$/.test(
                key,
              ),
            ),
        )
      );
    })
  );
}

/** Fixed outgoing paint and local FLIP share a proven untransformed mapping.
 * Caller/native geometry engines are audited by the committed constraint owner. */
export function groupMapping(host: HTMLElement) {
  let count = 0;
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    if (++count > motionLimits.collectionVisuals) return false;
    const css = getComputedStyle(node);
    if (
      css.transform !== "none" ||
      css.translate !== "none" ||
      css.rotate !== "none" ||
      css.scale !== "none" ||
      css.perspective !== "none" ||
      css.offsetPath !== "none" ||
      !["normal", "1"].includes(css.zoom) ||
      css.writingMode !== "horizontal-tb"
    )
      return false;
  }
  return true;
}

export function buttonGroupGeometry(
  host: HTMLElement,
  orientation: string,
  clips?: Map<HTMLElement, { width: number; height: number }>,
) {
  const axis = orientation === "vertical" ? "height" : "width";
  if (host.children.length + 1 > motionLimits.collectionVisuals) return null;
  for (const layer of host.children) {
    if (layer.hasAttribute("data-ending-style")) continue;
    const member = layer.firstElementChild;
    for (const node of [layer, member]) {
      if (!(node instanceof HTMLElement)) continue;
      const css = getComputedStyle(node);
      const properties = css.transitionProperty.split(",").map((name) => name.trim());
      const times = css.transitionDuration.split(",").map(Number.parseFloat);
      const dimensional = /^(all|width|height|min-width|max-width|min-height|max-height|padding|gap|flex-basis)$/;
      if (
        properties.some((name, index) => dimensional.test(name) && (times[index % times.length] ?? 0) > 0) ||
        node
          .getAnimations()
          .some(
            (animation) =>
              !knownTextGeometry(animation, "full") &&
              (animation.effect as KeyframeEffect | null)
                ?.getKeyframes()
                .some((frame) =>
                  Object.keys(frame).some((name) =>
                    /^(width|height|minWidth|maxWidth|minHeight|maxHeight|padding|gap|flexBasis)$/.test(name),
                  ),
                ),
          )
      )
        return null;
    }
    if (layer instanceof HTMLElement) {
      const size = layer.computedStyleMap?.().get(axis)?.toString() ?? layer.style[axis];
      if (size && !/^(auto|none|fit-content|max-content|min-content|0|(?:\d+(?:\.\d+)?|\.\d+)px)$/.test(size))
        return null;
    }
  }
  const value = labelGeometry(host, host, true);
  if (!value) return null;
  const target = value[axis];
  if (!target) return null;
  // A shrink-wrapped parent's current extent echoes this very group. It is
  // not an independent maximum that may truncate the captured shrink origin.
  // Actual native min/max constraints remain authoritative over the overlay.
  const constraints = [`min-${axis}`, `max-${axis}`].map(
    (name) => host.computedStyleMap?.().get(name)?.toString() ?? host.style.getPropertyValue(name),
  );
  if (constraints.some((value) => value && !/^(none|auto|0|(?:\d+(?:\.\d+)?|\.\d+)px)$/.test(value))) return null;
  const maximum = constraints[1];
  let clipped = false;
  const box = host.getBoundingClientRect();
  const nextClips = new Map<HTMLElement, { width: number; height: number }>();
  for (let node: HTMLElement | null = host; node; node = node.parentElement) {
    const css = getComputedStyle(node);
    if (!/(hidden|clip|auto|scroll)/.test(`${css.overflowX} ${css.overflowY}`) && !css.contain.includes("paint"))
      continue;
    const clip = node.getBoundingClientRect(),
      before = clips?.get(node);
    nextClips.set(node, { width: clip.width, height: clip.height });
    // A before/after native allocation receipt distinguishes a fixed outer
    // preview/viewport clip from an intrinsic clip that echoes this group.
    // The group shell itself must never introduce an intermediate clip.
    clipped ||=
      node === host ||
      before?.[axis] !== clip[axis] ||
      box.left < clip.left ||
      box.right > clip.right ||
      box.top < clip.top ||
      box.bottom > clip.bottom;
  }
  if (clips) {
    clips.clear();
    for (const [node, box] of nextClips) clips.set(node, box);
  }
  const minimum = constraints[0]?.endsWith("px") ? Number.parseFloat(constraints[0]) : 0;
  return {
    [axis]: {
      ...target,
      min: Math.max(minimum, clipped ? (target.min ?? target.size) : 0),
      max: maximum?.endsWith("px") ? Number.parseFloat(maximum) : undefined,
    },
  };
}
