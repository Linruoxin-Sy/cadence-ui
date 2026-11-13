import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { act, useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { ToggleGroup, ToggleGroupItem } from "@/registry/cadence/toggle-group";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

describe("ToggleGroup v2 actions", () => {
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)(
    "executes content, layout, paint and native boundaries in %s",
    async (mode) => {
      const draw = (label: string | number, paint = false, multiple = false, selected = true) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <style>{`[data-slot=toggle-group-indicator], [data-slot=toggle-group-local-indicator] {background-color: ${paint ? "rgb(220, 220, 220)" : "rgb(255, 255, 255)"}}`}</style>
          <ToggleGroup
            value={selected ? ["a"] : []}
            multiple={multiple}
            style={{ backgroundColor: paint ? "#eee" : "#ddd" }}
          >
            <ToggleGroupItem value="a" style={{ color: paint ? "#222" : "#111" }}>
              {label}
            </ToggleGroupItem>
          </ToggleGroup>
        </CadenceProvider>
      );
      const view = render(draw("Status pending"));
      const native = screen.getByRole("button");
      const text = native.querySelector('[data-slot="toggle-group-text"]')?.firstChild;
      await expectV2MotionAction("toggle-group", "toggle-group.content.change", mode, () =>
        view.rerender(draw("Status ready")),
      );
      expect(native.querySelector('[data-slot="toggle-group-text"]')?.firstChild).toBe(text);
      await expectV2MotionAction("toggle-group", "toggle-group.root.resize", mode, () => view.rerender(draw("Ready")));
      await expectV2MotionAction("toggle-group", "toggle-group.items.reflow", mode, () =>
        view.rerender(draw("Ready for review")),
      );
      await expectV2MotionAction("toggle-group", "toggle-group.item.colour", mode, () =>
        view.rerender(draw("Ready for review", true)),
      );
      await expectV2MotionAction("toggle-group", "toggle-group.root.colour", mode, () =>
        view.rerender(draw("Ready for review", false)),
      );
      await expectV2MotionAction("toggle-group", "toggle-group.indicator.colour", mode, () =>
        view.rerender(draw("Ready for review", true)),
      );
      view.rerender(draw(19));
      await expectV2MotionAction("toggle-group", "toggle-group.content.change", mode, () => view.rerender(draw(20)));
      expect(native).toHaveAccessibleName("20");
      view.rerender(draw("Multiple", false, true));
      await expectV2MotionAction("toggle-group", "toggle-group.local.colour", mode, () =>
        view.rerender(draw("Multiple", true, true)),
      );
      await expectV2MotionAction("toggle-group", "toggle-group.local.select", mode, () =>
        view.rerender(draw("Multiple", true, true, false)),
      );
      expectMotionContract(mode, { policy: ["color"] });
      view.rerender(
        <CadenceProvider mode={mode}>
          <ToggleGroup>
            <ToggleGroupItem value="rich">
              <strong>Rich option</strong>
            </ToggleGroupItem>
          </ToggleGroup>
        </CadenceProvider>,
      );
      await expectV2NativeBoundaries("toggle-group", { container: view.container });
    },
  );
  it.each(["full", "reduced", "none"] as const)(
    "executes one root entrance and stable native press in %s",
    async (mode) => {
      const draw = (present: boolean) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <PresenceContext.Provider
            value={{
              id: "group-appearance",
              isPresent: present,
              initial: false,
              register: () => () => {},
              onExitComplete: () => {},
            }}
          >
            <ToggleGroup>{present && <ToggleGroupItem value="a">Hold</ToggleGroupItem>}</ToggleGroup>
          </PresenceContext.Provider>
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionAction("toggle-group", "toggle-group.root.enter", mode, () => view.rerender(draw(true)));
      const button = screen.getByRole("button");
      await expectV2MotionAction("toggle-group", "toggle-group.feedback.press", mode, () =>
        act(() => {
          fireEvent.pointerDown(button.querySelector('[data-slot="toggle-group-content"]') ?? button, {
            button: 0,
            pointerId: 1,
            isPrimary: true,
          });
        }),
      );
      fireEvent.pointerCancel(button, { pointerId: 1 });
      expect(button.style.transform).toBe("");
      expectMotionContract(mode);
    },
  );
  it.each(["full", "reduced", "none"] as const)("executes the same committed selection owner in %s", async (mode) => {
    // jsdom supplies explicit native endpoints; the copied-browser fixture proves real intermediate geometry.
    const computed = window.getComputedStyle.bind(window);
    const css = vi.spyOn(window, "getComputedStyle").mockImplementation(
      (node) =>
        new Proxy(computed(node), {
          get(target, key) {
            const value = Reflect.get(target, key);
            if (
              ["transform", "translate", "rotate", "scale", "perspective", "offsetPath"].includes(String(key)) &&
              !value
            )
              return "none";
            if (key === "position" && !value) return "relative";
            if (key === "zoom" && !value) return "1";
            if (/^border.*Width$/.test(String(key)) && !value) return "0px";
            return typeof value === "function" ? value.bind(target) : value;
          },
        }),
    );
    const width = vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(200);
    const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(32);
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const x = this.textContent === "Beta" ? 100 : 0;
      return { x, y: 0, left: x, top: 0, right: x + 200, bottom: 32, width: 200, height: 32, toJSON() {} };
    });
    const rects = vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (this: HTMLElement) {
      return [this.getBoundingClientRect()] as unknown as DOMRectList;
    });
    const draw = (value: string[]) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <ToggleGroup value={value}>
          <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
          <ToggleGroupItem value="b">Beta</ToggleGroupItem>
        </ToggleGroup>
      </CadenceProvider>
    );
    const view = render(draw(["a"]));
    const marker = view.container.querySelector('[data-slot="toggle-group-indicator"]');
    await expectV2MotionAction("toggle-group", "toggle-group.indicator.select", mode, () => view.rerender(draw(["b"])));
    view.rerender(draw([]));
    expect(marker).toHaveAttribute("hidden");
    view.rerender(draw(["a"]));
    expect(view.container.querySelector('[data-slot="toggle-group-indicator"]')).toBe(marker);
    expectMotionContract(mode);
    view.unmount();
    for (const spy of [css, width, height, rect, rects]) spy.mockRestore();
  });
});

describe("ToggleGroup", () => {
  it("preserves render state, native events and React cleanup refs across modes", () => {
    const clean = vi.fn(),
      ref = vi.fn(() => clean),
      groupRef = vi.fn(),
      animation = vi.fn(),
      drag = vi.fn();
    const draw = (mode: "full" | "reduced" | "none") => (
      <CadenceProvider mode={mode}>
        <ToggleGroup
          ref={groupRef}
          value={["a"]}
          render={<section aria-label="Native section" />}
          className={(state) => (state.multiple ? "multi" : "single")}
        >
          <ToggleGroupItem
            ref={ref}
            value="a"
            render={(props, state) => <button {...props} type="button" data-custom-pressed={state.pressed} />}
            onAnimationStart={animation}
            onDragStart={drag}
          >
            <strong>Rich label</strong>
          </ToggleGroupItem>
        </ToggleGroup>
      </CadenceProvider>
    );
    const view = render(draw("full")),
      button = screen.getByRole("button"),
      strong = button.querySelector("strong");
    fireEvent.animationStart(button);
    fireEvent.dragStart(button);
    expect(animation).toHaveBeenCalledTimes(1);
    expect(drag).toHaveBeenCalledTimes(1);
    for (const mode of ["reduced", "none", "full"] as const) {
      view.rerender(draw(mode));
      expect(screen.getByRole("button")).toBe(button);
      expect(button.querySelector("strong")).toBe(strong);
      expect(button).toHaveAttribute("data-custom-pressed", "true");
      expect(button.querySelector('[data-slot="toggle-group-content"]')).toBeNull();
    }
    expect(groupRef).toHaveBeenCalledWith(screen.getByRole("group"));
    expect(ref).toHaveBeenCalledWith(button);
    view.unmount();
    expect(clean).toHaveBeenCalledTimes(1);
  });
  it("does not apply a held activation to a replacement item identity", () => {
    const draw = (value: string) => (
      <ToggleGroup>
        <ToggleGroupItem value={value}>Same native target</ToggleGroupItem>
      </ToggleGroup>
    );
    const view = render(draw("old")),
      button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: " " });
    view.rerender(draw("new"));
    fireEvent.keyUp(button, { key: " " });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(button, { key: " " });
    fireEvent.keyUp(button, { key: " " });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
  it("retains native button, content host and Text when disabling a held item", () => {
    const change = vi.fn();
    const draw = (disabled: boolean) => (
      <ToggleGroup onValueChange={change}>
        <ToggleGroupItem value="a" disabled={disabled}>
          Same label
        </ToggleGroupItem>
      </ToggleGroup>
    );
    const view = render(draw(false));
    const button = screen.getByRole("button");
    const host = button.querySelector('[data-slot="toggle-group-text"]');
    const text = host?.firstChild;
    fireEvent.keyDown(button, { key: " " });
    const accepted = button.getAttribute("aria-pressed") ?? "false";
    change.mockClear();
    view.rerender(draw(true));
    expect(button).toBeDisabled();
    expect(button.querySelector('[data-slot="toggle-group-text"]')).toBe(host);
    expect(host?.firstChild).toBe(text);
    view.rerender(draw(false));
    expect(screen.getByRole("button")).toBe(button);
    expect(host?.firstChild).toBe(text);
    fireEvent.keyUp(button, { key: " " });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", accepted);
    expect(change).not.toHaveBeenCalled();
  });
  it("renders the group and item slots with the shared variant", () => {
    const { container } = render(
      <ToggleGroup variant="outline" defaultValue={["center"]} aria-label="Align">
        <ToggleGroupItem value="left" aria-label="Left" />
        <ToggleGroupItem value="center" aria-label="Center" />
      </ToggleGroup>,
    );

    const group = container.querySelector('[data-slot="toggle-group"]') as HTMLElement;
    const items = container.querySelectorAll('[data-slot="toggle-group-item"]');

    expect(group).toHaveAttribute("data-variant", "outline");
    expect(group).toHaveAttribute("data-spacing", "0");
    expect(items).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps a single item pressed unless multiple is set", async () => {
    render(
      <ToggleGroup defaultValue={["left"]} aria-label="Align">
        <ToggleGroupItem value="left" aria-label="Left" />
        <ToggleGroupItem value="center" aria-label="Center" />
      </ToggleGroup>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Center" }));

    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "false");
  });

  it("allows more than one pressed item when multiple is set", async () => {
    render(
      <ToggleGroup multiple aria-label="Style">
        <ToggleGroupItem value="bold" aria-label="Bold" />
        <ToggleGroupItem value="italic" aria-label="Italic" />
      </ToggleGroup>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Bold" }));
    await userEvent.click(screen.getByRole("button", { name: "Italic" }));

    expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "true");
  });

  it("marks every item with the motion mode", () => {
    const { container } = render(
      <CadenceProvider mode="none">
        <ToggleGroup aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left" />
        </ToggleGroup>
      </CadenceProvider>,
    );

    expect(container.querySelector('[data-slot="toggle-group-item"]')).toHaveAttribute("data-motion", "none");
  });
});

describe("ToggleGroup orientation", () => {
  it("lays a vertical group out as a column", () => {
    const { container } = render(
      <ToggleGroup orientation="vertical" variant="outline" multiple aria-label="Zoom">
        <ToggleGroupItem value="in" aria-label="Zoom in" />
        <ToggleGroupItem value="out" aria-label="Zoom out" />
      </ToggleGroup>,
    );

    // Base UI writes `data-orientation`; the layout follows it in JS, because a
    // `data-vertical:` utility compiles to `[data-vertical]` — an attribute nothing
    // sets — and the group would silently stay a row.
    const group = container.querySelector('[data-slot="toggle-group"]');
    const item = container.querySelector('[data-slot="toggle-group-item"]');

    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group?.className).toContain("flex-col");
    expect(item?.className).toContain("rounded-b-none");
    expect(item?.className).not.toContain("rounded-e-none");
  });
});

it.each(["full", "reduced", "none"] as const)("exercises single and multiple fills in %s", async (mode) => {
  const { container } = render(
    <CadenceProvider mode={mode} timeScale={0}>
      <ToggleGroup variant="segmented" defaultValue={["day"]} aria-label="Range">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup multiple aria-label="Marks">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    </CadenceProvider>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Month" }));
  await userEvent.click(screen.getByRole("button", { name: "Bold" }));
  await userEvent.click(screen.getByRole("button", { name: "Italic" }));
  await userEvent.click(screen.getByRole("button", { name: "Bold" }));
  const range = screen.getByRole("group", { name: "Range" });
  expect(range).toHaveAttribute("data-variant", "segmented");
  expect(
    within(range).getByRole("button", { name: "Day" }).querySelector("[data-slot=toggle-group-indicator]"),
  ).toBeNull();
  expect(screen.getByRole("button", { name: "Month" })).toHaveAttribute("aria-pressed", "true");
  expect(container.querySelectorAll("[data-slot=toggle-group-local-indicator]")).toHaveLength(2);
  expect(range.querySelector("[data-slot=toggle-group-indicator]")).toHaveAttribute("hidden");
  expect(
    screen.getByRole("button", { name: "Month" }).querySelector("[data-slot=toggle-group-fallback]"),
  ).toBeInTheDocument();

  for (const fill of container.querySelectorAll("[data-slot=toggle-group-indicator]")) {
    expect(fill).toHaveAttribute("aria-hidden", "true");
  }
  expectMotionContract(mode, {
    policy: ["color"],
    forms: ["text.change/changed-runs", "layout.shared/selection", "geometry.resize/measured"],
  });
});

it.each(["default", "outline", "segmented"] as const)(
  "keeps keyboard selection, clearing and disabled items in %s",
  async (variant) => {
    const user = userEvent.setup();
    render(
      <ToggleGroup variant={variant} defaultValue={["a"]} aria-label="Choices">
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b" disabled>
          Blocked
        </ToggleGroupItem>
        <ToggleGroupItem value="c">Charlie</ToggleGroupItem>
      </ToggleGroup>,
    );
    const a = screen.getByRole("button", { name: "Alpha" });
    const c = screen.getByRole("button", { name: "Charlie" });
    await user.tab();
    expect(a).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(c).toHaveFocus();
    expect(a).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(c).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Enter}");
    expect(c).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("group").querySelector("[data-slot=toggle-group-fallback]")).toBeNull();
    expect(screen.getByRole("group").querySelector("[data-slot=toggle-group-indicator]")).toHaveAttribute("hidden");
    await user.keyboard("{Home}{Enter}");
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute("aria-pressed", "true");
  },
);

function ControlledExample({ change }: { change: (next: string[]) => void }) {
  const [value, setValue] = useState(["a"]);
  return (
    <>
      <button type="button" onClick={() => setValue(["b"])}>
        External
      </button>
      <ToggleGroup
        value={value}
        onValueChange={(next, details) => {
          change(next);
          details.cancel();
        }}
        variant="segmented"
      >
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
        <ToggleGroupItem value="b">Beta</ToggleGroupItem>
      </ToggleGroup>
    </>
  );
}

it("keeps controlled fills on the committed value and respects cancellation", () => {
  const change = vi.fn();
  render(<ControlledExample change={change} />);
  fireEvent.click(screen.getByRole("button", { name: "Beta" }));
  expect(change).toHaveBeenCalledWith(["b"]);
  expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "External" }));
  expect(screen.getByRole("button", { name: "Beta" })).toHaveAttribute("aria-pressed", "true");
});

it("preserves the focused button and selected fill through a live motion downgrade", () => {
  const view = (mode: "full" | "reduced" | "none") => (
    <CadenceProvider mode={mode} timeScale={0}>
      <ToggleGroup variant="segmented" defaultValue={["a"]}>
        <ToggleGroupItem value="a">Alpha</ToggleGroupItem>
      </ToggleGroup>
    </CadenceProvider>
  );
  const { rerender } = render(view("full"));
  const button = screen.getByRole("button", { name: "Alpha" });
  button.focus();
  for (const mode of ["reduced", "none", "full"] as const) {
    rerender(view(mode));
    expect(screen.getByRole("button", { name: "Alpha" })).toBe(button);
    expect(button).toHaveFocus();
    expect(screen.getByRole("group").querySelector("[data-slot=toggle-group-indicator]")).toHaveAttribute(
      "data-motion",
      mode,
    );
  }
});
