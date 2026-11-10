"use client";

import { usePresence } from "motion/react";
import type * as React from "react";
import {
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import {
  createMeasuredGeometry,
  type GeometryDestination,
  GeometryScope,
  naturalGeometry,
} from "../lib/measured-geometry";
import { bindMotionParameters, geometryContent, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { createSurfacePresence } from "../lib/surface-presence";
import { nativeTextContext } from "../lib/text-layout";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

export interface CardProps extends React.ComponentProps<"div"> {
  /** `sm` tightens the padding from 1.5rem to 1rem for dense lists and sidebars. */
  size?: "default" | "sm";
  /** Hug the real content on both axes, including inside a stretching grid. */
  fit?: "content";
}
const shell =
  "group/card overflow-hidden rounded-xl border bg-card text-sm text-card-foreground shadow-sm [--card-spacing:1.5rem] data-[size=sm]:[--card-spacing:1rem]";
const flow =
  "flex flex-col gap-(--card-spacing) py-(--card-spacing) *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl";

/** A stable surface. Its actual children are also its only measurement tree. */
function Card({ className, size = "default", fit, children, ref: external, ...props }: CardProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external);
  const cm = useCadenceMotion(node);
  const CardPaint = useStateColor(
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
    { readability: safePaint(className, props.style) ? "verified" : "immediate" },
  );
  const [present, remove] = usePresence();
  const removal = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(removal.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const delivery = removal.current;
    delivery.ready = true;
    if (delivery.pending && !delivery.present) delivery.complete?.();
    delivery.pending = false;
  });
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const presence = useRef<ReturnType<typeof createSurfacePresence> | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    const parentScope = parent ?? (host ? documentPresentation(host.ownerDocument) : null);
    const enter =
      !consumed.current &&
      !initialHydration.current &&
      Boolean(
        parentScope?.presented &&
          parentScope.available() &&
          !parentScope.node?.current?.hasAttribute("data-starting-style") &&
          host &&
          !nativeTextContext(host),
      );
    if (host && !presence.current) presence.current = createSurfacePresence(host);
    if (host) consumed.current = true;
    presence.current?.commit({
      present,
      enter,
      cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    if (present) {
      scope.transaction.open();
      scope.presented = true;
    } else {
      scope.transaction.close();
      scope.presented = false;
    }
  });
  const parentGeometry = useContext(GeometryScope);
  const delivery = useRef<(() => void) | null>(null);
  const [localGeometry] = useState(() => {
    const transaction = createMotionTransaction();
    let pending = false;
    return {
      transaction,
      controller: createMeasuredGeometry(transaction),
      request() {
        if (pending) return;
        pending = true;
        queueMicrotask(() => {
          pending = false;
          delivery.current?.();
        });
      },
    };
  });
  const group = parentGeometry ?? localGeometry;
  const flowRef = useRef<HTMLDivElement>(null);
  const connection = useRef<{ group: typeof group; content: HTMLElement; fit: boolean; release(): void } | null>(null);
  const fitContent = fit === "content";
  committed(() => {
    const host = node.current;
    const content = fitContent ? flowRef.current : host;
    const old = connection.current;
    if (old && (old.group !== group || old.content !== content || old.fit !== fitContent)) {
      old.release();
      connection.current = null;
    }
    if (host && content && !connection.current) {
      const release = group.controller.register({
        host: node,
        content,
        axes: fitContent ? ["width", "height"] : ["height"],
        destinationWidth: fitContent,
        observeChildren: !fitContent,
        measure() {
          return cardDestination(host, content, fitContent);
        },
      });
      const releaseEditing = observeCardEditing(host, group.controller, () => presence.current?.settleEntrance());
      connection.current = {
        group,
        content,
        fit: fitContent,
        release() {
          releaseEditing();
          release();
        },
      };
    }
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    delivery.current = () => {
      if (!host?.isConnected || parentGeometry || parameters.kind !== "geometry") return;
      const target = JSON.stringify([host.textContent, size, fit, className, props.style, content?.childElementCount]);
      group.controller.commit(group.transaction.revision("content", target, node), {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: present && scope.available(),
      });
    };
    if (parentGeometry) parentGeometry.request?.();
    else delivery.current();
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      connection.current?.release();
      connection.current = null;
      delivery.current = null;
      localGeometry.controller.settle();
    },
    [localGeometry],
  );
  return (
    <MotionPresentation scope={scope}>
      <GeometryScope.Provider value={group}>
        <div
          {...props}
          {...CardPaint}
          data-slot="card"
          data-size={size}
          data-fit={fit}
          data-motion={cm.mode}
          data-ending-style={present ? undefined : ""}
          inert={!present || props.inert || undefined}
          aria-hidden={present ? props["aria-hidden"] : true}
          className={cn(shell, fitContent ? "h-fit w-fit" : flow, className)}
          style={{ ...CardPaint.style, ...props.style, ...(fitContent ? { height: "fit-content" } : {}) }}
        >
          {fitContent ? (
            <div ref={flowRef} data-slot="card-flow" className={flow}>
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}
function cardDestination(host: HTMLElement, content: HTMLElement, fitContent: boolean) {
  if (nativeTextContext(host)) return null;
  const box = naturalGeometry(host);
  if (!box || !naturalGeometry(content)) return null;
  const typed = host.computedStyleMap?.();
  const intrinsic = (axis: "width" | "height") =>
    ["auto", "fit-content", "max-content"].includes(typed?.get(axis)?.toString() ?? "");
  const css = getComputedStyle(host);
  const destination: GeometryDestination = {};
  const rect = host.getBoundingClientRect();
  const verticalScale = rect.height / host.offsetHeight;
  const horizontalScale = rect.width / host.offsetWidth;
  const parts = Array.from(content.children);
  const displays = host.querySelectorAll('[data-slot="card-text"],[data-slot="card-number"]');
  if (parts.length > motionLimits.collectionVisuals || displays.length > motionLimits.collectionVisuals) return null;
  let depth = 0;
  for (let ancestor: HTMLElement | null = host; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > motionLimits.collectionVisuals) return null;
    const style = getComputedStyle(ancestor);
    if (style.rotate !== "none" || style.perspective !== "none" || style.transform.startsWith("matrix3d")) return null;
    if (style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return null;
    }
  }
  // Do not hide newly committed body copy/actions behind a smaller
  // shell. Only already-empty padding can be progressively exposed.
  const requiredHeight = Math.max(
    0,
    ...parts.map((part) => (part.getBoundingClientRect().bottom - rect.top) / verticalScale),
  );
  const requiredWidth = Math.max(
    0,
    ...Array.from(displays).map((part) => (part.getBoundingClientRect().right - rect.left) / horizontalScale),
  );
  const axes: ("width" | "height")[] = fitContent ? ["width", "height"] : ["height"];
  for (const axis of axes) {
    if (!intrinsic(axis) || css.aspectRatio !== "auto") continue;
    const family = css.transitionProperty.split(",").map((value) => value.trim());
    const durations = css.transitionDuration.split(",").map(Number.parseFloat);
    if (
      family.some(
        (property, index) =>
          (property === "all" || property === axis) && (durations[index % durations.length] ?? 0) > 0,
      ) ||
      host
        .getAnimations()
        .some((animation) => (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => axis in frame))
    )
      continue;
    destination[axis] = {
      size: box[axis],
      min: Math.min(box[axis], axis === "height" ? requiredHeight : requiredWidth),
      max: Number.POSITIVE_INFINITY,
      readable: axis === "height" || !wrapsContent(host),
      independent: true,
    };
  }
  return destination;
}

/** Native ancestor editing wins before paint, preserving the existing tree. */
function observeCardEditing(
  host: HTMLElement,
  controller: ReturnType<typeof createMeasuredGeometry>,
  reveal: () => void,
) {
  let alive = true;
  const settle = () => {
    if (!alive || !host.isConnected || !nativeTextContext(host)) return;
    controller.settle();
    reveal();
  };
  const observer = new MutationObserver(settle);
  let ancestor: HTMLElement | null = host;
  for (let depth = 0; ancestor && depth < motionLimits.collectionVisuals; depth++) {
    observer.observe(ancestor, { attributes: true, attributeFilter: ["contenteditable"] });
    ancestor = ancestor.parentElement;
  }
  const selection = () => {
    const anchor = host.ownerDocument.getSelection()?.anchorNode;
    if (anchor && host.contains(anchor)) settle();
  };
  host.ownerDocument.addEventListener("selectionchange", selection);
  settle();
  return () => {
    alive = false;
    observer.disconnect();
    host.ownerDocument.removeEventListener("selectionchange", selection);
  };
}

function wrapsContent(host: HTMLElement) {
  return Array.from(
    host.querySelectorAll<HTMLElement>("[data-slot=card-title],[data-slot=card-description],[data-slot=card-content]"),
  ).some((part) => getComputedStyle(part).whiteSpace !== "nowrap");
}
/** Unknown palettes commit immediately rather than passing through unreadable paint. */
function safePaint(classes?: string, style?: React.CSSProperties) {
  return (
    !Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    ) &&
    !(classes ?? "")
      .split(/\s+/)
      .some(
        (name) =>
          /(?:^|:)(?:bg-|text-|border-|shadow-)/.test(name) &&
          !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:card|background|muted)|text-(?:foreground|card-foreground|muted-foreground)|border-(?:b|t|l|r|border)|shadow-sm)$/.test(
            name,
          ),
      )
  );
}

export interface CardHeaderProps extends React.ComponentProps<"div"> {}
function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const CardHeaderPaint = useStateColor(
    host.ref,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: safePaint(className, props.style) ? "verified" : "immediate" },
  );
  return (
    <div
      {...props}
      {...CardHeaderPaint}
      data-slot="card-header"
      data-motion={cm.mode}
      className={cn(
        "@container/card-header group-data-[fit=content]/card:[container-type:normal] grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      style={{ ...CardHeaderPaint.style, ...props.style }}
    />
  );
}
/** Both forms keep the same actual span/Text across primitive changes. */
function CardDisplay({ value, entity }: { value: string | number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const initial = useRef(String(value));
  const previous = useRef(String(value));
  const textMode = typeof value === "string";
  const text = useTextPresentation(
    node,
    textMode ? value : "",
    cm,
    entity,
    {
      characterStagger: false,
      visible: scope?.available(),
      enabled: textMode,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  const number = useNumberPresentation(
    node,
    textMode ? 0 : value,
    cm,
    entity,
    {
      visible: scope?.available(),
      cause: "independent",
      retainEditedContent: true,
      enabled: !textMode,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  committed(() => {
    previous.current = String(value);
  });
  return textMode ? (
    <span ref={ref} data-slot="card-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="card-number" data-motion={cm.mode}>
      {number}
    </span>
  );
}
export interface CardTitleProps extends React.ComponentProps<"div"> {}
function CardTitle({ className, children, ref, ...props }: CardTitleProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const CardTitlePaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
    immediate:
      !/(?:^|\s)(?:[\w-]+:)*text-(?:foreground|card-foreground|muted-foreground)(?:\s|$)/.test(className ?? "") &&
      !props.style?.color,
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <CardDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      {...props}
      {...CardTitlePaint}
      data-slot="card-title"
      data-motion={cm.mode}
      className={cn("leading-none font-semibold", className)}
      style={{ ...CardTitlePaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}
export interface CardDescriptionProps extends React.ComponentProps<"div"> {}
function CardDescription({ className, children, ref, ...props }: CardDescriptionProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const CardDescriptionPaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <CardDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      {...props}
      {...CardDescriptionPaint}
      data-slot="card-description"
      data-motion={cm.mode}
      className={cn("text-sm text-muted-foreground", className)}
      style={{ ...CardDescriptionPaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}
export interface CardActionProps extends React.ComponentProps<"div"> {}
function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}
export interface CardContentProps extends React.ComponentProps<"div"> {}
function CardContent({ className, children, ref, ...props }: CardContentProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const CardContentPaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
    immediate:
      !/(?:^|\s)(?:[\w-]+:)*text-(?:foreground|card-foreground|muted-foreground)(?:\s|$)/.test(className ?? "") &&
      !props.style?.color,
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <CardDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      {...props}
      {...CardContentPaint}
      data-slot="card-content"
      data-motion={cm.mode}
      className={cn("px-(--card-spacing)", className)}
      style={{ ...CardContentPaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}
export interface CardFooterProps extends React.ComponentProps<"div"> {}
function CardFooter({ className, ref, ...props }: CardFooterProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const CardFooterPaint = useStateColor(
    host.ref,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: safePaint(className, props.style) ? "verified" : "immediate" },
  );
  return (
    <div
      {...props}
      {...CardFooterPaint}
      data-slot="card-footer"
      data-motion={cm.mode}
      className={cn("flex items-center px-(--card-spacing) [.border-t]:pt-(--card-spacing)", className)}
      style={{ ...CardFooterPaint.style, ...props.style }}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
