"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/cadence/pagination";

export function PaginationPreview() {
  return (
    <div className="flex flex-col gap-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#pagination" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#pagination">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#pagination" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#pagination">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#pagination">12</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#pagination" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#pagination" text="Back" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#pagination" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#pagination" text="Forward" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <p className="text-center text-xs text-muted-foreground">
        Every control is an anchor: <code>role="link"</code> survives, and the shape comes from the button variants.
      </p>
    </div>
  );
}
