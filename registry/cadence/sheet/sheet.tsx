"use client";

import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { Button } from "../button/button";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  const cm = useCadenceMotion();

  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      data-motion={cm.mode}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the panel slides in from its own edge by its own size and fades on
 *   `duration.base`; the backdrop cross-fades on `duration.fast`
 * - reduced: the panel keeps the fade and drops the slide
 * - none: both durations resolve to 0ms, so the panel is in place on the first frame
 *
 * The slide is `translate-*-full`, the panel's own width or height rather than a
 * fixed distance: a side panel should enter from off its edge at every size, and a
 * distance token would have to be re-tuned per side. `translate` (not `transform`)
 * is the property in the transition list because Tailwind v4's `translate-*`
 * utilities write it individually, the same reason the dialogs transition `scale`.
 */
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  const cm = useCadenceMotion();

  const placement =
    side === "right"
      ? "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm"
      : side === "left"
        ? "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm"
        : side === "top"
          ? "inset-x-0 top-0 h-auto border-b"
          : "inset-x-0 bottom-0 h-auto border-t";

  const slide =
    side === "right"
      ? "data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full"
      : side === "left"
        ? "data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full"
        : side === "top"
          ? "data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full"
          : "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full";

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        data-motion={cm.mode}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background shadow-lg outline-none transition-[opacity,translate] ease-cadence-out duration-(--motion-duration-base) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
          placement,
          !cm.reduced && slide,
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            className="absolute top-4 right-4"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <X />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn("text-lg font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
