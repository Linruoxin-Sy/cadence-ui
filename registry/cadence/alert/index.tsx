"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
  cloneElement,
  isValidElement,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createAlertIcon } from "../lib/alert-icon";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import {
  createMeasuredGeometry,
  type GeometryDestination,
  GeometryScope,
  naturalGeometry,
} from "../lib/measured-geometry";
import { bindMotionParameters, geometryContent, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { createSurfacePresence } from "../lib/surface-presence";
import { nativeTextContext } from "../lib/text-layout";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 has-[>[data-slot=alert-action]]:grid-cols-[0_1fr_auto] has-[>[data-slot=alert-action]]:gap-x-3 has-[>svg]:has-[>[data-slot=alert-action]]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "bg-card text-destructive *:data-[slot=alert-description]:text-destructive [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {}

/** One live region; visual retention never retains operable actions. */
function Alert({ className, variant = "default", children, ref: external, ...props }: AlertProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(external);
  const cm = useCadenceMotion(node);
  const AlertPaint = useStateColor(
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
    { readability: safePaint(className, props.style) ? "verified" : "immediate" },
  );
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
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const presence = useRef<ReturnType<typeof createSurfacePresence> | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    const parentScope = parent ?? (host ? documentPresentation(host.ownerDocument) : null);
    const enter =
      !consumed.current &&
      !initialHydration.current &&
      Boolean(
        parentScope?.presented &&
          parentScope.available() &&
          !parentScope.node?.current?.hasAttribute("data-starting-style") &&
          host &&
          !nativeTextContext(host),
      );
    if (host && !presence.current) presence.current = createSurfacePresence(host);
    if (host) consumed.current = true;
    presence.current?.commit({
      present,
      enter,
      cm,
      complete: () => {
        const delivery = removal.current;
        if (delivery.present) return;
        if (delivery.ready) delivery.complete?.();
        else delivery.pending = true;
      },
    });
    if (present) {
      scope.transaction.open();
      scope.presented = true;
    } else {
      scope.transaction.close();
      scope.presented = false;
    }
  });
  const parentGeometry = useContext(GeometryScope);
  const iconLayer = useRef<HTMLSpanElement>(null);
  const iconSource = useRef<SVGSVGElement | null>(null);
  const delivery = useRef<(() => void) | null>(null);
  const [localGeometry] = useState(() => {
    const transaction = createMotionTransaction();
    let pending = false;
    return {
      transaction,
      controller: createMeasuredGeometry(transaction),
      request() {
        if (pending) return;
        pending = true;
        queueMicrotask(() => {
          pending = false;
          delivery.current?.();
        });
      },
    };
  });
  const group = localGeometry;
  const semantic = JSON.stringify([
    variant,
    className,
    props.style,
    Children.toArray(children).map((child) =>
      isValidElement<{ children?: React.ReactNode; className?: string; style?: React.CSSProperties }>(child)
        ? [
            child.key,
            child.type === AlertTitle
              ? "title"
              : child.type === AlertDescription
                ? "description"
                : child.type === AlertAction
                  ? "action"
                  : "composed",
            typeof child.props.children === "string" || typeof child.props.children === "number"
              ? child.props.children
              : null,
            child.props.className,
            child.props.style,
          ]
        : child,
    ),
  ]);
  const prepared = useRef({ semantic, policy: JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]) });
  useInsertionEffect(() => {
    const policy = JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]);
    if (prepared.current.semantic !== semantic || prepared.current.policy !== policy) group.controller.prepare();
    prepared.current = { semantic, policy };
  }, [semantic, cm.mode, cm.timeScale, cm.scope.signature, group]);
  const connection = useRef<{ content: HTMLElement; release(): void } | null>(null);
  committed(() => {
    const host = node.current;
    const content = host;
    const old = connection.current;
    if (old && old.content !== content) {
      old.release();
      connection.current = null;
    }
    if (host && content && !connection.current) {
      const release = group.controller.register({
        host: node,
        content,
        axes: ["height"],
        observeChildren: true,
        textGeometry: true,
        decoration: iconLayer.current,
        measure() {
          return alertDestination(host, iconLayer.current);
        },
      });
      const releaseEditing = observeAlertEditing(host, group.controller, () => presence.current?.settleEntrance());
      connection.current = {
        content,
        release() {
          releaseEditing();
          release();
        },
      };
    }
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    delivery.current = () => {
      if (!host?.isConnected || parameters.kind !== "geometry") return;
      const target = JSON.stringify([host.textContent, variant, className, props.style, content?.childElementCount]);
      group.controller.commit(group.transaction.revision("content", target, node), {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: present && scope.available(),
      });
    };
    delivery.current();
    parentGeometry?.request?.();
  });
  committed(
    () => () => {
      presence.current?.dispose();
      presence.current = null;
      connection.current?.release();
      connection.current = null;
      delivery.current = null;
      localGeometry.controller.settle();
    },
    [localGeometry],
  );
  const icons = useRef<ReturnType<typeof createAlertIcon> | null>(null);
  const keyed: string[] = [];
  Children.forEach(children, (child) => {
    if (
      isValidElement<{ "aria-hidden"?: boolean | "true" | "false" }>(child) &&
      child.key !== null &&
      (child.props["aria-hidden"] === true || child.props["aria-hidden"] === "true")
    )
      keyed.push(String(child.key));
  });
  const iconKey = keyed.length === 1 ? (keyed[0] ?? null) : null;
  committed(() => {
    if (!icons.current && iconLayer.current && node.current)
      icons.current = createAlertIcon(iconLayer.current, node.current);
    icons.current?.commit({ key: iconKey, source: iconSource.current, cm, present: present && scope.available() });
  });
  committed(
    () => () => {
      icons.current?.dispose();
      icons.current = null;
    },
    [],
  );
  return (
    <MotionPresentation scope={scope}>
      <GeometryScope.Provider value={group}>
        <div
          data-slot="alert"
          {...props}
          {...AlertPaint}
          role={present ? (Object.hasOwn(props, "role") ? props.role : "alert") : undefined}
          data-motion={cm.mode}
          data-ending-style={present ? undefined : ""}
          inert={!present || props.inert || undefined}
          aria-hidden={present ? props["aria-hidden"] : true}
          className={cn(alertVariants({ variant }), className)}
          style={{ ...AlertPaint.style, ...props.style }}
        >
          {Children.map(children, (child) =>
            isValidElement<React.ComponentProps<"svg">>(child) && iconKey !== null && String(child.key) === iconKey ? (
              <AlertIconSource
                key={child.key}
                icon={child}
                source={iconSource}
                retire={(source) => icons.current?.retire(source)}
              />
            ) : (
              child
            ),
          )}
          <span
            ref={iconLayer}
            data-slot="alert-icon-visual"
            data-motion={cm.mode}
            aria-hidden="true"
            inert
            className="pointer-events-none absolute select-none"
          />
        </div>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}
/** No DOM wrapper: inspect the actual source before React detaches it, then
 * deliver the caller's original ref cleanup through the shared ref adapter. */
function AlertIconSource({
  icon,
  source,
  retire,
}: {
  icon: React.ReactElement<React.ComponentProps<"svg">>;
  source: React.RefObject<SVGSVGElement | null>;
  retire(source: SVGSVGElement): void;
}) {
  const host = useMotionHostRef<SVGSVGElement>(icon.props.ref);
  const connected = useRef<SVGSVGElement | null>(null);
  const callback = useRef(retire);
  useInsertionEffect(() => {
    callback.current = retire;
  });
  committed(() => {
    connected.current = host.node.current;
    source.current = host.node.current;
    host.node.invalidate = () => {
      if (connected.current) callback.current(connected.current);
      if (source.current === connected.current) source.current = null;
      connected.current = null;
    };
  });
  return cloneElement(icon, { ref: host.ref });
}
function alertDestination(host: HTMLElement, decoration: HTMLElement | null): GeometryDestination | null {
  if (nativeTextContext(host)) return null;
  const box = naturalGeometry(host);
  const css = getComputedStyle(host);
  if (
    !box ||
    !["auto", "fit-content", "max-content"].includes(host.computedStyleMap?.().get("height")?.toString() ?? "") ||
    css.aspectRatio !== "auto"
  )
    return null;
  const parts = Array.from(host.children).filter((part) => part !== decoration);
  if (parts.length > motionLimits.collectionVisuals) return null;
  let depth = 0;
  for (let ancestor: HTMLElement | null = host; ancestor; ancestor = ancestor.parentElement) {
    if (++depth > motionLimits.collectionVisuals) return null;
    const style = getComputedStyle(ancestor);
    if (
      style.rotate !== "none" ||
      style.perspective !== "none" ||
      style.transform.startsWith("matrix3d") ||
      (style.scale !== "none" && style.scale.split(/\s+/).some((value) => !(Number.parseFloat(value) > 0)))
    )
      return null;
    if (style.transform !== "none") {
      const matrix = new DOMMatrixReadOnly(style.transform);
      if (matrix.b !== 0 || matrix.c !== 0 || matrix.a <= 0 || matrix.d <= 0) return null;
    }
  }
  const family = css.transitionProperty.split(",").map((value) => value.trim());
  const durations = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => ["all", "height"].includes(property) && (durations[index % durations.length] ?? 0) > 0,
    ) ||
    host
      .getAnimations()
      .some((animation) =>
        (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => "height" in frame),
      )
  )
    return null;
  const rect = host.getBoundingClientRect();
  const scale = rect.height / host.offsetHeight;
  if (!Number.isFinite(scale) || scale <= 0) return null;
  // Preserve the destination's visible text, line clamp and action/focus room.
  const required = Math.max(0, ...parts.map((part) => (part.getBoundingClientRect().bottom - rect.top) / scale));
  let max = Number.POSITIVE_INFINITY;
  const parent = host.parentElement;
  if (parent && /^(hidden|clip)$/.test(getComputedStyle(parent).overflowY)) {
    max = (parent.getBoundingClientRect().bottom - rect.top) / scale;
    if (!Number.isFinite(max) || max < box.height) return null;
  }
  return { height: { size: box.height, min: Math.min(box.height, required), max, readable: true, independent: true } };
}

/** Native ancestor editing wins before paint, preserving the existing tree. */
function observeAlertEditing(
  host: HTMLElement,
  controller: ReturnType<typeof createMeasuredGeometry>,
  reveal: () => void,
) {
  let alive = true;
  const settle = () => {
    if (!alive || !host.isConnected || !nativeTextContext(host)) return;
    controller.settle();
    reveal();
  };
  const observer = new MutationObserver(settle);
  let ancestor: HTMLElement | null = host;
  for (let depth = 0; ancestor && depth < motionLimits.collectionVisuals; depth++) {
    observer.observe(ancestor, { attributes: true, attributeFilter: ["contenteditable"] });
    ancestor = ancestor.parentElement;
  }
  const selection = () => {
    const anchor = host.ownerDocument.getSelection()?.anchorNode;
    if (anchor && host.contains(anchor)) settle();
  };
  host.ownerDocument.addEventListener("selectionchange", selection);
  settle();
  return () => {
    alive = false;
    observer.disconnect();
    host.ownerDocument.removeEventListener("selectionchange", selection);
  };
}

/** Unknown palettes commit immediately rather than passing through unreadable paint. */
function safePaint(classes?: string, style?: React.CSSProperties) {
  return (
    !Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    ) &&
    !(classes ?? "")
      .split(/\s+/)
      .some(
        (name) =>
          /(?:^|:)(?:bg-|text-|border-|shadow-)/.test(name) &&
          !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:card|background|muted)|text-(?:foreground|card-foreground|muted-foreground|destructive)|border-(?:b|t|l|r|border)|shadow-sm)$/.test(
            name,
          ),
      )
  );
}

/** Both forms keep the same actual span/Text across primitive changes. */
function AlertDisplay({ value, entity }: { value: string | number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const initial = useRef(String(value));
  const previous = useRef(String(value));
  const textMode = typeof value === "string";
  const text = useTextPresentation(
    node,
    textMode ? value : "",
    cm,
    entity,
    {
      characterStagger: false,
      stripGeometry: true,
      visible: scope?.available(),
      enabled: textMode,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  const number = useNumberPresentation(
    node,
    textMode ? 0 : value,
    cm,
    entity,
    {
      visible: scope?.available(),
      compact: true,
      cause: "independent",
      retainEditedContent: true,
      enabled: !textMode,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  committed(() => {
    previous.current = String(value);
  });
  return textMode ? (
    <span ref={ref} data-slot="alert-text" data-motion={cm.mode}>
      {text}
    </span>
  ) : (
    <span ref={ref} data-slot="alert-number" data-motion={cm.mode}>
      {number}
    </span>
  );
}
export interface AlertTitleProps extends React.ComponentProps<"div"> {}
function AlertTitle({ className, children, ref, ...props }: AlertTitleProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const AlertTitlePaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
    immediate:
      !/(?:^|\s)(?:[\w-]+:)*text-(?:foreground|card-foreground|muted-foreground|destructive)(?:\s|$)/.test(
        className ?? "",
      ) && !props.style?.color,
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <AlertDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      data-slot="alert-title"
      {...props}
      {...AlertTitlePaint}
      data-motion={cm.mode}
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      style={{ ...AlertTitlePaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}
export interface AlertDescriptionProps extends React.ComponentProps<"div"> {}
function AlertDescription({ className, children, ref, ...props }: AlertDescriptionProps) {
  const host = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(host.node);
  const AlertDescriptionPaint = useStateColor(host.ref, cm, ["color"], {
    readability: safePaint(className, props.style) ? "verified" : "immediate",
  });
  const [entity] = useState(() => ({}));
  const display =
    typeof children === "string" || typeof children === "number" ? (
      <AlertDisplay value={children} entity={entity} />
    ) : (
      children
    );
  return (
    <div
      data-slot="alert-description"
      {...props}
      {...AlertDescriptionPaint}
      data-motion={cm.mode}
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className,
      )}
      style={{ ...AlertDescriptionPaint.style, ...props.style }}
    >
      {display}
    </div>
  );
}
export interface AlertActionProps extends React.ComponentProps<"div"> {}

/**
 * The right-aligned slot for one action — a retry, a dismiss, a link. It spans
 * the two grid rows so it stays put when the description wraps onto a second line.
 */
function AlertAction({ className, ...props }: AlertActionProps) {
  return (
    <div
      data-slot="alert-action"
      className={cn("col-start-3 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export { Alert, AlertAction, AlertDescription, AlertTitle, alertVariants };
