import { useId, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../registry/cadence/alert-dialog";
import { Button } from "../../registry/cadence/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "../../registry/cadence/combobox";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../../registry/cadence/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../../registry/cadence/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "../../registry/cadence/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../../registry/cadence/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../registry/cadence/hover-card";
import { Input } from "../../registry/cadence/input";
import type { CadenceMode } from "../../registry/cadence/lib/motion";
import { CadenceProvider } from "../../registry/cadence/lib/provider";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "../../registry/cadence/menubar";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../../registry/cadence/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "../../registry/cadence/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../registry/cadence/tooltip";

// A dedicated browser regression input. Changing a native select emits change,
// so mode updates do not also perform an outside press or steal popup focus.
// Production examples keep the header and normal outside-dismissal semantics.
function PopupMotionFixture({
  component,
  initialMode,
  timeScale,
}: {
  component: string;
  initialMode: CadenceMode;
  timeScale: number;
}) {
  const [mode, setMode] = useState(initialMode);
  const inputId = useId();
  const comboAnchor = useComboboxAnchor();
  const field = (
    <label htmlFor={inputId}>
      Fixture draft
      <Input id={inputId} defaultValue="Retained draft" />
    </label>
  );
  return (
    <CadenceProvider mode={mode} timeScale={timeScale}>
      <main className="grid min-h-screen place-content-center gap-8 p-8">
        <label>
          Fixture motion
          <select
            aria-label="Fixture motion"
            value={mode}
            onChange={(event) => setMode(event.target.value as CadenceMode)}
          >
            {["full", "reduced", "none"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <div data-preview={component}>
          {component === "combobox" && (
            <Combobox multiple items={["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"]} defaultValue={["Next.js"]}>
              <ComboboxChips ref={comboAnchor}>
                <ComboboxValue>
                  {(value: string[]) => (
                    <>
                      {value.map((item) => (
                        <ComboboxChip key={item}>{item}</ComboboxChip>
                      ))}
                      <ComboboxChipsInput aria-label="Framework" />
                    </>
                  )}
                </ComboboxValue>
              </ComboboxChips>
              <ComboboxContent anchor={comboAnchor}>
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
          {component === "dialog" && (
            <Dialog>
              <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
              <DialogContent>
                <DialogTitle>Dialog fixture</DialogTitle>
                <DialogDescription>Actual registry parts with a separate mode input.</DialogDescription>
                {field}
                <DialogFooter showCloseButton />
              </DialogContent>
            </Dialog>
          )}
          {component === "alert-dialog" && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button />}>Open confirmation</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Confirmation fixture</AlertDialogTitle>
                <AlertDialogDescription>Actual registry parts with a separate mode input.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {component === "popover" && (
            <Popover>
              <PopoverTrigger render={<Button />}>Open popover</PopoverTrigger>
              <PopoverContent>
                <PopoverTitle>Popover fixture</PopoverTitle>
                <PopoverDescription>Actual registry parts with a separate mode input.</PopoverDescription>
                {field}
              </PopoverContent>
            </Popover>
          )}
          {component === "tooltip" && (
            <Tooltip>
              <TooltipTrigger render={<Button />}>Open tooltip</TooltipTrigger>
              <TooltipContent>Actual registry tooltip</TooltipContent>
            </Tooltip>
          )}
          {component === "sheet" && (
            <Sheet>
              <SheetTrigger render={<Button />}>Open sheet</SheetTrigger>
              <SheetContent>
                <SheetTitle>Sheet fixture</SheetTitle>
                <SheetDescription>Actual registry panel with a separate mode input.</SheetDescription>
                {field}
                <SheetFooter />
              </SheetContent>
            </Sheet>
          )}
          {component === "drawer" && (
            <Drawer showSwipeHandle>
              <DrawerTrigger render={<Button />}>Open drawer</DrawerTrigger>
              <DrawerContent>
                <DrawerTitle>Drawer fixture</DrawerTitle>
                <DrawerDescription>Actual registry panel with a separate mode input.</DrawerDescription>
                {field}
                <DrawerFooter>
                  <DrawerClose render={<Button />}>Close</DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
          {component === "dropdown-menu" && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button />}>View</DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuCheckboxItem defaultChecked>Comments</DropdownMenuCheckboxItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuGroup>
                        <DropdownMenuItem>Backlog</DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem>Done</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {component === "menubar" && (
            <Menubar aria-label="Fixture menus">
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarGroup>
                    <MenubarCheckboxItem defaultChecked>Comments</MenubarCheckboxItem>
                    <MenubarSub>
                      <MenubarSubTrigger>Move to</MenubarSubTrigger>
                      <MenubarSubContent>
                        <MenubarGroup>
                          <MenubarItem>Backlog</MenubarItem>
                        </MenubarGroup>
                      </MenubarSubContent>
                    </MenubarSub>
                    <MenubarItem>Done</MenubarItem>
                  </MenubarGroup>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          )}
          {component === "context-menu" && (
            <ContextMenu>
              <ContextMenuTrigger tabIndex={0}>Context target</ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuGroup>
                  <ContextMenuCheckboxItem defaultChecked>Comments</ContextMenuCheckboxItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuGroup>
                        <ContextMenuItem>Backlog</ContextMenuItem>
                      </ContextMenuGroup>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuItem>Done</ContextMenuItem>
                </ContextMenuGroup>
              </ContextMenuContent>
            </ContextMenu>
          )}
          {component === "hover-card" && (
            <HoverCard>
              <HoverCardTrigger render={<Button />}>Open hover card</HoverCardTrigger>
              <HoverCardContent>{field}</HoverCardContent>
            </HoverCard>
          )}
        </div>
      </main>
    </CadenceProvider>
  );
}

const params = new URL(location.href).searchParams;
const root = document.getElementById("root");
if (!root) throw new Error("missing fixture root");
createRoot(root).render(
  <PopupMotionFixture
    component={params.get("component") ?? "popover"}
    initialMode={(params.get("motion") ?? "none") as CadenceMode}
    timeScale={Number(params.get("timeScale") ?? 1)}
  />,
);
