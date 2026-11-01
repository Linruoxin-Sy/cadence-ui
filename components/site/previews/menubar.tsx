"use client";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/registry/cadence/menubar";
import { PopupMotionScope } from "./popup-motion-scope";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["default", "destructive"] as const;

/**
 * A menubar is a container, so the specimen is the bar: four menus, each one a different
 * shape of content — plain items, a submenu, and a selection group. Open one and press
 * `ArrowRight` to move along the bar.
 */
export function MenubarPreview() {
  const { control, choose } = usePreviewVariant("Menubar", previewVariantOptions);
  return (
    <>
      {control}
      <PopupMotionScope>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem variant={choose("default")}>
                New
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem variant={choose("default")}>
                Open…
                <MenubarShortcut>⌘O</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem variant={choose("default")}>
                Save
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem variant={choose("default")}>
                Undo
                <MenubarShortcut>⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarItem variant={choose("default")}>
                Redo
                <MenubarShortcut>⇧⌘Z</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Find</MenubarSubTrigger>
                <MenubarSubContent className="w-44">
                  <MenubarItem variant={choose("default")}>Next match</MenubarItem>
                  <MenubarItem variant={choose("default")}>Previous match</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Show</MenubarLabel>
              <MenubarCheckboxItem defaultChecked>Sidebar</MenubarCheckboxItem>
              <MenubarCheckboxItem>Line numbers</MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarLabel>Density</MenubarLabel>
              <MenubarRadioGroup defaultValue="comfortable">
                <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
                <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem variant={choose("default")}>Documentation</MenubarItem>
              <MenubarItem variant={choose("default")}>Keyboard shortcuts</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </PopupMotionScope>
    </>
  );
}
