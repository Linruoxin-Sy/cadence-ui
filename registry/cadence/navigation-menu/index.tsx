"use client";

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import {
  Children,
  type ComponentPropsWithRef,
  type CSSProperties,
  createContext,
  type Ref,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createAnchoredPresence } from "../lib/anchored-presence";
import { cn } from "../lib/cn";
import { createContentTransition } from "../lib/content-transition";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryPanel, stateIndicator } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { usePopupPresence } from "../lib/popup-presence";
import { popupClockStyle, popupStyle, stateClasses } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, useCadenceMotionScope, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Base UI 1.6 focus sentinels are tabbable. They must not be aria-hidden.
 * Empty generic spans need no accessible name and keep their native focus redirection.
 * Scope observation to this menu's two surfaces; never change tabindex or event handlers.
 */
function useNavigationGuards(ref: Ref<HTMLElement> | undefined) {
  return useCallback(
    (node: HTMLElement | null) => {
      let refCleanup: undefined | (() => void);
      if (typeof ref === "function") refCleanup = ref(node) || undefined;
      else if (ref) ref.current = node;
      if (!node) return;
      const repair = () => {
        for (const guard of node.querySelectorAll('[data-base-ui-focus-guard][aria-hidden="true"]')) {
          guard.removeAttribute("aria-hidden");
        }
      };
      repair();
      const observer = new MutationObserver(repair);
      observer.observe(node, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        if (typeof refCleanup === "function") refCleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
}

// Preserve Base UI state callback classes; caller classes always merge last.
function classes<State>(base: string, value: string | ((state: State) => string | undefined) | undefined) {
  return typeof value === "function" ? (state: State) => cn(base, value(state)) : cn(base, value);
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

/** Portal clock/fallback variables only; presence, geometry and colour own their properties. */
function clockVariables(cm: CadenceMotion): CSSProperties {
  const variables: Record<string, string | number> = { ...popupClockStyle(cm) };
  delete variables.transition;
  return variables as CSSProperties;
}

function NavigationMenu({
  align = "start",
  className,
  children,
  ref,
  ...props
}: NavigationMenuPrimitive.Root.Props & Pick<NavigationMenuPrimitive.Positioner.Props, "align">) {
  const guardRef = useNavigationGuards(ref);
  const activation = useRef<Activation | null>(null);
  const [, bump] = useState(0);
  const store = useMemo<OrderStore>(
    () => ({
      read: () => activation.current,
      record(next) {
        const previous = activation.current?.index ?? next.index;
        if (activation.current?.index === next.index) return;
        activation.current = { ...next, previous };
        bump((value) => value + 1);
      },
    }),
    [],
  );
  return (
    <NavigationMenuPrimitive.Root
      ref={guardRef}
      data-slot="navigation-menu"
      className={classes(
        "cn-navigation-menu group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      <OrderContext.Provider value={store}>
        {children}
        <NavigationMenuPositioner align={align} />
      </OrderContext.Provider>
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({ className, ...props }: ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={classes("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  );
}

function NavigationMenuItem({ className, ...props }: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={classes("cn-navigation-menu-item relative", className)}
      {...props}
    />
  );
}

/**
 * The chevron is the trigger's own paint region: one `state.morph` owner turns it by
 * `rotation.halfTurn` while the menu is open. Reduced and none reach the final
 * orientation through the immediate rotate class instead of a zero-length turn, so the
 * signal survives without decorative motion.
 */
function NavigationMenuTriggerChevron({ open, cm }: { open: boolean; cm: CadenceMotion }) {
  const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
  if (parameters.kind !== "indicator") return null;
  return (
    <ControlSpan
      data-slot="navigation-menu-trigger-chevron"
      data-motion={cm.mode}
      data-state={open ? "open" : "closed"}
      aria-hidden="true"
      className={cn("ml-1 size-3 shrink-0 transition-none", !cm.reduced && "will-change-transform")}
      target={{ rotate: !cm.reduced && open ? parameters.rotation : 0 }}
      transition={parameters.spatial}
    >
      <ChevronDownIcon className={cn("size-3", cm.reduced && open && "rotate-180")} aria-hidden="true" />
    </ControlSpan>
  );
}

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 data-popup-open:bg-accent/50",
);

function NavigationMenuTrigger({ className, children, style, ...props }: NavigationMenuPrimitive.Trigger.Props) {
  const host = useMotionHostRef<HTMLButtonElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color", "color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });
  const open = useNavigationOpen(host.node);
  return (
    <NavigationMenuPrimitive.Trigger
      {...props}
      {...paint}
      data-slot="navigation-menu-trigger"
      data-motion={cm.mode}
      className={stateClasses(navigationMenuTriggerStyle(), className)}
      style={{ ...paint.style, ...style }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <NavigationMenuTriggerText value={typeof children === "number" ? String(children) : children} entity={entity} />
      ) : (
        children
      )}
      <NavigationMenuTriggerChevron open={open} cm={cm} />
    </NavigationMenuPrimitive.Trigger>
  );
}

/** A plain trigger label is one owned display host, so unchanged graphemes keep identity. */
function NavigationMenuTriggerText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="navigation-menu-trigger-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/** The active trigger is the primitive's own committed state, never a paint guess. */
function useNavigationOpen(node: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);
  const order = useContext(OrderContext);
  useHostObserver(
    node,
    (host) => () => {
      const active = host.getAttribute("aria-expanded") === "true";
      setOpen(active);
      // A committed activation is the only cause that advances the item order.
      if (!active || !order) return;
      const list = host.closest('[data-slot="navigation-menu-list"]');
      const triggers = list ? [...list.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-trigger"]')] : [];
      const index = triggers.indexOf(host);
      if (index < 0) return;
      const vertical = list?.getAttribute("data-orientation") === "vertical";
      const rtl = host.ownerDocument.defaultView?.getComputedStyle(host).direction === "rtl";
      order.record({
        index,
        axis: vertical ? "y" : "x",
        // A horizontal order moves the opposite way in a right-to-left direction.
        direction: Math.sign(index - (order.read()?.index ?? index)) * (!vertical && rtl ? -1 : 1),
      });
    },
    ["aria-expanded", "aria-controls"],
  );
  return open;
}

type SurfaceState = { open: boolean; starting: boolean; width: string; height: string };

/**
 * One committed-region observer per physical host. A portal element mounts after the
 * first render, so the connection follows the element instead of a mount-time effect.
 */
function useHostObserver(
  node: RefObject<HTMLElement | null>,
  read: (host: HTMLElement) => () => void,
  filter: string[],
  subtree = false,
) {
  const connection = useRef<{ element: HTMLElement; observer: MutationObserver } | null>(null);
  committed(() => {
    const element = node.current;
    if (connection.current?.element === element) return;
    connection.current?.observer.disconnect();
    connection.current = null;
    if (!element) return;
    const sync = read(element);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(element, { attributes: true, attributeFilter: filter, childList: subtree, subtree });
    connection.current = { element, observer };
  });
  committed(
    () => () => {
      connection.current?.observer.disconnect();
      connection.current = null;
    },
    [],
  );
}

/** The popup's committed state and the primitive's supplied destination size. */
function useSurfaceState(node: RefObject<HTMLElement | null>): SurfaceState {
  const [state, setState] = useState<SurfaceState>({ open: false, starting: true, width: "", height: "" });
  useHostObserver(
    node,
    (element) => () => {
      const next: SurfaceState = {
        open: element.hasAttribute("data-open"),
        starting: element.hasAttribute("data-starting-style"),
        width: element.style.getPropertyValue("--popup-width"),
        height: element.style.getPropertyValue("--popup-height"),
      };
      setState((previous) =>
        previous.open === next.open &&
        previous.starting === next.starting &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next,
      );
    },
    ["style", "data-open", "data-closed", "data-starting-style", "data-ending-style", "data-activation-direction"],
  );
  return state;
}

/** The active content's own committed identity; a switch or a text revision bumps it. */
function useContentRevision(node: RefObject<HTMLElement | null>) {
  const [key, setKey] = useState("");
  const read = (host: HTMLElement) => () => {
    const element = host.querySelector<HTMLElement>('[data-slot="navigation-menu-content"][data-open]');
    // Bounded identity only: never the whole menu, never a hidden copy.
    const next = element ? `${element.id}|${(element.textContent ?? "").slice(0, 64)}` : "";
    setKey((previous) => (previous === next ? previous : next));
  };
  useHostObserver(node, read, ["data-open", "data-closed", "data-activation-direction"], true);
  return key;
}

/** Which direction the menu's own item order moved when the primitive activated an item. */
const activationAxis: Record<string, { axis: "x" | "y"; direction: number }> = {
  left: { axis: "x", direction: -1 },
  right: { axis: "x", direction: 1 },
  up: { axis: "y", direction: -1 },
  down: { axis: "y", direction: 1 },
};
type Activation = { index: number; previous: number; axis: "x" | "y"; direction: number };
type OrderStore = {
  read(): Activation | null;
  record(next: { index: number; axis: "x" | "y"; direction: number }): void;
};
/**
 * Root owns the item-order state so a trigger's committed activation and the shared
 * surface observe the same revision, without inferring direction from paint timing.
 * Portal content cannot reach the trigger list, and the trigger cannot reach the popup.
 */
const OrderContext = createContext<OrderStore | null>(null);

/**
 * The active item's content. It carries the owned display slots only: the shared
 * viewport owns the switch paint, so a switch never multiplies one writer per item.
 */
function NavigationMenuContent({ className, style, children, ref, ...props }: NavigationMenuPrimitive.Content.Props) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  return withCadenceScope(
    cm,
    <NavigationMenuPrimitive.Content
      {...props}
      ref={host.ref}
      data-slot="navigation-menu-content"
      data-motion={cm.mode}
      className={stateClasses("h-full w-auto p-2", className)}
      style={popupStyle(cm, style, false)}
    >
      {Children.map(children, (child) =>
        typeof child === "string" ? (
          <NavigationMenuContentText value={child} entity={entity} />
        ) : typeof child === "number" ? (
          <NavigationMenuContentValue value={child} entity={entity} />
        ) : (
          child
        ),
      )}
    </NavigationMenuPrimitive.Content>,
  );
}

function NavigationMenuContentText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="navigation-menu-content-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function NavigationMenuContentValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="navigation-menu-content-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/**
 * The positioned surface. `NavigationMenuPositioner` renders Base UI's Positioner, Popup
 * and Viewport, so it owns three disjoint property families on that one tree:
 * presence (`popup.anchored` opacity/transform on the popup's visual layer), paint
 * (scoped background/border/shadow/foreground) and measured geometry (`width`/`height`
 * consumed from Base UI's supplied destination). The shared Viewport is the one
 * switch-paint layer, and the positioner keeps its coordinates and collision.
 */
function NavigationMenuPositioner({
  className,
  ref,
  style,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  const guardRef = useNavigationGuards(ref);
  const { cm, ref: scopeRef } = useCadenceMotionScope(guardRef);
  const host = useMotionHostRef<HTMLDivElement>();
  const viewport = useMotionHostRef<HTMLDivElement>();
  const wrap = usePopupPresence(host.node, [], false, cm, "base");
  const colour = useStateColor(
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
    // The surface owns its whole palette (`bg-popover text-popover-foreground border`),
    // so an intermediate frame is readable without a caller-palette proof.
    { readability: "verified" },
  );
  const state = useSurfaceState(host.node);
  const order = useContext(OrderContext);
  const contentKey = useContentRevision(host.node);
  const controller = useRef<ReturnType<typeof createAnchoredPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  const [transaction] = useState(createMotionTransaction);
  const [paint] = useState(() => createContentTransition(transaction));
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);

  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createAnchoredPresence(node, true);
    const enter = state.open && (state.starting || lastOpen.current === false);
    controller.current?.commit({ open: state.open, enter, cm });
    lastOpen.current = state.open;
  });
  committed(() => {
    const node = viewport.node.current;
    if (!node) return;
    // The active item's content is the committed one the primitive is showing; the
    // outgoing node is never painted or retained, so no inactive menu stays live.
    const popup = host.node.current;
    const active = (popup ?? node).querySelector<HTMLElement>('[data-slot="navigation-menu-content"][data-open]');
    // No committed active content means the surface is closing or entering; that is
    // the presence cause, never a content switch.
    if (!popup || !active) return;
    const recorded = order?.read() ?? null;
    const declared = activationAxis[active.getAttribute("data-activation-direction") ?? ""];
    // Only a committed item-order change is a switch; a text or size revision is not.
    if (!declared && (!recorded || recorded.index === recorded.previous)) return;
    const { axis, direction } = declared ?? (recorded as Activation);
    const travel =
      direction !== 0 &&
      Boolean(popup) &&
      paint.canTravel(popup as HTMLElement, viewport.node, axis, direction, cm.distance.xs);
    paint.commit(
      transaction.revision("content", `${contentKey}|${axis}|${direction}`, node),
      [{ host: viewport.node, direction, axis, travel }],
      cm,
      false,
      state.open && !state.starting,
    );
  });
  committed(() => {
    const node = host.node.current;
    if (!node) return;
    if (!geometry.current) geometry.current = createMeasuredGeometry(transaction);
    if (geometryHost.current !== node) {
      release.current?.();
      release.current = null;
      geometryHost.current = node;
      release.current = geometry.current.register({
        host: host.node,
        content: node,
        axes: ["width", "height"],
        observeChildren: true,
        measure() {
          const css = node.ownerDocument.defaultView?.getComputedStyle(node);
          if (!css) return null;
          const supplied = (name: string) => Number.parseFloat(css.getPropertyValue(name));
          const box = naturalGeometry(node);
          // The primitive's own destination is authoritative. A settled `auto` shell
          // reports its natural box, so the destination is never read off an
          // interpolated frame of this writer.
          const width = supplied("--popup-width");
          const height = supplied("--popup-height");
          const destination = {
            width: Number.isFinite(width) ? width : (box?.width ?? 0),
            height: Number.isFinite(height) ? height : (box?.height ?? 0),
          };
          if (!(destination.width > 0) || !(destination.height > 0)) return null;
          const availableWidth = supplied("--available-width");
          const availableHeight = supplied("--available-height");
          return {
            width: {
              size: destination.width,
              min: 0,
              max: Math.max(destination.width, Number.isFinite(availableWidth) ? availableWidth : destination.width),
              readable: true,
              independent: true,
            },
            height: {
              size: destination.height,
              min: 0,
              max: Math.max(
                destination.height,
                Number.isFinite(availableHeight) ? availableHeight : destination.height,
              ),
              readable: true,
              independent: true,
            },
          };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryPanel, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.current.commit(transaction.revision("content", `${state.width}x${state.height}|${contentKey}`, node), {
      reduced: cm.reduced,
      transition: parameters.transition,
      // The first open is the presence cause; a supplied destination while the
      // surface is already settled is the content cause this owner may animate.
      available: state.open && !state.starting,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      geometry.current?.dispose();
      controller.current?.dispose();
      paint.dispose();
      transaction.cancel();
    },
    [],
  );

  return (
    <NavigationMenuPrimitive.Portal>
      {withCadenceScope(
        cm,
        <NavigationMenuPrimitive.Positioner
          ref={scopeRef}
          data-slot="navigation-menu-positioner"
          data-motion={cm.mode}
          data-cadence-scope=""
          style={popupStyle(cm, style)}
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          className={classes(
            "isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width)",
            className,
          )}
          {...props}
        >
          {wrap(
            <NavigationMenuPrimitive.Popup
              {...colour}
              data-slot="navigation-menu-popup"
              data-motion={cm.mode}
              style={{ ...colour.style, ...clockVariables(cm) }}
              className={cn(
                "relative h-(--popup-height) w-(--popup-width) min-h-0 min-w-0 max-h-(--available-height) max-w-(--available-width) origin-(--transform-origin) rounded-md border bg-popover text-popover-foreground shadow-md",
              )}
            >
              <NavigationMenuPrimitive.Viewport
                ref={viewport.ref}
                data-slot="navigation-menu-viewport"
                data-motion={cm.mode}
                className="relative size-full overflow-auto"
              />
            </NavigationMenuPrimitive.Popup>,
          )}
        </NavigationMenuPrimitive.Positioner>,
      )}
    </NavigationMenuPrimitive.Portal>
  );
}

/**
 * A link owns its own state surface only. Its foreground stays the popup's inherited
 * paint, so one colour change is never interpolated twice down the tree.
 */
function NavigationMenuLink({ className, children, style, ...props }: NavigationMenuPrimitive.Link.Props) {
  const host = useMotionHostRef<HTMLAnchorElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["background-color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });
  return (
    <NavigationMenuPrimitive.Link
      {...props}
      {...paint}
      data-slot="navigation-menu-link"
      data-motion={cm.mode}
      style={{ ...paint.style, ...style }}
      className={stateClasses(
        "flex flex-col gap-1 rounded-sm p-2 text-sm outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-active:bg-accent/50",
        className,
      )}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <NavigationMenuLinkText value={typeof children === "number" ? String(children) : children} entity={entity} />
      ) : (
        children
      )}
    </NavigationMenuPrimitive.Link>
  );
}

function NavigationMenuLinkText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="navigation-menu-link-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function NavigationMenuIndicator({ className, ...props }: ComponentPropsWithRef<typeof NavigationMenuPrimitive.Icon>) {
  return (
    <NavigationMenuPrimitive.Icon
      data-slot="navigation-menu-indicator"
      className={classes(
        "cn-navigation-menu-indicator top-full z-1 flex h-1.5 items-end justify-center overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="cn-navigation-menu-indicator-arrow relative top-[60%] h-2 w-2 rotate-45" />
    </NavigationMenuPrimitive.Icon>
  );
}

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
