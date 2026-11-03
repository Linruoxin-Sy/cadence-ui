"use client";

import { useId, useState } from "react";
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

function Specimen() {
  return (
    <Pagination aria-label="Result pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1#usage" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1#usage">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3#usage">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function CollapsedPages() {
  return (
    <Pagination aria-label="Collapsed result pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1#usage" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1#usage">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3#usage">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=12#usage">12</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function CustomLabels() {
  return (
    <Pagination aria-label="Custom-labelled result pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1#usage" text="Back" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2#usage" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3#usage" text="Forward" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

const records = [
  ["Invoice 1001", "Invoice 1002"],
  ["Invoice 1003", "Invoice 1004"],
  ["Invoice 1005", "Invoice 1006"],
];

export function LocalPages() {
  const [page, setPage] = useState(1);
  const resultsId = useId();
  return (
    <div className="grid w-full max-w-sm gap-4">
      <section id={resultsId} aria-label="Invoice results" className="min-h-24 rounded-md border p-3">
        <p aria-live="polite" className="mb-2 text-sm text-muted-foreground">
          Page {page} of 3
        </p>
        <ul className="text-sm">
          {records[page - 1]?.map((record) => (
            <li key={record}>{record}</li>
          ))}
        </ul>
      </section>
      <Pagination aria-label="Invoice pages">
        <PaginationContent>
          {[1, 2, 3].map((value) => (
            <PaginationItem key={value}>
              <PaginationLink
                href={`#${resultsId}`}
                aria-controls={resultsId}
                isActive={value === page}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  setPage(value);
                }}
              >
                {value}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

const sizes = ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] as const;

export function PageSizes() {
  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-6 sm:grid-cols-4">
      {sizes.map((size) => (
        <div key={size} className="grid justify-items-center gap-2">
          <Pagination aria-label={`Pages sized ${size}`}>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink size={size} href="?page=2#sizes" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  );
}

export function FirstPage() {
  return (
    <Pagination aria-label="First result page">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious role="link" aria-disabled="true" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1#at-a-boundary" isActive>
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=2#at-a-boundary" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function PaginationPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "collapsed" ? (
        <CollapsedPages />
      ) : example === "labels" ? (
        <CustomLabels />
      ) : example === "local-state" ? (
        <LocalPages />
      ) : example === "sizes" ? (
        <PageSizes />
      ) : example === "boundary" ? (
        <FirstPage />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
