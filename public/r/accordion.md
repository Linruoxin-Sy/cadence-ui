# Accordion

> Reveal related sections while keeping their headings easy to scan.

- Registry item: https://cadence.dev/r/accordion.json
- Install: `npx shadcn@latest add @cadence/accordion`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: geometry.resize

## Installation

```install
npx shadcn@latest add @cadence/accordion
```

## Usage

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/cadence/accordion";

export function Example() {
  return (
    <Accordion defaultValue={["shipping"]}>
      <AccordionItem value="shipping">
        <AccordionTrigger>When will my order arrive?</AccordionTrigger>
        <AccordionContent>Most orders arrive within five working days.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

## Controlled

Base UI uses arrays for both single and multiple selection. Keep the value in caller state.

```tsx
const [value, setValue] = useState<string[]>([]);
<Accordion value={value} onValueChange={setValue}>
  <AccordionItem value="account">
    <AccordionTrigger>Account settings</AccordionTrigger>
    <AccordionContent>Your account details.</AccordionContent>
  </AccordionItem>
</Accordion>;
```

## Multiple sections

```tsx
<Accordion multiple defaultValue={["one", "two"]}>
  <AccordionItem value="one">
    <AccordionTrigger>Delivery</AccordionTrigger>
    <AccordionContent>Track your delivery.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="two">
    <AccordionTrigger>Returns</AccordionTrigger>
    <AccordionContent>Start a return.</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Disabled and persistent content

```tsx
<Accordion keepMounted>
  <AccordionItem value="locked" disabled>
    <AccordionTrigger>Unavailable section</AccordionTrigger>
    <AccordionContent>This content remains mounted while closed.</AccordionContent>
  </AccordionItem>
</Accordion>
```

`keepMounted`, `hiddenUntilFound`, `render`, orientation, refs, and Base UI event details pass through.
A custom panel render must preserve the supplied children and props so measurement and lifecycle work.

## When to use

- FAQ answers that readers scan by heading.
- Related settings sections with optional detail.
- Compact reference material with meaningful section titles.

## When not to use

- Use Collapsible for a single disclosure without grouped navigation.
- Use Tabs for peer views occupying one shared panel.
- Keep essential instructions visible rather than hiding them.

## API

### `Accordion`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `Value[]` | uncontrolled / `[]` | Expanded item values. |
| `onValueChange` | `(value, details) => void` | — | Caller-owned controlled state. |
| `multiple` | `boolean` | `false` | Permit several expanded items. |
| `disabled` | `boolean` | `false` | Disable all items. |
| `orientation` | `"vertical" | "horizontal"` | `"vertical"` | Deprecated; retained as state only. |
| `keepMounted` | `boolean` | `false` | Keep closed panels in the DOM. |
| `hiddenUntilFound` | `boolean` | `false` | Allow browser find-in-page to reveal content. |

### `AccordionItem`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | generated | Stable identity for controlled state. |
| `disabled` | `boolean` | `false` | Disable this item's trigger. |

### `AccordionTrigger`

All Base UI Trigger props pass through, including `render`, `ref`, and `nativeButton`. A heading wraps
the trigger. Two decorative icons swap immediately with `aria-expanded`; no rotation is animated.

### `AccordionContent`

All Base UI Panel props pass through, including `keepMounted`, `hiddenUntilFound`, `render`, `style`,
and `ref`. `className` styles the inner content, matching upstream; `style` applies to the panel.
Root and Item classes merge last.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| Open / close / content resize | Measured height clamped at zero | `geometry.resize` CSS form: `duration.slow` / `ease.out` | Yes, native CSS reversal from current height |
| Initially open | Natural height, no entrance | — | — |
| Reduced | Instant height, no transform | Zero duration | Yes |
| None | Instant height, no transform or transition | Zero duration | Yes |

The CSS form preserves position on interruption rather than spring velocity. Base UI owns panel
mounting, hidden state, keyboard navigation, and find-in-page behavior. An inner ResizeObserver
retargets changes in content without observing the animated panel itself. The closed size is zero.

## Accessibility

Triggers expose expanded state and control labelled regions. Focus stays on the trigger when a
panel toggles. Give each trigger a meaningful heading; do not place interactive controls inside it.
Disabled items are skipped in tab navigation. Content controls remain in normal tab order.

## Keyboard interactions

| Keys | Action |
| --- | --- |
| Enter / Space | Toggle the focused trigger. |
| Tab / Shift+Tab | Follow normal page order through triggers and open content. |

Base UI 1.6 follows the updated APG guidance without arrow-key roving focus. `orientation` and
`loopFocus` are deprecated passthrough props; neither changes keyboard focus behavior.

## Responsive behavior

The root fills its container. Long headings wrap and the icons retain their size. Content is
remeasured when wrapping changes; there is no fixed maximum height or breakpoint-specific state.

## Performance

T3 budget: 12 KB gzip. One observer per mounted content slot; closed panels unmount by default.
Measurements run after commit and on content resize, never during render. No timers drive motion.
Server-rendered initially open content keeps its natural size before hydration.

## Notes for AI

- Use the Base UI array value API, not Radix `type="single"` or `collapsible` props.
- Preserve all four exports and the trigger-icon slot when customising.
- Keep the measurement wrapper and mode branch when editing motion.
- Related: Collapsible for a standalone disclosure; Tabs for alternate views.

---

Full index: https://cadence.dev/llms.txt
