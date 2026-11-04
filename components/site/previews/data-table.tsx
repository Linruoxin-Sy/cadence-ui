"use client";

import type {
  ColumnFiltersState,
  ColumnVisibilityState,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useId, useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { DataTableDemo, type Payment } from "@/registry/cadence/data-table";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

const applicationPayments: Payment[] = [
  { id: "invoice-1", email: "lee@example.com", amount: 42, status: "pending" },
  { id: "invoice-2", email: "sam@example.com", amount: 125, status: "processing" },
  { id: "invoice-3", email: "ada@example.com", amount: 316, status: "success" },
  { id: "invoice-4", email: "max@example.com", amount: 88, status: "failed" },
];

function ApplicationData() {
  return <DataTableDemo data={applicationPayments} className="max-w-4xl" />;
}

function ControlledPayments() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const pageSizeId = useId();
  return (
    <div className="w-full min-w-0">
      <DataTableDemo
        data={payments}
        sorting={sorting}
        onSortingChange={setSorting}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label htmlFor={pageSizeId}>Rows per page</label>
        <select
          id={pageSizeId}
          value={pagination.pageSize}
          className="rounded border bg-background p-1"
          onChange={(event) => setPagination({ pageIndex: 0, pageSize: Number(event.target.value) })}
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
        <output>
          Page {pagination.pageIndex + 1}; email sort:{" "}
          {sorting[0] ? (sorting[0].desc ? "descending" : "ascending") : "unsorted"}
        </output>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSorting([]);
            setPagination({ pageIndex: 0, pageSize: 5 });
          }}
        >
          Reset sorting and page
        </Button>
      </div>
    </div>
  );
}

function ControlledFilter() {
  const [filters, setFilters] = useState<ColumnFiltersState>([{ id: "email", value: "person01" }]);
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} columnFilters={filters} onColumnFiltersChange={setFilters} />
      <Button variant="outline" size="sm" onClick={() => setFilters([])}>
        Clear email filter
      </Button>
      <output className="ml-3 text-sm">Filter: {String(filters[0]?.value ?? "(empty)")}</output>
    </div>
  );
}

function ColumnVisibility() {
  const [visibility, setVisibility] = useState<ColumnVisibilityState>({ status: false });
  return (
    <DataTableDemo data={applicationPayments} columnVisibility={visibility} onColumnVisibilityChange={setVisibility} />
  );
}

function EmptyResults() {
  return (
    <div className="grid w-full min-w-0 gap-5">
      <section aria-label="No matching emails" className="min-w-0">
        <p className="text-sm text-muted-foreground">Read-only filter; Status hidden</p>
        <DataTableDemo
          data={applicationPayments}
          columnVisibility={{ status: false }}
          columnFilters={[{ id: "email", value: "no-match" }]}
        />
      </section>
      <section aria-label="Empty collection" className="min-w-0">
        <p className="text-sm text-muted-foreground">No application records</p>
        <DataTableDemo data={[]} />
      </section>
    </div>
  );
}

function RowSelection() {
  const [selection, setSelection] = useState<RowSelectionState>({ "payment-1": true });
  return (
    <div className="w-full min-w-0">
      <DataTableDemo data={payments} rowSelection={selection} onRowSelectionChange={setSelection} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => setSelection({})}>
          Clear selected IDs
        </Button>
        <output className="text-sm">
          Selected IDs:{" "}
          {Object.keys(selection)
            .filter((id) => selection[id])
            .join(", ") || "none"}
        </output>
      </div>
    </div>
  );
}

function UpdatingRows() {
  const [data, setData] = useState(applicationPayments);
  const [selection, setSelection] = useState<RowSelectionState>({ "invoice-1": true });
  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setData((rows) =>
              rows.map((row) => (row.id === "invoice-1" ? { ...row, amount: row.amount === 999 ? 42 : 999 } : row)),
            )
          }
        >
          Update first payment
        </Button>
        <Button variant="outline" size="sm" onClick={() => setData((rows) => [...rows].reverse())}>
          Reverse records
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!data.some((row) => row.id === "invoice-1")}
          onClick={() => {
            setData((rows) => rows.filter((row) => row.id !== "invoice-1"));
            setSelection((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== "invoice-1")));
          }}
        >
          Remove first payment
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setData(applicationPayments);
            setSelection({ "invoice-1": true });
          }}
        >
          Restore records
        </Button>
      </div>
      <DataTableDemo data={data} rowSelection={selection} onRowSelectionChange={setSelection} />
    </div>
  );
}

function NativeContainer() {
  const root = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [clicks, setClicks] = useState(0);
  return (
    <div className="w-full min-w-0">
      <h3 id={titleId} className="text-sm font-medium">
        Regional payments
      </h3>
      <Button variant="outline" size="sm" onClick={() => root.current?.focus()}>
        Focus payment region
      </Button>
      <DataTableDemo
        ref={root}
        data={applicationPayments}
        role="region"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="rounded-lg border p-2 focus-visible:outline-2 focus-visible:outline-ring"
        style={{ borderStyle: "dashed" }}
        onClick={() => setClicks((count) => count + 1)}
      />
      <output className="text-sm">Region clicks: {clicks}</output>
    </div>
  );
}

function WithoutMotion() {
  return (
    <CadenceProvider mode="none">
      <DataTableDemo data={applicationPayments} />
    </CadenceProvider>
  );
}

export function DataTablePreview({ example }: { example?: string }) {
  let specimen = <DataTableDemo data={payments} />;
  switch (example) {
    case "application-data":
      specimen = <ApplicationData />;
      break;
    case "controlled-sorting-and-pagination":
      specimen = <ControlledPayments />;
      break;
    case "controlled-filter":
      specimen = <ControlledFilter />;
      break;
    case "column-visibility":
      specimen = <ColumnVisibility />;
      break;
    case "empty-results":
      specimen = <EmptyResults />;
      break;
    case "row-selection":
      specimen = <RowSelection />;
      break;
    case "updating-rows":
      specimen = <UpdatingRows />;
      break;
    case "native-container":
      specimen = <NativeContainer />;
      break;
    case "without-motion":
      specimen = <WithoutMotion />;
      break;
    default:
      specimen = <DataTableDemo data={payments} />;
  }
  return <PreviewStack className="min-w-0">{specimen}</PreviewStack>;
}
