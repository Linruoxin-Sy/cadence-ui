# Collapsible motion contract

Status: target design; implementation and verification pending.

Collapsible is a quiet, general disclosure: the body opens from its trigger without prescribing an arrow, a heading style or an accordion relationship. `CollapsibleContent` owns its shell and the existing content-inner measurement surface; the trigger's actual children remain the caller's choice.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). Local bindings describe target design, not installable API.

## Capability ownership

| Capability | Applicability and owner |
| --- | --- |
| Appearance | Default: content opacity accompanies semantic opening/closing. Parent presence suppresses a duplicate same-cause entrance; initial visible content is never re-hidden after SSR. |
| Size | Default: content owns measured block-size for open state and known intrinsic content changes. The root and nested children do not add a second writer. |
| Surface colour | Default where the trigger defines state surfaces; a bare unstyled trigger receives no invented background. Nested controls inherit their own contracts. |
| Text colour | Default for component-defined trigger foreground changes; other text inherits the current semantic colour. |
| Changed text | Default for a directly owned plain trigger/body string; arbitrary rich trigger/body content is composed and not recursively rewritten. |
| Changed numbers | Default for a supported direct numeric quantity in trigger/body display; composed for nested numeric components. Numeric-looking strings and identifiers remain text; editable descendants never roll. |

## Choreography and modes

| Trigger and owner | Full | Reduced | None | Binding → preset → recipe |
| --- | --- | --- | --- | --- |
| Open, close or known content update; content shell | Compact clamped block-size continuity from the current size. | Final natural/closed size immediately. | Final size immediately. | `collapsible.content.resize` → `geometry.compact` → `geometry.resize` |
| Visibility change; inner paint | Opacity entry/exit without vertical translation of reading content. | Short entry after final open geometry; fully clipped closed body completes immediately. | Immediate semantic visibility. | `collapsible.content.enter` → `presence.inline` → one-shot `data.transition`; `collapsible.content.exit` → `presence.exit` → `exit.fade` |
| Defined trigger state changes | Scoped surface/text colour; focus ring immediately. | Short colour. | Final colour immediately. | `collapsible.trigger.colour` → `state.color` → planned `state.color` |
| Direct plain trigger/body text changes | Changed graphemes/runs only, no stagger; opening presence consumes same-cause body text entry. | Short opacity on changed runs only. | Final text immediately. | `collapsible.label.replace` → `text.replace` → planned `text.change` |
| Direct displayed quantity changes | Changed place-value reels only; body geometry stays with the content shell. | Final quantity/geometry immediately. | Final quantity/geometry immediately. | `collapsible.value.change` → `number.compact` → `number.roll` |

## Interruption and lifecycle

- Reverse from the in-flight block-size on a repeated toggle. A close during asynchronous content replacement targets the current valid closed size; subsequent content cannot reopen it.
- Preserve Base UI state, callbacks, custom render, persistence and hidden-until-found behaviour. Do not add an arrow or impose a delay before a committed action.
- Descendant geometry updates do not make the ancestor follow every spring frame. Hand off the affected axis or let the ancestor adopt the child's destination immediately.
- Exit retention never creates accessible or focusable duplicate content. Base UI handles focus and hidden-until-found/beforematch semantics before decorative cleanup; a browser-initiated reopen invalidates the close completion. Unmount cancels observers/writers. A live reduced/none switch or zero clock synchronously reaches semantic size and visibility; re-enabling animation does not replay an already open body.

## Geometry and performance

Measure the content-inner natural height and the shell's actual border/padding contribution where box sizing requires it. Avoid feedback from a clipped intermediate measurement. Clamp to closed and available size with no overshoot. Reflow surrounding content through the one shell; clip the body only. Passive font, viewport or unknown-origin changes resolve immediately. Stop observing removed/irrelevant parts and batch nested updates; no per-descendant measurement or render-time layout reads.

The natural inner content lays out at destination inline-size before measurement. Only the separate outer shell changes block-size, so nearby layout moves without per-frame text wrapping inside the disclosure.

Reduced closing commits the closed block-size immediately. A fully clipped/hidden body has no visible exit opacity to retain, so complete that body's decorative exit immediately through the primitive; do not hold empty space just to run a fade. A short opacity entry is permitted after the open geometry is final. On focus/beforematch opening, settle any envelope that would hide the target immediately. This does not replace native persistence, focus or hidden-until-found handling.

## Acceptance scenarios

- Pending: reverse rapidly with content growth, then close before the latest content arrives; verify state, height and focus agree.
- Pending: nest disclosures and place one inside a resizing parent; inspect that no two writers chase the same axis.
- Pending: test custom trigger/render, persisted/searchable content, border-box styles and unmount during exit.
- Pending: verify full/reduced/none, live mode changes, zero clock and initially open SSR without a hidden flash.
- Pending: revise a direct body string/quantity while open and while closed, reopen through beforematch, and close around a focused child; only current visible content participates in animation.

- Pending: close a reduced-mode body during its opacity entry, reopen through focus/beforematch and set zero clock with unchanged open state; no empty exit hold, invisible focused content or stale opacity writer remains.
