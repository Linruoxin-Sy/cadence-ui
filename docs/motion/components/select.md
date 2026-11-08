# Select motion contract

Status: target design; implementation and verification pending.

Selection preserves unchanged label characters and normally replaces only changed local text. A real-origin handoff is eligible only for one safely mapped contiguous changed run; it is not a multi-run capture system. One presentation owner chooses the eligible handoff or local replacement for each revision. This contract inherits the [common contract](../README.md) and [presets](../presets.md); bindings are design references, not recipe IDs or public APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "trigger": ["select#SelectTrigger"],
    "content": ["select#SelectContent"],
    "value": ["select#SelectValue"],
    "indicator": ["select#SelectItem"],
    "surface": [
      "select#SelectTrigger",
      "select#SelectContent",
      "select#SelectItem",
      "select#SelectValue",
      "select#SelectLabel",
      "select#SelectSeparator",
      "select#SelectScrollUpButton",
      "select#SelectScrollDownButton"
    ],
    "label": ["select#SelectLabel", "select#SelectItem"],
    "position": ["select#SelectContent", "select#SelectScrollUpButton", "select#SelectScrollDownButton"],
    "quantity": ["select#SelectItem"],
    "handoff": ["select#SelectTrigger", "select#SelectValue", "select#SelectItem"]
  }
}
```

## Capability ownership

| Capability      | Application and owner                                                                                                                                                                                                                                                                                                                                                                   | References                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: `select-content` owns popup presence; items inherit it. Independently inserted `select-trigger` owns an inline entrance unless an entering field/container already owns that cause.                                                                                                                                                                                            | default: `select.trigger.enter`, `select.content.enter`, `select.content.exit`                                                         |
| Size            | Default: one width host owns the value change, normally `select-value` with the intrinsic trigger following native layout. A fixed-width trigger needs no outer width tween; no independent trigger spring follows the value. Popup height follows Base UI's sizing authority; a measured shell owns a revision only when it does not compete with active item-alignment/scroll sizing. | default: `select.value.resize`, `select.content.resize`                                                                                |
| Surface colour  | Default: trigger, popup, option highlight and selection indicator, separator rule and scroll-button surfaces have scoped paint owners.                                                                                                                                                                                                                                                  | default: `select.surface.colour`                                                                                                       |
| Text colour     | Default: trigger/value, labels and items own selected/placeholder/disabled/highlight foreground changes.                                                                                                                                                                                                                                                                                | default: `select.surface.colour`                                                                                                       |
| Changed text    | Default for known primitive value/item labels: changed graphemes only; the selection presentation owner coordinates handoff versus diff. Render callbacks/rich labels retain explicit composed ownership.                                                                                                                                                                               | default: `select.handoff.transfer`, `select.value.replace`, `select.value.change`, `select.label.change`; composed: `@value`, `@label` |
| Changed numbers | Composed: an explicit quantity in option content may roll. Selected values, numeric labels and option keys remain identities by default.                                                                                                                                                                                                                                                | composed: `select.quantity.change`                                                                                                     |

## Choreography and modes

| Trigger / owner                                                                       | Full                                                                                                                                                                                         | Reduced                                                                 | None                                     | Binding → preset → recipe/form                                                                                                                  |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent trigger insertion / trigger                                               | Opacity entrance unless a parent already owns it; anchor geometry stays fixed.                                                                                                               | Short opacity.                                                          | Final trigger immediately.               | `select.trigger.enter` → `presence.inline` → `data.transition/opacity`                                                                          |
| Open/close / content visual owner                                                     | Anchor-relative opacity with `scale.in`; shorter opacity exit. Entry is subject to the actual-focus gate below.                                                                              | Short opacity only. Entry obeys the same focus gate.                    | Semantic open/closed target immediately. | `select.content.enter` → `presence.popup` → `popup.anchored/presence`; `select.content.exit` → `presence.exit` → `exit.fade/opacity`            |
| Eligible selection from a real visible source / selection presentation owner          | One contiguous changed safe run may travel from `select-item-text` to its measured destination. Retained target graphemes never join the flight; no per-run cascade or whole-label fallback. | No flight; changed-run local fade.                                      | Final label immediately.                 | `select.handoff.transfer` → `handoff.value` → `handoff/value`; `select.value.replace` → `text.replace` → `text.change/changed-runs`             |
| External/keyboard change without usable origin, or unsafe source mapping / same owner | Local changed-run replacement, `stagger: none`; no fabricated source and no simultaneous handoff.                                                                                            | Changed-run opacity only.                                               | Final label immediately.                 | `select.value.change` → `text.replace` → `text.change/changed-runs`                                                                             |
| New value / single width host                                                         | Measure final label width once and animate only the selected host within readable bounds; the trigger follows native layout, without a second width writer.                                  | Final geometry immediately.                                             | Final geometry immediately.              | `select.value.resize` → `geometry.compact` → `geometry.resize/measured`                                                                         |
| Option-set change / popup shell                                                       | Use clamped measured height only outside native alignment/scroll sizing; otherwise apply the native target immediately, preserving active item and scroll.                                   | Final geometry immediately.                                             | Final geometry immediately.              | `select.content.resize` → `geometry.compact` → `geometry.resize/measured`                                                                       |
| Selection marker / item indicator                                                     | Local opacity/`scale.in` feedback; state and focus are already final.                                                                                                                        | Opacity only.                                                           | Final marker immediately.                | `select.indicator.select` → `state.indicator` → `state.morph/indicator`                                                                         |
| State/token/label update / trigger, value, popup and option parts                     | Scoped surface/foreground colours; owned plain item/group labels replace changed runs with `stagger: none`. Colour eligibility and immediate-owner priority follow the rule below.           | Short colour/changed-run opacity. Colour obeys the same owner priority. | Final colours/text immediately.          | `select.surface.colour` → `state.color` → `state.color/surface-foreground`; `select.label.change` → `text.replace` → `text.change/changed-runs` |
| Anchor/alignment/collision and scroll-arrow input / native owner                      | Use Base UI placement and arrow-driven scrolling directly, including `alignItemWithTrigger`; invalidate obsolete flight coordinates.                                                         | Same placement.                                                         | Same placement.                          | `select.position.place` → `engine.native` → `native/base-ui-select` (Base UI Select positioning (no new recipe))                                |
| Explicit composed quantity / child owner                                              | Roll its changed places without treating selected values or option keys as quantities.                                                                                                       | Final number immediately.                                               | Final number immediately.                | `select.quantity.change` → `number.compact` → `number.roll/reels`                                                                               |

Colour eligibility is per actual trigger/value, popup, item, label or scroll-control region. DOM focus/focus-within or that region's own invalid state cancels its colour clock and settles all its declared paint immediately; independently owned regions may still interpolate a verified readable palette. Highlighted/selected or active-descendant state alone is not DOM focus. Text replacement, handoff and marker opacity keep their separate owners.

## Interruption and lifecycle

Origin capture and selected-value presentation are scoped to this Select instance and its accepted
selection revision. Another Select with equal option values/text, even in a portal under the same
body, cannot provide a source or consume that capture. Replacing the source owner retires an
unaccepted capture; accepted frozen paint follows its existing destination-lifetime rule rather
than being looked up again by value or selector.

Preserve Base UI's actual focus/list-navigation target when the popup opens. If that target would be hidden or displaced by the popup entrance, settle its envelope before presenting focus; default opening may therefore omit the scale/fade. A caller's supported existing focus policy is preserved, not changed to force entry. Returning focus to the trigger also makes any independent trigger-entry envelope immediately readable.

- Base UI owns selection, open state, focus, typeahead and popup alignment. Actual committed value, accessible label and form state update immediately; a controlled request is not an accepted selection. The handoff is decorative and never a duplicate selectable/accessible label.
- Eligibility requires a single visible source, exactly one contiguous changed shaping-safe run, a valid matching source range and a stable destination. Multiple changed runs, retained islands that would be swept into a flight, wrapping/formatting mismatch, rich callbacks, absent/offscreen sources or uncertain mapping use ordinary local diff. If that diff is itself unsafe or over budget, show the affected final text immediately. Never move the entire unchanged label as a fallback.
- New selection cancels the previous flight/replacement from its current presentation. Closing the popup can preserve an already captured decorative flight under its surviving owner; removing the trigger, changing mode or invalidating its destination cancels it immediately.
- Reopening never resurrects an old source or hides the final value. Live reduced retires a running flight and exposes its already-current destination immediately; it does not start another local fade for that consumed revision. A new selection committed while reduced may use its safe changed-run fade. An already-local replacement reconciles its permitted opacity under reduced without replaying entry. None/zero clock cancels flights, geometry and text clocks before paint and finishes a closing popup through Base UI's actual completion protocol. Native selection, scrolling, focus and form operation remain available. Unmount removes captures and observers.
- Async option updates in a closed popup establish its current baseline without hidden animation. A still-visible Trigger/Value keeps its independent label, width and colour owners, including async value-label revisions while the popup is closed; popup closure or its exit completion does not cancel those owners. Actual hiding, removal or closure of their enclosing boundary cancels their work. Returning to full or reopening does not replay hidden updates.

The handoff controller is hosted by SelectTrigger and captures one safe source run in SelectItem for the SelectValue destination; it is not owned by a recursively split Value subtree. The item selection marker alone uses `indicator.select`. The Trigger chevron retains its existing static orientation/opacity, and separator/scroll-button paint joins the existing surface controller without a new state animation.

A source capture is a candidate, not an accepted selection. Bind it to the actual requested item and
owner lifetime; consume it only for the matching accepted revision with still-valid source/destination
mapping. A rejected, replaced or uncorrelated delayed request cannot lend its origin to a later value
that happens to compare equal. Do not keep a request queue or infer correspondence from a time window.
Where acceptance cannot be correlated safely, use the existing local changed-run fallback. This does
not discard a later value committed by the caller or turn application request ordering into UI policy.
Native reset/restoration establishes the accepted value, width and marker baseline immediately in
full, reduced and none; no handoff origin or numeric story is inferred. Cancelled resets retain the
current accepted presentation and follow the native callback contract.

## Geometry and performance

The captured item run and trigger destination can belong to different scroll/portal spaces. Record
their mapping at the accepted revision under the [shared coordinate rule](../../animation-system.md#34-measured-size-and-position).
Native popup auto-scroll, scroll-arrow operation, ancestor scrolling or visual-viewport correction
that changes that mapping cancels the flight and reveals the already-current destination; do not
start a second local fade for the same consumed change. Closing the source popup alone still permits
the already captured flight under its surviving owner when that mapping remains valid. No per-frame
source tracking is added. Flight/retained glyph paint must not enlarge either scroll region.
Once captured, the departing paint belongs to the flight layer's recorded coordinate space, not to
the old item's live DOM. Scrolling/removing that item alone does not revoke a still-valid frozen
capture; it invalidates a candidate before acceptance, or a flight only when its actual paint-layer/
destination mapping changes. Never require a closed popup to stay mounted just to track its origin.

- Keep trigger and source anchor rectangles stable while measuring; press transforms cannot distort handoff coordinates. Base UI positioner remains the sole popup placement writer.
- Value text lays out at final natural no-wrap width in a measurement region separate from its width host; animate only that host, not glyph scale. Popup text uses final available width before its separate height host is measured. Preserve current no-wrap/truncation/wrapping policies and do not add wrapping to obtain a geometry effect.
- Clamp sizes to valid non-negative content/available constraints. With the existing clipped value lane, growth that would temporarily truncate the committed label settles immediately; shrinking cannot go below the final readable width. Fixed-width caller constraints retain their existing legal truncation policy without extra clipping. Popup focus/active descendants stay visible through existing scrolling, otherwise its affected size axis settles immediately.
- At most one decorative run flight and one value/popup measurement transaction per revision, within the aggregate changed-text budget. No per-grapheme capture, per-option observer or offscreen source search. Capture destination layout once after the committed width choice; later anchor/font/viewport changes cancel the flight instead of adding a tracking loop.
- Clip only decorative value/content lanes; preserve focus outlines, popup portals and final copyable text. Multiple values use stable item identity and local diffs, not one ambiguous global flight.

When `alignItemWithTrigger` gives Base UI active positioner/popup-height control, use that owner's immediate measured target unless a verified single-owner adapter can consume the revision. Do not animate an independent popup shell height while Base UI expands/repositions it for item alignment or scroll-arrow operation. Only a free, safely separated content axis uses `content.resize`. Native scroll-arrow interaction and its required frame/timer work remain available under reduced/none and zero recipe clock; it is not an autonomous decoration.

## Acceptance scenarios

- Pending: compare a missing origin before selection, a selection initially committed in reduced,
  and full-to-reduced during a captured flight. The first two use eligible local changed-run opacity;
  the last exposes the current destination immediately without a second fade. Change selection again
  after cancellation and verify that only the genuinely new revision receives its normal assessment.

- Pending: open two independently owned Selects with equal values and labels in separate portals.
  Accept a selection in one, replace the other and deliver its old cleanup. No cross-control origin,
  duplicate flight or cancellation is allowed; a missing valid source uses the existing local path.

- Pending: accept a visible-source selection, then scroll the popup list, a trigger ancestor or the
  document independently while its captured flight runs. Invalidate only a changed source/destination
  mapping, expose the current destination immediately, and keep native scrolling/selection intact.
  No stale flight, repeated local fade or extra scrollbar survives cancellation or close/reopen.

- Pending: capture a visible option, reject its controlled request, then commit that same value later
  from an unrelated update; no old-origin flight is allowed. Compare correlated delayed acceptance,
  closed/replaced source ownership and an accepted/cancelled reset in all modes. Exact current labels,
  native form state and callback counts survive, with local diff or immediate reset as specified.

- Pending: a safe single changed run can hand off from a real source; multiple runs and a one-character retained island choose local replacement while every retained grapheme remains still.
- Pending: keyboard/external changes, rich render callbacks, multiple values and absent/offscreen origins choose a safe local presentation without duplicate accessibility text.
- Pending: rapid selection, close/reopen, trigger removal, RTL/locale width changes, all modes, live downgrade and zero clock cancel stale flights and sizes.
- Pending: grow/shrink a clipped or fixed-width trigger, use `alignItemWithTrigger`, reject a controlled selection and move the anchor during a flight; the final label stays readable and there is exactly one width owner with reliable immediate fallback.
- Pending: Open with native list/item focus, use aligned-item scroll arrows while replacing options, then select a value; focus/scroll stay native and no independent popup-height spring competes with alignment.
- Pending: close the popup during a visible value-label update, then deliver another async label and a retired popup completion. The Trigger/Value retains its eligible current text/width transaction under the readability and focus rules, while hidden option updates establish a baseline. Removing the enclosing control cancels both scopes without later replay.
