# Tooltip

> Hints for icon buttons, shortcuts, and truncated values.

- Registry item: https://cadence.dev/r/tooltip.json
- Install: `npx shadcn@latest add @cadence/tooltip`
- Type: registry:ui
- Since: 0.3.0
- Motion recipes: popup.anchored, exit.fade

## Installation

**Command**

```install
npx shadcn@latest add @cadence/tooltip
```

Optionally wrap the app in `TooltipProvider` once to set one delay for every tooltip; Base UI does not
require it.
These examples also use `@cadence/button`; the icon example uses `lucide-react`.

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
| cadence-provider | `@components/cadence/lib/inline-presence.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| tooltip | `@components/cadence/tooltip/index.tsx` | [JSON files[].content](https://cadence.dev/r/tooltip.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: tooltip](https://cadence.dev/r/tooltip.json)

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

Copy all nine target files, keeping `tooltip/index.tsx` and the shared `lib/`
directory in the same `cadence/` tree. Preserve relative imports and the
sources' `"use client"` directives. Copy every file in the motion, utilities
and provider payloads, including helpers not imported by Tooltip directly.
The provider files and `motion` package are required imports even without
the optional `CadenceProvider` wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the
copied files. Include the Cadence easing and motion-scale tokens used by the
popup classes. No additional item-specific CSS or external asset is required.
Full fades and scales the label from its anchor; reduced keeps opacity only;
none removes transitions and hidden entry/exit styles. The portalled popup
resolves its own mode and token clock. Standalone components follow the system
motion preference; an optional `CadenceProvider` controls a subtree, and nested
full still respects system reduced motion.

[Button](https://cadence.dev/components/button#installation) is used by Usage,
the top specimen and every body example. Copy its complete Manual setup,
including its npm dependencies and shared files. Usage and the top specimen
also import an icon:

```package-manager
npm install lucide-react
```

Logical sides and RTL imports Base UI `DirectionProvider` from the already
required `@base-ui/react` package. Explicit motion scopes uses the included
Cadence provider. The site's preview shell is not consumer setup.

In Next.js App Router, Controlled needs a caller client module for its state
and event handlers. The other examples and top specimen contain serializable
JSX and element-valued `render` props, so they can be composed in synchronous
Server Components. Caller refs, event handlers, function-valued `render`,
`className(state)` or `style(state)` also need a caller client boundary.
Synchronous `useId` alone does not require one. Keep the installed client
directives and the snippets' existing directives when copying them unchanged.

Place `TooltipTrigger` and `TooltipContent` within the same `Tooltip` root.
Use `defaultOpen` for uncontrolled opening, or `open` / `onOpenChange` for
caller control. External opening needs a unique `triggerId` matching the
trigger's `id`, as in Controlled, to keep the popup anchored. The trigger
renders a button by default; `render={<Button />}` merges onto that button.
Custom render elements must preserve supplied props and refs.

`TooltipContent` already owns the portal, positioner, popup and arrow. Its
positioning defaults are `side="top"`, `align="center"`, `sideOffset={4}` and
`alignOffset={0}`. Offsets control geometry, and Base UI can flip or shift the
label to avoid collisions. Logical sides need Base UI `DirectionProvider`
as well as DOM `dir`, as shown in the RTL example. Cadence exports no separate
Portal, Positioner, Arrow or Anchor part.

`TooltipProvider` is optional and groups adjacent hints under one hover delay;
its Cadence default is `delay={0}`. Without a provider or trigger override,
Base UI uses 600ms. A trigger's `delay` overrides the initial delay; an active
provider group can show adjacent hints immediately. Keyboard focus opens
immediately. Trigger `closeDelay` controls hover closing. These interaction
delays are independent of motion mode, including none.

Give icon-only triggers an accessible name such as `aria-label`. Cadence adds
`role="tooltip"` and links the open popup through `aria-describedby`; the hint
supplements the control's name. Hover or keyboard focus reveals the label,
leaving hides it, and Escape dismisses without moving focus. Enter and Space
still activate the trigger. Keep essential instructions visible and use
Popover for interactive content.

Root or trigger `disabled` suppresses the hint; disable the rendered Button
separately to block its action. A native disabled button cannot receive focus.
Disabled controls therefore uses a focusable, disabled Button rendered as a
span around the truly disabled native button, with `pointer-events-none` on
the inner button so hover targets the wrapper. Preserve that composition for
both pointer and keyboard access.

The caller owns action availability, business data, shortcut behavior, requests
and controlled open state. Tooltip only presents explanatory UI; it does not
implement those actions or validate form data. JavaScript is required for
hover, focus, delayed opening and controlled updates.

## Usage

```tsx
"use client";

import { BoldIcon } from "lucide-react";

import { Button } from "@/components/cadence/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function BoldTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Bold">
        <BoldIcon aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>Bold (⌘B)</TooltipContent>
    </Tooltip>
  );
}
```

## Positioned by side

The four physical sides have separate fixed triggers. Base UI flips and shifts the label when space runs out. sideOffset changes the gap; the scale still grows from the anchor origin.

<ComponentExample name="sides" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function TooltipSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger>
          <TooltipContent side={side} sideOffset={8}>
            {side} placement
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
```

## Aligned to the trigger

Start, center, and end are fixed cross-axis alignments on the default top side. alignOffset is zero here; numeric offsets remain caller choices. The content and arrow follow collision handling.

<ComponentExample name="alignments" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function TooltipAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <Tooltip key={align}>
          <TooltipTrigger render={<Button variant="outline" />}>{align}</TooltipTrigger>
          <TooltipContent align={align} alignOffset={0}>
            {align} alignment with this trigger
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
```

## Logical sides and RTL

inline-start and inline-end follow Base UI DirectionProvider. This example also sets DOM dir=rtl for text. The two independent triggers cover logical placement without a side selector.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";

import { Button } from "@/components/cadence/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function LogicalTooltips() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Tooltip key={side}>
            <TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger>
            <TooltipContent side={side}>{side} follows RTL</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </DirectionProvider>
  );
}
```

## A delay for the whole app

Place TooltipProvider around the application once to give all its tooltips the same 300ms hover delay. These two hints stand in for that application scope. Adjacent hints can open instantly while the provider group is active. Keyboard focus opens immediately. Without a provider or trigger override, Base UI uses its default 600ms; Cadence TooltipProvider itself defaults delay to zero.

<ComponentExample name="delay" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/cadence/tooltip";

export function AppTooltipDelay() {
  return (
    <TooltipProvider delay={300}>
      <div className="flex flex-wrap gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Upload help</TooltipTrigger>
          <TooltipContent>Upload files up to 10 MB</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Share help</TooltipTrigger>
          <TooltipContent>Only invited people can read this project</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
```

## Disabled controls

A native disabled button cannot receive keyboard focus. The outer Button renders a span through nativeButton=false and uses disabled plus focusableWhenDisabled: it provides button semantics, a focus ring, and blocked activation while remaining focusable. It wraps the truly disabled native Deploy button. pointer-events-none sends pointer targeting to the wrapper, so both hover and keyboard focus reveal the explanation.

<ComponentExample name="disabled" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function DisabledControlTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            render={<span />}
            nativeButton={false}
            disabled
            focusableWhenDisabled
            variant="ghost"
            className="h-auto p-0"
          />
        }
        aria-label="Why Deploy is unavailable"
      >
        <Button disabled className="pointer-events-none">
          Deploy
        </Button>
      </TooltipTrigger>
      <TooltipContent>Finish the required fields first</TooltipContent>
    </Tooltip>
  );
}
```

## Controlled

The external Show shortcut action owns open state. A unique triggerId anchors that update to Keyboard help; normal focus, hover, and Escape still report changes through onOpenChange. The popup carries only explanatory text.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function ControlledTooltip() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide shortcut" : "Show shortcut"}
      </Button>
      <Tooltip open={open} onOpenChange={setOpen} triggerId={id}>
        <TooltipTrigger id={id} render={<Button variant="outline" />}>
          Keyboard help
        </TooltipTrigger>
        <TooltipContent>Press ⌘K to search</TooltipContent>
      </Tooltip>
    </div>
  );
}
```

## Explicit motion scopes

These explicit overrides show none from insertion and full restored within that none scope, subject to OS reduction. Other examples inherit the site header. The tooltip delay is interaction timing and is independent of its motion mode.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { Button } from "@/components/cadence/button";
import { CadenceProvider } from "@/components/cadence/lib/provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/cadence/tooltip";

export function TooltipMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Open without motion</TooltipTrigger>
          <TooltipContent data-testid="initial-none">Immediate tooltip</TooltipContent>
        </Tooltip>
        <CadenceProvider mode="full">
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Open nested full</TooltipTrigger>
            <TooltipContent data-testid="nested-full">The OS preference still wins</TooltipContent>
          </Tooltip>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- An icon-only control whose meaning is not obvious from the icon alone.
- The full value behind a truncated label, or a keyboard shortcut next to an action.
- A hint that helps the first use of a dense control and is useless once learned.

## When not to use

- Anything the user must read to act: a tooltip disappears on scroll, touch, and Escape. If the content
  matters, put it on the page or in a `popover`.
- Interactive content. A tooltip cannot hold a button or a link; use `popover`.
- The accessible name of a button that already has text. Two labels that disagree is worse than one.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `TooltipProvider` | `delay` | Optional. One delay for every tooltip inside. |
| `Tooltip` | `open`, `defaultOpen`, `onOpenChange`, `triggerId`, `disabled` | Base UI root; `triggerId` anchors external open updates. |
| `TooltipTrigger` | native button props, `render`, `delay`, `closeDelay`, `disabled` | Hover/focus target; carries `aria-describedby`. Trigger `disabled` suppresses the hint; disable the rendered Button separately to block its action. |
| `TooltipContent` | `side`, `align`, `sideOffset`, `alignOffset`, `render`, `className` | Renders portal, positioner, popup, and arrow. `side` defaults to `top`, `sideOffset` to `4`. |

## Motion contract

Authored intensity is **medium**: Tooltip opens and closes its existing popup surface; content and native focus retain their current owners.

Each portal surface resolves its own mode and token clock. A nested full scope restores timing inside none (subject to the system preference). Live reduced cancels scale or slide and keeps opacity; none cancels transitions and shows the first frame immediately. Base parts accept `className(state)` and `style(state)`; caller values merge last.

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | label `opacity 0 → 1` + `scale 0.96 → 1` from the anchor origin | `popup.anchored/css-transition` · `duration.fast` | yes |
| exit | label `opacity → 0` + `scale → 0.96` | `exit.fade/css-transition` · `duration.fast` | yes |
| reduced | opacity only, no scale; the duration tokens run at 0.6× (96ms) | `exit.fade/css-transition` | yes |
| none | every `--motion-duration-*` resolves to `0ms`, so the label appears on the first frame | – | – |

A tooltip is small enough that `duration.fast` is already at the edge of readable: nothing here waits
for an exit to finish. The arrow is part of the popup and moves with it, so it is never animated
separately.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Focus shows the label; leaving hides it. |
| Escape | Hides the label and leaves focus on the trigger. |
| Enter / Space | Activates the trigger. The tooltip does not swallow the press. |

Keyboard focus provides an additional route to the same explanation. Keep essential instructions
visible on the page, including for touch users.

## Accessibility

- Base UI's own tooltip adds neither `role="tooltip"` nor `aria-describedby`; Cadence wires both. The
  trigger points at the popup only while it is open — a closed popup would otherwise leave a dangling
  id, which axe reports — and the popup is `role="tooltip"`.
- The tooltip must not be the only name of a control. Give an icon button a real `aria-label`; the
  tooltip is the extra sentence, not the name.
- Text stays readable in both themes: `bg-foreground` / `text-background` invert, so the label keeps
  contrast against whatever surface it floats over.
- Escape dismisses it without moving focus, so a tooltip never traps a keyboard user.

## Responsive behavior

The label is `w-fit` with a `max-w-xs` cap and wraps at word boundaries (`text-balance`) instead of
running off screen. Base UI flips the side and shifts the alignment when the viewport cannot fit it.

## Performance

- The popup tree is mounted only while the label is open; a page can carry dozens of tooltips without
  paying for them all.
- Animates `opacity` and `scale` only — no layout read, no measuring loop, no JavaScript animation.
  Hover is not a state the component polls.

## Notes for AI

- Use a tooltip to name or explain a control, never to deliver information the user needs to proceed.
- Do not put a link, button, or form inside it; use `popover`.
- Give every icon-only trigger an `aria-label`: the tooltip complements the name, it does not replace it.

---

Full index: https://cadence.dev/llms.txt
