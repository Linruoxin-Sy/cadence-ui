// biome-ignore-all lint/a11y/useSemanticElements: the group is a div with role="group" because its children are arbitrary controls swapped through `render`, not a form section.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, PresenceContext, useIsPresent, usePresence } from "motion/react";
import {
  Children,
  Component,
  type ComponentProps,
  type ContextType,
  type CSSProperties,
  createContext,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  buttonGroupGeometry,
  createGroupPositions,
  type GroupPosition,
  groupMapping,
  groupStretchEcho,
} from "../lib/button-group-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { isGroupControl } from "../lib/group-member";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { kbdColourReadable } from "../lib/kbd-layout";
import { createMeasuredGeometry, GeometryScope } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { observeSeparatorConstraints } from "../lib/separator-layout";
import { nativeTextContext } from "../lib/text-layout";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";
import { Separator } from "../separator";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Scope = ReturnType<typeof createPresentationScope>;
const Group = createContext<{
  scope: Scope;
  request(): void;
  allowed: boolean;
  present: boolean;
  members: Set<string>;
  reentries: Map<HTMLElement, { x: number; y: number }>;
} | null>(null);

/**
 * Joins adjacent controls into one shape. The rounding and border rules are
 * `[&>*]` selectors rather than props, so any child that renders a `data-slot`
 * — a button, a select trigger, an input — takes part without knowing about the
 * group. Only the first and last child keep their outer corners.
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-within:relative [&>*]:focus-within:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none [&>[data-slot=button-group-segment]:not([data-group-first])>*]:rounded-l-none [&>[data-slot=button-group-segment]:not([data-group-first])>*]:border-l-0 [&>[data-slot=button-group-segment]:not([data-group-last])>*]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none [&>[data-slot=button-group-segment]:not([data-group-first])>*]:rounded-t-none [&>[data-slot=button-group-segment]:not([data-group-first])>*]:border-t-0 [&>[data-slot=button-group-segment]:not([data-group-last])>*]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

export interface ButtonGroupProps extends ComponentProps<"div">, VariantProps<typeof buttonGroupVariants> {}

/**
 * Joined actions. One group destination coordinates safe member layers, never
 * a selection marker or the control's press transform.
 *
 * a11y: `role="group"` names the set; give it `aria-label` when the group has no
 * visible heading. `orientation` changes the layout, so keyboard users tab in the
 * order the controls are written — keep it that way.
 */
function ButtonGroup({ className, orientation = "horizontal", children, ...props }: ButtonGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node),
    parent = usePresentationScope(),
    present = useIsPresent();
  const ancestorPresence = useContext(PresenceContext);
  const [scope] = useState(() => createPresentationScope(node));
  const flush = useRef(() => {}),
    pending = useRef(false),
    alive = useRef(true);
  const [geometry] = useState(() => ({
    controller: createMeasuredGeometry(scope.transaction),
    transaction: scope.transaction,
    request() {
      if (pending.current) return;
      pending.current = true;
      queueMicrotask(() => {
        pending.current = false;
        if (alive.current) flush.current();
      });
    },
  }));
  const [positions] = useState(() => createGroupPositions(scope.transaction));
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = useRef(hydrated),
    consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const request = geometry.request;
  const members = Children.toArray(children);
  const retained = useRef(new Set<string>());
  const reentries = useRef(new Map<HTMLElement, { x: number; y: number }>());
  const working = new Set([
    ...retained.current,
    ...members.map((child) => (isValidElement(child) ? String(child.key) : child)),
  ]);
  let keyed = true;
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.key === null) keyed = false;
  });
  const allowed =
    working.size + 1 <= motionLimits.collectionVisuals &&
    members.every((child) => safeMember(child) || (isValidElement(child) && child.type === ButtonGroupSeparator));
  const semantic = JSON.stringify([
    orientation,
    members.map((child) =>
      safeMember(child)
        ? [
            child.key,
            typeof child.props.children,
            String(child.props.children),
            (child.props as { size?: unknown }).size,
          ]
        : isValidElement(child)
          ? child.key
          : null,
    ),
  ]);
  const prepared = useRef({ semantic, policy: JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]) });
  useInsertionEffect(() => {
    const policy = JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]);
    if (prepared.current.semantic !== semantic || prepared.current.policy !== policy) {
      if (cm.reduced || cm.timeScale === 0) positions.settle();
      geometry.controller.prepare();
    }
    prepared.current = { semantic, policy };
  }, [semantic, cm.mode, cm.reduced, cm.timeScale, cm.scope.signature, geometry, positions]);
  const latest = useRef({ cm, present, children, orientation, allowed, keyed });
  const connection = useRef<{ host: HTMLElement; dispose(): void } | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    latest.current = { cm, present, children, orientation, allowed, keyed };
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    entrance.current.commit({
      present,
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && baseline.presented && baseline.available(),
    });
    consumed.current = true;
    if (present && baseline.available()) scope.transaction.open();
    else scope.transaction.close();
    if (connection.current?.host !== host) {
      connection.current?.dispose();
      let signature = "",
        topology = "",
        previousOrientation = orientation,
        captured = false;
      const pointers = new Set<number>();
      const clips = new Map<HTMLElement, { width: number; height: number }>();
      let composing = false;
      const settle = () => {
        positions.settle();
        geometry.controller.settle();
      };
      const constraints = observeSeparatorConstraints(host, settle);
      const knownLayers = () =>
        host.children.length + 1 <= motionLimits.collectionVisuals &&
        [...host.children].every((child) =>
          ["button-group-segment", "button-group-separator"].includes(child.getAttribute("data-slot") ?? ""),
        );
      const sizes = new Map<HTMLElement, string>();
      const resize = new ResizeObserver((entries) => {
        let changed = false;
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement) || !sizes.has(entry.target)) continue;
          const box = entry.borderBoxSize[0];
          if (!box) continue;
          const next = String(Math.round(latest.current.orientation === "vertical" ? box.blockSize : box.inlineSize));
          changed ||= sizes.get(entry.target) !== next;
          sizes.set(entry.target, next);
        }
        if (changed) {
          signature = "";
          settle();
        }
      });
      const syncSizes = (capture: boolean) => {
        if (!latest.current.allowed || host.children.length + 1 > motionLimits.collectionVisuals) {
          for (const child of sizes.keys()) resize.unobserve(child);
          sizes.clear();
          return;
        }
        const children = new Set(Array.from(host.children).slice(0, motionLimits.collectionVisuals));
        for (const child of sizes.keys())
          if (!children.has(child)) {
            resize.unobserve(child);
            sizes.delete(child);
          }
        for (const child of children)
          if (child instanceof HTMLElement) {
            if (!sizes.has(child)) resize.observe(child, { box: "border-box" });
            if (capture)
              sizes.set(
                child,
                String(latest.current.orientation === "vertical" ? child.offsetHeight : child.offsetWidth),
              );
          }
      };
      const unregister = geometry.controller.register({
        host: node,
        content: host,
        get axes() {
          return [latest.current.orientation === "vertical" ? "height" : "width"] as const;
        },
        observeChildren: true,
        textGeometry: true,
        focusSafe: (active) => !captured && !editor(active) && !!active?.closest('[data-slot="button-group-segment"]'),
        nativeEcho: (source, target, axis) => groupStretchEcho(host, source, target, axis, positions.owns),
        measure: () =>
          latest.current.allowed && knownLayers()
            ? buttonGroupGeometry(host, latest.current.orientation ?? "horizontal", clips)
            : null,
      });
      const press = (event: Event) => {
        if (event instanceof PointerEvent) pointers.add(event.pointerId);
        else composing = true;
        captured = pointers.size > 0 || composing;
        settle();
      };
      const release = (event: Event) => {
        if (event instanceof PointerEvent) pointers.delete(event.pointerId);
        else composing = false;
        captured = pointers.size > 0 || composing;
      };
      const focus = () => {
        if (editor(host.ownerDocument.activeElement)) settle();
      };
      const blur = () =>
        queueMicrotask(() => {
          if (alive.current && node.current === host && !host.contains(host.ownerDocument.activeElement)) settle();
        });
      const passive = () => {
        signature = "";
        settle();
      };
      host.addEventListener("pointerdown", press, true);
      host.addEventListener("focusin", focus, true);
      host.addEventListener("focusout", blur, true);
      host.addEventListener("compositionstart", press, true);
      host.addEventListener("compositionend", release, true);
      host.ownerDocument.addEventListener("pointerup", release, true);
      host.ownerDocument.addEventListener("pointercancel", release, true);
      host.ownerDocument.addEventListener("lostpointercapture", release, true);
      host.ownerDocument.addEventListener("scroll", passive, true);
      host.ownerDocument.defaultView?.addEventListener("resize", passive);
      host.ownerDocument.fonts?.addEventListener("loadingdone", passive);
      flush.current = () => {
        const input = latest.current;
        const parameters = input.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
        if (parameters.kind !== "geometry") return;
        if (!host.children.length || !input.present) {
          positions.settle();
          geometry.controller.settle();
          return;
        }
        const next = JSON.stringify([
          input.orientation,
          input.allowed,
          input.cm.mode,
          input.cm.timeScale,
          input.cm.scope.signature,
          [...host.children]
            .filter((child) => !child.hasAttribute("data-ending-style"))
            .map((child) => [
              child.getAttribute("data-group-key"),
              child.className,
              child.getAttribute("data-orientation"),
              child instanceof HTMLElement
                ? Array.from(child.style)
                    .filter((name) => !/color|background|shadow|opacity|^--(?:motion-|cadence-|ease-)/.test(name))
                    .map((name) => [name, child.style.getPropertyValue(name)])
                : null,
              child.textContent,
              child.firstElementChild?.className,
              child.firstElementChild instanceof HTMLElement
                ? Array.from(child.firstElementChild.style)
                    .filter((name) => !/color|background|shadow|opacity|^--(?:motion-|cadence-|ease-)/.test(name))
                    .map((name) => [
                      name,
                      child.firstElementChild instanceof HTMLElement
                        ? child.firstElementChild.style.getPropertyValue(name)
                        : "",
                    ])
                : null,
            ]),
        ]);
        if (signature === next) {
          syncSizes(false);
          return;
        }
        const semantic = signature !== "";
        const nextTopology = JSON.stringify(
          [...host.children]
            .filter((child) => !child.hasAttribute("data-ending-style"))
            .map((child) => child.getAttribute("data-group-key")),
        );
        const changedMembers = topology !== "" && topology !== nextTopology;
        topology = nextTopology;
        signature = next;
        const changedOrientation = previousOrientation !== input.orientation;
        previousOrientation = input.orientation;
        const from = positions.prepare();
        const can =
          input.allowed &&
          knownLayers() &&
          input.present &&
          baseline.available() &&
          !captured &&
          !editor(host.ownerDocument.activeElement) &&
          !changedOrientation &&
          (!changedMembers || input.keyed) &&
          groupMapping(host) &&
          host.children.length + 1 <= motionLimits.collectionVisuals;
        constraints.prepare(semantic);
        const revision = scope.transaction.revision("content", next);
        geometry.controller.commit(revision, {
          reduced: input.cm.reduced,
          transition: parameters.transition,
          available: can,
        });
        const boxes = new Map<HTMLElement, GroupPosition>();
        if (input.allowed && host.children.length + 1 <= motionLimits.collectionVisuals) {
          const root = host.getBoundingClientRect();
          for (const child of host.children)
            if (
              child instanceof HTMLElement &&
              child.dataset.slot === "button-group-segment" &&
              !child.hasAttribute("data-ending-style")
            ) {
              const box = child.getBoundingClientRect();
              boxes.set(child, { x: box.x - root.x, y: box.y - root.y, width: box.width, height: box.height });
              const reentry = reentries.current.get(child);
              if (reentry)
                from.set(child, {
                  x: reentry.x - root.x,
                  y: reentry.y - root.y,
                  width: box.width,
                  height: box.height,
                  velocity: 0,
                });
            }
        }
        reentries.current.clear();
        positions.commit({
          host: node,
          revision,
          cm: input.cm,
          boxes,
          from,
          available: can && semantic && input.keyed,
          axis: input.orientation === "vertical" ? "y" : "x",
        });
        constraints.commit();
        syncSizes(true);
      };
      connection.current = {
        host,
        dispose() {
          constraints.dispose();
          resize.disconnect();
          sizes.clear();
          unregister();
          positions.settle();
          host.removeEventListener("pointerdown", press, true);
          host.removeEventListener("focusin", focus, true);
          host.removeEventListener("focusout", blur, true);
          host.removeEventListener("compositionstart", press, true);
          host.removeEventListener("compositionend", release, true);
          host.ownerDocument.removeEventListener("pointerup", release, true);
          host.ownerDocument.removeEventListener("pointercancel", release, true);
          host.ownerDocument.removeEventListener("lostpointercapture", release, true);
          host.ownerDocument.removeEventListener("scroll", passive, true);
          host.ownerDocument.defaultView?.removeEventListener("resize", passive);
          host.ownerDocument.fonts?.removeEventListener("loadingdone", passive);
        },
      };
    }
    flush.current();
  });
  committed(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      connection.current?.dispose();
      connection.current = null;
      entrance.current?.dispose();
      entrance.current = null;
      queueMicrotask(() => {
        if (!alive.current) {
          geometry.controller.dispose();
          positions.dispose();
        }
      });
    };
  }, []);
  return (
    <MotionPresentation scope={scope}>
      <GeometryScope.Provider value={geometry}>
        <Group.Provider
          value={{
            scope,
            request,
            allowed: allowed && keyed,
            present,
            members: retained.current,
            reentries: reentries.current,
          }}
        >
          <div
            role="group"
            data-slot="button-group"
            data-orientation={orientation}
            className={cn(buttonGroupVariants({ orientation }), className)}
            {...props}
            ref={ref}
            data-motion={cm.mode}
            data-ending-style={present ? undefined : ""}
            inert={!present || props.inert || undefined}
            aria-hidden={!present ? true : props["aria-hidden"]}
          >
            <AnimatePresence initial={false}>
              {members.map((child, index) =>
                isValidElement(child) ? (
                  <GroupMember
                    key={(child as ReactElement).key}
                    first={index === 0}
                    last={index === members.length - 1}
                    identity={String((child as ReactElement).key)}
                    ancestor={ancestorPresence}
                  >
                    {child}
                  </GroupMember>
                ) : (
                  child
                ),
              )}
            </AnimatePresence>
          </div>
        </Group.Provider>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}

function editor(element: Element | null) {
  return !!element?.closest("input,textarea,select,[contenteditable]:not([contenteditable=false])");
}
function safeMember(child: ReactNode): child is ReactElement<{ children?: ReactNode; render?: unknown }> {
  if (!isValidElement<{ children?: ReactNode; render?: unknown }>(child)) return false;
  const plain = typeof child.props.children === "string" || typeof child.props.children === "number";
  return (
    plain &&
    (!child.props.render ||
      (child.type === ButtonGroupText &&
        isValidElement<{ children?: ReactNode }>(child.props.render) &&
        typeof child.props.render.type === "string" &&
        ["div", "span", "output", "a"].includes(child.props.render.type) &&
        !child.props.render.props.children)) &&
    (isGroupControl(child.type) ||
      child.type === ButtonGroupText ||
      (typeof child.type === "string" && ["button", "a", "span", "output"].includes(child.type)))
  );
}

/** Layer choice follows a native lifetime. Rich/render revisions never move a
 * live control into a different React parent merely to gain an animation. */
function GroupMember({
  children,
  ancestor,
  ...props
}: {
  children: ReactElement;
  ancestor: ContextType<typeof PresenceContext>;
  first: boolean;
  last: boolean;
  identity: string;
}) {
  const [layer] = useState(() => safeMember(children));
  return layer ? (
    <GroupSegment {...props}>{children}</GroupSegment>
  ) : (
    <NativeMember ancestor={ancestor} rule={children.type === ButtonGroupSeparator}>
      {children}
    </NativeMember>
  );
}
function NativeMember({
  children,
  ancestor,
  rule,
}: {
  children: ReactNode;
  ancestor: ContextType<typeof PresenceContext>;
  rule: boolean;
}) {
  const present = useIsPresent();
  if (rule) return children;
  return present ? <PresenceContext.Provider value={ancestor}>{children}</PresenceContext.Provider> : null;
}

/** The only retained tree is this known paint-only layer. Caller children unmount
 * at the semantic removal, before its opacity exit can complete. */
function GroupSegment({
  children,
  first,
  last,
  identity,
}: {
  children: ReactNode;
  first: boolean;
  last: boolean;
  identity: string;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node),
    group = useContext(Group);
  const [scope] = useState(() => createPresentationScope(node));
  const [present, remove] = usePresence();
  const shown = present && !(isValidElement<{ hidden?: boolean }>(children) && children.props.hidden);
  const eligible = safeMember(children);
  committed(() => {
    group?.members.add(identity);
    return () => {
      group?.members.delete(identity);
    };
  }, [group?.members, identity]);
  const lifecycle = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const paint = useRef<{ text: string; style: CSSProperties; box: CSSProperties } | null>(null);
  const decoration = useRef<HTMLSpanElement>(null);
  const consumed = useRef(false),
    delivery = useRef({ ready: false, pending: false, present, remove });
  const policy = useRef({ cm, shown });
  useInsertionEffect(() => {
    Object.assign(delivery.current, { ready: false, present, remove });
  });
  useEffect(() => {
    delivery.current.ready = true;
    if (delivery.current.pending && !present) remove?.();
    delivery.current.pending = false;
  });
  committed(() => {
    policy.current = { cm, shown };
    const host = node.current;
    if (!host) return;
    if (!shown) {
      if (paint.current && decoration.current) {
        writePaint(host.style, { ...paint.current.box, display: "inline-flex" });
        decoration.current.setAttribute("data-cadence-group-label", paint.current.text);
        writePaint(decoration.current.style, paint.current.style);
      } else host.style.display = "none";
    } else {
      // These paint-only holds were written after React's exit render. Remove
      // every owned hold explicitly; React cannot diff imperative keys absent
      // from that render's style object. Press/opacity/projection stay separate.
      for (const property of [
        "position",
        "left",
        "top",
        "width",
        "height",
        "contain",
        "overflow",
        "pointer-events",
        "display",
      ])
        host.style.removeProperty(property);
    }
    if (!lifecycle.current) lifecycle.current = createInlinePresence(host, group?.scope.transaction);
    lifecycle.current.commit({
      present: shown,
      enter: !consumed.current && !!group?.scope.presented && group.present,
      cm:
        group?.allowed && group.present && !nativeTextContext(host) && (shown || paint.current)
          ? cm
          : { ...cm, timeScale: 0 },
      complete: () => {
        const d = delivery.current;
        if (d.present) return;
        if (d.ready) d.remove?.();
        else d.pending = true;
      },
    });
    consumed.current = true;
    group?.request();
  });
  committed(() => {
    const doc = node.current?.ownerDocument;
    if (!doc) return;
    const invalidate = () => {
      if (policy.current.shown) return;
      lifecycle.current?.commit({
        present: false,
        enter: false,
        cm: { ...policy.current.cm, timeScale: 0 },
        complete: () => {
          const d = delivery.current;
          if (!d.present) {
            if (d.ready) d.remove?.();
            else d.pending = true;
          }
        },
      });
    };
    doc.addEventListener("scroll", invalidate, true);
    doc.defaultView?.addEventListener("resize", invalidate);
    return () => {
      doc.removeEventListener("scroll", invalidate, true);
      doc.defaultView?.removeEventListener("resize", invalidate);
    };
  }, []);
  const capture = (wasShown: boolean) => {
    const host = node.current;
    if (
      !host ||
      !group?.allowed ||
      nativeTextContext(host) ||
      !host.parentElement ||
      !groupMapping(host.parentElement)
    ) {
      paint.current = null;
      return;
    }
    if (!wasShown) {
      if (paint.current) {
        const box = host.getBoundingClientRect();
        group.reentries.set(host, { x: box.x, y: box.y });
      }
      return;
    }
    {
      const child = host.firstElementChild;
      const box = host.getBoundingClientRect();
      if (
        child &&
        host.children.length === 1 &&
        box.left >= 0 &&
        box.top >= 0 &&
        box.right <= innerWidth &&
        box.bottom <= innerHeight
      ) {
        const css = getComputedStyle(child);
        if (
          css.backgroundImage !== "none" ||
          css.filter !== "none" ||
          css.mixBlendMode !== "normal" ||
          ["::before", "::after"].some(
            (pseudo) => !["none", "normal", '""'].includes(getComputedStyle(child, pseudo).content),
          )
        ) {
          paint.current = null;
          return;
        }
        const style: Record<string, string> = {};
        for (const property of [
          "backgroundColor",
          "color",
          "borderTop",
          "borderRight",
          "borderBottom",
          "borderLeft",
          "borderRadius",
          "font",
          "fontFeatureSettings",
          "fontVariationSettings",
          "letterSpacing",
          "direction",
          "whiteSpace",
          "opacity",
          "padding",
          "boxShadow",
          "textAlign",
          "alignItems",
          "justifyContent",
        ] as const)
          style[property] = css[property];
        paint.current = {
          text: child.textContent ?? "",
          style: { ...style, display: "flex", width: box.width, height: box.height, boxSizing: "border-box" },
          box: {
            position: "fixed",
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            contain: "strict",
            overflow: "clip",
            pointerEvents: "none",
          },
        };
      } else paint.current = null;
    }
  };
  committed(
    () => () => {
      lifecycle.current?.dispose();
      lifecycle.current = null;
      if (node.current) group?.reentries.delete(node.current);
      group?.request();
    },
    [],
  );
  return (
    <MotionPresentation scope={scope} consumeEntrance>
      <BeforeGroupMutation shown={shown} capture={capture}>
        <span
          ref={ref}
          data-slot="button-group-segment"
          data-motion={cm.mode}
          data-group-key={identity}
          data-group-first={first ? "" : undefined}
          data-group-last={last ? "" : undefined}
          data-ending-style={shown ? undefined : ""}
          aria-hidden={shown ? undefined : true}
          inert={!shown || undefined}
          className={eligible ? "inline-flex shrink-0 items-stretch [&>*]:w-full" : "contents"}
          style={!shown ? (paint.current?.box ?? { display: "none" }) : undefined}
        >
          {present ? children : null}
          {!shown ? (
            <span
              ref={decoration}
              data-cadence-group-paint=""
              className="select-none before:content-[attr(data-cadence-group-label)]"
            />
          ) : null}
        </span>
      </BeforeGroupMutation>
    </MotionPresentation>
  );
}

/** React's before-mutation lifecycle reads the current painted source while
 * the real control still exists. No layout is read during render, and no second
 * caller subtree is mounted to measure or finish an exit. */
class BeforeGroupMutation extends Component<{ shown: boolean; capture(wasShown: boolean): void; children: ReactNode }> {
  getSnapshotBeforeUpdate(previous: Readonly<{ shown: boolean }>) {
    if (previous.shown !== this.props.shown) this.props.capture(previous.shown);
    return null;
  }
  componentDidUpdate() {}
  render() {
    return this.props.children;
  }
}

function writePaint(style: CSSStyleDeclaration, values: CSSProperties) {
  for (const [property, value] of Object.entries(values))
    style.setProperty(
      property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      typeof value === "number" ? `${value}px` : String(value),
    );
}

export interface ButtonGroupTextProps extends useRender.ComponentProps<"div"> {}

/** Static text in the group — a prefix, a unit, a count. `render` swaps the tag. */
function ButtonGroupText({ className, render, children, ...props }: ButtonGroupTextProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node),
    group = useContext(Group);
  const plain = typeof children === "string" || typeof children === "number";
  const paint = useStateColor(
    ref,
    cm,
    [
      "background-color",
      "color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: "verified", readabilityGate: kbdColourReadable, readabilityScope: (host) => host.parentElement },
  );
  committed(() => {
    group?.request();
  });
  return useRender({
    defaultTagName: "div",
    props: {
      ...mergeProps<"div">(
        {
          className: cn(
            "flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
            className,
          ),
        },
        props,
      ),
      ...paint,
      ref: paint.ref,
      "data-slot": "button-group-text",
      "data-motion": cm.mode,
      style: { ...paint.style, ...props.style },
      children:
        plain &&
        (!render ||
          (isValidElement<{ children?: ReactNode }>(render) &&
            typeof render.type === "string" &&
            !render.props.children)) ? (
          typeof children === "number" ? (
            <GroupNumber value={children} />
          ) : (
            <GroupText value={children} />
          )
        ) : (
          children
        ),
    },
    render,
    // `state` is what emits `data-slot` — Base UI converts state keys to data-* attributes.
    state: { slot: "button-group-text" },
  });
}

function GroupText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node),
    group = useContext(Group);
  const entity = useRef({});
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity.current,
    { characterStagger: false, stripGeometry: true, visible: group?.present },
    group?.scope.transaction,
  );
  return (
    <span ref={ref} data-slot="button-group-label" data-motion={cm.mode}>
      {text}
    </span>
  );
}
function GroupNumber({ value }: { value: number }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node),
    group = useContext(Group);
  const entity = useRef({});
  const text = useNumberPresentation(
    node,
    value,
    cm,
    entity.current,
    { compact: true, visible: group?.present, retainEditedContent: true, cause: "independent" },
    group?.scope.transaction,
  );
  return (
    <span ref={ref} data-slot="button-group-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export interface ButtonGroupSeparatorProps extends ComponentProps<typeof Separator> {}

/**
 * A rule between two controls. It stretches to the group's cross axis, so a
 * horizontal group gets a vertical rule and the reverse.
 */
function ButtonGroupSeparator({ className, orientation = "vertical", ...props }: ButtonGroupSeparatorProps) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={(state) =>
        cn(
          "relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto",
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
