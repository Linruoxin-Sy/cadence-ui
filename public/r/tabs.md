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

```tsx
const [value, setValue] = useState<string | null>("overview");
<Tabs value={value} onValueChange={setValue}>{/* List and panels */}</Tabs>;
```

Import `useState` from React. Values may be any Base UI tab value; `null` selects nothing.
The caller owns controlled state. User change requests include cancellable event details.

## Vertical and line style

```tsx
<Tabs defaultValue="account" orientation="vertical">
  <TabsList variant="line" aria-label="Settings" activateOnFocus>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="alerts">Alerts</TabsTrigger>
    <TabsTrigger value="locked" disabled>Locked</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Account settings</TabsContent>
  <TabsContent value="alerts">Alert preferences</TabsContent>
</Tabs>
```

`activateOnFocus` opts into selection on arrow focus. Its default is false; arrows move focus and
Enter or Space selects. Up/Down replace Left/Right in vertical orientation.

## Custom elements and persistent panels

```tsx
<Tabs defaultValue="draft">
  <TabsList aria-label="Editor views">
    <TabsTrigger value="draft" render={<button type="button" />}>Draft</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="draft" keepMounted render={<section />}>
    <textarea aria-label="Draft text" />
  </TabsContent>
  <TabsContent value="history">Previous revisions</TabsContent>
</Tabs>
```

Hidden panels unmount by default. `keepMounted` preserves local state. Render callbacks receive
primitive state and merged props; spread those props and preserve children, including the indicator.

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
lists cannot exchange indicators. The primitive owns active state, cancellation, disabled fallback and
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
