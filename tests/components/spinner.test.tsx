import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Spinner } from "@/registry/cadence/spinner/spinner";

describe("Spinner", () => {
  it("is a status region with a slot", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");

    expect(spinner).toHaveAttribute("data-slot", "spinner");
    expect(spinner).toHaveAttribute("aria-label", "Loading");
    expect(spinner).toHaveAttribute("data-motion", "full");
    expect(spinner.getAttribute("class")).toContain("animate-spin");
  });

  it("keeps spinning under reduced motion, because rotation is not travel", () => {
    render(
      <CadenceProvider mode="reduced">
        <Spinner />
      </CadenceProvider>,
    );

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("data-motion", "reduced");
    expect(spinner.getAttribute("class")).toContain("animate-spin");
    expect(spinner.getAttribute("class")).not.toContain("animate-none");
  });

  it("stops when motion is none, and still announces itself", () => {
    render(
      <CadenceProvider mode="none">
        <Spinner />
      </CadenceProvider>,
    );

    const spinner = screen.getByRole("status");
    expect(spinner).toHaveAttribute("data-motion", "none");
    expect(spinner.getAttribute("class")).toContain("animate-none");
    expect(spinner.getAttribute("class")).not.toContain("animate-spin");
    expect(spinner).toHaveAccessibleName("Loading");
  });

  it("takes a specific label from the caller", () => {
    render(<Spinner aria-label="Saving invoice" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Saving invoice");
  });
});
