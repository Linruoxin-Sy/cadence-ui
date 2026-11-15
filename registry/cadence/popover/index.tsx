"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { useRender } from "@base-ui/react/use-render";
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
import { createAnchoredPresence } from "../lib/anchored-presence";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { usePopupPresence } from "../lib/popup-presence";
import { popupClockStyle, stateClasses } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

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

/** A stable, committed content signature: the panel's natural size is measured
 * against what it actually renders, never against a render counter. */
function contentRevision(children: ReactNode): string {
  const shape = (child: ReactNode, depth: number): unknown => {
    if (typeof child === "string" || typeof child === "number") return child;
    if (!isValidElement(child) || depth > 4) return null;
    const type = child.type;
    const name =
      typeof type === "string"
        ? type
        : ((type as { displayName?: string; name?: string }).displayName ?? (type as { name?: string }).name ?? "part");
    const nested = (child.props as { children?: ReactNode }).children;
    return [name, child.key, Children.toArray(nested).map((next) => shape(next, depth + 1))];
  };
  return JSON.stringify(Children.toArray(children).map((child) => shape(child, 0)));
}

/** Portal clock/fallback variables only; presence and colour own their properties. */
function clockVariables(cm: CadenceMotion): CSSProperties {
  const variables: Record<string, string | number> = { ...popupClockStyle(cm) };
  delete variables.transition;
  return variables as CSSProperties;
}

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * Motion contract: the anchored panel is its own visual layer. It fades in with a
 * `distance.xs` approach from the side Base UI resolved, and fades out without
 * moving the anchor. The positioner keeps its coordinates, so collision flips and
 * anchor moves stay native and immediate.
 */
function PopoverContent({
  className,
  style,
  children,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  render,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
        data-slot="popover-positioner"
      >
        <PopoverPrimitive.Popup
          {...props}
          className={className}
          style={style}
          render={(elementProps, state) => (
            <PopoverContentSurface elementProps={elementProps} state={state} render={render}>
              {children}
            </PopoverContentSurface>
          )}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverContentSurface({
  elementProps,
  state,
  render,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: PopoverPrimitive.Popup.State;
  render: PopoverPrimitive.Popup.Props["render"];
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
    {
      readability: knownPalette(elementProps.className, elementProps.style) ? "verified" : "immediate",
    },
  );
  const controller = useRef<ReturnType<typeof createAnchoredPresence> | null>(null);
  const connected = useRef<HTMLElement | null>(null);
  const lastOpen = useRef<boolean | null>(null);
  const [transaction] = useState(createMotionTransaction);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const release = useRef<(() => void) | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);
  const revision = contentRevision(children);

  committed(() => {
    const node = host.node.current;
    if (connected.current !== node) {
      controller.current?.dispose();
      controller.current = null;
      connected.current = node;
    }
    if (node && !controller.current) controller.current = createAnchoredPresence(node);
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
        axes: ["width", "height"],
        observeChildren: true,
        measure() {
          const box = naturalGeometry(node);
          if (!box) return null;
          const css = node.ownerDocument.defaultView?.getComputedStyle(node);
          const view = node.ownerDocument.defaultView;
          // Base UI's `size()` clamp is the real available space; a missing value
          // never narrows the panel below its own natural box.
          const availableWidth = Number.parseFloat(css?.getPropertyValue("--available-width") ?? "");
          const availableHeight = Number.parseFloat(css?.getPropertyValue("--available-height") ?? "");
          return {
            // Never animate below the natural box: required text stays laid out.
            width: {
              size: box.width,
              min: 0,
              max: Math.max(box.width, Number.isFinite(availableWidth) ? availableWidth : box.width),
              readable: true,
              independent: true,
            },
            height: {
              size: box.height,
              min: 0,
              max: Math.max(
                box.height,
                Number.isFinite(availableHeight) ? availableHeight : (view?.innerHeight ?? box.height),
              ),
              readable: true,
              independent: true,
            },
          };
        },
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
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
        state: { ...state, slot: "popover-content" },
        props: {
          ...elementProps,
          ...paint,
          "data-slot": "popover-content",
          "data-motion": cm.mode,
          className: cn(
            "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            elementProps.className,
          ),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
          children,
        },
      }),
    ),
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-header" className={cn("flex flex-col gap-1 text-sm", className)} {...props} />;
}

function PopoverTitle({ className, children, style, ...props }: PopoverPrimitive.Title.Props) {
  const host = useMotionHostRef<HTMLHeadingElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });
  return (
    <PopoverPrimitive.Title
      {...props}
      {...paint}
      data-slot="popover-title"
      data-motion={cm.mode}
      className={stateClasses(cn("font-medium"), className)}
      style={mergeStyle(paint.style, style)}
    >
      {typeof children === "string" ? (
        <PopoverTitleText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <PopoverTitleValue value={children} entity={entity} />
      ) : (
        children
      )}
    </PopoverPrimitive.Title>
  );
}

function PopoverDescription({ className, children, style, ...props }: PopoverPrimitive.Description.Props) {
  const host = useMotionHostRef<HTMLParagraphElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });
  return (
    <PopoverPrimitive.Description
      {...props}
      {...paint}
      data-slot="popover-description"
      data-motion={cm.mode}
      className={stateClasses(cn("text-muted-foreground"), className)}
      style={mergeStyle(paint.style, style)}
    >
      {typeof children === "string" ? (
        <PopoverDescriptionText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <PopoverDescriptionValue value={children} entity={entity} />
      ) : (
        children
      )}
    </PopoverPrimitive.Description>
  );
}

function PopoverTitleText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="popover-title-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function PopoverTitleValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="popover-title-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function PopoverDescriptionText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="popover-description-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function PopoverDescriptionValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="popover-description-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
