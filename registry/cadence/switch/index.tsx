"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import type { HTMLMotionProps } from "motion/react";
import type * as React from "react";
import {
  type Ref,
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
import { createInlineEntrance } from "../lib/inline-entrance";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, stateIndicator } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";

export interface SwitchProps extends SwitchPrimitive.Root.Props {
  /** Track and thumb scale. Upstream's Base UI source ships the same prop. */
  size?: "sm" | "default";
}

type ThumbRenderProps = React.HTMLProps<HTMLSpanElement> & { ref?: Ref<HTMLSpanElement> };

/** `useLayoutEffect` warns on the server; the fallback keeps SSR quiet without a flash on first paint. */
const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};
const sizeAxis = /^(?:width|height)$/;
type Interval = { inner: number; exact: number; safe: number };

/**
 * An on/off control whose thumb travels inside a measured track.
 *
 * Motion contract (`switch`):
 * - Appearance: a later-inserted control owns one opacity entrance with its
 *   already-correct state; a presenting parent (for example an entering field)
 *   owns the entrance instead and never fades twice.
 * - Indicator: the thumb is one writer. It travels to the measured endpoint
 *   with a non-overshooting `state.morph` transition; the first measurement and
 *   every passive resize paint the endpoint immediately, and a rapid toggle
 *   retargets the same host.
 * - Surface colour: the track owns its background, border and focus-ring paint
 *   and the thumb owns its own fill, each through one scoped `state.color`
 *   transaction. Real DOM focus and an unverified caller palette settle that
 *   paint immediately in every mode.
 * - Size: the root shell owns the bounded track box for an explicit `size`
 *   change. It commits its measured destination and remeasures the thumb
 *   endpoint from the same change; passive layout stays native.
 * - Changed text and numbers: not applicable. The switch has no text or numeric
 *   slot, and an external label belongs to its own component.
 *
 * a11y: Base UI renders `role="switch"` plus a hidden input, so Space toggles it
 * and forms submit the value. Colour is never the only signal: the thumb
 * position, `aria-checked`, and the track colour all change together.
 */
function Switch({ className, size = "default", style: callerStyle, ...props }: SwitchProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(props.ref as Ref<HTMLSpanElement> | undefined);
  const cm = useCadenceMotion(node);
  // Caller palettes are unverified; unknown paint settles at its target instead
  // of passing through an unreadable midpoint.
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
    { readability: verifiedChrome(className, callerStyle) ? "verified" : "immediate" },
  );
  const thumbRef = useRef<HTMLSpanElement | null>(null);
  // The thumb is a separate physical host, so it owns its own fill transition
  // instead of borrowing the track's.
  const thumbPaint = useStateColor(thumbRef, cm, ["background-color"], {
    readability: verifiedThumb(className, callerStyle) ? "verified" : "immediate",
  });
  const parent = usePresentationScope();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  /**
   * `null` until the track and thumb have been measured. A checked switch that
   * animated from that position would slide into place on every page load.
   */
  const [travel, setTravel] = useState<number | null>(null);
  /** False until the first measured endpoint has been painted once. */
  const [settled, setSettled] = useState(false);
  /** A passive remeasure paints its endpoint instead of springing to it. */
  const instant = useRef(false);
  const endpoint = useRef<number | null>(null);
  const previousInner = useRef<number | null>(null);
  const revision = useRef("");
  const [geometry] = useState(() => {
    const transaction = createMotionTransaction();
    return { transaction, controller: createMeasuredGeometry(transaction) };
  });
  const connection = useRef<{ host: HTMLElement; release(): void } | null>(null);
  const observed = useRef<{ host: HTMLElement; stop(): void } | null>(null);
  const prepared = useRef("");
  const [, retrigger] = useState(0);
  const publish = (next: number, immediate: boolean) => {
    if (endpoint.current === next) return;
    endpoint.current = next;
    if (immediate) instant.current = true;
    setTravel(next);
  };
  useEffect(() => {
    const host = node.current;
    const form = host?.closest("form");
    if (!form) return;
    // Native restoration is the primitive's own accepted revision: the endpoint
    // it establishes is painted immediately instead of replaying the travel.
    const restored = () => {
      instant.current = true;
      retrigger((value) => value + 1);
    };
    form.addEventListener("reset", restored);
    return () => form.removeEventListener("reset", restored);
  }, [node]);
  useInsertionEffect(() => {
    // Capture the pre-change frame before React writes the new size class.
    const policy = `${size}/${cm.mode}/${cm.timeScale}/${cm.scope.signature}`;
    if (prepared.current !== policy) geometry.controller.prepare();
    prepared.current = policy;
  }, [size, cm.mode, cm.timeScale, cm.scope.signature, geometry]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    // A presenting parent owns this entrance; an unusable, hidden or
    // already-presented host keeps native paint instead of fading a control in
    // use.
    const inherited =
      !visible ||
      Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) ||
      !baseline.available() ||
      baseline.node?.current?.hasAttribute("data-starting-style");
    entrance.current.commit({
      present: true,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !initialHydration.current && baseline.presented && !inherited,
    });
    consumed.current = true;
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind !== "geometry") throw new RangeError("switch root requires geometry.resize/measured");
    if (connection.current?.host !== host) {
      connection.current?.release();
      connection.current = {
        host,
        release: geometry.controller.register({
          host: node,
          content: host,
          // The shell owns both bounded axes of an explicit size revision.
          axes: ["width", "height"],
          observeChildren: true,
          measure: () => switchDestination(host),
        }),
      };
    }
    // Read the committed natural boxes, never an animated frame: the geometry
    // owner has released its overlay before this runs.
    const measured = trackInterval(host, thumbRef.current, previousInner.current);
    const target = JSON.stringify([size, host.dataset.size ?? ""]);
    const revised = revision.current !== "" && revision.current !== target;
    revision.current = target;
    if (measured) {
      const owned = ownedSizeWriter(host);
      if (!settled) publish(measured.exact, false);
      // The track box is still interpolating: frame-by-frame bounds would need a
      // per-frame layout read, so the thumb uses the conservative interval that
      // stays inside the whole transaction. The observer paints the exact
      // endpoint once the owned size writer has arrived.
      else if (revised) publish(measured.safe, false);
      // A render during the owner's own flight is not a new natural width.
      if (!owned) previousInner.current = measured.inner;
    }
    geometry.controller.commit(geometry.transaction.revision("content", target, node), {
      reduced: cm.reduced,
      transition: parameters.transition,
      available: baseline.available(),
    });
    // Consumed by this commit's own thumb writer (a child runs before this).
    instant.current = false;
  });
  committed(() => {
    const host = node.current;
    if (!host || observed.current?.host === host) return;
    observed.current?.stop();
    // A passive font, viewport or caller-layout change is not a content
    // revision: it paints the current endpoint immediately. An owned size
    // writer is excluded so its own frames never feed back as new targets.
    const observer = new ResizeObserver(() => {
      const current = node.current;
      const thumb = thumbRef.current;
      if (!current || !thumb) return;
      const measured = trackInterval(current, thumb, previousInner.current);
      if (!measured) return;
      // The owned overlay holds its last frame at the destination, so an
      // observed box equal to the committed one has arrived even if the writer
      // has not released yet. Other owned frames are never endpoint sources.
      const arrived = previousInner.current !== null && Math.abs(measured.inner - previousInner.current) < 1;
      if (ownedSizeWriter(current) && !arrived) return;
      previousInner.current = measured.inner;
      publish(measured.exact, true);
    });
    observer.observe(host);
    if (thumbRef.current) observer.observe(thumbRef.current);
    observed.current = {
      host,
      stop() {
        observer.disconnect();
      },
    };
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
      connection.current?.release();
      connection.current = null;
      observed.current?.stop();
      observed.current = null;
      geometry.controller.dispose();
    },
    [geometry],
  );
  // The first measured endpoint is painted; only later revisions may animate.
  useEffect(() => {
    if (travel !== null && !settled) setSettled(true);
  }, [travel, settled]);
  const indicator = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
  // This exact preset/form pair always resolves to the indicator shape; a
  // different result would be an invalid binding, not a renderable state.
  if (indicator.kind !== "indicator") throw new RangeError("switch thumb requires state.morph/indicator");
  const position = travel ?? 0;
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={(state) => cn(switchChrome, typeof className === "function" ? className(state) : className)}
      style={
        typeof callerStyle === "function"
          ? (state) => ({ ...paint.style, ...callerStyle(state) })
          : { ...paint.style, ...callerStyle }
      }
    >
      <SwitchPrimitive.Thumb
        render={(thumbProps, state) => {
          // Base UI's default render ref is replaced by the paint owner's ref
          // below; this internal Thumb is never given a caller ref.
          const { className: thumbClassName, ...rest } = thumbProps as ThumbRenderProps;
          return (
            <ControlSpan
              {...(rest as HTMLMotionProps<"span">)}
              {...thumbPaint}
              data-slot="switch-thumb"
              data-motion={cm.mode}
              className={cn(thumbChrome, thumbClassName)}
              target={{ x: state.checked ? position : 0 }}
              // Until the first measurement has been painted there is nothing to
              // animate *between*: jump into place, then spring on user input.
              transition={{ x: settled && !instant.current ? indicator.spatial : { duration: 0 } }}
            />
          );
        }}
      />
    </SwitchPrimitive.Root>
  );
}

/**
 * Upstream layout and native state selectors only. `state.color` owns the paint
 * clock, so the chrome declares no CSS transition of its own; the focus ring is
 * part of that declared paint and settles with it.
 */
const switchChrome =
  "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80";

const thumbChrome =
  "pointer-events-none block rounded-full bg-background ring-0 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground";

const shippedChrome = new Set([
  "border",
  "border-transparent",
  "shadow-xs",
  "focus-visible:border-ring",
  "focus-visible:ring-[3px]",
  "focus-visible:ring-ring/50",
  "data-checked:bg-primary",
  "data-unchecked:bg-input",
  "dark:data-unchecked:bg-input/80",
]);

const shippedThumb = new Set([
  "bg-background",
  "dark:data-checked:bg-primary-foreground",
  "dark:data-unchecked:bg-foreground",
]);

/** Unknown palettes commit at their target rather than through unreadable paint. */
function verifiedChrome(className: SwitchProps["className"], style: SwitchProps["style"]) {
  return verified(className, style, shippedChrome);
}

function verifiedThumb(className: SwitchProps["className"], style: SwitchProps["style"]) {
  return verified(className, style, shippedThumb);
}

function verified(className: SwitchProps["className"], style: SwitchProps["style"], shipped: ReadonlySet<string>) {
  if (typeof className === "function" || typeof style === "function") return false;
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|fill|stroke|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .filter(Boolean)
    .some(
      (name) =>
        // Any variant syntax before the utility counts (`dark:`, `focus-visible:`
        // and arbitrary `data-[state=checked]:` alike); a bracket variant must not
        // slip an unverified palette past the allowlist.
        /(?:^|:)(?:bg|text|border|ring|shadow|fill|stroke|outline|decoration|caret|accent)-/.test(name) &&
        !shipped.has(name),
    );
}

/**
 * The track's committed natural border box. A caller clock, a hidden host or an
 * unusable box keeps native layout instead of fabricating an animatable range.
 */
function switchDestination(host: HTMLElement): GeometryDestination | null {
  if (!host.isConnected) return null;
  const box = naturalGeometry(host);
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!box || !css || !(box.width > 0) || !(box.height > 0)) return null;
  if (css.display === "none" || css.visibility === "hidden") return null;
  if (callerSizeClock(host, css)) return null;
  return {
    width: { size: box.width, min: 0, readable: true, independent: true },
    height: { size: box.height, min: 0, readable: true, independent: true },
  };
}

/** A caller transition or animation on a size axis owns its own clock. */
function callerSizeClock(host: HTMLElement, css: CSSStyleDeclaration) {
  const family = css.transitionProperty.split(",").map((property) => property.trim());
  const times = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => (property === "all" || sizeAxis.test(property)) && (times[index % times.length] ?? 0) > 0,
    )
  )
    return true;
  return (host.getAnimations?.() ?? []).some((handle) =>
    ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) =>
      Object.keys(frame).some((key) => key === "width" || key === "height"),
    ),
  );
}

/**
 * The interval the thumb can occupy. `exact` is the destination; `safe` is the
 * endpoint that also stays valid while the track interpolates to it, because a
 * growing track also grows the thumb in the same commit.
 */
function trackInterval(track: HTMLElement, thumb: HTMLElement | null, previous: number | null): Interval | null {
  if (!thumb) return null;
  const inner = track.clientWidth;
  const width = thumb.offsetWidth;
  if (!(inner > 0) || !(width > 0)) return null;
  return {
    inner,
    exact: Math.max(0, inner - width),
    safe: Math.max(0, Math.min(inner, previous ?? inner) - width),
  };
}

/** The geometry owner's own overlay is not a passive layout cause. */
function ownedSizeWriter(host: HTMLElement) {
  return (host.getAnimations?.() ?? []).some((handle) =>
    ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) =>
      Object.keys(frame).some((key) => key === "width" || key === "height"),
    ),
  );
}

export { Switch };
