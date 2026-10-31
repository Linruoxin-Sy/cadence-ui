import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/cadence/progress";

function indicator(container: HTMLElement) {
  const element = container.querySelector('[data-slot="progress-indicator"]');
  if (!element) throw new Error("indicator not rendered");
  return element as HTMLElement;
}

describe("Progress", () => {
  it("renders the track, the indicator, and the value for assistive tech", () => {
    const { container } = render(
      <Progress value={40} aria-label="Upload">
        <ProgressLabel>Upload</ProgressLabel>
        <ProgressValue />
      </Progress>,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40");
    expect(container.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="progress-label"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="progress-value"]')).toBeInTheDocument();
    expect(indicator(container)).toHaveAttribute("data-slot", "progress-indicator");
  });

  it("fills by transform, not width", () => {
    const { container } = render(<Progress value={40} aria-label="Upload" />);
    const fill = indicator(container);

    expect(fill.style.width).toBe("100%");
    expect(fill.style.transform).toContain("scaleX");
    expect(fill.style.transform).toContain("0.4");
  });

  it("pulses instead of filling when the value is null", () => {
    const { container } = render(<Progress value={null} aria-label="Preparing" />);
    expect(indicator(container).className).toContain("animate-pulse");
  });

  it("keeps the pulse under reduced motion", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Progress value={null} aria-label="Preparing" />
      </CadenceProvider>,
    );

    expect(indicator(container)).toHaveAttribute("data-motion", "reduced");
    expect(indicator(container).className).toContain("animate-pulse");
  });

  it("stops the pulse and the fill transition when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Progress value={null} aria-label="Preparing" />
      </CadenceProvider>,
    );

    const fill = indicator(container);
    expect(fill).toHaveAttribute("data-motion", "none");
    expect(fill.className).toContain("animate-none");
    expect(fill.className).not.toContain("animate-pulse");
  });
});
