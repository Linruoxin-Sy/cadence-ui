# Switch motion contract

Status: target design; implementation and verification pending.

The thumb makes the binary state legible by travelling inside the measured track while the track colour follows the same state transaction. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["switch#Switch"],
    "thumb": ["switch#Switch"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                           | References                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Appearance      | Default: `switch` owns independent opacity entrance; a containing field may own it instead. Initial thumb position is already correct.                          | default: `switch.root.enter`  |
| Size            | Default for explicit `size` changes: root shell owns the bounded track dimensions. Passive layout changes are immediate; the thumb endpoint is remeasured.      | default: `switch.root.resize` |
| Surface colour  | Default: `switch` owns checked, hover, invalid and disabled track/border colours; the thumb owns its background/fill colour through the same state transaction. | default: `switch.root.colour` |
| Text colour     | Not applicable to the stock track/thumb, which contains no text. External labels retain their own text-colour owner; thumb fill is surface feedback.            | not-applicable: `@root`       |
| Changed text    | Not applicable: no built-in text slot. External on/off labels are caller composition, not newly added props.                                                    | not-applicable: `@root`       |
| Changed numbers | Not applicable: a boolean switch has no numeric display.                                                                                                        | not-applicable: `@root`       |

## Choreography and modes

| Trigger / owner                                 | Full                                                                                                                     | Reduced                                                      | None                        | Binding → preset → recipe/form                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------- |
| Independent insertion / root                    | Opacity only; no initial thumb sweep.                                                                                    | Short opacity.                                               | Final state immediately.    | `switch.root.enter` → `presence.inline` → `data.transition/opacity`    |
| Checked change / thumb                          | Travel to measured endpoint with a non-overshooting indicator transition.                                                | Position immediately.                                        | Position immediately.       | `switch.thumb.select` → `state.indicator` → `state.morph/indicator`    |
| State change / track and thumb                  | Scoped track, border and thumb colour transition. Colour eligibility and immediate-owner priority follow the rule below. | Short colour feedback. Colour obeys the same owner priority. | Final colours immediately.  | `switch.root.colour` → `state.color` → `state.color/surface`           |
| Explicit size prop change / root geometry owner | Clamp track width/height to final measured size; thumb endpoint uses the same transaction.                               | Final geometry immediately.                                  | Final geometry immediately. | `switch.root.resize` → `geometry.compact` → `geometry.resize/measured` |

`root.colour` resolves track/thumb paint together. Actual DOM focus/focus-within or this control's invalid state cancels that colour clock and applies all its declared paint immediately in every mode. Other states use the preset only for verified readable interpolation, otherwise they are immediate. Thumb placement remains with `thumb.select`.

## Interruption and lifecycle

- Checked semantics/form state update immediately. Rapid toggles reverse the same thumb writer without accumulating travel.
- The first valid measurement places the thumb immediately. An intentional size-prop revision during a toggle retargets the endpoint from current presentation through the coordinated size transaction below. Passive font/viewport/caller-layout changes or an invalidated direction/coordinate frame instead cancel that obsolete projection and establish the current checked endpoint immediately. A measurement delivery alone never starts another toggle or size spring.
- A controlled callback is not a committed checked change. Native form/reset/read-only rules and the caller's actual accepted value remain authoritative in every mode; returning to full does not replay the current position.
- Parent exit cancels local presentation; no extra closing delay. Read-only/disabled prevents new input without rolling back an accepted state.
- Live reduced cancels travel/resize; none and zero clock cancel all transitions and delays. Unmount disconnects the existing track/thumb observer and writers.

## Geometry and performance

- Measure natural target track/thumb boxes after commit, separately from the animated root host. Keep endpoint calculation direction-aware; never derive it from a previously transformed thumb rectangle. Clamp travel to a non-negative available track interval; custom sizes with no usable travel settle to valid native geometry instead of producing a negative offset.
- There is no text reflow inside the fixed track; an explicit size revision supplies final track/thumb boxes before the root host interpolates. External label wrapping remains with its own layout owner. Any temporary root clip excludes its focus outline.
- One root geometry owner and one thumb transform owner; no independent press deformation or extra observer loop. Size changes must not feed animated dimensions back as new natural targets.
- During simultaneous size and checked changes, the coordinator constrains the rendered thumb to the currently available track interval using its own size model, not per-frame layout reads. If that cannot be guaranteed, apply the new track size immediately and animate only the valid endpoint change. Thumb fill is a surface colour, not a newly introduced text display.
- Bound work to one track and one thumb per control. Responsive/font changes settle immediately; fixed hit targets and focus outlines remain outside clipping.

## Acceptance scenarios

- Pending: contrast an explicit size-prop revision during a toggle with a passive parent/font resize or direction change. Only the explicit eligible revision uses the coordinated size path; environment recovery establishes the correct endpoint immediately and cannot replay the old toggle.

- Pending: test checked initial SSR/hydration, both sizes, RTL and first measurement without a false off-to-on sweep.
- Pending: alternate checked state while changing size and ensure endpoints remain within the track.
- Pending: exercise all modes, live downgrade, zero clock and parent unmount with no retained observer or delayed state.
- Pending: apply unusually narrow caller styles while toggling, including a track smaller than the thumb; there is no negative travel, overflow tween or decorative cancellation of native input.
