# Select

> Choosing one value from a short list of options.

- Registry item: https://cadence.dev/r/select.json
- Install: `npx shadcn@latest add @cadence/select`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, geometry.resize, handoff, state.morph

## Installation

```install
npx shadcn@latest add @cadence/select
```

## Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cadence/select";

export function FrameworkSelect() {
  return (
    <Select defaultValue="next">
      <SelectTrigger className="w-48" aria-label="Framework">
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="next">Next.js</SelectItem>
        <SelectItem value="remix">Remix</SelectItem>
        <SelectItem value="astro">Astro</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

## Sizes

The default trigger is for forms; `size="sm"` fits dense rows. The empty control uses a placeholder without adding an empty option. Each select owns its value.

<ComponentExample name="sizes" />

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Sizes() {
  return <div className="flex flex-wrap items-center justify-center gap-3"><FrameworkSelect /><FrameworkSelect size="sm" /><FrameworkSelect empty /></div>;
}
```

## Groups and labels

`SelectGroup` and `SelectLabel` name related options; `SelectSeparator` separates groups. Orange is disabled while keyboard navigation can still reach Carrot.

<ComponentExample name="groups" />

```tsx
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/cadence/select";

export function Groups() {
  return (
    <Select items={[{ value: "apple", label: "Apple" }, { value: "orange", label: "Orange" }, { value: "carrot", label: "Carrot" }]} defaultValue="apple">
      <SelectTrigger aria-label="Produce"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="orange" disabled>Orange</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

## Controlled value

The caller owns `value` and `onValueChange`. The external action chooses Astro in this example only; selections in other cards stay independent.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";
import { Button } from "@/components/cadence/button";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Controlled() {
  const [value, setValue] = useState<string | null>("next");
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Select items={frameworks} value={value} onValueChange={setValue}>
          <SelectTrigger aria-label="Controlled framework"><SelectValue /></SelectTrigger>
          <SelectContent>{frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setValue("astro")}>Choose Astro externally</Button>
      </div>
      <output className="text-sm" aria-live="polite">Value: {value}</output>
    </div>
  );
}
```

## Form submission

`name` supplies the hidden input for FormData. `required` delegates empty-value checks to the browser; select a framework, then submit to read the caller-owned result.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";
import { Button } from "@/components/cadence/button";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function FormSubmission() {
  const [submitted, setSubmitted] = useState<string>();
  return (
    <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => {
      event.preventDefault();
      setSubmitted(String(new FormData(event.currentTarget).get("framework")));
    }}>
      <Select items={frameworks} name="framework" required>
        <SelectTrigger aria-label="Framework to submit"><SelectValue placeholder="Choose a framework" /></SelectTrigger>
        <SelectContent>{frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
      <Button type="submit">Submit framework</Button>
      <output className="w-full text-sm" aria-live="polite">{submitted ? `Submitted: ${submitted}` : "No submission yet"}</output>
    </form>
  );
}
```

## Disabled and invalid

Disabled prevents selection. Invalid is a supplied visual and accessible state, with an independently identified error; the caller decides when to clear it.

<ComponentExample name="disabled-invalid" />

```tsx
"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function DisabledInvalid() {
  const errorId = useId();
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Select items={frameworks} disabled defaultValue="next">
          <SelectTrigger aria-label="Framework, disabled"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="next">Next.js</SelectItem></SelectContent>
        </Select>
        <Select items={frameworks} defaultValue="astro">
          <SelectTrigger aria-label="Framework, invalid" aria-invalid="true" aria-describedby={errorId}><SelectValue /></SelectTrigger>
          <SelectContent>{frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <p id={errorId} className="text-sm text-destructive">This framework is unavailable for your project.</p>
    </div>
  );
}
```

## Multiple values

`multiple` keeps an array of values and leaves the list open while options are toggled. The trigger lists the selected labels; Escape closes the list and restores focus. Use Combobox for a searchable multi-select or chips.

<ComponentExample name="multiple" />

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

export function Multiple() {
  return (
    <Select items={frameworks} multiple defaultValue={["next", "astro"]}>
      <SelectTrigger aria-label="Multiple frameworks">
        <SelectValue placeholder="Choose frameworks" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## Panel placement

The first row fixes the four sides; the second fixes start, center and end alignment. These examples disable `alignItemWithTrigger` so the popup uses the requested anchored placement instead of overlaying the selected item. Viewport collision handling may flip the effective side. Each trigger keeps its own value and associated label.

<ComponentExample name="placement" />

```tsx
"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

export function Placement() {
  const id = useId();
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <div key={side} className="grid gap-2">
            <label htmlFor={`${id}-${side}`} className="text-xs capitalize">
              {side} panel
            </label>
            <Select items={frameworks} defaultValue="next">
              <SelectTrigger id={`${id}-${side}`} aria-label={`Framework, ${side} panel`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side={side} alignItemWithTrigger={false}>
                {frameworks.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(["start", "center", "end"] as const).map((align) => (
          <div key={align} className="grid gap-2">
            <label htmlFor={`${id}-${align}`} className="text-xs capitalize">
              {align} alignment
            </label>
            <Select items={frameworks} defaultValue="next">
              <SelectTrigger id={`${id}-${align}`} aria-label={`Framework, ${align} alignment`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align={align} alignItemWithTrigger={false}>
                {frameworks.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## When to use

- Choosing one value from a list that is too long for radios but too short to need search.
- A compact form control where the current value should stay visible in the trigger.
- A setting that changes the surface around it, so the value and its width should move together.

## When not to use

- Free-text or type-to-filter input. Use `combobox` once it ships, or an `input` with a datalist.
- Two or three mutually exclusive options that should stay visible. Use `radio-group`.
- Navigation between routes. Use a menu or links; a select submits a value, it does not navigate.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Select` | `value`, `defaultValue`, `onValueChange`, `disabled`, `required`, `name`, `multiple`, `items` | Base UI root; `items` lets `SelectValue` render labels from data. |
| `SelectTrigger` | `size` (`"sm" \| "default"`), native button props | Contains `SelectValue`; the chevron is rendered for you. |
| `SelectValue` | `placeholder` | The selected label, or the placeholder when empty. |
| `SelectContent` | `side`, `align`, `sideOffset`, `alignOffset`, `alignItemWithTrigger` | Portals, positions, and sizes to `--anchor-width`. |
| `SelectItem` | `value`, `disabled` | Renders the label and the check indicator. |
| `SelectGroup` / `SelectLabel` | group props | Purely structural. |
| `SelectSeparator` | separator props | A single hairline. |
| `SelectScrollUpButton` / `SelectScrollDownButton` | scroll-arrow props | Appear only when the list overflows. |

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| pointer selection | value slot width | `geometry.resize` | yes (physics-defined, clamped) |
| pointer selection | label `x`/`y` from the item to the trigger | `handoff` | yes |
| pointer selection | check `scale` / `opacity` | `state.morph` | yes |
| open / close | popup `opacity` / `scale` | `popup.anchored` | yes |
| reduced | width jumps, no flight, no scale; opacity stays | – | – |
| none | every duration is zero | – | – |

The trigger's label is laid out at its final width inside a clipped slot. Animating that slot's width
folds the surface without re-wrapping the label. The portalled label follows the live destination
as the trigger resizes, including shifts in centered or right-aligned rows, so the flight and real
label meet at the same position. Keyboard selection has no origin, so it changes the width and lets the label swap
without a flight; the pointer keeps the spatial handoff.
The portalled flight label uses its natural text width, so a longer selection stays fully visible
even if Base UI has not yet committed the destination label when its position is measured.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. The site header changes the inherited motion mode on the same component tree, including each named example. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive. A cancelled selection
does not fly the pointer label over the current value. Natural text width is observed
separately from the animated outer slot, including content and viewport changes.

## Keyboard interactions

- `Enter` / `Space` / `ArrowDown` opens the list and focuses the selected item.
- `ArrowUp` / `ArrowDown` moves the highlight; `Home` / `End` jump to the ends.
- Typeahead letters move the highlight to the next matching label.
- `Enter` selects; `Escape` closes without changing the value.
- `Tab` closes the list and moves focus to the next control.

## Accessibility

- Base UI renders the trigger as a combobox and the popup as a listbox, wired with
  `aria-expanded`, `aria-controls`, and `aria-activedescendant`.
- Name the control with `aria-label` or a visible external label associated with the trigger; the value alone is not a name.
- The selected item keeps `aria-selected="true"`; the check is a visual duplicate, not the only signal.
- Under reduced motion the value still changes and the check still appears; nothing is conveyed by
  the flight alone.
- The handoff clone is `aria-hidden`: screen readers hear the value once, from the trigger.

## Validation and data ownership

The caller owns selection values, validation, error text, submission and any remote
loading/filtering. Render supplied aria-invalid/data-invalid and associate described
errors; this component does not validate or install a form-state library.

## Responsive behavior

The popup is at least `--anchor-width` wide and caps at `--available-height`, so it flips and scrolls
inside the viewport. `alignItemWithTrigger` keeps the selected item over the trigger on touch, where a
list attached below the finger is harder to read. The width animation is short and only touches the
trigger, so a select in a toolbar does not reflow the page beyond its own row.

## Performance

- One measured width animation and, on pointer selection, one absolutely positioned label for the
  duration of the handoff. No blur and no shadow animation.
- Width is a layout property; it is allowed only on this T3 component and only through
  `geometry.resize`, which jumps under reduced and none.
- The list virtualisation is Base UI's; the component adds no per-item animation beyond the check
  indicator.
- Budget: T3 (12 KB gzip). If a page animates several selects at once, only the open one moves.

## Notes for AI

- Prefer `SelectValue placeholder="…"` over an empty first item; an empty item is a selectable value.
- Keep item labels short and distinct; typeahead matches their text.
- Do not add a separate "selected" class to the trigger; the value already carries the state.
- For invalid state, pass `aria-invalid`; the trigger styles it from the attribute.

---

Full index: https://cadence.dev/llms.txt
