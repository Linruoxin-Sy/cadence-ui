import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/cadence/sheet";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];
type Side = "top" | "right" | "bottom" | "left";

/** A presence boundary the composed Button can be flipped through without a mount. */
const presence = (present: boolean) => ({
  id: "retained",
  initial: false as const,
  isPresent: present,
  register: () => () => {},
  onExitComplete: () => {},
});

function Example({ side }: { side?: Side } = {}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Open filters</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Applied to this view only.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>Reset</SheetClose>
          <SheetClose render={<Button />}>Apply filters</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
  await userEvent.click(screen.getByRole("button", { name: "Open filters" }));
  return screen.findByRole("dialog");
}

describe("Sheet", () => {
  it("opens from the trigger with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const sheet = await open();
    expect(sheet).toHaveAttribute("data-slot", "sheet-content");
    expect(sheet).toHaveAttribute("data-side", "right");
    expect(sheet).toHaveAccessibleName("Filters");
    expect(sheet.className).toContain("right-0");

    for (const slot of [
      "sheet-overlay",
      "sheet-portal",
      "sheet-header",
      "sheet-title",
      "sheet-description",
      "sheet-footer",
      "sheet-close",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it.each([
    ["left", "left-0"],
    ["top", "top-0"],
    ["bottom", "bottom-0"],
  ] as const)("carries the %s placement", async (side, placement) => {
    render(<Example side={side} />);
    const sheet = await open();

    expect(sheet).toHaveAttribute("data-side", side);
    expect(sheet.className).toContain(placement);
    // Placement is a class decision; the travel itself is a managed transform.
    expect(sheet.className).not.toContain("translate-");
  });

  it("places an explicit side change immediately while the sheet is open", async () => {
    const draw = (side: Side) => (
      <CadenceProvider mode="full">
        <Sheet open>
          <SheetContent side={side}>
            <SheetTitle>Edge</SheetTitle>
          </SheetContent>
        </Sheet>
      </CadenceProvider>
    );
    const view = render(draw("right"));
    const sheet = screen.getByRole("dialog");
    expect(sheet).toHaveAttribute("data-side", "right");

    view.rerender(draw("left"));
    expect(sheet).toHaveAttribute("data-side", "left");
    expect(sheet.className).toContain("left-0");
    // No stale edge trajectory: the placement is the new edge at rest.
    expect(sheet.style.transform).not.toContain("translate");
    await waitFor(() =>
      expect(
        [...(sheet.getAnimations?.() ?? [])].filter((animation) => animation.playState === "running"),
      ).toHaveLength(0),
    );
  });

  it("closes from its close control and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Open filters" });
    await open();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes from the footer's optional Button action without a second control", async () => {
    render(
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>Open footer</SheetTrigger>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Footer action</SheetTitle>
          <SheetFooter showCloseButton closeLabel="Done" />
        </SheetContent>
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "Open footer" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");
    expect(document.querySelector('[data-slot="sheet-close"]')).toBeNull();

    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toHaveAttribute("data-slot", "sheet-footer-close");
    await userEvent.click(done);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it.each(modes)("declares %s on the real parts without a CSS travel family", async (mode) => {
    renderInMode(mode);
    const sheet = await open();
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');

    expect(sheet).toHaveAttribute("data-motion", mode);
    expect(overlay).toHaveAttribute("data-motion", mode);
    // The edge flight is a managed transform writer, never a competing CSS family.
    expect(sheet.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(overlay?.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(sheet.className).not.toContain("translate-x-full");
    expectMotionContract(mode, { policy: ["color"] });
  });

  it("restores local full clocks inside none and keeps callback styles/classes", async () => {
    const { rerender } = render(
      <CadenceProvider mode="none">
        <CadenceProvider mode="full" timeScale={2}>
          <Sheet open>
            <SheetContent className={() => "caller"} style={() => ({ color: "red" })}>
              <SheetTitle>Clock</SheetTitle>
              <SheetDescription>Local</SheetDescription>
            </SheetContent>
          </Sheet>
        </CadenceProvider>
      </CadenceProvider>,
    );
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("caller");
    expect(panel.style.getPropertyValue("--motion-duration-base")).toBe("0.44s");
    expect(panel.style.color).toBe("red");
    rerender(
      <CadenceProvider mode="none">
        <Sheet open>
          <SheetContent>
            <SheetTitle>Clock</SheetTitle>
            <SheetDescription>Local</SheetDescription>
          </SheetContent>
        </Sheet>
      </CadenceProvider>,
    );
    expect(screen.getByRole("dialog").style.getPropertyValue("--motion-duration-base")).toBe("0s");
  });

  it("preserves caller render and React 19 ref cleanup", () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const view = render(
      <CadenceProvider mode="none">
        <Sheet open>
          <SheetContent ref={ref} render={<section />} className="rendered">
            <SheetTitle>Rendered panel</SheetTitle>
          </SheetContent>
        </Sheet>
      </CadenceProvider>,
    );
    const node = document.querySelector('[data-slot="sheet-content"]') as HTMLElement;
    expect(node.tagName).toBe("SECTION");
    expect(node).toHaveClass("rendered");
    expect(ref).toHaveBeenCalledWith(node);
    view.unmount();
    expect(cleanup).toHaveBeenCalled();
  });

  it("cancels a controlled close and keeps native focus ownership", async () => {
    render(
      <Sheet
        onOpenChange={(next, details) => {
          if (!next) details.cancel();
        }}
      >
        <SheetTrigger render={<Button variant="outline" />}>Controlled</SheetTrigger>
        <SheetContent>
          <SheetTitle>Controlled sheet</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Controlled" }));
    const sheet = await screen.findByRole("dialog");
    expect(sheet.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

type Frame = {
  open: boolean;
  side: Side;
  title: string | number;
  description: string | number;
  body: string;
  paint: boolean;
  overlay: boolean;
  foreground: boolean;
};

type OpenChange = NonNullable<React.ComponentProps<typeof Sheet>["onOpenChange"]>;

const initial = (): Frame => ({
  open: true,
  side: "right",
  title: "Filters",
  description: "Applied to this view only.",
  body: "Short body.",
  paint: false,
  overlay: false,
  foreground: false,
});

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Sheet open={frame.open} onOpenChange={onOpenChange}>
        <SheetContent
          side={frame.side}
          overlayStyle={frame.overlay ? { backgroundColor: "#101010" } : undefined}
          style={frame.paint ? { backgroundColor: "#202020" } : undefined}
        >
          <SheetTitle style={frame.foreground ? { color: "#123456" } : undefined}>{frame.title}</SheetTitle>
          <SheetDescription style={frame.foreground ? { color: "#654321" } : undefined}>
            {frame.description}
          </SheetDescription>
          <p>{frame.body}</p>
          <SheetFooter>
            <SheetClose render={<Button type="button" variant="outline" />}>Reset</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </CadenceProvider>
  );
}

describe("Sheet v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned sheet action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (next, details) => {
      // Keep the closing surface so the owned exit runs before Base UI's own
      // completion decides when the modal parts actually leave the DOM.
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
      const control = document.querySelector('[data-slot="sheet-close"]');
      expect(control).toBeTruthy();
      await userEvent.click(control as Element);
    };

    view = render(scene());
    await screen.findByRole("dialog");

    await expectV2MotionAction("sheet", "sheet.title.change", mode, () => update({ title: "Saved filters" }));
    await expectV2MotionAction("sheet", "sheet.description.change", mode, () =>
      update({ description: "Applied to every view." }),
    );
    // Establish the numeric display owner, then revise it against that same slot.
    update({ title: 7, description: 8 });
    await expectV2MotionAction("sheet", "sheet.quantity.change", mode, () => update({ title: 9, description: 11 }));
    await expectV2MotionAction("sheet", "sheet.surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("sheet", "sheet.overlay.colour", mode, () => update({ overlay: true }));
    await expectV2MotionAction("sheet", "sheet.foreground.colour", mode, () => update({ foreground: true }));
    await expectV2MotionAction("sheet", "sheet.content.resize", mode, () =>
      update({ body: "A much longer body that represents a real committed content revision." }),
    );

    await expectV2MotionAction("sheet", "sheet.content.exit", mode, close);
    await expectV2MotionAction("sheet", "sheet.content.enter", mode, () => update({ open: true }));
    await expectV2MotionAction("sheet", "sheet.overlay.exit", mode, close);
    await expectV2MotionAction("sheet", "sheet.overlay.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // The built-in close and the anchored body are boundaries, never local writers.
    await expectV2NativeBoundaries("sheet", { container: document.body });
  });

  it.each(modes)("keeps each inherited Button owner on the close action in %s", async (mode) => {
    let frame = { present: true, label: "Apply" as string | number, paint: false };
    let view: ReturnType<typeof render>;
    const draw = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(frame.present)}>
          <Sheet open>
            <SheetContent showCloseButton={false}>
              <SheetHeader>
                <SheetTitle>Inherited close</SheetTitle>
              </SheetHeader>
              <SheetFooter
                showCloseButton
                closeLabel={frame.label}
                closeStyle={frame.paint ? { backgroundColor: "#303030" } : undefined}
              />
            </SheetContent>
          </Sheet>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const update = (next: Partial<typeof frame>) => {
      frame = { ...frame, ...next };
      view.rerender(draw());
    };
    view = render(draw());
    const control = document.querySelector('[data-slot="sheet-footer-close"]') as HTMLButtonElement;
    expect(control).toBeInstanceOf(HTMLButtonElement);

    // Button keeps one press visual on its own inner layer.
    await expectV2MotionAction("sheet", "sheet.close-press.press", mode, () => {
      fireEvent.pointerDown(control.querySelector('[data-slot="button-feedback"]') ?? control, {
        button: 0,
        pointerId: 1,
        isPrimary: true,
      });
    });
    fireEvent.pointerUp(control, { pointerId: 1 });
    // …one surface/foreground family on the root it renders…
    await expectV2MotionAction("sheet", "sheet.close-colour.colour", mode, () => update({ paint: true }));
    // …one measured box, one label owner and one quantity owner.
    await expectV2MotionAction("sheet", "sheet.close-size.resize", mode, () => update({ label: "Apply filters" }), {
      properties: ["height", "width"],
    });
    await expectV2MotionAction("sheet", "sheet.close-label.replace", mode, () =>
      update({ label: "Apply every filter" }),
    );
    update({ label: 7 });
    await expectV2MotionAction("sheet", "sheet.close-number.roll", mode, () => update({ label: 8 }));
    // …and one retained exit, owned by Button rather than by the sheet.
    await expectV2MotionAction("sheet", "sheet.close-presence.exit", mode, () => update({ present: false }));
    view.unmount();
  });

  it("settles a live full to reduced to none downgrade on an open panel", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <Sheet open>
          <SheetContent>
            <SheetTitle>Downgrade</SheetTitle>
            <SheetDescription>Downgrade body</SheetDescription>
          </SheetContent>
        </Sheet>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = document.querySelector('[data-slot="sheet-content"]') as HTMLElement;
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
});
