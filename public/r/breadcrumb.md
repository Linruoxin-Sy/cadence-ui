# Breadcrumb

> Hierarchy navigation, from the root to the current page.

- Registry item: https://cadence.dev/r/breadcrumb.json
- Install: `npx shadcn@latest add @cadence/breadcrumb`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, exit.fade, layout.move, geometry.resize, state.color, text.change

## Installation

**Command**

```install
npx shadcn@latest add @cadence/breadcrumb
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.

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
| cadence-handoff | `@components/cadence/lib/captured-handoff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-handoff.json) |
| cadence-text | `@components/cadence/lib/text-diff.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-layout.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| cadence-text | `@components/cadence/lib/use-text-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-text.json) |
| breadcrumb | `@components/cadence/breadcrumb/index.tsx` | [JSON files[].content](https://cadence.dev/r/breadcrumb.json) |
| breadcrumb | `@components/cadence/lib/breadcrumb-layout.ts` | [JSON files[].content](https://cadence.dev/r/breadcrumb.json) |
| breadcrumb | `@components/cadence/lib/button-group-layout.ts` | [JSON files[].content](https://cadence.dev/r/breadcrumb.json) |
| breadcrumb | `@components/cadence/lib/label-layout.ts` | [JSON files[].content](https://cadence.dev/r/breadcrumb.json) |
| breadcrumb | `@components/cadence/lib/inline-entrance.ts` | [JSON files[].content](https://cadence.dev/r/breadcrumb.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: breadcrumb](https://cadence.dev/r/breadcrumb.json)

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

Copy both files in the target list, keeping `breadcrumb/index.tsx` beside the
shared `lib/` directory containing `cn.ts` and the motion helpers the trail imports
(`breadcrumb-layout.ts`, `button-group-layout.ts`, `label-layout.ts`,
`inline-entrance.ts`). The trail needs the Cadence provider, motion, geometry and
text registry items. All modes keep every destination reachable: full fades changed
crumbs and projects retained positions, reduced keeps only short opacity and colour
feedback, and none settles immediately. `lucide-react` is a component dependency
for the default chevron and ellipsis, even when an example uses a custom separator.

Keep the source's existing `"use client"` directive. In Next.js App Router, a
Server Component can compose the parts shown in Usage and the named examples
with serializable props, including the `render` element in “A router link”.
Event handlers or a function passed to `render` belong in a client module. The
preview already has a client boundary; copying its specimen does not require
the site's preview shell.

Only “A router link” needs `next/link` from an existing Next.js application; the
Breadcrumb source imports no framework router. In another router, use its link
element with `render` and keep the resulting anchor's destination. The caller
owns route destinations, ancestor order and which ancestors are hidden; Breadcrumb
does not derive a trail from the URL or navigate on its own.

“A deep trail that collapses” and the top preview use native `details`/`summary`,
so no extra registry item or npm package is needed. The disclosure keeps its
browser-owned state and supports Enter and Space without JavaScript.
`BreadcrumbEllipsis` is decorative; keep the summary's accessible name and make
hidden ancestors reachable. Use `BreadcrumbPage` for the current page and give
each navigation landmark a distinct label when rendering several trails.

## Usage

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>plan.pdf</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A deep trail that collapses

`BreadcrumbEllipsis` is decorative, not a trigger. The caller chooses which ancestors to collapse.
Here a native `details` disclosure makes the hidden Documentation link reachable with Enter or Space,
including without JavaScript. Longer hierarchies can put multiple ancestor links in the disclosure.
Each trail owns its own open state; the component does not measure or truncate a route.

<ComponentExample name="collapsed" />

```tsx
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function CollapsedTrail() {
  return (
    <Breadcrumb aria-label="Collapsed guide trail">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <details className="relative">
            <summary aria-label="Show ancestors" className="cursor-pointer list-none rounded-sm focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <BreadcrumbEllipsis />
            </summary>
            <div className="absolute top-full left-0 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
              <BreadcrumbLink href="/docs" className="whitespace-nowrap">Documentation</BreadcrumbLink>
            </div>
          </details>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Motion modes</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A custom separator

`BreadcrumbSeparator` accepts any child; its default is a chevron. A slash stays decorative: the
separator is hidden from assistive technology, while every ancestor remains a native link.
This choice changes the separator alone, without changing the trail or its destinations.

<ComponentExample name="separator" />

```tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function CustomSeparator() {
  return (
    <Breadcrumb aria-label="Slash trail">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem><BreadcrumbLink href="/components">Components</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A router link

`BreadcrumbLink` accepts Base UI’s `render`. Pass the framework link to preserve client navigation
and prefetching; the rendered element is still an anchor with `data-slot="breadcrumb-link"`.
This Next.js example navigates to real Home and Components routes. The current page stays a
non-focusable `BreadcrumbPage`. In another router, replace only the `Link` import and element.

<ComponentExample name="router" />

```tsx
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function RouterTrail() {
  return (
    <Breadcrumb aria-label="Router trail">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink render={<Link href="/components" />}>Components</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

## A path that changes

The caller owns the path, so it also owns what a change means. Insert, remove or rename a real destination and the
surviving ancestors keep their nodes, their `href` and their identity; only the new and changed crumbs fade, and
retained positions reflow to the final path. Reusing one label for a different destination is a new identity, not a
morph, so that revision keeps native layout. To let a removed ancestor fade out, keep it mounted for the exit - for
example inside `AnimatePresence` - and give every crumb a stable key.

<ComponentExample name="membership" />

```tsx
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/cadence/breadcrumb";

export function ChangingTrail() {
  const [deep, setDeep] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <button type="button" className="text-sm underline" onClick={() => setDeep(!deep)}>
        {deep ? "Shorter path" : "Deeper path"}
      </button>
      <Breadcrumb aria-label="Changing trail">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/components">Components</BreadcrumbLink></BreadcrumbItem>
          {deep ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/components/navigation">Navigation</BreadcrumbLink></BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
```

## When to use

- A hierarchy deeper than two levels, where the user needs to know where they are and
  how to get back up: `Workspace / Projects / cadence-ui`.
- A page reached through a drill-down — a file inside a folder inside a drive.
- A trail that doubles as navigation: every ancestor is a link, the current page is
  not.

## When not to use

- Two levels of depth. The header already links home; a trail of two items adds noise.
- A wizard or a multi-step form. That is a progress indicator, and it must not let the
  user jump to a step they have not reached.
- A history of where the user came from ("back to search results"). That is a back
  link, and it should look like one.

## API

| Part                   | Props                 | Notes                                                         |
| ---------------------- | --------------------- | ------------------------------------------------------------- |
| `Breadcrumb`           | native nav props      | `aria-label="breadcrumb"`.                                    |
| `BreadcrumbList`       | native ol props       | Flex row that wraps; owns the committed path revision.        |
| `BreadcrumbItem`       | native li props       | Inline flex, one gap; keeps its own presence and position.     |
| `BreadcrumbLink`       | `render`, anchor props| Anchor by default; `data-slot="breadcrumb-link"`.             |
| `BreadcrumbPage`       | native span props     | The current page: `aria-current="page"`, not a link.          |
| `BreadcrumbSeparator`  | native li props       | `role="presentation"`, `aria-hidden`; chevron by default.     |
| `BreadcrumbEllipsis`   | native span props     | Hidden from assistive tech; contains `sr-only` "More".        |

## Motion contract

Authored intensity is **medium**: Breadcrumb keeps destination identity while the trail grows, shrinks or renames: changed crumbs and separators fade, retained ancestors reflow toward the final path, the list owns its content-driven block size, and plain labels replace only their changed graphemes under one scoped foreground owner. Initial SSR and hydration content stays readable and does not replay an entrance.

| Recipe | Owner / properties | Full | Reduced | None |
| --- | --- | --- | --- | --- |
| `data.transition/one-shot` | List entrance, and a later inserted crumb; opacity | One short entrance | Short opacity | Immediate |
| `exit.fade/one-shot` | Retained leaving crumb; opacity | Fade, then lifecycle removal | Short opacity | Immediate removal |
| `geometry.resize/measured` | List block height, one owner per revision | Clamped height continuity | Immediate height | Immediate height |
| `layout.move/one-shot` | Each surviving crumb's own position | Project to the final path | Immediate placement | Immediate placement |
| `text.change/changed-runs` | Plain link and page labels; changed runs | Changed graphemes only, no stagger | Short changed opacity | Exact final text immediately |
| `state.color/css-transition` | Link, page, separator and ellipsis foreground | Scoped colour feedback | Short colour feedback | Zero clock |

A committed path revision is one cause: the list measures the final crumb boxes once, every retained crumb projects from its own previous box, and the list alone owns the block height. Unchanged ancestor labels do not replay. A wrapped path that moves a crumb between rows, a passive viewport or font reflow, a clipped or oversized path, or a retained node that now points at another destination keeps native layout. The caret, focus outline, link activation, `aria-current` and the current page's non-focusable state never wait for an animation, and this component never derives a trail from the URL or navigates on its own.

Removing a crumb requires the caller to keep it mounted for the exit - for example inside `AnimatePresence`. The leaving crumb keeps only an inert, `aria-hidden` visual at its last committed box; it never stays actionable, and a restored ancestor replaces a stale exit.

## Accessibility

- The `nav` is labelled "breadcrumb" by default. Give each trail a distinct
  `aria-label` when several appear on one page, so readers can tell its landmarks apart.
- Order matters: `<ol>`/`<li>` gives the trail a length and a sequence, which is what
  a screen reader announces ("list, 3 items").
- The last item is `BreadcrumbPage`: `aria-current="page"`, `aria-disabled="true"`, and
  not focusable. It is where the user already is, so linking it is a no-op that costs a
  tab stop.
- Separators are decorative — `role="presentation"` and `aria-hidden` — so the trail is
  read as names, not as "chevron".
- An ellipsis must not be the only way to reach hidden ancestors: pair it with an accessible
  disclosure or menu. The native disclosure above supports Enter and Space and works without JavaScript.

## Responsiveness and performance

The list wraps and increases its gap at sm. A committed path revision owns the list's block height and each
retained crumb's position; passive viewport, font or scrollbar reflow stays native and does not animate. Collapsing a
deep trail into an ellipsis is caller-owned; the component does not measure width or choose hidden ancestors.

Motion work is bounded to the visible path: one measurement per committed revision, one projection per retained
crumb and no hidden measurement copy or list-invalid wrapper. A decorative ellipsis nested inside its item follows
that item instead of writing a second transform. Base UI behavior requires hydration; native HTML behavior remains
browser-owned. Composed controls retain their own dependencies and motion contracts. Server-rendered markup does not
imply that every interaction works without JavaScript. The registry's source-size comparison for this item is
advisory under ADR-023; dependencies and application bundles are measured separately.

## Notes for AI

- Do not wrap the current page in a link "for consistency". It is a `BreadcrumbPage`.
- Do not put the trail in a `Card` header as decoration; it is navigation and belongs
  near the top of the content region.
- If the hierarchy is generated from a route, derive the trail from the route's
  segments rather than hand-writing items — a trail that disagrees with the URL is
  worse than none.

---

Full index: https://cadence.dev/llms.txt
