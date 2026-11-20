"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import type * as React from "react";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "../lib/cn";
import { NativeControlDiv } from "../lib/control-animation";
import { useContinuousMotion, useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createMeasuredGeometry, type GeometryDestination, GeometryScope } from "../lib/measured-geometry";
import { bindMotionParameters, dataProgress, geometryCompact, motionLimits } from "../lib/motion";
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

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
/** One slot name for the whole part: a caller `render` keeps the attribute, while
 * the fill element itself carries the physical host the writer is bound to. */
const INDICATOR_SLOT = "progress-indicator";

/**
 * One committed determinate target for the fill, the formatted value and the
 * label. `null` means the primitive has no measurable percentage: it is
 * indeterminate, not zero.
 */
type Readout =
  | { status: "indeterminate" }
  | { status: "determinate"; fraction: number; numeric: number; formatter: Intl.NumberFormat };

interface ProgressChannel {
  status: Readout["status"];
  fraction: number | null;
  /** The primitive's own clamped numeric value, or `null` when indeterminate. */
  numeric: number | null;
  /** Formatter built from the same value/range/format contract the primitive uses. */
  formatter: Intl.NumberFormat | null;
  transaction: ReturnType<typeof createPresentationScope>["transaction"];
  /** This committed revision moved the fill, so a separate reel phase is unproven. */
  fillJourney: boolean;
  /** A new normalization or an indeterminate boundary settles the fill immediately. */
  fillInstant: boolean;
}

const ProgressContext = createContext<ProgressChannel | null>(null);

export interface ProgressProps extends ProgressPrimitive.Root.Props {}

export interface ProgressTrackProps extends ProgressPrimitive.Track.Props {}

export interface ProgressIndicatorProps extends ProgressPrimitive.Indicator.Props {}

export interface ProgressLabelProps extends ProgressPrimitive.Label.Props {}

export interface ProgressValueProps extends ProgressPrimitive.Value.Props {}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Resolve the primitive's determinate readout from the same inputs it formats:
 * `format` over the clamped value, otherwise a `percent` view of the clamped
 * range. An unavailable range keeps the primitive's final presentation (zero
 * percentage) instead of inventing a negative fill.
 */
function resolveReadout(
  value: number | null | undefined,
  min: number,
  max: number,
  format: ProgressProps["format"],
  locale: ProgressProps["locale"],
): Readout {
  if (value === null || value === undefined || !Number.isFinite(value)) return { status: "indeterminate" };
  const span = Number.isFinite(min) && Number.isFinite(max) && max > min ? max - min : null;
  const percentage = span === null ? 0 : clampNumber(((value - min) / span) * 100, 0, 100);
  const formatter = new Intl.NumberFormat(locale, format ?? { style: "percent" });
  const numeric = format ? clampNumber(value, min, max) : percentage / 100;
  return { status: "determinate", fraction: percentage / 100, numeric, formatter };
}

/**
 * How far a task has come. Pass `value={null}` for work that has no measurable
 * end yet.
 *
 * Motion contract (`progress`):
 * - Appearance: one opacity entrance on the root with its already-correct fill
 *   and value; a presenting parent, a hidden host or SSR keeps native paint.
 * - Determinate value: the fill retargets the same `scaleX` host from its
 *   presented extent with `data.progress`. A range/format change or either side
 *   of the indeterminate boundary settles the fill at its target instead of
 *   sweeping from the old shape.
 * - Changed numbers: `ProgressValue` rolls changed places only when the fill
 *   keeps its presented extent for that revision. A fill retarget settles the
 *   readout immediately; two independent clocks are never claimed as one phase.
 * - Changed text: a plain `ProgressLabel` string replaces changed runs; a direct
 *   numeric label is its own compact quantity, unrelated to the fill.
 * - Surface/text colour: track, label and value each own one scoped paint set.
 *   The indicator hosts the status loop instead, so its own paint stays static.
 * - Status: one theme-clock opacity pulse while indeterminate and visible. It
 *   stops under reduced and none; nothing is invented when determinate.
 * - Size: the root shell measures its final label/value flow before sizing
 *   itself; passive wrapping stays immediate and the track keeps its caller width.
 *
 * a11y: Base UI puts `role="progressbar"`, `aria-valuemin/max/now` on the root
 * and exposes `ProgressLabel` / `ProgressValue` so the number is readable
 * without looking at the bar. The fill is decorative.
 */
function Progress({ className, children, value, min = 0, max = 100, format, locale, ref, ...props }: ProgressProps) {
  const root = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion(root.node);
  const [scope] = useState(() => createPresentationScope(root.node));
  const parent = usePresentationScope();
  const hydration = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydration);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  useEffect(() => {
    if (!parent && root.node.current) documentPresentation(root.node.current.ownerDocument).presented = true;
  }, [parent, root.node]);
  committed(() => {
    const host = root.node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    const inherited =
      !visible ||
      Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      !baseline.available() ||
      baseline.node?.current?.hasAttribute("data-starting-style");
    entrance.current.commit({
      // A hidden host is not presented: it keeps native paint, so a later reveal
      // is the one insertion this owner may animate.
      present: visible,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !initialHydration.current && baseline.presented && !inherited,
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

  // One natural-content measurement for the label/value flow. The track keeps the
  // caller's width and never feeds this observer.
  const parentGeometry = useContext(GeometryScope);
  const [group] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const semantic = useMemo(
    () =>
      JSON.stringify([
        className,
        props.style,
        Children.toArray(children).map((child) =>
          isValidElement<{ children?: React.ReactNode; className?: string; style?: React.CSSProperties }>(child)
            ? [
                child.type === ProgressLabel
                  ? "label"
                  : child.type === ProgressValue
                    ? "value"
                    : child.type === ProgressTrack
                      ? "track"
                      : child.type === ProgressIndicator
                        ? "indicator"
                        : "composed",
                typeof child.props.children === "string" || typeof child.props.children === "number"
                  ? child.props.children
                  : null,
                child.props.className,
                child.props.style,
              ]
            : child,
        ),
      ]),
    [className, props.style, children],
  );
  const prepared = useRef({ semantic, policy: "" });
  useInsertionEffect(() => {
    const policy = JSON.stringify([cm.mode, cm.timeScale, cm.scope.signature]);
    if (prepared.current.semantic !== semantic || prepared.current.policy !== policy) group.controller.prepare();
    prepared.current = { semantic, policy };
  }, [semantic, cm.mode, cm.timeScale, cm.scope.signature, group]);
  const connection = useRef<HTMLElement | null>(null);
  const registration = useRef<(() => void) | null>(null);
  committed(() => {
    const host = root.node.current;
    if (connection.current && connection.current !== host) {
      registration.current?.();
      registration.current = null;
      connection.current = null;
    }
    if (host && !registration.current) {
      registration.current = group.controller.register({
        host: root.node,
        content: host,
        axes: ["height"],
        observeChildren: true,
        textGeometry: true,
        measure: () => progressDestination(host),
      });
      connection.current = host;
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (!host?.isConnected || parameters.kind !== "geometry") return;
    group.controller.commit(group.transaction.revision("content", semantic, root.node), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: scope.available(),
    });
    parentGeometry?.request?.();
  });
  committed(
    () => () => {
      registration.current?.();
      registration.current = null;
      connection.current = null;
      group.controller.settle();
    },
    [group],
  );

  const readout = useMemo(() => resolveReadout(value, min, max, format, locale), [value, min, max, format, locale]);
  const indeterminate = readout.status === "indeterminate";
  const fraction = readout.status === "determinate" ? readout.fraction : null;
  const normalization = JSON.stringify([min, max, format ?? null, locale ?? null]);
  // Commit-time decisions use previously committed semantics, never a layout read
  // during render: a fill that keeps its extent cannot claim a reel phase.
  const previous = useRef({ indeterminate, fraction, normalization, committed: false });
  const crossedIndeterminate = previous.current.committed && previous.current.indeterminate !== indeterminate;
  const normalizationChanged = previous.current.committed && previous.current.normalization !== normalization;
  const fillJourney =
    previous.current.committed &&
    previous.current.fraction !== null &&
    fraction !== null &&
    previous.current.fraction !== fraction;
  useInsertionEffect(() => {
    previous.current = { indeterminate, fraction, normalization, committed: true };
  }, [indeterminate, fraction, normalization]);

  const channel = useMemo<ProgressChannel>(
    () => ({
      status: readout.status,
      fraction,
      numeric: readout.status === "determinate" ? readout.numeric : null,
      formatter: readout.status === "determinate" ? readout.formatter : null,
      transaction: scope.transaction,
      fillJourney,
      fillInstant: indeterminate || crossedIndeterminate || normalizationChanged,
    }),
    [readout, fraction, scope.transaction, fillJourney, indeterminate, crossedIndeterminate, normalizationChanged],
  );

  return (
    <MotionPresentation scope={scope}>
      <GeometryScope.Provider value={group}>
        <ProgressContext.Provider value={channel}>
          <ProgressPrimitive.Root
            data-slot="progress"
            data-motion={cm.mode}
            {...props}
            ref={root.ref}
            value={value}
            min={min}
            max={max}
            format={format}
            locale={locale}
            className={(state) =>
              cn("flex w-full flex-wrap gap-3", typeof className === "function" ? className(state) : className)
            }
          >
            {children}
            <ProgressTrack>
              <ProgressFill />
            </ProgressTrack>
          </ProgressPrimitive.Root>
        </ProgressContext.Provider>
      </GeometryScope.Provider>
    </MotionPresentation>
  );
}

/** The final label/value flow height, measured after children have laid out. */
function progressDestination(host: HTMLElement): GeometryDestination | null {
  const view = host.ownerDocument.defaultView;
  const css = view?.getComputedStyle(host);
  if (css?.aspectRatio !== "auto") return null;
  // Only a content-sized root is measured; a caller-fixed height keeps native layout.
  const own = host.computedStyleMap?.().get("height")?.toString();
  if (!own || !["auto", "fit-content", "max-content"].includes(own)) return null;
  const parts = Array.from(host.children).filter((part): part is HTMLElement => part instanceof HTMLElement);
  if (!parts.length || parts.length > motionLimits.collectionVisuals) return null;
  const rect = host.getBoundingClientRect();
  const scale = rect.height / Math.max(host.offsetHeight, 1);
  if (!Number.isFinite(scale) || scale <= 0) return null;
  const required = Math.max(0, ...parts.map((part) => (part.getBoundingClientRect().bottom - rect.top) / scale));
  const parent = host.parentElement;
  let max = Number.POSITIVE_INFINITY;
  if (parent && /^(hidden|clip)$/.test(view?.getComputedStyle(parent).overflowY ?? "")) {
    max = (parent.getBoundingClientRect().bottom - rect.top) / scale;
    if (!Number.isFinite(max) || max < required) return null;
  }
  return { height: { size: required, min: required, max, readable: true, independent: true } };
}

/** Any caller palette utility or paint declaration makes interpolation unverifiable. */
function verifiedPalette(className: unknown, style: unknown) {
  if (typeof className === "function" || typeof style === "function") return false;
  if (
    Object.keys((style as Record<string, unknown> | undefined) ?? {}).some((key) =>
      /color|background|shadow|fill|stroke|opacity|filter|blend|gradient|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .filter(Boolean)
    .some((name) =>
      /(?:^|:)(?:bg|text|border|ring|shadow|fill|stroke|outline|decoration|caret|accent|from|via|to)-/.test(name),
    );
}

function ProgressTrack({ className, style, ref, ...props }: ProgressTrackProps) {
  const track = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion();
  const paint = useStateColor(track.ref, cm, ["background-color"], {
    readability: verifiedPalette(className, style) ? "verified" : "immediate",
  });
  return (
    <ProgressPrimitive.Track
      {...props}
      {...paint}
      data-slot="progress-track"
      className={(state) =>
        cn(
          "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-primary/20",
          typeof className === "function" ? className(state) : className,
        )
      }
      style={(state) => ({ ...paint.style, ...(typeof style === "function" ? style(state) : style) })}
    />
  );
}

/**
 * The visual fill: one transform writer on the primitive's indicator element
 * and, while indeterminate, one theme-clock opacity owner. The auto-rendered bar
 * and an explicitly composed `ProgressIndicator` both render this private part,
 * so one implementation serves both integration paths.
 */
function ProgressFill({ className, style, ref, ...props }: ProgressIndicatorProps) {
  const fill = useMotionHostRef<HTMLDivElement>(ref);
  const cm = useCadenceMotion();
  const channel = useContext(ProgressContext);
  const fraction = channel?.fraction ?? null;
  const indeterminate = channel?.status === "indeterminate";
  // One theme-clock opacity owner, only while indeterminate and visible.
  const pulse = useContinuousMotion(fill.ref, cm, "pulse", indeterminate);
  const parameters = cm.parameters(bindMotionParameters(dataProgress, "data.transition/determinate"), {
    timeScale: channel?.fillInstant ? 0 : cm.timeScale,
  });
  if (parameters.kind !== "progress") throw new RangeError("data.progress must resolve to a progress clock");
  return (
    <ProgressPrimitive.Indicator
      ref={pulse.ref}
      data-slot={INDICATOR_SLOT}
      data-motion={cm.mode}
      // Base UI writes `width: <value>%`; the fill is driven by a transform instead,
      // so the element keeps the full track width and only its scale changes.
      style={(state) => ({ width: "100%", ...(typeof style === "function" ? style(state) : style) })}
      className={className}
      render={(indicatorProps) => {
        const {
          className: partClassName,
          style: partStyle,
          ...rest
        } = indicatorProps as React.HTMLProps<HTMLDivElement>;
        return (
          <NativeControlDiv
            {...rest}
            {...pulse}
            data-slot="progress-indicator"
            className={cn("h-full w-full origin-left bg-primary", partClassName)}
            style={{ width: "100%", ...pulse.style, ...partStyle }}
            target={{ scaleX: fraction ?? 1 }}
            transition={parameters.transition}
          />
        );
      }}
      {...props}
    />
  );
}

function ProgressIndicator({ className, style, ref, ...props }: ProgressIndicatorProps) {
  return <ProgressFill className={className} style={style} ref={ref} {...props} />;
}

function ProgressLabel({ className, style, children, ref, ...props }: ProgressLabelProps) {
  const label = useMotionHostRef<HTMLSpanElement>(ref);
  const { node, ref: textRef } = useMotionHostRef<HTMLSpanElement>(undefined);
  const cm = useCadenceMotion();
  const channel = useContext(ProgressContext);
  const [entity] = useState(() => ({ label: {} }));
  const text = typeof children === "string" ? children : "";
  const shown = useTextPresentation(
    node,
    text,
    cm,
    entity,
    { characterStagger: false, enabled: typeof children === "string" },
    channel?.transaction,
  );
  const paint = useStateColor(label.ref, cm, ["color"], {
    readability: verifiedPalette(className, style) ? "verified" : "immediate",
  });
  const quantity = typeof children === "number" && Number.isFinite(children);
  return (
    <ProgressPrimitive.Label
      {...props}
      {...paint}
      data-slot="progress-label"
      className={(state) => cn("text-sm font-medium", typeof className === "function" ? className(state) : className)}
      style={(state) => ({ ...paint.style, ...(typeof style === "function" ? style(state) : style) })}
    >
      {typeof children === "string" ? (
        <span ref={textRef} data-motion={cm.mode} data-slot="progress-label-text">
          {shown}
        </span>
      ) : quantity ? (
        <ProgressLabelQuantity value={children} />
      ) : (
        children
      )}
    </ProgressPrimitive.Label>
  );
}

/** A direct numeric label quantity: its own compact reel, never the fill's value. */
function ProgressLabelQuantity({ value }: { value: number }) {
  const cm = useCadenceMotion();
  const channel = useContext(ProgressContext);
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(undefined);
  const [entity] = useState(() => ({ quantity: {} }));
  const shown = useNumberPresentation(
    node,
    value,
    cm,
    entity,
    { cause: "independent", compact: true, initialText: String(value) },
    channel?.transaction,
  );
  return (
    <span ref={ref} data-motion={cm.mode} data-slot="progress-label-number">
      {shown}
    </span>
  );
}

function ProgressValue({ className, style, children, ref, ...props }: ProgressValueProps) {
  const value = useMotionHostRef<HTMLSpanElement>(ref);
  const cm = useCadenceMotion();
  const paint = useStateColor(value.ref, cm, ["color"], {
    readability: verifiedPalette(className, style) ? "verified" : "immediate",
  });
  const composed = typeof children === "function";
  return (
    <ProgressPrimitive.Value
      {...props}
      className={(state) =>
        cn("text-sm text-muted-foreground tabular-nums", typeof className === "function" ? className(state) : className)
      }
      style={(state) => ({ ...paint.style, ...(typeof style === "function" ? style(state) : style) })}
      render={(partProps) => {
        const {
          children: partChildren,
          className: partClassName,
          style: partStyle,
          ref: _partRef,
          ...rest
        } = partProps as React.ComponentProps<"span">;
        return (
          <span
            {...rest}
            {...paint}
            data-motion={cm.mode}
            data-slot="progress-value"
            className={partClassName}
            style={{ ...paint.style, ...partStyle }}
          >
            {composed ? partChildren : <ProgressValueNumber fallback={partChildren} />}
          </span>
        );
      }}
    />
  );
}

/**
 * The formatted determinate value on its own numeric host. `fallback` is whatever
 * the primitive produced for an indeterminate status or a rich callback.
 */
function ProgressValueNumber({ fallback }: { fallback: React.ReactNode }) {
  const cm = useCadenceMotion();
  const channel = useContext(ProgressContext);
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(undefined);
  const [entity] = useState(() => ({ readout: {} }));
  const formatter = channel?.formatter ?? null;
  const numeric = channel?.numeric;
  const listable = formatter !== null && typeof numeric === "number";
  const display = listable ? { kind: "intl" as const, formatter } : undefined;
  const initialText = listable ? formatter.format(numeric) : "";
  const shown = useNumberPresentation(
    node,
    listable ? numeric : 0,
    cm,
    entity,
    {
      cause: "independent",
      compact: true,
      display,
      initialText,
      externalGeometry: channel?.fillJourney,
      enabled: listable,
    },
    channel?.transaction,
  );
  if (!listable) return fallback;
  return (
    <span ref={ref} data-motion={cm.mode} data-slot="progress-value-text">
      {shown}
    </span>
  );
}

export { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue };
