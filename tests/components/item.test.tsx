import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/registry/cadence/item";

function Row(props: { size?: "default" | "sm" | "xs"; variant?: "default" | "outline" | "muted" }) {
  return (
    <Item {...props}>
      <ItemMedia variant="icon">F</ItemMedia>
      <ItemContent>
        <ItemTitle>plan.pdf</ItemTitle>
        <ItemDescription>2.4 MB · updated today</ItemDescription>
      </ItemContent>
      <ItemActions>Open</ItemActions>
      <ItemFooter>Footer</ItemFooter>
    </Item>
  );
}

describe("Item", () => {
  it("renders every part with its slot", () => {
    render(
      <ItemGroup>
        <ItemHeader>Header</ItemHeader>
        <Row />
        <ItemSeparator />
      </ItemGroup>,
    );

    expect(screen.getByRole("list")).toHaveAttribute("data-slot", "item-group");
    expect(screen.getByText("Header")).toHaveAttribute("data-slot", "item-header");
    expect(screen.getByText("plan.pdf")).toHaveAttribute("data-slot", "item-title");
    expect(screen.getByText("2.4 MB · updated today")).toHaveAttribute("data-slot", "item-description");
    expect(screen.getByText("Open")).toHaveAttribute("data-slot", "item-actions");
    expect(screen.getByText("F")).toHaveAttribute("data-slot", "item-media");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "item-footer");
    expect(document.querySelector('[data-slot="item-separator"]')).toBeInTheDocument();
  });

  it("exposes variant and size through data attributes", () => {
    render(<Row variant="outline" size="sm" />);
    const item = screen.getByText("plan.pdf").closest('[data-slot="item"]');

    expect(item).toHaveAttribute("data-variant", "outline");
    expect(item).toHaveAttribute("data-size", "sm");
    expect(item?.className).toContain("border-border");
  });

  it("renders a whole-row link through render", () => {
    render(
      <Item render={<a href="/files/plan" />}>
        <ItemContent>
          <ItemTitle>plan.pdf</ItemTitle>
        </ItemContent>
      </Item>,
    );

    const link = screen.getByRole("link", { name: "plan.pdf" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/files/plan");
    expect(link).toHaveAttribute("data-slot", "item");
  });
});
