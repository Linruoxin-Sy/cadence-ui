import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/cadence/accordion";
import { AttachmentTrigger } from "@/registry/cadence/attachment";
import { BubbleContent } from "@/registry/cadence/bubble";
import { Carousel, CarouselNext, CarouselPrevious } from "@/registry/cadence/carousel";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/cadence/navigation-menu";
import {
  Sidebar,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarInput,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/registry/cadence/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/registry/cadence/tabs";

const viewport = vi.hoisted(() => ({ mobile: false }));
vi.mock("@/registry/cadence/lib/hooks/use-mobile", () => ({ useIsMobile: () => viewport.mobile }));

describe("B6/B7 inherited compatibility", () => {
  it.each(["element", "function"] as const)(
    "resolves Accordion state on every part with %s render and cleanup replacement",
    (form) => {
      const oldCleanup = vi.fn();
      const newCleanup = vi.fn();
      const oldRef = vi.fn(() => oldCleanup);
      const newRef = vi.fn(() => newCleanup);
      const events: string[] = [];
      const drag = vi.fn((e) => {
        events.push("bubble");
        e.preventDefault();
      });
      const tree = (open: boolean, ref: typeof oldRef) => (
        <CadenceProvider mode="none">
          <Accordion value={open ? ["one"] : []} className={(s) => (s.value.length ? "root-open" : "root-closed")}>
            <AccordionItem value="one" className={(s) => (s.open ? "item-open" : "item-closed")}>
              <AccordionTrigger className={(s) => (s.open ? "trigger-open" : "trigger-closed")}>
                Question
              </AccordionTrigger>
              <AccordionContent
                keepMounted
                ref={ref}
                className={(s) => (s.open ? "pb-8 body-open" : "body-closed")}
                style={(s) => ({ color: s.open ? "red" : "blue" })}
                onDragStartCapture={() => events.push("capture")}
                onDragStart={drag}
                render={
                  form === "element" ? (
                    <section data-custom="element" />
                  ) : (
                    (props) => <section {...props} data-custom="function" />
                  )
                }
              >
                Answer
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CadenceProvider>
      );
      const view = render(tree(true, oldRef));
      const panel = screen.getByRole("region");
      const body = screen.getByText("Answer");
      expect(body).toHaveClass("pb-8", "body-open");
      expect(body).not.toHaveClass("pb-4");
      expect(panel).toHaveStyle({ color: "rgb(255, 0, 0)" });
      expect(panel.tagName).toBe("SECTION");
      expect(panel).not.toHaveAttribute("data-value");
      expect(panel).toHaveAttribute("data-custom", form);
      expect(view.container.querySelector('[data-slot="accordion"]')).toHaveClass("root-open");
      expect(view.container.querySelector('[data-slot="accordion-item"]')).toHaveClass("item-open");
      expect(screen.getByRole("button")).toHaveClass("trigger-open");
      const event = new Event("dragstart", { bubbles: true, cancelable: true });
      fireEvent(panel, event);
      expect(event.defaultPrevented).toBe(true);
      expect(events).toEqual(["capture", "bubble"]);
      view.rerender(tree(false, newRef));
      expect(view.container.querySelector('[data-slot="accordion-content"]')).toBe(panel);
      expect(screen.getByText("Answer")).toBe(body);
      expect(body).toHaveClass("body-closed");
      expect(panel).toHaveStyle({ color: "rgb(0, 0, 255)" });
      expect(oldCleanup).toHaveBeenCalledOnce();
      expect(newRef).toHaveBeenCalledWith(panel);
      view.unmount();
      expect(newCleanup).toHaveBeenCalledOnce();
    },
  );

  it("evaluates both Carousel Button callbacks with real disabled state and forwards native handlers", () => {
    const drag = vi.fn((e) => e.preventDefault());
    const view = render(
      <Carousel>
        <CarouselPrevious disabled className={(s) => (s.disabled ? "left-0 prev-disabled" : "prev-enabled")} />
        <CarouselNext
          disabled={false}
          className={(s) => (s.disabled ? "next-disabled" : "right-0 next-enabled")}
          onDragStart={drag}
        />
      </Carousel>,
    );
    expect(screen.getByRole("button", { name: "Previous slide" })).toHaveClass("left-0", "prev-disabled");
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(next).toHaveClass("right-0", "next-enabled");
    expect(next).not.toHaveClass("-right-12");
    fireEvent.dragStart(next);
    expect(drag).toHaveBeenCalledOnce();
    view.unmount();
  });

  it("evaluates Sidebar Base input/separator/trigger callbacks", () => {
    render(
      <SidebarProvider>
        <SidebarInput disabled className={(s) => (s.disabled ? "h-12 input-disabled" : "input-enabled")} />
        <SidebarSeparator
          orientation="vertical"
          className={(s) => (s.orientation === "vertical" ? "mx-4 separator-vertical" : "horizontal")}
        />
        <SidebarTrigger disabled className={(s) => (s.disabled ? "size-10 trigger-disabled" : "enabled")} />
      </SidebarProvider>,
    );
    expect(screen.getByRole("textbox")).toHaveClass("h-12", "input-disabled");
    expect(document.querySelector('[data-slot="sidebar-separator"]')).toHaveClass("mx-4", "separator-vertical");
    expect(screen.getByRole("button")).toHaveClass("size-10", "trigger-disabled");
  });

  it("forwards mobile Sidebar DOM props to its real Sheet content and preserves cleanup", () => {
    viewport.mobile = true;
    const ref = createRef<HTMLDivElement>();
    const drag = vi.fn();
    const view = render(
      <SidebarProvider>
        <Sidebar
          ref={ref}
          className="w-60 mobile-caller"
          style={{ color: "red" }}
          onDragStart={drag}
          data-testid="mobile-panel"
        >
          Inside
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));
    const panel = screen.getByTestId("mobile-panel");
    expect(ref.current).toBe(panel);
    expect(panel).toHaveClass("w-60", "mobile-caller");
    expect(panel).toHaveStyle({ color: "rgb(255, 0, 0)" });
    fireEvent.dragStart(panel);
    expect(drag).toHaveBeenCalledOnce();
    view.unmount();
    expect(ref.current).toBeNull();
    viewport.mobile = false;
  });
});

// These are the actual public useRender exports, including the extra Tooltip layer.
it.each(["element", "function"] as const)(
  "preserves native useRender props and cleanup through %s composition",
  (form) => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const capture = vi.fn();
    const drag = vi.fn((e) => e.preventDefault());
    const parts = [
      SidebarGroupAction,
      SidebarGroupLabel,
      SidebarMenuAction,
      SidebarMenuButton,
      SidebarMenuSubButton,
      AttachmentTrigger,
      BubbleContent,
    ];
    for (const Part of parts) {
      const view = render(
        <SidebarProvider defaultOpen={false}>
          <Part
            {...(Part === SidebarMenuButton ? { tooltip: "Details" } : {})}
            ref={ref}
            className="caller"
            style={{ color: "red" }}
            onDragStartCapture={capture}
            onDragStart={drag}
            render={
              form === "element" ? <div data-testid="rendered" /> : (props) => <div {...props} data-testid="rendered" />
            }
          >
            Content
          </Part>
        </SidebarProvider>,
      );
      const node = screen.getByTestId("rendered");
      expect(node).toHaveClass("caller");
      expect(node.style.color).toBe("red");
      expect(ref).toHaveBeenLastCalledWith(node);
      const event = new Event("dragstart", { bubbles: true, cancelable: true });
      fireEvent(node, event);
      expect(event.defaultPrevented).toBe(true);
      view.unmount();
    }
    expect(cleanup).toHaveBeenCalledTimes(parts.length);
    expect(capture).toHaveBeenCalledTimes(parts.length);
    expect(drag).toHaveBeenCalledTimes(parts.length);
  },
);

it("preserves Tabs trigger ref replacement through its private render bridge", () => {
  const cleanup = vi.fn();
  const oldRef = vi.fn(() => cleanup);
  const next = createRef<HTMLButtonElement>();
  const tree = (ref: typeof oldRef | typeof next, value: string) => (
    <Tabs value={value}>
      <TabsList>
        <TabsTrigger
          value="a"
          ref={ref}
          render={(props) => <button {...props} />}
          className={(s) => (s.active ? "active-caller" : "inactive-caller")}
        >
          Alpha
        </TabsTrigger>
        <TabsTrigger value="b">Beta</TabsTrigger>
      </TabsList>
    </Tabs>
  );
  const view = render(tree(oldRef, "a"));
  const alpha = screen.getByRole("tab", { name: "Alpha" });
  act(() => alpha.focus());
  view.rerender(tree(next, "b"));
  expect(next.current).toBe(alpha);
  expect(alpha).toHaveFocus();
  expect(alpha).toHaveClass("inactive-caller");
  expect(cleanup).toHaveBeenCalledOnce();
  view.unmount();
  expect(next.current).toBeNull();
});

it("replaces NavigationMenu's guard ref with cleanup while retaining its DOM", () => {
  const cleanup = vi.fn();
  const old = vi.fn(() => cleanup);
  const next = createRef<HTMLElement>();
  const tree = (ref: typeof old | typeof next) => (
    <NavigationMenu ref={ref} aria-label="Guard menu">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
  const view = render(tree(old));
  const node = screen.getByRole("navigation");
  view.rerender(tree(next));
  expect(next.current).toBe(node);
  expect(cleanup).toHaveBeenCalledOnce();
  view.unmount();
  expect(next.current).toBeNull();
});
