"use client";

import type {
  ColumnFiltersState,
  ColumnVisibilityState,
  PaginationState,
  RowSelectionState,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { DataTableDemo, type Payment } from "@/registry/cadence/data-table";
import type { CadenceMode } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

const payments: Payment[] = Array.from({ length: 23 }, (_, i) => ({
  id: `payment-${i + 1}`,
  email: `person${String(i + 1).padStart(2, "0")}@example.com`,
  amount: (i + 1) * 23,
  status: i % 3 === 0 ? "processing" : "success",
}));

export function DataTablePreview() {
  const [mode, setMode] = useState<CadenceMode>("full");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [updated, setUpdated] = useState(false);
  return (
    <div className="w-full min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label>
          Table motion{" "}
          <select
            aria-label="Table motion"
            value={mode}
            onChange={(e) => setMode(e.target.value as CadenceMode)}
            className="rounded border bg-background p-1"
          >
            <option value="full">full</option>
            <option value="reduced">reduced</option>
            <option value="none">none</option>
          </select>
        </label>
        <label>
          Rows per page{" "}
          <select
            aria-label="Rows per page"
            value={pagination.pageSize}
            onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
            className="rounded border bg-background p-1"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </label>
        <button
          type="button"
          className="rounded border px-2 py-1"
          onClick={() => {
            setSorting([]);
            setColumnFilters([]);
            setColumnVisibility({});
            setRowSelection({});
            setPagination({ pageIndex: 0, pageSize: 10 });
          }}
        >
          Reset table
        </button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => setUpdated((value) => !value)}>
          Update first payment
        </button>
      </div>
      <CadenceProvider mode={mode}>
        <DataTableDemo
          data={updated ? payments.map((payment, i) => (i === 0 ? { ...payment, amount: 999 } : payment)) : payments}
          sorting={sorting}
          onSortingChange={setSorting}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </CadenceProvider>
    </div>
  );
}
