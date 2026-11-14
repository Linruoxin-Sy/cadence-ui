# Combobox motion contract

Status: functionally migrated to v2. Browser matrix, a production build and performance governance remain
deferred under ADR-023.

Typing stays attached to the native input while the results surface adapts to the current result set. The
popup owns one anchored envelope, every later-inserted chip, chips frame and standalone trigger owns one
short opacity envelope, and the retained option tick morphs in place. The composed input-group frame,
button and editor keep their own migrated owners; Combobox installs no second writer on those nodes.
Filtering, active-descendant movement and native editing never animate a row. This contract inherits the
[common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe
IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "content": ["combobox#ComboboxContent"],
    "trigger": ["combobox#ComboboxTrigger"],
    "chips": ["combobox#ComboboxChips"],
    "chip": ["combobox#ComboboxChip"],
    "item": ["combobox#ComboboxItem"],
    "separator": ["combobox#ComboboxSeparator"],
    "indicator": ["combobox#ComboboxItem"],
    "surface": [
      "combobox#ComboboxContent",
      "combobox#ComboboxItem",
      "combobox#ComboboxChip",
      "combobox#ComboboxChips",
      "combobox#ComboboxTrigger"
    ],
    "frame": ["input-group#InputGroup"],
    "member": ["button#Button"],
    "position": ["combobox#ComboboxContent"],
    "input": ["combobox#ComboboxChipsInput"]
  },
  "regions": {
    "content": ["combobox-content"],
    "trigger": ["combobox-trigger"],
    "chips": ["combobox-chips"],
    "chip": ["combobox-chip"],
    "item": ["combobox-item"],
    "separator": ["combobox-separator"],
    "indicator": ["combobox-item-indicator"],
    "surface": ["combobox-content", "combobox-item", "combobox-chip", "combobox-chips", "combobox-trigger"],
    "frame": ["input-group"],
    "member": ["input-group-button"],
    "position": ["combobox-content"],
    "input": ["combobox-chip-input"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                  | References                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: the popup surface owns one anchored entrance and its anchored ending; a later-inserted standalone Trigger, Chips frame or chip owns one local opacity envelope. The composed frame and button keep their own insertion in this context; the editor is Base UI's native input with no authored entrance; ordinary SSR/first render is visible. | default: `combobox.content.enter`, `combobox.content.exit`, `combobox.trigger.enter`, `combobox.chips.enter`, `combobox.chip.enter`; inherited: `combobox.frame.enter`, `combobox.member.enter` |
| Size            | Not applicable locally: popup height is Base UI's `--available-height` owner and the list scrolls natively; the chips frame reflows at its committed natural layout instead of interpolating an owned extent. The composed frame keeps its own measured box; the editor's box stays native.                                                            | inherited: `@frame`; not-applicable: `@content`, `@chips`, `@input`                                                                                                                             |
| Surface colour  | Default: the popup, option row, chip pill, chips frame, standalone Trigger and separator rule each own scoped paint on their own host. The composed InputGroup frame and Button keep their own migrated colour owners; the editor is Base UI's native input with static paint, and Combobox adds no second writer on those nodes.                      | default: `combobox.surface.colour`, `combobox.separator.colour`; inherited: `combobox.frame.colour`, `combobox.member.colour`                                                                   |
| Text colour     | Default: each surface owner paints its own foreground together with its surface, so option, chip, control and popup text never depends on a second colour family. The composed Button keeps its own foreground owner; the editor's text colour is Base UI's native paint.                                                                              | default: `combobox.surface.colour`; inherited: `combobox.member.colour`                                                                                                                         |
| Changed text    | Not applicable locally: plain option and chip labels are caller content whose identity Text stays native, the chips query text belongs to Base UI, and the editor's text is Base UI's native input.                                                                                                                                                    | not-applicable: `@item`, `@chip`                                                                                                                                                                |
| Changed numbers | Not applicable locally: numeric option/chip names remain identities and no count prop is added. The composed Input Group's own numeric display stays its owner.                                                                                                                                                                                        | not-applicable: `@item`, `@chip`                                                                                                                                                                |

## Choreography and modes

| Trigger / owner                                                                   | Full                                                                                                                                                                 | Reduced                                                     | None                                          | Binding → preset → recipe/form                                                                                                                    |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup open/close / content visual owner                                           | Anchor-relative opacity with the `scale.in` pose; the anchored ending reverses opacity and pose. Entry settles immediately when real popup focus would be displaced. | Short opacity only; entry obeys the same focus gate.        | Final semantic open/closed state immediately. | `combobox.content.enter` → `presence.popup` → `popup.anchored/presence`; `combobox.content.exit` → `presence.exit` → `popup.anchored/ending`      |
| Later standalone Trigger insertion / trigger                                      | One opacity envelope on the actual button; a first render or a presenting parent keeps the native paint.                                                             | Short opacity.                                              | Final control immediately.                    | `combobox.trigger.enter` → `presence.inline` → `data.transition/opacity`                                                                          |
| Later Chips frame insertion / chips                                               | One opacity envelope on the frame; the chips and input it presents do not start a second frame envelope.                                                             | Short opacity.                                              | Final frame immediately.                      | `combobox.chips.enter` → `presence.inline` → `data.transition/opacity`                                                                            |
| Later chip insertion / chip                                                       | One local opacity envelope on that chip only; initial chips presented with the frame do not replay.                                                                  | Short opacity.                                              | Final chip immediately.                       | `combobox.chip.enter` → `presence.inline` → `data.transition/opacity`                                                                             |
| Composed frame insertion / input-group frame                                      | The frame keeps its own short insertion opacity and its own measured block box inside the composition.                                                               | Short opacity.                                              | Final frame immediately.                      | `combobox.frame.enter` → `presence.inline` → `data.transition/opacity`                                                                            |
| Composed Button and editor insertion / member                                     | The composed button keeps its own insertion opacity on its own host; the editor is Base UI's native input.                                                           | Short opacity.                                              | Final member immediately.                     | `combobox.member.enter` → `presence.inline` → `data.transition/opacity`                                                                           |
| State/token/selection update / popup, option, chip, chips frame, trigger and rule | Scoped surface-and-foreground colour on each physical owner; focus/focus-within, invalid state or an unprovable caller palette settles that owner immediately.       | Short colour only, under the same immediate-owner priority. | Final colours immediately.                    | `combobox.surface.colour` → `state.color` → `state.color/surface-foreground`; `combobox.separator.colour` → `state.color` → `state.color/surface` |
| Composed frame paint / input-group frame                                          | The frame's own border, background and shadow settle under its own focus/invalid priority.                                                                           | Short colour only.                                          | Final paint immediately.                      | `combobox.frame.colour` → `state.color` → `state.color/surface`                                                                                   |
| Composed Button and editor paint / member                                         | The composed button owns its surface and foreground with immediate focus/invalid priority; the editor keeps Base UI's native paint.                                  | Short colour only.                                          | Final paint immediately.                      | `combobox.member.colour` → `state.color` → `state.color/surface-foreground`                                                                       |
| Selection marker / retained option indicator                                      | One retained tick host morphs opacity and `scale.in` from the committed selected state; the row never shifts and the mark is `keepMounted`.                          | Opacity only; the tick sits at full size.                   | Final marker immediately.                     | `combobox.indicator.select` → `state.indicator` → `state.morph/indicator`                                                                         |
| Native editing and filtering / Base UI input and list                             | Query, filtered results, selection and active descendant update immediately; no row-by-row entry stagger and no delayed replay.                                      | Same immediate editing.                                     | Same immediate editing.                       | `combobox.input.edit` → `engine.native` → `native/base-ui-combobox` (Base UI Combobox native editing (no new recipe))                             |
| Anchor/collision change / positioner                                              | Correct placement immediately, preserving `useComboboxAnchor`/caller anchors and available bounds.                                                                   | Same placement.                                             | Same placement.                               | `combobox.position.place` → `engine.native` → `native/base-ui-combobox` (Base UI Combobox positioning (no new recipe))                            |

The `surface` binding covers the popup, the option row, the chip pill, the chips frame and the standalone
Trigger as separate physical owners; the separator rule owns a surface-only policy of its own. One node
never carries two colour families. The composed InputGroup frame is the `input-group` host and keeps its
own surface-only owner; the composed Button is the `input-group-button` host and keeps its own
surface-and-foreground owner. Combobox composes the Button directly at its published slot instead of adding
a wrapper, so the actual physical host of that inherited owner is the node this contract names. The editor
is Base UI's own native input at `input-group-control`: native editing, caret and selection stay the
primitive's, and its static chrome comes from the group control classes rather than a second Cadence colour
owner.

Base UI owns the portal, positioner, dismissal, active descendant and the chips input's query text. Ordinary
SSR/hydration and first CSR remain naturally visible. A later independent Chips or Trigger insertion uses
one envelope; a chip inserted after the frame has presented uses its own. Default popup opening, query
filtering and focus restoration never replay an outside control's envelope. Under `none` every declared
clock resolves to zero and the semantic state is painted before the first frame.

## Interruption and lifecycle

Base UI owns the input, IME, active descendant, selection, filtering, chip removal and focus safety. Never
remount the input or delay results until outgoing rows finish. Fast typing replaces the filter result
through Base UI immediately; interruption alone is not overload and never starts a queue.

- Closing the popup cancels its entrance and runs the anchored ending before Base UI's native unmount
  completes. Reopening uses the current result set and never replays a stale surface.
- A fresh popup/query revision invalidates an obsolete entrance or ending callback. Async results received
  after close update the data without reopening the popup or starting a hidden animation.
- Live reduced cancels the popup's remaining pose and any chip/frame envelope; none or a zero clock settles
  the current target and completes the close through Base UI's own protocol. Native caret, selection, chip
  removal and scrolling stay available.
- A removed chip is unmounted with its remove control; the `chip.enter` envelope is decoration only.
  Unmount releases observers, native listeners and every entrance/colour controller.
- A presenting InputGroup consumes the composed frame/member envelopes it already owns; the nested Trigger
  keeps its own paint and its own insertion, and neither replays the other.
- The composed Button keeps its own acceptance, focus and state policy; Combobox never rewrites its
  presented state or installs a second colour transaction. The editor's value and caret stay Base UI's.

## Geometry and performance

- The popup width follows Base UI's `--anchor-width` and the available-width constraints; the popup height
  is Base UI's `--available-height`, with the list scrolling inside it. Combobox never writes an
  independent box, so no Cadence measurement competes with the positioner.
- The chips frame lays out once at its final available width and wraps natively; neither the frame nor the
  editor chases an animated child dimension. No observer is installed per option.
- Filtering replaces rows with retained identities and never measures or animates each row. The retained
  indicator is one host per mounted option and never allocates a second writer.
- Clip only decorative surfaces; preserve focus outlines, remove controls and portals. Popup placement
  belongs to Base UI, so anchor coordinates are never interpolated.
- Entrance/colour work is bounded by the shared collection budget; a set over the bound applies its final
  presentation immediately instead of allocating per-member visuals.

## Acceptance scenarios

Executed in the component suite: popup entrance and anchored ending on the same surface, later
Trigger/Chips/chip insertion on real hosts, the composed frame/button/editor owners, every scoped
surface/foreground owner and the separator rule, the retained option tick, native editing and positioning
boundaries, a live full/reduced/none downgrade and a zero clock.

Also pending browser verification: 3 modes × 2 OS preferences, live same-target mode/clock cancellation in
a real browser, nested/portalled hosts, SSR/no-JS/hydration probes, IME and rapid typing, keyboard
selection and result replacement, multi-chip insertion/removal with a `useComboboxAnchor` popup, a
constrained width with rich labels, and light/dark × narrow/wide screenshot review. jsdom has no layout
engine or compiled CSS, so the anchored pose, real paint interpolation and browser focus settlement are
proven only by their committed revision/source/property policy here. No performance, CLS, interaction-cost
or real-device FPS measurement was taken (ADR-023 defers performance governance).

Delegation gaps are recorded rather than hidden: the chips layout owns no measured height envelope, chip
removal has no retained exit, the composed Input Group frame and Button owners are driven by those dependencies'
own state machines, the editor deliberately keeps Base UI's native paint instead of composing Cadence
Input's owners, and an unprovable caller palette settles all of its declared paint immediately.
