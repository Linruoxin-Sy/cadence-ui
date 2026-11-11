"use client";
import type { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { useRender } from "@base-ui/react/use-render";
import { useIsPresent } from "motion/react";
import {
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "./cn";
import { useStateColor } from "./css-motion";
import { createInlineEntrance } from "./inline-entrance";
import { bindMotionParameters, geometryCompact, layoutCompact, layoutSelection, motionLimits } from "./motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "./motion-presence";
import { useMotionHostRef } from "./motion-ref";
import type { createMotionTransaction, MotionRevision } from "./motion-transaction";
import { useCadenceMotion } from "./provider";
import { createSelectionProjection, type SelectionBox } from "./selection-projection";
import { selectionScale, selectionStripSnapshot } from "./selection-strip";
import { createTabsItem, createTabsLayout } from "./tabs-layout";
import { nativeTextContext } from "./text-layout";
import { toggleGroupColourReadable, toggleGroupColourScope } from "./toggle-group-colour";

type Trigger = {
  host: HTMLElement;
  value: unknown;
  active: boolean;
  content: unknown;
  item: ReturnType<typeof createTabsItem>;
};
const Group = createContext<{ transaction: ReturnType<typeof createMotionTransaction> } | null>(null);
const List = createContext<Map<object, Trigger> | null>(null);
export function ToggleGroupSurface({
  elementProps,
  state,
  render,
  variant,
  knownPaint,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: ToggleGroupPrimitive.State & { slot?: string };
  render: ToggleGroupPrimitive.Props["render"];
  variant: string;
  knownPaint: boolean;
}) {
  const { node, ref } = useMotionHostRef(elementProps.ref);
  const [scope] = useState(() => createPresentationScope(node));
  const [triggers] = useState(() => new Map<object, Trigger>());
  const strip = useRef<HTMLDivElement>(null);
  const marker = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const present = useIsPresent();
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const presence = useRef<{ host: HTMLElement; controller: ReturnType<typeof createInlineEntrance> } | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  useLayoutEffect(() => {
    const host = node.current;
    if (host !== presence.current?.host) {
      presence.current?.controller.dispose();
      presence.current = host ? { host, controller: createInlineEntrance(host) } : null;
    }
    const baseline = parent ?? (host ? documentPresentation(host.ownerDocument) : null);
    presence.current?.controller.commit({
      present,
      enter:
        !consumed.current &&
        !initialHydration.current &&
        Boolean(
          baseline?.presented && baseline.available() && !baseline.node?.current?.hasAttribute("data-starting-style"),
        ),
      cm,
    });
    if (host) consumed.current = true;
  });
  useInsertionEffect(() => {
    if (present) scope.transaction.open();
    else scope.transaction.close();
  }, [present, scope]);
  useInsertionEffect(
    () => () => {
      presence.current?.controller.dispose();
      presence.current = null;
    },
    [],
  );
  const TrackPaint = useStateColor(
    ref,
    cm,
    ["background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    {
      readability: knownPaint ? "verified" : "immediate",
      readabilityGate: toggleGroupColourReadable,
      readabilityScope: toggleGroupColourScope,
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
      readability: knownPaint ? "verified" : "immediate",
      immediate: shapeChanged,
      readabilityGate: toggleGroupColourReadable,
      readabilityScope: toggleGroupColourScope,
    },
  );
  useLayoutEffect(() => {
    markerShape.current = variant;
  });
  const latest = useRef({
    cm,
    markerCm,
    variant,
    signature: JSON.stringify([elementProps.className, elementProps.style]),
  });
  const configuration = useRef("");
  const connection = useRef<{ dispose(): void; flush(): void } | null>(null);
  const captured = useRef(false);
  const separated = !render || (isValidElement(render) && typeof render.type === "string");
  useLayoutEffect(() => {
    latest.current = { cm, markerCm, variant, signature: JSON.stringify([elementProps.className, elementProps.style]) };
    if (!present) {
      connection.current?.dispose();
      connection.current = null;
      return;
    }
    const shape = `${variant}/${state.orientation}/${state.multiple}/${separated}`;
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
        projection.cancel();
        layout.invalidate();
        content = null;
        flush(true);
      };
      const flush = (force = false) => {
        if (!alive || node.current !== list) return;
        const active = [...triggers.values()].filter((record) => record.active && record.host.isConnected);
        const selected = !state.multiple && active.length === 1 ? active[0] : null;
        const { cm: policy, markerCm: selectionPolicy } = latest.current;
        const revision = scope.transaction.revision("value", selected?.value ?? null, list);
        for (const value of identities.keys())
          if (![...triggers.values()].some((record) => Object.is(record.value, value))) identities.delete(value);
        const parameters = selectionPolicy.parameters(bindMotionParameters(layoutSelection, "layout.shared/selection"));
        const transition = parameters.kind === "layout" ? parameters.transition : { duration: 0 };
        const geometry = policy.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
        const reflow = policy.parameters(bindMotionParameters(layoutCompact, "layout.move/position"));
        const sizeClock = geometry.kind === "geometry" ? geometry.transition : { duration: 0 };
        const positionClock = reflow.kind === "layout" ? reflow.transition : { duration: 0 };
        const nextContent = JSON.stringify([
          latest.current.signature,
          [...triggers.values()]
            .sort((a, b) => (a.host.compareDocumentPosition(b.host) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
            .map((record) => [identity(record.value), record.content]),
        ]);
        const clock = JSON.stringify([
          policy.mode,
          selectionPolicy.mode,
          selectionPolicy.timeScale,
          sizeClock,
          positionClock,
        ]);
        const policyChanged = clock !== lastPolicy;
        if (lastRevision === revision && content === nextContent && !force && clock === lastPolicy) {
          projection.commit(
            revision,
            cachedBox,
            transition,
            selectionPolicy.reduced || !toggleGroupColourReadable(markerNode),
          );
          return;
        }
        const selectionChanged = lastRevision !== revision;
        const knownContent = content !== null && content !== nextContent;
        const wasReflowing = layout.running;
        const origin = layout.prepare();
        const renderedPlate = wasReflowing ? origin?.marker : projection.sample();
        const sizeRevision = scope.transaction.revision(
          "content",
          JSON.stringify([nextContent, selected ? identity(selected.value) : null]),
          strip,
        );
        content = nextContent;
        lastPolicy = clock;
        lastRevision = revision;
        if (
          !force &&
          !policy.reduced &&
          !selectionPolicy.reduced &&
          toggleGroupColourReadable(markerNode) &&
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
          const scale = selectionScale(list);
          const sx = scale?.x ?? 0,
            sy = scale?.y ?? 0;
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
          }
        }
        if (box && (!Object.values(box).every(Number.isFinite) || box.width <= 0 || box.height <= 0)) safe = false;
        if (!safe) box = null;
        const natural = strip.current;
        const visualCount = triggers.size + 2 + (box ? 1 : 0);
        const bounded =
          natural &&
          visualCount <= motionLimits.collectionVisuals &&
          scope.transaction.preflightVisuals(
            new Set([
              list,
              natural,
              ...[...triggers.values()].map((record) => record.host),
              ...(box ? [markerNode] : []),
            ]),
          );
        const snapshot =
          natural && bounded
            ? selectionStripSnapshot(list, natural, [...triggers.values()], box, state.orientation)
            : null;
        const eligible =
          separated &&
          (safe || state.multiple || !selected) &&
          snapshot &&
          !nativeTextContext(list) &&
          !list.contains(list.ownerDocument.activeElement) &&
          !captured.current &&
          !force &&
          !policy.reduced &&
          !selectionPolicy.reduced &&
          sizeClock.duration !== 0 &&
          positionClock.duration !== 0;
        // Safe simultaneous changes keep both clocks, composed in one marker
        // writer. Missing origins, native interaction or unsupported mappings
        // settle the affected geometry together, never a half-coupled tween.
        const selectionPath =
          eligible &&
          selectionChanged &&
          (knownContent || wasReflowing) &&
          !state.multiple &&
          origin?.selected &&
          snapshot?.items.has(origin.selected) &&
          renderedPlate &&
          box &&
          transition.duration !== 0 &&
          toggleGroupColourReadable(markerNode)
            ? { from: renderedPlate, transition }
            : undefined;
        const coordinated = Boolean(
          eligible && (selectionPath || (!selectionChanged && (knownContent || (wasReflowing && policyChanged)))),
        );
        crossOwned = coordinated && (snapshot?.crossWidth !== undefined || snapshot?.crossHeight !== undefined);
        if (coordinated || wasReflowing) projection.cancel();
        cachedBox = box;
        projection.commit(
          revision,
          box,
          transition,
          selectionPolicy.reduced ||
            force ||
            !toggleGroupColourReadable(markerNode) ||
            !safe ||
            (selectionChanged && knownContent) ||
            coordinated ||
            wasReflowing,
        );
        layout.commit(
          sizeRevision,
          snapshot,
          sizeClock,
          positionClock,
          !coordinated,
          origin,
          selectionPath,
          policy.mode,
        );
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
        const changedAncestor = (entry: MutationRecord) => {
          const target = entry.target as HTMLElement;
          // Only plain block-extent edits get the common-space exception.
          // Class/selector, font, sizing-container and all other caller changes
          // remain conservative invalidations, including descendant rules.
          if (entry.attributeName !== "style" || getComputedStyle(target).containerType !== "normal") return true;
          const withoutHeight = (style: string) =>
            withoutClock(style)
              .replace(/(^|;)\s*(?:min-|max-)?height\s*:[^;]*(?=;|$)/g, "$1")
              .replace(/\s*;\s*/g, ";")
              .replace(/;+/g, ";")
              .replace(/^;|;$/g, "")
              .trim();
          if (withoutHeight(entry.oldValue ?? "") !== withoutHeight(target.style.cssText)) return true;
          const next = ancestorSignature(target);
          const before = ancestors.get(target);
          ancestors.set(target, next);
          return next !== before;
        };
        if (
          entries.some(
            (entry) =>
              entry.type === "attributes" &&
              entry.target !== markerNode &&
              (entry.target === list ||
                (!list.contains(entry.target) && changedAncestor(entry)) ||
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
      // Common ancestor extent/displacement is already native transport for the
      // entire group. Root/item ResizeObserver catches changed local boxes;
      // only a changed map, clipping/paint or native environment invalidates
      // these group-local projections. A preview resizing its own shell must
      // not repeatedly cancel otherwise safe selection + strip motion.
      const ancestors = new Map<Element, string>();
      const ancestorSignature = (target: Element) => {
        const css = getComputedStyle(target);
        return JSON.stringify([
          ...[
            "transform",
            "translate",
            "scale",
            "rotate",
            "perspective",
            "offsetPath",
            "zoom",
            "position",
            "writingMode",
            "direction",
            "contain",
            "contentVisibility",
            "display",
            "visibility",
            "overflowX",
            "overflowY",
            "clipPath",
            "maskImage",
            "opacity",
            "filter",
            "backdropFilter",
            "backgroundColor",
            "backgroundImage",
            "color",
            "mixBlendMode",
            "isolation",
          ].map((key) => css[key as keyof CSSStyleDeclaration]),
          nativeTextContext(list),
          Boolean(list.closest('[hidden],[inert],[aria-hidden="true"]')),
        ]);
      };
      let ancestor = list.parentElement;
      for (let depth = 0; ancestor && depth < 32; depth++, ancestor = ancestor.parentElement) {
        ancestors.set(ancestor, ancestorSignature(ancestor));
        mutations.observe(ancestor, {
          attributes: true,
          attributeOldValue: true,
          attributeFilter: ["class", "style", "hidden", "contenteditable"],
        });
      }
      const scroll = (event: Event) => {
        const target = event.target;
        if (target instanceof Element && list.contains(target) && target !== list) {
          layout.invalidate();
          projection.cancel();
          flush(true);
        }
      };
      list.ownerDocument.addEventListener("scroll", scroll, true);
      view?.addEventListener("resize", invalidate);
      view?.visualViewport?.addEventListener("resize", invalidate);
      list.ownerDocument.fonts?.addEventListener("loadingdone", invalidate);

      connection.current = {
        flush,
        dispose() {
          alive = false;

          projection.dispose();
          layout.dispose();
          list.ownerDocument.removeEventListener("scroll", scroll, true);
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
    <MotionPresentation scope={scope}>
      <Group value={scope}>
        <List value={triggers}>
          {useRender({
            defaultTagName: "div",
            render,
            state: { ...state },
            props: {
              ...elementProps,
              ...TrackPaint,
              style: { ...TrackPaint.style, ...elementProps.style },
              "data-slot": "toggle-group",
              inert: !present || elementProps.inert || undefined,
              "aria-hidden": present ? elementProps["aria-hidden"] : true,
              "data-ending-style": present ? undefined : "",
              "data-motion": cm.mode,
              children: (
                <>
                  {!separated ? (
                    elementProps.children
                  ) : (
                    <div
                      ref={strip}
                      data-slot="toggle-group-strip"
                      className={cn(
                        "inline-flex min-w-0 shrink-0 items-center [gap:inherit]",
                        state.orientation === "vertical" && "flex-col items-stretch",
                      )}
                    >
                      {elementProps.children}
                    </div>
                  )}
                  <span
                    {...MarkerPaint}
                    aria-hidden="true"
                    hidden
                    data-slot="toggle-group-indicator"
                    data-motion={markerCm.mode}
                    className={cn(
                      "pointer-events-none absolute top-0 left-0 -z-10 origin-top-left rounded-md bg-accent",
                      variant === "segmented" && "rounded-full bg-background shadow-sm dark:bg-input",
                    )}
                    data-variant={variant}
                    data-orientation={state.orientation as string}
                  />
                </>
              ),
            },
          })}
        </List>
      </Group>
    </MotionPresentation>
  );
}

export function useToggleGroupItem(
  node: React.RefObject<HTMLElement | null>,
  value: unknown,
  active: boolean,
  content: unknown,
) {
  const list = useContext(List);
  const scope = useContext(Group);
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
          scope.transaction.revision("content", JSON.stringify(content), node),
          parameters.transition,
          cm.reduced,
          cm.mode,
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

const subscribe = () => () => {};

export function useToggleGroupTransaction() {
  return useContext(Group)?.transaction;
}
