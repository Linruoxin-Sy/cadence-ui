# Calendar

> Select dates, multiple days, and ranges with accessible month navigation.

- Registry item: https://cadence.dev/r/calendar.json
- Install: `npx shadcn@latest add @cadence/calendar`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/calendar
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority react-day-picker@9.13.2 date-fns@4.1.0 lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.
- [@cadence/cadence-content](https://cadence.dev/r/cadence-content.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| cadence-content | `@components/cadence/lib/content-transition.ts` | [JSON files[].content](https://cadence.dev/r/cadence-content.json) |
| calendar | `@components/cadence/calendar/index.tsx` | [JSON files[].content](https://cadence.dev/r/calendar.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: cadence-content](https://cadence.dev/r/cadence-content.json)

[Source files: calendar](https://cadence.dev/r/calendar.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy every target file in Calendar and its recursive dependencies, including Button and the content phase helper, into the
same `cadence/` tree. Preserve relative imports and shipped `"use client"`
directives. Button is already a recursive dependency, including its full npm
dependencies and source; the Controlled month and date example needs no
additional installation. All other examples use packages and provider files
already listed above.

Complete the base theme setup and ensure Tailwind CSS v4 scans the copied
files. Calendar supplies its own DayPicker class names; no additional
Calendar-specific stylesheet or `react-day-picker/style.css` import is
required. Keep DayPicker's optional `animate` CSS clock off when using
Cadence month motion.

Keep `"use client"` on the caller files shown in Usage and all examples.
Declare selection/month state, event handlers, refs, function matchers,
`labels`, `formatters` and custom `components` inside that client boundary.
date-fns locale objects such as `enUS`, `fr` and `arSA` contain functions:
import and pass them inside the client caller as well. A Server Component can
render Calendar with serializable props, including Date values and plain
date/range/weekday matchers, or pass those values to a client wrapper; Date
objects alone do not require a client caller. Controlled values need their
matching client callbacks. Omitting `mode` browses dates without selection.

The caller owns selected dates/ranges, visible month when controlled,
timezone, form serialization and application validation. Pass consistent
`defaultMonth`, `today` and, when needed, `timeZone` across server and
browser. For native dropdown captions, supply an explicit locale within the
client wrapper to avoid environment-dependent month formatting. Locale does
not translate the pinned DayPicker's default previous/next labels: provide
`labels` for those controls and distinct `aria-label`/`labels.labelNav`
names for multiple calendars. The examples compose visible day numerals with
localized accessible dates; preserve that composition when changing formatters.

Keep the complete DayPicker props on a custom day component, including its
events, disabled state, children and focus modifiers. The Custom day example
wraps `CalendarDayButton` and passes its locale explicitly. Replacing
`Month` or `MonthGrid` also replaces the default month motion owner;
caller-provided grid opacity/transform styles take precedence over the
corresponding animation property.

Provider imports are required; wrapping is optional. Standalone Calendar
respects the system preference. Month changes fade and translate the existing
grid in full mode, fade only in reduced, and update immediately in none.
First paint and selection/range styles are static, and week-count height
changes immediately. A fixed `CadenceProvider mode="none"` also disables
month animation under a full-mode parent. Do not key/remount Calendar by month
to animate it; keep focus and caller drafts in the existing tree.

Cells default to 32px; allow space for larger cells, week numbers and multiple
months. Months stack below `md` and form a row at `md`. Server-rendered
dates, initial selection, native caption options and source files remain
readable without JavaScript; navigation, selection, focus management and
caller actions require hydration. Calendar is inline and creates no hidden
form field or popup. Follow [Usage](#usage) for the client selection example.

## Usage

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

export function SingleSelectionExample() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  return (
    <Calendar
      {...stable}
      aria-label="Appointment date"
      labels={{ ...stable.labels, labelNav: () => "Appointment date navigation" }}
      mode="single"
      selected={date}
      onSelect={setDate}
      footer={date ? `Selected: ${date.toDateString()}` : "Choose a date"}
    />
  );
}
```

## Single selection

Select one appointment, or select it again to clear it. The caller owns `selected`; the footer announces the value. Use `required` when clearing by selecting the same day must be prevented.

<ComponentExample name="single-selection" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

export function SingleSelectionExample() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 12));
  return (
    <Calendar
      {...stable}
      aria-label="Appointment date"
      labels={{ ...stable.labels, labelNav: () => "Appointment date navigation" }}
      mode="single"
      selected={date}
      onSelect={setDate}
      footer={date ? `Selected: ${date.toDateString()}` : "Choose a date"}
    />
  );
}
```

## Multiple dates

Choose one to three independent workshop days with `required`, `min` and `max`. In pinned DayPicker 9.13.2, selecting a fourth date resets the selection to that new date; it does not keep the previous three or disable all other dates.

<ComponentExample name="multiple-dates" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Date ranges

Choose a weekday trip of at least two nights. `min` counts nights, not inclusive dates. Weekends are disabled; with `excludeDisabled`, clicking an end across a disabled day resets the start to the clicked date. The caller owns the partial and completed range.

<ComponentExample name="date-ranges" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Multiple months

A two-month range stays visible across November and December. `pagedNavigation` advances by two months. The real months stack below md and sit side by side at md; `fixedWeeks` reserves six rows in each month. Selection remains one range across both grids.

<ComponentExample name="multiple-months" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Navigation button variants

All six `buttonVariant` values apply to previous/next navigation buttons. Day buttons keep their selection styling. Each calendar navigates independently; the labels identify the comparison rather than changing any prop.

<ComponentExample name="navigation-button-variants" />

```tsx
"use client";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

export function NavigationButtonVariantsExample() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {(["default", "secondary", "destructive", "outline", "ghost", "link"] as const).map((variant) => (
        <div key={variant} className="grid gap-2">
          <p className="text-sm font-medium">{variant}</p>
          <Calendar {...stable} aria-label={`${variant} navigation`}
      labels={{ ...stable.labels, labelNav: () => `${variant} navigation` }} buttonVariant={variant} />
        </div>
      ))}
    </div>
  );
}
```

## Caption layouts

Compare `label`, `dropdown`, `dropdown-months` and `dropdown-years` directly. These are real native month/year navigation controls, bounded by `startMonth` and `endMonth`. An explicit `enUS` locale keeps dropdown formatting consistent between server and browser.

<ComponentExample name="caption-layouts" />

```tsx
"use client";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Localized navigation

The French calendar starts weeks on Monday and offers native dropdowns. The Arabic calendar has an explicit RTL direction and narrow visible weekday labels; its accessible weekday names remain complete. A date-fns locale localizes dates, but pinned DayPicker keeps default previous/next labels in English: provide `labels` for those controls as well. Each calendar has its own accessible name and language.

<ComponentExample name="localized-navigation" />

```tsx
"use client";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { enUS, fr, arSA } from "date-fns/locale";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
        labels={{ ...stable.labels, labelNav: () => "Navigation du calendrier français", labelNext: () => "Mois suivant", labelPrevious: () => "Mois précédent" }}
      />
      <Calendar
        {...stable}
        aria-label="التقويم العربي"
        lang="ar"
        dir="rtl"
        locale={arSA}
        formatters={{ formatWeekdayName: (date) => date.toLocaleDateString("ar-SA", { weekday: "narrow" }) }}
        labels={{ ...stable.labels, labelNav: () => "التنقل في التقويم العربي", labelNext: () => "الشهر التالي", labelPrevious: () => "الشهر السابق" }}
      />
    </div>
  );
}
```

## Controlled month and date

Both the visible month and selected date belong to this example. “Set November 20” updates them together; “Clear appointment” clears only the selection. Navigation and keyboard changes still call `onMonthChange`. The note is an independent draft that should survive month changes, site motion changes and source expansion. Install Button as well for these caller-owned actions.

<ComponentExample name="controlled-month-and-date" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";
import { Button } from "@/components/cadence/button";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Disabled dates

Compose exact-date, before-date and weekday matchers. November 5 is unavailable and November 11 is hidden. Disabled dates remain visible but cannot be selected; hidden dates leave their grid position empty. These are presentation and selection constraints, not application validation or server authorization.

<ComponentExample name="disabled-dates" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Grid layout

Compare a six-row grid with week numbers and Monday starts against a larger-cell calendar hiding outside-month dates. `showOutsideDays` defaults to true; `fixedWeeks` and `showWeekNumber` default to false. `--cell-size` belongs to the caller, not a Calendar size enum.

<ComponentExample name="grid-layout" />

```tsx
"use client";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Custom day button

Compose the exported `CalendarDayButton` to preserve native events, disabled state, focus and modifiers while adding a decorative availability dot on Tuesdays. The caption formatter and today class are caller overrides. A static `styles.month_grid.opacity: 1` keeps text at full contrast and takes precedence over the opacity animation; the grid can still translate in full mode. Replacing Month or MonthGrid entirely also takes ownership of month motion.

<ComponentExample name="custom-day" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { useState } from "react";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import type { DayButtonProps } from "react-day-picker";
import { Calendar, CalendarDayButton } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
```

## Browse without selection

Omitting `mode` displays dates without selectable day buttons. The first calendar can browse only November–December; `disableNavigation` keeps disabled navigation buttons, while `hideNavigation` removes them. These fixed calendars have independent navigation and no invented selected value.

<ComponentExample name="browse-only" />

```tsx
"use client";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/cadence/calendar";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

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
      <Calendar {...stable} aria-label="Navigation disabled"
      labels={{ ...stable.labels, labelNav: () => "Disabled calendar navigation" }} disableNavigation />
      <Calendar {...stable} aria-label="Navigation hidden"
      labels={{ ...stable.labels, labelNav: () => "Hidden calendar navigation" }} hideNavigation />
    </div>
  );
}
```

## Without motion

This named example intentionally overrides the header with a fixed `CadenceProvider mode="none"`. Its first paint and later month changes are immediate. Ordinary examples inherit the header, including the system reduced-motion preference; reduced mode fades the grid without translating it.

<ComponentExample name="without-motion" />

```tsx
"use client";
import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/cadence/calendar";
import { formatDay, labelDayButton, labelGridcell } from "react-day-picker";
import { CadenceProvider } from "@/components/cadence/lib/provider";

const november = new Date(2026, 10, 1);
const today = new Date(2026, 10, 4);
const stable = {
  defaultMonth: november, today, locale: enUS, className: "min-w-64 rounded-md border",
  labels: {
    // Include the visible numeral while retaining the localized date and today/selected context.
    labelDayButton: (...args: Parameters<typeof labelDayButton>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelDayButton(...args)}`,
    labelGridcell: (...args: Parameters<typeof labelGridcell>) =>
      `${formatDay(args[0], args[2], args[3])}, ${labelGridcell(...args)}`,
  },
};

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <Calendar {...stable} aria-label="Instant month navigation"
      labels={{ ...stable.labels, labelNav: () => "Instant calendar navigation" }} mode="single" />
    </CadenceProvider>
  );
}
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
| animate | boolean | false | Forwarded upstream API; selecting it yields Cadence grid paint to the caller-owned DayPicker animation stylesheet. |

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
Each actual grid retains its local token scope. Equal policies share the phase; incompatible
per-grid clocks use native paint together. A grid-local zero cancels the group before paint.
Changing month count or replacing a host establishes a current baseline. Same-count reorder with
unknown direction fades changed grids without invented travel.
All actual month slots share one bounded scalar phase for opacity and signed translation, including RTL.
A missing safe root-padding corridor uses opacity only. Focus-driven month crossings stay immediately
visible. The known month set is preflighted before per-grid reads; over 50 visuals use native paint.
Any live clock edit cancels the current grid effects; the next month change uses the new local token
clock. Zero starts no effect. Hidden/offscreen, print and forced-colours cancel only the owned WAAPI
handle, and restoring visibility or full motion does not replay the current month.

## Accessibility

DayPicker owns grid labels, selected/disabled semantics and roving focus. Native month/year
selects stay keyboard reachable. Pass a meaningful `aria-label` when several calendars appear, and a distinct `labels.labelNav` for each navigation landmark. These examples prepend the visible day numeral to DayPicker’s existing `labelDayButton` and browse-only `labelGridcell`, preserving its localized full date and today/selected context for speech input. These are caller-owned label overrides; Calendar retains DayPicker’s defaults. If you customize `formatDay` or locale-provided day labels, compose those same values into the accessible name.
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

Committed navigation reads only the actual root/grid paint corridor after bounded preflight; there
are no render/frame layout reads, duplicate month trees or animation timers. One shared phase drives
the changing grids; dates and keyboard focus remain managed by DayPicker. The dependency is pinned to
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
