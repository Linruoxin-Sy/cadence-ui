# Input Group

> A text control framed with prefixes, suffixes, and buttons.

- Registry item: /r/input-group.json
- Install: `npx shadcn@latest add @cadence/input-group`
- Type: registry:ui
- Since: 0.2.0


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

## Installation

```bash
npx shadcn@latest add @cadence/input-group
```

## Usage

```tsx
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/cadence/input-group/input-group";

export function Domain() {
  return (
    <InputGroup>
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput placeholder="cadence.dev" aria-label="Domain" />
    </InputGroup>
  );
}
```

## Examples

### Alignments

`align` decides where the addon sits: `inline-start`, `inline-end`, `block-start`,
`block-end`. The frame turns into a column for the block alignments, and the control
gives up the padding on that side.

```tsx
<InputGroup>
  <InputGroupAddon align="block-start">Recipient</InputGroupAddon>
  <InputGroupInput aria-label="Recipient" />
</InputGroup>
```

### A button in the frame

`InputGroupButton` sizes itself on the addon scale (`xs`, `sm`, `icon-xs`,
`icon-sm`), so it never towers over a 36px field. A click on a real button does not
steal focus from the input — the addon's focus handler steps aside.

```tsx
<InputGroup>
  <InputGroupInput placeholder="Search" aria-label="Search" />
  <InputGroupAddon align="inline-end">
    <InputGroupButton size="icon-xs" aria-label="Clear">×</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

### A textarea with a footer

```tsx
<InputGroup>
  <InputGroupTextarea aria-label="Note" />
  <InputGroupAddon align="block-end">
    <InputGroupText>0/280</InputGroupText>
    <InputGroupButton size="sm" className="ml-auto">Send</InputGroupButton>
  </InputGroupAddon>
</InputGroup>
```

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

## Motion contract

No motion (T0). The frame never animates. `transition-[color,box-shadow]` covers the
focus ring and the invalid border — state feedback that takes no space and does not
run on mount.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Validation and data ownership

P11: the group shows invalid state, it never decides it.

| `InputGroup` does                                        | You do                                                   |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Draws the destructive border when a control is invalid    | Deciding what is invalid                                 |
| Moves focus to the input when the addon is clicked        | Wiring `aria-invalid` and `aria-describedby`             |
| Renders the buttons you give it                           | Submit, retry, error mapping                             |

There is no `validate`, `schema`, or `resolver` prop, and no validation library is
imported. See [validation](/docs/validation).

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

## Notes for AI

- Never wrap `input` in this group to "add a border"; the input already has one.
- Put state on `InputGroupInput` (`aria-invalid`, `disabled`, `readOnly`) — the frame is
  chrome, and it inherits the appearance.
- Use `InputGroupButton`, not `Button`, inside the frame: the sizes are on the addon
  scale, and the addon's click handler recognises it as a button.

---

Full index: /llms.txt
