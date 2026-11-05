# Tabs

> Switch between peer views with a shared selection indicator.

- Registry item: https://cadence.dev/r/tabs.json
- Install: `npx shadcn@latest add @cadence/tabs`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: layout.shared

## Installation

```install
npx shadcn@latest add @cadence/tabs
```

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
| Home / End | Focus the first / last enabled tab. |
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
