import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/cadence/card/card";

function Example({ size }: { size?: "default" | "sm" }) {
  return (
    <Card size={size}>
      <CardHeader>
        <CardTitle>Parity plan</CardTitle>
        <CardDescription>Nine batches.</CardDescription>
        <CardAction>Action</CardAction>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  );
}

describe("Card", () => {
  it("renders every part with its slot", () => {
    render(<Example />);

    expect(screen.getByText("Parity plan")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Nine batches.")).toHaveAttribute("data-slot", "card-description");
    expect(screen.getByText("Action")).toHaveAttribute("data-slot", "card-action");
    expect(screen.getByText("Body")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");

    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card).toHaveAttribute("data-size", "default");
    expect(screen.getByText("Parity plan").closest('[data-slot="card-header"]')).toBeInTheDocument();
  });

  it("exposes size through data-size", () => {
    render(<Example size="sm" />);
    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card).toHaveAttribute("data-size", "sm");
  });

  it("is a plain container, not a landmark", () => {
    render(<Example />);
    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card?.tagName).toBe("DIV");
    expect(card).not.toHaveAttribute("role");
  });
});
