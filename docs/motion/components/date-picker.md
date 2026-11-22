# Date Picker motion contract

Status: functionally migrated to v2 as a composition. Unit action evidence is recorded in
`tests/components/date-picker.test.tsx`, and the three-mode × two-preference browser matrix with light/dark
and narrow/wide captures runs in `tests/e2e/date-picker.spec.ts`. A production build was verified locally;
performance governance remains deferred under
[ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

The actual block is `DatePickerDemo`: a Button trigger, Popover and Calendar composition for a single date or
a range. Every animated property in that tree belongs to the dependency that renders the physical host —
Button owns the trigger's measured size and paint, Popover owns the panel's presence, size and
surface, Calendar owns the month-grid paint, the month shell height and the day/navigation paint. The block
therefore declares inherited ownership instead of duplicating a second writer, and its own contribution is the
composition: one retained Calendar, one retained label host and no selection-keyed remount.

It introduces no automatic close rule, validation, parsing workflow or new date input API. The formatted
trigger label is a native swap on a retained host, so this block claims no text or number writer of its own.

Use the [shared contract](../README.md), [presets](../presets.md), the [Button](button.md),
[Popover](popover.md) and [Calendar](calendar.md) contracts. Preserve current controlled-value detection,
callbacks, formatter/locale configuration and trigger/content overrides.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "trigger": ["button#Button"],
    "popup": ["popover#PopoverContent"],
    "navigation": ["calendar#CalendarPreviousButton"],
    "month": ["calendar#CalendarMonth"],
    "grid": ["calendar#CalendarMonthGrid"],
    "label": ["date-picker#DatePickerDemo"]
  },
  "regions": {
    "trigger": ["popover-trigger"],
    "popup": ["popover-content"],
    "navigation": ["calendar-nav-previous"],
    "month": ["calendar-month"],
    "grid": ["calendar-month-grid"],
    "label": ["date-picker-label"]
  },
  "axes": { "trigger": ["width", "height"], "popup": ["width", "height"], "month": ["height"] }
}
```

The block's own file supplies exactly one physical host of its own, the labelled span inside the trigger
(`date-picker-label`); every other part is the dependency export that actually owns that property, so each
binding resolves to the dependency's own physical region rather than a block-level shadow. The trigger is
one physical element that both installed exports render: Popover's trigger slot wins on the composed button
(`popover-trigger`), while Button remains the export that registers the measured box and the paint clock, so
the trigger region names the composed slot rather than Button's own `button` slot.

The trigger declares no press action of its own. Button renders its independent press layer only for a known
plain label (`plain && !render && !disabled` in `button/index.tsx`); this trigger's children are an icon,
an `sr-only` prefix and the label span, so Button renders those children directly and creates no
`button-feedback` host at all. Activation therefore stays native and immediate here, and a declared press
recipe would have no executable owner in this composition.

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                                                                              | References                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Appearance      | Inherited: the Popover panel owns anchored entry, and each Calendar month-grid table owns the later month-change paint. The outer `date-picker` div adds no duplicate entrance and no second grid paint.                                                                                                                                                             | inherited: `date-picker.popup.enter`, `date-picker.grid.change`                                      |
| Size            | Inherited: Button owns the trigger's measured inline box when the formatted label changes, Popover owns the panel's natural width/height, and Calendar's month shell owns the week-row height. The block adds no wrapper, no second spring and no per-month observer.                                                                                                | inherited: `date-picker.trigger.resize`, `date-picker.popup.resize`, `date-picker.month.resize`      |
| Surface colour  | Inherited: the trigger surface stays Button's, the panel surface stays Popover's, and Calendar owns day and navigation state paint per real cell/button. The block writes no extra background or border.                                                                                                                                                             | inherited: `date-picker.trigger.colour`, `date-picker.popup.colour`, `date-picker.navigation.colour` |
| Text colour     | Inherited: Button owns the trigger foreground, including the placeholder-to-selected `data-empty` swap, which arrives as a caller class and therefore commits immediately in every mode; Calendar owns each navigation/day foreground. There is no block-level colour writer.                                                                                        | inherited: `date-picker.trigger.colour`, `date-picker.navigation.colour`                             |
| Changed text    | Not applicable to this block: the formatted value lives inside the Button's rich trigger content, so Button's plain-label adapter never renders for it, and a local adapter would become a second text owner in the same installed closure without an executable Button counterpart. The retained label span swaps its whole string natively at the semantic target. | not-applicable: `@label`                                                                             |
| Changed numbers | Not applicable: the digits in a formatted date or range identify a date, not a scalar quantity. A caller's own quantitative accessory keeps its separate owner; the block parses and rolls nothing.                                                                                                                                                                  | not-applicable: `@label`                                                                             |

`date-picker.navigation.colour` is the single-instance navigation surface of the retained Calendar; the
per-day surfaces and the second navigation button stay each real cell's own Calendar owner, which is why the
block cites the region it can bind one-to-one rather than a shared aggregate.

## Choreography and modes

| Trigger and owner                              | Full                                                                                                                                                                                      | Reduced                                                           | None                            | Binding → preset → recipe/form                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| Formatted label change; trigger box            | Button's clamped measured inline-size transition at its destination width.                                                                                                                | Destination width immediately.                                    | Destination width immediately.  | `date-picker.trigger.resize` → `geometry.compact` → `geometry.resize/measured`     |
| Calendar month or range content; Popover panel | Popover's measured natural width/height transition inside its available constraints.                                                                                                      | Final geometry immediately.                                       | Final geometry immediately.     | `date-picker.popup.resize` → `geometry.compact` → `geometry.resize/measured`       |
| Week-row count change; Calendar month shell    | Calendar's clamped block-size continuity for the single displayed month.                                                                                                                  | Final height immediately.                                         | Final height immediately.       | `date-picker.month.resize` → `geometry.compact` → `geometry.resize/measured`       |
| Empty/selected/disabled/hover state; trigger   | Button's eligible surface and foreground clock, one writer, under its actual-owner gate.                                                                                                  | Eligible short colour under the same gate.                        | Final colours immediately.      | `date-picker.trigger.colour` → `state.color` → `state.color/surface-foreground`    |
| Panel semantic paint changes                   | Popover's scoped surface transition on the panel shell, once.                                                                                                                             | Eligible short colour under the same gate.                        | Final colours immediately.      | `date-picker.popup.colour` → `state.color` → `state.color/surface`                 |
| Calendar selection/navigation paint            | Calendar's own scoped colour owner on the real navigation button, settled immediately while it holds focus.                                                                               | Eligible short colour under the same gate.                        | Final colours immediately.      | `date-picker.navigation.colour` → `state.color` → `state.color/surface-foreground` |
| Popover opens                                  | Popover's anchored presence, which settles the entry at its resting paint here: the composed Calendar autofocuses a day inside the panel and a focused surface is never faded or delayed. | Short opacity only, and it also settles when the day holds focus. | Final open surface immediately. | `date-picker.popup.enter` → `presence.popup` → `popup.anchored/presence`           |
| Displayed month changes                        | Calendar's month-grid paint travels and fades once focus has left the grid; a change that keeps keyboard focus inside the table settles natively.                                         | Grid opacity only after focus leaves the grid.                    | Immediate Calendar target.      | `date-picker.grid.change` → `content.month` → `data.transition/month-grid`         |

One inherited boundary applies to both appearance rows, and the browser matrix measures it: Calendar's
`autoFocus` puts a real day inside the panel and inside the month table. `createAnchoredPresence` and
`createContentTransition` both refuse to animate a surface that already contains focus, because a focused
surface must be readable at the semantic target. The popover therefore appears settled, and a keyboard-driven
month change paints natively; a mouse-driven change, which moves focus to the navigation button, travels and
fades. Neither branch is a second writer, and no mode suppresses a property the block does not own.

### Measured in the shipped composition

The site demo is the measured subject: single-month Calendar, its own caller paint classes, and a label that
is already formatted. Browser samples live in `tests/e2e/date-picker.spec.ts`; the mode × preference × scheme
× width captures and the frame samples below were taken from `next start` on the production build.

- `date-picker.popup.enter` — settled: 60 frames with `opacity: 1`, `transform: none` and
  `data-cadence-entry-settled` on the panel, because Calendar autofocuses a day inside it and the anchored
  presence never delays a focused surface.
- `date-picker.grid.change` — native while keyboard focus stays in the table; a mouse-driven change records
  16 distinct opacity and transform values, `matrix(1,0,0,1,8,0)` arriving at identity.
- `date-picker.month.resize` — a live ramp `267.19 → 307.19` across a week-row change.
- `date-picker.navigation.colour` — `0.16s` on `background-color, color`.
- `date-picker.trigger.colour` — immediate in the demo, because its `data-empty` caller class owns that
  fragment and Button yields a caller colour family.
- `date-picker.popup.colour` — immediate in the demo, because the caller palette is not verifiable and
  Popover keeps its paint native.
- `date-picker.trigger.resize` and `date-picker.popup.resize` — not exercised by this demo: its label text and
  single-month panel keep their natural size, while both owners still execute for a caller whose label or
  month count changes.

Those settled or immediate rows are inherited boundaries, not missing owners: the executors run, and the
composition supplies a focused surface, a caller palette or an unchanged natural size.

The popup's retained exit stays Popover's own installed form and is not re-declared here: the block mounts no
Button that is removed, so a block-scoped exit claim could not certify the Button inline-exit owner that the
same installation closure also reaches. Popover remains the exit owner for this composition.

## Interruption and lifecycle

- The block keeps one mouse/keyboard semantic path: selection stays open exactly as the pinned demo does, and
  callbacks never wait for a label or popup animation. Rapid selections, deselections and incomplete range
  updates only replace the label string on the retained span; no popup or Calendar remount is keyed by value.
- Preserve present-but-undefined controlled values, locale/time-zone configuration and caller `open` state.
  An external value update changes the label and the Calendar selection without overriding the caller or
  DayPicker navigation policy, and does not restart the panel entrance.
- Closing and reopening Popover uses its existing lifecycle and the latest value. Closing cancels the panel's
  Calendar/content geometry and its hidden decoration; reopening invalidates old popup completions. The
  retained visible Button trigger keeps its own size/paint owners through popup close, subject to native
  return-focus and readability gates, and no old value or stale range is replayed on reopen.
- Unmount cancels every inherited writer with its owning component. Live reduced settles trigger/popup/month
  geometry and grid travel, while permitted presence opacity and eligible colour reconcile under their
  reduced contracts. None or a zero recipe clock settles one-shot work to the effective mode's current label,
  width and popup state through the existing primitive lifecycle. Returning to full does not replay the
  current selection.
- A caller that replaces the trigger render target or the Calendar content replaces the matching owner; the
  block never keeps a second writer alive beside it. Passive `contentProps` layout changes settle native
  geometry immediately and are not calendar revisions.

## Geometry and performance

The trigger measures its own natural inline box at the destination label width; the label keeps `truncate`
and `max-w-full`, so the shell never forces the full untruncated string and does not re-wrap per frame.
Button feedback stays on its internal visual layer, preserving the real Popover anchor box. Popover placement
and collision coordinates remain Base UI-owned, and the existing `max-h-(--available-height)`,
`max-w-(--available-width)` and `overflow-auto` constraints stay authoritative: animation adds no clipping
policy and no scrollbar, and an infeasible readable size falls back to immediate native layout.

The month shell measures only the rendered destination month; `react-day-picker` keeps the day-grid
dimensions, and a multi-month range or fixed-week layout settles immediately rather than aggregating one
unverified shell. The block registers no resize observer of its own and observes no interpolated child box.

## Acceptance scenarios

Executed in `tests/components/date-picker.test.tsx` in full, reduced and none unless a row states otherwise:

- Open the popover, select, clear and rapidly replace single and range values, including a partial range and a
  controlled `undefined`; the Calendar and label hosts stay the same elements and selection stays open.
- Navigate months while open across a week-count change; the month table and month shell keep their identity,
  and a reversed navigation cancels the obsolete grid paint instead of queueing it.
- Change locale/placeholder, constrain the trigger width and pass caller trigger/content overrides; formatting,
  truncation and placement remain correct and only one owner per property stays alive.
- Close and reopen during month navigation or a label change, and update the value externally while open;
  focus and Calendar identity remain stable and no stale completion is replayed.
- Switch mode live, evaluate a zero clock, initial SSR/no-JS and unmount; no presentation backlog survives and
  returning to full does not replay the current value.
- Move native focus from the trigger into a day and back while placeholder, panel and navigation colours
  change; each focused-containing owner settles its own declared paint and independent owners keep eligible
  feedback.

A real-browser matrix across the three modes and both OS preferences, light/dark and narrow/wide captures,
remains outstanding in the task record; performance governance is deferred under ADR-023.
