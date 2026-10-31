# Input OTP

> A one-time password field that renders one slot per character.

- Registry item: https://cadence.dev/r/input-otp.json
- Install: `npx shadcn@latest add @cadence/input-otp`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

```install
npx shadcn@latest add @cadence/input-otp
```

The component wraps [`input-otp`](https://github.com/guilhermerodz/input-otp),
which owns the single hidden input, paste handling, and the caret position.

## Usage

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/cadence/input-otp";

export function Code() {
  return (
    <InputOTP maxLength={6} aria-label="Verification code">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
```

`maxLength` must equal the number of slots. Each `InputOTPSlot` needs its `index`.

## Controlled, with completion

```tsx
const [code, setCode] = useState("");

<InputOTP maxLength={6} value={code} onChange={setCode} onComplete={verify}>
  …
</InputOTP>;
```

`onComplete` fires once the last slot is filled. It is the right place to submit
the code, not an effect that watches `code.length`.

## Invalid

```tsx
<InputOTP maxLength={4} aria-label="Code" aria-invalid>
  <InputOTPGroup>
    <InputOTPSlot index={0} aria-invalid />
    …
  </InputOTPGroup>
</InputOTP>
```

`aria-invalid` on a slot styles its border; the text beside the field carries the
message.

## Disabled

```tsx
<InputOTP maxLength={6} disabled aria-label="Code">
  …
</InputOTP>
```

## Without a separator

```tsx
<InputOTP maxLength={4} aria-label="PIN" containerClassName="justify-center">
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
    <InputOTPSlot index={3} />
  </InputOTPGroup>
</InputOTP>
```

## When to use

- A short code the user reads from another surface: a login code, an email
  verification, a device pairing code.
- Anywhere a single input would force the user to count characters.
- A code that arrives by SMS or authenticator app, where `autocomplete="one-time-code"`
  lets the OS offer it.

## When not to use

- A password the user chooses; use `input type="password"`.
- A long token that is pasted, not typed; use `input` with paste handling.
- A numeric field that is not a code, like a quantity; use `input type="number"`.

## API

### `InputOTP`

| Prop               | Type                        | Default | Description                                    |
| ------------------ | --------------------------- | ------- | ---------------------------------------------- |
| `maxLength`        | `number`                    | –       | Required. Number of characters.                |
| `value`            | `string`                    | –       | Controlled value.                              |
| `defaultValue`     | `string`                    | –       | Uncontrolled initial value.                    |
| `onChange`         | `(value: string) => void`   | –       | Fired on every change, including paste.        |
| `onComplete`       | `(value: string) => void`   | –       | Fired when the code is full.                   |
| `disabled`         | `boolean`                   | `false` | Ignores input.                                 |
| `containerClassName` | `string`                  | –       | Classes for the wrapper that positions the slots. |
| `className`        | `string`                    | –       | Classes for the input itself.                  |

### `InputOTPSlot`

| Prop        | Type     | Default | Description                          |
| ----------- | -------- | ------- | ------------------------------------ |
| `index`     | `number` | –       | Required. Which character it shows.  |
| `className` | `string` | –       | Merged last.                         |

`InputOTPGroup` and `InputOTPSeparator` are plain wrappers with `data-slot` values
`input-otp-group` and `input-otp-separator`.

## Motion contract

Recipe: `state.morph`. A character lands in its slot with a short fade and settles
from 0.96 to full size. Deleting a character is instant — an exit animation would
leave a ghost in a field the user is racing against.

| Phase   | Properties                        | Token         | Interruptible |
| ------- | --------------------------------- | ------------- | ------------- |
| type    | `opacity 0 → 1`, `scale 0.96 → 1` | `state.morph` | yes           |
| delete  | none (instant)                    | –             | –             |
| reduced | `opacity` only                    | `state.morph` | yes           |
| none    | no transition                     | –             | –             |

The caret is drawn but does not blink. A blink is a continuous loop that would
have to be declared as `data.transition`; the active slot's ring already shows
where the next character goes, so the loop buys nothing.

## Keyboard interactions

| Keys              | Action                                                    |
| ----------------- | --------------------------------------------------------- |
| Any character     | Fills the active slot and advances.                       |
| `Backspace`       | Clears the current slot, then moves back.                 |
| `Arrow Left/Right`| Moves the active slot without changing the value.         |
| `Cmd/Ctrl + V`    | Pastes the whole code, filling every slot from the start. |

## Accessibility

- `input-otp` renders a single real input with `aria-label` and
  `autocomplete="one-time-code"`, so assistive technology sees one field, not six.
- The slots are visual mirrors; they are not focusable and carry no role.
- `onComplete` is where the code is judged. The component never decides that a
  code is wrong.
- Keep the field visible while verifying and announce the result next to it, not
  through the slots' animation.

## Validation and data ownership

| The component does                                  | You do                                            |
| --------------------------------------------------- | ------------------------------------------------- |
| Styles `aria-invalid` on the slots                  | Deciding that the code is wrong or expired        |
| Reports every change and the completed value        | Verifying the code and mapping the server error   |
| Keeps the paste path working                        | Re-sending a code, throttling attempts            |

There is no `validate`, `schema`, or `rules` prop. [Field](/components/field) shows how the
invalid state and its message are wired.

## Responsive behavior

Slots are 36px squares; six of them plus a separator fit a 320px viewport. For
longer codes, drop the separator group or reduce the gap in `containerClassName`
before shrinking the slots below 32px.

## Performance

One Motion element per slot, animating `opacity` and `transform` only when a
character changes. No per-keystroke layout read: the caret position comes from the
input, not from measurement.

## Notes for AI

- `maxLength` and the slot count must agree; a mismatch silently drops characters.
- Use `onComplete` to submit, not an effect that watches `value.length`.
- The caret does not blink on purpose. Do not re-add a `animate-caret-blink`
  loop without declaring the recipe.

---

Full index: https://cadence.dev/llms.txt
