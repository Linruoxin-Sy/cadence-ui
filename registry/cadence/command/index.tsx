// biome-ignore-all lint/a11y/noStaticElementInteractions: the palette frame is a div so it can hold a native editor, a scroll container and cmdk's own parts; the one pointer handler only returns focus to the editor that keyboard users tab into directly.
"use client";

import { Command as CommandPrimitive } from "cmdk";
import { CheckIcon, SearchIcon } from "lucide-react";
import { useIsPresent } from "motion/react";
import type * as React from "react";
import { Children, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../dialog";
import { InputGroup } from "../input-group";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A command palette: the query belongs to cmdk, the surfaces belong here.
 *
 * The root owns one later-insertion opacity and its supplied chrome, each
 * callable surface owns its paint, and the plain display strings own their
 * changed runs. Filtering, scoring, selection, execution, the native editor and
 * the result list never wait for a Cadence clock.
 */
function Command({ className, style, children, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  const { node } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  // One surface owner per root: background, border and scoped shadow. Unknown
  // caller palettes settle at their target instead of tweening unreadable paint.
  const paint = useStateColor(
    node,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: paintVerified(className, style) ? "verified" : "immediate" },
  );
  const present = useIsPresent();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    // A presenting parent or a real focus target owns this entrance; a hidden
    // host keeps native paint rather than fading an already-visible palette.
    const inherited =
      !visible ||
      Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      host.hasAttribute("data-starting-style") ||
      host.contains(host.ownerDocument.activeElement);
    entrance.current.commit({
      present,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && !inherited,
    });
    consumed.current = true;
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
    },
    [],
  );
  return (
    <CommandPrimitive
      data-slot="command"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {children}
    </CommandPrimitive>
  );
}

/** Unknown palettes commit at their target rather than through unreadable paint. */
function paintVerified(className: string | undefined, style: React.CSSProperties | undefined) {
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .some(
      (name) =>
        /(?:^|:)(?:bg-|text-|border-|shadow-|ring-)/.test(name) &&
        !/(?:^|:)(?:border-(?:input|ring|destructive)|shadow-xs|bg-input\/30|ring-(?:ring\/50|destructive\/(?:20|40)|\[3px\]))$/.test(
          name,
        ),
    );
}

/**
 * The palette inherits Dialog presence, title text and panel paint from the
 * composed Dialog; Command adds no second modal layer or hidden entrance.
 * Keep Command explicit, as in the pinned Base UI composition, so callers can
 * configure cmdk's root.
 */
function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn("top-1/3 translate-y-0 overflow-hidden p-0", className)}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/**
 * The search field. The wrapper owns its own divider, the composed Input Group
 * frame keeps its migrated frame owners, and the editor is cmdk's native input —
 * value, caret, selection and IME stay untouched.
 */
function CommandInput({
  className,
  asChild,
  children,
  style,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  const { node } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const paint = useStateColor(
    node,
    cm,
    ["border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: "verified" },
  );
  return (
    <div
      data-slot="command-input-wrapper"
      {...paint}
      data-motion={cm.mode}
      className="border-b p-2"
      style={paint.style}
      onMouseDown={(event) => {
        // The glyph is decoration, not a control: a click beside the editor
        // keeps the native focus path instead of inventing a second target.
        if ((event.target as HTMLElement).closest("input")) return;
        event.preventDefault();
        event.currentTarget.querySelector("input")?.focus();
      }}
    >
      <InputGroup className="border-0 shadow-none ring-0 focus-within:ring-0">
        <span
          aria-hidden="true"
          data-slot="command-input-icon"
          className="flex items-center justify-center gap-2 pl-3 text-muted-foreground select-none"
        >
          <SearchIcon className="size-4 shrink-0" />
        </span>
        <CommandPrimitive.Input
          data-slot="command-input"
          asChild
          className={cn(
            "flex-1 rounded-none border-0 bg-transparent px-3 py-1 outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          style={style}
          {...props}
        >
          {asChild ? children : <input />}
        </CommandPrimitive.Input>
      </InputGroup>
    </div>
  );
}

/** cmdk owns the scroll container, its max height and its natural height. */
function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  const cm = useCadenceMotion();
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      {...props}
      data-motion={cm.mode}
      className={cn("max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto", className)}
    />
  );
}

function CommandEmpty({ className, children, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  const { node } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(node, cm, ["background-color"], {
    readability: paintVerified(className, props.style) ? "verified" : "immediate",
  });
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("py-6 text-center text-sm", className)}
      style={{ ...paint.style, ...props.style }}
    >
      {typeof children === "string" ? <EmptyText value={children} /> : children}
    </CommandPrimitive.Empty>
  );
}

/** Only a known plain label supplies an independent changed-run owner. */
function EmptyText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const entity = useRef({});
  const text = useTextPresentation(node, value, cm, entity.current, {
    characterStagger: false,
    stripGeometry: true,
  });
  return (
    <span ref={ref} data-slot="command-empty-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/**
 * cmdk renders the group heading itself, so it keeps the primitive's own text
 * and its static heading paint; Command installs no second writer there.
 */
function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  const cm = useCadenceMotion();
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      {...props}
      data-motion={cm.mode}
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
    />
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  const { node } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(node, cm, ["background-color"], {
    readability: "verified",
  });
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      aria-hidden="true"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("-mx-1 h-px bg-border", className)}
      style={{ ...paint.style, ...props.style }}
    />
  );
}

function CommandItem({ className, children, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const { node } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  // One owner per item merges hover, selected, disabled and theme paint. The
  // generated check glyph keeps the caller's `data-checked` state immediately.
  const paint = useStateColor(node, cm, ["background-color", "color"], {
    readability: paintVerified(className, props.style) ? "verified" : "immediate",
  });
  // A plain leading label owns its changed runs; anything the caller composes
  // after it (a shortcut hint, an icon) keeps its own identity.
  const parts = Children.toArray(children);
  const [lead, ...tail] = parts;
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      style={{ ...paint.style, ...props.style }}
    >
      {typeof lead === "string" ? <ItemText value={lead} /> : lead}
      {tail}
      <CheckIcon
        aria-hidden="true"
        className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100"
      />
    </CommandPrimitive.Item>
  );
}

function ItemText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const entity = useRef({});
  const text = useTextPresentation(node, value, cm, entity.current, {
    characterStagger: false,
    stripGeometry: true,
  });
  return (
    <span ref={ref} data-slot="command-item-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function CommandShortcut({ className, children, ...props }: React.ComponentProps<"span">) {
  const { node } = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(node, cm, ["background-color", "color"], {
    readability: paintVerified(className, props.style) ? "verified" : "immediate",
  });
  return (
    <span
      data-slot="command-shortcut"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      style={{ ...paint.style, ...props.style }}
    >
      {typeof children === "string" ? <ShortcutText value={children} /> : children}
    </span>
  );
}

/** The hint is a display string, never a quantity: its digits stay identities. */
function ShortcutText({ value }: { value: string }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const entity = useRef({});
  const text = useTextPresentation(node, value, cm, entity.current, {
    characterStagger: false,
    stripGeometry: true,
  });
  return (
    <span ref={ref} data-slot="command-shortcut-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
