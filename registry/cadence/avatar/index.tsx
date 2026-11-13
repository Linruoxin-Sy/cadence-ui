"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
  isValidElement,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { avatarDestination } from "../lib/avatar-layout";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createEmptyMedia } from "../lib/empty-media";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { type MotionHostRef, useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

const avatarClass =
  "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6";
const imageClass = "aspect-square size-full object-cover";
const fallbackClass =
  "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs";
const badgeClass =
  "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2";
const groupClass =
  "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background";
const groupCountClass =
  "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3";

type RemovalBatch = {
  ready: boolean;
  pending: boolean;
  present: boolean;
  complete: (() => void) | null | undefined;
};

/** A retained removal only removes its node after the host has committed once. */
function useRemoval(present: boolean, remove: (() => void) | null | undefined) {
  const batch = useRef<RemovalBatch>({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(batch.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const delivery = batch.current;
    delivery.ready = true;
    if (delivery.pending && !delivery.present) delivery.complete?.();
    delivery.pending = false;
  });
  return batch;
}

/** One opacity channel on the retained host; the cause is only an entrance when
 * the containing presentation scope has already committed. */
function useInlinePresence(
  node: MotionHostRef<HTMLElement>,
  cm: CadenceMotion,
  present: boolean,
  removal: React.RefObject<RemovalBatch>,
  transaction?: ReturnType<typeof createMotionTransaction>,
) {
  const parent = usePresentationScope();
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
    if (!presence.current) presence.current = createInlinePresence(host, transaction);
    presence.current.commit({
      present,
      enter,
      cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery?.present) return;
        if (delivery?.ready) delivery.complete?.();
        else if (delivery) delivery.pending = true;
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
}

export interface AvatarProps extends AvatarPrimitive.Root.Props {
  /** `sm` and `lg` resize the root; every child reads the size from `group/avatar`. */
  size?: "default" | "sm" | "lg";
}

/**
 * A user or entity image with a text fallback.
 *
 * An independent insertion fades the root in and an explicit `size` change
 * interpolates the measured box; Base UI keeps owning image availability, the
 * fallback swap and error handling. `data-size` on the root drives the ring and
 * per-part sizes, so the parts stay styling-free.
 */
function Avatar({ className, size = "default", children, ref: external, ...props }: AvatarProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const [present, remove] = usePresence();
  const removal = useRemoval(present, remove);
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const delivery = useRef<(() => void) | null>(null);
  const prepared = useRef(`${size}/${cm.mode}/${cm.timeScale}/${cm.scope.signature}`);
  useInsertionEffect(() => {
    // Capture the pre-change box before React writes the new size class.
    const policy = `${size}/${cm.mode}/${cm.timeScale}/${cm.scope.signature}`;
    if (prepared.current !== policy) geometry.controller.prepare();
    prepared.current = policy;
  }, [size, cm.mode, cm.timeScale, cm.scope.signature, geometry]);
  useInlinePresence(node, cm, present, removal, scope.transaction);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
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
          measure: () => avatarDestination(host),
        }),
      };
    }
    delivery.current = () => {
      if (!host.isConnected || parameters.kind !== "geometry") return;
      geometry.controller.commit(geometry.transaction.revision("content", `${size}/${host.dataset.size ?? ""}`, node), {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: present && scope.available() && baseline.available(),
      });
    };
    delivery.current();
  });
  committed(
    () => () => {
      connection.current?.release();
      connection.current = null;
      delivery.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );

  return (
    <MotionPresentation scope={scope}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={size}
        {...props}
        ref={ref}
        data-motion={cm.mode}
        data-ending-style={present ? undefined : ""}
        inert={!present || props.inert || undefined}
        aria-hidden={present ? props["aria-hidden"] : true}
        className={(state) => cn(avatarClass, typeof className === "function" ? className(state) : className)}
      >
        {children}
      </AvatarPrimitive.Root>
    </MotionPresentation>
  );
}

export interface AvatarImageProps extends AvatarPrimitive.Image.Props {}

/**
 * The image layer. `keepMounted` keeps one retained image host, so a changed
 * source fades the newly current paint; without it Base UI mounts the image
 * natively once it is available and no Cadence transition runs.
 */
function AvatarImage({ className, src, ref: external, ...props }: AvatarImageProps) {
  const { node, ref } = useMotionHostRef<HTMLImageElement>(external);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const media = useRef<ReturnType<typeof createEmptyMedia> | null>(null);
  const identity = useRef({ value: src, revision: 0 });
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!Object.is(identity.current.value, src))
      identity.current = { value: src, revision: identity.current.revision + 1 };
    if (!media.current) media.current = createEmptyMedia(host);
    media.current.commit({
      present: parent?.available() !== false,
      key: identity.current.revision,
      reduced: cm.reduced,
      cm,
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
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      {...props}
      ref={ref}
      src={src}
      data-motion={cm.mode}
      className={(state) => cn(imageClass, typeof className === "function" ? className(state) : className)}
    />
  );
}

export interface AvatarFallbackProps extends AvatarPrimitive.Fallback.Props {}

/**
 * The initials that stay reachable while the image is unavailable. The same
 * retained host owns a scoped surface/foreground palette and, on plain children
 * only, the changed-run text.
 */
function AvatarFallback({ className, children, ref: external, style: callerStyle, ...props }: AvatarFallbackProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external);
  const cm = useCadenceMotion(node);
  const caller = typeof callerStyle === "function" ? undefined : callerStyle;
  const readable = typeof className === "string" && safePaint(className, caller);
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: readable ? "verified" : "immediate",
    immediate: !readable,
  });
  const scope = usePresentationScope();
  const [entity] = useState(() => ({}));
  const plain = typeof children === "string" || typeof children === "number";
  const value = plain ? String(children) : "";
  const initial = useRef(value);
  const previous = useRef(value);
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity,
    {
      characterStagger: false,
      stripGeometry: true,
      visible: scope?.available(),
      enabled: plain,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  committed(() => {
    previous.current = value;
  });

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      {...props}
      // The paint spread owns the rendered ref and chains this same host; the
      // earlier attribute keeps the text controller's native host identity.
      // @ts-expect-error the spread below intentionally re-supplies the chained ref.
      ref={ref}
      {...paint}
      data-motion={cm.mode}
      className={(state) => cn(fallbackClass, typeof className === "function" ? className(state) : className)}
      style={
        typeof callerStyle === "function"
          ? (state) => ({ ...paint.style, ...callerStyle(state) })
          : { ...paint.style, ...callerStyle }
      }
    >
      {text}
      {plain ? null : children}
    </AvatarPrimitive.Fallback>
  );
}

export interface AvatarBadgeProps extends React.ComponentProps<"span"> {}

/** The presence dot in the corner. It owns its own entrance, retained exit and
 * scoped palette; the avatar, fallback and text never replay for it. */
function AvatarBadge({ className, children, ref: external, ...props }: AvatarBadgeProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(external);
  const cm = useCadenceMotion(node);
  const readable = safePaint(className, props.style);
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: readable ? "verified" : "immediate",
    immediate: !readable,
  });
  const [present, remove] = usePresence();
  const removal = useRemoval(present, remove);
  useInlinePresence(node, cm, present, removal);
  const plain = typeof children === "string" || typeof children === "number";

  return (
    <span
      data-slot="avatar-badge"
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(badgeClass, className)}
      style={{ ...paint.style, ...props.style }}
    >
      {plain ? <BadgeText value={String(children)} /> : children}
    </span>
  );
}

export interface AvatarGroupProps extends React.ComponentProps<"div"> {}

/**
 * Overlapping stack of avatars. Keep it to four or five; past that use `AvatarGroupCount`.
 *
 * An independently inserted group fades once and owns its membership-driven
 * extent; initial members and the count tile consume that cause. `-space-x-2` is
 * upstream's overlap, kept on purpose as spacing, not motion.
 */
function AvatarGroup({ className, children, ref: external, ...props }: AvatarGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const [present, remove] = usePresence();
  const removal = useRemoval(present, remove);
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const delivery = useRef<(() => void) | null>(null);
  const membership = memberSignature(children);
  const prepared = useRef(membership);
  useInsertionEffect(() => {
    if (prepared.current !== membership) geometry.controller.prepare();
    prepared.current = membership;
  }, [membership, geometry]);
  useInlinePresence(node, cm, present, removal, scope.transaction);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
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
          measure: () => avatarDestination(host),
        }),
      };
    }
    delivery.current = () => {
      if (!host.isConnected || parameters.kind !== "geometry") return;
      geometry.controller.commit(geometry.transaction.revision("content", membership, node), {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: present && scope.available() && baseline.available(),
      });
    };
    delivery.current();
  });
  committed(
    () => () => {
      connection.current?.release();
      connection.current = null;
      delivery.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );

  return (
    <MotionPresentation scope={scope}>
      <div
        data-slot="avatar-group"
        ref={ref}
        {...props}
        data-motion={cm.mode}
        data-ending-style={present ? undefined : ""}
        inert={!present || props.inert || undefined}
        aria-hidden={present ? props["aria-hidden"] : true}
        className={cn(groupClass, className)}
      >
        {children}
      </div>
    </MotionPresentation>
  );
}

export interface AvatarGroupCountProps extends React.ComponentProps<"div"> {}

/** The `+3` tile that closes a stack. A plain numeric quantity reels; a
 * formatted string such as `+3` stays text. */
function AvatarGroupCount({ className, children, ref: external, ...props }: AvatarGroupCountProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external);
  const cm = useCadenceMotion(node);
  const readable = safePaint(className, props.style);
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: readable ? "verified" : "immediate",
    immediate: !readable,
  });
  const [present, remove] = usePresence();
  const removal = useRemoval(present, remove);
  useInlinePresence(node, cm, present, removal);
  const plain = typeof children === "string" || typeof children === "number";

  return (
    <div
      data-slot="avatar-group-count"
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(groupCountClass, className)}
      style={{ ...paint.style, ...props.style }}
    >
      {plain ? <CountDisplay value={children} /> : children}
    </div>
  );
}

/** Plain badge copy on its own retained display host. */
function BadgeText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const [entity] = useState(() => ({}));
  const initial = useRef(value);
  const previous = useRef(value);
  const text = useTextPresentation(
    node,
    value,
    cm,
    entity,
    {
      characterStagger: false,
      stripGeometry: true,
      visible: scope?.available(),
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  committed(() => {
    previous.current = value;
  });
  return (
    <span ref={ref} data-slot="avatar-badge-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** Count copy or a direct quantity on one retained display host. */
function CountDisplay({ value }: { value: string | number }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
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
  return textMode ? (
    <span ref={ref} data-slot="avatar-group-count-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="avatar-group-count-number" data-motion={cm.mode}>
      {number}
    </span>
  );
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
          !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:card|background|muted|transparent|primary)|text-(?:foreground|card-foreground|muted-foreground|primary-foreground|destructive)|border-(?:b|t|l|r|border|transparent)|shadow-sm)$/.test(
            name,
          ),
      )
  );
}

/** Bounded membership identity; a reorder or add/remove prepares one extent. */
function memberSignature(children: React.ReactNode) {
  return Children.toArray(children)
    .slice(0, motionLimits.collectionVisuals)
    .map((child) => (isValidElement(child) ? `e:${String(child.key)}` : `t:${typeof child}`))
    .join("|");
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
