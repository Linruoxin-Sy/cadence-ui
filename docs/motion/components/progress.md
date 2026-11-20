# Progress motion contract

Status: implemented and verified in `full`, `reduced` and `none` by the component test matrix; browser
matrix, SSR/hydration and performance governance remain as recorded in the task evidence and deferred
under [ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

Determinate progress uses one committed target for its fill and its formatted value. Indeterminate progress
communicates activity without fabricating a percentage or a completion. This contract inherits the
[common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs
or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "root": ["progress#Progress"],
    "bar": ["progress#Progress"],
    "indicator": ["progress#ProgressIndicator"],
    "value": ["progress#ProgressValue"],
    "label": ["progress#ProgressLabel"],
    "surface": ["progress#ProgressTrack"],
    "foreground": ["progress#ProgressLabel", "progress#ProgressValue"]
  },
  "regions": {
    "root": ["progress"],
    "bar": ["progress-indicator"],
    "indicator": ["progress-indicator"],
    "value": ["progress-value-text"],
    "label": ["progress-label-text", "progress-label-number"],
    "surface": ["progress-track"],
    "foreground": ["progress-label", "progress-value"]
  },
  "axes": { "root": ["height"] }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                | References                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Appearance      | Default: `progress` owns one opacity entrance on its root at the already-correct fill and value; the track, indicator, label and value inherit it as native paint, and a presenting parent or hidden host keeps native paint.        | default: `progress.root.enter`                          |
| Size            | Default: the root shell owns one bounded content-driven height measurement after the label/value flow has laid out; the track keeps the caller's width, the fill extent stays data geometry, and passive wrapping remains immediate. | default: `progress.root.resize`                         |
| Surface colour  | Default: `progress-track` owns one scoped background paint set. The indicator hosts the status loop and its fill paint stays static, so no second writer competes on that element.                                                   | default: `progress.surface.colour`                      |
| Text colour     | Default: `progress-label` and `progress-value` each own their explicit/inherited foreground token change as separate hosts, so a label never borrows the readout's clock.                                                            | default: `progress.foreground.colour`                   |
| Changed text    | Default for plain `ProgressLabel` string content; unchanged graphemes are retained. A rich child passes through untouched and owns whatever it composes itself.                                                                      | default: `progress.label.change`                        |
| Changed numbers | Default: `progress-value` owns the primitive's formatted determinate value through the root's value/range/format semantics; a direct numeric `ProgressLabel` is its own independent quantity. `null` has no inferred numeric value.  | default: `progress.value.change`, `progress.label.roll` |

`surface` addresses only the track, and `foreground` only the two text hosts; a colour owner never spans the
fill and its readout. The indicator's own background stays a caller-owned static paint because it already
carries the fill writer and, while indeterminate, the activity loop. `bar` and `indicator` are the two
integration paths of one private fill: the bar a root auto-renders and the indicator a caller composes. Both
bindings exist because each path's rendered host belongs to its own export, and neither duplicates the
other's implementation.

## Choreography and modes

| Trigger / owner                               | Full                                                                                                                                                                                            | Reduced                            | None                               | Binding → preset → recipe/form                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent insertion / root                  | Opacity entrance at the actual current progress; no zero-to-value introduction.                                                                                                                 | Short opacity.                     | Final state immediately.           | `progress.root.enter` → `presence.inline` → `data.transition/opacity`                                                                                  |
| Determinate value / indicator                 | Retarget the fill from its currently presented extent to the same committed target; never overshoot min/max. A normalization or indeterminate-boundary revision settles the target immediately. | Final fill immediately.            | Final fill immediately.            | `progress.indicator.update` → `data.progress` → `data.transition/determinate`; `progress.bar.update` → `data.progress` → `data.transition/determinate` |
| Determinate formatted value / value           | Roll changed places only when the fill keeps its presented extent in that revision; a fill that retargets settles the readout instead. Final accessible value is immediate.                     | Final formatted value immediately. | Final formatted value immediately. | `progress.value.change` → `number.compact` → `number.roll/reels`                                                                                       |
| Indeterminate activity / indicator            | One low-contrast local opacity pulse, only while indeterminate and visible; no travelling marquee.                                                                                              | Static indeterminate presentation. | Static indeterminate presentation. | `progress.indicator.activity` → `status.loop` → `data.transition/continuous`; `progress.bar.activity` → `status.loop` → `data.transition/continuous`   |
| Plain label / label                           | Changed-run replacement, `stagger: none`.                                                                                                                                                       | Changed-run opacity only.          | Final label immediately.           | `progress.label.change` → `text.replace` → `text.change/changed-runs`                                                                                  |
| Direct numeric label / label                  | Roll changed places as an independent quantity, with no inferred relation to the fill.                                                                                                          | Final label quantity immediately.  | Final label quantity immediately.  | `progress.label.roll` → `number.compact` → `number.roll/reels`                                                                                         |
| Track palette target / track                  | Scoped background-colour transition on the track only.                                                                                                                                          | Short colour.                      | Final colour immediately.          | `progress.surface.colour` → `state.color` → `state.color/surface`                                                                                      |
| Label and value foreground / foreground       | Scoped foreground colour transition on each text host.                                                                                                                                          | Short colour.                      | Final colour immediately.          | `progress.foreground.colour` → `state.color` → `state.color/foreground`                                                                                |
| Known label/value content change / root shell | Measure the final content height and clamp; the track keeps its caller constraint. Passive wrapping remains immediate.                                                                          | Final geometry immediately.        | Final geometry immediately.        | `progress.root.resize` → `geometry.compact` → `geometry.resize/measured`                                                                               |

## Interruption and lifecycle

- Frequent values coalesce to the latest target; no percentage queue. The root owns one presentation
  transaction and a committed revision counter. The fill writer reads the previously committed semantics: a
  revision that moves the fill never also claims that its readout shares a bounded monotonic phase, so the
  reel settles that revision immediately instead of presenting two independent clocks as one. Semantic
  values remain final immediately in every mode.
- The fill starts from its presented extent, never from a stored previous target or a full-width
  indeterminate shape. Switching to `null`, or a `min`/`max`/`format`/`locale` change that alters
  normalization or notation, resolves the fill through a zero-length clock so the new geometry is placed
  instantly; returning to determinate cancels the pulse and places the known target without inventing a
  zero baseline.
- Numeric reels keep unchanged places still and apply their fallback per committed revision, including
  carry/sign changes and aggregate reel-budget overflow. Hiding the parent settles current data and
  cancels decorative backlog rather than saving it for replay.
- Closing or removing the surface stops activity and releases the measurement and loop handles. Completion
  is whatever the caller's values and labels say; no delayed completion event or invented success state.
- A live reduced/none change stops the opacity pulse and every disallowed writer on the same hosts. The
  zero recipe clock settles one-shot fill, text and number work only; the pulse keeps its separate theme
  clock and mode/visibility policy.

## Geometry and performance

- The indicator adapter owns the fill transform; width is never animated concurrently with that transform.
  The root-height measurement is separate from the track extent, and the track never feeds that observer.
- Root height is measured from the final label/value flow: the destination reads the host's natural
  content box, resolves the required height from the laid-out parts, and rejects a measurement whose
  parent clip would hide the mandatory text. A caller-fixed height or a non-content box keeps native layout.
- Label/value content lays out at its final available width before the host is sized; passive font and
  viewport reflow stay immediate and no per-frame rewrapping is authored.
- Each indicator has one fill writer and, while indeterminate, one theme-clock opacity owner; all
  indicators in a root share the root transaction. Mounted `ProgressValue` parts share that transaction
  under one aggregate reel budget, and a rich value callback stays composed. One natural-content
  measurement covers the label/value flow with no per-digit observers.
- Non-default ranges clamp the visual fill inside the track; labels and focusable rich content stay outside
  that clipping boundary, and an interpolation that would hide mandatory text resolves the height axis
  immediately instead of adding a crop.

`ProgressValue` renders the primitive's own formatted value and determinate/indeterminate status, and
preserves its `children` callback and formatter contract; a callback returning rich nodes stays composed.
`ProgressLabel` dispatches a direct string to text replacement or a supported direct quantity to compact
reels, never both. Only the actual `ProgressValue` joins the fill transaction; an unrelated numeric label
does not share its magnitude or direction.

## Acceptance scenarios

- Verified: rapid increasing/decreasing values with non-default min/max and locale formats reach the latest
  target without overflow or stale digits.
- Verified: determinate ↔ indeterminate changes stop the pulse and never invent a percentage; the fill
  settles through the zero recipe clock independently from the continuous theme clock.
- Verified: label wrapping and plain/rich content retain semantics and unchanged characters; initial
  hydration does not count from zero.
- Verified: updating the range and value together, removing the numeric display, or growing a label inside
  a constrained host keeps the fill non-negative/bounded and keeps mandatory text out of an intermediate
  shell.
- Verified: interrupted and reversed updates compare fill and changed-digit progression, and the immediate
  readout fallback when the two phases cannot be rebased.
- Verified: retargeting 100 to 80 while the fill is visually at 60, a carry interrupted by another carry,
  and multiple formatted `ProgressValue` parts keep fill on its actual remaining path and the numeric trend
  on committed values, without extra digits, stale baselines or a second fill clock.
- Verified: a constant value with changed min/max, a changed formatter scale/locale, a rich
  `ProgressValue` callback and a changed direct numeric `ProgressLabel` preserve native formatted status,
  one slot writer and no false numeric direction.

Not executed here: real-device frame timing and remaining performance governance, which stay deferred
under [ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).
