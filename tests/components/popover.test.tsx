import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/cadence/popover";

function Example() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Visible columns</PopoverTitle>
          <PopoverDescription>Three of five columns are shown.</PopoverDescription>
        </PopoverHeader>
        <Button>Reset</Button>
      </PopoverContent>
    </Popover>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: "Visible columns" }));
  return screen.findByRole("dialog");
}

describe("Popover", () => {
  it("opens from the trigger with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const popup = await open();
    expect(popup).toHaveAttribute("data-slot", "popover-content");
    expect(popup).toHaveAccessibleName("Visible columns");
    expect(popup).toHaveAccessibleDescription("Three of five columns are shown.");

    for (const slot of ["popover-header", "popover-title", "popover-description"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }

    // The trigger reports the state it controls, not just the fact that it opens something.
    const trigger = screen.getByRole("button", { name: "Visible columns" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", popup.id);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Visible columns" });
    await open();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on an outside press, unlike an alert dialog", async () => {
    render(<Example />);
    await open();

    await userEvent.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the scale outside full", async (mode, keepsScale) => {
    renderInMode(mode);
    const popup = await open();

    expect(popup).toHaveAttribute("data-motion", mode);
    // Both the timing and the enter scale are tokens: `none` zeroes the duration on
    // the element itself, and the scale class is a JSX branch, not a media query.
    expect(popup.className).toContain("duration-(--motion-duration-fast)");
    expect(popup.className).toContain("origin-(--transform-origin)");
    expect(popup.className.includes("scale-(--motion-scale-in)")).toBe(keepsScale);
  });
});
