# Slider motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

The active thumb feels attached to the user's input. Rich feedback comes from the local thumb and range, never input latency or invented elasticity. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["slider"],
    "thumb": ["slider-thumb-face"],
    "surface": ["slider-track", "slider-range", "slider-thumb", "slider-thumb-face"]
  },
  "parts": {
    "root": ["slider#Slider"],
    "position": ["slider#Slider"],
    "thumb": ["slider#Slider"],
    "surface": ["slider#Slider"],
    "readout": ["slider#Slider"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                | References                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Appearance      | Default: `slider` owns a single independent entrance on its root; track, range and thumbs inherit it and their value geometry is already correct.                                                                                                                                    | default: `slider.root.enter`       |
| Size            | Inherited: root track length belongs to caller layout. Value changes move Base UI thumb/range geometry; they do not resize the outer control, and there is no measured content shell.                                                                                                | inherited: `slider.position.input` |
| Surface colour  | Default: `slider-track`, `slider-range`, `slider-thumb` and its own face each own scoped surface/border paint and the declared focus shadow. DOM focus within an owner or that owner's invalid state settles all its declared paint immediately. Disabled opacity is also immediate. | default: `slider.surface.colour`   |
| Text colour     | Not applicable in the stock control: it has no visible text slot. Caller readouts inherit their text owner.                                                                                                                                                                          | not-applicable: `@root`            |
| Changed text    | Composed: external labels/readouts own plain-text replacement; Slider does not add a tooltip or label.                                                                                                                                                                               | composed: `@root`                  |
| Changed numbers | Composed: an explicit numeric readout may roll on discrete committed changes; it updates immediately during direct manipulation. Numeric `value` alone does not create a display, and Slider owns no counter.                                                                        | composed: `@readout`               |

## Choreography and modes

| Trigger / owner                                          | Full                                                                                                                                                                                                                                                      | Reduced                                                                            | None                        | Binding → preset → recipe/form                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| Independent insertion / root                             | Opacity entrance; already-correct value geometry.                                                                                                                                                                                                         | Short opacity.                                                                     | Final state immediately.    | `slider.root.enter` → `presence.inline` → `data.transition/opacity`  |
| Pointer drag or keyboard manipulation / Base UI geometry | Thumb and range follow the accepted value immediately, including collision policy and bounds.                                                                                                                                                             | Same direct response.                                                              | Same direct response.       | `slider.position.input` → `engine.native` → `native/base-ui-slider`  |
| Programmatic discrete value / Base UI geometry           | Accepted value is placed immediately on Base UI geometry. The designed bounded `state.indicator` retarget has no verified single-owner adapter, so this documented fallback stays immediate instead of adding a second writer or new prop.                | Immediate.                                                                         | Immediate.                  | `slider.position.update` → `engine.native` → `native/base-ui-slider` |
| Thumb press / thumb visual face                          | The decorative face owns `scale.press`; the native thumb keeps its coordinate box, hit area and focus ring.                                                                                                                                               | No scale; the ring and fill carry the state.                                       | No tween.                   | `slider.thumb.press` → `feedback.press` → `feedback.press/scale`     |
| Interaction state / track, range, thumb ring and face    | Verified noncritical surface/border colours follow the preset. DOM focus within an owner or an owner's own invalid state cancels that owner's colour clock and settles all its declared paint, including the focus shadow; disabled opacity is immediate. | Immediate focused/invalid-owner paint; other verified colour feedback stays short. | Target colours immediately. | `slider.surface.colour` → `state.color` → `state.color/surface`      |

The range extent follows the accepted value immediately in every mode: it is glued to the pointer and to
Base UI's measurement, so neither a transition nor a second transform may interpolate it. A composed numeric
readout belongs to its own display owner; on discrete non-manipulation updates it may roll changed places,
while direct-input updates remain immediate.

## Interruption and lifecycle

- The direct/programmatic distinction follows the accepted value's cause, not whether the pointer
  happens to be held at commit time. A delayed controlled echo of pointer or keyboard input uses
  `position.input` and an immediate composed readout, including after release. Unknown correspondence
  takes that immediate path; it does not guess a new programmatic spring from a cleared dragging flag.
  Preserve a reliably identified later independent programmatic action's existing eligibility.
- Native reset/restoration uses the same immediate native geometry/readout path in full, reduced and
  none, after the primitive accepts the state. Cancel obsolete projections without changing reset
  cancellation, hidden inputs, thumb identity or callback counts. A rejected request, cancelled reset
  or equal accepted value creates no new position action; mode/clock restrictions still apply.
- Dragging or keyboard manipulation cancels any decorative press state before the next position is
  presented. Values, callbacks, hidden inputs and aria values never wait for motion.
- A new accepted programmatic target replaces the old one; no out-of-bounds bounce. Preserve `push`,
  `swap` and `none` collision behavior and the primitive's actual indexed thumb roles. Do not re-key
  thumbs by their changing numeric values. If thumb count, collision remapping or axis constraints
  invalidate a positional correspondence, cancel any decorative projection and establish the current
  native placement immediately; a completion from the old role cannot move another thumb.
- Disabling, losing capture, parent closure or removal clears press state and ends its writer; it must
  not invent a value commit or extra drag.
- Live reduced/none cancels decorative press scale and settles colour/entrance clocks; the accepted
  value, native capture and an active pointer/keyboard operation keep their current accepted position.
  An active native operation is not snapped to a pre-gesture target or disabled by the mode change.
  Unmount follows Base UI's native cleanup and leaves no document listeners or detached readouts.

## Geometry and performance

- Use the configured horizontal/vertical axis and Base UI's alignment/bounds. Never add a second
  writer to thumb placement or range extent: Base UI owns the accepted state, coordinate authority and
  both `inset-inline-start` placement and range width/height.
- The complete programmatic update therefore uses immediate native placement rather than partially
  animating one endpoint. `state.indicator` remains the designed target for a future verified
  single-owner adapter; it is not claimed by this implementation, and no generic
  left/top/width/height tween, range scaling around an invalid origin, or overriding of the
  primitive's placement transform is introduced.
- Clamp every authored presentation to the valid current range and collision constraints; a reversed
  range extent cannot become a negative width/height. Passive layout, track size and min/max/step
  changes resolve through native geometry immediately. The stock control has no measured content
  shell or text-reflow animation.
- The decorative face owns `scale` independently of the native positional layer, so hit areas and the
  focus ring stay unscaled and unclipped. One active interaction controller, work proportional to
  rendered thumbs, and no observer or number roller for every pointer event.

## Acceptance scenarios

Executed in `tests/components/slider.test.tsx`: the three authored actions in full/reduced/none on one
live instance each — the independent entrance (hidden root shown again on the same instance), the
decorative press scale (a real Base UI drag accepted on the same thumb face) and the four scoped colour
owners (a committed palette change on the track, the range, the thumb ring and the thumb face); plus the
`Text colour`, `Changed text` and `Changed numbers` boundaries, the two native position boundaries, a
verified colour clock, DOM focus settling the owner's declared paint immediately, the shared
`expectMotionContract` for all three modes, a live mode downgrade on the same instance, the same-thumb
rapid/reversal drag and unmount cleanup. The two native bindings are verified as native/physical
boundaries with real hosts, not as authored recipes.

Browser-only scenarios remain pending: a real accepted reset during simultaneous thumb/keyboard and
colour motion, pointer/keyboard Page/Home/End paths, vertical and RTL multi-thumb interaction with
collision/minimum-separation, a delayed controlled echo followed by a known independent programmatic
update, mode downgrade during a captured drag, changing thumb count/collision roles/orientation during a
programmatic transition, 3 modes × 2 OS preferences, first paint/hydration/no-JS probes and performance
measurement (deferred under ADR-023).
