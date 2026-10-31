"use client";

import { Avatar, AvatarFallback } from "@/registry/cadence/avatar";
import { Button } from "@/registry/cadence/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/cadence/hover-card";
import { PreviewStack } from "./shell";

/**
 * The trigger is inline text, which is the whole point: a hover card belongs inside a
 * sentence and must not break the line's rhythm. The content carries the profile —
 * avatar, name, one line, one action — and is not modal.
 */
export function HoverCardPreview() {
  return (
    <PreviewStack>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <Avatar size="sm">
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
        <span>Reviewed by</span>
        <HoverCard>
          <HoverCardTrigger render={<Button variant="link" size="sm" className="h-auto p-0" />}>
            @linruoxin
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex gap-3">
              <Avatar size="sm">
                <AvatarFallback>LR</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-none font-medium">Lin Ruoxin</p>
                <p className="text-sm text-muted-foreground">Maintains the motion layer and the registry.</p>
                <Button size="xs" variant="secondary" className="mt-1 w-fit">
                  Follow
                </Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
        <span>on 28 October</span>
      </div>
    </PreviewStack>
  );
}
