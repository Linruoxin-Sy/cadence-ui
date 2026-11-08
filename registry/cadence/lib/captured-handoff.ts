"use client";

import { animateSingleValue, motionValue, type Transition } from "motion/react";
import { motionLimits } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { createMotionTransaction, type MotionRevision } from "./motion-transaction";

type Box = Pick<DOMRect, "left" | "top" | "width" | "height">;
type Capture = ReturnType<typeof captureHandoffOrigin>;
const plain = (node: HTMLElement, text: string) =>
  node.childNodes.length === 1 && node.firstChild?.nodeType === 3 && node.textContent === text;
const ancestors = (node: HTMLElement) => {
  const result: HTMLElement[] = [];
  for (let parent = node.parentElement; parent; parent = parent.parentElement) result.push(parent);
  return result;
};
const usable = (node: HTMLElement) => {
  const css = node.ownerDocument.defaultView?.getComputedStyle(node);
  return (
    node.isConnected &&
    !node.closest('[hidden],[inert],[aria-hidden="true"],[contenteditable]:not([contenteditable="false"])') &&
    css?.visibility === "visible" &&
    css.display !== "none" &&
    Number(css.opacity) > 0 &&
    node.getClientRects().length > 0
  );
};
const signature = (node: HTMLElement) => {
  const css = node.ownerDocument.defaultView?.getComputedStyle(node);
  if (!css) return null;
  const matrix = css.transform === "none" ? null : new DOMMatrixReadOnly(css.transform);
  if (matrix && (!matrix.is2D || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0)) return null;
  if (
    !["none", "1"].includes(css.scale) ||
    !["1", "normal"].includes(css.zoom) ||
    css.rotate !== "none" ||
    css.position === "sticky" ||
    css.perspective !== "none"
  )
    return null;
  return [
    css.visibility,
    css.display,
    css.direction,
    css.writingMode,
    css.font,
    css.lineHeight,
    css.zoom,
    css.transform,
    css.translate,
    css.position,
    css.width,
    css.height,
  ].join("/");
};
const finite = (box: Box) =>
  [box.left, box.top, box.width, box.height].every(Number.isFinite) && box.width > 0 && box.height > 0;

/** Capture only an explicit, plain display run while it is actually visible.
 * The adapter owns request/commit correspondence and may authorize native source retirement.
 * A missing/restored source never becomes a pending origin. No DOM search or glyph tracking.
 */
export function captureHandoffOrigin(
  source: HTMLElement,
  text: string,
  frame: HTMLElement | null = null,
  retirementRoot: HTMLElement = source,
) {
  if (!text || text.length > motionLimits.changedGraphemes || !plain(source, text) || !usable(source)) return null;
  const chain = [source, ...ancestors(source)];
  const styles = chain.map(signature);
  if (styles.some((style) => style === null) || (frame && !frame.contains(source))) return null;
  const rect = source.getBoundingClientRect();
  if (!finite(rect)) return null;
  const view = source.ownerDocument.defaultView;
  if (!view || rect.left < 0 || rect.top < 0 || rect.right > view.innerWidth || rect.bottom > view.innerHeight)
    return null;
  for (const node of chain) {
    const css = view.getComputedStyle(node);
    if (css.visibility !== "visible" || css.display === "none" || Number(css.opacity) === 0) return null;
    if (/(auto|scroll|hidden|clip)/.test(`${css.overflowX} ${css.overflowY}`)) {
      const clip = node.getBoundingClientRect();
      if (rect.left < clip.left || rect.top < clip.top || rect.right > clip.right || rect.bottom > clip.bottom)
        return null;
    }
  }
  const scrolls = chain.map((node) => [node.scrollLeft, node.scrollTop]);
  const doc = source.ownerDocument;
  const viewport = view.visualViewport;
  if (viewport && (viewport.scale !== 1 || viewport.offsetLeft !== 0 || viewport.offsetTop !== 0)) return null;
  const mapping = [view.innerWidth, view.innerHeight, viewport?.offsetLeft, viewport?.offsetTop, viewport?.scale];
  let valid = true;
  let consumed = false;
  let retired = false;
  let disposed = false;
  const listeners = new Set<() => void>();
  const invalidate = () => {
    if (!valid) return;
    valid = false;
    for (const notify of [...listeners]) notify();
  };
  const scroll = (event: Event) => {
    // A local layer travels with its frame. Only genuinely common *outer*
    // scrolling is harmless; scrolling either endpoint inside the frame is not.
    const target = event.target;
    if (frame && target instanceof Node && target !== frame && target.contains(frame)) return;
    if (target === doc || chain.includes(target as HTMLElement)) invalidate();
  };
  doc.addEventListener("scroll", scroll, true);
  view.addEventListener("resize", invalidate);
  viewport?.addEventListener("resize", invalidate);
  viewport?.addEventListener("scroll", invalidate);
  doc.fonts?.addEventListener("loadingdone", invalidate);
  const unsubscribe = subscribeMotionEnvironment(doc, (environment) => {
    if (environment.hidden || environment.immediate || environment.reduced) invalidate();
  });
  const observer = new ResizeObserver(() => {
    if (!capture.current(retired)) invalidate();
  });
  const mutations = new MutationObserver(() => {
    if (!capture.current(retired)) invalidate();
  });
  for (const node of chain) {
    observer.observe(node);
    mutations.observe(node, {
      attributes: true,
      childList: true,
      attributeFilter: ["class", "style", "dir", "hidden", "inert", "contenteditable"],
    });
  }
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    invalidate();
    doc.removeEventListener("scroll", scroll, true);
    view.removeEventListener("resize", invalidate);
    viewport?.removeEventListener("resize", invalidate);
    viewport?.removeEventListener("scroll", invalidate);
    doc.fonts?.removeEventListener("loadingdone", invalidate);
    observer.disconnect();
    mutations.disconnect();
    unsubscribe();
    listeners.clear();
  };
  const capture = {
    source,
    text,
    frame,
    rect: Object.freeze({ left: rect.left, top: rect.top, width: rect.width, height: rect.height }),
    /** Explicit disposal is required for refused requests as well as flights. */
    dispose,
    invalidate,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    take(allowRetirement: boolean) {
      if (consumed) return false;
      consumed = true;
      retired = allowRetirement;
      return this.current(retired);
    },
    current(retired: boolean) {
      if (!valid || (!source.isConnected && !retired)) return false;
      if (source.isConnected && (!plain(source, text) || (!retired && !usable(source)))) return false;
      if (source.isConnected && chain.some((node, i) => i > 0 && chain[i - 1]?.parentElement !== node)) return false;
      if (
        chain.some(
          (node, i) =>
            !(retired && (!node.isConnected || retirementRoot.contains(node))) && signature(node) !== styles[i],
        )
      )
        return false;
      if (chain.some((node, i) => node.scrollLeft !== scrolls[i]?.[0] || node.scrollTop !== scrolls[i]?.[1])) {
        // Ignore outer common scrolling only in local coordinates.
        if (
          !frame ||
          chain.some(
            (node, i) =>
              !node.contains(frame) && (node.scrollLeft !== scrolls[i]?.[0] || node.scrollTop !== scrolls[i]?.[1]),
          )
        )
          return false;
      }
      return mapping.every((value, i) =>
        Object.is(
          value,
          [view.innerWidth, view.innerHeight, viewport?.offsetLeft, viewport?.offsetTop, viewport?.scale][i],
        ),
      );
    },
  };
  return capture;
}

/** Internal one-revision presentation owner. Fallback before flight is distinct
 * from cancellation: the latter exposes the current semantic destination and
 * never asks the text integration to replay that consumed revision.
 */
export function createCapturedHandoff(transaction = createMotionTransaction()) {
  const consumed = new WeakSet<MotionRevision>();
  let active: { revision: MotionRevision; stop(): void; retime(transition: Transition): void } | null = null;
  let alive = true;
  return {
    commit(options: {
      revision: MotionRevision;
      capture: Capture;
      destination: HTMLElement;
      transition: Transition;
      immediate: boolean;
      sourceRetired: boolean;
      current(): boolean;
      fallback(): void;
      terminal(reason: "complete" | "cancel"): void;
      slot?: string;
    }) {
      if (!alive) return;
      const { revision, capture, destination, transition } = options;
      if (consumed.has(revision)) {
        if (active?.revision === revision) {
          if (options.immediate || transition.duration === 0 || !options.current()) active.stop();
          else active.retime(transition);
        }
        return;
      }
      consumed.add(revision);
      active?.stop();
      // Shell and outgoing representation are separate visuals. Preflight before
      // any destination measurement, paint allocation or native registration.
      const shellIdentity = {},
        paintIdentity = {};
      const eligible =
        alive &&
        revision.current() &&
        options.current() &&
        !options.immediate &&
        transition.duration !== 0 &&
        capture?.take(options.sourceRetired) &&
        transaction.preflightVisuals(new Set([shellIdentity, paintIdentity]));
      let started = false;
      const fallback = () => {
        capture?.dispose();
        if (alive && revision.current() && options.current()) options.fallback();
      };
      if (
        !eligible ||
        !capture ||
        !alive ||
        !revision.current() ||
        !options.current() ||
        !capture.current(options.sourceRetired) ||
        !plain(destination, capture.text) ||
        !usable(destination)
      )
        return fallback();
      const doc = destination.ownerDocument;
      if (doc !== capture.source.ownerDocument) return fallback();
      let restricted = false;
      subscribeMotionEnvironment(doc, (environment) => {
        restricted = environment.hidden || environment.immediate || environment.reduced;
      })();
      if (restricted) return fallback();
      const chain = [destination, ...ancestors(destination)];
      const styles = chain.map(signature);
      if (styles.some((style) => style === null)) return fallback();
      const frame = capture.frame;
      if (frame && (!frame.contains(destination) || doc.defaultView?.getComputedStyle(frame).position !== "relative"))
        return fallback();
      if (frame && (frame.scrollLeft !== 0 || frame.scrollTop !== 0)) return fallback();
      if (
        !frame &&
        [doc.body, doc.documentElement].some((node) => {
          const css = doc.defaultView?.getComputedStyle(node);
          return (
            css?.transform !== "none" ||
            css.translate !== "none" ||
            css.scale !== "none" ||
            css.filter !== "none" ||
            css.backdropFilter !== "none" ||
            css.contentVisibility !== "visible" ||
            css.perspective !== "none" ||
            /layout|paint|strict|content/.test(css.contain) ||
            /transform|filter|perspective/.test(css.willChange)
          );
        })
      )
        return fallback();
      const rect = destination.getBoundingClientRect();
      const frameRect = frame?.getBoundingClientRect();
      if (
        !finite(rect) ||
        (frameRect &&
          (!finite(frameRect) ||
            [rect, capture.rect].some(
              (box) =>
                box.left < frameRect.left ||
                box.top < frameRect.top ||
                box.left + box.width > frameRect.right ||
                box.top + box.height > frameRect.bottom,
            )))
      )
        return fallback();
      if (capture.rect.left === rect.left && capture.rect.top === rect.top) return fallback();
      if (
        !destination.animate ||
        destination
          .getAnimations()
          .some((animation) =>
            (animation.effect as KeyframeEffect | null)?.getKeyframes().some((key) => "opacity" in key),
          )
      )
        return fallback();
      const layer = doc.createElement("span"),
        paint = doc.createElement("span");
      layer.setAttribute("aria-hidden", "true");
      layer.inert = true;
      layer.dataset.cadenceHandoffLayer = "";
      Object.assign(layer.style, {
        position: frame ? "absolute" : "fixed",
        inset: "0",
        overflow: "clip",
        contain: "strict",
        pointerEvents: "none",
        overflowAnchor: "none",
        scrollSnapAlign: "none",
        zIndex: "60",
      });
      if (options.slot) paint.dataset.slot = options.slot;
      paint.dataset.cadenceHandoffPaint = "";
      paint.dataset.cadenceFlightText = capture.text;
      paint.setAttribute("aria-hidden", "true");
      paint.dataset.motion = "full";
      paint.className = "before:content-[attr(data-cadence-flight-text)]";
      const css = doc.defaultView?.getComputedStyle(destination);
      const nativeOpacity = destination.style.opacity;
      Object.assign(paint.style, {
        position: "absolute",
        left: `${rect.left - (frameRect?.left ?? 0) - (frame?.clientLeft ?? 0)}px`,
        top: `${rect.top - (frameRect?.top ?? 0) - (frame?.clientTop ?? 0)}px`,
        width: "max-content",
        height: `${rect.height}px`,
        whiteSpace: "pre",
        pointerEvents: "none",
        userSelect: "none",
        font: css?.font,
        letterSpacing: css?.letterSpacing,
        color: css?.color,
        opacity: css?.opacity,
        direction: css?.direction,
        writingMode: css?.writingMode,
        overflowAnchor: "none",
        scrollSnapAlign: "none",
      });
      const registration = transaction.register(paint);
      const visibility = transaction.register(destination);
      const x = motionValue(capture.rect.left - rect.left),
        y = motionValue(capture.rect.top - rect.top);
      let effect: Animation | null = null,
        hidden: Animation | null = null;
      let done = false;
      const offs: (() => void)[] = [];
      const observer = new ResizeObserver(() => {
        if (!done && !valid()) stop();
      });
      const mutations = new MutationObserver(() => {
        if (!done && !valid()) stop();
      });
      const valid = () =>
        alive &&
        revision.current() &&
        options.current() &&
        destination.isConnected &&
        destination.style.opacity === nativeOpacity &&
        capture.current(options.sourceRetired) &&
        plain(destination, capture.text) &&
        chain.every((node, i) => signature(node) === styles[i] && (i === 0 || chain[i - 1]?.parentElement === node)) &&
        (() => {
          const now = destination.getBoundingClientRect();
          return ["left", "top", "width", "height"].every((key) =>
            frame && (key === "left" || key === "top")
              ? now[key as keyof Box] - frame.getBoundingClientRect()[key as "left" | "top"] ===
                rect[key as keyof Box] - (frameRect?.[key as "left" | "top"] ?? 0)
              : now[key as keyof Box] === rect[key as keyof Box],
          );
        })();
      const finish = (reason: "complete" | "cancel") => {
        if (done) return;
        done = true;
        x.stop();
        y.stop();
        effect?.cancel();
        hidden?.cancel();
        observer.disconnect();
        mutations.disconnect();
        for (const off of offs) off();
        capture.dispose();
        layer.remove();
        registration.dispose();
        visibility.dispose();
        if (active?.revision === revision) active = null;
        if (started) options.terminal(reason);
      };
      const stop = () => finish("cancel");
      const work = {
        collectionVisuals: new Set([shellIdentity, paintIdentity]),
        changedGraphemes: capture.text.length,
      };
      const lease = registration.begin(revision, ["transform"], work, stop);
      const visibilityLease = visibility.begin(revision, ["opacity"], {}, stop);
      if (!lease?.current() || !visibilityLease?.current()) {
        registration.dispose();
        visibility.dispose();
        return fallback();
      }
      started = true;
      layer.append(paint);
      (frame ?? doc.body).append(layer);
      effect = paint.animate({}, { duration: 0, fill: "both" });
      hidden = destination.animate({ opacity: 0 }, { duration: 0, fill: "both" });
      const write = () => {
        if (!done && lease.current())
          (effect?.effect as KeyframeEffect | null)?.setKeyframes({
            transform: `translate(${x.get()}px, ${y.get()}px)`,
          });
      };
      offs.push(x.on("change", write), y.on("change", write), capture.subscribe(stop));
      const scroll = (event: Event) => {
        const target = event.target;
        if (frame && target instanceof Node && target !== frame && target.contains(frame)) return;
        if (target === doc || chain.includes(target as HTMLElement)) stop();
      };
      doc.addEventListener("scroll", scroll, true);
      offs.push(() => doc.removeEventListener("scroll", scroll, true));
      for (const node of chain) {
        observer.observe(node);
        mutations.observe(node, {
          attributes: true,
          attributeFilter: ["style", "class", "dir", "hidden", "inert", "contenteditable"],
          childList: true,
        });
      }
      const unsubscribe = subscribeMotionEnvironment(doc, (environment) => {
        if (environment.hidden || environment.immediate || environment.reduced) stop();
      });
      if (done) {
        unsubscribe();
        return;
      }
      offs.push(unsubscribe);
      let clock = "";
      const retime = (next: Transition) => {
        const signature = JSON.stringify(next);
        if (clock === signature || done) return;
        clock = signature;
        let pending = 2;
        for (const value of [x, y])
          animateSingleValue(value, 0, {
            ...next,
            onComplete() {
              if (!done && lease.current() && --pending === 0) finish("complete");
            },
          });
      };
      active = { revision, stop, retime };
      write();
      retime(transition);
    },
    cancel() {
      active?.stop();
    },
    dispose() {
      alive = false;
      active?.stop();
    },
  };
}
