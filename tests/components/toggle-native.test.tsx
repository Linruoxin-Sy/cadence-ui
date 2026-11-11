import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, createRef } from "react";
import { expect, it, vi } from "vitest";
import { Toggle } from "@/registry/cadence/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";

it.each(["toggle", "item"])("delivers native animationstart through %s default renderer", (kind) => {
  const listener = vi.fn();
  render(
    kind === "toggle" ? (
      <Toggle onAnimationStart={listener}>Native</Toggle>
    ) : (
      <ToggleGroup>
        <ToggleGroupItem value="native" onAnimationStart={listener}>
          Native
        </ToggleGroupItem>
      </ToggleGroup>
    ),
  );
  fireEvent.animationStart(screen.getByRole("button"));
  expect(listener).toHaveBeenCalledTimes(1);
});

for (const kind of ["toggle", "item"] as const) {
  const fixture = (props: ComponentProps<typeof Toggle>) =>
    kind === "toggle" ? (
      <Toggle {...props}>Native</Toggle>
    ) : (
      <ToggleGroup>
        <ToggleGroupItem value="native" {...props}>
          Native
        </ToggleGroupItem>
      </ToggleGroup>
    );

  it.each(["onAnimationStart", "onDrag", "onDragStart", "onDragEnd"] as const)(
    `${kind}: real %s capture, bubble and cancellation`,
    (handler) => {
      const order: string[] = [];
      const parent = vi.fn();
      const listener = vi.fn((event) => {
        order.push("target");
        expect(event.nativeEvent).toBe(native);
        expect(event.currentTarget).toBe(screen.getByRole("button"));
        event.preventDefault();
        event.stopPropagation();
      });
      render(
        <div {...{ [handler]: parent, [`${handler}Capture`]: () => order.push("capture") }}>
          {fixture({ [handler]: listener })}
        </div>,
      );
      const native = new Event(handler === "onAnimationStart" ? "animationstart" : handler.slice(2).toLowerCase(), {
        bubbles: true,
        cancelable: true,
      });
      fireEvent(screen.getByRole("button"), native);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(order).toEqual(["capture", "target"]);
      expect(parent).not.toHaveBeenCalled();
      expect(native.defaultPrevented).toBe(true);
    },
  );

  it(`${kind}: replaces ref identity without replacing a focused node`, () => {
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const first = vi.fn(() => firstCleanup);
    const second = vi.fn(() => secondCleanup);
    const view = render(fixture({ ref: first }));
    const node = screen.getByRole("button");
    node.focus();
    view.rerender(fixture({ ref: second }));
    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(node);
    expect(node).toHaveFocus();
    expect(screen.getByRole("button")).toBe(node);
    const object = createRef<HTMLButtonElement>();
    view.rerender(fixture({ ref: object }));
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(object.current).toBe(node);
    view.unmount();
    expect(object.current).toBeNull();
  });

  it(`${kind}: caller render element retains native handlers and can veto Base click`, async () => {
    const change = vi.fn();
    const caller = vi.fn();
    const inner = vi.fn();
    render(
      fixture({
        onPressedChange: change,
        onDrag: caller,
        render: (
          <button
            type="button"
            onDrag={inner}
            onClick={(event) => {
              (event as typeof event & { preventBaseUIHandler(): void }).preventBaseUIHandler();
            }}
          />
        ),
      }),
    );
    const node = screen.getByRole("button");
    fireEvent.drag(node);
    expect(inner).toHaveBeenCalledTimes(1);
    expect(caller).toHaveBeenCalledTimes(1);
    await userEvent.click(node);
    expect(change).not.toHaveBeenCalled();
    expect(node).toHaveAttribute("aria-pressed", "false");
  });

  it(`${kind}: render function spreads actual state, style and native events`, () => {
    const drag = vi.fn();
    render(
      fixture({
        disabled: true,
        onDragEnd: drag,
        className: (state) => (state.disabled ? "px-8" : "px-7"),
        style: (state) => ({ opacity: state.disabled ? 0.6 : 1 }),
        render: (props, state) => <button {...props} type="button" data-render-disabled={state.disabled} />,
      }),
    );
    const node = screen.getByRole("button");
    expect(node).toHaveAttribute("data-render-disabled", "true");
    expect(node).toHaveClass("px-8");
    expect(node).toHaveStyle({ opacity: 0.6 });
    fireEvent.dragEnd(node);
    expect(drag).toHaveBeenCalledTimes(1);
  });
}

it("controlled Toggle retains node, state callbacks and disabled keyboard semantics", async () => {
  const change = vi.fn();
  const fixture = (pressed: boolean, disabled: boolean) => (
    <Toggle
      pressed={pressed}
      disabled={disabled}
      onPressedChange={change}
      className={(s) => (s.pressed ? "px-8" : "px-7")}
      style={(s) => ({ opacity: s.pressed ? 0.6 : 1 })}
    >
      Controlled
    </Toggle>
  );
  const view = render(fixture(false, false));
  const node = screen.getByRole("button");
  node.focus();
  await userEvent.keyboard(" ");
  expect(change).toHaveBeenCalledWith(true, expect.objectContaining({ isCanceled: false }));
  expect(node).toHaveAttribute("aria-pressed", "false");
  view.rerender(fixture(true, true));
  expect(screen.getByRole("button")).toBe(node);
  expect(node).toHaveClass("px-8");
  expect(node).not.toHaveClass("px-7");
  expect(node).toHaveStyle({ opacity: 0.6 });
  expect(node).toBeDisabled();
  await userEvent.click(node);
  expect(change).toHaveBeenCalledTimes(1);
});

it("controlled group owns item value, callbacks, roving focus and canceled changes", async () => {
  const change = vi.fn();
  const fixture = (value: string[], disabled = false) => (
    <ToggleGroup
      value={value}
      onValueChange={change}
      variant="outline"
      size="sm"
      disabled={disabled}
      style={(s) => ({ opacity: s.disabled ? 0.6 : 1 })}
    >
      <ToggleGroupItem value="a" onPressedChange={(_, details) => details.cancel()}>
        A
      </ToggleGroupItem>
      <ToggleGroupItem value="b" className={(s) => (s.pressed ? "px-8" : "px-7")}>
        B
      </ToggleGroupItem>
    </ToggleGroup>
  );
  const view = render(fixture(["a"]));
  const a = screen.getByRole("button", { name: "A" });
  const b = screen.getByRole("button", { name: "B" });
  a.focus();
  await userEvent.keyboard("{ArrowRight}");
  expect(b).toHaveFocus();
  await userEvent.keyboard(" ");
  expect(change).toHaveBeenCalledWith(["b"], expect.anything());
  view.rerender(fixture(["b"]));
  expect(screen.getByRole("button", { name: "B" })).toBe(b);
  expect(b).toHaveClass("px-8");
  expect(b).toHaveAttribute("data-variant", "outline");
  expect(b).toHaveAttribute("data-size", "sm");
  change.mockClear();
  await userEvent.click(a);
  expect(change).not.toHaveBeenCalled();
  expect(b).toHaveAttribute("aria-pressed", "true");
  view.rerender(fixture(["b"], true));
  expect(a).toBeDisabled();
  expect(b).toBeDisabled();
  expect(screen.getByRole("group")).toHaveStyle({ opacity: 0.6 });
});

it("keeps legacy group paint feedback while Toggle owns its v2 paint policy", () => {
  render(
    <ToggleGroup>
      <ToggleGroupItem value="native">Native</ToggleGroupItem>
    </ToggleGroup>,
  );
  expect(screen.getByRole("button")).toHaveClass("transition-[color,background-color,box-shadow]");
});
