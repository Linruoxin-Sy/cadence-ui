"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { createContext, useContext, useId, useState } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

/**
 * Base UI's tooltip wires neither `role="tooltip"` nor `aria-describedby`, so a
 * screen reader gets no announcement at all. The ARIA tooltip pattern needs both,
 * and the pair has to agree on an id, which is the one thing this context carries.
 * `open` is here because a dangling `aria-describedby` id is an axe violation: the
 * reference only exists while the popup does.
 */
interface TooltipContextValue {
  id: string;
  open: boolean;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

/** Optional app-level provider: one delay for every tooltip inside it. */
function TooltipProvider({ delay = 0, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

function Tooltip({ children, open, defaultOpen = false, onOpenChange, ...props }: TooltipPrimitive.Root.Props) {
  const id = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;

  return (
    <TooltipContext.Provider value={{ id, open: isOpen }}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next, details) => {
          setUncontrolledOpen(next);
          onOpenChange?.(next, details);
        }}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  const tooltip = useContext(TooltipContext);

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      aria-describedby={tooltip?.open ? tooltip.id : undefined}
      {...props}
    />
  );
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the label fades and grows out of its anchor (`--transform-origin`) from
 *   `--motion-scale-in`, on `duration.fast`
 * - reduced: the fade stays, the scale is dropped
 * - none: `--motion-duration-*` resolves to 0ms, so the label appears on the first
 *   frame
 *
 * The arrow is part of the popup, so it moves with it; it is not animated on its
 * own. `text-balance` keeps a two-word label from breaking badly in the max width.
 */
function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const cm = useCadenceMotion();
  const tooltip = useContext(TooltipContext);

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          id={tooltip?.id}
          data-slot="tooltip-content"
          data-motion={cm.mode}
          role="tooltip"
          className={cn(
            "z-50 w-fit max-w-xs origin-(--transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background outline-none transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            !cm.reduced &&
              "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow
            className={cn(
              "z-50 size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground",
              "data-[side=bottom]:top-1 data-[side=left]:top-1/2! data-[side=left]:-right-1",
              "data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1",
              "data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5",
            )}
          />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
