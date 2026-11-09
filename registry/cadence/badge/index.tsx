"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { usePresence } from "motion/react";
import {
  isValidElement,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, GeometryScope, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border border-transparent px-2 py-0.5 text-xs font-medium outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline: "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/** Stable native label/link; rich children keep their exact tree and ownership. */
function Badge({ className, variant = "default", render, ...props }: BadgeProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(props.ref);
  const cm = useCadenceMotion(node);
  const palette = useRef(variant);
  const layoutClasses =
    !className ||
    className
      .split(/\s+/)
      .every((name) =>
        /^(?:[\w-]+:)*(?:w-|h-|size-|min-|max-|p[xytrblse]?-|m[xytrblse]?-|gap-|flex|inline-|block|grid|shrink|grow|basis-|items-|justify-|self-|order-|relative|absolute|fixed|sticky|inset-|top-|bottom-|left-|right-|overflow-|truncate|text-(?:xs|sm|base|lg|xl)$)/.test(
          name,
        ),
      );
  const knownStyle = !Object.keys(props.style ?? {}).some((key) =>
    /color|background|fill|stroke|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
  );
  // A custom render can supply paint outside the native library palette.
  const knownRender =
    !render ||
    (isValidElement<{ className?: string; style?: unknown }>(render) &&
      typeof render.type === "string" &&
      !render.props.className &&
      !render.props.style);
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
    {
      readability: layoutClasses && knownStyle && knownRender ? "verified" : "immediate",
      immediate: palette.current !== variant,
    },
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
  const [entity] = useState(() => ({}));
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
  const geometryInputs = useRef({ knownRender });
  committed(() => {
    geometryInputs.current = { knownRender };
  });
  const plain = typeof props.children === "string" || typeof props.children === "number";
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
      enter,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    if (present) scope.transaction.open();
    else scope.transaction.close();
  });
  committed(() => {
    const host = node.current;
    const content = host?.querySelector<HTMLElement>('[data-slot="badge-text"],[data-slot="badge-number"]') ?? host;
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
          axes: ["width"],
          measure() {
            const box = naturalGeometry(host);
            const typed = host.computedStyleMap?.();
            // Unverified custom targets and externally constrained dimensions keep native layout.
            const intrinsic = ["auto", "fit-content", "max-content"].includes(typed?.get("width")?.toString() ?? "");
            if (!box || !intrinsic || !geometryInputs.current.knownRender) return null;
            const parentBox = host.parentElement && naturalGeometry(host.parentElement);
            return {
              width: {
                size: box.width,
                min: box.width,
                max: Math.max(box.width, parentBox?.width ?? box.width),
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
        transaction.revision("content", plain ? JSON.stringify([props.children, variant]) : props.children),
        {
          reduced: cm.reduced,
          transition: parameters.transition,
          available: present && scope.available() && knownRender,
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
    },
    [],
  );
  const children =
    typeof props.children === "number" ? (
      <BadgeNumber value={props.children} entity={entity} visible={present} scope={scope} />
    ) : typeof props.children === "string" ? (
      <BadgeText value={props.children} entity={entity} visible={present} scope={scope} />
    ) : (
      props.children
    );
  return (
    <MotionPresentation scope={scope}>
      <BadgeHost
        {...props}
        {...paint}
        data-slot="badge"
        data-motion={cm.mode}
        data-ending-style={present ? undefined : ""}
        inert={!present || props.inert || undefined}
        aria-hidden={present ? props["aria-hidden"] : true}
        render={render}
        variant={variant}
        className={cn(badgeVariants({ variant }), className)}
        style={{ ...paint.style, ...props.style }}
        onClick={(event) => {
          if (!present) {
            event.preventDefault();
            return;
          }
          props.onClick?.(event);
        }}
      >
        {children}
      </BadgeHost>
    </MotionPresentation>
  );
}

/** Base render adapter, without a wrapper or a second physical ref registration. */
function BadgeHost({ className, variant, render, ...props }: BadgeProps) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className }, props),
    render,
    state: { slot: "badge", variant },
  });
}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

function BadgeText({
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
    <span ref={ref} data-slot="badge-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}
function BadgeNumber({
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
    <span ref={ref} data-slot="badge-number" data-motion={cm.mode}>
      {text}
    </span>
  );
}

export { Badge, badgeVariants };
