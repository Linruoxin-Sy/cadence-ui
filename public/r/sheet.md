# Sheet

> Filters, details, and settings that keep the page in view.

- Registry item: https://cadence.dev/r/sheet.json
- Install: `npx shadcn@latest add @cadence/sheet`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/sheet
```

This also installs `button`, which the sheet uses for its close control and its footer actions.
Install `@cadence/checkbox` and `@cadence/field` for the filter composition, and `@cadence/input` for the controlled form.

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react class-variance-authority lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.
- [@cadence/button](https://cadence.dev/r/button.json) — direct registry dependency.

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
| button | `@components/cadence/button/index.tsx` | [JSON files[].content](https://cadence.dev/r/button.json) |
| sheet | `@components/cadence/sheet/index.tsx` | [JSON files[].content](https://cadence.dev/r/sheet.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: button](https://cadence.dev/r/button.json)

[Source files: sheet](https://cadence.dev/r/sheet.json)

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

Copy all ten files in the target list, including `button/index.tsx` and every
shared `lib/` file. Keep the mirrored `cadence/` tree, relative imports and
`"use client"` directives intact. Button is required by Sheet's built-in close
control even when your trigger is a native button. The panel and backdrop use
CSS transitions, but Button and the provider imports still require `motion`;
wrapping your application in `CadenceProvider` is optional.

Complete the base theme setup linked above, including Cadence's easing tokens,
and ensure Tailwind scans the copied files. There is no additional Sheet-specific
CSS or asset. Each portalled panel and backdrop resolves its own motion clock,
including provider `timeScale`: full fades the backdrop and slides/fades the
panel, reduced keeps opacity only, and none removes transitions and hidden
entry/exit opacity from the first frame. Without a wrapper, Sheet follows the
system motion preference. An explicit nested full scope still respects the
system reduced-motion preference.

Usage and the top filter specimen additionally need [Checkbox](/components/checkbox)
and [Field](/components/field). Controlled form needs Field and
[Input](/components/input). Install the items used by the example you copy:

```install
npx shadcn@latest add @cadence/checkbox @cadence/field @cadence/input
```

For manual installation, follow those pages' Manual tabs too. The filter adds
`checkbox/index.tsx`, `field/index.tsx`, `label/index.tsx` and
`separator/index.tsx`; the controlled form adds `field/index.tsx`,
`label/index.tsx`, `separator/index.tsx` and `input/index.tsx`. Reuse the shared
files already listed here. These compositions add no npm packages beyond
Sheet's complete dependency command. The remaining examples need only Sheet,
the included Button and, for Explicit motion scopes, the included provider.
The built-in close icon comes from the required `lucide-react` dependency.
The site's preview shell is not consumer setup.

In Next.js App Router, Usage, the top filter specimen and Controlled form need
a client module for their state and event handlers. A long list needs one for
its initial-focus ref. The four edges, Without the built-in close button, Modal
behavior and Explicit motion scopes can be composed in a synchronous Server
Component with their shown JSX elements and serializable props; their existing
client directives may also be kept. `render={<Button />}` and synchronous
`useId` alone do not require a caller client boundary. A ref, event handler,
`useState`, `useRef`, function-valued `render`, `className(state)` or `style(state)`
does require that boundary. Preserve the installed sources' client directives.

`SheetContent` already includes its portal and backdrop; do not duplicate them
in the standard composition. It defaults to the right edge with the corner
close button visible. Use `side` for the four physical edges, and keep a visible
close action when setting `showCloseButton={false}`. Give every panel a
`SheetTitle` and meaningful supporting text through `SheetDescription`. Default
modal behavior traps focus and locks page scrolling; `modal={false}` and
`modal="trap-focus"` change those behaviors but still keep SheetContent's
backdrop. Base UI handles focus, Escape, outside dismissal and focus return.
The caller owns controlled open state, filter application, draft/saved values,
submission, validation and persistence. Cancel preserves the controlled
example's draft. For long content, keep the header and footer outside the
`min-h-0 flex-1 overflow-y-auto` body and supply the initial focus target shown
below. Top and bottom panels size to content, so constrain tall content for
your viewport. Hydrated interactions require JavaScript.

## Usage

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function FiltersSheet() {
  const id = useId();
  const [openOnly, setOpenOnly] = useState(true);
  const [applied, setApplied] = useState("Open only");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open filters</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Choose filters for this local view.</SheetDescription>
          </SheetHeader>
          <FieldGroup className="px-4">
            <Field orientation="horizontal">
              <Checkbox id={id} checked={openOnly} onCheckedChange={setOpenOnly} />
              <FieldLabel htmlFor={id}>Open only</FieldLabel>
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button variant="outline" onClick={() => setOpenOnly(false)}>
              Clear selection
            </Button>
            <SheetClose render={<Button onClick={() => setApplied(openOnly ? "Open only" : "All items")} />}>
              Apply filters
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <p role="status" className="text-sm text-muted-foreground">
        {applied}
      </p>
    </div>
  );
}
```

## The four edges

Each trigger opens an independent sheet at a fixed edge. Right is the default. Side panels use three quarters of the viewport with a desktop width cap; top and bottom panels span the width and size to content.

<ComponentExample name="edges" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function SheetEdges() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["right", "left", "top", "bottom"] as const).map((side) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" />}>{side}</SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{side} sheet</SheetTitle>
              <SheetDescription>A fixed {side} edge.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
```

## Without the built-in close button

showCloseButton=false removes only the corner control. Keep a clear footer close action, Escape and outside dismissal. This example provides an explicit Done action.

<ComponentExample name="footer-close" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function FooterCloseSheet() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open footer close</SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>View details</SheetTitle>
          <SheetDescription>The footer provides the visible close action.</SheetDescription>
        </SheetHeader>
        <p className="px-4 text-sm">A short details panel.</p>
        <SheetFooter>
          <SheetClose render={<Button />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

## A long list

Keep the header, close button and footer outside the scrolling body. A min-height of zero lets the middle flex child shrink. Initial focus on the title opens the list at its beginning without jumping to a footer control. The entries link to the changelog, so Tab reaches the scrolling body and PageDown scrolls it without requiring a pointer.

<ComponentExample name="long-list" />

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/cadence/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function LongSheet() {
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Browse activity</SheetTrigger>
      <SheetContent initialFocus={title}>
        <SheetHeader>
          <SheetTitle ref={title} tabIndex={-1}>
            Activity
          </SheetTitle>
          <SheetDescription>Scroll the list while the footer stays in view.</SheetDescription>
        </SheetHeader>
        <section aria-label="Activity entries"  className="min-h-0 flex-1 overflow-y-auto px-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"><ol className="flex flex-col gap-4">
          {Array.from({ length: 30 }, (_, index) => (
            <li key={index.toString()} className="rounded-md border p-3 text-sm">
              <a href="/docs/changelog" className="underline underline-offset-4">Activity {index + 1}: documentation updated.</a>
            </li>
          ))}
        </ol></section>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

## Controlled form

The caller owns open, draft and saved values. Save updates local state and closes; Cancel leaves the saved value unchanged and preserves the draft for reopening. No request or validation is performed. Each form owns its label ID.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Field, FieldGroup, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function ControlledSheet() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("Weekly digest");
  const [saved, setSaved] = useState("Weekly digest");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="outline" />}>Edit title</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit title</SheetTitle>
            <SheetDescription>Save changes to this local example.</SheetDescription>
          </SheetHeader>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(draft);
              setOpen(false);
            }}
          >
            <FieldGroup className="px-4">
              <Field>
                <FieldLabel htmlFor={id}>Title draft</FieldLabel>
                <Input id={id} value={draft} onValueChange={setDraft} />
              </Field>
            </FieldGroup>
            <SheetFooter>
              <SheetClose render={<Button type="button" variant="outline" />}>Cancel</SheetClose>
              <Button type="submit">Save title</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      <p role="status" className="text-sm">
        Saved: {saved}
      </p>
    </div>
  );
}
```

## Modal behavior

Compare modal=true (scroll lock and focus trap), false (page interaction remains available), and trap-focus (focus trap without scroll lock). SheetContent always renders its backdrop, including false and trap-focus; use a suitable composition when the page must remain visually unobscured.

<ComponentExample name="modality" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function SheetModality() {
  return (
    <div className="flex flex-wrap gap-3">
      {([true, false, "trap-focus"] as const).map((modal) => (
        <Sheet key={String(modal)} modal={modal}>
          <SheetTrigger render={<Button variant="outline" />}>{String(modal)}</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Mode: {String(modal)}</SheetTitle>
              <SheetDescription>Focus and scrolling follow the root modal setting.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose render={<Button variant="outline" />}>Done</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      ))}
    </div>
  );
}
```

## Explicit motion scopes

Ordinary sheets inherit the header clock. This comparison alone fixes none and then restores full in a nested scope. The OS reduced-motion preference still wins. Both the panel and its backdrop resolve the local clock.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/cadence/sheet";

export function SheetMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Open without motion</SheetTrigger>
          <SheetContent data-testid="initial-none">
            <SheetHeader>
              <SheetTitle>Immediate sheet</SheetTitle>
              <SheetDescription>No entering motion.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <CadenceProvider mode="full">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Open nested full</SheetTrigger>
            <SheetContent data-testid="nested-full">
              <SheetHeader>
                <SheetTitle>Nested full sheet</SheetTitle>
                <SheetDescription>The OS preference still wins.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A task that should keep the page in view: filters, a details panel, settings for the thing behind it.
- A form too tall or too wide for a `popover`, opened on purpose and dismissed on purpose.
- Mobile navigation or a secondary menu, where a full dialog would feel heavy.

## When not to use

- A confirmation that must be answered before anything continues. Use `alert-dialog`.
- A hint about a control. Use `tooltip` or `hover-card`.
- A flow with its own steps and URL. That is a page, not an overlay.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Sheet` | `open`, `defaultOpen`, `onOpenChange`, `modal` | Base UI dialog root. |
| `SheetTrigger` | native button props, `render` | Opens the sheet. |
| `SheetContent` | `side` (`"right" \| "left" \| "top" \| "bottom"`), `showCloseButton`, `render`, `className` | Renders portal, overlay, and popup. |
| `SheetOverlay` | `className` | Only needed when replacing `SheetContent`. |
| `SheetPortal` | `container` | Available for a custom portal target. |
| `SheetClose` | native button props, `render` | Closes the sheet. |
| `SheetHeader` / `SheetFooter` | `className` | Padding and stacking only. |
| `SheetTitle` | `className` | Required accessible name. |
| `SheetDescription` | `className` | Supporting text. |

## Motion contract

Authored intensity is **medium**: Sheet opens and closes its existing popup surface; content and native focus retain their current owners.

Each portal surface resolves its own mode and token clock. A nested full scope restores timing inside none (subject to the system preference). Live reduced cancels scale or slide and keeps opacity; none cancels transitions and shows the first frame immediately. Base parts accept `className(state)` and `style(state)`; caller values merge last.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | panel `opacity 0 → 1` + `translate` from its own size; backdrop `opacity 0 → 1` | `popup.anchored/css-transition` · `duration.base` / `duration.fast` | yes |
| exit | panel `opacity → 0` + `translate` back off its edge; backdrop `opacity → 0` | `exit.fade/css-transition` · panel `duration.base` / backdrop `duration.fast` | yes |
| reduced | opacity only, no translate; at `timeScale={1}`, default duration tokens run at 0.6×: panel 132ms / backdrop 96ms | `exit.fade/css-transition` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the panel is in place on the first frame | – | – |

The slide is `translate-*-full`, the panel's own width or height, not a fixed distance: a side panel
should enter from off its edge at every size, and a distance token would need one value per side. The
transition list names `translate` rather than `transform` because Tailwind v4's `translate-*` utilities
write the property individually — the same reason the dialogs transition `scale`.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Cycles focus inside the sheet; focus never reaches the page behind it. |
| Escape | Closes the sheet and returns focus to the trigger. |
| Enter / Space | Activates the focused control. |

The panel and backdrop resolve local token clocks from the effective mode and time scale, including
full inside a parent none scope. None also removes starting/ending opacity classes, so no hidden
starting frame remains. Caller state callback classes/styles still merge last.

## Accessibility

- Base UI provides `role="dialog"`, `aria-modal`, `aria-labelledby` / `aria-describedby`, focus
  trapping, focus return, scroll lock, and Escape handling.
- `SheetTitle` is required: a sheet without an accessible name is invalid. `SheetDescription` becomes
  the description, so put the consequence there, not in a second paragraph.
- The built-in close control is a button with a screen-reader-only "Close" label; it sits in the
  top-right corner at every side and never traps the focus ring.
- A destructive footer action uses `variant="destructive"` plus a specific verb; the colour is never the
  only signal.

## Responsive behavior

A right or left sheet is `w-3/4` capped at `sm:max-w-sm`; a top or bottom sheet spans the width with an
auto height. Long content should scroll inside a wrapper (see "A long list"), so the footer stays
reachable and the page behind does not move.

## Performance

- One popup tree is mounted only while open; the overlay and panel unmount after the exit.
- Animates `opacity` and `translate` only: the panel is `fixed` at its edge, so nothing reflows and the
  page behind never reads layout.
- The close control is a `Button`, so its press feedback obeys the same motion mode as the sheet.

## Notes for AI

- Use `sheet` for a task beside the page; use `alert-dialog` when the answer must be deliberate, and
  `popover` when the content is small and anchored to a control.
- Always render `SheetTitle`; put the side effect of closing (reset, discard) in the footer, not in the
  title.
- Name the footer action after its effect ("Apply filters"), not "OK".
- If the sheet opens a form, remember P11: the sheet renders invalid state from `aria-invalid` but never
  validates anything itself.

---

Full index: https://cadence.dev/llms.txt
