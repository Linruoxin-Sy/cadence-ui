# Checkbox

> Independent yes/no choices and multi-select lists.

- Registry item: https://cadence.dev/r/checkbox.json
- Install: `npx shadcn@latest add @cadence/checkbox`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

```install
npx shadcn@latest add @cadence/checkbox
```

## Usage

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxSettings() {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-help`} className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor={id}>Send the weekly digest</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Every Monday, 09:00.
        </p>
      </div>
    </div>
  );
}
```

`id` lands on the hidden input, so `htmlFor` on a `label` names the control and
clicking the label toggles it.

## Checked by default, and indeterminate

`defaultChecked` initializes an uncontrolled choice. `indeterminate` announces a mixed selection; it does not make the field checked for form submission. Both controls below own their state independently.

<ComponentExample name="states" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxStates() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-checked`} defaultChecked />
        <Label htmlFor={`${id}-checked`}>Checked by default</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-mixed`} indeterminate />
        <Label htmlFor={`${id}-mixed`}>Some projects selected</Label>
      </div>
    </div>
  );
}
```

## Controlled

The caller owns acceptance and its status. Reset acceptance is an external update to this example alone; it does not change the top specimen or any other checkbox.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function ControlledCheckbox() {
  const id = useId();
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id={id} checked={accepted} onCheckedChange={setAccepted} />
        <Label htmlFor={id}>Accept the terms</Label>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {accepted ? "Terms accepted" : "Terms not accepted"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setAccepted(false)}>
        Reset acceptance
      </Button>
    </div>
  );
}
```

## Invalid, with a described error

The caller supplies `aria-invalid` and the described error. Checking the box does not clear the error automatically: the application decides when it is resolved.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function InvalidCheckbox() {
  const id = useId();
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <Checkbox id={id} aria-invalid="true" aria-describedby={`${id}-error`} />
        <Label htmlFor={id}>Accept the terms</Label>
      </div>
      <p id={`${id}-error`} className="text-sm text-destructive">
        You must accept the terms to continue.
      </p>
    </div>
  );
}
```

## In a row of settings

Associate the visible label and help text with one unique control. The description remains available when the label wraps on a narrow screen.

<ComponentExample name="settings" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxSettings() {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-help`} className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor={id}>Send the weekly digest</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Every Monday, 09:00.
        </p>
      </div>
    </div>
  );
}
```

## Disabled and read-only

Disabled choices retain their checked or unchecked state and are skipped by keyboard navigation. A read-only choice stays focusable but cannot be changed. The group disabled marker also dims its label; Base UI does not use a native disabled button.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function DisabledCheckboxes() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="group flex items-center gap-3" data-disabled="true">
        <Checkbox id={`${id}-off`} disabled />
        <Label htmlFor={`${id}-off`}>Unavailable, unchecked</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <Checkbox id={`${id}-on`} disabled defaultChecked />
        <Label htmlFor={`${id}-on`}>Unavailable, checked</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-readonly`} readOnly defaultChecked />
        <Label htmlFor={`${id}-readonly`}>Read-only preference</Label>
      </div>
    </div>
  );
}
```

## Native form submission

`name` and `value` define the native form entry. `required` uses browser constraint validation before this caller-owned submit handler runs. Server-side validation and persistence remain the application’s responsibility.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxForm() {
  const id = useId();
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setResult(`Submitted consent: ${data.get("consent")}`);
      }}
    >
      <div className="flex items-center gap-3">
        <Checkbox id={id} name="consent" value="accepted" required />
        <Label htmlFor={id}>Accept the terms (required)</Label>
      </div>
      <Button type="submit" size="sm">
        Submit consent
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}
```

## Explicit motion scopes

The checked control is explicitly `none` from its first render, so its tick appears immediately and still toggles. Its neighbour explicitly restores `full` inside that scope; the system reduced-motion preference still takes precedence. These are deliberate local overrides. Ordinary examples follow the site header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Checkbox } from "@/components/cadence/checkbox";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function StaticCheckbox() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <Checkbox aria-label="Static checkbox" className="inline-flex" defaultChecked />
        </div>
        <CadenceProvider mode="full">
          <Checkbox aria-label="Explicit full checkbox" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- One independent yes/no choice: accept the terms, remember this device, include
  archived items.
- A set of choices where several can be true at once; use one checkbox per row.
- A parent row that summarises children: pass `indeterminate` while the children
  disagree.
- A table row selection, where each row is its own decision.

## When not to use

- Exactly one of several options; use `radio-group`, which also gives arrow-key
  navigation.
- An immediate setting that applies the moment it is flipped; use `switch`.
- A formatting command that acts on a selection; use `toggle`.

## API

| Prop               | Type                              | Default | Description                                          |
| ------------------ | --------------------------------- | ------- | ---------------------------------------------------- |
| `checked`          | `boolean`                         | –       | Controlled state.                                    |
| `defaultChecked`   | `boolean`                         | `false` | Uncontrolled initial state.                          |
| `onCheckedChange`  | `(checked, details) => void`      | –       | Fired on click and on Space.                         |
| `indeterminate`    | `boolean`                         | `false` | Mixed visual state for a parent row.                 |
| `disabled`         | `boolean`                         | `false` | Ignores interaction and form submission.             |
| `readOnly`         | `boolean`                         | `false` | Focusable, submitted, not changeable.                |
| `required`         | `boolean`                         | `false` | Blocks form submission until checked.                |
| `name`, `value`    | `string`                          | –       | Form field identity and submitted value.             |
| `className`        | `string` / state callback                          | –       | Merged last.                                         |

All native attributes are forwarded, including `aria-invalid` and
`aria-describedby`.

## Motion contract

Recipe: `state.morph`. The tick is the protagonist — it fades in and settles from
0.96 to full size when the box is checked, and reverses when it is cleared.

| Phase   | Properties                    | Token          | Interruptible |
| ------- | ----------------------------- | -------------- | ------------- |
| check   | `opacity 0 → 1`, `scale 0.96 → 1` | `state.morph` | yes (re-click) |
| clear   | the same pair, reversed       | `state.morph`  | yes           |
| reduced | `opacity` only                | `state.morph`  | yes           |
| none    | no transition                 | –              | –             |

Only the indicator moves. The box itself keeps a `transition-shadow` for the focus
ring and the invalid ring, which is colour/shadow state feedback, not motion.

## Keyboard interactions

| Keys          | Action                                     |
| ------------- | ------------------------------------------ |
| `Tab`         | Moves focus to the checkbox.               |
| `Space`       | Toggles checked, unless `readOnly`.        |
| `Shift+Tab`   | Moves focus to the previous control.       |

## Accessibility

- Base UI renders `role="checkbox"` on the visible element plus a hidden
  `<input type="checkbox">`, so the control is in the form and in the tab order.
- The tick is not the announcement: the state lives in `aria-checked`, which is
  why the reduced and `none` branches stay usable.
- Always pair the box with a `Label` (`htmlFor`) or an `aria-label`; a bare box
  has no accessible name.
- `indeterminate` announces as "mixed". Do not use it as a substitute for
  `checked` in a form.

## Validation and data ownership

| The component does                                  | You do                                               |
| --------------------------------------------------- | ---------------------------------------------------- |
| Styles `aria-invalid` and forwards it to the input   | Deciding whether the box must be checked             |
| Forwards `required`, `name`, `value`, `disabled`     | Building the submitted payload                       |
| Announces `aria-checked` for all three states        | Mapping the error to the field with `aria-describedby` |

There is no `validate`, `schema`, or `rules` prop. [Field](/components/field) shows how the
invalid state and its message are wired.

## Responsive behavior

The control is fixed at 16px with a 44px touch target (the `after:` pseudo
element extends the hit area), so it behaves the same at every breakpoint. Put the
label beside it, not inside it; wrapping a checkbox in a label removes the
`aria-describedby` chain.

## Performance

No JS animation loop: one Motion element per box, animating only `opacity` and
`transform`. A list of 50 checkboxes is 50 short transitions on demand, never a
running loop.

## Notes for AI

- Use `aria-invalid` + `aria-describedby` for errors; there is no `error` prop.
- Do not add press animation to a checkbox; the tick is the only protagonist.
- For "one of N", use `radio-group`; for an instant setting, use `switch`.

---

Full index: https://cadence.dev/llms.txt
