import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/registry/cadence/alert-dialog/alert-dialog";
import { Button } from "@/registry/cadence/button/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";

function Example({ onConfirm }: { onConfirm?: () => void } = {}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>Delete project</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <span aria-hidden="true">!</span>
          </AlertDialogMedia>
          <AlertDialogTitle>Delete project</AlertDialogTitle>
          <AlertDialogDescription>Every deployment goes with it.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep project</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
  await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
  return screen.findByRole("alertdialog");
}

describe("AlertDialog", () => {
  it("opens as an alert dialog with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    const dialog = await open();
    expect(dialog).toHaveAttribute("data-slot", "alert-dialog-content");
    expect(dialog).toHaveAccessibleName("Delete project");
    expect(dialog).toHaveAttribute("data-size", "default");
    // Focus lands on the cancel control, not on the destructive one: a stray Enter
    // must not be able to confirm the action.
    expect(screen.getByRole("button", { name: "Keep project" })).toHaveFocus();

    for (const slot of [
      "alert-dialog-header",
      "alert-dialog-media",
      "alert-dialog-title",
      "alert-dialog-description",
      "alert-dialog-footer",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("confirms through the action, closes, and returns focus to the trigger", async () => {
    const onConfirm = vi.fn();
    render(<Example onConfirm={onConfirm} />);
    const trigger = screen.getByRole("button", { name: "Delete project" });
    await open();

    const action = screen.getByRole("button", { name: "Delete" });
    expect(action).toHaveAttribute("data-slot", "alert-dialog-action");
    await userEvent.click(action);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("cancels through its own control", async () => {
    render(<Example />);
    await open();

    const cancel = screen.getByRole("button", { name: "Keep project" });
    expect(cancel).toHaveAttribute("data-slot", "alert-dialog-cancel");
    await userEvent.click(cancel);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("refuses an outside press, which is what makes it an alert dialog", async () => {
    render(<Example />);
    await open();

    await userEvent.click(document.body);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("cancels on Escape, the one dismissal path besides the two buttons", async () => {
    render(<Example />);
    await open();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the scale outside full", async (mode, keepsScale) => {
    renderInMode(mode);
    const dialog = await open();

    expect(dialog).toHaveAttribute("data-motion", mode);
    // The duration comes from the token, never from a literal: `data-motion="none"`
    // zeroes the variable on the element itself, which is what makes `none` instant.
    expect(dialog.className).toContain("duration-(--motion-duration-base)");
    expect(dialog.className.includes("scale-(--motion-scale-in)")).toBe(keepsScale);

    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]');
    expect(overlay).toHaveAttribute("data-motion", mode);
    expect(overlay?.className).toContain("duration-(--motion-duration-fast)");
  });
});
