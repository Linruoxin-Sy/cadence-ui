import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/registry/cadence/context-menu";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function Demo({ mode }: { mode?: "full" | "reduced" | "none" }) {
  return (
    <CadenceProvider mode={mode}>
      <ContextMenu>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>
            Open
            <ContextMenuShortcut>↵</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuCheckboxItem defaultChecked>Grid</ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </CadenceProvider>
  );
}

async function openMenu() {
  fireEvent.contextMenu(screen.getByText("Right-click here"));
  await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
}

describe("ContextMenu", () => {
  it("renders the right-click area with its slot and mode", () => {
    render(<Demo />);
    const trigger = screen.getByText("Right-click here");

    expect(trigger).toHaveAttribute("data-slot", "context-menu-trigger");
    expect(trigger).toHaveAttribute("data-motion", "full");
    // A context menu has no visible trigger, so the area it listens on must not be
    // selectable: a drag across it would otherwise start a text selection.
    expect(trigger.className).toContain("select-none");
  });

  it("opens on the contextmenu event at the pointer", async () => {
    render(<Demo />);
    await openMenu();

    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(screen.getByRole("menuitemcheckbox", { name: "Grid" })).toBeInTheDocument();
    expect(pageSlot("context-menu-separator")).toBeInTheDocument();
  });

  it("carries the popup token and the mode on the panel", async () => {
    render(<Demo />);
    await openMenu();

    const panel = pageSlot("context-menu-content");
    expect(panel).toHaveAttribute("data-motion", "full");
    expect(panel.className).toContain("duration-(--motion-duration-fast)");
    expect(panel.className).toContain("data-[starting-style]:scale-(--motion-scale-in)");
  });

  it("drops only the scale under reduced motion", async () => {
    render(<Demo mode="reduced" />);
    await openMenu();

    const panel = pageSlot("context-menu-content");
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).toContain("data-[starting-style]:opacity-0");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
  });

  it("keeps the transition classes under none, where the duration is zero", async () => {
    render(<Demo mode="none" />);
    await openMenu();

    expect(pageSlot("context-menu-content")).toHaveAttribute("data-motion", "none");
  });

  it("toggles a checkbox item without closing the menu", async () => {
    render(<Demo />);
    await openMenu();

    const item = screen.getByRole("menuitemcheckbox", { name: "Grid" });
    expect(item).toHaveAttribute("aria-checked", "true");

    await userEvent.click(item);

    expect(item).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<Demo />);
    await openMenu();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });
});

/** Menu parts portal into `document.body`, so a container query would find nothing. */
function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}
