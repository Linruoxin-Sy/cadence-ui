"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { useId, useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/cadence/hover-card";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

function ReviewerCard() {
  return (
    <p className="text-sm">
      Reviewed by{" "}
      <HoverCard>
        <HoverCardTrigger render={<a className="underline underline-offset-4" href="/docs/changelog" />}>
          @linruoxin
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-medium">Lin Ruoxin</p>
          <p className="text-sm text-muted-foreground">Maintains the motion layer and the registry.</p>
        </HoverCardContent>
      </HoverCard>
    </p>
  );
}

function FollowReviewer() {
  const follow = useRef<HTMLButtonElement>(null);
  const [following, setFollowing] = useState(false);
  return (
    <HoverCard>
      <HoverCardTrigger
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            follow.current?.focus();
          }
        }}
        render={<a href="/docs/changelog" className="text-sm underline" />}
      >
        Reviewer profile
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm font-medium">Lin Ruoxin</p>
        <p className="mb-3 text-sm text-muted-foreground">Maintains the motion layer.</p>
        <Button
          size="xs"
          variant="secondary"
          ref={follow}
          aria-pressed={following}
          onClick={() => setFollowing((value) => !value)}
        >
          {following ? "Following" : "Follow"}
        </Button>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardSides() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["top", "right", "bottom", "left"] as const).map((value) => (
        <HoverCard key={value}>
          <HoverCardTrigger render={<Button variant="outline" />}>{value}</HoverCardTrigger>
          <HoverCardContent side={value} alignOffset={0}>
            Preview: {value}
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}

function HoverCardAlignments() {
  return (
    <div className="flex flex-wrap gap-3">
      {(["start", "center", "end"] as const).map((value) => (
        <HoverCard key={value}>
          <HoverCardTrigger render={<Button variant="outline" />}>{value}</HoverCardTrigger>
          <HoverCardContent align={value} alignOffset={0}>
            Preview: {value}
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}

function LogicalHoverCards() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <div className="flex flex-wrap gap-3">
          {(["inline-start", "inline-end"] as const).map((value) => (
            <HoverCard key={value}>
              <HoverCardTrigger render={<Button variant="outline" />}>{value}</HoverCardTrigger>
              <HoverCardContent side={value} alignOffset={0}>
                Preview: {value}
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      </div>
    </DirectionProvider>
  );
}

function DelayedReviewer() {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={400}
        closeDelay={300}
        render={<a href="/docs/changelog" className="text-sm underline" />}
      >
        Delayed profile
      </HoverCardTrigger>
      <HoverCardContent>Preview after a short pointer pause.</HoverCardContent>
    </HoverCard>
  );
}

function ControlledReviewer() {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide preview" : "Show preview"}
      </Button>
      <HoverCard open={open} onOpenChange={setOpen} triggerId={id}>
        <HoverCardTrigger id={id} render={<a href="/docs/changelog" className="text-sm underline" />}>
          Controlled profile
        </HoverCardTrigger>
        <HoverCardContent>Caller-owned profile preview.</HoverCardContent>
      </HoverCard>
    </div>
  );
}

function HoverCardMotionScopes() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-3">
        <HoverCard>
          <HoverCardTrigger render={<Button variant="outline" />}>Open without motion</HoverCardTrigger>
          <HoverCardContent data-testid="initial-none">Immediate preview</HoverCardContent>
        </HoverCard>
        <CadenceProvider mode="full">
          <HoverCard>
            <HoverCardTrigger render={<Button variant="outline" />}>Open nested full</HoverCardTrigger>
            <HoverCardContent data-testid="nested-full">The OS preference still wins</HoverCardContent>
          </HoverCard>
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function HoverCardPreview({ example }: { example?: string }) {
  if (example === "action") return <FollowReviewer />;
  if (example === "sides") return <HoverCardSides />;
  if (example === "alignments") return <HoverCardAlignments />;
  if (example === "logical-sides") return <LogicalHoverCards />;
  if (example === "delay") return <DelayedReviewer />;
  if (example === "controlled") return <ControlledReviewer />;
  if (example === "without-motion") return <HoverCardMotionScopes />;
  return <ReviewerCard />;
}
