import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Demo({ mode, onEdit }: { mode?: Mode; onEdit?: () => void }) {
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

  it("carries the mode and the authored popup clock on the panel", async () => {
    render(<Demo />);
    await openMenu();

    const panel = pageSlot("dropdown-menu-content");
    expect(panel).toHaveAttribute("data-motion", "full");
    // Presence, geometry and paint are executors now: the panel keeps only layout classes.
    expect(panel.className).not.toContain("data-[starting-style]");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
    expect(panel.style.getPropertyValue("--motion-duration-fast")).toBe("0.16s");
    expect(panel.getAttribute("data-cadence-color")).toContain("background-color");
  });

  it("declares reduced without a travel or scale pose", async () => {
    render(<Demo mode="reduced" />);
    await openMenu();

    const panel = pageSlot("dropdown-menu-content");
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
    expect(panel.className).not.toContain("data-[starting-style]");
  });

  it("zeroes the local clock and removes authored poses under none", async () => {
    render(<Demo mode="none" />);
    await openMenu();

    const panel = pageSlot("dropdown-menu-content");
    expect(panel.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    expect(panel.className).not.toContain("opacity-0");
    expect(panel).toHaveAttribute("data-motion", "none");
  });

  it("restores full popup timing inside none and resolves caller state callbacks last", async () => {
    render(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full" timeScale={2}>
          <DropdownMenu>
            <DropdownMenuTrigger>Nested</DropdownMenuTrigger>
            <DropdownMenuContent className={() => "custom-popup"} style={() => ({ color: "red" })}>
              <DropdownMenuItem>Item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CadenceProvider>
      </CadenceProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nested" }));
    const menu = await screen.findByRole("menu");
    expect(menu.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
    expect(menu).toHaveClass("custom-popup");
    expect(menu).toHaveStyle({ color: "rgb(255, 0, 0)" });
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
    const mark = item.querySelector('[data-slot="dropdown-menu-checkbox-item-mark"]');
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
    // The submenu branch renders the same exported surface and declares the same mode.
    expect(pageSlot("dropdown-menu-sub-content")).toHaveAttribute("data-motion", "full");
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

  it("keeps plain label text as its own owned display slot", async () => {
    render(<Demo />);
    await openMenu();

    for (const slot of [
      "dropdown-menu-item-text",
      "dropdown-menu-checkbox-item-text",
      "dropdown-menu-radio-item-text",
      "dropdown-menu-sub-trigger-text",
      "dropdown-menu-label-text",
      "dropdown-menu-shortcut-text",
    ])
      expect(pageSlot(slot)).toHaveAttribute("data-motion", "full");
  });

  it("keeps the in-group label as the group's accessible name with its owned slot", async () => {
    render(
      <CadenceProvider mode="full">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Grouped</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Rename</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CadenceProvider>,
    );

    const group = await screen.findByRole("group", { name: "Actions" });
    expect(group).toBeInTheDocument();
    // The same authored host carries the slot, paint and text owner inside a group.
    expect(pageSlot("dropdown-menu-label")).toHaveAttribute("data-slot", "dropdown-menu-label");
    expect(pageSlot("dropdown-menu-label-text")).toHaveTextContent("Actions");
    expect(pageSlot("dropdown-menu-label")).toHaveAttribute("data-cadence-color", "color");
  });
});

/** Menu parts portal into `document.body`, so a container query would find nothing. */
function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}

it.each(modes)("asserts the shared %s motion contract", async (mode) => {
  render(<Demo mode={mode} />);
  await openMenu();
  expectMotionContract(mode, { policy: ["color"] });
});

type Frame = {
  open: boolean;
  row: boolean;
  surface: boolean;
  foreground: boolean;
  separator: boolean;
  labels: boolean;
  checked: boolean;
  value: "" | "a";
};

const original = {
  label: "Pull request",
  item: "Edit",
  shortcut: "⌘E",
  checkbox: "Description",
  radio: "Compact",
  sub: "Move to",
};

const revised = {
  label: "Pull requests",
  item: "Rename",
  shortcut: "⌘R",
  checkbox: "Description shown",
  radio: "Compact rows",
  sub: "Move into",
};

type OpenChange = NonNullable<React.ComponentProps<typeof DropdownMenu>["onOpenChange"]>;

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  const text = frame.labels ? revised : original;
  const surface = frame.surface ? { backgroundColor: "#202020" } : undefined;
  const row = frame.row ? { backgroundColor: "#303030" } : undefined;
  const foreground = frame.foreground ? { color: "#123456" } : undefined;
  const rule = frame.separator ? { backgroundColor: "#444444" } : undefined;

  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <DropdownMenu open={frame.open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent style={surface}>
          <DropdownMenuLabel style={foreground}>{text.label}</DropdownMenuLabel>
          <DropdownMenuItem style={row}>{text.item}</DropdownMenuItem>
          <DropdownMenuShortcut style={foreground}>{text.shortcut}</DropdownMenuShortcut>
          <DropdownMenuCheckboxItem
            checked={frame.checked}
            style={row}
            onCheckedChange={() => {
              /* the frame owns the accepted value */
            }}
          >
            {text.checkbox}
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup
            value={frame.value}
            onValueChange={() => {
              /* the frame owns the accepted value */
            }}
          >
            <DropdownMenuRadioItem value="a" style={row}>
              {text.radio}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator style={rule} />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger style={row}>{text.sub}</DropdownMenuSubTrigger>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </CadenceProvider>
  );
}

describe("DropdownMenu v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned action in %s", async (mode) => {
    let frame: Frame = {
      open: true,
      row: false,
      surface: false,
      foreground: false,
      separator: false,
      labels: false,
      checked: false,
      value: "",
    };
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (open, details) => {
      // Keep the closing surface mounted so the owned exit can actually run; Base UI
      // still decides when the portal may leave after its own completion.
      if (!open) details.preventUnmountOnClose();
      frame = { ...frame, open };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };

    view = render(scene());
    await screen.findByRole("menu");

    // Plain owned labels: item, checkbox, radio, sub-trigger, label and shortcut.
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.label.change", mode, () => update({ labels: true }));

    // Each row owns its merged pointer/checked/disabled/destructive palette.
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.item.colour", mode, () => update({ row: true }));
    // The popup shell owns its own surface, Label/Shortcut their foreground and the
    // Separator its rule.
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.surface.colour", mode, () => update({ surface: true }));
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.foreground.colour", mode, () =>
      update({ foreground: true }),
    );
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.separator.colour", mode, () =>
      update({ separator: true }),
    );

    // A checkbox stays independent and the radio change is the same checked transaction.
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.indicator.select", mode, () =>
      update({ checked: true, value: "a" }),
    );
    expect(screen.getByRole("menuitemcheckbox", { name: revised.checkbox })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: revised.radio })).toHaveAttribute("aria-checked", "true");

    // A committed content revision is one measured shell transaction.
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.content.resize", mode, () => update({ labels: false }));

    await expectV2MotionAction("dropdown-menu", "dropdown-menu.content.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("dropdown-menu", "dropdown-menu.content.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // Base UI keeps placement, roving focus and typeahead; rich content and composed
    // quantities remain boundaries with no Cadence writer.
    await expectV2NativeBoundaries("dropdown-menu", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on one open menu", async () => {
    const draw = (next: Mode) => (
      <CadenceProvider mode={next}>
        <DropdownMenu open>
          <DropdownMenuTrigger>Downgrade</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem style={{ backgroundColor: "#303030" }}>One</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    await screen.findByRole("menu");
    const item = pageSlot("dropdown-menu-item");
    const panel = pageSlot("dropdown-menu-content");

    view.rerender(draw("reduced"));
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(item).toHaveAttribute("data-motion", "reduced");

    view.rerender(draw("none"));
    expect(panel).toHaveAttribute("data-motion", "none");
    expect(item).toHaveAttribute("data-motion", "none");
    expect(panel.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    for (const node of [panel, item])
      expect(node.getAnimations?.().filter((animation) => "animationName" in animation) ?? []).toHaveLength(0);
  });

  it("keeps sibling menus isolated on equal labels", async () => {
    render(
      <CadenceProvider mode="full" timeScale={0}>
        <DropdownMenu open>
          <DropdownMenuTrigger>First</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem style={{ backgroundColor: "#303030" }}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu open>
          <DropdownMenuTrigger>Second</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem style={{ backgroundColor: "#313131" }}>Edit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CadenceProvider>,
    );
    await waitFor(() => expect(document.querySelectorAll('[data-slot="dropdown-menu-content"]')).toHaveLength(2));
    const items = [...document.querySelectorAll<HTMLElement>('[data-slot="dropdown-menu-item"]')];
    const first = items[0];
    const second = items[1];
    expect(first).not.toBe(second);
    expect(first?.style.backgroundColor).toBe("rgb(48, 48, 48)");
    expect(second?.style.backgroundColor).toBe("rgb(49, 49, 49)");
  });
});
