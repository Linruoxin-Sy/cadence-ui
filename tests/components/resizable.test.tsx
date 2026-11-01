import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { GroupImperativeHandle, PanelImperativeHandle } from "react-resizable-panels";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/cadence/resizable";

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
  for (const mode of ["full", "reduced", "none"] as const) {
    it(`keeps static parts and input identity through ${mode}`, () => {
      const tree = (m: typeof mode) => (
        <CadenceProvider mode={m}>
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
      fireEvent.change(input, { target: { value: "retained" } });
      view.rerender(tree(mode));
      expect(screen.getByRole("textbox")).toBe(input);
      expect(input).toHaveValue("retained");
      for (const el of view.container.querySelectorAll("[data-slot]")) {
        expect(el).not.toHaveAttribute("data-motion");
        expect((el as HTMLElement).style.transform).toBe("");
        expect((el as HTMLElement).style.transition).toBe("");
      }
    });
  }
});
