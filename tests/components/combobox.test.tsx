import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/registry/cadence/combobox";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

function Demo({ mode, showClear }: { mode?: "full" | "reduced" | "none"; showClear?: boolean }) {
  return (
    <CadenceProvider mode={mode}>
      <Combobox items={frameworks} defaultValue={showClear ? "Remix" : undefined}>
        <ComboboxInput placeholder="Select a framework" aria-label="Framework" showClear={showClear} />
        <ComboboxContent>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </CadenceProvider>
  );
}

function ChipsDemo() {
  const anchor = useComboboxAnchor();

  return (
    <CadenceProvider>
      <Combobox multiple items={["Design", "Docs", "Testing"]} defaultValue={["Design"]}>
        <ComboboxChips ref={anchor}>
          <ComboboxValue>
            {(value: string[]) => (
              <>
                {value.map((topic) => (
                  <ComboboxChip key={topic}>{topic}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder="Add topic" aria-label="Topics" />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No topic found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </CadenceProvider>
  );
}

const field = () => screen.getByRole("combobox", { name: "Framework" });

async function openList() {
  const input = field();
  input.focus();
  await userEvent.keyboard("{ArrowDown}");
  await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
  return input;
}

describe("Combobox", () => {
  it("renders the field inside the input-group frame with the mode", () => {
    const { container } = render(<Demo />);

    expect(field()).toHaveAttribute("placeholder", "Select a framework");
    // The frame is what carries `data-motion` and the input-group slot; the input itself
    // is upstream's `input-group-control`, which is what the frame's focus ring watches.
    const frame = container.querySelector('[data-slot="input-group"]');
    expect(frame).toHaveAttribute("data-motion", "full");
    expect(field()).toHaveAttribute("data-slot", "input-group-control");

    // The chevron is composed into the addon's button, so the element in the DOM carries the
    // frame's slot — that is how upstream composes it too. `combobox-trigger` is the slot a
    // hand-placed trigger reports, which the standalone test below pins.
    const trigger = container.querySelector('[data-slot="input-group-button"]');
    expect(trigger).toHaveAttribute("aria-label", "Show options");
    expect(container.querySelector('[data-slot="combobox-clear"]')).toBeNull();
  });

  it("renders a hand-placed trigger with its own slot", () => {
    const { container } = render(
      <Combobox items={frameworks}>
        <ComboboxTrigger aria-label="Open the framework list" />
      </Combobox>,
    );

    // Located by slot, not by name: Base UI may point the trigger at the field's label
    // through `aria-labelledby`, which outranks the label a caller passes.
    const trigger = container.querySelector('[data-slot="combobox-trigger"]');
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-label", "Open the framework list");
  });

  it("opens the listbox and reports the chosen value", async () => {
    render(<Demo />);
    const input = await openList();

    expect(screen.getAllByRole("option")).toHaveLength(frameworks.length);

    await userEvent.click(screen.getByRole("option", { name: "Astro" }));
    expect(input).toHaveValue("Astro");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("filters as the reader types and shows the empty state", async () => {
    render(<Demo />);
    const input = await openList();

    await userEvent.type(input, "next");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.getByRole("option", { name: "Next.js" })).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "zzz");
    await waitFor(() => expect(screen.queryAllByRole("option")).toHaveLength(0));
    expect(screen.getByText("No framework found.")).toBeInTheDocument();
  });

  it("keeps one indicator per row and ticks only the selected one", async () => {
    const { container } = render(<Demo showClear />);
    await openList();

    const indicators = container.ownerDocument.querySelectorAll('[data-slot="combobox-item-indicator"]');
    expect(indicators).toHaveLength(frameworks.length);
    for (const indicator of indicators) {
      expect(indicator).toHaveAttribute("data-motion", "full");
    }

    const selected = screen.getByRole("option", { name: "Remix" });
    const tick = selected.querySelector('[data-slot="combobox-item-indicator"]');
    await waitFor(() => expect(tick).toHaveStyle({ opacity: "1" }));

    const other = screen.getByRole("option", { name: "Astro" });
    await waitFor(() =>
      expect(other.querySelector('[data-slot="combobox-item-indicator"]')).toHaveStyle({ opacity: "0" }),
    );
  });

  it("clears the value from the clear button and hides the chevron while it shows", async () => {
    const { container } = render(<Demo showClear />);
    const clear = container.querySelector('[data-slot="combobox-clear"]');

    expect(clear).toHaveAttribute("aria-label", "Clear");
    expect(container.querySelector('[data-slot="input-group-button"]')).toHaveClass(
      "group-has-data-[slot=combobox-clear]/input-group:hidden",
    );

    await userEvent.click(clear as HTMLElement);
    expect(field()).toHaveValue("");
  });

  it("opens from the keyboard without a pointer", async () => {
    render(<Demo />);
    await openList();
    expect(field()).toHaveAttribute("aria-expanded", "true");
  });

  it("survives the reduced branch", async () => {
    const { container } = render(<Demo mode="reduced" />);
    await openList();

    expect(container.querySelector('[data-slot="input-group"]')).toHaveAttribute("data-motion", "reduced");
    const panel = container.ownerDocument.querySelector('[data-slot="combobox-content"]');
    expect(panel).toHaveAttribute("data-motion", "reduced");
    // The scale is a class on the popup under `full`; under reduced the class is absent, so
    // the panel cross-fades instead of growing.
    expect(panel?.className).not.toContain("scale-(--motion-scale-in)");
  });

  it("disables every duration under none", async () => {
    const { container } = render(<Demo mode="none" />);
    await openList();

    expect(container.querySelector('[data-slot="input-group"]')).toHaveAttribute("data-motion", "none");
    expect(container.ownerDocument.querySelector('[data-slot="combobox-content"]')).toHaveAttribute(
      "data-motion",
      "none",
    );
  });

  it("renders the chips layout with named remove buttons", () => {
    const { container } = render(<ChipsDemo />);

    expect(container.querySelector('[data-slot="combobox-chips"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Design" })).toHaveAttribute("data-slot", "combobox-chip-remove");
    expect(screen.getByRole("combobox", { name: "Topics" })).toHaveAttribute("data-slot", "combobox-chip-input");
  });
});
