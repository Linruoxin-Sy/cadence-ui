# Checkbox motion contract

Status: target design; implementation and verification pending.

The box acknowledges selection through its fill and its local check or mixed-state mark. Its hit area stays fixed. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings below are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["checkbox#Checkbox"],
    "indicator": ["checkbox#Checkbox"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                        | References                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Appearance      | Default: `checkbox` fades in when independently inserted; inherited when its parent owns entrance. Initial checked state is already correct. | default: `checkbox.root.enter`  |
| Size            | Inherited: fixed box and hit area follow caller layout immediately. Checkbox has no content-driven size change.                              | inherited: `@root`              |
| Surface colour  | Default: `checkbox` owns checked, mixed, hover, invalid and disabled border/background changes.                                              | default: `checkbox.root.colour` |
| Text colour     | Default: `checkbox-indicator` owns its glyph colour; an external label inherits its own component contract.                                  | default: `checkbox.root.colour` |
| Changed text    | Not applicable: the check and minus are state glyphs, not text. External labels are composed separately.                                     | not-applicable: `@root`         |
| Changed numbers | Not applicable: this control has no numeric display. A numeric-looking label is not a counter.                                               | not-applicable: `@root`         |

## Choreography and modes

| Trigger / owner                      | Full                                                                              | Reduced                | None                        | Binding → preset → recipe/form                                            |
| ------------------------------------ | --------------------------------------------------------------------------------- | ---------------------- | --------------------------- | ------------------------------------------------------------------------- |
| Independent insertion / root         | Opacity entrance; no movement of hit area.                                        | Short opacity.         | Visible target immediately. | `checkbox.root.enter` → `presence.inline` → `data.transition/opacity`     |
| Checked or mixed changes / indicator | Local opacity and `scale.in` to rest; check-to-minus replaces the glyph in place. | Opacity only.          | Final glyph immediately.    | `checkbox.indicator.change` → `state.indicator` → `state.morph/indicator` |
| State changes / root and indicator   | Scoped background, border and glyph colour transition.                            | Short colour feedback. | Final colours immediately.  | `checkbox.root.colour` → `state.color` → `state.color/surface-foreground` |

## Interruption and lifecycle

- Checked and indeterminate semantics update before animation. Rapid changes retarget the same indicator; no queued checks or delayed form values.
- Unchecking reverses from the current visual state. Parent removal owns exit and cancels the local mark transition; Checkbox never delays unmount by itself.
- Disable/read-only changes preserve the actual checked/mixed state and native form rules; this design adds no separate press-scale animation to cancel. Focus styling becomes visible immediately.
- Live reduced mode cancels scale; none and a zero clock cancel every writer and delay, commit the latest state and release callbacks/observers on unmount.

## Geometry and performance

- No size measurement, SVG path drawing, border-width tween or hit-area scaling. A single indicator writer owns opacity/transform; CSS owns scoped colours only.
- Caller size changes use final native layout in every mode. Reduced/none remove decorative motion, not Space/click operation or hidden-input/form updates; no numeric geometry is interpolated below the valid box size.
- At most one outgoing and one incoming decorative glyph per checkbox; remove the outgoing glyph after interruption or completion. No per-control layout observer.
- A list of 20 changing checkboxes must not trigger 20 independent parent entrances. External label layout remains with its owner.

## Acceptance scenarios

- Pending: toggle checked → mixed → unchecked rapidly; final semantics, form value and mark agree without stale glyphs.
- Pending: verify keyboard, read-only, invalid and disabled paths in all modes, including a mid-transition downgrade and zero clock.
- Pending: insert within an entering field group, remove during a mark change, and verify one entrance, unchanged hit target and no retained animation work.
- Pending: update controlled checked/mixed state while disabled/read-only, including reset and failed/rejected caller updates; presentation follows the actual committed state rather than an anticipated click.
