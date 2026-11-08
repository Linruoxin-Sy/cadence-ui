# Radio Group

> Choosing one option from a small, fixed set.

- Registry item: https://cadence.dev/r/radio-group.json
- Install: `npx shadcn@latest add @cadence/radio-group`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/radio-group
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react
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
| radio-group | `@components/cadence/radio-group/index.tsx` | [JSON files[].content](https://cadence.dev/r/radio-group.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: radio-group](https://cadence.dev/r/radio-group.json)

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
utilities and provider payloads. Keep `radio-group/index.tsx` beside the shared
`lib/` directory with its relative imports and the sources' `"use client"`
directives intact. The dot uses `ControlSpan`, whose imports also reach
`native-div.tsx` and `press-button.tsx`; copying only `provider.tsx` is not enough.
The provider files and `motion` package are required even without an application
wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the copied
files. There is no additional Radio Group-specific CSS, icon package or external
asset. Only the dots animate: `state.morph` uses opacity and scale in
full, keeps opacity with immediate full size in reduced, and settles immediately
in none, including an initially selected item. Standalone groups follow the
system motion preference; the optional `CadenceProvider` controls a subtree's
mode and timing. A nested full scope still respects system reduced motion.

Usage, the top specimen and the labelled examples also need
[Label](/components/label). Controlled and Native form submission additionally
use [Button](/components/button). Install the items needed by your example:

```install
npx shadcn@latest add @cadence/label @cadence/button
```

For manual installation, follow their Manual tabs too: add `label/index.tsx`
and, when using Button, `button/index.tsx`. Their shared files are already in
Radio Group's target list. Label adds no npm package; Button also requires:

```package-manager
npm install class-variance-authority
```

Explicit motion scopes uses only Radio Group and the included provider. No
example needs another package or external asset. The site's preview shell is
not consumer setup.

In Next.js App Router, Controlled and Native form submission need a client
module for their state and event handlers. The other snippets can be composed
in a synchronous Server Component using the shown `useId` or stable unique IDs,
JSX and serializable props; their existing client directives may also be kept.
An event handler, a function-valued `render`, `className(state)` or `style(state)`,
or a client-side hook such as `useState` or `useRef` needs a caller client
boundary. Preserve the installed sources' client directives in either case.

Name each group with `aria-label` or `aria-labelledby`. Give every item a unique
`value` and a visible label linked by `htmlFor` and a unique `id`, or an
`aria-label`. With the default renderer, the item is a visible `span` with
`role="radio"` beside a hidden native radio input; the supplied item `id` belongs
to that input and Base UI connects the label to the visible control. Use
`defaultValue` for an uncontrolled initial selection, or own `value` with
`onValueChange` for a controlled group.

Tab enters at the selected item, or the first enabled item when none is selected.
Arrow keys move focus and selection, wrap, and skip disabled items; Space selects
the focused item. There is one tab stop per group. Group `disabled` disables all
items and removes them from the tab sequence. `readOnly` keeps the choices
focusable while preventing selection changes. Keep each default item in a flex
or grid layout, as the examples do; a horizontal layout changes the arrangement,
not the keyboard model.

For native submission, put `name` on the group and `value` on each item. Only the
selected, enabled input contributes the group's name/value entry; no selection
or a disabled selection contributes nothing. A read-only selected input retains
its submission value. `required` uses browser constraint validation to prevent
submission without a choice. The caller owns allowed values, controlled state,
error text, submission, server-side validation and persistence. Cadence renders
the supplied group error semantics; also pass `aria-invalid` to each item when
its ring should show the error. Selecting an option does not clear a caller's
error automatically.

## Usage

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function PlanChoices() {
  const id = useId();
  return (
    <RadioGroup defaultValue="team" aria-label="Plan" className="w-full max-w-xs gap-3">
      {["starter", "team", "scale"].map((plan) => (
        <div key={plan} className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-${plan}`} value={plan} />
          <Label htmlFor={`${id}-${plan}`}>{plan === "starter" ? "Starter" : plan === "team" ? "Team" : "Scale"}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}
```

Every item needs a `value`. The group is one form field: `name` goes on the
group, not on the items.

## Controlled

The caller owns the selected plan and status. Choose Team is an external update to this group only; choosing an item still uses the normal radio interaction.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function ControlledPlan() {
  const id = useId();
  const [plan, setPlan] = useState("team");
  return (
    <div className="grid gap-4">
      <RadioGroup value={plan} onValueChange={setPlan} aria-label="Controlled plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-team`} value="team" />
          <Label htmlFor={`${id}-team`}>Team</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-scale`} value="scale" />
          <Label htmlFor={`${id}-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Selected plan: {plan}
      </p>
      <Button variant="outline" size="sm" onClick={() => setPlan("team")}>
        Choose Team
      </Button>
    </div>
  );
}
```

## Invalid

Put the error semantics on the group and connect its message with `aria-describedby`. Each item also receives `aria-invalid` for its destructive ring; the source does not infer an item’s invalid styling from an ancestor. The caller clears the error when appropriate.

<ComponentExample name="invalid" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function InvalidPlan() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <RadioGroup aria-invalid="true" aria-describedby={`${id}-error`} aria-label="Required plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-team`} value="team" aria-invalid="true" />
          <Label htmlFor={`${id}-team`}>Team</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-scale`} value="scale" aria-invalid="true" />
          <Label htmlFor={`${id}-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <p id={`${id}-error`} className="text-sm text-destructive">
        Choose a plan to continue.
      </p>
    </div>
  );
}
```

## Disabled item

The unavailable option stays visible and announced. Arrow keys skip it while keeping one selected item and one tab stop. The disabled group marker dims only that item’s label.

<ComponentExample name="disabled" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function DisabledPlans() {
  const id = useId();
  return (
    <RadioGroup defaultValue="starter" aria-label="Available plans">
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-starter`} value="starter" />
        <Label htmlFor={`${id}-starter`}>Starter</Label>
      </div>
      <div className="group flex items-center gap-3" data-disabled="true">
        <RadioGroupItem id={`${id}-enterprise`} value="enterprise" disabled />
        <Label htmlFor={`${id}-enterprise`}>Enterprise (unavailable)</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-scale`} value="scale" />
        <Label htmlFor={`${id}-scale`}>Scale</Label>
      </div>
    </RadioGroup>
  );
}
```

## Disabled and read-only groups

Group `disabled` disables every item and removes the group from the tab sequence. `readOnly` retains focus and the current selection while preventing changes. These are two independent groups.

<ComponentExample name="locked" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function LockedPlans() {
  const id = useId();
  return (
    <div className="grid gap-6">
      <RadioGroup defaultValue="team" disabled aria-label="Disabled plan">
        <div className="group flex items-center gap-3" data-disabled="true">
          <RadioGroupItem id={`${id}-disabled-team`} value="team" />
          <Label htmlFor={`${id}-disabled-team`}>Team</Label>
        </div>
        <div className="group flex items-center gap-3" data-disabled="true">
          <RadioGroupItem id={`${id}-disabled-scale`} value="scale" />
          <Label htmlFor={`${id}-disabled-scale`}>Scale</Label>
        </div>
      </RadioGroup>
      <RadioGroup defaultValue="team" readOnly aria-label="Read-only plan">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-readonly-team`} value="team" />
          <Label htmlFor={`${id}-readonly-team`}>Team (read-only)</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-readonly-scale`} value="scale" />
          <Label htmlFor={`${id}-readonly-scale`}>Scale (read-only)</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

## Horizontal layout

The default layout is a vertical grid. Short labels can use a wrapping flex row; layout classes belong to the caller and do not change the radio keyboard model.

<ComponentExample name="horizontal" />

```tsx
"use client";

import { useId } from "react";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function HorizontalPlans() {
  const id = useId();
  return (
    <RadioGroup defaultValue="daily" aria-label="Digest frequency" className="flex flex-wrap gap-6">
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-daily`} value="daily" />
        <Label htmlFor={`${id}-daily`}>Daily</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id={`${id}-weekly`} value="weekly" />
        <Label htmlFor={`${id}-weekly`}>Weekly</Label>
      </div>
    </RadioGroup>
  );
}
```

## Native form submission

The group owns one form name and submits the selected value. Native `required` prevents submission until a choice is made. This local handler displays the entry; the application still validates and saves it on the server.

<ComponentExample name="form-submission" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Label } from "@/components/cadence/label";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function ShippingForm() {
  const id = useId();
  const [result, setResult] = useState("Not submitted");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setResult(`Shipping: ${new FormData(event.currentTarget).get("shipping")}`);
      }}
    >
      <RadioGroup name="shipping" required aria-label="Shipping method">
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-standard`} value="standard" />
          <Label htmlFor={`${id}-standard`}>Standard</Label>
        </div>
        <div className="flex items-center gap-3">
          <RadioGroupItem id={`${id}-express`} value="express" />
          <Label htmlFor={`${id}-express`}>Express</Label>
        </div>
      </RadioGroup>
      <Button type="submit" size="sm">
        Submit shipping
      </Button>
      <p role="status" className="text-sm text-muted-foreground">
        {result}
      </p>
    </form>
  );
}
```

## Explicit motion scopes

The selected dot on the left is explicitly `none` from its first render. The independent group on the right explicitly restores `full` inside that scope, subject to system reduced-motion preferences. Ordinary groups inherit the site header; these overrides are fixed for this comparison.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { RadioGroup, RadioGroupItem } from "@/components/cadence/radio-group";

export function StaticRadio() {
  return (
    <CadenceProvider mode="none">
      <div className="flex items-center gap-6">
        <div data-testid="initial-none">
          <RadioGroup defaultValue="static" aria-label="Static choice">
            <RadioGroupItem value="static" aria-label="Static radio" />
          </RadioGroup>
        </div>
        <CadenceProvider mode="full">
          <RadioGroup aria-label="Explicit full choice">
            <RadioGroupItem value="animated" aria-label="Explicit full radio" />
          </RadioGroup>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

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
| `className`     | `string` / state callback                                      | –       | Merged last; the default is `grid gap-3`.       |

### `RadioGroupItem`

| Prop        | Type      | Default | Description                              |
| ----------- | --------- | ------- | ---------------------------------------- |
| `value`     | `string`  | –       | Required. Identifies this option.        |
| `disabled`  | `boolean` | `false` | Keeps the option visible but unselectable.|
| `className` | `string` / state callback  | –       | Merged last.                             |

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
- `aria-invalid` on the group describes the whole choice; pass it to each item too when its ring should show the supplied error.

## Validation and data ownership

| The component does                                 | You do                                            |
| -------------------------------------------------- | ------------------------------------------------- |
| Forwards `aria-invalid` on the group and items   | Deciding that a choice is required                |
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
- Put `name` on the group. Describe the group error with `aria-invalid` and pass it to items too when their rings should show the error.
- Do not build a radio group out of buttons with `aria-pressed`; the radio role
  is what gives arrow-key navigation and form submission.

---

Full index: https://cadence.dev/llms.txt
