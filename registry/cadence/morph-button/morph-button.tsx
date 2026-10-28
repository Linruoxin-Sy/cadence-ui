"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react";
import { type ReactNode, useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

export type MorphButtonState = "idle" | "loading" | "success" | "error";

export interface MorphButtonProps
  extends Omit<
    React.ComponentPropsWithoutRef<"button">,
    "children" | "onAnimationStart" | "onDrag" | "onDragEnd" | "onDragStart"
  > {
  /** Visible state. Drives the icon, the label, and the width morph. */
  state?: MorphButtonState;
  /** Override the label per state. Falls back to `children`. */
  labels?: Partial<Record<MorphButtonState, ReactNode>>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
}

const variants = {
  primary: "bg-foreground text-background border border-transparent hover:opacity-90",
  secondary: "bg-muted text-foreground border border-border hover:bg-muted/70",
  ghost: "bg-transparent text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground",
  danger: "bg-destructive text-white border border-transparent hover:bg-destructive/90",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
} as const;

function iconFor(state: MorphButtonState, reduced: boolean) {
  if (state === "loading")
    return <LoaderCircle aria-hidden="true" className={cn("size-4", !reduced && "animate-spin")} />;
  if (state === "success") return <Check aria-hidden="true" className="size-4" />;
  if (state === "error") return <CircleAlert aria-hidden="true" className="size-4" />;
  return null;
}

/**
 * A button whose label and width morph between idle, loading, success, and error.
 *
 * Motion contract:
 * - state change: label crossfades with a 4px lift while the slot springs to the
 *   new width (`state.morph`, 0.42s, no overshoot)
 * - press: `whileTap` scale 0.97 on the press spring
 * - reduced: label crossfade only, no width spring, no press scale
 * - none: instant swap
 *
 * a11y: loading keeps the button focusable (aria-disabled instead of disabled) and
 * sets aria-busy; success and error announce through an sr-only live region.
 */
export function MorphButton({
  state = "idle",
  labels,
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  onClick,
  ...props
}: MorphButtonProps) {
  const cm = useCadenceMotion();
  const width = useMotionValue<number | string>("auto");
  const slotRef = useRef<HTMLSpanElement>(null);
  const measured = useRef(false);
  const busy = state === "loading";
  const label = labels?.[state] ?? children;

  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const next = entry.contentRect.width;
      if (!next) return;
      if (!measured.current || cm.reduced || cm.mode === "none") {
        measured.current = true;
        width.jump(next);
        return;
      }
      animate(width, next, cm.spring.morph);
    });
    observer.observe(slot);
    return () => observer.disconnect();
  }, [cm.mode, cm.reduced, cm.spring.morph, width]);

  const status = state === "success" ? "Success" : state === "error" ? "Error" : "";

  return (
    <motion.button
      data-slot="morph-button"
      data-motion={cm.mode}
      data-state={state}
      type={props.type ?? "button"}
      className={cn(
        "relative inline-flex select-none items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-disabled={busy || props["aria-disabled"] || undefined}
      whileTap={cm.reduced || disabled ? undefined : { scale: scale.press }}
      transition={cm.transition("feedback.press")}
      onClick={busy ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      <motion.span style={{ width }} className="inline-flex items-center justify-center overflow-hidden">
        <span ref={slotRef} className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state}
              className="inline-flex items-center gap-2"
              initial={cm.reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={cm.reduced ? { opacity: 0 } : { opacity: 0, y: -3 }}
              transition={cm.transition("state.morph")}
            >
              {iconFor(state, cm.reduced)}
              <span>{label}</span>
            </motion.span>
          </AnimatePresence>
        </span>
      </motion.span>
      {status ? (
        <span role="status" aria-live="polite" className="sr-only">
          {status}
        </span>
      ) : null}
    </motion.button>
  );
}
