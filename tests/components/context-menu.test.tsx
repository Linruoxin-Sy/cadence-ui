import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/cadence/context-menu";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Demo({ mode, onEdit }: { mode?: Mode; onEdit?: () => void }) {
  return (
    <CadenceProvider mode={mode}>
      <ContextMenu>
        <ContextMenuTrigger tabIndex={0}>Right-click here</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Pull request</ContextMenuLabel>
          <ContextMenuItem onClick={onEdit}>
            Edit
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuCheckboxItem defaultChecked>Description</ContextMenuCheckboxItem>
          <ContextMenuRadioGroup defaultValue="comfortable">
            <ContextMenuRadioItem value="compact">Compact</ContextMenuRadioItem>
            <ContextMenuRadioItem value="comfortable">Comfortable</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Backlog</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
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

async function openSubmenu() {
  await userEvent.hover(screen.getByRole("menuitem", { name: "Move to" }));
  await waitFor(() => expect(pageSlot("context-menu-sub-content")).toBeInTheDocument());
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

  it("opens on the contextmenu event at the pointer and reports native menu roles", async () => {
    render(<Demo />);
    await openMenu();

    // Three plain items; the checkbox, the radio pair and the submenu trigger carry
    // their own roles, which is why this is not the item count of the demo.
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    expect(screen.getByRole("menuitemcheckbox", { name: "Description" })).toBeInTheDocument();
    expect(screen.getAllByRole("menuitemradio")).toHaveLength(2);
    expect(pageSlot("context-menu-label")).toHaveTextContent("Pull request");
    expect(pageSlot("context-menu-separator")).toBeInTheDocument();
  });

  it("carries the mode and the authored popup clock on the panel", async () => {
    render(<Demo />);
    await openMenu();

    const panel = pageSlot("context-menu-content");
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

    const panel = pageSlot("context-menu-content");
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
    expect(panel.className).not.toContain("data-[starting-style]");
  });

  it("zeroes the local clock and removes authored poses under none", async () => {
    render(<Demo mode="none" />);
    await openMenu();

    const panel = pageSlot("context-menu-content");
    expect(panel.style.getPropertyValue("--motion-duration-fast")).toBe("0s");
    expect(panel.className).not.toContain("opacity-0");
    expect(panel).toHaveAttribute("data-motion", "none");
  });

  it("restores full popup timing inside none and resolves caller state callbacks last", async () => {
    render(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full" timeScale={2}>
          <ContextMenu>
            <ContextMenuTrigger>Nested</ContextMenuTrigger>
            <ContextMenuContent className={() => "custom-popup"} style={() => ({ color: "red" })}>
              <ContextMenuItem>Item</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </CadenceProvider>
      </CadenceProvider>,
    );
    fireEvent.contextMenu(screen.getByText("Nested"));
    const menu = await screen.findByRole("menu");
    expect(menu.style.getPropertyValue("--motion-duration-fast")).toBe("0.32s");
    expect(menu).toHaveClass("custom-popup");
    expect(menu).toHaveStyle({ color: "rgb(255, 0, 0)" });
  });

  it("toggles a checkbox item without closing the menu", async () => {
    render(<Demo />);
    await openMenu();

    const item = screen.getByRole("menuitemcheckbox", { name: "Description" });
    expect(item).toHaveAttribute("aria-checked", "true");

    await userEvent.click(item);

    expect(item).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("moves the radio selection and keeps one mark scaled in", async () => {
    render(<Demo />);
    await openMenu();

    await userEvent.click(screen.getByRole("menuitemradio", { name: "Compact" }));

    expect(screen.getByRole("menuitemradio", { name: "Compact" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Comfortable" })).toHaveAttribute("aria-checked", "false");
  });

  it("opens a submenu from its row with its own registered sub-content slot", async () => {
    render(<Demo />);
    await openMenu();
    await openSubmenu();

    expect(within(pageSlot("context-menu-sub-content")).getByRole("menuitem", { name: "Backlog" })).toBeVisible();
    // The submenu branch renders the same exported surface and owns the same mode,
    // paint and geometry host as the root panel, with its own slot.
    const submenu = pageSlot("context-menu-sub-content");
    expect(submenu).toHaveAttribute("data-motion", "full");
    expect(submenu.getAttribute("data-cadence-color")).toContain("background-color");
    expect(submenu).not.toBe(pageSlot("context-menu-content"));
  });

  it("runs the item's own handler when one is given", async () => {
    let edits = 0;
    render(<Demo onEdit={() => (edits += 1)} />);
    await openMenu();

    await userEvent.click(screen.getByRole("menuitem", { name: /Edit/ }));

    expect(edits).toBe(1);
  });

  it("closes on Escape and returns focus to the right-click target", async () => {
    render(<Demo />);
    const trigger = screen.getByText("Right-click here");
    // The trigger is the right-click area, so it must itself be focusable for Base UI
    // to be able to restore the invocation target.
    trigger.focus();
    await openMenu();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("keeps the item's inset and destructive variants on data attributes", async () => {
    const { container } = render(
      <CadenceProvider mode="full">
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem inset>Inset</ContextMenuItem>
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </CadenceProvider>,
    );

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(container.ownerDocument.querySelector('[data-slot="context-menu-item"][data-inset="true"]')).toBeTruthy();
    expect(
      container.ownerDocument.querySelector('[data-slot="context-menu-item"][data-variant="destructive"]'),
    ).toBeTruthy();
  });

  it("keeps plain label text as its own owned display slot", async () => {
    render(<Demo />);
    await openMenu();

    for (const slot of [
      "context-menu-item-text",
      "context-menu-checkbox-item-text",
      "context-menu-radio-item-text",
      "context-menu-sub-trigger-text",
      "context-menu-label-text",
      "context-menu-shortcut-text",
    ])
      expect(pageSlot(slot)).toHaveAttribute("data-motion", "full");
  });

  it("keeps the in-group label as the group's accessible name with its owned slot", async () => {
    render(
      <CadenceProvider mode="full">
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>Grouped</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>Actions</ContextMenuLabel>
              <ContextMenuItem>Rename</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      </CadenceProvider>,
    );

    const group = await screen.findByRole("group", { name: "Actions" });
    expect(group).toBeInTheDocument();
    // The same authored host carries the slot, paint and text owner inside a group.
    expect(pageSlot("context-menu-label")).toHaveAttribute("data-slot", "context-menu-label");
    expect(pageSlot("context-menu-label-text")).toHaveTextContent("Actions");
    expect(pageSlot("context-menu-label")).toHaveAttribute("data-cadence-color", "color");
  });

  it("keeps sibling menus isolated on equal labels", async () => {
    render(
      <CadenceProvider mode="full" timeScale={0}>
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>First</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem style={{ backgroundColor: "#303030" }}>Edit</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>Second</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem style={{ backgroundColor: "#313131" }}>Edit</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </CadenceProvider>,
    );
    await waitFor(() => expect(document.querySelectorAll('[data-slot="context-menu-content"]')).toHaveLength(2));
    const items = [...document.querySelectorAll<HTMLElement>('[data-slot="context-menu-item"]')];
    const first = items[0];
    const second = items[1];
    expect(first).not.toBe(second);
    expect(first?.style.backgroundColor).toBe("rgb(48, 48, 48)");
    expect(second?.style.backgroundColor).toBe("rgb(49, 49, 49)");
  });

  it("settles a live full to reduced to none downgrade on one open menu", async () => {
    const draw = (next: Mode) => (
      <CadenceProvider mode={next}>
        <ContextMenu defaultOpen>
          <ContextMenuTrigger>Downgrade</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem style={{ backgroundColor: "#303030" }}>One</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    await screen.findByRole("menu");
    const item = pageSlot("context-menu-item");
    const panel = pageSlot("context-menu-content");

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

type OpenChange = NonNullable<React.ComponentProps<typeof ContextMenu>["onOpenChange"]>;

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  const text = frame.labels ? revised : original;
  const surface = frame.surface ? { backgroundColor: "#202020" } : undefined;
  const row = frame.row ? { backgroundColor: "#303030" } : undefined;
  const foreground = frame.foreground ? { color: "#123456" } : undefined;
  const rule = frame.separator ? { backgroundColor: "#444444" } : undefined;

  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <ContextMenu open={frame.open} onOpenChange={onOpenChange}>
        <ContextMenuTrigger>Right-click here</ContextMenuTrigger>
        <ContextMenuContent style={surface}>
          <ContextMenuLabel style={foreground}>{text.label}</ContextMenuLabel>
          <ContextMenuItem style={row}>{text.item}</ContextMenuItem>
          <ContextMenuShortcut style={foreground}>{text.shortcut}</ContextMenuShortcut>
          <ContextMenuCheckboxItem
            checked={frame.checked}
            style={row}
            onCheckedChange={() => {
              /* the frame owns the accepted value */
            }}
          >
            {text.checkbox}
          </ContextMenuCheckboxItem>
          <ContextMenuRadioGroup
            value={frame.value}
            onValueChange={() => {
              /* the frame owns the accepted value */
            }}
          >
            <ContextMenuRadioItem value="a" style={row}>
              {text.radio}
            </ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator style={rule} />
          <ContextMenuSub>
            <ContextMenuSubTrigger style={row}>{text.sub}</ContextMenuSubTrigger>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </CadenceProvider>
  );
}

describe("ContextMenu v2 owners", () => {
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
      const retained = open ? undefined : (details as { preventUnmountOnClose?: () => void }).preventUnmountOnClose;
      retained?.();
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
    await expectV2MotionAction("context-menu", "context-menu.label.change", mode, () => update({ labels: true }));

    // Each row owns its merged pointer/checked/disabled/destructive palette.
    await expectV2MotionAction("context-menu", "context-menu.item.colour", mode, () => update({ row: true }));
    // The popup shell owns its own surface, Label/Shortcut their foreground and the
    // Separator its rule.
    await expectV2MotionAction("context-menu", "context-menu.surface.colour", mode, () => update({ surface: true }));
    await expectV2MotionAction("context-menu", "context-menu.foreground.colour", mode, () =>
      update({ foreground: true }),
    );
    await expectV2MotionAction("context-menu", "context-menu.separator.colour", mode, () =>
      update({ separator: true }),
    );

    // A checkbox stays independent and the radio change is the same checked transaction.
    await expectV2MotionAction("context-menu", "context-menu.indicator.select", mode, () =>
      update({ checked: true, value: "a" }),
    );
    expect(screen.getByRole("menuitemcheckbox", { name: revised.checkbox })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: revised.radio })).toHaveAttribute("aria-checked", "true");

    // A committed content revision is one measured shell transaction.
    await expectV2MotionAction("context-menu", "context-menu.content.resize", mode, () => update({ labels: false }));

    await expectV2MotionAction("context-menu", "context-menu.content.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("context-menu", "context-menu.content.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // Base UI keeps the pointer-origin positioner, roving focus and typeahead; rich
    // content and composed quantities remain boundaries with no Cadence writer.
    await expectV2NativeBoundaries("context-menu", { container: document.body });
  });
});
