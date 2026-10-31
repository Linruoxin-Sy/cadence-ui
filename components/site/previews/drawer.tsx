"use client";

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
import { PreviewRow, PreviewStack } from "./shell";

const DESTINATIONS = ["Inbox", "Archive", "Read later"] as const;

/**
 * Three swipe directions, because the direction is what the gesture follows: down
 * with a handle (the phone-shaped default), up, and from the side. The panel tracks
 * the drag through `--drawer-swipe-*`, so the backdrop returns as you pull.
 */
export function DrawerPreview() {
  const content = (
    <>
      <DrawerHeader>
        <DrawerTitle>Move conversation</DrawerTitle>
        <DrawerDescription>Drag the sheet back to dismiss, or pick a destination.</DrawerDescription>
      </DrawerHeader>
      <div className="flex flex-col gap-1 pt-2">
        {DESTINATIONS.map((destination) => (
          <DrawerClose key={destination} render={<Button variant="ghost" className="justify-start" />}>
            {destination}
          </DrawerClose>
        ))}
      </div>
      <DrawerFooter>
        <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
      </DrawerFooter>
    </>
  );

  return (
    <PreviewStack>
      <PreviewRow className="gap-2">
        <Drawer showSwipeHandle>
          <DrawerTrigger render={<Button variant="outline" />}>Down</DrawerTrigger>
          <DrawerContent>{content}</DrawerContent>
        </Drawer>

        <Drawer swipeDirection="up">
          <DrawerTrigger render={<Button variant="ghost" />}>Up</DrawerTrigger>
          <DrawerContent>{content}</DrawerContent>
        </Drawer>

        <Drawer swipeDirection="right">
          <DrawerTrigger render={<Button variant="ghost" />}>From the right</DrawerTrigger>
          <DrawerContent>{content}</DrawerContent>
        </Drawer>
      </PreviewRow>
    </PreviewStack>
  );
}
