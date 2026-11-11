# Toggle Group

> Text alignment, view density, and other mode sets.

- Registry item: https://cadence.dev/r/toggle-group.json
- Install: `npx shadcn@latest add @cadence/toggle-group`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: feedback.press, layout.shared, state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/toggle-group
```

Installing the group also installs `toggle`, because the items share its variant
classes.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — transitive registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — transitive registry dependency.
- [@cadence/toggle](https://cadence.dev/r/toggle.json) — direct registry dependency.

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
| cadence-geometry | `@components/cadence/lib/measured-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/size-linked-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-geometry | `@components/cadence/lib/sidebar-labels.ts` | [JSON files[].content](https://cadence.dev/r/cadence-geometry.json) |
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| toggle | `@components/cadence/toggle/index.tsx` | [JSON files[].content](https://cadence.dev/r/toggle.json) |
| toggle-group | `@components/cadence/toggle-group/index.tsx` | [JSON files[].content](https://cadence.dev/r/toggle-group.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: toggle](https://cadence.dev/r/toggle.json)

[Source files: toggle-group](https://cadence.dev/r/toggle-group.json)

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

Copy all ten target files, preserving the sibling `toggle/`, `toggle-group/`
and shared `lib/` directories, relative imports and `"use client"` directives.
The group imports Toggle's variant classes, and its default item renderer
reaches `press-button.tsx`, `control-animation.tsx` and `native-div.tsx`.
Copy every file in the listed payloads; the provider files and `motion` package
are required imports even without an application provider wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the copied
files. No additional item-specific CSS or external asset is required. In full,
`feedback.press` scales item content, `layout.shared` moves a decorative fill
within each single-selection group, and `state.morph` fades/scales local fills
in multiple selection. Reduced drops press scale and shared travel but keeps
local opacity feedback; none settles all three immediately. Standalone groups
follow the system motion preference. The optional `CadenceProvider` controls
mode and timing; a nested full scope still respects system reduced motion.

Usage, the top specimen, Multiple and Vertical use icons. They need this
example-only package; Toggle Group itself does not:

```package-manager
npm install lucide-react
```

Controlled also needs [Button](/components/button):

```install
npx shadcn@latest add @cadence/button
```

For manual installation, follow Button's Manual tab and add `button/index.tsx`.
Its npm dependencies and shared files are already in this installation graph.
The other examples need only Toggle Group and its included helpers. The site's
preview shell is not consumer setup.

In Next.js App Router, Segmented with a required selection and Controlled need
client modules for `useState`, change handlers and the external button's click
handler. Usage, Visual variants, Multiple, Spacing, Vertical, Sizes, Disabled
and Explicit motion scopes can be composed in synchronous Server Components
with the shown JSX and serializable props. Caller refs, event handlers,
function-valued `render`, `className(state)` or `style(state)`, and client hooks
such as `useState` or `useRef` need a caller client boundary. Keep the installed
sources' client directives.

Give each item a stable, nonempty `value`. The group owns pressed state through
an array: use `defaultValue` for uncontrolled initial values, or `value` with
`onValueChange` for controlled values. Single selection is the default and
allows an empty array when the selected item is pressed again; `multiple`
allows independent values. To require one selection, use the shown caller
policy that ignores empty requests. Group values take precedence over item
`pressed` / `defaultPressed`; `details.cancel()` in an item or group change
handler can veto a change.

The group renders `role="group"`, and items are native `type="button"` buttons
with `aria-pressed`. Name the group and every icon-only item. Tab enters the
enabled controls; horizontal arrows or vertical Up/Down move focus without
selecting, Home/End reach the ends, and Space/Enter toggle the focused item.
`loopFocus` defaults to true; false stops at either end. Disabled items are
skipped and cannot activate; disabling the group retains its values. For RTL
arrow navigation, use Base UI's `DirectionProvider` from
`@base-ui/react/direction-provider` with `direction="rtl"`, as well as RTL
document direction. Group size and variant are inherited by items; `spacing`
sets the gap, and zero joins adjacent pressed fills in multiple selection.
Nested groups have separate value, appearance and shared-fill scopes.

These buttons do not generate hidden inputs or submit the selected array
through `name` or item `value`, and do not expose a submit-button `type` or
`form` association. If a form needs these values, map caller-owned state to
explicit form fields and handle reset in the caller. The caller owns business
data, persistence, required-selection rules, validation, error text and any
`aria-invalid` / `aria-describedby` association.

Native animation and drag handlers, state-based classes/styles and refs pass
through the default renderer. A caller item `render` replaces its press
renderer while retaining the supplied decorative fill and content children;
spread the supplied props, including children, and preserve the ref and button
semantics. Keep `nativeButton` consistent with the rendered element.

## Usage

```tsx
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function Alignment() {
  return (
    <ToggleGroup variant="outline" defaultValue={["left"]} aria-label="Text alignment">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Visual variants

Default, outline and segmented are fixed, independent single-selection groups. Each starts on Week; clicking its selected item clears it.

<ComponentExample name="variants" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function GroupVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {(["default", "outline", "segmented"] as const).map((variant) => (
        <ToggleGroup key={variant} variant={variant} defaultValue={["week"]} aria-label={`${variant} range`}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
          <ToggleGroupItem value="month">Month</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
```

## Multiple

Multiple permits independent marks. Adjacent pressed fills join at zero spacing. Pressing Bold off does not change Italic.

<ComponentExample name="multiple" />

```tsx
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function MultipleGroup() {
  return (
    <ToggleGroup multiple defaultValue={["bold"]} aria-label="Text style">
      <ToggleGroupItem value="bold" aria-label="Bold">
        <BoldIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        <ItalicIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Underline">
        <UnderlineIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Segmented with a required selection

The caller ignores empty arrays to require one selection. The pill style alone does not require a value or select a newly focused item.

<ComponentExample name="segmented" />

```tsx
"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function SegmentedGroup() {
  const [range, setRange] = useState(["week"]);
  return (
    <ToggleGroup
      variant="segmented"
      value={range}
      onValueChange={(next) => {
        if (next.length) setRange(next);
      }}
      aria-label="Time range"
    >
      <ToggleGroupItem value="day">Day</ToggleGroupItem>
      <ToggleGroupItem value="week">Week</ToggleGroupItem>
      <ToggleGroupItem value="month">Month</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Spacing

Zero spacing joins adjacent pressed fills; one spacing step separates them. Both groups retain independent multiple selection and an outer strip.

<ComponentExample name="spacing" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function GroupSpacing() {
  return (
    <div className="flex flex-wrap gap-4">
      {[0, 1].map((spacing) => (
        <ToggleGroup
          key={spacing}
          variant="outline"
          multiple
          spacing={spacing}
          defaultValue={["bold", "italic"]}
          aria-label={`Spacing ${spacing}`}
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
```

## Vertical

A fixed vertical group lays out items in a column and uses Up/Down for roving focus. Focus alone does not change selection.

<ComponentExample name="vertical" />

```tsx
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function VerticalGroup() {
  return (
    <ToggleGroup orientation="vertical" variant="outline" defaultValue={["left"]} aria-label="Vertical alignment">
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRightIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
```

## Sizes

Small, default and large items are 32, 36 and 40px tall. These three horizontal groups use their own fixed size, inherited by each item.

<ComponentExample name="sizes" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function GroupSizes() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["sm", "default", "lg"] as const).map((size) => (
        <ToggleGroup key={size} size={size} variant="outline" defaultValue={["day"]} aria-label={`${size} size`}>
          <ToggleGroupItem value="day">Day</ToggleGroupItem>
          <ToggleGroupItem value="week">Week</ToggleGroupItem>
        </ToggleGroup>
      ))}
    </div>
  );
}
```

## Controlled

The value is always an array, including for a single-selection group. The external alignment button changes only this caller-owned value; choosing the selected item can clear it.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function ControlledGroup() {
  const [value, setValue] = useState(["center"]);
  return (
    <div className="grid justify-items-start gap-3">
      <ToggleGroup value={value} onValueChange={setValue} aria-label="Controlled alignment">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <p role="status" className="text-sm text-muted-foreground">
        Selection: {value[0] ?? "none"}
      </p>
      <Button variant="outline" size="sm" onClick={() => setValue(["left"])}>
        Align left externally
      </Button>
    </div>
  );
}
```

## Disabled

The first group skips a disabled middle item when moving focus and uses loopFocus={false} to stop at either end. The default is to wrap focus. The second disables the whole group and retains its selected Day.

<ComponentExample name="disabled" />

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function DisabledGroups() {
  return (
    <div className="flex flex-wrap gap-4">
      <ToggleGroup defaultValue={["day"]} loopFocus={false} aria-label="Disabled item" variant="outline">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week" disabled>
          Week
        </ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup disabled defaultValue={["day"]} aria-label="Disabled group" variant="outline">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
```

## Explicit motion scopes

The first group is fixed to none from its first DOM appearance. A second provider explicitly selects full inside that outer none scope; the system reduced-motion preference still wins. All ordinary groups inherit the site header.

<ComponentExample name="without-motion" />

```tsx
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/cadence/toggle-group";

export function StaticGroup() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <div data-testid="initial-none">
          <ToggleGroup value={["static"]} aria-label="Static group">
            <ToggleGroupItem value="static">On</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full">
            <ToggleGroup defaultValue={["first"]} aria-label="Explicit full toggle-group">
              <ToggleGroupItem value="first">First</ToggleGroupItem>
              <ToggleGroupItem value="second">Second</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A small set of modes that belong to one control: text alignment, view density,
  a time range.
- A formatting toolbar where several marks can be active at once
  (`multiple`).
- Icon toolbars with a shared tinted fill (`default` or `outline`), or short text
  choices on a pill-shaped track (`segmented`).

## When not to use

- Exactly one option with a text label and a longer list; use `radio-group`, which
  exposes radio semantics rather than a row of toggle buttons.
- A single independent on/off command; use `toggle`.
- Navigation between pages; use `tabs`, which owns `role="tablist"`.

## API

### `ToggleGroup`

| Prop            | Type                                        | Default        | Description                              |
| --------------- | ------------------------------------------- | -------------- | ---------------------------------------- |
| `value`         | `readonly string[]`                         | –              | Controlled pressed values.               |
| `defaultValue`  | `readonly string[]`                         | `[]`           | Uncontrolled initial values.             |
| `onValueChange` | `(value: string[], details) => void`        | –              | Fired when any item changes.             |
| `disabled`      | `boolean` | `false` | Disables every item. |
| `loopFocus`     | `boolean` | `true` | Wrap arrow focus at either end. |
| `multiple`      | `boolean`                                   | `false`        | Allow more than one pressed item.        |
| `spacing`       | `number`                                    | `0`            | Gap in Tailwind spacing steps.           |
| `orientation`   | `"horizontal" \| "vertical"`                | `"horizontal"` | Axis, also drives arrow keys.            |
| `variant`       | `"default" \| "outline" \| "segmented"`     | `"default"`    | Shared strip, bordered strip, or pill track. |
| `size`          | `"sm" \| "default" \| "lg"`                 | `"default"`    | Inherited by every item.                 |

### `ToggleGroupItem`

| Prop        | Type     | Default | Description                          |
| ----------- | -------- | ------- | ------------------------------------ |
| `value`     | `string` | –       | Required. Identifies the item.       |
| `disabled`  | `boolean`| `false` | Keeps it visible but unpressable.    |
| `className` | `string` / state callback | –       | Merged last.                         |

The default press button preserves native React `onAnimationStart`, `onDrag`,
`onDragStart` and `onDragEnd` events, including capture and cancellation. Callback
and object refs follow the same button; replacing a callback runs its React 19
cleanup before assigning the next ref. A caller `render` replaces the default
renderer and owns spreading its supplied props.

## Motion contract

Authored intensity is **medium**: A shared selected highlight moves among stable controls, alongside local press and glyph feedback.

Single selection uses one shared decorative fill scoped to each group. Multiple
selection keeps one local fill per item. Neither changes the buttons' layout
boxes; corner changes that join neighboring fills are immediate state styling.

| Phase   | Properties       | Token            | Interruptible |
| ------- | ---------------- | ---------------- | ------------- |
| press   | `scale 1 → 0.97` | `feedback.press/one-shot` | yes           |
| release | `scale 0.97 → 1` | `feedback.press/one-shot` | yes           |
| single selection | fill transform between items | `layout.shared/one-shot` | yes |
| multiple selection | fill opacity and `scale 0.96 → 1` | `state.morph/one-shot` | yes |
| reduced | shared fill jumps; local fills fade; no press scale | – | – |
| none | immediate selection, opacity and press state; zero duration | – | – |

Press scale applies only to the content, keeping the button and decorative fill
in the group's common stacking context. A travelling fill stays below all labels
and icons, including the items it crosses and the focused destination.

Full mode uses the velocity-preserving shared spring. Reduced, none and a zero
recipe clock render a static single-selection fill, cancelling an in-flight
projection without replacing the focused button. Local fills keep opacity under
reduced and settle immediately under none. All animated parts expose
`data-motion`; every duration, scale and spring comes from Cadence tokens.

## Keyboard interactions

| Keys               | Action                                        |
| ------------------ | --------------------------------------------- |
| `Tab`              | Enters the group at the last pressed item.    |
| `Arrow Right/Down` | Moves focus to the next item.                 |
| `Arrow Left/Up`    | Moves focus to the previous item.             |
| `Space` / `Enter`  | Presses the focused item.                     |

With `loopFocus` (default) the arrows wrap around at the ends.

## Accessibility

- The group renders `role="group"`; each item is a `<button>` with `aria-pressed`.
- Name the group with `aria-label` or `aria-labelledby` — a row of icon buttons
  with no group name is announced as unrelated buttons.
- Icon-only items need their own `aria-label`; the group name does not describe
  them.
- Do not use a toggle group where `role="tablist"` is correct; tabs imply a panel
  that is shown, a toggle group implies state.
- Selection fills are decorative (`aria-hidden`) and never receive focus.

## Validation and data ownership

| The component does                              | You do                                    |
| ----------------------------------------------- | ----------------------------------------- |
| Forwards `disabled` and the pressed values      | Deciding whether a selection is required  |
| Renders the visual pressed state                | Persisting the choice                     |
| Exposes `aria-invalid` styling on items         | Validation and error text                 |

[Field](/components/field) shows how the invalid state and its message are wired.

## Responsive behavior

Horizontal groups do not wrap; with more than about five items on a narrow screen,
switch to `orientation="vertical"` or replace the group with a `select`.

## Performance

One shared layout identity per single-selection group; Motion measures the fill
when selection changes. Multiple selection uses one local opacity/scale fill per
item. Press feedback stays on demand. No observers, timers or render-time layout
reads; use small option sets rather than long lists.

## Notes for AI

- `value` is an array in every mode, with or without `multiple`.
- Use `variant="segmented"` for a pill-shaped control; no separate component is needed.
- Use `multiple` for independent pressed fills; `spacing={0}` joins neighbors.
- To require a selection, control the value and ignore empty change requests.
- For "one of N" with text labels, prefer `radio-group`; for panels, `tabs`.

---

Full index: https://cadence.dev/llms.txt
