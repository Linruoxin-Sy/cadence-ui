import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Button } from "@/registry/cadence/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/cadence/button-group";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("ButtonGroup", () => {
  it("is a group with an orientation", () => {
    render(
      <ButtonGroup aria-label="Text style">
        <Button variant="outline">Bold</Button>
        <Button variant="outline">Italic</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group", { name: "Text style" });
    expect(group).toHaveAttribute("data-slot", "button-group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group.className).toContain("items-stretch");
  });

  it("stacks vertically when asked", () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Up</Button>
      </ButtonGroup>,
    );

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group.className).toContain("flex-col");
  });

  it("renders static text in the group", () => {
    render(
      <ButtonGroup>
        <ButtonGroupText data-testid="text">12 selected</ButtonGroupText>
        <Button>Archive</Button>
      </ButtonGroup>,
    );

    expect(screen.getByTestId("text")).toHaveAttribute("data-slot", "button-group-text");
    expect(screen.getByTestId("text").tagName).toBe("DIV");
  });

  it("swaps the text element through render", () => {
    render(<ButtonGroupText render={<a href="#mode" />}>Mode</ButtonGroupText>);
    const host = screen.getByText("Mode").closest("a");
    expect(host?.tagName).toBe("A");
    expect(host).toHaveAttribute("href", "#mode");
  });

  it("separates controls without taking up a row", () => {
    render(
      <ButtonGroup>
        <Button>Cut</Button>
        <ButtonGroupSeparator />
        <Button>Copy</Button>
      </ButtonGroup>,
    );

    const separator = document.querySelector('[data-slot="button-group-separator"]');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute("data-orientation", "vertical");
    expect(separator?.className).toContain("self-stretch");
  });
});

describe("Button Group v2", () => {
  beforeAll(() => prepareV2MotionPlan());
  it("keeps native controls across plain/rich revisions and never retains unknown caller controls", () => {
    const cleanup = vi.fn(),
      ref = vi.fn(() => cleanup);
    const draw = (kind: "plain" | "rich" | "removed") => (
      <ButtonGroup>
        {kind !== "removed" && (
          <Button key="action" ref={ref}>
            {kind === "plain" ? "Save" : <strong>Save rich</strong>}
          </Button>
        )}
      </ButtonGroup>
    );
    const view = render(draw("plain")),
      host = screen.getByRole("button");
    view.rerender(draw("rich"));
    expect(screen.getByRole("button")).toBe(host);
    view.rerender(draw("plain"));
    expect(screen.getByRole("button")).toBe(host);
    expect(ref).toHaveBeenCalledOnce();
    view.rerender(draw("removed"));
    expect(cleanup).toHaveBeenCalledOnce();
    const richRef = vi.fn(() => cleanup);
    view.rerender(
      <ButtonGroup>
        <Button key="rich" ref={richRef}>
          <strong>Caller content</strong>
        </Button>
      </ButtonGroup>,
    );
    const rich = screen.getByRole("button");
    view.rerender(<ButtonGroup />);
    expect(rich.isConnected).toBe(false);
    expect(cleanup).toHaveBeenCalledTimes(2);
  });
  it.each(["full", "reduced", "none"] as const)(
    "executes the group and exact primitive readout owners in %s",
    async (mode) => {
      const draw = (value: string | number, hidden = false, colour = false) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <ButtonGroup aria-label="Readout">
            <ButtonGroupText
              key="readout"
              hidden={hidden}
              style={{ backgroundColor: colour ? "#eee" : "#ddd", color: colour ? "#222" : "#111" }}
            >
              {value}
            </ButtonGroupText>
          </ButtonGroup>
        </CadenceProvider>
      );
      const view = render(draw("Read count", true));
      await expectV2MotionAction("button-group", "button-group.segment.enter", mode, () =>
        view.rerender(draw("Read count")),
      );
      const host = view.container.querySelector('[data-slot="button-group-text"]');
      const text = host?.querySelector('[data-slot="button-group-label"]')?.firstChild;
      await expectV2MotionAction("button-group", "button-group.label.replace", mode, () =>
        view.rerender(draw("Read total count")),
      );
      expect(host?.querySelector('[data-slot="button-group-label"]')?.firstChild).toBe(text);
      await expectV2MotionAction("button-group", "button-group.root.resize", mode, () => view.rerender(draw("Total")), {
        container: view.container,
        properties: ["width"],
      });
      const drawVertical = (extra: boolean) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <ButtonGroup orientation="vertical">
            <ButtonGroupText key="first">First row</ButtonGroupText>
            {extra && <ButtonGroupText key="second">Second row</ButtonGroupText>}
          </ButtonGroup>
        </CadenceProvider>
      );
      const vertical = render(drawVertical(false));
      await expectV2MotionAction(
        "button-group",
        "button-group.root.resize",
        mode,
        () => vertical.rerender(drawVertical(true)),
        { container: vertical.container, properties: ["height"] },
      );
      vertical.unmount();
      await expectV2MotionAction("button-group", "button-group.segment.move", mode, () =>
        view.rerender(draw("Complete total")),
      );
      await expectV2MotionAction("button-group", "button-group.text.colour", mode, () =>
        view.rerender(draw("Complete total", false, true)),
      );
      view.rerender(draw(99));
      const number = host?.querySelector('[data-slot="button-group-number"]')?.firstChild;
      await expectV2MotionAction("button-group", "button-group.quantity.roll", mode, () => view.rerender(draw(100)));
      expect(host?.querySelector('[data-slot="button-group-number"]')?.firstChild).toBe(number);
      await expectV2MotionAction("button-group", "button-group.segment.exit", mode, () =>
        view.rerender(draw(100, true)),
      );
      expectMotionContract(mode, { policy: ["color"] });
      view.rerender(
        <CadenceProvider mode={mode}>
          <ButtonGroup>
            <ButtonGroupText>
              <strong>Rich content</strong>
            </ButtonGroupText>
          </ButtonGroup>
        </CadenceProvider>,
      );
      await expectV2NativeBoundaries("button-group", { container: view.container });
    },
  );
  it.each(["full", "reduced", "none"] as const)(
    "executes independent group and inherited rule lifecycles in %s",
    async (mode) => {
      const draw = (
        present: boolean,
        rule = false,
        orientation: "horizontal" | "vertical" = "horizontal",
        length = 80,
        colour = false,
      ) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <PresenceContext.Provider
            value={{
              id: "retained",
              initial: false,
              isPresent: present,
              register: () => () => {},
              onExitComplete: () => {},
            }}
          >
            {rule ? (
              <ButtonGroupSeparator
                orientation={orientation}
                style={{
                  [orientation === "horizontal" ? "width" : "height"]: length,
                  backgroundColor: colour ? "#777" : "#555",
                }}
              />
            ) : (
              <ButtonGroup />
            )}
          </PresenceContext.Provider>
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionAction("button-group", "button-group.root.enter", mode, () => view.rerender(draw(true)));
      view.rerender(draw(false, true));
      await expectV2MotionAction("button-group", "button-group.rule.enter", mode, () =>
        view.rerender(draw(true, true)),
      );
      await expectV2MotionAction("button-group", "button-group.rule.resize", mode, () =>
        view.rerender(draw(true, true, "horizontal", 160)),
      );
      await expectV2MotionAction("button-group", "button-group.rule.replace", mode, () =>
        view.rerender(draw(true, true, "vertical", 160)),
      );
      await expectV2MotionAction("button-group", "button-group.separator.colour", mode, () =>
        view.rerender(draw(true, true, "vertical", 160, true)),
      );
      await expectV2MotionAction("button-group", "button-group.rule.exit", mode, () =>
        view.rerender(draw(false, true, "vertical", 160, true)),
      );
      expectMotionContract(mode, { policy: ["color"] });
    },
  );
  it("preserves native host, key identity, input selection, ref cleanup and immediate removal", async () => {
    const cleanup = vi.fn(),
      ref = vi.fn(() => cleanup),
      action = vi.fn();
    const draw = (order: string[], label = "Keep") => (
      <ButtonGroup aria-label="Actions">
        {order.map((key) =>
          key === "editor" ? (
            <input key={key} aria-label="Draft" defaultValue="draft value" />
          ) : (
            <Button key={key} ref={key === "keep" ? ref : undefined} onClick={action}>
              {key === "keep" ? label : key}
            </Button>
          ),
        )}
      </ButtonGroup>
    );
    const view = render(draw(["keep", "editor", "extra"]));
    const keep = screen.getByRole("button", { name: "Keep" });
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await userEvent.click(input);
    input.setSelectionRange(2, 5);
    fireEvent.compositionStart(input);
    view.rerender(draw(["extra", "editor", "keep"], "Kept"));
    expect(screen.getByRole("button", { name: "Kept" })).toBe(keep);
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(2);
    expect(input.selectionEnd).toBe(5);
    fireEvent.compositionEnd(input);
    fireEvent.click(keep);
    expect(action).toHaveBeenCalledOnce();
    expect(ref).toHaveBeenCalledOnce();
    view.rerender(draw(["editor"]));
    expect(cleanup).toHaveBeenCalledOnce();
    expect(keep.isConnected).toBe(false);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await userEvent.tab();
    expect(input.value).toBe("draft value");
  });
});
