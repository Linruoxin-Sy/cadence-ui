import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/cadence/breadcrumb/breadcrumb";

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/files">Files</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>plan.pdf</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe("Breadcrumb", () => {
  it("is a labelled navigation landmark", () => {
    render(<Trail />);
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toHaveAttribute("data-slot", "breadcrumb");
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("renders links as anchors with their slot", () => {
    render(<Trail />);
    const home = screen.getByRole("link", { name: "Home" });

    expect(home.tagName).toBe("A");
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("marks the current page and does not link it", () => {
    render(<Trail />);
    const page = screen.getByText("plan.pdf");

    expect(page).toHaveAttribute("data-slot", "breadcrumb-page");
    expect(page).toHaveAttribute("aria-current", "page");
    expect(page.tagName).toBe("SPAN");
  });

  it("swaps the link element through render, keeping the router's own component", () => {
    render(
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="/files" data-router="true" />}>Files</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>,
    );

    const link = screen.getByRole("link", { name: "Files" });
    expect(link).toHaveAttribute("data-router", "true");
    expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("hides separators and the ellipsis from assistive tech", () => {
    render(<Trail />);

    for (const separator of document.querySelectorAll('[data-slot="breadcrumb-separator"]')) {
      expect(separator).toHaveAttribute("aria-hidden", "true");
      expect(separator).toHaveAttribute("role", "presentation");
    }

    const ellipsis = document.querySelector('[data-slot="breadcrumb-ellipsis"]');
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("More")).toHaveClass("sr-only");
  });
});
