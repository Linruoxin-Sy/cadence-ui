import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "@/registry/cadence/input/input";
import { Label } from "@/registry/cadence/label/label";

describe("Label", () => {
  it("renders a label with its slot", () => {
    render(<Label htmlFor="email">Email</Label>);
    const label = screen.getByText("Email");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("data-slot", "label");
    expect(label).toHaveAttribute("for", "email");
  });

  it("names the control it points at", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("focuses the control when the label is clicked", async () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" />
      </>,
    );

    await userEvent.click(screen.getByText("Email"));
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
  });

  it("names a wrapping control too", () => {
    render(
      <Label>
        <input type="checkbox" />
        Email me
      </Label>,
    );

    expect(screen.getByRole("checkbox", { name: "Email me" })).toBeInTheDocument();
  });
});
