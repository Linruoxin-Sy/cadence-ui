# Radio Group

> A set of checkable buttons where no more than one can be checked at a time.

- Registry item: https://cadence.dev/r/radio-group.json
- Install: `npx shadcn@latest add @cadence/radio-group`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

```install
npx shadcn@latest add @cadence/radio-group
```

## Usage

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";
import { Label } from "@/components/cadence/label";

export function Plan() {
  return (
    <RadioGroup defaultValue="team" aria-label="Plan">
      <div className="flex items-center gap-3">
        <RadioGroupItem id="plan-team" value="team" />
        <Label htmlFor="plan-team">Team</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id="plan-scale" value="scale" />
        <Label htmlFor="plan-scale">Scale</Label>
      </div>
    </RadioGroup>
  );
}
```

Every item needs a `value`. The group is one form field: `name` goes on the
group, not on the items.

## Controlled

```tsx
const [plan, setPlan] = useState("team");

<RadioGroup value={plan} onValueChange={setPlan} aria-label="Plan">
  …
</RadioGroup>;
```

`onValueChange` receives the new value plus Base UI's event details.

## Invalid

```tsx
<RadioGroup aria-invalid aria-describedby="plan-error" aria-label="Plan">
  …
</RadioGroup>
<p id="plan-error" className="text-sm text-destructive">
  Choose a plan to continue.
</p>
```

`aria-invalid` on the group styles the items and is announced with the group.

## Disabled item

```tsx
<RadioGroup defaultValue="starter" aria-label="Plan">
  <RadioGroupItem value="starter" id="p1" />
  <RadioGroupItem value="enterprise" id="p2" disabled />
</RadioGroup>
```

A disabled item is still visible and still announced, so the option does not
appear to vanish.

## When to use

- A small, fixed set of options where exactly one applies: a plan, a priority, a
  shipping method.
- Anywhere seeing all the options at once matters more than saving space.
- A setting that applies on submit, not immediately.

## When not to use

- Several answers can be true; use `checkbox`.
- The setting applies the moment it changes; use `switch`.
- More than about seven options, or a list that is filtered as you type; use
  `select` or `combobox`, which handle long lists and search.

## API

### `RadioGroup`

| Prop            | Type                                          | Default | Description                                     |
| --------------- | --------------------------------------------- | ------- | ----------------------------------------------- |
| `value`         | `string`                                      | –       | Controlled selection.                           |
| `defaultValue`  | `string`                                      | –       | Uncontrolled initial selection.                 |
| `onValueChange` | `(value, details) => void`                    | –       | Fired when the selection changes.               |
| `name`          | `string`                                      | –       | Form field name, submitted with the selection.  |
| `disabled`      | `boolean`                                     | `false` | Disables every item.                            |
| `required`      | `boolean`                                     | `false` | Blocks submit until something is selected.      |
| `className`     | `string`                                      | –       | Merged last; the default is `grid gap-3`.       |

### `RadioGroupItem`

| Prop        | Type      | Default | Description                              |
| ----------- | --------- | ------- | ---------------------------------------- |
| `value`     | `string`  | –       | Required. Identifies this option.        |
| `disabled`  | `boolean` | `false` | Keeps the option visible but unselectable.|
| `className` | `string`  | –       | Merged last.                             |

## Motion contract

Recipe: `state.morph`. The dot of the newly selected item fades in and settles
from 0.96 to full size; the previously selected dot reverses. Nothing else in the
row moves, so the eye follows the choice.

| Phase     | Properties                        | Token          | Interruptible |
| --------- | --------------------------------- | -------------- | ------------- |
| select    | `opacity 0 → 1`, `scale 0.96 → 1` | `state.morph`  | yes           |
| deselect  | the same pair, reversed           | `state.morph`  | yes           |
| reduced   | `opacity` only                    | `state.morph`  | yes           |
| none      | no transition                     | –              | –             |

## Keyboard interactions

| Keys                | Action                                                        |
| ------------------- | ------------------------------------------------------------- |
| `Tab`               | Enters the group at the selected item (or the first one).     |
| `Arrow Right/Down`  | Selects the next item and moves focus.                        |
| `Arrow Left/Up`     | Selects the previous item and moves focus.                    |
| `Space`             | Selects the focused item.                                     |

There is one tab stop for the whole group, not one per item: that is the roving
tabindex Base UI implements.

## Accessibility

- The group renders `role="radiogroup"`; each item renders `role="radio"` with a
  hidden input, so the form still submits a value.
- `aria-checked` carries the state on its own. The dot animation is never the only
  signal.
- Name the group with `aria-labelledby` pointing at a visible heading, or with
  `aria-label` when a heading would be redundant.
- `aria-invalid` belongs on the group: it describes the whole choice.

## Validation and data ownership

| The component does                                 | You do                                            |
| -------------------------------------------------- | ------------------------------------------------- |
| Styles and announces `aria-invalid` on the group   | Deciding that a choice is required                |
| Forwards `name`, `required`, and the selection      | Server-side validation of the submitted value     |
| Keeps arrow-key navigation within the group         | Focus policy after a failed submit                |

There is no `validate` or `schema` prop. [Field](/components/field) shows how the invalid
state and its message are wired.

## Responsive behavior

Items stack by default (`grid gap-3`). For a horizontal row of short labels, set
`className="flex flex-wrap gap-6"`; do not shorten the labels to fit — wrap them.

## Performance

One Motion element per item, each animating only `opacity` and `transform`, and
only when the selection changes. No layout thrash: the dot is absolutely sized by
CSS, so no measurement happens.

## Notes for AI

- Use `radio-group` for "one of N" and `checkbox` for "any of N".
- Put `name` and `aria-invalid` on the group, not on the items.
- Do not build a radio group out of buttons with `aria-pressed`; the radio role
  is what gives arrow-key navigation and form submission.

---

Full index: https://cadence.dev/llms.txt
