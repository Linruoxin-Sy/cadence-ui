"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
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
import { buttonVariants } from "../button";
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

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Motion contract: one opacity owner for the backdrop and one opacity/scale owner
 * for the panel, both created by the shared modal presence controller. Base UI keeps
 * mounting, modality, focus and the actual unmount completion.
 */
function DialogOverlay({ className, style, render, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      {...props}
      className={className}
      style={style}
      render={(elementProps, state) => (
        <DialogOverlaySurface elementProps={elementProps} state={state} render={render} />
      )}
    />
  );
}

function DialogOverlaySurface({
  elementProps,
  state,
  render,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: DialogPrimitive.Backdrop.State;
  render: DialogPrimitive.Backdrop.Props["render"];
}) {
  const host = useMotionHostRef<HTMLDivElement>(elementProps.ref);
  const cm = useCadenceMotion(host.node);
  const wrap = usePopupPresence(host.node, [], false, cm, "base");
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
        state: { ...state, slot: "dialog-overlay" },
        props: {
          ...elementProps,
          ...paint,
          "data-slot": "dialog-overlay",
          "data-motion": cm.mode,
          className: cn("fixed inset-0 isolate z-50 bg-black/50", elementProps.className),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
        },
      }),
    ),
  );
}

function DialogContent({
  className,
  style,
  children,
  showCloseButton = true,
  overlayClassName,
  overlayStyle,
  render,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  overlayClassName?: DialogPrimitive.Backdrop.Props["className"];
  overlayStyle?: DialogPrimitive.Backdrop.Props["style"];
}) {
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} style={overlayStyle} />
      <DialogPrimitive.Popup
        {...props}
        className={className}
        style={style}
        render={(elementProps, state) => (
          <DialogContentSurface
            elementProps={elementProps}
            state={state}
            showCloseButton={showCloseButton}
            render={render}
          >
            {children}
          </DialogContentSurface>
        )}
      />
    </DialogPortal>
  );
}

function DialogContentSurface({
  elementProps,
  state,
  showCloseButton,
  render,
  children,
}: {
  elementProps: React.ComponentPropsWithRef<"div">;
  state: DialogPrimitive.Popup.State;
  showCloseButton: boolean;
  render: DialogPrimitive.Popup.Props["render"];
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
        state: { ...state, slot: "dialog-content" },
        props: {
          ...elementProps,
          ...paint,
          "data-slot": "dialog-content",
          "data-motion": cm.mode,
          className: cn(
            "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none sm:max-w-lg",
            elementProps.className,
          ),
          style: { ...paint.style, ...clockVariables(cm), ...elementProps.style },
          children: (
            <>
              {children}
              {showCloseButton && (
                <DialogPrimitive.Close
                  data-slot="dialog-close"
                  className="absolute top-4 right-4"
                  render={
                    <button
                      type="button"
                      data-variant="ghost"
                      data-size="icon-sm"
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    />
                  }
                >
                  <X />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </>
          ),
        },
      }),
    ),
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          data-slot="dialog-close"
          render={
            <button
              type="button"
              data-variant="outline"
              data-size="default"
              className={buttonVariants({ variant: "outline" })}
            />
          }
        >
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, children, ...props }: DialogPrimitive.Title.Props) {
  const host = useMotionHostRef<HTMLHeadingElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <DialogPrimitive.Title
      {...props}
      {...paint}
      data-slot="dialog-title"
      data-motion={cm.mode}
      className={stateClasses(cn("text-lg font-semibold"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <DialogTitleText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <DialogTitleValue value={children} entity={entity} />
      ) : (
        children
      )}
    </DialogPrimitive.Title>
  );
}

function DialogDescription({ className, children, ...props }: DialogPrimitive.Description.Props) {
  const host = useMotionHostRef<HTMLParagraphElement>(props.ref);
  const cm = useCadenceMotion(host.node);
  const [entity] = useState(() => ({}));
  const paint = useStateColor(host.ref, cm, ["color"], {
    readability: knownPalette(className, props.style) ? "verified" : "immediate",
  });
  return (
    <DialogPrimitive.Description
      {...props}
      {...paint}
      data-slot="dialog-description"
      data-motion={cm.mode}
      className={stateClasses(cn("text-sm text-muted-foreground"), className)}
      style={mergeStyle(paint.style, props.style)}
    >
      {typeof children === "string" ? (
        <DialogDescriptionText value={children} entity={entity} />
      ) : typeof children === "number" ? (
        <DialogDescriptionValue value={children} entity={entity} />
      ) : (
        children
      )}
    </DialogPrimitive.Description>
  );
}

function DialogTitleText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dialog-title-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DialogTitleValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="dialog-title-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DialogDescriptionText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false });
  return (
    <span ref={ref} data-slot="dialog-description-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function DialogDescriptionValue({ value, entity }: { value: number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(node, value, cm, entity, { compact: true });
  return (
    <span ref={ref} data-slot="dialog-description-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
