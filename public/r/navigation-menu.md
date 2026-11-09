# Navigation Menu

> Site navigation with shared popup content and interruptible sizing.

- Registry item: https://cadence.dev/r/navigation-menu.json
- Install: `npx shadcn@latest add @cadence/navigation-menu`
- Type: registry:ui
- Since: 0.5.0
- Motion recipes: popup.anchored, exit.fade, geometry.resize

## Installation

**Command**

```install
npx shadcn@latest add @cadence/navigation-menu
```

The action examples also use `@cadence/button`; Retained content uses `@cadence/input`.
Add those registry items when copying the corresponding compositions.

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
| navigation-menu | `@components/cadence/navigation-menu/index.tsx` | [JSON files[].content](https://cadence.dev/r/navigation-menu.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: navigation-menu](https://cadence.dev/r/navigation-menu.json)

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

Copy all nine target files, including every shared helper, into the same
`cadence/` tree. Preserve relative imports and shipped `"use client"`
directives. Complete the base theme setup and ensure Tailwind CSS v4 scans
the copied files. No additional Navigation Menu stylesheet is required.

For the action examples, also follow [Button manual installation](https://cadence.dev/components/button#installation),
copying every target and installing its recursive dependencies. Retained
content additionally needs [Input manual installation](https://cadence.dev/components/input#installation).
Both pages provide complete files and npm commands without the shadcn CLI;
merge shared targets once. The RTL example's `DirectionProvider` comes from
the already listed `@base-ui/react` package. The fixed-motion example uses
the provider files above.

Usage can compose these client components from a Server Component with its
string props and children. Keep state, refs, `actionsRef`, event handlers,
callback classes/styles and function-based `render` composition inside a
`"use client"` caller. `navigationMenuTriggerStyle()` is also exported from
a client module: call it inside that client boundary, as the examples do.
Do not invoke it from a Server Component. Preserve the client boundaries shown in the
examples when copying their compositions.

Compose Root, List, Item, Trigger, Content and real Link destinations as in
[Usage](#usage). Give navigation landmarks distinct accessible labels and
items stable values. Root already appends one portaled positioner, popup and
viewport; do not append another `NavigationMenuPositioner`. Root forwards
`align` to that positioner; orientation changes keyboard traversal, not its
bottom placement. Size each content panel responsively within the available
viewport; the shared viewport scrolls overflowing content. For RTL, preserve
`DirectionProvider`, the native wrapper's `dir`/`lang`, and those native
attributes on the portaled content.

The caller owns route destinations, active-route state and router integration.
Custom link components must forward native link props and refs. `active`
marks the current page; `closeOnClick` opts into closing on link activation.
Controlled `value` needs a matching client `onValueChange`; `null` closes
the menu. Base UI owns hover intent, click/touch, focus guards, keyboard
traversal and outside/Escape dismissal. Keep its native focus handlers and
portal lifecycle. Intent delays are not animation durations.

Provider imports are required; wrapping is optional. Standalone menus respect
the system preference. Full mode scales/fades the popup and resizes its
measured width/height; reduced keeps opacity and applies geometry instantly;
none removes every authored transition. Keep the same popup through updates
and mode changes. `keepMounted` retains inactive panels while the portal is
open, but a complete close unmounts the default portal and resets uncontrolled
input drafts on reopening. Store persistent drafts in caller state.

Without JavaScript, server-rendered top-level labels and standalone anchors
remain available, and both installation methods expose complete source.
Popup content is portaled and requires hydration: provide another accessible
route to essential destinations instead of relying on hover-only access.
Navigation Menu does not create a mobile drawer or manage application data.

## Usage

```tsx
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@/components/cadence/navigation-menu";

export function SiteNavigation() {
  return (
    <NavigationMenu aria-label="Main navigation">
      <NavigationMenuList>
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent className="w-64">
            <NavigationMenuLink href="/docs">Documentation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Grouped links

Use native destinations inside independently sized panels. Learn has a compact list; Build uses a two-column grid. A standalone News link stays in the top-level list.

<ComponentExample name="grouped-links" />

```tsx
"use client";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/cadence/navigation-menu";

export function GroupedLinksExample({ label = "Learning resources" }: { label?: string } = {}) {
  return (
    <NavigationMenu aria-label={label}>
      <NavigationMenuList>
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60">
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            <NavigationMenuLink href="/docs/motion">Motion guide</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="build">
          <NavigationMenuTrigger>Build</NavigationMenuTrigger>
          <NavigationMenuContent className="grid w-80 max-w-full grid-cols-2 gap-2">
            <NavigationMenuLink href="/components">Components</NavigationMenuLink>
            <NavigationMenuLink href="/docs/registry">Registry</NavigationMenuLink>
            <NavigationMenuLink href="/docs/theming">Themes</NavigationMenuLink>
            <NavigationMenuLink href="/docs/accessibility">Accessibility</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/docs/changelog" className={navigationMenuTriggerStyle()}>News</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Controlled navigation

The caller owns the open item value. External actions set stable item values; `null` closes the popup.
The in-panel Close navigation action uses `actionsRef.close()`, and `onValueChange` reports its reason.
External value-only switches may adopt natural geometry immediately. Pressing an outside action can
first invoke normal outside dismissal; keep a command inside the panel when demonstrating its own
imperative close reason.

<ComponentExample name="controlled-navigation" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/cadence/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function ControlledNavigationExample() {
  const [value, setValue] = useState<string | null>(null);
  const [reason, setReason] = useState("No interaction yet");
  const actions = useRef<{ close: () => void; unmount: () => void } | null>(null);
  return (
    <div className="grid justify-items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setValue("learn")}>
          Open Learn
        </Button>
        <Button variant="outline" onClick={() => setValue("build")}>
          Open Build
        </Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {value ?? "Closed"} · {reason}
      </p>
      <NavigationMenu
        aria-label="Controlled resources"
        value={value}
        actionsRef={actions}
        onValueChange={(next, details) => {
          setValue(next);
          setReason(details.reason);
        }}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="learn">
            <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
            <NavigationMenuContent className="w-56">
              <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="build">
            <NavigationMenuTrigger>Build</NavigationMenuTrigger>
            <NavigationMenuContent className="w-72">
              <NavigationMenuLink href="/components">Browse components</NavigationMenuLink>
              <NavigationMenuLink href="/docs/registry">Registry integration</NavigationMenuLink>
              <Button variant="outline" onClick={() => actions.current?.close()}>Close navigation</Button>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
```

## Active links and custom rendering

Mark the current route with `active`; Base UI supplies `aria-current="page"`. `render` preserves a native nav, button and anchor here. A router component must forward link props and refs. Callback classes/styles receive primitive state and merge last. `navigationMenuTriggerStyle()` styles standalone links; `NavigationMenuIndicator` is a static trigger icon, alongside the built-in chevron. The ref action focuses the actual current-page anchor.

<ComponentExample name="active-links" />

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/cadence/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/cadence/navigation-menu";

export function ActiveLinksExample() {
  const link = useRef<HTMLAnchorElement>(null);
  return (
    <div className="grid justify-items-start gap-3">
      <NavigationMenu aria-label="Current page resources" render={<nav data-custom-root="resources" />}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink active href="/components/navigation-menu" ref={link}
              render={<a href="/components/navigation-menu" />} className={navigationMenuTriggerStyle()}>Navigation Menu</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="resources">
            <NavigationMenuTrigger render={<button type="button" />}
              className={(state) => state.open ? "bg-accent" : ""}>
              Resources<NavigationMenuIndicator aria-hidden="true" />
            </NavigationMenuTrigger>
            <NavigationMenuContent className="w-60" style={(state) => ({ padding: state.open ? 12 : 8 })}>
              <NavigationMenuLink render={<a href="/docs/installation" />}>Installation</NavigationMenuLink>
              <NavigationMenuLink render={<a href="/docs/changelog" />}>Changelog</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button variant="outline" onClick={() => link.current?.focus()}>Focus current page</Button>
    </div>
  );
}
```

## Retained content

Type a resource note, switch to Guides, and return to Notes. `keepMounted` retains the same input while another panel is active; inactive content is hidden after its exit. During exit, Base UI marks an outgoing panel inert when focus has left it; focus still inside the panel is handed off by the primitive. A complete close unmounts the default portal, so reopening starts a new input with its default draft. It is not persistent application storage.

<ComponentExample name="retained-content" />

```tsx
"use client";

import { useId } from "react";
import { Input } from "@/components/cadence/input";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function RetainedContentExample() {
  const id = useId();
  return (
    <NavigationMenu aria-label="Retained resource draft">
      <NavigationMenuList>
        <NavigationMenuItem value="notes">
          <NavigationMenuTrigger>Notes</NavigationMenuTrigger>
          <NavigationMenuContent keepMounted className="grid w-64 gap-2">
            <label htmlFor={id} className="text-sm font-medium">Resource note</label>
            <Input id={id} defaultValue="Read the install guide" />
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="guides">
          <NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent keepMounted className="w-72">
            <NavigationMenuLink href="/docs/motion">Motion guide</NavigationMenuLink>
            <NavigationMenuLink href="/docs/theming">Theming guide</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Changing panel content

The in-panel action reveals actual additional destinations and changes the content width. Base UI measures the same shared popup after the update. Full mode interpolates measured width/height; reduced and none apply geometry immediately. The action belongs to this example and does not configure other instances.

<ComponentExample name="changing-content" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function ChangingContentExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <NavigationMenu aria-label="Growing resource list">
      <NavigationMenuList>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent className={expanded ? "w-80" : "w-60"}>
            <Button variant="outline" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
              {expanded ? "Show fewer guides" : "Show more guides"}
            </Button>
            <NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink>
            {expanded && <>
              <NavigationMenuLink href="/docs/motion">Motion guide</NavigationMenuLink>
              <NavigationMenuLink href="/docs/theming">Theming guide</NavigationMenuLink>
              <NavigationMenuLink href="/docs/accessibility">Accessibility guide</NavigationMenuLink>
            </>}
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Vertical navigation

Set `orientation="vertical"` and arrange the list vertically. ArrowUp/ArrowDown move between top-level triggers. The shared popup still uses the root's built-in bottom positioner; orientation does not change its side.

<ComponentExample name="vertical" />

```tsx
"use client";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function VerticalExample() {
  return (
    <NavigationMenu orientation="vertical" aria-label="Vertical resources">
      <NavigationMenuList className="flex-col items-stretch">
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60"><NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="build">
          <NavigationMenuTrigger>Build</NavigationMenuTrigger>
          <NavigationMenuContent className="w-72"><NavigationMenuLink href="/docs/registry">Registry integration</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Popup alignment

The root forwards start (default), center and end alignment to its one built-in positioner. Each trigger below belongs to a separate menu. Collision handling may shift the panel on a narrow screen. Root does not forward side/offset props; do not append another positioner to change placement.

<ComponentExample name="alignment" />

```tsx
"use client";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function AlignmentExample() {
  return (
    <div className="flex flex-wrap gap-6">
      {(["start", "center", "end"] as const).map((align) => (
        <NavigationMenu key={align} align={align} aria-label={`${align} aligned resources`}>
          <NavigationMenuList><NavigationMenuItem value="resources">
            <NavigationMenuTrigger>{align}</NavigationMenuTrigger>
            <NavigationMenuContent className="w-64"><NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink></NavigationMenuContent>
          </NavigationMenuItem></NavigationMenuList>
        </NavigationMenu>
      ))}
    </div>
  );
}
```

## Disabled triggers

A disabled trigger cannot activate the popup. Base UI keeps it in the native Tab sequence while arrow traversal skips it. Enter and Space leave it closed. Keep the available destination as a real standalone link. Disabling a trigger does not provide access to the content behind it.

<ComponentExample name="disabled-triggers" />

```tsx
"use client";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/cadence/navigation-menu";

export function DisabledTriggersExample() {
  return (
    <NavigationMenu aria-label="Available resources">
      <NavigationMenuList>
        <NavigationMenuItem value="guides"><NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60"><NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="upcoming"><NavigationMenuTrigger disabled>Upcoming</NavigationMenuTrigger>
          <NavigationMenuContent><NavigationMenuLink href="/docs/changelog">Changelog</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem><NavigationMenuLink className={navigationMenuTriggerStyle()} href="/docs/changelog">News</NavigationMenuLink></NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Following links

Both native anchors follow this example's own summary target. `closeOnClick={false}` is the default and keeps the popup open; `closeOnClick` closes it when followed. Enter activates a focused link; Space retains browser scrolling behavior. Application routing still owns the destination.

<ComponentExample name="link-behavior" />

```tsx
"use client";

import { useId } from "react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function LinkBehaviorExample() {
  const id = useId();
  return (
    <div className="grid gap-3">
      <NavigationMenu aria-label="Link closing behavior">
        <NavigationMenuList><NavigationMenuItem value="links"><NavigationMenuTrigger>On this page</NavigationMenuTrigger>
          <NavigationMenuContent className="w-64">
            <NavigationMenuLink href={`#${id}`} closeOnClick={false}>Keep menu open</NavigationMenuLink>
            <NavigationMenuLink href={`#${id}`} closeOnClick>Close menu on follow</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem></NavigationMenuList>
      </NavigationMenu>
      <p id={id} className="text-sm text-muted-foreground">Local resource summary</p>
    </div>
  );
}
```

## Pointer delay

This menu waits 300 ms before hover opens and 200 ms before pointer leave closes. These are Base UI intent delays, not animation clocks. Click and keyboard activation remain immediate. The finite interaction policy is fixed here, with no delay selector.

<ComponentExample name="hover-delay" />

```tsx
"use client";

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function HoverDelayExample() {
  return (
    <NavigationMenu aria-label="Delayed resources" delay={300} closeDelay={200}>
      <NavigationMenuList><NavigationMenuItem value="guides"><NavigationMenuTrigger>Guides</NavigationMenuTrigger>
        <NavigationMenuContent className="w-60"><NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink></NavigationMenuContent>
      </NavigationMenuItem></NavigationMenuList>
    </NavigationMenu>
  );
}
```

## Right-to-left navigation

Use the Base UI DirectionProvider and native `dir="rtl"` together. Arrow traversal and logical alignment follow RTL; put native `dir` and `lang` on the portaled content too, because it no longer inherits them from the trigger wrapper. Each item still has a stable value and a real destination.

<ComponentExample name="rtl" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function RtlExample() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" lang="ar">
        <NavigationMenu aria-label="موارد التعلم">
          <NavigationMenuList>
            <NavigationMenuItem value="learn"><NavigationMenuTrigger>تعلم</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl" lang="ar" className="w-60"><NavigationMenuLink href="/docs/installation">التثبيت</NavigationMenuLink></NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="build"><NavigationMenuTrigger>بناء</NavigationMenuTrigger>
              <NavigationMenuContent dir="rtl" lang="ar" className="w-72"><NavigationMenuLink href="/docs/registry">السجل</NavigationMenuLink></NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </DirectionProvider>
  );
}
```

## Without motion

This fixed local provider demonstrates `mode="none"` from the first popup insertion. Navigation, focus, links and measurements still work; opacity, scale and geometry transitions have zero duration. Every other example inherits the site header mode/speed and the system preference.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { CadenceProvider } from "@/components/cadence/lib/provider";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/cadence/navigation-menu";

export function WithoutMotionExample() {
  return (
    <CadenceProvider mode="none">
      <NavigationMenu aria-label="Instant resources">
        <NavigationMenuList><NavigationMenuItem value="guides"><NavigationMenuTrigger>Guides</NavigationMenuTrigger>
          <NavigationMenuContent className="w-60"><NavigationMenuLink href="/docs/installation">Installation</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem></NavigationMenuList>
      </NavigationMenu>
    </CadenceProvider>
  );
}
```

## When to use

- Primary site navigation with grouped destinations.
- Desktop resource menus with differently sized panels.
- Navigation that needs pointer, touch and keyboard access to the same links.

## When not to use

- Application commands: use `menubar` or `dropdown-menu`.
- Persistent mobile navigation: use `sidebar` or a `sheet` composition.
- Switching local page content: use `tabs`.

## API

| Part | Props | Defaults and behavior |
| --- | --- | --- |
| `NavigationMenu` | Base UI Root props, `align` | `align="start"`; `value`/`defaultValue`, `onValueChange`, `onOpenChangeComplete`, `actionsRef`, `delay`, `closeDelay`, `orientation`, `render`, ref and native nav props pass through. Automatically appends one positioner. |
| `NavigationMenuList` | Base UI List props | List semantics and keyboard navigation. |
| `NavigationMenuItem` | Base UI Item props | Stable `value` associates trigger and content. |
| `NavigationMenuTrigger` | Base UI Trigger props | Native button, supports disabled, render, refs, callback classes/styles. |
| `NavigationMenuContent` | Base UI Content props | Portaled content, `keepMounted=false`; caller classes/styles merge with primitive state. |
| `NavigationMenuLink` | Base UI Link props | Native anchor; `active`, `closeOnClick`, render, refs supported. |
| `NavigationMenuIndicator` | Base UI Icon props | Static arrow within a trigger; no extra animation. |
| `NavigationMenuPositioner` | Base UI Positioner props | `side="bottom"`, `sideOffset=8`, `align="start"`, `alignOffset=0`; anchor, collision, render, refs and state callbacks pass through. |
| `navigationMenuTriggerStyle` | CVA function | Trigger classes for standalone navigation links. |

The pinned Base UI API exports Positioner, rather than Radix's Viewport export or `viewport` root prop.
Positioner contains the popup and viewport. Root already appends it; do not add a second one. Popup and
viewport have additive `data-slot` hooks. Positioner props still follow upstream composition.

## Motion contract

| Phase | Properties | Recipe / tokens | Interruptible |
| --- | --- | --- | --- |
| Open | Popup opacity and anchor scale; content opacity | `popup.anchored/css-transition`, fast clock, scale.in | Native CSS reversal |
| Close / outgoing content | Opacity to zero; popup returns to anchor scale | `exit.fade/css-transition`, fast clock | Base UI retains exit nodes until completion |
| Switch / update | Shared popup width/height, clamped to available space | `geometry.resize/css-transition`, slow clock / ease.out | Base UI measures current size before retargeting |
| Reduced | Opacity only; no scale or geometry transition | Fast clock at 0.6×; geometry instant | Live downgrade keeps nodes and focus |
| None | All durations zero, geometry instant | Zeroed CSS tokens | Running transitions finish immediately |

Content switches cross-fade; they do not slide. The positioner follows the active trigger instantly.
Sizing uses Base UI's measured popup variables, not render-time reads or a second animation engine. Trigger activation and in-panel content mutation retarget the resize clock; a value-only controlled switch can adopt the new natural geometry immediately.
Popup and content own token-derived CSS clocks so explicit nested modes and the preview speed work across portals. Caller custom motion must obey the same mode contract.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Tab / Shift+Tab | Enter and leave the navigation without a modal focus trap. |
| ArrowLeft / ArrowRight | Move between top-level items in horizontal orientation; logical direction follows RTL. |
| ArrowUp / ArrowDown in a vertical list | Move between top-level triggers. |
| ArrowDown / Enter / Space | Open a trigger; Tab enters its content. |
| Escape | Close and return focus to the active trigger. |
| Enter on a link | Follow the native link destination. |

## Accessibility

Root is a navigation landmark; give multiple navigation regions distinct accessible labels. Triggers
expose expanded state and content association. Base UI owns pointer hover, click/touch activation,
focus guards and outside/Escape dismissal. Disabled triggers stay focusable but cannot open a panel. Base UI owns the normal portal lifecycle; Cadence does not replace a node to reset a running transition. Cadence removes aria-hidden from Base UI 1.6’s tabbable focus sentinels within this menu; they remain empty generic spans with their original Tab redirection handlers. Keep link text meaningful and keyboard focus rings visible.

## Responsive behavior

Popup width and height are limited by Base UI's available viewport dimensions. Its viewport scrolls
when content exceeds that space. Supply responsive widths/grids for your destinations; the component
does not replace your information architecture with a mobile drawer. Resize updates anchor geometry
immediately in all modes. Reduced and none never tween width/height.

## Performance

T3: one shared popup, native CSS transitions, and Base UI's existing post-commit measurements and
mutation/resize tracking. No additional geometry observer, timer, layout animation loop or persistent
will-change. Two scoped child-list observers repair newly inserted focus sentinels; they disconnect on unmount. Geometry transitions are limited to the popup; nothing transitions top/left. Inactive
content unmounts by default; keepMounted deliberately retains caller state and its DOM cost.

## Notes for AI

Match the Base UI surface, including render, refs and state callback classes/styles. Do not add Radix
asChild or substitute a command menu. Keep stable item values; do not key the viewport on selection.
Use real links, label the landmark, and keep mobile content within available space.

---

Full index: https://cadence.dev/llms.txt
