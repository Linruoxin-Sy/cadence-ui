# Collapsible

> Reveal optional detail with a standalone disclosure.

- Registry item: https://cadence.dev/r/collapsible.json
- Install: `npx shadcn@latest add @cadence/collapsible`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: geometry.resize

## Installation

```install
npx shadcn@latest add @cadence/collapsible
```

## Usage

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/cadence/collapsible";

export function Example() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Show project details</CollapsibleTrigger>
      <CollapsibleContent>Optional project information.</CollapsibleContent>
    </Collapsible>
  );
}
```

## Controlled

```tsx
const [open, setOpen] = useState(false);
<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger>Project details</CollapsibleTrigger>
  <CollapsibleContent>Caller-owned expanded state.</CollapsibleContent>
</Collapsible>;
```

## Custom trigger

```tsx
<Collapsible defaultOpen>
  <CollapsibleTrigger render={<Button variant="outline" />}>Toggle details</CollapsibleTrigger>
  <CollapsibleContent className="text-sm">Initially visible without an entrance animation.</CollapsibleContent>
</Collapsible>
```

Import Button from `@/components/cadence/button`. The primitive supplies button semantics and expanded state.

## Persistent and searchable content

```tsx
<Collapsible>
  <CollapsibleTrigger>Reference notes</CollapsibleTrigger>
  <CollapsibleContent hiddenUntilFound>Find this text with browser search.</CollapsibleContent>
</Collapsible>
```

Use `keepMounted` to retain local content state while closed. `hiddenUntilFound` overrides it and lets
supporting browsers reveal content through find-in-page. Put these props on Content, not the root.

## When to use

- Optional details for one independent section.
- Advanced settings beside a visible summary.
- Supporting reference notes that users may reveal on demand.

## When not to use

- Use Accordion for a group of labelled sections.
- Use Tabs for peer views sharing one panel.
- Keep essential instructions visible.

## API

### `Collapsible`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` / `defaultOpen` | `boolean` | uncontrolled / `false` | Controlled or initial expanded state. |
| `onOpenChange` | `(open, details) => void` | — | State change request; details support cancellation. |
| `disabled` | `boolean` | `false` | Ignore trigger interaction. |
| `className`, `style`, `render`, `ref` | Base UI Root props | — | Forwarded unchanged, including state callbacks. |

### `CollapsibleTrigger`

All Base UI Trigger props pass through, including `disabled`, `nativeButton`, `render`, `ref`, and
state-based classes/styles. Use `render`, not `asChild`, for a custom element. Supply an accessible name.

### `CollapsibleContent`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `keepMounted` | `boolean` | `false` | Keep closed content in the DOM. |
| `hiddenUntilFound` | `boolean` | `false` | Reveal via browser find-in-page; overrides keepMounted. |
| `className`, `style`, `render`, `ref` | Base UI Panel props | — | Applied to the outer panel; classes merge last. |

All primitive props remain available. A custom render must preserve supplied children and props,
including the natural measurement wrapper. The added `collapsible-content-inner` slot is structural.
Put padding and borders inside Content so the closed outer panel can reach zero height.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Open / close / content resize | Measured height clamped at zero | `geometry.resize` CSS form: `duration.slow` / `ease.out` | Yes, native reversal from current position |
| Initially open | Natural height without entrance | — | — |
| Reduced | Instant height, no transform | Zero duration | Yes |
| None | Instant height, no transform or transition | Zero duration | Yes |

An inner ResizeObserver watches natural content, never the animated panel. Measurements happen after
commit and on resize. Native CSS reversal preserves position rather than spring velocity. Base UI
owns mounting, hidden state and transition completion. No icon animation or extra recipe is added.

## Accessibility

The trigger exposes `aria-expanded` and `aria-controls`. Content retains Base UI's default div semantics;
add a named region only when the content warrants one. Focus stays on the trigger when toggled.
Disabled controls are skipped in normal tab navigation. Keep interactive content outside the trigger.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Enter / Space | Toggle the focused trigger. |
| Tab / Shift+Tab | Follow normal page order through the trigger and visible content. |

## Responsive behavior

No fixed dimensions or breakpoint-driven state. Natural content is remeasured when wrapping changes.
The root and trigger are unstyled; use caller classes or compose Button for visual feedback.

## Performance

T3 budget: 12 KB gzip. One ResizeObserver per mounted content panel, disconnected on unmount.
Closed content unmounts by default. Initially open server content uses natural height before hydration.
No timers or render-time measurements drive animation.

## Notes for AI

- Use boolean `open`, not Accordion's array value API.
- Keep content lifecycle props on Content and preserve the measurement wrapper.
- Preserve all three exports and the full/reduced/none branch.
- Related: Accordion for grouped sections; Tabs for alternate views.

---

Full index: https://cadence.dev/llms.txt
