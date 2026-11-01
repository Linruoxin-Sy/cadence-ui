import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Checkbox } from "@/registry/cadence/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/registry/cadence/input-otp";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack, ProgressValue } from "@/registry/cadence/progress";
import { RadioGroup, RadioGroupItem } from "@/registry/cadence/radio-group";
import { Slider } from "@/registry/cadence/slider";
import { Switch } from "@/registry/cadence/switch";
import { Toggle } from "@/registry/cadence/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";

it("evaluates each inherited Base class/style callback with real state and caller last", () => {
  const { container } = render(
    <>
      <Checkbox
        aria-label="Check"
        checked
        className={(s) => (s.checked ? "size-8 check" : "size-2")}
        style={(s) => ({ opacity: s.checked ? 0.8 : 1 })}
      />
      <RadioGroup value="a" className={() => "gap-8 group"} style={() => ({ opacity: 0.8 })}>
        <RadioGroupItem
          value="a"
          aria-label="Radio"
          className={(s) => (s.checked ? "size-8 radio" : "size-2")}
          style={(s) => ({ opacity: s.checked ? 0.8 : 1 })}
        />
      </RadioGroup>
      <Switch
        aria-label="Switch"
        checked
        className={(s) => (s.checked ? "shadow-none switch" : "shadow-sm")}
        style={(s) => ({ opacity: s.checked ? 0.8 : 1 })}
      />
      <Slider
        aria-label="Slider"
        value={40}
        disabled
        className={(s) => (s.disabled ? "w-40 slider" : "w-20")}
        style={(s) => ({ opacity: s.disabled ? 0.8 : 1 })}
      />
      <Toggle
        pressed
        className={(s) => (s.pressed ? "h-12 toggle" : "h-4")}
        style={(s) => ({ opacity: s.pressed ? 0.8 : 1 })}
      >
        Toggle
      </Toggle>
      <ToggleGroup
        orientation="vertical"
        value={["a"]}
        spacing={3}
        className={(s) => (s.orientation === "vertical" ? "gap-8 toggles" : "gap-1")}
        style={(s) => ({ opacity: s.orientation === "vertical" ? 0.8 : 1 })}
      >
        <ToggleGroupItem
          value="a"
          className={(s) => (s.pressed ? "px-8 item" : "px-1")}
          style={(s) => ({ opacity: s.pressed ? 0.8 : 1 })}
        >
          Item
        </ToggleGroupItem>
      </ToggleGroup>
      <Progress
        value={100}
        className={(s) => (s.status === "complete" ? "gap-8 progress" : "gap-1")}
        style={() => ({ opacity: 0.8 })}
      >
        <ProgressLabel className={() => "text-lg label"} style={() => ({ opacity: 0.8 })}>
          Upload
        </ProgressLabel>
        <ProgressValue className={() => "text-lg value"} style={() => ({ opacity: 0.8 })} />
        <ProgressTrack className={() => "h-4 track"} style={() => ({ opacity: 0.8 })}>
          <ProgressIndicator
            className={(s) => (s.status === "complete" ? "bg-muted fill" : "bg-primary")}
            style={(s) => ({ opacity: s.status === "complete" ? 0.8 : 1 })}
          />
        </ProgressTrack>
      </Progress>
    </>,
  );
  for (const name of [
    "check",
    "group",
    "radio",
    "switch",
    "slider",
    "toggle",
    "toggles",
    "item",
    "progress",
    "label",
    "value",
    "track",
    "fill",
  ]) {
    const node = container.querySelector(`.${name}`);
    expect(node).not.toBeNull();
    expect(node).toHaveStyle({ opacity: "0.8" });
  }
  expect(container.querySelector(".check")).not.toHaveClass("size-4");
  expect(container.querySelector(".item")).not.toHaveClass("px-3");
  expect(container.querySelector(".fill")).toHaveStyle({ width: "100%" });
  expect((container.querySelector(".toggles") as HTMLElement).style.getPropertyValue("--gap")).toBe("3");
  expect(container.querySelectorAll('[data-slot="slider-thumb"]')).toHaveLength(1);
});

it("preserves render forms, merged native events and React19 ref cleanup on all Base roots", async () => {
  const cleanup = vi.fn();
  const inner = vi.fn();
  const outer = vi.fn();
  const view = render(
    <>
      <Checkbox
        aria-label="Check"
        ref={() => cleanup}
        render={<button type="button" onClick={inner} />}
        onClick={outer}
      />
      <Switch
        aria-label="Switch"
        ref={() => cleanup}
        render={(props) => (
          <span
            role="switch"
            aria-checked={false}
            tabIndex={0}
            onKeyDown={() => {}}
            {...props}
            onClick={(e) => {
              props.onClick?.(e);
              inner();
            }}
          />
        )}
        onClick={outer}
      />
      <RadioGroup ref={() => cleanup} render={<section />}>
        <RadioGroupItem
          value="a"
          aria-label="Radio"
          ref={() => cleanup}
          render={<button type="button" onClick={inner} />}
          onClick={outer}
        />
      </RadioGroup>
      <Slider value={40} aria-label="Slider" ref={() => cleanup} render={<section />} />
      <Toggle ref={() => cleanup} render={<button type="button" onClick={inner} />} onClick={outer}>
        Toggle
      </Toggle>
      <ToggleGroup ref={() => cleanup} render={<section />}>
        <ToggleGroupItem value="a" ref={() => cleanup} render={(props) => <button {...props} type="button" />}>
          Item
        </ToggleGroupItem>
      </ToggleGroup>
      <Progress value={20} aria-label="Progress" ref={() => cleanup} render={<section />}>
        <ProgressTrack ref={() => cleanup} render={<section />}>
          <ProgressIndicator ref={() => cleanup} render={<span />} />
        </ProgressTrack>
        <ProgressLabel ref={() => cleanup}>Label</ProgressLabel>
        <ProgressValue ref={() => cleanup} />
      </Progress>
    </>,
  );
  for (const [role, name] of [
    ["checkbox", "Check"],
    ["switch", "Switch"],
    ["radio", "Radio"],
    ["button", "Toggle"],
  ] as const)
    await userEvent.click(screen.getByRole(role, { name }));
  expect(inner).toHaveBeenCalledTimes(4);
  expect(outer).toHaveBeenCalledTimes(4);
  view.unmount();
  expect(cleanup).toHaveBeenCalledTimes(13);
});

it("keeps caller-owned state, invalid/required/disabled and OTP nodes/selection across external updates", async () => {
  const change = vi.fn();
  const contents = (active: boolean) => (
    <CadenceProvider mode="none">
      <Checkbox aria-label="Check" checked={active} required aria-invalid={active} onCheckedChange={change} />
      <Switch aria-label="Switch" checked={active} disabled={active} onCheckedChange={change} />
      <RadioGroup value={active ? "b" : "a"}>
        <RadioGroupItem value="a" aria-label="A" />
        <RadioGroupItem value="b" aria-label="B" />
      </RadioGroup>
      <Toggle pressed={active}>Toggle</Toggle>
      <ToggleGroup value={active ? ["b"] : ["a"]}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
      <Slider aria-label="Slider" value={active ? 80 : 20} />
      <InputOTP value={active ? "9876" : "1234"} maxLength={4} aria-label="Code">
        <InputOTPGroup>
          {[0, 1, 2, 3].map((index) => (
            <InputOTPSlot key={index} index={index} />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </CadenceProvider>
  );
  const view = render(contents(false));
  const input = screen.getByLabelText("Code") as HTMLInputElement;
  input.focus();
  input.setSelectionRange(1, 3);
  const span = view.container.querySelector('[data-slot="input-otp-slot"] > span');
  view.rerender(contents(true));
  expect(screen.getByLabelText("Code")).toBe(input);
  expect(input).toHaveFocus();
  expect(input).toHaveValue("9876");
  // Replacing the caller-owned value follows the native input/OTP selection policy.
  expect(input.selectionStart).toBe(input.selectionEnd);
  expect(view.container.querySelector('[data-slot="input-otp-slot"] > span')).toBe(span);
  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("radio", { name: "B" })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("switch")).toHaveAttribute("aria-disabled", "true");
  expect(view.container.querySelector('input[type="range"]')).toHaveValue("80");
  fireEvent.click(screen.getByRole("switch"));
  expect(change).not.toHaveBeenCalled();
});

it("shows the mixed checkbox indicator without a checked value", () => {
  const { container } = render(
    <CadenceProvider mode="none">
      <Checkbox indeterminate aria-label="Mixed" />
    </CadenceProvider>,
  );
  expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
  expect(container.querySelector('[data-slot="checkbox-indicator"]')).toHaveStyle({ opacity: "1" });
  expect(container.querySelector(".lucide-minus")).not.toBeNull();
});
