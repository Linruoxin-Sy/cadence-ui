# Spinner motion contract

Status: target design; implementation and verification pending.

Spinner communicates indeterminate activity through rotation in full mode and a visible, named static symbol in reduced and none. Inherit the [shared contract](../README.md) and [preset catalogue](../presets.md); bindings are internal design names.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["spinner#Spinner"],
    "glyph": ["spinner#Spinner"]
  }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                                                 | References                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Appearance      | default: spinner for independent insertion; inherited when Button or a status region owns the same entrance/replacement.           | default: `spinner.root.enter`, `spinner.root.exit` |
| Size            | default for an explicit owned icon-size change; inherited for the parent's reserved icon slot; no size work is caused by rotation. | default: `spinner.root.resize`                     |
| Surface colour  | not applicable to the transparent SVG's default surface; a containing badge/button owns its background.                            | not-applicable: `@root`                            |
| Text colour     | default: SVG currentColor/stroke target transitions; inherited when the parent already owns the foreground transition.             | default: `spinner.glyph.colour`                    |
| Changed text    | not applicable to the SVG; aria-label updates are semantic and immediate; visible status copy is composed.                         | not-applicable: `@root`                            |
| Changed numbers | not applicable: Spinner has no determinate value; a displayed progress quantity is a separate composition.                         | not-applicable: `@root`                            |

## Choreography and modes

The presence.exit bindings below select the exit.fade recipe, not a popup ending phase.

| Trigger / owner                                                     | full                                                                           | reduced                                   | none                       | Binding → preset → recipe/form                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Independent insertion/removal / spinner or retained icon-slot owner | Opacity entrance/exit without delaying status availability.                    | Short opacity with a static glyph.        | Immediate.                 | `spinner.root.enter` → `presence.inline` → `data.transition/opacity`; `spinner.root.exit` → `presence.exit` → `exit.fade/opacity`          |
| Visible indeterminate activity / SVG transform                      | Continuous rotation.                                                           | Static glyph, no rotation.                | Static glyph, no rotation. | `spinner.glyph.busy` → `status.loop` → `data.transition/continuous`                                                                        |
| Authored colour/size changes / SVG or parent slot                   | Scoped stroke colour; bounded owned size change if not controlled by a parent. | Colour may transition; size is immediate. | Immediate.                 | `spinner.glyph.colour` → `state.color` → `state.color/foreground`; `spinner.root.resize` → `geometry.compact` → `geometry.resize/measured` |

## Interruption and lifecycle

Rotation does not encode completion and never chooses a success icon. Caller removal stops rotation before a retained fade; reinsertion uses the latest loading state with no artificial wait. Hidden/offscreen rotation is paused. On live reduced/none, cancel the current rotation writer and expose a stable glyph; none also cancels fades/colours/geometry. A zero recipe clock settles one-shot work only and does not replace the separate continuous theme clock policy. Unmount releases all animation references, and the status name remains meaningful in every mode.

The SVG's rotation writer never owns entry/exit opacity or slot positioning. A hidden/full-mode pause may resume its current phase, but reduced/none exposes the static rest orientation immediately. Returning to full can resume currently active indeterminate activity without replaying an entrance; stale presence completion cannot restart a removed spinner. Parent closure cancels local presence and removes obsolete status semantics from any retained decorative visual.

## Geometry and performance

Use the reserved square icon box and no per-frame measurement. Do not use the rotation transform for simultaneous layout movement; a parent may position the slot. Avoid attaching a layout observer merely because an SVG exists. Parent Button label/width changes share a cause without restarting the spinner entrance. Accessible names are never passed through animated text layers.

An explicit owned icon-size revision uses one final square width/height destination, independent of rotation; a parent-reserved slot owns the size instead when present. No extra measurement is needed for token-resolved dimensions. Keep stroke and clipping consistent with the SVG viewBox and caller overflow; do not use a second scale transform for sizing. Bound active rotation to visible current spinners using shared visibility ownership where available; overload may show the same named static glyph rather than introduce more observers or delay activity state.

## Acceptance scenarios

Target acceptance; not executed: standalone and Button-composed loading; caller label changes; hide/show and removal during rotation; explicit icon-size change; live full to reduced/none and zero clock; static glyph still conveys loading with its accessible name.

Also pending: parent exit while rotation is paused, return to full after a same-target downgrade, and an icon-size update during rotation; one transform writer, one status name and the separate recipe/theme clocks remain correct.
