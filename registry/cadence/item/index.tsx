// biome-ignore-all lint/a11y/useSemanticElements: ItemGroup is a div so a row can be an anchor via `render`; a <ul> would force a <li> per row and break that swap.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
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
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { itemDestination } from "../lib/item-layout";
import { createMeasuredGeometry } from "../lib/measured-geometry";
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
import { nativeTextContext } from "../lib/text-layout";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

export interface ItemGroupProps extends React.ComponentProps<"div"> {}

/**
 * A labelled container, **not** a list.
 *
 * `role="list"` would require every child to be a `listitem`, and a row may be an
 * anchor (`render`); forcing `role="listitem"` onto that anchor would strip it of its
 * link role, which is the one thing the docs promise it keeps. A group accepts either
 * kind of row and still takes an `aria-label`, so "Files" is announced either way.
 */
function ItemGroup({ className, children, ref: external, ...props }: ItemGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
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
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    consumed.current = true;
    if (present) scope.transaction.open();
    else scope.transaction.close();
    scope.presented = present;
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );
  return (
    <MotionPresentation scope={scope}>
      <div
        role="group"
        data-slot="item-group"
        className={cn("group/item-group flex w-full flex-col", className)}
        {...props}
        ref={ref}
        data-motion={cm.mode}
        data-ending-style={present ? undefined : ""}
        inert={!present || props.inert || undefined}
        aria-hidden={present ? props["aria-hidden"] : true}
      >
        {children}
      </div>
    </MotionPresentation>
  );
}

export interface ItemSeparatorProps extends SeparatorPrimitive.Props {}

/**
 * A horizontal rule between rows. It owns one rule-opacity channel and one
 * scoped rule colour; its length follows the group's layout, so no measured
 * length writer is introduced.
 */
function ItemSeparator({ className, orientation = "horizontal", ref: external, ...props }: ItemSeparatorProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["background-color"], { readability: "verified" });
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
        const batch = removal.current;
        if (batch.present) return;
        if (batch.ready) batch.complete?.();
        else batch.pending = true;
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
    <SeparatorPrimitive
      data-slot="item-separator"
      data-orientation={orientation}
      orientation={orientation}
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={(state) =>
        cn(
          "my-0 shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
          typeof className === "function" ? className(state) : className,
        )
      }
      style={{ ...paint.style, ...(typeof props.style === "function" ? props.style({ orientation }) : props.style) }}
    />
  );
}

/**
 * Three variants and three sizes, all from padding and border only. Colour
 * feedback is owned by the scoped `state.color` channel, not a CSS transition
 * class: a row that slides under the pointer would move the text the user is
 * reading.
 */
const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center rounded-md border border-transparent text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:hover:bg-accent/50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "gap-4 p-4",
        sm: "gap-2.5 px-4 py-3",
        xs: "gap-2 px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ItemProps extends useRender.ComponentProps<"div">, VariantProps<typeof itemVariants> {}

/**
 * One row in a list of like objects: a file, a member, a line item. The row owns
 * its own presence, its content-driven block size and its scoped surface paint;
 * sibling placement belongs to ItemGroup.
 *
 * `render` (Base UI) replaces the `div`: `<Item render={<a href="…" />}>` gives a
 * whole-row link without nesting an anchor inside a wrapper.
 */
function Item({
  className,
  variant = "default",
  size = "default",
  render,
  children,
  ref: external,
  ...props
}: ItemProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
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
          textGeometry: true,
          measure: () => itemDestination(host),
        }),
      };
    }
    delivery.current = () => {
      if (!host.isConnected || parameters.kind !== "geometry") return;
      geometry.controller.commit(
        geometry.transaction.revision(
          "content",
          JSON.stringify([host.className, host.textContent, host.childElementCount]),
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
      <ItemHost
        {...props}
        {...paint}
        data-slot="item"
        data-motion={cm.mode}
        data-ending-style={present ? undefined : ""}
        inert={!present || props.inert || undefined}
        aria-hidden={present ? props["aria-hidden"] : true}
        render={render}
        variant={variant}
        size={size}
        className={cn(itemVariants({ variant, size }), className)}
        style={{ ...paint.style, ...props.style }}
      >
        {children}
      </ItemHost>
    </MotionPresentation>
  );
}

/** Base render adapter, without a wrapper or a second physical ref registration. */
function ItemHost({
  className,
  variant,
  size,
  render,
  ...props
}: ItemProps & { variant?: "default" | "outline" | "muted" | null; size?: "default" | "sm" | "xs" | null }) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">({ className }, props),
    render,
    // `state` is what emits `data-slot` / `data-variant` / `data-size`.
    state: { slot: "item", variant, size },
  });
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 rounded-sm border bg-muted [&_svg:not([class*='size-'])]:size-4",
        image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ItemMediaProps extends React.ComponentProps<"div">, VariantProps<typeof itemMediaVariants> {}

/**
 * The row's leading visual. A changed supplied visual fades on this stable host;
 * the row's text and controls commit immediately.
 */
function ItemMedia({ className, variant = "default", children, ref: external, ...props }: ItemMediaProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
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
    {
      readability: safePaint(className, props.style) ? "verified" : "immediate",
    },
  );
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
  // Explicit supplied-visual identity, not recursive artwork inspection.
  const identity = visualIdentity(children);
  const previous = useRef({ value: identity, revision: 0 });
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!Object.is(previous.current.value, identity))
      previous.current = { value: identity, revision: previous.current.revision + 1 };
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
      data-slot="item-media"
      data-variant={variant}
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(itemMediaVariants({ variant }), className)}
      style={{ ...paint.style, ...props.style }}
    >
      {children}
    </div>
  );
}

export interface ItemContentProps extends React.ComponentProps<"div"> {}

function ItemContent({ className, children, ref: external, ...props }: ItemContentProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  return (
    <div
      data-slot="item-content"
      {...props}
      ref={ref}
      data-motion={cm.mode}
      className={cn("flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none", className)}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <ItemDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </div>
  );
}

export interface ItemTitleProps extends React.ComponentProps<"div"> {}

function ItemTitle({ className, children, ref: external, ...props }: ItemTitleProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
    immediate:
      !/(?:^|\s)(?:[\w-]+:)*text-(?:foreground|card-foreground|muted-foreground|destructive)(?:\s|$)/.test(
        className ?? "",
      ) && !props.style?.color,
  });
  const [entity] = useState(() => ({}));
  return (
    <div
      data-slot="item-title"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("flex w-fit items-center gap-2 text-sm leading-snug font-medium", className)}
      style={{ ...paint.style, ...props.style }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <ItemDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </div>
  );
}

export interface ItemDescriptionProps extends React.ComponentProps<"p"> {}

function ItemDescription({ className, children, ref: external, ...props }: ItemDescriptionProps) {
  const { node, ref } = useMotionHostRef<HTMLParagraphElement>(external as React.Ref<HTMLParagraphElement>);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
  return (
    <p
      data-slot="item-description"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "line-clamp-2 text-sm leading-normal font-normal text-balance text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      style={{ ...paint.style, ...props.style }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <ItemDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </p>
  );
}

export interface ItemActionsProps extends React.ComponentProps<"div"> {}

function ItemActions({ className, children, ref: external, ...props }: ItemActionsProps) {
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
      data-slot="item-actions"
      {...props}
      ref={ref}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn("flex items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

export interface ItemHeaderProps extends React.ComponentProps<"div"> {}

function ItemHeader({ className, children, ref: external, ...props }: ItemHeaderProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  return (
    <div
      data-slot="item-header"
      {...props}
      ref={ref}
      data-motion={cm.mode}
      className={cn("flex basis-full items-center justify-between gap-2", className)}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <ItemDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </div>
  );
}

export interface ItemFooterProps extends React.ComponentProps<"div"> {}

function ItemFooter({ className, children, ref: external, ...props }: ItemFooterProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external as React.Ref<HTMLDivElement>);
  const cm = useCadenceMotion(node);
  const [entity] = useState(() => ({}));
  return (
    <div
      data-slot="item-footer"
      {...props}
      ref={ref}
      data-motion={cm.mode}
      className={cn("flex basis-full items-center justify-between gap-2", className)}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <ItemDisplay value={children} entity={entity} />
      ) : (
        children
      )}
    </div>
  );
}

/** Both forms keep the same actual span across primitive changes. */
function ItemDisplay({ value, entity }: { value: string | number; entity: object }) {
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
    <span ref={ref} data-slot="item-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="item-number" data-motion={cm.mode}>
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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  itemMediaVariants,
  itemVariants,
};
