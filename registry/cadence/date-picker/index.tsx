"use client";

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button, type ButtonProps } from "../button";
import { Calendar } from "../calendar";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "../popover";

type CalendarProps = React.ComponentProps<typeof Calendar>;
type Options<M extends "single" | "range"> = Omit<
  Extract<CalendarProps, { mode: M }>,
  "mode" | "selected" | "onSelect" | "required"
>;
type SharedProps = Omit<React.ComponentProps<"div">, "defaultValue"> & {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: React.ComponentProps<typeof Popover>["onOpenChange"];
  triggerProps?: ButtonProps;
  contentProps?: React.ComponentProps<typeof PopoverContent>;
};
export type DatePickerDemoProps = SharedProps &
  (
    | {
        mode?: "single";
        value?: Date;
        defaultValue?: Date;
        onValueChange?: (value: Date | undefined) => void;
        calendarProps?: Options<"single">;
      }
    | {
        mode: "range";
        value?: DateRange;
        defaultValue?: DateRange;
        onValueChange?: (value: DateRange | undefined) => void;
        calendarProps?: Options<"range">;
      }
  );

/** Editable composition: selection stays open, like the pinned Base demo.
 * Motion belongs to Button, Popover and Calendar; no selection-keyed remounts.
 * A present value prop (including undefined) is controlled. Dates use local
 * calendar days unless the caller configures DayPicker's timeZone explicitly.
 */
export function DatePickerDemo(props: DatePickerDemoProps) {
  const {
    mode = "single",
    value,
    defaultValue,
    onValueChange,
    calendarProps,
    label = "Choose date",
    placeholder = "Pick a date",
    disabled = false,
    open,
    defaultOpen,
    onOpenChange,
    triggerProps,
    contentProps,
    className,
    ...rootProps
  } = props;
  const [internal, setInternal] = React.useState<Date | DateRange | undefined>(defaultValue);
  const selected = Object.hasOwn(props, "value") ? value : internal;
  const cm = useCadenceMotion();
  const locale = { ...enUS, ...calendarProps?.locale };
  const triggerClass = triggerProps?.className;
  const contentClass = contentProps?.className;
  const text =
    selected instanceof Date
      ? format(selected, "PPP", { locale })
      : selected?.from
        ? `${format(selected.from, "PPP", { locale })}${selected.to ? ` – ${format(selected.to, "PPP", { locale })}` : ""}`
        : placeholder;
  function change(next: Date | DateRange | undefined) {
    if (!Object.hasOwn(props, "value")) setInternal(next);
    if (props.mode === "range") props.onValueChange?.(next as DateRange | undefined);
    else props.onValueChange?.(next as Date | undefined);
  }
  return (
    <div
      data-slot="date-picker"
      data-motion={cm.mode}
      className={cn("inline-flex max-w-full", className)}
      {...rootProps}
    >
      <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              {...triggerProps}
              disabled={disabled || triggerProps?.disabled}
              data-empty={!selected}
              className={
                typeof triggerClass === "function"
                  ? (state) =>
                      cn(
                        "max-w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
                        triggerClass(state),
                      )
                  : cn(
                      "max-w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
                      triggerProps?.className,
                    )
              }
            />
          }
        >
          <CalendarIcon data-icon="inline-start" />
          <span className="sr-only">{label}: </span>
          <span className="truncate">{text}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          {...contentProps}
          className={
            typeof contentClass === "function"
              ? (state) =>
                  cn(
                    "max-h-(--available-height) w-auto max-w-(--available-width) overflow-auto p-0",
                    contentClass(state),
                  )
              : cn(
                  "max-h-(--available-height) w-auto max-w-(--available-width) overflow-auto p-0",
                  contentProps?.className,
                )
          }
        >
          <PopoverTitle className="sr-only">{label}</PopoverTitle>
          {mode === "range" ? (
            <Calendar
              autoFocus
              numberOfMonths={2}
              defaultMonth={(selected as DateRange | undefined)?.from}
              {...(calendarProps as Options<"range">)}
              mode="range"
              required={false}
              selected={selected as DateRange | undefined}
              onSelect={change}
            />
          ) : (
            <Calendar
              autoFocus
              defaultMonth={selected as Date | undefined}
              {...(calendarProps as Options<"single">)}
              mode="single"
              required={false}
              selected={selected as Date | undefined}
              onSelect={change}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
