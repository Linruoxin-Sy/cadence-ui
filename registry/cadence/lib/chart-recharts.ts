"use client";

import { cubicBezier } from "motion/react";
import type { RefObject } from "react";
import type * as RechartsPrimitive from "recharts";
import { motionMilliseconds } from "./motion";
import type { createMotionTransaction, MotionLease, MotionRevision, MotionSettlement } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

/** Recharts' native controller arguments plus the Cadence phase carried for one series. */
export type ChartPhase = {
  progress: number;
  previous?: number;
  easing?: (progress: number) => number;
  started: boolean;
  completed: boolean;
  work?: number;
  entity?: object;
  target?: object;
  alive?: boolean;
  dispose?: () => void;
};
export type ChartController = (
  ...args: [...Parameters<RechartsPrimitive.AnimationController>, ChartPhase?]
) => ReturnType<RechartsPrimitive.AnimationController>;

/** The one authored data clock. The engine owns the geometry writer; Cadence owns
 * the effective duration, curve and mode ceiling that the same controller observes. */
export function chartClock(cm: CadenceMotion) {
  const clock = cm.transition("data.transition");
  const curve = cm.scope.tokens.ease.out;
  return { duration: clock.duration ?? 0, easing: cubicBezier(...curve) };
}

type ChartRuntime = Readonly<{
  transaction: ReturnType<typeof createMotionTransaction>;
  committedTarget: RefObject<{ target: object; revision: MotionRevision } | null>;
  current: RefObject<{ reduced: boolean; duration: number; easing: (progress: number) => number }>;
  running: RefObject<Set<() => void>>;
  blocked: RefObject<boolean>;
}>;

/** One controller per chart surface. Unknown work settles before any loop starts;
 * retargets retain the committed revision and complete native callbacks synchronously. */
export function createChartController({ transaction, committedTarget, current, running, blocked }: ChartRuntime) {
  return ((_timeout, handle, listener, phase) => {
    let frame = 0;
    let done = false;
    const playback: ChartPhase = phase ?? { progress: 0, started: false, completed: false };
    const revision = phase?.target
      ? transaction.revision("content", phase.target, phase)
      : committedTarget.current?.revision;
    if (!revision) return () => {};
    const currentPhase = () => revision.current() && (!phase || phase.alive);
    let registration = registrations.get(playback);
    if (!registration) {
      registration = transaction.register(playback, playback.entity ?? playback);
      registrations.set(playback, registration);
      const owned = registration;
      playback.dispose = () => {
        owned.dispose();
        registrations.delete(playback);
      };
    }
    let lease: MotionLease | null;
    let finish: () => void = () => {};
    const retire = (settle = false, terminal?: MotionSettlement) => {
      done = true;
      cancelAnimationFrame(frame);
      running.current.delete(finish);
      if (!settle) return;
      if (!terminal?.current()) return;
      playback.progress = 1;
      listener(handle.getTo());
      if (terminal.current() && currentPhase()) handle.complete();
    };
    const immediateNative = !phase || playback.work === undefined;
    lease = registration.begin(
      revision,
      ["chart-geometry"],
      immediateNative ? {} : { chartSamples: playback.work },
      retire,
    );
    const overflow = !lease;
    if (!lease) lease = registration.begin(revision, ["chart-geometry"], {}, retire);
    if (!lease?.current()) return () => {};
    // Required native callbacks remain synchronous. They can themselves replace
    // data or unmount the chart, so recheck authority after every callout.
    handle.tick(0);
    if (!lease.current()) {
      lease.cancel();
      return () => {};
    }
    handle.tick(handle.getAnimationBegin());
    if (!lease.current()) {
      lease.cancel();
      return () => {};
    }
    const origin = playback.progress;
    finish = () => {
      if (done || !lease?.current()) return;
      done = true;
      playback.progress = 1;
      cancelAnimationFrame(frame);
      running.current.delete(finish);
      listener(handle.getTo());
      if (lease.current() && currentPhase()) handle.complete();
      lease.finish();
    };
    running.current.add(finish);
    if (
      overflow ||
      immediateNative ||
      current.current.reduced ||
      current.current.duration === 0 ||
      blocked.current ||
      playback.progress === 1 ||
      typeof handle.getFrom() !== "number"
    ) {
      finish();
      const completed = lease;
      return () => completed.cancel();
    }
    let progress = playback.progress;
    const tick = (now: number) => {
      if (done || !lease?.current()) return;
      // The first visual frame follows committed local-token resolution.
      // Later frames and replacement handles retain this action's curve.
      if (!playback.easing) playback.easing = current.current.easing;
      const easing = playback.easing;
      const startPaint = easing(origin);
      const duration = motionMilliseconds(current.current.duration);
      if (duration === 0) return finish();
      progress = Math.min(1, progress + (playback.previous === undefined ? 0 : now - playback.previous) / duration);
      playback.previous = now;
      playback.progress = progress;
      if (progress === 1) {
        finish();
        return;
      }
      const from = Number(handle.getFrom());
      // A recreated native handle interpolates from current geometry. Continue
      // the original curve's remaining segment rather than easing from rest again.
      const endPaint = easing(1);
      if (endPaint === startPaint) return finish();
      const remaining = (easing(progress) - startPaint) / (endPaint - startPaint);
      listener(from + (Number(handle.getTo()) - from) * remaining);
      if (lease.current()) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      lease?.cancel();
    };
  }) as ChartController;
}
const registrations = new WeakMap<ChartPhase, ReturnType<ReturnType<typeof createMotionTransaction>["register"]>>();

/** Recharts calls back with its sample items; the adapter only picks the terminal paint. */
export type SeriesInterpolator = (
  items: ReadonlyArray<RechartsPrimitive.AnimationItem<unknown>> | null,
  progress: number,
  layout: unknown,
) => ReadonlyArray<unknown>;
export function terminalItems(items: ReadonlyArray<RechartsPrimitive.AnimationItem<unknown>> | null) {
  return items?.flatMap((item) => (item.status === "removed" ? [] : [item.next])) ?? [];
}
/** Immediate native series props. Kept here so component source owns no engine literal. */
export function chartInstantProps(authored?: SeriesInterpolator) {
  const terminal: SeriesInterpolator = authored
    ? (items, _progress, layout) => authored(items, 1, layout)
    : terminalItems;
  return { animationInterpolateFn: terminal, isAnimationActive: false as const };
}
