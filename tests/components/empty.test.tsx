import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/registry/cadence/empty";

function Example({ variant }: { variant?: "default" | "icon" }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant={variant} data-testid="media" />
        <EmptyTitle>No invoices yet</EmptyTitle>
        <EmptyDescription>Invoices you send will land here.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Create invoice</Button>
      </EmptyContent>
    </Empty>
  );
}

describe("Empty", () => {
  it("renders every part with its slot", () => {
    render(<Example />);

    const root = screen.getByText("No invoices yet").closest('[data-slot="empty"]');
    expect(root).toBeInTheDocument();
    expect(screen.getByText("No invoices yet")).toHaveAttribute("data-slot", "empty-title");
    expect(screen.getByText("Invoices you send will land here.")).toHaveAttribute("data-slot", "empty-description");
    expect(screen.getByRole("button", { name: "Create invoice" })).toBeInTheDocument();

    const header = screen.getByText("No invoices yet").closest('[data-slot="empty-header"]');
    expect(header).toBeInTheDocument();
    expect(screen.getByRole("button").closest('[data-slot="empty-content"]')).toBeInTheDocument();
  });

  it("exposes the media variant through data-variant", () => {
    render(<Example variant="icon" />);
    expect(screen.getByTestId("media")).toHaveAttribute("data-slot", "empty-icon");
    expect(screen.getByTestId("media")).toHaveAttribute("data-variant", "icon");
    expect(screen.getByTestId("media").className).toContain("bg-muted");
  });

  it("is a container, not a landmark or a live region", () => {
    render(<Example />);
    const root = screen.getByText("No invoices yet").closest('[data-slot="empty"]');

    expect(root?.tagName).toBe("DIV");
    expect(root).not.toHaveAttribute("role");
  });
});
