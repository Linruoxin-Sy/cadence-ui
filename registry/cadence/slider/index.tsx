"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import type * as React from "react";
import { type Ref, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { bindMotionParameters, feedbackPress } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { type CadenceMotion, useCadenceMotion } from "../lib/provider";

export interface SliderProps<Value extends number | readonly number[] = number | readonly number[]>
  extends SliderPrimitive.Root.Props<Value> {}

type ThumbLayerProps = React.HTMLProps<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  cm: CadenceMotion;
  /** Base UI's accepted drag state for this thumb; the value stays authoritative. */
  dragging: boolean;
  disabled: boolean;
  verified: boolean;
  /** The control's own invalid state, resolved on the root for every owner. */
  invalid: boolean;
};

/** `useLayoutEffect` warns on the server; the fallback keeps SSR quiet without a flash on first paint. */
const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A value picked by dragging a thumb along a track. One thumb for a value, two
 * for a range.
 *
 * Motion contract (`slider`):
 * - Appearance: a later-inserted slider owns one opacity entrance on its root
 *   with already-correct value geometry; a presenting parent owns it instead.
 * - Position: Base UI owns thumb, range and indicator geometry. Pointer and
 *   keyboard input are presented immediately, and a programmatic value already
 *   uses that same immediate native placement: there is no verified
 *   single-owner adapter that could retarget a discrete value without a second
 *   writer, so `state.morph` is not claimed here.
 * - Thumb press: the decorative face owns `scale.press`; the native thumb keeps
 *   its coordinate box, hit area and focus ring unscaled.
 * - Surface colour: the track, the range, the thumb ring and the thumb face each
 *   own one scoped `state.color` paint set. Real DOM focus settles the owning
 *   part's declared paint immediately in every mode, and an unverified caller
 *   palette does the same.
 * - Size: the caller owns track length; passive layout is native. There is no
 *   measured content shell.
 * - Changed text and numbers: not owned here. An external label or numeric
 *   readout is caller composition and the stock control adds no tooltip.
 *
 * a11y: Base UI renders a native `input[type=range]` inside every thumb, so the
 * slider is keyboard-reachable and arrow keys step the value. `aria-label` is
 * forwarded to each thumb with a distinct suffix — a range slider with two thumbs
 * and one shared name reads as two controls with the same name. Invalid state
 * comes from `aria-invalid`; the component does not validate (P11).
 */
function Slider<Value extends number | readonly number[] = number | readonly number[]>({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  orientation = "horizontal",
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SliderProps<Value>) {
  const root = useMotionHostRef<HTMLDivElement>(props.ref as Ref<HTMLDivElement> | undefined);
  const cm = useCadenceMotion(root.node);
  // Caller palettes are unverified; unknown paint settles at its target instead
  // of passing through an unreadable midpoint.
  const verified = verifiedPalette(className, props.style);
  const invalid = isInvalid(props);
  const track = useMotionHostRef<HTMLDivElement>();
  const trackPaint = useStateColor(track.ref, cm, ["background-color"], {
    readability: verified ? "verified" : "immediate",
    immediate: invalid,
  });
  const range = useMotionHostRef<HTMLDivElement>();
  const rangePaint = useStateColor(range.ref, cm, ["background-color"], {
    readability: verified ? "verified" : "immediate",
    immediate: invalid,
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
    // A presenting parent owns this entrance; an unusable or hidden host keeps
    // native paint instead of fading a control that is already in use.
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
  });
  committed(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
    },
    [],
  );
  const resolvedValue = value ?? defaultValue;
  const _values = Array.isArray(resolvedValue)
    ? resolvedValue
    : typeof resolvedValue === "number"
      ? [resolvedValue]
      : [min, max];
  const thumbCount = _values.length;
  // Orientation is a JS branch, not a `data-horizontal:` / `data-vertical:` variant:
  // Base UI writes `data-orientation`, and the shorthand utility compiles to
  // `[data-horizontal]`, which nothing sets — a vertical slider would lie down.
  const vertical = orientation === "vertical";

  const labelFor = (index: number) => {
    if (!ariaLabel || thumbCount === 1) return ariaLabel;
    if (thumbCount === 2) return `${ariaLabel} (${index === 0 ? "minimum" : "maximum"})`;
    return `${ariaLabel} (${index + 1} of ${thumbCount})`;
  };

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      data-motion={cm.mode}
      {...props}
      ref={root.ref}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      orientation={orientation}
      className={(state) =>
        cn(vertical ? "h-full" : "w-full", typeof className === "function" ? className(state) : className)
      }
    >
      <SliderPrimitive.Control
        className={cn(
          "relative flex touch-none select-none data-disabled:opacity-50",
          vertical ? "h-full w-auto flex-col" : "w-full items-center",
        )}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          {...trackPaint}
          className={cn(
            "relative grow overflow-hidden rounded-full bg-muted select-none",
            vertical ? "h-full w-1.5" : "h-1.5 w-full",
          )}
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            {...rangePaint}
            className={cn("bg-primary select-none", vertical ? "w-full" : "h-full")}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            // biome-ignore lint/suspicious/noArrayIndexKey: a thumb has no identity beyond its position in the value array — Base UI's own `index` prop is the same number, and re-keying by a changing numeric value would replace native capture.
            key={index}
            index={index}
            aria-label={labelFor(index)}
            aria-labelledby={ariaLabelledBy}
            render={(thumbProps, state) => (
              <SliderThumbLayer
                {...(thumbProps as ThumbLayerProps)}
                cm={cm}
                dragging={state.dragging}
                disabled={state.disabled}
                verified={verified}
                invalid={invalid}
              />
            )}
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

/**
 * One thumb: the native positional layer plus its decorative face. Base UI keeps
 * the accepted state, coordinate box, capture and focus ring on the wrapper; the
 * face alone carries the painted disc and the press scale, so the hit target and
 * the ring never move with the press feedback.
 */
function SliderThumbLayer({
  cm,
  dragging,
  disabled,
  verified,
  invalid,
  className,
  children,
  style,
  ...rest
}: ThumbLayerProps) {
  const ring = useMotionHostRef<HTMLDivElement>(rest.ref as Ref<HTMLDivElement> | undefined);
  const ringPaint = useStateColor(ring.ref, cm, ["box-shadow"], {
    readability: verified ? "verified" : "immediate",
    immediate: invalid,
  });
  const face = useMotionHostRef<HTMLSpanElement>();
  /**
   * The decorative face is the native input's sibling, not its ancestor, so a
   * focus inside this thumb would not reach the policy's own focus gate. Tracking
   * it here settles the whole declared face paint on the same frame instead.
   */
  const [focused, setFocused] = useState(false);
  committed(() => {
    const host = ring.node.current;
    if (!host) return;
    const enter = () => setFocused(true);
    const leave = () => setFocused(false);
    host.addEventListener("focusin", enter);
    host.addEventListener("focusout", leave);
    return () => {
      host.removeEventListener("focusin", enter);
      host.removeEventListener("focusout", leave);
    };
  });
  const facePaint = useStateColor(
    face.ref,
    cm,
    ["background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    { readability: verified ? "verified" : "immediate", immediate: invalid || focused },
  );
  const parameters = cm.parameters(bindMotionParameters(feedbackPress, "feedback.press/scale"));
  // This exact preset/form pair always resolves to the press shape; a different
  // result would be an invalid binding, not a renderable state.
  if (parameters.kind !== "press") throw new RangeError("slider thumb requires feedback.press/scale");
  const pressed = dragging && !disabled && !cm.reduced;
  return (
    <div
      {...rest}
      {...ringPaint}
      data-slot="slider-thumb"
      data-motion={cm.mode}
      className={cn(thumbRingChrome, className)}
      style={{ ...ringPaint.style, ...style }}
    >
      <ControlSpan
        {...facePaint}
        data-slot="slider-thumb-face"
        data-motion={cm.mode}
        className={thumbFaceChrome}
        target={{ scale: pressed ? parameters.scale : 1 }}
        transition={parameters.transition}
      />
      {children}
    </div>
  );
}

/**
 * Upstream layout and native state selectors only. `state.color` owns the paint
 * clock of the track and range, so neither declares a CSS transition of its own.
 */
const thumbRingChrome =
  "group/thumb block size-4 shrink-0 rounded-full outline-none ring-ring/50 hover:ring-4 focus-visible:ring-4 data-disabled:pointer-events-none";

const thumbFaceChrome = "pointer-events-none block size-full rounded-full border border-primary bg-white shadow-sm";

/** Invalid state is attribute-driven (P11); this only reads the caller's value. */
function isInvalid(props: object) {
  const values = props as Record<string, unknown>;
  const set = (value: unknown) => value !== undefined && value !== false && value !== "false";
  return set(values["aria-invalid"]) || set(values["data-invalid"]);
}

/** Any caller palette utility or paint declaration makes interpolation unverifiable. */
function verifiedPalette(className: SliderProps["className"], style: SliderProps["style"]) {
  if (typeof className === "function" || typeof style === "function") return false;
  if (
    Object.keys(style ?? {}).some((key) =>
      /color|background|shadow|fill|stroke|opacity|filter|blend|gradient|^--(?!motion-|cadence-|ease-)/i.test(key),
    )
  )
    return false;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .filter(Boolean)
    .some((name) =>
      // Any variant syntax before the utility counts (`dark:`, `focus-visible:`
      // and arbitrary `data-[state=checked]:` alike).
      /(?:^|:)(?:bg|text|border|ring|shadow|fill|stroke|outline|decoration|caret|accent|from|via|to)-/.test(name),
    );
}

export { Slider };
