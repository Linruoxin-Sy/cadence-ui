"use client";

import { arSA, enUS, fr } from "date-fns/locale";
import { useState } from "react";
import { type DateRange, type DayButtonProps, formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { Button } from "@/registry/cadence/button";
import { Calendar, CalendarDayButton } from "@/registry/cadence/calendar";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november,
  today,
  locale: enUS,
  className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

export function SingleSelectionExample({
  navigationLabel = "Appointment date navigation",
}: {
  navigationLabel?: string;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  return (
    <Calendar
      {...stable}
      aria-label="Appointment date"
      labels={{ ...stable.labels, labelNav: () => navigationLabel }}
      mode="single"
      selected={date}
      onSelect={setDate}
      footer={date ? `Selected: ${date.toDateString()}` : "Choose a date"}
    />
  );
}

export function MultipleDatesExample() {
  const [days, setDays] = useState<Date[]>([new Date(2026, 10, 12)]);
  return (
    <Calendar
      {...stable}
      aria-label="Workshop days"
      labels={{ ...stable.labels, labelNav: () => "Workshop days navigation" }}
      mode="multiple"
      required
      min={1}
      max={3}
      selected={days}
      onSelect={setDays}
      footer={`${days.length} ${days.length === 1 ? "date" : "dates"}`}
    />
  );
}

export function DateRangesExample() {
  const [range, setRange] = useState<DateRange | undefined>();
  return (
    <Calendar
      {...stable}
      aria-label="Weekday trip"
      labels={{ ...stable.labels, labelNav: () => "Weekday trip navigation" }}
      mode="range"
      selected={range}
      onSelect={setRange}
      min={2}
      disabled={{ dayOfWeek: [0, 6] }}
      excludeDisabled
      footer={
        range?.from ? `${range.from.toDateString()} – ${range.to?.toDateString() ?? "Choose an end"}` : "Choose a start"
      }
    />
  );
}

export function MultipleMonthsExample() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 10, 28),
    to: new Date(2026, 11, 3),
  });
  return (
    <Calendar
      {...stable}
      aria-label="Two-month stay"
      labels={{ ...stable.labels, labelNav: () => "Two-month stay navigation" }}
      mode="range"
      selected={range}
      onSelect={setRange}
      numberOfMonths={2}
      pagedNavigation
      fixedWeeks
    />
  );
}

export function NavigationButtonVariantsExample() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((variant) => (
        <div key={variant} className="grid gap-2">
          <p className="text-sm font-medium">{variant}</p>
          <Calendar
            {...stable}
            aria-label={`${variant} navigation`}
            labels={{ ...stable.labels, labelNav: () => `${variant} navigation` }}
            buttonVariant={variant}
          />
        </div>
      ))}
    </div>
  );
}

export function CaptionLayoutsExample() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {(["label", "dropdown", "dropdown-months", "dropdown-years"] as const).map((captionLayout) => (
        <div key={captionLayout} className="grid gap-2">
          <p className="text-sm font-medium">{captionLayout}</p>
          <Calendar
            {...stable}
            aria-label={`${captionLayout} caption`}
            labels={{ ...stable.labels, labelNav: () => `${captionLayout} caption` }}
            captionLayout={captionLayout}
            startMonth={new Date(2025, 0)}
            endMonth={new Date(2028, 11)}
          />
        </div>
      ))}
    </div>
  );
}

export function LocalizedNavigationExample() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      <Calendar
        {...stable}
        aria-label="Calendrier français"
        lang="fr"
        locale={fr}
        weekStartsOn={1}
        captionLayout="dropdown"
        startMonth={new Date(2025, 0)}
        endMonth={new Date(2028, 11)}
        labels={{
          ...stable.labels,
          labelNav: () => "Navigation du calendrier français",
          labelNext: () => "Mois suivant",
          labelPrevious: () => "Mois précédent",
        }}
      />
      <Calendar
        {...stable}
        aria-label="التقويم العربي"
        lang="ar"
        dir="rtl"
        locale={arSA}
        formatters={{ formatWeekdayName: (date) => date.toLocaleDateString("ar-SA", { weekday: "narrow" }) }}
        labels={{
          ...stable.labels,
          labelNav: () => "التنقل في التقويم العربي",
          labelNext: () => "الشهر التالي",
          labelPrevious: () => "الشهر السابق",
        }}
      />
    </div>
  );
}

export function ControlledMonthAndDateExample() {
  const [month, setMonth] = useState(november);
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setMonth(november);
            setDate(new Date(2026, 10, 20));
          }}
        >
          Set November 20
        </Button>
        <Button variant="outline" onClick={() => setDate(undefined)}>
          Clear appointment
        </Button>
      </div>
      <input
        aria-label="Appointment note"
        defaultValue="Keep this draft"
        className="w-full min-w-0 rounded-md border p-2 text-sm"
      />
      <Calendar
        {...stable}
        aria-label="Controlled appointment"
        labels={{ ...stable.labels, labelNav: () => "Controlled appointment navigation" }}
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={date}
        onSelect={setDate}
        weekStartsOn={1}
        fixedWeeks
        footer={date ? `Selected: ${date.toDateString()}` : "No appointment"}
      />
    </div>
  );
}

export function DisabledDatesExample() {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <Calendar
      {...stable}
      aria-label="Available appointment"
      labels={{ ...stable.labels, labelNav: () => "Available appointment navigation" }}
      mode="single"
      selected={date}
      onSelect={setDate}
      disabled={[new Date(2026, 10, 5), { before: new Date(2026, 10, 4) }, { dayOfWeek: [0, 6] }]}
      hidden={new Date(2026, 10, 11)}
      footer={date ? `Selected: ${date.toDateString()}` : "Weekdays from November 4; November 5 unavailable"}
    />
  );
}

export function GridLayoutExample() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      <Calendar
        {...stable}
        aria-label="Fixed six-week grid"
        labels={{ ...stable.labels, labelNav: () => "Fixed six-week grid navigation" }}
        className="min-w-72 rounded-md border"
        fixedWeeks
        showWeekNumber
        weekStartsOn={1}
      />
      <Calendar
        {...stable}
        aria-label="Current month only"
        labels={{ ...stable.labels, labelNav: () => "Current month only navigation" }}
        mode="single"
        showOutsideDays={false}
        className="rounded-md border [--cell-size:--spacing(9)]"
      />
    </div>
  );
}

function BookingDay(props: DayButtonProps) {
  return (
    <CalendarDayButton {...props} locale={enUS}>
      {props.children}
      <span aria-hidden="true">{props.day.date.getDay() === 2 ? "•" : ""}</span>
    </CalendarDayButton>
  );
}
export function CustomDayExample() {
  const [date, setDate] = useState<Date | undefined>();
  return (
    <Calendar
      {...stable}
      aria-label="Booking availability"
      labels={{ ...stable.labels, labelNav: () => "Booking availability navigation" }}
      mode="single"
      selected={date}
      onSelect={setDate}
      components={{ DayButton: BookingDay }}
      formatters={{
        formatCaption: (date) => `Bookings · ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      }}
      styles={{ month_grid: { opacity: 1 } }}
      classNames={{ today: "rounded-md underline" }}
    />
  );
}

export function BrowseOnlyExample() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      <Calendar
        {...stable}
        aria-label="Browse months without selecting"
        labels={{ ...stable.labels, labelNav: () => "Browse months without selecting navigation" }}
        startMonth={november}
        endMonth={new Date(2026, 11, 1)}
      />
      <Calendar
        {...stable}
        aria-label="Navigation disabled"
        labels={{ ...stable.labels, labelNav: () => "Disabled calendar navigation" }}
        disableNavigation
      />
      <Calendar
        {...stable}
        aria-label="Navigation hidden"
        labels={{ ...stable.labels, labelNav: () => "Hidden calendar navigation" }}
        hideNavigation
      />
    </div>
  );
}

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <Calendar
        {...stable}
        aria-label="Instant month navigation"
        labels={{ ...stable.labels, labelNav: () => "Instant calendar navigation" }}
        mode="single"
      />
    </CadenceProvider>
  );
}

const examples = {
  "single-selection": SingleSelectionExample,
  "multiple-dates": MultipleDatesExample,
  "date-ranges": DateRangesExample,
  "multiple-months": MultipleMonthsExample,
  "navigation-button-variants": NavigationButtonVariantsExample,
  "caption-layouts": CaptionLayoutsExample,
  "localized-navigation": LocalizedNavigationExample,
  "controlled-month-and-date": ControlledMonthAndDateExample,
  "disabled-dates": DisabledDatesExample,
  "grid-layout": GridLayoutExample,
  "custom-day": CustomDayExample,
  "browse-only": BrowseOnlyExample,
  "without-motion": WithoutMotionExample,
};
function PreviewAppointment() {
  return <SingleSelectionExample navigationLabel="Preview appointment navigation" />;
}
export function CalendarPreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : PreviewAppointment;
  if (!Example) return null;
  return (
    <PreviewStack className="min-w-0">
      <div className="flex w-full min-w-0 justify-center">
        <Example />
      </div>
    </PreviewStack>
  );
}
