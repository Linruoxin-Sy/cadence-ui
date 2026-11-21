# Table motion contract

Status: functionally migrated to v2. Unit action evidence and a real-browser matrix are recorded on the
issue; production-build budgets and real-device performance governance remain deferred under
[ADR-023](../adr.md#adr-023--effects-first-migration-performance-governance-afterwards).

Table supplies readable state feedback inside a genuine HTML table. It does not own a dataset, sorting,
filtering or pagination. `Table` retains its overflow container and native table, with
Header/Body/Footer/Head/Row/Cell/Caption parts; collection choreography belongs to a composition such as
Data Table.

Use the [shared contract](../README.md) and [preset definitions](../presets.md). The shipped defaults add
applicable presentation without inventing data APIs.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "v2",
  "parts": {
    "surface": ["table#Table"],
    "row": ["table#TableRow", "table#TableFooter"],
    "identity": ["table#TableHead"],
    "collection": ["table#Table"]
  },
  "regions": {
    "surface": ["table-container"],
    "row": ["table-row", "table-footer"],
    "identity": ["table-head"],
    "collection": ["table"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                             | References                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Appearance      | Default for a later inserted whole table surface when no parent owns presence. Row insertion/removal is composed by the owner with stable row identities; the primitive cannot infer collection intent.                                                                             | default: `table.surface.enter`         |
| Size            | Inherited/native by default: table layout owns content-driven column widths and row heights immediately. Composed for a deliberate collection-level outer geometry transaction, such as DataTable's result region; a primitive does not independently spring every cell.            | inherited: `table.collection.delegate` |
| Surface colour  | Default: the actual `table-row` hover/expanded/selected surface and foreground, plus the existing footer background and rule. Head, Cell and Caption keep their authored static paint and start no per-cell colour owner, so a large table gains no per-cell clock.                 | default: `table.row.colour`            |
| Text colour     | Default for the row's own foreground, which the footer and its cells inherit; head/cell/caption title and muted classes stay component-fixed. No duplicated per-character colour writer.                                                                                            | default: `table.row.colour`            |
| Changed text    | Not applicable. A cell is a native readout, not a staged display: the shared text runtime needs a painted, provable surface plus a per-cell controller, and the shipped cell keeps the caller's own nodes so selection, editing, copy and rich children stay untouched.             | not-applicable: `@identity`            |
| Changed numbers | Not applicable. A quantity in a cell is an exact formatted value the caller owns; reels would need the same per-cell controller and identity host, and column titles and identifiers must stay exact text. Compositions that present an animated count own that display themselves. | not-applicable: `@identity`            |

## Choreography and modes

| Trigger and owner                                                       | Full                                                                                    | Reduced                                    | None                       | Binding → preset → recipe                                                                                                                                   |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Independent late insertion; table-container paint                       | Short surface opacity entry; no per-row cascade.                                        | Short opacity only.                        | Visible immediately.       | `table.surface.enter` → `presence.surface` → `enter.pop/opacity`                                                                                            |
| Hover/selected or explicitly authored surface state; actual paint owner | Eligible scoped background and foreground colour under the actual-region gate below.    | Eligible short colour under the same gate. | Final colours immediately. | `table.row.colour` → `state.color` → `state.color/surface-foreground`                                                                                       |
| Composition requests row reordering/known size transition               | Delegate to that collection's single layout/geometry owner; no second primitive effect. | Inherit immediate collection geometry.     | Immediate geometry.        | `table.collection.delegate` → `engine.native` → `native/table` (native table layout (the composition declares its own layout.move/geometry.resize binding)) |

The `row.colour` binding covers the actual Row surface/foreground and the Footer's existing background,
foreground and top rule — separate physical regions, never one table-wide colour clock. A caller-painted
row or footer (`className`/`style` colour, background, shadow or filter) commits its paint immediately
instead of passing through an unverified intermediate. Under the
[shared owner precedence](../presets.md#31-effective-modes-and-clock-ownership), DOM focus/focus-within
inside that row or footer cancels its clock and settles all its declared paint; unrelated rows/regions may
retain verified colour transitions. Native selection/hover alone does not imply DOM focus.

Head, Cell and Caption are the caller's native display slots. A string, number, rich node, control or
editor there keeps its exact existing representation in every mode, and no cell-level text or number
controller is allocated, so a changed value commits immediately and the table never grows one observer or
one clock per cell.

## Interruption and lifecycle

- The [native editing boundary](../../animation-system.md#36-changed-text) is untouched: because cells
  render the caller's own content, editability inherited from a row/table/ancestor keeps the actual
  editing tree, selection and undo ownership in full, reduced and none. Table never splits an editor.

- Rapid cell updates retain stable row/cell identity because the cell content is the caller's; new values
  are immediately authoritative for selection, accessibility and copy, and no outgoing glyph state exists
  to clear when a virtualizer recycles a DOM cell.
- A composition removing/filtering a row controls semantic removal and any safe visual retention. Table
  never delays removal or retains interactive row controls to finish a fade.
- Caller rich children, editable content, native selections and custom table markup are not rewritten.
- Unmount cancels the surface envelope. Live reduced settles the surface entry and keeps eligible colour
  feedback; none or a zero clock settles one-shot presentation to the effective mode's current target
  without changing table semantics. Returning to full does not replay existing rows.

## Geometry and performance

Preserve valid table markup, header associations, sticky/native layout and horizontal overflow. Do not
insert div wrappers between table sections, rows and cells, change those elements to block layout, or
transform an entire table merely to animate one row. Native layout owns final column widths and row
heights immediately, so a value change never resizes a column twice. No per-cell ResizeObserver, all-row
measurement or inferred sorting. Large/virtualized compositions provide visible-row bounds and stable
identities; recycled DOM is not evidence of a newly inserted logical row.

## Acceptance scenarios

Executed in `tests/components/table.test.tsx`, in full, reduced and none, unless a row states otherwise:

- A later-inserted table fades in once as a surface; a table already on screen at first paint does not.
- A row hover/selection paint runs one scoped colour owner; a caller-painted row commits immediately.
- Inherent editing from a table/ancestor, rich controls, colspan/rowspan and overflowing tables: valid
  native semantics, keyboard path and input behaviour survive in all modes.
- Stable-id sorting/filtering and a virtualized composition: the primitive adds no duplicate row movement
  or stale exits.
- All modes, live downgrade, zero clock, SSR and unmount during the surface entry.
- A focused editor/control inside a row during row colour changes, and an invalidated actual paint owner:
  the affected containing owner settles its whole paint while an unrelated row may keep eligible feedback;
  native focus, selection and editor content remain immediate.

Real-browser evidence for the three modes × two OS preferences, the settled native table, row paint
frames, focus/selection, light/dark and narrow/wide captures lives in the task record; first-paint,
per-frame cancellation and production-budget measurements stay deferred under ADR-023.
