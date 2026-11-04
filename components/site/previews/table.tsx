"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/cadence/table";
import { PreviewStack } from "./shell";

const invoices = [
  { id: "INV-001", status: "Paid", method: "Credit card", amount: "$250.00" },
  { id: "INV-002", status: "Pending", method: "Bank transfer", amount: "$150.00" },
  { id: "INV-003", status: "Unpaid", method: "PayPal", amount: "$350.00" },
];

export function BasicExample() {
  return (
    <Table tabIndex={0} className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring">
      <TableCaption>Recent invoices for November.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Payment method</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell>{invoice.method}</TableCell>
            <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right tabular-nums">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function FooterTotalsExample() {
  return (
    <Table>
      <TableCaption>November invoice totals.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableHead scope="row">{invoice.id}</TableHead>
            <TableCell>{invoice.status}</TableCell>
            <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableHead scope="row" colSpan={2}>
            Total
          </TableHead>
          <TableCell className="text-right tabular-nums">$750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export function SelectedRowsExample() {
  const [selected, setSelected] = useState<string[]>(["INV-001"]);
  return (
    <div className="grid gap-4">
      <Table>
        <TableCaption>Choose invoices for your report.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Include</TableHead>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col" className="text-right">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} data-state={selected.includes(invoice.id) ? "selected" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Include ${invoice.id}`}
                  checked={selected.includes(invoice.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked ? [...current, invoice.id] : current.filter((id) => id !== invoice.id),
                    )
                  }
                  className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-ring"
                />
              </TableCell>
              <TableHead scope="row">{invoice.id}</TableHead>
              <TableCell className="text-right tabular-nums">{invoice.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p role="status">Selected invoices: {selected.length}</p>
    </div>
  );
}

export function DensityAlignmentExample() {
  return (
    <div className="grid gap-6">
      {[false, true].map((compact) => (
        <Table key={String(compact)} className={compact ? "[&_td]:p-1 [&_th]:h-8 [&_th]:px-1" : undefined}>
          <TableCaption>{compact ? "Compact spacing" : "Default spacing"} with numeric alignment.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Plan</TableHead>
              <TableHead scope="col" className="text-center">
                Seats
              </TableHead>
              <TableHead scope="col" className="text-right">
                Monthly
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableHead scope="row">Team</TableHead>
              <TableCell className="text-center tabular-nums">12</TableCell>
              <TableCell className="text-right tabular-nums">$240.00</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      ))}
    </div>
  );
}

export function RowActionsExample() {
  const [paid, setPaid] = useState(false);
  return (
    <div className="grid gap-4">
      <Table>
        <TableCaption>Invoice actions owned by the application.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Invoice</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">
              <a href="/docs/changelog" className="underline underline-offset-4">
                INV-001 history
              </a>
            </TableHead>
            <TableCell>{paid ? "Paid" : "Pending"}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" disabled={paid} onClick={() => setPaid(true)}>
                Mark INV-001 paid
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p role="status">{paid ? "INV-001 marked paid locally." : "No payment action yet."}</p>
    </div>
  );
}

export function HorizontalOverflowExample() {
  return (
    <Table
      tabIndex={0}
      className="min-w-[44rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
    >
      <TableCaption>Delivery records. Focus the table and use horizontal arrow keys to scroll.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Customer</TableHead>
          <TableHead scope="col">Delivery reference</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">INV-001</TableHead>
          <TableCell>morgan@example.com</TableCell>
          <TableCell>November workspace delivery</TableCell>
          <TableCell className="text-right tabular-nums">$250.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function EmptyResultsExample() {
  return (
    <Table>
      <TableCaption>Invoices matching the application's current query.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Invoice</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col" className="text-right">
            Amount
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center whitespace-normal text-muted-foreground">
            No matching invoices. Try another query in your application.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

const examples = {
  "footer-totals": FooterTotalsExample,
  "selected-rows": SelectedRowsExample,
  "density-alignment": DensityAlignmentExample,
  "row-actions": RowActionsExample,
  "horizontal-overflow": HorizontalOverflowExample,
  "empty-results": EmptyResultsExample,
};

export function TablePreview({ example }: { example?: string }) {
  const Example = example ? examples[example as keyof typeof examples] : BasicExample;
  if (!Example) return null;
  return (
    <PreviewStack className="min-w-0">
      <div className="w-full min-w-0 max-w-xl">
        <Example />
      </div>
    </PreviewStack>
  );
}
