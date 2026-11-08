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
    "trigger": ["combobox#ComboboxTrigger"],
    "trigger-label": ["combobox#ComboboxTrigger"],
    "trigger-quantity": ["combobox#ComboboxTrigger"],
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
    "quantity": ["combobox#ComboboxChip", "combobox#ComboboxItem", "combobox#ComboboxEmpty"],
    "empty": ["combobox#ComboboxEmpty"],
    "input-frame": ["input-group#InputGroup"],
    "input-trigger": ["input-group#InputGroupButton"],
    "input-control": ["combobox#ComboboxInput", "input-group#InputGroupInput"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                  | References                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Appearance      | Default: `combobox-content` owns popup presence; initial result rows inherit it. Independently inserted Chips and a standalone Trigger own one inline envelope unless a parent consumes that cause. Later committed chips keep their local insertion owner; the Input composition inherits its Input Group/Button appearance.          | default: `combobox.content.enter`, `combobox.content.exit`, `combobox.chips.enter`, `combobox.trigger.enter`, `combobox.chip.enter`, `combobox.chip.exit`; inherited: `@input-frame`, `@input-trigger` |
| Size            | Default: content/list share one popup height owner; chip container owns intentional row-wrap height. Input/anchor widths keep existing constraints.                                                                                                                                                                                    | default: `combobox.content.resize`, `combobox.chips.resize`                                                                                                                                            |
| Surface colour  | Default: popup, item, chip, chips-frame, standalone Trigger, internal Clear and separator own local paint. Input Group owns input-frame chrome; the composed Trigger inherits InputGroupButton's colour owner.                                                                                                                         | default: `combobox.surface.colour`; inherited: `@input-frame`, `@input-trigger`                                                                                                                        |
| Text colour     | Default: item/value/chip/empty/label, standalone Trigger and internal Clear own foreground. The composed Trigger inherits InputGroupButton; default ComboboxInput inherits InputGroupInput, caller `render` uses its input owner, and ChipsInput inherits Chips.                                                                       | default: `combobox.surface.colour`; inherited: `@input-trigger`, `@input-control`, `@chips`; composed: `@input`                                                                                        |
| Changed text    | Default for plain committed Value/chip/item/empty/group labels and a standalone Trigger's direct string children. Native Input/ChipsInput edits remain immediate. The composed showTrigger branch inherits Button's display owner; rich/render-function content is composed.                                                           | default: `combobox.label.change`, `combobox.trigger-label.change`; inherited: `@input-trigger`; composed: `@label`, `@trigger`                                                                         |
| Changed numbers | Default: supported direct numbers in the existing Empty display and the generic standalone Trigger display use compact reels on eligible revisions. The composed showTrigger branch inherits Button's applicability once. Rich quantities are composed; option/chip identities and query text stay nonnumeric. No count prop is added. | default: `combobox.empty.roll`, `combobox.trigger-quantity.change`; inherited: `@input-trigger`; composed: `combobox.quantity.change`, `@trigger`                                                      |

## Choreography and modes

| Trigger / owner                                                          | Full                                                                                                                                                                                              | Reduced                                                          | None                              | Binding → preset → recipe/form                                                                                                                                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent Chips/standalone Trigger insertion / actual frame or trigger | One opacity envelope; Chips consumes initial chip/input appearances and the Input showTrigger composition inherits its actual Button owner instead. Ordinary SSR/first render is already visible. | Short opacity for a later insertion.                             | Final control immediately.        | `combobox.chips.enter` → `presence.inline` → `data.transition/opacity`; `combobox.trigger.enter` → `presence.inline` → `data.transition/opacity`                                                         |
| Standalone Trigger direct display revision / trigger display owner       | Changed string runs replace without stagger; a supported direct number rolls changed places with its existing output. Initial/type-changing displays are immediate baselines.                     | Changed-run opacity only; quantities immediately.                | Final display immediately.        | `combobox.trigger-label.change` → `text.replace` → `text.change/changed-runs`; `combobox.trigger-quantity.change` → `number.compact` → `number.roll/reels`                                               |
| Popup open/close / content                                               | Anchor-relative opacity with `scale.in`; short opacity exit. Entry is subject to the actual-focus gate below.                                                                                     | Short opacity only. Entry obeys the same focus gate.             | Final semantic state immediately. | `combobox.content.enter` → `presence.popup` → `popup.anchored/presence`; `combobox.content.exit` → `presence.exit` → `exit.fade/opacity`                                                                 |
| Native editing/filtering / Base UI input and list                        | Commit query, results, selection and active descendant immediately; no row-by-row entry stagger.                                                                                                  | Same immediate editing.                                          | Same immediate editing.           | `combobox.input.edit` → `engine.native` → `native/base-ui-combobox` (Base UI Combobox/native editing (no new recipe))                                                                                    |
| Result set/empty state changes / popup height owner                      | Measure latest result-region height and clamp; existing keyed rows keep identity and scroll.                                                                                                      | Final height immediately.                                        | Final height immediately.         | `combobox.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                              |
| Commit/remove chip / chip group layout owner                             | Local chip opacity plus bounded group reflow; removed chip cannot retain a remove-button target.                                                                                                  | Opacity only; final layout immediately.                          | Final chips/layout immediately.   | `combobox.chip.enter` → `presence.inline` → `data.transition/opacity`; `combobox.chip.exit` → `presence.exit` → `exit.fade/opacity`; `combobox.chips.reflow` → `layout.compact` → `layout.move/position` |
| Chip wrapping / chip shell                                               | One measured final container height, coordinated with the chip reflow target.                                                                                                                     | Immediate geometry.                                              | Immediate geometry.               | `combobox.chips.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                |
| Owned committed display text / relevant part                             | Changed-run replacement, `stagger: none`; query/native caret text is excluded.                                                                                                                    | Changed-run opacity only.                                        | Final display text immediately.   | `combobox.label.change` → `text.replace` → `text.change/changed-runs`                                                                                                                                    |
| Token/highlight/selection/disabled / local colour regions                | Scoped surface/foreground colour and local selection-marker opacity; keyboard focus remains immediate. Colour eligibility and immediate-owner priority follow the rule below.                     | Short colour/opacity only. Colour obeys the same owner priority. | Final state immediately.          | `combobox.surface.colour` → `state.color` → `state.color/surface-foreground`; `combobox.indicator.select` → `state.indicator` → `state.morph/indicator`                                                  |
| Anchor/collision change / positioner                                     | Correct placement immediately, preserving the actual `useComboboxAnchor`/caller anchor and available bounds.                                                                                      | Same placement.                                                  | Same placement.                   | `combobox.position.place` → `engine.native` → `native/base-ui-combobox` (Base UI Combobox positioning (no new recipe))                                                                                   |
| Visible Empty numeric revision / owned display                           | Roll changed places only; no simultaneous text replacement on those digits. First display and query/filter-driven updates are immediate.                                                          | Final number immediately.                                        | Final number immediately.         | `combobox.empty.roll` → `number.compact` → `number.roll/reels`                                                                                                                                           |
| Explicit composed quantity / child owner                                 | Roll changed places on discrete display revisions; query and option identity remain nonnumeric.                                                                                                   | Final number immediately.                                        | Final number immediately.         | `combobox.quantity.change` → `number.compact` → `number.roll/reels`                                                                                                                                      |
| Chip-remove hover/focus / internal remove-button paint                   | Opacity follows its existing resting/active paint, without changing hit geometry; focus makes the control fully visible immediately.                                                              | Short opacity for pointer changes; focus immediate.              | Final opacity immediately.        | `combobox.chip.affordance` → `presence.inline` → `data.transition/opacity`                                                                                                                               |

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

A standalone Trigger's children are a generic display slot: that part does not read the selected
value or classify its supplied child as an option key. A direct string therefore uses
`trigger-label.change`, a supported direct number uses `trigger-quantity.change`, and rich children
retain composed ownership. Numeric-looking strings stay strings; callers supplying an identifier
use text rather than asking motion to infer intent. The fixed trigger box and chevron, native ref,
existing accessible-name/default `aria-label` policy and event target remain unchanged; no new label,
quantity prop or width spring is added. Unsafe shaping or a reel that cannot fit that actual box
uses exact immediate content. The showTrigger composition instead uses InputGroupButton/Button's
existing display owner once, with no standalone Trigger text/reel controller on the same node.

Ordinary SSR/hydration and first CSR remain naturally visible. A later independent Chips insertion
uses one frame envelope and consumes only its initial chip/input entrances; later chip or standalone
Trigger display revisions keep their independent causes. Input Group/Button consumes the matching
Input/showTrigger entry, and actual focus/activation settles only the envelope affecting its native
target. Default popup opening, query filtering and focus restoration never replay the outside frame.

Colour eligibility is evaluated per actual popup/item/chip/chips-frame/control region. DOM focus/focus-within or that region's own invalid state cancels its colour clock and applies its entire declared palette immediately; this includes the Chips frame around a focused ChipsInput. InputGroup and its inherited button/control enforce the same rule at their own boundaries. Active-descendant, hover or selection highlight alone is not DOM focus. Other colour interpolation requires a verified readable palette; marker opacity remains a separate action.

An already visible ComboboxEmpty dispatches a direct string to `label.change` and a supported direct numeric child to `empty.roll`, preserving the existing output and empty-state visibility branch. First display, a renderer-type change, and updates arriving while hidden establish the latest value immediately; they do not invent a numeric origin. Only a discrete non-query/filter revision while Empty remains visible may roll. Query/filter-driven updates or overlapping revisions settle its current number immediately without a queue or deferred replay, and hiding/closing cancels its visual work. Rich children keep composed ownership; option/chip names and native query text remain identities. The Empty transaction uses the existing popup size owner and shared aggregate text/reel budget.

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
- No observer per result. Automatic chip presence/reflow counts participating chips, measured/projected retained siblings, distinct outgoing visuals and any participating chips shell under the [collection bound](../presets.md#52-shared-work-limits), before member layout reads or copy allocation. Oversized sets use immediate collection presentation; a composed virtualizer needs its own bounded placement adapter. Result filtering and one native popup-height destination do not authorize per-row entrance/measurement or change result identities.
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

- Pending: while ComboboxEmpty stays visible, revise a supported direct numeric child, then compare a numeric-looking string and rich quantity content. Verify exact output including zero, one renderer, immediate string/number baselines, and no new count API. Hide/reveal Empty, update during query filtering or overlapping revisions, close mid-roll and change modes/zero clock; the latest semantic value is immediate with no stale reel or delayed replay.
- Pending: independently insert Chips with initial chips/input and a standalone Trigger, then update a Trigger string, direct number, numeric-looking string and rich children. Verify one same-cause frame envelope, exact output/name/ref semantics, immediate initial/type baselines and no duplicate showTrigger Button display owner. Close/reopen the popup or restore focus while updating the outside control; its independent current display stays eligible under its own visibility, focus, mode and work-budget gates.
