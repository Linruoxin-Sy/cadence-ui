"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/cadence/breadcrumb";
import { PreviewStack } from "./shell";

export function CollapsedTrail({ label = "Collapsed guide trail" }: { label?: string }) {
  return (
    <Breadcrumb aria-label={label}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <details className="relative">
            <summary
              aria-label="Show ancestors"
              className="cursor-pointer list-none rounded-sm focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
            >
              <BreadcrumbEllipsis />
            </summary>
            <div className="absolute top-full left-0 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
              <BreadcrumbLink href="/docs" className="whitespace-nowrap">
                Documentation
              </BreadcrumbLink>
            </div>
          </details>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Motion modes</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function CustomSeparator() {
  return (
    <Breadcrumb aria-label="Slash trail">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/components">Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function RouterTrail() {
  return (
    <Breadcrumb aria-label="Router trail">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/components" />}>Components</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function Specimen() {
  return (
    <div className="grid gap-4">
      <Breadcrumb aria-label="Component trail">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/components">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CollapsedTrail label="Preview collapsed guide trail" />
    </div>
  );
}

export function MembershipTrail() {
  const [deep, setDeep] = useState(false);
  return (
    <div className="grid justify-items-start gap-3">
      <button
        type="button"
        className="rounded-sm text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        onClick={() => setDeep(!deep)}
      >
        {deep ? "Shorter path" : "Deeper path"}
      </button>
      <Breadcrumb aria-label="Changing trail">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/components">Components</BreadcrumbLink>
          </BreadcrumbItem>
          {deep ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/components/navigation">Navigation</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export function BreadcrumbPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "collapsed" ? (
        <CollapsedTrail />
      ) : example === "separator" ? (
        <CustomSeparator />
      ) : example === "router" ? (
        <RouterTrail />
      ) : example === "membership" ? (
        <MembershipTrail />
      ) : (
        <Specimen />
      )}
    </PreviewStack>
  );
}
