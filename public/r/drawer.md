# Drawer

> Quick tasks on touch screens, such as share or move.

- Registry item: https://cadence.dev/r/drawer.json
- Install: `npx shadcn@latest add @cadence/drawer`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/drawer
```

The examples compose `@cadence/button`, `@cadence/field` and `@cadence/input` as needed.
Install those items when copying their corresponding examples.

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
| drawer | `@components/cadence/drawer/index.tsx` | [JSON files[].content](https://cadence.dev/r/drawer.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: drawer](https://cadence.dev/r/drawer.json)

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
intact. The popup and backdrop use CSS transitions, but the provider imports
still require `motion`. The provider files are required; wrapping your
application in `CadenceProvider` is optional.

Complete the base theme setup linked above, including Cadence's easing tokens,
and ensure Tailwind scans the copied files. There is no additional
Drawer-specific CSS or asset in these payloads. Each portalled popup and
backdrop resolves its own motion clock, including provider `timeScale`: full
slides and fades the popup, reduced keeps the fade and drops the closed-state
slide, and none removes authored transitions and hidden entry/exit opacity
from the first frame. Direct finger tracking remains in all three modes.
Without a wrapper, Drawer follows the system motion preference; a nested full
scope still respects the system reduced-motion preference.

Usage, the top Move conversation specimen and every body example additionally
use [Button](/components/button). Controlled draft also needs
[Field](/components/field) and [Input](/components/input). Install the items
used by the example you copy:

```install
npx shadcn@latest add @cadence/button @cadence/field @cadence/input
```

For manual installation, follow those pages' Manual tabs too. Button adds
`button/index.tsx`; Controlled draft additionally adds `field/index.tsx`,
`label/index.tsx`, `separator/index.tsx` and `input/index.tsx`. Reuse the shared
files already listed here. Button and Field require this extra npm package;
Input adds none beyond Drawer's complete dependency command:

```package-manager
npm install class-variance-authority
```

Explicit motion scopes uses the included provider. The site's preview shell
is not consumer setup.

In Next.js App Router, Usage, the top Move conversation specimen, Snap points
and Controlled draft need a client module for their state and event handlers.
A visible swipe handle, Swiping from another edge, Non-modal and focus-only
drawers, and Explicit motion scopes can be composed in a synchronous Server
Component with their shown JSX elements and serializable props; their existing
client directives may also be kept. `render={<Button />}` and synchronous
`useId` alone do not require a caller client boundary. A ref, event handler,
`useState`, function-valued `render`, `className(state)` or `style(state)` does
require that boundary. Preserve the installed sources' client directives.

`DrawerContent` already includes its portal, viewport, popup and scrollable
content region, plus a backdrop only when `modal={true}`. Do not duplicate
these parts in the standard composition. Drawer defaults to `swipeDirection="down"`,
`modal={true}` and no handle. Direction selects both the edge and the outward
dismissal gesture: down/up are vertical, left/right are horizontal. The optional
handle is an aria-hidden visual cue; retain a real `DrawerClose` and a
`DrawerTitle`, with meaningful supporting text through `DrawerDescription`.
Trigger and Close use native buttons by default; `render` composes another
element with Base UI's props and ref.

Default modal behavior traps focus and locks page scrolling. `modal={false}`
allows interaction with the page; `modal="trap-focus"` traps focus without
scroll lock. Those two modes have no backdrop in this composition. Base UI
owns focus, Escape, outside dismissal, focus return and swipe recognition.
Vertical snap points are Base UI positions; the Snap points example controls
`snapPoint` through `onSnapPointChange`, Expand and Peek. The caller owns open
and snap state when controlled, action data, draft/saved values, submission,
validation and persistence. Move conversation and Save only update local
example state; Cancel preserves the draft without updating the saved value.
The content region scrolls inside the popup, including its header and footer;
constrain tall content to your viewport. Hydrated interactions require JavaScript.

## Usage

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";

export function MoveConversation() {
  const [destination, setDestination] = useState("Not moved");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Drawer showSwipeHandle>
        <DrawerTrigger render={<Button variant="outline" />}>Move conversation</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move conversation</DrawerTitle>
            <DrawerDescription>Drag down to dismiss, or choose a local destination.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-1 py-4">
            {["Inbox", "Archive", "Read later"].map((value) => (
              <DrawerClose
                key={value}
                render={<Button variant="ghost" className="justify-start" onClick={() => setDestination(value)} />}
              >
                {value}
              </DrawerClose>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm text-muted-foreground">
        {destination}
      </p>
    </div>
  );
}
```

## A visible swipe handle

The handle is a visual gesture cue, aria-hidden rather than a focusable close button. Compare the default without a handle and showSwipeHandle=true. Both retain a real Close action and Escape.

<ComponentExample name="handle" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";

export function DrawerHandles() {
  return (
    <div className="flex flex-wrap gap-3">
      {[false, true].map((handle) => (
        <Drawer key={String(handle)} showSwipeHandle={handle}>
          <DrawerTrigger render={<Button variant="outline" />}>
            {handle ? "With handle" : "Without handle"}
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Swipe cue</DrawerTitle>
              <DrawerDescription>Drag down or use the close action.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}
```

## Swiping from another edge

Every direction has its own fixed trigger. down/up use the vertical axis; left/right use the horizontal axis. The direction is the dismissal gesture as well as the edge placement. Try an outward touch swipe or use Close.

<ComponentExample name="directions" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";

export function DrawerDirections() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["down", "up", "left", "right"] as const).map((direction) => (
        <Drawer key={direction} swipeDirection={direction} showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>{direction}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{direction} drawer</DrawerTitle>
              <DrawerDescription>Swipe {direction} to dismiss.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}
```

## Snap points

This tall drawer rests at half or full height. The caller owns snapPoint, so Expand and Peek demonstrate external updates of the same panel, not a generic placement selector. Touch dragging still follows Base UI snap behavior. The backdrop follows swipe progress.

<ComponentExample name="snap-points" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";

export function SnappingDrawer() {
  const [snap, setSnap] = useState<number | string | null>(0.5);
  return (
    <Drawer showSwipeHandle snapPoints={[0.5, 1]} snapPoint={snap} onSnapPointChange={setSnap}>
      <DrawerTrigger render={<Button variant="outline" />}>Open snap points</DrawerTrigger>
      <DrawerContent className="h-[80dvh]">
        <DrawerHeader>
          <DrawerTitle>Reading queue</DrawerTitle>
          <DrawerDescription>Expand to read more, or drag between snap points.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-wrap gap-2 py-4">
          <Button variant="outline" onClick={() => setSnap(1)}>
            Expand
          </Button>
          <Button variant="outline" onClick={() => setSnap(0.5)}>
            Peek
          </Button>
        </div>
        <p role="status" className="text-sm">
          Snap: {String(snap)}
        </p>
        <ol className="flex flex-col gap-4 py-4">
          {Array.from({ length: 20 }, (_, index) => (
            <li key={index.toString()} className="rounded-md border p-3 text-sm">
              Reading item {index + 1}
            </li>
          ))}
        </ol>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

## Non-modal and focus-only drawers

Compare true, false and trap-focus. Only true renders a backdrop and locks page scrolling. false allows page focus; trap-focus keeps focus inside without scroll lock. Close controls remain available in every mode.

<ComponentExample name="modality" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";

export function DrawerModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {([true, false, "trap-focus"] as const).map((modal) => (
        <Drawer key={String(modal)} modal={modal} showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>{String(modal)}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Mode: {String(modal)}</DrawerTitle>
              <DrawerDescription>Focus and scrolling follow this mode.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="pt-4">
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </div>
  );
}
```

## Controlled draft

The caller owns open and draft state. Save records only local example state and closes. Cancel preserves the draft for reopening without changing the saved value. No network request or validation is implied.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

export function ControlledDrawer() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("Read later");
  const [saved, setSaved] = useState("Read later");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerTrigger render={<Button variant="outline" />}>Edit destination</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Destination label</DrawerTitle>
            <DrawerDescription>Rename this local example destination.</DrawerDescription>
          </DrawerHeader>
          <form
            className="flex flex-col gap-4 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(draft);
              setOpen(false);
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={id}>Destination draft</FieldLabel>
                <Input id={id} value={draft} onValueChange={setDraft} />
              </Field>
            </FieldGroup>
            <DrawerFooter>
              <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
              <Button type="submit">Save destination</Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      <p role="status" className="text-sm">
        Saved: {saved}
      </p>
    </div>
  );
}
```

## Explicit motion scopes

Ordinary drawers inherit the header. This example alone fixes none and nests a full override, subject to the OS preference. Direct finger tracking remains in every mode; none removes the authored enter, exit and release duration.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/cadence/drawer";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function DrawerMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Drawer showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>Open without motion</DrawerTrigger>
          <DrawerContent data-testid="initial-none">
            <DrawerHeader>
              <DrawerTitle>Immediate drawer</DrawerTitle>
              <DrawerDescription>No authored transition.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <CadenceProvider mode="full">
          <Drawer showSwipeHandle>
            <DrawerTrigger render={<Button variant="outline" />}>Open nested full</DrawerTrigger>
            <DrawerContent data-testid="nested-full">
              <DrawerHeader>
                <DrawerTitle>Nested full drawer</DrawerTitle>
                <DrawerDescription>The OS preference still wins.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A short task opened from the bottom of the screen, where the thumb is: move to, share, quick actions.
- A list or explanation that the page behind should stay visible for — a bottom sheet covers the bottom,
  not the context.
- A panel the user expects to swipe away, because that is how sheets behave on touch devices.

## When not to use

- A decision that must be answered. Use `alert-dialog`; a drawer can be dragged shut.
- A hint on a control. Use `tooltip` or `hover-card`.
- A long multi-step flow. Use a page or a `sheet` with a footer; dragging half-way through a form is a
  worse experience than a full surface.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Drawer` | `open`, `defaultOpen`, `onOpenChange`, `modal`, `snapPoints`, `swipeDirection`, `showSwipeHandle` | `showSwipeHandle` is additive; `swipeDirection` defaults to `"down"` and `modal` to `true`. |
| `DrawerTrigger` | native button props, `render` | Opens the drawer. |
| `DrawerContent` | `render`, `className` | Renders portal, overlay (when modal), viewport, popup, and content. |
| `DrawerOverlay` | `className` | Only needed when replacing `DrawerContent`. |
| `DrawerSwipeHandle` | `className` | The handle; rendered for you when `showSwipeHandle` is set. |
| `DrawerClose` | native button props, `render` | Closes the drawer. |
| `DrawerHeader` / `DrawerFooter` | `className` | Stacking and spacing only. |
| `DrawerTitle` | `className` | Required accessible name. |
| `DrawerDescription` | `className` | Supporting text. |

## Motion contract

Each portal surface resolves its own mode and token clock. A nested full scope restores timing inside none (subject to the system preference). Live reduced cancels scale or slide and keeps opacity; none cancels transitions and shows the first frame immediately. Base parts accept `className(state)` and `style(state)`; caller values merge last.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | sheet `opacity 0 → 1` + `transform` from `--closed-transform`; backdrop `opacity 0 → 1` | `popup.anchored/css-transition` · `duration.slow` / `duration.fast` | yes |
| drag | `transform` follows `--drawer-swipe-movement-*`; backdrop opacity is `1 - --drawer-swipe-progress` | Base UI gesture (no authored recipe) | yes (it is the gesture) |
| exit | sheet back to `--closed-transform` + `opacity → 0`; backdrop `opacity → 0` | `exit.fade/css-transition` · `duration.slow` / `duration.fast` | yes |
| reduced | fade only: the closed-state slide is dropped, so the sheet appears and disappears in place | `exit.fade/css-transition` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the sheet is in place on the first frame | – | – |

The drag keeps tracking the finger under `reduced`: that movement is the user's own, not authored motion,
and a sheet that ignored the drag would be worse than one that follows it. The release animation uses the
token duration rather than a velocity-scaled one — the swipe physics decide *where* the sheet settles,
the token decides how long the settle takes.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Cycles focus inside a modal drawer. |
| Escape | Closes the drawer and returns focus to the trigger. |
| Enter / Space | Activates the focused control. |

## Accessibility

- Base UI provides `role="dialog"`, `aria-modal`, `aria-labelledby` / `aria-describedby`, focus
  trapping, focus return, scroll lock, and Escape handling while the drawer is modal.
- `DrawerTitle` is required: a drawer without an accessible name is invalid.
- The swipe handle is `aria-hidden="true"` and is never the only way out. A user who cannot drag gets
  the close controls, Escape, and the overlay press (for a modal drawer).
- The content region scrolls on its own (`overflow-y-auto`), so a long list inside the sheet does not
  move the page behind it.

## Responsive behavior

The default sheet sits at the bottom, spans the width, and caps its height at `calc(100dvh - 3rem)` so a
strip of the page stays visible. `swipeDirection="left"` / `"right"` becomes a side panel at `w-3/4`,
capped at `max-w-sm` from `sm` up. Snap points change the resting height without changing any of that
geometry.

## Performance

- The drag writes CSS variables and a `transform`; it never touches layout or React state per frame.
- The backdrop opacity is a `calc()` on the same variable, so the page behind dims as the sheet moves
  without a second animation.
- Entry and exit animate `transform` and `opacity` only. Nothing is measured during render.

## Notes for AI

- Use `drawer` for a short touch-first task from the bottom edge; use `sheet` for a side panel that
  holds a form, and `alert-dialog` when the answer must be deliberate.
- Always render `DrawerTitle`. `DrawerDescription` is the second line of the announcement.
- Never make the swipe the only dismissal: keep a `DrawerClose`, and let Escape work.
- For a list of actions, each row is a `DrawerClose` so choosing one closes the sheet.

---

Full index: https://cadence.dev/llms.txt
