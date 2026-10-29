import type * as React from "react";
import { cn } from "../lib/cn";

export interface AspectRatioProps extends React.ComponentProps<"div"> {
  /** Width ÷ height. `16 / 9` is a safe default for media, `1` for avatars. */
  ratio: number;
}

/**
 * Reserves a box at a fixed width-to-height ratio so media never shifts the
 * layout when it loads (CLS < 0.02, see the animation system's budgets).
 *
 * T0: nothing animates. Upstream's Base UI base is a plain `div` with
 * `aspect-(--ratio)`, which means no JavaScript and no primitive dependency.
 *
 * The `--ratio` custom property is written after the caller's `style`, so a
 * consumer can pass a background or a filter without losing the ratio.
 */
function AspectRatio({ ratio, className, style, ...props }: AspectRatioProps) {
  return (
    <div
      data-slot="aspect-ratio"
      style={{ ...style, "--ratio": ratio } as React.CSSProperties}
      className={cn("relative aspect-(--ratio)", className)}
      {...props}
    />
  );
}

export { AspectRatio };
