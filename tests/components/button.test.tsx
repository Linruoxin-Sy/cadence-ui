import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button/button";

function CustomButton(props: ComponentProps<"button">) {
  return <button data-custom="yes" {...props} />;
}

describe("Button", () => {
  it("renders a button with the upstream slot and default variant", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("forwards clicks and native props", async () => {
    const onClick = vi.fn();
    render(
      <Button type="button" onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the invalid state attribute-driven", () => {
    render(<Button aria-invalid="true">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("aria-invalid", "true");
  });

  it("composes through render instead of asChild", () => {
    render(<Button render={<CustomButton />}>Pricing</Button>);

    const button = screen.getByRole("button", { name: "Pricing" });
    expect(button).toHaveAttribute("data-custom", "yes");
    expect(button).toHaveAttribute("data-slot", "button");
  });
});
