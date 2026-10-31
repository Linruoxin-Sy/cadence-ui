// biome-ignore-all lint/a11y/useSemanticElements: ItemGroup is a div with role="list" so a row can be an anchor via `render`; a <ul> would force a <li> per row and break that swap.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";
import { Separator } from "../separator";

export interface ItemGroupProps extends React.ComponentProps<"div"> {}

/** `role="list"` pairs with `Item`'s implicit listitem semantics when the items are read aloud. */
function ItemGroup({ className, ...props }: ItemGroupProps) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("group/item-group flex w-full flex-col", className)}
      {...props}
    />
  );
}

export interface ItemSeparatorProps extends React.ComponentProps<typeof Separator> {}

function ItemSeparator({ className, ...props }: ItemSeparatorProps) {
  return <Separator data-slot="item-separator" orientation="horizontal" className={cn("my-0", className)} {...props} />;
}

/**
 * Three variants and three sizes, all from padding and border only. `transition-colors`
 * is state feedback (hover on the link inside), not motion — a row that slides
 * under the pointer would move the text the user is reading.
 */
const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center rounded-md border border-transparent text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-accent/50",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "gap-4 p-4",
        sm: "gap-2.5 px-4 py-3",
        xs: "gap-2 px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ItemProps extends useRender.ComponentProps<"div">, VariantProps<typeof itemVariants> {}

/**
 * One row in a list of like objects: a file, a member, a line item. T0 — the row
 * never animates. If a list should arrive in sequence, that is `list.stagger` on
 * the parent, never a property of the row.
 *
 * `render` (Base UI) replaces the `div`: `<Item render={<a href="…" />}>` gives a
 * whole-row link without nesting an anchor inside a wrapper.
 */
function Item({ className, variant = "default", size = "default", render, ...props }: ItemProps) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">({ className: cn(itemVariants({ variant, size }), className) }, props),
    render,
    // `state` is what emits `data-slot` / `data-variant` / `data-size`.
    state: { slot: "item", variant, size },
  });
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 rounded-sm border bg-muted [&_svg:not([class*='size-'])]:size-4",
        image: "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface ItemMediaProps extends React.ComponentProps<"div">, VariantProps<typeof itemMediaVariants> {}

function ItemMedia({ className, variant = "default", ...props }: ItemMediaProps) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

export interface ItemContentProps extends React.ComponentProps<"div"> {}

function ItemContent({ className, ...props }: ItemContentProps) {
  return (
    <div
      data-slot="item-content"
      className={cn("flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none", className)}
      {...props}
    />
  );
}

export interface ItemTitleProps extends React.ComponentProps<"div"> {}

function ItemTitle({ className, ...props }: ItemTitleProps) {
  return (
    <div
      data-slot="item-title"
      className={cn("flex w-fit items-center gap-2 text-sm leading-snug font-medium", className)}
      {...props}
    />
  );
}

export interface ItemDescriptionProps extends React.ComponentProps<"p"> {}

function ItemDescription({ className, ...props }: ItemDescriptionProps) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "line-clamp-2 text-sm leading-normal font-normal text-balance text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export interface ItemActionsProps extends React.ComponentProps<"div"> {}

function ItemActions({ className, ...props }: ItemActionsProps) {
  return <div data-slot="item-actions" className={cn("flex items-center gap-2", className)} {...props} />;
}

export interface ItemHeaderProps extends React.ComponentProps<"div"> {}

function ItemHeader({ className, ...props }: ItemHeaderProps) {
  return (
    <div
      data-slot="item-header"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

export interface ItemFooterProps extends React.ComponentProps<"div"> {}

function ItemFooter({ className, ...props }: ItemFooterProps) {
  return (
    <div
      data-slot="item-footer"
      className={cn("flex basis-full items-center justify-between gap-2", className)}
      {...props}
    />
  );
}

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  itemMediaVariants,
  itemVariants,
};
