import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/cadence/select";
import { expectMotionContract } from "../motion-contract";
import {
  expectV2MotionAction,
  expectV2MotionInsertion,
  expectV2NativeBoundaries,
  prepareV2MotionPlan,
} from "../motion-v2-contract";

function Demo({ mode }: { mode?: "full" | "reduced" | "none" }) {
  return (
    <CadenceProvider mode={mode}>
      <Select defaultValue="next" modal={false}>
        <SelectTrigger aria-label="Framework">
          <SelectValue placeholder="Choose a framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next">Next.js</SelectItem>
          <SelectItem value="remix">Remix</SelectItem>
          <SelectSeparator />
          <SelectItem value="astro">Astro</SelectItem>
        </SelectContent>
      </Select>
    </CadenceProvider>
  );
}

/**
 * Open the list and wait for it to become accessible. A second click is not
 * safe: once the popup is open Base UI marks the trigger `pointer-events: none`.
 */
async function openSelect(trigger: HTMLElement) {
  trigger.focus();
  await userEvent.click(trigger);
  await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
}

type ObjectOption = { id: string; label: string };
function ObjectDemo({
  next,
  remix,
  request,
  format,
}: {
  next: ObjectOption;
  remix: ObjectOption;
  request: (item: ObjectOption | null) => void;
  format: (item: ObjectOption | null) => string;
}) {
  const [value, setValue] = useState(next);
  return (
    <Select
      value={value}
      isItemEqualToValue={(a, b) => a.id === b.id}
      itemToStringValue={(item) => item.id}
      onValueChange={(item) => {
        request(item);
        if (item) setValue({ ...item });
      }}
      modal={false}
    >
      <SelectTrigger aria-label="Object framework">
        <SelectValue>{format}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={next}>Next.js</SelectItem>
        <SelectItem value={remix}>Remix</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe("Select", () => {
  beforeAll(() => prepareV2MotionPlan()); // Cold full-library source/installation audit.
  it("retains native object equality, formatter arguments and explicit undefined uncontrolled values", async () => {
    const next = { id: "next", label: "Next.js" },
      remix = { id: "remix", label: "Remix" };
    const request = vi.fn();
    const format = vi.fn((value: typeof next | null) => value?.label ?? "Choose");
    const view = render(<ObjectDemo next={next} remix={remix} request={request} format={format} />);
    const trigger = screen.getByRole("combobox", { name: "Object framework" });
    await openSelect(trigger);
    const source = screen.getByRole("option", { name: "Remix" });
    const rect = (left: number) =>
      ({ x: left, y: 100, left, top: 100, right: left + 60, bottom: 120, width: 60, height: 20 }) as DOMRect;
    Object.defineProperty(source.querySelector('[data-slot="select-item-text"]'), "getBoundingClientRect", {
      value: () => rect(20),
    });
    Object.defineProperty(
      trigger.querySelector('[data-slot="select-value"]')?.firstElementChild,
      "getBoundingClientRect",
      { value: () => rect(200) },
    );
    await userEvent.click(source);
    expect(request).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledWith(remix);
    expect(trigger).toHaveTextContent("Remix");
    expect(format).toHaveBeenLastCalledWith({ id: "remix", label: "Remix" });
    expect(document.querySelector("[data-cadence-handoff-paint]")).not.toBeInTheDocument();
    view.unmount();
    render(
      <Select value={undefined} defaultValue="next" modal={false}>
        <SelectTrigger aria-label="Undefined framework">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next">Next.js</SelectItem>
          <SelectItem value="remix">Remix</SelectItem>
        </SelectContent>
      </Select>,
    );
    const uncontrolled = screen.getByRole("combobox", { name: "Undefined framework" });
    expect(uncontrolled).toHaveTextContent("Next.js");
    await openSelect(uncontrolled);
    await userEvent.click(screen.getByRole("option", { name: "Remix" }));
    expect(uncontrolled).toHaveTextContent("Remix");
  });
  it("renders the trigger with the selected label and the upstream slots", () => {
    const { container } = render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });

    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger).toHaveAttribute("data-motion", "full");
    expect(trigger).toHaveTextContent("Next.js");
    expect(container.querySelector('[data-slot="select-value"]')).toHaveAttribute("data-motion", "full");
    expect(container.querySelector('[data-slot="select-value"]')).toBeInTheDocument();
    expect(trigger.querySelector('[data-slot="select-value"]')).toBeInTheDocument();
  });

  it("opens the listbox and reports the chosen value", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });

    await openSelect(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByRole("option", { name: "Remix" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("option", { name: "Remix" }));
    expect(trigger).toHaveTextContent("Remix");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the check indicator on the selected item", async () => {
    const { container } = render(<Demo />);
    await openSelect(screen.getByRole("combobox", { name: "Framework" }));

    const selected = screen.getByRole("option", { name: "Next.js" });
    const indicator = selected.querySelector('[data-slot="select-item-indicator"]');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-motion", "full");
    expect(indicator?.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="select-item-indicator"]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-slot="select-item-indicator"]')).toHaveLength(3);
  });

  it("shows the placeholder until a value is chosen", async () => {
    render(
      <Select modal={false}>
        <SelectTrigger aria-label="Framework">
          <SelectValue placeholder="Choose a framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next">Next.js</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole("combobox", { name: "Framework" });
    expect(trigger).toHaveTextContent("Choose a framework");

    await openSelect(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Next.js" }));
    expect(trigger).toHaveTextContent("Next.js");
  });

  it("keeps native width when intrinsic layout is unavailable", async () => {
    const { container, rerender } = render(<Demo />);
    const value = container.querySelector('[data-slot="select-value"]') as HTMLElement;
    Object.defineProperty(value, "scrollWidth", { configurable: true, get: () => 160 });

    rerender(<Demo />);
    expect(value.style.width).toBe("");
  });

  it("releases temporary width in every mode without inventing a hidden measurement", async () => {
    const { container, rerender } = render(<Demo mode="reduced" />);
    const value = container.querySelector('[data-slot="select-value"]') as HTMLElement;
    Object.defineProperty(value, "scrollWidth", { configurable: true, get: () => 96 });

    rerender(<Demo mode="reduced" />);
    expect(value.style.width).toBe("");
    rerender(<Demo mode="none" />);
    expect(value.style.width).toBe("");
    expect(container.querySelector('[data-slot="select-value"]')).toBe(value);
    rerender(<Demo mode="full" />);
    expect(value.style.width).toBe("");
  });

  it("does not invent a flight from rectangles without visible native layout or replay retained label text", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    await openSelect(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Remix" }));
    expect(document.querySelector("[data-cadence-handoff-paint]")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Remix");
    expect(trigger.textContent?.match(/Remix/g)).toHaveLength(1);
  });

  it("skips the flight under reduced motion", async () => {
    render(<Demo mode="reduced" />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    await openSelect(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Remix" }));

    expect(document.querySelector("[data-cadence-handoff-paint]")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Remix");
  });

  it("opens from the keyboard without a handoff origin", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    trigger.focus();

    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(document.querySelector("[data-cadence-handoff-paint]")).not.toBeInTheDocument();
  });

  it("carries the mode on the trigger for reduced motion", () => {
    render(<Demo mode="reduced" />);
    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute("data-motion", "reduced");
  });

  it("carries the mode on the trigger for none", () => {
    render(<Demo mode="none" />);
    expect(screen.getByRole("combobox", { name: "Framework" })).toHaveAttribute("data-motion", "none");
  });
});

it.each(["full", "reduced", "none"] as const)("asserts the shared %s popup contract", async (mode) => {
  render(<Demo mode={mode} />);
  await openSelect(screen.getByRole("combobox", { name: "Framework" }));
  expectMotionContract(mode, { instantImperative: true });
});

describe("Select v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan()); // Cold full-library source/installation audit.
  it.each(["full", "reduced", "none"] as const)(
    "executes native accepted content/colour/size owners in %s",
    async (mode) => {
      const draw = (label = "Plan A", paint = false, open = true, selected = "a") => (
        <CadenceProvider mode={mode} timeScale={0}>
          <Select
            items={[{ value: "a", label }]}
            value={selected}
            open={open}
            modal={false}
            onOpenChange={(open, details) => {
              details.preventUnmountOnClose();
              if (!open) view.rerender(draw("Plan ready", false, false, "b"));
            }}
          >
            <SelectTrigger aria-label="Direct" style={{ color: paint ? "#222" : "#111" }}>
              <SelectValue style={{ color: paint ? "#333" : "#222" }} />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} style={{ backgroundColor: paint ? "#eee" : "#ddd" }}>
              <SelectGroup>
                <SelectLabel style={{ color: paint ? "#333" : "#222" }}>{label}</SelectLabel>
                <SelectItem value="a" style={{ color: paint ? "#333" : "#222" }}>
                  {label}
                </SelectItem>
                <SelectSeparator style={{ backgroundColor: paint ? "#bbb" : "#aaa" }} />
                <SelectScrollUpButton keepMounted style={{ backgroundColor: paint ? "#ccc" : "#bbb" }} />
                <SelectScrollDownButton keepMounted style={{ backgroundColor: paint ? "#ccc" : "#bbb" }} />
              </SelectGroup>
            </SelectContent>
          </Select>
        </CadenceProvider>
      );
      const view = render(draw());
      await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
      await expectV2MotionAction("select", "select.value.change", mode, () => view.rerender(draw("Plan B")));
      await expectV2MotionAction("select", "select.value.replace", mode, () => view.rerender(draw("Plan C")));
      await expectV2MotionAction("select", "select.handoff.transfer", mode, () => view.rerender(draw("Plan D")));
      await expectV2MotionAction("select", "select.width.resize", mode, () =>
        view.rerender(draw("Plan with a longer name")),
      );
      await expectV2MotionAction("select", "select.content.resize", mode, () => view.rerender(draw("Plan pending")));
      await expectV2MotionAction("select", "select.label.change", mode, () => view.rerender(draw("Plan ready")));
      await expectV2MotionAction("select", "select.surface.colour", mode, () =>
        view.rerender(draw("Plan ready", true)),
      );
      await expectV2MotionAction("select", "select.foreground.colour", mode, () =>
        view.rerender(draw("Plan ready", false)),
      );
      await expectV2MotionAction("select", "select.scroll.colour", mode, () => view.rerender(draw("Plan ready", true)));
      await expectV2MotionAction("select", "select.separator.colour", mode, () =>
        view.rerender(draw("Plan ready", false)),
      );
      await expectV2MotionAction("select", "select.indicator.select", mode, () =>
        view.rerender(draw("Plan ready", false, true, "b")),
      );
      expectMotionContract(mode, { policy: ["color"] });
      // Keep Base's closing owner through its own prevent-unmount contract.
      await expectV2MotionAction("select", "select.content.exit", mode, async () => {
        await userEvent.keyboard("{Escape}");
      });
      await expectV2MotionAction("select", "select.content.enter", mode, () =>
        view.rerender(draw("Plan ready", false, true, "b")),
      );
      await expectV2NativeBoundaries("select");
    },
  );
  it.each(["full", "reduced", "none"] as const)(
    "executes later trigger insertion on its real host in %s",
    async (mode) => {
      const computed = window.getComputedStyle.bind(window);
      const style = vi.spyOn(window, "getComputedStyle").mockImplementation(
        (node) =>
          new Proxy(computed(node), {
            get(target, key) {
              if (key === "opacity") return "1";
              if (key === "visibility") return "visible";
              const value = Reflect.get(target, key);
              return typeof value === "function" ? value.bind(target) : value;
            },
          }),
      );
      const animate = vi.fn(function (this: HTMLElement, frames: Keyframe[]) {
        let reject: ((reason?: unknown) => void) | undefined;
        const finished = new Promise<void>((_, no) => {
          reject = no;
        });
        return {
          finished,
          playState: "running",
          effect: { getKeyframes: () => frames, getTiming: () => ({ duration: 100 }) },
          cancel() {
            reject?.(new Error("cancelled"));
          },
          finish() {},
        } as unknown as Animation;
      });
      const old = HTMLElement.prototype.animate;
      HTMLElement.prototype.animate = animate;
      try {
        const draw = (show: boolean) => (
          <CadenceProvider mode={mode}>
            <Select defaultValue="a">
              {show && (
                <SelectTrigger aria-label="Inserted">
                  <SelectValue />
                </SelectTrigger>
              )}
              <SelectContent>
                <SelectItem value="a">Alpha</SelectItem>
              </SelectContent>
            </Select>
          </CadenceProvider>
        );
        const view = render(draw(false));
        await expectV2MotionInsertion("select", "select.trigger.enter", mode, () => view.rerender(draw(true)));
        expect(screen.getByRole("combobox", { name: "Inserted" })).toHaveTextContent("Alpha");
        if (mode !== "none") expect(animate).toHaveBeenCalled();
        view.unmount();
      } finally {
        HTMLElement.prototype.animate = old;
        style.mockRestore();
      }
    },
  );
});

it("preserves native render, callback style and React 19 ref cleanup on the same host", async () => {
  const oldCleanup = vi.fn(),
    nextCleanup = vi.fn(),
    first = vi.fn(() => oldCleanup),
    second = vi.fn(() => nextCleanup);
  const valueRef = vi.fn();
  const draw = (ref: typeof first, label: string, mode: "full" | "none") => (
    <CadenceProvider mode={mode}>
      <Select items={[{ value: "a", label }]} value="a" modal={false}>
        <SelectTrigger
          aria-label="Rendered"
          ref={ref}
          render={<button type="button" data-custom="trigger" />}
          className={() => "w-48"}
          style={() => ({ borderWidth: 2 })}
        >
          <SelectValue ref={valueRef} render={<span data-custom="value" />} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">{label}</SelectItem>
        </SelectContent>
      </Select>
    </CadenceProvider>
  );
  const view = render(draw(first, "Alpha", "full"));
  const trigger = screen.getByRole("combobox", { name: "Rendered" }),
    value = trigger.querySelector('[data-custom="value"]');
  expect(first).toHaveBeenLastCalledWith(trigger);
  expect(valueRef).toHaveBeenCalledWith(value);
  expect(trigger).toHaveClass("w-48");
  expect(trigger.style.borderWidth).toBe("2px");
  view.rerender(draw(second, "Beta", "none"));
  expect(screen.getByRole("combobox", { name: "Rendered" })).toBe(trigger);
  expect(trigger.querySelector('[data-custom="value"]')).toBe(value);
  expect(trigger).toHaveTextContent("Beta");
  expect(oldCleanup).toHaveBeenCalledOnce();
  expect(second).toHaveBeenLastCalledWith(trigger);
  expect(trigger).toHaveAttribute("data-motion", "none");
  view.unmount();
  expect(nextCleanup).toHaveBeenCalledOnce();
});

it("keeps multiple object equality scalar and submits repeated native values", async () => {
  const a = { id: "a", label: "Alpha" },
    b = { id: "b", label: "Beta" };
  const equal = vi.fn((item: typeof a, value: typeof a) => {
    expect(Array.isArray(item)).toBe(false);
    expect(Array.isArray(value)).toBe(false);
    return item.id === value.id;
  });
  const view = render(
    <form>
      <Select
        multiple
        name="plans"
        defaultValue={[a]}
        items={[
          { value: a, label: "Alpha" },
          { value: b, label: "Beta" },
        ]}
        isItemEqualToValue={equal}
        itemToStringValue={(item) => item.id}
        modal={false}
      >
        <SelectTrigger aria-label="Object plans">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={a}>Alpha</SelectItem>
          <SelectItem value={b}>Beta</SelectItem>
        </SelectContent>
      </Select>
    </form>,
  );
  await openSelect(screen.getByRole("combobox", { name: "Object plans" }));
  await userEvent.click(screen.getByRole("option", { name: "Beta" }));
  expect(screen.getByRole("combobox", { name: "Object plans" })).toHaveTextContent("Alpha");
  expect(screen.getByRole("combobox", { name: "Object plans" })).toHaveTextContent("Beta");
  expect(new FormData(view.container.querySelector("form") as HTMLFormElement).getAll("plans")).toEqual(["a", "b"]);
  expect(document.querySelector("[data-cadence-handoff-layer]")).toBeNull();
});
