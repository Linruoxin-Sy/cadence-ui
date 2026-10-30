import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/cadence/hover-card/hover-card";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";

function Example() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<button type="button" />}>@linruoxin</HoverCardTrigger>
      <HoverCardContent>
        <p>Lin Ruoxin</p>
        <button type="button">Follow</button>
      </HoverCardContent>
    </HoverCard>
  );
}

function panel() {
  return document.querySelector('[data-slot="hover-card-content"]');
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function hover() {
  await userEvent.hover(screen.getByRole("button", { name: "@linruoxin" }));
  return screen.findByText("Lin Ruoxin");
}

describe("HoverCard", () => {
  it("opens on hover with upstream's portal and content slots", async () => {
    render(<Example />);
    expect(panel()).toBeNull();

    await hover();
    expect(panel()).toHaveAttribute("data-slot", "hover-card-content");
    // The trigger keeps its own name; the card is not wired as its description.
    const trigger = screen.getByRole("button", { name: "@linruoxin" });
    expect(trigger).toHaveAccessibleName("@linruoxin");
    expect(trigger).not.toHaveAttribute("aria-describedby");
    expect(document.querySelector('[data-slot="hover-card-portal"]')).not.toBeNull();
  });

  it("opens on keyboard focus and keeps its interactive content reachable", async () => {
    render(<Example />);
    await userEvent.tab();

    await screen.findByText("Lin Ruoxin");
    expect(screen.getByRole("button", { name: "@linruoxin" })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Follow" })).toHaveFocus();
    expect(panel()).not.toBeNull();
  });

  it("closes on Escape and keeps focus on the trigger", async () => {
    render(<Example />);
    await userEvent.tab();
    await screen.findByText("Lin Ruoxin");

    await userEvent.keyboard("{Escape}");
    expect(panel()).toBeNull();
    expect(screen.getByRole("button", { name: "@linruoxin" })).toHaveFocus();
  });

  it.each([
    ["full", true],
    ["reduced", false],
    ["none", false],
  ] as const)("declares %s mode, and drops the scale outside full", async (mode, keepsScale) => {
    renderInMode(mode);
    await hover();

    const content = panel();
    expect(content).toHaveAttribute("data-motion", mode);
    // Both the timing and the enter scale are tokens: `none` zeroes the duration on
    // the element itself, and the scale class is a JSX branch, not a media query.
    expect(content?.className).toContain("duration-(--motion-duration-fast)");
    expect(content?.className).toContain("origin-(--transform-origin)");
    expect(content?.className.includes("scale-(--motion-scale-in)")).toBe(keepsScale);
  });
});
