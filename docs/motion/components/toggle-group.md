# Toggle Group motion contract

Status: target design; implementation and verification pending.

A single-select group uses one shared selection surface; a multi-select group gives each selected item its own state. The group coordinates layout so labels do not start competing springs. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["toggle-group#ToggleGroup"],
    "indicator": ["toggle-group#ToggleGroup", "toggle-group#ToggleGroupItem"],
    "item": ["toggle-group#ToggleGroupItem"],
    "items": ["toggle-group#ToggleGroup"],
    "content": ["toggle-group#ToggleGroupItem"],
    "quantity": ["toggle-group#ToggleGroupItem"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                 | References                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Appearance      | Default: `toggle-group` owns one entrance; `toggle-group-item` and `toggle-group-content` inherit it.                                                                                 | default: `toggle-group.root.enter`                                                               |
| Size            | Default: group owns content-driven strip dimensions and item reflow along `orientation`; each label exposes a natural target without independently animating the same strip geometry. | default: `toggle-group.root.resize`                                                              |
| Surface colour  | Default: shared selected surface in single mode; item surfaces independently in `multiple` mode. Root owns variant track colour.                                                      | default: `toggle-group.item.colour`, `toggle-group.root.colour`, `toggle-group.indicator.colour` |
| Text colour     | Default: item foreground follows selected/hover/disabled state.                                                                                                                       | default: `toggle-group.item.colour`                                                              |
| Changed text    | Default for owned primitive item content: each `toggle-group-content` replaces only changed runs. Rich children are composed.                                                         | default: `toggle-group.content.change`; composed: `@content`                                     |
| Changed numbers | Composed: only explicit quantity children roll; item values and numeric-looking option names remain identifiers.                                                                      | composed: `toggle-group.quantity.change`                                                         |

## Choreography and modes

| Trigger / owner                                          | Full                                                                                                                                                         | Reduced                                                | None                       | Binding → preset → recipe/form                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Group insertion / root                                   | One opacity entrance without item stagger.                                                                                                                   | Short opacity.                                         | Final group immediately.   | `toggle-group.root.enter` → `presence.inline` → `data.transition/opacity`                                                                             |
| Single selection / group selection surface               | One shared indicator translates/resizes between committed item boxes when its path is readable; otherwise place it immediately. No duplicate selected plate. | Plate places immediately; no residual selection tween. | Final plate immediately.   | `toggle-group.indicator.select` → `layout.selection` → `layout.shared/selection`                                                                      |
| Multiple selection / each item indicator                 | Local indicator opacity and `scale.in` feedback; token colour belongs to the separate colour binding and there is no shared travelling plate.                | Opacity only, final indicator geometry.                | Final state immediately.   | `toggle-group.item.select` → `state.indicator` → `state.morph/indicator`                                                                              |
| Pointer/keyboard press / item visual owner               | `scale.press`, separated from group indicator coordinates.                                                                                                   | No scale.                                              | No tween.                  | `toggle-group.item.press` → `feedback.press` → `feedback.press/scale`                                                                                 |
| Interaction/variant / surface and text owners            | Scoped surface, border and foreground colours.                                                                                                               | Short colour feedback.                                 | Final colours immediately. | `toggle-group.item.colour` → `state.color` → `state.color/surface-foreground`                                                                         |
| Labels/item set/explicit size / group layout owner       | One measured axis transaction retargets strip and selection plate together.                                                                                  | Final layout immediately.                              | Final layout immediately.  | `toggle-group.root.resize` → `geometry.compact` → `geometry.resize/measured`; `toggle-group.items.reflow` → `layout.compact` → `layout.move/position` |
| Primitive item label / content presentation              | Retain unchanged graphemes; changed runs use `stagger: none`.                                                                                                | Changed-run opacity only.                              | Final text immediately.    | `toggle-group.content.change` → `text.replace` → `text.change/changed-runs`                                                                           |
| Explicit composed quantity / that child owner            | Roll changed places only, without interpreting option values or ordinary numeric-looking labels as quantities.                                               | Final number immediately.                              | Final number immediately.  | `toggle-group.quantity.change` → `number.compact` → `number.roll/reels`                                                                               |
| Root variant or shared/local selected-fill paint changes | Root track and selected decoration have separate scoped surface-colour owners; item foreground remains with item.colour.                                     | Short colour; selected geometry is immediate.          | Final paint immediately.   | `toggle-group.root.colour` → `state.color` → `state.color/surface`; `toggle-group.indicator.colour` → `state.color` → `state.color/surface`           |

Root track colour belongs to `root.colour`; each actual selected-decoration layer belongs to
`indicator.colour` in both single and multiple modes. Item colour owns item foreground and any
remaining non-indicator surface only. It never adds another selected background under the plate.
Selection opacity/scale and colour are disjoint properties on the decoration. Changing the
single/multiple selection mode cancels the incompatible shared/per-item decoration through its
current owner before establishing the new form; this does not mean a motion-mode reduction cancels
otherwise permitted short opacity or colour feedback.

## Interruption and lifecycle

- Committed value arrays and roving focus update immediately; a controlled request is not an accepted selection. Selection, label and item-set changes share the latest committed layout snapshot; an old selection cannot complete over a new item. No selected values means no selected plate, rather than inventing a first selection. First placement or restoration after no valid selected item is immediate; an absent origin is never a rectangle at zero.
- Reversal continues from the current indicator geometry. Switching `multiple` cancels the incompatible shared/local presentation before placing the new state.
- Removing an item unregisters its measurement and press state. Parent exit owns removal; the group does not retain interactive exiting items.
- Live reduced/none settles selection/layout and removes decorative press scale. A zero recipe clock in full mode instead reaches the current selection/layout immediately and keeps an accepted held item at `scale.press`, with immediate release to rest. Neither policy clears native capture or the accepted value array. Unmount releases group registrations and active writers.

## Geometry and performance

For a caller-scrollable group, item projections and the shared/local selected decorations use one
group-content coordinate space. Native focus-reveal/page scrolling is not another value change;
keep valid common-space motion, and settle the coupled projection when a relative scroll/sticky or
transform change invalidates that space. Do not compensate scroll twice, chase projected rectangles
or reset the user's offset. Selected decoration must not enlarge scroll extent or add snap targets.

- The single-select plate must satisfy the [rendered-colour constraint](../../animation-system.md#35-colour-feedback)
  beneath every affected item label, including immediate focused foreground against independently
  timed plate paint. If the path is unsafe or unverified, place the plate and affected known paint
  immediately instead of fading/duplicating unchanged labels. Multiple-mode local decorations use
  the same paint check but do not acquire a travelling plate. Unrelated press/content owners remain
  eligible, with no override of their actual modes or native selection.

- Measure committed untransformed item boxes in one group pass; no observer per character or per animation frame. Support horizontal/vertical orientation and RTL.
- One natural strip-measurement region, one separate strip sizing host and one selection surface writer; item press uses the supported inner content layer and never changes the anchor rectangle. Item layout projection and the selection plate must use one consistent group-local coordinate frame so ancestor displacement is not counted twice. A custom render without safe layer separation omits press scale.
- Lay item content once at final destination widths, then measure the group and selected plate from that layout. Animate group/reflow presentation around those committed boxes, not repeated intermediate text wrapping; passive font/viewport changes settle immediately.
- Animate only the selected plate plus changed visible items, bounded by the common list/text budget. Overflow follows caller layout; never clip focus outlines.
- Clamp rendered sizes to valid non-negative constraints. If strip/label growth would temporarily crop required labels or focused items, resolve the affected size axis immediately or preserve existing legal overflow; do not add truncation. Native selection/roving focus continues in reduced/none, including while geometry feedback is cancelled.

For unchanged selected values, the strip transaction projects each selected decoration through the same current item reflow/size coordinates; the shared plate does not independently start layout.selection on a changed rectangle. One plate writer consumes that projection, without per-frame layout reads. Only a committed selection change uses the selection clock. If selection and reflow occur together, that writer combines the selection path and strip projection once, avoiding duplicate source/destination displacement. Multiple-mode decorations remain attached to their own item projections. If a custom render or adapter cannot preserve this coupling, settle the affected strip/item/plate geometry together immediately. Matching final boxes or starting independent smooth/snappy springs together is not adequate coordination.

## Acceptance scenarios

- Pending: change selection and labels in a scrollable RTL/vertical group while native focus scrolls
  an item into view. Scroll a shared ancestor, then invalidate the local mapping. The decoration stays
  attached or settles with its items, without a second selection, scrollbar or pointer/capture change.

- Pending: change selection, focus and track/plate/label colours together in single mode, then switch
  to multiple. Verify readable intermediate combinations or immediate affected placement/paint, with
  no duplicated labels, second selected fill or delayed value. Compare reduced/none and differing
  local clocks; one owner's immediate focus response cannot silently invalidate another's palette.

- Pending: hold an item while a label/selection update runs, set timeScale to zero, then release. Full-mode held scale persists at its immediate target; reduced/none remain unscaled, and no mode/clock change clears native held state or invents a selected value.

- Pending: rapidly change single selection while labels and widths change; the one plate reaches the latest selected item.
- Pending: exercise `multiple`, all variants, vertical/RTL, mixed item sizes, disabled items and removal of the selected item.
- Pending: verify no invented selection on focus, parent-owned entrance, all modes, zero clock and mid-transition mode changes.
- Pending: combine press, selection and label/item reflow, empty the selected value array and use a custom-render item; there is no doubled displacement, stale plate or unreadable intermediate label. Exercise an explicit quantitative child separately from numeric option identity.

- Pending: restore a single selection after clearing/removing its origin, and set zero timeScale during a held press. The plate establishes a current baseline; press timing changes without becoming a none-mode scale reset.
- Pending: keep selection fixed while an earlier item's label grows or items reorder, then select another item during reflow. Check intermediate plate attachment in single and multiple modes; coordinated projection or immediate whole-transaction fallback prevents marker lag and doubled displacement.
