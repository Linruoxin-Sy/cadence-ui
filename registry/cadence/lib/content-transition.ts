"use client";

import { animateSingleValue, motionValue } from "motion/react";
import { bindMotionParameters, contentMonth, contentSwitch } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionLease, type MotionRevision } from "./motion-transaction";
import type { CadenceMotion } from "./provider";

export type ContentPaint = {
  host: MotionHostRef<HTMLElement>;
  direction: number;
  axis?: "x" | "y";
  /** The adapter proves travel stays in its existing decorative paint lane. */
  travel: boolean;
};

/** One finite phase, shared by all actual paint participants. Never retains children. */
export function createContentTransition(transaction = createMotionTransaction()) {
  const phase = motionValue(1);
  let alive = true;
  let previous: MotionRevision | null = null;
  let mode = "none";
  let clock = "";
  let generation = 0;
  let reduced = true;
  let records: {
    release(): void;
    update(): void;
    sample(): { opacity: number; offset: number };
    node: HTMLElement;
    identity: object | undefined;
    axis: "x" | "y";
  }[] = [];
  let leases: MotionLease[] = [];
  const cancel = () => {
    generation++;
    phase.stop();
    const old = records;
    records = [];
    const oldLeases = leases;
    leases = [];
    for (const lease of oldLeases) lease.cancel();
    for (const record of old) record.release();
  };
  return {
    /** Natural local destination, accounting for this owner's current paint. */
    canTravel(
      root: HTMLElement,
      host: MotionHostRef<HTMLElement>,
      axis: "x" | "y",
      direction: number,
      distance: number,
    ) {
      const node = host.current,
        view = root.ownerDocument.defaultView;
      if (
        !node?.isConnected ||
        !root.isConnected ||
        !view ||
        !direction ||
        !root.contains(node) ||
        typeof DOMMatrixReadOnly === "undefined"
      )
        return false;
      const placement = view.getComputedStyle(node).position;
      if (placement === "fixed" || placement === "sticky") return false;
      let ancestor: HTMLElement | null = node.parentElement;
      for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement) {
        const css = view.getComputedStyle(ancestor);
        const matrix = css.transform === "none" ? null : new DOMMatrixReadOnly(css.transform);
        if (
          (matrix && (!matrix.is2D || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0)) ||
          (css.rotate !== "none" && Number.parseFloat(css.rotate) !== 0) ||
          (css.scale !== "none" && css.scale.split(" ").some((value) => Number(value) !== 1)) ||
          css.perspective !== "none" ||
          css.offsetPath !== "none" ||
          (ancestor !== root && root.contains(ancestor) && (css.position === "fixed" || css.position === "sticky")) ||
          (css.zoom && css.zoom !== "normal" && Number(css.zoom) !== 1)
        )
          return false;
      }
      if (ancestor) return false;
      const outer = root.getBoundingClientRect(),
        inner = node.getBoundingClientRect();
      const current = records.find((record) => record.node === node && record.identity === host.identity);
      const offset = current?.axis === axis ? current.sample().offset : 0;
      const margin =
        axis === "x"
          ? direction > 0
            ? outer.right - inner.right + offset
            : inner.left - outer.left - offset
          : direction > 0
            ? outer.bottom - inner.bottom + offset
            : inner.top - outer.top - offset;
      return margin >= distance;
    },
    commit(
      revision: MotionRevision,
      paints: readonly ContentPaint[],
      cm: CadenceMotion,
      month = false,
      available = true,
    ) {
      if (!alive) return;
      const parameters = cm.parameters(
        bindMotionParameters(
          month ? contentMonth : contentSwitch,
          month ? "data.transition/month-grid" : "data.transition/directional-content",
        ),
      );
      if (parameters.kind !== "visual") return;
      const nextClock = JSON.stringify(parameters.opacity);
      const same = previous === revision;
      const nodes = paints.map(({ host }) => host.current);
      const retained = records.every((record) =>
        paints.some(({ host }) => host.current === record.node && host.identity === record.identity),
      );
      if (same) {
        if (cm.disabled || !parameters.opacity.duration || !available || !retained || (month && clock !== nextClock))
          cancel();
        else if (mode === "full" && cm.reduced) {
          // Month's native adapter settles; panel opacity can finish without travel.
          if (month) cancel();
          else {
            reduced = true;
            for (const record of records) record.update();
            phase.stop();
            const epoch = ++generation;
            animateSingleValue(phase, 1, {
              ...parameters.opacity,
              onComplete: () => {
                if (generation === epoch) cancel();
              },
            });
          }
        }
        mode = cm.mode;
        clock = nextClock;
        return;
      }
      const sampled = new Map(records.map((record) => [record.node, record.sample()]));
      cancel();
      previous = revision;
      mode = cm.mode;
      clock = nextClock;
      // Count all participants before reading any of their layout/paint.
      if (
        !available ||
        cm.disabled ||
        cm.timeScale === 0 ||
        !revision.current() ||
        !transaction.preflightVisuals(new Set(nodes.filter((n) => n !== null)))
      )
        return;
      if (!parameters.opacity.duration) return;
      reduced = cm.reduced;
      for (const paint of paints) {
        const node = paint.host.current;
        if (
          !node?.isConnected ||
          !node.getClientRects().length ||
          node.contains(node.ownerDocument.activeElement) ||
          !node.animate
        )
          continue;
        const identity = paint.host.identity;
        const registration = transaction.register(node);
        const css = node.ownerDocument.defaultView?.getComputedStyle(node);
        if (css?.visibility !== "visible") {
          registration.dispose();
          continue;
        }
        // A caller's transform channel remains authoritative; no composition by guessing.
        const native = new Set(
          (node.getAnimations?.() ?? []).flatMap((animation) =>
            animation.playState === "idle"
              ? []
              : ((animation.effect as KeyframeEffect | null)?.getKeyframes().flatMap((frame) => Object.keys(frame)) ??
                []),
          ),
        );
        const travel =
          paint.travel &&
          !["transform", "translate", "rotate", "scale"].some((property) => native.has(property)) &&
          css.transform === "none" &&
          css.translate === "none" &&
          css.rotate === "none" &&
          css.scale === "none";
        const opacity = Number(css.opacity);
        const fade = node.style.opacity === "" && !native.has("opacity");
        const start = sampled.get(node) ?? { opacity: 0, offset: paint.direction * parameters.distance };
        const properties = [...(fade ? ["opacity"] : []), ...(travel && !reduced ? ["transform"] : [])];
        if (!properties.length) {
          registration.dispose();
          continue;
        }
        let effect: Animation | undefined;
        let unsubscribe = () => {};
        const lease = registration.begin(
          revision,
          properties,
          { collectionVisuals: new Set(nodes.filter((n) => n !== null)) },
          cancel,
        );
        if (!lease) {
          registration.dispose();
          cancel();
          return;
        }
        const current = () =>
          alive &&
          lease.current() &&
          paint.host.current === node &&
          paint.host.identity === identity &&
          node.isConnected;
        const invalidate = () => {
          if (current()) cancel();
        };
        const write = (progress: number) => {
          if (!current()) return;
          const frame: Keyframe = fade ? { opacity: start.opacity + (opacity - start.opacity) * progress } : {};
          if (travel && !reduced)
            frame.transform = `translate${paint.axis === "y" ? "Y" : "X"}(${start.offset * (1 - progress)}px)`;
          else if (travel && properties.includes("transform")) frame.transform = "none";
          (effect?.effect as KeyframeEffect | null)?.setKeyframes([frame]);
        };
        effect = node.animate({}, { duration: 0, fill: "both" });
        write(0);
        const off = phase.on("change", write);
        const view = node.ownerDocument.defaultView;
        const size = `${node.offsetWidth}/${node.offsetHeight}`;
        const vertical = /^(vertical|sideways)/.test(css.writingMode);
        const resize = new ResizeObserver((entries) => {
          if (!current()) return;
          if (
            entries.some((entry) => {
              const box = entry.borderBoxSize?.[0];
              return (
                box &&
                `${Math.round(vertical ? box.blockSize : box.inlineSize)}/${Math.round(vertical ? box.inlineSize : box.blockSize)}` !==
                  size
              );
            })
          )
            cancel();
        });
        resize.observe(node, { box: "border-box" });
        view?.addEventListener("resize", invalidate);
        view?.visualViewport?.addEventListener("resize", invalidate);
        node.ownerDocument.fonts?.addEventListener("loadingdone", invalidate);
        const releaseGeometry = () => {
          resize.disconnect();
          view?.removeEventListener("resize", invalidate);
          view?.visualViewport?.removeEventListener("resize", invalidate);
          node.ownerDocument.fonts?.removeEventListener("loadingdone", invalidate);
        };
        // Bounded lifetime invalidation only: these callbacks never infer a
        // content revision or sample layout on a frame.
        const withoutClock = (style: string) =>
          style
            .replace(/--(?:(?:motion-|ease-cadence-)[\w-]+|cadence-(?:time-scale|recipe-enabled))\s*:[^;]*;?/g, "")
            .trim();
        const attributes = new MutationObserver((entries) => {
          if (!current()) return;
          if (
            entries.some(
              (entry) =>
                entry.attributeName !== "style" ||
                withoutClock(entry.oldValue ?? "") !== withoutClock((entry.target as HTMLElement).style.cssText),
            )
          )
            cancel();
        });
        let ancestor: HTMLElement | null = node;
        for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement)
          attributes.observe(ancestor, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ["class", "style", "hidden", "data-closed", "data-ending-style"],
          });
        const visibility = new IntersectionObserver(
          (entries) => {
            if (!current()) return;
            if (
              entries.some((entry) => entry.target === node && (!entry.isIntersecting || entry.intersectionRatio === 0))
            )
              cancel();
          },
          { threshold: Number.EPSILON },
        );
        visibility.observe(node);
        let restricted = false;
        unsubscribe = subscribeMotionEnvironment(node.ownerDocument, (environment) => {
          if (!current()) return;
          if (environment.hidden || environment.immediate) {
            restricted = true;
            cancel();
          } else if (environment.reduced) {
            reduced = true;
            write(phase.get());
          }
        });
        if (restricted) {
          effect.cancel();
          off();
          attributes.disconnect();
          visibility.disconnect();
          releaseGeometry();
          unsubscribe();
          registration.dispose();
          cancel();
          return;
        }
        const input = invalidate;
        for (const event of ["focusin", "pointerdown", "beforeinput", "beforematch"])
          node.addEventListener(event, input, true);
        records.push({
          node,
          identity,
          axis: paint.axis ?? "x",
          update: () => write(phase.get()),
          sample: () => ({
            opacity: start.opacity + (opacity - start.opacity) * phase.get(),
            offset: reduced ? 0 : start.offset * (1 - phase.get()),
          }),
          release() {
            off();
            attributes.disconnect();
            visibility.disconnect();
            releaseGeometry();
            unsubscribe();
            registration.dispose();
            effect?.cancel();
            for (const event of ["focusin", "pointerdown", "beforeinput", "beforematch"])
              node.removeEventListener(event, input, true);
          },
        });
        leases.push(lease);
      }
      if (!records.length) return;
      phase.jump(0);
      const epoch = generation;
      animateSingleValue(phase, 1, {
        ...parameters.opacity,
        onComplete: () => {
          if (generation === epoch) cancel();
        },
      });
    },
    cancel,
    dispose() {
      alive = false;
      cancel();
    },
  };
}
