import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { duration, reducedDurationScale } from "@/registry/cadence/lib/motion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
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
import { TooltipProvider } from "@/registry/cadence/tooltip";
import { expectMotionContract } from "../motion-contract";
import { imperativeSamples, parameterCalls, presentationSamples } from "../motion-observer";

function Status() {
  const s = useSidebar();
  return <output>{s.state}</output>;
}
function Example({
  mode = "full",
  open,
  onOpenChange,
}: {
  mode?: "full" | "reduced" | "none";
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  return (
    <CadenceProvider mode={mode}>
      <SidebarProvider open={open} onOpenChange={onOpenChange}>
        <Sidebar>
          <SidebarInput aria-label="Search" />
          <SidebarSeparator />
          <SidebarMenuButton render={<a href="#content" />}>Projects</SidebarMenuButton>
        </Sidebar>
        <SidebarInset render={<section aria-label="Workspace content" />}>
          <SidebarTrigger />
          <Status />
        </SidebarInset>
      </SidebarProvider>
    </CadenceProvider>
  );
}
describe("Sidebar", () => {
  it("keeps the default inset main landmark", () => {
    render(<SidebarInset className="custom-inset">Main content</SidebarInset>);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("data-slot", "sidebar-inset");
    expect(main).toHaveClass("custom-inset", "flex-1");
    expect(main).not.toHaveAttribute("role");
  });
  it.each(["element", "function"] as const)(
    "renders an embedded inset section through %s with native props and ref cleanup",
    async (form) => {
      const cleanup = vi.fn();
      const ref = vi.fn(() => cleanup);
      const click = vi.fn();
      const { unmount } = render(
        <SidebarInset
          render={form === "element" ? <section /> : (props) => <section {...props} />}
          aria-label="Embedded workspace"
          className="caller-inset"
          style={{ color: "red" }}
          onClick={click}
          ref={ref}
        >
          <button type="button">Read report</button>
        </SidebarInset>,
      );
      const region = screen.getByRole("region", { name: "Embedded workspace" });
      expect(region.tagName).toBe("SECTION");
      expect(region).toHaveAttribute("data-slot", "sidebar-inset");
      expect(region).toHaveClass("caller-inset", "flex-1");
      expect(region).toHaveStyle({ color: "rgb(255, 0, 0)" });
      expect(ref).toHaveBeenCalledWith(region);
      await userEvent.tab();
      await userEvent.keyboard("{Enter}");
      expect(click).toHaveBeenCalledOnce();
      unmount();
      expect(cleanup).toHaveBeenCalledOnce();
    },
  );
  it("preserves defaults, native keyboard path, input identity, and cookie writes", async () => {
    const { container } = render(<Example />);
    const panel = container.querySelector('[data-slot="sidebar"]');
    expect(panel).toHaveAttribute("data-side", "left");
    expect(panel).toHaveAttribute("data-variant", "sidebar");
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "draft");
    await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(screen.getByText("collapsed")).toBeInTheDocument();
    expect(document.cookie).toContain("sidebar_state=false");
    expect(container.querySelector('[data-slot="sidebar-container"]')).toHaveAttribute("inert");
    fireEvent.keyDown(window, { key: "b", ctrlKey: true });
    expect(screen.getByText("expanded")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("draft");
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "#content");
  });
  it("delegates controlled state without changing the supplied value", async () => {
    const change = vi.fn();
    const { rerender } = render(<Example open onOpenChange={change} />);
    await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByText("expanded")).toBeInTheDocument();
    rerender(<Example open={false} onOpenChange={change} />);
    expect(screen.getByText("collapsed")).toBeInTheDocument();
  });
  it.each(["full", "reduced", "none"] as const)("keeps %s mode and cancels transforms on downgrade", async (mode) => {
    const { container, rerender } = render(<Example mode={mode} />);
    const input = screen.getByRole("textbox");
    imperativeSamples.length = 0;
    await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const panel = container.querySelector('[data-slot="sidebar-container"]') as HTMLElement;
    expectMotionContract(mode, {
      behavior: () => {
        // jsdom has no measurable layout. Both owners use native destinations;
        // actual coupled interpolation is exercised in the browser runner.
        expect(panel.style.transform).toBe("");
        expect(imperativeSamples).toHaveLength(0);
        expect(container.querySelector('[data-slot="sidebar-gap"]')).toHaveAttribute("data-motion", mode);
      },
    });
    expect(panel).toHaveAttribute("data-motion", mode);
    rerender(<Example mode="none" />);
    expect(panel).toHaveAttribute("data-motion", "none");
    expect(panel.style.transform).toBe("");
    expect(container.querySelector("input")).toBe(input);
  });
  // The composed hint is a real dependency: a collapsed icon sidebar enables it,
  // and the migrated Tooltip owns its own measured hint shell in every mode.
  it.each(["full", "reduced", "none"] as const)("opens the composed hint tooltip in %s", async (mode) => {
    render(
      <CadenceProvider mode={mode}>
        <TooltipProvider delay={0}>
          <SidebarProvider open={false}>
            <Sidebar collapsible="icon">
              <SidebarMenuButton tooltip="Projects">
                <span>Projects</span>
              </SidebarMenuButton>
            </Sidebar>
          </SidebarProvider>
        </TooltipProvider>
      </CadenceProvider>,
    );
    await userEvent.hover(screen.getByRole("button", { name: "Projects" }));
    const hint = await screen.findByRole("tooltip");
    expect(hint).toHaveAttribute("data-slot", "tooltip-content");
    expect(hint).toHaveTextContent("Projects");
    expectMotionContract(mode, { behavior: () => expect(hint).toBeInTheDocument() });
  });
  // The mobile composition is a real dependency: Sidebar renders the migrated
  // Sheet, whose panel shell owns its own measured block size in every mode.
  it.each(["full", "reduced", "none"] as const)("opens the composed mobile sheet in %s", async (mode) => {
    const width = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: 500 });
    try {
      render(
        <CadenceProvider mode={mode}>
          <SidebarProvider>
            <Sidebar>
              <SidebarMenuButton>
                <span>Projects</span>
              </SidebarMenuButton>
            </Sidebar>
            <SidebarTrigger />
          </SidebarProvider>
        </CadenceProvider>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
      const panel = await screen.findByRole("dialog");
      expect(panel).toHaveAttribute("data-slot", "sheet-content");
      expect(panel).toHaveAttribute("data-motion", mode);
      expectMotionContract(mode, { behavior: () => expect(panel).toHaveAttribute("data-side", "left") });
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
    }
  });
  it.each(["full", "reduced", "none"] as const)("renders the loading placeholder in %s", (mode) => {
    // SidebarMenuSkeleton composes the installed Skeleton, whose measured box and
    // pulse are that component's own owners; Sidebar names it as inherited.
    render(
      <CadenceProvider mode={mode}>
        <SidebarProvider>
          <Sidebar>
            <SidebarMenuSkeleton showIcon />
          </Sidebar>
        </SidebarProvider>
      </CadenceProvider>,
    );
    const placeholder = document.querySelector('[data-slot="skeleton"]');
    expect(placeholder).toHaveAttribute("data-motion", mode);
    expect(placeholder?.closest('[data-slot="sidebar-menu-skeleton"]')).not.toBeNull();
    expectMotionContract(mode);
  });
  it("forwards native events/styles/render refs and ref cleanup", () => {
    const ref = createRef<HTMLDivElement>();
    const cleanup = vi.fn();
    const cb = vi.fn(() => cleanup);
    const drag = vi.fn();
    const { unmount } = render(
      <SidebarProvider>
        <Sidebar ref={ref} onDragStart={drag} style={{ color: "red" }} className="custom">
          <SidebarMenuSubButton ref={cb} render={<a href="#sub" />}>
            Sub
          </SidebarMenuSubButton>
          <SidebarMenuSkeleton showIcon />
        </Sidebar>
      </SidebarProvider>,
    );
    expect(ref.current).toHaveClass("custom");
    expect(ref.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
    if (!ref.current) throw new Error("Missing panel");
    fireEvent.dragStart(ref.current);
    expect(drag).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalled();
    unmount();
    expect(ref.current).toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
  });
  it("supports static mode, icon/right/floating and caller trigger events", async () => {
    const click = vi.fn();
    const { container, rerender } = render(
      <SidebarProvider defaultOpen={false}>
        <Sidebar side="right" variant="floating" collapsible="icon">
          Keep
        </Sidebar>
        <SidebarTrigger onClick={click} />
      </SidebarProvider>,
    );
    expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute("data-collapsible", "icon");
    await userEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    expect(click).toHaveBeenCalledOnce();
    rerender(
      <SidebarProvider>
        <Sidebar collapsible="none">Static</Sidebar>
      </SidebarProvider>,
    );
    expect(screen.getByText("Static")).toHaveAttribute("data-slot", "sidebar");
    expect(container.querySelector('[data-slot="sidebar-container"]')).toBeNull();
  });
  it("removes keyboard subscription on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<Example />);
    act(() => unmount());
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
    remove.mockRestore();
  });
  it.each(["full", "reduced", "none"] as const)("preserves real icon label/ref/input semantics in %s", async (mode) => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const { container, rerender, unmount } = render(
      <CadenceProvider mode={mode}>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenuButton ref={ref} render={<a href="#destination" />}>
              <svg aria-hidden="true" />
              <span>Projects</span>
            </SidebarMenuButton>
            <SidebarInput aria-label="Persistent draft" />
          </Sidebar>
          <SidebarTrigger />
        </SidebarProvider>
      </CadenceProvider>,
    );
    const link = screen.getByRole("link", { name: "Projects" });
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "draft");
    await userEvent.click(slot(container, "sidebar-trigger"));
    expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute("data-collapsible", "icon");
    expect(link).toHaveAttribute("data-motion", mode);
    expect(link).not.toHaveAttribute("aria-hidden");
    expectMotionContract(mode, {
      behavior: () => {
        expect(input).toHaveValue("draft");
        expect(screen.getByRole("link", { name: "Projects" })).toBe(link);
      },
    });
    expect(ref).toHaveBeenCalledWith(link);
    // Replacing an actual render host must retire its physical registration.
    rerender(
      <CadenceProvider mode={mode}>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarMenuButton render={<button type="button" />}>
              <svg aria-hidden="true" />
              <span>Replacement</span>
            </SidebarMenuButton>
          </Sidebar>
        </SidebarProvider>
      </CadenceProvider>,
    );
    expect(cleanup).toHaveBeenCalledOnce();
    unmount();
  });
});

type PaintMode = "full" | "reduced" | "none";

function PaintExample({
  mode = "full",
  second = false,
  invalid = false,
}: {
  mode?: PaintMode;
  second?: boolean;
  invalid?: boolean;
}) {
  return (
    <CadenceProvider mode={mode}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarInput aria-label="Search" aria-invalid={invalid || undefined} />
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupAction aria-label="Add project">+</SidebarGroupAction>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Projects</SidebarMenuButton>
                <SidebarMenuAction showOnHover aria-label="Project actions">
                  *
                </SidebarMenuAction>
                <SidebarMenuBadge>3</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton render={<a href="#nested" />}>Nested</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          {second && (
            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>Preferences</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
        </SidebarInset>
      </SidebarProvider>
    </CadenceProvider>
  );
}

const slot = (container: HTMLElement, name: string) => container.querySelector(`[data-slot="${name}"]`) as HTMLElement;

/** The owner's own inline clock, so an inherited Input/Button clock cannot mask it. */
function paintClock(node: HTMLElement) {
  return Number.parseFloat(node.style.transitionDuration || "0");
}

function policy(form: string, exported: string) {
  return parameterCalls.filter((call) => call.form === form && call.origin?.exports.includes(exported)).at(-1);
}

/** The executed opacity clock of an observed presence parameter resolution. */
function clockOf(call: ReturnType<typeof policy>) {
  const result = call?.result as { opacity?: { duration: number } } | undefined;
  return result?.opacity?.duration ?? Number.NaN;
}

const colorSeconds = (mode: PaintMode) =>
  mode === "none" ? 0 : duration.fast * (mode === "reduced" ? reducedDurationScale : 1);

describe("Sidebar paint regions", () => {
  it.each(["full", "reduced", "none"] as const)("owns one paint clock per region in %s", (mode) => {
    const { container } = render(<PaintExample mode={mode} />);
    const button = screen.getByRole("button", { name: "Projects" });
    const action = slot(container, "sidebar-menu-action");
    const rail = slot(container, "sidebar-rail");
    const line = container.querySelector('[data-sidebar="rail-line"]') as HTMLElement;
    const label = slot(container, "sidebar-group-label");
    const badge = slot(container, "sidebar-menu-badge");
    const sub = slot(container, "sidebar-menu-sub");
    const inset = screen.getByRole("main");
    const inner = slot(container, "sidebar-inner");
    for (const node of [button, action, rail, line, label, badge, sub, inset, inner])
      expect(node).toHaveAttribute("data-motion", mode);
    // Item region: menu/action/rail interaction paint, including the rail's line.
    expect(button.style.transitionProperty).toBe("background-color, color, box-shadow");
    expect(action.style.transitionProperty).toBe("background-color, color");
    expect(rail.style.transitionProperty).toBe("background-color");
    expect(line.style.transitionProperty).toBe("background-color");
    // Surface region: shell/inset/submenu and non-item label/badge paint.
    expect(label.style.transitionProperty).toBe("color");
    expect(badge.style.transitionProperty).toBe("color");
    expect(sub.style.transitionProperty).toBe("border-left-color");
    expect(inner.style.transitionProperty).toContain("background-color");
    expect(inset.style.transitionProperty).toBe("background-color, box-shadow");
    for (const node of [button, action, rail, line, label, badge, sub, inset, inner])
      expect(paintClock(node)).toBeCloseTo(colorSeconds(mode));
    // No `transition: all`, no opacity on a colour owner and no delay.
    for (const node of [button, action, rail, line, label, badge, sub, inset, inner]) {
      expect(node.style.transitionProperty).not.toContain("all");
      expect(node.style.transitionProperty).not.toContain("opacity");
      expect(node.style.transitionDelay).toBe("0s");
    }
    expectMotionContract(mode, { root: container, policy: ["color"] });
  });

  it.each(["full", "reduced"] as const)("settles the focused region only in %s", async (mode) => {
    render(<PaintExample mode={mode} second />);
    const first = screen.getByRole("button", { name: "Projects" });
    const other = screen.getByRole("button", { name: "Preferences" });
    const label = screen.getAllByText("Workspace")[0]?.closest('[data-slot="sidebar-group-label"]') as HTMLElement;
    const shell = document.querySelector('[data-slot="sidebar-inner"]') as HTMLElement;
    const seconds = duration.fast * (mode === "reduced" ? reducedDurationScale : 1);
    expect(paintClock(other)).toBeCloseTo(seconds);
    await act(async () => first.focus());
    // DOM focus-within cancels this region's colour clock and settles its declared paint.
    expect(paintClock(first)).toBe(0);
    expect(paintClock(label)).toBe(0);
    // The containing shell region of the focused control settles as well.
    expect(paintClock(shell)).toBe(0);
    // A disjoint region stays eligible for verified colour feedback.
    expect(paintClock(other)).toBeCloseTo(seconds);
    await act(async () => other.focus());
    expect(paintClock(other)).toBe(0);
    expect(paintClock(first)).toBeCloseTo(seconds);
  });

  it.each(["full", "reduced", "none"] as const)("settles invalid regions in %s", async (mode) => {
    render(<PaintExample mode={mode} invalid />);
    const input = screen.getByRole("textbox");
    const shell = document.querySelector('[data-slot="sidebar-inner"]') as HTMLElement;
    const label = document.querySelector('[data-slot="sidebar-group-label"]') as HTMLElement;
    expect(input).toHaveAttribute("aria-invalid", "true");
    // The shell's own invalid region settles immediately; group paint is disjoint here.
    expect(paintClock(shell)).toBe(0);
    expect(paintClock(label)).toBeCloseTo(colorSeconds(mode));
  });
});

describe("Sidebar action visibility", () => {
  it.each(["full", "reduced", "none"] as const)("owns one opacity clock for reveal and hide in %s", async (mode) => {
    const { container } = render(<PaintExample mode={mode} />);
    const item = slot(container, "sidebar-menu-item");
    const action = slot(container, "sidebar-menu-action");
    const revealSeconds = mode === "none" ? 0 : duration.fast * (mode === "reduced" ? reducedDurationScale : 1);
    await userEvent.hover(item);
    const enter = policy("data.transition/opacity", "SidebarMenuAction");
    expect(enter).toMatchObject({ mode });
    expect(clockOf(enter)).toBeCloseTo(revealSeconds);
    expect(action).not.toHaveAttribute("data-action-exiting");
    await userEvent.unhover(item);
    const exit = policy("exit.fade/opacity", "SidebarMenuAction");
    expect(exit).toMatchObject({ mode });
    expect(clockOf(exit)).toBeCloseTo(revealSeconds);
    // jsdom has no Web Animations: the channel settles and never leaves a stale hold.
    expect(action).not.toHaveAttribute("data-action-exiting");
    expect(action.style.opacity).toBe("");
  });

  it.each(["full", "reduced", "none"] as const)("settles a focus reveal immediately in %s", async (mode) => {
    const { container } = render(<PaintExample mode={mode} />);
    const action = slot(container, "sidebar-menu-action");
    const present = () =>
      [...presentationSamples.values()]
        .filter((sample) => sample.node === action && sample.properties?.includes("opacity"))
        .at(-1);
    const button = screen.getByRole("button", { name: "Projects" });
    await act(async () => button.focus());
    // Focus is a committed immediate cause: it exposes the action without a flight.
    expect(present()?.target).toMatchObject({ present: true });
    expect(action).not.toHaveAttribute("data-action-exiting");
    expect(action.style.opacity).toBe("");
    await act(async () => button.blur());
    // Leaving the row settles rather than holding a half-faded or exiting envelope.
    expect(action).not.toHaveAttribute("data-action-exiting");
    expect(action.style.opacity).toBe("");
  });

  it.each(["full", "reduced", "none"] as const)("invalidates a pending reveal on collapse in %s", async (mode) => {
    const { container } = render(<PaintExample mode={mode} />);
    const item = slot(container, "sidebar-menu-item");
    const action = slot(container, "sidebar-menu-action");
    await userEvent.hover(item);
    const before = parameterCalls.length;
    await userEvent.click(slot(container, "sidebar-trigger"));
    expect(container.querySelector('[data-slot="sidebar"]')).toHaveAttribute("data-collapsible", "icon");
    // Collapse semantics stay authoritative: the pending hover completion is retired.
    const settled = parameterCalls
      .slice(before)
      .filter((call) => call.form === "exit.fade/opacity" && call.origin?.exports.includes("SidebarMenuAction"));
    expect(settled.length).toBeGreaterThan(0);
    expect(action).not.toHaveAttribute("data-action-exiting");
    expect(action.style.opacity).toBe("");
    // Re-expanding does not replay the consumed reveal.
    await userEvent.click(slot(container, "sidebar-trigger"));
    expect(action).not.toHaveAttribute("data-action-exiting");
  });

  it("keeps a plain action out of the reveal channel", () => {
    const { container } = render(
      <CadenceProvider mode="full">
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>Projects</SidebarMenuButton>
                <SidebarMenuAction aria-label="Always visible">*</SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </Sidebar>
        </SidebarProvider>
      </CadenceProvider>,
    );
    const action = slot(container, "sidebar-menu-action");
    expect(action.className).not.toContain("md:opacity-0");
    expect(action).not.toHaveAttribute("data-action-exiting");
  });
});
