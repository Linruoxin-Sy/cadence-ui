import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "@/registry/cadence/checkbox";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function slot(container: HTMLElement) {
  const root = container.querySelector('[data-slot="checkbox"]');
  if (!root) throw new Error("checkbox not rendered");
  return root as HTMLElement;
}

describe("Checkbox", () => {
  it("renders the upstream surface and keeps the indicator mounted", () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    const root = slot(container);

    expect(root).toHaveAttribute("data-motion", "full");
    expect(screen.getByRole("checkbox", { name: "Accept terms" })).toBe(root);
    expect(container.querySelector('[data-slot="checkbox-indicator"]')).toBeInTheDocument();
  });

  it("toggles through the pointer and reports the checked state", async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    const root = slot(container);

    expect(root).toHaveAttribute("data-unchecked");
    await userEvent.click(root);
    expect(root).toHaveAttribute("data-checked");
    expect(root).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the tick at full size under reduced motion", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Checkbox aria-label="Accept terms" />
      </CadenceProvider>,
    );
    const indicator = container.querySelector('[data-slot="checkbox-indicator"]') as HTMLElement;

    expect(slot(container)).toHaveAttribute("data-motion", "reduced");
    expect(indicator.style.transform).not.toContain("0.96");
  });

  it("drops the transition entirely when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Checkbox aria-label="Accept terms" />
      </CadenceProvider>,
    );
    const indicator = container.querySelector('[data-slot="checkbox-indicator"]') as HTMLElement;

    expect(slot(container)).toHaveAttribute("data-motion", "none");
    expect(indicator.style.transition).toBe("");
  });

  it("styles the invalid state from the attribute only", () => {
    const { container } = render(<Checkbox aria-label="Accept terms" aria-invalid />);
    expect(slot(container)).toHaveAttribute("aria-invalid", "true");
  });
});
