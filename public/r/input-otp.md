# Input OTP

> Login codes, email verification, and device pairing.

- Registry item: https://cadence.dev/r/input-otp.json
- Install: `npx shadcn@latest add @cadence/input-otp`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/input-otp
```

The component wraps [`input-otp`](https://github.com/guilhermerodz/input-otp),
which owns the single hidden input, paste handling, and the caret position.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion input-otp lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-provider | `@components/cadence/lib/provider.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-style.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/control-animation.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/native-div.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/press-button.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-scope.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| input-otp | `@components/cadence/input-otp/index.tsx` | [JSON files[].content](https://cadence.dev/r/input-otp.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: input-otp](https://cadence.dev/r/input-otp.json)

4. Apply the required CSS/configuration below, then follow [Usage](#usage) for the component imports and composition.

Merge the CSS from [cadence-theme](https://cadence.dev/r/cadence-theme.json) into your global stylesheet after your base theme:

```css
@theme inline {
  --color-sidebar: var(--sidebar, var(--card));
  --color-sidebar-foreground: var(--sidebar-foreground, var(--card-foreground));
  --color-sidebar-primary: var(--sidebar-primary, var(--primary));
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground, var(--primary-foreground));
  --color-sidebar-accent: var(--sidebar-accent, var(--accent));
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground, var(--accent-foreground));
  --color-sidebar-border: var(--sidebar-border, var(--border));
  --color-sidebar-ring: var(--sidebar-ring, var(--ring));
}

:root {

}

@layer base {
  :root {
    --motion-source-duration-instant: 0.1s;
    --motion-source-duration-fast: 0.16s;
    --motion-source-duration-base: 0.22s;
    --motion-source-duration-slow: 0.32s;
    --motion-source-duration-page: 0.45s;
    --motion-distance-xs: 4px;
    --motion-distance-sm: 8px;
    --motion-distance-md: 12px;
    --motion-distance-lg: 24px;
    --motion-distance-xl: 48px;
    --motion-scale-in: 0.96;
    --motion-scale-pop: 1.02;
    --motion-scale-press: 0.97;
    --motion-rotation-half-turn: 180deg;
    --motion-stagger-char: 0.012s;
    --motion-stagger-word: 0.035s;
    --motion-stagger-item: 0.05s;
    --motion-spring-press-duration: 0.24s;
    --motion-spring-press-bounce: 0.12;
    --motion-spring-snappy-duration: 0.26s;
    --motion-spring-snappy-bounce: 0;
    --motion-spring-travel-duration: 0.3s;
    --motion-spring-travel-bounce: 0;
    --motion-spring-smooth-duration: 0.4s;
    --motion-spring-smooth-bounce: 0;
    --motion-spring-morph-duration: 0.42s;
    --motion-spring-morph-bounce: 0;
    --motion-spring-size-compact-duration: 0.28s;
    --motion-spring-size-compact-bounce: 0;
    --motion-spring-size-panel-duration: 0.36s;
    --motion-spring-size-panel-bounce: 0;
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-source-version: 1;
  }
  [data-cadence-scope] {
    --motion-source-duration-instant: var(--cadence-inherited-motion-source-duration-instant, inherit);
    --motion-source-duration-fast: var(--cadence-inherited-motion-source-duration-fast, inherit);
    --motion-source-duration-base: var(--cadence-inherited-motion-source-duration-base, inherit);
    --motion-source-duration-slow: var(--cadence-inherited-motion-source-duration-slow, inherit);
    --motion-source-duration-page: var(--cadence-inherited-motion-source-duration-page, inherit);
    --motion-distance-xs: var(--cadence-inherited-motion-distance-xs, inherit);
    --motion-distance-sm: var(--cadence-inherited-motion-distance-sm, inherit);
    --motion-distance-md: var(--cadence-inherited-motion-distance-md, inherit);
    --motion-distance-lg: var(--cadence-inherited-motion-distance-lg, inherit);
    --motion-distance-xl: var(--cadence-inherited-motion-distance-xl, inherit);
    --motion-scale-in: var(--cadence-inherited-motion-scale-in, inherit);
    --motion-scale-pop: var(--cadence-inherited-motion-scale-pop, inherit);
    --motion-scale-press: var(--cadence-inherited-motion-scale-press, inherit);
    --motion-rotation-half-turn: var(--cadence-inherited-motion-rotation-half-turn, inherit);
    --motion-stagger-char: var(--cadence-inherited-motion-stagger-char, inherit);
    --motion-stagger-word: var(--cadence-inherited-motion-stagger-word, inherit);
    --motion-stagger-item: var(--cadence-inherited-motion-stagger-item, inherit);
    --ease-cadence-out: var(--cadence-inherited-ease-cadence-out, inherit);
    --ease-cadence-in-out: var(--cadence-inherited-ease-cadence-in-out, inherit);
    --ease-cadence-in: var(--cadence-inherited-ease-cadence-in, inherit);
    --motion-spring-press-duration: var(--cadence-inherited-motion-spring-press-duration, inherit);
    --motion-spring-press-bounce: var(--cadence-inherited-motion-spring-press-bounce, inherit);
    --motion-spring-snappy-duration: var(--cadence-inherited-motion-spring-snappy-duration, inherit);
    --motion-spring-snappy-bounce: var(--cadence-inherited-motion-spring-snappy-bounce, inherit);
    --motion-spring-travel-duration: var(--cadence-inherited-motion-spring-travel-duration, inherit);
    --motion-spring-travel-bounce: var(--cadence-inherited-motion-spring-travel-bounce, inherit);
    --motion-spring-smooth-duration: var(--cadence-inherited-motion-spring-smooth-duration, inherit);
    --motion-spring-smooth-bounce: var(--cadence-inherited-motion-spring-smooth-bounce, inherit);
    --motion-spring-morph-duration: var(--cadence-inherited-motion-spring-morph-duration, inherit);
    --motion-spring-morph-bounce: var(--cadence-inherited-motion-spring-morph-bounce, inherit);
    --motion-spring-size-compact-duration: var(--cadence-inherited-motion-spring-size-compact-duration, inherit);
    --motion-spring-size-compact-bounce: var(--cadence-inherited-motion-spring-size-compact-bounce, inherit);
    --motion-spring-size-panel-duration: var(--cadence-inherited-motion-spring-size-panel-duration, inherit);
    --motion-spring-size-panel-bounce: var(--cadence-inherited-motion-spring-size-panel-bounce, inherit);
  }
  [data-motion='full'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 1 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='reduced'] {
    --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
  }
  [data-motion='none'] {
    --motion-duration-instant: calc(0s + 0s * 1);
    --motion-duration-fast: calc(0s + 0s * 1);
    --motion-duration-base: calc(0s + 0s * 1);
    --motion-duration-slow: calc(0s + 0s * 1);
    --motion-duration-page: calc(0s + 0s * 1);
  }
  @media (prefers-reduced-motion: reduce) {
    :root {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
    [data-motion='full'] {
      --motion-duration-instant: var(--cadence-effective-instant, calc(var(--motion-source-duration-instant) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-fast: var(--cadence-effective-fast, calc(var(--motion-source-duration-fast) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-base: var(--cadence-effective-base, calc(var(--motion-source-duration-base) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-slow: var(--cadence-effective-slow, calc(var(--motion-source-duration-slow) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
      --motion-duration-page: var(--cadence-effective-page, calc(var(--motion-source-duration-page) * 0.6 * var(--cadence-time-scale, 1) + 0s * 1));
    }
  }
}
@theme static {
  --ease-cadence-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-cadence-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-cadence-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```

The provider files above are required imports. Wrapping your application is optional; standalone components respect the system motion preference. To control a subtree, wrap it once:

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <CadenceProvider mode="full">{children}</CadenceProvider>;
}
```

Copy all nine target files, preserving the sibling `input-otp/` and shared
`lib/` directories, relative imports and `"use client"` directives. Copy every
file in the listed payloads, including the provider helpers. The provider files
and `motion` package are required imports even without a provider wrapper.
`lucide-react` is a component dependency: `InputOTPSeparator` imports its dash
icon even when your composition omits the separator.

Complete the linked base theme setup and ensure Tailwind scans the copied
files. No extra item-specific CSS or external asset is required. The
`input-otp` dependency supplies its transparent-input styling and no-JavaScript
CSS fallback; do not replace the real input with one input per slot. Its
`nonce` prop supports the injected runtime style tag when your CSP requires
one; review `noScriptCSSFallback` separately for your application's CSP.

Full mode plays `state.morph` when a character changes, with opacity and scale;
reduced keeps opacity at neutral scale; none shows characters immediately.
Deleting is instant, character nodes stay mounted, and mode changes cancel an
entry. The fake caret is static. Standalone inputs follow the system motion
preference. The optional `CadenceProvider` controls mode and timing; an explicit
nested full scope still respects system reduced motion.

Controlled needs [Button](/components/button) and [Label](/components/label).
Invalid, Disabled and read-only, and the top specimen also use Label:

```install
npx shadcn@latest add @cadence/button @cadence/label
```

For manual setup, follow their Manual tabs and add `button/index.tsx` and
`label/index.tsx`. Their shared files are already included above. Button adds
these npm dependencies; Label needs no additional npm package:

```package-manager
npm install @base-ui/react class-variance-authority
```

The other examples need only Input OTP and its included helpers. Numeric paste
imports `REGEXP_ONLY_DIGITS` from the already required `input-otp` package.
The site's preview shell is not consumer setup.

In Next.js App Router, Controlled needs a caller client module for its state,
change/completion handlers and clear button. Grouped numeric codes and paste
needs one for its function-valued `pasteTransformer`. Usage, Without a
separator and Explicit motion scopes can use synchronous Server Components
with the shown serializable props. Invalid, Disabled and read-only, and the
top specimen use synchronous `useId` only; that hook alone does not require a
client boundary. Keep their shown client directives when copying the examples.
Caller refs, event handlers, function-valued `render`, `useState` or `useRef`
need a caller client boundary. Preserve the installed sources' directives.

Pass the required `maxLength` and render one slot for each index from zero
through `maxLength - 1`, inside the same InputOTP. Groups and separators only
arrange those slots; they do not create separate inputs. Keep codes as strings
to preserve leading zeros. Use `defaultValue` for an uncontrolled initial
value, or `value` with `onChange(nextString)` for editable controlled state.
`onComplete` reports a change from a shorter value to a full code; an initially
full value or replacing one full code with another is not a new completion.
The callback does not verify or submit the code by itself.

The default keyboard hint is `inputMode="numeric"`, not a character filter.
Set `pattern` explicitly when needed; `REGEXP_ONLY_DIGITS` accepts digits.
A `pasteTransformer` normalizes the pasted text before the pattern check;
select all to replace a full code, otherwise paste uses the current selection
and truncates to `maxLength`. Selection, arrow keys and Backspace belong to
the single real input; slots mirror its active range and character state.
`containerClassName` styles the visible wrapper, while `className` styles
the transparent input. The default password-manager strategy is
`pushPasswordManagerStrategy="increase-width"`; `"none"` disables that
badge accommodation. Test actual autofill and password-manager integrations
in your target browsers.

Associate a visible Label with the InputOTP's `id`, or supply `aria-label`.
Put `aria-invalid` and `aria-describedby` on the real InputOTP, and
`aria-invalid` on each slot for its destructive border. Disabled blocks focus
and editing; read-only retains focus and selection for a fixed value. Native
`name`, `form` and `required` props belong to the real input: it contributes
one string under its name, disabled inputs are excluded, and read-only values
remain available to the form. Keep form reset explicit in caller state; do
not rely on native reset to synchronize the dependency's internal draft or
your completion message. The caller owns code delivery, normalization policy,
verification, submission, expiry/errors, retry limits and persistence.

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
