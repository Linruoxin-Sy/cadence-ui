# Slider

> An input where the user selects a value from a range by dragging a thumb.

- Registry item: https://cadence.dev/r/slider.json
- Install: `npx shadcn@latest add @cadence/slider`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: feedback.press

## When to use

- A value where the rough position matters more than the exact number: volume,
  brightness, zoom, opacity.
- A range (two thumbs): price between, time window, budget band.
- A filter where the user should feel the bounds instead of typing them.

## When not to use

- An exact number matters and the range is wide; pair a `slider` with an `input`,
  or use `input` alone.
- Fewer than about five discrete options; use `radio-group` or `toggle-group`.
- A value with no natural order, like picking a colour name.

## Installation

```bash
npx shadcn@latest add @cadence/slider
```

## Usage

```tsx
import { Slider } from "@/components/cadence/slider/slider";

export function Volume() {
  return <Slider defaultValue={[60]} max={100} aria-label="Volume" />;
}
```

`defaultValue` and `value` are always arrays: one entry per thumb. `aria-label`
on the slider is forwarded to every thumb's native range input, which is what a
screen reader announces. A range slider gets one accessible name per thumb —
`Price (minimum)` and `Price (maximum)` — because two inputs with the same name
are indistinguishable.

## Examples

### Controlled

```tsx
const [volume, setVolume] = useState([60]);

<Slider value={volume} onValueChange={setVolume} aria-label="Volume" />;
```

### Range

```tsx
<Slider defaultValue={[120, 480]} min={0} max={600} step={10} aria-label="Price" />
```

Two entries in the array give two thumbs; `minStepsBetweenValues` keeps them from
crossing.

### Vertical

```tsx
<Slider orientation="vertical" defaultValue={[40]} className="h-56" aria-label="Level" />
```

Give the vertical slider a height; the track fills it.

### Disabled

```tsx
<Slider defaultValue={[40]} disabled aria-label="Volume" />
```

## API

| Prop                 | Type                              | Default        | Description                                     |
| -------------------- | --------------------------------- | -------------- | ----------------------------------------------- |
| `value`              | `number \| readonly number[]`     | –              | Controlled value, one entry per thumb.          |
| `defaultValue`       | same as `value`                   | –              | Uncontrolled initial value.                     |
| `onValueChange`      | `(value, details) => void`        | –              | Fired while dragging and on keyboard steps.     |
| `min`, `max`         | `number`                          | `0`, `100`     | Bounds.                                         |
| `step`               | `number`                          | `1`            | Snap increment.                                 |
| `orientation`        | `"horizontal" \| "vertical"`      | `"horizontal"` | Axis.                                           |
| `disabled`           | `boolean`                         | `false`        | Ignores pointer and keyboard.                   |
| `aria-label`         | `string`                          | –              | Forwarded to each thumb, suffixed per thumb.    |
| `className`          | `string`                          | –              | Merged last.                                    |

Base UI's `format`, `locale`, and `minStepsBetweenValues` are forwarded unchanged.

## Motion contract

Recipe: `feedback.press`. The dragged thumb compresses to 0.97 and springs back on
release — the same press language as `button` and `toggle`.

| Phase   | Properties              | Token            | Interruptible |
| ------- | ----------------------- | ---------------- | ------------- |
| drag    | `scale 1 → 0.97`        | `feedback.press` | yes           |
| release | `scale 0.97 → 1`        | `feedback.press` | yes           |
| reduced | no scale; the ring grows on focus/hover | – | –             |
| none    | no scale                | –                | –             |

The fill is deliberately not animated: it is glued to the pointer, and a
transition would make it trail the thumb by one frame per move.

## Keyboard interactions

| Keys                | Action                                  |
| ------------------- | --------------------------------------- |
| `Tab`               | Moves focus to the thumb.               |
| `Arrow Right/Up`    | Increases by one `step`.                |
| `Arrow Left/Down`   | Decreases by one `step`.                |
| `Page Up`/`Page Down` | Moves by a larger increment.           |
| `Home`/`End`        | Jumps to `min` / `max`.                 |

## Accessibility

- Every thumb contains a native `input[type=range]`, so the control works with
  assistive technology without a custom role.
- Always pass `aria-label` (or `aria-labelledby`) — the fill has no text.
- Show the current value as text next to the slider when the number matters.
  Dragging is not a way to read a value.
- `aria-invalid` styles the control; validation is the caller's job (P11).

## Validation and data ownership

| The component does                                | You do                                              |
| ------------------------------------------------- | --------------------------------------------------- |
| Reports the value through `onValueChange`         | Deciding whether the range is acceptable            |
| Styles `aria-invalid`                             | Writing the error text and its `aria-describedby` id |
| Steps and clamps the value to `min`/`max`         | Server-side bounds and business rules               |

[Field](/components/field) shows how the invalid state and its message are wired.

## Responsive behavior

Horizontal sliders fill their container (`w-full`); vertical ones fill their
height. On touch screens the thumb keeps a 16px visual size but the range input
covers the whole control, so drag targets stay reachable.

## Performance

The value updates on pointer move without React re-rendering the whole form: Base
UI moves the thumb with a CSS custom property, and Motion animates only the press
scale. No `layout` animation, no measurement per frame.

## Notes for AI

- Values are arrays. `value={50}` is a type error; use `value={[50]}`.
- Do not animate the fill. Motion here is press feedback only.
- Pair with an `input` when the exact number must be typeable.

---

Full index: https://cadence.dev/llms.txt
