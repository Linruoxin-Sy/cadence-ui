import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/cadence/drawer";
import { CadenceProvider, type CadenceProviderProps } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Example({ showSwipeHandle = true }: { showSwipeHandle?: boolean } = {}) {
  return (
    <Drawer showSwipeHandle={showSwipeHandle}>
      <DrawerTrigger render={<Button variant="outline" />}>Move conversation</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move conversation</DrawerTitle>
          <DrawerDescription>Drag down to dismiss.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const popup = () => document.querySelector('[data-slot="drawer-popup"]');

function renderInMode(mode: NonNullable<CadenceProviderProps["mode"]>) {
  return render(
    <CadenceProvider mode={mode}>
      <Example />
    </CadenceProvider>,
  );
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: "Move conversation" }));
  return screen.findByRole("dialog");
}

describe("Drawer", () => {
  it("opens from the trigger with an accessible name and upstream's slots", async () => {
    render(<Example />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const dialog = await open();
    expect(dialog).toHaveAccessibleName("Move conversation");
    expect(popup()).toHaveAttribute("data-slot", "drawer-popup");
    expect(popup()).toHaveAttribute("data-swipe-axis", "y");

    for (const slot of [
      "drawer-portal",
      "drawer-overlay",
      "drawer-swipe-handle",
      "drawer-content",
      "drawer-header",
      "drawer-title",
      "drawer-title-text",
      "drawer-description",
      "drawer-description-text",
      "drawer-footer",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("hides the swipe handle unless it is asked for", async () => {
    render(<Example showSwipeHandle={false} />);
    await open();
    expect(document.querySelector('[data-slot="drawer-swipe-handle"]')).toBeNull();
  });

  it("closes from its close control and returns focus to the trigger", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Move conversation" });
    await open();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps the native gesture channels and drops the authored release outside full", async () => {
    renderInMode("full");
    await open();

    const shell = popup();
    expectMotionContract("full", { parts: [shell] });
    // Placement is the native snap offset, and the release is the primitive's own family.
    expect(shell?.className).toContain("[translate:0px_var(--drawer-snap-point-offset,0px)]");
    expect(shell?.className).toContain("transition-[transform,translate]");
    expect(shell?.className).toContain("duration-(--motion-duration-slow)");
    // No authored entry pose competes with the managed entrance.
    expect(shell?.className).not.toContain("starting-style");
    expect(shell?.className).not.toContain("ending-style");

    const overlay = document.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toHaveAttribute("data-motion", "full");
    // The backdrop keeps one opacity channel: its own native swipe progress.
    expect(overlay?.className).toContain("opacity-[calc(1_-_var(--drawer-swipe-progress,0))]");
    expect(overlay?.className).not.toMatch(/transition-(?:opacity|\[)/);
  });

  it.each(["reduced", "none"] as const)("declares %s and settles the native release immediately", async (mode) => {
    renderInMode(mode);
    await open();

    const shell = popup();
    expectMotionContract(mode, { parts: [shell] });
    expect(shell).toHaveAttribute("data-motion", mode);
    expect(shell?.className).toContain("transition-none");
    expect(shell?.className).not.toContain("transition-[transform,translate]");

    const overlay = document.querySelector('[data-slot="drawer-overlay"]');
    expect(overlay).toHaveAttribute("data-motion", mode);
  });
});

/**
 * `drawer.popup.enter` and `drawer.popup.exit` are the edge flight `createModalPresence`
 * starts on the popup's own host, so no `transition-*` longhand can report them, and
 * jsdom has no animation engine at all. Two browser facts are therefore simulated:
 *
 * - `animate` is stubbed, exactly as the dialog suite does, so "the declared envelope
 *   started" is observable.
 * - `getComputedStyle` reports the family `drawerSwipeClasses(cm)` installs in `full`
 *   (`transition-[transform,translate] duration-slow`) and a resting `transform: none`.
 *   Vitest runs with `css: false`, so jsdom applies no class and would report an empty
 *   `transition-property` — the same reading that hid this defect, where the controller
 *   treated that family as caller paint and returned before writing anything.
 *
 * The rendered travel, the clock the matrix reads and the drag handoff stay in
 * `tests/e2e/motion-matrix.spec.ts`.
 */
type Paint = {
  slot: string | null;
  properties: string[];
  duration: number;
  from: string | undefined;
  to: string | undefined;
};

function simulateInstalledSwipeFamily() {
  const native = window.getComputedStyle.bind(window);
  const spy = vi.spyOn(window, "getComputedStyle").mockImplementation(((element: Element) => {
    const computed = native(element);
    const node = element as HTMLElement;
    if (!node.matches?.('[data-slot="drawer-popup"]')) return computed;
    // `drawerSwipeClasses` removes the family under reduced/none; mirror that so the
    // simulation never describes a surface the component did not produce.
    if (node.className.includes("transition-none")) return computed;
    return new Proxy(computed, {
      get(target, property, receiver) {
        if (property === "transitionProperty") return "transform, translate";
        if (property === "transitionDuration") return "0.32s, 0.32s";
        if (property === "transform") return node.style.transform || "none";
        return Reflect.get(target, property, receiver);
      },
    }) as CSSStyleDeclaration;
  }) as typeof window.getComputedStyle);
  return () => spy.mockRestore();
}

function recordPresence() {
  const calls: Paint[] = [];
  const cancelled = vi.fn();
  const animate = vi.fn(function record(this: Element, frames: Keyframe[], timing: KeyframeAnimationOptions) {
    calls.push({
      slot: this.getAttribute("data-slot"),
      properties: [...new Set(frames.flatMap((frame) => Object.keys(frame ?? {})))].sort(),
      duration: Number(timing.duration),
      from: (frames[0] as { transform?: string } | undefined)?.transform,
      to: (frames[frames.length - 1] as { transform?: string } | undefined)?.transform,
    });
    return {
      effect: { setKeyframes: () => {}, getKeyframes: () => frames },
      cancel: cancelled,
      playState: "running",
      // The envelope never resolves here: the assertion is that it started.
      finished: new Promise(() => {}),
    };
  });
  const previous = Element.prototype.animate;
  Element.prototype.animate = animate as unknown as typeof Element.prototype.animate;
  // The popup's own presence writers only; a measured height or a text run is another owner.
  const envelope = () =>
    calls
      .filter((call) => call.slot === "drawer-popup")
      .filter((call) => call.properties.some((property) => property === "opacity" || property === "transform"))
      .map((call) => `${call.properties.join("+")}@${call.duration}`)
      .sort();
  return {
    calls,
    cancelled,
    envelope,
    restore: () => {
      Element.prototype.animate = previous;
    },
  };
}

describe("Drawer popup entrance", () => {
  it.each(modes)("starts the declared envelope in %s", async (mode) => {
    const style = simulateInstalledSwipeFamily();
    const presence = recordPresence();
    try {
      renderInMode(mode);
      await open();
      expect(presence.envelope()).toEqual(
        { full: ["opacity@320", "transform@320"], reduced: ["opacity@192"], none: [] }[mode],
      );
      if (mode === "full") {
        const travel = presence.calls.find((call) => call.properties.includes("transform"));
        // The popup's own extent, from outside its edge to the resting placement.
        expect(travel?.from).toBe("translateY(100%)");
        expect(travel?.to).toBe("none");
      }
    } finally {
      presence.restore();
      style();
    }
  });

  it("yields transform to the primitive's swipe channel while a drag owns it", async () => {
    const style = simulateInstalledSwipeFamily();
    const presence = recordPresence();
    try {
      renderInMode("full");
      await open();
      expect(presence.envelope()).toEqual(["opacity@320", "transform@320"]);
      presence.calls.length = 0;
      const shell = popup() as HTMLElement;
      // Exactly what Base UI writes while the pointer holds the panel.
      shell.style.transform = "translateY(64px)";
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      // The envelope keeps the dragged property out of its lease and fades only.
      expect(presence.envelope()).toEqual(["opacity@220"]);
      expect(shell.style.transform).toBe("translateY(64px)");
    } finally {
      presence.restore();
      style();
    }
  });

  it("cancels a running envelope on a live downgrade to reduced", async () => {
    const style = simulateInstalledSwipeFamily();
    const presence = recordPresence();
    try {
      const view = renderInMode("full");
      await open();
      expect(presence.envelope()).toEqual(["opacity@320", "transform@320"]);
      presence.calls.length = 0;
      view.rerender(
        <CadenceProvider mode="reduced">
          <Example />
        </CadenceProvider>,
      );
      expect(popup()).toHaveAttribute("data-motion", "reduced");
      expect(presence.cancelled).toHaveBeenCalled();
      expect(presence.envelope()).toEqual([]);
    } finally {
      presence.restore();
      style();
    }
  });
});

type Frame = {
  open: boolean;
  title: string | number;
  description: string | number;
  body: string;
  overlay: boolean;
  foreground: boolean;
};

type OpenChange = NonNullable<React.ComponentProps<typeof Drawer>["onOpenChange"]>;

const initial = (): Frame => ({
  open: true,
  title: "Move conversation",
  description: "Drag down to dismiss.",
  body: "Short body.",
  overlay: false,
  foreground: false,
});

function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Drawer open={frame.open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent overlayStyle={frame.overlay ? { backgroundColor: "#101010" } : undefined}>
          <DrawerHeader>
            <DrawerTitle style={frame.foreground ? { color: "#123456" } : undefined}>{frame.title}</DrawerTitle>
            <DrawerDescription style={frame.foreground ? { color: "#654321" } : undefined}>
              {frame.description}
            </DrawerDescription>
          </DrawerHeader>
          <p>{frame.body}</p>
          <DrawerFooter>
            <DrawerClose render={<Button type="button" variant="outline" />}>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </CadenceProvider>
  );
}

describe("Drawer v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned drawer action in %s", async (mode) => {
    let frame = initial();
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (next, details) => {
      // Keep the closing surface so the owned exit runs before Base UI decides the
      // modal parts actually leave the DOM.
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
      const control = screen.getByRole("button", { name: "Cancel" });
      await userEvent.click(control);
    };

    view = render(scene());
    await screen.findByRole("dialog");

    await expectV2MotionAction("drawer", "drawer.title.change", mode, () => update({ title: "Saved conversation" }));
    await expectV2MotionAction("drawer", "drawer.description.change", mode, () =>
      update({ description: "Drag up to keep it." }),
    );
    // Establish the numeric display owner, then revise it against that same slot.
    update({ title: 7, description: 8 });
    await expectV2MotionAction("drawer", "drawer.quantity.change", mode, () => update({ title: 9, description: 11 }));
    await expectV2MotionAction("drawer", "drawer.overlay.colour", mode, () => update({ overlay: true }));
    await expectV2MotionAction("drawer", "drawer.foreground.colour", mode, () => update({ foreground: true }));
    await expectV2MotionAction("drawer", "drawer.popup.resize", mode, () =>
      update({ body: "A much longer body that represents a real committed content revision." }),
    );

    await expectV2MotionAction("drawer", "drawer.popup.exit", mode, close);
    await expectV2MotionAction("drawer", "drawer.popup.enter", mode, () => update({ open: true }));
    await expectV2MotionAction("drawer", "drawer.overlay.exit", mode, close);
    await expectV2MotionAction("drawer", "drawer.overlay.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // The base gesture engine, the settle boundaries and the static handle are not
    // local writers: the native swipe/snap owner keeps them.
    await expectV2NativeBoundaries("drawer", { container: document.body });
  });

  it("settles a live full to reduced to none downgrade on an open panel", async () => {
    const draw = (mode: Mode) => (
      <CadenceProvider mode={mode}>
        <Drawer open>
          <DrawerContent>
            <DrawerTitle>Downgrade</DrawerTitle>
            <DrawerDescription>Downgrade body</DrawerDescription>
          </DrawerContent>
        </Drawer>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const shell = popup() as HTMLElement;
    expect(shell).toHaveAttribute("data-motion", "full");
    view.rerender(draw("reduced"));
    expect(shell).toHaveAttribute("data-motion", "reduced");
    expect(shell.className).toContain("transition-none");
    view.rerender(draw("none"));
    expect(shell).toHaveAttribute("data-motion", "none");
    await waitFor(() =>
      expect(
        [...(shell.getAnimations?.() ?? [])].filter((animation) => animation.playState === "running"),
      ).toHaveLength(0),
    );
  });

  it("places a live direction change immediately instead of flying across the viewport", () => {
    const draw = (swipeDirection: NonNullable<React.ComponentProps<typeof Drawer>["swipeDirection"]>) => (
      <CadenceProvider mode="full">
        <Drawer open swipeDirection={swipeDirection}>
          <DrawerContent>
            <DrawerTitle>Edge</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </CadenceProvider>
    );
    const view = render(draw("down"));
    const shell = popup() as HTMLElement;
    expect(shell).toHaveAttribute("data-swipe-axis", "y");
    expect(shell.className).toContain("bottom-0");

    view.rerender(draw("right"));
    expect(shell).toHaveAttribute("data-swipe-axis", "x");
    expect(shell.className).toContain("right-0");
    expect(shell.className).not.toContain("bottom-0");
  });
});
