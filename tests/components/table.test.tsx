import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
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

function Fixture({
  capture,
  onClick,
}: {
  capture?: (slot: string, node: HTMLElement | null) => void;
  onClick?: () => void;
}) {
  const props = (slot: string) => ({
    ref: (node: HTMLElement | null) => {
      capture?.(slot, node);
    },
    className: "text-right custom-part",
    style: { color: "red" },
    title: slot,
  });
  return (
    <Table {...props("table")} aria-label="Invoices">
      <TableCaption {...props("table-caption")}>Recent invoices</TableCaption>
      <TableHeader {...props("table-header")}>
        <TableRow {...props("table-row")} data-state="selected" onClick={onClick}>
          <TableHead {...props("table-head")} scope="col">
            Invoice
          </TableHead>
          <TableHead scope="col">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody {...props("table-body")}>
        <TableRow>
          <TableCell {...props("table-cell")} colSpan={2}>
            <a href="#invoice">INV-001</a>
            <button type="button">View invoice</button>
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter {...props("table-footer")}>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>$250.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe("Table", () => {
  it("preserves every native part, ref, caller class and attribute", () => {
    const nodes = new Map<string, HTMLElement>();
    render(
      <Fixture
        capture={(slot, node) => {
          if (node) nodes.set(slot, node);
        }}
      />,
    );
    const tags = {
      table: "TABLE",
      "table-caption": "CAPTION",
      "table-header": "THEAD",
      "table-row": "TR",
      "table-head": "TH",
      "table-body": "TBODY",
      "table-cell": "TD",
      "table-footer": "TFOOT",
    };
    expect(nodes.size).toBe(8);
    for (const [slot, tag] of Object.entries(tags)) {
      const node = nodes.get(slot);
      expect(node?.tagName).toBe(tag);
      expect(node).toHaveAttribute("data-slot", slot);
      expect(node).toHaveClass("custom-part", "text-right");
      expect(node).toHaveStyle({ color: "rgb(255, 0, 0)" });
      expect(node).toHaveAttribute("title", slot);
    }
    expect(nodes.get("table-head")).not.toHaveClass("text-left");
    expect(nodes.get("table-head")).toHaveAttribute("scope", "col");
    expect(nodes.get("table-cell")).toHaveAttribute("colspan", "2");
    const table = screen.getByRole("table", { name: "Invoices" });
    expect(table.parentElement).toHaveAttribute("data-slot", "table-container");
    expect(table.parentElement).toHaveClass("relative", "w-full", "overflow-x-auto");
    expect(table.parentElement).not.toHaveClass("custom-part");
    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("forwards row events and caller-owned selected state", () => {
    const onClick = vi.fn();
    render(<Fixture onClick={onClick} />);
    const row = screen.getByTitle("table-row");
    expect(row).toHaveAttribute("data-state", "selected");
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledOnce();
    expect(row).not.toHaveAttribute("aria-selected");
  });

  it("keeps static parts out of Tab order and native cell controls reachable", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.tab();
    expect(screen.getByRole("link", { name: "INV-001" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "View invoice" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("link")).toHaveFocus();
    for (const node of document.querySelectorAll('[data-slot^="table"]')) expect(node).not.toHaveAttribute("tabindex");
  });

  for (const mode of ["full", "reduced", "none"] as const) {
    it(`stays static without a component motion branch under ${mode}`, () => {
      render(
        <CadenceProvider mode={mode}>
          <Fixture />
        </CadenceProvider>,
      );
      for (const node of document.querySelectorAll<HTMLElement>('[data-slot^="table"]')) {
        expect(node).not.toHaveAttribute("data-motion");
        expect(node.style.transform).toBe("");
        expect(node.style.animation).toBe("");
        expect(node.className).not.toMatch(/animate-|transition-all|transition-transform/);
      }
      expect(screen.getByText("$250.00")).toBeVisible();
    });
  }
});
