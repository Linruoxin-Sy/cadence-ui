# Toggle Group

> A set of two-state buttons that can be pressed one at a time or together.

- Registry item: https://cadence.dev/r/toggle-group.json
- Install: `npx shadcn@latest add @cadence/toggle-group`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: feedback.press

## When to use

- A small set of modes that belong to one control: text alignment, view density,
  a time range.
- A formatting toolbar where several marks can be active at once
  (`multiple`).
- Anywhere the options are icons and the choice should read as one segmented
  control (`spacing={0}` + `variant="outline"`).

## When not to use

- Exactly one option with a text label and a longer list; use `radio-group`, which
  exposes radio semantics rather than a row of toggle buttons.
- A single independent on/off command; use `toggle`.
- Navigation between pages; use `tabs`, which owns `role="tablist"`.

## Installation

```install
npx shadcn@latest add @cadence/toggle-group
```

Installing the group also installs `toggle`, because the items share its variant
classes.

## Usage

```tsx
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group/toggle-group";

export function Alignment() {
  return (
    <ToggleGroup variant="outline" defaultValue={["left"]} aria-label="Text alignment">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Examples

### Multiple

```tsx
<ToggleGroup multiple defaultValue={["bold"]} aria-label="Text style">
  <ToggleGroupItem value="bold" aria-label="Bold">
    <Bold />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic">
    <Italic />
  </ToggleGroupItem>
</ToggleGroup>
```

Without `multiple`, pressing an item releases the others.

### Spacing

```tsx
<ToggleGroup variant="outline" spacing={0} aria-label="Range">
  …
</ToggleGroup>

<ToggleGroup variant="outline" spacing={1} aria-label="Range">
  …
</ToggleGroup>
```

`spacing={0}` joins the borders into one segmented control; a positive value
keeps the items apart in Tailwind spacing steps.

### Vertical

```tsx
<ToggleGroup orientation="vertical" aria-label="Zoom">
  …
</ToggleGroup>
```

### Controlled

```tsx
const [value, setValue] = useState(["center"]);

<ToggleGroup value={value} onValueChange={setValue} aria-label="Alignment">
  …
</ToggleGroup>;
```

The value is always an array, even without `multiple`.

## API

### `ToggleGroup`

| Prop            | Type                                        | Default        | Description                              |
| --------------- | ------------------------------------------- | -------------- | ---------------------------------------- |
| `value`         | `readonly string[]`                         | –              | Controlled pressed values.               |
| `defaultValue`  | `readonly string[]`                         | `[]`           | Uncontrolled initial values.             |
| `onValueChange` | `(value: string[], details) => void`        | –              | Fired when any item changes.             |
| `multiple`      | `boolean`                                   | `false`        | Allow more than one pressed item.        |
| `spacing`       | `number`                                    | `0`            | Gap in Tailwind spacing steps.           |
| `orientation`   | `"horizontal" \| "vertical"`                | `"horizontal"` | Axis, also drives arrow keys.            |
| `variant`       | `"default" \| "outline"`                    | `"default"`    | Inherited by every item.                 |
| `size`          | `"sm" \| "default" \| "lg"`                 | `"default"`    | Inherited by every item.                 |

### `ToggleGroupItem`

| Prop        | Type     | Default | Description                          |
| ----------- | -------- | ------- | ------------------------------------ |
| `value`     | `string` | –       | Required. Identifies the item.       |
| `disabled`  | `boolean`| `false` | Keeps it visible but unpressable.    |
| `className` | `string` | –       | Merged last.                         |

## Motion contract

Recipe: `feedback.press`, inherited by every item — pressing compresses that item
and springs it back, exactly like a standalone `toggle`.

| Phase   | Properties       | Token            | Interruptible |
| ------- | ---------------- | ---------------- | ------------- |
| press   | `scale 1 → 0.97` | `feedback.press` | yes           |
| release | `scale 0.97 → 1` | `feedback.press` | yes           |
| reduced | no scale; the pressed background carries the state | – | – |
| none    | no scale         | –                | –             |

The group itself does not animate. A shared sliding indicator would need the
pressed item to change size, which would move the neighbours the user is aiming
at — a T3 concern, not a press.

## Keyboard interactions

| Keys               | Action                                        |
| ------------------ | --------------------------------------------- |
| `Tab`              | Enters the group at the last pressed item.    |
| `Arrow Right/Down` | Moves focus to the next item.                 |
| `Arrow Left/Up`    | Moves focus to the previous item.             |
| `Space` / `Enter`  | Presses the focused item.                     |

With `loopFocus` (default) the arrows wrap around at the ends.

## Accessibility

- The group renders `role="group"`; each item is a `<button>` with `aria-pressed`.
- Name the group with `aria-label` or `aria-labelledby` — a row of icon buttons
  with no group name is announced as unrelated buttons.
- Icon-only items need their own `aria-label`; the group name does not describe
  them.
- Do not use a toggle group where `role="tablist"` is correct; tabs imply a panel
  that is shown, a toggle group implies state.

## Validation and data ownership

| The component does                              | You do                                    |
| ----------------------------------------------- | ----------------------------------------- |
| Forwards `disabled` and the pressed values      | Deciding whether a selection is required  |
| Renders the visual pressed state                | Persisting the choice                     |
| Exposes `aria-invalid` styling on items         | Validation and error text                 |

[Field](/components/field) shows how the invalid state and its message are wired.

## Responsive behavior

Horizontal groups do not wrap; with more than about five items on a narrow screen,
switch to `orientation="vertical"` or replace the group with a `select`.

## Performance

One Motion element per item, pressing on demand. No layout animation and no
measurement, so a group of eight items costs nothing until one is pressed.

## Notes for AI

- `value` is an array in every mode, with or without `multiple`.
- Use `spacing={0}` + `variant="outline"` for a segmented control.
- For "one of N" with text labels, prefer `radio-group`; for panels, `tabs`.

---

Full index: https://cadence.dev/llms.txt
