import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/registry/cadence/dialog/dialog";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";

function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename project</DialogTitle>
        <DialogDescription>The URL stays the same.</DialogDescription>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

describe("Dialog", () => {
  it("opens from the trigger and exposes an accessible name", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Rename project" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-slot", "dialog-content");
    expect(dialog).toHaveAccessibleName("Rename project");
    expect(screen.getByText("The URL stays the same.")).toBeInTheDocument();
  });

  it("closes from a close control and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Rename project" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the scale outside full", async (mode, keepsScale) => {
    renderInMode(mode);
    await userEvent.click(screen.getByRole("button", { name: "Rename project" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-motion", mode);
    // The duration comes from the token, never from a literal: `data-motion="none"`
    // zeroes the variable on the element itself, which is what makes `none` instant.
    expect(dialog.className).toContain("duration-(--motion-duration-base)");
    expect(dialog.className.includes("scale-95")).toBe(keepsScale);

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toHaveAttribute("data-motion", mode);
    expect(overlay?.className).toContain("duration-(--motion-duration-fast)");
  });
});
