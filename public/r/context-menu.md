# Context Menu

> Right-click actions on a file, row, or canvas.

- Registry item: https://cadence.dev/r/context-menu.json
- Install: `npx shadcn@latest add @cadence/context-menu`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

**Command**

```install
npx shadcn@latest add @cadence/context-menu
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion @base-ui/react lucide-react
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
| context-menu | `@components/cadence/context-menu/index.tsx` | [JSON files[].content](https://cadence.dev/r/context-menu.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: context-menu](https://cadence.dev/r/context-menu.json)

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

Copy all nine target files, including every shared `lib/` file. Keep the mirrored
`cadence/` tree, relative imports and `"use client"` directives intact. The provider
files and `motion` are required imports; wrapping your application in
`CadenceProvider` is optional. Complete the base theme setup linked above,
including Cadence's easing tokens, and ensure Tailwind scans the copied files.
These payloads contain no additional context-menu-specific CSS or assets.

Usage and the top specimen need only Context Menu and its listed dependencies.
Beside a row menu also composes Dropdown Menu and Button. Follow
[Dropdown Menu's manual installation](https://cadence.dev/components/dropdown-menu#installation)
and [Button's manual installation](https://cadence.dev/components/button#installation),
copying their full [Dropdown Menu payload](https://cadence.dev/r/dropdown-menu.json)
and [Button payload](https://cadence.dev/r/button.json). Beyond the shared files
above, add `@components/cadence/dropdown-menu/index.tsx` and
`@components/cadence/button/index.tsx`. Their only additional npm dependency is:

```package-manager
npm install class-variance-authority
```

Logical sides in RTL uses `DirectionProvider` from the already required
`@base-ui/react`; pair it with the DOM `dir` attribute, as shown.

In Next.js App Router, keep Usage, Beside a row menu, Selection items, Submenus,
Destructive and disabled items, and Controlled open in client modules: they own
state and handlers. Where the panel opens, Pointer alignment, Logical sides in
RTL and Explicit motion scopes are static compositions and can be rendered by
a Server Component with serializable props. Adding event handlers, refs or
function-valued `render`, `className` or `style` props requires a client caller;
synchronous `useId` alone does not. Keep the shipped client directives. The
site's preview shell is not consumer setup. Opening, navigation, selection and
dismissal require hydration; without JavaScript the target and code remain readable.

Compose a root, trigger and content. The trigger renders a `div`; supply a
focusable target with `tabIndex={0}` and a useful name or explanation for
Shift+F10 and the Context Menu key. Base UI handles the native `contextmenu`
event, pointer anchor and touch long press, including movement cancellation.
Keep the same actions available through a visible control for discoverability
and touch use. Content includes its own portal, positioner and popup. Both
Content and SubContent default to right/start, zero side offset and a 4px
alignment offset; do not add another portal around them. Submenus use Sub,
SubTrigger and SubContent. Base UI owns collision handling, roving item focus,
typeahead, submenu navigation and dismissal. Constrain unusually wide caller
content with `max-w-(--available-width)` and check the minimum width and actual
open bounds on narrow screens.

The caller owns commands and their effects, authorization, controlled `open`,
checkbox `checked`, radio-group `value`, persistence and error feedback. Use
`defaultOpen`, `defaultChecked` and `defaultValue` for uncontrolled initial
state. Establish the context anchor through the real target event; setting
`open` from an unrelated button supplies no cursor point. The installed root
omits `modal` and `triggerId`: Tab stays within the open panel, while
Shift+Tab or Escape closes it and restores focus to the target. Outside pointer
interaction is blocked and desktop scrolling is locked while open.

Use `onClick` for commands. Ordinary items close by default;
`closeOnClick={false}` keeps them open, and checkbox/radio items stay open by
default. Disabled items remain keyboard-discoverable but cannot activate;
root `disabled` prevents the context menu opening. Shortcut text registers no
key binding. Labels inside ContextMenuGroup name that group; outside it,
including inside RadioGroup, they are captions. Usage's navigational command
passes an anchor through the item's `render` prop so its `href` and the menu
role, focus and activation behavior share one element. This component supplies
no form-state or validation package; the examples update only local state.

Full mode scales and fades panels and animates the checkbox/radio mark.
Reduced retains opacity at full size; none disables these transitions from
the first mounted frame. A nested provider can restore full inside none,
subject to the system reduced-motion preference. Preserve the primitive's
events and focus behavior when supplying custom render elements or handlers.

## Usage

Right-click the focusable file target, or focus it and press Shift+F10. Open is a real
changelog link. Rename and Open with only update this local file label; application
commands, storage and authorization belong to the caller. Interactive menus need hydration;
the target, explanation and runnable code remain readable without JavaScript.

```tsx
"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function FileMenu() {
  const [name, setName] = useState("Roadmap.md");
  return (
    <ContextMenu>
      <ContextMenuTrigger
        tabIndex={0}
        className="flex h-24 w-56 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm"
      >
        <span className="font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">Right-click for actions</span>
      </ContextMenuTrigger>
      <ContextMenuContent aria-label="File actions">
        <ContextMenuGroup>
          <ContextMenuItem render={<a href="/docs/changelog" />}>Open</ContextMenuItem>
          <ContextMenuItem onClick={() => setName("Roadmap (renamed).md")}>Rename</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Open with</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuGroup>
                <ContextMenuItem onClick={() => setName("Editor: Roadmap.md")}>Editor</ContextMenuItem>
                <ContextMenuItem onClick={() => setName("Preview: Roadmap.md")}>Preview</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

## Where the panel opens

Right-click each fixed target. The panel is anchored to the cursor point, rather than to the target box. These four physical sides use an 8px gap and zero cross-axis offset so the difference is visible. Collision handling may flip the requested side near an edge; the default is right/start, with sideOffset=0 and alignOffset=4.

<ComponentExample name="sides" />

```tsx
"use client";

import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function PointerSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <ContextMenu key={side}>
          <ContextMenuTrigger
            tabIndex={0}
            className="grid h-20 w-28 place-content-center rounded-md border border-dashed text-sm"
          >
            {side}
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions" side={side} sideOffset={8} alignOffset={0}>
            <ContextMenuGroup>
              <ContextMenuItem>Close menu</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
```

## Pointer alignment

Start, center and end align the panel against the cursor point along the cross axis. These are three separate bottom-side menus, not three configurations of a shared instance. Collision handling still shifts or flips the panel when space is limited.

<ComponentExample name="alignments" />

```tsx
"use client";

import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function PointerAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((align) => (
        <ContextMenu key={align}>
          <ContextMenuTrigger
            tabIndex={0}
            className="grid h-20 w-28 place-content-center rounded-md border border-dashed text-sm"
          >
            {align}
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions" side="bottom" align={align} alignOffset={0} sideOffset={8}>
            <ContextMenuGroup>
              <ContextMenuItem>Close menu</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
```

## Logical sides in RTL

Logical inline-start and inline-end follow the direction provider. In this RTL example they request right and left respectively. The surrounding dir attribute also gives the native content its text direction. Install @base-ui/react alongside the component; it is already a Context Menu dependency.

<ComponentExample name="logical-sides" />

```tsx
"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function LogicalPointerSides() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-3">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <ContextMenu key={side}>
            <ContextMenuTrigger
              tabIndex={0}
              className="grid h-20 w-32 place-content-center rounded-md border border-dashed text-sm"
            >
              {side}
            </ContextMenuTrigger>
            <ContextMenuContent
              aria-label="File actions"
              side={side}
              alignOffset={0}
              sideOffset={8}
              className="max-w-(--available-width)"
            >
              <ContextMenuGroup>
                <ContextMenuItem>Close menu</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </DirectionProvider>
  );
}
```

## Beside a row menu

A visible row menu makes the same actions discoverable for touch and keyboard users. Share action data and callbacks; render ContextMenuItem inside ContextMenu and DropdownMenuItem inside DropdownMenu. Both routes below update the same local result. Also install @cadence/dropdown-menu and @cadence/button for this composition; no file is opened or renamed on a server.

<ComponentExample name="row-menu" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@/components/cadence/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/cadence/dropdown-menu";

export function RowMenu() {
  const [result, setResult] = useState("No row action yet");
  const actions = ["Open", "Rename"];
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <ContextMenu>
          <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
            Roadmap.md
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions">
            <ContextMenuGroup>
              {actions.map((action) => (
                <ContextMenuItem key={action} onClick={() => setResult(`${action} selected locally`)}>
                  {action}
                </ContextMenuItem>
              ))}
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Row actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {actions.map((action) => (
                <DropdownMenuItem key={action} onClick={() => setResult(`${action} selected locally`)}>
                  {action}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}
```

## Selection items

Checkbox and radio items stay open by default. Grid and sort belong to this example; Rulers demonstrates an uncontrolled default. Labels name the Show group and Sort radio group, while separators divide the sections. Inset keeps labels and plain text aligned with the reserved indicator space.

<ComponentExample name="selection" />

```tsx
"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function SelectionMenu() {
  const [grid, setGrid] = useState(true);
  const [sort, setSort] = useState("name");
  return (
    <div className="grid gap-3">
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          View options
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuLabel inset>Show</ContextMenuLabel>
            <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid} inset>
              Grid
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem defaultChecked>Rulers</ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup aria-label="Sort" value={sort} onValueChange={setSort}>
            <ContextMenuLabel>Sort</ContextMenuLabel>
            <ContextMenuRadioItem value="name" inset>
              Name
            </ContextMenuRadioItem>
            <ContextMenuRadioItem value="date">Date modified</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        Grid: {grid ? "shown" : "hidden"}; sort: {sort}
      </p>
    </div>
  );
}
```

## Submenus

ArrowRight opens Open with; ArrowLeft returns to its parent trigger in LTR. The selected application is recorded locally and closes both panels. Each submenu owns its own portal; it is not a second root menu.

<ComponentExample name="submenus" />

```tsx
"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function Submenu() {
  const [result, setResult] = useState("Not opened");
  return (
    <div className="grid gap-3">
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          Open a file
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuItem onClick={() => setResult("Default app")}>Default app</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>Open with</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuGroup>
                  {["Editor", "Preview"].map((app) => (
                    <ContextMenuItem key={app} onClick={() => setResult(app)}>
                      {app}
                    </ContextMenuItem>
                  ))}
                </ContextMenuGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}
```

## Destructive and disabled items

Default and destructive commands are directly present in one menu. Rename and Keep open use inset; Keep open opts out of dismissal. F2 and the delete hint are text only: the component does not bind those shortcuts. Disabled command, checkbox, radio and submenu parts can receive keyboard focus but cannot activate. The second target disables the entire root: neither right-click nor Shift+F10 opens its Cadence menu. aria-disabled announces that state on the focusable div. Delete records a local result; production deletion and any confirmation belong to the caller.

<ComponentExample name="items" />

```tsx
"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function ItemStates() {
  const [result, setResult] = useState("No command yet");
  return (
    <div className="grid gap-3">
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          File commands
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuLabel inset>File</ContextMenuLabel>
            <ContextMenuItem inset onClick={() => setResult("Renamed locally")}>
              Rename<ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem inset closeOnClick={false} onClick={() => setResult("Still open")}>
              Keep open
            </ContextMenuItem>
            <ContextMenuItem disabled onClick={() => setResult("Incorrectly activated")}>
              Locked command
            </ContextMenuItem>
            <ContextMenuCheckboxItem disabled defaultChecked>
              Locked visibility
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuRadioGroup defaultValue="locked">
            <ContextMenuRadioItem disabled value="locked">
              Locked sort
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuGroup>
            <ContextMenuSub>
              <ContextMenuSubTrigger disabled>Unavailable app</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuGroup>
                  <ContextMenuItem>Never opened</ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem variant="destructive" onClick={() => setResult("Deleted locally")}>
              Delete<ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <ContextMenu disabled>
        <ContextMenuTrigger
          tabIndex={0}
          aria-disabled="true"
          className="rounded-md border border-dashed px-6 py-4 text-sm opacity-50"
        >
          Disabled target
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuItem>Unavailable</ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        {result}
      </p>
    </div>
  );
}
```

## Controlled open

The caller owns open and observes Base UI change reasons. Open at the target with a right-click or Shift+F10, then close through a caller-owned action or Escape. ContextMenu has no modal or triggerId prop in this installed API. Use its real target event to establish the cursor anchor; setting open=true from an unrelated button does not supply that point.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuTrigger } from "@/components/cadence/context-menu";

export function ControlledMenu() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Not opened");
  return (
    <div className="grid gap-3">
      <ContextMenu
        open={open}
        onOpenChange={(value, details) => {
          setOpen(value);
          setReason(details.reason);
        }}
      >
        <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-6 py-4 text-sm">
          Controlled target
        </ContextMenuTrigger>
        <ContextMenuContent aria-label="File actions">
          <ContextMenuGroup>
            <ContextMenuItem
              closeOnClick={false}
              onClick={() => {
                setReason("Caller closed");
                setOpen(false);
              }}
            >
              Close from caller
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
      <p role="status" className="text-sm">
        {open ? "Open" : "Closed"}: {reason}
      </p>
    </div>
  );
}
```

## Explicit motion scopes

Ordinary examples inherit the site header. This exception mounts the first menu in none from its first frame and overrides the second back to full. The OS reduced-motion preference still wins over full. Install the cadence-provider dependency to import CadenceProvider from its installed lib/provider path. Right-click each target to compare; neither changes the global mode.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuTrigger } from "@/components/cadence/context-menu";
import { CadenceProvider } from "@/components/cadence/lib/provider";

export function MenuMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <ContextMenu>
          <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-4 py-4 text-sm">
            Open without motion
          </ContextMenuTrigger>
          <ContextMenuContent aria-label="File actions" data-testid="initial-none">
            <ContextMenuGroup>
              <ContextMenuCheckboxItem>Grid</ContextMenuCheckboxItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <CadenceProvider mode="full">
          <ContextMenu>
            <ContextMenuTrigger tabIndex={0} className="rounded-md border border-dashed px-4 py-4 text-sm">
              Open nested full
            </ContextMenuTrigger>
            <ContextMenuContent aria-label="File actions" data-testid="nested-full">
              <ContextMenuGroup>
                <ContextMenuCheckboxItem>Grid</ContextMenuCheckboxItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}
```

## When to use

- A canvas, map, or list of files where the object itself is the target.
- A table row with more actions than fit in a cell.
- A destructive action that should be one gesture away, not one visible button.

## When not to use

- An action a user needs to discover. A context menu is invisible until someone
  right-clicks; put the primary action in the row and keep the menu for the rest.
- A single toggle. Use a `checkbox` or `switch` that is always visible.
- The same list on a touch device only: a long-press competes with scroll and text
  selection. Keep a visible `dropdown-menu` as well.

## API

### `ContextMenu`

`open`, `defaultOpen`, `onOpenChange` and the remaining Base UI Context Menu root props.
The installed API omits `modal` and `triggerId`; it retains the underlying modal menu behavior.
Outside pointer interaction is blocked while open and desktop scrolling is locked.
Tab stays within the open panel. Shift+Tab or Escape closes the root menu and returns
focus to the target; activating an ordinary command also dismisses it.

### `ContextMenuTrigger`

Native div props and `render`. The trigger is the area that listens for `contextmenu` and
long-press; it renders a `div` by default, so give it the box you want to be right-clickable.

### `ContextMenuContent`

| Prop          | Type                                     | Default     | Description                                   |
| ------------- | ---------------------------------------- | ----------- | --------------------------------------------- |
| `side`        | `"top" \| "bottom" \| "left" \| "right" \| "inline-start" \| "inline-end"` | `"right"`   | Requested side from the cursor; collisions may flip it. |
| `align`       | `"start" \| "center" \| "end"`            | `"start"`   | Alignment along that side.                    |
| `sideOffset`  | `number`                                 | `0`         | Gap from the pointer.                         |
| `alignOffset` | `number`                                 | `4`         | Shift along the alignment axis.               |
| `className`   | string or Base UI state callback                                 | –           | Merged last.                                  |

### `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`

`ContextMenuItem` (`onClick`, `disabled`, `inset`, `variant`), `ContextMenuCheckboxItem`,
`ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuSub`, `ContextMenuSubTrigger`,
`ContextMenuSubContent` — the same parts and props as `dropdown-menu`, with context-menu
slots.

### `ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator`

`ContextMenuGroup`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`,
`ContextMenuPortal`.

## Motion contract

Authored intensity is **medium**: Context Menu opens and closes its existing popup surface; content and native focus retain their current owners.

| Phase         | Properties                                        | Token             | Interruptible |
| ------------- | ------------------------------------------------- | ----------------- | ------------- |
| open          | panel `opacity 0 → 1`, `scale 0.96 → 1` from the pointer | `popup.anchored/css-transition` · `duration.fast` | yes |
| close         | panel `opacity → 0`, `scale → 0.96`               | `exit.fade/css-transition` · `duration.fast` | yes |
| check / radio | mark `opacity` + `scale`                          | `state.morph/one-shot`     | yes           |
| reduced       | panel fades, no scale; the mark cross-fades at full size | `exit.fade/css-transition` | yes           |
| none          | every `--motion-duration-*` resolves to `0ms`; the mark jumps | –      | –             |

The panel grows out of the point that was pressed. That is the whole reason the recipe is
anchored rather than centred: a context menu belongs to the place it was summoned, and a
scale from the pointer says so without moving the panel.

Each portal resolves token durations from its local provider, including `full` nested inside
`none` (the OS reduced-motion preference still wins). Full → reduced cancels running panel
geometry and keeps the opacity transition; `none` cancels opacity too and is visible on the
first mounted frame. The site header changes inherited mode without remounting the target or clearing caller-owned
selection. A real header press may dismiss an open menu through normal outside interaction;
the explicit motion-scope example demonstrates local overrides. Base UI `className(state)` and `style(state)` callbacks are evaluated
before merging; caller utilities and styles win. Native `render`, events and ref cleanup
remain owned by the primitive.

## Keyboard interactions

| Keys                      | Action                                                        |
| ------------------------- | ------------------------------------------------------------- |
| `Shift+F10` / Context Menu key | Opens the menu at the focused element.                   |
| `ArrowDown` / `ArrowUp`   | Moves the highlight.                                          |
| Typeahead letters         | Highlights the next item starting with them.                  |
| `Enter` / `Space`         | Runs the highlighted item.                                    |
| `ArrowRight` / `ArrowLeft` | Opens or closes a submenu.                                   |
| `Escape`                  | Closes the menu and returns focus to the trigger.             |
| `Tab`                     | Keeps focus in the open context menu.                         |
| `Shift+Tab`               | Closes the root menu and returns focus to the target.         |

## Accessibility

- The trigger keeps the browser's own `contextmenu` event: the menu opens from the keyboard
  with `Shift+F10` or the dedicated key, which is what a screen reader user presses.
- The panel is `role="menu"` and the items are `menuitem` / `menuitemcheckbox` /
  `menuitemradio`, so "right-click for options" is announced as a menu, not as a tooltip.
- On touch, Base UI opens the menu on a long press and cancels it if the finger moves —
  which is why the same actions must also be reachable from a visible control.
- Escape restores focus to the target. The installed Context Menu uses a modal focus manager
  internally: Tab stays within the open menu, while Shift+Tab closes the root menu and
  returns focus to the target. Unlike Dropdown Menu, it does not expose a modal prop.
  Keep Escape and visible command paths available.

## Responsive behavior

The panel flips to the side with room and shifts along the cross axis to stay inside the
viewport, so a right-click near the bottom-right corner opens up and to the left. On a
narrow screen it caps its height at `--available-height` and scrolls. The caller must
contain unusually wide content; the RTL example caps width at `--available-width`.

## Performance

- One portal per open panel, including an additional portal for a submenu. CSS transitions
  animate `opacity` and `scale`; placement and interaction remain owned by Base UI.
- Base UI owns target and item event handling; the example adds no per-frame positioning loop.
- Budget: T2 (10 KB gzip). The item and submenu parts share their classes with
  `dropdown-menu` but not its file, so the two install independently.

## Notes for AI

- Use `onClick` for the action; there is no `onSelect` on Base UI's menu item.
- Do not hide the only path to an action behind a context menu — pair it with a visible
  control, because a context menu is undiscoverable and unavailable on most touch flows.
- `ContextMenuTrigger` is the right-click area, so its content is what the user aims at;
  avoid making the whole page a trigger.

---

Full index: https://cadence.dev/llms.txt
