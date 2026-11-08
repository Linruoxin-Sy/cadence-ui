"use client";

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import { cn } from "../lib/cn";
import { popupClasses, popupStyle } from "../lib/popup-style";
import { useCadenceMotionScope, withCadenceScope } from "../lib/provider";

function HoverCard({ ...props }: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...props} />;
}

function HoverCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the panel fades and grows out of its anchor (`--transform-origin`) from
 *   `--motion-scale-in`, on `duration.fast`
 * - reduced: the fade stays, the scale is dropped
 * - none: `--motion-duration-*` resolves to 0ms, so the panel appears on the first
 *   frame
 *
 * The panel is larger than a tooltip and may hold links, but it opens from a
 * pointer or focus move like one; `duration.fast` is the anchored-surface rule the
 * popover and tooltip share, and only the dialogs take over the screen at `base`.
 */
function HoverCardContent({
  className,
  style,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<PreviewCardPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const { cm, ref: scopeRef } = useCadenceMotionScope(props.ref);

  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        {withCadenceScope(
          cm,
          <PreviewCardPrimitive.Popup
            data-slot="hover-card-content"
            data-motion={cm.mode}
            data-cadence-scope=""
            style={popupStyle(cm, style)}
            className={popupClasses(
              cm,
              cn(
                "z-50 w-64 origin-(--transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
                !cm.reduced &&
                  "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
              ),
              className,
            )}
            {...props}
            ref={scopeRef}
          />,
        )}
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
