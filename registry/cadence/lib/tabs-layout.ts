"use client";

import { animateSingleValue, motionValue, type Transition } from "motion/react";
import { type CadenceMode, motionLimits } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import {
  createMotionTransaction,
  type MotionLease,
  type MotionRevision,
  registerTextGeometry,
} from "./motion-transaction";
import type { SelectionBox } from "./selection-projection";

export type TabsStripSnapshot = {
  size: number;
  axis: "width" | "height";
  items: Map<HTMLElement, SelectionBox>;
  marker: SelectionBox | null;
  strip: HTMLElement;
  inlineSize: number;
  blockSize: number;
  velocity?: number;
  crossWidth?: number;
  crossHeight?: number;
  selected?: HTMLElement;
  clipped?: boolean;
  crossClipped?: boolean;
  velocities?: Map<HTMLElement, { x: number; y: number }>;
  markerVelocity?: SelectionBox;
};

/** A trigger owns its transform; the list supplies its one shared projection. */
export function createTabsItem(host: MotionHostRef<HTMLElement>, transaction = createMotionTransaction()) {
  const node = host.current;
  if (!node) throw new Error("Tabs item requires its committed trigger");
  const identity = host.identity,
    owner = transaction.register(node);
  let revision: MotionRevision | null = null,
    immediate = true;
  let clock = "";
  let mode: CadenceMode = "none";
  let effect: Animation | null = null,
    lease: MotionLease | null = null;
  const cancel = () => {
    effect?.cancel();
    effect = null;
    const old = lease;
    lease = null;
    old?.cancel();
  };
  return {
    commit(next: MotionRevision, transition: Transition, instant: boolean, policy: CadenceMode) {
      if (revision !== next) cancel();
      revision = next;
      mode = policy;
      clock = JSON.stringify(transition);
      immediate = instant || transition.duration === 0;
      if (immediate) cancel();
    },
    compatible(transition: Transition) {
      return !immediate && clock === JSON.stringify(transition);
    },
    project(visuals: Set<HTMLElement>) {
      cancel();
      if (immediate || !revision?.current() || node !== host.current || identity !== host.identity || !node.animate)
        return false;
      lease = owner.begin(revision, ["transform"], { collectionVisuals: visuals }, cancel);
      if (!lease) return false;
      effect = node.animate({}, { duration: 0, fill: "both" });
      registerTextGeometry(effect, lease, mode);
      return true;
    },
    write(x: number, y: number) {
      if (lease?.current() && effect && node === host.current && identity === host.identity)
        (effect.effect as KeyframeEffect | null)?.setKeyframes({ transform: `translate(${x}px,${y}px)` });
    },
    cancel,
    dispose() {
      cancel();
      owner.dispose();
    },
  };
}

/** One clamped projection for strip extent, retained positions and marker attachment.
 * Natural endpoints are read by the adapter after releasing these overlays.
 * An optional selection path has its own clock, composed with this projection
 * by the same marker writer. Existing adapters without that path keep their policy.
 */
export function createTabsLayout(
  host: MotionHostRef<HTMLElement>,
  marker: MotionHostRef<HTMLElement>,
  transaction = createMotionTransaction(),
  registrations: ReadonlyMap<object, { host: HTMLElement; item: ReturnType<typeof createTabsItem> }> = new Map(),
) {
  const phase = motionValue(1);
  const extent = motionValue(0);
  const cross = motionValue(0);
  const selectionPhase = motionValue(1);
  let previous: MotionRevision | null = null;
  let baseline: TabsStripSnapshot | null = null;
  let path: { from: TabsStripSnapshot; to: TabsStripSnapshot; selection?: SelectionBox } | null = null;
  let alive = true;
  let restricted = false;
  let signature = "";
  let generation = 0;
  const effects = new Map<HTMLElement, Animation>();
  const leases: MotionLease[] = [];
  const owners: ReturnType<typeof transaction.register>[] = [];
  const progress = () => Math.max(0, Math.min(1, phase.get()));
  const interpolate = (a: number, b: number) => a + (b - a) * progress();
  const box = (a: SelectionBox, b: SelectionBox): SelectionBox => ({
    x: interpolate(a.x, b.x),
    y: interpolate(a.y, b.y),
    width: interpolate(a.width, b.width),
    height: interpolate(a.height, b.height),
  });
  const markerSample = (velocity = false): SelectionBox | null => {
    if (!path?.to.marker) return null;
    const targetItem = path.to.selected && path.to.items.get(path.to.selected);
    const previousItem = path.to.selected && path.from.items.get(path.to.selected);
    const sourceItem = path.from.selected && path.from.items.get(path.from.selected);
    const finalSource = path.from.selected && path.to.items.get(path.from.selected);
    const p = progress(),
      q = Math.max(0, Math.min(1, selectionPhase.get()));
    const result = { ...path.to.marker };
    for (const key of ["x", "y", "width", "height"] as const) {
      // Native labels already use destination dimensions. Position projects with
      // reflow; selection changes its four bounds along a separate smooth clock.
      const shift =
        key === "x" || key === "y" ? (previousItem?.[key] ?? targetItem?.[key] ?? 0) - (targetItem?.[key] ?? 0) : 0;
      const end = path.to.marker[key] + shift * (1 - p);
      const sourceShift = sourceItem && finalSource ? finalSource[key] - sourceItem[key] : 0;
      const start = (path.selection?.[key] ?? end) + (path.selection ? sourceShift * p : 0);
      result[key] = velocity
        ? path.selection
          ? ((1 - q) * sourceShift - q * shift) * phase.getVelocity() + (end - start) * selectionPhase.getVelocity()
          : -shift * phase.getVelocity()
        : path.selection
          ? start + (end - start) * q
          : end;
    }
    if (!velocity) {
      result.width = Math.max(0, result.width);
      result.height = Math.max(0, result.height);
    }
    return result;
  };
  const sample = (): TabsStripSnapshot | null =>
    path
      ? {
          size: Math.max(
            Math.min(path.from.size, path.to.size),
            Math.min(Math.max(path.from.size, path.to.size), extent.get()),
          ),
          axis: path.to.axis,
          items: new Map(
            [...path.to.items].map(([node, target]) => [node, box(path?.from.items.get(node) ?? target, target)]),
          ),
          marker: markerSample(),
          markerVelocity: markerSample(true) ?? undefined,
          strip: path.to.strip,
          inlineSize: path.to.inlineSize,
          blockSize: path.to.blockSize,
          velocity: extent.getVelocity(),
          velocities: new Map(
            [...path.to.items].map(([node, target]) => {
              const before = path?.from.items.get(node) ?? target;
              return [
                node,
                { x: (target.x - before.x) * phase.getVelocity(), y: (target.y - before.y) * phase.getVelocity() },
              ];
            }),
          ),
          crossWidth:
            path.to.crossWidth === undefined
              ? undefined
              : Math.max(
                  Math.min(path.from.crossWidth ?? path.to.crossWidth, path.to.crossWidth),
                  Math.min(Math.max(path.from.crossWidth ?? path.to.crossWidth, path.to.crossWidth), cross.get()),
                ),
          crossHeight:
            path.to.crossHeight === undefined
              ? undefined
              : Math.max(
                  Math.min(path.from.crossHeight ?? path.to.crossHeight, path.to.crossHeight),
                  Math.min(Math.max(path.from.crossHeight ?? path.to.crossHeight, path.to.crossHeight), cross.get()),
                ),
          selected: path.to.selected,
        }
      : baseline;
  const cancel = () => {
    generation++;
    phase.stop();
    extent.stop();
    cross.stop();
    selectionPhase.stop();
    path = null;
    for (const effect of effects.values()) effect.cancel();
    effects.clear();
    for (const lease of leases.splice(0)) lease.cancel();
    for (const owner of owners.splice(0)) owner.dispose();
    for (const { item } of registrations.values()) item.cancel();
  };
  const write = () => {
    if (!alive || !path || leases.some((lease) => !lease.current())) return;
    const current = sample();
    if (!current) return;
    for (const { host: node, item } of registrations.values()) {
      const target = path.to.items.get(node),
        position = current.items.get(node);
      if (target && position) item.write(position.x - target.x, position.y - target.y);
    }
    for (const [node, effect] of effects) {
      const target = path.to.items.get(node),
        position = current.items.get(node);
      const frame =
        node === host.current
          ? {
              [current.axis]: `${current.size}px`,
              ...(current.crossWidth === undefined ? {} : { width: `${current.crossWidth}px` }),
              ...(current.crossHeight === undefined ? {} : { height: `${current.crossHeight}px` }),
              justifyContent: "flex-start",
            }
          : node === current.strip
            ? {
                width: `${current.inlineSize}px`,
                minWidth: `${current.inlineSize}px`,
                maxWidth: `${current.inlineSize}px`,
                flex: "none",
                ...(current.axis === "height" || current.crossHeight !== undefined
                  ? {
                      height: `${current.blockSize}px`,
                      minHeight: `${current.blockSize}px`,
                      maxHeight: `${current.blockSize}px`,
                    }
                  : {}),
              }
            : node === marker.current && current.marker && path.to.marker
              ? {
                  transform: `translate(${current.marker.x - path.to.marker.x}px,${current.marker.y - path.to.marker.y}px) scale(${current.marker.width / path.to.marker.width},${current.marker.height / path.to.marker.height})`,
                }
              : target && position
                ? { transform: `translate(${position.x - target.x}px,${position.y - target.y}px)` }
                : {};
      (effect.effect as KeyframeEffect | null)?.setKeyframes(frame);
    }
  };
  const off = phase.on("change", write);
  const offSize = extent.on("change", write);
  const offCross = cross.on("change", write);
  const offSelection = selectionPhase.on("change", write);
  const unsubscribe = host.current
    ? subscribeMotionEnvironment(host.current.ownerDocument, (environment) => {
        restricted = environment.hidden || environment.reduced || environment.immediate;
        if (restricted) {
          cancel();
          baseline = null;
        }
      })
    : () => {};
  return {
    get running() {
      return path !== null;
    },
    /** Capture current projection without layout reads, then reveal native layout. */
    prepare() {
      const current = sample();
      cancel();
      return current;
    },
    commit(
      revision: MotionRevision,
      destination: TabsStripSnapshot | null,
      transition: Transition,
      positionTransition: Transition,
      immediate: boolean,
      origin: TabsStripSnapshot | null = baseline,
      selection?: { from: SelectionBox; transition: Transition },
      mode: CadenceMode = "none",
    ) {
      const clock = JSON.stringify([transition, positionTransition, selection?.transition]);
      const same = revision === previous;
      previous = revision;
      const retime = signature !== clock;
      signature = clock;
      baseline = destination;
      // Native labels use their final width throughout. Prove that the starting
      // positions leave room for those exact labels; otherwise only the strip's
      // safe empty-space size can interpolate, with affected positions immediate.
      if (origin && destination) {
        const start = origin;
        const axis = destination.axis === "height" ? "y" : "x",
          extent = axis === "x" ? "width" : "height";
        const order = [...destination.items].sort((a, b) => a[1][axis] - b[1][axis]);
        const overlaps = order.some(([node, target], index) => {
          const next = order[index + 1];
          if (!next) return false;
          return (start.items.get(node) ?? target)[axis] + target[extent] > (start.items.get(next[0]) ?? next[1])[axis];
        });
        if (overlaps)
          origin = {
            ...destination,
            size: origin.size,
            crossWidth: origin.crossWidth,
            crossHeight: origin.crossHeight,
            velocity: origin.velocity,
          };
        // Final-width labels cannot overlap just to preserve a tween. Selection
        // can still travel, while affected item positions settle as one field.
        if (destination.clipped && origin.size < destination.size) origin = { ...origin, size: destination.size };
        if (destination.crossClipped) {
          if (
            destination.crossWidth !== undefined &&
            (origin.crossWidth ?? destination.crossWidth) < destination.crossWidth
          )
            origin = { ...origin, crossWidth: destination.crossWidth };
          if (
            destination.crossHeight !== undefined &&
            (origin.crossHeight ?? destination.crossHeight) < destination.crossHeight
          )
            origin = { ...origin, crossHeight: destination.crossHeight };
        }
      }
      const unchanged =
        origin &&
        destination &&
        origin.size === destination.size &&
        origin.crossWidth === destination.crossWidth &&
        origin.crossHeight === destination.crossHeight &&
        origin.items.size === destination.items.size &&
        [...destination.items].every(([node, target]) => {
          const before = origin.items.get(node);
          return (
            before &&
            ["x", "y", "width", "height"].every(
              (key) => before[key as keyof SelectionBox] === target[key as keyof SelectionBox],
            )
          );
        });
      if (
        (unchanged && !selection) ||
        !alive ||
        !destination ||
        !origin ||
        registrations.size > motionLimits.collectionVisuals ||
        [...registrations.values()].some(({ host: item }) => !item.isConnected || !host.current?.contains(item)) ||
        origin.axis !== destination.axis ||
        (same && !retime) ||
        immediate ||
        restricted ||
        transition.duration === 0 ||
        positionTransition.duration === 0 ||
        [...registrations.values()].some(({ item }) => !item.compatible(positionTransition)) ||
        !host.current?.animate ||
        !revision.current() ||
        !Number.isFinite(destination.size) ||
        destination.size <= 0
      )
        return;
      const rates: number[] = [];
      for (const [node, target] of destination.items) {
        const before = origin.items.get(node) ?? target,
          velocity = origin.velocities?.get(node);
        for (const axis of ["x", "y"] as const)
          if (target[axis] !== before[axis]) rates.push((velocity?.[axis] ?? 0) / (target[axis] - before[axis]));
      }
      const rate = rates[0] ?? 0;
      const coherent = rates.every(
        (value) => Math.abs(value - rate) <= Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(rate)),
      );
      const nodes = new Set([
        host.current,
        destination.strip,
        ...destination.items.keys(),
        ...(destination.marker && marker.current ? [marker.current] : []),
      ]);
      if (!transaction.preflightVisuals(nodes)) return;
      const add = (node: HTMLElement, properties: string[]) => {
        const owner = transaction.register(node);
        owners.push(owner);
        const lease = owner.begin(revision, properties, { collectionVisuals: nodes }, cancel);
        if (!lease) return false;
        leases.push(lease);
        const effect = node.animate({}, { duration: 0, fill: "both" });
        effects.set(node, effect);
        if (node !== marker.current) registerTextGeometry(effect, lease, mode);
        return true;
      };
      if (
        !add(host.current, [
          ...new Set([
            destination.axis,
            "justify-content",
            ...(destination.crossWidth === undefined ? [] : ["width"]),
            ...(destination.crossHeight === undefined ? [] : ["height"]),
          ]),
        ])
      ) {
        cancel();
        return;
      }
      if (
        !add(destination.strip, [
          "width",
          "min-width",
          "max-width",
          "flex",
          ...(destination.axis === "height" || destination.crossHeight !== undefined
            ? ["height", "min-height", "max-height"]
            : []),
        ])
      ) {
        cancel();
        return;
      }
      for (const { item } of registrations.values())
        if (!item.project(nodes)) {
          cancel();
          return;
        }
      if (destination.marker && marker.current && !add(marker.current, ["transform"])) {
        cancel();
        return;
      }
      phase.jump(0);
      selectionPhase.jump(selection ? 0 : 1);
      extent.jump(origin.size);
      cross.jump(origin.crossWidth ?? origin.crossHeight ?? destination.crossWidth ?? destination.crossHeight ?? 0);
      path = { from: origin, to: destination, selection: selection?.from };
      write();
      const crossTarget = destination.crossWidth ?? destination.crossHeight;
      let pending = (crossTarget === undefined ? 2 : 3) + (selection ? 1 : 0);
      const run = generation;
      const complete = () => {
        if (run !== generation) return;
        if (!--pending) cancel();
      };
      animateSingleValue(extent, destination.size, {
        ...transition,
        velocity: origin.velocity ?? 0,
        onComplete: complete,
      });
      animateSingleValue(phase, 1, {
        ...positionTransition,
        velocity: coherent ? Math.max(0, rate) : 0,
        onComplete: complete,
      });
      if (crossTarget !== undefined) animateSingleValue(cross, crossTarget, { ...transition, onComplete: complete });
      if (selection) {
        const rates = (["x", "y", "width", "height"] as const).flatMap((key) => {
          const delta = (destination.marker?.[key] ?? selection.from[key]) - selection.from[key];
          return delta ? [(origin.markerVelocity?.[key] ?? 0) / delta] : [];
        });
        const rate = rates[0] ?? 0;
        animateSingleValue(selectionPhase, 1, {
          ...selection.transition,
          velocity: rates.every(
            (value) => Math.abs(value - rate) <= Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(rate)),
          )
            ? Math.max(0, rate)
            : 0,
          onComplete: complete,
        });
      }
    },
    invalidate() {
      cancel();
      baseline = null;
    },
    dispose() {
      alive = false;
      cancel();
      off();
      offSize();
      offCross();
      offSelection();
      unsubscribe();
    },
  };
}
