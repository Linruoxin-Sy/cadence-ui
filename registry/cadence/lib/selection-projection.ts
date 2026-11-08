"use client";

import { animateSingleValue, motionValue, type Transition } from "motion/react";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionLease, type MotionRevision } from "./motion-transaction";

export type SelectionBox = { x: number; y: number; width: number; height: number };

/** A persistent decoration; never projects the interactive target's transform. */
export function createSelectionProjection(host: MotionHostRef<HTMLElement>, transaction = createMotionTransaction()) {
  const node = host.current;
  if (!node) throw new Error("Selection registration requires a committed host");
  const identity = host.identity;
  const registration = transaction.register(node);
  const edges = [motionValue(0), motionValue(0), motionValue(0), motionValue(0)];
  let previous: MotionRevision | null = null;
  let box: SelectionBox | null = null;
  let effect: Animation | null = null;
  let lease: MotionLease | null = null;
  let alive = true;
  let restricted = false;
  let running = false;
  let clock = "";
  let limits = { left: 0, top: 0, right: 0, bottom: 0 };
  const current = () => alive && host.current === node && host.identity === identity && node.isConnected;
  const cancel = () => {
    running = false;
    for (const edge of edges) edge.stop();
    effect?.cancel();
    effect = null;
    lease?.cancel();
  };
  const presentation = () => {
    const [x, y, r, b] = edges.map((edge) => edge.get()) as [number, number, number, number];
    const left = Math.max(limits.left, Math.min(limits.right, x)),
      top = Math.max(limits.top, Math.min(limits.bottom, y));
    const right = Math.max(left, Math.min(limits.right, r)),
      bottom = Math.max(top, Math.min(limits.bottom, b));
    return [left, top, right, bottom];
  };
  const write = () => {
    if (!current() || !lease?.current() || !box || !effect) return;
    const [left, top, right, bottom] = presentation() as [number, number, number, number];
    (effect.effect as KeyframeEffect | null)?.setKeyframes({
      transform: `translate(${left - box.x}px,${top - box.y}px) scale(${Math.max(0, right - left) / box.width},${Math.max(0, bottom - top) / box.height})`,
    });
  };
  const unsubscribers = edges.map((edge) => edge.on("change", write));
  const unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
    restricted = environment.hidden || environment.immediate || environment.reduced;
    if (restricted) {
      cancel();
      box = null;
    }
  });
  return {
    commit(revision: MotionRevision, destination: SelectionBox | null, transition: Transition, immediate: boolean) {
      if (!current()) {
        cancel();
        return;
      }
      const same = previous === revision;
      const signature = JSON.stringify(transition);
      const retime = running && signature !== clock;
      clock = signature;
      const equal =
        destination &&
        box &&
        (Object.keys(destination) as (keyof SelectionBox)[]).every((key) => destination[key] === box?.[key]);
      if (same && equal && !retime) {
        if (immediate || transition.duration === 0 || restricted) cancel();
        return;
      }
      const origin = box;
      const wasRunning = running;
      const displayed = presentation();
      const samples = edges.map((edge, index) => ({
        value: displayed[index] ?? 0,
        velocity: edge.get() === displayed[index] ? edge.getVelocity() : 0,
      }));
      cancel();
      previous = revision;
      box = destination;
      node.hidden = !destination;
      if (!destination) return;
      const { x, y, width, height } = destination;
      Object.assign(node.style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
      const targets = [x, y, x + width, y + height];
      if (
        !origin ||
        (same && !retime) ||
        immediate ||
        restricted ||
        transition.duration === 0 ||
        width <= 0 ||
        height <= 0 ||
        !node.animate
      ) {
        edges.forEach((edge, index) => {
          edge.jump(targets[index] ?? 0);
        });
        return;
      }
      lease = registration.begin(revision, ["transform"], { collectionVisuals: new Set([node]) }, () => {
        effect?.cancel();
        for (const edge of edges) edge.stop();
        running = false;
      });
      if (!lease) return;
      const permit = lease;
      const starts = wasRunning
        ? samples.map((sample) => sample.value)
        : [origin.x, origin.y, origin.x + origin.width, origin.y + origin.height];
      limits = {
        left: Math.min(starts[0] ?? x, x),
        top: Math.min(starts[1] ?? y, y),
        right: Math.max(starts[2] ?? x + width, x + width),
        bottom: Math.max(starts[3] ?? y + height, y + height),
      };
      edges.forEach((edge, index) => {
        edge.jump(starts[index] ?? 0);
      });
      effect = node.animate({}, { duration: 0, fill: "both" });
      running = true;
      write();
      let pending = edges.length;
      edges.forEach((edge, index) => {
        animateSingleValue(edge, targets[index] ?? 0, {
          ...transition,
          velocity: wasRunning ? (samples[index]?.velocity ?? 0) : 0,
          onComplete() {
            if (!current() || !permit.current() || --pending) return;
            running = false;
            effect?.cancel();
            effect = null;
            permit.finish();
          },
        });
      });
    },
    cancel,
    invalidate() {
      if (!current()) return;
      cancel();
      box = null;
      node.hidden = true;
    },
    dispose() {
      alive = false;
      registration.dispose();
      cancel();
      unsubscribe();
      for (const off of unsubscribers) off();
    },
  };
}
