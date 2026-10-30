import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/cadence/pagination/pagination";

function Pages() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe("Pagination", () => {
  it("is a labelled navigation landmark", () => {
    render(<Pages />);
    expect(screen.getByRole("navigation", { name: "pagination" })).toHaveAttribute("data-slot", "pagination");
  });

  it("renders links, never buttons", () => {
    render(<Pages />);
    const page = screen.getByRole("link", { name: "2" });

    expect(page.tagName).toBe("A");
    expect(page).toHaveAttribute("data-slot", "pagination-link");
  });

  it("marks the current page for sighted and assistive users alike", () => {
    render(<Pages />);
    const active = screen.getByRole("link", { name: "2" });

    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("data-active", "true");
    expect(active.className).toContain("border");
    expect(screen.getByRole("link", { name: "1" })).not.toHaveAttribute("aria-current");
  });

  it("labels the previous and next controls in words", () => {
    render(<Pages />);

    expect(screen.getByRole("link", { name: "Go to previous page" })).toHaveAttribute("href", "?page=1");
    expect(screen.getByRole("link", { name: "Go to next page" })).toHaveAttribute("href", "?page=3");
  });

  it("hides the skipped range from assistive tech", () => {
    render(<Pages />);
    const ellipsis = document.querySelector('[data-slot="pagination-ellipsis"]');

    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("More pages")).toHaveClass("sr-only");
  });
});
