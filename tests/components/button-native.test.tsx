import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

it("cancels obsolete activation on a retained native target revision, then accepts new intent", async () => {
  const click = vi.fn();
  const user = userEvent.setup();
  const draw = (target: string) => (
    <CadenceProvider timeScale={0}>
      <Button type="submit" formAction={target} onClick={click}>
        Action
      </Button>
    </CadenceProvider>
  );
  const view = render(draw("first"));
  const node = screen.getByRole("button");
  await user.pointer({ target: node, keys: "[MouseLeft>]" });
  view.rerender(draw("second"));
  await user.pointer({ keys: "[/MouseLeft]" });
  expect(click).not.toHaveBeenCalled();
  await user.click(node);
  expect(click).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button")).toBe(node);
});

it.each(["onPointerDown", "onPointerUp", "onPointerCancel", "onKeyDown", "onKeyUp"] as const)(
  "press lifecycle forwards %s exactly once with native cancellation and currentTarget",
  (handler) => {
    const parent = vi.fn();
    const capture = vi.fn();
    const listener = vi.fn((event) => {
      expect(event.currentTarget).toBe(screen.getByRole("button"));
      expect(event.nativeEvent).toBe(native);
      event.preventDefault();
      event.stopPropagation();
    });
    const view = render(
      <div {...{ [handler]: parent, [`${handler}Capture`]: capture }}>
        <Button {...{ [handler]: listener }}>Native lifecycle</Button>
      </div>,
    );
    const native = new Event(handler.slice(2).toLowerCase(), { bubbles: true, cancelable: true });
    fireEvent(screen.getByRole("button"), native);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(parent).not.toHaveBeenCalled();
    expect(native.defaultPrevented).toBe(true);
    view.unmount();
  },
);

it("delivers native animation and drag events through the default renderer", () => {
  const animation = vi.fn();
  const drag = vi.fn();
  const view = render(
    <Button onAnimationStart={animation} onDragStart={drag}>
      Native
    </Button>,
  );
  const button = screen.getByRole("button");
  fireEvent.animationStart(button, { animationName: "consumer" });
  fireEvent.dragStart(button);
  expect(animation).toHaveBeenCalledTimes(1);
  expect(animation.mock.calls[0]?.[0].nativeEvent).toBeInstanceOf(Event);
  expect(drag).toHaveBeenCalledTimes(1);
  view.unmount();
});

it.each(["onAnimationStart", "onDrag", "onDragStart", "onDragEnd"] as const)(
  "preserves the real native event, capture, cancellation and propagation for %s",
  (handler) => {
    const parent = vi.fn();
    const capture = vi.fn();
    const listener = vi.fn((event) => {
      expect(event.currentTarget).toBe(screen.getByRole("button"));
      expect(event.nativeEvent).toBe(native);
      event.preventDefault();
      event.stopPropagation();
    });
    const view = render(
      <div {...{ [handler]: parent, [`${handler}Capture`]: capture }}>
        <Button {...{ [handler]: listener }}>Native</Button>
      </div>,
    );
    const type = handler === "onAnimationStart" ? "animationstart" : handler.slice(2).toLowerCase();
    const native = new Event(type, { bubbles: true, cancelable: true });
    fireEvent(screen.getByRole("button"), native);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(parent).not.toHaveBeenCalled();
    expect(native.defaultPrevented).toBe(true);
    view.unmount();
  },
);

it("keeps callback state/styles, default ref cleanup, object refs and node identity", () => {
  const cleanup = vi.fn();
  const ref = vi.fn(() => cleanup);
  const props = (disabled: boolean) => ({
    disabled,
    className: (state: { disabled: boolean }) => (state.disabled ? "px-8 disabled-caller" : "px-7"),
    style: (state: { disabled: boolean }) => ({ opacity: state.disabled ? 0.7 : 1 }),
    ref,
  });
  const view = render(<Button {...props(false)}>Native</Button>);
  const button = screen.getByRole("button");
  button.focus();
  view.rerender(<Button {...props(true)}>Native</Button>);
  expect(screen.getByRole("button")).toBe(button);
  expect(button).toHaveClass("px-8", "disabled-caller");
  expect(button).not.toHaveClass("px-4");
  expect(button).toHaveStyle({ opacity: 0.7 });
  view.unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
  const object = createRef<HTMLButtonElement>();
  const second = render(<Button ref={object}>Object</Button>);
  expect(object.current).toBe(screen.getByRole("button"));
  second.unmount();
  expect(object.current).toBeNull();
});

it("merges element handlers and both cleanup refs; render function retains native events", async () => {
  const elementCleanup = vi.fn();
  const callerCleanup = vi.fn();
  const inner = vi.fn();
  const outer = vi.fn();
  const view = render(
    <Button
      ref={() => callerCleanup}
      onAnimationStart={outer}
      render={<button ref={() => elementCleanup} onAnimationStart={inner} type="button" />}
    >
      Element
    </Button>,
  );
  fireEvent.animationStart(screen.getByRole("button"));
  expect(inner).toHaveBeenCalledTimes(1);
  expect(outer).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(elementCleanup).toHaveBeenCalledTimes(1);
  expect(callerCleanup).toHaveBeenCalledTimes(1);
  const click = vi.fn();
  render(
    <Button onClick={click} onDrag={outer} render={(props) => <button {...props} type="button" />}>
      Function
    </Button>,
  );
  await userEvent.click(screen.getByRole("button"));
  fireEvent.drag(screen.getByRole("button"));
  expect(click).toHaveBeenCalledTimes(1);
  expect(outer).toHaveBeenCalledTimes(2);
});

it("does not invoke native animation/drag handlers for a Motion press", async () => {
  const native = vi.fn();
  render(
    <Button onAnimationStart={native} onDragStart={native} onDrag={native} onDragEnd={native}>
      Press
    </Button>,
  );
  await userEvent.click(screen.getByRole("button"));
  expect(native).not.toHaveBeenCalled();
});

it("keeps native form cancellation and keyboard focus on the default renderer", async () => {
  const submit = vi.fn((event) => event.preventDefault());
  const parent = vi.fn();
  render(
    <form onSubmit={submit} onClick={parent} onKeyDown={() => {}}>
      <Button
        type="submit"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        Save
      </Button>
    </form>,
  );
  const button = screen.getByRole("button");
  await userEvent.tab();
  expect(button).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  expect(submit).not.toHaveBeenCalled();
  expect(parent).not.toHaveBeenCalled();
  expect(button).toHaveFocus();
});

it("replaces callback refs during a held press and disables activation on the same node", async () => {
  const firstCleanup = vi.fn();
  const secondCleanup = vi.fn();
  const first = vi.fn(() => firstCleanup);
  const second = vi.fn(() => secondCleanup);
  const click = vi.fn();
  const native = vi.fn();
  const user = userEvent.setup();
  const view = render(
    <Button ref={first} onClick={click} onAnimationStart={native}>
      Hold
    </Button>,
  );
  const node = screen.getByRole("button");
  await user.pointer({ target: node, keys: "[MouseLeft>]" });
  view.rerender(
    <Button ref={second} disabled onClick={click} onAnimationStart={native}>
      Hold
    </Button>,
  );
  expect(firstCleanup).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledWith(node);
  expect(screen.getByRole("button")).toBe(node);
  expect(node).toBeDisabled();
  await user.pointer({ keys: "[/MouseLeft]" });
  expect(click).not.toHaveBeenCalled();
  expect(native).not.toHaveBeenCalled();
  view.unmount();
  expect(secondCleanup).toHaveBeenCalledTimes(1);
});

it.each(["default", "element", "function"] as const)(
  "%s: caller cancellation preserves handler ownership through nested target",
  async (kind) => {
    const order: string[] = [];
    const submit = vi.fn((event) => event.preventDefault());
    const parent = vi.fn();
    const view = render(
      <form onSubmit={submit} onClick={parent} onKeyDown={() => {}}>
        <Button
          type="submit"
          onClick={(event) => {
            order.push("caller");
            expect(event.defaultPrevented).toBe(kind !== "default");
            event.preventDefault();
            event.stopPropagation();
          }}
          render={
            kind === "default" ? undefined : kind === "element" ? (
              <button
                type="submit"
                onClick={(event) => {
                  order.push("element");
                  event.preventDefault();
                }}
              />
            ) : (
              (props) => (
                <button
                  {...props}
                  type="submit"
                  onClick={(event) => {
                    order.push("function");
                    event.preventDefault();
                    props.onClick?.(event);
                  }}
                />
              )
            )
          }
        >
          <span>Nested label</span>
        </Button>
      </form>,
    );
    await userEvent.click(screen.getByText("Nested label"));
    expect(order).toEqual(kind === "default" ? ["caller"] : [kind, "caller"]);
    expect(submit).not.toHaveBeenCalled();
    expect(parent).not.toHaveBeenCalled();
    view.unmount();
  },
);

it("render element can prevent the caller Base handler without preventing native bubbling", async () => {
  const caller = vi.fn();
  const parent = vi.fn();
  render(
    <form onClick={parent} onKeyDown={() => {}}>
      <Button
        onClick={caller}
        render={
          <button
            type="button"
            onClick={(event) => {
              (event as typeof event & { preventBaseUIHandler(): void }).preventBaseUIHandler();
            }}
          />
        }
      >
        Owned
      </Button>
    </form>,
  );
  await userEvent.click(screen.getByRole("button"));
  expect(caller).not.toHaveBeenCalled();
  expect(parent).toHaveBeenCalledTimes(1);
});
