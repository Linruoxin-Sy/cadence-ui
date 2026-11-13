import { DirectionProvider } from "@base-ui/react/direction-provider";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from "@/registry/cadence/tabs";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function Example({
  orientation = "horizontal",
  auto = false,
}: {
  orientation?: "horizontal" | "vertical";
  auto?: boolean;
}) {
  return (
    <Tabs defaultValue="a" orientation={orientation}>
      <TabsList aria-label="Views" activateOnFocus={auto}>
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b" disabled>
          Blocked
        </TabsTrigger>
        <TabsTrigger value="c">Charlie</TabsTrigger>
      </TabsList>
      <TabsContent value="a" keepMounted>
        <input aria-label="Draft" defaultValue="saved" />
      </TabsContent>
      <TabsContent value="c">Third view</TabsContent>
    </Tabs>
  );
}

function Controlled({ change }: { change: (value: unknown) => void }) {
  const [v, setV] = useState<string | null>("a");
  return (
    <>
      <button type="button" onClick={() => setV(null)}>
        Clear
      </button>
      <button type="button" onClick={() => setV("c")}>
        External
      </button>
      <Tabs
        value={v}
        onValueChange={(next, details) => {
          change(next);
          details.cancel();
        }}
      >
        <TabsList>
          <TabsTrigger value="a">Alpha</TabsTrigger>
          <TabsTrigger value="c">Charlie</TabsTrigger>
        </TabsList>
        <TabsContent value="a">First</TabsContent>
        <TabsContent value="c">Third</TabsContent>
      </Tabs>
    </>
  );
}

describe("Tabs", () => {
  beforeAll(() => prepareV2MotionPlan()); // Cold full-library source/installation audit.
  it("preserves arbitrary tab value identity without serializing application objects", () => {
    const first: { self?: unknown } = {};
    first.self = first;
    const second = Symbol("second"),
      change = vi.fn();
    render(
      <Tabs defaultValue={first} onValueChange={change}>
        <TabsList>
          <TabsTrigger value={first}>Object</TabsTrigger>
          <TabsTrigger value={second}>Symbol</TabsTrigger>
        </TabsList>
        <TabsContent value={first}>Object panel</TabsContent>
        <TabsContent value={second}>Symbol panel</TabsContent>
      </Tabs>,
    );
    expect(screen.getByRole("tab", { name: "Object" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Symbol" }));
    expect(change).toHaveBeenCalledWith(second, expect.any(Object));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Symbol panel");
  });
  it.each(["full", "reduced", "none"] as const)(
    "executes every direct owner and preserves native boundaries in %s",
    async (mode) => {
      const draw = (value: string | number, paint = false, selected: string | null = "a") => (
        <CadenceProvider mode={mode} timeScale={0}>
          <style>{`[data-slot=tabs-indicator] {background-color: ${paint ? "rgb(220, 220, 220)" : "rgb(255, 255, 255)"}}`}</style>
          <Tabs value={selected}>
            <TabsList aria-label="Direct" style={{ backgroundColor: paint ? "#eee" : "#ddd" }}>
              <TabsTrigger value="a" style={{ color: paint ? "#222" : "#111" }}>
                {value}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="a" keepMounted>
              {value}
            </TabsContent>
          </Tabs>
        </CadenceProvider>
      );
      const view = render(draw("Status pending"));
      const texts = Array.from(view.container.querySelectorAll('[data-slot="tabs-text"]')).map(
        (node) => node.firstChild,
      );
      await expectV2MotionAction("tabs", "tabs.label.replace", mode, () => view.rerender(draw("Status ready")));
      expect(
        Array.from(view.container.querySelectorAll('[data-slot="tabs-text"]')).map((node) => node.firstChild),
      ).toEqual(texts);
      await expectV2MotionAction("tabs", "tabs.panel.resize", mode, () => view.rerender(draw("Ready")));
      await expectV2MotionAction("tabs", "tabs.list.resize", mode, () => view.rerender(draw("Ready for review")));
      await expectV2MotionAction("tabs", "tabs.items.reflow", mode, () => view.rerender(draw("Ready now")));
      await expectV2MotionAction("tabs", "tabs.trigger.colour", mode, () => view.rerender(draw("Ready now", true)));
      await expectV2MotionAction("tabs", "tabs.list.colour", mode, () => view.rerender(draw("Ready now", false)));
      await expectV2MotionAction("tabs", "tabs.indicator.colour", mode, () => view.rerender(draw("Ready now", true)));
      view.rerender(draw(19));
      const quantities = Array.from(view.container.querySelectorAll('[data-slot="tabs-number"]')).map(
        (node) => node.firstChild,
      );
      await expectV2MotionAction("tabs", "tabs.value.change", mode, () => view.rerender(draw(20)));
      expect(
        Array.from(view.container.querySelectorAll('[data-slot="tabs-number"]')).map((node) => node.firstChild),
      ).toEqual(quantities);
      expect(
        Array.from(view.container.querySelectorAll('[data-slot="tabs-number"]')).map((node) => node.textContent),
      ).toEqual(["20", "20"]);
      view.rerender(draw("Ready", false, null));
      await expectV2MotionAction("tabs", "tabs.panel.change", mode, () => view.rerender(draw("Ready")));
      expectMotionContract(mode, { policy: ["color"] });
      view.rerender(
        <CadenceProvider mode={mode}>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">
                <strong>Rich label</strong>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="a">
              <input name="memo" defaultValue="draft" />
            </TabsContent>
          </Tabs>
        </CadenceProvider>,
      );
      await expectV2NativeBoundaries("tabs", { container: view.container });
    },
  );
  it.each(["full", "reduced", "none"] as const)("executes retained selection in %s", async (mode) => {
    // jsdom has no layout. Supply explicit native endpoints; browser fixtures
    // independently verify real CSS coordinates, intermediate paint and cancellation.
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
      const x = this.textContent === "Charlie" ? 100 : 0;
      return { x, y: 0, left: x, top: 0, right: x + 200, bottom: 32, width: 200, height: 32, toJSON() {} };
    });
    const rects = vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(function (this: HTMLElement) {
      return [this.getBoundingClientRect()] as unknown as DOMRectList;
    });
    const draw = (value: string | null) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Tabs value={value}>
          <TabsList variant="line">
            <TabsTrigger value="a">Alpha</TabsTrigger>
            <TabsTrigger value="c">Charlie</TabsTrigger>
          </TabsList>
          <TabsContent value="a" keepMounted>
            First
          </TabsContent>
          <TabsContent value="c" keepMounted>
            Third
          </TabsContent>
        </Tabs>
      </CadenceProvider>
    );
    const view = render(draw("a"));
    const marker = view.container.querySelector('[data-slot="tabs-indicator"]');
    await expectV2MotionAction("tabs", "tabs.indicator.select", mode, () => view.rerender(draw("c")));
    view.rerender(draw(null));
    view.rerender(draw("a"));
    expect(view.container.querySelector('[data-slot="tabs-indicator"]')).toBe(marker);
    expectMotionContract(mode);
    view.unmount();
    for (const spy of [css, width, height, rect, rects]) spy.mockRestore();
  });
  it("preserves slots, variants and state callbacks with render/ref on every part", async () => {
    const refs = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    const { container } = render(
      <Tabs
        defaultValue="a"
        ref={refs[0]}
        render={<main />}
        className={(s) => (s.orientation === "horizontal" ? "root-state" : "vertical")}
      >
        <TabsList
          ref={refs[1]}
          render={<nav />}
          variant="line"
          aria-label="Custom views"
          className={(s) => (s.orientation === "horizontal" ? "list-state" : "vertical")}
        >
          <TabsTrigger
            ref={refs[2]}
            value="a"
            render={(props, state) => <button {...props} type="button" data-custom={state.active} />}
            className={(s) => (s.active ? "active-state" : "inactive-state")}
            style={(s) => ({ opacity: s.active ? 1 : 0.5 })}
          >
            Custom
          </TabsTrigger>
        </TabsList>
        <TabsContent
          ref={refs[3]}
          value="a"
          render={<section />}
          className={(s) => (s.hidden ? "hidden-state" : "shown-state")}
        >
          Panel
        </TabsContent>
      </Tabs>,
    );
    ["tabs", "tabs-list", "tabs-trigger", "tabs-content"].forEach((slot, i) => {
      expect(refs[i]).toHaveBeenCalledWith(container.querySelector(`[data-slot="${slot}"]`));
    });
    expect(screen.getByRole("tab")).toHaveAttribute("data-custom", "true");
    expect(screen.getByRole("tab")).toHaveClass("active-state");
    expect(screen.getByRole("tabpanel").tagName).toBe("SECTION");
    expect(container.querySelector('[data-slot="tabs-indicator"]')).toHaveAttribute("aria-hidden", "true");
    expect(tabsListVariants()).toContain("bg-muted");
    expect(tabsListVariants({ variant: "line" })).toContain("bg-transparent");
  });
  it.each(["horizontal", "vertical"] as const)(
    "keeps manual activation, disabled focus without selection, Home/End and persistent panel in %s",
    async (orientation) => {
      const user = userEvent.setup();
      render(<Example orientation={orientation} />);
      const a = screen.getByRole("tab", { name: "Alpha" }),
        c = screen.getByRole("tab", { name: "Charlie" });
      await user.click(a);
      await user.keyboard(orientation === "vertical" ? "{ArrowDown}" : "{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Blocked" })).toHaveFocus();
      await user.keyboard(orientation === "vertical" ? "{ArrowDown}" : "{ArrowRight}");
      expect(c).toHaveFocus();
      expect(a).toHaveAttribute("aria-selected", "true");
      await user.keyboard(" ");
      expect(c).toHaveAttribute("aria-selected", "true");
      expect(screen.getByLabelText("Draft")).toHaveValue("saved");
      expect(screen.getByLabelText("Draft").closest('[data-slot="tabs-content"]')).toHaveAttribute("hidden");
      await user.keyboard("{Home}{Enter}");
      expect(a).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{End}");
      expect(c).toHaveFocus();
    },
  );
  it("supports automatic activation and panel unmount", async () => {
    const user = userEvent.setup();
    render(<Example auto />);
    await user.click(screen.getByRole("tab", { name: "Alpha" }));
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.queryByText("Third view")).toBeNull();
  });
  it("honors controlled requests, cancellation, external value and null", () => {
    const change = vi.fn();
    render(<Controlled change={change} />);
    fireEvent.click(screen.getByRole("tab", { name: "Charlie" }));
    expect(change).toHaveBeenCalledWith("c");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByText("External"));
    expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByText("Clear"));
    expect(screen.queryByRole("tabpanel")).toBeNull();
  });
  it("keeps uncontrolled primitive fallback when a tab becomes disabled or disappears", async () => {
    const change = vi.fn();
    const view = (disabled: boolean, removed: boolean) => (
      <Tabs defaultValue="a" onValueChange={change}>
        <TabsList aria-label="Fallback">
          {!removed && (
            <TabsTrigger value="a" disabled={disabled}>
              First
            </TabsTrigger>
          )}
          <TabsTrigger value="b">Second</TabsTrigger>
        </TabsList>
        <TabsContent value="a">First panel</TabsContent>
        <TabsContent value="b">Second panel</TabsContent>
      </Tabs>
    );
    const { rerender } = render(view(false, false));
    rerender(view(true, false));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "true"));
    expect(change).toHaveBeenCalledWith("b", expect.objectContaining({ reason: "disabled" }));
    rerender(view(false, true));
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute("aria-selected", "true");
  });
  it("preserves RTL arrow direction and loopFocus=false", async () => {
    const user = userEvent.setup();
    render(
      <DirectionProvider direction="rtl">
        <Tabs defaultValue="a">
          <TabsList loopFocus={false}>
            <TabsTrigger value="a">First</TabsTrigger>
            <TabsTrigger value="b">Second</TabsTrigger>
          </TabsList>
        </Tabs>
      </DirectionProvider>,
    );
    await user.click(screen.getByRole("tab", { name: "First" }));
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Second" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "First" })).toHaveFocus();
  });
  it.each(["full", "reduced", "none"] as const)(
    "renders the real %s indicator branch without transform in downgraded modes",
    (mode) => {
      const { container } = render(
        <CadenceProvider mode={mode}>
          <Example />
        </CadenceProvider>,
      );
      fireEvent.click(screen.getByRole("tab", { name: "Charlie" }));
      expect(screen.getByRole("tab", { name: "Charlie" })).toHaveAttribute("aria-selected", "true");
      const indicator = container.querySelector('[data-slot="tabs-indicator"]');
      expect(indicator?.parentElement).toBe(container.querySelector('[data-slot="tabs-list"]'));
      expectMotionContract(mode, {
        behavior: () => {
          if (mode !== "full") expect((indicator as HTMLElement).style.transform).toBe("");
          else expect(indicator).toHaveAttribute("data-motion", "full");
        },
      });
      expect(indicator).toHaveAttribute("data-motion", mode);
      expect(indicator).not.toHaveAttribute("style", expect.stringContaining("transform"));
      if (mode !== "full") expect((indicator as HTMLElement).style.transform).toBe("");
    },
  );
});
