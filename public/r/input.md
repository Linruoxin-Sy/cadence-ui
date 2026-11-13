# Input

> Names, emails, search queries, and other short text.

- Registry item: https://cadence.dev/r/input.json
- Install: `npx shadcn@latest add @cadence/input`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, geometry.resize, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/input
```

Usage, the examples and the top preview also use [Label](/components/label). Install
it when copying those compositions:

```install
npx shadcn@latest add @cadence/label
```

The Controlled example also renders [Button](/components/button) for its external
action:

```install
npx shadcn@latest add @cadence/button
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
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
| cadence-provider | `@components/cadence/lib/group-member.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| input | `@components/cadence/input/index.tsx` | [JSON files[].content](https://cadence.dev/r/input.json) |
| input | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/input.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: input](https://cadence.dev/r/input.json)

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
    --motion-stagger-reveal: 0.055s;
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
    --motion-stagger-reveal: var(--cadence-inherited-motion-stagger-reveal, inherit);
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

Input needs the files and packages listed above: the component, the shared library files
the registry installs with it, and the motion runtime they use. No additional item-specific
CSS is required. Keep `input/index.tsx` and the `lib/` files at the listed relative paths so
the shared imports resolve. Give the input an accessible name with a label and matching
`htmlFor` / `id` as shown in Usage.

For the labelled compositions, follow [Label's installation](/components/label#installation)
and copy its component file alongside Input; the shared `lib/cn.ts` and its packages are
already included above. For Controlled's action, follow
[Button's installation](/components/button#installation), including its dependencies and
motion setup. Label and Button are example dependencies, not dependencies of Input.
Button is rendered only in Controlled; the unused `Button` and `useState` imports in the
other example snippets can be omitted. React's `useId` and `useState` need no additional
package beyond the React setup above.

## Usage

```tsx
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function WorkspaceName() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="workspace">Workspace name</Label>
      <Input id="workspace" placeholder="Acme" autoComplete="organization" />
    </div>
  );
}
```

## Invalid

The caller supplies `aria-invalid` and a described error. This fixed error state does not run validation or prevent editing.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function InvalidInput() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input id={id} type="email" aria-invalid="true" aria-describedby={`${id}-error`} defaultValue="ada@" />
      <p id={`${id}-error`} className="text-sm text-destructive">Enter a complete email address.</p>
    </div>
  );
}
```

## File input

Use the native file picker for caller-owned files. `accept` suggests file types; the browser and your application own selection, upload and checks.

<ComponentExample name="file" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function FileInput() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-2">
      <Label htmlFor={id}>Image</Label>
      <Input id={id} type="file" accept="image/png,image/jpeg" aria-describedby={`${id}-hint`} />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">Choose a PNG or JPEG image.</p>
    </div>
  );
}
```

## Controlled, Base UI style

The caller owns `value` through Base UI’s `onValueChange`. The external action replaces only this example’s value; typing in another specimen remains independent.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function ControlledInput() {
  const id = useId();
  const [value, setValue] = useState("");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Label htmlFor={id}>Workspace name</Label>
      <Input id={id} value={value} onValueChange={setValue} aria-describedby={`${id}-value`} />
      <p id={`${id}-value`} role="status" className="text-sm text-muted-foreground">Value: {value || "(empty)"}</p>
      <Button variant="outline" onClick={() => setValue("Cadence UI")}>Use workspace name</Button>
    </div>
  );
}
```

## Disabled and read-only

A disabled field cannot be edited or focused and is omitted from native form submission. A read-only field stays focusable and submits its value. A filled field is still editable unless you explicitly set `readOnly`.

<ComponentExample name="disabled-readonly" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Input } from "@/components/cadence/input";
import { Label } from "@/components/cadence/label";

export function InputAvailability() {
  const id = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-filled`}>Filled</Label>
        <Input id={`${id}-filled`} name="workspace" defaultValue="Cadence UI" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-disabled`}>Disabled</Label>
        <Input id={`${id}-disabled`} name="disabled" disabled defaultValue="cadence" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-readonly`}>Read-only</Label>
        <Input id={`${id}-readonly`} name="slug" readOnly defaultValue="cadence-ui" />
      </div>
    </div>
  );
}
```

## When to use

- A single line of text the user types: email, name, slug, search, URL.
- A field that needs a native input type (`email`, `password`, `tel`, `number`,
  `file`) and therefore native mobile keyboards.
- Anywhere the browser's autofill, password manager, or form submission should
  work without a wrapper.

## When not to use

- Multi-line text; use `textarea`.
- A choice from a fixed list; use `select` (or `combobox` when the list is long).
- A value the app controls entirely, like a generated id. Render text, not a
  disabled input.

## API

| Prop            | Type                                | Default | Description                                        |
| --------------- | ----------------------------------- | ------- | -------------------------------------------------- |
| `type`          | `string`                            | –       | Native input type.                                 |
| `value`         | `string \| number \| readonly string[]` | –   | Controlled value.                                  |
| `defaultValue`  | same as `value`                     | –       | Uncontrolled initial value.                        |
| `onValueChange` | `(value: string, details) => void`  | –       | Base UI change callback, in addition to `onChange`. |
| `className`     | string or state callback                            | –       | Merged last.                                       |

All native input props are forwarded, including `disabled`, `readOnly`, `required`,
and `aria-*`.

Base UI state callbacks for `className` are evaluated before merging caller classes last.
`style` accepts an object or a state callback and is forwarded to the primitive.

## Motion contract

Authored intensity is **subtle**: Input fades its own later insertion, transitions only the chrome and foreground it paints, and interpolates one explicitly authored box while the editor is unfocused; typing, selection, autofill and parent resizing keep native ownership.

The native control stays the only editor node. Cadence never mirrors, copies or
re-measures the value, so typing, selection, composition and autofill are always the
browser's own.

| Recipe | Owner and full behaviour | reduced | none |
| ------ | ------------------------ | ------- | ---- |
| `data.transition/one-shot` | Independent insertion of a later-mounted field fades the control's own opacity. A presenting Field or group owns the entrance instead, and focus, typing or a missing presenting parent keeps native paint. | Short opacity. | Immediate. |
| `state.color/css-transition` | Background, foreground, border and the scoped focus/invalid shadow. DOM focus-within, invalid state, a theme-owned switch and any palette we cannot prove settle every declared property at its target; otherwise an authored colour change transitions. | Short eligible colour. | Zero duration and delay. |
| `geometry.resize/measured` | One explicitly authored border box, measured once from the committed box outside the interpolated origin and clamped to the available parent. A focused editor, typing, selection, pointer work, passive parent or font reflow, file internals and a caller transition on the same axis all commit final geometry immediately. | Immediate size. | Immediate size. |

Focus and invalid changes retarget directly; there is no shake, queued warning or
validation logic. Entering composition or editing cancels any conflicting size work, and
blur does not replay skipped work. Parent removal owns any exit, so the control is never
held in a retained fade that postpones native focus cleanup. Live reduction finishes
geometry, and `none` or a zero clock also cancels colour and opacity without leaving a
copied value behind.

## Accessibility

- Base UI's input is field-aware: inside a `field`, it receives the label id and
  the description ids without extra wiring.
- Always give it a name from a `label`; a placeholder is not a name.
- `aria-invalid` plus a described error is the accessible failure state. Colour
  alone is never the signal.
- Never set `outline: none` in `className`; the focus ring is the only affordance
  for keyboard users.

## Validation and data ownership

P11 draws the line: the component renders state, the user decides state.

| The component does                                    | You do                                                    |
| ----------------------------------------------------- | --------------------------------------------------------- |
| Styles `aria-invalid="true"` and `data-invalid`        | Deciding what "valid" means (required, format, length)    |
| Renders whatever `aria-describedby` points at          | Writing the error text and the ids it lives on            |
| Forwards `required`, `readOnly`, `disabled`, `name`    | Form state (react-hook-form, TanStack Form, server state)  |
| Keeps focus visible and keyboard-reachable             | Submit, retry, error mapping, focus management             |

There is no `schema`, `resolver`, `validate`, or `rules` prop, and no validation
library is imported. [Field](/components/field) shows how the invalid state and its message
are wired.

## Responsiveness and performance

The input fills its parent and uses base text sizing below the md breakpoint. Constrain the parent
in grids; native input types retain browser keyboards, editing and form behavior, and the
component adds no wrapper element around the control.

Cadence adds one shared motion runtime for the insertion opacity, the chrome paint and the
optional measured box; the editor itself is never duplicated or mirrored, and no per-keystroke
measurement, observer or text layer is created. Numeric source budgets remain advisory under
ADR-023 and are not a performance pass. Base UI behavior requires hydration; native HTML
behavior remains browser-owned, and server-rendered markup does not imply that every
interaction works without JavaScript.

## Notes for AI

- Use `aria-invalid` and `aria-describedby` — never an `error` prop or internal
  state.
- Do not wrap the input in a div just to add a border; the component already owns
  the border, radius, and focus ring.

---

Full index: https://cadence.dev/llms.txt
