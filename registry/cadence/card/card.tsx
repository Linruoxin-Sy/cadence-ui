import type * as React from "react";
import { cn } from "../lib/cn";

export interface CardProps extends React.ComponentProps<"div"> {
  /** `sm` tightens the padding from 1.5rem to 1rem for dense lists and sidebars. */
  size?: "default" | "sm";
}

/**
 * A surface that groups content. T0: the card itself never animates — a card
 * that fades or lifts on mount is decoration, and it fights the `reveal` recipe
 * a page may already be running.
 *
 * Parts are separated only by `data-slot`, so a consumer restyles them from CSS:
 * `[&>[data-slot=card-header]]:border-b`. Spacing comes from `--card-spacing`,
 * which `size` sets once on the root and the children inherit.
 */
function Card({ className, size = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-sm [--card-spacing:1.5rem] data-[size=sm]:[--card-spacing:1rem] *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps extends React.ComponentProps<"div"> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

export interface CardTitleProps extends React.ComponentProps<"div"> {}

function CardTitle({ className, ...props }: CardTitleProps) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />;
}

export interface CardDescriptionProps extends React.ComponentProps<"div"> {}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export interface CardActionProps extends React.ComponentProps<"div"> {}

function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export interface CardContentProps extends React.ComponentProps<"div"> {}

function CardContent({ className, ...props }: CardContentProps) {
  return <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />;
}

export interface CardFooterProps extends React.ComponentProps<"div"> {}

function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-(--card-spacing) [.border-t]:pt-(--card-spacing)", className)}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
