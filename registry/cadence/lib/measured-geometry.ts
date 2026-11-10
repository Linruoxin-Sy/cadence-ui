"use client";

import { animateSingleValue, motionValue, type Transition } from "motion/react";
import { createContext } from "react";
import { motionLimits } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import {
  collectMotionVisuals,
  createMotionTransaction,
  type MotionLease,
  type MotionRevision,
} from "./motion-transaction";

type Axis = "width" | "height";
/** Internal compound adapter boundary. The parent commits after children have
 * committed natural content; participating descendants share that transaction. */
export const GeometryScope = createContext<{
  controller: ReturnType<typeof createMeasuredGeometry>;
  transaction: ReturnType<typeof createMotionTransaction>;
  /** A compound adapter can coalesce descendant commits at its surviving owner. */
  request?: () => void;
} | null>(null);
export type GeometryTarget = {
  size: number;
  min?: number;
  max?: number;
  /** The adapter proves intermediate geometry preserves required content. */
  readable?: boolean;
  /** Known acyclic natural layout; percentage/ratio feedback uses native layout. */
  independent?: boolean;
  /** Only an adapter already owning a maintained native dimension supplies this. */
  resting?: string;
};
export type GeometryDestination = Partial<Record<Axis, GeometryTarget>>;
export type GeometryPolicy = { reduced: boolean; transition: Transition; available?: boolean };
type Reason = "commit" | "passive" | "focus";
type PixelCheck = { doc: Document; axis: Axis; size: number; used: number; accept(valid: boolean): void };

/** Batch CSS-pixel round trips in empty display probes, never caller content. */
function verifyPixels(checks: PixelCheck[]) {
  for (const doc of new Set(checks.map((check) => check.doc))) {
    const batch = checks.filter((check) => check.doc === doc),
      view = doc.defaultView;
    if (!doc.body || !view) {
      for (const check of batch) check.accept(false);
      continue;
    }
    const host = doc.createElement("div");
    host.setAttribute("data-cadence-geometry-probe", "");
    host.setAttribute("aria-hidden", "true");
    host.inert = true;
    host.style.cssText =
      "all:initial;position:fixed;top:0;left:0;width:0;height:0;overflow:clip;contain:strict;visibility:hidden;pointer-events:none";
    const root = host.attachShadow({ mode: "closed" });
    const probes = new Map<string, HTMLElement>();
    for (const check of batch) {
      const key = `${check.axis}/${check.size}`;
      if (probes.has(key)) continue;
      const probe = doc.createElement("div");
      probe.style.cssText = "all:initial;display:block;width:0;height:0;visibility:hidden";
      probe.style[check.axis] = `${check.size}px`;
      root.append(probe);
      probes.set(key, probe);
    }
    try {
      doc.body.append(host);
      const results = new Map([...probes].map(([key, probe]) => [key, view.getComputedStyle(probe)]));
      for (const check of batch)
        check.accept(Number.parseFloat(results.get(`${check.axis}/${check.size}`)?.[check.axis] ?? "") === check.used);
    } finally {
      host.remove();
    }
  }
}
type Adapter = {
  host: MotionHostRef<HTMLElement>;
  content: HTMLElement;
  axes: readonly Axis[];
  /** Native sizing adapter work is distinct from decorative participation. */
  maintained?: boolean;
  /** A real intrinsic content box keeps its destination width during shell resize. */
  destinationWidth?: boolean;
  /** Wrapper-free hosts observe bounded real child boxes for passive reflow. */
  observeChildren?: boolean;
  /** Read natural layout only. The one real content tree must be independent of the written axis. */
  measure(reason: Reason): GeometryDestination | null;
};

/** Layout dimensions, never transformed viewport rectangles. Unknown layout is not zero. */
function measurable(element: HTMLElement) {
  if (
    !element.isConnected ||
    (element.checkVisibility && !element.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })) ||
    !element.getClientRects().length
  )
    return false;
  return true;
}

export function naturalGeometry(element: HTMLElement): { width: number; height: number } | null {
  if (!measurable(element)) return null;
  const css = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (!css) return null;
  const width = Number.parseFloat(css.width);
  const height = Number.parseFloat(css.height);
  return Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
}

/**
 * An explicitly registered, bounded compound scope. Commit only after a semantic
 * revision is accepted. Observers/environment/input never manufacture revisions.
 * One outer host owns each same-cause axis: descendants lay out at their native
 * destinations before the outer host is measured, not at child spring frames.
 */
export function createMeasuredGeometry(transaction = createMotionTransaction()) {
  const owners = new Set<ReturnType<typeof makeOwner>>();
  let policy: GeometryPolicy = { reduced: true, transition: { duration: 0 } };
  let closed = false;
  let flushing = false;
  let committed: { revision: MotionRevision; policy: string; instant: boolean } | null = null;
  const makeOwner = (adapter: Adapter) => {
    const { host, content } = adapter;
    const node = host.current;
    if (!node) throw new Error("Geometry registration requires its committed host");
    const identity = host.identity;
    const registration = transaction.register(node);
    const values = { width: motionValue(0), height: motionValue(0) };
    const effects: Partial<Record<Axis, Animation>> = {};
    let contentWidth: Animation | null = null;
    const stops = new Set<() => void>();
    let baseline: GeometryDestination | null = null;
    let lease: MotionLease | null = null;
    let alive = true;
    let running = false;
    let restricted = false;
    let stamp = "";
    let writingMode = "";
    let naturalWidth = 0;
    let naturalHeight = 0;
    const naturalChildren = new Map<Element, { width: number; height: number }>();
    let constraints = "";
    const constraintSignature = () =>
      JSON.stringify([
        node.className,
        ...[
          "width",
          "height",
          "min-width",
          "min-height",
          "max-width",
          "max-height",
          "overflow",
          "padding",
          "box-sizing",
          "display",
          "gap",
        ].map((property) => node.style.getPropertyValue(property)),
      ]);
    let sampled: Partial<Record<Axis, { size: number; velocity: number }>> = {};
    const current = () => alive && host.current === node && host.identity === identity && node.isConnected;
    const release = () => {
      contentWidth?.cancel();
      contentWidth = null;
      for (const stop of stops) stop();
      stops.clear();
      for (const axis of ["width", "height"] as const) {
        values[axis].stop();
        effects[axis]?.cancel();
        delete effects[axis];
      }
    };
    const cancel = () => {
      lease?.cancel();
      release();
      running = false;
    };
    const owner = {
      adapter,
      node,
      current,
      baseline: () => baseline,
      restricted: () => restricted,
      capture() {
        sampled = {};
        if (!running || !current()) return;
        const box = naturalGeometry(node);
        if (!box) return;
        for (const axis of adapter.axes) {
          const size = box[axis],
            bounds = baseline?.[axis];
          let velocity = values[axis].getVelocity();
          if (
            (size <= (bounds?.min ?? 0) && velocity < 0) ||
            (size >= (bounds?.max ?? Number.POSITIVE_INFINITY) && velocity > 0)
          )
            velocity = 0;
          sampled[axis] = { size, velocity };
        }
      },
      read(reason: Reason) {
        if (!current() || !measurable(content)) {
          stamp = "";
          return null;
        }
        const result = adapter.measure(reason);
        naturalWidth = content.offsetWidth;
        naturalHeight = content.offsetHeight;
        if (adapter.observeChildren) {
          const children = Array.from(content.children).slice(0, motionLimits.collectionVisuals);
          for (const child of naturalChildren.keys())
            if (!children.includes(child)) {
              observer.unobserve(child);
              naturalChildren.delete(child);
            }
          for (const child of children)
            if (child instanceof HTMLElement) {
              if (!naturalChildren.has(child)) observer.observe(child, { box: "border-box" });
              naturalChildren.set(child, { width: child.offsetWidth, height: child.offsetHeight });
            }
          constraints = constraintSignature();
          attributes.takeRecords();
        }
        // RO sizes are border-box layout units; rounding matches offset sizes.
        writingMode = content.ownerDocument.defaultView?.getComputedStyle(content).writingMode ?? "";
        const vertical = /^(vertical|sideways)/.test(writingMode);
        stamp = vertical
          ? `${content.offsetHeight}/${content.offsetWidth}`
          : `${content.offsetWidth}/${content.offsetHeight}`;
        return result;
      },
      release,
      cancel,
      verify(destination: GeometryDestination | null, checks: PixelCheck[]) {
        if (!destination) return null;
        const css = node.ownerDocument.defaultView?.getComputedStyle(node);
        const result = { ...destination };
        for (const axis of adapter.axes) {
          const target = result[axis];
          if (!target) continue;
          const used = Number.parseFloat(css?.[axis] ?? "");
          const min = Math.max(0, target.min ?? 0),
            max = target.max ?? Number.POSITIVE_INFINITY;
          const size = Math.min(max, Math.max(min, target.resting === "auto" ? used : target.size));
          if (!Number.isFinite(used) || !Number.isFinite(size) || max < min) {
            delete result[axis];
            continue;
          }
          const accept = (valid: boolean) => {
            if (!valid) delete result[axis];
            else result[axis] = { ...target, size, ...(target.max === target.size && size < max ? { max: size } : {}) };
          };
          if (used === size) accept(true);
          else checks.push({ doc: node.ownerDocument, axis, size, used, accept });
        }
        return result;
      },
      apply(destination: GeometryDestination | null, revision: MotionRevision | null, animated: Set<Axis>) {
        const previous = baseline;
        baseline = destination ? { ...destination } : null;
        if (!current() || !destination) {
          stamp = "";
          cancel();
          return;
        }
        const axes = (["width", "height"] as const).filter((axis) => destination[axis]);
        const active = running;
        running = false;
        if (revision)
          lease = registration.begin(revision, axes, { collectionVisuals: new Set([node]) }, () => {
            release();
            running = false;
          });
        else {
          cancel();
          lease = null;
        }
        let pending = 0;
        for (const axis of axes) {
          const target = destination[axis];
          if (!target) continue;
          const min = Math.max(0, target.min ?? 0);
          const max = target.max ?? Number.POSITIVE_INFINITY;
          const valid = Number.isFinite(target.size) && Number.isFinite(min) && max >= min;
          if (!valid) continue;
          const size = Math.min(max, Math.max(min, target.size));
          if (baseline) baseline[axis] = { ...target, size };
          // This maintained dimension belongs to the adapter, never caller CSS.
          if (target.resting !== undefined) node.style[axis] = target.resting;
          const start = active ? sampled[axis]?.size : previous?.[axis]?.size;
          if (
            !lease?.current() ||
            !animated.has(axis) ||
            !target.readable ||
            !target.independent ||
            !Number.isFinite(start) ||
            start === size ||
            typeof node.animate !== "function"
          ) {
            values[axis].jump(size);
            continue;
          }
          values[axis].jump(start as number);
          if (axis === "width" && adapter.destinationWidth && content !== node) {
            const natural = naturalGeometry(content);
            if (natural && typeof content.animate === "function")
              contentWidth = content.animate({ width: `${natural.width}px` }, { duration: 0, fill: "both" });
          }
          // A replace-effect overlays CSS without capturing/restoring caller
          // declarations. Cancelling exposes the latest auto/flex/grid policy.
          const effect = node.animate(
            { [axis]: `${Math.min(max, Math.max(min, start as number))}px` },
            { duration: 0, fill: "both" },
          );
          effects[axis] = effect;
          const permit = lease;
          const write = (value: number) => {
            if (current() && permit.current())
              (effect.effect as KeyframeEffect | null)?.setKeyframes({
                [axis]: `${Math.min(max, Math.max(min, value))}px`,
              });
          };
          const unsubscribe = values[axis].on("change", write);
          pending++;
          running = true;
          animateSingleValue(values[axis], size, {
            ...policy.transition,
            velocity: active ? sampled[axis]?.velocity : 0,
            onComplete: () => {
              unsubscribe();
              stops.delete(unsubscribe);
              if (!current() || !permit.current()) return;
              effect.cancel();
              if (effects[axis] === effect) delete effects[axis];
              if (!--pending) {
                running = false;
                contentWidth?.cancel();
                contentWidth = null;
                permit.finish();
              }
            },
          });
          stops.add(unsubscribe);
        }
        if (!pending) lease?.finish();
      },
      dispose() {
        if (!alive) return;
        alive = false;
        owners.delete(owner);
        registration.dispose();
        release();
        for (const stop of stops) stop();
        observer.disconnect();
        attributes.disconnect();
        unsubscribeEnvironment();
        for (const event of ["focusin", "beforematch", "pointerdown", "beforeinput"])
          node.removeEventListener(event, input, true);
        view?.removeEventListener("resize", passive);
        view?.visualViewport?.removeEventListener("resize", passive);
        content.ownerDocument.fonts?.removeEventListener("loadingdone", passive);
        if (host.invalidate === owner.dispose) host.invalidate = undefined;
      },
    };
    const passive = () => flush(null, "passive");
    const delegated = () =>
      !adapter.maintained &&
      adapter.axes.every((axis) =>
        [...owners].some(
          (parent) => parent !== owner && parent.adapter.axes.includes(axis) && parent.node.contains(node),
        ),
      );
    const input = () => flush(null, "focus");
    const view = node.ownerDocument.defaultView;
    const observer = new ResizeObserver((entries) => {
      if (delegated()) return;
      if (
        adapter.observeChildren &&
        entries.some(({ target }) => {
          const baseline = naturalChildren.get(target);
          return (
            baseline &&
            target instanceof HTMLElement &&
            (baseline.width !== target.offsetWidth || baseline.height !== target.offsetHeight)
          );
        })
      ) {
        passive();
        return;
      }
      // A wrapper-free adapter may observe its own natural shell. Its owned
      // WAAPI axis is not a passive layout cause; an unowned axis still is.
      if (adapter.observeChildren && content === node && running && baseline) {
        const box = naturalGeometry(node);
        if (
          box &&
          (["width", "height"] as const).every(
            (axis) =>
              adapter.axes.includes(axis) ||
              Math.round(box[axis]) === Math.round(axis === "width" ? naturalWidth : naturalHeight),
          )
        )
          return;
      }
      const entry = entries.find((entry) => entry.target === content);
      const box = entry?.borderBoxSize?.[0];
      if (box && `${Math.round(box.inlineSize)}/${Math.round(box.blockSize)}` === stamp) return;
      passive();
    });
    observer.observe(content, { box: "border-box" });
    const attributes = new MutationObserver((records) => {
      if (
        !delegated() &&
        (view?.getComputedStyle(content).writingMode !== writingMode ||
          (adapter.observeChildren &&
            (constraintSignature() !== constraints || records.some((record) => record.type !== "attributes"))))
      )
        passive();
    });
    attributes.observe(content, {
      attributes: true,
      attributeFilter: ["style", "class"],
      ...(adapter.observeChildren ? { childList: true, characterData: true, subtree: true } : {}),
    });
    const unsubscribeEnvironment = subscribeMotionEnvironment(node.ownerDocument, (state) => {
      restricted = state.hidden || state.immediate || state.reduced;
      if (restricted) passive();
    });
    for (const event of ["focusin", "beforematch", "pointerdown", "beforeinput"])
      node.addEventListener(event, input, true);
    view?.addEventListener("resize", passive);
    view?.visualViewport?.addEventListener("resize", passive);
    content.ownerDocument.fonts?.addEventListener("loadingdone", passive);
    host.invalidate = owner.dispose;
    return owner;
  };
  const flush = (revision: MotionRevision | null, reason: Reason) => {
    if (closed || flushing) return;
    flushing = true;
    try {
      const registered = [...owners];
      for (const owner of registered) if (!owner.current()) owner.apply(null, null, new Set());
      const group = registered.filter((owner) => owner.current());
      // Preflight before visible-box capture, then release and resolve native
      // destinations in batches. Scalar callbacks never measure layout.
      const delegated = (owner: (typeof group)[number], axis: Axis) =>
        group.some(
          (parent) => parent !== owner && parent.adapter.axes.includes(axis) && parent.node.contains(owner.node),
        );
      const participants = group.filter((owner) => owner.adapter.axes.some((axis) => !delegated(owner, axis)));
      if (!collectMotionVisuals(new Set(participants.map((owner) => owner.node)))) {
        for (const owner of group) owner.apply(null, null, new Set());
        return;
      }
      for (const owner of participants) owner.capture();
      for (const owner of group) owner.release();
      const destinations = new Map<(typeof group)[number], GeometryDestination | null>();
      const maintained = group.filter((owner) => owner.adapter.maintained);
      const depth = (owner: (typeof group)[number]) =>
        group.filter((parent) => parent !== owner && parent.node.contains(owner.node)).length;
      // Native maintained dimensions resolve leaf-first in depth batches. This
      // is semantic layout work, never a collection of decorative child springs.
      for (const level of [...new Set(maintained.map(depth))].sort((a, b) => b - a)) {
        const batch = maintained.filter((owner) => depth(owner) === level);
        for (const owner of batch) destinations.set(owner, owner.read(reason));
        for (const owner of batch)
          for (const axis of owner.adapter.axes) {
            const resting = destinations.get(owner)?.[axis]?.resting;
            if (resting !== undefined) owner.node.style[axis] = resting;
          }
      }
      for (const owner of participants) if (!destinations.has(owner)) destinations.set(owner, owner.read(reason));
      const checks: PixelCheck[] = [];
      for (const [owner, destination] of destinations) destinations.set(owner, owner.verify(destination, checks));
      verifyPixels(checks);
      const immediate =
        policy.reduced || policy.available === false || policy.transition.duration === 0 || !revision?.current();
      for (const owner of group) {
        const focused = owner.node.contains(owner.node.ownerDocument.activeElement);
        const axes = new Set<Axis>();
        if (!immediate && !focused && !owner.restricted())
          for (const axis of owner.adapter.axes) if (!delegated(owner, axis)) axes.add(axis);
        owner.apply(destinations.get(owner) ?? null, revision, axes);
      }
    } catch (error) {
      for (const owner of owners) owner.apply(null, null, new Set());
      throw error;
    } finally {
      flushing = false;
    }
  };
  return {
    register(adapter: Adapter) {
      if (closed) throw new Error("Geometry scope is closed");
      const owner = makeOwner(adapter);
      owners.add(owner);
      committed = null;
      return owner.dispose;
    },
    commit(revision: MotionRevision, next: GeometryPolicy) {
      policy = next;
      const signature = JSON.stringify(next);
      if (committed?.revision === revision && committed.policy === signature) return;
      const instant = next.reduced || next.available === false || next.transition.duration === 0;
      const restoring = committed?.revision === revision && committed.instant && !instant;
      committed = { revision, policy: signature, instant };
      flush(restoring ? null : revision, "commit");
    },
    settle() {
      flush(null, "passive");
    },
    dispose() {
      closed = true;
      for (const owner of [...owners]) owner.dispose();
    },
  };
}
