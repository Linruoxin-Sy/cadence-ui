import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Switch } from "@/registry/cadence/switch/switch";

function root(container: HTMLElement) {
  const element = container.querySelector('[data-slot="switch"]');
  if (!element) throw new Error("switch not rendered");
  return element as HTMLElement;
}

function thumb(container: HTMLElement) {
  return container.querySelector('[data-slot="switch-thumb"]') as HTMLElement;
}

describe("Switch", () => {
  it("renders the upstream surface with its size attribute", () => {
    const { container } = render(<Switch aria-label="Public" defaultChecked />);

    expect(root(container)).toHaveAttribute("data-size", "default");
    expect(root(container)).toHaveAttribute("data-motion", "full");
    expect(thumb(container)).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Public" })).toHaveAttribute("aria-checked", "true");
  });

  it("toggles on click and exposes the size variant", async () => {
    const { container } = render(<Switch aria-label="Alerts" size="sm" />);
    const element = root(container);

    expect(element).toHaveAttribute("data-size", "sm");
    await userEvent.click(element);
    expect(element).toHaveAttribute("aria-checked", "true");
  });

  it("does not transition the thumb under reduced motion", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Switch aria-label="Public" defaultChecked />
      </CadenceProvider>,
    );

    expect(root(container)).toHaveAttribute("data-motion", "reduced");
    // The thumb still sits at the end of the track — position is state, not decoration —
    // but it must not animate there.
    expect(thumb(container).style.transitionDuration).not.toMatch(/^0\.\d/);
  });

  it("carries the mode for none so the thumb jumps", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Switch aria-label="Public" />
      </CadenceProvider>,
    );

    expect(root(container)).toHaveAttribute("data-motion", "none");
  });
});
