"use client";

import { Check, Clock, GitBranch } from "lucide-react";
import { Badge } from "@/registry/cadence/badge";

const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

export function BadgePreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Variants</p>
        <div className="flex flex-wrap items-center gap-2">
          {variants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">With icons</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <Check />
            Verified
          </Badge>
          <Badge variant="secondary">
            <Clock />
            Pending
          </Badge>
          <Badge>
            <GitBranch />
            main
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">As a link</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" render={<a href="#releases" />}>
            3 releases
          </Badge>
          <Badge variant="ghost" render={<a href="#changelog" />}>
            Changelog
          </Badge>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A badge stays still by design. Only colour and shadow react to hover and focus.
      </p>
    </div>
  );
}
