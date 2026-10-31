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
import { PreviewStack } from "./shell";

/**
 * The full trail with an ellipsis and a last page, then the compact one that only
 * keeps Back / page / Forward. Every control is still an anchor, so `role="link"`
 * and right-click survive; the shape comes from the button variants.
 */
export function PaginationPreview() {
  return (
    <PreviewStack>
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
    </PreviewStack>
  );
}
