# Calendar

> Select dates, multiple days, and ranges with accessible month navigation.

- Registry item: https://cadence.dev/r/calendar.json
- Install: `npx shadcn@latest add @cadence/calendar`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: data.transition

## Installation

```install
npx shadcn@latest add @cadence/calendar
```

## Usage

```tsx
"use client";
import { useState } from "react";
import { Calendar } from "@/components/cadence/calendar";

export function Example() {
  const [date, setDate] = useState<Date | undefined>();
  return <Calendar mode="single" selected={date} onSelect={setDate} />;
}
```

## Multiple dates

```tsx
const [days, setDays] = useState<Date[] | undefined>([]);
<Calendar mode="multiple" selected={days} onSelect={setDays} max={5} />;
```

## Date ranges

```tsx
import type { DateRange } from "react-day-picker";
const [range, setRange] = useState<DateRange | undefined>();
<Calendar mode="range" selected={range} onSelect={setRange} min={2}
  disabled={{ dayOfWeek: [0, 6] }} excludeDisabled />;
```

## Localized navigation

```tsx
import { fr } from "date-fns/locale";
<Calendar locale={fr} weekStartsOn={1} captionLayout="dropdown"
  startMonth={new Date(2020, 0)} endMonth={new Date(2030, 11)} />;
```

## When to use

- Pick a date in a booking or scheduling interface.
- Select several independent days or a contiguous range.
- Browse adjacent months with keyboard and localized captions.

## When not to use

Use an Input for free-form date text. Compose a Popover for a date-picker field;
Calendar itself is an inline calendar, without field serialization or popup orchestration.

## API

### `Calendar`

All DayPicker 9.13.2 props and discriminated selection types are preserved.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| mode | single / multiple / range | undefined | No selection when omitted. |
| selected / onSelect | DayPicker selection type / handler | — | Caller owns selected values. |
| month / onMonthChange | Date / handler | — | Controlled navigation. Otherwise use defaultMonth. |
| showOutsideDays | boolean | true | Show days from adjacent months. |
| captionLayout | DayPicker caption layout | label | Label or native month/year dropdowns. |
| buttonVariant | Button variant | ghost | Navigation button appearance. |
| locale / weekStartsOn | Partial Locale / 0–6 | DayPicker locale | Labels, formatting and week boundary. |
| disabled / hidden | Matcher or Matcher[] | — | DayPicker matching rules. |
| numberOfMonths / fixedWeeks / showWeekNumber | number / boolean / boolean | 1 / false / false | Grid layout options. |
| className / classNames / style / styles | DayPicker styles | — | Caller overrides win. |
| formatters / labels / components | DayPicker overrides | — | Override individual formatters, accessible labels or entire parts. |
| animate | boolean | false | Forwarded upstream API; external DayPicker animation CSS is caller-owned. Do not combine a second CSS clock with Cadence motion. |

### `CalendarDayButton`

Accepts DayPicker's DayButton props (`day`, `modifiers`, native button attributes) plus
`locale?: Partial<Locale>`. Preserves native events, disabled state, classes, styles and
focus management. Selection and range modifiers have the upstream data attributes.
Custom components replace default parts completely and must maintain the same accessibility
and motion contract. A custom Month or MonthGrid also takes ownership of month motion.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Month changes | opacity and signed horizontal transform on the actual grid | `data.transition`, distance.sm | Yes; latest month replaces the target, without remounting the month tree. |
| Reduced | opacity only | `data.transition` reduced | Mode changes settle running motion. |
| None | Immediate grid update | zero duration | No animation is started. |
| Selection / enter / exit | Static selection and range styles | none | No decoration on mount. |

The same grid responds to buttons, native dropdowns, keyboard navigation and external controlled
month updates. Week-count height changes immediately. Caller transform/opacity styles take
precedence over the corresponding animation property. No outgoing duplicate steals focus.

## Accessibility

DayPicker owns grid labels, selected/disabled semantics and roving focus. Native month/year
selects stay keyboard reachable. Pass a meaningful `aria-label` when several calendars appear.
DayPicker 9.13.2 keeps its default navigation labels in English even with a date-fns locale;
provide `labels` to localize those strings. Use the `footer` live region or a separate status for selected values. Do not replace a day
with a non-interactive element in a selectable calendar.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Arrow keys | Previous/next day or week; crosses month boundaries. |
| Home / End | Start/end of week. |
| Page Up / Page Down | Previous/next month. |
| Shift + Page Up / Page Down | Previous/next year. |
| Enter / Space | Select focused day using the active selection mode. |
| Tab | Move between navigation, caption controls and the roving day target. |

## Validation and data ownership

Calendar renders the caller's selection and disabled matchers. The caller owns business rules,
validation, timezone, serialization and form state. No hidden field or schema is created.
DayPicker's required/min/max/excludeDisabled selection behavior is forwarded unchanged.
In 9.13.2, selecting another date at the multiple-mode max resets selection to that date.
With excludeDisabled, a range crossing a disabled date resets its start to the clicked date.

## Responsive behavior

Cells default to 32px and can be enlarged with `className="[--cell-size:--spacing(10)]"`.
Multiple months stack vertically below md and become a row at md. Provide enough space when
customizing cells, week numbers or month counts. The preview is checked at 390px and 1280px.

## Performance

No layout measurements, duplicate month DOM or animation timers. Only the changing month grid
animates; dates and keyboard focus remain managed by DayPicker. The dependency is pinned to
9.13.2 with date-fns 4.1.0. Pass an explicit defaultMonth/today/timeZone when server and client
must agree across timezone or date boundaries. For SSR dropdown captions, pass an explicit locale
(e.g. enUS from date-fns/locale): the pinned upstream formatter uses the environment locale
when locale is omitted, which can differ between server and browser.

## Notes for AI

Keep the discriminated DayPicker selection props together. Do not introduce validation or
remount with a month key to animate. Prefer Calendar inside Popover for a field, and preserve
custom labels, locale and disabled matchers when composing it.

---

Full index: https://cadence.dev/llms.txt
