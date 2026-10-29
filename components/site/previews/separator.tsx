"use client";

import { Separator } from "@/registry/cadence/separator/separator";

export function SeparatorPreview() {
  return (
    <div className="space-y-8">
      <div className="max-w-sm space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Horizontal</p>
        <div className="space-y-3">
          <p className="text-sm">Signed in as ada@example.com.</p>
          <Separator />
          <p className="text-sm text-muted-foreground">Billing is handled by finance.</p>
          <Separator decorative />
          <p className="text-sm text-muted-foreground">The second rule is decorative: screen readers skip it.</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Vertical</p>
        <div className="flex h-6 items-center gap-3 text-sm">
          <span>Draft</span>
          <Separator orientation="vertical" />
          <span className="text-muted-foreground">Edited 2 minutes ago</span>
          <Separator orientation="vertical" />
          <span className="text-muted-foreground">ada@example.com</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        One pixel, token-coloured, no transition. The boundary is the message.
      </p>
    </div>
  );
}
