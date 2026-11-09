"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { usePresence } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, feedbackPress, geometryCompact } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

/** Upstream layout/selectors; state.color owns the scoped paint clock. */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {}

/** Native target stays stable; only known owned content is enhanced. */
export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  const { node, ref } = useMotionHostRef<HTMLButtonElement>(props.ref);
  const cm = useCadenceMotion(node);
  const palette = useRef(variant);
  // Crossing light/dark semantic variants can produce an unreadable midpoint.
  // Caller paint is unverified; ordinary sizing/layout utilities stay eligible.
  const layoutClasses =
    typeof className !== "function" &&
    (!className ||
      className
        .split(/\s+/)
        .every((name) =>
          /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/.test(
            name,
          ),
        ));
  const knownStyle =
    typeof props.style !== "function" &&
    !Object.keys(props.style ?? {}).some((key) =>
      /color|background|fill|stroke|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    );
  const paint = useStateColor(
    ref,
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
    { readability: layoutClasses && knownStyle ? "verified" : "immediate", immediate: palette.current !== variant },
  );
  committed(() => {
    palette.current = variant;
  });
  const [present, remove] = usePresence();
  const removal = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(removal.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const delivery = removal.current;
    delivery.ready = true;
    // A zero-clock layout completion precedes the parent's committed presence
    // bookkeeping. Flush lifecycle delivery after it, without an animation clock.
    if (delivery.pending && !delivery.present) delivery.complete?.();
    delivery.pending = false;
  });
  const parent = usePresentationScope();
  const [scope] = useState(() => createPresentationScope(node));
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const entranceConsumed = useRef(false);
  const lifecycle = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  const presenceHost = useRef<HTMLElement | null>(null);
  const [transaction] = useState(createMotionTransaction);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const geometryHost = useRef<HTMLElement | null>(null);
  const geometryContent = useRef<HTMLElement | null>(null);
  const geometryGroup = useContext(GeometryScope);
  const geometryParent = useRef(geometryGroup);
  const geometryOwned = useRef(false);
  const unregisterGeometry = useRef<(() => void) | undefined>(undefined);
  const geometryInputs = useRef({ render: props.render });
  committed(() => {
    geometryInputs.current = { render: props.render };
  });
  const [held, setHeld] = useState(false);
  const [targetVersion, reviseTarget] = useState(0);
  const action = useRef<{ signature?: string; formAction: ButtonProps["formAction"]; entity: object }>({
    formAction: props.formAction,
    entity: {},
  });
  const pointer = useRef<number | string | null>(null);
  const staleActivation = useRef(false);
  const release = useCallback(() => {
    pointer.current = null;
    setHeld(false);
  }, []);
  const disabled = props.disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true" || !present;
  // Only a known plain label supplies a safe independent press visual. Rich
  // children, direct SVGs and custom render targets keep their exact structure.
  const plain = typeof props.children === "string" || typeof props.children === "number";
  const safePress = plain && !props.render && !disabled;
  const entity = action.current.entity;
  committed(() => {
    const host = node.current;
    if (!host) return;
    const attributes = ["type", "form", "formaction", "href"];
    const reconcile = () => {
      if (node.current !== host) return;
      const signature = JSON.stringify([host.tagName, ...attributes.map((name) => host.getAttribute(name))]);
      const previous = action.current;
      action.current = { signature, formAction: props.formAction, entity: previous.entity };
      if (
        previous.signature !== undefined &&
        (previous.signature !== signature || previous.formAction !== props.formAction)
      ) {
        action.current.entity = {};
        if (pointer.current !== null) staleActivation.current = true;
        scope.transaction.cancel();
        if (!geometryGroup) geometry.current?.settle();
        release();
        reviseTarget((version) => version + 1);
      }
    };
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(host, { attributes: true, attributeFilter: attributes });
    return () => observer.disconnect();
  });
  committed(() => {
    if (disabled) {
      if (pointer.current !== null) staleActivation.current = true;
      release();
    }
  }, [disabled, release]);
  committed(() => {
    if (!held) return;
    const end = (event: PointerEvent) => {
      if (event.pointerId === pointer.current) release();
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [held, release]);
  committed(() => {
    const host = node.current;
    const parentScope = parent ?? (host ? documentPresentation(host.ownerDocument) : null);
    const enter =
      !entranceConsumed.current &&
      !initialHydration.current &&
      Boolean(parentScope?.presented && parentScope.available());
    if (host !== presenceHost.current) {
      lifecycle.current?.dispose();
      lifecycle.current = host ? createInlinePresence(host) : null;
      presenceHost.current = host;
    }
    if (host) entranceConsumed.current = true;
    lifecycle.current?.commit({
      present,
      cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
      enter,
    });
    if (present) scope.transaction.open();
    else scope.transaction.close();
  });
  committed(() => {
    const host = node.current;
    const content = host?.querySelector<HTMLElement>('[data-slot="button-feedback"]') ?? host;
    if (
      host !== geometryHost.current ||
      content !== geometryContent.current ||
      geometryParent.current !== geometryGroup
    ) {
      unregisterGeometry.current?.();
      if (geometryOwned.current) geometry.current?.dispose();
      geometry.current = host ? (geometryGroup?.controller ?? createMeasuredGeometry(transaction)) : null;
      geometryOwned.current = !geometryGroup;
      geometryHost.current = host;
      geometryContent.current = content;
      geometryParent.current = geometryGroup;
      if (host)
        unregisterGeometry.current = geometry.current?.register({
          host: node,
          content: content ?? host,
          axes: ["width", "height"],
          measure() {
            const box = naturalGeometry(host);
            const css = host.ownerDocument.defaultView?.getComputedStyle(host);
            if (!box || !css || geometryInputs.current.render) return null;
            const typed = host.computedStyleMap?.();
            const automatic = typed?.get("width")?.toString() === "auto";
            const parentBox = host.parentElement && naturalGeometry(host.parentElement);
            const max = parentBox?.width ?? box.width;
            return {
              ...(automatic
                ? {
                    width: {
                      size: box.width,
                      min: box.width,
                      max: Math.max(box.width, max),
                      readable: true,
                      independent: true,
                    },
                  }
                : {}),
              height: {
                size: box.height,
                min: box.height,
                max: Math.max(box.height, parentBox?.height ?? box.height),
                readable: true,
                independent: true,
              },
            };
          },
        });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind === "geometry" && !geometryGroup)
      geometry.current?.commit(
        transaction.revision("content", plain ? JSON.stringify([props.children, size, targetVersion]) : props.children),
        {
          reduced: cm.reduced,
          transition: parameters.transition,
          available: present && scope.available(),
        },
      );
  });
  committed(
    () => () => {
      lifecycle.current?.dispose();
      unregisterGeometry.current?.();
      if (geometryOwned.current) geometry.current?.dispose();
      lifecycle.current = null;
      presenceHost.current = null;
      geometry.current = null;
      geometryHost.current = null;
      geometryContent.current = null;
    },
    [],
  );
  const label =
    typeof props.children === "number" ? (
      <ButtonNumber value={props.children} entity={entity} visible={present} scope={scope} />
    ) : (
      <ButtonText value={props.children as string} entity={entity} visible={present} scope={scope} />
    );
  const children = plain ? (
    props.render ? (
      label
    ) : (
      <ButtonFeedback cm={cm} held={held && safePress}>
        {label}
      </ButtonFeedback>
    )
  ) : (
    props.children
  );
  const callerStyle = props.style;
  return (
    <MotionPresentation scope={scope}>
      <ButtonPrimitive
        data-slot="button"
        data-variant={variant}
        data-size={size}
        {...props}
        {...paint}
        data-motion={cm.mode}
        data-ending-style={present ? undefined : ""}
        inert={!present || props.inert || undefined}
        aria-hidden={present ? props["aria-hidden"] : true}
        className={
          typeof className === "function"
            ? (state) => cn(buttonVariants({ variant, size }), className(state))
            : cn(buttonVariants({ variant, size }), className)
        }
        style={
          typeof callerStyle === "function"
            ? (state) => ({ ...paint.style, ...callerStyle(state) })
            : { ...paint.style, ...callerStyle }
        }
        onPointerDown={(event) => {
          props.onPointerDown?.(event);
          if (!disabled && event.button === 0 && event.isPrimary && pointer.current === null) {
            staleActivation.current = false;
            pointer.current = event.pointerId;
            setHeld(true);
          }
        }}
        onPointerUp={(event) => {
          props.onPointerUp?.(event);
          if (event.pointerId === pointer.current) release();
        }}
        onPointerCancel={(event) => {
          props.onPointerCancel?.(event);
          if (event.pointerId === pointer.current) release();
        }}
        onLostPointerCapture={(event) => {
          props.onLostPointerCapture?.(event);
          if (event.pointerId === pointer.current) release();
        }}
        onKeyDown={(event) => {
          props.onKeyDown?.(event);
          if (
            !disabled &&
            (event.key === "Enter" || event.key === " ") &&
            event.target === event.currentTarget &&
            pointer.current === null
          ) {
            staleActivation.current = false;
            pointer.current = event.key;
            setHeld(true);
          }
        }}
        onKeyUp={(event) => {
          props.onKeyUp?.(event);
          if (event.key === pointer.current) release();
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          release();
        }}
        onClick={(event) => {
          if (!present || staleActivation.current) {
            event.preventDefault();
            return;
          }
          props.onClick?.(event);
        }}
      >
        {children}
      </ButtonPrimitive>
    </MotionPresentation>
  );
}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

function ButtonFeedback({ cm, held, children }: { cm: CadenceMotion; held: boolean; children: ReactNode }) {
  const parameters = cm.parameters(bindMotionParameters(feedbackPress, "feedback.press/scale"));
  if (parameters.kind !== "press") return children;
  return (
    <ControlSpan
      data-slot="button-feedback"
      data-motion={cm.mode}
      className="inline-block shrink-0"
      target={{ scale: cm.reduced ? 1 : held ? parameters.scale : 1 }}
      transition={parameters.transition}
    >
      {children}
    </ControlSpan>
  );
}
function ButtonText({
  value,
  entity,
  visible,
  scope,
}: {
  value: string;
  entity: object;
  visible: boolean;
  scope: ReturnType<typeof createPresentationScope>;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, { characterStagger: false, visible }, scope.transaction);
  return (
    <span ref={ref} data-slot="button-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}
function ButtonNumber({
  value,
  entity,
  visible,
  scope,
}: {
  value: number;
  entity: object;
  visible: boolean;
  scope: ReturnType<typeof createPresentationScope>;
}) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(
    node,
    value,
    cm,
    entity,
    { compact: true, visible, cause: "independent" },
    scope.transaction,
  );
  return (
    <span ref={ref} data-slot="button-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { buttonVariants };
