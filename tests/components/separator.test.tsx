import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "@/registry/cadence/separator";

describe("Separator", () => {
  it("renders an announced separator by default", () => {
    render(<Separator />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-slot", "separator");
    expect(separator).toHaveAttribute("data-orientation", "horizontal");
    expect(separator).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("follows the orientation prop", () => {
    render(<Separator orientation="vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });

  it("drops out of the accessibility tree when decorative", () => {
    render(<Separator decorative />);
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
    const separator = document.querySelector('[data-slot="separator"]');
    expect(separator).toHaveAttribute("role", "none");
    expect(separator).toHaveAttribute("aria-hidden", "true");
  });
});
