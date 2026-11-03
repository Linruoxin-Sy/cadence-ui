# Input Group

> Currency fields, URLs, and inputs with inline actions.

- Registry item: https://cadence.dev/r/input-group.json
- Install: `npx shadcn@latest add @cadence/input-group`
- Type: registry:ui
- Since: 0.2.0


## Installation

```install
npx shadcn@latest add @cadence/input-group
```

## Usage

```tsx
import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/cadence/input-group";
import { Kbd } from "@/components/cadence/kbd";

export function SearchField() {
  return (
    <InputGroup className="w-full max-w-sm">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search components" aria-label="Search components" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  );
}
```

## Alignments

`align` places an addon before or after the control, inline or on its own block row. Each input below is independent. Addon text is not a label: the input still needs an accessible name. The prefix click focuses its own input.

<ComponentExample name="alignments" />

```tsx
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/cadence/input-group";

export function AddonAlignments() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Inline start" placeholder="cadence.dev" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Inline end" placeholder="cadence" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>.dev</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>Recipient</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Block start" placeholder="you@example.com" />
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Block end" placeholder="review-notes" />
        <InputGroupAddon align="block-end">
          <InputGroupText>Lowercase letters and hyphens.</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
```

## A button in the frame

InputGroupButton has four addon sizes: `xs`, `sm`, `icon-xs`, and `icon-sm`. These independent controls all clear their own domain. Pointer and keyboard activation keep the real button focus; the addon focus convenience steps aside for buttons. Use InputGroupButton inside an addon so sizing and button semantics agree.

<ComponentExample name="button" />

```tsx
"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/cadence/input-group";

export function FrameButtons() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      {(["xs", "sm", "icon-xs", "icon-sm"] as const).map((size) => (
        <ClearDomain key={size} size={size} />
      ))}
    </div>
  );
}

function ClearDomain({ size }: { size: "xs" | "sm" | "icon-xs" | "icon-sm" }) {
  const [value, setValue] = useState("cadence.dev");
  return (
    <InputGroup>
      <InputGroupInput aria-label={`Domain ${size}`} value={value} onChange={(event) => setValue(event.target.value)} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size={size} aria-label={`Clear domain ${size}`} onClick={() => setValue("")}>
          {size.startsWith("icon") ? <XIcon aria-hidden="true" /> : "Clear"}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
```

## A textarea with a footer

Use InputGroupTextarea for multiline content and `block-end` for the footer. The caller owns the draft, character limit and submission. Send clears only this draft and reports its submitted text; it is disabled while the draft is empty.

<ComponentExample name="textarea" />

```tsx
"use client";

import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/cadence/input-group";

export function NoteComposer() {
  const [note, setNote] = useState("");
  const [sent, setSent] = useState("");
  return (
    <form
      className="grid w-full max-w-sm gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(note);
        setNote("");
      }}
    >
      <InputGroup>
        <InputGroupTextarea
          aria-label="Note"
          rows={3}
          maxLength={280}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Leave a note for the reviewer…"
        />
        <InputGroupAddon align="block-end">
          <InputGroupText>{note.length}/280</InputGroupText>
          <InputGroupButton type="submit" size="sm" variant="default" className="ml-auto" disabled={!note.trim()}>
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p role="status" className="text-sm text-muted-foreground">
        {sent ? `Sent: ${sent}` : "No note sent."}
      </p>
    </form>
  );
}
```

## Invalid

The application supplies `aria-invalid` and the error description. The group responds with a destructive border and never validates the value itself. Editing this field does not silently clear an application error.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/cadence/input-group";

export function InvalidEmail() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>@</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          type="email"
          aria-label="Email"
          defaultValue="unavailable@example.com"
          aria-invalid
          aria-describedby={id}
        />
      </InputGroup>
      <p id={id} className="text-sm text-destructive">
        This email address is unavailable.
      </p>
    </div>
  );
}
```

## When to use

- A field with a fixed prefix or suffix: a currency symbol, `https://`, a unit, a
  domain.
- A control that needs one inline action: search with a shortcut hint, a chooser with
  a clear button, an invite field with a submit button.
- A textarea with a footer — a character count, a send button — where the footer must
  look attached to the field.

## When not to use

- A bare text field. Use `input`; the group would only re-create its border.
- A whole toolbar of actions. Use `button-group` beside the field, or a `form` layout:
  four buttons inside one field is a cramped target.
- A label. Use `field` and `FieldLabel`; an addon is not an accessible name.

## API

| Part                  | Props                    | Notes                                                          |
| --------------------- | ------------------------ | -------------------------------------------------------------- |
| `InputGroup`          | native div props         | The frame; `role="group"`, focus and invalid state via `:has()`. |
| `InputGroupAddon`     | `align`, native div      | `inline-start \| inline-end \| block-start \| block-end`, `data-align`. |
| `InputGroupButton`    | `size`, `variant`, `type`| `xs \| sm \| icon-xs \| icon-sm`; ghost by default.            |
| `InputGroupText`      | native span props        | Muted text or an icon; not a label.                            |
| `InputGroupInput`     | `input` props            | Control with the frame's chrome removed; `data-slot="input-group-control"`. |
| `InputGroupTextarea`  | `textarea` props         | Same, for multi-line.                                          |

The frame watches `[data-slot=input-group-control]` for `:focus-visible` and
`[aria-invalid=true]`, which is why the control can be borderless and the group still
shows the ring.

`InputGroupButton` preserves Button state callbacks for `className` and `style`, with caller classes last. The input and textarea wrappers keep their native props.

## Motion contract

No motion (T0). The frame never animates. `transition-[color,box-shadow]` covers the
focus ring and the invalid border — state feedback that takes no space and does not
run on mount.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- The addon text is not a name. Give the control an `aria-label`, or put a `FieldLabel`
  around the group through `field`.
- `role="group"` on the frame and on each addon groups the pieces for assistive tech;
  add `aria-label` to the frame only if the group needs a name of its own.
- The addon focuses the input on click — a convenience for pointer users. Keyboard
  users tab straight into the control, which is already the shortest path.
- Buttons inside the frame keep their own names. An icon-only clear button needs
  `aria-label="Clear"`.
- `aria-invalid` must be on the control, not on the frame; the frame reacts to it.

## Validation and data ownership

P11: the group shows invalid state, it never decides it.

| `InputGroup` does                                        | You do                                                   |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Draws the destructive border when a control is invalid    | Deciding what is invalid                                 |
| Moves focus to the input when the addon is clicked        | Wiring `aria-invalid` and `aria-describedby`             |
| Renders the buttons you give it                           | Submit, retry, error mapping                             |

There is no `validate`, `schema`, or `resolver` prop, and no validation library is
imported. [Field](/components/field) shows how the invalid state and its message are wired.

## Responsiveness and performance

The group fills its parent and permits shrinking. Block-start/end addons use column layout; inline
addons share the input row. The caller owns long addon labels, button wrapping and narrow-screen
composition.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Composed controls retain their
own dependencies and motion contracts. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Never wrap `input` in this group to "add a border"; the input already has one.
- Put state on `InputGroupInput` (`aria-invalid`, `disabled`, `readOnly`) — the frame is
  chrome, and it inherits the appearance.
- Use `InputGroupButton`, not `Button`, inside the frame: the sizes are on the addon
  scale, and the addon's click handler recognises it as a button.

---

Full index: https://cadence.dev/llms.txt
