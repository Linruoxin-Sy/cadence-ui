import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/cadence/select";
import { expectMotionContract } from "../motion-contract";

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
    expect(document.querySelector('[data-slot="select-handoff"]')).not.toBeInTheDocument();
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

  it("sizes the value slot from its measured content", async () => {
    const { container, rerender } = render(<Demo />);
    const value = container.querySelector('[data-slot="select-value"]') as HTMLElement;
    Object.defineProperty(value, "scrollWidth", { configurable: true, get: () => 160 });

    rerender(<Demo />);
    await waitFor(() => expect(value.style.width).toBe("160px"));
  });

  it("uses intrinsic reduced/none width and retains the measured value for full", async () => {
    const { container, rerender } = render(<Demo mode="reduced" />);
    const value = container.querySelector('[data-slot="select-value"]') as HTMLElement;
    Object.defineProperty(value, "scrollWidth", { configurable: true, get: () => 96 });

    rerender(<Demo mode="reduced" />);
    expect(value.style.width).toBe("auto");
    rerender(<Demo mode="none" />);
    expect(value.style.width).toBe("auto");
    expect(container.querySelector('[data-slot="select-value"]')).toBe(value);
    rerender(<Demo mode="full" />);
    await waitFor(() => expect(value.style.width).toBe("96px"));
  });

  it("does not invent a flight from rectangles without visible native layout or replay retained label text", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    await openSelect(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Remix" }));
    expect(document.querySelector('[data-slot="select-handoff"]')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Remix");
    expect(trigger.textContent?.match(/Remix/g)).toHaveLength(1);
  });

  it("skips the flight under reduced motion", async () => {
    render(<Demo mode="reduced" />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    await openSelect(trigger);
    await userEvent.click(screen.getByRole("option", { name: "Remix" }));

    expect(document.querySelector('[data-slot="select-handoff"]')).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Remix");
  });

  it("opens from the keyboard without a handoff origin", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    trigger.focus();

    await userEvent.keyboard("{Enter}");

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="select-handoff"]')).not.toBeInTheDocument();
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
