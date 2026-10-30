import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "../lib/cn";

/**
 * `default` is the neutral banner; `destructive` colours the text and leaves the
 * surface alone, so an alert still reads as a card rather than a red block.
 *
 * The grid is `0 1fr`: the icon column collapses to zero until a direct `svg`
 * child shows up, and `AlertTitle`/`AlertDescription` always sit in the second
 * column. That is why an icon is added, never positioned.
 */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface AlertProps extends React.ComponentProps<"div">, VariantProps<typeof alertVariants> {}

/**
 * A message about the current state of the page. T0: nothing animates. An alert
 * that slides in on mount draws the eye to something that did not just happen;
 * when an alert appears because of an async result, the region that changed owns
 * the `reveal`, not the alert.
 *
 * a11y: `role="alert"` is always set. That is an assertive live region, so an
 * alert mounted after a failure is announced immediately — do not use it for
 * static, always-visible copy.
 */
function Alert({ className, variant = "default", ...props }: AlertProps) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export interface AlertTitleProps extends React.ComponentProps<"div"> {}

function AlertTitle({ className, ...props }: AlertTitleProps) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

export interface AlertDescriptionProps extends React.ComponentProps<"div"> {}

function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-muted-foreground [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export interface AlertActionProps extends React.ComponentProps<"div"> {}

/**
 * The right-aligned slot for one action — a retry, a dismiss, a link. It spans
 * the two grid rows so it stays put when the description wraps onto a second line.
 */
function AlertAction({ className, ...props }: AlertActionProps) {
  return (
    <div
      data-slot="alert-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export { Alert, AlertAction, AlertDescription, AlertTitle, alertVariants };
