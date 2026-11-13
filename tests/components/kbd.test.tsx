import { fireEvent, render, screen } from "@testing-library/react";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Kbd, KbdGroup } from "@/registry/cadence/kbd";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("Kbd", () => {
  it("renders a real kbd element with its slot", () => {
    render(<Kbd>Esc</Kbd>);
    const key = screen.getByText("Esc").closest("kbd") as HTMLElement;
    expect(key.tagName).toBe("KBD");
    expect(key).toHaveAttribute("data-slot", "kbd");
  });

  it("groups several keys", () => {
    render(
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );

    const group = screen.getByText("⌘").closest('[data-slot="kbd-group"]');
    expect(group).toHaveAttribute("data-slot", "kbd-group");
    expect(group?.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
  });

  it("stays out of the tab order and has no control role", () => {
    render(<Kbd>Esc</Kbd>);
    const key = screen.getByText("Esc");
    expect(key).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Kbd v2 actions", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("owns changed labels, sizes, reflow and paint in %s", async (mode) => {
    const draw = (label: string | number, paint = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <KbdGroup>
          <Kbd key="modifier" style={{ backgroundColor: paint ? "#eee" : "#ddd", color: paint ? "#222" : "#111" }}>
            {label}
          </Kbd>
        </KbdGroup>
      </CadenceProvider>
    );
    const view = render(draw("Command"));
    const key = view.container.querySelector('[data-slot="kbd"]');
    const text = key?.querySelector('[data-slot="kbd-text"]')?.firstChild;
    await expectV2MotionAction("kbd", "kbd.label.replace", mode, () => view.rerender(draw("Control")));
    expect(key?.querySelector('[data-slot="kbd-text"]')?.firstChild).toBe(text);
    await expectV2MotionAction("kbd", "kbd.key.resize", mode, () => view.rerender(draw("Alt")));
    await expectV2MotionAction("kbd", "kbd.items.move", mode, () => view.rerender(draw("Shift")));
    await expectV2MotionAction("kbd", "kbd.group.resize", mode, () => view.rerender(draw("Option")));
    await expectV2MotionAction("kbd", "kbd.key.colour", mode, () => view.rerender(draw("Option", true)));
    view.rerender(draw(9));
    await expectV2MotionAction("kbd", "kbd.label.replace", mode, () => view.rerender(draw(10)));
    expect(key).toHaveTextContent("10");
    expect(key).not.toHaveAttribute("role");
    fireEvent.keyDown(document, { key: "Shift" });
    expect(key).not.toHaveAttribute("data-pressed");
    expectMotionContract(mode, { policy: ["color"] });
    view.rerender(
      <CadenceProvider mode={mode}>
        <KbdGroup>
          <Kbd>
            <strong>Rich name</strong>
          </Kbd>
        </KbdGroup>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("kbd", { container: view.container });
  });
  it.each(["full", "reduced", "none"] as const)(
    "executes independent/consumed entrance and retained exit in %s",
    async (mode) => {
      const draw = (present: boolean, grouped = false) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <PresenceContext.Provider
            value={{
              id: "kbd-presence",
              initial: false,
              isPresent: present,
              register: () => () => {},
              onExitComplete: () => {},
            }}
          >
            {grouped ? <KbdGroup /> : <Kbd>Esc</Kbd>}
          </PresenceContext.Provider>
        </CadenceProvider>
      );
      const view = render(draw(false, true));
      await expectV2MotionAction("kbd", "kbd.root.enter", mode, () => view.rerender(draw(true, true)));
      view.rerender(draw(false));
      await expectV2MotionAction("kbd", "kbd.key.enter", mode, () => view.rerender(draw(true)));
      await expectV2MotionAction("kbd", "kbd.key.exit", mode, () => view.rerender(draw(false)));
      expectMotionContract(mode);
    },
  );
  it("retains caller refs, native events and unchanged key identity across revisions", async () => {
    const cleanup = vi.fn(),
      caller = vi.fn(() => cleanup),
      click = vi.fn();
    const draw = (more: boolean) => (
      <KbdGroup>
        <Kbd key="a" ref={caller} onClick={click}>
          Ctrl
        </Kbd>
        {more && <Kbd key="b">Shift</Kbd>}
        <Kbd key="c">K</Kbd>
      </KbdGroup>
    );
    const view = render(draw(false));
    const key = screen.getByText("Ctrl").closest("kbd");
    view.rerender(draw(true));
    expect(screen.getByText("Ctrl").closest("kbd")).toBe(key);
    fireEvent.click(key as HTMLElement);
    expect(click).toHaveBeenCalledOnce();
    expect(caller).toHaveBeenCalledOnce();
    view.unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
