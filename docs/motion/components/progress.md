# Progress motion contract

Status: target design; implementation and verification pending.

Determinate progress uses one committed target for its fill and formatted value. Indeterminate progress communicates activity without fabricating a percentage or completion. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Capability ownership

| Capability | Application and owner |
| --- | --- |
| Appearance | Default: `progress` owns one entrance; track, indicator, label and value inherit it. |
| Size | Default: content-driven label/value arrangement may change root height; the root shell owns this bounded geometry. Track length remains caller-owned; fill extent is data geometry. |
| Surface colour | Default: `progress-track` and `progress-indicator` own caller-driven semantic surface colours; no completion colour is invented. |
| Text colour | Default: `progress-label` and `progress-value` own their explicit/inherited foreground token changes. |
| Changed text | Default for plain `ProgressLabel` content; retain unchanged graphemes. Rich label children use composed ownership. |
| Changed numbers | Default: `progress-value` owns formatted determinate value changes using the root's value/range/format semantics. A direct numeric quantity supplied to ProgressLabel has its own display owner; it is not inferred to be the progress value. `null` has no inferred numeric value. |

## Choreography and modes

| Trigger / owner | Full | Reduced | None | Binding → preset → recipe/form |
| --- | --- | --- | --- | --- |
| Independent insertion / root | Opacity entrance at the actual current progress; no zero-to-value introduction. | Short opacity. | Final state immediately. | `progress.root.enter` → `presence.inline` → one-shot `data.transition` |
| Determinate value / indicator | Retarget bounded fill from the current visual position; never overshoot min/max. Coordinate its target, direction and start rhythm with the value. | Final fill immediately. | Final fill immediately. | `progress.indicator.update` → `data.progress` → determinate `data.transition` |
| Determinate formatted value / value | Roll changed places to the same committed target; final accessible value is immediate. | Final formatted value immediately. | Final formatted value immediately. | `progress.value.change` → `number.compact` → revised `number.roll` |
| Indeterminate activity / indicator | One low-contrast local opacity pulse, only while indeterminate and visible; no travelling marquee. | Static indeterminate presentation. | Static indeterminate presentation. | `progress.indicator.activity` → `status.loop` → continuous `data.transition` |
| Plain label / label | Changed-run replacement, `stagger: none`. | Changed-run opacity only. | Final label immediately. | `progress.label.change` → `text.replace` → target `text.change` |
| Direct numeric label / label display owner | Roll changed places as an independent quantity, with no inferred relation to fill. | Final label quantity immediately. | Final label quantity immediately. | `progress.label.roll` → `number.compact` → revised `number.roll` |
| Semantic token change / relevant parts | Scoped surface/foreground colour transition. | Short colour feedback. | Final colours immediately. | `progress.surface.colour` → `state.color` → target `state.color` |
| Known label/value content change / root shell | Measure final content height and clamp; track keeps its caller constraint. Passive wrapping remains immediate. | Final geometry immediately. | Final geometry immediately. | `progress.root.resize` → `geometry.compact` → `geometry.resize` |

## Interruption and lifecycle

- Frequent values coalesce to the latest target; never queue percentages. One presentation transaction supplies the same bounded normalized progress to fill interpolation and every changed numeric reel; merely selecting the same snappy preset for independent animations is not synchronization. Semantic values remain final immediately. If that shared transaction cannot be supplied, update the numeric readout immediately while the fill uses its own bounded animation.
- Each changed numeric place follows the shared bounded reel contract rather than counting through intermediate business values. A reversal adopts the new direction without carrying visually opposite velocity; an unchanged place remains still even while the fill changes. Hiding the parent cancels decorative backlog rather than saving it for replay.
- Switching to `null` cancels numeric rolling and determinate movement; returning to determinate places the known target without a fictitious zero baseline.
- Closing/removing the containing surface stops activity and presentation. Completion is whatever the caller's values/labels say; no delayed completion event or auto-success state.
- Live reduced/none stops the opacity pulse and all disallowed writers immediately. Zero recipe clock settles one-shot fill, text and number work only; the pulse uses its separate theme clock and mode/visibility policy. Unmount releases measurements and loop handles.

## Geometry and performance

- The existing indicator adapter owns fill transform; never animate width concurrently with that transform. Root height measurement is separate from track extent.
- Read final label/value height from a natural content region and size a separate root host; track/fill geometry must not feed that observer. Clamp track extent and root dimensions to valid non-negative bounds. Invalid/unavailable range geometry uses the primitive's final semantic presentation, not an inferred negative percentage.
- Lay label/value content at the final available width before measuring the root's target height, then animate that host. Passive font/viewport reflow remains immediate; no per-frame text rewrapping is authored.
- One fill writer, one optional loop instead of that writer, and one formatted numeric group. A label/value transaction uses one natural-content measurement, with no per-digit observers.
- Clamp non-default ranges and keep visual fill inside the track; labels/focusable composed content stay outside that clipping boundary.
- If root-height interpolation would temporarily hide its required label/value or a focused composed child, resolve that axis immediately or retain existing legal overflow. Do not add a crop merely to animate progress text. The semantic value/range and any native child operation remain immediate in every mode.

ProgressValue uses the primitive's actual formatted value and determinate/indeterminate status; preserve its children callback and formatter contract. A callback returning rich nodes remains composed. ProgressLabel dispatches a direct string to text replacement or a supported direct quantity to compact reels, never both. Only the actual ProgressValue joins the fill transaction; an unrelated numeric label does not share its magnitude or direction. A range/format change that alters normalization or notation establishes the new fill/value geometry immediately, rather than applying the old numeric direction to a new scale.

## Acceptance scenarios

- Pending: rapid increasing/decreasing values with non-default min/max and locale formats reach the latest target without overflow or stale digits.
- Pending: determinate ↔ indeterminate changes, hidden parent and reduced/none stop the pulse and never invent a percentage. Verify zero recipe clock independently from the continuous theme clock.
- Pending: label wrapping and plain/rich content retain semantics and unchanged characters; initial hydration does not count from zero.
- Pending: update the range and value together, remove the numeric display, or grow its label within a constrained host; fill remains non-negative/bounded and mandatory text never disappears behind an intermediate shell.
- Pending: compare fill and changed-digit progression during interrupted/reversed updates, proving they share one normalized presentation transaction; verify the immediate-readout fallback if that adapter is unavailable.

- Pending: keep value constant while changing min/max, change formatter scale/locale, provide a rich ProgressValue callback and change a direct numeric ProgressLabel. Preserve native formatted status, one slot writer and no false numeric direction.
