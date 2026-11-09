# Popover

> Filters, share links, and other controls tied to a trigger.

- Registry item: https://cadence.dev/r/popover.json
- Install: `npx shadcn@latest add @cadence/popover`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/popover
```

The examples compose `@cadence/button`, `@cadence/checkbox`, `@cadence/label`, `@cadence/field`,
and `@cadence/input` as needed. Install those items when copying their corresponding examples.

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
| popover | `@components/cadence/popover/index.tsx` | [JSON files[].content](https://cadence.dev/r/popover.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: popover](https://cadence.dev/r/popover.json)

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

Copy all nine target files, keeping `popover/index.tsx` and the shared `lib/`
directory in the same `cadence/` tree. Preserve relative imports and the
sources' `"use client"` directives. Copy every file in the motion, utilities
and provider payloads, including helpers not imported by Popover directly.
The provider files and `motion` package are required imports even when you
omit the optional provider wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the
copied files. Include the Cadence easing and motion-scale tokens used by the
popup classes. No additional item-specific CSS or external asset is required.
Full fades and scales the panel from its anchor; reduced keeps opacity only;
none removes the transitions and hidden entry/exit styles. The portalled popup
resolves its own mode and token clock. Standalone components follow the system
motion preference; an optional `CadenceProvider` controls a subtree, and nested
full still respects system reduced motion.

The examples need additional registry items. Copy each item's complete Manual
setup, including its npm dependencies and shared files:

- [Button](https://cadence.dev/components/button#installation) is used by Usage,
  the top specimen and every body example.
- [Checkbox](https://cadence.dev/components/checkbox#installation) and
  [Label](https://cadence.dev/components/label#installation) are used by Usage,
  the top specimen and Column visibility. Checkbox also requires `lucide-react`.
- [Field](https://cadence.dev/components/field#installation) and
  [Input](https://cadence.dev/components/input#installation) are used by With a form.

Logical sides and RTL imports Base UI `DirectionProvider`, and Modal when it
has to be imports Base UI `Popover.Close`; both come from the already required
`@base-ui/react` package. Explicit motion scopes uses the included provider.
The site's preview shell is not consumer setup.

In Next.js App Router, Usage, Column visibility, With a form, Controlled and
the top specimen need a caller client module for their state and handlers.
Positioned by side, Aligned to the trigger, Logical sides and RTL, Modal when
it has to be and Explicit motion scopes contain serializable JSX and
element-valued `render` props, so they can be composed in synchronous Server
Components. Caller refs, event handlers, function-valued `render`,
`className(state)` or `style(state)` also need a caller client boundary.
Synchronous `useId` alone does not require one. Keep the installed client
directives and the snippets' existing directives when copying them unchanged.

Place the trigger and content within the same `Popover` root. Use
`defaultOpen` for uncontrolled opening, or `open` / `onOpenChange` for caller
control. For an external opener, use a unique `triggerId` matching the trigger's
`id` so the panel stays anchored. `PopoverTrigger` renders a button by default;
`render={<Button />}` merges the trigger onto that button. Custom render
elements must preserve supplied props and refs.

`PopoverContent` already owns the portal, positioner and popup. Its positioning
defaults are `side="bottom"`, `align="center"`, `sideOffset={4}` and
`alignOffset={0}`; offsets control geometry, not animation. Base UI can flip
or shift the panel to avoid collisions. Logical sides need Base UI
`DirectionProvider` as well as DOM `dir`, as shown in the RTL example.
Cadence exports no separate Portal, Positioner, Anchor, Arrow or Close part.
Include `PopoverTitle` for an accessible name and `PopoverDescription` for
supporting context. Popup props such as `initialFocus` and `finalFocus` pass
through; Base UI manages ARIA associations and focus return.

The root is non-modal by default. Enter or Space opens from the trigger;
Escape and outside presses dismiss, and Tab can leave the non-modal panel.
`modal={true}` blocks outside interaction and locks desktop page scrolling;
`modal="trap-focus"` avoids that scroll lock. Both modal settings need a
registered Base UI `Popover.Close` inside the content to activate focus
trapping, as in Modal when it has to be. Modal popovers still allow dismissal;
provide the close control for touch screen readers, and account for Base UI's
touch scrolling behavior.

The caller owns column selection, form drafts, saved values, requests,
validation, errors, persistence and controlled closing. In With a form, Save
handles submission and closes explicitly; dismissing does not save, and the
draft survives in caller state. Native `required` belongs to that example's
input. Popover performs no validation or automatic saving; render supplied
invalid state on the relevant controls with `aria-invalid` / `data-invalid`.

## Usage

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";

import { Label } from "@/components/cadence/label";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function ColumnPopover() {
  const id = useId();
  const [columns, setColumns] = useState(["Name", "Status", "Owner"]);
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Visible columns</PopoverTitle>
          <PopoverDescription>{columns.length} of four columns are shown.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 flex flex-col gap-2">
          {["Name", "Status", "Owner", "Updated"].map((column) => (
            <div key={column} className="flex items-center gap-2">
              <Checkbox
                id={`${id}-${column}`}
                checked={columns.includes(column)}
                onCheckedChange={(checked) =>
                  setColumns((previous) =>
                    checked ? [...previous, column] : previous.filter((value) => value !== column),
                  )
                }
              />
              <Label htmlFor={`${id}-${column}`} className="font-normal">
                {column}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

## Column visibility

The panel contains real checkboxes with independent caller-owned selection and unique label IDs. Its description follows the visible column count. This is the same common composition used above; ordinary examples inherit the site header.

<ComponentExample name="columns" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { Checkbox } from "@/components/cadence/checkbox";

import { Label } from "@/components/cadence/label";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function ColumnPopover() {
  const id = useId();
  const [columns, setColumns] = useState(["Name", "Status", "Owner"]);
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Visible columns</PopoverTitle>
          <PopoverDescription>{columns.length} of four columns are shown.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 flex flex-col gap-2">
          {["Name", "Status", "Owner", "Updated"].map((column) => (
            <div key={column} className="flex items-center gap-2">
              <Checkbox
                id={`${id}-${column}`}
                checked={columns.includes(column)}
                onCheckedChange={(checked) =>
                  setColumns((previous) =>
                    checked ? [...previous, column] : previous.filter((value) => value !== column),
                  )
                }
              />
              <Label htmlFor={`${id}-${column}`} className="font-normal">
                {column}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

## Positioned by side

The four physical sides are separate fixed instances. Base UI flips a panel when space is insufficient, so the requested side is a preference rather than a guarantee. sideOffset controls the gap, not an animation distance.

<ComponentExample name="sides" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function PopoverSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outline" />}>{side}</PopoverTrigger>
          <PopoverContent side={side} sideOffset={8} className="w-48">
            <PopoverHeader>
              <PopoverTitle>{side} placement</PopoverTitle>
              <PopoverDescription>Base UI can flip this panel to avoid a collision.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}
```

## Aligned to the trigger

Start, center, and end alignments are fixed instances on the bottom side. alignOffset is zero here; the caller can change the numeric offset without changing the motion recipe. Collision handling can shift the final position.

<ComponentExample name="alignments" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function PopoverAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <Popover key={align}>
          <PopoverTrigger render={<Button variant="outline" />}>{align}</PopoverTrigger>
          <PopoverContent align={align} alignOffset={0} className="w-48">
            <PopoverHeader>
              <PopoverTitle>{align} alignment</PopoverTitle>
              <PopoverDescription>Aligned to this trigger along the cross axis.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}
```

## Logical sides and RTL

inline-start and inline-end follow reading direction. This RTL example supplies Base UI DirectionProvider as well as the DOM dir attribute; setting DOM direction alone does not configure Base UI positioning. Each logical side has its own trigger.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";

import { Button } from "@/components/cadence/button";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function LogicalPopovers() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Popover key={side}>
            <PopoverTrigger render={<Button variant="outline" />}>{side}</PopoverTrigger>
            <PopoverContent side={side} className="w-48">
              <PopoverHeader>
                <PopoverTitle>{side}</PopoverTitle>
                <PopoverDescription>Logical placement follows right-to-left direction.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </DirectionProvider>
  );
}
```

## With a form

This form owns its draft and saved name. Save submits and explicitly closes; dismissing does not save. Reopening retains the draft in caller state. The non-modal default allows focus to leave the panel.

<ComponentExample name="form" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";

import { Field, FieldLabel } from "@/components/cadence/field";
import { Input } from "@/components/cadence/input";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function FormPopover() {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Open PRs");
  const [saved, setSaved] = useState("Open PRs");
  return (
    <div className="flex flex-col items-start gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}>Rename view</PopoverTrigger>
        <PopoverContent>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSaved(name);
              setOpen(false);
            }}
          >
            <PopoverHeader>
              <PopoverTitle>Rename this view</PopoverTitle>
              <PopoverDescription>The caller owns this draft and the saved name.</PopoverDescription>
            </PopoverHeader>
            <Field>
              <FieldLabel htmlFor={id}>View name</FieldLabel>
              <Input id={id} value={name} onValueChange={setName} required />
            </Field>
            <Button type="submit">Save view</Button>
          </form>
        </PopoverContent>
      </Popover>
      <p role="status" className="text-sm text-muted-foreground">
        View: {saved}
      </p>
    </div>
  );
}
```

## Controlled

The external application opener changes open without clicking the trigger. A unique triggerId and matching trigger id keep that controlled update anchored. Finish editing closes explicitly; the trigger and Escape also report open changes.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function ControlledPopover() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open from application state
      </Button>
      <Popover open={open} onOpenChange={setOpen} triggerId={id}>
        <PopoverTrigger id={id} render={<Button variant="outline" />}>
          View options
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Application-owned panel</PopoverTitle>
            <PopoverDescription>The trigger ID anchors external open updates to the same trigger.</PopoverDescription>
          </PopoverHeader>
          <Button className="mt-3" onClick={() => setOpen(false)}>
            Finish editing
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

## Modal when it has to be

False, true, and trap-focus are fixed instances. True blocks outside interactions and locks desktop page scrolling; trap-focus keeps focus inside without scroll locking. On touch devices Base UI may keep the page scrollable. Cadence does not export PopoverClose: compose Base UI Popover.Close through Button so Base UI registers the close part and enables the modal=true focus trap. It also gives touch screen readers an exit.

<ComponentExample name="modal" />

```tsx
"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { Button } from "@/components/cadence/button";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function ModalPopovers() {
  return (
    <div className="flex flex-wrap gap-3">
      {([false, true, "trap-focus"] as const).map((modal) => (
        <Popover key={String(modal)} modal={modal}>
          <PopoverTrigger render={<Button variant="outline" />}>{String(modal)}</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Modal: {String(modal)}</PopoverTitle>
              <PopoverDescription>
                False allows page interaction. True blocks outside interaction and locks desktop page scrolling.
                Trap-focus keeps focus inside without scroll locking.
              </PopoverDescription>
            </PopoverHeader>
            <PopoverPrimitive.Close render={<Button variant="outline" className="mt-3" />}>
              Close options
            </PopoverPrimitive.Close>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}
```

## Explicit motion scopes

The first fixed scope uses none from portal insertion. The second restores full within that none provider; the OS reduced preference still wins. These explicit mode examples are separate from ordinary instances that inherit the header.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/cadence/popover";

export function PopoverMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>Open without motion</PopoverTrigger>
          <PopoverContent data-testid="initial-none">
            <PopoverHeader>
              <PopoverTitle>Immediate popover</PopoverTitle>
              <PopoverDescription>This portal starts at zero duration.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
        <CadenceProvider mode="full">
          <Popover>
            <PopoverTrigger render={<Button variant="outline" />}>Open nested full</PopoverTrigger>
            <PopoverContent data-testid="nested-full">
              <PopoverHeader>
                <PopoverTitle>Nested full popover</PopoverTitle>
                <PopoverDescription>The OS preference still wins over explicit full.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A small set of controls that belongs to the thing it is attached to: column visibility, a filter, a
  share link, a colour picker.
- Context that would crowd the page if it were always visible, but that the user opens on demand.
- An edit that is scoped to one trigger and can be dismissed without losing the page.

## When not to use

- A confirmation that must be answered. Use `alert-dialog`: a popover can be dismissed by clicking away.
- A task that needs the whole screen or a focus trap. Use `dialog` or `sheet`.
- A one- or two-word hint on a control. Use `tooltip`, which cannot hold interactive content.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Popover` | `open`, `defaultOpen`, `onOpenChange`, `triggerId`, `modal` | Base UI root; `modal=false` by default, also accepts `true` and `"trap-focus"`. |
| `PopoverTrigger` | native button props, `render` | The anchor and the toggle. |
| `PopoverContent` | `side`, `align`, `sideOffset`, `alignOffset`, `render`, `className` | Portal and positioner; side=`bottom`, align=`center`, sideOffset=`4`, alignOffset=`0`. Sides include physical and logical values. |
| `PopoverHeader` | `className` | Stacked title and description. |
| `PopoverTitle` | `className` | Base UI heading; the panel's accessible name. |
| `PopoverDescription` | `className` | Muted supporting text; becomes `aria-describedby`. |

`PopoverContent` positions itself; there is no `PopoverAnchor` export, because Base UI anchors to the
trigger and upstream's Base UI surface has no anchor part.

## Motion contract

Authored intensity is **medium**: Popover opens and closes its existing popup surface; content and native focus retain their current owners.

Each portal surface resolves its own mode and token clock. A nested full scope restores timing inside none (subject to the system preference). Live reduced cancels scale or slide and keeps opacity; none cancels transitions and shows the first frame immediately. Base parts accept `className(state)` and `style(state)`; caller values merge last.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | panel `opacity 0 → 1` + `scale 0.96 → 1` from the anchor origin | `popup.anchored/css-transition` · `duration.fast` | yes |
| exit | panel `opacity → 0` + `scale → 0.96` | `exit.fade/css-transition` · `duration.fast` | yes (reopen mid-exit) |
| reduced | opacity only, no scale; the duration tokens run at 0.6× (96ms) | `exit.fade/css-transition` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the panel appears on the first frame | – | – |

The panel grows out of its anchor rather than sliding towards it. A slide would need a distance token
and four per-side classes, and it moves the edge the positioner just lined up away from the trigger;
`--transform-origin` says the same thing with one transform. The scale reads `--motion-scale-in`, so
the class list carries a token and not a number.

## Keyboard interactions

Focus, activation or find/selection inside an entering popup settles its owned entrance
to the current resting paint immediately. Base UI keeps portal, focus and completion ownership;
closing the popup leaves independent updates on its external trigger intact.

| Keys | Action |
| --- | --- |
| Enter / Space | Opens the popover from its trigger. |
| Tab / Shift+Tab | Moves through the panel's controls and then out; modal focus trapping also needs a registered Base UI Close part, as in the modal example. |
| Escape | Closes the popover and returns focus to the trigger. |

Pressing outside closes it, which is the difference between a popover and an alert dialog.

## Accessibility

- Base UI gives the popup `role="dialog"`, `aria-expanded` on the trigger, `aria-controls`, and focus
  return on close. The panel is labelled by `PopoverTitle` and described by `PopoverDescription` when
  both are rendered.
- The trigger keeps `aria-expanded` in step, so assistive technology announces "collapsed" / "expanded"
  rather than a dialog appearing out of nowhere.
- `PopoverTitle` is optional for an interactive panel, but any popover that opens a region of controls
  should have one: an unnamed dialog is announced as just "dialog".
- Interactive controls inside the panel are reachable: the popover is non-modal, so Tab leaves it and
  the trigger's focus ring stays where the user left it.

## Responsive behavior

The panel is `w-72` wide and flips sides when the trigger has no room above or below; Base UI also
shifts it along the cross axis to stay inside the viewport. On a narrow screen it can fill most of the
width — pass `className="w-[calc(100vw-2rem)]"` or a max width when the content is wider than the
default.

## Performance

- One popup tree is mounted only while open; the portal unmounts after the exit transition.
- Animates `opacity` and `scale` only — no layout read, no `top`/`left` transition, no JavaScript
  animation loop. Reopening during the exit reverses the fade.

## Notes for AI

- Use `popover` for anchored, dismissible content; use `alert-dialog` for a deliberate confirmation.
- Pass the trigger through `render`, not a wrapper: the trigger is what the positioner anchors to and
  what gets `aria-expanded`.
- Modal popovers still dismiss on Escape and outside presses. Alert Dialog blocks outside dismissal;
  Escape can still cancel that confirmation.

Popover resolves its local token clock inside the portal, including timeScale and
reducedDurationScale. Callback classes/styles are evaluated with Base UI state and
merged last. Live reduced removes scale transitions; none cancels transitions and
renders without hidden starting/ending opacity, including nested provider overrides.

---

Full index: https://cadence.dev/llms.txt
