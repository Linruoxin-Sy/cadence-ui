# Toggle motion contract

Status: target design; implementation and verification pending.

Momentary press and persistent selection are distinct: pressing compresses the control briefly, while the selected surface remains after release. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["toggle#Toggle"],
    "label": ["toggle#Toggle"],
    "quantity": ["toggle#Toggle"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                         | References                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Appearance      | Default: `toggle` owns independent entrance; a toolbar/group entrance takes precedence.                                                                       | default: `toggle.root.enter`                       |
| Size            | Default: the root shell owns content-driven width and explicit size changes; constrained width stays constrained and passive reflow is immediate.             | default: `toggle.root.resize`                      |
| Surface colour  | Default: root owns pressed, hover, disabled and variant background/border changes.                                                                            | default: `toggle.root.colour`                      |
| Text colour     | Default: root foreground is inherited by icon/plain label; explicit child component colours keep their own owner.                                             | default: `toggle.root.colour`                      |
| Changed text    | Default for owned primitive text children: retain unchanged graphemes and replace changed runs. Rich JSX uses composed ownership without recursive rewriting. | default: `toggle.label.change`; composed: `@label` |
| Changed numbers | Composed: explicit quantity children may use a numeric owner; a numeric-looking toggle label/value is an option identity by default.                          | composed: `toggle.quantity.change`                 |

## Choreography and modes

| Trigger / owner                                           | Full                                                                                                                                    | Reduced                        | None                        | Binding → preset → recipe/form                                          |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------- | ----------------------------------------------------------------------- |
| Independent insertion / root                              | Opacity entrance; no automatic selected-state replay.                                                                                   | Short opacity.                 | Final state immediately.    | `toggle.root.enter` → `presence.inline` → `data.transition/opacity`     |
| Pointer/keyboard press / supported content-feedback layer | `scale.press` while active; release retargets to rest independently of selection. The native root remains an unscaled hit/focus target. | No scale; colour feedback.     | Target immediately.         | `toggle.root.press` → `feedback.press` → `feedback.press/scale`         |
| Pressed/hover/disabled state / root                       | Scoped surface, border and text colours.                                                                                                | Short colour feedback.         | Target colours immediately. | `toggle.root.colour` → `state.color` → `state.color/surface-foreground` |
| Label or size change / root shell                         | Measure natural target and clamp width/height; preserve existing min dimensions.                                                        | Immediate geometry.            | Immediate geometry.         | `toggle.root.resize` → `geometry.compact` → `geometry.resize/measured`  |
| Owned text change / label presentation                    | Changed runs fade out/in with retained graphemes fixed; `stagger: none`.                                                                | Safe changed-run opacity only. | Final text immediately.     | `toggle.label.change` → `text.replace` → `text.change/changed-runs`     |
| Explicit composed quantity / quantity owner               | Roll changed places only.                                                                                                               | Final number immediately.      | Final number immediately.   | `toggle.quantity.change` → `number.compact` → `number.roll/reels`       |

## Interruption and lifecycle

- `pressed`, native events and focus follow the actual committed state immediately. A controlled callback does not pre-commit selection. Repeated activations retarget current press/colour states; selection does not reset the release animation.
- A changed label uses one latest text transaction. The accessible name updates immediately; decorative outgoing glyphs never duplicate copied or spoken text.
- Disabled state, lost pointer capture, blur, parent close and unmount clear only momentary press feedback; they do not reset the committed `pressed` selection. Parent presence owns exit; Toggle adds no minimum display time.
- Live reduced cancels scale/layout/numeric rolling; none omits decorative scale and cancels every presentation clock. A zero recipe clock in full mode instead snaps a still-held feedback layer to `scale.press` and its later release to rest, with final dimensions/colours/label immediately. Timing cancellation never discards native held state, pointer capture or the controlled selected value.

## Geometry and performance

- One natural-content measurement region and one separate shell geometry owner. A supported inner feedback layer owns press scale while the native root owns layout/hit/focus; parent reflow must not overwrite that scale. A custom `render` without a safe layer uses colour-only feedback rather than new DOM that changes the caller's structure/ref semantics.
- Lay the label at final destination width using the existing wrapping policy before measuring final height, then animate the host around that layout. Passive viewport/font changes are immediate, with no intermediate-width rewrapping.
- Keep the root hit target/focus outline usable during resize. Clip only the decorative changed-text lane, not the control or portals.
- Clamp dimensions to non-negative valid content/minimum/available bounds. If an intermediate width would newly truncate a required label or hide a focus target, resolve that axis immediately; do not introduce temporary text truncation to obtain a size effect. Existing legal caller overflow remains authoritative.
- Bound work to one label transaction, one numeric group if explicitly composed, and the shared text budget. No per-character observers or automatic rich-child traversal.

## Acceptance scenarios

- Pending: press/release with external pressed updates, disable mid-press, and verify selected appearance survives release.
- Pending: replace a partially unchanged label while changing size, including rich children and an icon-only accessible label.
- Pending: verify parent-owned appearance, all modes, mid-flight downgrades, zero clock and cleanup. Hold a selected Toggle while setting zero timeScale, then blur/disable: feedback settles correctly and selection changes only through the existing controlled/uncontrolled semantics.
- Pending: combine group reflow and press with a long growing label and custom `render`; verify one transform per layer, readable text, native input in reduced/none and immediate fallback when a safe feedback/size host is absent.
