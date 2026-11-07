# Label motion contract

Status: target design; implementation and verification pending.

Label clarifies changes to a control's name without moving the click-to-focus relationship. It does not add floating-label behaviour. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["label#Label"],
    "text": ["label#Label"],
    "value": ["label#Label"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                                                                                           | References                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Appearance      | default: label for independent insertion; inherited when a Field or other parent owns the same insertion.                                                                                                    | default: `label.root.enter`                      |
| Size            | default: label owns a content-driven intrinsic box when independently laid out; inherited by a coordinating Field geometry transaction; passive wrapping is immediate.                                       | default: `label.root.resize`                     |
| Surface colour  | not applicable to the default transparent label surface; composed if the caller deliberately supplies a stateful surface.                                                                                    | not-applicable: `@root`; composed: `@root`       |
| Text colour     | default: label foreground on authored disabled/invalid/context changes; inherited when a parent owns that foreground property.                                                                               | default: `label.root.colour`                     |
| Changed text    | default: direct plain label text uses changed-only replacement; composed for structured rich labels.                                                                                                         | default: `label.text.replace`; composed: `@text` |
| Changed numbers | default: a supported direct numeric child is the quantity signal, with existing display output preserved; numeric field names/identifiers supplied as strings remain text, and rich quantities are composed. | default: `label.value.roll`; composed: `@value`  |

## Choreography and modes

| Trigger / owner                                    | full                                                                                       | reduced                                               | none       | Binding → preset → recipe/form                                                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Independent insertion / label                      | Opacity entrance.                                                                          | Short opacity.                                        | Immediate. | `label.root.enter` → `presence.inline` → `data.transition/opacity`                                                                    |
| Name changes / display text                        | Replace changed graphemes with stagger:none; keep the native label and semantic name live. | Short changed-text opacity without travel or stagger. | Immediate. | `label.text.replace` → `text.replace` → `text.change/changed-runs`                                                                    |
| Display quantity changes / numeric content         | Roll changed places only.                                                                  | Final value immediately.                              | Immediate. | `label.value.roll` → `number.compact` → `number.roll/reels`                                                                           |
| Content box or foreground changes / declared owner | Bounded intrinsic size and scoped colour transition.                                       | Size immediate; short colour.                         | Immediate. | `label.root.resize` → `geometry.compact` → `geometry.resize/measured`; `label.root.colour` → `state.color` → `state.color/foreground` |

## Interruption and lifecycle

Repeated renames target the latest string and retain unchanged graphemes. The native label is never replaced by a visual proxy: htmlFor, nested control activation and accessible naming remain current. Parent removal governs exit retention. On live reduction, finish geometry and numeric effects immediately; none or a zero clock also finishes opacity/colour and removes stale overlays.

## Geometry and performance

Only a locally owned content box is measured after commitment. Lay out a wrapping label at the final available width, then animate the owning host's block size; do not repeatedly rewrap it along an interpolated width. Field may consume that size transaction instead of competing with it. Responsive wrapping and focus-driven layout remain immediate. Do not split interactive rich descendants, delay required markers, animate aria text, or introduce input event handlers.

If a smaller intermediate box would hide the final visible control name or required marker, expose that content within existing overflow or commit block size immediately. Use one plain-label text transaction and at most one direct numeric display; shared diff/reel limits apply with immediate affected-content fallback. An identifier must remain supplied as a string rather than asking motion to infer intent from a numeric child, and mixed rich labels require explicit quantity composition rather than DOM inspection. Unmount releases the optional measurement and decorative text layers; no retired label may retain a second click-to-focus target.

## Acceptance scenarios

Target acceptance; not executed: a localized label with unchanged substrings; htmlFor and wrapping labels; disabled-state foreground; structured label with link; identifier versus quantity content; Field-coordinated size; rapid renames and all modes including zero clock.

Also pending: a multiline rename in a clipped Field and label replacement while its control is focused; the full final-visible name, association, selection and one accessible/copyable label remain intact.
