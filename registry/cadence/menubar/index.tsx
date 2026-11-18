"use client";

import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
import { usePresence } from "motion/react";
import type * as React from "react";
import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { stateClasses } from "../lib/popup-style";
import { useCadenceMotion } from "../lib/provider";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * Motion contract: the bar is chrome, the panel is the animation.
 *
 * Menubar adds these owners itself and inherits the rest from `dropdown-menu`
 * exactly once per open surface:
 * - `root.enter` / `root.exit`: one opacity envelope on the retained bar. The
 *   entrance is an independent insertion (a page-load bar stays at rest) and the
 *   exit completes through the enclosing presence; neither writes a resting opacity.
 * - `root.colour` / `trigger.colour`: one scoped paint owner each on the bar and on
 *   every top-level trigger (background, foreground and the bar's border), so an
 *   open/highlight change has local colour feedback and DOM focus or an unverified
 *   caller palette settles immediately.
 * - `trigger-label.change`: a plain trigger label is its own display slot, so only
 *   changed graphemes are replaced and unchanged identity survives.
 *
 * Everything else — the anchored menu presence, the measured popup shell, the row
 * and shell palettes, the selection marks, the menu text slots and Base UI's
 * positioner/roving focus — is the `dropdown-menu` implementation this component
 * mounts. Renaming a slot does not create a second writer, so Menubar declares those
 * as inherited owners and only contributes the bar root, the trigger and the trigger
 * label display.
 *
 * The bar strip itself keeps native flex layout: its height is fixed and its width is
 * caller-owned, so a label revision reflows the triggers immediately in every mode
 * instead of tweening a measured strip that could crop a required label.
 */
function Menubar({ className, style, children, ...props }: React.ComponentProps<typeof MenubarPrimitive>) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const paint = useStateColor(
    host.ref,
    cm,
    ["background-color", "color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: knownPalette(className, style) ? "verified" : "immediate" },
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
  const presence = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = useRef<HTMLElement | null>(null);
  const consumed = useRef(false);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const parent = usePresentationScope();
  useEffect(() => {
    if (!parent && host.node.current) documentPresentation(host.node.current.ownerDocument).presented = true;
  }, [parent, host.node]);
  committed(() => {
    const bar = host.node.current;
    if (bar !== presenceHost.current) {
      presence.current?.dispose();
      presence.current = bar ? createInlinePresence(bar) : null;
      presenceHost.current = bar;
    }
    if (!bar) return;
    const baseline = parent ?? documentPresentation(bar.ownerDocument);
    const visible = bar.checkVisibility
      ? bar.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : bar.getClientRects().length > 0;
    const inherited =
      !visible ||
      Boolean(bar.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      !baseline.available() ||
      Boolean(baseline.node?.current?.hasAttribute("data-starting-style"));
    // Independent insertion only: an initial page load and an ordinary re-render both
    // stay at rest, so the entrance is never replayed over already-visible triggers.
    const enter = !consumed.current && !initialHydration.current && baseline.presented && !inherited;
    consumed.current = true;
    presence.current?.commit({
      present,
      cm,
      enter,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      presenceHost.current = null;
    },
    [],
  );

  return (
    <MenubarPrimitive
      {...props}
      {...paint}
      data-slot="menubar"
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={stateClasses(
        cn("flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs"),
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {children}
    </MenubarPrimitive>
  );
}

/**
 * One physical row of the bar: the surface/foreground paint owner is scoped to this
 * trigger, so `data-popup-open`/`data-highlighted` feedback animates here while the
 * bar's own paint stays its own. A plain string label gets an owned display slot;
 * rich children keep their exact tree.
 */
function MenubarTrigger({ className, children, style, ...props }: React.ComponentProps<typeof DropdownMenuTrigger>) {
  const host = useMotionHostRef<HTMLButtonElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });

  return (
    <DropdownMenuTrigger
      {...props}
      {...paint}
      data-slot="menubar-trigger"
      className={stateClasses(
        cn(
          "flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
          "data-popup-open:bg-accent data-popup-open:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        ),
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {typeof children === "string" ? <MenubarTriggerText value={children} entity={entity} /> : children}
    </DropdownMenuTrigger>
  );
}

function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />;
}

function MenubarGroup({ ...props }: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />;
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal data-slot="menubar-portal" {...props} />;
}

/**
 * The panel is `dropdown-menu`'s own surface: its anchored presence, clamped measured
 * shell and scoped paint are the same exported implementation, mounted once per open
 * menu. Menubar only carries the menubar slot and its panel metrics.
 */
function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={stateClasses(cn("min-w-[12rem]"), className)}
      {...props}
    />
  );
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={stateClasses(cn("group/menubar-item"), className)}
      {...props}
    />
  );
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuCheckboxItem>) {
  return (
    <DropdownMenuCheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={className}
      checked={checked}
      {...props}
    >
      {children}
    </DropdownMenuCheckboxItem>
  );
}

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />;
}

function MenubarRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioItem>) {
  return (
    <DropdownMenuRadioItem data-slot="menubar-radio-item" data-inset={inset} className={className} {...props}>
      {children}
    </DropdownMenuRadioItem>
  );
}

function MenubarLabel({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel data-slot="menubar-label" data-inset={inset} className={className} {...props} />;
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      data-slot="menubar-separator"
      className={stateClasses(cn("-mx-1 my-1 h-px"), className)}
      {...props}
    />
  );
}

function MenubarShortcut({ className, ...props }: React.ComponentProps<typeof DropdownMenuShortcut>) {
  return <DropdownMenuShortcut data-slot="menubar-shortcut" className={cn("ml-auto", className)} {...props} />;
}

function MenubarSub({ ...props }: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />;
}

function MenubarSubTrigger({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuSubTrigger>) {
  return <DropdownMenuSubTrigger data-slot="menubar-sub-trigger" data-inset={inset} className={className} {...props} />;
}

function MenubarSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return <DropdownMenuSubContent data-slot="menubar-sub-content" className={className} {...props} />;
}

/** A plain trigger label is one owned display host, so unchanged graphemes keep identity. */
function MenubarTriggerText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="menubar-trigger-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** A caller palette this surface cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/;

function knownPalette(className: unknown, style: unknown) {
  if (typeof className === "function" || typeof style === "function") return false;
  const layoutOnly =
    !className ||
    String(className)
      .split(/\s+/)
      .every((name) => layoutClass.test(name));
  const knownStyle =
    !style ||
    !Object.keys(style as object).some((key) =>
      /color|background|fill|stroke|shadow|filter|blend|opacity|^--(?!motion-|cadence-|ease-)/i.test(key),
    );
  return layoutOnly && knownStyle;
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
