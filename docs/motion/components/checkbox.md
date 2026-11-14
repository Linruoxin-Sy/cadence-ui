# Checkbox motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

The box acknowledges selection through its fill and its local check or mixed-state mark. Its hit area stays fixed. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings below are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["checkbox"],
    "indicator": ["checkbox-indicator"]
  },
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
| Text colour     | Default: `checkbox` owns its glyph colour; an external label inherits its own component contract.                                            | default: `checkbox.root.colour` |
| Changed text    | Not applicable: the check and minus are state glyphs, not text. External labels are composed separately.                                     | not-applicable: `@root`         |
| Changed numbers | Not applicable: this control has no numeric display. A numeric-looking label is not a counter.                                               | not-applicable: `@root`         |

## Choreography and modes

| Trigger / owner                      | Full                                                                                                                          | Reduced                                                      | None                        | Binding → preset → recipe/form                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------- |
| Independent insertion / root         | Opacity entrance; no movement of hit area.                                                                                    | Short opacity.                                               | Visible target immediately. | `checkbox.root.enter` → `presence.inline` → `data.transition/opacity`     |
| Checked or mixed changes / indicator | Local opacity and `scale.in` to rest; check-to-minus replaces the glyph in place.                                             | Opacity only.                                                | Final glyph immediately.    | `checkbox.indicator.change` → `state.indicator` → `state.morph/indicator` |
| State changes / root and indicator   | Scoped background, border and glyph colour transition. Colour eligibility and immediate-owner priority follow the rule below. | Short colour feedback. Colour obeys the same owner priority. | Final colours immediately.  | `checkbox.root.colour` → `state.color` → `state.color/surface-foreground` |

`root.colour` coordinates the control and glyph palette on one clock. Actual DOM focus/focus-within or the control's invalid state cancels that colour clock and applies all declared paint immediately in every mode. Other states use the preset only for verified readable interpolation, otherwise they are immediate. Indicator opacity/scale remains a separate state action.

## Interruption and lifecycle

- A native form reset is Base UI's own state path: it restores only the hidden input and delivers no
  check/uncheck revision, so Checkbox adds no reset writer, no synthesized `input`/`change` callback and
  no independently inferred mixed-state value. A cancelled reset or rejected controlled request is
  therefore not a check/uncheck action either. Any accepted revision that does arrive is presented from
  its committed state, immediately in reduced and none. Equal accepted state preserves an otherwise
  eligible flight; it does not restart the mark merely because the control rerendered.
- Checked and indeterminate semantics update before animation. Rapid changes retarget the same indicator; no queued checks or delayed form values.
- Unchecking reverses from the current visual state. Parent removal owns exit and cancels the local mark transition; Checkbox never delays unmount by itself.
- Disable/read-only changes preserve the actual checked/mixed state and native form rules; this design adds no separate press-scale animation to cancel. Focus styling becomes visible immediately.
- Live reduced mode cancels scale; none and a zero clock cancel every writer and delay, commit the latest state and release callbacks/observers on unmount.

## Geometry and performance

- No size measurement, SVG path drawing, border-width tween or hit-area scaling. A single indicator writer owns opacity/transform; CSS owns scoped colours only.
- Caller size changes use final native layout in every mode. Reduced/none remove decorative motion, not Space/click operation or hidden-input/form updates; no numeric geometry is interpolated below the valid box size.
- At most one outgoing and one incoming decorative glyph per checkbox; the glyph is replaced in place, so no outgoing copy survives an interruption. No per-control layout observer.
- A list of 20 changing checkboxes must not trigger 20 independent parent entrances. External label layout remains with its owner.

## Acceptance scenarios

Target acceptance; not executed in a browser: reset during a mixed-to-checked flight and compare a prevented reset, unchanged controlled echo and rejected activation; a rapid checked → mixed → unchecked sequence with the final semantics, form value and mark in agreement; keyboard, read-only, invalid and disabled paths in all modes including a mid-transition downgrade and a zero clock; insertion inside an entering field group and removal during a mark change; controlled state updates while disabled or read-only, including reset and a rejected caller update.

The executed suite covers the three authored actions in full/reduced/none on one live instance each: the independent entrance (a later insertion on the same root), the indicator mark revision (a controlled checked/mixed change on the same indicator) and the colour owner (a committed palette change on the same root), plus `state.color` as the real policy on the box and the `Size`, `Changed text` and `Changed numbers` boundaries on that same root. The verified-clock case proves the shipped chrome keeps its colour clock, and that focus, invalid state and a caller palette settle the declared paint immediately; a native form reset is exercised as the upstream-owned path above and must add no callback, revision or replay. Keyboard activation through Base UI's native input, the mixed glyph, the hidden form entry, rapid retargeting, controlled echo without replay and unmount cleanup are exercised in the same suite.
