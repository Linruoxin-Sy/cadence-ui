import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
    expect(screen.getByText("No results.")).toHaveAttribute("data-slot", "command-empty");
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
    expect(popup.className.includes("scale-(--motion-scale-in)")).toBe(mode === "full");
    expect(popup.className).toContain("duration-(--motion-duration-base)");
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
