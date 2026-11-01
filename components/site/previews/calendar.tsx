"use client";

import { enUS, fr } from "date-fns/locale";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/registry/cadence/calendar";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

export function CalendarPreview() {
  const { control, choose } = usePreviewVariant("Calendar", previewVariantOptions);
  const [month, setMonth] = useState(new Date(2026, 10, 1));
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  const [multiple, setMultiple] = useState<Date[] | undefined>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [kind, setKind] = useState("single");
  const [mode, setMode] = useState<CadenceMode | undefined>();
  const [months, setMonths] = useState(1);
  const [french, setFrench] = useState(false);
  const common = {
    month,
    numberOfMonths: months,
    onMonthChange: setMonth,
    locale: french ? fr : enUS,
    weekStartsOn: 1 as const,
    disabled: new Date(2026, 10, 5),
    fixedWeeks: true,
    className: "rounded-md border",
    captionLayout: "dropdown" as const,
    startMonth: new Date(2025, 0),
    endMonth: new Date(2028, 11),
  };
  return (
    <>
      {control}
      <div className="flex w-full min-w-0 flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <label>
            Selection{" "}
            <select aria-label="Selection mode" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option>single</option>
              <option>multiple</option>
              <option>range</option>
            </select>
          </label>
          <label>
            Motion{" "}
            <select
              aria-label="Calendar motion"
              value={mode ?? "inherit"}
              onChange={(e) => setMode(e.target.value === "inherit" ? undefined : (e.target.value as CadenceMode))}
            >
              <option value="inherit">inherit</option>
              <option>full</option>
              <option>reduced</option>
              <option>none</option>
            </select>
          </label>
          <label>
            Months{" "}
            <select aria-label="Displayed months" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </label>
          <label>
            <input type="checkbox" checked={french} onChange={(e) => setFrench(e.target.checked)} /> French
          </label>
          <button
            type="button"
            className="underline"
            onClick={() => {
              setMonth(new Date(2026, 10, 1));
              setDate(new Date(2026, 10, 20));
            }}
          >
            Set November 20
          </button>
        </div>
        <CadenceProvider mode={mode}>
          {kind === "single" ? (
            <Calendar {...common} mode="single" selected={date} onSelect={setDate} buttonVariant={choose("ghost")} />
          ) : kind === "multiple" ? (
            <Calendar
              {...common}
              mode="multiple"
              selected={multiple}
              onSelect={setMultiple}
              buttonVariant={choose("ghost")}
            />
          ) : (
            <Calendar {...common} mode="range" selected={range} onSelect={setRange} buttonVariant={choose("ghost")} />
          )}
        </CadenceProvider>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {kind === "single"
            ? (date?.toDateString() ?? "No date")
            : kind === "multiple"
              ? `${multiple?.length ?? 0} dates`
              : `${range?.from?.toDateString() ?? "Start"} – ${range?.to?.toDateString() ?? "End"}`}
        </p>
      </div>
    </>
  );
}
