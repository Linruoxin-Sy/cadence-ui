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
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../registry/cadence/command";
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
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../../registry/cadence/navigation-menu";
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
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "../../registry/cadence/sidebar";
import { createToastManager, Toaster } from "../../registry/cadence/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../registry/cadence/tooltip";

// A dedicated browser regression input. Changing a native select emits change,
// so mode updates do not also perform an outside press or steal popup focus.
// Production examples keep the header and normal outside-dismissal semantics.
function NavigationMenuFixture() {
  const [value, setValue] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex min-h-96 w-full flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          className="rounded border px-2 py-1"
          onClick={() => setValue(value === "learn" ? "build" : "learn")}
        >
          Switch panel
        </button>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={expanded} onChange={(e) => setExpanded(e.target.checked)} />
          Extra links
        </label>
      </div>
      <NavigationMenu className="flex-none" aria-label="Example navigation" value={value} onValueChange={setValue}>
        <NavigationMenuList>
          <NavigationMenuItem value="learn">
            <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
            <NavigationMenuContent className="w-60" keepMounted>
              <button type="button" className="rounded p-2 text-sm underline" onClick={() => setExpanded((v) => !v)}>
                Toggle details
              </button>
              <NavigationMenuLink href="#installation">Installation</NavigationMenuLink>
              <NavigationMenuLink href="#usage">Usage</NavigationMenuLink>
              {expanded && <NavigationMenuLink href="#motion-contract">Motion contract</NavigationMenuLink>}
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="build">
            <NavigationMenuTrigger>Build</NavigationMenuTrigger>
            <NavigationMenuContent className="grid w-80 grid-cols-2 gap-2" keepMounted>
              <button
                type="button"
                className="col-span-2 rounded p-2 text-sm underline"
                onClick={() => setExpanded((v) => !v)}
              >
                Toggle details
              </button>
              {expanded && <NavigationMenuLink href="#motion-contract">Motion contract</NavigationMenuLink>}
              {["Components", "Templates", "Themes", "Registry", "Accessibility", "Performance"].map((text) => (
                <NavigationMenuLink key={text} href="#usage">
                  {text}
                </NavigationMenuLink>
              ))}
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#api">API</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function SidebarFixtureControls() {
  const { state, openMobile, setOpen, setOpenMobile } = useSidebar();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Expand desktop
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Collapse desktop
      </button>
      <button type="button" onClick={() => setOpenMobile(false)}>
        Close mobile
      </button>
      <output>
        {state} / {openMobile ? "mobile open" : "mobile closed"}
      </output>
    </>
  );
}
function SidebarMotionFixture() {
  return (
    <SidebarProvider className="relative isolate h-96 min-h-96 overflow-hidden [transform:translateZ(0)]">
      <Sidebar className="md:absolute md:h-full">
        <SidebarHeader>
          <SidebarInput aria-label="Sidebar fixture draft" />
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Fixture workspace">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton render={<a href="#destination" />}>Overview</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </nav>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset role="region" aria-label="Fixture content">
        <SidebarTrigger />
        <SidebarFixtureControls />
        <p id="destination">Destination</p>
      </SidebarInset>
    </SidebarProvider>
  );
}

function PopupMotionFixture({
  component,
  initialMode,
  timeScale,
}: {
  component: string;
  initialMode: CadenceMode;
  timeScale: number;
}) {
  const [toastManager] = useState(createToastManager);
  const [mode, setMode] = useState(initialMode);
  const [commandOpen, setCommandOpen] = useState(false);
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
          {component === "toast" && (
            <Toaster toastManager={toastManager} timeout={0}>
              <Button onClick={() => toastManager.add({ title: "Changes saved", type: "success" })}>
                Show notification
              </Button>
            </Toaster>
          )}
          {component === "command" && (
            <>
              <Button onClick={() => setCommandOpen(true)}>Open command palette</Button>
              <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
                <Command label="Fixture actions">
                  <CommandInput placeholder="Retained command query" />
                  <CommandList>
                    <CommandGroup heading="Actions">
                      <CommandItem value="projects">Projects</CommandItem>
                      <CommandItem value="settings">Settings</CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </CommandDialog>
            </>
          )}
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
          {component === "navigation-menu" && <NavigationMenuFixture />}
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
          {component === "sidebar" && <SidebarMotionFixture />}
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
