// biome-ignore-all lint/a11y/useSemanticElements: Field is a div with role="group" because a fieldset cannot be collapsed per orientation, and the group is the unit both label layouts are built from.
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Label } from "../label/label";
import { cn } from "../lib/cn";
import { Separator } from "../separator/separator";

export interface FieldSetProps extends React.ComponentProps<"fieldset"> {}

function FieldSet({ className, ...props }: FieldSetProps) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

export interface FieldLegendProps extends React.ComponentProps<"legend"> {
  /** `label` renders at control-label size for a fieldset that groups one row. */
  variant?: "legend" | "label";
}

function FieldLegend({ className, variant = "legend", ...props }: FieldLegendProps) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn("mb-3 font-medium data-[variant=legend]:text-base data-[variant=label]:text-sm", className)}
      {...props}
    />
  );
}

export interface FieldGroupProps extends React.ComponentProps<"div"> {}

/** A container query root, so `orientation="responsive"` can answer to the group's width. */
function FieldGroup({ className, ...props }: FieldGroupProps) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
      horizontal:
        "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface FieldProps extends React.ComponentProps<"div">, VariantProps<typeof fieldVariants> {}

/**
 * One control and everything that belongs to it: label, description, error.
 * T0 — the field never animates. The error message appears because the state
 * changed, and it must be readable at once; fading it in would delay the one
 * thing the user needs.
 *
 * P11: the field renders state, it never decides it. `data-invalid` (and the
 * `aria-invalid` you put on the control) turns the text destructive; the rules
 * that made the value invalid live in the caller. See [/docs/validation](/docs/validation).
 */
function Field({ className, orientation = "vertical", ...props }: FieldProps) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

export interface FieldContentProps extends React.ComponentProps<"div"> {}

function FieldContent({ className, ...props }: FieldContentProps) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)}
      {...props}
    />
  );
}

export interface FieldLabelProps extends React.ComponentProps<typeof Label> {}

/**
 * A `Label`, so clicking it focuses the control and screen readers announce the
 * name. The extra selectors let a `Field` that contains a whole choice card lay
 * itself out as that card's surface.
 */
function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10",
        className,
      )}
      {...props}
    />
  );
}

export interface FieldTitleProps extends React.ComponentProps<"div"> {}

/** A label-weight text for content that is not tied to a control (a group title, a value). */
function FieldTitle({ className, ...props }: FieldTitleProps) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export interface FieldDescriptionProps extends React.ComponentProps<"p"> {}

function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export interface FieldSeparatorProps extends React.ComponentProps<"div"> {
  /** Optional centred text — "or", "advanced" — rendered on the rule. */
  children?: React.ReactNode;
}

function FieldSeparator({ children, className, ...props }: FieldSeparatorProps) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn("relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2", className)}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

export interface FieldErrorProps extends React.ComponentProps<"div"> {
  /**
   * Messages the caller already decided are errors. Rendered, deduplicated, and
   * listed — never produced. Passing rules or a schema here is out of scope (P11).
   */
  errors?: Array<{ message?: string } | undefined>;
}

/**
 * The error slot. It renders `null` when it has nothing to say, so a caller can
 * keep it mounted and let the message arrive later.
 *
 * a11y: `role="alert"` announces the message when it appears. Pair it with
 * `aria-invalid` on the control and `aria-describedby` pointing at this element's
 * id: colour alone is not a signal.
 */
function FieldError({ className, children, errors, ...props }: FieldErrorProps) {
  let content: React.ReactNode = children;

  if (!content && errors?.length) {
    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    content =
      uniqueErrors.length === 1 ? (
        uniqueErrors[0]?.message
      ) : (
        <ul className="ml-4 flex list-disc flex-col gap-1">
          {uniqueErrors.map((error) => (error?.message ? <li key={error.message}>{error.message}</li> : null))}
        </ul>
      );
  }

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  fieldVariants,
};
