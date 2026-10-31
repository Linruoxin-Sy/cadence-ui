"use client";

import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { type HTMLMotionProps, motion } from "motion/react";
import type * as React from "react";
import { createContext, type HTMLProps, useContext } from "react";
import { cn } from "../lib/cn";
import { scale } from "../lib/motion";
import { useCadenceMotion } from "../lib/provider";

function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuPortal({ ...props }: ContextMenuPrimitive.Portal.Props) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuTrigger({ className, ...props }: ContextMenuPrimitive.Trigger.Props) {
  const cm = useCadenceMotion();

  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      data-motion={cm.mode}
      className={cn("select-none", className)}
      {...props}
    />
  );
}

/**
 * Motion contract (CSS-only, Base UI `data-starting-style` / `data-ending-style`):
 * - full: the panel fades and grows out of the pointer, from `--transform-origin` and
 *   `--motion-scale-in`, on `duration.fast`
 * - reduced: the fade stays, the scale is dropped
 * - none: `--motion-duration-*` resolves to 0ms
 *
 * The origin is the pointer rather than a trigger's edge, which is the one difference
 * from `dropdown-menu`: the panel belongs to the place it was summoned, not to a
 * control. Everything else — the transition, the slots, the item states — is the same
 * popup, so the two menus cannot drift apart visually without both files changing.
 */
function ContextMenuContent({
  align = "start",
  alignOffset = 4,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<ContextMenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  const cm = useCadenceMotion();

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className="isolate z-50 outline-hidden"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          data-motion={cm.mode}
          className={cn(
            "z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-hidden",
            "transition-[opacity,scale] ease-cadence-out duration-(--motion-duration-fast) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            !cm.reduced &&
              "data-[ending-style]:scale-(--motion-scale-in) data-[starting-style]:scale-(--motion-scale-in)",
            className,
          )}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

/**
 * Same rule as `dropdown-menu`: Base UI 1.9 throws when `Menu.GroupLabel` renders outside
 * `Menu.Group`, so the label is the group's own label inside one and a plain caption
 * outside one.
 */
const ContextMenuGroupContext = createContext(false);

function ContextMenuGroup({ ...props }: ContextMenuPrimitive.Group.Props) {
  return (
    <ContextMenuGroupContext.Provider value>
      <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
    </ContextMenuGroupContext.Provider>
  );
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<"div"> & {
  inset?: boolean;
}) {
  const inGroup = useContext(ContextMenuGroupContext);
  const classes = cn("px-2 py-1.5 text-sm font-medium data-[inset]:pl-8", className);

  if (inGroup) {
    return (
      <ContextMenuPrimitive.GroupLabel
        data-slot="context-menu-label"
        data-inset={inset}
        {...(props as ContextMenuPrimitive.GroupLabel.Props)}
        className={classes}
      />
    );
  }

  return <div data-slot="context-menu-label" data-inset={inset} className={classes} {...props} />;
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-[inset]:pl-8",
        "data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/10 data-[variant=destructive]:data-highlighted:text-destructive dark:data-[variant=destructive]:data-highlighted:bg-destructive/20",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        "data-[variant=destructive]:*:[svg]:text-destructive!",
        className,
      )}
      {...props}
    />
  );
}

function ContextMenuSub({ ...props }: ContextMenuPrimitive.SubmenuRoot.Props) {
  return <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />;
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
        "data-popup-open:bg-accent data-popup-open:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-[inset]:pl-8",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </ContextMenuPrimitive.SubmenuTrigger>
  );
}

function ContextMenuSubContent({
  align = "start",
  alignOffset = 4,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuContent>) {
  return (
    <ContextMenuContent
      data-slot="context-menu-sub-content"
      className={cn("w-auto", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  inset?: boolean;
}) {
  const cm = useCadenceMotion();

  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        data-slot="context-menu-checkbox-item-indicator"
        className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
      >
        <ContextMenuPrimitive.CheckboxItemIndicator
          keepMounted
          render={(indicatorProps, state) => {
            const { className: indicatorClassName, ...rest } = indicatorProps as HTMLProps<HTMLSpanElement>;

            return (
              <motion.span
                {...(rest as HTMLMotionProps<"span">)}
                data-motion={cm.mode}
                className={cn("flex items-center justify-center", indicatorClassName)}
                initial={false}
                animate={state.checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
                transition={cm.transition("state.morph")}
              >
                <CheckIcon className="size-4" />
              </motion.span>
            );
          }}
        />
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

function ContextMenuRadioGroup({ ...props }: ContextMenuPrimitive.RadioGroup.Props) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuPrimitive.RadioItem.Props & {
  inset?: boolean;
}) {
  const cm = useCadenceMotion();

  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span
        data-slot="context-menu-radio-item-indicator"
        className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center"
      >
        <ContextMenuPrimitive.RadioItemIndicator
          keepMounted
          render={(indicatorProps, state) => {
            const { className: indicatorClassName, ...rest } = indicatorProps as HTMLProps<HTMLSpanElement>;

            return (
              <motion.span
                {...(rest as HTMLMotionProps<"span">)}
                data-motion={cm.mode}
                className={cn("flex items-center justify-center", indicatorClassName)}
                initial={false}
                animate={state.checked ? { opacity: 1, scale: 1 } : { opacity: 0, scale: cm.reduced ? 1 : scale.in }}
                transition={cm.transition("state.morph")}
              >
                <CircleIcon className="size-2 fill-current" />
              </motion.span>
            );
          }}
        />
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

function ContextMenuSeparator({ className, ...props }: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function ContextMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
};
