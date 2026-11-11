# Card

> Grouping related content, such as a summary or a record.

- Registry item: https://cadence.dev/r/card.json
- Install: `npx shadcn@latest add @cadence/card`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: enter.pop, exit.fade, state.color, geometry.resize, text.change, number.roll

## Installation

**Command**

```install
npx shadcn@latest add @cadence/card
```

Usage, Action in the header, Content-sized and Section boundaries also render
[Button](/components/button). Install it when copying those compositions:

```install
npx shadcn@latest add @cadence/button
```

The top preview also renders [Badge](/components/badge):

```install
npx shadcn@latest add @cadence/badge
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion
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
| card | `@components/cadence/card/index.tsx` | [JSON files[].content](https://cadence.dev/r/card.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: cadence-surface-presence](https://cadence.dev/r/cadence-surface-presence.json)

[Source files: card](https://cadence.dev/r/card.json)

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

Card installs its relative shared motion, geometry, text and quantity helpers. The provider is optional; without one, Card follows the system preference. Follow the generated setup above, including the shared theme CSS. Keep the `"use client"` directive. Server-rendered and no-JavaScript cards remain naturally sized and visible; hydration does not replay the first screen.

For the action compositions, follow [Button's installation](/components/button#installation),
including its dependencies and motion setup. To reproduce the top preview, also follow
[Badge's installation](/components/badge#installation); the shared `lib/cn.ts` and its
packages are already included above. Button and Badge are composition dependencies,
not dependencies of Card. Compact renders neither, and the body example snippets do not
render Badge, so their unused imports can be omitted. React's `useRef` and `useState`
are used by the changing-content examples and need no additional package beyond the React setup
above; their unused imports in the other snippets can also be omitted.

## Usage

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/cadence/card";
import { Button } from "@/components/cadence/button";

export function Plan() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Parity plan</CardTitle>
        <CardDescription>58 components, ten batches, one release train.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Batch B1 ships the eleven atoms.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Open plan</Button>
      </CardFooter>
    </Card>
  );
}
```

## Changing content

Update the record, add a seat, change its density or surface colour, or hide and reinsert it. Direct strings in Title, Description and Content use changed-only replacement; direct numbers keep their existing formatting and roll supported changed places. Rich children remain untouched. Change the surface independently to see its colour feedback; known background, border-colour and box-shadow transitions remain independent of changed text. Foreground, opacity, geometry and unknown transitions keep native text or cancel its paint. Reels retain the stricter stable-ancestor-paint boundary. The example explicitly selects plain monospace typography with normal font features so the native/canvas glyph correspondence is measurable; unverified shaping keeps native paint. A surviving `AnimatePresence` parent retains the one real Card for its exit.

<ComponentExample name="changing-content" />

```tsx
"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/cadence/card";

export function ChangingCard() {
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(19);
  const [show, setShow] = useState(true);
  const [compact, setCompact] = useState(false);
  const [muted, setMuted] = useState(false);
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setReady(value => !value)}>Update record</Button>
        <Button variant="outline" size="sm" onClick={() => setCount(value => value + 1)}>Add seat</Button>
        <Button variant="outline" size="sm" onClick={() => setCompact(value => !value)}>Change density</Button>
        <Button variant="outline" size="sm" onClick={() => setMuted(value => !value)}>Change surface</Button>
        <Button variant="outline" size="sm" onClick={() => setShow(value => !value)}>{show ? "Hide record" : "Show record"}</Button>
      </div>
      <AnimatePresence>
        {show && <Card key="record" fit="content" size={compact ? "sm" : "default"} className={muted ? "max-w-full bg-muted" : "max-w-full"} style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
          <CardHeader><CardTitle className="whitespace-nowrap">{ready ? "Release ready" : "Release pending"}</CardTitle><CardDescription className="whitespace-nowrap">{ready ? "Review complete" : "Awaiting review"}</CardDescription></CardHeader>
          <CardContent className="whitespace-nowrap">{count}</CardContent>
          <CardFooter><span className="text-xs text-muted-foreground">Seats in this workspace</span></CardFooter>
        </Card>}
      </AnimatePresence>
    </div>
  );
}
```

## Action in the header

`CardHeader` uses two columns when `CardAction` is present. Keep the action a real link or button; the card surface itself is not a keyboard control.

<ComponentExample name="header-action" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/cadence/card";

export function CardHeaderAction() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Workspace setup</CardTitle>
        <CardDescription>Connect your first project.</CardDescription>
        <CardAction><Button size="sm" variant="outline" render={<a href="/docs/installation" />}>Setup</Button></CardAction>
      </CardHeader>
      <CardContent>Install a component to get started.</CardContent>
    </Card>
  );
}
```

## Compact

`size="sm"` tightens the shared spacing for every part. Compare default and small cards directly; size changes density, not content or a responsive breakpoint.

<ComponentExample name="sizes" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/cadence/card";

export function CardSizes() {
  return (
    <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
      {(["default", "sm"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader><CardTitle>{size === "sm" ? "Compact" : "Default"}</CardTitle><CardDescription>Workspace summary</CardDescription></CardHeader>
          <CardContent>Every part follows one spacing property.</CardContent>
          <CardFooter><span className="text-xs text-muted-foreground">size=&quot;{size}&quot;</span></CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

## Content-sized

`fit="content"` hugs its real flow box, even in a stretching grid. One geometry owner measures final layout and interpolates only safe owned axes in full mode. Toggle the caller-owned text to compare it with a normal card; the same shell and caller ref remain in place. Narrowing the parent wraps the text and remeasures it. Reduced and none commit geometry immediately. Wrapping width, focused editors, constrained axes and any dimension that would conceal required content keep native layout. Use it when differing content heights carry information; ordinary card grids usually should line up.

<ComponentExample name="content-sized" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/cadence/card";

export function ContentSizedCard() {
  const [expanded, setExpanded] = useState(false);
  const fitRef = useRef<HTMLDivElement>(null);
  return (
    <div className="grid w-full max-w-lg grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
      <Card fit="content" ref={fitRef} data-testid="fit-card" className="max-w-sm">
        <CardHeader><CardTitle>Content fit</CardTitle></CardHeader>
        <CardContent>{expanded ? "The surface follows its own content. A caller ref still reaches the same measured shell while the text wraps as the viewport narrows." : "Short content."}</CardContent>
        <CardFooter><Button variant="outline" onClick={() => setExpanded((value) => !value)}>Toggle content</Button></CardFooter>
      </Card>
      <Card>
        <CardHeader><CardTitle>Normal grid item</CardTitle><CardDescription>This card stretches with its row.</CardDescription></CardHeader>
        <CardContent>A longer summary can fill more vertical space. The content-sized neighbour keeps its own measured height rather than inheriting this card’s height.</CardContent>
      </Card>
    </div>
  );
}
```

Fit owns its native block height even with a stretching `h-full` class; use an ordinary Card for an explicit fixed height. External min/max constraints still apply.

## Section boundaries

Add `border-b` to the header and `border-t` to the footer. The parts already adjust their padding for those boundaries, without introducing another Card part.

<ComponentExample name="boundaries" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/cadence/card";

export function CardBoundaries() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="border-b"><CardTitle>Release notes</CardTitle><CardDescription>Review the latest changes.</CardDescription></CardHeader>
      <CardContent>Components, fixes and documentation updates.</CardContent>
      <CardFooter className="border-t"><Button variant="outline" render={<a href="/docs/changelog" />}>Read changelog</Button></CardFooter>
    </Card>
  );
}
```

## When to use

- A unit of content that belongs together: a summary, a plan, an account, a
  record in a grid.
- A surface that needs a header, an optional action, body content, and a footer.
- A list of comparable items where the boundary itself carries meaning.

## When not to use

- To fake spacing. A card is a boundary; use padding if you only need breathing
  room.
- As a page layout. Nesting cards inside cards flattens the hierarchy.
- For a modal or a popover; those are overlays with their own focus rules.

## API

| Part              | Props                           | Notes                                                                              |
| ----------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| `Card`            | `size`, `fit`, native div props | `size` sets `--card-spacing` and `data-size`; `fit`: `"content"` hugs the content. |
| `CardHeader`      | native div props                | Grid header; reacts to `CardAction` and a bottom border.                           |
| `CardTitle`       | native div props                | Bold, leading-none. Does not create a heading.                                     |
| `CardDescription` | native div props                | Muted supporting text.                                                             |
| `CardAction`      | native div props                | Top-right slot inside the header.                                                  |
| `CardContent`     | native div props                | Body; carries the horizontal padding.                                              |
| `CardFooter`      | native div props                | Bottom row; reacts to a top border.                                                |

Every part sets `data-slot`, so CSS can reach it:
`[&>[data-slot=card-header]]:gap-4`. Under `fit="content"` the parts are wrapped
in one `data-slot="card-flow"` box. Its header releases inline-size containment so the title participates in intrinsic fit width. The flow supplies the natural destination and keeps that destination width only during an eligible width flight, then releases it. This is the element the height is measured
from — style the parts from the shell as before, and the flow box only if you
need the measured layer itself.

## Motion contract

Authored intensity is **medium**: One retained surface envelope and measured size transaction coordinate direct display changes, quantity reels and disjoint readable paint without rewriting rich content.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Independent insertion | root opacity; first SSR/hydration stays visible | `enter.pop/one-shot` | Yes |
| Retained removal | root opacity; inert and hidden from accessibility immediately | `exit.fade/one-shot` | Yes, reinsert the same key |
| Content or density change | measured owned height and safe nonwrapping fit width | `geometry.resize/measured` | Yes, latest destination |
| Direct display string | changed graphemes only, no stagger | `text.change/changed-runs` | Yes |
| Direct quantity | changed decimal places with exact prior output | `number.roll/reels` | Yes |
| Palette change | explicit background, foreground, border and fixed-topology shadow properties at disjoint owners | `state.color/css-transition` | Yes |
| reduced | short opacity/colour; geometry and quantities immediate | Same recipes, no travel or reels | Live cancellation |
| none / zero clock | immediate current semantic target; no duration or delay | Same recipes, zero clock | Cancels active work |

An ancestor Card owns the same entrance and resize cause once. Independently overridden text colours have their own owner; ordinary inherited paint stays at the ancestor. Unknown caller palettes, transition/animation owners, unsafe shaping or pixel transport use immediate local fallbacks. Passive viewport/font/media reflow is native. Strings such as `00123` remain text. Forms, media, rich JSX and actual editable contexts retain their native content and lifetimes. Returning from editing retains a native-edited buffer as the baseline without replay; a later changed display value resumes caller output. There is no automatic hover lift on the plain Card surface.

## Accessibility

- `Card` is a plain `div`: no role, no landmark. That is correct for a visual
  grouping — but it means the card is not a navigable region. If a set of cards is
  the main content, wrap it in a `<section>` or a list (`<ul>/<li>`).
- `CardTitle` renders a `div`. When the title belongs in the document outline, put
  a heading inside it: `<CardTitle><h3 …>Parity plan</h3></CardTitle>`, or render
  the card with `aria-labelledby` pointing at the title's id.
- A card that is clickable must contain a real link or button; do not put
  `onClick` on the card and call it done — it is invisible to keyboard users.

## Responsiveness and performance

Cards follow their parent grid/flex layout. The caller owns columns, overflow and narrow-screen wrapping; `size="sm"` changes spacing, not a breakpoint. Fit uses natural fit-content CSS with one existing card-flow and no cloned children or permanent pixel height. Unsupported, hidden, constrained or focus-sensitive geometry resolves natively. Temporary animation locks release to current caller CSS; later viewport changes stay responsive.

Card includes client motion, colour, measured geometry and bounded text/quantity helpers. Observers and active writers are retired on cleanup; rich body content is not traversed into animated display parts. Shared workload limits bound decoration and latest-target fallback. The historical T0 4 KiB own-source gzip reference is advisory under ADR-023; shared runtime and page costs are separate and performance governance remains deferred. No-JavaScript HTML stays readable, while example controls require hydration.

## Notes for AI

- Use `CardFooter` for actions, not a bare `div` — it keeps spacing consistent when
  `size` changes.
- Do not add hover lift to a card that is not interactive. Independent content/presence changes already have their own owners.
- `fit="content"` is opt-in and per card. A grid of cards is meant to line up; only
  reach for the content-sized variant when the differences between cards are the
  information.

---

Full index: https://cadence.dev/llms.txt
