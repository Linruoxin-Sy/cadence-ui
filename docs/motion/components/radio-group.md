# Radio Group motion contract

Status: target design; implementation and verification pending.

Selection reads as a coordinated exchange between two local dots. A dot never flies across distant options. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "root": ["radio-group#RadioGroup"],
    "indicator": ["radio-group#RadioGroupItem"],
    "item": ["radio-group#RadioGroupItem"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                     | References                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Appearance      | Default: `radio-group` owns one independent group entrance; items inherit it. An entering field group may own the whole entrance instead. | default: `radio-group.root.enter`  |
| Size            | Inherited: group layout follows its parent; `radio-group-item` remains a fixed circle. There is no owned label-driven shell.              | inherited: `@root`                 |
| Surface colour  | Default: each `radio-group-item` owns selected, hover, disabled and invalid background/border feedback.                                   | default: `radio-group.item.colour` |
| Text colour     | Default: each `radio-group-indicator` owns dot colour. External labels belong to their own owners.                                        | default: `radio-group.item.colour` |
| Changed text    | Not applicable: Radio Group has no owned label slot. Caller-composed labels may use their own text contract.                              | not-applicable: `@root`            |
| Changed numbers | Not applicable: option values are identities, including numeric values; this control does not display a quantity.                         | not-applicable: `@root`            |

## Choreography and modes

| Trigger / owner                         | Full                                                                                                                  | Reduced                | None                                  | Binding → preset → recipe/form                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| Group insertion / group                 | One opacity entrance, with all option targets ready together.                                                         | Short opacity.         | Final group immediately.              | `radio-group.root.enter` → `presence.inline` → `data.transition/opacity`     |
| Selection / group selection coordinator | Shared selection transaction fades/scales the old and new local indicators using `scale.in`; no travelling row plate. | Crossfade local dots.  | Exactly the selected dot immediately. | `radio-group.indicator.select` → `state.indicator` → `state.morph/indicator` |
| Option state / item and dot             | Scoped border/background/glyph colour feedback.                                                                       | Short colour feedback. | Target colours immediately.           | `radio-group.item.colour` → `state.color` → `state.color/surface-foreground` |

## Interruption and lifecycle

- Arrow-key selection and roving focus commit immediately. The coordinator retargets the current two local indicators; repeated arrows never queue a tour of old selections.
- Reversal to the previous option uses its current opacity/scale. Removed options unregister immediately; disabling a selected option does not erase its still-committed selected dot. Base UI and the controlled value retain focus/selection authority.
- Parent closure/removal cancels local motion and owns exit. Reinserted options render their actual selection, not a default first dot.
- Live reduced drops scale; none and zero clock clear pending presentation work and show the selected item. Unmount releases group registration and animations.

## Geometry and performance

- No cross-option rectangle measurement is necessary. One selection coordinator tracks old/new keys; each indicator has one transform/opacity writer.
- Animate at most the outgoing and incoming indicator in a selection transaction, regardless of option count. Group layout and external labels do not run a spring per arrow press.
- If a third selection arrives during an exchange, discard obsolete outgoing paint rather than growing the moving set. Native arrow/click/form operation stays available in reduced/none; caller layout changes are immediate and never produce negative/interpolated control dimensions.
- Pointer targets, circle dimensions and focus rings stay fixed. Parent clipping must not cut focus rings.

## Acceptance scenarios

- Pending: keyboard rapidly through separated, disabled and RTL options; selection/focus are immediate and only the current exchange remains active.
- Pending: remove the selected item or close the parent during a transition without restoring a stale dot.
- Pending: verify standalone versus parent-owned entrance, all modes, live downgrade and zero-clock cancellation.
- Pending: externally control selection, disable the selected item without changing its value, and reject a requested value change; the committed dot remains correct with no invented fallback selection.
