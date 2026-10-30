import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

export interface EmptyProps extends React.ComponentProps<"div"> {}

/**
 * The state a region shows when it has nothing to show. T0: nothing animates.
 * An empty state is a resting state, and a placeholder that flies in would
 * compete with the content that is supposed to replace it.
 *
 * The root is a flex column with a dashed boundary, so it can stand in for a
 * list, a table body, or a whole panel without a wrapper.
 */
function Empty({ className, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
        className,
      )}
      {...props}
    />
  );
}

export interface EmptyHeaderProps extends React.ComponentProps<"div"> {}

function EmptyHeader({ className, ...props }: EmptyHeaderProps) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2 text-center", className)}
      {...props}
    />
  );
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface EmptyMediaProps extends React.ComponentProps<"div">, VariantProps<typeof emptyMediaVariants> {}

/**
 * The visual at the top of the state: an illustration, an icon, or nothing.
 *
 * a11y: `variant="icon"` decorates; the icon must be `aria-hidden` unless the
 * title alone cannot carry the meaning.
 */
function EmptyMedia({ className, variant = "default", ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant }), className)}
      {...props}
    />
  );
}

export interface EmptyTitleProps extends React.ComponentProps<"div"> {}

function EmptyTitle({ className, ...props }: EmptyTitleProps) {
  return <div data-slot="empty-title" className={cn("text-lg font-medium tracking-tight", className)} {...props} />;
}

export interface EmptyDescriptionProps extends React.ComponentProps<"p"> {}

/**
 * Renders a `div` rather than the `p` its props suggest — upstream does the same,
 * because a description regularly contains a block-level link or a `<p>` of its
 * own and nested paragraphs are invalid HTML.
 */
function EmptyDescription({ className, ...props }: EmptyDescriptionProps) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export interface EmptyContentProps extends React.ComponentProps<"div"> {}

function EmptyContent({ className, ...props }: EmptyContentProps) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance", className)}
      {...props}
    />
  );
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, emptyMediaVariants };
