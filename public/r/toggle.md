# Toggle

> A two-state button that can be pressed or not pressed.

- Registry item: https://cadence.dev/r/toggle.json
- Install: `npx shadcn@latest add @cadence/toggle`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: feedback.press

## When to use

- A formatting or mode command that stays on until it is turned off: bold,
  italic, a preview pane, a grid/list switch.
- A compact toolbar button whose pressed state is visible next to its neighbours.
- A setting the user toggles repeatedly while working.

## When not to use

- The action is one-shot (save, delete, open); use `button`.
- A setting that takes effect immediately and permanently, like a preference; use
  `switch`.
- A group of related toggles that should read as one control; use `toggle-group`.

## Installation

```bash
npx shadcn@latest add @cadence/toggle
```

## Usage

```tsx
import { Bold } from "lucide-react";
import { Toggle } from "@/components/cadence/toggle/toggle";

export function BoldToggle() {
  return (
    <Toggle aria-label="Bold" defaultPressed>
      <Bold />
    </Toggle>
  );
}
```

An icon-only toggle needs `aria-label`; the glyph is not a name.

## Examples

### Variants and sizes

```tsx
<Toggle>Default</Toggle>
<Toggle variant="outline">Outline</Toggle>

<Toggle size="sm">Small</Toggle>
<Toggle size="lg">Large</Toggle>
```

`outline` gives the toggle a border, for toolbars that sit on a busy surface.

### With a label

```tsx
<Toggle variant="outline">
  <Bold />
  Bold
</Toggle>
```

`gap-2` is already in the base classes, so an icon and a label space themselves.

### Controlled

```tsx
const [on, setOn] = useState(false);

<Toggle pressed={on} onPressedChange={setOn} aria-label="Bold" />;
```

### Inside a form

```tsx
<Toggle name="bold" defaultPressed value="bold" />
```

A pressed toggle submits its `value`; an unpressed one submits nothing, like a
checkbox.

## API

| Prop               | Type                          | Default     | Description                              |
| ------------------ | ----------------------------- | ----------- | ---------------------------------------- |
| `pressed`          | `boolean`                     | –           | Controlled state.                        |
| `defaultPressed`   | `boolean`                     | `false`     | Uncontrolled initial state.              |
| `onPressedChange`  | `(pressed, details) => void`  | –           | Fired on click and on Space/Enter.       |
| `variant`          | `"default" \| "outline"`      | `"default"` | Visual weight.                           |
| `size`             | `"sm" \| "default" \| "lg"`   | `"default"` | Height and minimum width.                |
| `disabled`         | `boolean`                     | `false`     | Ignores interaction.                     |
| `className`        | `string`                      | –           | Merged last.                             |

`toggleVariants` is exported, so a custom part can share the same classes.

## Motion contract

Recipe: `feedback.press`. The button compresses to 0.97 while the pointer is down
and springs back on release.

| Phase   | Properties       | Token            | Interruptible |
| ------- | ---------------- | ---------------- | ------------- |
| press   | `scale 1 → 0.97` | `feedback.press` | yes           |
| release | `scale 0.97 → 1` | `feedback.press` | yes           |
| reduced | no scale; the pressed background is the only change | – | – |
| none    | no scale         | –                | –             |

The pressed background is a colour transition, which is state feedback and stays
in every mode — otherwise a `none` user could not see the state.

## Keyboard interactions

| Keys    | Action                          |
| ------- | ------------------------------- |
| `Tab`   | Moves focus to the toggle.      |
| `Space` | Toggles the pressed state.      |
| `Enter` | Toggles the pressed state.      |

## Accessibility

- Base UI renders a real `<button type="button">` with `aria-pressed`, so assistive
  technology announces it as a toggle button, not a plain button.
- Icon-only toggles need `aria-label`; the pressed state is announced separately.
- The pressed state is never colour-only: the fill and `aria-pressed` change
  together, and the press scale is never the only feedback.
- Avoid toggles in a navigation bar; a link that changes style is still a link.

## Validation and data ownership

| The component does                            | You do                                     |
| --------------------------------------------- | ------------------------------------------ |
| Forwards `name`, `value`, `disabled`          | Deciding what a pressed toggle means       |
| Exposes `aria-invalid` styling                | Validation and error text                  |
| Keeps the pressed state in `aria-pressed`     | Persisting it                              |

See [validation](/docs/validation).

## Responsive behavior

Sizes are fixed; in a toolbar that must shrink, drop to `size="sm"` rather than
scaling the button with a transform, which would blur the icon.

## Performance

One Motion element, pressing only on pointer down. No layout animation, no
measurement.

## Notes for AI

- Use `toggle` for a command that stays on; use `switch` for a preference that
  saves itself.
- Always provide `aria-label` for icon-only toggles.
- Do not add a `state.morph` label swap to a toggle; the press scale is the whole
  contract.

---

Full index: https://cadence.dev/llms.txt
