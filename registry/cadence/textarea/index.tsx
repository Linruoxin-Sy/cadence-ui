"use client";

import type * as React from "react";
import { type Ref, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createMeasuredGeometry, type GeometryDestination, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryContent, motionLimits } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";

export interface TextareaProps extends React.ComponentProps<"textarea"> {}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A multi-line text field. The native control is the only editor node: typing,
 * composition, selection, IME, pointer resizing and `field-sizing` growth stay
 * the browser's own. Cadence owns the chrome around it — an independent
 * insertion opacity, the surface/foreground state paint, and one explicit
 * block-size revision (`rows` or an authored height) measured once while the
 * editor is unfocused and outside native editing.
 *
 * Invalid state is attribute-driven only (P11): pass `aria-invalid`, and this
 * component renders the destructive border and ring. It never decides whether a
 * value is valid; see [/docs/validation](/docs/validation).
 */
function Textarea({ className, style, rows, ...props }: TextareaProps) {
  const { node, ref } = useMotionHostRef<HTMLTextAreaElement>(props.ref as Ref<HTMLTextAreaElement> | undefined);
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
  const geometryHost = useRef<HTMLTextAreaElement | null>(null);
  const releaseGeometry = useRef<(() => void) | null>(null);
  const revisionTarget = useRef<string | null>(null);
  const lastValue = useRef<string | null>(null);
  const eligible = useRef(false);
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
        // Only the block axis: the parent owns the inline size of `w-full`.
        axes: ["height"],
        // Wrapper-free host: its own shell is the observed, possibly owned box.
        observeChildren: true,
        measure: (reason) => (eligible.current ? textareaBlock(host, reason) : null),
      });
    }
    // An explicit revision is a caller `rows` change or an authored block size.
    // Value updates, wrapping, `field-sizing` growth and pointer resizing never
    // reach this revision, and an edit in the same commit disqualifies it.
    const target = JSON.stringify([host.getAttribute("rows"), authoredHeight(host)]);
    const revised = target !== revisionTarget.current;
    const edited = lastValue.current !== null && lastValue.current !== host.value;
    revisionTarget.current = target;
    lastValue.current = host.value;
    eligible.current = revised && !edited;
    const parameters = cm.parameters(bindMotionParameters(geometryContent, "geometry.resize/measured"));
    if (parameters.kind === "geometry")
      geometry.current?.commit(transaction.revision("content", target, host), {
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
    <textarea
      data-slot="textarea"
      {...props}
      {...paint}
      rows={rows}
      data-motion={cm.mode}
      className={cn(textareaChrome, className)}
      style={{ ...paint.style, ...style }}
    />
  );
}

/**
 * Layout and native state selectors only. `state.color` owns the paint clock, so
 * the chrome declares no CSS transition of its own; focus, invalid and disabled
 * feedback stays native and space-free. `field-sizing-content` keeps growth in
 * the browser.
 */
const textareaChrome =
  "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40";

/** Unknown palettes commit at their target rather than through unreadable paint. */
function verifiedChrome(className: TextareaProps["className"], style: TextareaProps["style"]) {
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
        !/(?:^|:)(?:text-(?:xs|sm|base|lg|xl)|bg-(?:transparent|input\/30)|text-(?:foreground|muted-foreground)|border-(?:input|ring|destructive)|shadow-xs|ring-(?:ring\/50|destructive\/(?:20|40)|\[3px\]))$/.test(
          name,
        ),
    );
}

/**
 * The caller's authored block size, read from the computed (not used) value:
 * `auto`, percentages and `fit-content` keep native layout. A `field-sizing`
 * box therefore only reaches this owner through an explicit px height.
 */
function authoredHeight(host: HTMLTextAreaElement) {
  const typed = host.computedStyleMap?.();
  const declared = (typed?.get("height")?.toString() ?? host.style.getPropertyValue("height")).trim();
  return /^\d+(?:\.\d+)?px$/.test(declared) ? declared : "";
}

/** Only a committed, unfocused, explicitly revised block is interpolated. */
function textareaBlock(host: HTMLTextAreaElement, reason: string): GeometryDestination | null {
  if (reason !== "commit" || !host.isConnected) return null;
  // The focused editor owns its own box: the caret, IME and the selection stay
  // native, and focus acquisition settles any in-flight interpolation.
  if (host.ownerDocument.activeElement === host) return null;
  const box = naturalGeometry(host);
  const css = host.ownerDocument.defaultView?.getComputedStyle(host);
  if (!box || !css) return null;
  // A caller transition or animation on the block axis owns its own clock.
  if (callerBlockClock(host, css)) return null;
  const min = boundedLength(css.minHeight) ?? 0;
  const max = boundedLength(css.maxHeight) ?? Number.POSITIVE_INFINITY;
  if (max < min) return null;
  return {
    height: {
      size: box.height,
      min,
      max,
      // Intermediate heights sit between two native boxes that already hold the
      // current text; a clamped or scrolling box settles at its target instead.
      readable: host.scrollHeight <= Math.ceil(box.height),
      independent: true,
    },
  };
}

function boundedLength(value: string) {
  return /^\d+(?:\.\d+)?px$/.test(value) ? Number.parseFloat(value) : null;
}

/** A caller transition or animation on the block axis owns its own clock. */
function callerBlockClock(host: HTMLTextAreaElement, css: CSSStyleDeclaration) {
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

export { Textarea };
