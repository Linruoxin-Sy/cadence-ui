"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
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
import { Button } from "../button";
import { cn } from "../lib/cn";
import { useContinuousMotion, useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, motionLimits } from "../lib/motion";
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

type AttachmentStateValue = "idle" | "uploading" | "processing" | "error" | "done";

/** Supplied state is the only cause a nested title/media part may read; it never
 * becomes an upload or retry API. */
const AttachmentStateContext = createContext<AttachmentStateValue>("done");

const attachmentVariants = cva(
  "group/attachment relative flex w-fit max-w-full min-w-0 shrink-0 flex-wrap rounded-xl border bg-card text-card-foreground focus-within:ring-1 focus-within:ring-ring/50 has-[>a,>button]:hover:bg-muted/50 data-[state=error]:border-destructive/30 data-[state=idle]:border-dashed",
  {
    variants: {
      size: {
        default:
          "gap-2 text-sm has-data-[slot=attachment-content]:px-2.5 has-data-[slot=attachment-content]:py-2 has-data-[slot=attachment-media]:p-2",
        sm: "gap-2.5 text-xs has-data-[slot=attachment-content]:px-2 has-data-[slot=attachment-content]:py-1.5 has-data-[slot=attachment-media]:p-1.5",
        xs: "gap-1.5 rounded-lg text-xs has-data-[slot=attachment-content]:px-1.5 has-data-[slot=attachment-content]:py-1 has-data-[slot=attachment-media]:p-1",
      },
      orientation: {
        horizontal: "min-w-40 items-center",
        vertical: "w-24 flex-col has-data-[slot=attachment-content]:w-30",
      },
    },
  },
);

/**
 * One supplied file tile. The tile owns its own presence, its content-driven box,
 * its scoped surface paint and the overlay trigger's host. It does not upload,
 * retry or delete anything: every state is supplied.
 */
function Attachment({
  className,
  state = "done",
  size = "default",
  orientation = "horizontal",
  children,
  ref: external,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof attachmentVariants> & {
    state?: AttachmentStateValue;
  }) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const rootPaint = useStateColor(
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
    {
      readability: safePaint(className, props.style) ? "verified" : "immediate",
    },
  );
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
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const delivery = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    if (!host) return;
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
    if (present) {
      scope.transaction.open();
      scope.presented = true;
    } else {
      scope.transaction.close();
      scope.presented = false;
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (connection.current?.host !== host) {
      connection.current?.release();
      connection.current = {
        host,
        release: geometry.controller.register({
          host: node,
          content: host,
          axes: ["width", "height"],
          observeChildren: true,
          textGeometry: true,
          measure: () => attachmentDestination(host),
        }),
      };
    }
    delivery.current = () => {
      if (!host.isConnected || parameters.kind !== "geometry") return;
      geometry.controller.commit(
        geometry.transaction.revision(
          "content",
          JSON.stringify([state, size, orientation, host.childElementCount, host.textContent]),
          node,
        ),
        {
          reduced: cm.reduced,
          transition: parameters.transition,
          available: present && scope.available() && baseline.available() && !nativeTextContext(host),
        },
      );
    };
    delivery.current();
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      connection.current?.release();
      connection.current = null;
      delivery.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );
  return (
    <MotionPresentation scope={scope}>
      <AttachmentStateContext.Provider value={state}>
        <div
          {...props}
          {...rootPaint}
          data-motion={cm.mode}
          data-slot="attachment"
          data-state={state}
          data-size={size}
          data-orientation={orientation}
          className={cn(attachmentVariants({ size, orientation }), className)}
          style={{ ...rootPaint.style, ...props.style }}
          data-ending-style={present ? undefined : ""}
          inert={!present || props.inert || undefined}
          aria-hidden={present ? props["aria-hidden"] : true}
        >
          {children}
        </div>
      </AttachmentStateContext.Provider>
    </MotionPresentation>
  );
}

const attachmentMediaVariants = cva(
  "relative flex aspect-square w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-foreground group-data-[orientation=vertical]/attachment:w-full group-data-[size=sm]/attachment:w-8 group-data-[size=xs]/attachment:w-7 group-data-[size=xs]/attachment:rounded-md group-data-[state=error]/attachment:bg-destructive/10 group-data-[state=error]/attachment:text-destructive group-data-[orientation=vertical]/attachment:*:data-[slot=spinner]:size-6! [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 group-data-[orientation=vertical]/attachment:[&_svg:not([class*='size-'])]:size-6 group-data-[size=xs]/attachment:[&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        icon: "",
        image:
          "opacity-60 group-data-[state=done]/attachment:opacity-100 group-data-[state=idle]/attachment:opacity-100 *:[img]:aspect-square *:[img]:w-full *:[img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "icon",
    },
  },
);

/**
 * The tile's supplied preview. A changed supplied visual and a supplied state
 * change share the one opacity envelope on this stable host; the supplied
 * artwork itself is never cloned or remounted.
 */
function AttachmentMedia({
  className,
  variant = "icon",
  children,
  ref: external,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof attachmentMediaVariants>) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const mediaPaint = useStateColor(
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
    {
      readability: safePaint(className, props.style) ? "verified" : "immediate",
    },
  );
  const state = useContext(AttachmentStateContext);
  const parent = usePresentationScope();
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
  // Explicit supplied-visual identity plus the supplied state, never recursive
  // artwork inspection and never an inferred file identity from the filename.
  const signature = JSON.stringify([visualIdentity(children), state, variant]);
  const previous = useRef({ signature, revision: 0 });
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!Object.is(previous.current.signature, signature))
      previous.current = { signature, revision: previous.current.revision + 1 };
    const available = parent?.available() !== false;
    const enter = !consumed.current && !initialHydration.current && Boolean(parent?.presented) && available && present;
    if (!presence.current) presence.current = createInlinePresence(host);
    presence.current.commit({
      present,
      enter: enter && !nativeTextContext(host),
      revision: previous.current.revision,
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    consumed.current = true;
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );
  return (
    <div
      {...props}
      {...mediaPaint}
      data-slot="attachment-media"
      data-variant={variant}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(attachmentMediaVariants({ variant }), className)}
      style={{ ...mediaPaint.style, ...props.style }}
    >
      {children}
    </div>
  );
}

function AttachmentContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-content"
      className={cn(
        "max-w-full min-w-0 flex-1 leading-tight group-data-[orientation=vertical]/attachment:px-1",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The filename. Its single opacity owner is the busy pulse; a text replacement
 * is another cause on the same retained span, so unchanged characters never
 * inherit a dim pulse.
 */
function AttachmentTitle({ className, children, ref: external, ...props }: React.ComponentProps<"span">) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external as React.Ref<HTMLSpanElement>);
  const cm = useCadenceMotion(node);
  const state = useContext(AttachmentStateContext);
  const busy = state === "uploading" || state === "processing";
  const pulse = useContinuousMotion(ref, cm, "pulse", busy);
  const titlePaint = useStateColor(pulse.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
  return (
    <span
      {...props}
      {...pulse}
      {...titlePaint}
      data-motion={cm.mode}
      data-slot="attachment-title"
      data-state={state}
      className={cn(
        "block max-w-full min-w-0 truncate font-medium",
        cm.reduced ? "transform-none" : undefined,
        className,
      )}
      style={{ ...pulse.style, ...titlePaint.style, ...props.style }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <AttachmentDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </span>
  );
}

/** Both forms keep the same actual span across primitive changes. */
function AttachmentDisplay({ value, entity }: { value: string | number; entity: object }) {
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
    <span ref={ref} data-slot="attachment-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="attachment-number" data-motion={cm.mode}>
      {number}
    </span>
  );
}

/**
 * The description. Plain supplied strings replace changed runs only; a direct
 * display quantity reels on the same span. The description owns its own
 * foreground.
 */
function AttachmentDescription({ className, children, ref: external, ...props }: React.ComponentProps<"span">) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external as React.Ref<HTMLSpanElement>);
  const cm = useCadenceMotion(node);
  const descriptionPaint = useStateColor(ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
  return (
    <span
      {...props}
      {...descriptionPaint}
      data-slot="attachment-description"
      data-motion={cm.mode}
      className={cn(
        "mt-0.5 block min-w-0 max-w-full truncate text-xs text-muted-foreground group-data-[state=error]/attachment:text-destructive",
        className,
      )}
      style={{ ...descriptionPaint.style, ...props.style }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <AttachmentDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </span>
  );
}

/** Later action insertion is a local region: it fades on its own host only. */
function AttachmentActions({ className, children, ref: external, ...props }: React.ComponentProps<"div">) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
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
  committed(() => {
    const host = node.current;
    if (!host) return;
    const available = parent?.available() !== false;
    const enter = !consumed.current && !initialHydration.current && Boolean(parent?.presented) && available && present;
    if (!presence.current) presence.current = createInlinePresence(host);
    presence.current.commit({
      present,
      enter: enter && !nativeTextContext(host),
      cm: nativeTextContext(host) ? { ...cm, timeScale: 0 } : cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    consumed.current = true;
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );
  return (
    <div
      {...props}
      ref={ref}
      data-slot="attachment-actions"
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(
        "relative z-20 flex shrink-0 items-center group-data-[orientation=vertical]/attachment:absolute group-data-[orientation=vertical]/attachment:top-3 group-data-[orientation=vertical]/attachment:right-3 group-data-[orientation=vertical]/attachment:gap-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The action keeps Button's own colour, text and press owners on this host. */
function AttachmentAction({ className, variant, size = "icon-xs", ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="attachment-action"
      variant={variant ?? "ghost"}
      size={size}
      className={
        typeof className === "function"
          ? (state) => cn("cn-attachment-action", className(state))
          : cn("cn-attachment-action", className)
      }
      {...props}
    />
  );
}

/**
 * The overlay trigger. Its hit geometry is the whole tile, so it owns no press
 * scale: there is no safe internal decorative layer inside a caller-renderable
 * overlay, and shrinking the overlay would move the actual hit target.
 */
function AttachmentTrigger({ className, render, type, ...props }: useRender.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        type: render ? type : (type ?? "button"),
        className: cn(
          "cn-attachment-trigger absolute inset-0 z-10 rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "attachment-trigger",
    },
  });
}

/**
 * A native horizontal scroller. Snap scrolling and tile placement stay the
 * browser's; no second transform engine eases them.
 */
function AttachmentGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="attachment-group"
      className={cn(
        "flex min-w-0 scroll-fade-x snap-x snap-mandatory scroll-px-1 scrollbar-none gap-3 overflow-x-auto overscroll-x-contain py-1 *:data-[slot=attachment]:flex-none *:data-[slot=attachment]:snap-start",
        className,
      )}
      {...props}
    />
  );
}

/**
 * One tile's own committed box: known children, a natural auto axis and no
 * caller dimension engine. An explicit caller size keeps that axis native.
 */
function attachmentDestination(host: HTMLElement): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const box = naturalGeometry(host);
  if (!box) return null;
  const css = getComputedStyle(host);
  if (css.aspectRatio !== "auto") return null;
  if (host.children.length > motionLimits.collectionVisuals) return null;
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

/** Supplied visual identity only: element type, key and image source. */
function visualIdentity(children: React.ReactNode) {
  return JSON.stringify(
    Children.toArray(children)
      .slice(0, motionLimits.collectionVisuals)
      .map((child) =>
        isValidElement<{ src?: string }>(child) ? [child.type, child.key, child.props.src] : typeof child,
      ),
  );
}

export {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
};
