"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type * as React from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the panel fades and grows out of its anchor (`--transform-origin`, which
 *   Base UI sets on the popup) from `--motion-scale-in`, on `duration.fast`
 * - reduced: the fade stays, the scale is dropped
 * - none: `--motion-duration-*` resolves to 0ms, so the panel appears on the first
 *   frame
 *
 * Why the panel does not slide towards the trigger (as `new-york-v4` does): a slide
 * needs a distance token, a per-side class for each of the four sides, and it moves
 * the panel's edge away from the anchor it just lined up with. Growing from the
 * anchor says the same thing with one transform and one token.
 */
function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const cm = useCadenceMotion();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          data-motion={cm.mode}
          className={cn(
            "z-50 w-72 origin-(--transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            !cm.reduced &&
              "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="popover-header" className={cn("flex flex-col gap-1 text-sm", className)} {...props} />;
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" className={cn("font-medium", className)} {...props} />;
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger };
