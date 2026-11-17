"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { useRender } from "@base-ui/react/use-render";
import { X } from "lucide-react";
import {
  Children,
  type CSSProperties,
  isValidElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../button";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { createModalPresence, type ModalEdge } from "../lib/modal-presence";
import { bindMotionParameters, geometryPanel } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { usePopupPresence } from "../lib/popup-presence";
import { popupClockStyle, stateClasses } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Side = "top" | "right" | "bottom" | "left";

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

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/** A pass-through composition: it acquires Button's owners only when its actual
 * caller render is a Button, and never adds a second executor of its own. */
function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * Motion contract: the backdrop owns one opacity envelope on its own host, created
 * by the shared modal presence controller. Base UI keeps mounting, modality, focus
 * and the actual unmount completion.
 */
function SheetOverlay({ className, style, render, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      {...props}
      className={className}
      style={style}
      render={(elementProps, state) => (
        <SheetOverlaySurface elementProps={elementProps} state={state} render={render} />
      )}
    />
  );
}

function SheetOverlaySurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: SheetPrimitive.Backdrop.State;
  render: SheetPrimitive.Backdrop.Props["render"];
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const wrap = usePopupPresence(host.node, [], false, cm, "fast");
  const paint = useStateColor(host.ref, cm, ["background-color"], {
    readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate",
  });
  const controller = useRef<ReturnType<typeof createModalPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createModalPresence(node);
    const open = state.open;
    controller.current?.commit({
      open,
      enter: open && (state.transitionStatus === "starting" || lastOpen.current === false),
      cm,
    });
    lastOpen.current = open;
  });
  committed(() => () => controller.current?.dispose(), []);
  return withCadenceScope(
    cm,
    wrap(
      useRender({
        defaultTagName: "div",
        render,
        state: { ...state, slot: "sheet-overlay" },
        props: {
          ...elementProps,
          ...paint,
          "data-slot": "sheet-overlay",
          "data-motion": cm.mode,
          className: cn("fixed inset-0 isolate z-50 bg-black/50", elementProps.className),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
        },
      }),
    ),
  );
}

/**
 * Motion contract: one edge flight owner for the panel and one measured block-size
 * owner for its natural content. The flight distance is the panel's current extent
 * in the direction it leaves, so `side` selects placement rather than a distance
 * token, and a live `side` change places the new edge before any later transition.
 */
function SheetContent({
  className,
  style,
  children,
  showCloseButton = true,
  side = "right",
  overlayClassName,
  overlayStyle,
  render,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: Side;
  showCloseButton?: boolean;
  overlayClassName?: SheetPrimitive.Backdrop.Props["className"];
  overlayStyle?: SheetPrimitive.Backdrop.Props["style"];
}) {
  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} style={overlayStyle} />
      <SheetPrimitive.Popup
        {...props}
        className={className}
        style={style}
        render={(elementProps, state) => (
          <SheetContentSurface
            elementProps={elementProps}
            state={state}
            side={side}
            showCloseButton={showCloseButton}
            render={render}
          >
            {children}
          </SheetContentSurface>
        )}
      />
    </SheetPortal>
  );
}

function SheetContentSurface({
  elementProps,
  state,
  side,
  showCloseButton,
  render,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: SheetPrimitive.Popup.State;
  side: Side;
  showCloseButton: boolean;
  render: SheetPrimitive.Popup.Props["render"];
  children?: ReactNode;
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const wrap = usePopupPresence(host.node, [], false, cm, "base");
  const paint = useStateColor(
    host.ref,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate" },
  );
  const controller = useRef<ReturnType<typeof createModalPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  const edge = useRef<ModalEdge>(side);
  const settled = useRef(side);
  const [transaction] = useState(createMotionTransaction);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);
  const revision = contentRevision(children);

  // A live side change is a placement decision, never a trajectory: retire an
  // obsolete edge envelope and let the new edge start from its own resting pose.
  committed(() => {
    edge.current = side;
    if (settled.current === side) return;
    settled.current = side;
    controller.current?.settle();
  });

  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createModalPresence(node, { edge: () => edge.current });
    const open = state.open;
    controller.current?.commit({
      open,
      enter: open && (state.transitionStatus === "starting" || lastOpen.current === false),
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
        // Only the block axis is content-driven. A side sheet keeps its full
        // height and caller/viewport-owned width, so its inline size is never
        // interpolated and never rewraps text across a frame.
        axes: ["height"],
        observeChildren: true,
        measure() {
          const box = naturalGeometry(node);
          if (!box) return null;
          const view = node.ownerDocument.defaultView;
          // Never animate below the natural height: required text stays laid out.
          return {
            height: {
              size: box.height,
              min: 0,
              max: Math.max(box.height, view?.innerHeight ?? box.height),
              readable: true,
              independent: true,
            },
          };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryPanel, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    geometry.current.commit(transaction.revision("content", revision, node), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: state.open,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      geometry.current?.dispose();
      controller.current?.dispose();
    },
    [],
  );

  return withCadenceScope(
    cm,
    wrap(
      useRender({
        defaultTagName: "div",
        render,
        state: { ...state, slot: "sheet-content" },
        props: {
          ...elementProps,
          ...paint,
          "data-slot": "sheet-content",
          "data-side": side,
          "data-motion": cm.mode,
          className: cn(
            "fixed z-50 flex flex-col gap-4 bg-background shadow-lg outline-none",
            side === "right"
              ? "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm"
              : side === "left"
                ? "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm"
                : side === "top"
                  ? "inset-x-0 top-0 h-auto border-b"
                  : "inset-x-0 bottom-0 h-auto border-t",
            elementProps.className,
          ),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
          children: (
            <>
              {children}
              {showCloseButton && (
                <SheetPrimitive.Close
                  data-slot="sheet-close"
                  className="absolute top-4 right-4"
                  render={<Button variant="ghost" size="icon-sm" />}
                >
                  <X />
                  <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
              )}
            </>
          ),
        },
      }),
    ),
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

/**
 * `showCloseButton` renders an ordinary Button-backed close, exactly like
 * `DialogFooter`: it is a real Button instance, so its press, paint, box, label
 * and quantity stay that component's own owners. `closeLabel` replaces the visible
 * wording for a localized composition, and the close class/style hook is the same
 * caller-paint surface an action Button exposes.
 */
function SheetFooter({
  className,
  showCloseButton = false,
  closeLabel = "Close",
  closeClassName,
  closeStyle,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
  closeLabel?: ReactNode;
  closeClassName?: string;
  closeStyle?: CSSProperties;
}) {
  return (
    <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props}>
      {children}
      {showCloseButton && (
        <SheetPrimitive.Close
          render={(closeProps) => (
            <Button
              {...closeProps}
              data-slot="sheet-footer-close"
              variant="outline"
              className={closeClassName}
              style={closeStyle}
            >
              {closeLabel}
            </Button>
          )}
        />
      )}
    </div>
  );
}

function SheetTitle({ className, children, ...props }: SheetPrimitive.Title.Props) {
  const host = useMotionHostRef<HTMLHeadingElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <SheetPrimitive.Title
      {...props}
      {...paint}
      data-slot="sheet-title"
      data-motion={cm.mode}
      className={stateClasses(cn("text-lg font-semibold"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <SheetTitleText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <SheetTitleValue value={children} entity={entity} />
      ) : (
        children
      )}
    </SheetPrimitive.Title>
  );
}

function SheetDescription({ className, children, ...props }: SheetPrimitive.Description.Props) {
  const host = useMotionHostRef<HTMLParagraphElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <SheetPrimitive.Description
      {...props}
      {...paint}
      data-slot="sheet-description"
      data-motion={cm.mode}
      className={stateClasses(cn("text-sm text-muted-foreground"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <SheetDescriptionText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <SheetDescriptionValue value={children} entity={entity} />
      ) : (
        children
      )}
    </SheetPrimitive.Description>
  );
}

function SheetTitleText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="sheet-title-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function SheetTitleValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="sheet-title-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function SheetDescriptionText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="sheet-description-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function SheetDescriptionValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="sheet-description-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
