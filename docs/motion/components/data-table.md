# Data Table motion contract

Status: runtime implemented for the committed payment collection; the strict v2 action plan stays blocked and
the migration marker remains `legacy` until it can anchor these hosts. Browser and performance evidence live in the
task's `.cache/data-table/` record.

The registry block exports `DataTableDemo`, `Payment` and `columns`: an editable payments composition, not a new generic
table engine. Its motion explains changes to the committed visible payments while Button, Checkbox, Input, Dropdown
Menu and Table keep their own presentation contracts. TanStack owns sorting, filtering, selection, visibility and
pagination semantics.

Use the [shared contract](../README.md), [presets](../presets.md) and [Table contract](table.md). Bindings describe the
actual composition; Table remains the owner of column width, row height and wrapping, so this block adds no second
row-geometry writer.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "table": ["table#Table", "table#TableRow", "table#TableCell", "table#TableHead"],
    "rows": ["data-table#DataTableDemo"],
    "row": ["data-table#DataTableDemo"],
    "region": ["data-table#DataTableDemo"],
    "cell": ["data-table#DataTableDemo"],
    "value": ["data-table#DataTableDemo"],
    "button": ["button#Button"],
    "checkbox": ["checkbox#Checkbox"],
    "input": ["input#Input"],
    "menu": ["dropdown-menu#DropdownMenuContent"]
  },
  "regions": {
    "rows": ["table-row"],
    "row": ["table-row"],
    "region": ["data-table-region"],
    "cell": ["data-table-status", "data-table-email"],
    "value": ["data-table-amount", "data-table-count"]
  },
  "axes": {
    "region": ["height"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                                                          | References                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Appearance      | Default: a genuinely inserted visible payment row takes one compact opacity entrance on its own retained `tr`; retained rows move from their previous committed boxes under the separate Size/position binding. Rows already present at first paint and rows revisited by pagination take no entrance, and removal is immediate. | default: `data-table.row.enter`; inherited: `data-table.menu.enter`, `data-table.menu.exit`, `@table` |
| Size            | Default: the bounded frame around the native table owns one measured block-size transition for a committed shrink. Growth, a focused control, an active pointer capture and `reduced`/`none` resolve to native layout immediately, and Table keeps row height, column width and wrapping.                                        | default: `data-table.region.resize`                                                                   |
| Surface colour  | Inherited: TableRow selection/hover, Button, Checkbox, filter Input and menu states; the block layers no second row or control background writer, and the declared recipes stop colour exactly like geometry under `none`.                                                                                                       | inherited: `@table`, `@button`, `@checkbox`, `@input`, `@menu`                                        |
| Text colour     | Inherited from those parts, including Button and filter Input foreground; owned status/email content keeps the cell's semantic foreground and never gains a second colour writer.                                                                                                                                                | inherited: `@table`, `@button`, `@checkbox`, `@input`, `@menu`                                        |
| Changed text    | Default: owned status and email strings replace only their changed graphemes on the retained cell host; native filter-input editing stays immediate and outside cell replacement, and the empty-state copy is a fresh mount rather than a text owner.                                                                            | default: `data-table.cell.replace`; not-applicable: `@input`                                          |
| Changed numbers | Default: known payment amounts and a known selection count roll place-value reels with the existing `Intl` currency formatter and the same digit identity; the filter-derived result total and any query-derived count resolve directly, and the native filter input never gains reels.                                          | default: `data-table.value.change`; not-applicable: `@input`                                          |

## Choreography and modes

| Trigger and owner                                                       | Full                                                                                                                                                                   | Reduced                                            | None                         | Binding → preset → recipe                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sorting, filtering, visibility toggle or a data revision; retained rows | Surviving visible payments move from their previous committed boxes to the committed native boxes by one local `transform`; no page replacement supplies a source box. | Final positions immediately.                       | Final positions immediately. | `data-table.rows.reorder` → `layout.compact` → `layout.move/position`                                                                                                                                                                                                                    |
| A genuinely inserted visible payment row; its own `tr`                  | One compact opacity entrance, no travel and no stagger; rows visible at first paint or revisited by pagination are not new records.                                    | Opacity only where the row is genuinely new.       | Final result immediately.    | `data-table.row.enter` → `presence.inline` → `data.transition/opacity`                                                                                                                                                                                                                   |
| A committed shrink of the bounded frame; region host                    | One measured frame `height` transition, clamped to the natural destination; growth settles immediately so required rows are never clipped.                             | Final frame height immediately.                    | Final geometry immediately.  | `data-table.region.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                                                                                             |
| Owned status/email string changes; cell host                            | Changed runs only without stagger, preserving the cell and row identity and the native editing path.                                                                   | Changed-run opacity only.                          | Final text immediately.      | `data-table.cell.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                                  |
| A known independent amount or selection count; value host               | Place-value reels of the changed digits with the existing formatter; filter-derived totals stay immediate.                                                             | Final value immediately.                           | Final value immediately.     | `data-table.value.change` → `number.compact` → `number.roll/reels`                                                                                                                                                                                                                       |
| Button, Checkbox or menu interaction; inherited control parts           | Inherit the actual control's press, indicator and popup motion without replaying the block.                                                                            | Colour/opacity only; indicators at final geometry. | All immediate.               | `data-table.button.press` → `feedback.press` → `feedback.press/scale`; `data-table.checkbox.change` → `state.indicator` → `state.morph/indicator`; `data-table.menu.enter` → `presence.menu` → `popup.anchored/presence`; `data-table.menu.exit` → `presence.exit` → `exit.fade/opacity` |

The filter [Input](input.md), [Button](button.md), [Checkbox](checkbox.md) and [Dropdown Menu](dropdown-menu.md)
controls keep their own colour owners and focus/invalid precedence; those inherited regions sit outside the Table/cell
paint and display controllers. Input's value, placeholder and native editing remain governed by Input's contract, not
by `cell.replace` or `value.change`. These references identify existing owners and add no block-level executor.

## Interruption and lifecycle

Only a committed change animates. `tableChange` classifies one commit as pagination, sorting, filtering, visibility,
data or nothing at commit time, and the composition stores that revision on its own motion transaction before the
destination paint is measured. Drafting inside the filter, pointer capture, native cell selection and any native editing
stay immediate.

The numeric owner distinguishes a payment-data or discrete selection revision from a filtered result. A committed
query/filter revision makes its derived result totals immediate in all modes and cancels an older reel. Unknown
correspondence takes the immediate fallback. A known independent amount or selection count may still roll while the
filter input is focused, because focus is not the cause classifier. If both filtering and selection affect one count in
one commit, that count takes the immediate filter path while a separate independent amount still rolls. Amount cells
that newly appear on a page start at their exact formatted baseline, and unchanged amounts do not replay because the
result membership changed.

- Commit controlled/uncontrolled TanStack updates, filter results, selection counts and pagination immediately.
  Animation cannot debounce the email filter or postpone the semantic removal of a row.
- Retarget surviving rows through the existing `getRowId: Payment.id` mapping and cells by stable column id, never
  page index, label or formatted amount. Repeated sorting/filtering retargets the surviving row hosts and drops the
  obsolete ones. A page replacement has no off-page source rectangle: it reveals new visible paint without flying
  records from the previous page's coordinates, and it takes no row entrance.
- Close an actions menu or restore focus using its existing primitive lifecycle when its row disappears. No retained
  paint remains tabbable, selectable as stale data or announced twice; a rich row supplies no safe paint-only outgoing
  copy, so removal is immediate.
- Unmount cancels the collection, measured-frame and content writers. A live `reduced` settles row positions, the frame
  height and the reels immediately while safe row opacity, changed-run opacity and eligible inherited control paint
  reconcile under their reduced contracts. `none`, or a zero recipe clock, settles every one-shot presentation to the
  effective mode's latest result, including colour, without a delay, loop or leftover controller.

## Geometry and performance

Surviving row movement uses one `transform` per `tr` relative to the table body, measured once per commit from the
committed native boxes, so no projection contributes extra scrollable overflow, anchor candidates or snap targets
beyond the current semantic table. If common-ancestor scrolling invalidates a stored box, the affected rows settle to
native layout instead of borrowing a stale source.

Removal keeps the one live semantic table and its native form/header relationships; the composition never clones a row
containing a checkbox, a menu trigger, named cells or DOM ids to fake outgoing paint. The measured frame clamps to
`[0, natural]` and animates a committed shrink only, because growth inside this region's existing `overflow-hidden`
would clip newly committed required rows. A focused control inside the table or an active pointer capture also settles
immediately. For a simultaneous frame/reorder commit, the frame owns the outer block size while each row projection
measures its own local displacement, avoiding doubled vertical travel.

The frame is measured after the commit, batched with the row boxes, and never during render. Row identity, count and
cell text come from the same committed snapshot, so a reel or text change cannot outlive the row it describes. The
region's natural height is read from the table container and its border/padding edges, not from moving rows.

## Acceptance scenarios

- Pending: sorting, filtering, column visibility and data revisions move retained rows to their committed boxes,
  including when the filter is applied while the table sits at the end of a scrolled page; the scroll range follows
  the current native content and no stored box is replayed after shrinking growth.
- Pending: filtering removes a row that contains a named checkbox and an id-linked label; the removal is immediate,
  ids stay unique, and exactly the original component/ref lifecycle runs.
- Pending: typing and clearing the email filter while a selection count rolls; the derived result total reaches its
  exact final output immediately while a separately identified amount keeps its own eligibility, repeated with equal
  counts and a newly visible page in all three modes.
- Pending: repeated sort by email, rapid filter typing, pagination and column-visibility toggles while rows move;
  results and focus update immediately and no obsolete row host keeps a transform.
- Pending: changing an amount and status for a stable payment id, removing a selected row and reinserting it mid
  transition; counts, currency formatting and text identity stay correct.
- Pending: replacing the whole `data` prop while a filter, a selected row and an actions menu are active, and revisiting
  a page; identity follows payment and column ids and inherited Table effects never run twice.
- Pending: switching to `reduced`, then `none`, during concurrent row movement, a frame shrink, status text and count
  changes; travel, measured height and reels settle while permitted opacity reconciles, and unmounting cancels every
  remaining writer.
- Pending: filter and paginate while editing the filter input and activating header/pagination buttons during
  inherited colour feedback; native input updates and filter semantics stay immediate and never acquire cell text or
  reel decoration.
