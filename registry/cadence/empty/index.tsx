"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
  isValidElement,
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
import { createEmptyMedia } from "../lib/empty-media";
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

export interface EmptyProps extends React.ComponentProps<"div"> {}

/** One native empty region; visual retention never retains operable actions. */
function Empty({ className, children, ref: external, ...props }: EmptyProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external);
  const cm = useCadenceMotion(node);
  const EmptyPaint = useStateColor(
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
  const semantic = JSON.stringify([className, props.style, ownedContent(children)]);
  const prepared = useRef({ semantic, policy: JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]) });
  useInsertionEffect(() => {
    const policy = JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]);
    if (prepared.current.semantic !== semantic || prepared.current.policy !== policy) group.controller.prepare();
    prepared.current = { semantic, policy };
  }, [semantic, cm.mode, cm.timeScale, cm.scope.signature, group]);
  const connection = useRef<{ content: HTMLElement; group: typeof group; release(): void } | null>(null);
  committed(() => {
    const host = node.current;
    const content = host;
    const old = connection.current;
    if (old && (old.content !== content || old.group !== group || parentGeometry)) {
      old.release();
      connection.current = null;
    }
    if (host && content && !parentGeometry && !connection.current) {
      const release = group.controller.register({
        host: node,
        content,
        axes: ["height"],
        observeChildren: true,
        textGeometry: true,
        measure() {
          return emptyDestination(host);
        },
      });
      const releaseEditing = observeEmptyEditing(host, group.controller, () => presence.current?.settleEntrance());
      connection.current = {
        content,
        group,
        release() {
          releaseEditing();
          release();
        },
      };
    }
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    delivery.current = () => {
      if (!host?.isConnected || parentGeometry || parameters.kind !== "geometry") return;
      const target = JSON.stringify([host.textContent, className, props.style, content?.childElementCount]);
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
          data-slot="empty"
          {...props}
          {...EmptyPaint}
          role={present ? props.role : undefined}
          data-motion={cm.mode}
          data-ending-style={present ? undefined : ""}
          inert={!present || props.inert || undefined}
          aria-hidden={present ? props["aria-hidden"] : true}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center text-balance md:p-12",
            className,
          )}
          style={{ ...EmptyPaint.style, ...props.style }}
        >
          {children}
        </div>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}
function emptyDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const box = naturalGeometry(host);
  const css = getComputedStyle(host);
  if (
    !box ||
    !["auto", "fit-content", "max-content"].includes(host.computedStyleMap?.().get("height")?.toString() ?? "") ||
    css.aspectRatio !== "auto"
  )
    return null;
  const parts = Array.from(host.children);
  if (parts.length > motionLimits.collectionVisuals) return null;
  let depth = 0;
  for (let ancestor: HTMLElement | null = host; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > motionLimits.collectionVisuals) return null;
    const style = getComputedStyle(ancestor);
    if (
      style.rotate !== "none" ||
      style.perspective !== "none" ||
      style.transform.startsWith("matrix3d") ||
      (style.scale !== "none" && style.scale.split(/\s+/).some((value) => !(Number.parseFloat(value) > 0)))
    )
      return null;
    if (style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return null;
    }
  }
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => ["all", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    ) ||
    host
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "height" in frame),
      )
  )
    return null;
  const rect = host.getBoundingClientRect();
  const scale = rect.height / host.offsetHeight;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  // Preserve the destination's visible text, line clamp and action/focus room.
  const required = Math.max(0, ...parts.map((part) => (part.getBoundingClientRect().bottom - rect.top) / scale));
  let max = Number.POSITIVE_INFINITY;
  const parent = host.parentElement;
  if (parent && /^(hidden|clip)$/.test(getComputedStyle(parent).overflowY)) {
    max = (parent.getBoundingClientRect().bottom - rect.top) / scale;
    if (!Number.isFinite(max) || max < box.height) return null;
  }
  return { height: { size: box.height, min: Math.min(box.height, required), max, readable: true, independent: true } };
}

/** Native ancestor editing wins before paint, preserving the existing tree. */
function observeEmptyEditing(
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
          !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:card|background|muted)|text-(?:foreground|card-foreground|muted-foreground|destructive)|border-(?:b|t|l|r|border)|shadow-sm)$/.test(
            name,
          ),
      )
  );
}

/** Both forms keep the same actual span/Text across primitive changes. */
function EmptyDisplay({ value, entity }: { value: string | number; entity: object }) {
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
  return textMode ? (
    <span ref={ref} data-slot="empty-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="empty-number" data-motion={cm.mode}>
      {number}
    </span>
  );
}
export interface EmptyHeaderProps extends React.ComponentProps<"div"> {}

function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface EmptyMediaProps extends React.ComponentProps<"div">, VariantProps<typeof emptyMediaVariants> {}

/**
 * The visual at the top of the state: an illustration, an icon, or nothing.
 *
 * a11y: `variant="icon"` decorates; the icon must be `aria-hidden` unless the
 * title alone cannot carry the meaning.
 */
function EmptyMedia({ className, variant = "default", children, ref, ...props }: EmptyMediaProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const scope = usePresentationScope();
  const EmptyMediaPaint = useStateColor(
    host.ref,
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
    {
      readability: safePaint(className, props.style) ? "verified" : "immediate",
    },
  );
  const media = useRef<ReturnType<typeof createEmptyMedia> | null>(null);
  // Explicit visual identity, not recursive artwork inspection or component invocation.
  const identity = Children.toArray(children).map((child) =>
    isValidElement<{ src?: string }>(child) ? [child.type, child.key, child.props.src] : child,
  );
  const previous = useRef({ parts: identity, revision: 0 });
  committed(() => {
    const old = previous.current;
    if (
      old.parts.length !== identity.length ||
      identity.some((part, index) => {
        const before = old.parts[index];
        return Array.isArray(part) && Array.isArray(before)
          ? part.some((value, key) => !Object.is(value, before[key]))
          : !Object.is(part, before);
      })
    )
      previous.current = { parts: identity, revision: old.revision + 1 };
    if (!media.current && host.node.current) media.current = createEmptyMedia(host.node.current, scope?.transaction);
    media.current?.commit({
      key: previous.current.revision,
      cm,
      present: scope?.available() !== false,
      reduced: cm.reduced,
    });
  });
  committed(
    () => () => {
      media.current?.dispose();
      media.current = null;
    },
    [],
  );
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      {...props}
      {...EmptyMediaPaint}
      data-motion={cm.mode}
      className={cn(emptyMediaVariants({ variant }), className)}
      style={{ ...EmptyMediaPaint.style, ...props.style }}
    >
      {children}
    </div>
  );
}

export interface EmptyTitleProps extends React.ComponentProps<"div"> {}

function EmptyTitle({ className, children, ref, ...props }: EmptyTitleProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(host.node);
  const EmptyTitlePaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
    immediate:
      !/(?:^|\s)(?:[\w-]+:)*text-(?:foreground|card-foreground|muted-foreground|destructive)(?:\s|$)/.test(
        className ?? "",
      ) && !props.style?.color,
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <EmptyDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      data-slot="empty-title"
      {...props}
      {...EmptyTitlePaint}
      data-motion={cm.mode}
      className={cn("text-lg font-medium tracking-tight", className)}
      style={{ ...EmptyTitlePaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}

export interface EmptyDescriptionProps extends React.ComponentProps<"p"> {}

/**
 * Renders a `div` rather than the `p` its props suggest — upstream does the same,
 * because a description regularly contains a block-level link or a `<p>` of its
 * own and nested paragraphs are invalid HTML.
 */
function EmptyDescription({ className, children, ref, ...props }: EmptyDescriptionProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(host.node);
  const EmptyDescriptionPaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <EmptyDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      data-slot="empty-description"
      {...props}
      {...EmptyDescriptionPaint}
      data-motion={cm.mode}
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      style={{ ...EmptyDescriptionPaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}

export interface EmptyContentProps extends React.ComponentProps<"div"> {}

function EmptyContent({ className, children, ref, ...props }: EmptyContentProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(host.node);
  const EmptyContentPaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
    immediate:
      !/(?:^|\s)(?:[\w-]+:)*text-(?:foreground|card-foreground|muted-foreground|destructive)(?:\s|$)/.test(
        className ?? "",
      ) && !props.style?.color,
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <EmptyDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      data-slot="empty-content"
      {...props}
      {...EmptyContentPaint}
      data-motion={cm.mode}
      className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance", className)}
      style={{ ...EmptyContentPaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, emptyMediaVariants };

/** Only the library's known display structure contributes a semantic size cause. */
function ownedContent(children: React.ReactNode, depth = 0): unknown[] {
  return Children.toArray(children)
    .slice(0, motionLimits.collectionVisuals)
    .map((child) => {
      if (
        !isValidElement<{
          children?: React.ReactNode;
          className?: string;
          style?: React.CSSProperties;
          variant?: string;
        }>(child)
      )
        return typeof child === "string" || typeof child === "number" ? child : null;
      const { children: content, className, style, variant } = child.props;
      return [
        child.key,
        className,
        style,
        variant,
        child.type === EmptyHeader && depth === 0
          ? ownedContent(content, depth + 1)
          : typeof content === "string" || typeof content === "number"
            ? content
            : Children.toArray(content)
                .slice(0, motionLimits.collectionVisuals)
                .map((part) => (isValidElement(part) ? part.key : typeof part)),
      ];
    });
}
