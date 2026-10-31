import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/cadence/input-group";

describe("InputGroup", () => {
  it("frames a control and hands the styling to the frame", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Amount" defaultValue="0.00" />
      </InputGroup>,
    );

    const input = screen.getByRole("textbox", { name: "Amount" });
    expect(input).toHaveAttribute("data-slot", "input-group-control");
    expect(input.className).toContain("border-0");
    expect(screen.getByText("$").closest('[data-slot="input-group-addon"]')).toHaveAttribute(
      "data-align",
      "inline-start",
    );
  });

  it("focuses the control when the addon is clicked", async () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput aria-label="Domain" />
      </InputGroup>,
    );

    await userEvent.click(screen.getByText("https://"));
    expect(screen.getByRole("textbox", { name: "Domain" })).toHaveFocus();
  });

  it("leaves a button inside the addon alone", async () => {
    const clicks: string[] = [];

    render(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear" onClick={() => clicks.push("clear")}>
            ×
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>,
    );

    const clear = screen.getByRole("button", { name: "Clear" });
    expect(clear).toHaveAttribute("data-size", "icon-xs");
    await userEvent.click(clear);

    expect(clicks).toEqual(["clear"]);
    expect(screen.getByRole("textbox", { name: "Search" })).not.toHaveFocus();
  });

  it("works as a textarea frame too", () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Message" />
        <InputGroupAddon align="block-end">
          <InputGroupText>0/280</InputGroupText>
        </InputGroupAddon>
      </InputGroup>,
    );

    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("data-slot", "input-group-control");
    expect(document.querySelector('[data-align="block-end"]')).toBeInTheDocument();
  });
});
