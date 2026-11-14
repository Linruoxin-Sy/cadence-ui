# Radio Group motion contract

Status: functionally migrated. Numerical performance governance remains deferred under ADR-023.

Selection reads as a coordinated exchange between two local dots. A dot never flies across distant options. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "regions": {
    "root": ["radio-group"],
    "indicator": ["radio-group-indicator"],
    "item": ["radio-group-item"]
  },
  "parts": {
    "root": ["radio-group#RadioGroup"],
    "indicator": ["radio-group#RadioGroupItem"],
    "item": ["radio-group#RadioGroupItem"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                          | References                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Appearance      | Default: `radio-group` owns one independent group entrance; items inherit it and never fade twice. An entering field group may own the whole entrance instead. | default: `radio-group.root.enter`  |
| Size            | Inherited: group layout follows its parent; `radio-group-item` remains a fixed circle. There is no owned label-driven shell.                                   | inherited: `@root`                 |
| Surface colour  | Default: each `radio-group-item` owns its border, background and ring paint, including any caller hover/checked palette; disabled dimming stays opacity.       | default: `radio-group.item.colour` |
| Text colour     | Default: each `radio-group-item` owns the dot's currentColor paint; external labels belong to their own owners.                                                | default: `radio-group.item.colour` |
| Changed text    | Not applicable: Radio Group has no owned label slot. Caller-composed labels may use their own text contract.                                                   | not-applicable: `@root`            |
| Changed numbers | Not applicable: option values are identities, including numeric values; this control does not display a quantity.                                              | not-applicable: `@root`            |

## Choreography and modes

| Trigger / owner                         | Full                                                                                                                   | Reduced                                                      | None                                         | Binding → preset → recipe/form                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------- |
| Group insertion / group                 | One opacity entrance, with all option targets ready together.                                                          | Short opacity.                                               | Final group immediately.                     | `radio-group.root.enter` → `presence.inline` → `data.transition/opacity`     |
| Selection / group selection coordinator | Exchange only actual old/new dots using `scale.in`; an accepted empty or unmatched value has no incoming dot.          | Fade only actual changed dots; no scale.                     | Actual selected dot, or no dot, immediately. | `radio-group.indicator.select` → `state.indicator` → `state.morph/indicator` |
| Option state / item and dot             | Scoped border/background/glyph colour feedback. Colour eligibility and immediate-owner priority follow the rule below. | Short colour feedback. Colour obeys the same owner priority. | Target colours immediately.                  | `radio-group.item.colour` → `state.color` → `state.color/surface-foreground` |

Each Item owns its own `item.colour` transaction over one declared paint set — border, background, ring and `color` — and the dot reads `currentColor`, so the same transaction reaches it. Actual DOM focus/focus-within or that item's invalid state settles all of its declared paint immediately and cancels the colour clock in every mode. Other items may still use verified readable colour interpolation; group selection is not itself DOM focus. Dot opacity/scale retains its separate owner.

## Interruption and lifecycle

- Selection ownership is local to this RadioGroup, not the option value or the shared provider.
  Every item drives only its own indicator from Base UI's committed checked state, so equal values in
  another group can neither supply an outgoing dot nor receive this group's cancellation.
  Any accepted empty/unmatched value removes the old decoration without choosing a fallback option;
  if its selected item is absent, no offscreen origin or synthetic dot is created. Remounting an item
  starts from its actual current checked presentation rather than continuing a retired exchange.
- Native reset/restoration establishes the actually accepted selected item and retires the previous
  exchange; an absent accepted value produces no dot. A cancelled reset or rejected controlled request
  changes no presentation target. Equal accepted values preserve an eligible current exchange, without
  consuming another selection revision or inventing callbacks. Reset defaults and form behavior remain
  the primitive's responsibility: Base UI restores its hidden input, and Cadence adds no reset writer.
- Arrow-key selection and roving focus commit immediately. Each accepted revision retargets only the
  two affected indicators; repeated arrows never queue a tour of old selections.
- Reversal to the previous option uses its current opacity/scale. Removed options unregister immediately;
  disabling a selected option does not erase its still-committed selected dot. Base UI and the controlled
  value retain focus/selection authority.
- Parent closure/removal cancels local motion and owns exit. Reinserted options render their actual
  selection, not a default first dot.
- Live reduced drops scale; none and zero clock clear pending presentation work and show the selected item.
  Unmount releases group registration and animations.

## Geometry and performance

- No cross-option rectangle measurement is necessary. Every indicator is its own single transform/opacity
  writer, and an item revision runs only when its committed checked state changes, so at most the outgoing
  and incoming dots move regardless of option count. Group layout and external labels do not run a spring
  per arrow press.
- If a third selection arrives during an exchange, each indicator simply retargets from its current
  presentation; obsolete outgoing paint is discarded rather than growing the moving set. Native arrow/click/form
  operation stays available in reduced/none; caller layout changes are immediate and never produce
  negative/interpolated control dimensions.
- Pointer targets, circle dimensions and focus rings stay fixed. Parent clipping must not cut focus rings.

## Acceptance scenarios

Target acceptance; not executed in a browser: render two groups with identical option values, change and remove one during an exchange, then deliver its retired completion; clear the controlled selection or use an unmatched value without a form reset; reset mid-exchange to an existing option and to the primitive's accepted empty state; compare a cancelled reset and a repeated equal controlled value in all modes; keyboard rapidly through separated, disabled and RTL options; remove the selected item or close the parent during a transition; verify standalone versus parent-owned entrance; externally control selection, disable the selected item without changing its value, and reject a requested value change.

The executed suite covers the three authored actions in full/reduced/none on one live instance each: the independent group entrance (a later insertion on the same root), the indicator dot revision (a controlled checked change on the same indicator) and the colour owner (a committed palette change on the same item), plus `state.color` as the real policy on the item and the `Size`, `Changed text` and `Changed numbers` boundaries on that root. It also covers two groups with identical values staying independent, an unmatched controlled value showing no dot, a native form reset adding no callback or revision, disabled/read-only/locked groups, keyboard selection and roving focus, rapid retargeting of one indicator, removal of a selected option, the reduced-mode full-size dot and the live full/reduced/none downgrade. A positive-clock case proves the shipped chrome keeps the colour clock and that focus, invalid state and a caller palette settle the declared paint immediately; browser first paint and per-frame cancellation remain a separate gate.
