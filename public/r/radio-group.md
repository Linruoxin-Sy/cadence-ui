# Radio Group

> Choosing one option from a small, fixed set.

- Registry item: https://cadence.dev/r/radio-group.json
- Install: `npx shadcn@latest add @cadence/radio-group`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

```install
npx shadcn@latest add @cadence/radio-group
```

## Usage

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function PlanChoices() {
  const id = useId();
  return (
    <RadioGroup defaultValue="team" aria-label="Plan" className="w-full max-w-xs gap-3">
      {["starter", "team", "scale"].map((plan) => (
        <div key={plan} className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-${plan}`} value={plan} />
          <Label htmlFor={`${id}-${plan}`}>{plan === "starter" ? "Starter" : plan === "team" ? "Team" : "Scale"}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

Every item needs a `value`. The group is one form field: `name` goes on the
group, not on the items.

## Controlled

The caller owns the selected plan and status. Choose Team is an external update to this group only; choosing an item still uses the normal radio interaction.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function ControlledPlan() {
  const id = useId();
  const [plan, setPlan] = useState("team");
  return (
    <div className="grid gap-4">
      <RadioGroup value={plan} onValueChange={setPlan} aria-label="Controlled plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-team`} value="team" />
          <Label htmlFor={`${id}-team`}>Team</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-scale`} value="scale" />
          <Label htmlFor={`${id}-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Selected plan: {plan}
      </p>
      <Button variant="outline" size="sm" onClick={() => setPlan("team")}>
        Choose Team
      </Button>
    </div>
  );
}
```

## Invalid

Put the error semantics on the group and connect its message with `aria-describedby`. Each item also receives `aria-invalid` for its destructive ring; the source does not infer an item’s invalid styling from an ancestor. The caller clears the error when appropriate.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function InvalidPlan() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <RadioGroup aria-invalid="true" aria-describedby={`${id}-error`} aria-label="Required plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-team`} value="team" aria-invalid="true" />
          <Label htmlFor={`${id}-team`}>Team</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-scale`} value="scale" aria-invalid="true" />
          <Label htmlFor={`${id}-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <p id={`${id}-error`} className="text-sm text-destructive">
        Choose a plan to continue.
      </p>
    </div>
  );
}
```

## Disabled item

The unavailable option stays visible and announced. Arrow keys skip it while keeping one selected item and one tab stop. The disabled group marker dims only that item’s label.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function DisabledPlans() {
  const id = useId();
  return (
    <RadioGroup defaultValue="starter" aria-label="Available plans">
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-starter`} value="starter" />
        <Label htmlFor={`${id}-starter`}>Starter</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <RadioGroupItem id={`${id}-enterprise`} value="enterprise" disabled />
        <Label htmlFor={`${id}-enterprise`}>Enterprise (unavailable)</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-scale`} value="scale" />
        <Label htmlFor={`${id}-scale`}>Scale</Label>
      </div>
    </RadioGroup>
  );
}
```

## Disabled and read-only groups

Group `disabled` disables every item and removes the group from the tab sequence. `readOnly` retains focus and the current selection while preventing changes. These are two independent groups.

<ComponentExample name="locked" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function LockedPlans() {
  const id = useId();
  return (
    <div className="grid gap-6">
      <RadioGroup defaultValue="team" disabled aria-label="Disabled plan">
        <div className="group flex items-center gap-3" data-disabled="true">
          <RadioGroupItem id={`${id}-disabled-team`} value="team" />
          <Label htmlFor={`${id}-disabled-team`}>Team</Label>
        </div>
        <div className="group flex items-center gap-3" data-disabled="true">
          <RadioGroupItem id={`${id}-disabled-scale`} value="scale" />
          <Label htmlFor={`${id}-disabled-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <RadioGroup defaultValue="team" readOnly aria-label="Read-only plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-readonly-team`} value="team" />
          <Label htmlFor={`${id}-readonly-team`}>Team (read-only)</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-readonly-scale`} value="scale" />
          <Label htmlFor={`${id}-readonly-scale`}>Scale (read-only)</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

## Horizontal layout

The default layout is a vertical grid. Short labels can use a wrapping flex row; layout classes belong to the caller and do not change the radio keyboard model.

<ComponentExample name="horizontal" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function HorizontalPlans() {
  const id = useId();
  return (
    <RadioGroup defaultValue="daily" aria-label="Digest frequency" className="flex flex-wrap gap-6">
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-daily`} value="daily" />
        <Label htmlFor={`${id}-daily`}>Daily</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-weekly`} value="weekly" />
        <Label htmlFor={`${id}-weekly`}>Weekly</Label>
      </div>
    </RadioGroup>
  );
}
```

## Native form submission

The group owns one form name and submits the selected value. Native `required` prevents submission until a choice is made. This local handler displays the entry; the application still validates and saves it on the server.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function ShippingForm() {
  const id = useId();
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(`Shipping: ${new FormData(event.currentTarget).get("shipping")}`);
      }}
    >
      <RadioGroup name="shipping" required aria-label="Shipping method">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-standard`} value="standard" />
          <Label htmlFor={`${id}-standard`}>Standard</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-express`} value="express" />
          <Label htmlFor={`${id}-express`}>Express</Label>
        </div>
      </RadioGroup>
      <Button type="submit" size="sm">
        Submit shipping
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}
```

## Explicit motion scopes

The selected dot on the left is explicitly `none` from its first render. The independent group on the right explicitly restores `full` inside that scope, subject to system reduced-motion preferences. Ordinary groups inherit the site header; these overrides are fixed for this comparison.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function StaticRadio() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <RadioGroup defaultValue="static" aria-label="Static choice">
            <RadioGroupItem value="static" aria-label="Static radio" />
          </RadioGroup>
        </div>
        <CadenceProvider mode="full">
          <RadioGroup aria-label="Explicit full choice">
            <RadioGroupItem value="animated" aria-label="Explicit full radio" />
          </RadioGroup>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A small, fixed set of options where exactly one applies: a plan, a priority, a
  shipping method.
- Anywhere seeing all the options at once matters more than saving space.
- A setting that applies on submit, not immediately.

## When not to use

- Several answers can be true; use `checkbox`.
- The setting applies the moment it changes; use `switch`.
- More than about seven options, or a list that is filtered as you type; use
  `select` or `combobox`, which handle long lists and search.

## API

### `RadioGroup`

| Prop            | Type                                          | Default | Description                                     |
| --------------- | --------------------------------------------- | ------- | ----------------------------------------------- |
| `value`         | `string`                                      | –       | Controlled selection.                           |
| `defaultValue`  | `string`                                      | –       | Uncontrolled initial selection.                 |
| `onValueChange` | `(value, details) => void`                    | –       | Fired when the selection changes.               |
| `name`          | `string`                                      | –       | Form field name, submitted with the selection.  |
| `disabled`      | `boolean`                                     | `false` | Disables every item.                            |
| `required`      | `boolean`                                     | `false` | Blocks submit until something is selected.      |
| `className`     | `string` / state callback                                      | –       | Merged last; the default is `grid gap-3`.       |

### `RadioGroupItem`

| Prop        | Type      | Default | Description                              |
| ----------- | --------- | ------- | ---------------------------------------- |
| `value`     | `string`  | –       | Required. Identifies this option.        |
| `disabled`  | `boolean` | `false` | Keeps the option visible but unselectable.|
| `className` | `string` / state callback  | –       | Merged last.                             |

## Motion contract

Recipe: `state.morph`. The dot of the newly selected item fades in and settles
from 0.96 to full size; the previously selected dot reverses. Nothing else in the
row moves, so the eye follows the choice.

| Phase     | Properties                        | Token          | Interruptible |
| --------- | --------------------------------- | -------------- | ------------- |
| select    | `opacity 0 → 1`, `scale 0.96 → 1` | `state.morph`  | yes           |
| deselect  | the same pair, reversed           | `state.morph`  | yes           |
| reduced   | `opacity` only                    | `state.morph`  | yes           |
| none      | no transition                     | –              | –             |

## Keyboard interactions

| Keys                | Action                                                        |
| ------------------- | ------------------------------------------------------------- |
| `Tab`               | Enters the group at the selected item (or the first one).     |
| `Arrow Right/Down`  | Selects the next item and moves focus.                        |
| `Arrow Left/Up`     | Selects the previous item and moves focus.                    |
| `Space`             | Selects the focused item.                                     |

There is one tab stop for the whole group, not one per item: that is the roving
tabindex Base UI implements.

## Accessibility

- The group renders `role="radiogroup"`; each item renders `role="radio"` with a
  hidden input, so the form still submits a value.
- `aria-checked` carries the state on its own. The dot animation is never the only
  signal.
- Name the group with `aria-labelledby` pointing at a visible heading, or with
  `aria-label` when a heading would be redundant.
- `aria-invalid` on the group describes the whole choice; pass it to each item too when its ring should show the supplied error.

## Validation and data ownership

| The component does                                 | You do                                            |
| -------------------------------------------------- | ------------------------------------------------- |
| Forwards `aria-invalid` on the group and items   | Deciding that a choice is required                |
| Forwards `name`, `required`, and the selection      | Server-side validation of the submitted value     |
| Keeps arrow-key navigation within the group         | Focus policy after a failed submit                |

There is no `validate` or `schema` prop. [Field](/components/field) shows how the invalid
state and its message are wired.

## Responsive behavior

Items stack by default (`grid gap-3`). For a horizontal row of short labels, set
`className="flex flex-wrap gap-6"`; do not shorten the labels to fit — wrap them.

## Performance

One Motion element per item, each animating only `opacity` and `transform`, and
only when the selection changes. No layout thrash: the dot is absolutely sized by
CSS, so no measurement happens.

## Notes for AI

- Use `radio-group` for "one of N" and `checkbox` for "any of N".
- Put `name` on the group. Describe the group error with `aria-invalid` and pass it to items too when their rings should show the error.
- Do not build a radio group out of buttons with `aria-pressed`; the radio role
  is what gives arrow-key navigation and form submission.

---

Full index: https://cadence.dev/llms.txt
