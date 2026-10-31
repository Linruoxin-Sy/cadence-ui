"use client";

import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { createContext, useContext } from "react";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

/**
 * Upstream's Base UI drawer carries a context for four things: whether snap points
 * exist (they change the height and the overlay), whether to draw the swipe handle,
 * the modal mode (a non-modal drawer has no backdrop), and the swipe direction (it
 * decides the axis, the placement, and the closed transform).
 */
interface DrawerContextValue {
  hasSnapPoints: boolean;
  modal: DrawerPrimitive.Root.Props["modal"];
  showSwipeHandle: boolean;
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("useDrawer must be used within a Drawer.");
  return context;
}

function Drawer({
  modal = true,
  showSwipeHandle = false,
  snapPoints,
  swipeDirection = "down",
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean;
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0;

  return (
    <DrawerContext.Provider value={{ hasSnapPoints, modal, showSwipeHandle, swipeDirection }}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

/**
 * The backdrop follows the drag: Base UI writes `--drawer-swipe-progress` as the
 * sheet travels, and the overlay opacity is `1 - progress`, so the page behind comes
 * back in step with the finger instead of waiting for the release. The transition is
 * the token one; while swiping it is zero, because the variable already moved.
 */
function DrawerOverlay({ className, ...props }: DrawerPrimitive.Backdrop.Props) {
  const cm = useCadenceMotion();

  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      data-motion={cm.mode}
      className={cn(
        "fixed inset-0 z-50 min-h-dvh bg-black/50 transition-opacity ease-cadence-out duration-(--motion-duration-fast) opacity-[calc(1_-_var(--drawer-swipe-progress,0))] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-swiping:duration-0",
        className,
      )}
      {...props}
    />
  );
}

function DrawerSwipeHandle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "mx-auto mt-3 h-1.5 w-12 shrink-0 cursor-grab rounded-full bg-muted-foreground/30 active:cursor-grabbing",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the sheet slides from off its edge and fades on `duration.slow`, following
 *   `--drawer-swipe-movement-*` while the user drags; the backdrop cross-fades on
 *   `duration.fast`
 * - reduced: the fade stays and the closed-state slide is dropped, so the sheet
 *   appears and disappears in place; the drag still tracks the finger, because that
 *   is the user's own movement rather than an authored animation
 * - none: every duration resolves to 0ms, so the sheet is in place on the first frame
 *
 * The transform is not a fixed translate: it carries Base UI's swipe variables, which
 * is what lets the sheet track the finger. The closed transform is per direction and
 * is `100%` of the sheet, not a distance token — the same reason the `sheet` slides by
 * its own size.
 */
function DrawerContent({ className, children, ...props }: DrawerPrimitive.Popup.Props) {
  const cm = useCadenceMotion();
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer();
  const swipeAxis = swipeDirection === "down" || swipeDirection === "up" ? "y" : "x";

  const placement =
    swipeDirection === "down"
      ? "inset-x-0 bottom-0 rounded-t-xl border-t"
      : swipeDirection === "up"
        ? "inset-x-0 top-0 rounded-b-xl border-b"
        : swipeDirection === "left"
          ? "inset-y-0 left-0 w-3/4 rounded-r-xl border-r sm:max-w-sm"
          : "inset-y-0 right-0 w-3/4 rounded-l-xl border-l sm:max-w-sm";

  const closedTransform =
    swipeDirection === "down"
      ? "[--closed-transform:translate3d(0,calc(100%_+_2px),0)]"
      : swipeDirection === "up"
        ? "[--closed-transform:translate3d(0,calc(-100%_-_2px),0)]"
        : swipeDirection === "left"
          ? "[--closed-transform:translate3d(calc(-100%_-_2px),0,0)]"
          : "[--closed-transform:translate3d(calc(100%_+_2px),0,0)]";

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? "" : undefined}
          data-motion={cm.mode}
          className={cn(
            "pointer-events-auto fixed z-50 flex flex-col overflow-hidden border bg-background text-foreground shadow-lg outline-none",
            "transition-[transform,opacity] ease-cadence-out duration-(--motion-duration-slow) data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 data-swiping:duration-0",
            "transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)]",
            "data-[swipe-axis=y]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)_+_var(--drawer-swipe-movement-y))]",
            "data-[swipe-axis=x]:[--translate-x:var(--drawer-swipe-movement-x)]",
            "data-[swipe-axis=y]:max-h-[calc(100dvh_-_3rem)] data-[swipe-axis=y]:data-snap-points:h-(--drawer-height)",
            placement,
            !cm.reduced && closedTransform,
            !cm.reduced &&
              "data-[starting-style]:transform-(--closed-transform) data-[ending-style]:transform-(--closed-transform)",
            className,
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4"
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("flex shrink-0 flex-col gap-1.5", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex shrink-0 flex-col gap-2", className)} {...props} />;
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title data-slot="drawer-title" className={cn("text-lg font-semibold", className)} {...props} />
  );
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-balance text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerSwipeHandle,
  DrawerTitle,
  DrawerTrigger,
};
