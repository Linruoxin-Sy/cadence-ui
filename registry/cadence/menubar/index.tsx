"use client";

import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar";
import type * as React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";

/**
 * Motion contract (inherited from `dropdown-menu`):
 * - full: the open panel fades and grows from its trigger (`popup.anchored`), the mark on
 *   a checkbox or radio item scales in (`state.morph`), and the close fades (`exit.fade`)
 * - reduced: the panel keeps the fade and drops the scale; the mark cross-fades
 * - none: every duration resolves to 0ms
 *
 * A menubar owns no motion of its own. Moving between the top-level menus — open one,
 * press `ArrowRight`, the next opens — is Base UI's roving focus with no shared element
 * to animate: the panels are siblings, and sliding a highlight along the bar would claim
 * a continuity the markup does not have.
 */
function Menubar({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive>) {
  const cm = useCadenceMotion();

  return (
    <MenubarPrimitive
      data-slot="menubar"
      data-motion={cm.mode}
      className={cn("flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs", className)}
      {...props}
    />
  );
}

function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />;
}

function MenubarGroup({ ...props }: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />;
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal data-slot="menubar-portal" {...props} />;
}

function MenubarTrigger({ className, ...props }: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        "flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
        "data-popup-open:bg-accent data-popup-open:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn("min-w-[12rem]", className)}
      {...props}
    />
  );
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn("group/menubar-item", className)}
      {...props}
    />
  );
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuCheckboxItem>) {
  return (
    <DropdownMenuCheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={className}
      checked={checked}
      {...props}
    >
      {children}
    </DropdownMenuCheckboxItem>
  );
}

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />;
}

function MenubarRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioItem>) {
  return (
    <DropdownMenuRadioItem data-slot="menubar-radio-item" data-inset={inset} className={className} {...props}>
      {children}
    </DropdownMenuRadioItem>
  );
}

function MenubarLabel({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuLabel>) {
  return <DropdownMenuLabel data-slot="menubar-label" data-inset={inset} className={className} {...props} />;
}

function MenubarSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator data-slot="menubar-separator" className={cn("-mx-1 my-1 h-px", className)} {...props} />
  );
}

function MenubarShortcut({ className, ...props }: React.ComponentProps<typeof DropdownMenuShortcut>) {
  return <DropdownMenuShortcut data-slot="menubar-shortcut" className={cn("ml-auto", className)} {...props} />;
}

function MenubarSub({ ...props }: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />;
}

function MenubarSubTrigger({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuSubTrigger>) {
  return <DropdownMenuSubTrigger data-slot="menubar-sub-trigger" data-inset={inset} className={className} {...props} />;
}

function MenubarSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return <DropdownMenuSubContent data-slot="menubar-sub-content" className={className} {...props} />;
}

export {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
};
