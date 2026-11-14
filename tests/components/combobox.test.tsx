import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
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
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/registry/cadence/combobox";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import {
  expectV2MotionAction,
  expectV2MotionInsertion,
  expectV2NativeBoundaries,
  prepareV2MotionPlan,
} from "../motion-v2-contract";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
type Mode = "full" | "reduced" | "none";
type Paint = Record<string, React.CSSProperties | undefined>;

function Demo({ mode, showClear }: { mode?: Mode; showClear?: boolean }) {
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
    // is the composed editor, which is what the frame's focus ring watches.
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
    // The standalone trigger owns its own insertion opacity and paint; the composed
    // branch above is the Button's own node and declares neither.
    expect(trigger).toHaveAttribute("data-motion", "full");
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

  it("carries the effective mode on the popup without a CSS motion clock", async () => {
    const { container } = render(<Demo mode="reduced" />);
    await openList();

    expect(container.querySelector('[data-slot="input-group"]')).toHaveAttribute("data-motion", "reduced");
    const panel = container.ownerDocument.querySelector('[data-slot="combobox-content"]');
    expect(panel).toHaveAttribute("data-motion", "reduced");
    // The anchored entrance is a JS writer on the same node; the chrome declares no
    // authored CSS transition of its own.
    expect(panel?.className).not.toMatch(/(?:^|:)transition-(?!none)/);
    expect(panel?.className).not.toContain("duration-");
  });

  it("settles every declared clock under none", async () => {
    const { container } = render(<Demo mode="none" />);
    await openList();

    expect(container.querySelector('[data-slot="input-group"]')).toHaveAttribute("data-motion", "none");
    const panel = container.ownerDocument.querySelector('[data-slot="combobox-content"]');
    expect(panel).toHaveAttribute("data-motion", "none");
    expect(panel?.className).not.toMatch(/(?:^|:)transition-(?!none)/);
  });

  it("renders the chips layout with named remove buttons", () => {
    const { container } = render(<ChipsDemo />);

    expect(container.querySelector('[data-slot="combobox-chips"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Design" })).toHaveAttribute("data-slot", "combobox-chip-remove");
    expect(screen.getByRole("combobox", { name: "Topics" })).toHaveAttribute("data-slot", "combobox-chip-input");
  });
});

/** One live instance shared by every v2 action; a single option keeps each host unique. */
type HarnessState = {
  open: boolean;
  value: string[];
  hidden: Record<string, boolean>;
  paint: Paint;
  query: string;
  inheritedOpen: boolean;
};
const controls: {
  set: (patch: Partial<HarnessState>) => void;
  input: HTMLInputElement | null;
} = { set: () => {}, input: null };

function Harness({ mode }: { mode: Mode }) {
  const [state, setState] = React.useState<HarnessState>({
    open: true,
    value: ["Next.js"],
    hidden: {},
    paint: {},
    query: "",
    inheritedOpen: false,
  });
  controls.set = (patch) => setState((current) => ({ ...current, ...patch }));
  const anchor = useComboboxAnchor();
  const paint = state.paint;
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Combobox
        multiple
        items={["Next.js"]}
        value={state.value}
        onValueChange={() => {}}
        inputValue=""
        open={state.open}
        onOpenChange={(next, details) => {
          details.preventUnmountOnClose();
          setState((current) => ({ ...current, open: next }));
        }}
      >
        <ComboboxChips ref={anchor} hidden={state.hidden.chips} style={paint.chips} aria-label="Selected topics">
          <ComboboxValue>
            {(selected: string[]) => (
              <>
                {selected.map((topic) => (
                  <ComboboxChip key={topic} hidden={state.hidden.chip} style={paint.chip}>
                    {topic}
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  aria-label="Topics"
                  ref={(node: HTMLInputElement | null) => {
                    controls.input = node;
                  }}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor} style={paint.content}>
          <ComboboxSeparator style={paint.separator} />
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item} value={item} style={paint.item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Combobox
        items={["Next.js"]}
        defaultValue="Next.js"
        inputValue={state.query}
        onInputValueChange={() => {}}
        open={state.inheritedOpen}
        onOpenChange={(next) => setState((current) => ({ ...current, inheritedOpen: next }))}
      >
        <div className="flex items-center gap-2">
          <ComboboxInput aria-label="Inherited field" />
          <ComboboxTrigger aria-label="Browse" hidden={state.hidden.trigger} style={paint.trigger} />
        </div>
      </Combobox>
    </CadenceProvider>
  );
}

describe("Combobox v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(["full", "reduced", "none"] as const)("executes the declared owners in %s", async (mode) => {
    const view = render(<Harness mode={mode} />);
    // The popup is portalled to the document, so the whole composed tree is the scope.
    const container = view.baseElement;
    const slot = (name: string) => container.querySelector(`[data-slot="${name}"]`) as HTMLElement;

    // Popup: anchored entrance and anchored ending on the same rendered surface.
    await act(async () => {
      controls.input?.focus();
    });
    await expectV2MotionAction("combobox", "combobox.content.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("combobox", "combobox.content.enter", mode, async () => {
      act(() => controls.set({ open: true }));
    });

    // Later-inserted standalone hosts keep one local envelope each.
    act(() => controls.set({ hidden: { trigger: true, chip: true } }));
    await expectV2MotionAction("combobox", "combobox.trigger.enter", mode, async () => {
      act(() => controls.set({ hidden: { chip: true } }));
    });
    await expectV2MotionAction("combobox", "combobox.chip.enter", mode, async () => {
      act(() => controls.set({ hidden: {} }));
    });

    // The composed Button and editor keep their own entrance owners: a real query and
    // open revision reaches the editor value and the button's expanded state.
    await expectV2MotionAction("combobox", "combobox.member.enter", mode, async () => {
      act(() => controls.set({ inheritedOpen: true }));
    });

    // Owned paint, one declared family per physical host. Every action of the binding
    // shares this composition, so one committed repaint reaches each of them.
    await expectV2MotionAction("combobox", "combobox.surface.colour", mode, async () => {
      act(() =>
        controls.set({
          paint: {
            content: { backgroundColor: "#eeeeee" },
            item: { backgroundColor: "#dddddd" },
            chip: { backgroundColor: "#cccccc" },
            chips: { backgroundColor: "#bbbbbb" },
            trigger: { backgroundColor: "#aaaaaa" },
          },
        }),
      );
    });
    await expectV2MotionAction("combobox", "combobox.separator.colour", mode, async () => {
      act(() => controls.set({ paint: { separator: { backgroundColor: "#999999" } } }));
    });

    // Composed dependency owners keep their own physical hosts. The paint revision is
    // applied to the actual node so the shared colour owner re-samples it.
    const frame = slot("input-group");
    await expectV2MotionAction("combobox", "combobox.frame.colour", mode, async () => {
      frame.style.backgroundColor = "#777777";
      await Promise.resolve();
    });
    const composedButton = slot("input-group-button");
    await expectV2MotionAction("combobox", "combobox.member.colour", mode, async () => {
      composedButton.style.backgroundColor = "#666666";
      await Promise.resolve();
    });

    // The retained tick retargets on the same indicator host, then the accepted value is
    // restored so the chip and item boundaries stay mounted.
    await expectV2MotionAction("combobox", "combobox.indicator.select", mode, async () => {
      act(() => controls.set({ value: [] }));
    });
    act(() => controls.set({ value: ["Next.js"] }));

    expect(slot("combobox-content")).toBeInTheDocument();
    expectMotionContract(mode, { policy: ["color"] });
    await expectV2NativeBoundaries("combobox", { container });
  });

  it.each(["full", "reduced", "none"] as const)("inserts a standalone trigger in %s", async (mode) => {
    const restore = stubAnimations();
    try {
      const draw = (show: boolean) => (
        <CadenceProvider mode={mode}>
          <Combobox items={["Next.js"]}>
            <ComboboxInput aria-label="Field" />
            {show && <ComboboxTrigger aria-label="Inserted trigger" />}
          </Combobox>
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionInsertion("combobox", "combobox.trigger.enter", mode, async () => {
        view.rerender(draw(true));
      });
    } finally {
      restore();
    }
  });

  it.each(["full", "reduced", "none"] as const)("inserts a chips frame in %s", async (mode) => {
    const restore = stubAnimations();
    try {
      const draw = (show: boolean) => (
        <CadenceProvider mode={mode}>
          <Combobox items={["Next.js"]}>
            <ComboboxInput aria-label="Field" />
          </Combobox>
          {show && <InsertedChips mode={mode} />}
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionInsertion("combobox", "combobox.chips.enter", mode, async () => {
        view.rerender(draw(true));
      });
    } finally {
      restore();
    }
  });

  it.each(["full", "reduced", "none"] as const)("inserts a chip in %s", async (mode) => {
    const restore = stubAnimations();
    try {
      const view = render(<ChipInsertion mode={mode} />);
      await expectV2MotionInsertion("combobox", "combobox.chip.enter", mode, async () => {
        act(() => chipControls.add());
      });
    } finally {
      restore();
    }
  });

  it.each(["full", "reduced", "none"] as const)("inserts the composed frame in %s", async (mode) => {
    const restore = stubAnimations();
    try {
      const draw = (show: boolean) => (
        <CadenceProvider mode={mode}>
          <Combobox items={["Next.js"]}>
            <ComboboxTrigger aria-label="Browse" />
            {show && <ComboboxInput aria-label="Inserted field" />}
          </Combobox>
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionInsertion("combobox", "combobox.frame.enter", mode, async () => {
        view.rerender(draw(true));
      });
    } finally {
      restore();
    }
  });
});

/** A chips composition that mounts after the document is already presented. */
function InsertedChips({ mode }: { mode: Mode }) {
  return (
    <Combobox multiple items={["Next.js"]} defaultValue={["Next.js"]}>
      <ComboboxChips aria-label="Inserted chips">
        <ComboboxValue>
          {(selected: string[]) => (
            <>
              {selected.map((topic) => (
                <ComboboxChip key={topic}>{topic}</ComboboxChip>
              ))}
              <ComboboxChipsInput aria-label="Inserted topics" />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

const chipControls: { add: () => void } = { add: () => {} };

/** Starts with no chip, so a later committed value mounts a genuinely new chip host. */
function ChipInsertion({ mode }: { mode: Mode }) {
  const [value, setValue] = React.useState<string[]>([]);
  chipControls.add = () => setValue(["Next.js"]);
  return (
    <CadenceProvider mode={mode}>
      <Combobox multiple items={["Next.js"]} value={value} onValueChange={() => {}}>
        <ComboboxChips aria-label="Chips">
          <ComboboxValue>
            {(selected: string[]) => (
              <>
                {selected.map((topic) => (
                  <ComboboxChip key={topic}>{topic}</ComboboxChip>
                ))}
                <ComboboxChipsInput aria-label="Topics" />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent>
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

function stubAnimations() {
  const hadVisibility = "checkVisibility" in Element.prototype;
  const previousVisibility = Element.prototype.checkVisibility;
  // jsdom has no layout engine; report the hosts as visible so the dependency's own
  // insertion gate can run its real executor.
  Element.prototype.checkVisibility = () => true;
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
  HTMLElement.prototype.animate = animate as unknown as typeof HTMLElement.prototype.animate;
  return () => {
    HTMLElement.prototype.animate = old;
    if (hadVisibility) Element.prototype.checkVisibility = previousVisibility;
    else delete (Element.prototype as { checkVisibility?: unknown }).checkVisibility;
  };
}
