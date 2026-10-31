import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Slider } from "@/registry/cadence/slider";

function parts(container: HTMLElement) {
  return {
    root: container.querySelector('[data-slot="slider"]') as HTMLElement,
    track: container.querySelector('[data-slot="slider-track"]') as HTMLElement,
    range: container.querySelector('[data-slot="slider-range"]') as HTMLElement,
    thumb: container.querySelector('[data-slot="slider-thumb"]') as HTMLElement,
  };
}

describe("Slider", () => {
  it("renders every upstream slot", () => {
    const { container } = render(<Slider defaultValue={[40]} aria-label="Volume" />);
    const { root, track, range, thumb } = parts(container);

    expect(root).toBeInTheDocument();
    expect(track).toBeInTheDocument();
    expect(range).toBeInTheDocument();
    expect(thumb).toBeInTheDocument();
    expect(root).toHaveAttribute("data-motion", "full");
  });

  it("is keyboard operable through the native range input", async () => {
    // The thumb stays `visibility: hidden` until Base UI measures the track, and jsdom
    // always reports a zero-sized track — so the input is queried directly rather than
    // through the accessibility tree.
    const { container } = render(<Slider defaultValue={[40]} aria-label="Volume" />);
    const input = container.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) throw new Error("range input not rendered");

    expect(input).toHaveAttribute("aria-label", "Volume");
    expect(input).toHaveAttribute("aria-valuenow", "40");

    input.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(input).toHaveAttribute("aria-valuenow", "41");
  });

  it("carries the mode on the root for reduced motion", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Slider defaultValue={[40]} aria-label="Volume" />
      </CadenceProvider>,
    );

    expect(parts(container).root).toHaveAttribute("data-motion", "reduced");
  });

  it("does not scale any thumb when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Slider defaultValue={[40]} aria-label="Volume" />
      </CadenceProvider>,
    );

    const { root, thumb } = parts(container);
    expect(root).toHaveAttribute("data-motion", "none");
    expect(thumb.style.transform === "" || thumb.style.transform === "none").toBe(true);
  });
});

describe("Slider orientation", () => {
  it("stands the control up when vertical", () => {
    const { container } = render(<Slider orientation="vertical" defaultValue={[40]} aria-label="Level" />);

    const root = container.querySelector('[data-slot="slider"]');
    const track = container.querySelector('[data-slot="slider-track"]');

    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(track?.className).toContain("h-full");
    expect(track?.className).not.toContain("h-1.5");
  });
});
