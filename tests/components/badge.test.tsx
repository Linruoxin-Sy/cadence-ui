import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/registry/cadence/badge/badge";

describe("Badge", () => {
  it("renders a span with the upstream slot and variant", () => {
    render(<Badge>Beta</Badge>);
    const badge = screen.getByText("Beta");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).toHaveAttribute("data-variant", "default");
    expect(badge.tagName).toBe("SPAN");
  });

  it("switches the variant attribute without changing the node", () => {
    render(<Badge variant="destructive">Failed</Badge>);
    const badge = screen.getByText("Failed");
    expect(badge).toHaveAttribute("data-variant", "destructive");
  });

  it("composes through render instead of asChild", () => {
    render(
      <Badge variant="outline" render={<a href="/releases" />}>
        3 releases
      </Badge>,
    );

    const link = screen.getByRole("link", { name: "3 releases" });
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link).toHaveAttribute("href", "/releases");
  });

  it("is a label, not a control", () => {
    render(<Badge>Beta</Badge>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).not.toHaveAttribute("tabindex");
  });
});
