# Input

> Names, emails, search queries, and other short text.

- Registry item: https://cadence.dev/r/input.json
- Install: `npx shadcn@latest add @cadence/input`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/input
```

## Usage

```tsx
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function WorkspaceName() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="workspace">Workspace name</Label>
      <Input id="workspace" placeholder="Acme" autoComplete="organization" />
    </div>
  );
}
```

## Invalid

The caller supplies `aria-invalid` and a described error. This fixed error state does not run validation or prevent editing.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function InvalidInput() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input id={id} type="email" aria-invalid="true" aria-describedby={`${id}-error`} defaultValue="ada@" />
      <p id={`${id}-error`} className="text-sm text-destructive">Enter a complete email address.</p>
    </div>
  );
}
```

## File input

Use the native file picker for caller-owned files. `accept` suggests file types; the browser and your application own selection, upload and checks.

<ComponentExample name="file" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function FileInput() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Image</Label>
      <Input id={id} type="file" accept="image/png,image/jpeg" aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">Choose a PNG or JPEG image.</p>
    </div>
  );
}
```

## Controlled, Base UI style

The caller owns `value` through Base UI’s `onValueChange`. The external action replaces only this example’s value; typing in another specimen remains independent.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function ControlledInput() {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Workspace name</Label>
      <Input id={id} value={value} onValueChange={setValue} aria-describedby={`${id}-value`} />
      <p id={`${id}-value`} role="status" className="text-sm text-muted-foreground">Value: {value || "(empty)"}</p>
      <Button variant="outline" onClick={() => setValue("Cadence UI")}>Use workspace name</Button>
    </div>
  );
}
```

## Disabled and read-only

A disabled field cannot be edited or focused and is omitted from native form submission. A read-only field stays focusable and submits its value. A filled field is still editable unless you explicitly set `readOnly`.

<ComponentExample name="disabled-readonly" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function InputAvailability() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-filled`}>Filled</Label>
        <Input id={`${id}-filled`} name="workspace" defaultValue="Cadence UI" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Input id={`${id}-disabled`} name="disabled" disabled defaultValue="cadence" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only</Label>
        <Input id={`${id}-readonly`} name="slug" readOnly defaultValue="cadence-ui" />
      </div>
    </div>
  );
}
```

## When to use

- A single line of text the user types: email, name, slug, search, URL.
- A field that needs a native input type (`email`, `password`, `tel`, `number`,
  `file`) and therefore native mobile keyboards.
- Anywhere the browser's autofill, password manager, or form submission should
  work without a wrapper.

## When not to use

- Multi-line text; use `textarea`.
- A choice from a fixed list; use `select` (or `combobox` when the list is long).
- A value the app controls entirely, like a generated id. Render text, not a
  disabled input.

## API

| Prop            | Type                                | Default | Description                                        |
| --------------- | ----------------------------------- | ------- | -------------------------------------------------- |
| `type`          | `string`                            | –       | Native input type.                                 |
| `value`         | `string \| number \| readonly string[]` | –   | Controlled value.                                  |
| `defaultValue`  | same as `value`                     | –       | Uncontrolled initial value.                        |
| `onValueChange` | `(value: string, details) => void`  | –       | Base UI change callback, in addition to `onChange`. |
| `className`     | string or state callback                            | –       | Merged last.                                       |

All native input props are forwarded, including `disabled`, `readOnly`, `required`,
and `aria-*`.

Base UI state callbacks for `className` are evaluated before merging caller classes last.
`style` accepts an object or a state callback and is forwarded to the primitive.

## Motion contract

No motion (T0). An input that grows, slides, or fades while the user types is a
bug: it moves the caret under the user's eyes.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

`transition-[color,box-shadow]` exists for the focus ring and the invalid border.
Both are colour/shadow state feedback on the design tokens, take no space, and do
not run on mount.

## Accessibility

- Base UI's input is field-aware: inside a `field`, it receives the label id and
  the description ids without extra wiring.
- Always give it a name from a `label`; a placeholder is not a name.
- `aria-invalid` plus a described error is the accessible failure state. Colour
  alone is never the signal.
- Never set `outline: none` in `className`; the focus ring is the only affordance
  for keyboard users.

## Validation and data ownership

P11 draws the line: the component renders state, the user decides state.

| The component does                                    | You do                                                    |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Styles `aria-invalid="true"` and `data-invalid`        | Deciding what "valid" means (required, format, length)    |
| Renders whatever `aria-describedby` points at          | Writing the error text and the ids it lives on            |
| Forwards `required`, `readOnly`, `disabled`, `name`    | Form state (react-hook-form, TanStack Form, server state)  |
| Keeps focus visible and keyboard-reachable             | Submit, retry, error mapping, focus management             |

There is no `schema`, `resolver`, `validate`, or `rules` prop, and no validation
library is imported. [Field](/components/field) shows how the invalid state and its message
are wired.

## Responsiveness and performance

The input fills its parent and uses base text sizing below the md breakpoint. Constrain the parent
in grids; native input types retain browser keyboards, editing and form behavior.

T0 adds no authored animation runtime or interpolation. Base UI behavior requires hydration; native
HTML behavior remains browser-owned. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Use `aria-invalid` and `aria-describedby` — never an `error` prop or internal
  state.
- Do not wrap the input in a div just to add a border; the component already owns
  the border, radius, and focus ring.

---

Full index: https://cadence.dev/llms.txt
