import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/cadence/select";

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

describe("Select", () => {
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

  it("jumps the measured width under reduced motion", async () => {
    const { container, rerender } = render(<Demo mode="reduced" />);
    const value = container.querySelector('[data-slot="select-value"]') as HTMLElement;
    Object.defineProperty(value, "scrollWidth", { configurable: true, get: () => 96 });

    rerender(<Demo mode="reduced" />);
    await waitFor(() => expect(value.style.width).toBe("96px"));
  });

  it("flies the label from the item to the trigger on pointer selection", async () => {
    render(<Demo />);
    const trigger = screen.getByRole("combobox", { name: "Framework" });
    await openSelect(trigger);

    const itemText = screen.getByRole("option", { name: "Remix" }).querySelector('[data-slot="select-item-text"]');
    const value = trigger.querySelector('[data-slot="select-value"]');
    const valueText = value?.firstElementChild as HTMLElement;

    const rect = (left: number, top: number, width: number, height: number) =>
      ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }) as DOMRect;
    Object.defineProperty(itemText as HTMLElement, "getBoundingClientRect", { value: () => rect(20, 300, 48, 20) });
    Object.defineProperty(valueText, "getBoundingClientRect", { value: () => rect(200, 100, 60, 20) });

    await userEvent.click(screen.getByRole("option", { name: "Remix" }));

    const clone = document.querySelector('[data-slot="select-handoff"]');
    expect(clone).toBeInTheDocument();
    expect(clone).toHaveTextContent("Remix");
    expect(clone).toHaveStyle({ left: "200px", top: "100px" });
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
