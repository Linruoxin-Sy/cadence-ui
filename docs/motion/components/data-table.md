# Data Table motion contract

Status: target design; implementation and verification pending.

The current registry block exports `DataTableDemo`, `Payment` and `columns`: an editable payments composition, not a new generic table engine. Its motion explains changes to the visible payment rows while Button, Checkbox, Input, Dropdown Menu and Table retain their own presentation contracts. TanStack owns sorting, filtering, selection, visibility and pagination semantics.

Use the [shared contract](../README.md), [presets](../presets.md) and [Table contract](table.md). Bindings describe the target for the actual composition.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": {
    "table": ["table#TableRow", "table#TableCell", "table#TableHead"],
    "rows": ["data-table#DataTableDemo"],
    "row": ["data-table#DataTableDemo"],
    "region": ["data-table#DataTableDemo"],
    "cell": ["data-table#DataTableDemo"],
    "value": ["data-table#DataTableDemo"],
    "button": ["button#Button"],
    "checkbox": ["checkbox#Checkbox"],
    "menu": ["dropdown-menu#DropdownMenuContent"]
  }
}
```

## Capability ownership

| Capability      | Applicability and owner                                                                                                                                                                                                                                                                      | References                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Appearance      | Default: genuinely inserted visible payment rows receive a compact presence effect; the inherited Table surface consumes a same-cause whole-block entrance. Filtered/removed rows leave the semantic result immediately. Existing rows revisited by pagination are not new business records. | default: `data-table.row.enter`, `data-table.row.exit`; inherited: `data-table.menu.enter`, `data-table.menu.exit`, `@table` |
| Size            | Default for known visible-row/column changes: the composition coordinates one bounded table-region geometry owner where native table layout can be preserved. Native layout is the immediate fallback.                                                                                       | default: `data-table.region.resize`                                                                                          |
| Surface colour  | Inherited: TableRow selection/hover, Checkbox and menu states; the block does not layer another row background writer.                                                                                                                                                                       | inherited: `@table`, `@checkbox`, `@menu`                                                                                    |
| Text colour     | Inherited from those parts; owned payment status/email content uses the cell's semantic foreground.                                                                                                                                                                                          | inherited: `@table`, `@button`, `@menu`                                                                                      |
| Changed text    | Default: owned status/email and result/empty-state strings update changed graphemes. Native filter-input editing stays immediate.                                                                                                                                                            | default: `data-table.cell.replace`                                                                                           |
| Changed numbers | Default: known payment amounts and selected/result counts use numeric owners with the existing formatter. IDs/emails remain text; no new balance/progress field is introduced.                                                                                                               | default: `data-table.value.change`                                                                                           |

## Choreography and modes

| Trigger and owner                                                      | Full                                                                                                                                                                           | Reduced                                            | None                         | Binding → preset → recipe                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sorting or retained-row reorder; visible collection                    | Stable payment ids move surviving visible rows to final native positions.                                                                                                      | Final positions immediately.                       | Final positions immediately. | `data-table.rows.reorder` → `layout.compact` → `layout.move/position`                                                                                                                                                                                                                    |
| Genuine insertion/removal or result replacement; affected visible rows | Compact opacity entry/exit; no mandatory stagger. Outgoing paint is optional and noninteractive after semantic removal.                                                        | Short opacity where safe; semantics immediately.   | Final result immediately.    | `data-table.row.enter` → `presence.inline` → `data.transition/opacity`; `data-table.row.exit` → `presence.exit` → `exit.fade/opacity`                                                                                                                                                    |
| Known result/column change; table region                               | One clamped block-size transition if a valid bounded owner exists; native columns resolve directly.                                                                            | Final geometry immediately.                        | Final geometry immediately.  | `data-table.region.resize` → `geometry.compact` → `geometry.resize/measured`                                                                                                                                                                                                             |
| Status/email/owned result text changes                                 | Changed runs only, without stagger, preserving stable row/cell identity. This integration supplies Table's known display owner rather than adding a second text layer.         | Short opacity on changed runs only.                | Final text immediately.      | `data-table.cell.replace` → `text.replace` → `text.change/changed-runs`                                                                                                                                                                                                                  |
| Amount/selection/result count changes                                  | Raw known quantities and the existing formatter drive place-value rolling; no counting through intermediate business values or second Table text diff on the formatted amount. | Final value immediately.                           | Final value immediately.     | `data-table.value.change` → `number.compact` → `number.roll/reels`                                                                                                                                                                                                                       |
| Button/Checkbox/menu interaction                                       | Inherit the actual control's press, indicator and popup motion without replaying the block.                                                                                    | Colour/opacity only; indicators at final geometry. | All immediate.               | `data-table.button.press` → `feedback.press` → `feedback.press/scale`; `data-table.checkbox.change` → `state.indicator` → `state.morph/indicator`; `data-table.menu.enter` → `presence.menu` → `popup.anchored/presence`; `data-table.menu.exit` → `presence.exit` → `exit.fade/opacity` |

## Interruption and lifecycle

- Commit controlled/uncontrolled TanStack updates, filter results, selection counts and pagination immediately. Animation cannot debounce the email filter or postpone semantic row removal.
- Retarget surviving rows by the existing `getRowId: Payment.id` mapping and cells by stable column id, never page index, label or formatted amount. Repeated sorting/filtering cancels obsolete exits and positions; a row reintroduced before its visual exit ends reuses the latest logical identity. A page replacement has no off-page source rectangle: reveal new visible paint without flying records from the previous page's coordinates.
- Close an actions menu or restore focus using its existing primitive lifecycle when its row disappears. No retained paint remains tabbable, selectable as stale data or announced twice.
- Unmount, live reduced/none and zero clock cancel collection/content writers and settle to the latest result. Returning to full does not animate the currently displayed page as new data.

## Geometry and performance

Measure only participating rendered rows on the current page, batching before/after reads; do not scan off-page data. Use the shared collection bound for the complete rendered moving set: oversized pages commit native positions immediately instead of measuring all records or staggering a backlog. Preserve real table sections, column sizing, row hit regions and overflow. Retained exit paint must not require invalid table wrappers, retain stale selection/copy text, or change semantic result height; omit it if it cannot be isolated safely. Native destination layout determines row geometry; one row-position owner handles the sorting/filtering transaction, and Table adds no second effect. A table-region host coordinates final aggregate height without sampling moving rows each frame. For a simultaneous height/reorder transaction, each row projection excludes displacement already produced by that same shell, avoiding doubled vertical travel. A future virtualized consumer must delegate item placement to its virtualizer and animate only safe visible paint, not add a second position engine.

For region-size continuity, lay the natural table out at its destination width and measure it separately from the bounded outer block-size host. Only that host reflows nearby controls; native cells do not continuously rewrap during its height animation. Column visibility adopts final column geometry immediately before survivor-position motion.

## Acceptance scenarios

- Pending: repeatedly sort by email, type a filter quickly, paginate and toggle column visibility while rows move; results and focus update immediately.
- Pending: change an amount/status for a stable payment id, remove a selected row and reinsert it mid-exit; counts, formatting and text identity remain correct.
- Pending: exceed the collection animation budget and verify an immediate correct native-table fallback without all-data measurement.
- Pending: verify inherited controls and collection behaviour in all modes, live downgrade, zero clock, SSR and unmount during a row/menu transition.
- Pending: replace the whole data prop while a filter, selected row and actions menu are active; revisit a page and change the column order/visibility. Identity follows payment and column ids, results never wait for exits, and inherited Table text effects do not run twice.
