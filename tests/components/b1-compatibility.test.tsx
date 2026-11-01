import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Avatar, AvatarFallback, AvatarImage } from "@/registry/cadence/avatar";
import { Badge } from "@/registry/cadence/badge";
import { Button } from "@/registry/cadence/button";
import { Input } from "@/registry/cadence/input";
import { Separator } from "@/registry/cadence/separator";
import { Textarea } from "@/registry/cadence/textarea";

it("evaluates Base state classes after defaults and forwards state styles", () => {
  render(
    <>
      <Input
        disabled
        aria-label="callback"
        className={(s) => (s.disabled ? "px-8 caller" : "px-1")}
        style={(s) => ({ opacity: s.disabled ? 0.7 : 1 })}
      />
      <Separator orientation="vertical" className={(s) => (s.orientation === "vertical" ? "w-2 caller" : "w-1")} />
      <Avatar className={(s) => `root-${s.imageLoadingStatus} size-12`}>
        <AvatarImage src="/missing.png" className={(s) => `image-${s.imageLoadingStatus}`} />
        <AvatarFallback className={(s) => `fallback-${s.imageLoadingStatus} rounded-none`}>AL</AvatarFallback>
      </Avatar>
    </>,
  );
  expect(screen.getByLabelText("callback")).toHaveClass("caller", "px-8");
  expect(screen.getByLabelText("callback")).not.toHaveClass("px-3");
  expect(screen.getByLabelText("callback")).toHaveStyle({ opacity: "0.7" });
  expect(screen.getByRole("separator")).toHaveClass("caller", "w-2");
  expect(screen.getByText("AL")).toHaveClass("rounded-none");
  expect(screen.getByText("AL").parentElement).toHaveClass("size-12");
  expect(screen.getByText("AL").parentElement?.className).toMatch(/root-(idle|loading|error)/);
});

it("preserves render element/function, native events, style and React19 ref cleanup", async () => {
  const cleanup = vi.fn();
  const caller = vi.fn();
  const inner = vi.fn();
  const view = render(
    <>
      <Button
        ref={() => cleanup}
        render={<button type="button" onClick={inner} />}
        onClick={caller}
        style={(s) => ({ opacity: s.disabled ? 0.5 : 0.9 })}
      >
        Action
      </Button>
      <Badge render={(props) => <a {...props} href="#target" />} className="px-8" style={{ opacity: 0.8 }}>
        Link
      </Badge>
      <Separator render={<hr />} />
    </>,
  );
  await userEvent.click(screen.getByRole("button"));
  expect(caller).toHaveBeenCalledTimes(1);
  expect(inner).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button")).toHaveStyle({ opacity: "0.9" });
  expect(screen.getByRole("link")).toHaveAttribute("href", "#target");
  expect(screen.getByRole("link")).toHaveClass("px-8");
  expect(screen.getByRole("separator")).toHaveProperty("tagName", "HR");
  view.unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

it("keeps native fields, selection, focus, value details and cleanup across caller updates", async () => {
  const cleanup = vi.fn();
  const change = vi.fn();
  const value = vi.fn();
  const fields = (invalid: boolean) => (
    <>
      <Input
        aria-label="Native"
        aria-invalid={invalid}
        ref={() => cleanup}
        onChange={change}
        onValueChange={value}
        render={<input data-custom="yes" />}
      />
      <Textarea aria-label="Note" aria-invalid={invalid} />
    </>
  );
  const view = render(fields(false));
  const input = screen.getByLabelText("Native") as HTMLInputElement;
  await userEvent.type(input, "cadence");
  input.setSelectionRange(1, 4);
  view.rerender(fields(true));
  expect(screen.getByLabelText("Native")).toBe(input);
  expect(input).toHaveFocus();
  expect(input.selectionStart).toBe(1);
  expect(input.selectionEnd).toBe(4);
  expect(input).toHaveAttribute("data-custom", "yes");
  expect(change).toHaveBeenCalled();
  expect(value).toHaveBeenLastCalledWith("cadence", expect.objectContaining({ event: expect.anything() }));
  fireEvent.change(screen.getByLabelText("Note"), { target: { value: "two\nlines" } });
  expect(screen.getByLabelText("Note")).toHaveValue("two\nlines");
  view.unmount();
  expect(cleanup).toHaveBeenCalled();
});
