import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "../lib/cn";

export interface InputProps extends InputPrimitive.Props {}

/**
 * A single-line text field. T0: the field does not animate. The focus ring and
 * the invalid border are colour/shadow transitions, which is state feedback,
 * not motion — an input that grows or slides while typing is unusable.
 *
 * Invalid state is attribute-driven only (P11): pass `aria-invalid`, and this
 * component renders the destructive border and ring. It never decides whether a
 * value is valid; see [/docs/validation](/docs/validation).
 *
 * Base UI's input is field-aware, so it picks up `Field` context (label ids,
 * described-by wiring) when it is rendered inside one.
 */
function Input({ className, type, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
