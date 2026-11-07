# Badge motion contract

Status: target design; implementation and verification pending.

Badge makes a compact status or quantity change legible without bouncing the surrounding sentence. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); the bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["badge#Badge"],
    "label": ["badge#Badge"],
    "value": ["badge#Badge"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                 | References                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Appearance      | default: badge for dynamic insertion; inherited when an enclosing item owns the same entrance.                                                     | default: `badge.root.enter`, `badge.root.exit`     |
| Size            | default: badge owns intrinsic inline size as its display content changes; constrained or wrapping layout is clamped.                               | default: `badge.root.resize`                       |
| Surface colour  | default: badge background and border on variant and actual interactive state changes.                                                              | default: `badge.root.colour`                       |
| Text colour     | default: badge foreground and inheriting currentColor icons.                                                                                       | default: `badge.root.colour`                       |
| Changed text    | default: direct plain string children use changed-only replacement; composed for rich child content.                                               | default: `badge.label.replace`; composed: `@label` |
| Changed numbers | default: supported direct numeric children use compact rolling with their existing output; numeric-label/version/identifier strings remain text, and rich quantities use explicit composition. | default: `badge.value.roll`; composed: `@value`    |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                            | full                                                                         | reduced                                     | none       | Binding → preset → recipe/form                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent add/remove / badge             | Opacity entrance and retained exit.                                          | Short opacity only.                         | Immediate. | `badge.root.enter` → `presence.inline` → `data.transition/opacity`; `badge.root.exit` → `presence.exit` → `exit.fade/opacity`              |
| Status label changes / label               | Replace only changed graphemes, stagger:none; resize the badge concurrently. | Short changed-text opacity; size immediate. | Immediate. | `badge.label.replace` → `text.replace` → `text.change/changed-runs`; `badge.root.resize` → `geometry.compact` → `geometry.resize/measured` |
| Quantity changes / numeric display         | Roll changed places; keep affixes stable and share the width transaction.    | Final quantity immediately.                 | Immediate. | `badge.value.roll` → `number.compact` → `number.roll/reels`                                                                                |
| Variant or actual link interaction / badge | Scoped background, border and foreground transition.                         | Short colour feedback.                      | Immediate. | `badge.root.colour` → `state.color` → `state.color/surface-foreground`                                                                     |

## Interruption and lifecycle

Rapid count changes retarget to the newest quantity and do not queue old values. Returning to the previous label preserves surviving grapheme identity. An exit requires a parent that can retain the badge; unmount disposes observers and visual copies. Live reduced cancels reel/width work; none or a zero clock removes all active transitions and delays. Semantic text is always the latest committed value.

## Geometry and performance

One inline-size measurement owner prevents a label and a count from competing. Reserve an existing fixed/minimum width when supplied. Preserve the badge's single-line content layout and resolve the destination width before interpolation; surrounding row wrapping is the parent's layout event. Do not animate unchanged digits, replay icons, or infer interaction on the default span. Badge rendered as an anchor keeps its normal navigation and focus behaviour; hover does not create a new clickable affordance on plain badges.

Do not hide final-visible status text behind a smaller intermediate width: keep it visible within existing overflow rules or commit that axis immediately. Parent rows consume the final badge box rather than remeasure each animation frame. Allow one label/quantity transaction per badge; high-frequency revisions coalesce, and shared glyph/reel limits or unsafe shaping fall back to the correct affected content immediately. Direct numeric values may roll; strings such as `00123` and mixed affix JSX are never heuristically parsed.

## Acceptance scenarios

Target acceptance; not executed: status changes with shared prefixes; positive/negative and digit-count quantity changes; version-like labels; adjacent badges wrapping; interactive render and default span; parent entrance suppression; rapid updates and live modes including zero clock.

Also pending: changed status text in a clipped narrow row, a reused badge identity during exit, and a formatted numeric string versus a direct number; preserve readability, latest identity and single accessible/copyable text.
