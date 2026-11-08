# Tabs

> Switch between peer views with a shared selection indicator.

- Registry item: https://cadence.dev/r/tabs.json
- Install: `npx shadcn@latest add @cadence/tabs`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: layout.shared

## Installation

**Command**

```install
npx shadcn@latest add @cadence/tabs
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
| tabs | `@components/cadence/tabs/index.tsx` | [JSON files[].content](https://cadence.dev/r/tabs.json) |

[Source files: cadence-motion](https://cadence.dev/r/cadence-motion.json)

[Source files: cadence-utils](https://cadence.dev/r/cadence-utils.json)

[Source files: cadence-provider](https://cadence.dev/r/cadence-provider.json)

[Source files: tabs](https://cadence.dev/r/tabs.json)

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

Copy all nine target files, keeping `tabs/index.tsx` and the shared `lib/`
directory in the same `cadence/` tree. Preserve relative imports and the
sources' `"use client"` directives. Copy every file in the motion, utilities
and provider payloads, including helpers not imported by Tabs directly.
The provider files and `motion` package are required imports even without
the optional `CadenceProvider` wrapper.

Complete the base theme setup linked above and ensure Tailwind scans the
copied files. No additional item-specific CSS or external asset is required.
Standalone components follow the system motion preference; use
`CadenceProvider` to choose a product mode or override an inherited scope.
Each list scopes its own shared selection indicator. Full mode moves it
using `layout.shared`; reduced, none and a zero clock place it immediately.
Panels switch without a fade or height animation. The caller chooses list
width, scrolling and orientation; preserve the indicator children and refs
when supplying a custom trigger render.

Controlled and List sizing need a client caller for their state and event
handlers. Refs, event handlers and function-valued `render`, `className`
or `style` props also require a client caller. Usage, Vertical, Line style,
Custom elements and persistent panels, and Disabled use serializable props
and children and can be composed in a Server Component. Element-valued
`render` is supported there; synchronous `useId` inside TabsList does not
itself require a client caller.

Controlled and List sizing additionally use `@cadence/button`. Install it
separately, or copy every target and recursive dependency from its Manual
panel. The caller owns controlled selection and durable panel data. Supply
matching trigger/content values and a list label; `null` selects no panel.
`keepMounted` retains the draft textarea while its panel is hidden, but
does not persist data after the Tabs tree unmounts. Default lists activate
with Enter or Space; `activateOnFocus` opts into selection on arrow focus.

## Usage

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/cadence/tabs";

export function Example() {
  return (
    <Tabs defaultValue="overview">
      <TabsList aria-label="Project views">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Project overview</TabsContent>
      <TabsContent value="activity">Recent activity</TabsContent>
    </Tabs>
  );
}
```

## Controlled

The caller owns `value` and `onValueChange`. Change selection updates this list externally while other examples keep their own selection. Values may be any Base UI tab value; `null` selects nothing. User change requests include cancellable event details.

<ComponentExample name="controlled" />

```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";
import { Button } from "@/components/cadence/button";

function ProjectTabs({ orientation = "horizontal", variant = "default", wide = false, disabled = false, value, onValueChange }: {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "line";
  wide?: boolean;
  disabled?: boolean;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  return (
    <Tabs defaultValue="overview" value={value} onValueChange={onValueChange} orientation={orientation} className="w-full max-w-md">
      <TabsList aria-label="Project views" variant={variant} className={wide ? "w-full" : undefined}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        {disabled && <TabsTrigger value="locked" disabled>Locked</TabsTrigger>}
      </TabsList>
      <TabsContent value="overview" className="rounded-lg border p-4 text-sm">Project overview. Peer views share one selection indicator.</TabsContent>
      <TabsContent value="activity" className="rounded-lg border p-4 text-sm">Recent activity.</TabsContent>
    </Tabs>
  );
}

export function Controlled() {
  const [value, setValue] = useState<string | null>("overview");
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Button variant="outline" size="sm" className="self-start" onClick={() => setValue(value === "overview" ? "activity" : "overview")}>Change selection</Button>
      <ProjectTabs value={value} onValueChange={setValue} />
      <output className="text-sm" aria-live="polite">Selected: {value}</output>
    </div>
  );
}
```

## Vertical

Vertical lists use Up/Down for focus. Both filled and line lists below have fixed vertical orientation and independent selection; the line list opts into activation on focus.

<ComponentExample name="vertical" />

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";

function ProjectTabs({ orientation = "horizontal", variant = "default", wide = false, disabled = false, value, onValueChange }: {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "line";
  wide?: boolean;
  disabled?: boolean;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  return (
    <Tabs defaultValue="overview" value={value} onValueChange={onValueChange} orientation={orientation} className="w-full max-w-md">
      <TabsList aria-label="Project views" variant={variant} className={wide ? "w-full" : undefined}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        {disabled && <TabsTrigger value="locked" disabled>Locked</TabsTrigger>}
      </TabsList>
      <TabsContent value="overview" className="rounded-lg border p-4 text-sm">Project overview. Peer views share one selection indicator.</TabsContent>
      <TabsContent value="activity" className="rounded-lg border p-4 text-sm">Recent activity.</TabsContent>
    </Tabs>
  );
}

function SettingsTabs({ vertical = false }: { vertical?: boolean }) {
  return (
    <Tabs defaultValue="account" orientation={vertical ? "vertical" : "horizontal"} className="w-full max-w-md">
      <TabsList variant="line" aria-label="Settings views" activateOnFocus>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="p-4 text-sm">Account settings</TabsContent>
      <TabsContent value="notifications" className="p-4 text-sm" keepMounted>Notification preferences</TabsContent>
    </Tabs>
  );
}

export function Vertical() {
  return <div className="flex w-full flex-col gap-6"><ProjectTabs orientation="vertical" disabled /><SettingsTabs vertical /></div>;
}
```

## Line style

`variant="line"` moves the shared indicator to the edge. `activateOnFocus` selects on arrow focus; the default is manual activation with Enter or Space.

<ComponentExample name="line-style" />

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";

function SettingsTabs({ vertical = false }: { vertical?: boolean }) {
  return (
    <Tabs defaultValue="account" orientation={vertical ? "vertical" : "horizontal"} className="w-full max-w-md">
      <TabsList variant="line" aria-label="Settings views" activateOnFocus>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="p-4 text-sm">Account settings</TabsContent>
      <TabsContent value="notifications" className="p-4 text-sm" keepMounted>Notification preferences</TabsContent>
    </Tabs>
  );
}

export function LineStyle() {
  return <SettingsTabs />;
}
```

## Custom elements and persistent panels

`render` preserves the primitive semantics and refs on a custom element. Hidden panels unmount by default; `keepMounted` keeps the draft textarea and its value when History is selected. Render callbacks must spread merged props and retain children, including the indicator.

<ComponentExample name="persistent" />

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";

export function Persistent() {
  return (
    <Tabs defaultValue="draft" className="w-full max-w-md">
      <TabsList aria-label="Editor views">
        <TabsTrigger value="draft" render={<button type="button" />}>Draft</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="draft" keepMounted render={<section />}>
        <textarea aria-label="Draft text" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" defaultValue="Work in progress" />
      </TabsContent>
      <TabsContent value="history" className="p-4 text-sm">Previous revisions</TabsContent>
    </Tabs>
  );
}
```

## List sizing

The caller sets the list width. Resize list switches between content width and full width; the selected indicator follows the same tab without resetting selection. A parent resize is also observed.

<ComponentExample name="list-sizing" />

```tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";
import { Button } from "@/components/cadence/button";

function ProjectTabs({ orientation = "horizontal", variant = "default", wide = false, disabled = false, value, onValueChange }: {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "line";
  wide?: boolean;
  disabled?: boolean;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  return (
    <Tabs defaultValue="overview" value={value} onValueChange={onValueChange} orientation={orientation} className="w-full max-w-md">
      <TabsList aria-label="Project views" variant={variant} className={wide ? "w-full" : undefined}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        {disabled && <TabsTrigger value="locked" disabled>Locked</TabsTrigger>}
      </TabsList>
      <TabsContent value="overview" className="rounded-lg border p-4 text-sm">Project overview. Peer views share one selection indicator.</TabsContent>
      <TabsContent value="activity" className="rounded-lg border p-4 text-sm">Recent activity.</TabsContent>
    </Tabs>
  );
}

export function ListSizing() {
  const [wide, setWide] = useState(false);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Button variant="outline" size="sm" className="self-start" onClick={() => setWide((value) => !value)}>Resize list</Button>
      <ProjectTabs wide={wide} />
    </div>
  );
}
```

## Disabled

Locked stays visible and cannot be selected. Base UI allows focus on this disabled tab; Enter and Space leave the current selection unchanged.

<ComponentExample name="disabled" />

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cadence/tabs";

function ProjectTabs({ orientation = "horizontal", variant = "default", wide = false, disabled = false, value, onValueChange }: {
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "line";
  wide?: boolean;
  disabled?: boolean;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  return (
    <Tabs defaultValue="overview" value={value} onValueChange={onValueChange} orientation={orientation} className="w-full max-w-md">
      <TabsList aria-label="Project views" variant={variant} className={wide ? "w-full" : undefined}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        {disabled && <TabsTrigger value="locked" disabled>Locked</TabsTrigger>}
      </TabsList>
      <TabsContent value="overview" className="rounded-lg border p-4 text-sm">Project overview. Peer views share one selection indicator.</TabsContent>
      <TabsContent value="activity" className="rounded-lg border p-4 text-sm">Recent activity.</TabsContent>
    </Tabs>
  );
}

export function Disabled() {
  return <ProjectTabs disabled />;
}
```

## When to use

- Peer views of the same project.
- Settings categories that share a local context.
- Editors with preview and history panels.

## When not to use

- Use links and Breadcrumb for separate destinations.
- Use Accordion for sections that can remain open together.
- Use ToggleGroup for a set of independent formatting actions.

## API

### `Tabs`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | Base UI tab value | uncontrolled / `0` | Controlled or initial selection; null means none. |
| `onValueChange` | `(value, details) => void` | — | Change request with reason, activation direction and cancellation. |
| `orientation` | `horizontal` / `vertical` | `horizontal` | Layout and keyboard axis. |
| `className`, `style`, `render`, `ref` | Base UI Root props | — | Forwarded, including state callbacks. |

### `TabsList`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `default` / `line` | `default` | Filled surface or edge indicator. |
| `activateOnFocus` | `boolean` | `false` | Select on arrow focus. |
| `loopFocus` | `boolean` | `true` | Wrap focus at either end. |

All Base UI List props pass through. `tabsListVariants` is exported for composing styles.

### `TabsTrigger`

`value` identifies the corresponding panel. `disabled` defaults to false. All Base UI Tab props pass
through, including `nativeButton`, `render`, `ref`, events and state-based classes/styles. User classes
merge last. The added `tabs-indicator` slot is decorative and aria-hidden.

### `TabsContent`

`value` links to the corresponding trigger. `keepMounted` defaults to false. All Base UI Panel props,
render/ref and state callbacks remain available. Panels switch immediately without size or entrance motion.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Selection | Shared indicator transform via FLIP | `layout.shared`, physics-defined `spring.morph` | Yes, inherits velocity |
| Initial selection | Static indicator at selected trigger | — | — |
| Reduced | Static indicator, no layout/transform | No motion | Instant |
| None | Static indicator, no transform or animation | Zero duration | Instant |

Each list has a unique LayoutGroup. Default and line indicators follow both axes; independent and nested
lists cannot exchange indicators. Shared-layout measurements use list-local coordinates, so panel reflow,
parent recentering and page scrolling do not add a sideways or vertical detour to the selection path.
The primitive owns active state, cancellation, disabled fallback and
mounting. Reduced and none render a plain span with no layoutId. Parent size changes leave the indicator
anchored to the selected trigger. There is no panel fade, height animation or extra recipe.

## Accessibility

Base UI provides tablist/tab/tabpanel roles, linked IDs and roving focus. Supply a list label. Selection
is exposed through aria-selected; focus remains on the operated tab. Disabled tabs remain arrow-focusable for discoverability but cannot activate. A custom
render must preserve supplied semantics, refs and children. Persistent hidden panels leave the focus order.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Left / Right | Move horizontal tab focus; direction follows the surrounding DirectionProvider. |
| Up / Down | Move vertical tab focus. |
| Home / End | Focus the first / last tab, including disabled tabs. |
| Enter / Space | Select the focused tab in default manual activation mode. |
| Tab / Shift+Tab | Leave the list for the panel or surrounding page. |

## Responsive behavior

No breakpoint changes selection or orientation. The caller chooses layout and may constrain or scroll
long lists. The indicator is inset within its active trigger and follows changes in label and parent size.

## Performance

T3 source budget: 12 KB gzip. Only the active indicator participates in shared layout projection;
there are no measurement observers or animation timers in this component. Server output includes the
initial selected indicator; initial=false avoids an entrance replay. Keep large lists and panels small.

## Notes for AI

- Preserve all five exports and the four upstream slots.
- Use value/defaultValue, not the retired animated-tabs items API.
- Keep each list scoped and preserve the explicit reduced/none static branch.
- Related: Accordion, Collapsible, ToggleGroup.

---

Full index: https://cadence.dev/llms.txt
