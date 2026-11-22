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
import { createGroupPositions, type GroupPosition, groupMapping } from "../lib/button-group-layout";
import { cn } from "../lib/cn";
import { createInlineEntrance } from "../lib/inline-entrance";
import { createMeasuredGeometry, naturalGeometry } from "../lib/measured-geometry";
import { bindMotionParameters, geometryCompact } from "../lib/motion";
import { useMotionHostRef } from "../lib/motion-ref";
import { createMotionTransaction } from "../lib/motion-transaction";
import { useCadenceMotion } from "../lib/provider";
import { useNumberPresentation } from "../lib/use-number-presentation";
import { useTextPresentation } from "../lib/use-text-presentation";
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

const committed = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/** The one committed change a render represents. Row movement, presence, the
 *  region box and the owned readouts all classify from this same value. */
type TableChange = "initial" | "none" | "data" | "sort" | "filter" | "visibility" | "page" | "selection";

type TableSnapshot = {
  data: unknown;
  sorting: unknown;
  filters: unknown;
  visibility: unknown;
  pagination: unknown;
};

function tableChange(previous: TableSnapshot | null, next: TableSnapshot): TableChange {
  if (!previous) return "initial";
  // A page replacement moves no retained row: the new page has no off-page source.
  if (previous.pagination !== next.pagination) return "page";
  if (previous.sorting !== next.sorting) return "sort";
  if (previous.filters !== next.filters) return "filter";
  if (previous.visibility !== next.visibility) return "visibility";
  if (previous.data !== next.data) return "data";
  return "none";
}

/** A composition-scoped transaction: one writer per property across rows, cells
 *  and the region, and one live cancellation lane for every committed change. */
type TableMotion = {
  transaction: ReturnType<typeof createMotionTransaction>;
  entity(id: string): object;
};

const TableMotionContext = React.createContext<TableMotion | null>(null);

const amountDisplay = {
  kind: "intl" as const,
  formatter: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

/** One retained native host per owned cell string. Table delegates cell text to
 *  its caller, so this composition supplies the display owner on those cells only. */
function PaymentStatus({ value, id }: { value: string; id: string }) {
  const motion = React.useContext(TableMotionContext);
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(
    node,
    value,
    cm,
    motion?.entity(id) ?? id,
    { characterStagger: false, visible: true, enabled: Boolean(motion) },
    motion?.transaction,
  );
  return (
    <div ref={ref} data-slot="data-table-status" data-motion={cm.mode} className="capitalize">
      {text}
    </div>
  );
}

function PaymentEmail({ value, id }: { value: string; id: string }) {
  const motion = React.useContext(TableMotionContext);
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const text = useTextPresentation(
    node,
    value,
    cm,
    motion?.entity(id) ?? id,
    { characterStagger: false, visible: true, enabled: Boolean(motion) },
    motion?.transaction,
  );
  return (
    <div ref={ref} data-slot="data-table-email" data-motion={cm.mode} className="lowercase">
      {text}
    </div>
  );
}

/** Existing formatter preserved: the numeric owner receives the original value. */
function PaymentAmount({ value, id }: { value: number; id: string }) {
  const motion = React.useContext(TableMotionContext);
  const { node, ref } = useMotionHostRef<HTMLDivElement>();
  const cm = useCadenceMotion(node);
  const text = useNumberPresentation(
    node,
    value,
    cm,
    motion?.entity(id) ?? id,
    { compact: true, visible: true, cause: "independent", display: amountDisplay, enabled: Boolean(motion) },
    motion?.transaction,
  );
  return (
    <div ref={ref} data-slot="data-table-amount" data-motion={cm.mode} className="text-right font-medium">
      {text}
    </div>
  );
}

/** Filter-derived totals resolve directly; only a known selection revision rolls. */
function PaymentSelectedCount({ value, cause }: { value: number; cause: "selection" | "query" }) {
  const motion = React.useContext(TableMotionContext);
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = React.useState(() => ({}));
  const text = useNumberPresentation(
    node,
    value,
    cm,
    entity,
    { compact: true, visible: true, cause },
    motion?.transaction,
  );
  return (
    <span ref={ref} data-slot="data-table-selected" data-motion={cm.mode}>
      {text}
    </span>
  );
}

function PaymentTotalCount({ value }: { value: number }) {
  const motion = React.useContext(TableMotionContext);
  const { node, ref } = useMotionHostRef<HTMLSpanElement>();
  const cm = useCadenceMotion(node);
  const [entity] = React.useState(() => ({}));
  const text = useNumberPresentation(
    node,
    value,
    cm,
    entity,
    { compact: true, visible: true, cause: "query" },
    motion?.transaction,
  );
  return (
    <span ref={ref} data-slot="data-table-total" data-motion={cm.mode}>
      {text}
    </span>
  );
}

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
    cell: ({ row }) => <PaymentStatus value={String(row.getValue("status"))} id={row.original.id} />,
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
    cell: ({ row }) => <PaymentEmail value={String(row.getValue("email"))} id={row.original.id} />,
  }),
  columnHelper.accessor("amount", {
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => <PaymentAmount value={Number.parseFloat(row.getValue("amount"))} id={row.original.id} />,
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

/** Editable payments composition from the pinned shadcn guide. Committed row
 *  movement, row arrival, the region box and owned readouts animate; the native
 *  table keeps its own layout, editing, focus and scroll behaviour. */
export function DataTableDemo({
  data = examplePayments,
  className,
  ref: external,
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
  const root = useMotionHostRef<HTMLDivElement>(external);
  const region = useMotionHostRef<HTMLDivElement>();
  const body = useMotionHostRef<HTMLTableSectionElement>();
  const [transaction] = React.useState(createMotionTransaction);
  const [positions] = React.useState(() => createGroupPositions(transaction));
  const [geometry] = React.useState(() => createMeasuredGeometry(transaction));
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

  const snapshot: TableSnapshot = {
    data,
    sorting: controlledSorting ?? sorting,
    filters: controlledFilters ?? columnFilters,
    visibility: controlledVisibility ?? columnVisibility,
    pagination: controlledPagination ?? pagination,
  };
  const previous = React.useRef<TableSnapshot | null>(null);
  const change = tableChange(previous.current, snapshot);

  // Stable per-record identity keeps a retained readout the same entity across
  // data revisions, so a changed value rolls instead of restarting its string.
  const entities = React.useRef(new Map<string, object>());
  const entity = React.useCallback((id: string) => {
    const known = entities.current.get(id);
    if (known) return known;
    const token = { id };
    entities.current.set(id, token);
    return token;
  }, []);
  const scope = React.useMemo<TableMotion>(() => ({ transaction, entity }), [transaction, entity]);

  // Records already present at first paint are not arrivals; neither is a record
  // revisited by pagination. Only a genuinely new visible id takes the entrance.
  const seen = React.useRef(new Set(data.map((payment) => payment.id)));
  const presence = React.useRef(new Map<string, ReturnType<typeof createInlineEntrance>>());
  const lastBoxes = React.useRef(new Map<HTMLElement, GroupPosition>());
  const contentHeight = React.useRef<number | null>(null);
  const geometryRelease = React.useRef<(() => void) | null>(null);

  committed(() => {
    previous.current = snapshot;
    const section = body.node.current;
    const rows = table.getRowModel().rows;
    if (!section) return;
    const elements = [...section.querySelectorAll<HTMLElement>(':scope > [data-slot="table-row"]')];
    const frame = section.getBoundingClientRect();
    const boxes = new Map<HTMLElement, GroupPosition>();
    const visible: { id: string; element: HTMLElement }[] = [];
    if (rows.length === elements.length) {
      for (const [index, row] of rows.entries()) {
        const element = elements[index];
        if (!element) continue;
        const box = element.getBoundingClientRect();
        boxes.set(element, {
          x: box.left - frame.left,
          y: box.top - frame.top,
          width: box.width,
          height: box.height,
        });
        visible.push({ id: row.id, element });
      }
    }

    // Arrival: opacity only, on the row's own retained host, before first paint.
    for (const { id, element } of visible) {
      if (seen.current.has(id)) continue;
      seen.current.add(id);
      if (cm.reduced) continue;
      const controller = createInlineEntrance(element);
      presence.current.set(id, controller);
      controller.commit({ present: true, enter: true, cm });
    }
    const mounted = new Set(visible.map((entry) => entry.id));
    for (const [id, controller] of presence.current)
      if (!mounted.has(id)) {
        controller.dispose();
        presence.current.delete(id);
      }

    // Commit-time retained-row movement. A page replacement, a selection change
    // or an unsafe ancestor mapping settles instead of guessing a source box.
    const reorder = change === "sort" || change === "filter" || change === "visibility" || change === "data";
    positions.commit({
      host: body.node,
      revision: transaction.revision("layout", `${change}:${visible.map((entry) => entry.id).join(",")}`, section),
      cm,
      boxes,
      from: reorder ? lastBoxes.current : new Map(),
      available: reorder && visible.length > 0 && groupMapping(section),
      axis: "y",
    });
    lastBoxes.current = boxes;

    // Bounded block-size owner: only the frame around the native table reflows.
    const host = region.node.current;
    const content = host?.firstElementChild instanceof HTMLElement ? host.firstElementChild : null;
    if (!host || !content) return;
    if (!geometryRelease.current) {
      geometryRelease.current = geometry.register({
        host: region.node,
        content,
        axes: ["height"],
        measure() {
          const box = naturalGeometry(content);
          if (!box) return null;
          const style = content.ownerDocument.defaultView?.getComputedStyle(host);
          // The shell's own padding/border belong to its closing box.
          const edges =
            style?.boxSizing === "border-box"
              ? [style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth].reduce(
                  (sum, value) => sum + (Number.parseFloat(value) || 0),
                  0,
                )
              : 0;
          const height = box.height + edges;
          return { height: { size: height, min: 0, max: height, readable: true, independent: true } };
        },
      });
    }
    const height = naturalGeometry(content)?.height ?? null;
    const shrink = height !== null && contentHeight.current !== null && height < contentHeight.current - 0.5;
    if (height !== null) contentHeight.current = height;
    const parameters = cm.parameters(bindMotionParameters(geometryCompact, "geometry.resize/measured"));
    if (parameters.kind === "geometry")
      geometry.commit(transaction.revision("content", height, content), {
        reduced: cm.reduced,
        transition: parameters.transition,
        // Growth would clip newly committed required rows inside this region's
        // existing overflow, so it resolves to native layout immediately.
        available: shrink,
      });
  });

  committed(
    () => () => {
      for (const controller of presence.current.values()) controller.dispose();
      presence.current.clear();
      geometryRelease.current?.();
      geometryRelease.current = null;
      positions.dispose();
      geometry.dispose();
    },
    [],
  );

  const selectedRows = table.getFilteredSelectedRowModel().rows.length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const filterDerived = change === "filter" || change === "page" || change === "visibility" || change === "data";

  return (
    <div
      {...props}
      ref={root.ref}
      data-slot="data-table"
      data-motion={cm.mode}
      className={cn("w-full min-w-0", className)}
    >
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
      <TableMotionContext value={scope}>
        <div
          ref={region.ref}
          data-slot="data-table-region"
          data-motion={cm.mode}
          className="overflow-hidden rounded-md border"
        >
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
            <TableBody ref={body.ref}>
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
      </TableMotionContext>
      <div className="flex flex-wrap items-center justify-end gap-2 py-4">
        <div role="status" className="min-w-36 flex-1 text-sm text-muted-foreground">
          <PaymentSelectedCount value={selectedRows} cause={filterDerived ? "query" : "selection"} /> of{" "}
          <PaymentTotalCount value={filteredRows} /> row(s) selected.
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
