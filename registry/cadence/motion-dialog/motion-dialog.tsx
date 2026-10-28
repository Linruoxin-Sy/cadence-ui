"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

export interface MotionDialogProps {
  /** Content rendered inside the dialog trigger (a button). */
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

/**
 * A dialog built on Base UI, animated with Motion.
 *
 * Motion contract:
 * - enter: backdrop fades; panel fades, lifts 8px and scales 0.96 → 1
 *   (`popup.anchored`, smooth spring)
 * - exit: panel fades and scales to 0.98 (interruptible; reopening mid-exit reverses)
 * - reduced: opacity only
 * - none: instant
 *
 * a11y: Base UI owns focus trapping, focus return, Escape, backdrop dismissal,
 * scroll locking, and `aria-modal`/labelledby wiring.
 */
export function MotionDialog({
  trigger,
  title,
  description,
  children,
  size = "md",
  open: openProp,
  onOpenChange,
  className,
}: MotionDialogProps) {
  const cm = useCadenceMotion();
  const [uncontrolled, setUncontrolled] = useState(false);
  const open = openProp ?? uncontrolled;

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        {trigger}
      </Dialog.Trigger>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              render={
                <motion.div
                  className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={cm.transition("exit.fade")}
                />
              }
            />
            <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
              <Dialog.Popup
                render={
                  <motion.div
                    initial={cm.reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={cm.reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
                    transition={cm.transition("popup.anchored")}
                  />
                }
                className={cn(
                  "relative w-full rounded-2xl border border-border bg-background p-6 text-foreground shadow-lg outline-none",
                  sizes[size],
                  className,
                )}
              >
                <div className="pr-8">
                  <Dialog.Title className="text-lg font-semibold tracking-tight">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </Dialog.Description>
                  ) : null}
                </div>
                <Dialog.Close
                  aria-label="Close dialog"
                  className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden="true" className="size-4" />
                </Dialog.Close>
                <div className="mt-4 text-sm">{children}</div>
              </Dialog.Popup>
            </Dialog.Viewport>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
