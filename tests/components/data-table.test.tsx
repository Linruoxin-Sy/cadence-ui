import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTablePreview } from "@/components/site/previews/data-table";
import { DataTableDemo, type Payment } from "@/registry/cadence/data-table";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

const records: [Payment, Payment] = [
  { id: "b", email: "beta@example.com", amount: 2, status: "success" },
  { id: "a", email: "alpha@example.com", amount: 1, status: "pending" },
];

describe("Data Table composition", () => {
  it("preserves native semantics, caller props, ref cleanup and stable rows through sorting", async () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const click = vi.fn();
    const { container, unmount } = render(
      <DataTableDemo data={records} ref={ref} className="custom" style={{ color: "red" }} onClick={click} />,
    );
    const root = container.querySelector('[data-slot="data-table"]');
    expect(screen.getByRole("columnheader", { name: "Actions" })).toHaveAttribute("scope", "col");
    expect(root).toHaveClass("custom");
    expect(root).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref).toHaveBeenCalledWith(root);
    const row = screen.getByText("beta@example.com").closest("tr");
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    expect(screen.getByRole("columnheader", { name: "Email" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByText("beta@example.com").closest("tr")).toBe(row);
    expect(within(screen.getByRole("table", { name: "Payments" })).getAllByRole("row")[1]).toHaveTextContent(
      "alpha@example.com",
    );
    expect(click).toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalled();
  });
  it("keeps filter focus and input identity, spans visible columns in the empty result", async () => {
    render(<DataTableDemo data={records} columnVisibility={{ status: false }} />);
    const input = screen.getByRole("textbox", { name: "Filter emails" });
    await userEvent.type(input, "missing");
    expect(screen.getByText("No results.")).toHaveAttribute("colspan", "4");
    expect(screen.getByRole("textbox", { name: "Filter emails" })).toBe(input);
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    expect(screen.getByText("beta@example.com")).toBeVisible();
  });
  it("selects by stable IDs, supports read-only state and external data/state changes", async () => {
    const change = vi.fn();
    const { rerender } = render(
      <DataTableDemo data={records} rowSelection={{ b: true }} onRowSelectionChange={change} />,
    );
    expect(screen.getByRole("checkbox", { name: "Select beta@example.com" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("checkbox", { name: "Select alpha@example.com" }));
    expect(change).toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: "Select alpha@example.com" })).toHaveAttribute("aria-checked", "false");
    rerender(
      <DataTableDemo
        data={[records[1], { ...records[0], amount: 99 }]}
        rowSelection={{ b: true }}
        columnFilters={[{ id: "email", value: "beta" }]}
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Select beta@example.com" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("$99.00")).toBeVisible();
    expect(screen.queryByText("alpha@example.com")).toBeNull();
  });
  it("exercises page selection and external amount updates in their named specimens", async () => {
    const { unmount, container } = render(<DataTablePreview example="row-selection" />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Select all" }));
    expect(container.querySelector('[role="status"]')).toHaveTextContent("10 of 23");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("person11@example.com")).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Select all" })).toHaveAttribute("aria-checked", "false");
    await userEvent.click(screen.getByRole("button", { name: "Clear selected IDs" }));
    expect(container.querySelector('[role="status"]')).toHaveTextContent("0 of 23");
    unmount();
    render(<DataTablePreview example="updating-rows" />);
    await userEvent.click(screen.getByRole("button", { name: "Update first payment" }));
    expect(screen.getByText("$999.00")).toBeVisible();
  });
  for (const mode of ["full", "reduced", "none"] as const)
    it(`keeps table structure instant and propagates ${mode} to controls`, async () => {
      const { container } = render(
        <CadenceProvider mode={mode}>
          <DataTableDemo data={records} />
        </CadenceProvider>,
      );
      const table = screen.getByRole("table");
      await userEvent.click(screen.getByRole("button", { name: "Columns" }));
      const menu = await screen.findByRole("menu");
      expect(menu).toHaveAttribute("data-motion", mode);
      if (mode !== "full") expect(menu.className).not.toContain("scale-(--motion-scale-in)");
      if (mode === "none") {
        expect(menu.className).toContain("duration-0");
        expect(menu.className).not.toContain("opacity-0");
      }
      expectMotionContract(mode, { parts: [container.querySelector('[data-slot="data-table"]'), menu] });
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByRole("table")).toBe(table);
      expect(table.style.transform).toBe("");
    });
});
