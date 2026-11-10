"use client";

import type { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  isValidElement,
  type ReactNode,
  useCallback,
  useContext,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type ContentPaint, createContentTransition } from "./content-transition";
import { useStateColor } from "./css-motion";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "./measured-geometry";
import { bindMotionParameters, geometryCompact, layoutCompact, layoutSelection, motionLimits } from "./motion";
import { usePresentationScope } from "./motion-presence";
import { useMotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionRevision } from "./motion-transaction";
import { useCadenceMotion } from "./provider";
import { createSelectionProjection, type SelectionBox } from "./selection-projection";
import { tabsColourReadable, tabsColourScope } from "./tabs-colour";
import { createTabsItem, createTabsLayout, type TabsStripSnapshot } from "./tabs-layout";
import { nativeTextContext } from "./text-layout";
import { useNumberPresentation } from "./use-number-presentation";
import { useTextPresentation } from "./use-text-presentation";

function createScope(transaction = createMotionTransaction()) {
  return {
    transaction,
    lists: new Set<() => void>(),
    host: null as HTMLElement | null,
    presented: false,
  };
}
const Root = createContext<ReturnType<typeof createScope> | null>(null);
type Trigger = {
  host: HTMLElement;
  value: unknown;
  active: boolean;
  content: unknown;
  item: ReturnType<typeof createTabsItem>;
};
const List = createContext<Map<object, Trigger> | null>(null);

export function TabsMotionRoot({ children }: { children: ReactNode }) {
  const parent = usePresentationScope();
  const [scope] = useState(() => createScope(parent?.transaction));
  return <Root value={scope}>{children}</Root>;
}

/** Root's committed layout phase follows the primitive's actual selection commit. */
export function TabsRootSurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: TabsPrimitive.Root.State;
  render: TabsPrimitive.Root.Props["render"];
}) {
  const scope = useContext(Root);
  const owner = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      if (scope && scope.host !== element) {
        scope.host = element;
        scope.presented = false;
      }
      return owner.ref(element);
    },
    [scope, owner.ref],
  );
  useLayoutEffect(() => {
    for (const flush of scope?.lists ?? []) flush();
    if (scope) scope.presented = true;
  });
  return useRender({ defaultTagName: "div", render, state: { ...state }, props: { ...elementProps, ref } });
}

export function TabsListSurface({
  elementProps,
  state,
  render,
  variant,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: TabsPrimitive.List.State & { slot?: string };
  render: TabsPrimitive.List.Props["render"];
  variant: string;
}) {
  const scope = useContext(Root);
  const [triggers] = useState(() => new Map<object, Trigger>());
  const { node, ref } = useMotionHostRef(elementProps.ref);
  const strip = useRef<HTMLDivElement>(null);
  const marker = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const TrackPaint = useStateColor(
    ref,
    cm,
    ["background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    {
      readability: safeTabsPaint(elementProps) ? "verified" : "immediate",
      readabilityGate: tabsColourReadable,
      readabilityScope: tabsColourScope,
    },
  );
  const markerCm = useCadenceMotion(marker.node);
  const markerShape = useRef(variant);
  const shapeChanged = markerShape.current !== variant;
  const MarkerPaint = useStateColor(
    marker.ref,
    markerCm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: safeTabsPaint(elementProps) ? "verified" : "immediate",
      immediate: shapeChanged,
      readabilityGate: tabsColourReadable,
      readabilityScope: tabsColourScope,
    },
  );
  useLayoutEffect(() => {
    markerShape.current = variant;
  });
  const latest = useRef({ cm, markerCm, variant });
  const configuration = useRef("");
  const connection = useRef<{ dispose(): void; flush(): void } | null>(null);
  const captured = useRef(false);
  const separated = supportsFlowRender(render);
  useLayoutEffect(() => {
    latest.current = { cm, markerCm, variant };
    const shape = `${variant}/${state.orientation}/${separated}`;
    if (configuration.current !== shape) {
      configuration.current = shape;
      connection.current?.dispose();
      connection.current = null;
      if (marker.node.current)
        for (const property of ["left", "top", "width", "height"]) marker.node.current.style.removeProperty(property);
    }
    if (!connection.current && node.current && marker.node.current && scope) {
      const list = node.current;
      const markerNode = marker.node.current;
      const thickness =
        Number.parseFloat(getComputedStyle(markerNode)[state.orientation === "vertical" ? "width" : "height"]) || 0;
      const projection = createSelectionProjection(marker.node, scope.transaction);
      const layout = createTabsLayout(node, marker.node, scope.transaction, triggers);
      let alive = true;
      let observed: HTMLElement | null = null;
      const stamps = new Map<Element, string>();
      let lastRevision: MotionRevision | null = null;
      let cachedBox: SelectionBox | null = null;
      let crossOwned = false;
      let content: string | null = null;
      let lastPolicy = "";
      const identities = new Map<unknown, number>();
      let nextIdentity = 0;
      const identity = (value: unknown) => {
        if (!identities.has(value)) identities.set(value, nextIdentity++);
        return identities.get(value);
      };
      const invalidate = () => {
        if (!alive || node.current !== list) return;
        cachedBox = null;
        projection.invalidate();
        layout.invalidate();
        content = null;
        list.removeAttribute("data-marker-ready");
      };
      const flush = (force = false) => {
        if (!alive || node.current !== list) return;
        const active = [...triggers.values()].filter((record) => record.active && record.host.isConnected);
        const selected = active.length === 1 ? active[0] : null;
        const { cm: policy, markerCm: selectionPolicy, variant: shape } = latest.current;
        const revision = scope.transaction.revision("value", selected?.value ?? null, list);
        for (const value of identities.keys())
          if (![...triggers.values()].some((record) => Object.is(record.value, value))) identities.delete(value);
        const parameters = selectionPolicy.parameters(bindMotionParameters(layoutSelection, "layout.shared/selection"));
        const transition = parameters.kind === "layout" ? parameters.transition : { duration: 0 };
        const geometry = policy.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
        const reflow = policy.parameters(bindMotionParameters(layoutCompact, "layout.move/position"));
        const sizeClock = geometry.kind === "geometry" ? geometry.transition : { duration: 0 };
        const positionClock = reflow.kind === "layout" ? reflow.transition : { duration: 0 };
        const nextContent = JSON.stringify(
          [...triggers.values()]
            .sort((a, b) => (a.host.compareDocumentPosition(b.host) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
            .map((record) => [identity(record.value), record.content]),
        );
        const clock = JSON.stringify([
          policy.mode,
          selectionPolicy.mode,
          selectionPolicy.timeScale,
          sizeClock,
          positionClock,
        ]);
        const policyChanged = clock !== lastPolicy;
        if (lastRevision === revision && content === nextContent && !force && clock === lastPolicy) {
          projection.commit(revision, cachedBox, transition, selectionPolicy.reduced || shape !== "line");
          return;
        }
        const selectionChanged = lastRevision !== revision;
        const knownContent = content !== null && content !== nextContent;
        const wasReflowing = layout.running;
        const origin = layout.prepare();
        const sizeRevision = scope.transaction.revision("content", nextContent, strip);
        content = nextContent;
        lastPolicy = clock;
        lastRevision = revision;
        if (
          !policy.reduced &&
          !selectionPolicy.reduced &&
          shape === "line" &&
          transition.duration !== 0 &&
          !scope.transaction.preflightVisuals(new Set([markerNode]))
        ) {
          invalidate();
          return;
        }
        let box: SelectionBox | null = null;
        let safe = false;
        if (selected && list.getClientRects().length) {
          const target = selected.host;
          if (observed !== target) {
            if (observed) observer.unobserve(observed);
            observed = target;
            observer.observe(target);
          }
          stamps.set(list, `${list.offsetWidth}/${list.offsetHeight}`);
          stamps.set(target, `${target.offsetWidth}/${target.offsetHeight}`);
          const css = getComputedStyle(list),
            paint = getComputedStyle(target);
          const bounds = list.getBoundingClientRect(),
            rect = target.getBoundingClientRect();
          const sx = bounds.width / list.offsetWidth,
            sy = bounds.height / list.offsetHeight;
          safe =
            (target.parentElement === list || target.parentElement === strip.current) &&
            css.position !== "static" &&
            paint.position !== "fixed" &&
            paint.position !== "sticky" &&
            [css, paint].every(
              (style) =>
                style.rotate === "none" &&
                style.scale === "none" &&
                style.translate === "none" &&
                style.transform === "none",
            );
          let ancestor: HTMLElement | null = list;
          for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement) {
            const style = getComputedStyle(ancestor);
            const matrix = style.transform === "none" ? null : new DOMMatrixReadOnly(style.transform);
            if (
              style.rotate !== "none" ||
              (style.scale !== "none" &&
                style.scale.split(" ").some((value) => !Number.isFinite(Number(value)) || Number(value) <= 0)) ||
              style.perspective !== "none" ||
              style.offsetPath !== "none" ||
              (matrix && (!matrix.is2D || matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0))
            )
              safe = false;
          }
          if (sx > 0 && sy > 0 && rect.width > 0 && rect.height > 0) {
            box = {
              x:
                (rect.left - bounds.left) / sx +
                list.scrollLeft -
                list.clientLeft +
                Number.parseFloat(paint.borderLeftWidth),
              y:
                (rect.top - bounds.top) / sy +
                list.scrollTop -
                list.clientTop +
                Number.parseFloat(paint.borderTopWidth),
              width:
                rect.width / sx - Number.parseFloat(paint.borderLeftWidth) - Number.parseFloat(paint.borderRightWidth),
              height:
                rect.height / sy - Number.parseFloat(paint.borderTopWidth) - Number.parseFloat(paint.borderBottomWidth),
            };
            if (shape === "line") {
              if (state.orientation === "vertical") {
                box.x += box.width - thickness;
                box.width = thickness;
              } else {
                box.y += box.height - thickness;
                box.height = thickness;
              }
            }
          }
        }
        if (!safe) box = null;
        const natural = strip.current;
        const snapshot = natural ? stripSnapshot(list, natural, [...triggers.values()], box, state.orientation) : null;
        const eligible =
          separated &&
          safe &&
          snapshot &&
          !nativeTextContext(list) &&
          !list.contains(list.ownerDocument.activeElement) &&
          !captured.current &&
          !policy.reduced &&
          !selectionPolicy.reduced &&
          sizeClock.duration !== 0 &&
          positionClock.duration !== 0;
        // Selection and reflow never run separate writers on the marker. A new
        // selection during strip projection settles the entire affected geometry.
        const coordinated = Boolean(eligible && (knownContent || (wasReflowing && policyChanged)) && !selectionChanged);
        crossOwned = coordinated && snapshot?.crossWidth !== undefined;
        if (coordinated || wasReflowing) projection.cancel();
        cachedBox = box;
        projection.commit(
          revision,
          box,
          transition,
          selectionPolicy.reduced || shape !== "line" || !safe || coordinated || wasReflowing,
        );
        layout.commit(sizeRevision, snapshot, sizeClock, positionClock, !coordinated, origin);
        mutations.takeRecords();
        if (alive && node.current === list) list.toggleAttribute("data-marker-ready", Boolean(box));
      };
      const observer = new ResizeObserver((entries) => {
        if (
          entries.some((entry) => {
            const size = entry.borderBoxSize?.[0];
            if (size && entry.target === list && layout.running) {
              if (crossOwned) return false;
              const [width, height] = (stamps.get(list) ?? "").split("/").map(Number);
              if (
                state.orientation === "vertical"
                  ? Math.round(size.inlineSize) === width
                  : Math.round(size.blockSize) === height
              )
                return false;
            }
            return size && `${Math.round(size.inlineSize)}/${Math.round(size.blockSize)}` !== stamps.get(entry.target);
          })
        )
          invalidate();
      });
      observer.observe(list);
      // Content changes are invalidation only, never a synthetic selection.
      const mutations = new MutationObserver((entries) => {
        const withoutClock = (style: string) =>
          style
            .replace(
              /--(?:(?:motion-|ease-cadence-)[\w-]+|cadence-(?:inherited-[\w-]+|time-scale|recipe-enabled))\s*:[^;]*;?/g,
              "",
            )
            .replace(/transition(?:-[\w-]+)?\s*:[^;]*;?/g, "")
            .trim();
        if (
          entries.some(
            (entry) =>
              entry.type === "attributes" &&
              entry.target !== markerNode &&
              (entry.target === list ||
                !list.contains(entry.target) ||
                [...triggers.values()].some((record) => record.host === entry.target)) &&
              !["data-active", "aria-selected"].includes(entry.attributeName ?? "") &&
              (entry.attributeName !== "style" ||
                withoutClock(entry.oldValue ?? "") !== withoutClock((entry.target as HTMLElement).style.cssText)),
          )
        )
          invalidate();
        else if (entries.some((entry) => entry.type === "childList" || entry.type === "characterData")) invalidate();
        // Child text mutations are already consumed in committed content work.
        // Unknown descendants resize through the passive observer, never reflow.
      });
      mutations.observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style", "hidden", "contenteditable"],
      });
      const view = list.ownerDocument.defaultView;
      let ancestor = list.parentElement;
      for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement)
        mutations.observe(ancestor, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ["class", "style", "hidden", "contenteditable"],
        });
      view?.addEventListener("resize", invalidate);
      view?.visualViewport?.addEventListener("resize", invalidate);
      list.ownerDocument.fonts?.addEventListener("loadingdone", invalidate);
      scope.lists.add(flush);
      connection.current = {
        flush,
        dispose() {
          alive = false;
          scope.lists.delete(flush);
          projection.dispose();
          layout.dispose();
          observer.disconnect();
          mutations.disconnect();
          view?.removeEventListener("resize", invalidate);
          view?.visualViewport?.removeEventListener("resize", invalidate);
          list.ownerDocument.fonts?.removeEventListener("loadingdone", invalidate);
          list.removeEventListener("focusin", settleLayout);
          list.removeEventListener("pointerdown", capture);
          view?.removeEventListener("pointerup", releaseCapture);
          view?.removeEventListener("pointercancel", releaseCapture);
        },
      };
      const settleLayout = () => {
        layout.invalidate();
      };
      const capture = () => {
        captured.current = true;
        settleLayout();
      };
      const releaseCapture = () => {
        captured.current = false;
      };
      list.addEventListener("focusin", settleLayout);
      list.addEventListener("pointerdown", capture);
      view?.addEventListener("pointerup", releaseCapture);
      view?.addEventListener("pointercancel", releaseCapture);
      node.invalidate = () => {
        const old = connection.current;
        connection.current = null;
        old?.dispose();
      };
    }
    connection.current?.flush();
  });
  useInsertionEffect(
    () => () => {
      const old = connection.current;
      connection.current = null;
      old?.dispose();
    },
    [],
  );
  return (
    <List value={triggers}>
      {useRender({
        defaultTagName: "div",
        render,
        state: { ...state },
        props: {
          ...elementProps,
          ...TrackPaint,
          style: { ...TrackPaint.style, ...elementProps.style },
          "data-slot": "tabs-list",
          children: (
            <>
              {!separated ? (
                elementProps.children
              ) : (
                <div
                  ref={strip}
                  data-slot="tabs-strip"
                  className="inline-flex h-full min-w-0 flex-1 items-center justify-center gap-inherit [gap:inherit] group-data-[orientation=vertical]/tabs:flex-col"
                >
                  {elementProps.children}
                </div>
              )}
              <span
                {...MarkerPaint}
                aria-hidden="true"
                hidden
                data-slot="tabs-indicator"
                data-motion={markerCm.mode}
                className="pointer-events-none absolute top-0 left-0 -z-10 origin-top-left rounded-md bg-background shadow-sm dark:bg-input/30 data-[variant=line]:rounded-none data-[variant=line]:bg-foreground data-[variant=line]:shadow-none data-[variant=line]:h-0.5 data-[orientation=vertical]:data-[variant=line]:h-auto data-[orientation=vertical]:data-[variant=line]:w-0.5"
                data-variant={variant}
                data-orientation={state.orientation as string}
              />
            </>
          ),
        },
      })}
    </List>
  );
}

export function useTabsTrigger(
  node: React.RefObject<HTMLElement | null>,
  value: unknown,
  active: boolean,
  content: unknown,
) {
  const list = useContext(List);
  const scope = useContext(Root);
  const cm = useCadenceMotion(node);
  const connected = useRef<{ host: HTMLElement; item: ReturnType<typeof createTabsItem> } | null>(null);
  const [identity] = useState(() => ({}));
  useLayoutEffect(() => {
    const host = node.current;
    if (connected.current?.host !== host) {
      connected.current?.item.dispose();
      connected.current = null;
    }
    if (host && scope) {
      if (!connected.current) connected.current = { host, item: createTabsItem(node, scope.transaction) };
      const parameters = cm.parameters(bindMotionParameters(layoutCompact, "layout.move/position"));
      if (parameters.kind === "layout")
        connected.current.item.commit(
          scope.transaction.revision("content", content, node),
          parameters.transition,
          cm.reduced,
        );
      list?.set(identity, { host, value, active, content, item: connected.current.item });
    }
  });
  useInsertionEffect(
    () => () => {
      list?.delete(identity);
      connected.current?.item.dispose();
      connected.current = null;
    },
    [list, identity],
  );
}

export function TabsPanelSurface({
  elementProps,
  state,
  render,
  value,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: TabsPrimitive.Panel.State & { slot?: string };
  render: TabsPrimitive.Panel.Props["render"];
  value: unknown;
}) {
  const scope = useContext(Root);
  const parent = usePresentationScope();
  const { node, ref } = useMotionHostRef(elementProps.ref);
  const cm = useCadenceMotion(node);
  const [paint] = useState(() => createContentTransition(scope?.transaction));
  const flow = useRef<HTMLDivElement>(null);
  const separated = supportsFlowRender(render);
  const geometrySource = useRef({});
  const valueRevision = useRef({ value, revision: 0 });
  const parentGeometry = useContext(GeometryScope);
  const [geometry] = useState(() => createMeasuredGeometry(scope?.transaction));
  const group = parentGeometry?.controller ?? geometry;
  const connected = useRef<{ host: HTMLElement; content: HTMLElement; group: typeof group; release(): void } | null>(
    null,
  );
  const previous = useRef<boolean | null>(null);
  const cached = useRef<{ revision: MotionRevision; participant: ContentPaint } | null>(null);
  useLayoutEffect(() => {
    const visible = !state.hidden;
    const changed = previous.current === false && visible;
    previous.current = visible;
    const revision = scope?.transaction.revision("content", visible ? value : null, node);
    if (!visible) paint.cancel();
    if (revision) {
      let available = visible && (parent?.available() ?? true) && (changed || Boolean(scope?.presented));
      if (cached.current?.revision === revision) {
        paint.commit(revision, [cached.current.participant], cm, false, available);
        return;
      }
      const direction = /left|up/.test(state.tabActivationDirection)
        ? -1
        : /right|down/.test(state.tabActivationDirection)
          ? 1
          : 0;
      const participant: ContentPaint = {
        host: node,
        direction,
        axis: /up|down/.test(state.tabActivationDirection) ? "y" : "x",
        travel: false,
      };
      const panel = node.current;
      if (panel && nativeTextContext(panel)) available = false;
      const root = panel?.parentElement;
      if (
        available &&
        panel &&
        cm.transition("data.transition").duration !== 0 &&
        scope &&
        !scope.transaction.preflightVisuals(new Set([panel]))
      )
        available = false;
      if (available && panel && root && direction && root.getAttribute("data-slot") === "tabs" && !cm.reduced) {
        participant.travel = paint.canTravel(root, node, participant.axis ?? "x", direction, cm.distance.xs);
      }
      // Arbitrary panels without an existing paint corridor keep native size
      // and incoming opacity. No duplicate tree or forced viewport is made.
      cached.current = { revision, participant };
      paint.commit(revision, [participant], cm, false, available);
    }
  });
  useLayoutEffect(() => {
    const host = node.current;
    const content = separated ? flow.current : host;
    if (
      connected.current &&
      (connected.current.host !== host || connected.current.content !== content || connected.current.group !== group)
    ) {
      connected.current.release();
      connected.current = null;
    }
    if (host && content && !connected.current) {
      const release = group.register({
        host: node,
        content,
        axes: ["height"],
        observeChildren: true,
        measure() {
          if (host.hidden || nativeTextContext(host)) return null;
          const outer = naturalGeometry(host),
            inner = naturalGeometry(content);
          if (!outer || !inner) return null;
          const css = getComputedStyle(host);
          const family = css.transitionProperty.split(",").map((value) => value.trim()),
            clocks = css.transitionDuration.split(",").map(Number.parseFloat);
          const geometry = ["all", "width", "height", "flex", "flex-basis", "flex-grow", "flex-shrink"];
          if (
            family.some((property, index) => geometry.includes(property) && (clocks[index % clocks.length] ?? 0) > 0) ||
            host
              .getAnimations()
              .some((animation) =>
                (animation.effect as KeyframeEffect | null)
                  ?.getKeyframes()
                  .some((frame) =>
                    ["width", "height", "flexBasis", "flexGrow", "flexShrink"].some((property) => property in frame),
                  ),
              )
          )
            return null;
          const intrinsic = host.computedStyleMap?.().get("height")?.toString();
          if (intrinsic && !["auto", "fit-content", "max-content"].includes(intrinsic)) return null;
          if (css.aspectRatio !== "auto" || css.writingMode !== "horizontal-tb") return null;
          // No clone, inactive measurement or cross-panel height source. The
          // original content lays out at destination width, with visible overflow.
          const size =
            content === host
              ? outer.height
              : inner.height +
                (css.boxSizing === "border-box"
                  ? Number.parseFloat(css.paddingTop) +
                    Number.parseFloat(css.paddingBottom) +
                    Number.parseFloat(css.borderTopWidth) +
                    Number.parseFloat(css.borderBottomWidth)
                  : 0);
          const parentStyle = host.parentElement ? getComputedStyle(host.parentElement) : null;
          const intrinsicMinimum =
            css.minHeight === "auto" &&
            (parentStyle?.display.includes("grid") ||
              (parentStyle?.display.includes("flex") && parentStyle.flexDirection.startsWith("column")));
          return {
            height: {
              size,
              min: css.overflowY === "visible" && !intrinsicMinimum ? 0 : size,
              flexBlock: Boolean(
                parentStyle?.display.includes("flex") &&
                  parentStyle.flexDirection.startsWith("column") &&
                  ["auto", "fit-content", "max-content"].includes(
                    host.parentElement?.computedStyleMap?.().get("height")?.toString() ?? "",
                  ) &&
                  !host.style.flex &&
                  !host.style.flexBasis &&
                  !host.style.flexGrow &&
                  !host.style.flexShrink,
              ),
              independent: true,
              readable: content !== host,
            },
          };
        },
      });
      connected.current = {
        host,
        content,
        group,
        release() {
          editing.disconnect();
          host.ownerDocument.removeEventListener("selectionchange", select);
          release();
        },
      };
      const settleEditing = () => {
        if (nativeTextContext(host)) {
          group.settle();
          paint.cancel();
        }
      };
      const editing = new MutationObserver(settleEditing);
      let ancestor: HTMLElement | null = host;
      for (
        let depth = 0;
        ancestor && depth < motionLimits.collectionVisuals;
        depth++, ancestor = ancestor.parentElement
      )
        editing.observe(ancestor, { attributes: true, attributeFilter: ["contenteditable"] });
      const select = () => {
        const anchor = host.ownerDocument.getSelection()?.anchorNode;
        if (anchor && host.contains(anchor)) {
          group.settle();
          paint.cancel();
        }
      };
      host.ownerDocument.addEventListener("selectionchange", select);
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (!Object.is(valueRevision.current.value, value))
      valueRevision.current = { value, revision: valueRevision.current.revision + 1 };
    if (parentGeometry) parentGeometry.request?.();
    else if (scope && parameters.kind === "geometry")
      geometry.commit(
        scope.transaction.revision(
          "content",
          JSON.stringify([
            valueRevision.current.revision,
            state.hidden,
            host?.textContent,
            elementProps.className,
            elementProps.style,
            flow.current?.childElementCount,
          ]),
          geometrySource.current,
        ),
        {
          reduced: cm.reduced,
          transition: parameters.transition,
          available: !state.hidden && (parent?.available() ?? true),
        },
      );
  });
  useInsertionEffect(
    () => () => {
      connected.current?.release();
      connected.current = null;
      geometry.settle();
    },
    [geometry],
  );
  useInsertionEffect(() => () => paint.cancel(), [paint]);
  const children = (
    <TabsDisplayContent value={elementProps.children} visible={!state.hidden && previous.current === true} />
  );
  return useRender({
    defaultTagName: "div",
    render,
    state: { ...state },
    props: {
      ...elementProps,
      ref,
      "data-motion": cm.mode,
      children: !separated ? (
        children
      ) : (
        <div ref={flow} data-slot="tabs-panel-flow" className="flow-root min-w-0">
          {children}
        </div>
      ),
    },
  });
}

/** Default semantic palettes; custom paint retains its exact immediate cascade. */
export function safeTabsPaint(props: { className?: string; style?: React.CSSProperties }) {
  if (
    Object.keys(props.style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(props.className ?? "").split(/\s+/).some((token) => {
    const name = token.split(":").pop() ?? "";
    return (
      /^(bg-|text-|border-|shadow-)/.test(name) &&
      !/^(?:bg-(?:muted|background|foreground|transparent|input\/30)|text-(?:muted-foreground|foreground|sm|xs|base|lg|xl)|border-(?:transparent|ring)|shadow-(?:sm|none))$/.test(
        name,
      )
    );
  });
}

function supportsFlowRender(render: unknown) {
  return (
    !render ||
    (isValidElement(render) &&
      typeof render.type === "string" &&
      ["div", "section", "article", "nav"].includes(render.type))
  );
}

export function TabsDisplayContent({ value, visible = true }: { value: ReactNode; visible?: boolean }) {
  return typeof value === "string" || typeof value === "number" ? (
    <TabsDisplay value={value} visible={visible} />
  ) : (
    value
  );
}

function TabsDisplay({ value, visible }: { value: string | number; visible: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = useContext(Root);
  const [entity] = useState(() => ({}));
  const initial = useRef(String(value)),
    previous = useRef(String(value));
  const isText = typeof value === "string";
  const text = useTextPresentation(
    node,
    isText ? value : "",
    cm,
    entity,
    {
      characterStagger: false,
      visible,
      enabled: isText,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  const number = useNumberPresentation(
    node,
    isText ? 0 : value,
    cm,
    entity,
    {
      compact: true,
      cause: "independent",
      visible,
      enabled: !isText,
      retainEditedContent: true,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  useLayoutEffect(() => {
    previous.current = String(value);
  });
  return isText ? (
    <span ref={ref} data-slot="tabs-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="tabs-number" data-motion={cm.mode}>
      {number}
    </span>
  );
}

function stripSnapshot(
  list: HTMLElement,
  strip: HTMLElement,
  records: Trigger[],
  marker: SelectionBox | null,
  orientation: string,
): TabsStripSnapshot | null {
  if (
    records.length > motionLimits.collectionVisuals ||
    !list.getClientRects().length ||
    !strip.getClientRects().length
  )
    return null;
  const css = getComputedStyle(list),
    bounds = list.getBoundingClientRect();
  const axis = orientation === "vertical" ? "height" : "width";
  const intrinsic = list.computedStyleMap?.().get(axis)?.toString();
  if (
    !intrinsic ||
    !["auto", "fit-content", "max-content"].includes(intrinsic) ||
    css.writingMode !== "horizontal-tb" ||
    css.aspectRatio !== "auto"
  )
    return null;
  const native = naturalGeometry(list);
  if (!native) return null;
  const properties = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    properties.some(
      (property, index) =>
        ["all", "width", "height", "transform", "translate", "scale", "rotate"].includes(property) &&
        (durations[index % durations.length] ?? 0) > 0,
    ) ||
    list
      .getAnimations()
      .some((a) =>
        (a.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) => ["width", "height", "transform", "translate", "scale", "rotate"].some((p) => p in frame)),
      )
  )
    return null;
  const sx = bounds.width / list.offsetWidth,
    sy = bounds.height / list.offsetHeight;
  if (!(sx > 0 && sy > 0)) return null;
  const items = new Map<HTMLElement, SelectionBox>();
  for (const { host } of records) {
    if (host.parentElement !== strip || !host.getClientRects().length) return null;
    const paint = getComputedStyle(host);
    if (
      [paint, css].some(
        (s) =>
          s.transform !== "none" ||
          s.translate !== "none" ||
          s.scale !== "none" ||
          s.rotate !== "none" ||
          /fixed|sticky/.test(s.position),
      )
    )
      return null;
    if (
      host
        .getAnimations()
        .some((a) =>
          (a.effect as KeyframeEffect | null)
            ?.getKeyframes()
            .some((f) => ["transform", "translate", "scale", "rotate"].some((p) => p in f)),
        )
    )
      return null;
    const rect = host.getBoundingClientRect();
    items.set(host, {
      x: (rect.left - bounds.left) / sx + list.scrollLeft - list.clientLeft,
      y: (rect.top - bounds.top) / sy + list.scrollTop - list.clientTop,
      width: rect.width / sx,
      height: rect.height / sy,
    });
  }
  return {
    axis,
    size: native[axis],
    items,
    marker,
    strip,
    inlineSize: strip.getBoundingClientRect().width / sx,
    blockSize: strip.getBoundingClientRect().height / sy,
    selected: records.find((record) => record.active)?.host,
    crossWidth:
      orientation === "vertical" &&
      ["auto", "fit-content", "max-content"].includes(list.computedStyleMap?.().get("width")?.toString() ?? "")
        ? native.width
        : undefined,
    clipped: (axis === "width" ? css.overflowX : css.overflowY) !== "visible",
  };
}
