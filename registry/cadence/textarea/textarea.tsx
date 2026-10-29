import type * as React from "react";
import { cn } from "../lib/cn";

export interface TextareaProps extends React.ComponentProps<"textarea"> {}

/**
 * A multi-line text field. T0: it does not animate, and it does not auto-grow
 * with JavaScript — `field-sizing-content` lets the browser size the box from
 * the content, so there is no layout read and no ResizeObserver.
 *
 * Invalid state is attribute-driven only (P11): pass `aria-invalid` and the
 * destructive border and ring follow. The component never validates.
 */
function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
