"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";
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

export interface CheckboxProps extends CheckboxPrimitive.Root.Props {}

const committed = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A single on/off choice, or one row of a set. The box owns the state paint and
 * the local mark; the tick is the only thing that moves. It fades and settles
 * from 0.96 to full size when the box is checked or mixed, and reverses from the
 * current visual state when it is cleared. There is deliberately no press
 * animation: the state change is the event, and a 16px box is too small for a
 * second protagonist.
 *
 * Motion contract (`checkbox`):
 * - Appearance: a later-inserted control owns one opacity entrance with its
 *   already-correct checked/mixed state; an independently presented parent (for
 *   example a field) owns the entrance instead and never fades twice.
 * - Surface/text colour: the box owns its own background, foreground and border
 *   paint. Real DOM focus and invalid state settle that whole declared set
 *   immediately in every mode; an unverified caller palette does the same.
 * - Size: fixed box and hit area. No measurement, no border-width tween and no
 *   hit-area scaling — caller layout applies immediately.
 * - Changed text/numbers: the check and the minus are state glyphs, not text.
 *   An external label belongs to its own component.
 *
 * a11y: Base UI renders `role="checkbox"` plus a hidden input, so Space toggles
 * it and a form still submits the value. Invalid state is attribute-driven
 * (`aria-invalid`); this component never validates (P11).
 */
function Checkbox({ className, style, ...props }: CheckboxProps) {
  const { node, ref } = useMotionHostRef<HTMLButtonElement>(props.ref as Ref<HTMLButtonElement> | undefined);
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
  const callerStyle = style;
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      {...props}
      {...paint}
      data-motion={cm.mode}
      className={
        typeof className === "function"
          ? (state) => cn(checkboxChrome, className(state))
          : cn(checkboxChrome, className)
      }
      style={
        typeof callerStyle === "function"
          ? (state) => ({ ...paint.style, ...callerStyle(state) })
          : { ...paint.style, ...callerStyle }
      }
    >
      <CheckboxPrimitive.Indicator
        data-motion={cm.mode}
        keepMounted
        render={(indicatorProps, state) => {
          const { className: indicatorClassName, ...rest } = indicatorProps as React.HTMLProps<HTMLSpanElement>;
          const parameters = cm.parameters(bindMotionParameters(stateIndicator, "state.morph/indicator"));
          // This exact preset/form pair always resolves to the indicator shape; a
          // different result would be an invalid binding, not a renderable state.
          if (parameters.kind !== "indicator")
            throw new RangeError("checkbox indicator requires state.morph/indicator");
          const marked = state.checked || state.indeterminate;
          return (
            <ControlSpan
              {...(rest as HTMLMotionProps<"span">)}
              data-slot="checkbox-indicator"
              data-motion={cm.mode}
              className={cn("grid size-full place-content-center text-current", indicatorClassName)}
              target={{
                opacity: marked ? 1 : 0,
                scale: marked || cm.reduced ? 1 : parameters.scale,
              }}
              transition={{ opacity: parameters.opacity, scale: parameters.spatial }}
            >
              {state.indeterminate ? <Minus className="size-3.5" /> : <Check className="size-3.5" />}
            </ControlSpan>
          );
        }}
      />
    </CheckboxPrimitive.Root>
  );
}

/**
 * Upstream layout and native state selectors only. `state.color` owns the paint
 * clock, so the chrome declares no CSS transition of its own; the focus ring and
 * the invalid ring are part of that declared paint and settle with it.
 */
const checkboxChrome =
  "peer relative size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:bg-input/30";

const shippedChrome = new Set([
  "border",
  "border-input",
  "shadow-xs",
  "focus-visible:border-ring",
  "focus-visible:ring-[3px]",
  "focus-visible:ring-ring/50",
  "aria-invalid:border-destructive",
  "aria-invalid:ring-destructive/20",
  "dark:aria-invalid:ring-destructive/40",
  "data-checked:border-primary",
  "data-checked:bg-primary",
  "data-checked:text-primary-foreground",
  "dark:bg-input/30",
]);

/** Unknown palettes commit at their target rather than through unreadable paint. */
function verifiedChrome(className: CheckboxProps["className"], style: CheckboxProps["style"]) {
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

export { Checkbox };
