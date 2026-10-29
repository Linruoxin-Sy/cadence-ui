# Button

> Triggers an action, with press feedback that collapses under reduced motion.

- Registry item: /r/button.json
- Install: `npx shadcn@latest add @cadence/button`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: feedback.press

## When to use

- The primary action of a form, dialog, or toolbar.
- A single, clearly labelled command: save, delete, invite.
- Anywhere the user expects a physical press response.

## When not to use

- Navigation between routes; use a link styled with `buttonVariants`.
- Toggling a persistent state; use `toggle` or `switch`.
- Submitting a long-running job that needs its own progress surface; pair the button with a
  spinner and a `disabled` state, or use `toast` for the result.

## Installation

```bash
npx shadcn@latest add @cadence/button
```

## Usage

```tsx
import { Button } from "@/components/cadence/button/button";

export function Save() {
  return <Button onClick={save}>Save changes</Button>;
}
```

## Examples

### Variants

```tsx
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete project</Button>
<Button variant="ghost" size="icon-sm" aria-label="Open settings">
  <Settings />
</Button>
```

### Links

For navigation, keep the link and take the styles: this preserves link semantics and
middle-click.

```tsx
import Link from "next/link";
import { buttonVariants } from "@/components/cadence/button/button";

<Link href="/pricing" className={buttonVariants({ variant: "outline" })}>
  Pricing
</Link>;
```

### Composition

`render` replaces the underlying element; use it for custom button components, not for links.

```tsx
<Button render={<CopyButton />}>Copy</Button>
```

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link"` | `"default"` | Visual weight. |
| `size` | `"default" \| "xs" \| "sm" \| "lg" \| "icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"` | `"default"` | Height and padding. |
| `render` | `ReactElement \| (props, state) => ReactElement` | – | Base UI composition; replaces `asChild`. |
| `className` | `string` | – | Merged last. |

All native button props are forwarded.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| press | `scale 1 → 0.98` while active | `spring.press` | yes (pointer up) |
| release | `scale 0.98 → 1` | `spring.press` | yes |
| reduced | no scale; colour and shadow only | – | – |
| none | no scale; colour and shadow only | – | – |

## Accessibility

- Renders a real `<button>` through Base UI, so Enter and Space activate it natively.
- Focus is visible through the ring tokens; disabled buttons are not focusable and keep
  `aria-disabled` semantics from Base UI.
- `aria-invalid` drives the destructive border and ring. The component does not validate
  anything: see [validation](/docs/validation).

## Notes for AI

- Keep the label specific ("Delete project", not "OK").
- Do not add a `loading` boolean that hides the label; pass `disabled` and render a spinner
  next to the text so the action stays readable.

---

Full index: /llms.txt
