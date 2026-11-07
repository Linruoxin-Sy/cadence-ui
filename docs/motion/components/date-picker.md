# Date Picker motion contract

Status: target design; implementation and verification pending.

The actual block is `DatePickerDemo`: a Button trigger, Popover and Calendar composition for a single date or range. Its distinctive motion is the selected date label changing in place while selection remains open. It introduces no automatic close rule, validation, parsing workflow or new date input API.

Use the [shared contract](../README.md), [presets](../presets.md) and [Calendar contract](calendar.md). Preserve current controlled-value detection, callbacks, formatter/locale configuration and trigger/content overrides.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "trigger": ["date-picker#DatePickerDemo", "button#Button"],
    "popup": ["popover#PopoverContent"],
    "label": ["date-picker#DatePickerDemo"],
    "calendar": ["calendar#Calendar"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                                                                        | References                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Appearance      | Inherited: Popover owns open/close and Calendar owns later month changes. The outer `date-picker` div adds no duplicate entrance.                                                                                                                                                                                                                              | inherited: `date-picker.popup.enter`, `date-picker.popup.exit`, `date-picker.calendar.change`                |
| Size            | Default for the owned trigger's formatted-label change through one Button geometry owner. Inherited by default from one Popover surface host for Calendar month/range-size changes: Calendar supplies natural destination geometry and does not run a second height spring for that cause. Caller replacement of either host is an explicit composed boundary. | default: `date-picker.trigger.resize`; inherited: `date-picker.popup.resize`; composed: `@trigger`, `@popup` |
| Surface colour  | Inherited from Button, Popover and Calendar; no additional block-level state surface.                                                                                                                                                                                                                                                                          | inherited: `date-picker.trigger.colour`                                                                      |
| Text colour     | Default for placeholder-to-selected foreground on the trigger; other colours inherit the composed parts.                                                                                                                                                                                                                                                       | default: `date-picker.trigger.colour`                                                                        |
| Changed text    | Default: the owned formatted date/range string diffs graphemes, retaining unchanged portions. Label/placeholder strings have the same safe text contract. Native caption dropdowns and rich caller overrides stay untouched.                                                                                                                                   | default: `date-picker.label.replace`; composed: `@label`                                                     |
| Changed numbers | Not applicable to the digits in formatted dates/ranges: they represent date labels, not scalar measurements. A composed quantitative accessory would own its separate number animation.                                                                                                                                                                        | not-applicable: `@trigger`                                                                                   |

## Choreography and modes

| Trigger and owner                                        | Full                                                                                                            | Reduced                                                               | None                               | Binding → preset → recipe                                                                                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Trigger press                                            | Inherit Button press and semantic activation immediately.                                                       | Colour only.                                                          | Immediate.                         | `date-picker.trigger.press` → `feedback.press` → `feedback.press/scale`                                                                                      |
| Popover open/close                                       | Anchored surface entry/exit; Calendar does not repeat that same-cause entrance.                                 | Short opacity only.                                                   | Immediate visibility.              | `date-picker.popup.enter` → `presence.popup` → `popup.anchored/presence`; `date-picker.popup.exit` → `presence.exit` → `exit.fade/opacity`                   |
| Selected value/placeholder/locale changes; trigger label | Changed graphemes/runs only, without stagger. The new accessible label is immediate.                            | Short opacity on changed runs only.                                   | Final label immediately.           | `date-picker.label.replace` → `text.replace` → `text.change/changed-runs`                                                                                    |
| Owned label changes trigger width                        | One clamped inline-size transition respecting caller width and truncation. Fixed-width triggers need no resize. | Destination width immediately.                                        | Destination width immediately.     | `date-picker.trigger.resize` → `geometry.compact` → `geometry.resize/measured`                                                                               |
| Empty/selected/disabled/hover state; trigger             | Inherit/scoped Button surface and placeholder foreground colour, with one writer.                               | Short colour.                                                         | Final colours immediately.         | `date-picker.trigger.colour` → `state.color` → `state.color/surface-foreground`                                                                              |
| Displayed month/week-count changes                       | Inherit Calendar's month-grid paint; its natural destination feeds the single bounded Popover height host.      | Grid opacity only when focus stays visible; final height immediately. | Immediate Calendar/Popover target. | `date-picker.calendar.change` → `content.month` → `data.transition/month-grid`; `date-picker.popup.resize` → `geometry.compact` → `geometry.resize/measured` |

## Interruption and lifecycle

- Rapid selections/deselections or incomplete range updates replace only the changing label parts. Selection stays open as in the actual block; callbacks never wait for label or popup animation.
- Preserve present-but-undefined controlled values, locale/time-zone configuration and caller open state. An external value update does not key/remount the Calendar or override the caller/DayPicker navigation policy. Plain formatted-label integration is the trigger's sole text owner; Button does not apply another diff to the same label. Fixed date fragments do not roll as counters.
- Closing/reopening Popover uses its existing lifecycle and latest value. Closing during a month/label change cancels subordinate hidden work; no old value or stale range is replayed on reopen.
- Unmount, live reduced/none and zero clock cancel all owned/inherited writers and establish the final label, width and popup state. Returning to full does not replay current selection.

## Geometry and performance

Measure the owned label only when its known value changes and the trigger actually owns intrinsic inline-size. Preserve `max-w-full`, truncation and caller styles; do not force width to the full untruncated string. Button feedback uses its internal visual layer, preserving the actual Popover anchor geometry. Popover placement and collision coordinates remain Base UI-owned. Calendar's natural destination height feeds the default Popover geometry.compact host; the Calendar shell takes its destination directly for that transaction. A caller's custom content can explicitly delegate back to Calendar with the Popover size writer disabled for that cause, but cannot leave both active. Range mode measures the actual multi-month arrangement and keeps available-height scrolling; no per-day size observers.

Measure the natural trigger-label region separately from the Button's size host, at destination constrained inline-size. Keep the label's destination layout/truncation stable while the shell changes width; do not repeatedly wrap text or scale glyphs. Calendar applies its own destination-width grid layout before an owned height transition.

## Acceptance scenarios

- Pending: select, clear and rapidly replace single/range values, including a partial range and controlled undefined; only changed label graphemes move and selection stays open.
- Pending: change locale/placeholder, constrain trigger width and pass caller trigger/content overrides; formatting, truncation and placement remain correct.
- Pending: close/reopen during month navigation or a label change and update the value externally while open; focus and Calendar identity remain stable.
- Pending: verify inherited and owned behaviour in all modes, live downgrade, zero clock, SSR and unmount.
- Pending: change range month geometry while label width and anchored placement also change; use a custom Calendar/Popover host and disable the matching default owner. Confirm one diff owner, one popup-height owner, stable trigger hit geometry and immediately visible keyboard focus.
