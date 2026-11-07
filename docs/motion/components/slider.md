# Slider motion contract

Status: target design; implementation and verification pending.

The active thumb feels attached to the user's input. Rich feedback comes from the local thumb and range, never input latency or invented elasticity. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
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

| Capability      | Application and owner                                                                                                                                                                                                                | References                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Appearance      | Default: `slider` owns a single independent entrance; track, range and thumbs inherit it.                                                                                                                                            | default: `slider.root.enter`       |
| Size            | Inherited: root track length belongs to caller layout. Value changes move Base UI thumb/range geometry; they do not resize the outer control.                                                                                        | inherited: `slider.position.input` |
| Surface colour  | Default: `slider-track`, `slider-range` and `slider-thumb` own active, hover, disabled and invalid surface/border tokens and explicitly declared focus box-shadow. Disabled opacity changes directly; it is not a colour transition. | default: `slider.surface.colour`   |
| Text colour     | Not applicable in the stock control: it has no visible text slot. Caller readouts inherit their text owner.                                                                                                                          | not-applicable: `@root`            |
| Changed text    | Composed: external labels/readouts own plain-text replacement; Slider does not add a tooltip or label.                                                                                                                               | composed: `@root`                  |
| Changed numbers | Composed: an explicit numeric readout may roll on discrete committed changes; it updates immediately during direct manipulation. Numeric `value` alone does not create a display.                                                    | composed: `slider.readout.change`  |

## Choreography and modes

| Trigger / owner                                          | Full                                                                                                                                                                                          | Reduced                       | None                          | Binding → preset → recipe/form                                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Independent insertion / root                             | Opacity entrance; already-correct value geometry.                                                                                                                                             | Short opacity.                | Final state immediately.      | `slider.root.enter` → `presence.inline` → `data.transition/opacity`                                                  |
| Pointer drag or keyboard manipulation / Base UI geometry | Thumb and range follow the accepted value immediately, including collision policy and bounds.                                                                                                 | Same direct response.         | Same direct response.         | `slider.position.input` → `engine.native` → `native/base-ui-slider` (Base UI Slider direct geometry (no new recipe)) |
| Programmatic discrete value / Base UI-owned adapter      | Target default bounded retarget through a verified native single-owner adapter; until that ownership is available, use immediate native placement without a new opt-in prop or second writer. | Immediate.                    | Immediate.                    | `slider.position.update` → `state.indicator` → `state.morph/indicator`                                               |
| Thumb press / thumb visual layer                         | `scale.press` feedback without changing native coordinate geometry.                                                                                                                           | No scale; colour feedback.    | No tween.                     | `slider.thumb.press` → `feedback.press` → `feedback.press/scale`                                                     |
| Interaction state / track, range, thumb                  | Scoped surface/border and defined focus box-shadow transition; focus is immediately recognisable and disabled opacity is immediate.                                                           | Short colour feedback.        | Target colours immediately.   | `slider.surface.colour` → `state.color` → `state.color/surface`                                                      |
| Composed numeric readout / readout owner                 | On discrete non-manipulation updates, roll changed places only; direct-input updates remain immediate.                                                                                        | Formatted target immediately. | Formatted target immediately. | `slider.readout.change` → `number.compact` → `number.roll/reels`                                                     |

## Interruption and lifecycle

- Dragging or keyboard manipulation cancels any programmatic interpolation before the next position is presented. Values, callbacks, hidden inputs and aria values never wait for motion.
- A new accepted programmatic target replaces the old target; no out-of-bounds bounce. Preserve `push`, `swap` and `none` collision behavior and the primitive's actual indexed thumb roles. Do not re-key thumbs by their changing numeric values. If thumb count, collision remapping or axis constraints invalidate a positional correspondence, cancel that visual projection and establish the current native placement immediately; a completion from the old role cannot move another thumb.
- Disabling, losing capture, parent closure or removal clears press state and ends its writer; it must not invent a value commit or extra drag.
- Live reduced/none and zero clock cancel only authored programmatic travel, press decoration and readout/colour clocks as required. An active native pointer/keyboard operation keeps its current accepted position and capture; it is not snapped to a pre-gesture target or disabled by the mode change. Unmount follows Base UI's native cleanup and leaves no document listeners or detached readouts.

## Geometry and performance

- Use the configured horizontal/vertical axis and Base UI's alignment/bounds. Never add a second writer to thumb placement or range extent.
- A verified programmatic adapter must name the one permitted transform owner for each thumb and range visual while Base UI retains accepted state and coordinate authority. The state.indicator binding does not permit generic left/top/width/height tweens, range scaling around an invalid origin, or overriding the primitive's placement transform with press scale. If this separation or correspondence is unavailable, the complete programmatic update uses immediate native placement rather than partially animating only one endpoint.
- Clamp every authored programmatic presentation to the valid current range and collision constraints; a reversed range extent cannot become a negative width/height. Passive layout, track size and min/max/step changes resolve through native geometry immediately. The stock control has no measured content shell or text-reflow animation.
- A decorative press layer may own scale independently of the native positional layer. Keep hit areas and focus rings unscaled/unclipped.
- One active interaction controller, work proportional to rendered thumbs, and no observer or number roller for every pointer event. If a safe native programmatic adapter is unavailable, immediate placement is the accepted fallback.

## Acceptance scenarios

- Pending: pointer, keyboard, Page/Home/End, vertical and RTL multi-thumb interaction remain 1:1 and preserve collision/minimum-separation behavior.
- Pending: begin dragging during an external update and verify immediate handover without jump, lag or duplicate value callbacks.
- Pending: verify optional readout semantics, reduced/none/zero-clock behavior and interruption by disable/unmount.
- Pending: change thumb count, collision roles and orientation during a programmatic transition, and set zero timeScale during a held drag. Invalid correspondence settles natively; zero timing preserves the held full-mode press target, while reduced/none removes decorative scale without clearing native capture.
- Pending: downgrade or set zero clock while the pointer is captured, then continue dragging; direct operation and callbacks remain intact while decorative/programmatic work stops. A rejected controlled update must not create a visually accepted value.
