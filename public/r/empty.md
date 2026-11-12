# Empty

> Lists, tables, and panels with nothing to show yet.

- Registry item: https://cadence.dev/r/empty.json
- Install: `npx shadcn@latest add @cadence/empty`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: enter.pop, exit.fade, state.color, geometry.resize, text.change, number.roll, data.transition

## Installation

**Command**

```install
npx shadcn@latest add @cadence/empty
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion class-variance-authority
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.
- [@cadence/cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json) — direct registry dependency.

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
| cadence-surface-presence | `@components/cadence/lib/surface-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-surface-presence.json) |
| empty | `@components/cadence/empty/index.tsx` | [JSON files[].content](https://cadence.dev/r/empty.json) |
| empty | `@components/cadence/lib/empty-media.ts` | [JSON files[].content](https://cadence.dev/r/empty.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: empty](https://cadence.dev/r/empty.json)

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

Copy all Manual files at their listed relative paths, including the provider, motion,
geometry, text, number, surface-presence and local media helpers. Empty uses `motion`
and `class-variance-authority` and is a Client Component. Server-rendered content is
visible immediately; hydration does not replay entrance. `CadenceProvider` is optional
and controls full/reduced/none and the shared clock.

The icon examples also need `lucide-react`. The recovery examples use Button or its
`buttonVariants` export; install Button when retaining those imports:

```install
npx shadcn@latest add @cadence/button
```

```package-manager
npm install lucide-react
```

Keep `"use client"` in interactive examples and files calling `buttonVariants` from
Button's client module. Filtering, request state and populated results belong to the
application. Native styled links keep their normal navigation behavior. No external
image asset is needed; the illustration is inline SVG. The site frame is not consumer setup.

## Usage

```tsx
"use client";

import { InboxIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/cadence/empty";

export function SavedComponentsEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><InboxIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>No saved components</EmptyTitle>
        <EmptyDescription>Browse the catalogue to find your first component.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a href="/components" className={buttonVariants({ size: "sm" })}>Browse components</a>
      </EmptyContent>
    </Empty>
  );
}
```

## Changing empty state

Change the caller's copy, artwork and quantity while the recovery link stays usable.
Toggle results to remove or restore the same empty region. The parent owns populated
content; Empty never infers loading or failure. This specimen chooses a verified
monospace font for visible text/reel rendering; Empty itself preserves caller typography.
Revised copy animates up to the shared changed-text budget; a wholesale rewrite of a
description settles to the latest native copy instead. The specimen also gives the
region its own height (`flex-none`); when flex layout owns the main axis that size
belongs to the parent, not to Empty.

<ComponentExample name="changing" />

```tsx
"use client";

import { FolderIcon, InboxIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/cadence/empty";

export function ChangingEmpty() {
  const [revision, change] = useState(0);
  const [show, reveal] = useState(true);
  const [tone, changeTone] = useState(false);
  const changed = revision % 2 !== 0;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => change((value) => value + 1)}>
          Update empty state
        </Button>
        <Button size="sm" variant="outline" onClick={() => reveal((value) => !value)}>
          Toggle results
        </Button>
        <Button size="sm" variant="outline" onClick={() => changeTone(value=>!value)}>Change tone</Button>
      </div>
      <AnimatePresence initial={false} mode="sync">
        {show ? (
          <Empty
            key="empty"
            style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
            className={tone ? "flex-none border bg-muted text-muted-foreground" : "flex-none border bg-card text-foreground"}
          >
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className={tone ? "bg-card text-muted-foreground" : "bg-muted text-foreground"}
              >
                {changed ? (
                  <FolderIcon key="folder" aria-hidden="true" />
                ) : (
                  <InboxIcon key="inbox" aria-hidden="true" />
                )}
              </EmptyMedia>
              <EmptyTitle className={tone ? "text-muted-foreground" : "text-foreground"}>
                {changed ? "No archived components" : "No saved components"}
              </EmptyTitle>
              <EmptyDescription className={tone ? "text-foreground" : "text-muted-foreground"}>
                {changed
                  ? "Your archive is empty for now. Browse the catalogue and start your collection."
                  : "Your archive is empty for now."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <a href="/components" className={buttonVariants({ size: "sm" })}>
                Browse components
              </a>
            </EmptyContent>
          </Empty>
        ) : (
          <p key="results">The application owns populated results. Toggle to restore the empty region.</p>
        )}
      </AnimatePresence>
      <Empty
        className="border"
        aria-label="Remaining count"
        style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}
      >
        <EmptyHeader>
          <EmptyTitle>Remaining saved slots</EmptyTitle>
          <EmptyDescription>{19 + revision}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          Direct numbers roll; identifier strings and rich recovery actions retain their structure.
        </EmptyContent>
      </Empty>
    </div>
  );
}

```

## Bounded or unbounded

Empty has no border by default. Add `border border-dashed` when the empty region needs its own boundary; leave it unbounded inside a surface that already provides one. The caller owns that surface and its height.

<ComponentExample name="boundaries" />

```tsx
"use client";

import { InboxIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/cadence/empty";

export function EmptyBoundaries() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No saved components</EmptyTitle>
          <EmptyDescription>A caller-supplied dashed boundary.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing to review</EmptyTitle>
          <EmptyDescription>No extra boundary inside an existing panel.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
```

## A second action

Use one primary recovery action and a quieter secondary route. Clear filters changes caller-owned state while the empty region stays mounted; Browse components is a real navigation link. EmptyContent stacks these controls without making them competing primary buttons.

<ComponentExample name="second-action" />

```tsx
"use client";

import { useState } from "react";
import { InboxIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/cadence/empty";

export function EmptySecondAction() {
  const [cleared, setCleared] = useState(false);
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><InboxIcon aria-hidden="true" /></EmptyMedia>
        <EmptyTitle>No matching components</EmptyTitle>
        <EmptyDescription>{cleared ? "Filters cleared. Save a component to fill this list." : "No saved components match your filters."}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={() => setCleared(true)}>Clear filters</Button>
        <a href="/components" className={buttonVariants({ variant: "ghost", size: "sm" })}>Browse components</a>
      </EmptyContent>
    </Empty>
  );
}
```

## Icon or illustration

`variant` belongs to EmptyMedia, not Empty. `icon` frames a glyph on a muted surface; `default` leaves the media transparent for caller-provided artwork. Both examples use decorative media because the title already says what the region means.

<ComponentExample name="media" />

```tsx
"use client";

import { InboxIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/cadence/empty";

export function EmptyMediaForms() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><InboxIcon aria-hidden="true" /></EmptyMedia>
          <EmptyTitle>Inbox clear</EmptyTitle>
          <EmptyDescription>An icon on the muted media surface.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <svg aria-hidden="true" viewBox="0 0 64 48" className="w-16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 14h20l6 6h26v24H6z" />
              <path d="M6 14V6h20l6 8h26v6" />
            </svg>
          </EmptyMedia>
          <EmptyTitle>Folder empty</EmptyTitle>
          <EmptyDescription>Transparent media for your own illustration.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
```

## Without media

Omit EmptyMedia when words and the next step are enough. The header keeps its spacing without an empty icon slot; this compact form can sit within a smaller panel.

<ComponentExample name="without-media" />

```tsx
"use client";

import { InboxIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/cadence/empty";

export function EmptyWithoutMedia() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No saved components</EmptyTitle>
        <EmptyDescription>Browse the catalogue to find your first component.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <a href="/components" className={buttonVariants({ size: "sm" })}>Browse components</a>
      </EmptyContent>
    </Empty>
  );
}
```

## When to use

- A list, table, or panel that is legitimately empty: no invoices, no results for
  this filter, a folder nobody has filled yet.
- An empty state that teaches the next step — a primary action, a link to a
  template, or a line that explains what will appear here.
- A region whose emptiness is a state, not a mistake: an inbox at zero, a fresh
  workspace.

## When not to use

- While loading. Use `skeleton` when the shape of the incoming content is known,
  and `spinner` when it is not.
- A search that returned nothing because of a typo. That case needs the query echoed
  back and the filter explained, not a generic illustration.
- An error. An empty region is a normal state; a failed request is an `alert`.

## API

| Part               | Props                   | Notes                                                          |
| ------------------ | ----------------------- | -------------------------------------------------------------- |
| `Empty`            | native div props        | Centred flex column, no default border, `md:p-12`.               |
| `EmptyHeader`      | native div props        | Stacks media, title, description; `max-w-sm`.                  |
| `EmptyTitle`       | native div props        | Large, medium weight. Renders a `div`, not a heading.          |
| `EmptyDescription` | native props for `p`    | Renders a `div` (upstream too): the copy often holds a block.  |
| `EmptyMedia`       | `variant`               | `"default" \| "icon"`, exposed as `data-variant`.              |
| `EmptyContent`     | native div props        | Actions; full width, `max-w-sm`, own gap.                      |

`data-slot` values are `empty`, `empty-header`, `empty-title`,
`empty-description`, `empty-icon`, `empty-content`.

## Motion contract

Authored intensity is **medium**: One empty region coordinates surface opacity, readable height, changed display text, quantity reels and local media replacement while recovery controls retain native ownership.

| Cause / owner | Recipe / form | Full | Reduced | None |
| --- | --- | --- | --- | --- |
| Insert / retained removal, Empty root | `enter.pop/one-shot`, `exit.fade/one-shot` | One opacity envelope | Short opacity | Immediate |
| Later readable content height / root or owning parent | `geometry.resize/measured` | Clamped measured height | Immediate | Immediate |
| Plain Title, Description and Content strings | `text.change/changed-runs` | Changed-only opacity, no stagger | Short opacity | Immediate |
| Direct numeric children in those three parts | `number.roll/reels` | Compact place-value reels | Immediate | Immediate |
| Current EmptyMedia visual identity changes | `data.transition/one-shot` | Local opacity replacement | Short opacity | Immediate |
| Root/media surfaces and explicit display foreground | `state.color/css-transition` | Scoped colour | Short colour | Immediate |

Appearance, safe height, surface/foreground, owned strings and quantities are default
capabilities. A measured parent region owns geometry once when present; Empty delegates
its height to that region. Inherited foreground follows its ancestor; explicitly
overridden display colour has its own controller. Rich children, links and controls
retain their structure and their own owners. Numeric-looking strings are text.

Mount an Empty inside `AnimatePresence` to retain its exit; without a surviving owner,
removal is immediate. Retained outgoing content is inert and aria-hidden, with no
duplicate recovery action or announcement. Rapid revisions target current content.
None and zero clock cancel pending effects; live reduction also finishes height and
reels. Restoring full does not replay a settled action.

Media replacement tracks the direct supplied visual's type, key or image `src`. Give
same-type illustrations distinct keys when replacing them. Only the current media
host fades; title and actions do not re-enter, artwork is never cloned, and late image
readiness does not restore a removed region. Native editing, focused controls,
unsupported typography/paint and competing native property writers retain immediate
presentation. Unknown font features keep the caller's original typography.

The shared readout renderer requires stable foreground paint. When a known
`state.color` foreground change happens with a copy or quantity update, that colour
controller keeps its tween and the readout exposes the latest native text/number
immediately. Surface-only background/border changes do not cancel changed-text paint.

## Accessibility

- The root is a plain container: no role, no live region. Announce the change of
  state in the region that owns it (`aria-live="polite"` on the list), not here.
- `EmptyTitle` renders a `div`. If the empty state is the main content of a page,
  put a real heading inside it so it appears in the outline.
- The media is decorative. Pass `aria-hidden` to the icon, or give the surrounding
  text the whole message — an icon alone never carries meaning.
- Keep at least one action focusable. An empty state with no way forward is a dead
  end; the primary action is the reason this component exists.

## Responsiveness and performance

The root can shrink with its parent and increases padding at md. Header and content have bounded
widths; the caller owns the surrounding height and wrapping action rows.

Empty uses the shared client motion runtime and observers after commitment. Initial
SSR/no-JS content stays readable; hydrated state handlers need JavaScript. Height
animates only when natural, readable and locally owned; fixed/flex/ratio sizing,
responsive reflow, native editing and unsafe clipping settle immediately. Recovery
actions remain reachable throughout the transition. The historical T0 4 KiB own-source
comparison excludes dependencies and is advisory under ADR-023. Runtime/page/device
performance acceptance remains deferred; functional adoption is not performance acceptance.

## Notes for AI

- One primary action per empty state. Two competing buttons read as a decision the
  user is not ready to make.
- Use Empty for the content structure and spacing. The caller chooses a surrounding
  surface and adds a border only when that region needs a boundary.
- Do not use `Empty` for a loading placeholder — `skeleton` keeps the layout stable,
  which `Empty` does not.

---

Full index: https://cadence.dev/llms.txt
