"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "../button/button";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the backdrop cross-fades on `duration.fast`; the panel fades and settles
 *   from `--motion-scale-in` (0.96) on `duration.base`
 * - reduced: the panel keeps the fade and drops the scale
 * - none: both durations resolve to 0ms (the `--motion-duration-*` tokens are
 *   zeroed by `[data-motion="none"]`), so the dialog appears and disappears on
 *   the first frame
 */
function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  const cm = useCadenceMotion();

  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      data-motion={cm.mode}
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/50 transition-opacity ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  const cm = useCadenceMotion();

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        data-motion={cm.mode}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg outline-none transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-base) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 sm:max-w-lg",
          !cm.reduced &&
            "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-4 right-4"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <X />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close data-slot="dialog-close" render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-lg font-semibold", className)} {...props} />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
