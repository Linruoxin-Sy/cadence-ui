"use client";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Input } from "../input";
import { cn } from "../lib/cn";
import { useCadenceMotion } from "../lib/provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../table";

// New in v9: declare the features this table uses — anything you don't
// register is tree-shaken out of the bundle.
const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

const columnHelper = createColumnHelper<typeof features, Payment>();

const examplePayments: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@example.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@example.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@example.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@example.com",
  },
];

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="inline-flex"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="inline-flex"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.email}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ row }) => <div className="capitalize">{row.getValue("status")}</div>,
  }),
  columnHelper.accessor("email", {
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  }),
  columnHelper.accessor("amount", {
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));

      // Format the amount as a dollar amount.
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                Copy payment ID
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<a href={`mailto:${payment.email}`} />}>Email customer</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);

export interface DataTableDemoProps extends React.ComponentProps<"div"> {
  data?: Payment[];
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  columnVisibility?: ColumnVisibilityState;
  onColumnVisibilityChange?: OnChangeFn<ColumnVisibilityState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
}

/** Editable payments composition from the pinned shadcn guide; row changes are instant. */
export function DataTableDemo({
  data = examplePayments,
  className,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledFilters,
  onColumnFiltersChange,
  columnVisibility: controlledVisibility,
  onColumnVisibilityChange,
  rowSelection: controlledSelection,
  onRowSelectionChange,
  pagination: controlledPagination,
  onPaginationChange,
  ...props
}: DataTableDemoProps) {
  const cm = useCadenceMotion();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const table = useTable({
    features,
    data,
    columns,
    getRowId: (payment) => payment.id,
    onSortingChange: onSortingChange ?? setSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setColumnFilters,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setColumnVisibility,
    onRowSelectionChange: onRowSelectionChange ?? setRowSelection,
    onPaginationChange: onPaginationChange ?? setPagination,
    state: {
      sorting: controlledSorting ?? sorting,
      columnFilters: controlledFilters ?? columnFilters,
      columnVisibility: controlledVisibility ?? columnVisibility,
      rowSelection: controlledSelection ?? rowSelection,
      pagination: controlledPagination ?? pagination,
    },
  });

  return (
    <div data-slot="data-table" data-motion={cm.mode} className={cn("w-full min-w-0", className)} {...props}>
      <div className="flex items-center gap-2 py-4">
        <Input
          aria-label="Filter emails"
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
          className="min-w-0 max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="ml-auto" />}>
            Columns <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table aria-label="Payments" tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-ring">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      aria-sort={
                        header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : undefined
                      }
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 py-4">
        <div role="status" className="min-w-36 flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
