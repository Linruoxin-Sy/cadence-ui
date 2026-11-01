import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Sidebar,
  SidebarInput,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/registry/cadence/sidebar";
import { expectMotionContract } from "../motion-contract";
import { imperativeSamples } from "../motion-observer";

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
          <SidebarMenuButton render={<a href="#content" />}>Projects</SidebarMenuButton>
        </Sidebar>
        <SidebarTrigger />
        <Status />
      </SidebarProvider>
    </CadenceProvider>
  );
}
describe("Sidebar", () => {
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
        if (mode !== "full") {
          expect(panel.style.transform).toBe("none");
          expect(imperativeSamples).toHaveLength(0);
        } else {
          expect(imperativeSamples).toHaveLength(1);
          expect(imperativeSamples[0]?.[1]).toBe(-100);
          expect(imperativeSamples[0]?.[2]).toMatchObject({ type: "spring" });
        }
      },
    });
    expect(panel).toHaveAttribute("data-motion", mode);
    rerender(<Example mode="none" />);
    expect(panel).toHaveAttribute("data-motion", "none");
    expect(panel.style.transform).toBe("none");
    expect(container.querySelector("input")).toBe(input);
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
});
