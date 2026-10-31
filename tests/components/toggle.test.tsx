import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Toggle } from "@/registry/cadence/toggle";

describe("Toggle", () => {
  it("renders a button with its slot and variant classes", () => {
    render(<Toggle aria-label="Bold" variant="outline" size="sm" />);
    const toggle = screen.getByRole("button", { name: "Bold" });

    expect(toggle).toHaveAttribute("data-slot", "toggle");
    expect(toggle).toHaveAttribute("type", "button");
    expect(toggle.className).toContain("border-input");
  });

  it("toggles aria-pressed on click and by keyboard", async () => {
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole("button", { name: "Bold" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    toggle.focus();
    await userEvent.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("declares the motion mode and drops the press scale under reduced motion", () => {
    const { rerender } = render(<Toggle aria-label="Bold" />);
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-motion", "full");

    rerender(
      <CadenceProvider mode="reduced">
        <Toggle aria-label="Bold" />
      </CadenceProvider>,
    );
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-motion", "reduced");
  });

  it("reports the mode for none", () => {
    render(
      <CadenceProvider mode="none">
        <Toggle aria-label="Bold" />
      </CadenceProvider>,
    );
    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("data-motion", "none");
  });
});
