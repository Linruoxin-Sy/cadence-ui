# Switch motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

The thumb makes the binary state legible by travelling inside the measured track while the track and thumb colour follow the same state transaction. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["switch"],
    "thumb": ["switch-thumb"]
  },
  "axes": {
    "root": ["width", "height"]
  },
  "parts": {
    "root": ["switch#Switch"],
    "thumb": ["switch#Switch"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                               | References                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Appearance      | Default: `switch` owns one independent opacity entrance; a containing field may own it instead. The initial thumb position is already correct.                                      | default: `switch.root.enter`                         |
| Size            | Default for explicit `size` changes: the root shell owns the bounded track dimensions. Passive layout changes are immediate; the thumb endpoint is remeasured from the same change. | default: `switch.root.resize`                        |
| Surface colour  | Default: the root owns the checked, focus-ring and border paint of the track, and the thumb owns its own background fill through a second transaction on its own host.              | default: `switch.root.colour`, `switch.thumb.colour` |
| Text colour     | Not applicable to the stock track/thumb, which contains no text. External labels retain their own text-colour owner; thumb fill is surface feedback, not a glyph.                   | not-applicable: `@root`                              |
| Changed text    | Not applicable: no built-in text slot. External on/off labels are caller composition, not newly added props.                                                                        | not-applicable: `@root`                              |
| Changed numbers | Not applicable: a boolean switch has no numeric display.                                                                                                                            | not-applicable: `@root`                              |

## Choreography and modes

| Trigger / owner                                 | Full                                                                                                                                                                    | Reduced                                                      | None                        | Binding → preset → recipe/form                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Independent insertion / root                    | Opacity only; no initial thumb sweep.                                                                                                                                   | Short opacity.                                               | Final state immediately.    | `switch.root.enter` → `presence.inline` → `data.transition/opacity`                                                         |
| Checked change / thumb                          | Travel to the measured endpoint with a non-overshooting indicator transition. The first measurement and a passive resize paint the endpoint instead.                    | Position immediately.                                        | Position immediately.       | `switch.thumb.select` → `state.indicator` → `state.morph/indicator`                                                         |
| State change / track and thumb                  | Scoped track, border, focus-ring and thumb-fill colour transition. Colour eligibility and immediate-owner priority follow the rule below.                               | Short colour feedback. Colour obeys the same owner priority. | Final colours immediately.  | `switch.root.colour` → `state.color` → `state.color/surface`; `switch.thumb.colour` → `state.color` → `state.color/surface` |
| Explicit size prop change / root geometry owner | Clamp track width/height to the final measured size; the thumb endpoint is remeasured from the same change and clamped to the interval valid for the whole transaction. | Final geometry immediately.                                  | Final geometry immediately. | `switch.root.resize` → `geometry.compact` → `geometry.resize/measured`                                                      |

`root.colour` resolves the track's background, border and focus-ring paint; `thumb.colour` resolves the thumb's own fill on its own host. Neither replaces the other and no node has two colour owners. Actual DOM focus or this control's invalid state cancels that colour clock and applies all its declared paint immediately in every mode. Other states use the preset only for verified readable interpolation, otherwise they are immediate. Thumb placement remains with `thumb.select`.

## Interruption and lifecycle

- Accepted native reset/restoration paints the current checked endpoint and state paint immediately in
  full, reduced and none, without a synthetic toggle or callback. Base UI keeps reset authority: it
  restores its own hidden input and Cadence adds no reset writer, so the visible thumb and the
  primitive's accepted state always agree. A cancelled reset or rejected request is not a checked
  revision. An equal accepted checked value preserves a valid flight; mode, zero-clock and
  geometry-invalidating changes still take precedence.
- Checked semantics/form state update immediately. Rapid toggles reverse the same thumb writer without accumulating travel.
- The first valid measurement paints the thumb immediately and never starts a sweep for an initially
  checked switch. An intentional size-prop revision during a toggle retargets the endpoint from the
  committed natural boxes, while the root's own size transaction runs. A passive font/viewport/caller
  layout change or an invalid measured interval instead cancels that projection and paints the current
  checked endpoint immediately. A measurement delivery alone never starts another toggle or size spring.
- A controlled callback is not a committed checked change. Native form/reset/read-only rules and the
  caller's actual accepted value remain authoritative in every mode; returning to full does not replay
  the current position.
- Parent exit cancels local presentation; no extra closing delay. Read-only/disabled prevents new input without rolling back an accepted state.
- Live reduced cancels travel/resize; none and zero clock cancel all transitions and delays. Unmount
  disconnects the track/thumb observer, the geometry owner and the entrance writer.

## Geometry and performance

- Measure natural target track/thumb boxes after commit, separately from the animated root host. Keep
  endpoint calculation direction-aware; never derive it from a previously transformed thumb rectangle.
  Clamp travel to a non-negative available track interval; custom sizes with no usable travel settle to
  valid native geometry instead of producing a negative offset. A host without a usable measured box
  (hidden, `display:none`, or no layout engine) keeps native placement.
- The size transaction also grows or shrinks the thumb, so the endpoint valid for the whole transaction
  is the narrower of the two natural boxes. The thumb uses that conservative interval while the root's
  own size writer runs and paints the exact measured endpoint once the observed track has arrived. This
  is an arrival test, not a per-frame layout read: no intermediate width ever becomes a new natural
  target. If the track arrives without a further observer delivery the endpoint stays inside the track
  at the conservative position rather than overflowing.
- There is no text reflow inside the fixed track; an explicit size revision supplies final track/thumb
  boxes before the root host interpolates. External label wrapping remains with its own layout owner.
  Temporary root clipping is not used, so the focus outline and the expanded hit target are never cut.
- One root geometry owner and one thumb transform owner; no independent press deformation or extra
  observer loop. Size changes must not feed animated dimensions back as new natural targets.
- Bound work to one track and one thumb per control, plus one passive observer pair. Responsive/font
  changes settle immediately; fixed hit targets and focus outlines remain outside clipping.

The thumb endpoint includes required static placement exactly once; a different property spelling is not
a second independent travel owner. Unsupported caller transform compositions keep the existing
native/caller placement immediate rather than subtracting an assumed offset or overwriting caller
transforms. Finishing a size revision returns the track to its current size/caller constraints, without
leaving the old pixel width to corrupt a later endpoint measurement.

## Acceptance scenarios

Executed in `tests/components/switch.test.tsx`: the four actions in full/reduced/none on one live instance
each — the independent entrance (hidden host shown again on the same root), the thumb endpoint revision
(a controlled checked change on the same thumb), the two colour owners (a committed palette change on the
track and on the thumb) and the measured size transaction (an explicit `size` revision); plus the
`Text colour`, `Changed text` and `Changed numbers` boundaries, an initially checked switch with no
sweep, both sizes, a rejected controlled toggle, an equal controlled echo, the native reset path,
read-only/disabled behaviour, a rapid toggle reversal on one thumb host, the live full/reduced/none
downgrade and unmount cleanup. Browser-only scenarios remain pending: a real accepted reset during
simultaneous thumb/size motion, RTL direction, a track smaller than the thumb in a real layout engine,
per-frame clipping of a growing track, 3 modes × 2 OS preferences, first paint/hydration probes and
performance measurement (deferred under ADR-023).
