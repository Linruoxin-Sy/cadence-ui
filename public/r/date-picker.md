# Date Picker

> Choose a single date or date range from an anchored calendar.

- Registry item: https://cadence.dev/r/date-picker.json
- Install: `npx shadcn@latest add @cadence/date-picker`
- Type: registry:block
- Since: 0.5.0
- Motion recipes: feedback.press, popup.anchored, exit.fade, data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/date-picker
```

The block installs Button, Calendar, Popover, their shared libraries and date-fns
4.1.0. The Date input and Time compositions additionally use Input and Field;
install them with `npx shadcn@latest add @cadence/input @cadence/field` before
copying those examples. For manual installation copy `registry/cadence/date-picker/index.tsx` to
`components/cadence/date-picker/index.tsx`, install those registry items and
`date-fns@4.1.0` plus `lucide-react`. Keep the sibling tree and relative imports.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority react-day-picker@9.13.2 date-fns@4.1.0 lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.
- [@cadence/cadence-content](https://cadence.dev/r/cadence-content.json) — transitive registry dependency.
- [@cadence/calendar](https://cadence.dev/r/calendar.json) — direct registry dependency.
- [@cadence/popover](https://cadence.dev/r/popover.json) — direct registry dependency.

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
| popover | `@components/cadence/popover/index.tsx` | [JSON files[].content](https://cadence.dev/r/popover.json) |
| date-picker | `@components/cadence/date-picker/index.tsx` | [JSON files[].content](https://cadence.dev/r/date-picker.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: cadence-content](https://cadence.dev/r/cadence-content.json)

[Source files: calendar](https://cadence.dev/r/calendar.json)

[Source files: popover](https://cadence.dev/r/popover.json)

[Source files: date-picker](https://cadence.dev/r/date-picker.json)

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
    --motion-stagger-reveal: 0.055s;
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
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
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

Copy all 12 target files, including every `cadence-motion` and
`cadence-provider` helper. Keep the sibling `cadence/` tree, relative imports
and shipped `"use client"` directives. Complete the linked manual base setup
with Cadence theme CSS, ensure Tailwind CSS v4 scans the copied files, and apply
`bg-background text-foreground` to your application root. Keep
`react-day-picker@9.13.2` and `date-fns@4.1.0` pinned. The default Calendar needs
no DayPicker stylesheet: its appearance comes from the copied Tailwind classes.
Enabling DayPicker's optional `animate` engine or replacing its parts requires
caller-owned styles and motion. `CadenceProvider` is optional; standalone
controls follow the system motion preference, and the provider selects a local
mode or clock.

For the Date input and Time examples, also copy these four additional files in
dependency order. Their complete recursive npm dependencies are `clsx`,
`tailwind-merge`, `@base-ui/react` and `class-variance-authority`, all already
included in the command above; reuse the existing `cadence-utils` file. No extra
CSS or validation package is required.

| Additional item | Target file | Full source |
| --- | --- | --- |
| [@cadence/input](https://cadence.dev/r/input.json) | `@components/cadence/input/index.tsx` | [JSON files[].content](https://cadence.dev/r/input.json) |
| [@cadence/label](https://cadence.dev/r/label.json) | `@components/cadence/label/index.tsx` | [JSON files[].content](https://cadence.dev/r/label.json) |
| [@cadence/separator](https://cadence.dev/r/separator.json) | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| [@cadence/field](https://cadence.dev/r/field.json) | `@components/cadence/field/index.tsx` | [JSON files[].content](https://cadence.dev/r/field.json) |

Input directly depends on `cadence-utils`; Field directly depends on
`cadence-utils`, Label and Separator. Label and Separator each depend on
`cadence-utils`. The [Input Manual](/components/input#installation) and
[Field Manual](/components/field#installation) expose these complete source
blocks. All other imports in Usage and the examples, including Button and the
provider, are covered by the base graph above.

The minimal [Usage](#usage) can remain a Server Component. The installed client
composition creates its own state and event handlers. Serializable `Date`
values, date ranges and plain `calendarProps` such as `defaultMonth`, `today`
and date matchers can cross that boundary. A serialized Date preserves an
instant, so server and browser time zones must agree on its civil fields for
matching trigger text. When they differ, pass civil year/month/day data to a
client wrapper and construct the local Date there; a server-created local
midnight is not a portable date-only value. Keep state hooks, change callbacks,
native event handlers, refs, render/component functions, custom formatters and
labels in a `"use client"` caller. Imported date-fns locale objects contain
functions: construct and pass them inside that client boundary, as the Locale
example does. Hooks and function-valued props in the controlled and custom-parts
examples belong to the caller.

`DatePickerDemo` is an editable composition. Omit `value` for internal state,
optionally seeded by `defaultValue`; a present `value`, including `undefined`,
is controlled. Pair it with `onValueChange` for editable controlled selection;
without that callback it is read-only. Keep the ownership model stable.
For controlled empty state, create the explicit `value={undefined}` inside a
client caller. The current RSC transport omits that own property, so a
server-passed undefined value becomes uncontrolled; serializable
nonempty Dates do not have that property-presence issue.
Use `mode="range"` with `DateRange` values; it defaults to two displayed months,
which `calendarProps.numberOfMonths` can override. Selection and deselection
leave the popup open. The composition owns `mode`, `selected`, `onSelect` and
`required`; use Calendar directly for multiple or required selection. Pair
`open` with `onOpenChange`, and `calendarProps.month` with `onMonthChange`, when
the application owns those states. `defaultOpen` initializes uncontrolled open
state. Calendar props also own disabled-date matchers, navigation limits and
range constraints; `disabled` on the composition disables its trigger.

Use local civil dates such as `new Date(year, monthIndex, day)`. A date-only ISO
string parses as UTC; it can display the previous local day. Pass deterministic
`defaultMonth` and `today` when the calendar must not depend on the host clock.
If setting DayPicker's `timeZone`, supply dates with matching civil fields and
keep trigger formatting consistent. The caller owns parsing, persistence,
submission, time-zone conversion and DST policy. The Date input example owns
its native ISO civil-date draft; Time owns a separate time string. This block
adds no hidden form value or validation. Render application errors through
`triggerProps` with `aria-invalid` and `aria-describedby`.

Keep the trigger in a shrinkable parent: its date text truncates, while the
available-size constrained popup scrolls. Range months stack at narrow widths
and sit beside each other at the Calendar's desktop breakpoint. Preserve a
focusable button and supplied props when customizing the trigger render, and
retain the popup title and Calendar keyboard semantics. Button owns the press
recipe, Popover owns its anchored open/close recipes, and Calendar owns month
transitions. Full plays their authored transforms and fades; reduced keeps
fades and drops transforms; none settles immediately. Date labels, selection
and calendar geometry update immediately in every mode.

## Usage

```tsx
import { DatePickerDemo } from "@/components/cadence/date-picker";

export function Appointment() {
  return <DatePickerDemo label="Appointment date" />;
}
```

An editable composition, using the [pinned Base example](https://github.com/shadcn-ui/ui/blob/96da9cc7f1aa10580a3741664e2a77c721206c00/apps/v4/examples/base/date-picker-demo.tsx)
and [guide](https://github.com/shadcn-ui/ui/blob/96da9cc7f1aa10580a3741664e2a77c721206c00/apps/v4/content/docs/components/base/date-picker.mdx),
with new-york-v4's calendar-icon treatment. There is no new date primitive.
The named `DatePickerDemo` export and initially empty single selection remain.
Selection leaves the popup open, including deselection of the selected day.

## Initial values

An omitted value starts empty. defaultValue seeds independent internal state; selecting the chosen day deselects it. A present value without onValueChange is read-only, so interacting with that calendar never changes its selection.

<ComponentExample name="initial-values" />

```tsx
"use client";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function InitialValues() {
  return (
    <div className="flex flex-wrap gap-3">
      <DatePickerDemo label="Optional date" placeholder="Choose an optional date" calendarProps={calendar} />
      <DatePickerDemo label="Initial date" defaultValue={new Date(2026, 10, 12)} calendarProps={calendar} />
      <DatePickerDemo label="Read-only date" value={new Date(2026, 10, 20)} calendarProps={calendar} />
    </div>
  );
}
```

## Controlled date and clearing

A present value prop, including undefined, is controlled. Clear and Set November 20 update only this specimen. While the popup is open an external selection update preserves the displayed month and focus tree; selected dates do not key or replace the Calendar. Keep the ownership model stable.

<ComponentExample name="controlled-date-and-clearing" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function ControlledDate() {
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
```

## Range and presets

Range mode shows two months. Select a start and an end date, or apply the caller-owned preset. This example requires two to seven nights and excludes November 5; DayPicker owns the range rules, including incomplete ranges. Clear passes a controlled undefined value. The trigger stays open after selection.

<ComponentExample name="range-and-presets" />

```tsx
"use client";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/cadence/button";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function RangePresets() {
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
```

## Disabled dates

disabled disables the entire trigger. calendarProps.disabled instead uses DayPicker matchers: this enabled calendar excludes weekends and November 5. Application rules decide acceptable dates; disabling UI does not validate submitted data.

<ComponentExample name="disabled-dates" />

```tsx
"use client";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function DisabledDates() {
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
```

## Birth dates

Dropdown captions provide a month and year route back to 1920. The final navigation year remains 2026, while days after November 1 are unavailable. The fixed today and defaultMonth keep the specimen deterministic without consulting the server clock.

<ComponentExample name="birth-dates" />

```tsx
"use client";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function BirthDates() {
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
```

## Locale

This fixed French locale changes both the date-fns PPP trigger text and the Calendar labels; weeks start on Monday. Locale does not imply direction. For right-to-left applications, set dir on the host and calendarProps.dir on the calendar. Dates remain Date objects.

<ComponentExample name="locale" />

```tsx
"use client";
import { fr } from "date-fns/locale";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function LocalizedDate() {
  return (
    <DatePickerDemo
      label="Rendez-vous"
      defaultValue={new Date(2026, 10, 12)}
      calendarProps={{ ...calendar, locale: fr, weekStartsOn: 1 }}
    />
  );
}
```

## Date input

Compose a labelled native date Input with the real picker. The caller owns the ISO civil-date draft, local year/month/day construction, empty state and synchronization. This example parses the complete value supplied by a native date input; it is not a free-text parser or a natural-language input.

<ComponentExample name="date-input" />

```tsx
"use client";
import { useId } from "react";
import { useState } from "react";
import { DatePickerDemo } from "@/components/cadence/date-picker";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function DateInput() {
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
```

## Time

A labelled native time Input owns a separate time string. Changing the day preserves the time. The application decides how to combine these values with a time zone, handle DST and serialize them. This block supplies no time picker primitive or automatic conversion.

<ComponentExample name="time" />

```tsx
"use client";
import { useId } from "react";
import { useState } from "react";
import { DatePickerDemo } from "@/components/cadence/date-picker";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function DateAndTime() {
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
```

## Controlled month and open state

Control month and onMonthChange together when navigation belongs to the application. Open December changes this specimen's month and open state; its own navigation remains usable. Close calendar demonstrates caller-owned dismissal. open/onOpenChange follow Base UI Popover semantics; defaultOpen initializes an uncontrolled popup when needed.

<ComponentExample name="controlled-month-and-open" />

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function ControlledMonthAndOpen() {
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
```

## Caller-owned errors

A caller-supplied error reaches the real trigger through aria-invalid and aria-describedby. Its unique description belongs to this specimen. This read-only empty value represents an error already determined by the application; no validation callback or schema is introduced.

<ComponentExample name="caller-errors" />

```tsx
"use client";
import { useId } from "react";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function CallerErrors() {
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
```

## Custom parts and native props

Native div props, styles and React 19 refs pass to the root. triggerProps customizes the actual Button and preserves its click handler and focus ref; contentProps aligns and styles the real popup. The focus action demonstrates that ref and the count observes actual trigger activations. Custom render elements must remain focusable buttons and retain supplied props.

<ComponentExample name="custom-parts" />

```tsx
"use client";
import { useRef } from "react";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DatePickerDemo } from "@/components/cadence/date-picker";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function CustomParts() {
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
```

## Without motion

This named specimen explicitly overrides the header with a fixed none provider. Trigger, popup and month navigation have zero animation from their first insertion. All other specimens inherit the header's motion, speed and theme.

<ComponentExample name="without-motion" />

```tsx
"use client";
import { DatePickerDemo } from "@/components/cadence/date-picker";
import { CadenceProvider } from "@/components/cadence/lib/provider";

const calendar = { defaultMonth: new Date(2026, 10, 1), today: new Date(2026, 10, 1) };

export function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <DatePickerDemo label="Static appointment" defaultValue={new Date(2026, 10, 12)} calendarProps={calendar} />
    </CadenceProvider>
  );
}
```

## When to use

- Appointment dates and optional calendar selection.
- Travel ranges, with application-owned presets and constraints.
- A starting composition to edit for your application's form.

## When not to use

- An always-visible date grid: use [Calendar](/components/calendar).
- Time-only entry: use a labelled [Input](/components/input) with `type="time"`.
- Free-form language parsing: supply your application's parser and draft state.

## API

`DatePickerDemoProps` is a discriminated union; range values require `mode="range"`.
Native div props, React 19 ref/cleanup, classes and styles go to `data-slot="date-picker"`.

| Prop | Type | Default / behaviour |
| --- | --- | --- |
| `mode` | `"single" \| "range"` | `"single"` |
| `value` / `defaultValue` | `Date` or `DateRange` | initially empty; present value is controlled |
| `onValueChange` | `(value: Date \| undefined) => void`, range equivalent | observes selection/deselection |
| `label` | `string` | `"Choose date"`; accessible trigger prefix and popup title |
| `placeholder` | `string` | `"Pick a date"` |
| `disabled` | `boolean` | `false`, disables trigger |
| `open` / `defaultOpen` / `onOpenChange` | Popover props | Base UI ownership and event details |
| `calendarProps` | corresponding optional-selection Calendar props | autoFocus, selected default month; range two months |
| `triggerProps` | `ButtonProps` | outline button; caller classes/styles/callbacks last |
| `contentProps` | `PopoverContent` props | start-aligned, available-size constrained, scrollable |

Selection props (`mode`, `selected`, `onSelect`, `required`) are owned by the
composition. Use Calendar directly for required/multiple selection. Other
calendar overrides remain caller-owned, including month, locale, focus and
components. A custom render must retain a focusable button and the supplied props.

## Motion contract

T2 describes existing control motion. No date label animation, layout tween,
selection-keyed remount, new recipe or runtime is added.

| Recipe / cause | full | reduced | none |
| --- | --- | --- | --- |
| `feedback.press/one-shot` / trigger press | token spring scale | no scale | immediate |
| `popup.anchored/css-transition` / open | opacity and token scale | opacity only | visible first frame |
| `exit.fade/css-transition` / close | opacity and scale | opacity only | immediate |
| `data.transition/one-shot` / calendar month | token horizontal translation and opacity | opacity only | immediate |

Popover resolves its own `duration.fast` clock with timeScale and reducedDurationScale
inside the portal. Nested full can recover under outer none; OS reduce still wins.
Live reduced drops scale and live none cancels transitions immediately. Calendar
cancels its WAAPI effect on mode changes without replacing the grid or focused day.

## Keyboard and accessibility

Tab reaches the named trigger; Space/Enter opens the dialog. Calendar focuses the
selected enabled day or its initial focus target. Arrow keys move days, Home/End
move within the week, PageUp/PageDown navigate months. Escape dismisses and returns
focus to the trigger. Selecting a day keeps the popup open. Screen readers hear
the popup title, grid month, day labels and selected states. Range selection retains
DayPicker's grid model. Button names include the label and formatted selection.

## Validation and data ownership

The caller owns validation, parsing, submission, storage, fetching and time-zone
policy. Use `triggerProps` for `aria-invalid` or `aria-describedby`. No schema,
resolver, validation callback or hidden form input is added. Serialize selected
values explicitly in the application.

## Responsiveness and performance

The trigger truncates long labels within the available width. The popup is bounded
by Base UI's available width/height and scrolls; range months stack on small screens
and sit side by side on desktop. No document overflow is required. Deterministic
example dates are SSR-compatible; empty uncontrolled selection renders without
reading the clock. DayPicker's current-month fallback depends on the host clock;
pass `defaultMonth` and `today` for deterministic server/client calendars.

Use local civil dates such as new Date(year, monthIndex, day). A date-only ISO string parses as UTC and can display the previous local day. For DayPicker timeZone, construct dates for that zone (for example TZDate) so trigger and calendar share civil fields. The caller owns persistence, UTC conversion and DST policy. These examples deliberately use fixed local dates.

## Notes for AI

- Keep this a registry block with namespaced dependencies and relative imports.
- Keep value presence semantics so controlled undefined clears correctly.
- Preserve stable Calendar identities and Base UI focus/render/event semantics.
- Keep locale and civil-date/time-zone policy explicit in the caller.
- Related: [Calendar](/components/calendar), [Popover](/components/popover), [Button](/components/button).

---

Full index: https://cadence.dev/llms.txt
