// biome-ignore-all lint/a11y/useSemanticElements: BreadcrumbPage mirrors shadcn's Base UI markup, which keeps the current page a span and marks it with aria-current instead of rendering a second link.
// biome-ignore-all lint/a11y/useFocusableInteractive: the current page is deliberately not focusable; a tab stop that goes nowhere is worse than the ARIA pattern.
"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import type * as React from "react";
import { cn } from "../lib/cn";

export interface BreadcrumbProps extends React.ComponentProps<"nav"> {}

/**
 * The path to the current page. T0: nothing animates — a trail that fades in
 * makes a navigation landmark harder to find, not easier.
 *
 * a11y: the `nav` is labelled "breadcrumb", so a screen reader lists it as its own
 * landmark. The last crumb is a `BreadcrumbPage` (not a link) marked
 * `aria-current="page"`.
 */
function Breadcrumb({ ...props }: BreadcrumbProps) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

export interface BreadcrumbListProps extends React.ComponentProps<"ol"> {}

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}

export interface BreadcrumbItemProps extends React.ComponentProps<"li"> {}

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

export interface BreadcrumbLinkProps extends useRender.ComponentProps<"a"> {}

/**
 * `render` (Base UI) is how a client-side router link gets in: pass the router's
 * own link element and keep `data-slot="breadcrumb-link"`.
 */
function BreadcrumbLink({ className, render, ...props }: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">({ className: cn("transition-colors hover:text-foreground", className) }, props),
    render,
    // `state` is what emits `data-slot` — Base UI converts state keys to data-* attributes.
    state: { slot: "breadcrumb-link" },
  });
}

export interface BreadcrumbPageProps extends React.ComponentProps<"span"> {}

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  );
}

export interface BreadcrumbSeparatorProps extends React.ComponentProps<"li"> {}

function BreadcrumbSeparator({ children, className, ...props }: BreadcrumbSeparatorProps) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

export interface BreadcrumbEllipsisProps extends React.ComponentProps<"span"> {}

/** The collapsed middle of a deep trail; put a `DropdownMenu` trigger beside it. */
function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
