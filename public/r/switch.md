# Switch

> Settings that take effect immediately, such as alerts or visibility.

- Registry item: https://cadence.dev/r/switch.json
- Install: `npx shadcn@latest add @cadence/switch`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

```install
npx shadcn@latest add @cadence/switch
```

## Usage

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function SwitchSettings() {
  const id = useId();
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>Deploy alerts</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          A notification for every failed build.
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-help`} />
    </div>
  );
}
```

## Sizes

Both `default` and `sm` are fixed here, each initially off and on. Travel is measured from the track and thumb, so either size lands at its own endpoint. Each switch remains independently interactive.

<ComponentExample name="sizes" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function SwitchSizes() {
  const id = useId();
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <div className="flex items-center gap-3">
        <Switch id={`${id}-off`} />
        <Label htmlFor={`${id}-off`}>Off</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-on`} defaultChecked />
        <Label htmlFor={`${id}-on`}>On</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-small-off`} size="sm" />
        <Label htmlFor={`${id}-small-off`}>Small</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-small-on`} size="sm" defaultChecked />
        <Label htmlFor={`${id}-small-on`}>Small, on</Label>
      </div>
    </div>
  );
}
```

## Controlled

The caller owns this immediate preference and status. Turn alerts off demonstrates an external update, separate from the other examples. This example keeps state locally; a real application persists the preference and reports save failures.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function ControlledSwitch() {
  const id = useId();
  const [on, setOn] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Switch id={id} checked={on} onCheckedChange={setOn} />
        <Label htmlFor={id}>Alerts</Label>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        Alerts {on ? "on" : "off"} in this example
      </p>
      <Button variant="outline" size="sm" onClick={() => setOn(false)}>
        Turn alerts off
      </Button>
    </div>
  );
}
```

## In a settings row

The label names the setting and the description explains its effect. The switch keeps its size while the caller’s row lets the text wrap.

<ComponentExample name="settings" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function SwitchSettings() {
  const id = useId();
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="grid gap-1">
        <Label htmlFor={id}>Deploy alerts</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          A notification for every failed build.
        </p>
      </div>
      <Switch id={id} aria-describedby={`${id}-help`} />
    </div>
  );
}
```

## Disabled and read-only

Disabled switches retain their state and leave the tab order. Read-only stays focusable but cannot change. The disabled row marker also dims the label; neither state is a substitute for explaining why a setting is unavailable.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { Switch } from "@/components/cadence/switch";

export function DisabledSwitches() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={`${id}-off`} disabled />
        <Label htmlFor={`${id}-off`}>Unavailable, off</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <Switch id={`${id}-on`} disabled defaultChecked />
        <Label htmlFor={`${id}-on`}>Unavailable, on</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id={`${id}-readonly`} readOnly defaultChecked />
        <Label htmlFor={`${id}-readonly`}>Read-only setting</Label>
      </div>
    </div>
  );
}
```

## Explicit motion scopes

The checked switch is explicitly `none` from its first render. Its thumb still reaches the measured checked endpoint, then jumps immediately when toggled. The neighbour explicitly restores `full` inside that scope, subject to system reduced-motion preferences. Ordinary switches follow the site header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Switch } from "@/components/cadence/switch";

export function StaticSwitch() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <Switch aria-label="Static switch" defaultChecked />
        </div>
        <CadenceProvider mode="full">
          <Switch aria-label="Explicit full switch" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A setting that takes effect immediately: public/private, alerts on/off, a feature
  flag.
- A row in a settings list, where the label describes the thing and the switch
  describes its state.
- A preference with no submit button. Flipping it saves.

## When not to use

- The change is only applied on submit; use `checkbox`, which is the familiar form
  control for a pending decision.
- One of several options; use `radio-group`.
- A formatting command on a selection; use `toggle`.

## API

| Prop              | Type                        | Default     | Description                                    |
| ----------------- | --------------------------- | ----------- | ---------------------------------------------- |
| `checked`         | `boolean`                   | –           | Controlled state.                              |
| `defaultChecked`  | `boolean`                   | `false`     | Uncontrolled initial state.                    |
| `onCheckedChange` | `(checked, details) => void`| –           | Fired on click and on Space.                   |
| `size`            | `"sm" \| "default"`         | `"default"` | Track and thumb scale.                         |
| `disabled`        | `boolean`                   | `false`     | Ignores interaction and form submission.       |
| `readOnly`        | `boolean`                   | `false`     | Focusable, submitted, not changeable.          |
| `required`        | `boolean`                   | `false`     | Blocks submit until switched on.               |
| `name`, `value`   | `string`                    | –           | Form field identity and submitted value.       |
| `className`       | `string` / state callback                    | –           | Merged last.                                   |

## Motion contract

Recipe: `state.morph`. The thumb travels from one end of the track to the other
while the track recolours. The travel distance is measured from the rendered track
and thumb — no hard-coded pixel value — so a custom size still lands flush.

| Phase   | Properties                         | Token          | Interruptible |
| ------- | ---------------------------------- | -------------- | ------------- |
| on      | `translateX 0 → track − thumb`     | `state.morph`  | yes           |
| off     | the same distance, reversed        | `state.morph`  | yes           |
| reduced | no travel animation; the thumb jumps to the new end | – | –     |
| none    | no transition                      | –              | –             |

Under `reduced` the thumb still ends up in the right place: position is state, not
decoration. What is dropped is the animation, so the movement is instant.

## Keyboard interactions

| Keys    | Action                                  |
| ------- | --------------------------------------- |
| `Tab`   | Moves focus to the switch.              |
| `Space` | Toggles the switch, unless `readOnly`.  |
| `Enter` | Toggles with the default Base UI keyboard handling, unless `readOnly`. |

## Accessibility

- Base UI renders `role="switch"` with `aria-checked` and a hidden input, so the
  value is submitted with the form.
- The state is not carried by colour alone: the thumb position, the track colour,
  and `aria-checked` change together.
- Give it a name with `Label htmlFor` or `aria-label`. "On" is a state, not a name.
- A switch that saves immediately should announce the outcome (a `toast` or an
  inline status), because there is no submit step to confirm it.

## Validation and data ownership

| The component does                              | You do                                          |
| ------------------------------------------------ | ----------------------------------------------- |
| Forwards `name`, `value`, `disabled`, `required` | Persisting the setting and handling failures     |
| Forwards supplied `aria-invalid`                   | Deciding whether the switch needs one at all     |
| Renders the on/off state                         | Announcing that the change was saved             |

Invalid semantics do not add a destructive track style; supply a visible error message when needed.
There is no `validate` or `schema` prop. [Field](/components/field) shows how the invalid state
and its message are wired.

## Responsive behavior

The control is fixed-size at every breakpoint; the row around it is what changes.
In a narrow layout, let the label and description wrap above the switch instead of
shrinking the track.

## Performance

One `ResizeObserver` per switch measures the travel, so a font or layout change
does not desynchronise the thumb. The animation itself is a single `transform`
transition with no layout reads during interaction.

## Notes for AI

- Use `switch` only for immediate settings. If there is a Save button, use
  `checkbox`.
- Do not animate the track colour as motion; colour is state feedback.
- Keep the label outside the switch. A switch with no label has no accessible name.

---

Full index: https://cadence.dev/llms.txt
