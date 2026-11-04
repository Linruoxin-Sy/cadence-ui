"use client";

import { fr } from "date-fns/locale";
import { useId, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/registry/cadence/button";
import { DatePickerDemo } from "@/registry/cadence/date-picker";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewRow, PreviewStack } from "./shell";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

function Appointment() {
  return <DatePickerDemo label="Appointment" defaultValue={new Date(2026, 10, 12)} calendarProps={calendar} />;
}
function InitialValues() {
  return (
    <div className="flex flex-wrap gap-3">
      <DatePickerDemo label="Optional date" placeholder="Choose an optional date" calendarProps={calendar} />
      <DatePickerDemo label="Initial date" defaultValue={new Date(2026, 10, 12)} calendarProps={calendar} />
      <DatePickerDemo label="Read-only date" value={new Date(2026, 10, 20)} calendarProps={calendar} />
    </div>
  );
}
function ControlledDate() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  return (
    <div className="flex flex-col items-start gap-3">
      <DatePickerDemo label="Controlled appointment" value={date} onValueChange={setDate} calendarProps={calendar} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setDate(undefined)}>
          Clear date
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDate(new Date(2026, 10, 20))}>
          Set November 20
        </Button>
      </div>
      <output className="text-sm text-muted-foreground">
        {date ? `Selected day: ${date.getDate()}` : "No date selected"}
      </output>
    </div>
  );
}
function RangePresets() {
  const [range, setRange] = useState<DateRange | undefined>();
  return (
    <div className="flex flex-col items-start gap-3">
      <DatePickerDemo
        mode="range"
        label="Travel dates"
        value={range}
        onValueChange={setRange}
        calendarProps={{ ...calendar, min: 2, max: 7, excludeDisabled: true, disabled: new Date(2026, 10, 5) }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRange({ from: new Date(2026, 10, 10), to: new Date(2026, 10, 15) })}
        >
          Apply travel preset
        </Button>
        <Button variant="outline" size="sm" onClick={() => setRange(undefined)}>
          Clear travel dates
        </Button>
      </div>
      <output className="text-sm text-muted-foreground">
        {range?.to ? "Range complete" : range?.from ? "Choose an end date" : "No travel dates"}
      </output>
    </div>
  );
}
function DisabledDates() {
  return (
    <div className="flex flex-wrap gap-3">
      <DatePickerDemo label="Unavailable" disabled calendarProps={calendar} />
      <DatePickerDemo
        label="Weekday appointment"
        calendarProps={{ ...calendar, disabled: [{ dayOfWeek: [0, 6] }, new Date(2026, 10, 5)] }}
      />
    </div>
  );
}
function BirthDates() {
  return (
    <DatePickerDemo
      label="Birth date"
      calendarProps={{
        ...calendar,
        captionLayout: "dropdown",
        startMonth: new Date(1920, 0),
        endMonth: new Date(2026, 11),
        disabled: { after: new Date(2026, 10, 1) },
      }}
    />
  );
}
function LocalizedDate() {
  return (
    <DatePickerDemo
      label="Rendez-vous"
      defaultValue={new Date(2026, 10, 12)}
      calendarProps={{ ...calendar, locale: fr, weekStartsOn: 1 }}
    />
  );
}
function DateInput() {
  const id = useId();
  const [draft, setDraft] = useState("2026-11-12");
  // The native date input supplies a complete ISO civil date or an empty value.
  const [year = 0, month = 1, day = 1] = draft.split("-").map(Number);
  const date = draft ? new Date(year, month - 1, day) : undefined;
  return (
    <FieldGroup className="w-full max-w-xs">
      <Field>
        <FieldLabel htmlFor={id}>Appointment date input</FieldLabel>
        <Input id={id} type="date" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <FieldDescription>Local calendar date; clearing the input clears the picker.</FieldDescription>
      </Field>
      <DatePickerDemo
        label="Date input calendar"
        value={date}
        onValueChange={(next) =>
          setDraft(
            next
              ? [
                  next.getFullYear(),
                  String(next.getMonth() + 1).padStart(2, "0"),
                  String(next.getDate()).padStart(2, "0"),
                ].join("-")
              : "",
          )
        }
        calendarProps={calendar}
      />
    </FieldGroup>
  );
}
function DateAndTime() {
  const id = useId();
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  const [time, setTime] = useState("09:30");
  return (
    <FieldGroup className="w-full max-w-xs">
      <DatePickerDemo label="Meeting day" value={date} onValueChange={setDate} calendarProps={calendar} />
      <Field>
        <FieldLabel htmlFor={id}>Meeting time</FieldLabel>
        <Input id={id} type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        <FieldDescription>Time is a separate caller-owned value; no zone conversion is applied.</FieldDescription>
      </Field>
    </FieldGroup>
  );
}
function ControlledMonthAndOpen() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(new Date(2026, 10, 1));
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  return (
    <div className="flex flex-col items-start gap-3">
      <DatePickerDemo
        label="Controlled calendar"
        open={open}
        onOpenChange={setOpen}
        value={date}
        onValueChange={setDate}
        calendarProps={{ ...calendar, month, onMonthChange: setMonth }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setMonth(new Date(2026, 11, 1));
            setOpen(true);
          }}
        >
          Open December
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Close calendar
        </Button>
      </div>
      <output className="text-sm text-muted-foreground">
        {open ? "Open" : "Closed"}; displayed month: {month.getMonth() + 1}
      </output>
    </div>
  );
}
function CallerErrors() {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-3">
      <DatePickerDemo
        label="Required appointment"
        value={undefined}
        triggerProps={{ "aria-invalid": true, "aria-describedby": id }}
        calendarProps={calendar}
      />
      <p id={id} className="text-sm text-destructive">
        Choose an appointment before submitting.
      </p>
    </div>
  );
}
function CustomParts() {
  const trigger = useRef<HTMLButtonElement>(null);
  const [presses, setPresses] = useState(0);
  return (
    <div className="flex flex-col items-start gap-3">
      <DatePickerDemo
        label="Custom appointment"
        className="rounded-md border border-dashed p-2"
        style={{ maxWidth: "100%" }}
        triggerProps={{ ref: trigger, variant: "secondary", onClick: () => setPresses((value) => value + 1) }}
        contentProps={{ align: "end", className: "border-dashed" }}
        calendarProps={calendar}
      />
      <Button variant="outline" size="sm" onClick={() => trigger.current?.focus()}>
        Focus date trigger
      </Button>
      <output className="text-sm text-muted-foreground">Trigger activations: {presses}</output>
    </div>
  );
}
function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <DatePickerDemo label="Static appointment" defaultValue={new Date(2026, 10, 12)} calendarProps={calendar} />
    </CadenceProvider>
  );
}
export function DatePickerPreview({ example }: { example?: string }) {
  let content = <Appointment />;
  switch (example) {
    case "initial-values":
      content = <InitialValues />;
      break;
    case "controlled-date-and-clearing":
      content = <ControlledDate />;
      break;
    case "range-and-presets":
      content = <RangePresets />;
      break;
    case "disabled-dates":
      content = <DisabledDates />;
      break;
    case "birth-dates":
      content = <BirthDates />;
      break;
    case "locale":
      content = <LocalizedDate />;
      break;
    case "date-input":
      content = <DateInput />;
      break;
    case "time":
      content = <DateAndTime />;
      break;
    case "controlled-month-and-open":
      content = <ControlledMonthAndOpen />;
      break;
    case "caller-errors":
      content = <CallerErrors />;
      break;
    case "custom-parts":
      content = <CustomParts />;
      break;
    case "without-motion":
      content = <WithoutMotion />;
      break;
  }
  return (
    <PreviewStack className="min-w-0">
      <PreviewRow className="w-full min-w-0">{content}</PreviewRow>
    </PreviewStack>
  );
}
