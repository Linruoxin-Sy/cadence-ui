# Field

> Form controls that need a label, help text, and error.

- Registry item: https://cadence.dev/r/field.json
- Install: `npx shadcn@latest add @cadence/field`
- Type: registry:ui
- Since: 0.2.0


## Installation

**Command**

```install
npx shadcn@latest add @cadence/field
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — transitive registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — transitive registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — transitive registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — transitive registry dependency.
- [@cadence/label](https://cadence.dev/r/label.json) — direct registry dependency.
- [@cadence/separator](https://cadence.dev/r/separator.json) — direct registry dependency.

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
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-number | `@components/cadence/lib/number-plan.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/use-number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| label | `@components/cadence/label/index.tsx` | [JSON files[].content](https://cadence.dev/r/label.json) |
| label | `@components/cadence/lib/label-layout.ts` | [JSON files[].content](https://cadence.dev/r/label.json) |
| label | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/label.json) |
| separator | `@components/cadence/separator/index.tsx` | [JSON files[].content](https://cadence.dev/r/separator.json) |
| field | `@components/cadence/field/index.tsx` | [JSON files[].content](https://cadence.dev/r/field.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: label](https://cadence.dev/r/label.json)

[Source files: separator](https://cadence.dev/r/separator.json)

[Source files: field](https://cadence.dev/r/field.json)

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

Keep `field/index.tsx`, `label/index.tsx`, `separator/index.tsx` and `lib/cn.ts`
at the listed relative paths. Field imports Label and Separator even when you do
not render those parts; all three components share the `cn` helper. Field, Label
and Separator are static T0 components in full, reduced and none modes; no motion
runtime, provider or additional item-specific CSS is required beyond the base
theme and Tailwind utilities. Keep the source files' `"use client"` directives.
In Next.js App Router, a Server Component can render these client parts with
serializable props. Calling the exported `fieldVariants` function belongs in a
`"use client"` module; none of the examples below calls it.

Usage, Orientation, Responsive layout, “An error, from the caller”, “A set, a
legend, and a divider”, and the top preview use [Input](/components/input). Install it when
keeping those controls:

```install
npx shadcn@latest add @cadence/input
```

“An error, from the caller” also uses [Button](/components/button), and “A choice
card” uses [Checkbox](/components/checkbox). Install the items for those examples:

```install
npx shadcn@latest add @cadence/button @cadence/checkbox
```

For manual Input and Button installations, follow their Manual tabs and copy all
listed files while preserving the shared relative tree. Input adds
`input/index.tsx` and no packages beyond Field's dependency list. For Checkbox,
copy `checkbox/index.tsx` from its [registry JSON](https://cadence.dev/r/checkbox.json)
and the same `lib/` motion and provider files listed by Button; Checkbox does not
need `button/index.tsx`. Button adds `motion`, and Checkbox adds `motion` and
`lucide-react`. Wrapping the application in their provider is optional.
Button drops its press scale in reduced and none modes;
Checkbox keeps an opacity-only indicator in reduced and changes instantly in
none. Field stays static in all three modes.

Keep the documented example compositions and top preview's existing `"use client"`
boundaries. The error example needs a client boundary for its state and event
handler. A composition with stable caller-supplied IDs and serializable
props can instead render the client parts from a Server Component. The caller
owns input values, invalid-state decisions, messages, `data-invalid`,
`aria-invalid` and description IDs. Field only renders that supplied state; it
does not require a validation library.

## Usage

```tsx
"use client";

import { useId } from "react";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

export function CompanyField() {
  const id = useId();
  return (
    <Field className="w-full max-w-lg">
      <FieldLabel htmlFor={id}>Company</FieldLabel>
      <FieldContent>
        <Input id={id} placeholder="Cadence Labs" aria-describedby={`${id}-help`} />
        <FieldDescription id={`${id}-help`}>Appears on the invoice header.</FieldDescription>
      </FieldContent>
    </Field>
  );
}
```

## Orientation

Vertical stacks a label above its control. Horizontal keeps a compact control beside its label. These fixed instances do not change each other or the responsive example.

<ComponentExample name="orientation" />

```tsx
"use client";

import { useId } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

export function FieldOrientations() {
  const id = useId();
  return (
    <FieldGroup className="w-full max-w-lg">
      <Field orientation="vertical">
        <FieldLabel htmlFor={`${id}-company`}>Company</FieldLabel>
        <Input id={`${id}-company`} placeholder="Cadence Labs" />
      </Field>
      <Field orientation="horizontal">
        <FieldLabel htmlFor={`${id}-currency`}>Currency</FieldLabel>
        <Input id={`${id}-currency`} className="w-24" defaultValue="EUR" />
      </Field>
    </FieldGroup>
  );
}
```

## Responsive layout

`responsive` follows the width of its FieldGroup container, not the viewport. It stays vertical in a narrow panel and changes to a row at the `md` container threshold (28rem). Resize the page to see the wide group change while the narrow group remains vertical.

<ComponentExample name="responsive" />

```tsx
"use client";

import { useId } from "react";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

export function ResponsiveFields() {
  const id = useId();
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <FieldGroup aria-label="Available width">
        <Field orientation="responsive">
          <FieldLabel htmlFor={`${id}-wide`}>Company</FieldLabel>
          <FieldContent>
            <Input id={`${id}-wide`} placeholder="Cadence Labs" aria-describedby={`${id}-wide-help`} />
            <FieldDescription id={`${id}-wide-help`}>Uses the available group width.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
      <FieldGroup aria-label="Narrow panel" className="max-w-64">
        <Field orientation="responsive">
          <FieldLabel htmlFor={`${id}-narrow`}>Project</FieldLabel>
          <Input id={`${id}-narrow`} placeholder="Documentation" />
        </Field>
      </FieldGroup>
    </div>
  );
}
```

## An error, from the caller

The caller supplies `data-invalid`, `aria-invalid`, messages and description IDs; Field does no validation. This action simulates an application updating its supplied error without replacing the input or its draft. Duplicate messages collapse into one list entry; no messages means no error node.

<ComponentExample name="caller-error" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

export function CallerError() {
  const id = useId();
  const [invalid, setInvalid] = useState(true);
  return (
    <div className="grid w-full max-w-lg gap-4">
      <Field data-invalid={invalid}>
        <FieldLabel htmlFor={id}>VAT number</FieldLabel>
        <FieldContent>
          <Input
            id={id}
            defaultValue="NL0000"
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : `${id}-help`}
          />
          <FieldDescription id={`${id}-help`}>Use the number on your invoice.</FieldDescription>
          <FieldError
            id={`${id}-error`}
            errors={
              invalid
                ? [
                    { message: "That VAT number has the wrong number of digits." },
                    { message: "Include the country prefix." },
                    { message: "Include the country prefix." },
                  ]
                : []
            }
          />
        </FieldContent>
      </Field>
      <Button size="sm" variant="outline" className="justify-self-start" onClick={() => setInvalid((value) => !value)}>
        Toggle supplied error
      </Button>
    </div>
  );
}
```

## A set, a legend, and a divider

Use FieldSet and FieldLegend for related controls. The first legend uses the default heading size and the second uses `variant="label"`. FieldSeparator can show a centred word or a plain rule; it does not decide which input is required.

<ComponentExample name="fieldset" />

```tsx
"use client";

import { useId } from "react";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

export function BillingFields() {
  const id = useId();
  return (
    <FieldGroup className="w-full max-w-lg">
      <FieldSet>
        <FieldLegend>Billing details</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-company`}>Company</FieldLabel>
            <Input id={`${id}-company`} />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field>
            <FieldLabel htmlFor={`${id}-name`}>Individual name</FieldLabel>
            <Input id={`${id}-name`} />
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend variant="label">Invoice contact</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
            <Input id={`${id}-email`} type="email" />
          </Field>
        </FieldGroup>
      </FieldSet>
    </FieldGroup>
  );
}
```

## A choice card

A wrapping FieldLabel supplies the card border and a real label association. The checkbox owns checked state; FieldTitle and FieldDescription provide its name and description. Click the card or use Space on the checkbox. The composed Checkbox keeps its own motion contract and inherits the page setting.

<ComponentExample name="choice-card" />

```tsx
"use client";

import { useId } from "react";
import { Checkbox } from "@/components/cadence/checkbox";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/cadence/field";

export function ChoiceCard() {
  const id = useId();
  return (
    <FieldGroup className="w-full max-w-lg">
      <FieldLabel htmlFor={id}>
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Team plan</FieldTitle>
            <FieldDescription id={`${id}-help`}>Unlimited projects for your team.</FieldDescription>
          </FieldContent>
          <Checkbox id={id} name="team-plan" value="team" aria-describedby={`${id}-help`} defaultChecked />
        </Field>
      </FieldLabel>
    </FieldGroup>
  );
}
```

## When to use

- Any control that needs a visible label plus a line of help: text, select, checkbox
  group, radio group, a segmented choice.
- A form where the error has to sit next to the control it belongs to, not in a
  summary at the top.
- A choice card — a `Field` that contains a whole control card — where the label is
  the surface and the checked state is the selection.

## When not to use

- A single input with no label and no help. Do not wrap it; `input` already carries
  its own border and focus ring.
- A validation module. `Field` renders messages; it never produces them (P11).
- A toolbar of loose controls. Group those with `button-group`, which has no label
  semantics to offer.

## API

| Part               | Props                        | Notes                                                          |
| ------------------ | ---------------------------- | -------------------------------------------------------------- |
| `Field`            | `orientation`, native props  | `vertical \| horizontal \| responsive`; `role="group"`, `data-orientation`. |
| `FieldLabel`       | `Label` props                | A real `label`; click focuses the control.                      |
| `FieldTitle`       | native div props             | Label-weight text that is not tied to a control.                |
| `FieldDescription` | native props for `p`         | Muted help text, balanced in horizontal orientation.            |
| `FieldError`       | `errors`, native div props   | `errors`: `{ message?: string }[]`. `role="alert"`, `null` when empty. |
| `FieldGroup`       | native div props             | Container query root; vertical rhythm between fields.           |
| `FieldContent`     | native div props             | Control plus description/error stack.                           |
| `FieldSet`         | native props for `fieldset`  | Groups related fields; pairs with `FieldLegend`.                |
| `FieldLegend`      | `variant`                    | `legend \| label` sizes the legend text.                        |
| `FieldSeparator`   | `children`                   | Rule with optional centred text; exposes `data-content`.        |

`data-slot` values: `field`, `field-label`, `field-description`, `field-error`,
`field-group`, `field-content`, `field-set`, `field-legend`, `field-separator`,
`field-separator-content`.

## Motion contract

Authored intensity is **subtle**: Field declares no Cadence recipe; native content/layout and existing CSS state feedback remain unchanged.

No motion (T0). A field never animates — not on mount, not when the error appears.
The error is the one thing the user must read immediately; fading or sliding it in
delays the only information that matters, and it moves the control the user's cursor
is in.

| Phase   | Properties | Token | Interruptible |
| ------- | ---------- | ----- | ------------- |
| –       | none       | –     | –             |
| reduced | none       | –     | –             |
| none    | none       | –     | –             |

`data-[invalid=true]` recolours the field's text on the destructive token. That is a
colour change, not a motion, and it is never the only signal.

## Accessibility

- `FieldLabel` is a `label`, so clicking it focuses the control it names. Always pass
  `htmlFor` matching the control's `id`; a `FieldTitle` is not a substitute.
- An error is `role="alert"`: it is announced when it appears. Point the control at it
  with `aria-describedby` so the message is also part of the control's description.
- `aria-invalid` on the control is what makes the state machine-readable; the
  destructive colour is the sighted half of the same signal.
- A horizontal field puts the label after the content in source order when the content
  holds the control. Keep the DOM order label → control for a simple pair.

## Validation and data ownership

P11 draws the line: the component renders state, you decide state.

| `Field` does                                            | You do                                                    |
| ------------------------------------------------------- | --------------------------------------------------------- |
| Renders the message it is given (`children` or `errors`) | Deciding what is invalid (required, format, async checks)  |
| Marks the error `role="alert"`                           | Wiring `aria-invalid` and `aria-describedby` on the control |
| Colours the field when `data-invalid` / `aria-invalid`   | Form state, submit, retry, focus management                |
| Shows a description and an error at once                 | Writing the copy and the ids                               |

There is no `schema`, `resolver`, `validate`, or `rules` prop, and no validation
library is imported. `FieldError` accepts messages, not rules: the decision that a
value is wrong, and the copy that says so, stay in your form code.

## Responsiveness and performance

FieldGroup establishes a named container. Responsive orientation switches from column to row at its
md container query; explicit vertical and horizontal orientations remain caller-selected. Labels,
error text and controls must fit the available width.

T0 adds no authored animation runtime or interpolation. This wrapper renders HTML/CSS; interactive
children and application handlers still need their own client code. Composed controls retain their
own dependencies and motion contracts. Server-rendered markup does not imply that every interaction
works without JavaScript. The registry enforces a 4 KiB gzip budget for this item's own shipped
source; dependencies and application bundles are measured separately.

## Notes for AI

- Do not add an `error` prop to `Input`; put the message in `FieldError` and point
  `aria-describedby` at it.
- Use `FieldGroup` as the container, not a `space-y-*` div: the responsive
  orientation depends on being inside a container query root.
- `FieldError` returns `null` when it has no content, so it is safe to keep mounted.

---

Full index: https://cadence.dev/llms.txt
