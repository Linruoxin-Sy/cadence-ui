import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { expect, it, vi } from "vitest";
import { Avatar, AvatarFallback, AvatarImage } from "@/registry/cadence/avatar";
import { Badge } from "@/registry/cadence/badge";
import { BreadcrumbLink } from "@/registry/cadence/breadcrumb";
import { ButtonGroup, ButtonGroupText } from "@/registry/cadence/button-group";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/cadence/field";
import { Input } from "@/registry/cadence/input";
import { InputGroup, InputGroupAddon, InputGroupButton } from "@/registry/cadence/input-group";
import { Item } from "@/registry/cadence/item";
import { Separator } from "@/registry/cadence/separator";

for (const Part of [Badge, Item, ButtonGroupText, BreadcrumbLink]) {
  for (const form of ["element", "function"] as const) {
    it(`${Part.name} ${form} render keeps native cancellation and dynamic cleanup on the same DOM`, () => {
      const firstCleanup = vi.fn();
      const secondCleanup = vi.fn();
      const first = vi.fn(() => firstCleanup);
      const second = vi.fn(() => secondCleanup);
      const bubble = vi.fn();
      const native = new Event("dragstart", { bubbles: true, cancelable: true });
      const handler = vi.fn((event: React.DragEvent) => {
        expect(event.nativeEvent).toBe(native);
        expect(event.currentTarget).toBe(screen.getByRole("link"));
        event.preventDefault();
        event.stopPropagation();
      });
      const renderLink = (props: React.HTMLAttributes<HTMLElement>) => <a {...props} href="#target" />;
      const content = (ref: React.RefCallback<HTMLElement>, updated = false) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: ancestor observes native bubbling without owning an interaction.
        <div onDragStart={bubble}>
          <Part
            ref={ref}
            // biome-ignore lint/a11y/useAnchorContent: Base merges this element with the actual children below.
            render={form === "element" ? <a href="#target" /> : renderLink}
            className={updated ? "px-9" : "px-8"}
            style={{ opacity: updated ? 0.6 : 0.8 }}
            onDragStart={handler}
          >
            Native link
          </Part>
        </div>
      );
      const view = render(content(first));
      const node = screen.getByRole("link");
      node.focus();
      fireEvent(node, native);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(native.defaultPrevented).toBe(true);
      expect(bubble).not.toHaveBeenCalled();
      view.rerender(content(second, true));
      expect(firstCleanup).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledWith(node);
      expect(screen.getByRole("link")).toBe(node);
      expect(node).toHaveFocus();
      expect(node).toHaveClass("px-9");
      expect(node).toHaveStyle({ opacity: "0.6" });
      view.unmount();
      expect(secondCleanup).toHaveBeenCalledTimes(1);
    });
  }
}

it("composed InputGroupButton retains all four native events and ref handoff inside ButtonGroup", () => {
  const cleanup = vi.fn();
  const first = vi.fn(() => cleanup);
  const object = React.createRef<HTMLButtonElement>();
  const events = ["animationstart", "drag", "dragstart", "dragend"];
  const handler = vi.fn((event: React.SyntheticEvent) => {
    expect(event.currentTarget).toBe(screen.getByRole("button"));
    event.preventDefault();
  });
  const content = (ref: React.Ref<HTMLButtonElement>, disabled = false) => (
    <ButtonGroup aria-label="Tools">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupButton
            ref={ref}
            disabled={disabled}
            className={(state) => (state.disabled ? "px-9" : "px-8")}
            style={(state) => ({ opacity: state.disabled ? 0.6 : 0.8 })}
            onAnimationStart={handler}
            onDrag={handler}
            onDragStart={handler}
            onDragEnd={handler}
          >
            Action
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </ButtonGroup>
  );
  const view = render(content(first));
  const node = screen.getByRole("button");
  for (const name of events) {
    const event = new Event(name, { bubbles: true, cancelable: true });
    fireEvent(node, event);
    expect(handler.mock.calls.at(-1)?.[0].nativeEvent).toBe(event);
    expect(event.defaultPrevented).toBe(true);
  }
  expect(handler).toHaveBeenCalledTimes(4);
  view.rerender(content(object, true));
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(object.current).toBe(node);
  expect(node).toHaveClass("px-9");
  expect(node).toHaveStyle({ opacity: "0.6" });
  expect(node).toBeDisabled();
  view.unmount();
  expect(object.current).toBeNull();
});

it("Field leaves validation, association and controlled value ownership with the caller", async () => {
  const change = vi.fn();
  const content = (value: string, invalid: boolean) => (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor="owned">Owned</FieldLabel>
      <Input id="owned" value={value} onValueChange={change} aria-invalid={invalid} aria-describedby="help error" />
      <FieldDescription id="help">Caller description</FieldDescription>
      <FieldError id="error" errors={invalid ? [{ message: "Caller error" }] : []} />
    </Field>
  );
  const view = render(content("a", false));
  const node = screen.getByRole("textbox");
  await userEvent.type(node, "b");
  expect(change).toHaveBeenLastCalledWith("ab", expect.objectContaining({ event: expect.anything() }));
  expect(node).toHaveValue("a");
  expect(screen.queryByRole("alert")).toBeNull();
  view.rerender(content("accepted", true));
  expect(screen.getByRole("textbox")).toBe(node);
  expect(node).toHaveValue("accepted");
  expect(node).toHaveAccessibleDescription("Caller description Caller error");
  expect(node).toHaveAttribute("aria-invalid", "true");
});

it("Base Separator callback updates preserve dynamic ref cleanup and style", () => {
  const cleanup = vi.fn();
  const first = vi.fn(() => cleanup);
  const object = React.createRef<HTMLDivElement>();
  const content = (orientation: "horizontal" | "vertical", ref: React.Ref<HTMLDivElement>) => (
    <Separator
      ref={ref}
      orientation={orientation}
      className={(state) => (state.orientation === "vertical" ? "w-8" : "h-8")}
      style={(state) => ({ opacity: state.orientation === "vertical" ? 0.6 : 0.8 })}
      render={(props) => <div {...props} />}
    />
  );
  const view = render(content("horizontal", first));
  const node = screen.getByRole("separator");
  view.rerender(content("vertical", object));
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(object.current).toBe(node);
  expect(screen.getByRole("separator")).toBe(node);
  expect(node).toHaveClass("w-8");
  expect(node).toHaveStyle({ opacity: "0.6" });
  view.unmount();
  expect(object.current).toBeNull();
});

it("Avatar image status reaches class/style callbacks in the real root context", () => {
  render(
    <Avatar className={(state) => `root-${state.imageLoadingStatus}`}>
      <AvatarImage
        keepMounted
        src="/avatar.png"
        alt="Avatar"
        className={(state) => `image-${state.imageLoadingStatus}`}
        style={(state) => ({ opacity: state.imageLoadingStatus === "error" ? 0.4 : 1 })}
        // biome-ignore lint/performance/noImgElement: exercise the actual native Base image render API.
        render={(props) => <img {...props} alt="Avatar" />}
      />
      <AvatarFallback
        className={(state) => `fallback-${state.imageLoadingStatus}`}
        style={(state) => ({ opacity: state.imageLoadingStatus === "error" ? 0.7 : 1 })}
      >
        AV
      </AvatarFallback>
    </Avatar>,
  );
  const image = document.querySelector("img");
  expect(image).not.toBeNull();
  fireEvent.error(image as HTMLImageElement);
  expect(image).toHaveClass("image-error");
  expect(image).toHaveStyle({ opacity: "0.4" });
  expect(screen.getByText("AV")).toHaveClass("fallback-error");
  expect(screen.getByText("AV")).toHaveStyle({ opacity: "0.7" });
  expect(screen.getByText("AV").parentElement).toHaveClass("root-error");
});
