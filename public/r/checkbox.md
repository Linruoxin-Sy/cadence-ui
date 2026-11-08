# Checkbox

> Independent yes/no choices and multi-select lists.

- Registry item: https://cadence.dev/r/checkbox.json
- Install: `npx shadcn@latest add @cadence/checkbox`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/checkbox
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react lucide-react
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
| checkbox | `@components/cadence/checkbox/index.tsx` | [JSON files[].content](https://cadence.dev/r/checkbox.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: checkbox](https://cadence.dev/r/checkbox.json)

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

Copy all nine files in the target list, including every file from the motion,
utilities and provider payloads. Keep `checkbox/index.tsx` beside the shared
`lib/` directory with the relative imports and `"use client"` directives intact.
The indicator uses `ControlSpan`, whose imports also reach `native-div.tsx` and
`press-button.tsx`; copying only `provider.tsx` is not enough. The provider files
and `motion` package are required even without an application wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the copied
files. There is no additional Checkbox-specific CSS or asset. `lucide-react`
supplies the tick and mixed-state icons. Only the indicator animates:
`state.morph` fades and scales it in full, keeps opacity with immediate full size
in reduced, and settles immediately in none, including an initially checked
control. Standalone checkboxes follow the system motion preference; the optional
`CadenceProvider` controls a subtree's mode and timing. A nested full scope still
respects the system reduced-motion preference.

Usage, the top specimen and the labelled examples also need
[Label](/components/label). Controlled and Native form submission additionally
use [Button](/components/button). Install the items needed by your example:

```install
npx shadcn@latest add @cadence/label @cadence/button
```

For manual installation, follow their Manual tabs too: add `label/index.tsx`
and, when using Button, `button/index.tsx`. Their shared files are already in
Checkbox's target list. Label adds no npm package; Button also requires:

```package-manager
npm install class-variance-authority
```

Explicit motion scopes uses only Checkbox and the included provider. No example
needs another package or external asset. The site's preview shell is not consumer
setup.

In Next.js App Router, Controlled and Native form submission need a client
module for their state and event handlers. The other snippets can be composed
in a synchronous Server Component using the shown `useId` or stable unique IDs,
JSX and serializable props; their existing client directives may also be kept.
An event handler, a function-valued `render`, `className(state)` or `style(state)`,
or a client-side hook such as `useState` or `useRef` needs a caller client
boundary. Preserve the installed sources' client directives in either case.

Give every control a visible label linked with `htmlFor` and a unique `id`, or
an `aria-label`. With the default renderer, the supplied `id` belongs to the
hidden native input; Base UI gives the visible checkbox its own accessible
name, focus and Space-key behavior. Use `defaultChecked` for an uncontrolled
initial value, or own `checked` with `onCheckedChange`. `indeterminate` announces
mixed state but does not set `checked` or derive a child selection for you.

Keep the default root as a flex or grid item, as Usage does. Inside a plain
block wrapper, give Checkbox `className="inline-flex"` so its `span` respects
the control's width and height, as the wrapped Static checkbox in Explicit
motion scopes demonstrates.

For native submission, supply `name` and `value`: a checked, enabled input
contributes that entry; an unchecked input is omitted unless you supply
`uncheckedValue`. Disabled inputs are omitted. A read-only choice stays
focusable and retains its checked submission value. `required` participates in
browser constraint validation, as the form example demonstrates. The caller
owns acceptance rules, controlled state, error text, submission, server-side
validation and persistence; Cadence renders `aria-invalid` and the described
error without deciding when either should clear.

## Usage

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxSettings() {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-help`} className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor={id}>Send the weekly digest</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Every Monday, 09:00.
        </p>
      </div>
    </div>
  );
}
```

`id` lands on the hidden input, so `htmlFor` on a `label` names the control and
clicking the label toggles it.

## Checked by default, and indeterminate

`defaultChecked` initializes an uncontrolled choice. `indeterminate` announces a mixed selection; it does not make the field checked for form submission. Both controls below own their state independently.

<ComponentExample name="states" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxStates() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-checked`} defaultChecked />
        <Label htmlFor={`${id}-checked`}>Checked by default</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-mixed`} indeterminate />
        <Label htmlFor={`${id}-mixed`}>Some projects selected</Label>
      </div>
    </div>
  );
}
```

## Controlled

The caller owns acceptance and its status. Reset acceptance is an external update to this example alone; it does not change the top specimen or any other checkbox.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function ControlledCheckbox() {
  const id = useId();
  const [accepted, setAccepted] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Checkbox id={id} checked={accepted} onCheckedChange={setAccepted} />
        <Label htmlFor={id}>Accept the terms</Label>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {accepted ? "Terms accepted" : "Terms not accepted"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setAccepted(false)}>
        Reset acceptance
      </Button>
    </div>
  );
}
```

## Invalid, with a described error

The caller supplies `aria-invalid` and the described error. Checking the box does not clear the error automatically: the application decides when it is resolved.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function InvalidCheckbox() {
  const id = useId();
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3">
        <Checkbox id={id} aria-invalid="true" aria-describedby={`${id}-error`} />
        <Label htmlFor={id}>Accept the terms</Label>
      </div>
      <p id={`${id}-error`} className="text-sm text-destructive">
        You must accept the terms to continue.
      </p>
    </div>
  );
}
```

## In a row of settings

Associate the visible label and help text with one unique control. The description remains available when the label wraps on a narrow screen.

<ComponentExample name="settings" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxSettings() {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Checkbox id={id} aria-describedby={`${id}-help`} className="mt-0.5" />
      <div className="grid gap-1">
        <Label htmlFor={id}>Send the weekly digest</Label>
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          Every Monday, 09:00.
        </p>
      </div>
    </div>
  );
}
```

## Disabled and read-only

Disabled choices retain their checked or unchecked state and are skipped by keyboard navigation. A read-only choice stays focusable but cannot be changed. The group disabled marker also dims its label; Base UI does not use a native disabled button.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function DisabledCheckboxes() {
  const id = useId();
  return (
    <div className="grid gap-4">
      <div className="group flex items-center gap-3" data-disabled="true">
        <Checkbox id={`${id}-off`} disabled />
        <Label htmlFor={`${id}-off`}>Unavailable, unchecked</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <Checkbox id={`${id}-on`} disabled defaultChecked />
        <Label htmlFor={`${id}-on`}>Unavailable, checked</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox id={`${id}-readonly`} readOnly defaultChecked />
        <Label htmlFor={`${id}-readonly`}>Read-only preference</Label>
      </div>
    </div>
  );
}
```

## Native form submission

`name` and `value` define the native form entry. `required` uses browser constraint validation before this caller-owned submit handler runs. Server-side validation and persistence remain the application’s responsibility.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import { Label } from "@/components/cadence/label";

export function CheckboxForm() {
  const id = useId();
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setResult(`Submitted consent: ${data.get("consent")}`);
      }}
    >
      <div className="flex items-center gap-3">
        <Checkbox id={id} name="consent" value="accepted" required />
        <Label htmlFor={id}>Accept the terms (required)</Label>
      </div>
      <Button type="submit" size="sm">
        Submit consent
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}
```

## Explicit motion scopes

The checked control is explicitly `none` from its first render, so its tick appears immediately and still toggles. Its neighbour explicitly restores `full` inside that scope; the system reduced-motion preference still takes precedence. These are deliberate local overrides. Ordinary examples follow the site header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Checkbox } from "@/components/cadence/checkbox";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function StaticCheckbox() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <Checkbox aria-label="Static checkbox" className="inline-flex" defaultChecked />
        </div>
        <CadenceProvider mode="full">
          <Checkbox aria-label="Explicit full checkbox" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- One independent yes/no choice: accept the terms, remember this device, include
  archived items.
- A set of choices where several can be true at once; use one checkbox per row.
- A parent row that summarises children: pass `indeterminate` while the children
  disagree.
- A table row selection, where each row is its own decision.

## When not to use

- Exactly one of several options; use `radio-group`, which also gives arrow-key
  navigation.
- An immediate setting that applies the moment it is flipped; use `switch`.
- A formatting command that acts on a selection; use `toggle`.

## API

| Prop               | Type                              | Default | Description                                          |
| ------------------ | --------------------------------- | ------- | ---------------------------------------------------- |
| `checked`          | `boolean`                         | –       | Controlled state.                                    |
| `defaultChecked`   | `boolean`                         | `false` | Uncontrolled initial state.                          |
| `onCheckedChange`  | `(checked, details) => void`      | –       | Fired on click and on Space.                         |
| `indeterminate`    | `boolean`                         | `false` | Mixed visual state for a parent row.                 |
| `disabled`         | `boolean`                         | `false` | Ignores interaction and form submission.             |
| `readOnly`         | `boolean`                         | `false` | Focusable, submitted, not changeable.                |
| `required`         | `boolean`                         | `false` | Blocks form submission until checked.                |
| `name`, `value`    | `string`                          | –       | Form field identity and submitted value.             |
| `className`        | `string` / state callback                          | –       | Merged last.                                         |

All native attributes are forwarded, including `aria-invalid` and
`aria-describedby`.

## Motion contract

Recipe: `state.morph`. The tick is the protagonist — it fades in and settles from
0.96 to full size when the box is checked, and reverses when it is cleared.

| Phase   | Properties                    | Token          | Interruptible |
| ------- | ----------------------------- | -------------- | ------------- |
| check   | `opacity 0 → 1`, `scale 0.96 → 1` | `state.morph` | yes (re-click) |
| clear   | the same pair, reversed       | `state.morph`  | yes           |
| reduced | `opacity` only                | `state.morph`  | yes           |
| none    | no transition                 | –              | –             |

Only the indicator moves. The box itself keeps a `transition-shadow` for the focus
ring and the invalid ring, which is colour/shadow state feedback, not motion.

## Keyboard interactions

| Keys          | Action                                     |
| ------------- | ------------------------------------------ |
| `Tab`         | Moves focus to the checkbox.               |
| `Space`       | Toggles checked, unless `readOnly`.        |
| `Shift+Tab`   | Moves focus to the previous control.       |

## Accessibility

- Base UI renders `role="checkbox"` on the visible element plus a hidden
  `<input type="checkbox">`, so the control is in the form and in the tab order.
- The tick is not the announcement: the state lives in `aria-checked`, which is
  why the reduced and `none` branches stay usable.
- Always pair the box with a `Label` (`htmlFor`) or an `aria-label`; a bare box
  has no accessible name.
- `indeterminate` announces as "mixed". Do not use it as a substitute for
  `checked` in a form.

## Validation and data ownership

| The component does                                  | You do                                               |
| --------------------------------------------------- | ---------------------------------------------------- |
| Styles `aria-invalid` and forwards it to the input   | Deciding whether the box must be checked             |
| Forwards `required`, `name`, `value`, `disabled`     | Building the submitted payload                       |
| Announces `aria-checked` for all three states        | Mapping the error to the field with `aria-describedby` |

There is no `validate`, `schema`, or `rules` prop. [Field](/components/field) shows how the
invalid state and its message are wired.

## Responsive behavior

The control is fixed at 16px with a 44px touch target (the `after:` pseudo
element extends the hit area), so it behaves the same at every breakpoint. Put the
label beside it, not inside it; wrapping a checkbox in a label removes the
`aria-describedby` chain.

## Performance

No JS animation loop: one Motion element per box, animating only `opacity` and
`transform`. A list of 50 checkboxes is 50 short transitions on demand, never a
running loop.

## Notes for AI

- Use `aria-invalid` + `aria-describedby` for errors; there is no `error` prop.
- Do not add press animation to a checkbox; the tick is the only protagonist.
- For "one of N", use `radio-group`; for an instant setting, use `switch`.

---

Full index: https://cadence.dev/llms.txt
