"use client";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/registry/cadence/context-menu";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * A context menu has no trigger to look at, so the specimen is the surface it is attached
 * to: two dashed drop zones, one of them a file tile with a submenu. Right-click either.
 */
export function ContextMenuPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-3">
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-56 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Right-click here</span>
            <span className="text-xs">A file, a row, a canvas</span>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            <ContextMenuItem>
              Open
              <ContextMenuShortcut>↵</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Rename
              <ContextMenuShortcut>F2</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Open with</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                <ContextMenuItem>Editor</ContextMenuItem>
                <ContextMenuItem>Preview</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive">
              Delete
              <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-56 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-sm">
            <span className="font-medium">Selection</span>
            <span className="text-xs text-muted-foreground">Checkbox and radio items</span>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            <ContextMenuLabel>Show</ContextMenuLabel>
            <ContextMenuCheckboxItem defaultChecked>Grid</ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem>Rulers</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      </PreviewRow>
    </PreviewStack>
  );
}
