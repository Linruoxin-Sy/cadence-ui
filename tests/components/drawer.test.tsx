import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/cadence/drawer/drawer";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";

function Example({ showSwipeHandle = true }: { showSwipeHandle?: boolean } = {}) {
  return (
    <Drawer showSwipeHandle={showSwipeHandle}>
      <DrawerTrigger render={<Button variant="outline" />}>Move conversation</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move conversation</DrawerTitle>
          <DrawerDescription>Drag down to dismiss.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const popup = () => document.querySelector('[data-slot="drawer-popup"]');

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: "Move conversation" }));
  return screen.findByRole("dialog");
}

describe("Drawer", () => {
  it("opens from the trigger with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = await open();
    expect(dialog).toHaveAccessibleName("Move conversation");
    expect(popup()).toHaveAttribute("data-slot", "drawer-popup");
    expect(popup()).toHaveAttribute("data-swipe-axis", "y");

    for (const slot of [
      "drawer-portal",
      "drawer-overlay",
      "drawer-swipe-handle",
      "drawer-content",
      "drawer-header",
      "drawer-title",
      "drawer-description",
      "drawer-footer",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("hides the swipe handle unless it is asked for", async () => {
    render(<Example showSwipeHandle={false} />);
    await open();
    expect(document.querySelector('[data-slot="drawer-swipe-handle"]')).toBeNull();
  });

  it("closes from its close control and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Move conversation" });
    await open();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the closed-state slide outside full", async (mode, keepsSlide) => {
    renderInMode(mode);
    await open();

    const shell = popup();
    expect(shell).toHaveAttribute("data-motion", mode);
    expect(shell?.className).toContain("duration-(--motion-duration-slow)");
    // The drag follow itself stays: it is direct manipulation, not authored motion.
    expect(shell?.className).toContain("--drawer-swipe-movement-y");
    expect(shell?.className.includes("--closed-transform")).toBe(keepsSlide);
    expect(shell?.className.includes("data-[starting-style]:transform-(--closed-transform)")).toBe(keepsSlide);

    const overlay = document.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toHaveAttribute("data-motion", mode);
    expect(overlay?.className).toContain("duration-(--motion-duration-fast)");
  });
});
