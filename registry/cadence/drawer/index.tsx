"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { useRender } from "@base-ui/react/use-render";
import {
  Children,
  type CSSProperties,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { createModalPresence, type ModalEdge } from "../lib/modal-presence";
import { bindMotionParameters, geometryPanel } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { drawerSwipeClasses, popupClockStyle, stateClasses } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Upstream's Base UI drawer carries a context for four things: whether snap points
 * exist (they change the height and the overlay), whether to draw the swipe handle,
 * the modal mode (a non-modal drawer has no backdrop), and the swipe direction (it
 * decides the axis, the placement, and the closed transform).
 */
interface DrawerContextValue {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("useDrawer must be used within a Drawer.");
  return context;
}

/** Portal clock variables only; presence and colour own their properties. */
function clockVariables(cm: CadenceMotion): CSSProperties {
  const variables: Record<string, string | number> = { ...popupClockStyle(cm) };
  delete variables.transition;
  return variables as CSSProperties;
}

/** A caller palette this surface cannot verify keeps its paint immediate. */
const layoutClass =
  /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/;

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

type StyleInput<S> = CSSProperties | ((state: S) => CSSProperties | undefined) | undefined;
function mergeStyle<S>(base: CSSProperties, caller: StyleInput<S>) {
  return typeof caller === "function" ? (state: S) => ({ ...base, ...caller(state) }) : { ...base, ...caller };
}

/** A stable, committed content signature; never a layout read or a random revision. */
function contentRevision(children: ReactNode): string {
  return JSON.stringify(
    Children.toArray(children).map((child) => {
      if (typeof child === "string" || typeof child === "number") return child;
      if (!isValidElement(child)) return null;
      const type = child.type;
      const name =
        typeof type === "string"
          ? type
          : ((type as { displayName?: string; name?: string }).displayName ??
            (type as { name?: string }).name ??
            "part");
      const inner = (child.props as { children?: ReactNode }).children;
      return [name, child.key, typeof inner === "string" || typeof inner === "number" ? inner : null];
    }),
  );
}

/** Base UI names the gesture; the presence names the edge the panel leaves by. */
function edgeOf(direction: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>): ModalEdge {
  return direction === "down" ? "bottom" : direction === "up" ? "top" : direction;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "down",
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;

  return (
    <DrawerContext.Provider value={{ hasSnapPoints, modal, showSwipeHandle, swipeDirection }}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

/**
 * Motion contract: the backdrop owns one opacity envelope on its own host, created
 * by the shared inline presence channel. Its resting paint is still the native swipe
 * progress (`1 - --drawer-swipe-progress`), so a direct swipe takes over the same
 * channel instead of adding a second writer. Base UI keeps mounting, modality,
 * focus and the actual unmount completion.
 */
function DrawerOverlay({ className, style, render, ...props }: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      {...props}
      className={className}
      style={style}
      render={(elementProps, state) => (
        <DrawerOverlaySurface elementProps={elementProps} state={state} render={render} />
      )}
    />
  );
}

function DrawerOverlaySurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: DrawerPrimitive.Backdrop.State;
  render: DrawerPrimitive.Backdrop.Props["render"];
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const paint = useStateColor(host.ref, cm, ["background-color"], {
    readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate",
  });
  const controller = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createInlinePresence(node);
    const present = state.open;
    controller.current?.commit({
      present,
      enter: present && (state.transitionStatus === "starting" || lastOpen.current === false),
      cm,
    });
    lastOpen.current = present;
  });
  committed(() => () => controller.current?.dispose(), []);
  return withCadenceScope(
    cm,
    useRender({
      defaultTagName: "div",
      render,
      state: { ...state, slot: "drawer-overlay" },
      props: {
        ...elementProps,
        ...paint,
        "data-slot": "drawer-overlay",
        "data-motion": cm.mode,
        "data-cadence-scope": "",
        className: cn(
          "fixed inset-0 isolate z-50 min-h-dvh bg-black/50 opacity-[calc(1_-_var(--drawer-swipe-progress,0))]",
          elementProps.className,
        ),
        style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
      },
    }),
  );
}

function DrawerSwipeHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "mx-auto mt-3 h-1.5 w-12 shrink-0 cursor-grab rounded-full bg-muted-foreground/30 active:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Motion contract: one native-driven shell. Base UI owns the swipe gesture, the snap
 * offsets and the release trajectory through `--drawer-*`; the authored entrance and
 * exit are one edge flight on `transform` whose distance is the popup's own extent,
 * and an idle content revision is one measured block size. Placement is a class
 * decision, so a live direction change never becomes a translation input.
 *
 * The popup host carries exactly one CSS transition family and it is the primitive's
 * own release channel (`drawerSwipeClasses`), so this surface spends no colour clock
 * here: an authored colour family would have to displace that release, and its paint
 * therefore settles immediately. The backdrop and the owned title/description
 * display keep their own colour owners.
 */
function DrawerContent({
  className,
  style,
  children,
  overlayClassName,
  overlayStyle,
  render,
  ...props
}: DrawerPrimitive.Popup.Props & {
  overlayClassName?: DrawerPrimitive.Backdrop.Props["className"];
  overlayStyle?: DrawerPrimitive.Backdrop.Props["style"];
}) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();
  const swipeAxis = swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  const placement =
    swipeDirection === "down"
      ? "inset-x-0 bottom-0 rounded-t-xl border-t"
      : swipeDirection === "up"
        ? "inset-x-0 top-0 rounded-b-xl border-b"
        : swipeDirection === "left"
          ? "inset-y-0 left-0 w-3/4 rounded-r-xl border-r sm:max-w-sm"
          : "inset-y-0 right-0 w-3/4 rounded-l-xl border-l sm:max-w-sm";

  return (
    <DrawerPortal>
      {modal === true && (
        <DrawerOverlay
          className={overlayClassName}
          style={overlayStyle}
          data-snap-points={hasSnapPoints ? "" : undefined}
        />
      )}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          {...props}
          className={className}
          style={style}
          render={(elementProps, state) => (
            <DrawerPopupSurface
              elementProps={elementProps}
              state={state}
              swipeAxis={swipeAxis}
              swipeDirection={swipeDirection}
              hasSnapPoints={hasSnapPoints}
              showSwipeHandle={showSwipeHandle}
              placement={placement}
              content={children}
              render={render}
            >
              <DrawerPrimitive.Content
                data-slot="drawer-content"
                className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4"
              >
                {children}
              </DrawerPrimitive.Content>
            </DrawerPopupSurface>
          )}
        />
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerPopupSurface({
  elementProps,
  state,
  swipeAxis,
  swipeDirection,
  hasSnapPoints,
  showSwipeHandle,
  placement,
  content,
  render,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: DrawerPrimitive.Popup.State;
  swipeAxis: "x" | "y";
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
  hasSnapPoints: boolean;
  showSwipeHandle: boolean;
  placement: string;
  content: ReactNode;
  render: DrawerPrimitive.Popup.Props["render"];
  children?: ReactNode;
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const presence = useRef<ReturnType<typeof createModalPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  const edge = useRef<ModalEdge>(edgeOf(swipeDirection));
  const settled = useRef<ModalEdge>(edgeOf(swipeDirection));
  const [transaction] = useState(createMotionTransaction);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);
  const revision = contentRevision(content);

  // A live direction change is a placement decision, never a trajectory: retire an
  // obsolete edge envelope and let the new edge start from its own resting pose.
  committed(() => {
    edge.current = edgeOf(swipeDirection);
    if (settled.current === edge.current) return;
    settled.current = edge.current;
    presence.current?.settle();
  });

  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      presence.current?.dispose();
      presence.current = null;
      connected.current = node;
    }
    if (node && !presence.current)
      presence.current = createModalPresence(node, {
        edge: () => edge.current,
        // `drawerSwipeClasses` installs the primitive's own `transform, translate`
        // release family. Composing lets the authored edge flight keep `transform`
        // for its frames instead of reading that family as caller paint and yielding
        // before it writes anything.
        compose: true,
      });
    const open = state.open;
    presence.current?.commit({
      open,
      enter: open && (state.transitionStatus === "starting" || lastOpen.current === false),
      // While Base UI is dragging, its inline displacement owns `transform`; the
      // envelope writes opacity only and the pointer keeps the single writer.
      gesture: state.swiping,
      cm,
    });
    lastOpen.current = open;
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
        // Only the block axis is content-driven. Placement, snap offsets and the
        // native drag belong to Base UI's gesture engine, never to this owner.
        axes: ["height"],
        observeChildren: true,
        measure() {
          const box = naturalGeometry(node);
          if (!box) return null;
          const view = node.ownerDocument.defaultView;
          const css = view?.getComputedStyle(node);
          const limit = Number.parseFloat(css?.maxHeight ?? "");
          const max = Number.isFinite(limit) && limit > 0 ? Math.max(limit, box.height) : box.height;
          // Never animate below the natural height: required text stays laid out.
          return {
            height: { size: Math.min(max, box.height), min: 0, max, readable: true, independent: true },
          };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryPanel, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.current.commit(transaction.revision("content", revision, node), {
      // A snap-point drawer's shell height is the native snap transaction's, and a
      // direct swipe must recompute immediately instead of interpolating beside it.
      reduced: cm.reduced || state.swiping,
      transition: parameters.transition,
      available: state.open && !hasSnapPoints,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      geometry.current?.dispose();
      presence.current?.dispose();
    },
    [],
  );

  return withCadenceScope(
    cm,
    useRender({
      defaultTagName: "div",
      render,
      state: { ...state, slot: "drawer-popup" },
      props: {
        ...elementProps,
        // The surface owns its physical element: without the popup colour owner
        // this merged ref is the only connection to the presence and geometry
        // controllers, so it must not fall back to Base UI's internal ref.
        ref: host.ref,
        "data-slot": "drawer-popup",
        "data-swipe-axis": swipeAxis,
        "data-snap-points": hasSnapPoints ? "" : undefined,
        "data-motion": cm.mode,
        "data-cadence-scope": "",
        className: cn(
          "pointer-events-auto fixed z-50 flex flex-col overflow-hidden border bg-background text-foreground shadow-lg outline-none",
          "data-[swipe-axis=y]:max-h-[calc(100dvh_-_3rem)] data-[swipe-axis=y]:data-snap-points:h-(--drawer-height)",
          drawerSwipeClasses(cm),
          placement,
          elementProps.className,
        ),
        style: { ...clockVariables(cm), ...elementProps.style },
        children: (
          <>
            {showSwipeHandle && <DrawerSwipeHandle />}
            {children}
          </>
        ),
      },
    }),
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("flex shrink-0 flex-col gap-1.5", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex shrink-0 flex-col gap-2", className)} {...props} />;
}

function DrawerTitle({ className, children, ...props }: DrawerPrimitive.Title.Props) {
  const host = useMotionHostRef<HTMLHeadingElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <DrawerPrimitive.Title
      {...props}
      {...paint}
      data-slot="drawer-title"
      data-motion={cm.mode}
      className={stateClasses(cn("text-lg font-semibold"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <DrawerTitleText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <DrawerTitleValue value={children} entity={entity} />
      ) : (
        children
      )}
    </DrawerPrimitive.Title>
  );
}

function DrawerDescription({ className, children, ...props }: DrawerPrimitive.Description.Props) {
  const host = useMotionHostRef<HTMLParagraphElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <DrawerPrimitive.Description
      {...props}
      {...paint}
      data-slot="drawer-description"
      data-motion={cm.mode}
      className={stateClasses(cn("text-sm text-balance text-muted-foreground"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <DrawerDescriptionText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <DrawerDescriptionValue value={children} entity={entity} />
      ) : (
        children
      )}
    </DrawerPrimitive.Description>
  );
}

function DrawerTitleText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="drawer-title-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DrawerTitleValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="drawer-title-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DrawerDescriptionText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="drawer-description-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DrawerDescriptionValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="drawer-description-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
};
