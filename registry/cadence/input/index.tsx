"use client";

import { Input as InputPrimitive } from "@base-ui/react/input";
import { type Ref, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact, motionLimits } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";

export interface InputProps extends InputPrimitive.Props {}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A single-line text field. The native control is the only editor node: the
 * browser owns typing, selection, autofill, composition and the value. Cadence
 * only owns the chrome around it — an independent insertion opacity, the
 * surface/foreground state paint, and an explicitly authored box change that is
 * measured once and never while the field is focused.
 *
 * Invalid state is attribute-driven only (P11): pass `aria-invalid`, and this
 * component renders the destructive border and ring. It never decides whether a
 * value is valid; see [/docs/validation](/docs/validation).
 *
 * Base UI's input is field-aware, so it picks up `Field` context (label ids,
 * described-by wiring) when it is rendered inside one.
 */
function Input({ className, type, style, render, ...props }: InputProps) {
  const { node, ref } = useMotionHostRef<HTMLInputElement>(props.ref as Ref<HTMLInputElement> | undefined);
  const cm = useCadenceMotion(node);
  // Caller palettes are unverified; unknown paint settles at its target instead
  // of passing through an unreadable midpoint.
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
    { readability: verifiedChrome(className, style) ? "verified" : "immediate" },
  );
  const parent = usePresentationScope();
  const [transaction] = useState(createMotionTransaction);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  const geometry = useRef<ReturnType<typeof createMeasuredGeometry> | null>(null);
  const geometryHost = useRef<HTMLInputElement | null>(null);
  const releaseGeometry = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!parent && node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [parent, node]);
  committed(() => {
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    // A presenting parent owns this entrance; an unusable or hidden host keeps
    // native paint instead of fading an already-visible control.
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
    if (geometryHost.current !== host) {
      releaseGeometry.current?.();
      releaseGeometry.current = null;
      geometry.current?.dispose();
      geometry.current = createMeasuredGeometry(transaction);
      geometryHost.current = host;
      releaseGeometry.current = geometry.current.register({
        host: node,
        content: host,
        axes: ["width", "height"],
        // Wrapper-free host: its own shell is the observed, possibly owned box.
        observeChildren: true,
        measure: (reason) => inputGeometry(host, reason),
      });
    }
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind === "geometry")
      geometry.current?.commit(transaction.revision("content", JSON.stringify([host.style.width, host.style.height])), {
        reduced: cm.reduced,
        transition: parameters.transition,
        available: baseline.available(),
      });
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
      releaseGeometry.current?.();
      releaseGeometry.current = null;
      geometry.current?.dispose();
      geometry.current = null;
      geometryHost.current = null;
    },
    [],
  );
  return (
    <InputPrimitive
      data-slot="input"
      {...props}
      {...paint}
      type={type}
      // The native element is the editor and the only presentation host; naming
      // it explicitly keeps that true for a caller-supplied `render` too.
      render={render ?? <input />}
      data-motion={cm.mode}
      className={
        typeof className === "function" ? (state) => cn(inputChrome, className(state)) : cn(inputChrome, className)
      }
      style={
        typeof style === "function" ? (state) => ({ ...paint.style, ...style(state) }) : { ...paint.style, ...style }
      }
    />
  );
}

/**
 * Layout and native state selectors only. `state.color` owns the paint clock, so
 * the chrome declares no CSS transition of its own; focus, invalid and disabled
 * feedback stays native and space-free.
 */
const inputChrome =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40";

/** Unknown palettes commit at their target rather than through unreadable paint. */
function verifiedChrome(className: InputProps["className"], style: InputProps["style"]) {
  if (typeof className === "function" || typeof style === "function") return false;
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|opacity|filter|blend|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .some(
      (name) =>
        /(?:^|:)(?:bg-|text-|border-|shadow-|ring-)/.test(name) &&
        !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:transparent|input\/30)|text-(?:foreground|muted-foreground|primary-foreground)|border-(?:input|ring|destructive)|shadow-xs|ring-(?:ring\/50|destructive\/(?:20|40)|\[3px\]))$/.test(
          name,
        ),
    );
}

/**
 * Only a caller-authored absolute box is an owned size. Focus, typing,
 * composition, selection and pointer work reach this adapter as `focus`, and
 * passive parent/font reflow as `passive`; both keep the native border box. A
 * percentage, `auto`, fit/content or parent-derived axis is never interpolated,
 * because the aspect tree and the available width already own it.
 */
function inputGeometry(host: HTMLInputElement, reason: string): GeometryDestination | null {
  if (reason !== "commit" || !host.isConnected) return null;
  const box = naturalGeometry(host);
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!box || !css) return null;
  const typed = host.computedStyleMap?.();
  const destination: GeometryDestination = {};
  for (const axis of ["width", "height"] as const) {
    const declared = (typed?.get(axis)?.toString() ?? host.style.getPropertyValue(axis)).trim();
    if (!/^\d+(?:\.\d+)?px$/.test(declared)) continue;
    if (callerBoxClock(host, css, axis)) continue;
    const parent = host.parentElement ? naturalGeometry(host.parentElement) : null;
    const available = parent ? parent[axis] : Number.POSITIVE_INFINITY;
    destination[axis] = {
      size: box[axis],
      min: 0,
      max: Math.max(0, available),
      readable: true,
      independent: true,
    };
  }
  return Object.keys(destination).length ? destination : null;
}

/** A caller transition or animation on the same axis owns its own clock. */
function callerBoxClock(host: HTMLInputElement, css: CSSStyleDeclaration, axis: "width" | "height") {
  const family = css.transitionProperty.split(",").map((property) => property.trim());
  const times = css.transitionDuration.split(",").map(Number.parseFloat);
  if (
    family.some(
      (property, index) => (property === "all" || property === axis) && (times[index % times.length] ?? 0) > 0,
    )
  )
    return true;
  return (host.getAnimations?.() ?? [])
    .slice(0, motionLimits.collectionVisuals)
    .some((handle) => ((handle.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some((frame) => axis in frame));
}

export { Input };
