# Accordion motion contract

Status: target design; implementation and verification pending.

The motion makes each disclosure feel attached to its own heading: the panel opens along its block axis, its content becomes readable, and the trigger indicator confirms the same state. Multiple open items remain independent. This contract covers `Accordion`, `AccordionItem`, `AccordionTrigger` and `AccordionContent`, including the existing header, trigger-icon and content-inner slots.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Bindings below are design references, not public props or recipe identifiers.

## Capability ownership

| Capability | Applicability and owner |
| --- | --- |
| Appearance | Default: an opened `accordion-content` reveals its owned inner surface. A later inserted item may enter only when its collection has not already supplied presence; SSR items remain visible in their semantic state. |
| Size | Default: `accordion-content` owns measured block-size for expansion and a known content update while open. The inner slot supplies natural size; the root does not spring after its panels. |
| Surface colour | Default: trigger/item hover, active or disabled surfaces transition only when the component defines a changed semantic colour. No decorative background is invented. |
| Text colour | Default: trigger state colour; content inherits its semantic foreground without a second colour writer. |
| Changed text | Default for directly owned plain trigger and content strings; preserve unchanged graphemes. Arbitrary rich heading/content nodes remain caller-owned and use composed text owners. |
| Changed numbers | Default for a supported direct numeric quantity in the trigger or content; composed for a nested badge/statistic. Digit-containing strings, item values and numeric section identifiers remain text, not inferred counters. |

## Choreography and modes

| Trigger and owner | Full | Reduced | None | Binding → preset → recipe |
| --- | --- | --- | --- | --- |
| Open/close or known content resize; content shell | Clamped block-size follows current geometry to its new target; opening and closing are reversible. | Final size immediately. | Final size immediately. | `accordion.content.resize` → `geometry.content` → `geometry.resize` |
| Open/close; inner content paint | Short opacity entry/exit coordinated with the shell, without a second height writer. | Short opacity only. | Semantic visibility immediately. | `accordion.content.enter` → `presence.inline` → one-shot `data.transition`; `accordion.content.exit` → `presence.exit` → `exit.fade` |
| Expanded state; trigger-icon | The existing indicator changes state locally; no replacement of the trigger or focus node. | Final indicator, permitted short opacity. | Final indicator immediately. | `accordion.indicator.change` → `state.indicator` → `state.morph` |
| Hover/disabled/state foreground; trigger | Scoped surface and text colour. Focus indication is immediate. | Short colour feedback. | Final colours immediately. | `accordion.trigger.colour` → `state.color` → planned `state.color` |
| Owned plain trigger/content text changes | Animate only changed graphemes/runs, without stagger; an opening content entrance consumes same-cause text entry. | Short opacity on changed runs only. | Final text immediately. | `accordion.label.replace` → `text.replace` → planned `text.change` |
| Direct quantity changes; owned display | Roll only changed places and coordinate any content-height change with the existing panel owner. | Final quantity/geometry immediately. | Final quantity/geometry immediately. | `accordion.value.change` → `number.compact` → `number.roll` |
| Independent item insertion; item paint | Opacity only when a parent has not consumed this cause; initially open content does not run another entry. | Short opacity. | Visible immediately. | `accordion.item.enter` → `presence.inline` → one-shot `data.transition` |

## Interruption and lifecycle

- Rapid toggles reverse from the current rendered size; a reopened panel does not replay a hidden initial state. Latest controlled state wins, including multiple-item updates.
- A nested disclosure owns its own changing height. Its ancestor resolves the new layout without chasing the child's intermediate frames; coordinate a single owner if both intentionally close together.
- Closing immediately updates expanded/focus/accessibility semantics through Base UI. Do not apply inert/hidden to a subtree before the primitive has handled an affected focused control; outgoing visual copies have no focus targets. Respect persistence, custom `render`, hidden-until-found and beforematch reopening rather than retaining semantic nodes solely for animation.
- Unmount disconnects measurement and cancels the writer. Live reduced/none changes and a zero clock settle size before paint, cancel delays and preserve the correct final indicator/content state; re-enabling motion does not replay it.

## Geometry and performance

Measure the natural inner block-size outside render, accounting for the actual content box. Clamp to the valid closed and available bounds with no bounce; do not animate padding. Clip only the disclosure body, not the trigger ring or descendant portals. Size animation produces real reflow for nearby items. Passive viewport/font changes resolve immediately. Observe open or transitioning panels only and batch measurements when several items change; do not measure arbitrary descendants or multiply nested observers.

Lay inner text out at its destination inline-size before measuring; the separate panel shell animates only block-size. Surrounding siblings move with the shell, while its text does not repeatedly wrap on each height frame.

## Acceptance scenarios

- Pending: reverse opening and closing repeatedly, then update controlled values for several items; each ends at the latest size with correct expanded state.
- Pending: change text and nested content while open; verify unchanged characters remain still and only one owner writes each height.
- Pending: exercise keyboard focus, custom render, persisted/searchable content and unmount during exit in all modes, including live mode changes and zero clock.
- Pending: verify SSR/no-JS visibility, first hydration, long content, constrained width and focus-ring/portal clipping.
- Pending: change a direct quantity versus a numeric section identifier; insert an initially open item; trigger beforematch while a close is running, then remove the item. No duplicate content entrance or stale close completion survives.
