"use client";

import { CheckIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { Badge } from "@/registry/cadence/badge";
import { PreviewRow, PreviewStack } from "./shell";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

/**
 * Six variants, then the two things a badge does that a plain span cannot: carry an
 * icon, and *be* a link. `render` is what makes the second one real — the badge stays
 * a badge, the element under it becomes an anchor, and the `[a&]:hover` styles from
 * `badgeVariants` start applying.
 */
export function BadgePreview() {
  const { control, choose } = usePreviewVariant("Badge", previewVariantOptions);
  return (
    <>
      {control}
      <PreviewStack>
        <PreviewRow>
          <Badge variant={choose("default")}>Default</Badge>
          <Badge variant={choose("secondary")}>Secondary</Badge>
          <Badge variant={choose("destructive")}>Destructive</Badge>
          <Badge variant={choose("outline")}>Outline</Badge>
          <Badge variant={choose("ghost")}>Ghost</Badge>
          <Badge variant={choose("link")}>Link</Badge>
        </PreviewRow>

        <PreviewRow>
          <Badge variant={choose("default")}>
            <CheckIcon />
            Verified
          </Badge>
          <Badge variant={choose("secondary")}>
            <ClockIcon />
            Pending
          </Badge>
          <Badge variant={choose("outline")}>
            <GitBranchIcon />
            main
          </Badge>
          <Badge variant={choose("outline")} render={<a href="#badge-releases" />}>
            3 releases
          </Badge>
          <Badge variant={choose("ghost")} render={<a href="#badge-changelog" />}>
            Changelog
          </Badge>
        </PreviewRow>
      </PreviewStack>
    </>
  );
}
