import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { RadioGroup, RadioGroupItem } from "@/registry/cadence/radio-group/radio-group";

function Demo() {
  return (
    <RadioGroup defaultValue="team" aria-label="Plan">
      <RadioGroupItem value="starter" aria-label="Starter" />
      <RadioGroupItem value="team" aria-label="Team" />
      <RadioGroupItem value="scale" aria-label="Scale" />
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("renders the upstream slots and the initial selection", () => {
    const { container } = render(<Demo />);

    expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="radio-group-item"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-slot="radio-group-indicator"]')).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Team" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves the selection with the arrow keys", async () => {
    render(<Demo />);
    const team = screen.getByRole("radio", { name: "Team" });

    team.focus();
    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getByRole("radio", { name: "Scale" })).toHaveAttribute("aria-checked", "true");
    expect(team).toHaveAttribute("aria-checked", "false");
  });

  it("marks every item with the motion mode", () => {
    const { container } = render(
      <CadenceProvider mode="reduced">
        <Demo />
      </CadenceProvider>,
    );

    const items = container.querySelectorAll('[data-slot="radio-group-item"]');
    for (const item of items) expect(item).toHaveAttribute("data-motion", "reduced");
  });

  it("drops the dot scale when motion is none", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <Demo />
      </CadenceProvider>,
    );

    const checked = container.querySelector('[data-slot="radio-group-item"][data-checked]') as HTMLElement;
    const indicator = checked.querySelector('[data-slot="radio-group-indicator"]') as HTMLElement;

    expect(checked).toHaveAttribute("data-motion", "none");
    expect(indicator.style.transform === "" || indicator.style.transform === "none").toBe(true);
  });

  it("styles an invalid group from the attribute only", () => {
    render(
      <RadioGroup aria-label="Plan" aria-invalid>
        <RadioGroupItem value="a" aria-label="A" />
      </RadioGroup>,
    );

    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
  });
});
