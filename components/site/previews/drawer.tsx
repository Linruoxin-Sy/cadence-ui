"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/cadence/drawer";

const DESTINATIONS = ["Inbox", "Archive", "Read later"] as const;

export function DrawerPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Drawer open={open} onOpenChange={setOpen} showSwipeHandle>
        <DrawerTrigger render={<Button variant="outline" />}>Move conversation</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Move conversation</DrawerTitle>
            <DrawerDescription>Drag the sheet down to dismiss, or pick a destination.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-1 pt-2">
            {DESTINATIONS.map((destination) => (
              <DrawerClose
                key={destination}
                render={<Button variant="ghost" className="justify-start" />}
                onClick={() => setOpen(false)}
              >
                {destination}
              </DrawerClose>
            ))}
          </div>
          <DrawerFooter>
            <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <p className="text-xs text-muted-foreground">
        The sheet tracks the drag through Base UI&apos;s swipe variables, so the backdrop comes back as you pull. Under
        reduced motion it appears and disappears in place, and the swipe handle — the only signal that says &quot;drag
        me&quot; — stays visible.
      </p>
    </div>
  );
}
