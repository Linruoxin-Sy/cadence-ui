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
import { usePreviewVariant } from "./use-preview-variant";

const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const;

/**
 * The full trail with an ellipsis and a last page, then the compact one that only
 * keeps Back / page / Forward. Every control is still an anchor, so `role="link"`
 * and right-click survive; the shape comes from the button variants.
 */
export function PaginationPreview() {
  const { control, choose } = usePreviewVariant("Pagination", sizes);
  return (
    <PreviewStack>
      {control}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious size={choose("default")} href="#pagination" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink size={choose("icon")} href="#pagination">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink size={choose("icon")} href="#pagination" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink size={choose("icon")} href="#pagination">
              3
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink size={choose("icon")} href="#pagination">
              12
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext size={choose("default")} href="#pagination" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious size={choose("default")} href="#pagination" text="Back" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink size={choose("icon")} href="#pagination" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext size={choose("default")} href="#pagination" text="Forward" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </PreviewStack>
  );
}
