"use client";

import { Home, Inbox, MoreHorizontal, Plus, Settings, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useId, useRef, useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/registry/cadence/sidebar";
import { PreviewStack } from "./shell";

// The transform contains desktop fixed panels inside this embedded application shell.
// Render the embedded content as a named section inside the documentation main.
function Frame({
  label,
  children,
  content,
  side = "left",
  defaultOpen = true,
  open,
  onOpenChange,
}: {
  label: string;
  children: ReactNode;
  content?: ReactNode;
  side?: "left" | "right";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      style={{ "--sidebar-width": "12rem" } as CSSProperties}
      className={`relative isolate h-96 min-h-96 overflow-hidden rounded-lg border [transform:translateZ(0)] ${side === "right" ? "flex-row-reverse" : ""}`}
    >
      {children}
      <SidebarInset render={<section />} aria-label={`${label} content`} className="min-w-0 gap-3 p-3">
        <SidebarTrigger aria-label={`Toggle ${label}`} />
        <p className="text-sm font-medium">Project overview</p>
        {content ?? <p className="text-xs text-muted-foreground">Your workspace content.</p>}
      </SidebarInset>
    </SidebarProvider>
  );
}

function Navigation({ label }: { label: string }) {
  const target = useId();
  const [query, setQuery] = useState("");
  return (
    <>
      <SidebarHeader>
        <strong className="truncate text-sm group-data-[collapsible=icon]:hidden">Acme workspace</strong>
        <SidebarInput
          className="group-data-[collapsible=icon]:hidden"
          aria-label={`Search ${label}`}
          placeholder="Search workspace"
          value={query}
          onValueChange={setQuery}
        />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label={label}>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(
                  [
                    [Home, "Overview"],
                    [Inbox, "Inbox"],
                    [Settings, "Settings"],
                  ] as const
                )
                  .filter(([, text]) => text.toLowerCase().includes(query.toLowerCase()))
                  .map(([Icon, text]) => (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        render={<a href={`#${target}`} aria-current={text === "Overview" ? "page" : undefined} />}
                        isActive={text === "Overview"}
                        tooltip={text}
                      >
                        <Icon aria-hidden="true" />
                        <span>{text}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
            <p id={target} className="sr-only">
              Workspace navigation destination
            </p>
          </SidebarGroup>
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <span className="truncate text-xs group-data-[collapsible=icon]:hidden">Acme team</span>
      </SidebarFooter>
      <SidebarRail />
    </>
  );
}

function Workspace({
  label,
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  defaultOpen = true,
}: {
  label: string;
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  defaultOpen?: boolean;
}) {
  return (
    <Frame label={label} side={side} defaultOpen={defaultOpen}>
      <Sidebar side={side} variant={variant} collapsible={collapsible} className="md:absolute md:h-full">
        <Navigation label={label} />
      </Sidebar>
    </Frame>
  );
}

function HookControls() {
  const { state, openMobile, isMobile, setOpen, setOpenMobile, toggleSidebar } = useSidebar();
  return (
    <div className="flex flex-col items-start gap-2 text-xs">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Expand desktop
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
        Collapse desktop
      </Button>
      <Button size="sm" variant="outline" onClick={toggleSidebar}>
        Toggle navigation
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpenMobile(true)}>
        Open mobile
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpenMobile(false)}>
        Close mobile
      </Button>
      <output data-sidebar-state>
        {state} / {openMobile ? "mobile open" : "mobile closed"} / {isMobile ? "mobile" : "desktop"}
      </output>
    </div>
  );
}

function ControlledNavigation() {
  const [open, setOpen] = useState(true);
  const [changes, setChanges] = useState(0);
  return (
    <Frame
      label="Controlled navigation"
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setChanges((n) => n + 1);
      }}
      content={
        <>
          <HookControls />
          <output aria-label="Desktop changes">Desktop changes: {changes}</output>
        </>
      }
    >
      <Sidebar className="md:absolute md:h-full">
        <Navigation label="Controlled navigation" />
      </Sidebar>
    </Frame>
  );
}

function MobileClose() {
  const { isMobile, setOpenMobile } = useSidebar();
  return isMobile ? (
    <Button variant="ghost" size="sm" onClick={() => setOpenMobile(false)}>
      <X aria-hidden="true" />
      Close navigation
    </Button>
  ) : null;
}
function MobileBehavior() {
  const [draft, setDraft] = useState("");
  return (
    <Frame
      label="Mobile workspace"
      side="right"
      content={<p className="text-xs">Navigation becomes a Sheet below 768px.</p>}
    >
      <Sidebar side="right" className="md:absolute md:h-full">
        <SidebarHeader>
          <MobileClose />
          <SidebarInput
            aria-label="Persistent mobile draft"
            placeholder="Caller-owned draft"
            value={draft}
            onValueChange={setDraft}
          />
        </SidebarHeader>
        <SidebarContent>
          <Navigation label="Mobile workspace" />
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

function MenuStyles() {
  return (
    <Frame label="Menu styles">
      <Sidebar collapsible="none" className="h-full">
        <SidebarContent>
          <nav aria-label="Menu styles">
            <SidebarGroup>
              <SidebarGroupLabel>Commands</SidebarGroupLabel>
              <SidebarMenu>
                {(["sm", "default", "lg"] as const).map((size) => (
                  <SidebarMenuItem key={size}>
                    <SidebarMenuButton size={size}>
                      <Home aria-hidden="true" />
                      <span>{size} command</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton variant="outline">
                    <Inbox aria-hidden="true" />
                    <span>Outline command</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive aria-pressed="true">
                    Active command
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>Disabled command</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

function GroupsAndActions() {
  const [projects, setProjects] = useState(["Website"]);
  const [action, setAction] = useState("No project action");
  return (
    <Frame label="Project actions" content={<output>{action}</output>}>
      <Sidebar className="md:absolute md:h-full" collapsible="icon">
        <SidebarHeader>
          <span className="truncate text-sm font-medium">Acme projects</span>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <nav aria-label="Project actions">
            <SidebarGroup>
              <SidebarGroupLabel render={<h3 aria-label="Projects" />}>Projects</SidebarGroupLabel>
              <SidebarGroupAction
                aria-label="Add project"
                onClick={() => setProjects((rows) => [...rows, `Project ${rows.length + 1}`])}
              >
                <Plus aria-hidden="true" />
              </SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((name, i) => (
                    <SidebarMenuItem key={name}>
                      <SidebarMenuButton onClick={() => setAction(`Opened ${name}`)}>
                        <Home aria-hidden="true" />
                        <span>{name}</span>
                      </SidebarMenuButton>
                      {i === 0 ? (
                        <SidebarMenuBadge aria-label="3 updates">3</SidebarMenuBadge>
                      ) : (
                        <SidebarMenuAction
                          showOnHover
                          aria-label={`Options for ${name}`}
                          onClick={() => setAction(`Options for ${name}`)}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </SidebarMenuAction>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setAction("Opened settings")}>
                <Settings aria-hidden="true" />
                <span>Settings</span>
              </SidebarMenuButton>
              <SidebarMenuAction aria-label="Settings options" onClick={() => setAction("Settings options")}>
                <MoreHorizontal aria-hidden="true" />
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </Frame>
  );
}

function SubNavigation() {
  const id = useId();
  return (
    <Frame label="Nested navigation">
      <Sidebar collapsible="icon" className="md:absolute md:h-full">
        <SidebarContent>
          <nav aria-label="Nested navigation">
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Home aria-hidden="true" />
                    <span>Projects</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {(["md", "sm"] as const).map((size) => (
                      <SidebarMenuSubItem key={size}>
                        <SidebarMenuSubButton
                          size={size}
                          href={`#${id}`}
                          isActive={size === "md"}
                          aria-current={size === "md" ? "page" : undefined}
                        >
                          {size} project
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton aria-disabled="true" tabIndex={-1}>
                        Unavailable project
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
          <span id={id} className="sr-only">
            Project destination
          </span>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </Frame>
  );
}

function LoadingNavigation() {
  const [ready, setReady] = useState(false);
  return (
    <Frame
      label="Loading navigation"
      content={
        <Button size="sm" variant="outline" onClick={() => setReady((value) => !value)}>
          {ready ? "Reload navigation" : "Show navigation"}
        </Button>
      }
    >
      <Sidebar className="md:absolute md:h-full">
        <SidebarContent>
          <SidebarGroup>
            {ready ? (
              <nav aria-label="Loaded projects">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Website</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </nav>
            ) : (
              <div role="status" aria-label="Loading projects">
                <SidebarMenuSkeleton />
                <SidebarMenuSkeleton showIcon />
              </div>
            )}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

function CallerUpdates() {
  const [projects, setProjects] = useState(["Website", "Mobile app"]);
  const [draft, setDraft] = useState("");
  return (
    <Frame
      label="Caller updates"
      content={
        <Button
          size="sm"
          variant="outline"
          onClick={() => setProjects((rows) => (rows.length === 2 ? [...rows, "Desktop app"] : rows.slice(0, 2)))}
        >
          {projects.length === 2 ? "Add project" : "Remove project"}
        </Button>
      }
    >
      <Sidebar className="md:absolute md:h-full">
        <SidebarHeader>
          <SidebarInput
            aria-label="Project draft"
            value={draft}
            onValueChange={setDraft}
            placeholder="Caller-owned draft"
          />
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label="Caller updates">
            <SidebarGroup>
              <SidebarMenu>
                {projects.map((name) => (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton>{name}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </nav>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </Frame>
  );
}

function CustomParts() {
  const link = useRef<HTMLAnchorElement>(null);
  const id = useId();
  const [clicks, setClicks] = useState(0);
  return (
    <Frame
      label="Custom parts"
      side="right"
      content={
        <>
          <Button className="hidden md:inline-flex" size="sm" variant="outline" onClick={() => link.current?.focus()}>
            Focus project link
          </Button>
          <output>Native clicks: {clicks}</output>
        </>
      }
    >
      <Sidebar side="right" dir="rtl" style={{ transform: "none" }} className="md:absolute md:h-full">
        <SidebarContent>
          <nav aria-label="Custom parts">
            <SidebarGroup>
              <SidebarGroupLabel render={<h3 aria-label="Projects" />}>المشاريع</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<a ref={link} href={`#${id}`} lang="ar" />}
                    onClick={() => setClicks((n) => n + 1)}
                    tooltip={{ children: "Website", side: "left" }}
                  >
                    <Home aria-hidden="true" />
                    <span>الموقع</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </nav>
          <span id={id} className="sr-only">
            Custom project destination
          </span>
        </SidebarContent>
      </Sidebar>
    </Frame>
  );
}

export function SidebarPreview({ example }: { example?: string }) {
  let content: ReactNode;
  switch (example) {
    case "icon-navigation":
      content = <Workspace label="Icon navigation" collapsible="icon" defaultOpen={false} />;
      break;
    case "controlled-navigation":
      content = <ControlledNavigation />;
      break;
    case "variants":
      content = (["sidebar", "floating", "inset"] as const).map((variant) => (
        <Workspace key={variant} label={`${variant} navigation`} variant={variant} />
      ));
      break;
    case "right-side":
      content = <Workspace label="Right navigation" side="right" />;
      break;
    case "collapse-modes":
      content = (["offcanvas", "icon", "none"] as const).map((collapsible) => (
        <Workspace
          key={collapsible}
          label={`${collapsible} collapse navigation`}
          collapsible={collapsible}
          defaultOpen={false}
        />
      ));
      break;
    case "mobile-behavior":
      content = <MobileBehavior />;
      break;
    case "menu-styles":
      content = <MenuStyles />;
      break;
    case "groups-and-actions":
      content = <GroupsAndActions />;
      break;
    case "sub-navigation":
      content = <SubNavigation />;
      break;
    case "loading-navigation":
      content = <LoadingNavigation />;
      break;
    case "caller-updates":
      content = <CallerUpdates />;
      break;
    case "custom-parts":
      content = <CustomParts />;
      break;
    case "without-motion":
      content = (
        <CadenceProvider mode="none">
          <Workspace label="Instant navigation" />
        </CadenceProvider>
      );
      break;
    default:
      content = <Workspace label="Workspace navigation" />;
  }
  return <PreviewStack>{content}</PreviewStack>;
}
