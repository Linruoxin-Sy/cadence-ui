"use client";

import { CheckIcon, ClockIcon, GitBranchIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Badge } from "@/registry/cadence/badge";
import { Button } from "@/registry/cadence/button";
import { PreviewRow } from "./shell";

const variants = ["default", "secondary", "destructive", "outline", "ghost", "link"] as const;

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

function ChangingContent() {
  const [ready, setReady] = useState(false);
  const [quantity, setQuantity] = useState(19);
  return (
    <div className="flex flex-col items-start gap-5">
      <PreviewRow>
        <Badge variant="secondary" style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>
          {ready ? "Status ready" : "Status retry"}
        </Badge>
        <Badge style={{ fontFamily: '"Courier New", monospace', fontFeatureSettings: "normal" }}>{quantity}</Badge>
        <Badge variant="outline">v1.2.3</Badge>
      </PreviewRow>
      <PreviewRow>
        <Button variant="outline" size="sm" onClick={() => setReady((value) => !value)}>
          Change status
        </Button>
        <Button variant="outline" size="sm" onClick={() => setQuantity((value) => value + 1)}>
          Increase quantity
        </Button>
      </PreviewRow>
    </div>
  );
}

function Presence() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex min-h-8 items-center gap-3">
        <span className="text-sm text-muted-foreground">Release status</span>
        <AnimatePresence>
          {visible && (
            <Badge key="status" variant="secondary">
              Available
            </Badge>
          )}
        </AnimatePresence>
      </div>
      <Button variant="outline" size="sm" onClick={() => setVisible((value) => !value)}>
        Toggle status
      </Button>
    </div>
  );
}

const examples = {
  variants: Variants,
  icon: WithIcon,
  link: AsLink,
  "changing-content": ChangingContent,
  presence: Presence,
};

export function BadgePreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Badge example: ${example}`);
    return <Example />;
  }
  return <Variants />;
}
