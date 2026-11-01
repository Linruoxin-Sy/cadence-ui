import { fireEvent, render, screen } from "@testing-library/react";
import { type ComponentProps, createRef } from "react";
import { expect, it, vi } from "vitest";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockExpandButton,
  CodeBlockHeader,
  CodeBlockTab,
  CodeBlockTabs,
} from "@/registry/cadence/code-block";
import { Progress, ProgressIndicator, ProgressTrack } from "@/registry/cadence/progress";

for (const kind of ["progress", "floating", "header"] as const) {
  const fixture = (props: ComponentProps<"div">) =>
    kind === "progress" ? (
      <Progress value={40}>
        <ProgressTrack>
          <ProgressIndicator data-testid="native" {...props} />
        </ProgressTrack>
      </Progress>
    ) : (
      <CodeBlock>
        {kind === "header" ? (
          <CodeBlockHeader>
            <CodeBlockActions data-testid="native" {...props} />
          </CodeBlockHeader>
        ) : (
          <CodeBlockActions data-testid="native" {...props} />
        )}
      </CodeBlock>
    );
  it.each(["onAnimationStart", "onDrag", "onDragStart", "onDragEnd"] as const)(
    `${kind}: native %s preserves event and propagation`,
    (handler) => {
      const order: string[] = [];
      const bubble = vi.fn();
      const listener = vi.fn((event) => {
        order.push("target");
        expect(event.nativeEvent).toBe(native);
        expect(event.currentTarget).toBe(screen.getByTestId("native"));
        event.preventDefault();
        event.stopPropagation();
      });
      render(
        <div {...{ [handler]: bubble, [`${handler}Capture`]: () => order.push("capture") }}>
          {fixture({ [handler]: listener })}
        </div>,
      );
      const native = new Event(handler === "onAnimationStart" ? "animationstart" : handler.slice(2).toLowerCase(), {
        bubbles: true,
        cancelable: true,
      });
      fireEvent(screen.getByTestId("native"), native);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(order).toEqual(["capture", "target"]);
      expect(bubble).not.toHaveBeenCalled();
      expect(native.defaultPrevented).toBe(true);
    },
  );
  it(`${kind}: hands refs over with React 19 cleanup on the same focused DOM`, () => {
    const cleanup = vi.fn();
    const first = vi.fn(() => cleanup);
    const secondCleanup = vi.fn();
    const second = vi.fn(() => secondCleanup);
    const view = render(fixture({ ref: first, tabIndex: 0 }));
    const node = screen.getByTestId("native");
    node.focus();
    view.rerender(fixture({ ref: second, tabIndex: 0 }));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(node);
    expect(node).toHaveFocus();
    expect(screen.getByTestId("native")).toBe(node);
    const object = createRef<HTMLDivElement>();
    view.rerender(fixture({ ref: object, tabIndex: 0 }));
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(object.current).toBe(node);
    view.unmount();
    expect(object.current).toBeNull();
  });
}

it("Progress caller render owns the node and gets evaluated state/styles/events", () => {
  const drag = vi.fn();
  const ref = createRef<HTMLDivElement>();
  const fixture = (value: number) => (
    <Progress value={value}>
      <ProgressTrack>
        <ProgressIndicator
          data-testid="custom"
          ref={ref}
          onDrag={drag}
          className={(state) => (state.status === "complete" ? "h-8" : "h-7")}
          style={() => ({ width: "75%", opacity: 0.6 })}
          render={(props, state) => <div {...props} data-status={state.status} />}
        />
      </ProgressTrack>
    </Progress>
  );
  const view = render(fixture(40));
  const node = screen.getByTestId("custom");
  expect(ref.current).toBe(node);
  expect(node).toHaveClass("h-7");
  expect(node).toHaveStyle({ width: "75%", opacity: 0.6 });
  fireEvent.drag(node);
  expect(drag).toHaveBeenCalledTimes(1);
  view.rerender(fixture(100));
  expect(screen.getByTestId("custom")).toBe(node);
  expect(node).toHaveClass("h-8");
  expect(node).toHaveAttribute("data-status", "complete");
});

it("CodeBlock caller list ref preserves keyboard context", () => {
  const ref = createRef<HTMLDivElement>();
  render(
    <CodeBlock>
      <CodeBlockTabs ref={ref}>
        <CodeBlockTab value="a">A</CodeBlockTab>
        <CodeBlockTab value="b">B</CodeBlockTab>
      </CodeBlockTabs>
    </CodeBlock>,
  );
  expect(ref.current).toBe(screen.getByRole("tablist"));
  screen.getByRole("tab", { name: "A" }).focus();
  fireEvent.keyDown(screen.getByRole("tab", { name: "A" }), { key: "ArrowRight" });
  expect(screen.getByRole("tab", { name: "B" })).toHaveFocus();
});
it("CodeBlock caller content ref preserves fold measurement context", () => {
  const ref = createRef<HTMLPreElement>();
  const scroll = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(400);
  render(
    <CodeBlock maxLines={2}>
      <CodeBlockContent ref={ref} style={{ lineHeight: "20px", paddingTop: "0px" }}>
        source
      </CodeBlockContent>
      <CodeBlockExpandButton />
    </CodeBlock>,
  );
  expect(ref.current).toBe(document.querySelector('[data-slot="code-block-content"]'));
  expect(screen.getByRole("button", { name: "Show all" })).toBeInTheDocument();
  scroll.mockRestore();
});

for (const kind of ["tabs", "content"] as const) {
  it(`CodeBlock ${kind}: React 19 callback cleanup and object ref handoff`, () => {
    const cleanup = vi.fn();
    const first = vi.fn((_node: HTMLDivElement | HTMLPreElement | null) => cleanup);
    const second = createRef<HTMLDivElement & HTMLPreElement>();
    const fixture = (ref: typeof first | typeof second) => (
      <CodeBlock>
        {kind === "tabs" ? (
          <CodeBlockTabs ref={ref}>
            <CodeBlockTab value="a">A</CodeBlockTab>
          </CodeBlockTabs>
        ) : (
          <CodeBlockContent ref={ref}>source</CodeBlockContent>
        )}
      </CodeBlock>
    );
    const view = render(fixture(first));
    const node = first.mock.calls[0]?.[0];
    view.rerender(fixture(second));
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(second.current).toBe(node);
    view.unmount();
    expect(second.current).toBeNull();
  });
}
