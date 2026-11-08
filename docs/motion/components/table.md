# Table motion contract

Status: target design; implementation and verification pending.

Table supplies readable state feedback inside a genuine HTML table. It does not own a dataset, sorting, filtering or pagination. `Table` retains its overflow container and native table, with Header/Body/Footer/Head/Row/Cell/Caption parts; collection choreography belongs to a composition such as Data Table.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). The target adds applicable presentation defaults without inventing data APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "surface": ["table#Table"],
    "row": ["table#TableRow", "table#TableHead", "table#TableCell", "table#TableCaption", "table#TableFooter"],
    "text": ["table#TableCell", "table#TableHead", "table#TableCaption"],
    "number": ["table#TableCell"],
    "collection": ["table#Table"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                  | References                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Appearance      | Default for a later inserted whole table surface when no parent owns presence. Row insertion/removal is composed by the owner with stable row identities; the primitive cannot infer collection intent.                                                                  | default: `table.surface.enter`                      |
| Size            | Inherited/native by default: table layout owns content-driven column widths and row heights immediately. Composed for a deliberate collection-level outer geometry transaction, such as DataTable's result region; a primitive does not independently spring every cell. | inherited: `table.collection.delegate`              |
| Surface colour  | Default: the actual `table-row` hover/selected surfaces, the existing footer background, plus explicitly authored head/cell/caption surfaces. Table does not invent an expanded-row state or expansion API.                                                              | default: `table.row.colour`                         |
| Text colour     | Default for component-defined head/cell/caption state foreground; ordinary descendants inherit. No duplicated per-character colour writer.                                                                                                                               | default: `table.row.colour`                         |
| Changed text    | Default for directly owned plain Cell/Head/Caption strings. Preserve unchanged graphemes; rich cell nodes, controls and editors keep their own owners.                                                                                                                   | default: `table.text.replace`; composed: `@text`    |
| Changed numbers | Default for direct finite numeric cell content with known numeric semantics. Formatted strings require an explicit composed numeric owner; identifiers, dates and version strings stay text.                                                                             | default: `table.number.change`; composed: `@number` |

## Choreography and modes

| Trigger and owner                                                       | Full                                                                                                | Reduced                                    | None                       | Binding → preset → recipe                                                                                                                                   |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent late insertion; table-container paint                       | Short surface opacity entry; no per-row cascade.                                                    | Short opacity only.                        | Visible immediately.       | `table.surface.enter` → `presence.surface` → `enter.pop/opacity`                                                                                            |
| Hover/selected or explicitly authored surface state; actual paint owner | Eligible scoped background and defined foreground/border colour under the actual-region gate below. | Eligible short colour under the same gate. | Final colours immediately. | `table.row.colour` → `state.color` → `state.color/surface-foreground`                                                                                       |
| Direct plain cell/head/caption text change                              | Changed graphemes/runs only, without stagger or full-row replay.                                    | Short opacity on changed runs only.        | Final text immediately.    | `table.text.replace` → `text.replace` → `text.change/changed-runs`                                                                                          |
| Owned numeric cell changes                                              | Changed place-value reels only; alignment and final formatted value remain correct.                 | Final number immediately.                  | Final number immediately.  | `table.number.change` → `number.compact` → `number.roll/reels`                                                                                              |
| Composition requests row reordering/known size transition               | Delegate to that collection's single layout/geometry owner; no second primitive effect.             | Inherit immediate collection geometry.     | Immediate geometry.        | `table.collection.delegate` → `engine.native` → `native/table` (native table layout (the composition declares its own layout.move/geometry.resize binding)) |

The `row.colour` binding covers separate actual Row, Footer, Head, Cell or Caption paint regions, not one table-wide colour clock. Under the [shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership), DOM focus/focus-within or a region's own invalid state cancels its clock and settles all its declared paint. A focused cell editor therefore also gates its containing row's paint; unrelated rows/regions may retain verified colour transitions. Native selection/hover alone does not imply DOM focus.

## Interruption and lifecycle

- Rapid cell updates retain stable row/cell identity and retarget only changed content. New values are immediately authoritative for selection, accessibility and copy; outgoing glyphs are decorative and excluded from selection as well as accessibility. A virtualizer recycling a DOM cell must clear the previous logical row's transient glyph/reel state before presenting a different record.
- A composition removing/filtering a row controls semantic removal and any safe visual retention. Table never delays removal or retains interactive row controls to finish a fade.
- Caller rich children, editable content, native selections and custom table markup are not rewritten. If text diff or numeric formatting cannot be handled safely within budget, show the affected content immediately.
- Unmount cancels local content writers. Live reduced settles reels and retained-unit movement while permitted changed-run opacity and eligible colour reconcile under their reduced contracts. None or zero clock settles one-shot presentation to the effective mode's current target without changing table semantics. Positive clock edits follow each preset's capture-or-retime policy; returning to full does not replay existing rows.

## Geometry and performance

Preserve valid table markup, header associations, sticky/native layout and horizontal overflow. Do not insert div wrappers between table sections, rows and cells, change those elements to block layout, or transform an entire table merely to animate one row. Inside a cell, text/reel presentation must preserve intrinsic sizing: only the current semantic value contributes width, with outgoing visuals excluded from table sizing and selection. Native layout adopts final column widths and wraps cells once at those widths. No per-cell ResizeObserver, all-row measurement or inferred sorting. Large/virtualized compositions provide visible-row bounds and stable identities; recycled DOM is not evidence of a newly inserted logical row. Apply shared glyph/reel limits across the current update's visible cells, rather than letting each cell independently create an unbounded moving set.

## Acceptance scenarios

- Pending: change plain text and true numeric cells while hovering/selecting a row; unchanged glyphs remain still and the final copied value is exact.
- Pending: render rich controls, editors, colspan/rowspan, sticky headers and overflowing tables; valid native semantics and input behaviour survive.
- Pending: compose stable-id sorting/filtering and a virtualized consumer; the primitive does not add duplicate row movement or stale exits.
- Pending: verify all modes, live downgrade, zero clock, SSR and unmount during a cell transition.
- Pending: update a wide numeric/text cell in an auto-layout table, select/copy through a replacement, and recycle the same cell DOM for another record. Verify final column width, valid markup, correct selection text and no old record's reel state.
- Pending: focus an editor/control inside a row during row and cell colour changes, and invalidate an actual paint owner. Both affected containing owners settle their whole paint, while an unrelated row may keep eligible feedback; native focus, selection and editor content remain immediate.
