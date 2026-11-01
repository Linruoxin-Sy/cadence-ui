import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/cadence/sheet";

function Example({ side }: { side?: "top" | "right" | "bottom" | "left" } = {}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open filters</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Applied to this view only.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Reset</SheetClose>
          <SheetClose render={<Button />}>Apply filters</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
  await userEvent.click(screen.getByRole("button", { name: "Open filters" }));
  return screen.findByRole("dialog");
}

describe("Sheet", () => {
  it("opens from the trigger with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const sheet = await open();
    expect(sheet).toHaveAttribute("data-slot", "sheet-content");
    expect(sheet).toHaveAttribute("data-side", "right");
    expect(sheet).toHaveAccessibleName("Filters");
    expect(sheet.className).toContain("right-0");

    for (const slot of [
      "sheet-overlay",
      "sheet-portal",
      "sheet-header",
      "sheet-title",
      "sheet-description",
      "sheet-footer",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it.each([
    ["left", "-translate-x-full", "left-0"],
    ["top", "-translate-y-full", "top-0"],
    ["bottom", "translate-y-full", "bottom-0"],
  ] as const)("carries the %s placement", async (side, slide, placement) => {
    render(<Example side={side} />);
    const sheet = await open();

    expect(sheet).toHaveAttribute("data-side", side);
    expect(sheet.className).toContain(placement);
    expect(sheet.className).toContain(slide);
  });

  it("closes from its close control and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await open();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the slide outside full", async (mode, keepsSlide) => {
    renderInMode(mode);
    const sheet = await open();

    expect(sheet).toHaveAttribute("data-motion", mode);
    expect(sheet.className).toContain("duration-(--motion-duration-base)");
    expect(sheet.className).toContain(
      mode === "full"
        ? "transition-[opacity,translate]"
        : mode === "reduced"
          ? "transition-opacity"
          : "transition-none",
    );
    expect(sheet.className.includes("translate-x-full")).toBe(keepsSlide);

    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).toHaveAttribute("data-motion", mode);
    expect(overlay?.className).toContain("duration-(--motion-duration-fast)");
  });
  it("restores local full clocks inside none and keeps callback styles/classes", async () => {
    const { rerender } = render(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full" timeScale={2}>
          <Sheet open>
            <SheetContent className={() => "caller"} style={() => ({ color: "red" })}>
              <SheetTitle>Clock</SheetTitle>
              <SheetDescription>Local</SheetDescription>
            </SheetContent>
          </Sheet>
        </CadenceProvider>
      </CadenceProvider>,
    );
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("caller");
    expect(panel.style.getPropertyValue("--motion-duration-base")).toBe("0.44s");
    expect(panel.style.color).toBe("red");
    rerender(
      <CadenceProvider mode="none">
        <Sheet open>
          <SheetContent>
            <SheetTitle>Clock</SheetTitle>
            <SheetDescription>Local</SheetDescription>
          </SheetContent>
        </Sheet>
      </CadenceProvider>,
    );
    expect(screen.getByRole("dialog").style.getPropertyValue("--motion-duration-base")).toBe("0s");
    expect(screen.getByRole("dialog").className).not.toContain("starting-style");
  });
});
