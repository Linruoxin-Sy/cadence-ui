# Progress motion contract

Status: target design; implementation and verification pending.

Determinate progress uses one committed target for its fill and formatted value. Indeterminate progress communicates activity without fabricating a percentage or completion. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["progress#Progress"],
    "indicator": ["progress#ProgressIndicator"],
    "value": ["progress#ProgressValue"],
    "label": ["progress#ProgressLabel"],
    "surface": [
      "progress#ProgressTrack",
      "progress#ProgressIndicator",
      "progress#ProgressLabel",
      "progress#ProgressValue"
    ]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                               | References                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Appearance      | Default: `progress` owns one entrance; track, indicator, label and value inherit it.                                                                                                                                                                                                | default: `progress.root.enter`                          |
| Size            | Default: content-driven label/value arrangement may change root height; the root shell owns this bounded geometry. Track length remains caller-owned; fill extent is data geometry.                                                                                                 | default: `progress.root.resize`                         |
| Surface colour  | Default: `progress-track` and `progress-indicator` own caller-driven semantic surface colours; no completion colour is invented.                                                                                                                                                    | default: `progress.surface.colour`                      |
| Text colour     | Default: `progress-label` and `progress-value` own their explicit/inherited foreground token changes.                                                                                                                                                                               | default: `progress.surface.colour`                      |
| Changed text    | Default for plain `ProgressLabel` content; retain unchanged graphemes. Rich label children use composed ownership.                                                                                                                                                                  | default: `progress.label.change`; composed: `@label`    |
| Changed numbers | Default: `progress-value` owns formatted determinate value changes using the root's value/range/format semantics. A direct numeric quantity supplied to ProgressLabel has its own display owner; it is not inferred to be the progress value. `null` has no inferred numeric value. | default: `progress.value.change`, `progress.label.roll` |

## Choreography and modes

| Trigger / owner                               | Full                                                                                                                                               | Reduced                            | None                               | Binding → preset → recipe/form                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Independent insertion / root                  | Opacity entrance at the actual current progress; no zero-to-value introduction.                                                                    | Short opacity.                     | Final state immediately.           | `progress.root.enter` → `presence.inline` → `data.transition/opacity`         |
| Determinate value / indicator                 | Retarget bounded fill from the current visual position; never overshoot min/max. Share the committed revision and compatible bounded phase with the readout; otherwise show that readout immediately. | Final fill immediately.            | Final fill immediately.            | `progress.indicator.update` → `data.progress` → `data.transition/determinate` |
| Determinate formatted value / value           | Roll changed places to the same committed target; final accessible value is immediate.                                                             | Final formatted value immediately. | Final formatted value immediately. | `progress.value.change` → `number.compact` → `number.roll/reels`              |
| Indeterminate activity / indicator            | One low-contrast local opacity pulse, only while indeterminate and visible; no travelling marquee.                                                 | Static indeterminate presentation. | Static indeterminate presentation. | `progress.indicator.activity` → `status.loop` → `data.transition/continuous`  |
| Plain label / label                           | Changed-run replacement, `stagger: none`.                                                                                                          | Changed-run opacity only.          | Final label immediately.           | `progress.label.change` → `text.replace` → `text.change/changed-runs`         |
| Direct numeric label / label display owner    | Roll changed places as an independent quantity, with no inferred relation to fill.                                                                 | Final label quantity immediately.  | Final label quantity immediately.  | `progress.label.roll` → `number.compact` → `number.roll/reels`                |
| Semantic token change / relevant parts        | Scoped surface/foreground colour transition.                                                                                                       | Short colour feedback.             | Final colours immediately.         | `progress.surface.colour` → `state.color` → `state.color/surface-foreground`  |
| Known label/value content change / root shell | Measure final content height and clamp; track keeps its caller constraint. Passive wrapping remains immediate.                                     | Final geometry immediately.        | Final geometry immediately.        | `progress.root.resize` → `geometry.compact` → `geometry.resize/measured`      |

## Interruption and lifecycle

- Frequent values coalesce to the latest target; never queue percentages. One presentation transaction supplies a bounded, monotonic phase to the fill path and each compatible changed numeric reel; this phase is not the live completion percentage and does not require partially visible digits to spell the fill's intermediate value. Merely selecting the same snappy preset for independent animations is not synchronization. Semantic values remain final immediately.
- Capture the fill's currently presented extent and the reels' current readable cells at each revision. Fill moves from that extent to the new bounded target; reel trend compares the committed numeric values. Those directions can differ: a previous target of 100 replaced by 80 while fill is still at 60 does not justify moving fill backward or making the numeric trend increase. Use shared-phase rolling only when the current two-cell presentation can be rebased safely under the same monotonic phase and new direction. Otherwise settle that revision's numeric readout immediately, discard its outgoing layers and let fill retarget independently. Never add a third digit cell, reset to an obsolete value or carry velocity that reverses the required reel direction merely to preserve synchronization.
- Each unchanged numeric place remains still even while fill changes. Apply the fallback per committed revision, including rapid carry/sign changes and aggregate reel-budget overflow; it is not a delayed retry when another animation finishes. Hiding the parent settles current data and cancels decorative backlog rather than saving it for replay.
- Switching to `null` or the primitive's indeterminate state cancels numeric rolling and determinate movement. Returning to determinate cancels the pulse, restores current semantic resting opacity and places the known fill/value target without treating the full-width indeterminate shape as a previous percentage or inventing a zero baseline.
- Closing/removing the containing surface stops activity and presentation. Completion is whatever the caller's values/labels say; no delayed completion event or auto-success state.
- Live reduced/none stops the opacity pulse and all disallowed writers immediately. Zero recipe clock settles one-shot fill, text and number work only; the pulse uses its separate theme clock and mode/visibility policy. Unmount releases measurements and loop handles.

## Geometry and performance

- The existing indicator adapter owns fill transform; never animate width concurrently with that transform. Root height measurement is separate from track extent.
- Read final label/value height from a natural content region and size a separate root host; track/fill geometry must not feed that observer. Clamp track extent and root dimensions to valid non-negative bounds. Invalid/unavailable range geometry uses the primitive's final semantic presentation, not an inferred negative percentage.
- Lay label/value content at the final available width before measuring the root's target height, then animate that host. Passive font/viewport reflow remains immediate; no per-frame text rewrapping is authored.
- Each actual indicator has one fill writer and one optional indeterminate opacity owner; all indicators in a root share its presentation transaction. Preserve the automatically rendered track/indicator and any explicitly composed parts rather than imposing a new child-count rule. Mounted ProgressValue parts share the same root transaction when compatible, with one aggregate reel budget across the revision; custom/rich value content uses its documented immediate/composed path. A label/value transaction uses one natural-content measurement, with no per-digit observers.
- Clamp non-default ranges and keep visual fill inside the track; labels/focusable composed content stay outside that clipping boundary.
- If root-height interpolation would temporarily hide its required label/value or a focused composed child, resolve that axis immediately or retain existing legal overflow. Do not add a crop merely to animate progress text. The semantic value/range and any native child operation remain immediate in every mode.

ProgressValue uses the primitive's actual formatted value and determinate/indeterminate status; preserve its children callback and formatter contract. A callback returning rich nodes remains composed. ProgressLabel dispatches a direct string to text replacement or a supported direct quantity to compact reels, never both. Only the actual ProgressValue joins the fill transaction; an unrelated numeric label does not share its magnitude or direction. A range/format change that alters normalization or notation establishes the new fill/value geometry immediately, rather than applying the old numeric direction to a new scale.

## Acceptance scenarios

- Pending: rapid increasing/decreasing values with non-default min/max and locale formats reach the latest target without overflow or stale digits.
- Pending: determinate ↔ indeterminate changes, hidden parent and reduced/none stop the pulse and never invent a percentage. Verify zero recipe clock independently from the continuous theme clock.
- Pending: label wrapping and plain/rich content retain semantics and unchanged characters; initial hydration does not count from zero.
- Pending: update the range and value together, remove the numeric display, or grow its label within a constrained host; fill remains non-negative/bounded and mandatory text never disappears behind an intermediate shell.
- Pending: compare fill and changed-digit progression during interrupted/reversed updates, proving they share one bounded transaction phase when compatible; verify the immediate-readout fallback if that adapter is unavailable.
- Pending: retarget 100 to 80 while fill is still visually at 60, interrupt a carry with another carry, and render multiple formatted ProgressValue/Indicator parts. Fill follows its actual remaining path, numeric trend follows committed values, and incompatible two-cell rebasing uses immediate readout without extra digits, stale percentage baselines or a second fill clock.

- Pending: keep value constant while changing min/max, change formatter scale/locale, provide a rich ProgressValue callback and change a direct numeric ProgressLabel. Preserve native formatted status, one slot writer and no false numeric direction.
