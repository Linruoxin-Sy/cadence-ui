# Toggle Group

> Text alignment, view density, and other mode sets.

- Registry item: https://cadence.dev/r/toggle-group.json
- Install: `npx shadcn@latest add @cadence/toggle-group`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: feedback.press, layout.shared, state.morph

## Installation

```install
npx shadcn@latest add @cadence/toggle-group
```

Installing the group also installs `toggle`, because the items share its variant
classes.

## Usage

```tsx
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function Alignment() {
  return (
    <ToggleGroup variant="outline" defaultValue={["left"]} aria-label="Text alignment">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Visual variants

Default, outline and segmented are fixed, independent single-selection groups. Each starts on Week; clicking its selected item clears it.

<ComponentExample name="variants" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function GroupVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "outline", "segmented"] as const).map((variant) => (
        <ToggleGroup key={variant} variant={variant} defaultValue={["week"]} aria-label={`${variant} range`}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
```

## Multiple

Multiple permits independent marks. Adjacent pressed fills join at zero spacing. Pressing Bold off does not change Italic.

<ComponentExample name="multiple" />

```tsx
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function MultipleGroup() {
  return (
    <ToggleGroup multiple defaultValue={["bold"]} aria-label="Text style">
      <ToggleGroupItem value="bold" aria-label="Bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Segmented with a required selection

The caller ignores empty arrays to require one selection. The pill style alone does not require a value or select a newly focused item.

<ComponentExample name="segmented" />

```tsx
"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function SegmentedGroup() {
  const [range, setRange] = useState(["week"]);
  return (
    <ToggleGroup
      variant="segmented"
      value={range}
      onValueChange={(next) => {
        if (next.length) setRange(next);
      }}
      aria-label="Time range"
    >
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Spacing

Zero spacing joins adjacent pressed fills; one spacing step separates them. Both groups retain independent multiple selection and an outer strip.

<ComponentExample name="spacing" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function GroupSpacing() {
  return (
    <div className="flex flex-wrap gap-4">
      {[0, 1].map((spacing) => (
        <ToggleGroup
          key={spacing}
          variant="outline"
          multiple
          spacing={spacing}
          defaultValue={["bold", "italic"]}
          aria-label={`Spacing ${spacing}`}
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
```

## Vertical

A fixed vertical group lays out items in a column and uses Up/Down for roving focus. Focus alone does not change selection.

<ComponentExample name="vertical" />

```tsx
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function VerticalGroup() {
  return (
    <ToggleGroup orientation="vertical" variant="outline" defaultValue={["left"]} aria-label="Vertical alignment">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRightIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Sizes

Small, default and large items are 32, 36 and 40px tall. These three horizontal groups use their own fixed size, inherited by each item.

<ComponentExample name="sizes" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function GroupSizes() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <ToggleGroup key={size} size={size} variant="outline" defaultValue={["day"]} aria-label={`${size} size`}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
```

## Controlled

The value is always an array, including for a single-selection group. The external alignment button changes only this caller-owned value; choosing the selected item can clear it.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function ControlledGroup() {
  const [value, setValue] = useState(["center"]);
  return (
    <div className="grid justify-items-start gap-3">
      <ToggleGroup value={value} onValueChange={setValue} aria-label="Controlled alignment">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Selection: {value[0] ?? "none"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setValue(["left"])}>
        Align left externally
      </Button>
    </div>
  );
}
```

## Disabled

The first group skips a disabled middle item when moving focus and uses loopFocus={false} to stop at either end. The default is to wrap focus. The second disables the whole group and retains its selected Day.

<ComponentExample name="disabled" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function DisabledGroups() {
  return (
    <div className="flex flex-wrap gap-4">
      <ToggleGroup defaultValue={["day"]} loopFocus={false} aria-label="Disabled item" variant="outline">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week" disabled>
          Week
        </ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup disabled defaultValue={["day"]} aria-label="Disabled group" variant="outline">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
```

## Explicit motion scopes

The first group is fixed to none from its first DOM appearance. A second provider explicitly selects full inside that outer none scope; the system reduced-motion preference still wins. All ordinary groups inherit the site header.

<ComponentExample name="without-motion" />

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function StaticGroup() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <div data-testid="initial-none">
          <ToggleGroup value={["static"]} aria-label="Static group">
            <ToggleGroupItem value="static">On</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <ToggleGroup defaultValue={["first"]} aria-label="Explicit full toggle-group">
              <ToggleGroupItem value="first">First</ToggleGroupItem>
              <ToggleGroupItem value="second">Second</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A small set of modes that belong to one control: text alignment, view density,
  a time range.
- A formatting toolbar where several marks can be active at once
  (`multiple`).
- Icon toolbars with a shared tinted fill (`default` or `outline`), or short text
  choices on a pill-shaped track (`segmented`).

## When not to use

- Exactly one option with a text label and a longer list; use `radio-group`, which
  exposes radio semantics rather than a row of toggle buttons.
- A single independent on/off command; use `toggle`.
- Navigation between pages; use `tabs`, which owns `role="tablist"`.

## API

### `ToggleGroup`

| Prop            | Type                                        | Default        | Description                              |
| --------------- | ------------------------------------------- | -------------- | ---------------------------------------- |
| `value`         | `readonly string[]`                         | –              | Controlled pressed values.               |
| `defaultValue`  | `readonly string[]`                         | `[]`           | Uncontrolled initial values.             |
| `onValueChange` | `(value: string[], details) => void`        | –              | Fired when any item changes.             |
| `disabled`      | `boolean` | `false` | Disables every item. |
| `loopFocus`     | `boolean` | `true` | Wrap arrow focus at either end. |
| `multiple`      | `boolean`                                   | `false`        | Allow more than one pressed item.        |
| `spacing`       | `number`                                    | `0`            | Gap in Tailwind spacing steps.           |
| `orientation`   | `"horizontal" \| "vertical"`                | `"horizontal"` | Axis, also drives arrow keys.            |
| `variant`       | `"default" \| "outline" \| "segmented"`     | `"default"`    | Shared strip, bordered strip, or pill track. |
| `size`          | `"sm" \| "default" \| "lg"`                 | `"default"`    | Inherited by every item.                 |

### `ToggleGroupItem`

| Prop        | Type     | Default | Description                          |
| ----------- | -------- | ------- | ------------------------------------ |
| `value`     | `string` | –       | Required. Identifies the item.       |
| `disabled`  | `boolean`| `false` | Keeps it visible but unpressable.    |
| `className` | `string` / state callback | –       | Merged last.                         |

The default press button preserves native React `onAnimationStart`, `onDrag`,
`onDragStart` and `onDragEnd` events, including capture and cancellation. Callback
and object refs follow the same button; replacing a callback runs its React 19
cleanup before assigning the next ref. A caller `render` replaces the default
renderer and owns spreading its supplied props.

## Motion contract

Single selection uses one shared decorative fill scoped to each group. Multiple
selection keeps one local fill per item. Neither changes the buttons' layout
boxes; corner changes that join neighboring fills are immediate state styling.

| Phase   | Properties       | Token            | Interruptible |
| ------- | ---------------- | ---------------- | ------------- |
| press   | `scale 1 → 0.97` | `feedback.press` | yes           |
| release | `scale 0.97 → 1` | `feedback.press` | yes           |
| single selection | fill transform between items | `layout.shared` | yes |
| multiple selection | fill opacity and `scale 0.96 → 1` | `state.morph` | yes |
| reduced | shared fill jumps; local fills fade; no press scale | – | – |
| none | immediate selection, opacity and press state; zero duration | – | – |

Press scale applies only to the content, keeping the button and decorative fill
in the group's common stacking context. A travelling fill stays below all labels
and icons, including the items it crosses and the focused destination.

Full mode uses the velocity-preserving shared spring. Reduced, none and a zero
recipe clock render a static single-selection fill, cancelling an in-flight
projection without replacing the focused button. Local fills keep opacity under
reduced and settle immediately under none. All animated parts expose
`data-motion`; every duration, scale and spring comes from Cadence tokens.

## Keyboard interactions

| Keys               | Action                                        |
| ------------------ | --------------------------------------------- |
| `Tab`              | Enters the group at the last pressed item.    |
| `Arrow Right/Down` | Moves focus to the next item.                 |
| `Arrow Left/Up`    | Moves focus to the previous item.             |
| `Space` / `Enter`  | Presses the focused item.                     |

With `loopFocus` (default) the arrows wrap around at the ends.

## Accessibility

- The group renders `role="group"`; each item is a `<button>` with `aria-pressed`.
- Name the group with `aria-label` or `aria-labelledby` — a row of icon buttons
  with no group name is announced as unrelated buttons.
- Icon-only items need their own `aria-label`; the group name does not describe
  them.
- Do not use a toggle group where `role="tablist"` is correct; tabs imply a panel
  that is shown, a toggle group implies state.
- Selection fills are decorative (`aria-hidden`) and never receive focus.

## Validation and data ownership

| The component does                              | You do                                    |
| ----------------------------------------------- | ----------------------------------------- |
| Forwards `disabled` and the pressed values      | Deciding whether a selection is required  |
| Renders the visual pressed state                | Persisting the choice                     |
| Exposes `aria-invalid` styling on items         | Validation and error text                 |

[Field](/components/field) shows how the invalid state and its message are wired.

## Responsive behavior

Horizontal groups do not wrap; with more than about five items on a narrow screen,
switch to `orientation="vertical"` or replace the group with a `select`.

## Performance

One shared layout identity per single-selection group; Motion measures the fill
when selection changes. Multiple selection uses one local opacity/scale fill per
item. Press feedback stays on demand. No observers, timers or render-time layout
reads; use small option sets rather than long lists.

## Notes for AI

- `value` is an array in every mode, with or without `multiple`.
- Use `variant="segmented"` for a pill-shaped control; no separate component is needed.
- Use `multiple` for independent pressed fills; `spacing={0}` joins neighbors.
- To require a selection, control the value and ignore empty change requests.
- For "one of N" with text labels, prefer `radio-group`; for panels, `tabs`.

---

Full index: https://cadence.dev/llms.txt
