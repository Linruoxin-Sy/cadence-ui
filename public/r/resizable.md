# Resizable

> Adjustable split panels with pointer and keyboard resizing.

- Registry item: https://cadence.dev/r/resizable.json
- Install: `npx shadcn@latest add @cadence/resizable`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: data.transition, state.color

## Installation

**Command**

```install
npx shadcn@latest add @cadence/resizable
```

**Manual**

Use React 19, TypeScript and Tailwind CSS v4 with the shadcn semantic colour tokens. Follow the [manual setup guide](https://cadence.dev/docs/installation#manual-installation) for the base CSS and aliases; copying files does not require the shadcn CLI.

1. Install the component's complete recursive npm dependencies (versions are preserved). Example-only packages are listed separately below when needed.

```package-manager
npm install clsx tailwind-merge motion react-resizable-panels@4.16.0 lucide-react
```

2. Copy the following registry dependencies in the listed dependency order. Each JSON link exposes every file's full `content` and `target`; copy all files, including multi-file helpers.

- [@cadence/cadence-utils](https://cadence.dev/r/cadence-utils.json) — direct registry dependency.
- [@cadence/cadence-motion](https://cadence.dev/r/cadence-motion.json) — direct registry dependency.
- [@cadence/cadence-theme](https://cadence.dev/r/cadence-theme.json) — transitive registry dependency.
- [@cadence/cadence-provider](https://cadence.dev/r/cadence-provider.json) — direct registry dependency.

3. Place every file at its target below. `@components` means your components directory, for example `src/components`; keep the remaining `cadence/` tree and relative imports intact. Each source block on the website copies the entire file, including folded lines.

| Item | Target file | Full source |
| --- | --- | --- |
| cadence-utils | `@components/cadence/lib/cn.ts` | [JSON files[].content](https://cadence.dev/r/cadence-utils.json) |
| cadence-motion | `@components/cadence/lib/motion.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
| cadence-motion | `@components/cadence/lib/geometry.ts` | [JSON files[].content](https://cadence.dev/r/cadence-motion.json) |
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
| cadence-provider | `@components/cadence/lib/invalidation.ts` | [JSON files[].content](https://cadence.dev/r/cadence-provider.json) |
| resizable | `@components/cadence/resizable/index.tsx` | [JSON files[].content](https://cadence.dev/r/resizable.json) |

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: resizable](https://cadence.dev/r/resizable.json)

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

Copy every file in the target list, keeping `resizable/index.tsx` beside the shared
`lib/` files (`cn`, `css-motion`, `inline-presence`, `motion`, `motion-ref` and
`provider`) in the listed relative tree, and keep the relative `../lib/` imports and
the shipped `"use client"` directive. Those helpers are required imports; wrapping
the application in `CadenceProvider` is optional. Complete the base theme setup and
ensure Tailwind CSS v4 scans the copied files. Keep `react-resizable-panels` pinned
to `4.16.0`: these wrappers use its v4 Group, Panel and Separator APIs. No Resizable
stylesheet is required.

The wrapper owns one insertion opacity per inserted handle and grip, plus the rule's
own scoped paint. Panel allocation, constraints, separator hit regions, keyboard
resizing and every panel child stay with the engine and the caller in all modes.

External updates, Container resizing and Custom parts additionally use
[Button manual installation](https://cadence.dev/components/button#installation).
Copy all of Button's targets and install its recursive npm dependencies from
that page; merge shared files once. This supplies the action buttons without
the shadcn CLI. Button retains its own motion contract.

Compose `ResizablePanelGroup`, panels and labelled handles as in [Usage](#usage).
The declarative Usage can be composed from a Server Component with its string
props, style objects and children. Keep state, DOM/imperative refs, event
handlers, layout/resize callbacks and the engine's ref or persistence hooks
inside a `"use client"` caller, as the interactive examples do. Import
`useGroupRef` and `usePanelRef` from the pinned engine package when needed.

Give vertical groups a definite height; constrain parent width and allow
inner content to scroll. Orientation and mobile breakpoints belong to the
caller. Numeric sizes are pixels; use explicit strings such as `"40%"`
for percentages. Group `defaultLayout` maps matching panel ids to numeric
percentages and supplies an initial layout, not a controlled value. Use
`groupRef.current?.setLayout()` or `panelRef.current` methods for subsequent updates.
At least one panel per group must preserve relative size; min/max and
collapse constraints can change the applied result.

The engine owns pointer resizing, separator keyboard/ARIA behavior, resize
observation and deferred separator previews. Label each handle and keep
essential controls reachable outside collapsed panels. `elementRef` addresses
the DOM; `groupRef` and `panelRef` expose imperative APIs. Panel classes and
styles target inner content; the engine retains its flex geometry. Handle
children are the wrapper's optional grip; `preview` customizes the deferred
overlay. This API does not use Base UI `render` or `asChild`.

The caller owns persistence and draft data. Use stable panel ids and a
consistent initial layout across server rendering and hydration. Restore
browser storage after mount through the imperative API, or pass a serialized
server-loaded layout. If using the engine's `useDefaultLayout` during SSR,
provide server-safe storage with a consistent initial value: its default
reads `localStorage` during rendering, even in a `"use client"` caller.
`onLayoutChange` reports live pointer updates; prefer
`onLayoutChanged` for persistence after release, using
`meta.isUserInteraction` and `meta.requestedLayout` when appropriate.
Initial mount and imperative updates can also report completed changes;
an unchanged applied layout may emit no new completed callback.

Resizable never makes the divider trail the pointer: full, reduced and none keep
direct layout updates immediate, and separator preview still defers pointer
commitment until release instead of tweening geometry. The authored work is the
divider's own appearance — one opacity entrance for an inserted rule and its
decorative grip and its scoped hover/active paint — so avoid adding width/flex
transitions yourself. No motion Provider is required.
Static panel text and initial drafts render without JavaScript, while
pointer/keyboard resizing and public refs require hydration. Percentage-based
initial sizes may be adjusted after the engine measures the container. Both
installation panels expose complete source without JavaScript.

## Usage

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function Horizontal() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="rounded-md border" style={{ height: 240 }}>
      <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%" className="overflow-auto p-4 text-sm">Explorer</ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize explorer" />
      <ResizablePanel defaultSize="60%" minSize="30%" className="overflow-auto p-4 text-sm">Editor</ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

## Horizontal layout

A horizontal group places panels side by side. Percentage defaults and constraints leave the editor at least 30% wide; inner content scrolls instead of forcing the page wider. Drag the divider or focus it and use Left/Right. The divider itself has vertical ARIA orientation.

<ComponentExample name="horizontal" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function Horizontal() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="rounded-md border" style={{ height: 240 }}>
      <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%" className="overflow-auto p-4 text-sm">Explorer</ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize explorer" />
      <ResizablePanel defaultSize="60%" minSize="30%" className="overflow-auto p-4 text-sm">Editor</ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

## Vertical layout

Set `orientation="vertical"` and give the group a definite height. Up/Down resize this stack; the divider has horizontal ARIA orientation. Parent height and inner overflow are application responsibilities.

<ComponentExample name="vertical" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function Vertical() {
  return (
    <ResizablePanelGroup orientation="vertical" className="rounded-md border" style={{ height: 300 }}>
      <ResizablePanel defaultSize="55%" minSize="25%" className="overflow-auto p-4 text-sm">Preview</ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize preview" />
      <ResizablePanel minSize="25%" className="overflow-auto p-4 text-sm">Output</ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

## Handle styles

`withHandle` adds a decorative grip. Both fixed examples retain the same focusable, labelled separator and keyboard/pointer target; the plain divider is the default. An inserted rule fades in once and its initial grip shares that envelope; a grip inserted later runs its own entrance. The grip adds no size or geometry work and does not change the resize API.

<ComponentExample name="handle-styles" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function HandleStyles() {
  return (
    <div className="flex w-full flex-col gap-4">
      {[false, true].map((grip) => (
        <ResizablePanelGroup key={String(grip)} className="rounded-md border" style={{ height: 140 }}>
          <ResizablePanel defaultSize="50%" minSize="20%" className="overflow-auto p-4 text-sm">{grip ? "Grip" : "Plain"}</ResizablePanel>
          <ResizableHandle withHandle={grip} aria-label={grip ? "Resize with grip" : "Resize plain divider"} />
          <ResizablePanel minSize="20%" className="overflow-auto p-4 text-sm">Content</ResizablePanel>
        </ResizablePanelGroup>
      ))}
    </div>
  );
}
```

## Panel content revisions

Panel children are caller content and render exactly as given, in every mode: a plain string, a number and a rich subtree all stay one exact native tree with no authored display host. Replacing that content commits immediately at the panel's current allocation; no replacement effect rewrites it, splits it or re-lays it out, so an editor, a selection or a live drag never competes with a second writer. Nothing here labels a panel size: sizes and ids are geometry and identity.

<ComponentExample name="display-revision" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function DisplayRevision() {
  const [revision, setRevision] = useState(0);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setRevision((value) => value + 1)}>Revise panels</Button>
        <Button variant="outline" size="sm" onClick={() => setRevision(0)}>Reset</Button>
      </div>
      <ResizablePanelGroup className="rounded-md border" style={{ height: 160 }}>
        <ResizablePanel defaultSize="50%" minSize="20%" className="overflow-auto p-4 text-sm">
          {["Draft attached", "Draft awaiting review", "Draft approved"][revision % 3]}
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize display panels" />
        <ResizablePanel minSize="20%" className="overflow-auto p-4 text-sm">{1000 + revision}</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

## Collapsible panels

This fixed example leaves an 8% rail when collapsed, with a 25% minimum, 60% maximum and a 5% collapse threshold. Enter toggles the preceding panel; Home/End reach its permitted bounds. Dragging below the threshold collapses it. Keep essential actions outside collapsed content; a nonzero rail does not guarantee room for every control.

<ComponentExample name="collapsible-panels" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function CollapsiblePanels() {
  return (
    <ResizablePanelGroup className="rounded-md border" style={{ height: 240 }}>
      <ResizablePanel defaultSize="35%" minSize="25%" maxSize="60%" collapsible collapsedSize="8%" collapsedThreshold="5%" className="overflow-auto p-3 text-sm">
        <span className="whitespace-nowrap">Files</span>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize collapsible files" />
      <ResizablePanel minSize="40%" className="overflow-auto p-4 text-sm">Focus the divider and press Enter to collapse or restore Files.</ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

## Locked layouts

These three groups demonstrate distinct disabled levels. A disabled group locks all resizing. A disabled panel stays fixed even when another divider moves. A disabled separator only locks that boundary: the enabled second divider can still resize other panels, including indirectly across the locked boundary. Group locking keeps separators in the Tab order without adding `aria-disabled` to each one; setting `disabled` on a separator itself adds that attribute and removes its tab stop. Disabled boundaries do not hide panel content.

<ComponentExample name="locked-layouts" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function LockedLayouts() {
  return (
    <div className="flex w-full flex-col gap-4">
      {(["group", "panel", "separator"] as const).map((lock) => (
        <ResizablePanelGroup key={lock} disabled={lock === "group"} className="rounded-md border" style={{ height: 150 }}>
          <ResizablePanel defaultSize="30%" minSize="15%" disabled={lock === "panel"} className="overflow-auto p-3 text-sm">Locked {lock}</ResizablePanel>
          <ResizableHandle disabled={lock === "separator"} aria-label={`Resize ${lock} first divider`} />
          <ResizablePanel defaultSize="35%" minSize="15%" className="overflow-auto p-3 text-sm">Middle</ResizablePanel>
          <ResizableHandle aria-label={`Resize ${lock} second divider`} />
          <ResizablePanel minSize="15%" className="overflow-auto p-3 text-sm">End</ResizablePanel>
        </ResizablePanelGroup>
      ))}
    </div>
  );
}
```

## External updates

Install `@cadence/button` for the external actions. Each mounted example owns unique IDs and a draft. The public panel ref collapses to zero, expands, resizes and inspects size/collapse state; the group ref reads or applies a percentage layout. `defaultLayout` supplies an initial layout, not a controlled value. The live callback reports every pointer move; the completed callback waits for release and distinguishes user input from imperative updates. Persist `meta.requestedLayout` when retaining an unconstrained request. `onResize` supplies pixels, percentages and the previous size. Resizing, header changes and source expansion preserve the actual input node and draft; actions intentionally move focus to their button.

<ComponentExample name="external-updates" />

```tsx
"use client";

import { useId, useState } from "react";
import { useGroupRef, usePanelRef } from "react-resizable-panels";
import { Button } from "@/components/cadence/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function ExternalUpdates() {
  const id = useId();
  const files = `${id}-files`;
  const editor = `${id}-editor`;
  const group = useGroupRef();
  const panel = usePanelRef();
  const [size, setSize] = useState(40);
  const [previous, setPrevious] = useState<number>();
  const [pixels, setPixels] = useState(0);
  const [live, setLive] = useState(40);
  const [origin, setOrigin] = useState("initial");
  const [requested, setRequested] = useState(40);
  const [inspection, setInspection] = useState("Not inspected");
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => panel.current?.collapse()}>Collapse</Button>
        <Button variant="outline" size="sm" onClick={() => panel.current?.expand()}>Expand</Button>
        <Button variant="outline" size="sm" onClick={() => panel.current?.resize("55%")}>Resize to 55%</Button>
        <Button variant="outline" size="sm" onClick={() => group.current?.setLayout({ [files]: 40, [editor]: 60 })}>Reset layout</Button>
        <Button variant="outline" size="sm" onClick={() => {
          const current = panel.current?.getSize();
          setInspection(`${Math.round(current?.asPercentage ?? 0)}% / ${Math.round(current?.inPixels ?? 0)}px · ${panel.current?.isCollapsed() ? "collapsed" : "expanded"} · layout ${Math.round(group.current?.getLayout()[files] ?? 0)}%`);
        }}>Inspect layout</Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">Files {Math.round(size)}% · {origin} · live {Math.round(live)}% · requested {Math.round(requested)}% · previous {previous === undefined ? "initial" : `${Math.round(previous)}%`} · {Math.round(pixels)}px</p>
      <p className="text-sm text-muted-foreground" data-inspection>{inspection}</p>
      <ResizablePanelGroup groupRef={group} defaultLayout={{ [files]: 40, [editor]: 60 }} className="rounded-md border" style={{ height: 260 }}
        onLayoutChange={(layout) => setLive(layout[files] ?? 0)}
        onLayoutChanged={(layout, meta) => { setOrigin(meta.isUserInteraction ? "user" : "external"); setRequested((meta.requestedLayout ?? layout)[files] ?? 0); }}>
        <ResizablePanel id={files} panelRef={panel} defaultSize="40%" minSize="20%" maxSize="60%" collapsible className="overflow-auto p-3 text-sm"
          onResize={(next, _, prev) => { setSize(next.asPercentage); setPixels(next.inPixels); setPrevious(prev?.asPercentage); }}>
          <label className="flex min-w-0 flex-col gap-2" htmlFor={`${id}-draft`}>Draft
            <input id={`${id}-draft`} className="w-full min-w-0 rounded border bg-background px-2 py-1" defaultValue="Keep this note" />
          </label>
        </ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize files externally" />
        <ResizablePanel id={editor} defaultSize="60%" minSize="40%" className="overflow-auto p-4 text-sm">Editor</ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

## Resize previews

`resizePreviewMode="panel"` applies each drag immediately. The fixed `"separator"` example moves an overlay while panels keep their current sizes, then applies the layout on release. Its `preview` node customizes the overlay; keyboard updates remain immediate. These are interaction strategies, not motion modes or timed interpolation.

<ComponentExample name="resize-previews" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function ResizePreviews() {
  return (
    <div className="flex w-full flex-col gap-4">
      {(["panel", "separator"] as const).map((mode) => (
        <ResizablePanelGroup key={mode} resizePreviewMode={mode} className="rounded-md border" style={{ height: 180 }}>
          <ResizablePanel defaultSize="40%" minSize="20%" maxSize="70%" className="overflow-auto p-4 text-sm">{mode === "panel" ? "Live panels" : "Release to apply"}</ResizablePanel>
          <ResizableHandle withHandle aria-label={`Resize ${mode} preview`} preview={<div className="h-full w-1 bg-primary" />} />
          <ResizablePanel minSize="30%" className="overflow-auto p-4 text-sm">Editor</ResizablePanel>
        </ResizablePanelGroup>
      ))}
    </div>
  );
}
```

## Container resizing

Install `@cadence/button` for the caller-owned width change. The upper panel preserves its 40% share; the lower preserves 100 pixels as its parent narrows. Numeric sizes are pixels, explicit `"40%"` strings are percentages; other CSS size units are continuous inputs, not variants. At least one panel per group must preserve relative size, and constraints can limit the requested result. The button changes real parent geometry without a width transition.

<ComponentExample name="container-resize" />

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function ContainerResize() {
  const [compact, setCompact] = useState(false);
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Button variant="outline" size="sm" onClick={() => setCompact((value) => !value)}>{compact ? "Restore container" : "Narrow container"}</Button>
      <div className="flex min-w-0 flex-col gap-4" style={{ width: compact ? "80%" : "100%" }}>
        {(["preserve-relative-size", "preserve-pixel-size"] as const).map((behavior) => (
          <ResizablePanelGroup key={behavior} className="rounded-md border" style={{ height: 180 }}>
            <ResizablePanel defaultSize={behavior === "preserve-pixel-size" ? 100 : "40%"} groupResizeBehavior={behavior} className="overflow-auto p-3 text-sm">
              {behavior === "preserve-pixel-size" ? "100px" : "40%"}
            </ResizablePanel>
            <ResizableHandle aria-label={`Resize ${behavior}`} />
            <ResizablePanel className="overflow-auto p-3 text-sm">Flexible remainder</ResizablePanel>
          </ResizablePanelGroup>
        ))}
      </div>
    </div>
  );
}
```

## Nested panels

A vertical group can live inside a horizontal panel. Each labelled divider owns its axis. F6 and Shift+F6 cycle enabled separators within the focused divider’s group; Tab follows the document order into the nested group. Give the outer group a height so the nested stack can fill its panel.

<ComponentExample name="nested-panels" />

```tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function NestedPanels() {
  return (
    <ResizablePanelGroup className="rounded-md border" style={{ height: 300 }}>
      <ResizablePanel defaultSize="30%" minSize="15%" className="overflow-auto p-3 text-sm">Files</ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize nested files" />
      <ResizablePanel defaultSize="45%" minSize="20%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="25%" className="overflow-auto p-3 text-sm">Preview</ResizablePanel>
          <ResizableHandle withHandle aria-label="Resize nested preview" />
          <ResizablePanel minSize="25%" className="overflow-auto p-3 text-sm">Console</ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle aria-label="Resize nested inspector" />
      <ResizablePanel minSize="15%" className="overflow-auto p-3 text-sm">Details</ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

## Custom parts

Install `@cadence/button` for the focus action. `elementRef` addresses the actual separator DOM node; `panelRef` and `groupRef` address imperative APIs. Caller classes/styles target the panel’s inner content, while library flex geometry retains precedence. This thicker divider disables double-click reset, keeps native click callbacks, increases hit targets and leaves cursor styling to the caller with `disableCursor`. Handle children remain the wrapper’s optional grip; use `preview` for deferred-drag overlays.

<ComponentExample name="custom-parts" />

```tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/cadence/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/cadence/resizable";

export function CustomParts() {
  const handle = useRef<HTMLDivElement>(null);
  const [clicks, setClicks] = useState(0);
  return (
    <div className="flex w-full flex-col gap-4">
      <Button variant="outline" size="sm" onClick={() => handle.current?.focus()}>Focus divider</Button>
      <ResizablePanelGroup disableCursor resizeTargetMinimumSize={{ coarse: 32, fine: 16 }} className="rounded-md border" style={{ height: 200 }}>
        <ResizablePanel defaultSize="40%" minSize="20%" className="overflow-auto p-4 text-sm" style={{ fontWeight: 600 }}>Files</ResizablePanel>
        <ResizableHandle elementRef={handle} disableDoubleClick withHandle className="w-2 bg-muted" aria-label="Resize custom divider" onClick={() => setClicks((count) => count + 1)} />
        <ResizablePanel minSize="30%" className="overflow-auto p-4 text-sm">Editor</ResizablePanel>
      </ResizablePanelGroup>
      <p role="status" className="text-sm text-muted-foreground">Divider clicks: {clicks}</p>
    </div>
  );
}
```

## When to use

- Editor panes whose widths users adjust.
- Preview/output workspaces with vertical splits.
- Collapsible tool panels with persistent application-owned layouts.

## When not to use

- Static columns: use CSS grid.
- Hidden disclosure content: use Collapsible or Accordion.
- Mobile navigation: use Sheet or Sidebar.

## API

| Export | Props and defaults |
| --- | --- |
| `ResizablePanelGroup` | `react-resizable-panels` `GroupProps` plus an optional `ref`; orientation horizontal, resizing enabled, immediate panel preview. |
| `ResizablePanel` | `PanelProps` plus an optional `ref`; min 0%, max 100%, collapsible false, collapsed size 0%, relative resize behavior. |
| `ResizableHandle` | `SeparatorProps` plus optional `withHandle` (unset by default). |

All native attributes/events, string classes, style objects, `elementRef`, `groupRef`,
`panelRef`, constraints, callbacks, disabled state and preview props pass through. A caller
`ref` on `ResizablePanelGroup` or `ResizablePanel` reaches the same root element as `elementRef`.
This primitive has no Base UI `render`, `asChild`, or callback class/style API. Group and handle
classes merge caller last. Panel classes and caller styles target the library's inner content
element; `elementRef` addresses its root. Managed flex/display geometry retains library
precedence; other caller styles pass through. Handle children follow upstream: the wrapper renders
its optional grip instead of caller children.

Panel children render exactly as given: a plain string, a number and a rich subtree are
all the same exact native tree, with no added display host or second layout owner.

Numeric sizes are **pixels**; use strings such as `"40%"` for percentages. Group layouts map
stable panel ids to numeric percentages. Slots: `resizable-panel-group`, `resizable-panel`,
`resizable-handle`, `resizable-handle-rule`, `resizable-handle-grip`. Use `elementRef` or
a caller `ref` for DOM access.

## Motion contract

Authored intensity is **subtle**: A genuinely inserted handle or grip fades in and the rule transitions its own scoped paint while native panel allocation stays immediate.

Panel allocation, constraints, separator hit regions, keyboard resizing and panel
children are direct manipulation or caller content, never an authored size or
content animation.

| Recipe | Owner and full behaviour | reduced | none |
| --- | --- | --- | --- |
| `data.transition/one-shot` | A genuinely inserted rule fades once on its own opacity host; its initial grip shares that envelope and a grip inserted later runs its own entrance. A presenting parent or a missing host keeps native paint. | Short opacity. | Visible immediately. |
| `state.color/css-transition` | The rule owns only its declared surface and foreground, including the engine's `data-separator` hover/active state and theme changes. Focus within the rule or its own invalid state settles all of that paint immediately; hit regions, radius and geometry stay native. | Short eligible colour. | Zero duration and delay. |

Changed text and changed numbers are **not applicable**: this wrapper renders no
display text or quantity of its own. A panel's plain or rich children are exact
caller content with their own owners, so nothing here splits a run, reels a digit or
re-lays a panel's text — replacing it commits immediately in every mode.

Direct pointer and keyboard resizing stay immediate in every mode: a drag or a
keyboard resize sequence tracks the pointer exactly and the divider never trails it.
Live reduction settles permitted paint through the reduced clock; `none` reaches the
semantic target with zero duration and delay for every property, including colour and
opacity, and this primitive has no continuous loop. Returning to full never replays an
insertion that already happened, and closure or unmount releases the local writers
before the group's gesture listeners retire.

Caller-added animation is application-owned. Do not transition flex or width/height on
these panels: it makes the divider lag behind input and bypasses the geometry
ownership above.

## Accessibility

The primitive supplies focusable separators, `aria-controls`, orientation and value bounds/current
value. Label each handle. Tab focuses the separator; axis arrows resize by 5 percentage points,
Home/End reach permitted limits, Enter toggles the preceding collapsible panel, and F6/Shift+F6
cycle enabled separators within the same group. Double-click restores the associated panel's default size unless disabled.
A locked group disables resizing; disabling only a separator still permits indirect panel resizing.
Group-level locking retains separator Tab stops without adding `aria-disabled`; a separator’s own `disabled` prop sets `aria-disabled` and removes its tab stop. Keep critical controls outside a collapsible panel so they remain reachable when it is zero-sized.

## Responsive behavior

Constrain the group's height for vertical layouts. Use `min-w-0` on grid parents, percentage constraints
for narrow screens and scrollable inner content for long lines. Orientation changes are caller-owned;
there is no automatic mobile breakpoint. The preview supports both axes at desktop and 390px.
The library adjusts constraints on container resize; at least one panel must preserve relative size.

## Performance

The library owns resize observation and pointer/keyboard handling; the wrapper adds one opacity
channel per handle and grip and one scoped paint owner on the rule, and nothing per panel child.
It adds no measurement engine, no per-frame content read and no geometry writer, so direct
dragging keeps the freshly measured offsets instead of reading layout again.
Keep expensive persistence work in `onLayoutChanged`, not every live update. Percentage defaults
can shift slightly during SSR hydration; provide stable ids and consistent initial layout. Static
panel text and the initial draft render without JavaScript; pointer/keyboard resizing and public
refs require hydration. The tier's gzip figure excludes the declared third-party dependency and
remains an advisory reference under ADR-023, not a functional limit or total bundle claim.

## Notes for AI

- Use v4 Group/Panel/Separator props and public refs; v3 direction/PanelGroup APIs do not apply.
- Preserve constraints and immediate resizing in all modes; never tween flex or width/height.
- Panel children are exact caller content: do not wrap them to add a display or motion host.
- Use stable ids when persisting layouts and explicit units for panel sizes.

---

Full index: https://cadence.dev/llms.txt
