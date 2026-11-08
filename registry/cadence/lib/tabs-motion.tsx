"use client";

import type { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useRender } from "@base-ui/react/use-render";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type ContentPaint, createContentTransition } from "./content-transition";
import { bindMotionParameters, layoutSelection } from "./motion";
import { usePresentationScope } from "./motion-presence";
import { useMotionHostRef } from "./motion-ref";
import { createMotionTransaction, type MotionRevision } from "./motion-transaction";
import { useCadenceMotion } from "./provider";
import { createSelectionProjection, type SelectionBox } from "./selection-projection";

function createScope(transaction = createMotionTransaction()) {
  return {
    transaction,
    lists: new Set<() => void>(),
    host: null as HTMLElement | null,
    presented: false,
  };
}
const Root = createContext<ReturnType<typeof createScope> | null>(null);
type Trigger = { host: HTMLElement; value: unknown; active: boolean };
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
  state: TabsPrimitive.List.State;
  render: TabsPrimitive.List.Props["render"];
  variant: string;
}) {
  const scope = useContext(Root);
  const [triggers] = useState(() => new Map<object, Trigger>());
  const { node, ref } = useMotionHostRef(elementProps.ref);
  const marker = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const latest = useRef({ cm, variant });
  const configuration = useRef("");
  const connection = useRef<{ dispose(): void; flush(): void } | null>(null);
  useLayoutEffect(() => {
    latest.current = { cm, variant };
    const shape = `${variant}/${state.orientation}`;
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
      let alive = true;
      let observed: HTMLElement | null = null;
      const stamps = new Map<Element, string>();
      let lastRevision: MotionRevision | null = null;
      let cachedBox: SelectionBox | null = null;
      const invalidate = () => {
        if (!alive || node.current !== list) return;
        cachedBox = null;
        projection.invalidate();
        list.removeAttribute("data-marker-ready");
      };
      const flush = (force = false) => {
        if (!alive || node.current !== list) return;
        const active = [...triggers.values()].filter((record) => record.active && record.host.isConnected);
        const selected = active.length === 1 ? active[0] : null;
        const { cm: policy, variant: shape } = latest.current;
        const revision = scope.transaction.revision("value", selected?.value ?? null, list);
        const parameters = policy.parameters(bindMotionParameters(layoutSelection, "layout.shared/selection"));
        const transition = parameters.kind === "layout" ? parameters.transition : { duration: 0 };
        if (lastRevision === revision && !force) {
          projection.commit(revision, cachedBox, transition, policy.reduced || shape !== "line");
          return;
        }
        lastRevision = revision;
        if (
          !policy.reduced &&
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
            target.parentElement === list &&
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
        cachedBox = box;
        projection.commit(revision, box, transition, policy.reduced || shape !== "line" || !safe);
        if (alive && node.current === list) list.toggleAttribute("data-marker-ready", Boolean(box));
      };
      const observer = new ResizeObserver((entries) => {
        if (
          entries.some((entry) => {
            const size = entry.borderBoxSize?.[0];
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
            .replace(/--(?:(?:motion-|ease-cadence-)[\w-]+|cadence-(?:time-scale|recipe-enabled))\s*:[^;]*;?/g, "")
            .trim();
        if (
          entries.some(
            (entry) =>
              entry.type === "attributes" &&
              entry.target !== markerNode &&
              (entry.attributeName !== "style" ||
                withoutClock(entry.oldValue ?? "") !== withoutClock((entry.target as HTMLElement).style.cssText)),
          )
        )
          invalidate();
        else if (entries.some((entry) => entry.target !== markerNode)) flush(true);
      });
      mutations.observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["class", "style", "hidden"],
      });
      const view = list.ownerDocument.defaultView;
      let ancestor = list.parentElement;
      for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement)
        mutations.observe(ancestor, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ["class", "style", "hidden"],
        });
      view?.addEventListener("resize", invalidate);
      view?.visualViewport?.addEventListener("resize", invalidate);
      scope.lists.add(flush);
      connection.current = {
        flush,
        dispose() {
          alive = false;
          scope.lists.delete(flush);
          projection.dispose();
          observer.disconnect();
          mutations.disconnect();
          view?.removeEventListener("resize", invalidate);
          view?.visualViewport?.removeEventListener("resize", invalidate);
        },
      };
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
          ref,
          children: (
            <>
              {elementProps.children}
              <span
                ref={marker.ref}
                aria-hidden="true"
                hidden
                data-slot="tabs-indicator"
                data-motion={cm.mode}
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

export function useTabsTrigger(node: React.RefObject<HTMLElement | null>, value: unknown, active: boolean) {
  const list = useContext(List);
  const [identity] = useState(() => ({}));
  useLayoutEffect(() => {
    if (node.current) list?.set(identity, { host: node.current, value, active });
  });
  useInsertionEffect(
    () => () => {
      list?.delete(identity);
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
  state: TabsPrimitive.Panel.State;
  render: TabsPrimitive.Panel.Props["render"];
  value: unknown;
}) {
  const scope = useContext(Root);
  const parent = usePresentationScope();
  const { node, ref } = useMotionHostRef(elementProps.ref);
  const cm = useCadenceMotion(node);
  const [paint] = useState(() => createContentTransition(scope?.transaction));
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
  useInsertionEffect(() => () => paint.cancel(), [paint]);
  return useRender({
    defaultTagName: "div",
    render,
    state: { ...state },
    props: { ...elementProps, ref, "data-motion": cm.mode },
  });
}
