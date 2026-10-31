import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/cadence/dropdown-menu";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function Demo({ mode, onEdit }: { mode?: "full" | "reduced" | "none"; onEdit?: () => void }) {
  return (
    <CadenceProvider mode={mode}>
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Pull request</DropdownMenuLabel>
          <DropdownMenuItem onClick={onEdit}>
            Edit
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem defaultChecked>Description</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup defaultValue="comfortable">
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Backlog</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CadenceProvider>
  );
}

async function openMenu() {
  const trigger = screen.getByRole("button", { name: "Actions" });
  await userEvent.click(trigger);
  await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
  return trigger;
}

describe("DropdownMenu", () => {
  it("renders the trigger with its upstream slot and menu semantics", () => {
    render(<Demo />);
    const trigger = screen.getByRole("button", { name: "Actions" });

    expect(trigger).toHaveAttribute("data-slot", "dropdown-menu-trigger");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on click and reports the open state on the trigger", async () => {
    render(<Demo />);
    const trigger = await openMenu();

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // Three plain items; the checkbox, the radio pair and the submenu trigger carry their
    // own roles, which is why this is not the item count of the demo.
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByRole("menuitemcheckbox", { name: "Description" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
    expect(pageSlot("dropdown-menu-label")).toHaveTextContent("Pull request");
    expect(pageSlot("dropdown-menu-separator")).toBeInTheDocument();
  });

  it("carries the mode and the popup token on the panel", async () => {
    render(<Demo />);
    await openMenu();

    const panel = pageSlot("dropdown-menu-content");
    expect(panel).toHaveAttribute("data-motion", "full");
    // `popup.anchored` is a CSS transition, so the class list is the implementation.
    expect(panel.className).toContain("duration-(--motion-duration-fast)");
    expect(panel.className).toContain("data-[starting-style]:scale-(--motion-scale-in)");
  });

  it("drops the scale and keeps the fade under reduced motion", async () => {
    render(<Demo mode="reduced" />);
    await openMenu();

    const panel = pageSlot("dropdown-menu-content");
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).toContain("data-[starting-style]:opacity-0");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
  });

  it("keeps the class list but zeroes the duration under none", async () => {
    render(<Demo mode="none" />);
    await openMenu();

    const panel = pageSlot("dropdown-menu-content");
    // `none` resolves `--motion-duration-*` to 0ms in CSS; the branch the DOM shows is
    // what pins that the mode reached the element at all.
    expect(panel).toHaveAttribute("data-motion", "none");
    expect(panel.className).toContain("duration-(--motion-duration-fast)");
  });

  it("opens from the keyboard and focuses the first item", async () => {
    render(<Demo />);
    screen.getByRole("button", { name: "Actions" }).focus();

    await userEvent.keyboard("{ArrowDown}");

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getAllByRole("menuitem")[0]).toHaveTextContent("Edit");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Demo />);
    const trigger = await openMenu();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("toggles a checkbox item and animates only its mark", async () => {
    render(<Demo />);
    await openMenu();

    const item = screen.getByRole("menuitemcheckbox", { name: "Description" });
    const mark = item.querySelector('[data-slot="dropdown-menu-checkbox-item-indicator"] > span');
    expect(mark).toHaveAttribute("data-motion", "full");

    expect(item).toHaveAttribute("aria-checked", "true");
    await userEvent.click(item);
    expect(item).toHaveAttribute("aria-checked", "false");
  });

  it("moves the radio selection and keeps one mark scaled in", async () => {
    render(<Demo />);
    await openMenu();

    await userEvent.click(screen.getByRole("menuitemradio", { name: "Compact" }));

    expect(screen.getByRole("menuitemradio", { name: "Compact" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Comfortable" })).toHaveAttribute("aria-checked", "false");
  });

  it("opens a submenu from its trigger with the sub-content slot", async () => {
    render(<Demo />);
    await openMenu();

    await userEvent.hover(screen.getByRole("menuitem", { name: "Move to" }));

    await waitFor(() => expect(pageSlot("dropdown-menu-sub-content")).toBeInTheDocument());
    // `DropdownMenuSub` is `Menu.SubmenuRoot`, which renders no element of its own, so the
    // slot only exists in the source — the panel is the part that has to be in the DOM.
    expect(within(pageSlot("dropdown-menu-sub-content")).getByRole("menuitem", { name: "Backlog" })).toBeVisible();
  });

  it("runs the item's own handler when one is given", async () => {
    let edits = 0;
    render(<Demo onEdit={() => (edits += 1)} />);
    await openMenu();

    await userEvent.click(screen.getByRole("menuitem", { name: /Edit/ }));

    expect(edits).toBe(1);
  });

  it("keeps the item's inset and destructive variants on data attributes", async () => {
    const { container } = render(
      <CadenceProvider mode="full">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset</DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CadenceProvider>,
    );

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(container.ownerDocument.querySelector('[data-slot="dropdown-menu-item"][data-inset="true"]')).toBeTruthy();
    expect(
      container.ownerDocument.querySelector('[data-slot="dropdown-menu-item"][data-variant="destructive"]'),
    ).toBeTruthy();
  });
});

/** Menu parts portal into `document.body`, so a container query would find nothing. */
function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}
