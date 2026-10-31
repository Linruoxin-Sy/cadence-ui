"use client";

import { CheckIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { Badge } from "@/registry/cadence/badge";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Six variants, then the two things a badge does that a plain span cannot: carry an
 * icon, and *be* a link. `render` is what makes the second one real — the badge stays
 * a badge, the element under it becomes an anchor, and the `[a&]:hover` styles from
 * `badgeVariants` start applying.
 */
export function BadgePreview() {
  return (
    <PreviewStack>
      <PreviewRow>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="link">Link</Badge>
      </PreviewRow>

      <PreviewRow>
        <Badge>
          <CheckIcon />
          Verified
        </Badge>
        <Badge variant="secondary">
          <ClockIcon />
          Pending
        </Badge>
        <Badge variant="outline">
          <GitBranchIcon />
          main
        </Badge>
        <Badge variant="outline" render={<a href="#badge-releases" />}>
          3 releases
        </Badge>
        <Badge variant="ghost" render={<a href="#badge-changelog" />}>
          Changelog
        </Badge>
      </PreviewRow>
    </PreviewStack>
  );
}
