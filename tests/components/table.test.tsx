import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";
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
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

/** jsdom has no Web Animations API. The surface entrance is the only native
 * writer, so the tests that certify a real entrance supply the minimal surface. */
function stubAnimations() {
  const previous = HTMLElement.prototype.animate;
  const calls: { node: HTMLElement; frames: Keyframe[]; timing: KeyframeAnimationOptions }[] = [];
  HTMLElement.prototype.animate = function (
    this: HTMLElement,
    frames: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    calls.push({
      node: this,
      frames: Array.isArray(frames) ? frames : [],
      timing: typeof options === "number" ? { duration: options } : (options ?? {}),
    });
    let reject: ((reason?: unknown) => void) | undefined;
    const finished = new Promise<void>((_, no) => {
      reject = no;
    });
    // An adapter that owns a cancel-only effect must not surface a rejection.
    finished.catch(() => {});
    return {
      finished,
      playState: "running",
      effect: {
        getKeyframes: () => (Array.isArray(frames) ? frames : []),
        getTiming: () => ({ duration: 100 }),
        setKeyframes() {},
      },
      cancel() {
        reject?.(new Error("cancelled"));
      },
      finish() {},
    } as unknown as Animation;
  } as unknown as typeof HTMLElement.prototype.animate;
  return {
    calls,
    restore: () => {
      HTMLElement.prototype.animate = previous;
    },
  };
}

function must<T>(value: T | null) {
  if (!value) throw new Error("Missing fixture element");
  return value;
}

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

  it("keeps the initial table visible for server rendering", () => {
    const html = renderToString(
      <Table aria-label="Server">
        <TableBody>
          <TableRow>
            <TableCell>Server</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(html).toContain('data-slot="table-container"');
    expect(html).toContain('data-slot="table"');
    expect(html).not.toMatch(/opacity:\s*0\b/);
  });

  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned action on the real parts in %s", async (mode) => {
    const owned = (binding: string, exercise: () => void | Promise<void>) =>
      expectV2MotionAction("table", binding, mode, exercise).catch((error) => {
        throw new Error(`${binding} in ${mode}: ${(error as Error).message}`);
      });

    // The inserted surface keeps one live presence owner; a cell revision is the
    // real committed change on that host.
    const surface = (cell: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Table aria-label="Surface">
          <TableBody>
            <TableRow>
              <TableCell>{cell}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CadenceProvider>
    );
    const shell = render(surface("First revision"));
    await owned("table.surface.enter", () => shell.rerender(surface("Second revision")));
    shell.unmount();

    // Row and footer keep one scoped paint owner each, on their own physical host.
    // The boundary check runs in a container that carries the declared native
    // regions: the table itself and the header identity slot.
    const paint = (tone: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Table aria-label="Paint">
          <TableFooter style={{ backgroundColor: tone }}>
            <TableRow style={{ backgroundColor: tone }} data-state="selected">
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CadenceProvider>
    );
    const colour = render(paint("#ffffff"));
    const row = must(colour.container.querySelector<HTMLElement>('[data-slot="table-row"]'));
    const footer = must(colour.container.querySelector<HTMLElement>('[data-slot="table-footer"]'));
    expect(row).toHaveAttribute("data-cadence-color", "background-color, color");
    await owned("table.row.colour", () => colour.rerender(paint("#eef2ff")));
    expect(row).toBe(colour.container.querySelector('[data-slot="table-row"]'));
    expect(footer.style.backgroundColor).toBe("rgb(238, 242, 255)");
    expectMotionContract(mode, {
      parts: [row, footer],
      behavior: () => expect(footer).toHaveAttribute("data-cadence-color", "background-color, color, border-top-color"),
    });
    colour.unmount();

    // Native table layout stays the delegation target for a collection composition.
    const native = render(
      <CadenceProvider mode={mode}>
        <Table aria-label="Native">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>INV-001</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("table", { container: native.container });
    native.unmount();
  });

  it.each(modes)("starts one surface entrance only for a later-inserted table in %s", (mode) => {
    const { calls, restore } = stubAnimations();
    try {
      const surface = (content: ReactNode) => (
        <CadenceProvider mode={mode} timeScale={1}>
          <Table aria-label="Late">{content}</Table>
        </CadenceProvider>
      );
      const seed = render(
        surface(
          <TableBody>
            <TableRow>
              <TableCell>Baseline</TableCell>
            </TableRow>
          </TableBody>,
        ),
      );
      seed.unmount();
      const host = render(
        <CadenceProvider mode={mode} timeScale={1}>
          <p>Loading the ledger</p>
        </CadenceProvider>,
      );
      const before = calls.length;
      host.rerender(
        surface(
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>Fresh</strong>
              </TableCell>
            </TableRow>
          </TableBody>,
        ),
      );
      const started = calls.slice(before);
      expect(must(host.container.querySelector('[data-slot="table-container"]'))).toHaveAttribute("data-motion", mode);
      if (mode === "none") expect(started).toHaveLength(0);
      else {
        expect(started).toHaveLength(1);
        expect(started[0]?.frames.map((frame) => Object.keys(frame).sort())).toEqual([["opacity"], ["opacity"]]);
        expect(Number(started[0]?.timing.duration)).toBeGreaterThan(0);
      }
    } finally {
      restore();
    }
  });

  it.each(modes)("keeps verified paint on the token clock and caller paint immediate in %s", (mode) => {
    const plain = render(
      <CadenceProvider mode={mode} timeScale={1}>
        <Table aria-label="Verified">
          <TableBody>
            <TableRow>
              <TableCell>Plain</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        ,
      </CadenceProvider>,
    );
    const row = must(plain.container.querySelector<HTMLElement>('[data-slot="table-row"]'));
    const seconds = Number.parseFloat(row.style.transitionDuration);
    if (mode === "none") expect(seconds).toBe(0);
    else expect(seconds).toBeGreaterThan(0);
    expectMotionContract(mode, { parts: [row], policy: ["color"] });
    plain.unmount();

    const painted = render(
      <CadenceProvider mode={mode} timeScale={1}>
        <Table aria-label="Caller paint">
          <TableBody>
            <TableRow style={{ backgroundColor: "#eee" }}>
              <TableCell>Owned</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        ,
      </CadenceProvider>,
    );
    const owned = must(painted.container.querySelector<HTMLElement>('[data-slot="table-row"]'));
    expect(owned.style.transitionProperty).toBe("background-color, color");
    expect(Number.parseFloat(owned.style.transitionDuration)).toBe(0);
    painted.unmount();

    const typed = render(
      <CadenceProvider mode="full">
        <Table aria-label="Alignment utilities">
          <TableBody>
            <TableRow className="text-right">
              <TableCell>Aligned</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        ,
      </CadenceProvider>,
    );
    const aligned = must(typed.container.querySelector<HTMLElement>('[data-slot="table-row"]'));
    expect(Number.parseFloat(aligned.style.transitionDuration)).toBeGreaterThan(0);
  });

  it.each(modes)("keeps cell content native while editing is inherited in %s", (mode) => {
    const draw = (editable: boolean, value: string, other: string) => (
      <CadenceProvider mode={mode}>
        <div contentEditable={editable} suppressContentEditableWarning>
          <Table aria-label="Editor">
            <TableBody>
              <TableRow>
                <TableCell>{value}</TableCell>
                <TableCell>{other}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CadenceProvider>
    );
    const view = render(draw(true, "19", "fixed"));
    const cells = view.container.querySelectorAll<HTMLElement>('[data-slot="table-cell"]');
    const [cell, sibling] = cells;
    expect(cell).toBeTruthy();
    // The cell is the caller's own native text: no internal display host, no controller.
    expect(cell?.querySelector("[data-slot]")).toBeNull();
    const text = must(cell?.firstChild as Text | null);
    expect(text.data).toBe("19");
    // A user edit inside the editable context survives an unrelated re-render.
    text.replaceData(0, text.length, "Native buffer");
    document.getSelection()?.setBaseAndExtent(text, 3, text, 3);
    view.rerender(draw(true, "19", "fixed again"));
    expect(must(cell).firstChild).toBe(text);
    expect(text.data).toBe("Native buffer");
    expect(document.getSelection()?.anchorNode).toBe(text);
    expect(must(sibling).textContent).toBe("fixed again");
    // Leaving editing and revising the value is a plain native text commit, and the
    // cell element itself is retained.
    view.rerender(draw(false, "21", "fixed again"));
    expect(must(cell).firstChild).toBe(text);
    expect(text.data).toBe("21");
    expect(must(view.container.querySelector<HTMLElement>('[data-slot="table-row"]'))).toHaveAttribute(
      "data-motion",
      mode,
    );
    document.getSelection()?.removeAllRanges();
  });

  it.each(modes)("commits rapid revisions on the final cell value in %s", (mode) => {
    const draw = (value: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Table aria-label="Rapid">
          <TableBody>
            <TableRow>
              <TableCell>{value}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CadenceProvider>
    );
    const view = render(draw("Revision 1"));
    const cell = must(view.container.querySelector<HTMLElement>('[data-slot="table-cell"]'));
    for (const value of ["Revision 2", "Revision 3", "Revision 2", "Revision 4"]) view.rerender(draw(value));
    expect(view.container.querySelector('[data-slot="table-cell"]')).toBe(cell);
    expect(cell.textContent).toBe("Revision 4");
    expect(cell.querySelector("[data-slot]")).toBeNull();
  });

  it("keeps rich children, colspans and native controls untouched", () => {
    const child = <strong>Rich body</strong>;
    const view = render(
      <CadenceProvider mode="full">
        <Table aria-label="Rich">
          <TableBody>
            <TableRow>
              <TableCell colSpan={3}>
                {child}
                <input name="memo" defaultValue="native" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CadenceProvider>,
    );
    const cell = must(view.container.querySelector('[data-slot="table-cell"]'));
    expect(cell).toHaveAttribute("colspan", "3");
    expect(view.container.querySelector('[data-slot="table-text"]')).toBeNull();
    const rich = screen.getByText("Rich body");
    expect(screen.getByRole("textbox")).toHaveValue("native");
    view.rerender(
      <CadenceProvider mode="none">
        <Table aria-label="Rich">
          <TableBody>
            <TableRow>
              <TableCell colSpan={3}>
                {child}
                <input name="memo" defaultValue="native" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CadenceProvider>,
    );
    expect(screen.getByText("Rich body")).toBe(rich);
    expect(screen.getByRole("textbox")).toHaveValue("native");
    expect(cell).toHaveAttribute("colspan", "3");
  });
});
