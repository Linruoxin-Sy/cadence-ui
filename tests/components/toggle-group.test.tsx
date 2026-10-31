import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";

describe("ToggleGroup", () => {
  it("renders the group and item slots with the shared variant", () => {
    const { container } = render(
      <ToggleGroup variant="outline" defaultValue={["center"]} aria-label="Align">
        <ToggleGroupItem value="left" aria-label="Left" />
        <ToggleGroupItem value="center" aria-label="Center" />
      </ToggleGroup>,
    );

    const group = container.querySelector('[data-slot="toggle-group"]') as HTMLElement;
    const items = container.querySelectorAll('[data-slot="toggle-group-item"]');

    expect(group).toHaveAttribute("data-variant", "outline");
    expect(group).toHaveAttribute("data-spacing", "0");
    expect(items).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a single item pressed unless multiple is set", async () => {
    render(
      <ToggleGroup defaultValue={["left"]} aria-label="Align">
        <ToggleGroupItem value="left" aria-label="Left" />
        <ToggleGroupItem value="center" aria-label="Center" />
      </ToggleGroup>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Center" }));

    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "false");
  });

  it("allows more than one pressed item when multiple is set", async () => {
    render(
      <ToggleGroup multiple aria-label="Style">
        <ToggleGroupItem value="bold" aria-label="Bold" />
        <ToggleGroupItem value="italic" aria-label="Italic" />
      </ToggleGroup>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    await userEvent.click(screen.getByRole("button", { name: "Italic" }));

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  });

  it("marks every item with the motion mode", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <ToggleGroup aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left" />
        </ToggleGroup>
      </CadenceProvider>,
    );

    expect(container.querySelector('[data-slot="toggle-group-item"]')).toHaveAttribute("data-motion", "none");
  });
});
