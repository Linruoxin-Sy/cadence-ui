"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import type { HTMLMotionProps } from "motion/react";
import type * as React from "react";
import { type Ref, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { ControlSpan } from "../lib/control-animation";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { bindMotionParameters, stateIndicator } from "../lib/motion";
import { documentPresentation, usePresentationScope } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";

export interface RadioGroupProps extends RadioGroupPrimitive.Props {}

export interface RadioGroupItemProps extends RadioPrimitive.Root.Props<unknown> {}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A set of options where exactly one can be selected.
 *
 * Motion contract (`radio-group`):
 * - Appearance: the group owns one opacity entrance when it is inserted into an
 *   already-presented page; a presenting parent (for example an entering field)
 *   owns the entrance instead and items never fade twice.
 * - Selection: each item's dot is its own indicator revision. Only the actual
 *   outgoing and incoming dots change — opacity with the authored `scale.in`
 *   pose — so a dot never travels across distant options, an unmatched value
 *   shows no dot, and rapid arrows retarget the same indicators.
 * - Surface/text colour: each item owns one scoped border, background, ring and
 *   dot palette. Real DOM focus and invalid state settle that paint immediately
 *   in every mode; an unverified caller palette does the same.
 * - Size, changed text and changed numbers: inherited/not applicable. The option
 *   circle and hit area are fixed and the order is caller layout.
 *
 * a11y: Base UI wires `role="radiogroup"` with roving tabindex, so arrow keys
 * move the selection and Space selects. Group and item both accept
 * `aria-invalid`, which styles the ring; validation itself is the caller's job
 * (P11).
 */
function RadioGroup({ className, ...props }: RadioGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(props.ref as Ref<HTMLDivElement> | undefined);
  const cm = useCadenceMotion(node);
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
  committed(() => {
    const host = node.current;
    if (!host) return;
    const baseline = parent ?? documentPresentation(host.ownerDocument);
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    // A presenting parent owns this entrance; an unusable, hidden or
    // already-presented host keeps native paint instead of fading a group in use.
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
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={(state) => cn("grid gap-3", typeof className === "function" ? className(state) : className)}
      {...props}
      ref={ref}
      data-motion={cm.mode}
    />
  );
}

function RadioGroupItem({ className, style, ...props }: RadioGroupItemProps) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>(props.ref as Ref<HTMLSpanElement> | undefined);
  const cm = useCadenceMotion(node);
  // Caller palettes are unverified; unknown paint settles at its target instead
  // of passing through an unreadable midpoint. The dot reads currentColor, so
  // this one transaction also owns its colour.
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
    { readability: verifiedItemChrome(className, style) ? "verified" : "immediate" },
  );
  const callerStyle = style;
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={
        typeof className === "function" ? (state) => cn(itemChrome, className(state)) : cn(itemChrome, className)
      }
      style={
        typeof callerStyle === "function"
          ? (state) => ({ ...paint.style, ...callerStyle(state) })
          : { ...paint.style, ...callerStyle }
      }
    >
      <RadioPrimitive.Indicator
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLSpanElement>;
          const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
          // This exact preset/form pair always resolves to the indicator shape; a
          // different result would be an invalid binding, not a renderable state.
          if (parameters.kind !== "indicator")
            throw new RangeError("radio-group indicator requires state.morph/indicator");
          return (
            <ControlSpan
              {...(rest as HTMLMotionProps<"span">)}
              data-slot="radio-group-indicator"
              data-motion={cm.mode}
              className={cn("flex size-full items-center justify-center", indicatorClassName)}
              target={{
                opacity: state.checked ? 1 : 0,
                scale: state.checked || cm.reduced ? 1 : parameters.scale,
              }}
              transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
            >
              <span className="size-2 rounded-full bg-current" />
            </ControlSpan>
          );
        }}
      />
    </RadioPrimitive.Root>
  );
}

/**
 * Upstream layout, native state selectors and the option circle only. `state.color`
 * owns the paint clock, so the chrome declares no CSS transition of its own; the
 * focus ring and the invalid ring are part of that declared paint and settle with
 * it. The dot uses `currentColor` so the item's single colour transaction reaches it.
 */
const itemChrome =
  "group/radio-group-item peer relative aspect-square size-4 shrink-0 rounded-full border border-input text-primary shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 dark:bg-input/30";

const shippedChrome = new Set([
  "border",
  "border-input",
  "text-primary",
  "shadow-xs",
  "focus-visible:border-ring",
  "focus-visible:ring-[3px]",
  "focus-visible:ring-ring/50",
  "aria-invalid:border-destructive",
  "aria-invalid:ring-destructive/20",
  "dark:aria-invalid:ring-destructive/40",
  "dark:bg-input/30",
]);

/** Unknown palettes commit at their target rather than through unreadable paint. */
function verifiedItemChrome(className: RadioGroupItemProps["className"], style: RadioGroupItemProps["style"]) {
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
        !shippedChrome.has(name),
    );
}

export { RadioGroup, RadioGroupItem };
