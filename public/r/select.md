# Select

> Choosing one value from a short list of options.

- Registry item: https://cadence.dev/r/select.json
- Install: `npx shadcn@latest add @cadence/select`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, geometry.resize, handoff, state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/select
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
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — direct registry dependency.

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
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| select | `@components/cadence/select/index.tsx` | [JSON files[].content](https://cadence.dev/r/select.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: select](https://cadence.dev/r/select.json)

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

Copy all nine files in the target list, including every shared `lib/` file.
Keep the mirrored `cadence/` tree, relative imports and `"use client"` directives
intact. The provider files and `motion` are required imports even though the
popup itself uses CSS transitions; wrapping your application in
`CadenceProvider` is optional.

Complete the base theme setup linked above, including Cadence's easing tokens,
and ensure Tailwind scans the copied files. These payloads contain no additional
Select-specific CSS or assets. Full mode animates the measured value-slot width,
the pointer label handoff, the check and the popup. Reduced makes width changes
instant, skips the handoff and removes scale while retaining opacity; none
removes authored transitions from the first frame. Standalone Select follows
the system motion preference; a nested full scope still respects system
reduced motion.

Usage, Sizes, Groups and labels, Disabled and invalid, Multiple values, Panel
placement and the top specimen need only this dependency graph. Controlled
value and Form submission additionally use [Button](/components/button):

```install
npx shadcn@latest add @cadence/button
```

For manual installation, follow Button's Manual tab too. Add
`button/index.tsx`, reuse the shared files listed here, and install its one
extra npm dependency:

```package-manager
npm install class-variance-authority
```

In Next.js App Router, Controlled value and Form submission need a client
module for their state and event handlers. Keep the original Usage composition
in a client module too: its automatic child-label lookup requires the client
`SelectItem` identity. For a Server Component composition of Usage, supply an
explicit `items` value-to-label map; without it, the trigger displays raw values
such as `next` and `remix`. The other shown examples already supply `items` and
can be composed in synchronous Server Components with their serializable JSX
and props; synchronous `useId` alone does not require a caller client boundary.
Existing client directives may be kept. A ref, event handler, function-valued
`SelectValue` children, `render`, `className(state)` or `style(state)` does need
that boundary. Preserve the installed sources' client directives. The site's
preview shell is not consumer setup; hydrated interactions require JavaScript.

`SelectContent` already includes its portal, positioner, popup, list and scroll
arrows. The default `alignItemWithTrigger={true}` overlays the selected item
on the trigger when space and the input method permit it; touch uses anchored
placement. Set it to false when requesting `side`, `align` or their offsets,
as Panel placement does. Base UI handles collision fallback, list scrolling,
keyboard navigation, focus return and dismissal. Name every trigger with a
visible associated label or `aria-label`.

The caller owns the option data and labels, controlled `value`/`onValueChange`
and `open`/`onOpenChange` when supplied, validation, error text, submission and
remote loading. `defaultValue` initializes an uncontrolled selection; use an
array with `multiple`. `items` maps values to display labels, as in the top
specimen and body examples. Without it, Cadence derives labels from directly
composed `SelectItem` children, including nested groups; it cannot inspect
items hidden inside a custom component wrapper. Supply `items` for those
wrappers, and provide explicit labels in `items` for object values. Object
values may also need Base UI's `itemToStringLabel`,
`itemToStringValue` and `isItemEqualToValue`; keep object identity stable or
provide a comparator. Function props require a client caller.

`name` enables native form submission through Base UI's visually hidden input;
multiple values produce repeated entries under that name. `required` uses
browser constraint validation, `disabled` prevents interaction and omits the
value from FormData, and `readOnly` prevents choosing a different value.
Pass `aria-invalid` and associated error text to the trigger for caller-owned
invalid state. The Form submission example reads FormData into local state;
it does not persist or send data. No validation or form-state package is needed.

## Usage

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cadence/select";

export function FrameworkSelect() {
  return (
    <Select defaultValue="next">
      <SelectTrigger className="w-48" aria-label="Framework">
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="next">Next.js</SelectItem>
        <SelectItem value="remix">Remix</SelectItem>
        <SelectItem value="astro">Astro</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

## Sizes

The default trigger is for forms; `size="sm"` fits dense rows. The empty control uses a placeholder without adding an empty option. Each select owns its value.

<ComponentExample name="sizes" />

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Sizes() {
  return <div className="flex flex-wrap items-center justify-center gap-3"><FrameworkSelect /><FrameworkSelect size="sm" /><FrameworkSelect empty /></div>;
}
```

## Groups and labels

`SelectGroup` and `SelectLabel` name related options; `SelectSeparator` separates groups. Orange is disabled while keyboard navigation can still reach Carrot.

<ComponentExample name="groups" />

```tsx
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/cadence/select";

export function Groups() {
  return (
    <Select items={[{ value: "apple", label: "Apple" }, { value: "orange", label: "Orange" }, { value: "carrot", label: "Carrot" }]} defaultValue="apple">
      <SelectTrigger aria-label="Produce"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="orange" disabled>Orange</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="carrot">Carrot</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
```

## Controlled value

The caller owns `value` and `onValueChange`. The external action chooses Astro in this example only; selections in other cards stay independent.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";
import { Button } from "@/components/cadence/button";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function Controlled() {
  const [value, setValue] = useState<string | null>("next");
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Select items={frameworks} value={value} onValueChange={setValue}>
          <SelectTrigger aria-label="Controlled framework"><SelectValue /></SelectTrigger>
          <SelectContent>{frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setValue("astro")}>Choose Astro externally</Button>
      </div>
      <output className="text-sm" aria-live="polite">Value: {value}</output>
    </div>
  );
}
```

## Form submission

`name` supplies the hidden input for FormData. `required` delegates empty-value checks to the browser; select a framework, then submit to read the caller-owned result.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";
import { Button } from "@/components/cadence/button";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function FormSubmission() {
  const [submitted, setSubmitted] = useState<string>();
  return (
    <form className="flex flex-wrap items-center gap-3" onSubmit={(event) => {
      event.preventDefault();
      setSubmitted(String(new FormData(event.currentTarget).get("framework")));
    }}>
      <Select items={frameworks} name="framework" required>
        <SelectTrigger aria-label="Framework to submit"><SelectValue placeholder="Choose a framework" /></SelectTrigger>
        <SelectContent>{frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
      </Select>
      <Button type="submit">Submit framework</Button>
      <output className="w-full text-sm" aria-live="polite">{submitted ? `Submitted: ${submitted}` : "No submission yet"}</output>
    </form>
  );
}
```

## Disabled and invalid

Disabled prevents selection. Invalid is a supplied visual and accessible state, with an independently identified error; the caller decides when to clear it.

<ComponentExample name="disabled-invalid" />

```tsx
"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

function FrameworkSelect({ size = "default", empty = false }: { size?: "default" | "sm"; empty?: boolean }) {
  return (
    <Select items={frameworks} defaultValue={empty ? undefined : "next"}>
      <SelectTrigger size={size} aria-label={empty ? "Framework, empty" : size === "sm" ? "Framework, small" : "Framework"}>
        <SelectValue placeholder="Choose a framework" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function DisabledInvalid() {
  const errorId = useId();
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Select items={frameworks} disabled defaultValue="next">
          <SelectTrigger aria-label="Framework, disabled"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="next">Next.js</SelectItem></SelectContent>
        </Select>
        <Select items={frameworks} defaultValue="astro">
          <SelectTrigger aria-label="Framework, invalid" aria-invalid="true" aria-describedby={errorId}><SelectValue /></SelectTrigger>
          <SelectContent>{frameworks.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <p id={errorId} className="text-sm text-destructive">This framework is unavailable for your project.</p>
    </div>
  );
}
```

## Multiple values

`multiple` keeps an array of values and leaves the list open while options are toggled. The trigger lists the selected labels; Escape closes the list and restores focus. Use Combobox for a searchable multi-select or chips.

<ComponentExample name="multiple" />

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

export function Multiple() {
  return (
    <Select items={frameworks} multiple defaultValue={["next", "astro"]}>
      <SelectTrigger aria-label="Multiple frameworks">
        <SelectValue placeholder="Choose frameworks" />
      </SelectTrigger>
      <SelectContent>
        {frameworks.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## Panel placement

The first row fixes the four sides; the second fixes start, center and end alignment. These examples disable `alignItemWithTrigger` so the popup uses the requested anchored placement instead of overlaying the selected item. Viewport collision handling may flip the effective side. Each trigger keeps its own value and associated label.

<ComponentExample name="placement" />

```tsx
"use client";

import { useId } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cadence/select";

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

export function Placement() {
  const id = useId();
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <div key={side} className="grid gap-2">
            <label htmlFor={`${id}-${side}`} className="text-xs capitalize">
              {side} panel
            </label>
            <Select items={frameworks} defaultValue="next">
              <SelectTrigger id={`${id}-${side}`} aria-label={`Framework, ${side} panel`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent side={side} alignItemWithTrigger={false}>
                {frameworks.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(["start", "center", "end"] as const).map((align) => (
          <div key={align} className="grid gap-2">
            <label htmlFor={`${id}-${align}`} className="text-xs capitalize">
              {align} alignment
            </label>
            <Select items={frameworks} defaultValue="next">
              <SelectTrigger id={`${id}-${align}`} aria-label={`Framework, ${align} alignment`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent align={align} alignItemWithTrigger={false}>
                {frameworks.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## When to use

- Choosing one value from a list that is too long for radios but too short to need search.
- A compact form control where the current value should stay visible in the trigger.
- A setting that changes the surface around it, so the value and its width should move together.

## When not to use

- Free-text or type-to-filter input. Use `combobox` once it ships, or an `input` with a datalist.
- Two or three mutually exclusive options that should stay visible. Use `radio-group`.
- Navigation between routes. Use a menu or links; a select submits a value, it does not navigate.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Select` | `value`, `defaultValue`, `onValueChange`, `disabled`, `required`, `name`, `multiple`, `items` | Base UI root; `items` lets `SelectValue` render labels from data. |
| `SelectTrigger` | `size` (`"sm" \| "default"`), native button props | Contains `SelectValue`; the chevron is rendered for you. |
| `SelectValue` | `placeholder` | The selected label, or the placeholder when empty. |
| `SelectContent` | `side`, `align`, `sideOffset`, `alignOffset`, `alignItemWithTrigger` | Portals, positions, and sizes to `--anchor-width`. |
| `SelectItem` | `value`, `disabled` | Renders the label and the check indicator. |
| `SelectGroup` / `SelectLabel` | group props | Purely structural. |
| `SelectSeparator` | separator props | A single hairline. |
| `SelectScrollUpButton` / `SelectScrollDownButton` | scroll-arrow props | Appear only when the list overflows. |

## Motion contract

Authored intensity is **expressive**: The selected label transfers between the popup and trigger while trigger geometry follows the owned label.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| pointer selection | value slot width | `geometry.resize/one-shot` | yes (physics-defined, clamped) |
| pointer selection | label `x`/`y` from the item to the trigger | `handoff/one-shot` | yes |
| pointer selection | check `scale` / `opacity` | `state.morph/one-shot` | yes |
| open / close | popup `opacity` / `scale` | `popup.anchored/css-transition` | yes |
| reduced | width jumps, no flight, no scale; opacity stays | – | – |
| none | every duration is zero | – | – |

The trigger keeps one native label laid out at its destination width. A pointer selection may
transfer a bounded plain ASCII label only when the previous and next labels share no character.
Labels with retained characters, shaping, rich content or an unavailable visible origin use the
current native value immediately. This conservative path does not implement changed-text diffing.
Keyboard selection has no captured pointer origin and remains immediate.

The flight uses a clipped, paint-only layer with no text node, DOM id, form control or second
component tree. It adds no scroll extent, scroll anchor or snap target. A moved destination,
differential scrolling, viewport correction or invalid placement cancels the flight and exposes the
already-current value; the layer never chases either endpoint. Native popup retirement may outlive
the captured source. Hiding the document, printing, reduced/none mode or a zero handoff clock also
settles the transfer. Restoration does not replay the consumed revision. Trigger reflow can therefore
omit the transfer while the separate legacy width animation continues.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. The site header changes the inherited motion mode on the same component tree, including each named example. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive. A cancelled selection
does not fly the pointer label over the current value. Natural text width is observed
separately from the animated outer slot, including content and viewport changes.

## Keyboard interactions

- `Enter` / `Space` / `ArrowDown` opens the list and focuses the selected item.
- `ArrowUp` / `ArrowDown` moves the highlight; `Home` / `End` jump to the ends.
- Typeahead letters move the highlight to the next matching label.
- `Enter` selects; `Escape` closes without changing the value.
- `Tab` closes the list and moves focus to the next control.

## Accessibility

- Base UI renders the trigger as a combobox and the list as a listbox, wired with
  `aria-expanded` and `aria-controls`; keyboard navigation moves focus to the options.
- Name the control with `aria-label` or a visible external label associated with the trigger; the value alone is not a name.
- The selected item keeps `aria-selected="true"`; the check is a visual duplicate, not the only signal.
- Under reduced motion the value still changes and the check still appears; nothing is conveyed by
  the flight alone.
- The handoff paint is inert and `aria-hidden`: screen readers hear the value once, from the trigger.

## Validation and data ownership

The caller owns selection values, validation, error text, submission and any remote
loading/filtering. Render supplied aria-invalid/data-invalid and associate described
errors; this component does not validate or install a form-state library.

## Responsive behavior

The popup is at least `--anchor-width` wide and caps at `--available-height`, so it flips and scrolls
inside the viewport. `alignItemWithTrigger` keeps the selected item over the trigger when space permits;
touch opening disables this alignment and uses anchored placement. The width animation is short and only touches the
trigger, so a select in a toolbar does not reflow the page beyond its own row.

## Performance

- One measured width animation and, on pointer selection, one absolutely positioned label for the
  duration of the handoff. No blur and no shadow animation.
- Width is a layout property; it is allowed only on this T3 component and only through
  `geometry.resize`, which jumps under reduced and none.
- The list renders every supplied item without virtualisation; the component adds no per-item animation beyond the check
  indicator.
- Budget: T3 (12 KB gzip). If a page animates several selects at once, only the open one moves.

## Notes for AI

- Prefer `SelectValue placeholder="…"` over an empty first item; an empty item is a selectable value.
- Keep item labels short and distinct; typeahead matches their text.
- Do not add a separate "selected" class to the trigger; the value already carries the state.
- For invalid state, pass `aria-invalid`; the trigger styles it from the attribute.

---

Full index: https://cadence.dev/llms.txt
