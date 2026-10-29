import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Skeleton } from "@/registry/cadence/skeleton/skeleton";

describe("Skeleton", () => {
  it("renders a placeholder with its slot", () => {
    render(<Skeleton data-testid="placeholder" />);
    const skeleton = screen.getByTestId("placeholder");

    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
    expect(skeleton).toHaveAttribute("data-motion", "full");
    expect(skeleton.className).toContain("animate-pulse");
  });

  it("pulses under reduced motion, with opacity only", () => {
    render(
      <CadenceProvider mode="reduced">
        <Skeleton data-testid="placeholder" />
      </CadenceProvider>,
    );

    const skeleton = screen.getByTestId("placeholder");
    expect(skeleton).toHaveAttribute("data-motion", "reduced");
    expect(skeleton.className).toContain("animate-pulse");
    expect(skeleton.className).not.toContain("animate-none");
  });

  it("stops animating when motion is none", () => {
    render(
      <CadenceProvider mode="none">
        <Skeleton data-testid="placeholder" />
      </CadenceProvider>,
    );

    const skeleton = screen.getByTestId("placeholder");
    expect(skeleton).toHaveAttribute("data-motion", "none");
    expect(skeleton.className).toContain("animate-none");
    expect(skeleton.className).not.toContain("animate-pulse");
  });

  it("is decorative: the loading state belongs to the region", () => {
    render(
      <div aria-busy="true" data-testid="region">
        <Skeleton />
      </div>,
    );

    expect(screen.getByTestId("region")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
