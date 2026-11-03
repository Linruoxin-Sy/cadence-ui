# Input OTP

> Login codes, email verification, and device pairing.

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
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/cadence/input-otp";

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

The caller owns the six-character draft and the completed-code message. Completion records a value; it does not authenticate it. Clear login code resets only this example and its message.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/cadence/input-otp";
import { Label } from "@/components/cadence/label";

export function ControlledCode() {
  const id = useId();
  const [code, setCode] = useState("");
  const [completed, setCompleted] = useState("Not completed");
  return (
    <div className="grid justify-items-start gap-3">
      <Label htmlFor={id}>Login code</Label>
      <InputOTP
        id={id}
        maxLength={6}
        value={code}
        onChange={setCode}
        onComplete={(value) => setCompleted(`Completed: ${value}`)}
      >
        <InputOTPGroup>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p role="status" className="text-sm text-muted-foreground">
        {completed}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCode("");
          setCompleted("Not completed");
        }}
      >
        Clear login code
      </Button>
    </div>
  );
}
```

## Invalid

The caller supplies the expired-code error and aria-describedby on the real input. Each visual slot also gets aria-invalid for its destructive border. Editing does not independently clear the server error.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/cadence/input-otp";
import { Label } from "@/components/cadence/label";

export function InvalidCode() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <Label htmlFor={id}>Expired code</Label>
      <InputOTP id={id} maxLength={4} defaultValue="0000" aria-invalid="true" aria-describedby={`${id}-error`}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((index) => (
            <InputOTPSlot key={index} index={index} aria-invalid />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <p id={`${id}-error`} className="text-sm text-destructive">
        This code has expired. Request another code.
      </p>
    </div>
  );
}
```

## Disabled and read-only

Disabled prevents focus and editing. Read-only retains a focusable input and a copyable code, while rejecting edits. The values are fixed independently.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/cadence/input-otp";
import { Label } from "@/components/cadence/label";

export function DisabledCodes() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Unavailable code</Label>
        <InputOTP id={`${id}-disabled`} maxLength={4} disabled value="1234">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only code</Label>
        <InputOTP id={`${id}-readonly`} maxLength={4} readOnly value="5678">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
}
```

## Without a separator

A four-character PIN needs one group and four indexed slots. maxLength must match the slot count; it is a code string and can retain leading zeros.

<ComponentExample name="without-separator" />

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/cadence/input-otp";

export function ShortCode() {
  return (
    <InputOTP maxLength={4} aria-label="PIN" containerClassName="justify-center">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
      </InputOTPGroup>
    </InputOTP>
  );
}
```

## Grouped numeric codes and paste

Two three-slot groups share one real input. The numeric pattern accepts digits, while the caller strips hyphens from pasted codes such as 123-456. Paste replaces the current selection, so select all first when replacing a full code. Pattern checks characters, not server validity.

<ComponentExample name="paste" />

```tsx
"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/cadence/input-otp";

export function PasteCode() {
  return (
    <InputOTP
      maxLength={6}
      aria-label="Pasted numeric code"
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      pasteTransformer={(text) => text.replaceAll("-", "")}
    >
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

## Explicit motion scopes

The filled first code is fixed to none from the moment its DOM appears. The second input explicitly requests full inside that none provider, subject to the system reduced-motion preference. Ordinary inputs inherit the header; the caret never blinks.

<ComponentExample name="without-motion" />

```tsx
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/cadence/input-otp";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function StaticCode() {
  return (
    <CadenceProvider mode="none">
      <div className="grid gap-4">
        <div data-testid="initial-none">
          <InputOTP maxLength={1} value="1" aria-label="Static code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <InputOTP maxLength={1} aria-label="Explicit full input-otp">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
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
| `readOnly`         | `boolean` | `false` | Allows focus and selection, rejects edits. |
| `pattern` | `string` | – | Accepted characters, not server verification. |
| `inputMode` | native input mode | `"numeric"` | Keyboard hint. |
| `pasteTransformer` | `(text: string) => string` | – | Caller normalization before paste filtering. |
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

The character span stays mounted when its value changes; updates replay the recipe on that same node. Mode changes cancel the running entry, and `none` renders filled slots immediately, including on the first render.

The caret is drawn but does not blink. A blink is a continuous loop that would
have to be declared as `data.transition`; the active slot's ring already shows
where the next character goes, so the loop buys nothing.

## Keyboard interactions

| Keys              | Action                                                    |
| ----------------- | --------------------------------------------------------- |
| Allowed character | Fills the active slot and advances.                       |
| `Backspace`       | Clears the current slot, then moves back.                 |
| `Arrow Left/Right`| Moves the active slot without changing the value.         |
| `Cmd/Ctrl + V`    | Pastes at the current selection; select all to replace a code. |

## Accessibility

- `input-otp` renders a single real input with `aria-label` and
  `autocomplete="one-time-code"`, so assistive technology sees one field, not six.
- The slots are visual mirrors; they are not focusable and carry no role.
- `onComplete` reports a filled code for the caller to judge. The component never decides that a
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
