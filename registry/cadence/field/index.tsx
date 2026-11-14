// biome-ignore-all lint/a11y/useSemanticElements: Field is a div with role="group" because a fieldset cannot be collapsed per orientation, and the group is the unit both label layouts are built from.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, useIsPresent, usePresence } from "motion/react";
import type * as React from "react";
import {
  Children,
  isValidElement,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createInlinePresence } from "../lib/inline-presence";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryContent, motionLimits } from "../lib/motion";
import {
  createPresentationScope,
  documentPresentation,
  MotionPresentation,
  usePresentationScope,
} from "../lib/motion-presence";
import { type MotionHostRef, useMotionHostRef } from "../lib/motion-ref";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";
import { Separator } from "../separator";

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
type Scope = ReturnType<typeof createPresentationScope>;

/** Only a plain value has one independent display owner; rich children keep theirs. */
const plain = (children: React.ReactNode): children is string | number =>
  typeof children === "string" || typeof children === "number";

function shown(host: HTMLElement) {
  return host.checkVisibility
    ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
    : host.getClientRects().length > 0;
}

/** A presenting ancestor, a hidden host or an unavailable scope owns the entrance. */
function inherited(host: HTMLElement, baseline: Scope) {
  return (
    !shown(host) ||
    Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) ||
    !baseline.available() ||
    Boolean(baseline.node?.current?.hasAttribute("data-starting-style"))
  );
}

/** Structure owns independent insertion only; a presenting ancestor consumes it. */
function useStructureEntrance(node: MotionHostRef<HTMLElement>, cm: CadenceMotion) {
  const parent = usePresentationScope();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    const inheritedEntry = inherited(host, baseline);
    entrance.current.commit({
      present: true,
      cm: inheritedEntry ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && baseline.presented && !inheritedEntry,
    });
    consumed.current = true;
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
    },
    [],
  );
}

/** One message row: a later insertion fades in, and a retained removal fades out
 * before its caller-owned exit completion removes it. */
function useMessageRow(node: MotionHostRef<HTMLElement>, cm: CadenceMotion) {
  const parent = usePresentationScope();
  const [present, remove] = usePresence();
  const delivery = useRef({ ready: false, pending: false, present, complete: remove });
  useInsertionEffect(() => {
    Object.assign(delivery.current, { ready: false, present, complete: remove });
  });
  useEffect(() => {
    const entry = delivery.current;
    entry.ready = true;
    // A zero-clock layout completion precedes the parent's presence bookkeeping.
    if (entry.pending && !entry.present) entry.complete?.();
    entry.pending = false;
  });
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const firstHydration = useRef(hydrated);
  const consumed = useRef(false);
  const lifecycle = useRef<ReturnType<typeof createInlinePresence> | null>(null);
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (!lifecycle.current) lifecycle.current = createInlinePresence(host, parent?.transaction);
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    const inheritedEntry = !present || inherited(host, baseline);
    lifecycle.current.commit({
      present,
      cm: inheritedEntry ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !firstHydration.current && baseline.presented && !inheritedEntry,
      complete: () => {
        const entry = delivery.current;
        if (entry.present) return;
        if (entry.ready) entry.complete?.();
        else entry.pending = true;
      },
    });
    consumed.current = true;
  });
  committed(
    () => () => {
      lifecycle.current?.dispose();
      lifecycle.current = null;
    },
    [],
  );
  return present;
}

/** An authored invalid state or empty helper makes this foreground unreadable. */
function fieldReadable(host: Element) {
  const region = host.closest('[data-slot="field"],[data-slot="field-set"],[data-slot="field-group"]');
  if (!region) return true;
  if (region.matches('[data-invalid]:not([data-invalid="false"])')) return false;
  return !region.querySelector('[aria-invalid="true"],[data-invalid]:not([data-invalid="false"])');
}

/** The field region whose focus-within and invalid state settle this owner's paint. */
function fieldRegion(host: Element) {
  return host.closest('[data-slot="field"],[data-slot="field-set"],[data-slot="field-group"]');
}

export interface FieldSetProps extends React.ComponentProps<"fieldset"> {}

function FieldSet({ className, children, ...props }: FieldSetProps) {
  const { node, ref } = useMotionHostRef<HTMLFieldSetElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [scope] = useState(() => createPresentationScope(node));
  useStructureEntrance(node, cm);
  return (
    <MotionPresentation scope={scope}>
      <fieldset
        data-slot="field-set"
        {...props}
        ref={ref}
        data-motion={cm.mode}
        className={cn(
          "flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
          className,
        )}
      >
        {children}
      </fieldset>
    </MotionPresentation>
  );
}

export interface FieldLegendProps extends React.ComponentProps<"legend"> {
  /** `label` renders at control-label size for a fieldset that groups one row. */
  variant?: "legend" | "label";
}

function FieldLegend({ className, style, variant = "legend", children, ...props }: FieldLegendProps) {
  const { node, ref } = useMotionHostRef<HTMLLegendElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: fieldReadable,
    readabilityScope: fieldRegion,
  });
  const [entity] = useState(() => ({}));
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn("mb-3 font-medium data-[variant=legend]:text-base data-[variant=label]:text-sm", className)}
      style={{ ...paint.style, ...style }}
    >
      {plain(children) ? <FieldDisplay value={children} entity={entity} /> : children}
    </legend>
  );
}

export interface FieldGroupProps extends React.ComponentProps<"div"> {}

/** A container query root, so `orientation="responsive"` can answer to the group's width. */
function FieldGroup({ className, children, ...props }: FieldGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [scope] = useState(() => createPresentationScope(node));
  useStructureEntrance(node, cm);
  return (
    <MotionPresentation scope={scope}>
      <div
        data-slot="field-group"
        {...props}
        ref={ref}
        data-motion={cm.mode}
        className={cn(
          "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
          className,
        )}
      >
        {children}
      </div>
    </MotionPresentation>
  );
}

const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
      horizontal:
        "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface FieldProps extends React.ComponentProps<"div">, VariantProps<typeof fieldVariants> {}

/**
 * One control and everything that belongs to it: label, description, error.
 *
 * The field renders state, it never decides it. `data-invalid` (and the
 * `aria-invalid` you put on the control) turns the text destructive; the rules
 * that made the value invalid live in the caller.
 *
 * Motion: one independent entrance when the field is inserted later. A
 * `FieldGroup` or `FieldSet` that is already presenting consumes it, so a
 * structure never fades in twice.
 */
function Field({ className, orientation = "vertical", children, ...props }: FieldProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const [scope] = useState(() => createPresentationScope(node));
  useStructureEntrance(node, cm);
  return (
    <MotionPresentation scope={scope}>
      <div
        role="group"
        data-slot="field"
        data-orientation={orientation}
        {...props}
        ref={ref}
        data-motion={cm.mode}
        className={cn(fieldVariants({ orientation }), className)}
      >
        {children}
      </div>
    </MotionPresentation>
  );
}

export interface FieldContentProps extends React.ComponentProps<"div"> {}

/**
 * The message and geometry region. It owns one measured block height for the
 * description/error rows it contains, yields that block to a focused editor and
 * to any caller clock, and keeps an exiting message row mounted while it fades.
 */
function FieldContent({ className, children, ...props }: FieldContentProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const parent = usePresentationScope();
  const present = useIsPresent();
  const [fallback] = useState(() => createPresentationScope(node));
  const scope = parent ?? fallback;
  const [geometry] = useState(() => createMeasuredGeometry(scope.transaction));
  const registered = useRef<HTMLDivElement | null>(null);
  const release = useRef<(() => void) | null>(null);
  const signature = useRef("");
  committed(() => {
    const host = node.current;
    if (!host) return;
    if (registered.current !== host) {
      release.current?.();
      release.current = geometry.register({
        host: node,
        content: host,
        // The inline size is parent-owned; only the message-driven block extent
        // is this region's business.
        axes: ["height"],
        observeChildren: true,
        measure: (reason) => contentGeometry(host, reason),
      });
      registered.current = host;
      signature.current = "";
    }
    const next = JSON.stringify([
      present,
      host.children.length,
      [...host.querySelectorAll('[data-slot="field-description"],[data-slot="field-error"]')].map(
        (row) => row.textContent,
      ),
    ]);
    signature.current = next;
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") return;
    const available = present && scope.available() && host.childElementCount + 1 <= motionLimits.collectionVisuals;
    geometry.commit(scope.transaction.revision("content", next, host), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available,
    });
  });
  committed(
    () => () => {
      release.current?.();
      release.current = null;
      registered.current = null;
      geometry.dispose();
    },
    [geometry],
  );
  return (
    <div
      data-slot="field-content"
      {...props}
      ref={ref}
      data-motion={cm.mode}
      className={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)}
    >
      {rows(children)}
    </div>
  );
}

/**
 * A message row keeps its own exit retention scope; every other child stays in
 * order. The row kind is the identity, because Field supplies no message id and
 * array position would move an unrelated row onto a retired exit.
 */
function rows(children: React.ReactNode) {
  const seen = new Map<string, number>();
  return Children.map(children, (child) => {
    if (!isValidElement(child) || (child.type !== FieldError && child.type !== FieldDescription)) return child;
    const kind = child.type === FieldError ? "error" : "description";
    const occurrence = seen.get(kind) ?? 0;
    seen.set(kind, occurrence + 1);
    return (
      <AnimatePresence initial={false} key={`${kind}-${occurrence}`}>
        {child}
      </AnimatePresence>
    );
  });
}

export interface FieldLabelProps extends React.ComponentProps<"label"> {}

/**
 * A native `label`, so clicking it focuses the control it names and screen
 * readers announce that name. The extra selectors let a `Field` that contains a
 * whole choice card lay itself out as that card's surface.
 *
 * The label owns its foreground and its changed name once. Composing `Label`
 * here would rewrite the label's own slot, and the field would then carry two
 * foreground owners on one node for every state change.
 */
function FieldLabel({ className, style, children, ...props }: FieldLabelProps) {
  const { node, ref } = useMotionHostRef<HTMLLabelElement>(props.ref);
  const cm = useCadenceMotion(node);
  // One owner for the label's paint: the authored choice-card surface and the
  // foreground settle together, so an invalid field never shows mixed paint.
  const paint = useStateColor(ref, cm, ["background-color", "color"], {
    readability: "verified",
    readabilityGate: fieldReadable,
    readabilityScope: fieldRegion,
  });
  const [entity] = useState(() => ({}));
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the caller supplies htmlFor or wraps its control.
    <label
      data-slot="field-label"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "group/field-label peer/field-label flex w-fit items-center gap-2 text-sm leading-snug font-medium select-none",
        "group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10",
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {plain(children) ? <FieldDisplay value={children} entity={entity} /> : children}
    </label>
  );
}

export interface FieldTitleProps extends React.ComponentProps<"div"> {}

/** A label-weight text for content that is not tied to a control (a group title, a value). */
function FieldTitle({ className, style, children, ...props }: FieldTitleProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: fieldReadable,
    readabilityScope: fieldRegion,
  });
  const [entity] = useState(() => ({}));
  return (
    <div
      data-slot="field-label"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {plain(children) ? <FieldDisplay value={children} entity={entity} /> : children}
    </div>
  );
}

export interface FieldDescriptionProps extends React.ComponentProps<"p"> {}

function FieldDescription({ className, style, children, ...props }: FieldDescriptionProps) {
  const { node, ref } = useMotionHostRef<HTMLParagraphElement>(props.ref);
  const cm = useCadenceMotion(node);
  const present = useMessageRow(node, cm);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: fieldReadable,
    readabilityScope: fieldRegion,
  });
  const [entity] = useState(() => ({}));
  return (
    <p
      data-slot="field-description"
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      {plain(children) ? <FieldDisplay value={children} entity={entity} /> : children}
    </p>
  );
}

export interface FieldSeparatorProps extends React.ComponentProps<"div"> {
  /** Optional centred text — "or", "advanced" — rendered on the rule. */
  children?: React.ReactNode;
  /**
   * The composed rule's own length and paint. The wrapper keeps the layout box,
   * so this is the only way to author the rule itself — the caption masks it.
   */
  ruleStyle?: React.CSSProperties;
}

const rule = "absolute inset-0 top-1/2";

function FieldSeparator({ children, className, ruleStyle, ...props }: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      {...props}
      className={cn("relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2", className)}
    >
      <Separator className={rule} style={ruleStyle} />
      {children && <FieldCaption>{children}</FieldCaption>}
    </div>
  );
}

/** Display-only caption: it masks the rule, and its muted foreground follows the theme natively. */
function FieldCaption({ children }: { children: React.ReactNode }) {
  const [entity] = useState(() => ({}));
  return (
    <span
      data-slot="field-separator-content"
      className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
    >
      {plain(children) ? <FieldDisplay value={children} entity={entity} /> : children}
    </span>
  );
}

export interface FieldErrorProps extends React.ComponentProps<"div"> {
  /**
   * Messages the caller already decided are errors. Rendered, deduplicated, and
   * listed — never produced. Passing rules or a schema here is out of scope (P11).
   */
  errors?: Array<{ message?: string } | undefined>;
}

/**
 * The error slot. It renders `null` when it has nothing to say, so a caller can
 * keep it mounted and let the message arrive later.
 *
 * a11y: `role="alert"` announces the message when it appears. Pair it with
 * `aria-invalid` on the control and `aria-describedby` pointing at this element's
 * id: colour alone is not a signal.
 *
 * Motion: a row inserted later fades in; a row retained by `AnimatePresence`
 * fades out before its caller-owned completion removes it. A retained slot whose
 * `errors` array becomes empty still commits its removal immediately.
 */
function FieldError({ className, style, children, errors, ...props }: FieldErrorProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref);
  const cm = useCadenceMotion(node);
  const present = useMessageRow(node, cm);
  const paint = useStateColor(ref, cm, ["color"], {
    readability: "verified",
    readabilityGate: fieldReadable,
    readabilityScope: fieldRegion,
  });
  const [entity] = useState(() => ({}));

  let content: React.ReactNode = children;

  if (!content && errors?.length) {
    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    content =
      uniqueErrors.length === 1 ? (
        uniqueErrors[0]?.message
      ) : (
        <ul className="ml-4 flex list-disc flex-col gap-1">
          {uniqueErrors.map((error) => (error?.message ? <li key={error.message}>{error.message}</li> : null))}
        </ul>
      );
  }

  if (!content) {
    return null;
  }

  const value = content;
  return (
    <div
      role="alert"
      data-slot="field-error"
      {...props}
      {...paint}
      data-motion={cm.mode}
      data-ending-style={present ? undefined : ""}
      inert={!present || props.inert || undefined}
      aria-hidden={present ? props["aria-hidden"] : true}
      className={cn("text-sm font-normal text-destructive", className)}
      style={{ ...paint.style, ...style }}
    >
      {plain(value) ? <FieldDisplay value={value} entity={entity} /> : value}
    </div>
  );
}

/** Both display forms keep one physical host across a primitive change. */
function FieldDisplay({ value, entity }: { value: string | number; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const scope = usePresentationScope();
  const initial = useRef(String(value));
  const previous = useRef(String(value));
  const text = typeof value === "string";
  const label = useTextPresentation(
    node,
    text ? value : "",
    cm,
    entity,
    {
      characterStagger: false,
      stripGeometry: true,
      visible: scope?.available() ?? true,
      enabled: text,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  const number = useNumberPresentation(
    node,
    text ? 0 : value,
    cm,
    entity,
    {
      visible: scope?.available() ?? true,
      compact: true,
      cause: "independent",
      retainEditedContent: true,
      enabled: !text,
      initialText: initial.current,
      nativeBaseline: previous.current,
    },
    scope?.transaction,
  );
  committed(() => {
    previous.current = String(value);
  });
  return text ? (
    <span ref={ref} data-slot="field-text" data-motion={cm.mode}>
      {label}
    </span>
  ) : (
    <span ref={ref} data-slot="field-number" data-motion={cm.mode}>
      {number}
    </span>
  );
}

/** Only a committed, caller-clock-free block is interpolated, and only when readable. */
function contentGeometry(host: HTMLElement, reason: string): GeometryDestination | null {
  if (reason !== "commit" || !host.isConnected) return null;
  const box = naturalGeometry(host);
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!box || !css) return null;
  if (callerHeightClock(host, css)) return null;
  const min = boundedLength(css.minHeight) ?? 0;
  const max = boundedLength(css.maxHeight) ?? Number.POSITIVE_INFINITY;
  if (max < min) return null;
  return {
    height: {
      size: box.height,
      min,
      max,
      // Clipped growth would hide copy; settle at the native destination instead.
      readable: host.scrollHeight <= Math.ceil(box.height) + 1,
      independent: true,
    },
  };
}

function boundedLength(value: string) {
  return /^\d+(?:\.\d+)?px$/.test(value) ? Number.parseFloat(value) : null;
}

/** A caller transition or animation on the block axis owns its own clock. */
function callerHeightClock(host: HTMLElement, css: CSSStyleDeclaration) {
  const family = css.transitionProperty.split(",").map((property) => property.trim());
  const times = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => (property === "all" || property === "height") && (times[index % times.length] ?? 0) > 0,
    )
  )
    return true;
  return (host.getAnimations?.() ?? [])
    .slice(0, motionLimits.collectionVisuals)
    .some((handle) =>
      ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) => "height" in frame),
    );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  fieldVariants,
};
