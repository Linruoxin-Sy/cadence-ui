"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import {
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "../button";
import { cn } from "../lib/cn";
import { useContinuousMotion, useStateColor } from "../lib/css-motion";
import { createModalPresence } from "../lib/modal-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { popupStyle, stateClasses, toastSwipeClasses } from "../lib/popup-style";
import { useCadenceMotion, withCadenceScope } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const toast = ToastPrimitive.createToastManager();

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/** Surface paint is one scoped family on the shell: a caller palette this surface
 * cannot verify stays immediate instead of passing through unreadable paint. */
const paintClass = /^(?:[\w-]+:)*(?:bg-|text-|border-|shadow-|ring-|outline-|fill-|stroke-)/;
const knownPaint =
  /^(?:[\w-]+:)*(?:bg-(?:popover|background|card|muted|transparent)|text-(?:popover-foreground|foreground|muted-foreground|destructive)|border-(?:border|input|ring)|shadow-lg)$/;

/** A caller palette this surface cannot verify keeps its paint immediate. */
function knownPalette(className: unknown, style: unknown) {
  if (typeof className === "function" || typeof style === "function") return false;
  const knownClass =
    !className ||
    String(className)
      .split(/\s+/)
      .every((name) => !paintClass.test(name) || knownPaint.test(name));
  const knownStyle =
    !style ||
    !Object.keys(style as object).some((key) =>
      /color|background|fill|stroke|shadow|filter|blend|opacity|^--(?!motion-|cadence-|ease-)/i.test(key),
    );
  return knownClass && knownStyle;
}

/**
 * The toast's own semantic visibility. A limited or ending toast is still mounted
 * by the manager, but its decorative work belongs to the outgoing presentation, so
 * the display and icon owners settle instead of animating off-stack.
 */
const ToastSurfaceContext = createContext<{ visible: boolean; entity: object } | null>(null);

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />;
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={stateClasses(
        cn(
          "pointer-events-none fixed inset-x-4 bottom-4 z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        ),
        className,
      )}
      {...props}
    />
  );
}

/**
 * Motion contract:
 * - full: opacity and `scale.in` entrance in the toast's actual stack position, then
 *   an opacity departure on the same host
 * - reduced: the same opacity envelope on the reduced clock, no scale
 * - none: the final presentation immediately
 *
 * The manager owns the stack. Base UI measures the natural height and writes the
 * final `--toast-offset-y`/`--toast-index` placement itself, and its own inline
 * `transform` owns a live swipe; Cadence therefore adds no height spring, second
 * transform or `bottom` tween that would compete with that transaction. The swipe
 * release channel is the primitive's own token-backed family, so a cancelled swipe
 * glides back while a released dismissal keeps its direction.
 */
function Toast({ className, style, ref: callerRef, ...props }: ToastPrimitive.Root.Props) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(callerRef);
  const cm = useCadenceMotion(node);
  const known = knownPalette(className, style);
  const paint = useStateColor(
    ref,
    cm,
    [
      "background-color",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "box-shadow",
    ],
    { readability: known ? "verified" : "immediate", immediate: !known },
  );
  const [entity] = useState(() => ({}));
  const status = props.toast?.transitionStatus;
  const visible = status !== "ending" && !props.toast?.limited;
  const presence = useRef<ReturnType<typeof createModalPresence> | null>(null);
  const connected = useRef<HTMLDivElement | null>(null);
  const previousOpen = useRef<boolean | null>(null);
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  committed(() => {
    const host = node.current;
    if (connected.current !== host) {
      presence.current?.dispose();
      presence.current = null;
      connected.current = host;
      previousOpen.current = null;
    }
    if (!host) return;
    if (!presence.current) presence.current = createModalPresence(host, { spatial: true, compose: true });
    // Only `ending` is a closed presentation; `starting` and a settled toast are open.
    const open = status !== "ending";
    presence.current.commit({
      open,
      // A later insertion is a genuine entrance; SSR hydration keeps its resting paint.
      enter: open && !initialHydration.current && previousOpen.current !== true,
      cm,
    });
    previousOpen.current = open;
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
    },
    [],
  );

  return withCadenceScope(
    cm,
    <ToastSurfaceContext.Provider value={{ visible, entity }}>
      <ToastPrimitive.Root
        data-slot="toast"
        {...props}
        {...paint}
        ref={paint.ref}
        className={stateClasses(
          cn(
            "group/toast pointer-events-auto absolute right-0 bottom-[calc(var(--toast-offset-y)+var(--toast-index)*0.75rem)] z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-lg border bg-popover text-popover-foreground shadow-lg outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "data-limited:pointer-events-none data-limited:opacity-0",
            toastSwipeClasses(cm),
          ),
          className,
        )}
        style={mergeStyle(paint.style, popupStyle(cm, style))}
      />
    </ToastSurfaceContext.Provider>,
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={stateClasses(cn("flex h-full items-center gap-3 overflow-hidden p-4"), className)}
      {...props}
    />
  );
}

/** Base UI accepts a state callback for `style`; both forms keep the owned clock vars. */
function mergeStyle<S>(
  owned: CSSProperties | undefined,
  caller: CSSProperties | ((state: S) => CSSProperties | undefined) | undefined,
): CSSProperties | ((state: S) => CSSProperties | undefined) {
  if (typeof caller === "function") return (state: S) => ({ ...owned, ...caller(state) });
  return { ...owned, ...caller };
}

/**
 * Each text region owns one display slot: a primitive string replaces only its
 * changed graphemes, a directly supplied supported number reels only its changed
 * places, and rich children keep their own identity.
 */
function ToastTitle({ className, style, children, ...props }: ToastPrimitive.Title.Props) {
  const surface = useContext(ToastSurfaceContext);
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const known = knownPalette(className, style);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: known ? "verified" : "immediate",
    immediate: !known,
  });
  const { node: textNode, ref: textRef } = useMotionHostRef<HTMLSpanElement>();
  const { node: numberNode, ref: numberRef } = useMotionHostRef<HTMLSpanElement>();
  const textMode = typeof children === "string";
  const numberMode = typeof children === "number";
  const text = useTextPresentation(textNode, textMode ? (children as string) : "", cm, surface?.entity ?? {}, {
    characterStagger: false,
    visible: surface?.visible ?? true,
    enabled: textMode,
  });
  const number = useNumberPresentation(numberNode, numberMode ? (children as number) : 0, cm, surface?.entity ?? {}, {
    compact: true,
    visible: surface?.visible ?? true,
    enabled: numberMode,
  });
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      {...props}
      {...paint}
      ref={paint.ref}
      style={mergeStyle(paint.style, style)}
      className={stateClasses(cn("text-sm font-medium"), className)}
    >
      {textMode ? (
        <span ref={textRef} data-slot="toast-title-text" data-motion={cm.mode}>
          {text}
        </span>
      ) : numberMode ? (
        <span ref={numberRef} data-slot="toast-title-number" data-motion={cm.mode}>
          {number}
        </span>
      ) : (
        // Without an explicit primitive string the manager's own text stays native;
        // the shipped Toaster always supplies the string to the owned display slot.
        children
      )}
    </ToastPrimitive.Title>
  );
}

function ToastDescription({ className, style, children, ...props }: ToastPrimitive.Description.Props) {
  const surface = useContext(ToastSurfaceContext);
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const known = knownPalette(className, style);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: known ? "verified" : "immediate",
    immediate: !known,
  });
  const { node: textNode, ref: textRef } = useMotionHostRef<HTMLSpanElement>();
  const { node: numberNode, ref: numberRef } = useMotionHostRef<HTMLSpanElement>();
  const textMode = typeof children === "string";
  const numberMode = typeof children === "number";
  const text = useTextPresentation(textNode, textMode ? (children as string) : "", cm, surface?.entity ?? {}, {
    characterStagger: false,
    visible: surface?.visible ?? true,
    enabled: textMode,
  });
  const number = useNumberPresentation(numberNode, numberMode ? (children as number) : 0, cm, surface?.entity ?? {}, {
    compact: true,
    visible: surface?.visible ?? true,
    enabled: numberMode,
  });
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      {...props}
      {...paint}
      ref={paint.ref}
      style={mergeStyle(paint.style, style)}
      className={stateClasses(cn("text-sm text-muted-foreground"), className)}
    >
      {textMode ? (
        <span ref={textRef} data-slot="toast-description-text" data-motion={cm.mode}>
          {text}
        </span>
      ) : numberMode ? (
        <span ref={numberRef} data-slot="toast-description-number" data-motion={cm.mode}>
          {number}
        </span>
      ) : (
        children
      )}
    </ToastPrimitive.Description>
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" data-slot="toast-action" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={stateClasses(cn("shrink-0"), className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" data-slot="toast-close" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      render={render}
      className={stateClasses(
        cn(
          "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        ),
        className,
      )}
      {...props}
    >
      {children ?? <XIcon aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

/**
 * The built-in status icon. Only the loading glyph runs the theme-clock spin, and
 * only while that type is current and visible; a type change replaces the glyph
 * immediately so the message's own semantic update is never delayed.
 */
function ToastIcon({ type, visible }: { type: string | undefined; visible: boolean }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const loop = useContinuousMotion(ref, cm, "spin", type === "loading" && visible);
  let icon: ReactNode = null;

  if (type === "success") {
    icon = <CircleCheckIcon aria-hidden="true" />;
  }

  if (type === "info") {
    icon = <InfoIcon aria-hidden="true" />;
  }

  if (type === "warning") {
    icon = <TriangleAlertIcon aria-hidden="true" />;
  }

  if (type === "error") {
    icon = <OctagonXIcon className="text-destructive" aria-hidden="true" />;
  }

  if (type === "loading") {
    icon = <Loader2Icon aria-hidden="true" />;
  }

  if (!icon) {
    return null;
  }

  return (
    <span
      {...loop}
      ref={loop.ref}
      data-slot="toast-icon"
      className="shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4"
    >
      {icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} visible={!toastItem.limited} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle>{toastItem.title}</ToastTitle>
          <ToastDescription>{toastItem.description}</ToastDescription>
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ));
}

function Toaster({
  children,
  toastManager = toast,
  viewportProps,
  ...props
}: ToastPrimitive.Provider.Props & {
  viewportProps?: Omit<ToastPrimitive.Viewport.Props, "children">;
}) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport {...viewportProps}>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  createToastManager,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  Toaster,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast,
  useToastManager,
};
