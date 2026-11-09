# Hover Card

> Previews of links, profiles, and repositories.

- Registry item: https://cadence.dev/r/hover-card.json
- Install: `npx shadcn@latest add @cadence/hover-card`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/hover-card
```

The action, placement and scope examples compose `@cadence/button`. Install that item when copying those examples.

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
| cadence-provider | `@components/cadence/lib/css-motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-environment.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-transaction.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/popup-presence.tsx` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| cadence-provider | `@components/cadence/lib/motion-ref.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| hover-card | `@components/cadence/hover-card/index.tsx` | [JSON files[].content](https://cadence.dev/r/hover-card.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: hover-card](https://cadence.dev/r/hover-card.json)

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

Copy all nine target files, keeping `hover-card/index.tsx` and the shared
`lib/` directory in the same `cadence/` tree. Preserve relative imports and
the sources' `"use client"` directives. Copy every file in the motion,
utilities and provider payloads, including helpers not imported by Hover
Card directly. The provider files and `motion` package are required imports
even without the optional `CadenceProvider` wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the
copied files. Include the Cadence easing and motion-scale tokens used by the
popup classes. No additional item-specific CSS or external asset is required.
Full fades and scales the card from its anchor; reduced keeps opacity only;
none removes transitions and hidden entry/exit styles. The portalled popup
resolves its own mode and token clock. Standalone components follow the system
motion preference; an optional `CadenceProvider` controls a subtree, and nested
full still respects system reduced motion.

Usage, the top specimen and Trigger delay use only Hover Card. With an action
inside, Placement, Alignment, Logical placement, Controlled preview and
Explicit motion scopes also use
[Button](https://cadence.dev/components/button#installation). Copy its complete
Manual setup, including its npm dependencies and shared files. Logical
placement imports Base UI `DirectionProvider` from the already required
`@base-ui/react` package. Explicit motion scopes uses the included Cadence
provider. Beyond Button's dependencies, the examples need no additional npm
package. The site's preview shell is not consumer setup.

In Next.js App Router, With an action inside needs a caller client module for
its ref, state and keyboard/click handlers; Controlled preview needs one for
its state and event handlers. The other examples and top specimen contain
serializable JSX and element-valued `render` props, so they can be composed
in synchronous Server Components. Caller refs, event handlers,
function-valued `render`, `className(state)` or `style(state)` also need a
caller client boundary. Synchronous `useId` alone does not require one. Keep
the installed client directives and the snippets' existing directives when
copying them unchanged.

Place `HoverCardTrigger` and `HoverCardContent` within the same `HoverCard`
root. Use `defaultOpen` for uncontrolled opening, or `open` / `onOpenChange`
for caller control. External opening needs a unique `triggerId` matching the
trigger's `id`, as in Controlled preview, to keep the card anchored. The
trigger renders an anchor by default: give it a useful `href` and visible
link text. `render={<Button />}` merges onto a button; custom render elements
must preserve supplied props and refs.

`HoverCardContent` already owns the portal, positioner and popup. Its
positioning defaults are `side="bottom"`, `align="center"`, `sideOffset={4}`
and `alignOffset={4}`. Offsets control geometry, and Base UI can flip or shift
the card to avoid collisions. Logical sides need Base UI `DirectionProvider`
as well as DOM `dir`, as shown in Logical placement. Cadence exports no
separate Portal, Positioner, Arrow or Anchor part.

Trigger `delay` and `closeDelay` default to 600ms and 300ms. Pointer entry and
keyboard focus can open the card; focus opening also uses `delay`. Pointer
crossing into the popup keeps it open, and leaving uses the closing delay.
These interaction delays are independent of motion mode, including none.
Escape dismisses the card; Enter on a link keeps its normal navigation.
The action example supplies its own ArrowDown ref bridge to Follow because
the portal does not place that action immediately after the trigger in page
Tab order. Preserve that bridge when copying the example.

Keep the trigger's accessible name and destination useful on their own.
The popup has no dialog role and is not the trigger's accessible description.
All previewed information must also be available at the destination or in
visible page content: touch activation may follow the link without revealing
the preview. Use Popover for an intentionally opened task or essential action.
The caller owns navigation, profile data, Follow state, requests and errors;
the example's Follow action changes local state only.

## Usage

```tsx
"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function ReviewerCard() {
  return (
    <p className="text-sm">
      Reviewed by{" "}
      <HoverCard>
        <HoverCardTrigger render={<a className="underline underline-offset-4" href="/docs/changelog" />}>@linruoxin</HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-medium">Lin Ruoxin</p>
          <p className="text-sm text-muted-foreground">Maintains the motion layer and the registry.</p>
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}
```

## With an action inside

A real local Follow action belongs to this example alone. The supplementary card stays open while its pointer or focus is inside; the profile link remains useful without opening it. Nothing is sent to a server. Once keyboard focus opens this card, ArrowDown moves to Follow using a caller-owned ref. The portal does not itself insert that action immediately after the trigger in the page Tab order.

<ComponentExample name="action" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function FollowReviewer() {
  const follow = useRef<HTMLButtonElement>(null);
  const [following, setFollowing] = useState(false);
  return (
    <HoverCard>
      <HoverCardTrigger onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); follow.current?.focus(); } }} render={<a href="/docs/changelog" className="text-sm underline" />}>Reviewer profile</HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm font-medium">Lin Ruoxin</p>
        <p className="mb-3 text-sm text-muted-foreground">Maintains the motion layer.</p>
        <Button size="xs" variant="secondary" ref={follow} aria-pressed={following} onClick={() => setFollowing((value) => !value)}>
          {following ? "Following" : "Follow"}
        </Button>
      </HoverCardContent>
    </HoverCard>
  );
}
```

## Placement

The preferred side defaults to bottom. Each trigger has its own fixed side and portal. Base UI can flip or shift a card near the viewport edge; these are placement preferences, not a promise to overflow.

<ComponentExample name="sides" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function HoverCardSides() {
  return (<div className="flex flex-wrap gap-3">
      {(["top","right","bottom","left"] as const).map((value) => (
        <HoverCard key={value}>
          <HoverCardTrigger render={<Button variant="outline" />}>{value}</HoverCardTrigger>
          <HoverCardContent side={value} alignOffset={0}>Preview: {value}</HoverCardContent>
        </HoverCard>
      ))}
    </div>);
}
```

## Alignment

Compare all three alignments below their triggers. This example sets alignOffset to zero so the edge or centre is visible; the component default remains 4px.

<ComponentExample name="alignments" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function HoverCardAlignments() {
  return (<div className="flex flex-wrap gap-3">
      {(["start","center","end"] as const).map((value) => (
        <HoverCard key={value}>
          <HoverCardTrigger render={<Button variant="outline" />}>{value}</HoverCardTrigger>
          <HoverCardContent align={value} alignOffset={0}>Preview: {value}</HoverCardContent>
        </HoverCard>
      ))}
    </div>);
}
```

## Logical placement

Logical sides follow the direction provider. In RTL, inline-start prefers the right and inline-end prefers the left; physical sides keep their meaning.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Button } from "@/components/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function LogicalHoverCards() {
  return (<DirectionProvider direction="rtl"><div dir="rtl"><div className="flex flex-wrap gap-3">
      {(["inline-start","inline-end"] as const).map((value) => (
        <HoverCard key={value}>
          <HoverCardTrigger render={<Button variant="outline" />}>{value}</HoverCardTrigger>
          <HoverCardContent side={value} alignOffset={0}>Preview: {value}</HoverCardContent>
        </HoverCard>
      ))}
    </div></div></DirectionProvider>);
}
```

## Trigger delay

The trigger owns delay and closeDelay. This card waits 400ms on pointer entry and 300ms on pointer leave, giving time to cross into the card. The installed Base UI defaults are 600ms and 300ms. Focus also makes the preview reachable.

<ComponentExample name="delay" />

```tsx
"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function DelayedReviewer() {
  return (
    <HoverCard>
      <HoverCardTrigger delay={400} closeDelay={300} render={<a href="/docs/changelog" className="text-sm underline" />}>Delayed profile</HoverCardTrigger>
      <HoverCardContent>Preview after a short pointer pause.</HoverCardContent>
    </HoverCard>
  );
}
```

## Controlled preview

The caller owns open state. The external action targets a unique triggerId so the preview has a real anchor even when opened externally. It remains supplementary and can still close through the normal pointer, focus and Escape paths.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";

export function ControlledReviewer() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>{open ? "Hide preview" : "Show preview"}</Button>
      <HoverCard open={open} onOpenChange={setOpen} triggerId={id}>
        <HoverCardTrigger id={id} render={<a href="/docs/changelog" className="text-sm underline" />}>Controlled profile</HoverCardTrigger>
        <HoverCardContent>Caller-owned profile preview.</HoverCardContent>
      </HoverCard>
    </div>
  );
}
```

## Explicit motion scopes

Ordinary examples inherit the site header. Only this comparison sets a fixed none provider, with a nested full override. The system reduced-motion preference still takes precedence over full.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/cadence/hover-card";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function HoverCardMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <HoverCard>
          <HoverCardTrigger render={<Button variant="outline" />}>Open without motion</HoverCardTrigger>
          <HoverCardContent data-testid="initial-none">Immediate preview</HoverCardContent>
        </HoverCard>
        <CadenceProvider mode="full">
          <HoverCard>
            <HoverCardTrigger render={<Button variant="outline" />}>Open nested full</HoverCardTrigger>
            <HoverCardContent data-testid="nested-full">The OS preference still wins</HoverCardContent>
          </HoverCard>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A preview of what a link leads to: a profile, a repository, a document — enough to decide whether to
  click.
- Context that helps a name make sense — the person behind an `@handle`, the project behind a package.
- A short panel with one or two actions that should not interrupt the page.

## When not to use

- A label for an icon. Use `tooltip`: it is smaller, quicker, and announced as a description.
- Content the user opened on purpose. Use `popover`: hover cards close when the pointer moves on, and
  anything with a task in it deserves a deliberate open.
- Information the user needs to answer a question. Nothing that appears and disappears on hover can be
  the only place it lives.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `HoverCard` | `open`, `defaultOpen`, `onOpenChange` | Base UI root; owns open state. |
| `HoverCardTrigger` | native anchor props, `render`, `delay`, `closeDelay` | The link or button the card describes. |
| `HoverCardContent` | `side`, `align`, `sideOffset`, `alignOffset`, `render`, `className` | Renders portal, positioner, and popup. `side` defaults to `bottom`, `sideOffset` to `4`, `alignOffset` to `4`. |

The portal renders `data-slot="hover-card-portal"`; the popup is `data-slot="hover-card-content"`. There
is no `HoverCardArrow`: upstream's Base UI surface has none, and the card is a surface rather than a
pointer.

## Motion contract

Each portal surface resolves its own mode and token clock. A nested full scope restores timing inside none (subject to the system preference). Live reduced cancels scale or slide and keeps opacity; none cancels transitions and shows the first frame immediately. Base parts accept `className(state)` and `style(state)`; caller values merge last.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | panel `opacity 0 → 1` + `scale 0.96 → 1` from the anchor origin | `popup.anchored` · `duration.fast` | yes |
| exit | panel `opacity → 0` + `scale → 0.96` | `exit.fade` · `duration.fast` | yes |
| reduced | opacity only, no scale; the duration tokens run at 0.6× (96ms) | `exit.fade` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the panel appears on the first frame | – | – |

Same anchored motion as `popover` and `tooltip`: the scale starts at `--transform-origin`, which Base UI
points at the trigger. Hover cards close when the pointer leaves, so the exit has to be short; `fast` is
the anchored-surface duration the three share.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Focusing the trigger opens the card. In the action example, ArrowDown moves to Follow; Tab otherwise follows the page order. |
| Escape | Closes the card and returns focus to the trigger. |
| Enter | Follows the trigger link, or activates the focused button. |
| Space | Activates a focused button; native links keep their normal Space scrolling behavior. |
| ArrowDown | In the action example, moves from the open trigger to Follow through the caller-owned ref. |

Keyboard focus opens the card for the same reason it does in a tooltip: without it, the content would
exist only for pointer users.

## Accessibility

- The trigger carries the accessible name; the card is supplementary. That is why Cadence does not give
  the popup `role="dialog"` or wire it as the trigger's description: a panel that may hold several
  paragraphs and a button is neither a name nor a description, and a screen reader reading it on every
  focus would be noise.
- The action example supplies an explicit ArrowDown focus bridge into its portal. Do not assume the
  portal puts actions directly after the trigger in page Tab order; use a popover for a deliberate task.
- Hover is never the only path: focus opens it too, and Escape closes it, so the card never traps a
  keyboard user.
- If the card is the only place a piece of information exists, it is in the wrong component — move it
  into the page or into a `popover`.

## Responsive behavior

The panel is `w-64` with `p-4`; Base UI flips it to another side and shifts the alignment when the
viewport cannot fit it. On touch devices there is no hover: tapping the trigger link may navigate
directly without revealing the preview. All previewed information must also be available at the
destination or in visible page content.

## Performance

- Mounted only while open, so a page of links carries no extra popup trees.
- Animates `opacity` and `scale` only: no layout reads, no `top`/`left` transition, no JavaScript
  animation loop. The card follows the anchor through the positioner, not through React state.

## Notes for AI

- Use `hover-card` only for a preview of the linked thing; use `popover` for anything the user opens to
  act, and `tooltip` for a label.
- The trigger must have its own text or `aria-label`; the card is not its name.
- Keep the card small: a person, a repository, a document summary, one action. If it needs scrolling, it
  wants to be a `popover` or a page.

---

Full index: https://cadence.dev/llms.txt
