import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/registry/cadence/menubar";

function Demo({ mode }: { mode?: "full" | "reduced" | "none" }) {
  return (
    <CadenceProvider mode={mode}>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">Delete</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem defaultChecked>Sidebar</MenubarCheckboxItem>
            <MenubarRadioGroup defaultValue="comfortable">
              <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
              <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </CadenceProvider>
  );
}

describe("Menubar", () => {
  it("renders the bar as a menubar with one tab stop", () => {
    render(<Demo />);

    const bar = screen.getByRole("menubar");
    expect(bar).toHaveAttribute("data-slot", "menubar");
    expect(bar).toHaveAttribute("data-motion", "full");
    expect(screen.getAllByRole("menuitem", { expanded: false })).toHaveLength(2);
  });

  it("opens a menu from its trigger", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "File" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /Save/ })).toHaveAttribute("data-slot", "menubar-item");
  });

  it("keeps the menubar slots on the parts it composes", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "View" }));

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(pageSlot("menubar-checkbox-item")).toBeInTheDocument();
    expect(pageSlot("menubar-radio-group")).toBeInTheDocument();
    expect(pageSlot("menubar-radio-item")).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Sidebar" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves to the next menu with ArrowRight once one is open", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    await userEvent.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute("aria-expanded", "true"),
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "Sidebar" })).toBeInTheDocument();
  });

  it("carries the mode from the provider onto the bar and its panel", async () => {
    render(<Demo mode="reduced" />);

    expect(screen.getByRole("menubar")).toHaveAttribute("data-motion", "reduced");
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    const panel = pageSlot("menubar-content");
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
  });

  it("renders no transition classes of its own on the bar", () => {
    render(<Demo />);
    // The bar is structure: switching menus replaces one panel with another and there is
    // no shared element to animate, so `transition-` on the bar would be decoration.
    expect(screen.getByRole("menubar").className).not.toContain("transition-");
  });
});

/** Menu parts portal into `document.body`, so a container query would find nothing. */
function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}
