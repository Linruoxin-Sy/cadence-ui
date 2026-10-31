"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { motion } from "motion/react";
import type * as React from "react";
import { useContext } from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

export type InputOTPProps = React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
};

export interface InputOTPGroupProps extends React.ComponentProps<"div"> {}

export interface InputOTPSlotProps extends React.ComponentProps<"div"> {
  index: number;
}

export interface InputOTPSeparatorProps extends React.ComponentProps<"div"> {}

/**
 * A one-time password field: one slot per character, all of them backed by a
 * single input so paste and autofill work.
 *
 * Recipe: `state.morph` — a character lands in its slot with a short fade and
 * settles from 0.96 to full size. The caret is drawn but does not blink: a
 * blinking caret is a continuous loop that would have to be declared as
 * `data.transition`, and the active ring already says where the next character
 * goes.
 *
 * Motion contract:
 * - full: each new character fades in and scales 0.96 → 1
 * - reduced: opacity only
 * - none: characters appear instantly
 *
 * a11y: `input-otp` renders a single real input with `autocomplete="one-time-code"`,
 * so screen readers announce one field, not six. Every slot mirrors the state
 * for CSS; the input is what receives focus. `aria-invalid` styles the slot
 * border, and `onComplete` is where the caller decides whether the code is
 * correct (P11).
 */
function InputOTP({ className, containerClassName, ...props }: InputOTPProps) {
  const cm = useCadenceMotion();

  return (
    <OTPInput
      data-slot="input-otp"
      data-motion={cm.mode}
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: InputOTPGroupProps) {
  return <div data-slot="input-otp-group" className={cn("flex items-center", className)} {...props} />;
}

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const cm = useCadenceMotion();
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-xs outline-none transition-[color,box-shadow] first:rounded-l-md first:border-l last:rounded-r-md",
        "aria-invalid:border-destructive",
        "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-[3px] data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    >
      <motion.span
        key={char || "empty"}
        initial={cm.reduced ? { opacity: 0 } : { opacity: 0, scale: scale.in }}
        animate={{ opacity: 1, scale: 1 }}
        transition={cm.transition("state.morph")}
      >
        {char}
      </motion.span>
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px bg-foreground" />
        </div>
      )}
    </div>
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

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
