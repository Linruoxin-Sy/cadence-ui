"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { naturalGeometry } from "./measured-geometry";
import { bindMotionParameters, geometryCompact, layoutSidebar } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { usePresentationScope } from "./motion-presence";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionRevision } from "./motion-transaction";
import { useCadenceMotion } from "./provider";
import { createSidebarLabels, prepareSidebarLabels, sidebarLabelNodes } from "./sidebar-labels";
import { createSizeLinkedGeometry, type SizeLinkedDestination } from "./size-linked-geometry";

/** One desktop physical size owner, with offcanvas or icon projections. */
export function useSidebarGeometry(
  gapHost: MotionHostRef<HTMLDivElement>,
  panelHost: MotionHostRef<HTMLDivElement>,
  state: string,
  configuration: string,
  enabled: boolean,
  icon = false,
) {
  const [labels] = useState(createSidebarLabels);
  const parent = usePresentationScope();
  const [transaction] = useState(() => parent?.transaction ?? createMotionTransaction());
  const cm = useCadenceMotion(panelHost);
  const latest = useRef({ cm, state, enabled });
  const connection = useRef<{ dispose(): void; flush(): void } | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a side/variant/breakpoint change retires the physical projection before establishing a new baseline
  useLayoutEffect(() => {
    const gap = gapHost.current,
      panel = panelHost.current;
    if (!gap || !panel || !enabled) return;
    const wrapper = gap.closest<HTMLElement>('[data-slot="sidebar-wrapper"]');
    if (!wrapper || panel.parentElement !== gap.parentElement) return;
    const projection = createSizeLinkedGeometry(gapHost, panelHost, transaction);
    let labelGate: ReturnType<typeof prepareSidebarLabels> = null;
    let labelRevision: MotionRevision | null = null;
    let alive = true;
    const captures = new Set<EventTarget>();
    const doc = panel.ownerDocument,
      view = doc.defaultView;
    const ancestors: HTMLElement[] = [];
    for (
      let element: HTMLElement | null = panel.parentElement;
      element && ancestors.length < 32;
      element = element.parentElement
    )
      ancestors.push(element);
    const editor = () => {
      for (const target of captures)
        if (target instanceof Node && (!target.isConnected || !wrapper.contains(target))) captures.delete(target);
      const focused = doc.activeElement;
      return Boolean(
        captures.size ||
          (icon && focused instanceof HTMLElement && panel.contains(focused)) ||
          (focused instanceof HTMLElement &&
            wrapper.contains(focused) &&
            (focused.matches("input,textarea,select") || focused.isContentEditable)),
      );
    };
    const measure = (): SizeLinkedDestination | null => {
      const box = naturalGeometry(gap),
        shell = naturalGeometry(panel);
      if (!box || !shell || !view) return null;
      if (gap.getAnimations().length || panel.getAnimations().length) return null;
      // An unexamined outer transform is not a proven coordinate space.
      if (ancestors.at(-1)?.parentElement) return null;
      const paint = view.getComputedStyle(panel),
        gapPaint = view.getComputedStyle(gap);
      const sign = panel.dataset.side === "right" ? 1 : -1;
      const closed = latest.current.state === "collapsed";
      if (
        paint.boxSizing !== "border-box" ||
        gapPaint.boxSizing !== "border-box" ||
        paint.transform !== "none" ||
        paint.translate !== "none" ||
        paint.rotate !== "none" ||
        paint.scale !== "none" ||
        !["fixed", "absolute"].includes(paint.position) ||
        Number.parseFloat(paint[sign === 1 ? "right" : "left"]) !== (closed && !icon ? -shell.width : 0) ||
        (!icon && (closed ? box.width !== 0 : box.width !== shell.width))
      )
        return null;
      for (const element of ancestors) {
        const css = view.getComputedStyle(element);
        const matrix = css.transform === "none" ? null : new DOMMatrixReadOnly(css.transform);
        if (
          css.rotate !== "none" ||
          css.scale !== "none" ||
          css.perspective !== "none" ||
          css.offsetPath !== "none" ||
          (css.zoom && css.zoom !== "normal" && Number(css.zoom) !== 1) ||
          (matrix &&
            !matrix.isIdentity &&
            (!matrix.is2D || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0))
        )
          return null;
      }
      return { gap: box.width, width: shell.width, sign, ...(icon && { icon: true }) };
    };
    const flush = (settle = false) => {
      if (!alive || gapHost.current !== gap || panelHost.current !== panel) return;
      const { cm: policy, state: target, enabled: available } = latest.current;
      const size = policy.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
      const layout = policy.parameters(bindMotionParameters(layoutSidebar, "layout.move/size-linked"));
      const transition = size.kind === "geometry" ? size.transition : { duration: 0 };
      const immediate =
        settle ||
        policy.reduced ||
        transition.duration === 0 ||
        !available ||
        layout.kind !== "layout" ||
        Boolean(parent && !parent.available()) ||
        (icon && [...labels.entries.values()].some((entry) => entry.blocked)) ||
        editor();
      const revision = transaction.revision("layout", target, gap);
      const visuals = new Set<HTMLElement>([gap, panel]);
      if (icon)
        for (const { entry, node } of sidebarLabelNodes(labels)) {
          visuals.add(node instanceof HTMLElement ? node : entry.node);
          if (entry.group) visuals.add(entry.node);
        }
      const prepared = projection.prepare(revision, transition, immediate, visuals);
      if (prepared) {
        // Clock-only size retiming preserves pending/active paint's captured clock.
        const retained = !immediate && labelGate && labelRevision === revision;
        if (!retained) {
          labelGate?.cancel();
          labelGate = null;
          labelRevision = null;
        }
        const destination = prepared.permitted ? measure() : null;
        if (!destination) {
          labelGate?.cancel();
          labelGate = null;
          labelRevision = null;
        }
        if (!retained && icon && destination && target !== "collapsed" && !immediate) {
          labelGate = prepareSidebarLabels(labels, transaction, revision);
          labelRevision = revision;
        }
        // No safe destination-width label lane means native geometry for the group.
        const unsafe = icon && target !== "collapsed" && !immediate && !labelGate;
        if (labelGate && !retained && !labelGate.start()) {
          labelGate = null;
          labelRevision = null;
          projection.invalidate();
          return;
        }
        const started = projection.commit(
          revision,
          destination,
          transition,
          immediate || unsafe,
          prepared,
          () => labelGate?.complete(),
          visuals,
        );
        if (!started && !retained) {
          labelGate?.cancel();
          labelGate = null;
          labelRevision = null;
        }
      }
    };
    const passive = () => {
      if (alive) {
        projection.invalidate();
        labelGate?.cancel();
        labelGate = null;
        labelRevision = null;
        flush(true);
      }
    };
    const input = (event: Event) => {
      if (event.type === "gotpointercapture" && event.target) captures.add(event.target);
      if (event.type === "lostpointercapture" && event.target) captures.delete(event.target);
      if (editor()) passive();
    };
    const mutated = (records: MutationRecord[]) => {
      // Timing-token notifications are reconciled by the policy subscription:
      // positive clocks retime the one scalar, rather than losing its origin.
      const layout = records.some((record) => {
        if (record.type !== "attributes" || record.attributeName !== "style") return true;
        const old = doc.createElement("span").style;
        old.cssText = record.oldValue ?? "";
        const next = (record.target as HTMLElement).style;
        return [...new Set([...old, ...next])].some(
          (key) =>
            !key.startsWith("--motion-") &&
            !key.startsWith("--cadence-") &&
            (old.getPropertyValue(key) !== next.getPropertyValue(key) ||
              old.getPropertyPriority(key) !== next.getPropertyPriority(key)),
        );
      });
      if (layout) passive();
    };
    const observer = new MutationObserver(mutated);
    for (const element of [panel, ...ancestors])
      observer.observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style", "dir", "hidden"],
      });
    const labelObserver = new MutationObserver(mutated);
    const watchLabels = () => {
      labelObserver.disconnect();
      if (icon)
        for (const { node } of labels.entries.values())
          labelObserver.observe(node, {
            childList: true,
            characterData: true,
            subtree: true,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: [
              "class",
              "style",
              "dir",
              "hidden",
              "data-active",
              "data-state",
              "data-size",
              "aria-expanded",
              "aria-current",
              "aria-hidden",
              "aria-invalid",
              "disabled",
            ],
          });
    };
    watchLabels();
    labels.invalidate = () => {
      watchLabels();
      passive();
    };
    let stamp = `${wrapper.offsetWidth}/${wrapper.offsetHeight}`;
    const resize = new ResizeObserver(() => {
      const next = `${wrapper.offsetWidth}/${wrapper.offsetHeight}`;
      if (next !== stamp) passive();
      stamp = next;
    });
    resize.observe(wrapper);
    const environment = subscribeMotionEnvironment(doc, passive);
    for (const event of ["focusin", "beforeinput", "gotpointercapture", "lostpointercapture"])
      wrapper.addEventListener(event, input, true);
    view?.addEventListener("resize", passive);
    view?.visualViewport?.addEventListener("resize", passive);
    view?.visualViewport?.addEventListener("scroll", passive);
    const dispose = () => {
      if (!alive) return;
      alive = false;
      projection.dispose();
      labelGate?.cancel();
      labels.invalidate = undefined;
      observer.disconnect();
      labelObserver.disconnect();
      resize.disconnect();
      environment();
      for (const event of ["focusin", "beforeinput", "gotpointercapture", "lostpointercapture"])
        wrapper.removeEventListener(event, input, true);
      view?.removeEventListener("resize", passive);
      view?.visualViewport?.removeEventListener("resize", passive);
      view?.visualViewport?.removeEventListener("scroll", passive);
      if (gapHost.invalidate === dispose) gapHost.invalidate = undefined;
      if (panelHost.invalidate === dispose) panelHost.invalidate = undefined;
    };
    gapHost.invalidate = panelHost.invalidate = dispose;
    connection.current = { dispose, flush };
    return () => {
      dispose();
      connection.current = null;
    };
  }, [configuration, enabled, gapHost, panelHost, transaction, parent, icon, labels]);
  useLayoutEffect(() => {
    latest.current = { cm, state, enabled };
    connection.current?.flush();
  });
  return labels;
}
