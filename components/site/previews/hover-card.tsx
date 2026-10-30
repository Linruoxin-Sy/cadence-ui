"use client";

import { Avatar, AvatarFallback } from "@/registry/cadence/avatar/avatar";
import { Button } from "@/registry/cadence/button/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/registry/cadence/hover-card/hover-card";

export function HoverCardPreview() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        Reviewed by{" "}
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
                <p className="text-sm font-medium leading-none">Lin Ruoxin</p>
                <p className="text-sm text-muted-foreground">Maintains the motion layer and the registry.</p>
                <Button size="xs" variant="secondary" className="mt-1 w-fit">
                  Follow
                </Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
        on 28 October.
      </p>

      <p className="text-xs text-muted-foreground">
        Hover or focus the name: the panel fades in and grows out of the link. Links and buttons inside stay reachable,
        because the card is not modal and does not trap focus. Escape closes it and leaves focus on the trigger.
      </p>
    </div>
  );
}
