"use client";
import { fr } from "date-fns/locale";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/registry/cadence/button";
import { DatePickerDemo } from "@/registry/cadence/date-picker";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

export function DatePickerPreview() {
  const [mode, setMode] = useState<CadenceMode>("full");
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  const [range, setRange] = useState<DateRange | undefined>();
  const [french, setFrench] = useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        Picker motion
        <select
          aria-label="Picker motion"
          value={mode}
          onChange={(e) => setMode(e.target.value as CadenceMode)}
          className="rounded-md border bg-background p-1"
        >
          <option value="full">Full</option>
          <option value="reduced">Reduced</option>
          <option value="none">None</option>
        </select>
      </label>
      <CadenceProvider mode={mode} timeScale={4}>
        <div className="flex flex-col items-start gap-4">
          <DatePickerDemo
            label="Appointment"
            value={date}
            onValueChange={setDate}
            calendarProps={{
              defaultMonth: new Date(2026, 10, 1),
              today: new Date(2026, 10, 1),
              disabled: new Date(2026, 10, 5),
              locale: french ? fr : undefined,
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDate(undefined)}>
              Clear date
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDate(new Date(2026, 10, 20))}>
              Set November 20
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFrench(!french)}>
              Switch language
            </Button>
          </div>
          <DatePickerDemo
            mode="range"
            label="Travel dates"
            value={range}
            onValueChange={setRange}
            calendarProps={{ defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRange({ from: new Date(2026, 10, 10), to: new Date(2026, 10, 15) })}
          >
            Apply travel preset
          </Button>
          <DatePickerDemo label="Unavailable" disabled />
          <output className="text-sm text-muted-foreground" aria-live="polite">
            {date ? `Selected day: ${date.getDate()}` : "No date selected"}
          </output>
        </div>
      </CadenceProvider>
    </div>
  );
}
