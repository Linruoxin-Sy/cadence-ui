# Switch

> A control that toggles between on and off, with a thumb that travels between the two states.

- Registry item: https://cadence.dev/r/switch.json
- Install: `npx shadcn@latest add @cadence/switch`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

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

## Installation

```install
npx shadcn@latest add @cadence/switch
```

## Usage

```tsx
import { Switch } from "@/components/cadence/switch";
import { Label } from "@/components/cadence/label";

export function Public() {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="public">Public workspace</Label>
      <Switch id="public" defaultChecked />
    </div>
  );
}
```

## Examples

### Sizes

```tsx
<Switch defaultChecked />
<Switch size="sm" defaultChecked />
```

`size="sm"` keeps the same travel logic: the distance is measured from the track
and the thumb, so restyling either keeps the end position correct.

### Controlled

```tsx
const [on, setOn] = useState(false);

<Switch checked={on} onCheckedChange={setOn} aria-label="Alerts" />;
```

### In a settings row

```tsx
<div className="flex items-center justify-between gap-4">
  <div className="grid gap-1">
    <Label htmlFor="alerts">Deploy alerts</Label>
    <p className="text-sm text-muted-foreground">A notification for every failed build.</p>
  </div>
  <Switch id="alerts" />
</div>
```

### Disabled

```tsx
<Switch disabled defaultChecked />
```

Disabled switches stay visible and announced; hiding them loses the information
that the setting exists.

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
| `className`       | `string`                    | –           | Merged last.                                   |

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
| `Enter` | Does not toggle — that is native button behaviour, and a switch is not a button. |

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
| Exposes `aria-invalid` styling                   | Deciding whether the switch needs one at all     |
| Renders the on/off state                         | Announcing that the change was saved             |

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
