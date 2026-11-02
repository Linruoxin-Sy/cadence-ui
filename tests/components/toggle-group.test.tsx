import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";
import { expectMotionContract } from "../motion-contract";

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

describe("ToggleGroup orientation", () => {
  it("lays a vertical group out as a column", () => {
    const { container } = render(
      <ToggleGroup orientation="vertical" variant="outline" multiple aria-label="Zoom">
        <ToggleGroupItem value="in" aria-label="Zoom in" />
        <ToggleGroupItem value="out" aria-label="Zoom out" />
      </ToggleGroup>,
    );

    // Base UI writes `data-orientation`; the layout follows it in JS, because a
    // `data-vertical:` utility compiles to `[data-vertical]` — an attribute nothing
    // sets — and the group would silently stay a row.
    const group = container.querySelector('[data-slot="toggle-group"]');
    const item = container.querySelector('[data-slot="toggle-group-item"]');

    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group?.className).toContain("flex-col");
    expect(item?.className).toContain("rounded-b-none");
    expect(item?.className).not.toContain("rounded-e-none");
  });
});

it.each(["full", "reduced", "none"] as const)("exercises single and multiple fills in %s", async (mode) => {
  const { container } = render(
    <CadenceProvider mode={mode}>
      <ToggleGroup variant="segmented" defaultValue={["day"]} aria-label="Range">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup multiple aria-label="Marks">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    </CadenceProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Month" }));
  await userEvent.click(screen.getByRole("button", { name: "Bold" }));
  await userEvent.click(screen.getByRole("button", { name: "Italic" }));
  await userEvent.click(screen.getByRole("button", { name: "Bold" }));
  const range = screen.getByRole("group", { name: "Range" });
  expect(range).toHaveAttribute("data-variant", "segmented");
  expect(
    within(range).getByRole("button", { name: "Day" }).querySelector("[data-slot=toggle-group-indicator]"),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
  expect(container.querySelectorAll("[data-slot=toggle-group-indicator]")).toHaveLength(3);
  if (mode !== "full") expect(range.querySelector("[data-slot=toggle-group-indicator]")).not.toHaveAttribute("style");
  for (const fill of container.querySelectorAll("[data-slot=toggle-group-indicator]")) {
    expect(fill).toHaveAttribute("aria-hidden", "true");
  }
  expectMotionContract(mode);
});

it.each(["default", "outline", "segmented"] as const)(
  "keeps keyboard selection, clearing and disabled items in %s",
  async (variant) => {
    const user = userEvent.setup();
    render(
      <ToggleGroup variant={variant} defaultValue={["a"]} aria-label="Choices">
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled>
          Blocked
        </ToggleGroupItem>
        <ToggleGroupItem value="c">Charlie</ToggleGroupItem>
      </ToggleGroup>,
    );
    const a = screen.getByRole("button", { name: "Alpha" });
    const c = screen.getByRole("button", { name: "Charlie" });
    await user.tab();
    expect(a).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(c).toHaveFocus();
    expect(a).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(c).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Enter}");
    expect(c).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("group").querySelector("[data-slot=toggle-group-indicator]")).toBeNull();
    await user.keyboard("{Home}{Enter}");
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("aria-pressed", "true");
  },
);

function ControlledExample({ change }: { change: (next: string[]) => void }) {
  const [value, setValue] = useState(["a"]);
  return (
    <>
      <button type="button" onClick={() => setValue(["b"])}>
        External
      </button>
      <ToggleGroup
        value={value}
        onValueChange={(next, details) => {
          change(next);
          details.cancel();
        }}
        variant="segmented"
      >
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
      </ToggleGroup>
    </>
  );
}

it("keeps controlled fills on the committed value and respects cancellation", () => {
  const change = vi.fn();
  render(<ControlledExample change={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Beta" }));
  expect(change).toHaveBeenCalledWith(["b"]);
  expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "External" }));
  expect(screen.getByRole("button", { name: "Beta" })).toHaveAttribute("aria-pressed", "true");
});

it("preserves the focused button and selected fill through a live motion downgrade", () => {
  const view = (mode: "full" | "reduced" | "none") => (
    <CadenceProvider mode={mode}>
      <ToggleGroup variant="segmented" defaultValue={["a"]}>
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
      </ToggleGroup>
    </CadenceProvider>
  );
  const { rerender } = render(view("full"));
  const button = screen.getByRole("button", { name: "Alpha" });
  button.focus();
  for (const mode of ["reduced", "none", "full"] as const) {
    rerender(view(mode));
    expect(screen.getByRole("button", { name: "Alpha" })).toBe(button);
    expect(button).toHaveFocus();
    expect(button.querySelector("[data-slot=toggle-group-indicator]")).toHaveAttribute("data-motion", mode);
  }
});
