# Combobox motion contract

Status: target design; implementation and verification pending.

Typing stays attached to the native input while the results surface adapts to the current result set. Committed values and chips receive selective feedback without replaying every filtered row. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "content": ["combobox#ComboboxContent"],
    "input": ["combobox#ComboboxInput", "combobox#ComboboxChipsInput"],
    "chip": ["combobox#ComboboxChip"],
    "chips": ["combobox#ComboboxChips"],
    "label": [
      "combobox#ComboboxValue",
      "combobox#ComboboxChip",
      "combobox#ComboboxItem",
      "combobox#ComboboxLabel",
      "combobox#ComboboxEmpty"
    ],
    "surface": [
      "combobox#ComboboxContent",
      "combobox#ComboboxItem",
      "combobox#ComboboxChip",
      "combobox#ComboboxChips",
      "combobox#ComboboxValue",
      "combobox#ComboboxLabel",
      "combobox#ComboboxEmpty",
      "combobox#ComboboxTrigger",
      "combobox#ComboboxInput",
      "combobox#ComboboxSeparator"
    ],
    "indicator": ["combobox#ComboboxItem"],
    "position": ["combobox#ComboboxContent"],
    "quantity": ["combobox#ComboboxChip", "combobox#ComboboxItem"],
    "input-frame": ["input-group#InputGroup"],
    "input-trigger": ["input-group#InputGroupButton"],
    "input-control": ["combobox#ComboboxInput", "input-group#InputGroupInput"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                            | References                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `combobox-content` owns popup presence; initial result rows inherit it. Newly committed chips have a local insertion owner within `combobox-chips`.                                                                                                     | default: `combobox.content.enter`, `combobox.content.exit`, `combobox.chip.enter`, `combobox.chip.exit`         |
| Size            | Default: content/list share one popup height owner; chip container owns intentional row-wrap height. Input/anchor widths keep existing constraints.                                                                                                              | default: `combobox.content.resize`, `combobox.chips.resize`                                                     |
| Surface colour  | Default: popup, item, chip, chips-frame, standalone Trigger, internal Clear and separator own local paint. Input Group owns input-frame chrome; the composed Trigger inherits InputGroupButton's colour owner.                                                   | default: `combobox.surface.colour`; inherited: `@input-frame`, `@input-trigger`                                 |
| Text colour     | Default: item/value/chip/empty/label, standalone Trigger and internal Clear own foreground. The composed Trigger inherits InputGroupButton; default ComboboxInput inherits InputGroupInput, caller `render` uses its input owner, and ChipsInput inherits Chips. | default: `combobox.surface.colour`; inherited: `@input-trigger`, `@input-control`, `@chips`; composed: `@input` |
| Changed text    | Default for plain committed `combobox-value`, chip labels, item labels and empty/group labels. Native `ComboboxInput`/`ComboboxChipsInput` text is immediate; rich/render-function content is composed.                                                          | default: `combobox.label.change`; composed: `@label`                                                            |
| Changed numbers | Composed: explicit quantity displays may roll. Option values and query text are not counters; Combobox adds no result-count prop.                                                                                                                                | composed: `combobox.quantity.change`                                                                            |

## Choreography and modes

| Trigger / owner                                           | Full                                                                                                                                 | Reduced                                              | None                              | Binding → preset → recipe/form                                                                                                                                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup open/close / content                                | Anchor-relative opacity with `scale.in`; short opacity exit. Entry is subject to the actual-focus gate below.                        | Short opacity only. Entry obeys the same focus gate. | Final semantic state immediately. | `combobox.content.enter` → `presence.popup` → `popup.anchored/presence`; `combobox.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                 |
| Native editing/filtering / Base UI input and list         | Commit query, results, selection and active descendant immediately; no row-by-row entry stagger.                                     | Same immediate editing.                              | Same immediate editing.           | `combobox.input.edit` → `engine.native` → `native/base-ui-combobox` (Base UI Combobox/native editing (no new recipe))                                                                                    |
| Result set/empty state changes / popup height owner       | Measure latest result-region height and clamp; existing keyed rows keep identity and scroll.                                         | Final height immediately.                            | Final height immediately.         | `combobox.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                              |
| Commit/remove chip / chip group layout owner              | Local chip opacity plus bounded group reflow; removed chip cannot retain a remove-button target.                                     | Opacity only; final layout immediately.              | Final chips/layout immediately.   | `combobox.chip.enter` → `presence.inline` → `data.transition/opacity`; `combobox.chip.exit` → `presence.exit` → `exit.fade/opacity`; `combobox.chips.reflow` → `layout.compact` → `layout.move/position` |
| Chip wrapping / chip shell                                | One measured final container height, coordinated with the chip reflow target.                                                        | Immediate geometry.                                  | Immediate geometry.               | `combobox.chips.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                |
| Owned committed display text / relevant part              | Changed-run replacement, `stagger: none`; query/native caret text is excluded.                                                       | Changed-run opacity only.                            | Final display text immediately.   | `combobox.label.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                    |
| Token/highlight/selection/disabled / local colour regions | Scoped surface/foreground colour and local selection-marker opacity; keyboard focus remains immediate.                               | Short colour/opacity only.                           | Final state immediately.          | `combobox.surface.colour` → `state.color` → `state.color/surface-foreground`; `combobox.indicator.select` → `state.indicator` → `state.morph/indicator`                                                  |
| Anchor/collision change / positioner                      | Correct placement immediately, preserving the actual `useComboboxAnchor`/caller anchor and available bounds.                         | Same placement.                                      | Same placement.                   | `combobox.position.place` → `engine.native` → `native/base-ui-combobox` (Base UI Combobox positioning (no new recipe))                                                                                   |
| Explicit composed quantity / child owner                  | Roll changed places on discrete display revisions; query and option identity remain nonnumeric.                                      | Final number immediately.                            | Final number immediately.         | `combobox.quantity.change` → `number.compact` → `number.roll/reels`                                                                                                                                      |
| Chip-remove hover/focus / internal remove-button paint    | Opacity follows its existing resting/active paint, without changing hit geometry; focus makes the control fully visible immediately. | Short opacity for pointer changes; focus immediate.  | Final opacity immediately.        | `combobox.chip.affordance` → `presence.inline` → `data.transition/opacity`                                                                                                                               |

The `surface` binding covers separate popup/item/chip/chips-frame and display-foreground regions,
plus a standalone Trigger, the internal ComboboxClear hosted by ComboboxInput, and the separator rule. The
ComboboxInput anchor in that map means its clear-control region, not its Input Group frame or native
editor. In ComboboxInput's default `showTrigger` branch, `input-trigger` names the direct dependency
`input-group#InputGroupButton`, rendered with ComboboxTrigger. It inherits InputGroupButton's
[Button colour owner](input-group.md) once for surface and foreground; local `surface.colour` excludes
that rendered Trigger node. InputGroup owns the frame once. ComboboxInput's default input inherits InputGroupInput's
`control.colour`; a caller `render` replacement delegates foreground to its actual input owner,
without an extra Combobox writer. A caller-provided InputGroupInput retains its normal inherited
contract. Chips owns its distinct focus/invalid frame and inherited ChipsInput foreground.
`label.change` explicitly includes ComboboxValue and Chip's display children, never ChipsInput's
value or ChipRemove's accessible name. Option/chip identities remain text even when numeric; rich
quantity accessories use composition. The composed Trigger keeps InputGroupButton's inherited Button
`render` safety rule: press scale requires a safe internal visual layer separate from hit/focus/anchor
geometry; otherwise retain colour feedback and omit scale, preserving refs, events and direct-child
layout. This contract adds no press binding or wrapper. Variant classes alone do not supply Button's press executor.
ChipRemove has one opacity owner; disabled resting opacity and immediate focus take precedence over
hover feedback, and no decorative glyph can intercept remove activation.

## Interruption and lifecycle

With the ordinary input outside the popup, focus stays in that editor and popup entry can run without moving it. If an inside-popup input/popup receives native initial focus, or keyboard interaction requires an active result to be immediately visible and stationary, settle the affecting popup envelope first. Preserve Base UI's actual initial-focus policy; do not blur, refocus or delay the editor to guarantee entry.

- Base UI owns input, IME, active descendant, selection, filtering and focus safety. Never remount the input or delay results until outgoing rows finish.
- Fast typing replaces the pending height target; excessive frequency falls back to immediate size rather than building a queue. A removed highlighted item follows native focus fallback immediately.
- Close cancels list/chip presentation inside the popup. Reopen uses current results without replaying stale rows; chip removal returns focus according to Base UI, not after its visual exit.
- Live reduced cancels size/reflow/scale; none/zero clock also cancels remaining presentation and completes a closing popup through Base UI's actual native protocol. Native caret, selection, chip removal and scrolling remain available. Unmount releases observers, native handlers and outgoing decorative chip copies.
- Async results received after close update the current data without hidden size animation or reopening. A new open/query revision invalidates obsolete size/exit callbacks. Popup closure does not reset an outside chip collection or cancel a native input edit; controlled values follow actual accepted state.

## Geometry and performance

- One natural list measurement and one height shell; popup width follows the anchor and available-width constraints. Lay rows at final target width before measuring height; passive viewport/font changes are immediate.
- Chips lay out once at the final available width. The group consumes one committed destination for reflow and height; neither ancestor nor input frame chases animated child dimensions.
- No observer per result. Above the shared visible-list budget, use the existing collection/virtualized composition and skip blanket row layout animation; preserve stable keys.
- Clip result content only, retaining input focus outlines, remove controls and portals. Base UI positioner owns placement; no independent animation of anchor coordinates.
- Measure natural list/chip layout separately from its sizing host and clamp dimensions to valid non-negative bounds. Reflow moves decorative chip surfaces only; native input/caret/focused remove controls reach final usable geometry immediately. If an intermediate chip shell would crop labels or the editing row, settle its height instead of hiding required content. A highlighted result is immediately scrolled into view or its viewport size settles.
- Parent Input Group or a surrounding panel consumes the same committed chip/list destination or delegates that cause; it must not run a second spring chasing either host. Virtualized placement belongs to its actual virtualizer, including recycled item identity; unavailable safe natural measurement uses immediate geometry.

## Acceptance scenarios

- Pending: IME, rapid typing, empty results, clear, keyboard selection and result replacement preserve native caret/focus without stale exits.
- Pending: multi-chip insertion/removal and wrapping with a popup anchored through `useComboboxAnchor` do not produce competing geometry writers.
- Pending: large/virtualized lists, rich labels, partial plain-text updates, all modes, live downgrade, zero clock and close during filtering.
- Pending: type into a wrapping chips field while adding/removing chips, downgrade mid-edit and deliver async results after close; caret/focused controls stay visible, values remain current and no parent/child size spring competes.

- Pending: rename a retained Value/Chip and group label, hover then focus ChipRemove, and change invalid/theme state on both input and chips compositions; no editor diff, duplicate frame colour or stale remove action is allowed.
- Pending: Compare the normal outside-input composition with an input inside the popup: retain eligible popup entry without disturbing the outside caret, and settle only the envelope that affects a real inside focus/active target.
- Pending: compare a standalone Trigger and internal Clear with ComboboxInput's `showTrigger` composition through hover, focus, disabled/theme changes, all modes, live downgrade and zero clock. The first two keep local colour ownership; the composed Trigger uses InputGroupButton's inherited Button owner once, without a local colour writer. Its press follows the existing safe-layer fallback, preserving native activation, refs, direct-child layout and stable hit/focus/anchor geometry without added wrappers; input-frame, input-control and chips colour owners remain distinct.
