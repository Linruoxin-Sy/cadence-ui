"use client";

import { animateSingleValue, motionValue, type Transition } from "motion/react";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionLease, type MotionRevision } from "./motion-transaction";

/** Native offcanvas endpoints, in the common shell's physical CSS-pixel space. */
export type SizeLinkedDestination = { gap: number; width: number; sign: -1 | 1 };

/**
 * One physical size scalar, two disjoint property owners. The panel projects
 * the gap's *rendered clamped size*, never a second spring or a layout read.
 * Native CSS already owns both destinations; cancelling overlays exposes it.
 */
export function createSizeLinkedGeometry(
  gapHost: MotionHostRef<HTMLElement>,
  panelHost: MotionHostRef<HTMLElement>,
  transaction = createMotionTransaction(),
) {
  const gap = gapHost.current,
    panel = panelHost.current;
  if (!gap || !panel) throw new Error("Size-linked geometry requires both committed hosts");
  const gapIdentity = gapHost.identity,
    panelIdentity = panelHost.identity;
  const size = motionValue(0);
  const gapOwner = transaction.register(gap),
    panelOwner = transaction.register(panel);
  let baseline: SizeLinkedDestination | null = null;
  let previous: MotionRevision | null = null;
  let signature = "";
  let running = false;
  let alive = true;
  let restricted = false;
  let bounds = [0, 0];
  let gapEffect: Animation | null = null,
    panelEffect: Animation | null = null;
  let gapLease: MotionLease | null = null,
    panelLease: MotionLease | null = null;
  const current = () =>
    alive &&
    gapHost.current === gap &&
    panelHost.current === panel &&
    gapHost.identity === gapIdentity &&
    panelHost.identity === panelIdentity &&
    gap.isConnected &&
    panel.isConnected;
  const rendered = () => Math.max(bounds[0] ?? 0, Math.min(bounds[1] ?? 0, size.get()));
  const release = () => {
    running = false;
    size.stop();
    gapEffect?.cancel();
    panelEffect?.cancel();
    gapEffect = panelEffect = null;
    const oldGap = gapLease,
      oldPanel = panelLease;
    gapLease = panelLease = null;
    oldGap?.cancel();
    oldPanel?.cancel();
  };
  const write = () => {
    if (!current() || !gapLease?.current() || !panelLease?.current() || !baseline) return;
    const visible = rendered();
    (gapEffect?.effect as KeyframeEffect | null)?.setKeyframes({ width: `${visible}px` });
    (panelEffect?.effect as KeyframeEffect | null)?.setKeyframes({
      transform: `translateX(${-baseline.sign * (visible - baseline.gap)}px)`,
    });
  };
  const off = size.on("change", write);
  const unsubscribe = subscribeMotionEnvironment(panel.ownerDocument, (environment) => {
    restricted = environment.hidden || environment.reduced || environment.immediate;
    if (restricted) {
      release();
      baseline = null;
    }
  });
  return {
    /** Must run before measuring native destinations, including active/outgoing work. */
    prepare(revision: MotionRevision, transition: Transition, immediate: boolean) {
      if (previous === revision && signature === JSON.stringify(transition) && !immediate && !restricted) return null;
      const sample = running
        ? { size: rendered(), velocity: size.get() === rendered() ? size.getVelocity() : 0 }
        : null;
      const permitted = transaction.preflightVisuals(new Set([gap, panel]));
      release();
      return { sample, permitted };
    },
    commit(
      revision: MotionRevision,
      destination: SizeLinkedDestination | null,
      transition: Transition,
      immediate: boolean,
      prepared: { sample: { size: number; velocity: number } | null; permitted: boolean },
    ) {
      if (
        destination &&
        (!Number.isFinite(destination.gap) ||
          !Number.isFinite(destination.width) ||
          destination.width <= 0 ||
          destination.gap < 0 ||
          destination.gap > destination.width)
      )
        destination = null;
      const origin = baseline;
      baseline = destination;
      const clock = JSON.stringify(transition);
      const same = previous === revision;
      const retime = signature !== clock;
      previous = revision;
      signature = clock;
      if (!current() || !destination) return;
      const { gap: target, width, sign } = destination;
      if (
        !origin ||
        (same && (!retime || !prepared.sample)) ||
        origin.width !== width ||
        origin.sign !== sign ||
        !prepared.permitted ||
        immediate ||
        restricted ||
        transition.duration === 0 ||
        !revision.current() ||
        !gap.animate ||
        !panel.animate ||
        ![target, width].every(Number.isFinite) ||
        width <= 0 ||
        target < 0 ||
        target > width
      ) {
        size.jump(target);
        return;
      }
      const start = prepared.sample?.size ?? origin.gap;
      if (start === target) return;
      bounds = [Math.min(start, target), Math.max(start, target)];
      size.jump(start);
      gapLease = gapOwner.begin(revision, ["width"], { collectionVisuals: new Set([gap, panel]) }, release);
      panelLease = panelOwner.begin(revision, ["transform"], {}, release);
      if (!gapLease || !panelLease) {
        release();
        return;
      }
      const permit = gapLease,
        projectionPermit = panelLease;
      gapEffect = gap.animate({}, { duration: 0, fill: "both" });
      panelEffect = panel.animate({}, { duration: 0, fill: "both" });
      running = true;
      write();
      animateSingleValue(size, target, {
        ...transition,
        velocity: prepared.sample?.velocity ?? 0,
        onComplete() {
          if (!current() || !permit.current() || !projectionPermit.current()) return;
          release();
        },
      });
    },
    invalidate() {
      release();
      baseline = null;
    },
    dispose() {
      alive = false;
      gapOwner.dispose();
      panelOwner.dispose();
      release();
      off();
      unsubscribe();
    },
  };
}
