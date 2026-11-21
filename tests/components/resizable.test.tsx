import { fireEvent, render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { createRef } from "react";
import type { GroupImperativeHandle, PanelImperativeHandle } from "react-resizable-panels";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/cadence/resizable";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Resizable", () => {
  it("preserves DOM/imperative refs, native callbacks, classes, styles and slots", () => {
    const root = createRef<HTMLDivElement>();
    const panel = createRef<HTMLDivElement>();
    const handle = createRef<HTMLDivElement>();
    const api = createRef<GroupImperativeHandle>();
    const pane = createRef<PanelImperativeHandle>();
    const click = vi.fn();
    const view = render(
      <ResizablePanelGroup elementRef={root} groupRef={api} className="w-80 caller" style={{ height: 280 }}>
        <ResizablePanel
          id="first"
          elementRef={panel}
          panelRef={pane}
          className="inner"
          style={{ color: "red" }}
          collapsible
          minSize="20%"
          defaultSize="40%"
        >
          Files
        </ResizablePanel>
        <ResizableHandle
          elementRef={handle}
          withHandle
          className="w-2 caller-handle"
          aria-label="Resize files"
          onClick={click}
        />
        <ResizablePanel id="second">Editor</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(root.current).toHaveAttribute("data-slot", "resizable-panel-group");
    expect(root.current).toHaveClass("w-80", "caller");
    expect(root.current).not.toHaveClass("w-full");
    expect(root.current).toHaveStyle({ height: "280px" });
    expect(panel.current).toHaveAttribute("data-slot", "resizable-panel");
    // Children are exact caller content, so the plain text' element is the library's
    // inner content element that carries the caller's classes and styles.
    expect(screen.getByText("Files")).toHaveClass("inner");
    expect(screen.getByText("Files")).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(handle.current).toHaveClass("w-2", "caller-handle");
    expect(handle.current?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(screen.getByRole("separator"));
    expect(click).toHaveBeenCalledOnce();
    expect(api.current?.setLayout).toBeTypeOf("function");
    expect(pane.current?.collapse).toBeTypeOf("function");
    expect(pane.current?.resize).toBeTypeOf("function");
    view.unmount();
    expect(root.current).toBeNull();
    expect(api.current).toBeNull();
    expect(pane.current).toBeNull();
  });

  it("preserves defaults, vertical orientation and disabled semantics", () => {
    const view = render(
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle aria-label="Resize" disabled />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
    expect(screen.getByRole("separator").querySelector("svg")).toBeNull();
    expect(screen.getByRole("separator")).toHaveAttribute("aria-disabled", "true");
    view.rerender(
      <ResizablePanelGroup>
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("keeps native allocation, panel identity and direct editing through every mode", () => {
    const tree = (mode: "full" | "reduced" | "none") => (
      <CadenceProvider mode={mode}>
        <ResizablePanelGroup>
          <ResizablePanel>
            <input aria-label="Draft" defaultValue="saved" />
          </ResizablePanel>
          <ResizableHandle aria-label="Resize" />
          <ResizablePanel>Editor</ResizablePanel>
        </ResizablePanelGroup>
      </CadenceProvider>
    );
    const view = render(tree("full"));
    const input = screen.getByRole("textbox");
    const group = view.container.querySelector('[data-slot="resizable-panel-group"]') as HTMLElement;
    const panel = view.container.querySelector('[data-slot="resizable-panel"]') as HTMLElement;
    fireEvent.change(input, { target: { value: "retained" } });
    for (const mode of ["reduced", "none", "full"] as const) {
      view.rerender(tree(mode));
      expect(screen.getByRole("textbox")).toBe(input);
      expect(input).toHaveValue("retained");
      expect(view.container.querySelector('[data-slot="resizable-panel-group"]')).toBe(group);
      expect(view.container.querySelector('[data-slot="resizable-panel"]')).toBe(panel);
      // The panel library owns allocation: it writes its own width, and no authored
      // transform/transition writer competes with that geometry.
      expect(group.style.transform).toBe("");
      expect(group.style.transition).toBe("");
      expect(panel.style.transform).toBe("");
      expect(panel.style.transition).toBe("");
    }
    for (const animated of view.container.querySelectorAll("[data-motion]")) {
      expect(animated).toHaveAttribute("data-motion", "full");
    }
  });

  it("adds the grip after mount and keeps the separator operable while it enters", () => {
    const draw = (withHandle: boolean) => (
      <ResizablePanelGroup>
        <ResizablePanel>Files</ResizablePanel>
        <ResizableHandle aria-label="Resize files" withHandle={withHandle} />
        <ResizablePanel>Editor</ResizablePanel>
      </ResizablePanelGroup>
    );
    const view = render(draw(false));
    const handle = screen.getByRole("separator");
    expect(handle.querySelector('[data-slot="resizable-handle-grip"]')).toBeNull();
    handle.focus();
    expect(handle).toHaveFocus();
    view.rerender(draw(true));
    expect(screen.getByRole("separator")).toBe(handle);
    expect(handle.querySelector('[data-slot="resizable-handle-grip"]')).toBeInTheDocument();
    expect(handle).toHaveFocus();
    // The grip is decorative: keyboard resize and the native hit region stay on the rule.
    expect(handle).toHaveAttribute("role", "separator");
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle.querySelector('[data-slot="resizable-handle-grip"] svg')).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Resizable v2", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(["full", "reduced", "none"] as const)(
    "executes every declared action on its actual part in %s",
    async (mode) => {
      const draw = (stage: number, tone: string, isPresent: boolean) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <PresenceContext.Provider
            value={{ id: "handle", initial: false, isPresent, register: () => () => {}, onExitComplete: () => {} }}
          >
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel id="first" defaultSize="50%">
                Files
              </ResizablePanel>
              {stage > 0 && (
                <ResizableHandle aria-label="Resize panes" withHandle={stage > 1} style={{ color: tone }} />
              )}
              {stage > 0 && (
                <ResizablePanel id="second" defaultSize="50%">
                  Editor
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </PresenceContext.Provider>
        </CadenceProvider>
      );

      const view = render(draw(0, "#1f3f33", true));
      // A handle inserted inside an entering scope owns one opacity entrance.
      view.rerender(draw(1, "#1f3f33", false));
      await expectV2MotionAction("resizable", "resizable.handle.enter", mode, () =>
        view.rerender(draw(1, "#1f3f33", true)),
      );
      // A grip added later owns its own entrance instead of replaying the rule's.
      view.rerender(draw(2, "#1f3f33", false));
      await expectV2MotionAction("resizable", "resizable.grip.enter", mode, () =>
        view.rerender(draw(2, "#1f3f33", true)),
      );
      await expectV2MotionAction("resizable", "resizable.handle.colour", mode, () =>
        view.rerender(draw(2, "#7a3f9e", true)),
      );
      expectMotionContract(mode, { policy: ["color"] });
      await expectV2NativeBoundaries("resizable", { container: view.container });
    },
  );

  it("commits panel content revisions immediately without a display host", async () => {
    const draw = (label: string, quantity: number) => (
      <CadenceProvider mode="full" timeScale={0}>
        <ResizablePanelGroup>
          <ResizablePanel id="first" defaultSize="50%">
            {label}
          </ResizablePanel>
          <ResizableHandle aria-label="Resize panes" />
          <ResizablePanel id="second" defaultSize="50%">
            {quantity}
          </ResizablePanel>
        </ResizablePanelGroup>
      </CadenceProvider>
    );
    const view = render(draw("Files", 10));
    const panel = view.container.querySelector('[data-slot="resizable-panel"]') as HTMLElement;
    expect(panel.querySelectorAll("[data-motion]")).toHaveLength(0);
    view.rerender(draw("Repository", 42));
    // No authored display host and no motion channel: exact caller content, committed at once.
    expect(view.container.querySelector('[data-slot="resizable-panel-text"]')).toBeNull();
    expect(view.container.querySelector('[data-slot="resizable-panel-number"]')).toBeNull();
    expect(screen.getByText("Repository")).toBeInTheDocument();
    expect(view.container.querySelector('[data-slot="resizable-panel"]')).toBe(panel);
    expect(panel.style.transform).toBe("");
    expect(panel.style.transition).toBe("");
    const handle = screen.getByRole("separator");
    handle.setAttribute("data-separator", "active");
    view.rerender(draw("Workspace", 7));
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(handle).toBe(screen.getByRole("separator"));
  });
});
