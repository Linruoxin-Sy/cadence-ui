# Calendar motion contract

Status: functionally migrated to v2. Unit action evidence and a real-browser matrix are recorded on the
issue; production-build budgets and real-device performance governance remain deferred under
[ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

Scoped installed support: each rendered month-grid table owns one bounded `content.month` phase for opacity
and permitted signed travel, and each month shell owns one clamped block-size transaction. They share the
Calendar root's committed-change transaction, environment gate and caller-animation ceiling. Existing root
padding supplies the paint corridor; unsupported/caller-owned paths yield locally.

Calendar makes a month change readable without rebuilding the day-navigation tree. The actual DayPicker
month-grid table receives directional paint motion, the month's own size shell carries the week-row height
continuity, and selection/range colours stay attached to real date cells. Geometry remains owned by
`react-day-picker`: the month grid is never re-measured per cell and no second height writer is added to
the table.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This preserves `Calendar`,
`CalendarDayButton`, DayPicker props, custom components, formatters, locale and native caption dropdowns.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "grid": ["calendar#CalendarMonthGrid"],
    "month": ["calendar#CalendarMonth"],
    "day": ["calendar#CalendarDayButton"],
    "navigation-previous": ["calendar#CalendarPreviousButton"],
    "navigation-next": ["calendar#CalendarNextButton"],
    "caption": ["calendar#CalendarCaptionLabel"]
  },
  "regions": {
    "grid": ["calendar-month-grid"],
    "month": ["calendar-month"],
    "day": ["button"],
    "navigation-previous": ["calendar-nav-previous"],
    "navigation-next": ["calendar-nav-next"],
    "caption": ["calendar-caption-label"]
  },
  "axes": { "month": ["height"] }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                       | References                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: a changed month grid reveals its new paint through the calendar's own month-grid adapter; popup entrance belongs to an enclosing Popover and an initial SSR month is already visible.                                                                                                                | default: `calendar.grid.change`                                                                          |
| Size            | Default for a committed week-row change on a single displayed month: the month shell's own measured transaction owns its clamped block-size, while the native table owns its own row and column dimensions. Several displayed months keep immediate native height rather than one unverified aggregate shell. | default: `calendar.month.resize`                                                                         |
| Surface colour  | Default: each real day button and each real navigation button owns its scoped background and foreground for selected, range, today, hover and disabled state, with no extra selection geometry that obscures adjacent dates.                                                                                  | default: `calendar.day.colour`, `calendar.navigation-previous.colour`, `calendar.navigation-next.colour` |
| Text colour     | Default: the same three colour owners carry day, outside/disabled and navigation-state foreground; a focused or invalid owner's entire declared paint stays immediate.                                                                                                                                        | default: `calendar.day.colour`, `calendar.navigation-previous.colour`, `calendar.navigation-next.colour` |
| Changed text    | Default for the owned plain caption label where identity is safe; unchanged graphemes remain. The month-grid data transition owns replaced date-cell paint, avoiding per-cell text replay. Native dropdown captions and custom rich formatter output stay composed.                                           | default: `calendar.caption.replace`                                                                      |
| Changed numbers | Not applicable to day, week number or year labels as counters: these identify calendar positions. Dates remain formatted text; a caller-added quantitative badge owns any rolling itself.                                                                                                                     | not-applicable: `@grid`                                                                                  |

## Choreography and modes

| Trigger and owner                                           | Full                                                                                                                                                                                                                                                                        | Reduced                                                          | None                       | Binding → preset → recipe                                                                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Committed displayed month changes; actual month-grid table  | Signed `distance.sm` travel and opacity following calendar navigation direction, including RTL; unknown direction uses opacity only. No remount for animation. A focus-driven crossing that would hide or move the newly focused day commits that grid's paint immediately. | Short opacity only when it preserves immediate focus visibility. | Final grid immediately.    | `calendar.grid.change` → `content.month` → `data.transition/month-grid`                                                                                                        |
| Week-row count changes; owned month shell                   | Clamped block-size continuity from the displayed height to the new natural grid size; fixed-week layout and multi-month layouts settle immediately.                                                                                                                         | Final height immediately.                                        | Final height immediately.  | `calendar.month.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                      |
| Selection/range/today/hover state; real day/button surfaces | Eligible scoped background/foreground colour under the actual-region gate below. Semantics and roving focus change immediately.                                                                                                                                             | Eligible short colour under the same gate.                       | Final colours immediately. | `calendar.day.colour` → `state.color` → `state.color/surface-foreground`                                                                                                       |
| Navigation state; real previous/next buttons                | The same scoped background/foreground family on each navigation button, without touching action timing or the disabled `aria-disabled` contract.                                                                                                                            | Eligible short colour under the same gate.                       | Final colours immediately. | `calendar.navigation-previous.colour` → `state.color` → `state.color/surface-foreground`; `calendar.navigation-next.colour` → `state.color` → `state.color/surface-foreground` |
| Owned caption label changes                                 | Changed graphemes/runs, no stagger; native select options are not rewritten.                                                                                                                                                                                                | Short opacity on changed runs only.                              | Final text immediately.    | `calendar.caption.replace` → `text.replace` → `text.change/changed-runs`                                                                                                       |

Navigation press is not claimed: the previous/next buttons are rendered inside `react-day-picker`'s own navigation tree, so a Cadence press layer would have to wrap the library-owned button box (changing its hit, focus and anchor geometry) or duplicate the native activation feedback. The shipped navigation feedback is therefore the shared colour owner below, with native activation timing untouched. The same rule applies to any caller-replaced navigation button.

Each actual day or navigation button is a separate colour owner. Under the [shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership), DOM focus/focus-within or that owner's own invalid state cancels its colour clock and settles its entire declared paint, not just its focus ring. Other days/buttons may retain verified readable colour transitions; selected/range/hover state alone is not DOM focus. A caller `classNames.day_button`, `classNames.button_previous`/`button_next`, `styles.day_button` or `styles.button_previous`/`button_next` palette cannot be verified, so that owner commits its paint immediately in every mode. The focus ring itself stays immediate: this design owns background and foreground only.

## Interruption and lifecycle

- Rapid month/year changes replace the grid target and cancel the current WAAPI effect on the actual table, including its handle, before creating a replacement. The stable DayPicker component/focus tree and mounted month-slot identity are preserved; the whole Calendar is never keyed by displayed month, months are not queued and no numeric year reel is added. A prior completion cannot clear styles or focus belonging to the new grid.
- A month-grid clock change cancels and settles that table's paint without replay; the next month revision uses the new clock. The same applies to a caller `animate` prop, which hands the grid, the shell height and the caption to DayPicker's own stylesheet.
- Selection remains immediate in single/multiple/range modes. Range start/end, disabled/hidden dates, outside days and keyboard month crossings retain DayPicker semantics.
- Caller-supplied `components`, styles and upstream `animate` remain authoritative. If `animate` is set, or a caller replaces `Month`/`MonthGrid`/`CaptionLabel`, Cadence contributes no grid paint, height or caption replacement for that path and the native behaviour stands. One animation owner per property: a caller transform/opacity owner is never overlaid.
- A positive clock-only revision cancels/settles the current month-grid paint without replay; subsequent month changes use the new clock. This native-adapter cancellation policy is scoped to the grid paint, not to the independent caption-text or day/navigation colour owners.
- Closing an enclosing popup or unmounting disposes the month-grid paint phase, the month size shell and the colour owners. Live reduced settles grid paint and shell height under that adapter policy while permitted caption changed-run opacity and eligible colour follow their reduced contracts; none or a zero recipe clock settles all one-shot work. Reopening does not replay a past month transition.

## Geometry and performance

Measure only the rendered destination month shell, outside render, and clamp to actual content height. `react-day-picker` owns the month/day grid dimensions: the calendar never measures each month grid, each row or each date cell, and adds no height writer to the table. The month's size shell wraps the caller's own layout element, so day-cell dimensions and text do not continuously reflow during the height change. A committed month change is the only height cause; locale, font, viewport and other passive reflow settle immediately.

Several displayed months, a fixed-week layout, a caller-replaced month component, a hidden or unavailable natural box, or a focused day inside an interpolating shell all fall back to immediate native geometry for that axis. The [collection bound](../presets.md#52-shared-work-limits) counts each participating actual month-grid presentation and the participating month size shell; a translated month table is one participant, not a separate animation per date cell. Caption text and day/navigation colour keep their independent ownership and applicable budgets. No decorative duplicate grid, hidden duplicate calendar or per-cell observer participates in selection, accessibility or tab order.

## Acceptance scenarios

Executed in `tests/components/calendar.test.tsx` (unit) and `tests/e2e/calendar-motion.spec.ts` (real engine),
in full, reduced and none unless a row states otherwise:

- Navigate between different week counts, reverse direction and cross years using mouse, keyboard and native dropdowns; focus remains on the semantic day and the month table is the same element.
- Single/multiple/range selection, RTL, outside/hidden/disabled days, fixed weeks and multiple months keep one paint owner and a safe immediate fallback where an aggregate height cannot be proven.
- Custom `components`/`styles` and an external DayPicker `animate` leave exactly one owner per property, and a caller palette commits immediately.
- Standalone and popup compositions, live mode downgrade, zero clock, initial SSR, no-JS and popup closure during a month transition add no stale callback.
- Keyboard focus moving between navigation and days during colour feedback settles only the focused owner's declared paint; roving focus and selection are never delayed.
- A changed clock or mode during grid motion while an independent caption replacement and eligible day/navigation colour run cancels only the grid's own work; none/zero or parent closure clears the corresponding one-shot work without a stale grid callback touching it.

Real-browser evidence for the three modes × two OS preferences, day/navigation paint, month-grid and height
frames, light/dark and narrow/wide captures lives in the task record; first-paint, per-frame cancellation and
production-budget measurements stay deferred under ADR-023.
