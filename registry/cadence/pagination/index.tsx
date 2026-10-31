"use client";

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";
import { type ButtonProps, buttonVariants } from "../button";
import { cn } from "../lib/cn";

export interface PaginationProps extends React.ComponentProps<"nav"> {}

/**
 * Page navigation for a list that is longer than one screen. T0: nothing animates.
 * A page change is a navigation, and the result is the content, not the control.
 *
 * a11y: the `nav` is labelled "pagination". The current page is a link with
 * `aria-current="page"` — either a real `href` or, for local state, an
 * `onClick` that changes it.
 */
function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export interface PaginationContentProps extends React.ComponentProps<"ul"> {}

function PaginationContent({ className, ...props }: PaginationContentProps) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export interface PaginationItemProps extends React.ComponentProps<"li"> {}

function PaginationItem({ ...props }: PaginationItemProps) {
  return <li data-slot="pagination-item" {...props} />;
}

export interface PaginationLinkProps extends React.ComponentProps<"a"> {
  /** Marks the current page: outline instead of ghost, plus `aria-current="page"`. */
  isActive?: boolean;
  /** Reuses the button's size scale; `icon` by default. */
  size?: ButtonProps["size"];
}

/**
 * Always an anchor: pagination is navigation, so the control has to be announced
 * as a link. The shape comes from `buttonVariants` rather than from `Button`,
 * because Base UI's button applies `role="button"` to any element it renders —
 * see the deviation note in docs/parity-plan.md §7.2.
 */
function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      data-variant={isActive ? "outline" : "ghost"}
      data-size={size}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        "aria-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export interface PaginationPreviousProps extends Omit<React.ComponentProps<typeof PaginationLink>, "size"> {
  /** Label text; hidden below `sm`, where the chevron carries the meaning. */
  text?: string;
}

function PaginationPrevious({ className, text = "Previous", ...props }: PaginationPreviousProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

export interface PaginationNextProps extends Omit<React.ComponentProps<typeof PaginationLink>, "size"> {
  text?: string;
}

function PaginationNext({ className, text = "Next", ...props }: PaginationNextProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

export interface PaginationEllipsisProps extends React.ComponentProps<"span"> {}

/** A skipped range. It is not a link: it is hidden from assistive tech and says nothing. */
function PaginationEllipsis({ className, ...props }: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
