"use client";

import { Button } from "@/registry/cadence/button/button";

const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const;
const sizes = ["xs", "sm", "default", "lg"] as const;

export function ButtonPreview() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Variants</p>
        <div className="flex flex-wrap items-center gap-2">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant === "default" ? "Button" : variant[0]?.toUpperCase() + variant.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Sizes</p>
        <div className="flex flex-wrap items-center gap-2">
          {sizes.map((size) => (
            <Button key={size} size={size} variant="outline">
              {size}
            </Button>
          ))}
          <Button size="icon" variant="outline" aria-label="Add item">
            +
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Press and hold: the button compresses to 0.98 and springs back on release. With reduced motion the scale is
        dropped and only the colour transition remains.
      </p>
    </div>
  );
}
