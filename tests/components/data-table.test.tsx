import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DataTablePreview } from "@/components/site/previews/data-table";
import { DataTableDemo, type Payment } from "@/registry/cadence/data-table";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";

const modes = ["full", "reduced", "none"] as const;
const records: [Payment, Payment] = [
  { id: "b", email: "beta@example.com", amount: 2, status: "success" },
  { id: "a", email: "alpha@example.com", amount: 1, status: "pending" },
];
const inserted: Payment = { id: "c", email: "gamma@example.com", amount: 3, status: "processing" };

/** jsdom has no layout: derive a bounded frame size from the committed rows so the
 *  measured block-size owner commits a real destination instead of `null`. */
const computedStyle = window.getComputedStyle.bind(window);
beforeEach(() => {
  vi.spyOn(window, "getComputedStyle").mockImplementation((element: Element, pseudo?: string | null) => {
    const css = computedStyle(element, pseudo ?? undefined);
    return new Proxy(css, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (key === "width" && value === "") return "600px";
        if (key === "height" && value === "")
          return `${element.querySelectorAll('[data-slot="table-row"]').length * 44}px`;
        return typeof value === "function" ? value.bind(target) : value;
      },
    }) as CSSStyleDeclaration;
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

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
  for (const mode of modes)
    it(`commits movement, arrival, frame, text and quantities on the real parts in ${mode}`, async () => {
      const { container, rerender } = render(
        <CadenceProvider mode={mode}>
          <DataTableDemo data={records} />
        </CadenceProvider>,
      );
      const root = container.querySelector('[data-slot="data-table"]');
      const region = container.querySelector('[data-slot="data-table-region"]');
      const beta = screen.getByText("beta@example.com").closest("tr");
      const alpha = screen.getByText("alpha@example.com").closest("tr");

      // Sorting: retained rows keep their hosts, then move to the committed boxes.
      await userEvent.click(screen.getByRole("button", { name: "Email" }));
      expect(screen.getByText("beta@example.com").closest("tr")).toBe(beta);
      expect(screen.getByText("alpha@example.com").closest("tr")).toBe(alpha);

      // Selection count: a known selection revision may roll.
      await userEvent.click(screen.getByRole("checkbox", { name: "Select alpha@example.com" }));
      expect(screen.getByRole("checkbox", { name: "Select alpha@example.com" })).toHaveAttribute(
        "aria-checked",
        "true",
      );

      // Filtering: removal is semantic and immediate, the derived total does not roll.
      const input = screen.getByRole("textbox", { name: "Filter emails" });
      await userEvent.type(input, "beta");
      expect(screen.queryByText("alpha@example.com")).toBeNull();
      expect(input).toHaveFocus();
      await userEvent.clear(input);
      expect(screen.getByText("alpha@example.com")).toBeVisible();

      // A stable payment id changes its own status and amount in place.
      rerender(
        <CadenceProvider mode={mode}>
          <DataTableDemo data={[{ ...records[1], status: "failed", amount: 7 }, records[0]]} />
        </CadenceProvider>,
      );
      expect(screen.getByText("failed")).toBeVisible();
      expect(screen.getByText("$7.00")).toBeVisible();

      // A genuinely inserted payment takes one entrance; existing rows do not replay.
      rerender(
        <CadenceProvider mode={mode}>
          <DataTableDemo data={[inserted, { ...records[1], status: "failed", amount: 7 }, records[0]]} />
        </CadenceProvider>,
      );
      expect(screen.getByText("gamma@example.com")).toBeVisible();

      // Inherited dropdown popup keeps its own anchor/presence ownership.
      await userEvent.click(screen.getByRole("button", { name: "Columns" }));
      const menu = await screen.findByRole("menu");
      expect(menu).toHaveAttribute("data-motion", mode);
      if (mode !== "full") expect(menu.className).not.toContain("scale-(--motion-scale-in)");
      if (mode === "none") {
        expect(menu.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
        expect(menu.className).not.toContain("opacity-0");
      }
      expectMotionContract(mode, {
        root: container,
        parts: [root, region, menu],
        behavior: () => {
          expect(root).toHaveAttribute("data-motion", mode);
          expect(screen.getByRole("table")).toBeInTheDocument();
        },
      });
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(screen.getByText("beta@example.com").closest("tr")).toBe(beta);
    });

  it("settles live mode downgrades without replaying or losing the committed result", async () => {
    const { container, rerender } = render(
      <CadenceProvider mode="full">
        <DataTableDemo data={records} />
      </CadenceProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Email" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Filter emails" }), "beta");
    rerender(
      <CadenceProvider mode="none">
        <DataTableDemo data={records} />
      </CadenceProvider>,
    );
    const root = container.querySelector('[data-slot="data-table"]');
    expect(root).toHaveAttribute("data-motion", "none");
    expect(container.querySelector('[data-slot="data-table-region"]')).toHaveAttribute("data-motion", "none");
    expect(screen.getByText("beta@example.com")).toBeVisible();
    rerender(
      <CadenceProvider mode="reduced">
        <DataTableDemo data={records} />
      </CadenceProvider>,
    );
    expect(root).toHaveAttribute("data-motion", "reduced");
    await userEvent.clear(screen.getByRole("textbox", { name: "Filter emails" }));
    expect(screen.getByText("alpha@example.com")).toBeVisible();
    expectMotionContract("reduced", { root: container, parts: [root] });
  });

  it("keeps the first committed page visible for server rendering and initial hydration", () => {
    const html = renderToString(
      <CadenceProvider mode="full">
        <DataTableDemo data={records} />
      </CadenceProvider>,
    );
    expect(html).toContain('data-slot="table-row"');
    expect(html).toContain("beta@example.com");
    expect(html).toMatch(/data-slot="data-table"/);
    expect(html).not.toMatch(/data-slot="table-row"[^>]*(?:opacity|transform):/);
  });
});
