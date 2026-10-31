import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "@/registry/cadence/input";

describe("Input", () => {
  it("renders an input with its slot", () => {
    render(<Input placeholder="Acme" />);
    const input = screen.getByPlaceholderText("Acme");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("accepts text and forwards the change event", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Workspace" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "Workspace" });
    await userEvent.type(input, "acme");

    expect(input).toHaveValue("acme");
    expect(onChange).toHaveBeenCalled();
  });

  it("keeps the invalid state attribute-driven", () => {
    render(<Input aria-label="Email" aria-invalid="true" aria-describedby="email-error" />);
    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "email-error");
  });

  it("passes native props through", () => {
    render(<Input aria-label="Slug" disabled required readOnly defaultValue="cadence" />);
    const input = screen.getByRole("textbox", { name: "Slug" });

    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveValue("cadence");
  });
});
