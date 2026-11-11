# Progress

> Uploads, imports, and other work with a measurable end.

- Registry item: https://cadence.dev/r/progress.json
- Install: `npx shadcn@latest add @cadence/progress`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/progress
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — transitive registry dependency.
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
| cadence-provider | `@components/cadence/lib/group-member.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| progress | `@components/cadence/progress/index.tsx` | [JSON files[].content](https://cadence.dev/r/progress.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: progress](https://cadence.dev/r/progress.json)

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

Copy all nine target files, keeping `progress/index.tsx` beside the shared
`lib/` directory, the relative imports intact and the sources' `"use client"`
directives. Progress imports `NativeControlDiv` from `control-animation.tsx`,
which also reaches `native-div.tsx` and `press-button.tsx`. Copy the complete
provider, motion and utilities payloads, even without a provider wrapper.
The provider files and `motion` package remain required imports.

Complete the base theme setup linked above and ensure Tailwind scans the copied
files. Progress needs no additional item-specific CSS, icon package or external
asset. Its full-width indicator uses `scaleX` for determinate updates through
`data.transition`; reduced and none jump to the new fraction. A null value
uses the theme's opacity-only `animate-pulse` in full and reduced, and
`animate-none` in none. Continuous loops follow the theme animation token,
not the provider speed. Standalone bars follow the system motion preference;
an optional `CadenceProvider` controls a subtree, and nested full still respects
system reduced motion.

Usage, the top specimen, Labelled, Indeterminate, Complete, Custom range,
Composed track and Explicit motion scopes use only Progress and its included
helpers. Caller-owned progress also needs [Button](/components/button):

```install
npx shadcn@latest add @cadence/button
```

For manual installation, follow Button's Manual tab and add `button/index.tsx`.
Its shared files and Base UI package are already included above; its additional
npm dependency is:

```package-manager
npm install class-variance-authority
```

No example needs another package or external asset. The site's preview shell
is not consumer setup.

In Next.js App Router, Usage, Labelled, Indeterminate, Complete, Composed track
and the top specimen can be composed in synchronous Server Components with
the shown serializable props. Custom range needs a caller client module for
its function-valued `getAriaValueText`. Caller-owned progress and Explicit
motion scopes need one for `useState` and slider change handlers; the former
also handles a button click. Synchronous `useId` alone does not require a
client boundary. Caller refs, event handlers, function-valued `render`,
`className(state)`, `style(state)` or `ProgressValue` children also need a
caller client boundary. Preserve the installed sources' client directives.

Supply a finite numeric `value` within a finite `min`/`max` range with
`max > min`, or explicitly pass `null` for indeterminate work. The default
range is zero to 100; there is no `defaultValue` or automatic progress source.
The fill fraction is `(value - min) / (max - min)`, clamped to zero through one.
At the maximum, Base UI exposes the complete state. `ProgressValue` displays
the normalized percentage by default, so three of five displays 60%; `format`
and `locale` configure number formatting. `getAriaValueText(formatted, raw)`
customizes the accessible value text without changing the fill or visible
value. For null, Base UI omits `aria-valuenow` and the default visible value
is empty; provide meaningful loading text separately.

`Progress` appends its own track and indicator after its children. Put
`ProgressLabel` and `ProgressValue` inside the root. Adding a `ProgressTrack`
with `ProgressIndicator` creates an additional track sharing the same fraction,
as Composed track shows; it does not replace the default. Keep the indicator's
full width and transform ownership when styling it. A custom indicator `render`
replaces the animation adapter, so the caller must preserve its motion contract.

The root owns `role="progressbar"` and its range/value ARIA attributes, not
the track. Give it an `aria-label` or `aria-labelledby`, or let the nested
`ProgressLabel` register its association after hydration. Use an explicit
root name when it must already be associated in server/no-JS markup.
`ProgressValue` is visible text with `aria-hidden`; the root supplies the
accessible value. The default bar has no tab stop, keyboard value editing,
hidden form input or submission value. Native props, refs and Base UI `render`
belong to their respective parts; retain the supplied props and ref when
replacing an element. Put cancellation or retry in separate controls.

The caller owns the real work, progress reports, range policy, loading/error
text, completion announcement, cancellation, retries and persistence. A value
of 100 in the default range only renders completion; it does not finish or
validate an upload, submit a form or announce a live status by itself.

## Usage

```tsx
import { Progress } from "@/components/cadence/progress";

export function Upload() {
  return <Progress value={40} aria-label="Uploading assets" />;
}
```

`value` is required and may be `null` for indeterminate work. `Progress` renders
its own track and indicator; `ProgressLabel` and `ProgressValue` go inside it as
children.

## Labelled, with the number

ProgressLabel supplies the accessible name and ProgressValue formats the same value as a percentage. The label and number remain readable above the default track. Pass format or locale to the root to configure number formatting.

<ComponentExample name="labelled" />

```tsx
import { Progress, ProgressLabel, ProgressValue } from "@/components/cadence/progress";

export function LabelledProgress() {
  return (
    <Progress value={62} className="max-w-sm">
      <div className="flex w-full items-center justify-between">
        <ProgressLabel>Uploading assets</ProgressLabel>
        <ProgressValue />
      </div>
    </Progress>
  );
}
```

## Indeterminate

A null value omits aria-valuenow and pulses the full track using opacity. This loop remains under reduced motion, stops under none and follows the theme animation token rather than the provider speed.

<ComponentExample name="indeterminate" />

```tsx
import { Progress, ProgressLabel } from "@/components/cadence/progress";

export function IndeterminateProgress() {
  return (
    <Progress value={null} aria-label="Preparing preview" className="max-w-sm">
      <ProgressLabel>Preparing preview</ProgressLabel>
    </Progress>
  );
}
```

## Complete

A fixed completed task shows 100% and a separate status message. The caller supplies the completion announcement; a filled progressbar alone is not a live notification.

<ComponentExample name="complete" />

```tsx
import { Progress, ProgressLabel, ProgressValue } from "@/components/cadence/progress";

export function CompleteProgress() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <Progress value={100}>
        <div className="flex w-full items-center justify-between">
          <ProgressLabel>Upload complete</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
      <p role="status" className="text-sm text-muted-foreground">
        All files uploaded.
      </p>
    </div>
  );
}
```

## Custom range

Three completed steps in a five-step range render a 60% fill. The caller provides a more specific accessible value text without changing the numeric fraction.

<ComponentExample name="range" />

```tsx
"use client";

import { Progress, ProgressValue } from "@/components/cadence/progress";

export function CustomProgressRange() {
  return (
    <Progress
      value={3}
      min={0}
      max={5}
      aria-label="Build steps"
      getAriaValueText={() => "Step 3 of 5"}
      className="max-w-sm"
    >
      <ProgressValue />
    </Progress>
  );
}
```

## Composed track

A custom track is added alongside the default track, matching the root composition. Both indicators read the same fraction. This example compares a six-pixel custom track with the default eight-pixel track; it does not replace the default.

<ComponentExample name="composed" />

```tsx
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/cadence/progress";

export function ComposedProgress() {
  return (
    <Progress value={72} aria-label="Storage" className="max-w-sm">
      <ProgressTrack className="h-1.5 bg-muted">
        <ProgressIndicator className="bg-foreground" />
      </ProgressTrack>
    </Progress>
  );
}
```

## Caller-owned progress

The slider represents external upload reports; Complete upload supplies a final value. The caller owns updates and completion text. No timer invents progress, and none of these updates changes another example.

<ComponentExample name="caller-progress" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/cadence/progress";

export function CallerProgress() {
  const id = useId();
  const [value, setValue] = useState(62);
  return (
    <div className="grid w-full max-w-sm gap-4">
      <label htmlFor={id} className="grid gap-2 text-sm">
        Upload progress
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </label>
      <Progress value={value} aria-label="Uploading assets">
        <div className="flex w-full items-center justify-between">
          <ProgressLabel>Uploading assets</ProgressLabel>
          <ProgressValue />
        </div>
      </Progress>
      <p role="status" className="text-sm text-muted-foreground">
        {value === 100 ? "Upload complete" : `Uploaded ${value}%`}
      </p>
      <Button variant="outline" size="sm" onClick={() => setValue(100)}>
        Complete upload
      </Button>
    </div>
  );
}
```

## Explicit motion scopes

The first indeterminate indicator is fixed to none from its first DOM appearance, with no opacity loop. The second bar explicitly requests full within that outer none scope; its external slider changes only that value, and system reduced motion still wins. Ordinary bars inherit the header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { useId, useState } from "react";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Progress } from "@/components/cadence/progress";

export function StaticProgress() {
  const id = useId();
  const [value, setValue] = useState(20);
  return (
    <CadenceProvider mode="none">
      <div className="grid w-full max-w-sm gap-4">
        <div data-testid="initial-none">
          <Progress value={null} aria-label="Static progress" />
        </div>
        <CadenceProvider mode="full">
          <div data-testid="explicit-full" className="grid gap-3">
            <label htmlFor={id} className="grid gap-2 text-sm">
              Explicit full progress
              <input
                id={id}
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
              />
            </label>
            <Progress value={value} aria-label="Explicit full progress" />
          </div>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- Work with a measurable end: an upload, an import, a multi-step build.
- Work long enough that the user would otherwise wonder whether anything is
  happening, and short enough that they will watch the bar.
- A determinate value next to other numbers, where the bar is a second reading of
  the same fact.

## When not to use

- Work of unknown duration. Pass `value={null}` for an indeterminate bar, or use
  `spinner` when there is no bar to fill.
- A page that is simply loading its own content; use `skeleton`.
- A value that is not progressing toward an end, like a score. Render the number.

## API

### `Progress`

| Prop              | Type                                  | Default | Description                                  |
| ----------------- | ------------------------------------- | ------- | -------------------------------------------- |
| `value`           | `number \| null`                      | –       | Required. `null` means indeterminate.        |
| `min`, `max`      | `number`                              | `0`, `100` | Range.                                    |
| `format`          | `Intl.NumberFormatOptions`            | –       | How `ProgressValue` formats the number.      |
| `getAriaValueText`| `(formatted: string, raw: number \| null) => string`              | –       | Human-readable value for assistive tech.     |
| `className`       | `string` / state callback                              | –       | Merged last; the default is a wrap layout.   |

### `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`

Plain wrappers over Base UI's parts; each forwards `className` and native props.
`ProgressIndicator` carries the motion.

## Motion contract

Authored intensity is **subtle**: A local progress fill follows the semantic value inside its fixed track.

Recipe: `data.transition/one-shot`, in both of its documented forms.

| Phase         | Properties                     | Token            | Interruptible |
| ------------- | ------------------------------ | ---------------- | ------------- |
| value change  | `scaleX old → new` (one-shot)  | `data.transition/one-shot`| yes           |
| indeterminate | `opacity` pulse (continuous)   | `data.transition/one-shot`| yes           |
| reduced       | value jumps; pulse kept, opacity only | `data.transition/one-shot` | yes     |
| none          | no transition, `animate-none`  | –                | –             |

The fill is a `scaleX` transform on an element that keeps the full track width, so
a value change never triggers layout. Under `reduced` the fill jumps to the new
value — position is information, the animation is not — while the indeterminate
pulse survives, because opacity-only loading feedback is what M5 keeps.

## Keyboard interactions

No keyboard interaction: the progress bar is not focusable. If the user can cancel
the work, put a `button` next to it.

## Accessibility

- Base UI puts `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, and
  `aria-valuenow` on the root; `value={null}` omits `aria-valuenow`.
- Give it a name with `aria-label`, or render `ProgressLabel` inside the root and
  let Base UI wire it.
- Announce completion outside the bar (text or `toast`); a full bar is not
  announced by a screen reader on its own.
- Never hide the percentage behind the animation: `ProgressValue` is the readable
  copy of the same fact.

## Responsive behavior

The bar fills its container and stays 8px tall at every breakpoint. When it sits in
a card header, keep the label and value on one line and let the bar take the next
line — the default `flex-wrap` layout does this without extra classes.

## Performance

One animated indicator per track. A determinate update uses a native transform animation; an indeterminate bar runs a CSS opacity loop. These do not animate layout, but whole-page frame performance still needs measurement. Avoid driving `value` from `requestAnimationFrame`
yourself; pass the real value and let the transition smooth it.

## Notes for AI

- `value` is required; pass `null` for indeterminate, never `undefined`.
- Use `scaleX`, not width. A width transition relayouts the track every frame.
- For work with no measurable end and no bar, use `spinner`, not a fake percentage.

---

Full index: https://cadence.dev/llms.txt
