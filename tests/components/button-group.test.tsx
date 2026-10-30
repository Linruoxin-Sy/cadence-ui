import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/cadence/button-group/button-group";

describe("ButtonGroup", () => {
  it("is a group with an orientation", () => {
    render(
      <ButtonGroup aria-label="Text style">
        <Button variant="outline">Bold</Button>
        <Button variant="outline">Italic</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Text style" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group.className).toContain("items-stretch");
  });

  it("stacks vertically when asked", () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Up</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group.className).toContain("flex-col");
  });

  it("renders static text in the group", () => {
    render(
      <ButtonGroup>
        <ButtonGroupText data-testid="text">12 selected</ButtonGroupText>
        <Button>Archive</Button>
      </ButtonGroup>,
    );

    expect(screen.getByTestId("text")).toHaveAttribute("data-slot", "button-group-text");
    expect(screen.getByTestId("text").tagName).toBe("DIV");
  });

  it("swaps the text element through render", () => {
    render(<ButtonGroupText render={<a href="#mode" />}>Mode</ButtonGroupText>);
    expect(screen.getByText("Mode").tagName).toBe("A");
  });

  it("separates controls without taking up a row", () => {
    render(
      <ButtonGroup>
        <Button>Cut</Button>
        <ButtonGroupSeparator />
        <Button>Copy</Button>
      </ButtonGroup>,
    );

    const separator = document.querySelector('[data-slot="button-group-separator"]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator?.className).toContain("self-stretch");
  });
});
