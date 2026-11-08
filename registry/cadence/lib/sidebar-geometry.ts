"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { naturalGeometry } from "./measured-geometry";
import { bindMotionParameters, geometryCompact, layoutSidebar } from "./motion";
import { subscribeMotionEnvironment } from "./motion-environment";
import { usePresentationScope } from "./motion-presence";
import type { MotionHostRef } from "./motion-ref";
import { createMotionTransaction } from "./motion-transaction";
import { useCadenceMotion } from "./provider";
import { createSizeLinkedGeometry, type SizeLinkedDestination } from "./size-linked-geometry";

/** Desktop offcanvas adapter. Icon label-lane choreography remains a separate adoption. */
export function useSidebarGeometry(
  gapHost: MotionHostRef<HTMLDivElement>,
  panelHost: MotionHostRef<HTMLDivElement>,
  state: string,
  configuration: string,
  enabled: boolean,
) {
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
      const focused = doc.activeElement;
      return Boolean(
        captures.size ||
          (focused instanceof HTMLElement &&
            wrapper.contains(focused) &&
            (focused.matches("input,textarea,select") || focused.isContentEditable)),
      );
    };
    const measure = (): SizeLinkedDestination | null => {
      const box = naturalGeometry(gap),
        shell = naturalGeometry(panel);
      if (!box || !shell || !view) return null;
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
        Number.parseFloat(paint[sign === 1 ? "right" : "left"]) !== (closed ? -shell.width : 0) ||
        (closed ? box.width !== 0 : box.width !== shell.width)
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
          (matrix &&
            !matrix.isIdentity &&
            (!matrix.is2D || matrix.a !== 1 || matrix.d !== 1 || matrix.b !== 0 || matrix.c !== 0))
        )
          return null;
      }
      return { gap: box.width, width: shell.width, sign };
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
        !available ||
        layout.kind !== "layout" ||
        Boolean(parent && !parent.available()) ||
        editor();
      const revision = transaction.revision("layout", target, gap);
      const prepared = projection.prepare(revision, transition, immediate);
      if (prepared) projection.commit(revision, prepared.permitted ? measure() : null, transition, immediate, prepared);
    };
    const passive = () => {
      if (alive) {
        projection.invalidate();
        flush(true);
      }
    };
    const input = (event: Event) => {
      if (event.type === "gotpointercapture" && event.target) captures.add(event.target);
      if (event.type === "lostpointercapture" && event.target) captures.delete(event.target);
      if (editor()) passive();
    };
    const observer = new MutationObserver(passive);
    for (const element of [panel, ...ancestors])
      observer.observe(element, { attributes: true, attributeFilter: ["class", "style", "dir", "hidden"] });
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
      observer.disconnect();
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
  }, [configuration, enabled, gapHost, panelHost, transaction, parent]);
  useLayoutEffect(() => {
    latest.current = { cm, state, enabled };
    connection.current?.flush();
  });
}
