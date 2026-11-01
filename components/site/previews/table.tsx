"use client";

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

export function TablePreview() {
  return (
    <PreviewStack className="min-w-0">
      <div className="w-full min-w-0 max-w-xl">
        <Table
          tabIndex={0}
          className="focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
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
      </div>
    </PreviewStack>
  );
}
