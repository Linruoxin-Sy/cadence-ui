import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import type * as React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/registry/cadence/command";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Actions({ onSelect = () => {} }: { onSelect?: (value: string) => void }) {
  return (
    <Command label="Actions">
      <CommandInput placeholder="Search actions" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Workspace">
          <CommandItem value="projects" onSelect={onSelect}>
            Projects<CommandShortcut>Ctrl+P</CommandShortcut>
          </CommandItem>
          <CommandItem value="archive" disabled>
            Archive
          </CommandItem>
          <CommandItem value="settings" keywords={["preferences"]} onSelect={onSelect}>
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator alwaysRender />
      </CommandList>
    </Command>
  );
}
describe("Command", () => {
  it("keeps native and custom input composition and forwards user classes", () => {
    const { rerender } = render(
      <Command>
        <CommandInput asChild={false} className="text-lg">
          <span>ignored</span>
        </CommandInput>
        <CommandList />
      </Command>,
    );
    expect(screen.getByRole("combobox").tagName).toBe("INPUT");
    expect(screen.getByRole("combobox")).toHaveClass("text-lg");
    rerender(
      <Command label="Custom search">
        <CommandInput asChild>
          <input aria-label="Custom search" />
        </CommandInput>
        <CommandList />
      </Command>,
    );
    expect(screen.getByRole("combobox", { name: "Custom search" })).toHaveAttribute("data-slot", "command-input");
  });

  it("renders upstream slots and an accessible combobox", () => {
    const { container } = render(<Actions />);
    for (const slot of [
      "command",
      "command-input-wrapper",
      "command-input",
      "command-list",
      "command-group",
      "command-item",
      "command-shortcut",
      "command-separator",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    expect(screen.getByRole("combobox")).toHaveAccessibleName("Actions");
    expect(screen.getByRole("option", { name: "Archive" })).toHaveAttribute("aria-disabled", "true");
  });
  it("filters keywords, exposes empty results, and recovers", async () => {
    render(<Actions />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "preferences");
    expect(screen.getByRole("option", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Projects/ })).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, "zzzzzz");
    expect(screen.getByText("No results.")).toHaveAttribute("data-slot", "command-empty-text");
    expect(screen.getByText("No results.").closest('[data-slot="command-empty"]')).not.toBeNull();
    await userEvent.clear(input);
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });
  it("skips disabled actions on the keyboard and runs onSelect", async () => {
    const onSelect = vi.fn();
    render(<Actions onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.keyboard("{Home}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("settings");
  });
  it.each(["full", "reduced", "none"] as const)("inherits %s popup motion and names the portal", async (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <CommandDialog open>
          <Actions />
        </CommandDialog>
      </CadenceProvider>,
    );
    const popup = await screen.findByRole("dialog", { name: "Command Palette" });
    expect(popup).toHaveAccessibleDescription("Search for a command to run...");
    expectMotionContract(mode, { parts: [popup] });
    expect(popup).toHaveAttribute("data-motion", mode);
    expect(popup.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(popup.className).not.toContain("scale-(--motion-scale-in)");
    expect(popup.style.getPropertyValue("--motion-duration-base")).toBe(
      mode === "none" ? "0s" : mode === "reduced" ? "0.132s" : "0.22s",
    );
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveAttribute("data-motion", mode);
    expect(document.querySelector('[data-slot="command"]')).toHaveAttribute("data-motion", mode);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
  });
  it("forwards dialog dismissal and opt-in close control", async () => {
    const onOpenChange = vi.fn();
    render(
      <CommandDialog open onOpenChange={onOpenChange} showCloseButton title="Find action">
        <Actions />
      </CommandDialog>,
    );
    await screen.findByRole("dialog", { name: "Find action" });
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });
});

/** A presence boundary the palette can be flipped through without an exit mount. */
const presence = (present: boolean) => ({
  id: "retained-command",
  initial: false as const,
  isPresent: present,
  register: () => () => {},
  onExitComplete: () => {},
});

type Frame = {
  open: boolean;
  present: boolean;
  title: string;
  item: string;
  shortcut: string;
  empty: string;
  root?: React.CSSProperties;
  itemPaint?: React.CSSProperties;
  shortcutPaint?: React.CSSProperties;
  separator?: React.CSSProperties;
  emptyPaint?: React.CSSProperties;
};

const initialFrame = (): Frame => ({
  open: true,
  present: false,
  title: "Workspace commands",
  item: "Projects",
  shortcut: "⌘P",
  empty: "No commands found.",
});

/** One composed palette whose every command-owned region has a caller revision. */
function Palette({
  mode,
  frame,
  onOpenChange,
}: {
  mode: Mode;
  frame: Frame;
  onOpenChange: DialogProps["onOpenChange"];
}) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <PresenceContext.Provider value={presence(frame.present)}>
        <CommandDialog open={frame.open} onOpenChange={onOpenChange} title={frame.title}>
          <Command label="Palette actions" style={frame.root}>
            <CommandInput placeholder="Search actions" />
            <CommandList>
              <CommandGroup heading="Workspace">
                <CommandItem value="projects" style={frame.itemPaint}>
                  {frame.item}
                  <CommandShortcut style={frame.shortcutPaint}>{frame.shortcut}</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator alwaysRender style={frame.separator} />
              <CommandEmpty style={frame.emptyPaint}>{frame.empty}</CommandEmpty>
            </CommandList>
          </Command>
        </CommandDialog>
      </PresenceContext.Provider>
    </CadenceProvider>
  );
}

type DialogProps = React.ComponentProps<typeof CommandDialog>;
type OpenChange = NonNullable<DialogProps["onOpenChange"]>;

function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}

describe("Command v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("fades the inline root and the composed frame in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(present)}>
          <Command label="Inline actions">
            <CommandInput placeholder="Search inline actions" />
            <CommandList>
              <CommandGroup heading="Inline">
                <CommandItem value="one">One</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(false));
    // The root insertion and the composed Input Group frame insertion are separate
    // writers on separate hosts; neither replays for the other.
    await expectV2MotionAction("command", "command.root.enter", mode, () => view.rerender(draw(true)));
    view.rerender(draw(false));
    await expectV2MotionAction("command", "command.input-frame.enter", mode, () => view.rerender(draw(true)));
    expect(pageSlot("input-group")).toHaveAttribute("data-motion", mode);
    expect(pageSlot("command")).toHaveAttribute("data-motion", mode);
  });

  it.each(modes)("executes every composed palette action in %s", async (mode) => {
    let frame = initialFrame();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (open, details) => {
      if (!open) details.preventUnmountOnClose();
      frame = { ...frame, open };
      view.rerender(scene());
    };
    const scene = () => <Palette mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };

    view = render(scene());
    await screen.findByRole("dialog");
    const owned = async (binding: string, run: () => void | Promise<void>) => {
      try {
        await expectV2MotionAction("command", binding, mode, run);
      } catch (error) {
        throw new Error(`${binding}: ${(error as Error).message}`);
      }
    };

    // The composed Dialog keeps its own panel paint and title foreground.
    await owned("command.dialog.colour", () => {
      pageSlot("dialog-content").style.backgroundColor = "#242424";
    });
    await owned("command.dialog-title.colour", () => {
      pageSlot("dialog-title").style.color = "#123456";
    });
    // The screen-reader-only palette name is Dialog's own changed-run slot.
    await owned("command.dialog-title-text.replace", () => update({ title: "Renamed commands" }));

    // One owner per item merges the row and hazard-hint palette.
    await owned("command.item.colour", () =>
      update({
        itemPaint: { backgroundColor: "#313131", color: "#e0e0e0" },
        shortcutPaint: { backgroundColor: "#313131", color: "#ededed" },
      }),
    );
    // The root, the input divider and the separator rule are separate surfaces.
    await owned("command.surface.colour", () => {
      update({ root: { backgroundColor: "#232323" }, separator: { backgroundColor: "#444444" } });
      pageSlot("command-input-wrapper").style.borderBottomColor = "#555555";
    });
    // The composed Input Group frame keeps its own surface owner.
    await owned("command.input-frame.colour", () => {
      pageSlot("input-group").style.backgroundColor = "#777777";
    });

    // Item and shortcut strings replace only their changed runs.
    await owned("command.label.replace", () => update({ item: "Workspace files", shortcut: "⌘⇧P" }));

    // The empty region only exists on a miss, so it owns its own paint and text.
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "zzzz");
    expect(pageSlot("command-empty")).toBeInTheDocument();
    await owned("command.empty-surface.colour", () => update({ emptyPaint: { backgroundColor: "#2a2a2a" } }));
    await owned("command.empty-label.replace", () => update({ empty: "No matching commands." }));

    // Dialog alone owns the closing fade, modality release and focus return.
    await expectV2MotionAction("command", "command.dialog.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("command", "command.dialog.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // The native editor, the native result scroller and every identity-only
    // region keep no Cadence writer.
    await expectV2NativeBoundaries("command", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on one palette", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <Command label="Downgrade">
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandGroup heading="One">
              <CommandItem value="one">One</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const root = pageSlot("command");
    const item = pageSlot("command-item");
    expect(root.style.transitionDuration).not.toBe("0s");

    view.rerender(draw("reduced"));
    expect(root).toHaveAttribute("data-motion", "reduced");
    expect(item).toHaveAttribute("data-motion", "reduced");

    view.rerender(draw("none"));
    expect(root).toHaveAttribute("data-motion", "none");
    expect(root.style.transitionDuration).toBe("0s");
    for (const node of [root, item]) expect(node.getAnimations?.() ?? []).toHaveLength(0);
  });

  it("keeps sibling palettes isolated and their labels identity-stable", async () => {
    render(
      <CadenceProvider mode="full" timeScale={0}>
        <Command label="First" style={{ backgroundColor: "#303030" }}>
          <CommandList>
            <CommandGroup heading="First">
              <CommandItem value="one">One</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
        <Command label="Second" style={{ backgroundColor: "#313131" }}>
          <CommandList>
            <CommandGroup heading="Second">
              <CommandItem value="one">One</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CadenceProvider>,
    );
    const roots = [...document.querySelectorAll<HTMLElement>('[data-slot="command"]')];
    expect(roots).toHaveLength(2);
    expect(roots[0]?.style.backgroundColor).toBe("rgb(48, 48, 48)");
    expect(roots[1]?.style.backgroundColor).toBe("rgb(49, 49, 49)");
    // A shortcut hint is a string, never a parsed quantity.
    expect(document.querySelectorAll('[data-slot="command-item-text"]')).toHaveLength(2);
    expect(document.querySelector('[data-slot="command-item-number"]')).toBeNull();
  });
});
