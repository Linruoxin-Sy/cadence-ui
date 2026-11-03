"use client";

import { CheckIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { Badge } from "@/registry/cadence/badge";
import { PreviewRow } from "./shell";

const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

/**
 * Six variants, then the two things a badge does that a plain span cannot: carry an
 * icon, and *be* a link. `render` is what makes the second one real — the badge stays
 * a badge, the element under it becomes an anchor, and the `[a&]:hover` styles from
 * `badgeVariants` start applying.
 */
function Variants() {
  return (
    <PreviewRow>
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant[0]?.toUpperCase()}
          {variant.slice(1)}
        </Badge>
      ))}
    </PreviewRow>
  );
}

function WithIcon() {
  return (
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
    </PreviewRow>
  );
}

function AsLink() {
  return (
    <PreviewRow>
      <Badge variant="outline" render={<a href="/docs/changelog" />}>
        3 releases
      </Badge>
      <Badge variant="ghost" render={<a href="/docs/changelog" />}>
        Changelog
      </Badge>
    </PreviewRow>
  );
}

const examples = { variants: Variants, icon: WithIcon, link: AsLink };

export function BadgePreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Badge example: ${example}`);
    return <Example />;
  }
  return <Variants />;
}
