"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import * as React from "react";
import { useEffect, useLayoutEffect } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { useIsMobile } from "../lib/hooks/use-mobile";
import { createInlinePresence } from "../lib/inline-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useSidebarGeometry } from "../lib/sidebar-geometry";
import { SidebarLabels, useSidebarLabel } from "../lib/sidebar-labels";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";
import { Separator } from "../separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet";
import { Skeleton } from "../skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

/*
 * Two disjoint paint regions own `sidebar.item.colour` and `sidebar.surface.colour`.
 * The item region is one interaction row; the surface region is the actual shell,
 * inset, submenu, label or badge host. Neither reaches into the other's parts, and
 * each owner names its exact property set at its own call site.
 */

/** The row whose interaction owns an item's paint. */
function sidebarItemRegion(host: Element) {
  return host.closest<HTMLElement>('[data-slot="sidebar-menu-item"],[data-slot="sidebar-menu-sub-item"]') ?? host;
}

/** The group whose focus/invalid state settles a non-interactive label's paint. */
function sidebarGroupRegion(host: Element) {
  return host.closest<HTMLElement>('[data-slot="sidebar-group"]') ?? host;
}

/**
 * The actual-region gate. DOM focus (including focus-within) or a region's own
 * invalid state cancels that region's colour clock, so its declared paint lands
 * immediately; a disjoint region stays eligible. A route's active state is not focus.
 */
function sidebarPaintSettles(region: Element) {
  const view = region.ownerDocument;
  const active = view.activeElement;
  if (active && active !== view.body && active !== region && region.contains(active)) return false;
  if (region.matches('[aria-invalid="true"],[data-invalid]:not([data-invalid="false"])')) return false;
  return !region.querySelector('[aria-invalid="true"],[data-invalid]:not([data-invalid="false"])');
}

/**
 * The gate value a commit can see before the CSS connection re-evaluates it. Focus
 * and invalid changes are also observed live; this keeps a render from restoring a
 * tween over a region that must settle.
 */
function regionSettles(host: HTMLElement | null, region: (node: Element) => Element) {
  return host ? !sidebarPaintSettles(region(host)) : false;
}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Whether a label lane is semantically usable. A collapsed desktop panel and a
 * closed mobile Sheet hide their labels, so a changed run or reel may establish
 * the current value there but must not start visual work.
 */
const SidebarLabelLane = React.createContext(true);

type LabelSpan = React.ReactElement<
  { children?: React.ReactNode; ref?: React.Ref<HTMLSpanElement> } & Record<string, unknown>
>;
const primitive = (value: React.ReactNode) => typeof value === "string" || typeof value === "number";

/** A direct primitive, or the caller's final plain span behind an optional icon.
 * Anything else is a composed label tree and keeps its native text. */
function plainLabel(children: React.ReactNode): { value: string; span?: LabelSpan } | null {
  const rows = React.Children.toArray(children);
  const last = rows.at(-1);
  if (rows.length === 1 && primitive(last)) return { value: String(last) };
  if (!React.isValidElement(last) || last.type !== "span") return null;
  // Leading decoration is a raw <svg> or a component the caller marked
  // aria-hidden; either way it carries no label text of its own.
  if (
    !rows.slice(0, -1).every((row) => {
      if (!React.isValidElement(row)) return false;
      const hidden = (row.props as { "aria-hidden"?: unknown })["aria-hidden"];
      return row.type === "svg" || hidden === true || hidden === "true";
    })
  )
    return null;
  const inner = React.Children.toArray((last.props as { children?: React.ReactNode }).children);
  if (inner.length !== 1 || !primitive(inner[0])) return null;
  return { value: String(inner[0]), span: last as LabelSpan };
}

/** A caller span keeps its element, props and ref; only its text moves to the
 * controller, so the label lane keeps the same physical node. */
function composeLabel(
  span: LabelSpan,
  ref: (node: HTMLSpanElement | null) => void,
  text: string,
  mode: string,
  lane: boolean,
  slot: string,
) {
  return React.cloneElement(
    span,
    {
      "data-slot": (span.props as { "data-slot"?: string })["data-slot"] ?? slot,
      "data-motion": mode,
      "data-motion-lane": lane ? "usable" : "hidden",
      ref,
    },
    text,
  );
}

/**
 * One stable ref for a caller-owned span. A fresh closure each render would make React
 * re-run the ref, replace the motion host identity and retire the controller on every
 * update, so the current value would only ever be a baseline.
 */
function useSpanRef(attach: (node: HTMLSpanElement | null) => (() => void) | undefined, caller: unknown) {
  const latest = React.useRef({ attach, caller });
  latest.current.attach = attach;
  latest.current.caller = caller;
  return React.useRef((host: HTMLSpanElement | null) => {
    const { attach: connect, caller: external } = latest.current;
    const releases: (() => void)[] = [];
    const attached = connect(host);
    if (typeof attached === "function") releases.push(attached);
    if (typeof external === "function") {
      const returned: unknown = external(host);
      if (typeof returned === "function") releases.push(returned as () => void);
    } else if (external) (external as React.RefObject<HTMLSpanElement | null>).current = host;
    return () => {
      for (const release of releases) release();
    };
  }).current;
}

/** One owned plain label: a direct primitive or the caller's final plain span. */
function SidebarGroupLabelText({ value, span, lane }: { value: string; span?: LabelSpan; lane: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = React.useState(() => ({}));
  const initial = React.useRef(value);
  const text = useTextPresentation(node, value, cm, entity, {
    characterStagger: false,
    visible: lane,
    initialText: initial.current,
  });
  const composed = useSpanRef(ref, span?.props.ref);
  if (span) return composeLabel(span, composed, text, cm.mode, lane, "sidebar-group-label-text");
  return (
    <span
      ref={ref}
      data-slot="sidebar-group-label-text"
      data-motion={cm.mode}
      data-motion-lane={lane ? "usable" : "hidden"}
    >
      {text}
    </span>
  );
}

function SidebarMenuButtonText({ value, span, lane }: { value: string; span?: LabelSpan; lane: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = React.useState(() => ({}));
  const initial = React.useRef(value);
  const text = useTextPresentation(node, value, cm, entity, {
    characterStagger: false,
    visible: lane,
    initialText: initial.current,
  });
  const composed = useSpanRef(ref, span?.props.ref);
  if (span) return composeLabel(span, composed, text, cm.mode, lane, "sidebar-menu-button-label");
  return (
    <span
      ref={ref}
      data-slot="sidebar-menu-button-label"
      data-motion={cm.mode}
      data-motion-lane={lane ? "usable" : "hidden"}
    >
      {text}
    </span>
  );
}

function SidebarMenuBadgeText({ value, lane }: { value: string; lane: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = React.useState(() => ({}));
  const initial = React.useRef(value);
  const text = useTextPresentation(node, value, cm, entity, {
    characterStagger: false,
    visible: lane,
    initialText: initial.current,
  });
  return (
    <span
      ref={ref}
      data-slot="sidebar-menu-badge-text"
      data-motion={cm.mode}
      data-motion-lane={lane ? "usable" : "hidden"}
    >
      {text}
    </span>
  );
}

/** A plain numeric badge is a quantity, so it rolls changed places only. */
function SidebarMenuBadgeCount({ value, lane }: { value: number | bigint; lane: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = React.useState(() => ({}));
  const text = useNumberPresentation(node, value, cm, entity, {
    compact: true,
    cause: "independent",
    visible: lane,
  });
  return (
    <span
      ref={ref}
      data-slot="sidebar-menu-badge-count"
      data-motion={cm.mode}
      data-motion-lane={lane ? "usable" : "hidden"}
    >
      {text}
    </span>
  );
}

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      // biome-ignore lint/suspicious/noDocumentCookie: fixed upstream persistence contract
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn("group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar", className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ref,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const cm = useCadenceMotion();
  const offcanvas = state === "collapsed" && collapsible === "offcanvas";
  const panel = useMotionHostRef(ref);
  const gap = useMotionHostRef<HTMLDivElement>();
  const inner = useMotionHostRef<HTMLDivElement>();
  const innerCm = useCadenceMotion(inner.node);
  const staticShell = useMotionHostRef<HTMLDivElement>(ref);
  // `sidebar.surface.colour` owns the actual shell paint: the static root, or the
  // desktop panel body that carries the floating border and shadow.
  const staticSurface = useStateColor(
    staticShell.ref,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: "verified",
      readabilityGate: sidebarPaintSettles,
      readabilityScope: (host) => host,
      immediate: regionSettles(staticShell.node.current, (host) => host),
    },
  );
  const innerSurface = useStateColor(
    inner.ref,
    innerCm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    {
      readability: "verified",
      readabilityGate: sidebarPaintSettles,
      readabilityScope: (host) => host,
      immediate: regionSettles(inner.node.current, (host) => host),
    },
  );
  const labels = useSidebarGeometry(
    gap.node,
    panel.node,
    state,
    `${side}/${variant}/${collapsible}/${isMobile}`,
    !isMobile && collapsible !== "none" && style?.transform === undefined,
    collapsible === "icon",
  );

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        dir={dir}
        {...staticSurface}
        style={{ ...staticSurface.style, ...style }}
        className={cn("flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          ref={ref}
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className={cn("w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden", className)}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              ...style,
            } as React.CSSProperties
          }
          side={side}
          {...props}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <SidebarLabelLane.Provider value={openMobile}>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SidebarLabelLane.Provider>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        ref={gap.ref}
        data-slot="sidebar-gap"
        data-motion={cm.mode}
        className={cn(
          "cn-sidebar-gap relative w-(--sidebar-width) bg-transparent",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        ref={panel.ref}
        dir={dir}
        style={style}
        data-slot="sidebar-container"
        data-motion={cm.mode}
        inert={offcanvas || undefined}
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) data-[side=left]:left-0 data-[side=right]:right-0 md:flex",
          style?.transform === undefined &&
            "data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          {...innerSurface}
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
        >
          <SidebarLabels.Provider value={labels}>
            <SidebarLabelLane.Provider value={state === "expanded"}>{children}</SidebarLabelLane.Provider>
          </SidebarLabels.Provider>
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={(state) => cn("size-7", typeof className === "function" ? className(state) : className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon aria-hidden="true" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, children, style, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();
  const { node, ref } = useMotionHostRef<HTMLButtonElement>();
  const cm = useCadenceMotion(node);
  const line = useMotionHostRef<HTMLSpanElement>();
  const lineCm = useCadenceMotion(line.node);
  // `item.colour` owns both the rail surface and the visible line. The line is a real
  // element so the colour clock has one owner instead of an unreachable pseudo-element.
  const surface = useStateColor(ref, cm, ["background-color"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    immediate: regionSettles(node.current, (host) => host),
  });
  const stroke = useStateColor(line.ref, lineCm, ["background-color"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    immediate: regionSettles(line.node.current, (host) => host),
  });

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      {...surface}
      style={{ ...surface.style, ...style }}
      className={cn(
        "group/rail absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    >
      <span
        data-sidebar="rail-line"
        aria-hidden="true"
        {...stroke}
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] bg-transparent group-hover/rail:bg-sidebar-border group-data-[collapsible=offcanvas]:left-full"
      />
      {children}
    </button>
  );
}

function SidebarInset({
  className,
  render,
  ref,
  ...props
}: useRender.ComponentProps<"main"> & React.ComponentProps<"main">) {
  const { node, ref: hostRef } = useMotionHostRef<HTMLElement>(ref);
  const cm = useCadenceMotion(node);
  // `surface.colour` owns the actual inset surface and requirement shadow.
  const paint = useStateColor(hostRef, cm, ["background-color", "box-shadow"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    readabilityScope: (host) => host,
    immediate: regionSettles(node.current, (host) => host),
  });
  return useRender({
    defaultTagName: "main",
    render,
    props: mergeProps<"main">(
      {
        ...paint,
        className: cn(
          "relative flex w-full flex-1 flex-col bg-background",
          "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
          className,
        ),
      },
      props,
    ),
    state: { slot: "sidebar-inset" },
  });
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={(state) =>
        cn("h-8 w-full bg-background shadow-none", typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={(state) =>
        cn("mx-2 w-auto bg-sidebar-border", typeof className === "function" ? className(state) : className)
      }
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  render,
  ref,
  children,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  const labelHost = useMotionHostRef<HTMLDivElement>(ref);
  const label = useSidebarLabel(labelHost.ref, true);
  const lane = React.useContext(SidebarLabelLane);
  const plain = plainLabel(children);
  // `surface.colour` owns this non-item label paint; the group is its actual region.
  const paint = useStateColor(label.ref, label.cm, ["color"], {
    readability: "verified",
    readabilityGate: (host) => sidebarPaintSettles(sidebarGroupRegion(host)),
    readabilityScope: sidebarGroupRegion,
    immediate: regionSettles(labelHost.node.current, sidebarGroupRegion),
  });
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        ...paint,
        children: plain ? <SidebarGroupLabelText value={plain.value} span={plain.span} lane={lane} /> : children,
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
      motion: label.cm.mode,
    },
  });
}

function SidebarGroupAction({
  className,
  render,
  ref,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  const { node, ref: hostRef } = useMotionHostRef<HTMLButtonElement>(ref);
  const cm = useCadenceMotion(node);
  // `item.colour` owns this menu interaction region.
  const paint = useStateColor(hostRef, cm, ["background-color", "color"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    immediate: regionSettles(node.current, (host) => host),
  });
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        ...paint,
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          // Increases the hit area of the button on mobile.
          "after:absolute after:-inset-2 md:after:hidden",
          "group-data-[collapsible=icon]:hidden",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  });
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border,var(--border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ref,
  children,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar();
  const labelHost = useMotionHostRef<HTMLElement>(ref);
  const label = useSidebarLabel(labelHost.ref);
  const lane = React.useContext(SidebarLabelLane);
  const plain = plainLabel(children);
  // `item.colour` owns the menu interaction region, including the outline shadow.
  const paint = useStateColor(label.ref, label.cm, ["background-color", "color", "box-shadow"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    immediate: regionSettles(labelHost.node.current, (host) => host),
  });
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        ...paint,
        children: plain ? <SidebarMenuButtonText value={plain.value} span={plain.span} lane={lane} /> : children,
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props,
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
      motion: label.cm.mode,
    },
  });

  if (!tooltip) {
    return comp;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip disabled={tooltip.hidden ?? (state !== "collapsed" || isMobile)}>
      {comp}
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltip} />
    </Tooltip>
  );
}

type ActionReveal = "hidden" | "pointer" | "immediate";

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ref,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean;
  }) {
  const { isMobile } = useSidebar();
  const { node, ref: hostRef } = useMotionHostRef<HTMLButtonElement>(ref);
  const cm = useCadenceMotion(node);
  // `item.colour` owns this action's interaction paint; its row is the actual region.
  const paint = useStateColor(hostRef, cm, ["background-color", "color"], {
    readability: "verified",
    readabilityGate: (host) => sidebarPaintSettles(sidebarItemRegion(host)),
    readabilityScope: sidebarItemRegion,
    immediate: regionSettles(node.current, sidebarItemRegion),
  });
  // One opacity owner for pointer reveal/hide. Focus and an open state expose the
  // action immediately instead of fading it, and collapse stays authoritative.
  const channel = showOnHover && !isMobile;
  const [state, setState] = React.useState<{ reveal: ActionReveal; exiting: boolean }>({
    reveal: "hidden",
    exiting: false,
  });
  const causes = React.useRef({ hover: false, focus: false, open: false });
  const presence = React.useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = React.useRef<HTMLElement | null>(null);
  const binding = React.useRef<{ host: HTMLElement; channel: boolean; dispose(): void } | null>(null);
  const collapse = () => {
    causes.current = { hover: false, focus: false, open: false };
    setState((current) =>
      current.reveal === "hidden" && !current.exiting ? current : { reveal: "hidden", exiting: false },
    );
  };
  const sync = () => {
    const { hover, focus, open } = causes.current;
    const reveal: ActionReveal = focus || open ? "immediate" : hover ? "pointer" : "hidden";
    setState((current) => {
      if (current.reveal === reveal) return current;
      // Only a pointer hide fades out; an unwound inline reveal settles immediately.
      return { reveal, exiting: reveal === "hidden" && current.reveal === "pointer" };
    });
  };
  committed(() => {
    const host = node.current;
    const current = binding.current;
    if (current?.host === host && current.channel === channel) return;
    current?.dispose();
    binding.current = null;
    if (!host || !channel) return;
    const item = sidebarItemRegion(host);
    const itemHost = item === host ? null : (item as HTMLElement);
    // Real DOM causes only; a route's active state is not focus and not a reveal.
    causes.current = {
      hover: Boolean(itemHost?.matches(":hover")),
      focus: item.contains(host.ownerDocument.activeElement),
      open: host.getAttribute("data-state") === "open",
    };
    const enter = () => {
      causes.current.hover = true;
      sync();
    };
    const leave = () => {
      causes.current.hover = false;
      sync();
    };
    const enterFocus = () => {
      causes.current.focus = true;
      sync();
    };
    const leaveFocus = (event: Event) => {
      if (item.contains((event as FocusEvent).relatedTarget as Node | null)) return;
      causes.current.focus = false;
      sync();
    };
    const observer = new MutationObserver(() => {
      causes.current.open = host.getAttribute("data-state") === "open";
      sync();
    });
    observer.observe(host, { attributes: true, attributeFilter: ["data-state"] });
    item.addEventListener("pointerenter", enter);
    item.addEventListener("pointerleave", leave);
    item.addEventListener("focusin", enterFocus);
    item.addEventListener("focusout", leaveFocus);
    sync();
    binding.current = {
      host,
      channel,
      dispose: () => {
        observer.disconnect();
        item.removeEventListener("pointerenter", enter);
        item.removeEventListener("pointerleave", leave);
        item.removeEventListener("focusin", enterFocus);
        item.removeEventListener("focusout", leaveFocus);
      },
    };
  });
  committed(() => {
    const host = node.current;
    if (!channel) {
      presence.current?.dispose();
      presence.current = null;
      presenceHost.current = null;
      if (state.reveal !== "hidden" || state.exiting) collapse();
      return;
    }
    if (!host) return;
    if (host !== presenceHost.current || !presence.current) {
      presence.current?.dispose();
      presence.current = createInlinePresence(host);
      presenceHost.current = host;
    }
    // Collapse removes the action lane: settle it and invalidate a pending reveal.
    const collapsed = host.closest('[data-slot="sidebar"]')?.getAttribute("data-collapsible") === "icon";
    if (collapsed) {
      if (state.reveal !== "hidden" || state.exiting) collapse();
      presence.current.commit({ present: false, enter: false, cm, complete: () => undefined });
      return;
    }
    presence.current.commit({
      present: state.reveal !== "hidden",
      enter: false,
      immediate: state.reveal === "immediate",
      cm,
      complete: () => setState((current) => (current.exiting ? { ...current, exiting: false } : current)),
    });
  });
  committed(
    () => () => {
      binding.current?.dispose();
      binding.current = null;
      presence.current?.dispose();
      presence.current = null;
      presenceHost.current = null;
    },
    [],
  );
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        ...paint,
        className: cn(
          "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          // Increases the hit area of the button on mobile.
          "after:absolute after:-inset-2 md:after:hidden",
          "peer-data-[size=sm]/menu-button:top-1",
          "peer-data-[size=default]/menu-button:top-1.5",
          "peer-data-[size=lg]/menu-button:top-2.5",
          "group-data-[collapsible=icon]:hidden",
          channel &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground data-[state=open]:opacity-100 data-[action-exiting=true]:opacity-100 md:opacity-0",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
      actionExiting: state.exiting,
    },
    stateAttributesMapping: {
      actionExiting: (value: boolean) => (value ? { "data-action-exiting": "true" } : null),
    },
  });
}

function SidebarMenuBadge({ className, ref, style, children, ...props }: React.ComponentProps<"div">) {
  const { node, ref: hostRef } = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(node);
  const lane = React.useContext(SidebarLabelLane);
  // `surface.colour` owns this non-item badge paint; its row is the actual region.
  const paint = useStateColor(hostRef, cm, ["color"], {
    readability: "verified",
    readabilityGate: (host) => sidebarPaintSettles(sidebarItemRegion(host)),
    readabilityScope: sidebarItemRegion,
    immediate: regionSettles(node.current, sidebarItemRegion),
  });
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      {...paint}
      style={{ ...paint.style, ...style }}
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    >
      {typeof children === "number" || typeof children === "bigint" ? (
        <SidebarMenuBadgeCount value={children} lane={lane} />
      ) : typeof children === "string" ? (
        <SidebarMenuBadgeText value={children} lane={lane} />
      ) : (
        children
      )}
    </div>
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  const width = "70%";

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ref, style, ...props }: React.ComponentProps<"ul">) {
  // Composed submenu content has no proven destination-width label lane.
  const subHost = useMotionHostRef<HTMLUListElement>(ref);
  const content = useSidebarLabel(subHost.ref, false, true);
  // `surface.colour` owns the submenu rule paint.
  const paint = useStateColor(content.ref, content.cm, ["border-left-color"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    readabilityScope: (host) => host,
    immediate: regionSettles(subHost.node.current, (host) => host),
  });
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      {...paint}
      style={{ ...paint.style, ...style }}
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ref,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md";
    isActive?: boolean;
  }) {
  const { node, ref: hostRef } = useMotionHostRef<HTMLAnchorElement>(ref);
  const cm = useCadenceMotion(node);
  // `item.colour` owns this submenu interaction region.
  const paint = useStateColor(hostRef, cm, ["background-color", "color"], {
    readability: "verified",
    readabilityGate: sidebarPaintSettles,
    immediate: regionSettles(node.current, (host) => host),
  });
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        ...paint,
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          "group-data-[collapsible=icon]:hidden",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  });
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
