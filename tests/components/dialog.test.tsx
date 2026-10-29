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
});
