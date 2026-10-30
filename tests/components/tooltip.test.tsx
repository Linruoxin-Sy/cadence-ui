import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/registry/cadence/tooltip/tooltip";

function Example() {
  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon-sm" />} aria-label="Bold">
          B
        </TooltipTrigger>
        <TooltipContent>Bold (⌘B)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function hover() {
  await userEvent.hover(screen.getByRole("button", { name: "Bold" }));
  return screen.findByRole("tooltip");
}

describe("Tooltip", () => {
  it("opens on hover and describes the trigger instead of naming it", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Bold" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    const tooltip = await hover();
    expect(tooltip).toHaveAttribute("data-slot", "tooltip-content");
    expect(tooltip).toHaveTextContent("Bold (⌘B)");
    // The label is the description; the button keeps its own accessible name.
    expect(trigger).toHaveAccessibleName("Bold");
    expect(trigger).toHaveAccessibleDescription("Bold (⌘B)");
  });

  it("opens on keyboard focus, which is the only reason a tooltip is usable without a pointer", async () => {
    render(<Example />);
    await userEvent.tab();

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Bold (⌘B)");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
  });

  it("hides on Escape and keeps focus on the trigger", async () => {
    render(<Example />);
    await userEvent.tab();
    await screen.findByRole("tooltip");

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the scale outside full", async (mode, keepsScale) => {
    renderInMode(mode);
    const tooltip = await hover();

    expect(tooltip).toHaveAttribute("data-motion", mode);
    // Both the timing and the enter scale are tokens: `none` zeroes the duration on
    // the element itself, and the scale class is a JSX branch, not a media query.
    expect(tooltip.className).toContain("duration-(--motion-duration-fast)");
    expect(tooltip.className).toContain("origin-(--transform-origin)");
    expect(tooltip.className.includes("scale-(--motion-scale-in)")).toBe(keepsScale);
  });
});
