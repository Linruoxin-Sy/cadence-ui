# Scroll Area

> Constrained lists and wide content with native scrolling and custom scrollbars.

- Registry item: https://cadence.dev/r/scroll-area.json
- Install: `npx shadcn@latest add @cadence/scroll-area`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: data.transition, state.color, text.change, number.roll

## Installation

**Command**

```install
npx shadcn@latest add @cadence/scroll-area
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
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.

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
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-number | `@components/cadence/lib/number-plan.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/use-number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| scroll-area | `@components/cadence/scroll-area/index.tsx` | [JSON files[].content](https://cadence.dev/r/scroll-area.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: scroll-area](https://cadence.dev/r/scroll-area.json)

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

Copy the component and the shared Cadence files the CLI lists into the same
`cadence/` tree so the relative imports resolve. Preserve the component's `"use client"` directive.
Complete the base theme setup linked above and ensure Tailwind scans the copied
files. The shared motion runtime, provider and text/number helpers are part of the
item's installation graph; `CadenceProvider` is optional because the runtime falls
back to the system preference.

Usage, Vertical scrolling, Horizontal scrolling, Both axes and Without overflow
use serializable props and children and can be composed in a Server Component.
Caller rendering and sizing needs a client caller for its ref, handler and
state callbacks. Changing content needs one for state and handlers. Right-to-left
content also needs a client caller as written because its track uses function
`className` and `style` props. Refs, events and other function-valued
render/state props require a client caller. Custom render components must forward
props, children and ref. The top preview needs no extra dependencies.

Install [Button](/components/button) separately for Caller rendering and sizing
and Changing content. Without the CLI, follow Button's Manual instructions to
copy all its target files and install its complete recursive dependencies.
These example-only files and dependencies are separate from Scroll Area's
two-file installation graph. The CLI is an optional shortcut:

```install
npx shadcn@latest add @cadence/button
```

The RTL example imports DirectionProvider from the already-installed
`@base-ui/react/direction-provider`; it adds no npm dependency. Use both that
provider and native `dir="rtl"` for matching content direction and thumb geometry.

Constrain the root height for vertical overflow and the parent width for wide
content; grid/flex parents may need `min-w-0`. Put content padding on a child,
reserving room for the overlaid tracks. The root creates the viewport, default
vertical track and corner; add `ScrollBar orientation="horizontal"` inside it
for horizontal content. Additional tracks are rendered inside the viewport.
There is no exported Content part or viewport prop/ref API. Root props, classes,
styles and ref address the outer element; ScrollBar props address the track,
whose thumb is internal. Query the viewport slot from the root ref when the
application needs imperative scrolling.

Supply accessible names, content semantics, stable keys and individually labelled
controls. The overflowing viewport uses native Tab, arrows, Page Up/Down and
Home/End; tracks and thumbs provide pointer control. `keepMounted` retains a
track without creating overflow. `overflowEdgeThreshold` only delays edge state
attributes. Neither option hides or removes content.

SSR includes the actual content and bounded overflow viewport, so native scrolling
remains available without JavaScript. Custom track measurement, pointer dragging
and caller update buttons require hydration. Base UI refreshes geometry on native
scrolling and viewport resize; content-only growth can leave the thumb stale until
one of those occurs because this wrapper has no Content part. The caller owns
entries, dimensions, scrolling to new data, pagination and virtualization.

Scroll Area keeps native scrolling in full, reduced and none. Native thumb positioning stays
functional and no smoothing, automatic scrolling or resize interpolation is added. Authored motion is
limited to the track the primitive inserts when overflow appears, scoped thumb/focus colour and bounded
direct display content. Native wheel, touch momentum and keyboard scrolling follow the
browser/platform policy. Application-added smooth scrolling or animation remains caller-owned; the
optional Button composition retains Button's separate motion contract.

## Usage

```tsx
import { ScrollArea } from "@/components/cadence/scroll-area";

export function VerticalExample() {
  return (
    <ScrollArea aria-label="Release notes" className="h-48 w-full rounded-md border">
      <ul className="flex flex-col gap-3 p-4 pr-6 text-sm">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i.toString()}>Release {20 - i}: improved keyboard navigation and component parity.</li>
        ))}
      </ul>
    </ScrollArea>
  );
}
```

## Vertical scrolling

Constrain the root height and keep padding on a content child. The viewport owns native scrolling; the default vertical track appears only when content overflows. Focus the viewport and use arrows or Page Down, or scroll with a wheel or touch.

<ComponentExample name="vertical" />

```tsx
import { ScrollArea } from "@/components/cadence/scroll-area";

export function VerticalExample() {
  return (
    <ScrollArea aria-label="Release notes" className="h-48 w-full rounded-md border">
      <ul className="flex flex-col gap-3 p-4 pr-6 text-sm">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i.toString()}>Release {20 - i}: improved keyboard navigation and component parity.</li>
        ))}
      </ul>
    </ScrollArea>
  );
}
```

## Horizontal scrolling

Add a horizontal ScrollBar and give the content a width larger than its viewport. The root stays within its parent; the timeline scrolls locally without widening the page. All six phases remain in the DOM.

<ComponentExample name="horizontal" />

```tsx
import { ScrollArea, ScrollBar } from "@/components/cadence/scroll-area";

export function HorizontalExample() {
  return (
    <ScrollArea aria-label="Project timeline" className="w-full rounded-md border">
      <ol className="flex w-max gap-4 p-4 pb-6">
        {["Research", "Design", "Build", "Review", "Ship", "Learn"].map((phase) => (
          <li key={phase} className="flex h-24 w-40 items-center justify-center rounded-md bg-muted text-sm">
            {phase}
          </li>
        ))}
      </ol>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
```

## Both axes

A bounded height and wide content create two independent native scroll ranges. The default vertical track and explicit horizontal track follow the same viewport. Reserve content space for both overlaid tracks.

<ComponentExample name="both-axes" />

```tsx
import { ScrollArea, ScrollBar } from "@/components/cadence/scroll-area";

export function BothAxesExample() {
  return (
    <ScrollArea aria-label="Delivery log" className="h-48 w-full rounded-md border">
      <ol className="flex w-[48rem] flex-col gap-3 p-4 pr-6 pb-6 text-sm">
        {Array.from({ length: 20 }, (_, i) => (
          <li key={i.toString()} className="flex justify-between gap-8">
            <span>Delivery {i + 1}: workspace components and documentation</span>
            <span className="shrink-0">Completed</span>
          </li>
        ))}
      </ol>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
```

## Without overflow

These short panels have no scroll range. The default track is absent. keepMounted retains the second panel's horizontal track in the DOM even without overflow; it does not create a scroll range or force a useful thumb. Content remains readable.

<ComponentExample name="without-overflow" />

```tsx
import { ScrollArea, ScrollBar } from "@/components/cadence/scroll-area";

export function WithoutOverflowExample() {
  return (
    <div className="grid gap-4">
      <ScrollArea aria-label="Short note" className="h-32 w-full rounded-md border">
        <p className="p-4 text-sm">All changes saved.</p>
      </ScrollArea>
      <ScrollArea aria-label="Reserved track" className="h-32 w-full rounded-md border">
        <p className="p-4 text-sm">A mounted horizontal track has no scroll range.</p>
        <ScrollBar keepMounted orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
```

## Caller rendering and sizing

The custom section explicitly uses `role="region"` with an accessible name instead of inheriting the primitive's presentation role. Root props, ref, classes and styles belong to the outer section, while children render inside its native viewport. State callbacks retain a fixed height and change only the overflow border. overflowEdgeThreshold delays edge attributes by 16px; it changes neither scroll range nor content visibility. The application-owned action queries the viewport slot from its root ref and scrolls instantly. There is no invented viewport prop. Install Button separately for this composition. Custom render components must forward props, children and ref.

<ComponentExample name="caller-rendering" />

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/cadence/button";
import { ScrollArea } from "@/components/cadence/scroll-area";

export function CallerRenderingExample() {
  const rootRef = useRef<HTMLDivElement>(null);
  function returnToTop() {
    rootRef.current
      ?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
      ?.scrollTo({ top: 0, behavior: "instant" });
  }
  return (
    <div className="grid gap-4">
      <Button variant="outline" onClick={returnToTop}>
        Return activity to top
      </Button>
      <ScrollArea
        ref={rootRef}
        render={<section />}
        role="region"
        aria-label="Workspace activity"
        overflowEdgeThreshold={{ yStart: 16, yEnd: 16 }}
        className={(state) =>
          state.hasOverflowY ? "h-48 w-full rounded-md border border-primary" : "h-48 w-full rounded-md border"
        }
        style={() => ({ maxWidth: "100%" })}
      >
        <ol className="flex flex-col gap-3 p-4 pr-6 text-sm">
          {Array.from({ length: 20 }, (_, i) => (
            <li key={i.toString()}>
              <a href="/docs/changelog" className="underline underline-offset-4">
                Activity {i + 1}: read the changelog
              </a>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  );
}
```

## Right-to-left content

Use native dir for content and Base UI DirectionProvider for the primitive's thumb geometry. At the inline start, the first Arabic phase appears on the right; scrolling reveals the remaining phases without reversing the data array. The custom horizontal track also demonstrates render, callback className and style on the track, rather than on the root or internal thumb.

<ComponentExample name="rtl" />

```tsx
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ScrollArea, ScrollBar } from "@/components/cadence/scroll-area";

export function RtlExample() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <ScrollArea aria-label="مراحل المشروع" className="w-full rounded-md border">
          <ol className="flex w-max gap-4 p-4 pb-6" lang="ar">
            {["البحث", "التصميم", "البناء", "المراجعة", "النشر", "التعلم"].map((phase) => (
              <li key={phase} className="flex h-24 w-40 items-center justify-center rounded-md bg-muted text-sm">
                {phase}
              </li>
            ))}
          </ol>
          <ScrollBar
            orientation="horizontal"
            render={<div title="Project phases track" />}
            className={() => "h-3"}
            style={() => ({ padding: 2 })}
          />
        </ScrollArea>
      </div>
    </DirectionProvider>
  );
}
```

## Changing content

The caller owns entries and panel dimensions. These two actions change actual data and root height independently; the viewport and draft input keep their identities. This pinned wrapper has no Content part: content-only growth can leave thumb geometry stale until a native scroll or viewport resize. Scroll after changing the count, or resize the panel, to refresh it. It does not automatically follow new entries or virtualize them. Install Button separately for this composition.

<ComponentExample name="changing-content" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ScrollArea } from "@/components/cadence/scroll-area";

export function ChangingContentExample() {
  const [expanded, setExpanded] = useState(false);
  const [tall, setTall] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setExpanded((value) => !value)}>
          Change activity count
        </Button>
        <Button variant="outline" onClick={() => setTall((value) => !value)}>
          Resize activity panel
        </Button>
      </div>
      <p role="status">
        {expanded ? 40 : 20} entries · {tall ? "Tall" : "Compact"} panel
      </p>
      <ScrollArea
        aria-label="Updating activity"
        className={tall ? "h-72 w-full rounded-md border" : "h-48 w-full rounded-md border"}
      >
        <div className="flex flex-col gap-3 p-4 pr-6 text-sm">
          <input
            aria-label="Activity draft"
            defaultValue="Keep this draft"
            className="w-full min-w-0 rounded-md border p-2 focus-visible:outline-2 focus-visible:outline-ring"
          />
          <ol className="flex flex-col gap-3">
            {Array.from({ length: expanded ? 40 : 20 }, (_, i) => (
              <li key={i.toString()}>Activity {i + 1}: documentation updated.</li>
            ))}
          </ol>
        </div>
      </ScrollArea>
    </div>
  );
}
```

## Nested areas and direct display content

A ScrollArea nests inside another ScrollArea's content: each keeps its own native
viewport, tracks and mode, and pointer or wheel input resolves against the area the
pointer is over. The nested lanes also pass one direct number child and one direct
string child of their viewport, so `scroll-area-number` and `scroll-area-text` update
that display in place while the surrounding board stays untouched. Rich children keep
their own trees; each lane owns one direct plain string or numeric child, not a mixed
array.

<ComponentExample name="nested-display" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ScrollArea } from "@/components/cadence/scroll-area";

export function NestedDisplayExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="grid gap-3">
      <Button variant="outline" onClick={() => setExpanded((value) => !value)}>
        Change task totals
      </Button>
      <ScrollArea aria-label="Task board" className="h-64 w-full rounded-md border">
        <div className="grid gap-3 p-4 text-sm">
          <p>Outer board scrolls the two nested lanes below.</p>
          <ScrollArea aria-label="Task count" className="h-20 rounded-md border">
            {expanded ? 30 : 12}
          </ScrollArea>
          <ScrollArea aria-label="Task label" className="h-20 rounded-md border">
            {expanded ? "Archive tasks are visible." : "Inbox tasks are visible."}
          </ScrollArea>
          <ol className="flex flex-col gap-1">
            {Array.from({ length: 20 }, (_, i) => (
              <li key={i.toString()}>Board row {i + 1}: review the component notes.</li>
            ))}
          </ol>
        </div>
      </ScrollArea>
    </div>
  );
}
```

## When to use

- Long activity feeds constrained by a panel height.
- Horizontal timelines or collections wider than their available space.
- Bounded lists that need custom scrollbars while retaining native scrolling.

## When not to use

- For ordinary page content: allow the document to scroll.
- For paged slides: use Carousel.
- For reading progress or smooth scrolling effects: this component adds neither.

## API

| Export | Props and defaults |
| --- | --- |
| `ScrollArea` | Base UI `ScrollArea.Root.Props`; no additional defaults. |
| `ScrollBar` | Base UI `ScrollArea.Scrollbar.Props`; `orientation="vertical"`, `keepMounted=false`. |

Both exports forward native events, ARIA, style, ref and Base UI `render`.
Classes merge last, including state callback classes. Root also forwards
`overflowEdgeThreshold` (Base UI default zero). Scrollbar props target the track;
the thumb is created internally. Root creates the viewport, default vertical track
and corner. ScrollArea's `children` render inside the viewport, including any
additional horizontal track, matching the pinned upstream composition.

Slots: `scroll-area`, `scroll-area-viewport`, `scroll-area-scrollbar`,
`scroll-area-thumb`, plus `scroll-area-text` and `scroll-area-number` around a
direct plain string or numeric child. The scrollbar includes `data-orientation`.
Root classes, padding, borders and styles remain on the root; content padding
belongs on a child. Root ref does not address the viewport. No viewport prop or
ref API is invented; query its slot from the root for application-owned imperative scrolling.

## Motion contract

Authored intensity is **subtle**: Track opacity, scoped thumb and focus colour, changed text and compact quantity reels stay local while native scrolling, thumb geometry and content layout remain the direct owner.

| Recipe | Owner and full behaviour | reduced | none |
| --- | --- | --- | --- |
| `data.transition/one-shot` | The track the primitive inserts when overflow appears fades in from its current paint. Removal is the primitive's own unmount, not a retained exit. | Short opacity. | Immediate visibility. |
| `state.color/css-transition` | The thumb's declared background and the viewport's declared foreground/focus paint, `duration.fast`/`ease.out`; focus within the viewport settles the whole paint immediately. | Short colour; focus-gated paint immediate. | Zero duration and delay. |
| `text.change/changed-runs` | Changed runs of a direct plain string child only; unchanged graphemes keep their identity and rich children keep their tree. | Changed-text opacity only. | Exact text immediately. |
| `number.roll/reels` | Changed places of a direct numeric child, compact reels; scroll offsets, extents and identifiers are never counters. | Exact value immediately. | Exact value immediately. |

Thumb translation, scroll extent, corner geometry and content layout stay native in every mode: the
primitive positions the thumb from actual scroll geometry and the browser owns momentum and snapping.
A live downgrade cancels the reel clock and keeps only short opacity and colour; none or a zero recipe
clock settles every authored writer without disabling direct scrolling.

Upstream focus-ring and colour feedback are now issued through the shared colour owner. Native wheel,
touch momentum and keyboard scrolling follow browser/platform preferences. Caller-added smooth
scrolling and CSS animation are application-owned.

## Accessibility

- Base UI supplies a focusable viewport when overflow exists with a visible keyboard focus ring.
  Tab enters the viewport and its interactive descendants; arrows, Page Up/Down,
  Home/End retain native browser scrolling. No custom keyboard model is added.
- Give the root a meaningful accessible name, as in Usage. Keep list or document
  semantics in the content and label interactive controls individually.
- Tracks and thumbs are pointer controls; keyboard users scroll the native viewport.
- Constrain height for vertical overflow and width for horizontal overflow. The
  viewport retains all content on narrow screens; size a grid parent with `min-w-0`.
- Base UI updates geometry on native scrolling and viewport resize. The pinned
  wrapper has no Content part: content-only growth may leave the thumb stale until
  a scroll or viewport resize occurs. Cadence preserves that upstream behaviour. It adds no
  measurement loop, data processing or virtualization. Paginate or virtualize large
  datasets in the application.

## Responsiveness and performance

Give the root explicit dimensions so its viewport can scroll; horizontal scrolling needs the
corresponding ScrollBar. Parent grids may need min-w-0. Base UI manages custom scrollbar interaction
while content uses native scrolling; it does not virtualize children.

The authored moving set is the existing track paint plus bounded changed direct content: one opacity
owner per track, one scoped colour owner per thumb and viewport, and one display controller per direct
plain child. No per-child measurement, per-line observer or second scroll loop is added. Base UI
behavior requires hydration; native HTML behavior remains browser-owned. The server renders the real
content and bounded overflow viewport, so native scrolling remains available without JavaScript.
Custom track measurement, pointer dragging and caller-owned update buttons require hydration. The
registry reports this item's own shipped source against its recorded tier reference; dependencies and
application bundles are measured separately.

## Notes for AI

- Preserve root/viewport ownership, native scrolling and Base UI render/ref support.
- Add ScrollBar with horizontal orientation for wide content; its default stays vertical.
- Keep the track fade tied to the primitive's own insertion; never add a second scroll controller,
  smooth scrolling or an animated thumb extent.

---

Full index: https://cadence.dev/llms.txt
