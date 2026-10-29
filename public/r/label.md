# Label

> An accessible name for a form control, with no state of its own.

- Registry item: /r/label.json
- Install: `npx shadcn@latest add @cadence/label`
- Type: registry:ui
- Since: 0.2.0


## When to use

- Every input, textarea, select, checkbox, radio, switch, and slider that needs a
  visible name.
- A group of controls that share one caption.
- A field whose purpose is not obvious from the placeholder alone (which is
  almost every field).

## When not to use

- As a placeholder. A placeholder disappears on the first keystroke and is not a
  name; use a real `Label`.
- As a heading. If the text introduces a section, use a heading so it appears in
  the document outline.
- For helper text or error text; those belong in the description/error slot so
  they can be wired through `aria-describedby`.

## Installation

```bash
npx shadcn@latest add @cadence/label
```

## Usage

```tsx
import { Input } from "@/components/cadence/input/input";
import { Label } from "@/components/cadence/label/label";

export function EmailField() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" autoComplete="email" />
    </div>
  );
}
```

## Examples

### Wrapping instead of `htmlFor`

Either association works: `htmlFor` + `id`, or wrapping the control. Pick one per
field and keep it consistent.

```tsx
<Label>
  <input type="checkbox" />
  Email me about releases
</Label>
```

### Disabled

The label follows the control without any prop: `peer-disabled:` handles a sibling
control, `group-data-[disabled=true]:` handles a disabled `Field`.

```tsx
<Label htmlFor="slug" className="peer-disabled:opacity-50">
  Slug
</Label>
<Input id="slug" className="peer" disabled defaultValue="cadence" />
```

## API

| Prop        | Type              | Default | Description                          |
| ----------- | ----------------- | ------- | ------------------------------------ |
| `htmlFor`   | `string`          | –       | Id of the control this label names.  |
| `className` | `string`          | –       | Merged last.                         |

All native `label` props are forwarded.

## Motion contract

No motion (T0). A label is text; the only thing it reacts to is the disabled state,
which is an opacity change on a token, not an animation.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Accessibility

- Renders a native `<label>`; clicking it focuses the control with no JavaScript.
- The accessible name comes from the label's text, so never hide it with
  `display: none`. If the design needs a hidden label, use `sr-only`, not removal.
- `htmlFor` must point at an `id` that exists in the same document. Duplicate ids
  break the association silently.

## Notes for AI

- One label per control. Do not add `aria-label` on the control as well; two names
  fight, and the visible one wins in some browsers and loses in others.
- Keep the label short and noun-shaped ("Email", "Workspace name"), and put the
  explanation in the description slot.

---

Full index: /llms.txt
