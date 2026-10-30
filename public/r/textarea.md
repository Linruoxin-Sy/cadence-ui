# Textarea

> A multi-line text field that grows with its content instead of a script.

- Registry item: https://cadence.dev/r/textarea.json
- Install: `npx shadcn@latest add @cadence/textarea`
- Type: registry:ui
- Since: 0.2.0


## When to use

- A sentence or a paragraph: a comment, a description, a commit message, a note.
- A field where the user's text is longer than the visible box should be.
- Anywhere the browser's native resize handle is useful.

## When not to use

- A single line (email, name, slug); use `input`.
- Rich text. A `textarea` holds plain text; formatting needs an editor, which is
  out of scope for this library.
- A value that must stay fixed in height; a `textarea` grows, and a fixed box hides
  the overflow from the user.

## Installation

```bash
npx shadcn@latest add @cadence/textarea
```

## Usage

```tsx
import { Label } from "@/components/cadence/label/label";
import { Textarea } from "@/components/cadence/textarea/textarea";

export function Comment() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="comment">Comment</Label>
      <Textarea id="comment" rows={4} placeholder="Leave a note for the reviewer" />
    </div>
  );
}
```

## Examples

### Auto-growing

`field-sizing-content` lets the browser grow the box as the text gets longer. No
JavaScript, no `ResizeObserver`, no layout read during render.

```tsx
<Textarea className="min-h-16 max-h-48" placeholder="Type and watch the box grow" />
```

### Resizable by the user

```tsx
<Textarea className="resize-y" rows={3} />
```

### Invalid

```tsx
<Textarea aria-invalid="true" aria-describedby="bio-error" />
<p id="bio-error" className="text-sm text-destructive">
  Keep it under 280 characters.
</p>
```

## API

| Prop        | Type     | Default | Description               |
| ----------- | -------- | ------- | ------------------------- |
| `className` | `string` | –       | Merged last.              |

All native `textarea` props are forwarded, including `rows`, `maxLength`,
`required`, `readOnly`, `disabled`, and `aria-*`.

## Motion contract

No motion (T0). Growth is the browser sizing the box, not an animation: on a
`field-sizing-content` textarea the height changes with the text as you type, and
a transition on it would lag behind the caret.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

## Validation and data ownership

Same contract as `input`: the field renders state, you own the state.

| The component does                                 | You do                                                   |
| -------------------------------------------------- | -------------------------------------------------------- |
| Styles `aria-invalid="true"`                       | Deciding validity (length, format, required)             |
| Renders what `aria-describedby` points at           | Writing the error text and the counter ("12 / 280")      |
| Forwards `required`, `readOnly`, `disabled`, `name` | Form state and submission                                |

Character counters are yours to render: the component does not count. Keep the
count in the description slot and point `aria-describedby` at it, so a screen
reader hears it before the limit is hit.

## Accessibility

- Renders a native `<textarea>`, so Enter inserts a newline and Escape does not
  close anything — expected behaviour in a form.
- Give it a `label`, and never rely on the placeholder as a name.
- If you cap the length with `maxLength`, say so in the description; a silent stop
  in typing reads as a broken field.
- `resize-y` keeps the horizontal layout stable; full `resize` lets a long word
  break the page.

## Notes for AI

- Do not implement auto-resize with a `scrollHeight` loop; `field-sizing-content`
  is the CSS-only answer and it matches upstream.
- Never own the character count in component state. Render it next to the field and
  wire it through `aria-describedby`.

---

Full index: https://cadence.dev/llms.txt
