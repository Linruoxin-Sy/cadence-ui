import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

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

  it("leaves the press transform to Motion, not to a CSS transition", () => {
    // A CSS transition on `scale` would double-write the property Motion owns, and it
    // is what made the component's declared `feedback.press` recipe a dead reference.
    expect(buttonVariants()).not.toMatch(/transition-\[[^\]]*\b(scale|transform|opacity)\b/);
    expect(buttonVariants()).not.toContain("active:scale");
  });

  it("keeps upstream's group hook and select-none", () => {
    // Neither class is visible to `parity:check` (it compares exports and `data-slot`),
    // so a silent drop is only caught here: the group hook is what lets a consumer
    // style a slotted icon from the button's own state, select-none stops a
    // double-click from selecting the label.
    expect(buttonVariants()).toContain("group/button");
    expect(buttonVariants()).toContain("select-none");
  });

  it.each(["full", "reduced", "none"] as const)("carries data-motion=%s for the gesture branch", (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <Button>Save</Button>
      </CadenceProvider>,
    );
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("data-motion", mode);
  });
});
