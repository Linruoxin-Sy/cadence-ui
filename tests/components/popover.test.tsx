import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CSSProperties } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/cadence/popover";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

type Frame = {
  open: boolean;
  title: string | number;
  description: string | number;
  body: string;
  paint: boolean;
  foreground: boolean;
};

type OpenChange = NonNullable<React.ComponentProps<typeof Popover>["onOpenChange"]>;

const initial = (): Frame => ({
  open: true,
  title: "Visible columns",
  description: "Three of five columns are shown.",
  body: "Short note.",
  paint: false,
  foreground: false,
});

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Popover open={frame.open} onOpenChange={onOpenChange}>
        <PopoverTrigger>Visible columns</PopoverTrigger>
        <PopoverContent style={frame.paint ? { backgroundColor: "#202020" } : undefined}>
          <PopoverHeader>
            <PopoverTitle style={frame.foreground ? { color: "#123456" } : undefined}>{frame.title}</PopoverTitle>
            <PopoverDescription style={frame.foreground ? { color: "#654321" } : undefined}>
              {frame.description}
            </PopoverDescription>
          </PopoverHeader>
          <p>{frame.body}</p>
        </PopoverContent>
      </Popover>
    </CadenceProvider>
  );
}

function Example() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>Visible columns</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Visible columns</PopoverTitle>
          <PopoverDescription>Three of five columns are shown.</PopoverDescription>
        </PopoverHeader>
        <Button>Reset</Button>
      </PopoverContent>
    </Popover>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: "Visible columns" }));
  return screen.findByRole("dialog");
}

describe("Popover", () => {
  it("opens from the trigger with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const popup = await open();
    expect(popup).toHaveAttribute("data-slot", "popover-content");
    expect(popup).toHaveAccessibleName("Visible columns");
    expect(popup).toHaveAccessibleDescription("Three of five columns are shown.");

    for (const slot of ["popover-header", "popover-title", "popover-description"]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    // The positioner is the native placement owner, not a second Cadence writer.
    expect(popup.parentElement).toHaveAttribute("data-slot", "popover-positioner");

    // The trigger reports the state it controls, not just the fact that it opens something.
    const trigger = screen.getByRole("button", { name: "Visible columns" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", popup.id);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Visible columns" });
    await open();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on an outside press, unlike an alert dialog", async () => {
    render(<Example />);
    await open();

    await userEvent.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(modes)("declares %s mode on the parts it owns", async (mode) => {
    renderInMode(mode);
    const popup = await open();

    expectMotionContract(mode, { parts: [popup] });
    expect(popup).toHaveAttribute("data-motion", mode);
    expect(document.querySelector('[data-slot="popover-title"]')).toHaveAttribute("data-motion", mode);
    expect(document.querySelector('[data-slot="popover-description"]')).toHaveAttribute("data-motion", mode);
    // The anchor-side approach is a mode branch in the executor, never a CSS class.
    expect(popup.className).not.toContain("scale-(--motion-scale-in)");
    expect(popup.className).not.toContain("data-[starting-style]:");
  });

  it("resolves the nested portal clock and evaluates callback classes/styles last", async () => {
    const { rerender } = render(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full" timeScale={4}>
          <Popover defaultOpen>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent className={(state) => (state.open ? "caller" : "closed")} style={() => ({ padding: 9 })}>
              <PopoverTitle className={() => "title-caller"}>Test clock</PopoverTitle>
              <PopoverDescription className={() => "description-caller"}>Details</PopoverDescription>
            </PopoverContent>
          </Popover>
        </CadenceProvider>
      </CadenceProvider>,
    );
    const popup = await screen.findByRole("dialog");
    expect(popup).toHaveClass("caller");
    expect(popup.style.getPropertyValue("--motion-duration-fast")).toBe("0.64s");
    expect(popup.style.padding).toBe("9px");
    expect(screen.getByText("Test clock").closest('[data-slot="popover-title"]')).toHaveClass("title-caller");
    expect(screen.getByText("Details").closest('[data-slot="popover-description"]')).toHaveClass("description-caller");
    rerender(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full" timeScale={4}>
          <Popover defaultOpen>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent style={() => ({ "--motion-duration-fast": "2s" }) as CSSProperties}>
              <PopoverTitle>Test clock</PopoverTitle>
            </PopoverContent>
          </Popover>
        </CadenceProvider>
      </CadenceProvider>,
    );
    expect(screen.getByRole("dialog")).toBe(popup);
    expect(popup.style.getPropertyValue("--motion-duration-fast")).toBe("2s");
  });
});

describe("Popover v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned popover action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (next, details) => {
      // Keep the closing surface so the owned exit can run before Base UI's own
      // completion decides when the portal node actually leaves the DOM.
      if (!next) details.preventUnmountOnClose();
      frame = { ...frame, open: next };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };
    const close = async () => {
      await userEvent.keyboard("{Escape}");
    };

    view = render(scene());
    await screen.findByRole("dialog");

    await expectV2MotionAction("popover", "popover.title.change", mode, () =>
      update({ title: "Visible columns and owners" }),
    );
    await expectV2MotionAction("popover", "popover.description.change", mode, () =>
      update({ description: "Four of six columns are shown, with their owners." }),
    );
    // Establish the numeric display owner, then revise it against that same slot.
    update({ title: 7, description: 8 });
    await expectV2MotionAction("popover", "popover.quantity.change", mode, () => update({ title: 9, description: 11 }));
    // The panel owns its surface paint; title and description own the foreground.
    await expectV2MotionAction("popover", "popover.surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("popover", "popover.foreground.colour", mode, () =>
      update({ paint: true, foreground: true }),
    );
    await expectV2MotionAction("popover", "popover.content.resize", mode, () =>
      update({
        paint: true,
        foreground: true,
        body: "A much longer note that represents a real committed content revision in the panel.",
      }),
    );

    await expectV2MotionAction("popover", "popover.content.exit", mode, close);
    await expectV2MotionAction("popover", "popover.content.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // Native placement and the composed body boundary own no Cadence writer.
    await expectV2NativeBoundaries("popover", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on an open popover", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <Popover open>
          <PopoverTrigger>Downgrade</PopoverTrigger>
          <PopoverContent>
            <PopoverTitle>Downgrade</PopoverTitle>
            <PopoverDescription>Downgrade body</PopoverDescription>
          </PopoverContent>
        </Popover>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = document.querySelector('[data-slot="popover-content"]') as HTMLElement;
    expect(content).toHaveAttribute("data-motion", "full");
    view.rerender(draw("reduced"));
    expect(content).toHaveAttribute("data-motion", "reduced");
    view.rerender(draw("none"));
    expect(content).toHaveAttribute("data-motion", "none");
    await waitFor(() =>
      expect(
        [...(content.getAnimations?.() ?? [])].filter((animation) => animation.playState === "running"),
      ).toHaveLength(0),
    );
  });

  it("keeps the anchor's native placement out of the panel's approach", async () => {
    render(
      <CadenceProvider mode="full">
        <Popover open>
          <PopoverTrigger>Placement</PopoverTrigger>
          <PopoverContent side="top" sideOffset={8}>
            <PopoverTitle>Placement</PopoverTitle>
            <PopoverDescription>Placement body</PopoverDescription>
          </PopoverContent>
        </Popover>
      </CadenceProvider>,
    );
    const content = await screen.findByRole("dialog");
    const positioner = content.parentElement as HTMLElement;
    expect(positioner).toHaveAttribute("data-slot", "popover-positioner");
    // The positioner keeps its own coordinates; the panel never rewrites them.
    expect(positioner.style.top).toBe("0px");
    expect(positioner.style.left).toBe("0px");
    expect(["", "none"]).toContain(content.style.translate);
  });
});
