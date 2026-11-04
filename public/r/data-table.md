# Data Table

> An editable payments table with sorting, filtering, selection, visibility, and pagination.

- Registry item: https://cadence.dev/r/data-table.json
- Install: `npx shadcn@latest add @cadence/data-table`
- Type: registry:block
- Since: 0.5.0
- Motion recipes: feedback.press, state.morph, popup.anchored, exit.fade

## Installation

```install
npx shadcn@latest add @cadence/data-table
```

The block installs TanStack Table **9.3.1** and the Cadence Table, Input, Button,
Checkbox and Dropdown Menu items. Manual installation: copy
`registry/cadence/data-table/index.tsx` to `components/cadence/data-table/index.tsx`,
install those registry dependencies, then install `@tanstack/react-table@9.3.1`.
Keep the relative imports and sibling install tree.

## Usage

```tsx
import { DataTableDemo } from "@/components/cadence/data-table";

export function Payments() {
  return <DataTableDemo />;
}
```

This is an editable payments **composition**, not a universal table primitive.
It starts from the [pinned Base example](https://github.com/shadcn-ui/ui/blob/96da9cc7f1aa10580a3741664e2a77c721206c00/apps/v4/examples/base/data-table-demo.tsx)
and [guide](https://github.com/shadcn-ui/ui/blob/96da9cc7f1aa10580a3741664e2a77c721206c00/apps/v4/content/docs/components/base/data-table.mdx).
`Payment`, `columns`, and `DataTableDemo` retain that example's exports.
Edit the column definitions and feature registration for your application.
The current [TanStack React documentation](https://tanstack.com/table/latest/docs/framework/react/overview)
describes v9; v8's `useReactTable` and `get*RowModel` options do not apply.

## Application data

The caller supplies all four payment statuses, USD amounts, and unique stable IDs. Copy payment ID writes the original ID to the browser clipboard; Email customer is a real `mailto:` link. Clipboard permission and errors belong to the host.

<ComponentExample name="application-data" />

```tsx
"use client";

import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function ApplicationData() {
  return <DataTableDemo data={applicationPayments} className="max-w-4xl" />;
}

```

## Controlled sorting and pagination

Pair each state prop with its change callback. TanStack value-or-updater callbacks accept React setters directly. The page-size select belongs to this pagination UI and resets the page index. Email toggles ascending/descending case-insensitively; filtering automatically resets the page. Previous and Next are the installed table controls. Reset affects only sorting and pagination here.

<ComponentExample name="controlled-sorting-and-pagination" />

```tsx
"use client";

import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useId, useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function ControlledPayments() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const pageSizeId = useId();
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} sorting={sorting} onSortingChange={setSorting}
        pagination={pagination} onPaginationChange={setPagination} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor={pageSizeId}>Rows per page</label>
        <select id={pageSizeId} value={pagination.pageSize}
          className="rounded border bg-background p-1"
          onChange={(event) => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}>
          <option value="5">5</option><option value="10">10</option><option value="20">20</option>
        </select>
        <output>Page {pagination.pageIndex + 1}; email sort: {sorting[0] ? sorting[0].desc ? "descending" : "ascending" : "unsorted"}</output>
        <Button variant="outline" size="sm" onClick={() => {
          setSorting([]);
          setPagination({ pageIndex: 0, pageSize: 5 });
        }}>Reset sorting and page</Button>
      </div>
    </div>
  );
}

```

## Controlled filtering

The email filter is a case-insensitive substring. This caller starts with a filter, owns subsequent drafts, and can clear it. Updating the value does not replace the filter input or table. A state prop without its callback is read-only; a callback without state takes over updating that slice. Leave both absent for internal state.

<ComponentExample name="controlled-filter" />

```tsx
"use client";

import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function ControlledFilter() {
  const [filters, setFilters] = useState<ColumnFiltersState>([{ id: "email", value: "person01" }]);
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} columnFilters={filters} onColumnFiltersChange={setFilters} />
      <Button variant="outline" size="sm" onClick={() => setFilters([])}>Clear email filter</Button>
      <output className="ml-3 text-sm">Filter: {String(filters[0]?.value ?? "(empty)")}</output>
    </div>
  );
}

```

## Column visibility

Status starts hidden; use Columns to show it or hide Email and Amount. Selection and Actions cannot be hidden. Hiding Email keeps its filter state. This instance owns visibility independently from the other tables.

<ComponentExample name="column-visibility" />

```tsx
"use client";

import type { ColumnVisibilityState } from "@tanstack/react-table";
import { useState } from "react";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function ColumnVisibility() {
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({ status: false });
  return <DataTableDemo data={applicationPayments} columnVisibility={visibility} onColumnVisibilityChange={setVisibility} />;
}

```

## Empty results

A fixed unmatched filter and an empty application collection both render No results. The first filter and visibility state are intentionally read-only; typing and menu changes cannot override supplied values without their matching callbacks. The empty cell spans four visible columns in the first table and all five in the second.

<ComponentExample name="empty-results" />

```tsx
"use client";

import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function EmptyResults() {
  return (
    <div className="grid w-full min-w-0 gap-5">
      <section aria-label="No matching emails" className="min-w-0">
        <p className="text-sm text-muted-foreground">Read-only filter; Status hidden</p>
        <DataTableDemo data={applicationPayments} columnVisibility={{ status: false }}
          columnFilters={[{ id: "email", value: "no-match" }]} />
      </section>
      <section aria-label="Empty collection" className="min-w-0">
        <p className="text-sm text-muted-foreground">No application records</p>
        <DataTableDemo data={[]} />
      </section>
    </div>
  );
}

```

## Row selection

The header selects the current page, not all 23 rows. A partial page shows an indeterminate checkbox. Selection is keyed by stable application ID and survives sorting, filtering, and pagination; the installed live status counts the filtered selection only. The caller-owned output includes selected IDs outside the current filter. Clear selected IDs explicitly clears all pages.

<ComponentExample name="row-selection" />

```tsx
"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function RowSelection() {
  const [selection, setSelection] = useState<RowSelectionState>({ "payment-1": true });
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} rowSelection={selection} onRowSelectionChange={setSelection} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setSelection({})}>Clear selected IDs</Button>
        <output className="text-sm">Selected IDs: {Object.keys(selection).filter((id) => selection[id]).join(", ") || "none"}</output>
      </div>
    </div>
  );
}

```

## Updating rows

The caller updates the first amount, reverses record order, removes that record, or restores the collection. Surviving rows keep stable keys and selection; filter drafts and the table node survive updates. Removing a record also removes its stale selection in this caller. These operations demonstrate data ownership, not a built-in editing or fetching API. Updates and row reordering are immediate in every motion mode.

<ComponentExample name="updating-rows" />

```tsx
"use client";

import type { RowSelectionState } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function UpdatingRows() {
  const [data, setData] = useState(applicationPayments);
  const [selection, setSelection] = useState<RowSelectionState>({ "invoice-1": true });
  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setData((rows) => rows.map((row) =>
          row.id === "invoice-1" ? { ...row, amount: row.amount === 999 ? 42 : 999 } : row))}>Update first payment</Button>
        <Button variant="outline" size="sm" onClick={() => setData((rows) => [...rows].reverse())}>Reverse records</Button>
        <Button variant="outline" size="sm" disabled={!data.some((row) => row.id === "invoice-1")}
          onClick={() => {
            setData((rows) => rows.filter((row) => row.id !== "invoice-1"));
            setSelection((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== "invoice-1")));
          }}>Remove first payment</Button>
        <Button variant="outline" size="sm" onClick={() => {
          setData(applicationPayments);
          setSelection({ "invoice-1": true });
        }}>Restore records</Button>
      </div>
      <DataTableDemo data={data} rowSelection={selection} onRowSelectionChange={setSelection} />
    </div>
  );
}

```

## Native container props

Native div props, React 19 ref, events, style, and classes pass to the outer data-table container. This example adds a separately named region and an explicit focus action. The inner Payments table keeps native table semantics, column scopes, and keyboard scrolling; it does not become an editable grid. The click count receives real bubbling events.

<ComponentExample name="native-container" />

```tsx
"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/cadence/button";
import { DataTableDemo, type Payment } from "@/components/cadence/data-table";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function NativeContainer() {
  const root = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [clicks, setClicks] = useState(0);
  return (
    <div className="w-full min-w-0">
      <h3 id={titleId} className="text-sm font-medium">Regional payments</h3>
      <Button variant="outline" size="sm" onClick={() => root.current?.focus()}>Focus payment region</Button>
      <DataTableDemo ref={root} data={applicationPayments} role="region" aria-labelledby={titleId}
        tabIndex={-1} className="rounded-lg border p-2 focus-visible:outline-2 focus-visible:outline-ring"
        style={{ borderStyle: "dashed" }} onClick={() => setClicks((count) => count + 1)} />
      <output className="text-sm">Region clicks: {clicks}</output>
    </div>
  );
}

```

## Without motion

This explicit local provider fixes only this specimen to none. Open Columns, select rows, and sort normally: menus appear on their first visible frame with zero motion duration, checkmarks switch immediately, and buttons do not scale. Other examples inherit the page header and system preference.

<ComponentExample name="without-motion" />

```tsx
"use client";

import { DataTableDemo, type Payment } from "@/components/cadence/data-table";
import { CadenceProvider } from "@/components/cadence/lib/provider";

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

export function WithoutMotion() {
  return <CadenceProvider mode="none"><DataTableDemo data={applicationPayments} /></CadenceProvider>;
}

```

## When to use

- Payment lists with sortable emails and small client-side collections.
- A starting point for an application-specific TanStack v9 composition.
- A native table with page-level selection and column visibility controls.

## When not to use

- Static records: use [Table](/components/table).
- Very large datasets: build caller-owned server pagination or virtualization.
- Spreadsheet navigation or cell editing: this example has native table semantics.

## API

`DataTableDemo` accepts native `div` props (including React 19 ref, events, style,
and classes merged last) on `data-slot="data-table"`. Table parts retain their
existing slots. The native table is named Payments and has a visible focus ring.

| Prop | Type | Default |
| --- | --- | --- |
| `data` | `Payment[]` | five sample payments |
| `sorting` | `SortingState` | internal `[]` |
| `columnFilters` | `ColumnFiltersState` | internal `[]` |
| `columnVisibility` | `ColumnVisibilityState` | internal `{}` |
| `rowSelection` | `RowSelectionState` | internal `{}` |
| `pagination` | `PaginationState` | internal `{ pageIndex: 0, pageSize: 10 }` |
| `onSortingChange` | `OnChangeFn<SortingState>` | internal setter |
| `onColumnFiltersChange` | `OnChangeFn<ColumnFiltersState>` | internal setter |
| `onColumnVisibilityChange` | `OnChangeFn<ColumnVisibilityState>` | internal setter |
| `onRowSelectionChange` | `OnChangeFn<RowSelectionState>` | internal setter |
| `onPaginationChange` | `OnChangeFn<PaginationState>` | internal setter |

The exported `columns` are the payment-specific TanStack v9 definitions, not an
additional generic public table API. Customize this file rather than passing
arbitrary columns to `DataTableDemo`.

## Motion contract

No row entrance, reorder, resize or layout motion. Sorting, filtering, pagination
and visibility update native markup immediately without keying the table or input
by state. Surviving rows use stable IDs; off-page rows unmount normally.
T2 describes the composed controls; there is no separate table animation runtime.

| Recipe / cause | full | reduced | none |
| --- | --- | --- | --- |
| `feedback.press` / Button press | token spring scale | no scale | immediate |
| `state.morph` / checkbox or menu check | opacity and scale | opacity only | zero duration |
| `popup.anchored` / Columns or Actions opens | opacity and scale | opacity only | visible on first frame |
| `exit.fade` / menu closes | opacity and scale exit | opacity only | immediate |

Recipes and timing tokens belong to the installed controls. Dropdown Menu uses
its local `duration.fast` clock, including timeScale and reducedDurationScale,
even through a portal inside a differently configured provider. Live downgrade
drops transforms and `none` removes all motion transitions. No measured geometry,
loop, timer, stagger, or permanent `will-change` is introduced by this block.

## Keyboard and accessibility

Native table headers use `scope="col"`; the sorted header exposes `aria-sort`.
Tab reaches the named filter, column trigger, checkboxes, row actions and page
buttons. Space toggles a focused checkbox; Enter activates buttons. Arrow keys
navigate open menus, Escape dismisses and returns focus. No grid arrow-key model
is added to static cells. Each row checkbox includes its email in the accessible
name; the header is Select all. The filtered selection count is a live status.

## Validation and data ownership

The caller fetches records, decides validity, removes stale selections, and owns
persistence. This block has no validation, submission, request orchestration, or
schema API. All processing is client-side; server pagination, virtualization,
cell editing, resizing, and additional filter controls require adapting the copied
composition. Stable unique IDs must identify the same record across updates.

## Responsiveness and performance

The toolbar and footer wrap. The native Table wrapper scrolls horizontally at
narrow widths; no data columns disappear automatically. Focus the named table
and use arrow keys to scroll, or use touch/pointer scrolling. The composition is
SSR-compatible with deterministic example data. Keep caller arrays stable where
possible; TanStack recomputes client row models when data/state change. This
block is intended for paginated collections, not an unbounded dataset benchmark.

## Notes for AI

- Keep Base UI `render`, Dropdown Menu groups, native table markup and stable row IDs.
- Register v9 features, row models, sorting and filtering functions explicitly.
- Keep data fetching, validation, stale selection cleanup and URL state caller-owned.
- Preserve all three modes of the composed controls; do not animate table geometry.
- Related: [Table](/components/table), [Checkbox](/components/checkbox),
  [Dropdown Menu](/components/dropdown-menu), [Pagination](/components/pagination).

---

Full index: https://cadence.dev/llms.txt
