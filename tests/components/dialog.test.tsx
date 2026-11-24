import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/registry/cadence/dialog";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
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
  overlay: boolean;
  foreground: boolean;
};

type OpenChange = NonNullable<React.ComponentProps<typeof Dialog>["onOpenChange"]>;

const initial = (): Frame => ({
  open: true,
  title: "Rename project",
  description: "The URL stays the same.",
  body: "Short body.",
  paint: false,
  overlay: false,
  foreground: false,
});

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Dialog open={frame.open} onOpenChange={onOpenChange}>
        <DialogContent
          overlayStyle={frame.overlay ? { backgroundColor: "#101010" } : undefined}
          style={frame.paint ? { backgroundColor: "#202020" } : undefined}
        >
          <DialogTitle style={frame.foreground ? { color: "#123456" } : undefined}>{frame.title}</DialogTitle>
          <DialogDescription style={frame.foreground ? { color: "#654321" } : undefined}>
            {frame.description}
          </DialogDescription>
          <p>{frame.body}</p>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </CadenceProvider>
  );
}

function Example() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Rename project</DialogTrigger>
      <DialogContent>
        <DialogTitle>Rename project</DialogTitle>
        <DialogDescription>The URL stays the same.</DialogDescription>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

describe("Dialog", () => {
  it("opens from the trigger and exposes an accessible name", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Rename project" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("data-slot", "dialog-content");
    expect(dialog).toHaveAccessibleName("Rename project");
    expect(screen.getByText("The URL stays the same.")).toBeInTheDocument();
  });

  it("closes from a close control and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Rename project" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("fades the panel and backdrop with one owner each and keeps the mode branch", async () => {
    renderInMode("full");
    await userEvent.click(screen.getByRole("button", { name: "Rename project" }));

    const dialog = await screen.findByRole("dialog");
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(dialog).toHaveAttribute("data-motion", "full");
    expect(overlay).toHaveAttribute("data-motion", "full");
    // Presence is a managed opacity/scale writer, never a competing CSS transition family.
    expect(dialog.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(overlay?.className).not.toMatch(/transition-(?:opacity|\[)/);
    expect(dialog.className).not.toContain("scale-(--motion-scale-in)");
    expectMotionContract("full", { policy: ["color"] });
  });

  it.each(modes)("declares %s on the real parts and drops travel outside full", async (mode) => {
    renderInMode(mode);
    await userEvent.click(screen.getByRole("button", { name: "Rename project" }));

    const dialog = await screen.findByRole("dialog");
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(dialog).toHaveAttribute("data-motion", mode);
    expect(overlay).toHaveAttribute("data-motion", mode);
    expect(dialog.className).not.toMatch(/transition-(?:opacity|\[)/);
    const title = document.querySelector('[data-slot="dialog-title"]') as HTMLElement;
    if (mode === "none") expect(title.style.transitionDuration).toBe("0s");
    else expect(title.style.transitionDuration).not.toBe("0s");
    expectMotionContract(mode, { policy: ["color"] });
  });

  it("preserves caller render, class/style callbacks and React 19 ref cleanup", () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const view = render(
      <CadenceProvider mode="none">
        <Dialog open>
          <DialogContent
            ref={ref}
            render={<section />}
            className={(state) => (state.open ? "open-class" : "closed-class")}
            style={(state) => ({ opacity: state.open ? 0.9 : 0.2 })}
          >
            <DialogTitle>Rendered panel</DialogTitle>
          </DialogContent>
        </Dialog>
      </CadenceProvider>,
    );
    const node = document.querySelector('[data-slot="dialog-content"]') as HTMLElement;
    expect(node.tagName).toBe("SECTION");
    expect(node).toHaveClass("open-class");
    expect(node).not.toHaveClass("closed-class");
    expect(node.style.opacity).toBe("0.9");
    expect(ref).toHaveBeenCalledWith(node);
    view.unmount();
    expect(cleanup).toHaveBeenCalled();
  });

  it("cancels a controlled close and keeps native focus ownership", async () => {
    render(
      <Dialog
        onOpenChange={(open, details) => {
          if (!open) details.cancel();
        }}
      >
        <DialogTrigger render={<Button variant="outline" />}>Controlled</DialogTrigger>
        <DialogContent>
          <DialogTitle>Controlled dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Controlled" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  /**
   * `dialog.content.enter` and `dialog.overlay.enter` are Web Animations started by the
   * shared modal presence controller, so `transition-duration` cannot report them and
   * jsdom has no animation engine at all. Stubbing `animate` is what makes "the
   * declared envelope actually started" observable in this suite; without it a surface
   * that silently stopped writing its entrance would still pass every assertion above.
   * jsdom also has no layout, so only the opacity half is reachable here: the `scale.in`
   * envelope it writes on top is proven in `tests/e2e/motion-matrix.spec.ts`.
   */
  it.each(modes)("starts the declared panel and backdrop entrance in %s", async (mode) => {
    const calls: { slot: string | null; properties: string[]; duration: number }[] = [];
    const animate = vi.fn(function record(this: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) {
      calls.push({
        slot: this.getAttribute("data-slot"),
        properties: [...new Set(frames.flatMap((frame) => Object.keys(frame ?? {})))].sort(),
        duration: Number(timing.duration),
      });
      return {
        effect: { setKeyframes: () => {}, getKeyframes: () => [] },
        cancel: vi.fn(),
        playState: "running",
        // The entrance never resolves here: the harness only cares that it started.
        finished: new Promise(() => {}),
      };
    });
    const previous = Element.prototype.animate;
    Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
    const clock = { full: 220, reduced: 132, none: null }[mode];
    const entrance = () =>
      calls
        .filter((call) => call.slot === "dialog-content" || call.slot === "dialog-overlay")
        .map((call) => `${call.slot}:${call.properties.join("+")}@${call.duration}`)
        // The backdrop is committed with the portal, the panel with its popup; the
        // pair is what matters, not which effect ran first.
        .sort();
    try {
      renderInMode(mode);
      await userEvent.click(screen.getByRole("button", { name: "Rename project" }));
      await screen.findByRole("dialog");
      expect(entrance()).toEqual(
        clock === null ? [] : [`dialog-content:opacity@${clock}`, `dialog-overlay:opacity@${clock}`].sort(),
      );

      // A reopen is a second entrance on a fresh surface, not an already-visible render.
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      calls.length = 0;
      await userEvent.click(screen.getByRole("button", { name: "Rename project" }));
      await screen.findByRole("dialog");
      expect(entrance()).toEqual(
        clock === null ? [] : [`dialog-content:opacity@${clock}`, `dialog-overlay:opacity@${clock}`].sort(),
      );
    } finally {
      Element.prototype.animate = previous;
    }
  });
});

describe("Dialog v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned dialog action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (open, details) => {
      if (!open) details.preventUnmountOnClose();
      frame = { ...frame, open };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };
    const close = async () => {
      const footer = document.querySelector('[data-slot="dialog-footer"] [data-slot="dialog-close"]');
      expect(footer).toBeTruthy();
      await userEvent.click(footer as Element);
    };

    view = render(scene());
    await screen.findByRole("dialog");

    await expectV2MotionAction("dialog", "dialog.title.change", mode, () => update({ title: "Renamed project" }));
    await expectV2MotionAction("dialog", "dialog.description.change", mode, () =>
      update({ description: "The route stays the same." }),
    );
    // Establish the numeric display owner, then revise it against that same slot.
    update({ title: 7, description: 8 });
    await expectV2MotionAction("dialog", "dialog.quantity.change", mode, () => update({ title: 9, description: 11 }));
    await expectV2MotionAction("dialog", "dialog.surface.colour", mode, () => update({ paint: true }));
    await expectV2MotionAction("dialog", "dialog.overlay.colour", mode, () => update({ overlay: true }));
    await expectV2MotionAction("dialog", "dialog.foreground.colour", mode, () => update({ foreground: true }));
    await expectV2MotionAction("dialog", "dialog.content.resize", mode, () =>
      update({ body: "A much longer body that represents a real committed content revision." }),
    );

    await expectV2MotionAction("dialog", "dialog.content.exit", mode, close);
    await expectV2MotionAction("dialog", "dialog.content.enter", mode, () => update({ open: true }));
    await expectV2MotionAction("dialog", "dialog.overlay.exit", mode, close);
    await expectV2MotionAction("dialog", "dialog.overlay.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    await expectV2NativeBoundaries("dialog", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on an open panel", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <Dialog open>
          <DialogContent>
            <DialogTitle>Downgrade</DialogTitle>
            <DialogDescription>Downgrade body</DialogDescription>
          </DialogContent>
        </Dialog>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const content = document.querySelector('[data-slot="dialog-content"]') as HTMLElement;
    expect(content).toHaveAttribute("data-motion", "full");
    view.rerender(draw("reduced"));
    expect(content).toHaveAttribute("data-motion", "reduced");
    view.rerender(draw("none"));
    expect(content).toHaveAttribute("data-motion", "none");
    expect(content.style.transitionDuration).toBe("0s");
    await waitFor(() =>
      expect(
        [...(content.getAnimations?.() ?? [])].filter((animation) => animation.playState === "running"),
      ).toHaveLength(0),
    );
  });
});
