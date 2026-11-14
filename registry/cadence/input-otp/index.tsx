"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import type * as React from "react";
import { useContext, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "../lib/cn";
import { useStateColor } from "../lib/css-motion";
import { createInlineEntrance } from "../lib/inline-entrance";
import { documentPresentation } from "../lib/motion-presence";
import { useMotionHostRef } from "../lib/motion-ref";
import { useCadenceMotion } from "../lib/provider";
import { useTextPresentation } from "../lib/use-text-presentation";

export type InputOTPProps = React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
};

export interface InputOTPGroupProps extends React.ComponentProps<"div"> {}

export interface InputOTPSlotProps extends React.ComponentProps<"div"> {
  index: number;
}

export interface InputOTPSeparatorProps extends React.ComponentProps<"div"> {}

const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const subscribe = () => () => {};

/**
 * A one-time password field: one slot per character, all of them backed by a
 * single input so paste and autofill work.
 *
 * Motion contract (`input-otp`):
 * - Appearance: a later-inserted group owns one opacity entrance with the code
 *   already rendered; slots and the separator inherit it and never fade twice.
 * - Surface/text colour: each slot owns its own border, background and character
 *   foreground. A slot carrying invalid state or real DOM focus-within settles
 *   all of that paint immediately; the mirrored active slot is not DOM focus, so
 *   its colour stays an eligible transition. Ring width/offset never animates.
 * - Changed text: only the character whose code position actually changed is
 *   replaced, inside its fixed box, opacity only. Unchanged slots and focus-only
 *   moves do not replay, clearing is immediate, and the slot count is the only
 *   decoration bound.
 * - The caret, selection, composition, paste and completion remain native.
 *
 * a11y: `input-otp` renders a single real input with `autocomplete="one-time-code"`,
 * so screen readers announce one field, not six. Every slot mirrors the state
 * for CSS; the input is what receives focus. `onComplete` is where the caller
 * decides whether the code is correct.
 */
function InputOTP({ className, containerClassName, ...props }: InputOTPProps) {
  const cm = useCadenceMotion();

  return (
    <OTPInput
      spellCheck={false}
      data-slot="input-otp"
      data-motion={cm.mode}
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

/** One disclosed opacity entrance per inserted group; never a per-slot replay. */
function InputOTPGroup({ className, ref: callerRef, ...props }: InputOTPGroupProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(callerRef);
  const cm = useCadenceMotion(node);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  const initialHydration = useRef(hydrated);
  const consumed = useRef(false);
  const entrance = useRef<ReturnType<typeof createInlineEntrance> | null>(null);
  useEffect(() => {
    if (node.current) documentPresentation(node.current.ownerDocument).presented = true;
  }, [node]);
  useCommittedEffect(() => {
    const host = node.current;
    if (!host) return;
    if (!entrance.current) entrance.current = createInlineEntrance(host);
    const baseline = documentPresentation(host.ownerDocument);
    const visible = host.checkVisibility
      ? host.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
      : host.getClientRects().length > 0;
    // A hidden, inert or unusable group keeps native paint instead of fading a
    // field the user is already using.
    const inherited =
      !visible || Boolean(host.closest('[hidden],[inert],[aria-hidden="true"]')) || !baseline.available();
    entrance.current.commit({
      present: true,
      cm: inherited ? { ...cm, timeScale: 0 } : cm,
      enter: !consumed.current && !initialHydration.current && baseline.presented && !inherited,
    });
    consumed.current = true;
  });
  useCommittedEffect(
    () => () => {
      entrance.current?.dispose();
      entrance.current = null;
    },
    [],
  );
  return (
    <div
      ref={ref}
      data-slot="input-otp-group"
      data-motion={cm.mode}
      className={cn("flex items-center", className)}
      {...props}
    />
  );
}

function InputOTPSlot({ index, className, style, ref: callerRef, ...props }: InputOTPSlotProps) {
  const { node, ref } = useMotionHostRef<HTMLDivElement>(callerRef);
  const cm = useCadenceMotion(node);
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  const entity = useRef({});
  // The active ring is shadow geometry, so `box-shadow` is deliberately not
  // owned: the ring appears and disappears immediately instead of widening.
  const paint = useStateColor(
    ref,
    cm,
    ["background-color", "color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"],
    {
      // The shipped slot chrome is the only palette whose intermediate paint we can
      // prove; a caller override settles at its target instead of tweening through
      // an unreadable midpoint.
      readability: verifiedSlotPalette(className, style) ? "verified" : "immediate",
    },
  );

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      {...props}
      {...paint}
      ref={paint.ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-xs outline-none first:rounded-l-md first:border-l last:rounded-r-md",
        "aria-invalid:border-destructive",
        "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        "dark:bg-input/30",
        className,
      )}
      style={{ ...paint.style, ...style }}
    >
      <SlotText value={char ?? ""} entity={entity.current} />
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px bg-foreground" />
        </div>
      )}
    </div>
  );
}

/** The changed character's own lane. The native input keeps the code. */
function SlotText({ value, entity }: { value: string; entity: object }) {
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(node, value, cm, entity, {
    characterStagger: false,
    // An empty slot has nothing to replace: clearing the code position is
    // immediate, and the accepted edit already owns the semantic value.
    visible: value !== "",
    stripGeometry: true,
  });

  return (
    <span ref={ref} data-slot="input-otp-slot-text" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function InputOTPSeparator(props: InputOTPSeparatorProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: `<hr>` is void and cannot hold the dash glyph upstream renders here; the separator is decorative between slot groups and carries no action.
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

/**
 * Caller palettes are unverified. Only a slot left on the shipped chrome (and on
 * an inline style that paints nothing) keeps the declared colour clock.
 */
function verifiedSlotPalette(className: InputOTPSlotProps["className"], style: InputOTPSlotProps["style"]) {
  if (style && Object.keys(style).some((key) => /color|background|shadow|fill|stroke|opacity|filter|blend/i.test(key)))
    return false;
  const paint = /^(?:bg|text|border|ring|shadow|fill|stroke|outline|decoration|caret|accent)-/;
  const typography = /^text-(?:xs|sm|base|lg|xl|\dxl)$/;
  return !(typeof className === "string" ? className : "")
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => {
      const utility = token.slice(token.lastIndexOf(":") + 1);
      return !typography.test(utility) && paint.test(utility);
    });
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
