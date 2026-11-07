# Calendar motion contract

Status: target design; implementation and verification pending.

Calendar makes a month change readable without rebuilding the day-navigation tree. The actual DayPicker month-grid table receives directional paint motion; selection and range colours stay attached to real date cells. The target also supports a bounded height transition when a committed month changes the number of week rows: this is a v2 extension to the delivered baseline.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). This preserves `Calendar`, `CalendarDayButton`, DayPicker props, custom components, formatters, locale and native caption dropdowns.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "grid": ["calendar#Calendar"],
    "month": ["calendar#Calendar"],
    "day": ["calendar#Calendar", "calendar#CalendarDayButton"],
    "navigation": ["calendar#Calendar"],
    "caption": ["calendar#Calendar"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                        | References                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Appearance      | Default: a changed month grid reveals its new paint; popup entrance belongs to an enclosing Popover. Initial SSR month is already visible.                                                                                                     | default: `calendar.grid.change`                           |
| Size            | Default for a known month/week-count change: one Calendar shell owns clamped block-size. Composed if an enclosing owner explicitly coordinates that same axis; fixed-week grids need no size animation.                                        | default: `calendar.month.resize`; composed: `@month`      |
| Surface colour  | Default: selected/today/range/hover/disabled day and navigation-button surfaces, with no extra selection geometry that obscures adjacent dates.                                                                                                | default: `calendar.day.colour`                            |
| Text colour     | Default: day, outside/disabled and navigation state foreground; focus ring stays immediate.                                                                                                                                                    | default: `calendar.day.colour`                            |
| Changed text    | Default for owned plain caption/formatter labels where identity is safe; unchanged graphemes remain. The month-grid data transition owns replaced date-cell paint, avoiding per-cell text replay. Custom rich formatter output stays composed. | default: `calendar.caption.replace`; composed: `@caption` |
| Changed numbers | Not applicable to day, week number or year labels as counters: these identify calendar positions. Dates remain formatted text; a caller-added quantitative badge owns any rolling itself.                                                      | not-applicable: `@grid`; composed: `@grid`                |

## Choreography and modes

| Trigger and owner                                           | Full                                                                                                                                                                                                                                                                        | Reduced                                                          | None                       | Binding → preset → recipe                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Committed displayed month changes; actual month-grid table  | Signed `distance.sm` travel and opacity following calendar navigation direction, including RTL; unknown direction uses opacity only. No remount for animation. A focus-driven crossing that would hide or move the newly focused day commits that grid's paint immediately. | Short opacity only when it preserves immediate focus visibility. | Final grid immediately.    | `calendar.grid.change` → `content.month` → `data.transition/month-grid`   |
| Week-row count changes; owned month shell                   | Clamped height continuity to the new natural grid size; fixed-week layout remains stable.                                                                                                                                                                                   | Final height immediately.                                        | Final height immediately.  | `calendar.month.resize` → `geometry.compact` → `geometry.resize/measured` |
| Selection/range/today/hover state; real day/button surfaces | Scoped background/foreground/border colour. Semantics and roving focus change immediately.                                                                                                                                                                                  | Short colour only.                                               | Final colours immediately. | `calendar.day.colour` → `state.color` → `state.color/surface-foreground`  |
| Navigation button press                                     | Target default integration adds compact press feedback to the existing button-variant surface, without changing action timing. This is not a claim about its currently static implementation.                                                                               | Colour only.                                                     | Immediate.                 | `calendar.navigation.press` → `feedback.press` → `feedback.press/scale`   |
| Owned caption label changes                                 | Changed graphemes/runs, no stagger; native select options are not rewritten.                                                                                                                                                                                                | Short opacity on changed runs only.                              | Final text immediately.    | `calendar.caption.replace` → `text.replace` → `text.change/changed-runs`  |

## Interruption and lifecycle

- Rapid month/year changes replace the grid target and cancel the current WAAPI effect on the actual table, including its handle, before creating a replacement. Preserve the stable DayPicker component/focus tree and mounted month-slot identity; do not key the whole Calendar by displayed month, queue months, or animate a numeric year reel. A prior completion cannot clear styles or focus belonging to the new grid.
- Selection remains immediate in single/multiple/range modes. Range start/end, disabled/hidden dates, outside days and keyboard month crossings retain DayPicker semantics.
- Caller-supplied `components`, styles and upstream `animate` remain authoritative. Use one animation owner per grid property: if caller transform/opacity or an explicit DayPicker animation owns it, Cadence does not overlay that property. The composed owner must still implement reduced/none and live cancellation; forwarding `animate` does not exempt a second CSS animation from modes. An opacity-only fallback is allowed only if opacity is unowned; otherwise use the final paint directly.
- A positive clock-only revision also cancels/settles the current month-grid paint without replay; subsequent month changes use the new clock. Closing an enclosing popup cancels subordinate grid/size motion. Unmount, live reduced/none and zero clock settle current month and geometry before paint; reopening does not replay a past month transition.

## Geometry and performance

Measure only the rendered destination month shell(s), outside render, and clamp to actual content/available height. Multiple displayed months use one outer height transaction: measure the real destination row/column arrangement, including captions, navigation and gaps, rather than summing heights for horizontally arranged months or springing the root after each inner shell. Reused date cells retain the primitive's month-slot/date identity, including repeated outside dates in different months. Preserve native table structure, grid hit regions and row order; no decorative duplicate grid participates in selection, accessibility or tab order. Clip only decorative travel, and skip that travel where the focused day would be obscured. Locale/font/viewport changes without a month-navigation cause settle layout immediately. Respect fixedWeeks, numberOfMonths and custom components; only visible affected grids animate, and oversized month collections use immediate paint/geometry under the shared collection bounds.

Lay the new natural grid at destination inline-size before measuring. The separate month/collection shell animates block-size around it; day-cell dimensions and text do not continuously reflow during that height change. An enclosing Popover and Calendar must choose one host for the same committed height cause.

## Acceptance scenarios

- Pending: navigate rapidly between different week counts, reverse direction and cross years using mouse, keyboard and native dropdowns; focus remains on the semantic day.
- Pending: test single/multiple/range selection, RTL, outside/hidden/disabled days, fixed weeks and multiple months.
- Pending: supply custom styles/components and external DayPicker animation; verify exactly one paint owner and safe immediate fallback.
- Pending: verify standalone/popup compositions, all modes, live downgrade, zero clock, initial SSR and popup closure during a month transition.
- Pending: navigate with keyboard across month boundaries while a height transition runs; use several months in a row and a stacked responsive layout with unequal week counts. Check focused-day visibility, aggregate max-versus-sum height, no duplicate date controls and cancellation of caller-owned animation paths.
