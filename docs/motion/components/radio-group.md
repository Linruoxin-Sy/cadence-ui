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

| Trigger / owner                         | Full                                                                                                                   | Reduced                                                      | None                                         | Binding → preset → recipe/form                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Group insertion / group                 | One opacity entrance, with all option targets ready together.                                                          | Short opacity.                                               | Final group immediately.                     | `radio-group.root.enter` → `presence.inline` → `data.transition/opacity`     |
| Selection / group selection coordinator | Exchange only actual old/new dots using `scale.in`; an accepted empty or unmatched value has no incoming dot.          | Fade only actual changed dots; no scale.                     | Actual selected dot, or no dot, immediately. | `radio-group.indicator.select` → `state.indicator` → `state.morph/indicator` |
| Option state / item and dot             | Scoped border/background/glyph colour feedback. Colour eligibility and immediate-owner priority follow the rule below. | Short colour feedback. Colour obeys the same owner priority. | Target colours immediately.                  | `radio-group.item.colour` → `state.color` → `state.color/surface-foreground` |

Each Item owns its own `item.colour` transaction, including its dot. Actual DOM focus/focus-within or that item's invalid state settles all its declared paint immediately and cancels the colour clock in every mode. Other items may still use verified readable colour interpolation; group selection is not itself DOM focus. Dot opacity/scale retains its separate owner.

## Interruption and lifecycle

- Selection ownership is local to this RadioGroup, not the option value or the shared provider.
  Equal values in another group cannot supply an outgoing dot or receive this group's cancellation.
  Any accepted empty/unmatched value removes the old decoration without choosing a fallback option;
  if its selected item is absent, no offscreen origin or synthetic dot is created. Restore an item's
  current native checked presentation on remount rather than continuing its retired exchange.
- Native reset/restoration establishes the actually accepted selected item immediately in full,
  reduced and none and retires the previous exchange; an absent accepted value produces no dot.
  A cancelled reset or rejected controlled request changes no presentation target. Equal accepted
  values preserve an eligible current exchange, without consuming another selection revision or
  inventing callbacks. Reset defaults and form behavior remain the primitive's responsibility.
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

- Pending: render two groups with identical option values, change and remove one during an exchange,
  then deliver its retired completion. The other group's actual native selection and legal motion
  remain independent. Clear the controlled selection or use an unmatched value without a form reset;
  all modes show no incoming dot, and remounting starts from actual current checked state.
- Pending: reset mid-exchange to an existing option and to the primitive's accepted empty state;
  compare a cancelled reset and repeated equal controlled value in all modes. No old dot completion
  may restore a previous option, add a callback or select a default that the primitive did not accept.

- Pending: keyboard rapidly through separated, disabled and RTL options; selection/focus are immediate and only the current exchange remains active.
- Pending: remove the selected item or close the parent during a transition without restoring a stale dot.
- Pending: verify standalone versus parent-owned entrance, all modes, live downgrade and zero-clock cancellation.
- Pending: externally control selection, disable the selected item without changing its value, and reject a requested value change; the committed dot remains correct with no invented fallback selection.
