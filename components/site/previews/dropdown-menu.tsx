"use client";

import { Button } from "@/registry/cadence/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/registry/cadence/dropdown-menu";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * A menu is its panel, so the specimen opens all three shapes it ships with: plain
 * items with shortcuts (the default), state items (checkbox and radio), and a
 * submenu. The destructive item is inside the first panel because its colour is the
 * part of the item most likely to regress.
 */
export function DropdownMenuPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>Actions</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Pull request</DropdownMenuLabel>
            <DropdownMenuItem>
              Edit
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Duplicate
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuItem>Backlog</DropdownMenuItem>
                <DropdownMenuItem>In review</DropdownMenuItem>
                <DropdownMenuItem>Done</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              Delete
              <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" />}>View</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            <DropdownMenuCheckboxItem defaultChecked>Description</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Comments</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Density</DropdownMenuLabel>
            <DropdownMenuRadioGroup defaultValue="comfortable">
              <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" />} disabled>
            Disabled
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Nothing here</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PreviewRow>
    </PreviewStack>
  );
}
