"use client";

import type * as React from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "../lib/cn";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface CardProps extends React.ComponentProps<"div"> {
  /** `sm` tightens the padding from 1.5rem to 1rem for dense lists and sidebars. */
  size?: "default" | "sm";
  /**
   * `content` sizes the card from what is inside it instead of from the parent:
   * the surface hugs its content on both axes and follows it live, so a parent
   * that stretches its children (`items-stretch`, a `grid` row, `h-full`) cannot
   * stretch the card either.
   */
  fit?: "content";
}

/** The shell: everything that draws the surface, and the spacing the parts inherit. */
const shell =
  "group/card overflow-hidden rounded-xl border bg-card text-sm text-card-foreground shadow-sm [--card-spacing:1.5rem] data-[size=sm]:[--card-spacing:1rem]";

/** The flow: gap, block padding, and the corner rounding the first/last image needs. */
const flow =
  "flex flex-col gap-(--card-spacing) py-(--card-spacing) *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl";

/**
 * A surface that groups content. T0: the card itself never animates — a card
 * that fades or lifts on mount is decoration, and it fights the `reveal` recipe
 * a page may already be running.
 *
 * Parts are separated only by `data-slot`, so a consumer restyles them from CSS:
 * `[&>[data-slot=card-header]]:border-b`. Spacing comes from `--card-spacing`,
 * which `size` sets once on the root and the children inherit.
 *
 * `fit="content"` is measurement, not motion: the height comes from a
 * `ResizeObserver` on the content box and is written to the shell in the frame
 * the content changed, with no recipe, no token, and no tween to disable. The
 * width needs no observer — `w-fit` already resolves against the content and
 * re-wraps when the parent narrows. Because nothing is animated, the mode has
 * nothing to reduce: `full`, `reduced`, and `none` render the same box.
 */
function Card({ className, size = "default", fit, children, ...props }: CardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const fitContent = fit === "content";

  useIsomorphicLayoutEffect(() => {
    if (!fitContent) return;
    const root = rootRef.current;
    const box = flowRef.current;
    if (!root || !box) return;

    // The border sits outside the flow box but inside the shell's box-sizing, so
    // the measurement has to add it back or the card clips two pixels of itself.
    const borders = () => {
      const styles = window.getComputedStyle(root);
      return Number.parseFloat(styles.borderTopWidth || "0") + Number.parseFloat(styles.borderBottomWidth || "0");
    };

    /**
     * Written to the node rather than to state: React commits after the frame,
     * and the point of following the content live is that the size lands in the
     * same frame the content did. The observed box stays `auto`, so its own
     * measurement cannot be fed back by this write.
     *
     * A measurement of zero is not a size: it is a card that has not been laid
     * out yet — a hidden panel, a mount inside a collapsed parent. Pinning to it
     * would collapse a card the reader is about to see, so `auto` stays until
     * there is a real number.
     */
    const measure = () => {
      const height = box.getBoundingClientRect().height;
      if (!height) {
        root.style.removeProperty("height");
        return;
      }
      root.style.height = `${height + borders()}px`;
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => {
      observer.disconnect();
      root.style.removeProperty("height");
    };
  }, [fitContent]);

  if (!fitContent) {
    return (
      <div data-slot="card" data-size={size} className={cn(shell, flow, className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      data-slot="card"
      data-size={size}
      data-fit="content"
      className={cn(shell, "w-fit", className)}
      {...props}
    >
      <div ref={flowRef} data-slot="card-flow" className={flow}>
        {children}
      </div>
    </div>
  );
}

export interface CardHeaderProps extends React.ComponentProps<"div"> {}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-spacing)",
        className,
      )}
      {...props}
    />
  );
}

export interface CardTitleProps extends React.ComponentProps<"div"> {}

function CardTitle({ className, ...props }: CardTitleProps) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />;
}

export interface CardDescriptionProps extends React.ComponentProps<"div"> {}

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export interface CardActionProps extends React.ComponentProps<"div"> {}

function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export interface CardContentProps extends React.ComponentProps<"div"> {}

function CardContent({ className, ...props }: CardContentProps) {
  return <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />;
}

export interface CardFooterProps extends React.ComponentProps<"div"> {}

function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-(--card-spacing) [.border-t]:pt-(--card-spacing)", className)}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
