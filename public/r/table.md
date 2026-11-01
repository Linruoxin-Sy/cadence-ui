# Table

> Invoices, transaction histories, and small collections of structured records.

- Registry item: https://cadence.dev/r/table.json
- Install: `npx shadcn@latest add @cadence/table`
- Type: registry:ui
- Since: 0.4.0


## Installation

```install
npx shadcn@latest add @cadence/table
```

## Usage

```tsx
import {
  Table, TableBody, TableCaption, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/cadence/table";

export function Invoices() {
  return (
    <Table tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-ring">
      <TableCaption>Recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col" className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>INV-001</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
```

## Footer totals

`TableFooter` renders a native `tfoot`. Spans and numeric alignment are caller-owned.

```tsx
<TableFooter>
  <TableRow>
    <TableCell colSpan={3}>Total</TableCell>
    <TableCell className="text-right tabular-nums">$750.00</TableCell>
  </TableRow>
</TableFooter>
```

## Selected rows

Selection state belongs to the application. A data attribute supplies the visual
state; add a named checkbox when selection must be interactive. Setting this
attribute alone does not make a row a control or announce selection.

```tsx
<TableRow data-state="selected">
  <TableCell>INV-001</TableCell>
  <TableCell>Paid</TableCell>
</TableRow>
```

## When to use

- Invoice summaries with amounts and payment states.
- Transaction histories with a few consistent columns.
- Small record collections where column comparisons matter.

## When not to use

- For page layout: use CSS grid or flex.
- For large collections needing sorting, filtering, pagination, or virtualization:
  compose those behaviours in the application; Table only supplies markup and styles.
- For independent summaries with no column relationships: use cards or a list.

## API

All eight exports accept `React.ComponentProps` for their native element,
including `children`, `className`, `style`, event handlers, ARIA attributes and
React 19 `ref`. Classes merge last. No custom props or defaults are added.

| Export | Element |
| --- | --- |
| `Table` | `table` |
| `TableHeader` | `thead` |
| `TableBody` | `tbody` |
| `TableFooter` | `tfoot` |
| `TableRow` | `tr` |
| `TableHead` | `th` |
| `TableCell` | `td` |
| `TableCaption` | `caption` |

Each part's slot is its kebab-case name: `table`, `table-header`, `table-body`,
`table-footer`, `table-row`, `table-head`, `table-cell`, and `table-caption`.

`Table` also creates a `div` with `data-slot="table-container"` and
`relative w-full overflow-x-auto`. Its props, classes and ref target the **table**,
not that wrapper. Size the surrounding layout to constrain the scrolling region.
`TableHead` and `TableCell` keep upstream's no-wrap and checkbox alignment styles.
Rows retain hover, `data-state="selected"` and descendant `aria-expanded` feedback.

## Motion contract

T0: no motion recipe, hook, provider, or animation runtime. All modes render the
same static table. Row colour feedback is the upstream CSS colour transition;
rows do not enter, reorder, resize, or animate selection.

| Mode | Animated properties |
| --- | --- |
| full | none |
| reduced | none |
| none | none |

No timing token or interruption lifecycle applies.

## Accessibility

- Native table, row, header, cell and caption semantics remain intact. Provide a
  meaningful caption or an accessible name and use `scope` for header relationships.
- Static rows and cells stay out of the tab order. Links, buttons and checkboxes
  inside cells keep their native keyboard interaction; no grid arrow-key model is added.
- The wrapper scrolls horizontally on narrow screens; columns are not removed.
  If keyboard scrolling needs an explicit focus stop across your target browsers,
  pass `tabIndex={0}` to the named table with a visible focus ring, as in Usage.
  This supplies a focusable descendant of the scrolling container; arrow keys
  can scroll that ancestor without adding grid keyboard semantics.
- No layout measurement or data processing runs. Render large datasets through
  application-owned pagination or virtualization; the server markup remains native HTML.

## Notes for AI

- Preserve the table hierarchy: caption, header, body and footer belong inside Table.
- Class names and refs on Table address the table; constrain its parent for overflow.
- Table does not fetch data, validate values, sort, filter, paginate or own selection.
- Do not add decorative row entrance or reorder motion to this T0 component.

---

Full index: https://cadence.dev/llms.txt
