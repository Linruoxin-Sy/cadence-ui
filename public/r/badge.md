# Badge

> Statuses, counts, and categories.

- Registry item: https://cadence.dev/r/badge.json
- Install: `npx shadcn@latest add @cadence/badge`
- Type: registry:ui
- Since: 0.2.0
- Motion recipes: data.transition, exit.fade, state.color, geometry.resize, text.change, number.roll

## Installation

**Command**

```install
npx shadcn@latest add @cadence/badge
```

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
- [@cadence/cadence-geometry](https://cadence.dev/r/cadence-geometry.json) — direct registry dependency.
- [@cadence/cadence-handoff](https://cadence.dev/r/cadence-handoff.json) — transitive registry dependency.
- [@cadence/cadence-text](https://cadence.dev/r/cadence-text.json) — direct registry dependency.
- [@cadence/cadence-number](https://cadence.dev/r/cadence-number.json) — direct registry dependency.

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
| cadence-number | `@components/cadence/lib/number-plan.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| cadence-number | `@components/cadence/lib/use-number-presentation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-number.json) |
| badge | `@components/cadence/badge/index.tsx` | [JSON files[].content](https://cadence.dev/r/badge.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: cadence-geometry](https://cadence.dev/r/cadence-geometry.json)

[Source files: cadence-handoff](https://cadence.dev/r/cadence-handoff.json)

[Source files: cadence-text](https://cadence.dev/r/cadence-text.json)

[Source files: cadence-number](https://cadence.dev/r/cadence-number.json)

[Source files: badge](https://cadence.dev/r/badge.json)

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

Badge installs its shared motion helpers and provider dependency. The default policy works without
an explicit provider; use `CadenceProvider` to select a mode or clock for a subtree.

The With an icon example also uses `lucide-react`. Install it only when using those
icons; Badge itself does not require an icon package:

```package-manager
npm install lucide-react
```

## Usage

```tsx
import { Badge } from "@/components/cadence/badge";

export function Release() {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">Parity plan</span>
      <Badge variant="secondary">0.2.0</Badge>
    </div>
  );
}
```

## Variants

Choose one of six visual weights for a status or category. The `link` variant is
only a style; use `render` when the badge should navigate.

<ComponentExample name="variants" />

```tsx
import { Badge } from "@/components/cadence/badge";

export function BadgeVariants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  );
}
```

## With an icon

Pair a short label with an icon; the text still communicates the status without
depending on the icon or colour.

<ComponentExample name="icon" />

```tsx
import { CheckIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { Badge } from "@/components/cadence/badge";

export function BadgeIcons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge><CheckIcon />Verified</Badge>
      <Badge variant="secondary"><ClockIcon />Pending</Badge>
      <Badge variant="outline"><GitBranchIcon />main</Badge>
    </div>
  );
}
```

## As a link

`render` replaces the element, so a badge stays a `span` unless you ask for
something else. The `[a&]` selectors only switch on hover when it really is a link.
These anchors use native focus and Enter navigation to the changelog.

<ComponentExample name="link" />

```tsx
import { Badge } from "@/components/cadence/badge";

export function BadgeLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline" render={<a href="/docs/changelog" />}>3 releases</Badge>
      <Badge variant="ghost" render={<a href="/docs/changelog" />}>Changelog</Badge>
    </div>
  );
}
```

## Changing content

Direct string children replace only changed text, with no character stagger. Direct numeric children
use compact reels; numeric-looking strings such as `"00123"` and `"v1.2.3"` remain labels. Supported
font/layout correspondence is checked against the real native text. Pixel layers follow its native
position through a verified CSS anchor; unavailable or caller-owned anchors use native paint. Unsupported shaping, clipping,
editing, or device scaling keeps the exact latest text immediately. This example uses a known
monospace font to make the supported effect easy to inspect; Badge imposes no typography.

<ComponentExample name="changing-content" />

```tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";

export function Status() {
  const [ready, setReady] = useState(false);
  const [quantity, setQuantity] = useState(19);
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
          {ready ? "Status ready" : "Status retry"}
        </Badge>
        <Badge style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>{quantity}</Badge>
        <Badge variant="outline">v1.2.3</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setReady((value) => !value)}>Change status</Button>
        <Button variant="outline" size="sm" onClick={() => setQuantity((value) => value + 1)}>Increase quantity</Button>
      </div>
    </div>
  );
}
```

The controls use the separately installed `@cadence/button` item. Consumers own status, quantity,
request state, formatting and stable keys. Rich JSX stays intact: compose `AnimatedText` or
`AnimatedNumber` explicitly for a known rich-content display slot. Keep application announcements
on a suitable surrounding live region; decorative motion does not add an implicit live region.

## Independent presence

A newly inserted badge fades when its enclosing presentation has already appeared. An enclosing
Cadence presentation consumes the same initial entrance; Badge does not replay it. Use a surviving
`AnimatePresence` parent for retained removal. An exiting badge becomes inert and hidden from
assistive technology immediately; reintroducing the same key reverses its opacity.

<ComponentExample name="presence" />

```tsx
"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/cadence/badge";
import { Button } from "@/components/cadence/button";

export function OptionalStatus() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex min-h-8 items-center gap-3">
        <span>Release status</span>
        <AnimatePresence>{visible && <Badge key="status" variant="secondary">Available</Badge>}</AnimatePresence>
      </div>
      <Button variant="outline" size="sm" onClick={() => setVisible((value) => !value)}>Toggle status</Button>
    </div>
  );
}
```

## When to use

- A short status: `Active`, `Beta`, `Deprecated`, `3 open`.
- A category or tag next to a title, where the colour carries the grouping.
- A count attached to a navigation item or a filter chip.

## When not to use

- Anything the user must click to act; use `button` (a badge has no focus, no
  press feedback, and no keyboard path).
- More than about three words. A long label belongs in running text or in a `card`
  header, not in a pill.
- A detailed or urgent message; use `alert`, `toast`, or an inline message with an appropriate announcement.

## API

| Prop        | Type                                                                                             | Default     | Description                                      |
| ----------- | ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------ |
| `variant`   | `"default" \| "secondary" \| "outline" \| "ghost" \| "destructive" \| "link"`                     | `"default"` | Visual weight.                                   |
| `render`    | `ReactElement \| (props, state) => ReactElement`                                                  | –           | Base UI composition; replaces `asChild`.         |
| `className` | `string`                                                                                          | –           | Merged last.                                     |

`data-slot="badge"` and `data-variant` are rendered from the component's state, so
you can restyle per variant from CSS without touching this file. All native span
props are forwarded.

## Motion contract

Authored intensity is **subtle**: Local status replacement, compact quantity reels, readable inline-size continuity and independent opacity presence preserve the native label or link.

| Phase | Properties | Recipe / tokens | Interruptible |
| --- | --- | --- | --- |
| Independent insertion | root opacity | `data.transition/one-shot` | yes |
| Retained removal | root opacity; semantics removed immediately | `exit.fade/one-shot` | yes |
| Content revision | measured inline width; constrained/unverified render axes remain native | `geometry.resize/measured` | yes |
| Status text | changed-only opacity; unchanged text identity retained | `text.change/changed-runs` | yes |
| Direct quantity | changed numeric places, compact reels | `number.roll/reels` | yes |
| Eligible state paint | background, foreground, border and shadow | `state.color/css-transition` | yes |

Full plays applicable effects. Reduced retains short text/presence opacity and eligible colour
feedback; width and numeric values commit immediately. None and a zero recipe clock reach every
target immediately with no delay. A live policy downgrade cancels active writers. Rapid revisions
coalesce to the newest semantic content; no old status or quantity waits in a queue.

Plain spans gain no hover affordance. Actual anchors keep their native hover and focus styles.
Palette switches and caller paint whose contrast is unknown commit immediately, avoiding an unreadable
intermediate foreground/background pair. Focus-within and invalid state settle all owned paint
immediately. Caller colour/opacity/transition ownership is respected.

Badge owns direct string/number display changes and intrinsic width. Fixed or externally constrained
widths, passive row reflow and unverified custom-render geometry follow native layout. A native
`render={<a />}` without custom paint/layout also retains intrinsic width continuity. Growth reaches the final
width immediately when a smaller intermediate shell would hide the new label; safe shrinkage retains
continuity. Rich children keep their original nodes, refs, keys, events and direct SVG selectors.

## Accessibility

- The badge is a `span`, so it is not in the tab order and has no role — the text
  itself is the message.
- Colour is never the only signal: every variant still carries readable text.
- When rendered as a link it inherits the anchor's semantics, focus ring, and
  keyboard behaviour, and gains `[a&]:hover` styles automatically.

## Responsiveness and performance

Badges keep intrinsic width and do not wrap their text. Keep labels short; let the parent wrap a
collection or provide an overflow strategy for long labels.

The initial server, no-JavaScript and hydration presentation remains readable with the exact native
text. Effects enhance later accepted changes; they do not replay the first screen. Base UI composition
still requires hydration for application handlers. No additional item-specific CSS is required beyond
the installed Cadence theme/provider setup.

One inline-size owner coordinates the root; text and reels share bounded transactions with current
semantic output. Unknown geometry or text correspondence takes the immediate native path. T0 is a
compatibility label. Historical source and bundle budgets are advisory during functional migration;
performance governance and device acceptance remain deferred under ADR-023.

## Notes for AI

- Never attach `onClick` to a badge; switch to `button` with `size="sm"`.
- Keep stable keys and pass actual numbers only for quantities; do not parse identifiers or version strings.
- Use `AnimatePresence` when removal must retain a fade, and a surrounding `aria-live` region when changes need announcements.

---

Full index: https://cadence.dev/llms.txt
