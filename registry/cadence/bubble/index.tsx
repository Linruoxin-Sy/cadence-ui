"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { usePresence } from "motion/react";
import type * as React from "react";
import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createGroupPositions } from "../lib/button-group-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, geometryContent, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { nativeTextContext } from "../lib/text-layout";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Box = { x: number; y: number; width: number; height: number };

/**
 * One presence envelope on a retained host. The newest committed `present` wins,
 * an exit keeps its zero-opacity frame until the parent removes the host, and a
 * focus/selection/pointer interaction settles the pending fade instead of
 * fighting the caret. `commit` reports whether the host is available to the
 * writers that share the same insertion.
 */
function useInlineLayer(external?: React.Ref<HTMLElement>) {
  const { node, ref } = useMotionHostRef<HTMLElement>(external);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const [present, remove] = usePresence();
  const removal = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(removal.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const batch = removal.current;
    batch.ready = true;
    if (batch.pending && !batch.present) batch.complete?.();
    batch.pending = false;
  });
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const presence = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  const commit = () => {
    const host = node.current;
    if (!host) return false;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    const enter =
      !consumed.current &&
      !initialHydration.current &&
      baseline.presented &&
      baseline.available() &&
      !host.hasAttribute("data-starting-style");
    if (!presence.current) presence.current = createInlinePresence(host, scope.transaction);
    presence.current.commit({
      present,
      enter: enter && !nativeTextContext(host),
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
      complete: () => {
        const current = removal.current;
        if (current.present) return;
        if (current.ready) current.complete?.();
        else current.pending = true;
      },
    });
    consumed.current = true;
    // Presence gates the descendants' eligibility through this scope; the
    // message and its overlay are removed by their caller, so this envelope
    // never closes the shared transaction under a retained descendant.
    scope.presented = present;
    return present && scope.available() && baseline.available();
  };
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );
  return { node, ref, cm, scope, parent, present, commit };
}

/** One group envelope for the messages it initially contains. */
function BubbleGroup({ className, children, ref, ...props }: React.ComponentProps<"div">) {
  const layer = useInlineLayer(ref as React.Ref<HTMLElement>);
  committed(() => {
    layer.commit();
  });
  return (
    <MotionPresentation scope={layer.scope}>
      <div
        {...props}
        data-motion={layer.cm.mode}
        data-slot="bubble-group"
        className={cn("flex min-w-0 flex-col gap-2", className)}
        ref={layer.ref}
      >
        {children}
      </div>
    </MotionPresentation>
  );
}

const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/80",
        secondary:
          "*:data-[slot=bubble-content]:bg-secondary *:data-[slot=bubble-content]:text-secondary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        muted:
          "*:data-[slot=bubble-content]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)]",
        tinted:
          "*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] *:data-[slot=bubble-content]:text-foreground dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.88_calc(c*0.5)_h)] dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-[oklch(from_var(--primary)_0.35_calc(c*0.5)_h)]",
        outline:
          "*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50",
        destructive:
          "*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-foreground *:data-[slot=bubble-content]:border-destructive/50 dark:*:data-[slot=bubble-content]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20 dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

/** The offsetParent-relative box a placement projection moves from and to. */
function offsetBox(host: HTMLElement): Box {
  return { x: host.offsetLeft, y: host.offsetTop, width: host.offsetWidth, height: host.offsetHeight };
}

/**
 * One message. The root owns its insertion envelope and the bounded reflow of
 * its own final box when the align side changes; content text, colour and size
 * belong to the parts inside it, and an align revision never replays the
 * surface entrance.
 */
function Bubble({
  variant = "default",
  align = "start",
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end";
  }) {
  const layer = useInlineLayer(ref as React.Ref<HTMLElement>);
  const placement = useRef<ReturnType<typeof createGroupPositions> | null>(null);
  const box = useRef<Box | null>(null);
  committed(() => {
    const available = layer.commit();
    const host = layer.node.current;
    if (!host) return;
    if (!placement.current) placement.current = createGroupPositions(layer.scope.transaction);
    const next = offsetBox(host);
    const previous = box.current;
    placement.current.commit({
      host: layer.node,
      revision: layer.scope.transaction.revision("layout", JSON.stringify([align, next.x]), layer.node),
      cm: layer.cm,
      boxes: new Map([[host, next]]),
      from: new Map([[host, previous ?? next]]),
      available: available && Boolean(previous) && previous?.x !== next.x,
      axis: "x",
    });
    box.current = next;
  });
  return (
    <MotionPresentation scope={layer.scope}>
      <div
        {...props}
        data-motion={layer.cm.mode}
        data-slot="bubble"
        data-variant={variant}
        data-align={align}
        className={cn(bubbleVariants({ variant }), className)}
        ref={layer.ref}
      >
        {children}
      </div>
    </MotionPresentation>
  );
}

/**
 * The bubble surface and its own block size. Rich children keep their own paint
 * and structure: only a direct display string or number is decomposed, and its
 * private span owns that paint.
 */
function BubbleContent({
  className,
  children,
  render,
  ref: external,
  style,
  ...props
}: useRender.ComponentProps<"div">) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const surface = useStateColor(
    ref,
    cm,
    ["background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: safePaint(className, style) ? "verified" : "immediate" },
  );
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    if (connection.current?.host !== host) {
      connection.current?.release();
      connection.current = {
        host,
        release: geometry.controller.register({
          host: node,
          content: host,
          axes: ["height"],
          observeChildren: true,
          measure: () => contentDestination(host),
        }),
      };
    }
    if (parameters.kind !== "geometry" || !host.isConnected) return;
    geometry.controller.commit(
      geometry.transaction.revision("content", JSON.stringify([host.childElementCount, host.textContent]), node),
      {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: scope?.available() !== false && !nativeTextContext(host),
      },
    );
  });
  committed(
    () => () => {
      connection.current?.release();
      connection.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );
  return useRender({
    defaultTagName: "div",
    props: {
      ...mergeProps<"div">(
        {
          className: cn(
            "w-fit max-w-full min-w-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [&:is(button)]:text-left [&:is(button,a)]:outline-none [&:is(button,a)]:focus-visible:ring-3 [&:is(button,a)]:focus-visible:ring-ring/50",
            className,
          ),
        },
        props,
      ),
      ...surface,
      ref: surface.ref,
      "data-slot": "bubble-content",
      "data-motion": cm.mode,
      style: { ...surface.style, ...style },
      children: isDisplay(children) ? (
        <BubbleContentText value={children} tint={className} tintStyle={style} />
      ) : (
        children
      ),
    },
    render,
    // `state` is what emits `data-slot` — Base UI converts state keys to data-* attributes.
    state: {
      slot: "bubble-content",
    },
  });
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-3 ring-card has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  },
);

/**
 * The reaction overlay. It owns its own insertion envelope, its independent
 * overlay box and the bounded displacement between two committed anchor
 * constraints; the resting placement translate stays the positional writer, so
 * the projection only composes a temporary offset over it. Rich reaction
 * controls keep their own display, focus and press owners.
 */
function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  children,
  ref,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end";
  side?: "top" | "bottom";
}) {
  const layer = useInlineLayer(ref as React.Ref<HTMLElement>);
  const surface = useStateColor(
    layer.ref,
    layer.cm,
    ["background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: safePaint(className, style) ? "verified" : "immediate" },
  );
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const placement = useRef<ReturnType<typeof createGroupPositions> | null>(null);
  const box = useRef<Box | null>(null);
  committed(() => {
    const available = layer.commit();
    const host = layer.node.current;
    if (!host) return;
    if (!placement.current) placement.current = createGroupPositions(layer.scope.transaction);
    const next = offsetBox(host);
    const previous = box.current;
    placement.current.commit({
      host: layer.node,
      revision: layer.scope.transaction.revision("layout", JSON.stringify([side, align, next.x, next.y]), layer.node),
      cm: layer.cm,
      boxes: new Map([[host, next]]),
      from: new Map([[host, previous ?? next]]),
      available: available && Boolean(previous) && (previous?.x !== next.x || previous?.y !== next.y),
      axis: previous && previous.y !== next.y ? "y" : "x",
    });
    box.current = next;
    const parameters = layer.cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (connection.current?.host !== host) {
      connection.current?.release();
      connection.current = {
        host,
        release: geometry.controller.register({
          host: layer.node,
          content: host,
          axes: ["width", "height"],
          observeChildren: true,
          measure: () => contentDestination(host),
        }),
      };
    }
    if (parameters.kind !== "geometry" || !host.isConnected) return;
    geometry.controller.commit(
      geometry.transaction.revision(
        "content",
        JSON.stringify([side, align, host.childElementCount, host.textContent]),
        layer.node,
      ),
      { reduced: layer.cm.reduced, transition: parameters.transition, available },
    );
  });
  committed(
    () => () => {
      connection.current?.release();
      connection.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );
  return (
    <div
      {...props}
      {...surface}
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      style={{ ...surface.style, ...style }}
    >
      {isDisplay(children) ? <BubbleReactionText value={children} tint={className} tintStyle={style} /> : children}
    </div>
  );
}

/** A caller inline colour is applied to the display span exactly as inheritance would. */
function callerColour(style?: React.CSSProperties) {
  return typeof style?.color === "string" ? { color: style.color } : undefined;
}

const isDisplay = (children: React.ReactNode): children is string | number =>
  typeof children === "string" || typeof children === "number";

/**
 * A direct display string on the message content. Changed runs keep their
 * unchanged graphemes; a direct number is a quantity in its existing format.
 * Switching renderer type establishes the current display as the baseline.
 */
function BubbleContentText({
  value,
  tint,
  tintStyle,
}: {
  value: string | number;
  tint?: string;
  tintStyle?: React.CSSProperties;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const paint = useStateColor(undefined, cm, ["color"], {
    readability: safePaint(tint, tintStyle) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
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
      stripGeometry: true,
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
      compact: true,
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
  return (
    <span
      {...paint}
      data-slot="bubble-text"
      data-motion={cm.mode}
      style={{ ...paint.style, ...callerColour(tintStyle) }}
    >
      {textMode ? (
        <span ref={ref} data-slot="bubble-text-runs" data-motion={cm.mode}>
          {text}
        </span>
      ) : (
        <span ref={ref} data-slot="bubble-text-runs" data-motion={cm.mode}>
          {number}
        </span>
      )}
    </span>
  );
}

/** A direct display reaction value on its own retained span, inside the overlay. */
function BubbleReactionText({
  value,
  tint,
  tintStyle,
}: {
  value: string | number;
  tint?: string;
  tintStyle?: React.CSSProperties;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const paint = useStateColor(undefined, cm, ["color"], {
    readability: safePaint(tint, tintStyle) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
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
      stripGeometry: true,
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
      compact: true,
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
  return (
    <span
      {...paint}
      data-slot="bubble-reactions-text"
      data-motion={cm.mode}
      style={{ ...paint.style, ...callerColour(tintStyle) }}
    >
      {textMode ? (
        <span ref={ref} data-slot="bubble-reactions-text-runs" data-motion={cm.mode}>
          {text}
        </span>
      ) : (
        <span ref={ref} data-slot="bubble-reactions-text-runs" data-motion={cm.mode}>
          {number}
        </span>
      )}
    </span>
  );
}

/** The committed block size of one display host; caller-fixed axes stay native. */
function contentDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  if (host.children.length > motionLimits.collectionVisuals) return null;
  const css = getComputedStyle(host);
  if (css.aspectRatio !== "auto") return null;
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) =>
        ["all", "width", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    ) ||
    host
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)
          ?.getKeyframes()
          .some((frame) => "width" in frame || "height" in frame),
      )
  )
    return null;
  const box = naturalGeometry(host);
  if (!box) return null;
  const size = (axis: "width" | "height") => {
    const declared = host.computedStyleMap?.().get(axis)?.toString() ?? "";
    if (declared && !/^(auto|fit-content|max-content)$/.test(declared)) return undefined;
    return { size: box[axis], readable: true, independent: true };
  };
  const width = size("width"),
    height = size("height");
  if (!width && !height) return null;
  return { ...(width ? { width } : {}), ...(height ? { height } : {}) };
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
          !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:card|background|muted|transparent)|text-(?:foreground|card-foreground|muted-foreground|destructive)|border-(?:b|t|l|r|border|transparent)|shadow-sm)$/.test(
            name,
          ),
      )
  );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
