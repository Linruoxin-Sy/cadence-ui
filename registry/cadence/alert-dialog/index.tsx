"use client";

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
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
import { Button, type ButtonProps } from "../button";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { createModalPresence } from "../lib/modal-presence";
import { bindMotionParameters, geometryPanel } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { usePopupPresence } from "../lib/popup-presence";
import { popupClockStyle, stateClasses } from "../lib/popup-style";
import { type CadenceMotion, useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Portal clock/fallback variables only; presence and colour own their properties. */
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

/** A stable, committed content signature; never a layout read or a random
 * revision. The message lives in the header's title and description, so the
 * signature follows nested committed text instead of the direct child list. */
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

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

/**
 * Motion contract: one opacity owner for the backdrop and one opacity/scale owner
 * for the panel, both created by the shared modal presence controller. Base UI keeps
 * mounting, modality, focus, dismissal and the actual unmount completion.
 */
function AlertDialogOverlay({ className, style, render, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      {...props}
      className={className}
      style={style}
      render={(elementProps, state) => (
        <AlertDialogOverlaySurface elementProps={elementProps} state={state} render={render} />
      )}
    />
  );
}

function AlertDialogOverlaySurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: AlertDialogPrimitive.Backdrop.State;
  render: AlertDialogPrimitive.Backdrop.Props["render"];
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const wrap = usePopupPresence(host.node, [], false, cm, "base");
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
        state: { ...state, slot: "alert-dialog-overlay" },
        props: {
          ...elementProps,
          ref: host.ref,
          "data-slot": "alert-dialog-overlay",
          "data-motion": cm.mode,
          className: cn("fixed inset-0 isolate z-50 bg-black/50", elementProps.className),
          style: { ...clockVariables(cm), ...elementProps.style },
        },
      }),
    ),
  );
}

function AlertDialogContent({
  className,
  style,
  children,
  size = "default",
  render,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        {...props}
        className={className}
        style={style}
        render={(elementProps, state) => (
          <AlertDialogContentSurface elementProps={elementProps} state={state} size={size} render={render}>
            {children}
          </AlertDialogContentSurface>
        )}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogContentSurface({
  elementProps,
  state,
  size,
  render,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: AlertDialogPrimitive.Popup.State;
  size: "default" | "sm";
  render: AlertDialogPrimitive.Popup.Props["render"];
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
  const controller = useRef<ReturnType<typeof createModalPresence> | null>(null);
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
    if (node && !controller.current) controller.current = createModalPresence(node, { spatial: true });
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
        state: { ...state, slot: "alert-dialog-content" },
        props: {
          ...elementProps,
          ...paint,
          "data-slot": "alert-dialog-content",
          "data-size": size,
          "data-motion": cm.mode,
          className: cn(
            "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg",
            elementProps.className,
          ),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
          children,
        },
      }),
    ),
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/** Media keeps its own scoped surface paint; the panel owns presence and size. */
function AlertDialogMedia({ className, style, ...props }: React.ComponentProps<"div">) {
  const host = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const paint = useStateColor(host.ref, cm, ["background-color"], {
    readability: knownPalette(className, style) ? "verified" : "immediate",
  });
  return (
    <div
      data-slot="alert-dialog-media"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted *:[svg:not([class*='size-'])]:size-8 sm:group-data-[size=default]/alert-dialog-content:row-span-2",
        className,
      )}
      style={{ ...paint.style, ...style }}
    />
  );
}

function AlertDialogTitle({ className, children, ...props }: AlertDialogPrimitive.Title.Props) {
  const host = useMotionHostRef<HTMLHeadingElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <AlertDialogPrimitive.Title
      {...props}
      {...paint}
      data-slot="alert-dialog-title"
      data-motion={cm.mode}
      className={stateClasses(
        cn(
          "text-lg font-semibold sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        ),
        className,
      )}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <AlertDialogTitleText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <AlertDialogTitleValue value={children} entity={entity} />
      ) : (
        children
      )}
    </AlertDialogPrimitive.Title>
  );
}

function AlertDialogDescription({ className, children, ...props }: AlertDialogPrimitive.Description.Props) {
  const host = useMotionHostRef<HTMLParagraphElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <AlertDialogPrimitive.Description
      {...props}
      {...paint}
      data-slot="alert-dialog-description"
      data-motion={cm.mode}
      className={stateClasses(cn("text-sm text-muted-foreground"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <AlertDialogDescriptionText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <AlertDialogDescriptionValue value={children} entity={entity} />
      ) : (
        children
      )}
    </AlertDialogPrimitive.Description>
  );
}

function AlertDialogTitleText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="alert-dialog-title-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function AlertDialogTitleValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="alert-dialog-title-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function AlertDialogDescriptionText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="alert-dialog-description-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function AlertDialogDescriptionValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="alert-dialog-description-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

/**
 * Upstream leaves the action open; callers own confirmation and controlled closing.
 * The label, quantity, geometry, paint and press layers stay Button's: this part
 * names the composition and adds no second writer.
 */
function AlertDialogAction({ className, variant, ...props }: ButtonProps) {
  return (
    <Button
      data-slot="alert-dialog-action"
      variant={variant}
      className={stateClasses(
        cn(
          variant === "destructive" &&
            "bg-destructive/10 text-foreground hover:bg-destructive/20 dark:bg-destructive/20",
        ),
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props & Pick<ButtonProps, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={className}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
