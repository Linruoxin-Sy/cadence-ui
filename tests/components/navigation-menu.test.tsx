import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/cadence/navigation-menu";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, prepareV2MotionPlan } from "../motion-v2-contract";

function Items() {
  return (
    <NavigationMenuList>
      <NavigationMenuItem value="one">
        <NavigationMenuTrigger>
          Learn
          <NavigationMenuIndicator />
        </NavigationMenuTrigger>
        <NavigationMenuContent keepMounted>
          <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          <input aria-label="Retained" />
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem value="two">
        <NavigationMenuTrigger>Build</NavigationMenuTrigger>
        <NavigationMenuContent>
          <NavigationMenuLink href="#api">API</NavigationMenuLink>
        </NavigationMenuContent>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuTrigger disabled>Disabled</NavigationMenuTrigger>
      </NavigationMenuItem>
    </NavigationMenuList>
  );
}
describe("NavigationMenu", () => {
  for (const mode of ["full", "reduced", "none"] as const) {
    it(`keeps popup lifecycle and keyboard semantics in ${mode}`, async () => {
      const user = userEvent.setup();
      const view = render(
        <CadenceProvider mode={mode}>
          <NavigationMenu aria-label="Main">
            <Items />
          </NavigationMenu>
        </CadenceProvider>,
      );
      const trigger = screen.getByRole("button", { name: "Learn" });
      await user.click(trigger);
      const popup = document.querySelector('[data-slot="navigation-menu-popup"]');
      const content = screen.getByRole("link", { name: "Docs" }).closest('[data-slot="navigation-menu-content"]');
      expectMotionContract(mode, { parts: [popup] });
      expect(content).toHaveAttribute("data-motion", mode);
      if (mode !== "full") expect(popup?.className).not.toContain("data-starting-style:scale-");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      await user.type(screen.getByLabelText("Retained"), "saved");
      expect(screen.getByLabelText("Retained")).toHaveValue("saved");
      view.rerender(
        <CadenceProvider mode="none">
          <NavigationMenu aria-label="Main">
            <Items />
          </NavigationMenu>
        </CadenceProvider>,
      );
      expect(document.querySelector('[data-slot="navigation-menu-popup"]')).toBe(popup);
      expect(popup).toHaveAttribute("data-motion", "none");
      await user.keyboard("{Escape}");
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(screen.getByRole("button", { name: "Disabled" })).toHaveAttribute("aria-disabled", "true");
      await user.click(screen.getByRole("button", { name: "Disabled" }));
      expect(screen.getByRole("button", { name: "Disabled" })).toHaveAttribute("aria-expanded", "false");
    });
  }
  it("retains a keepMounted panel as a hidden inert node across close and reopen", async () => {
    const user = userEvent.setup();
    render(
      <CadenceProvider mode="full">
        <NavigationMenu aria-label="Draft menu">
          <Items />
        </NavigationMenu>
      </CadenceProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Learn" });
    await user.click(trigger);
    const input = screen.getByLabelText("Retained");
    const content = input.closest('[data-slot="navigation-menu-content"]') as HTMLElement;
    await user.type(input, " and review");
    expect(input).toHaveValue(" and review");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(content).toHaveAttribute("data-closed"));
    // A close must not destroy the retained node: it stays in the document as the
    // primitive's own hidden, inert surface, so its draft can leave with it.
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("hidden");
    expect(content).toHaveAttribute("inert");
    expect(content.querySelector("input")).toBe(input);
    expect(input).toHaveValue(" and review");
    await user.click(trigger);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(document.querySelector('[data-slot="navigation-menu-content"][data-open]')).toBe(content);
    expect(screen.getByLabelText("Retained")).toBe(input);
    expect(input).toHaveValue(" and review");
  });

  it("preserves refs, render, state callback classes/styles and cancellable controlled changes", async () => {
    const user = userEvent.setup();
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const change = vi.fn((_value, details) => details.cancel());
    const tree = (controlled: boolean) => (
      <NavigationMenu
        aria-label="Custom"
        {...(controlled ? { value: "one", onValueChange: change } : { defaultValue: "one" })}
        className={(s) => (s.open ? "caller-root" : "")}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="one">
            <NavigationMenuTrigger
              ref={triggerRef}
              render={<button type="button" />}
              className={(s) => (s.open ? "caller-trigger" : "")}
            >
              Open
            </NavigationMenuTrigger>
            <NavigationMenuContent
              ref={contentRef}
              className={(s) => (s.open ? "caller-content w-72" : "")}
              style={(s) => ({ color: s.open ? "red" : "blue" })}
            >
              <NavigationMenuLink active render={<a href="#custom" />}>
                Custom link
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
    render(tree(true));
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(triggerRef.current).toBe(trigger);
    expect(trigger).toHaveClass("caller-trigger");
    const content = screen.getByRole("link", { name: "Custom link" }).parentElement;
    expect(contentRef.current).toBe(content);
    expect(content).toHaveClass("caller-content", "w-72");
    expect(content).toHaveStyle({ color: "rgb(255, 0, 0)" });
    await user.click(trigger);
    expect(change).toHaveBeenCalled();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Custom link" })).toHaveAttribute("href", "#custom");
  });
});

it("keeps root ref cleanup, actions, native style overrides and retained switch state", async () => {
  const user = userEvent.setup();
  const cleanup = vi.fn();
  const rootRef = vi.fn(() => cleanup);
  const actions = createRef<{ close: () => void; unmount: () => void }>();
  const tree = (value: string) => (
    <CadenceProvider mode="none">
      <NavigationMenu
        ref={rootRef}
        actionsRef={actions}
        value={value}
        aria-label="Retained menu"
        style={(state) => ({ color: state.open ? "red" : "blue" })}
      >
        <Items />
      </NavigationMenu>
    </CadenceProvider>
  );
  const view = render(tree("one"));
  expect(rootRef).toHaveBeenCalledWith(screen.getByRole("navigation", { name: "Retained menu" }));
  await user.type(screen.getByLabelText("Retained"), "saved");
  const input = screen.getByLabelText("Retained");
  view.rerender(tree("two"));
  view.rerender(tree("one"));
  expect(screen.getByLabelText("Retained")).toBe(input);
  expect(input).toHaveValue("saved");
  expect(document.querySelector('[data-slot="navigation-menu-content"]')?.className).not.toContain(
    "data-starting-style:opacity-0",
  );
  expect(actions.current?.close).toBeTypeOf("function");
  act(() => actions.current?.close());
  view.unmount();
  expect(cleanup).toHaveBeenCalledTimes(1);
});

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

type Frame = {
  value: string | null;
  /** The second item is only mounted for the switch causes, so an owned slot has one host. */
  second: boolean;
  trigger: string;
  link: string;
  guide: string;
  quantity: number;
  triggerPaint: { backgroundColor: string; color: string } | undefined;
  linkPaint: { backgroundColor: string } | undefined;
};

const initial: Frame = {
  value: null,
  second: false,
  trigger: "Learn",
  link: "Docs",
  guide: "Guide",
  quantity: 12,
  triggerPaint: undefined,
  linkPaint: undefined,
};

type Change = (value: string | null, details: { preventUnmountOnClose?: () => void }) => void;

/**
 * One menu whose owned slots each have exactly one committed host: the trigger (paint,
 * label, chevron), the link surface and label, the content text and the content
 * quantity. The second item only exists during the switch causes, because a menu can
 * legitimately mount many items and the evidence addresses one host per owned slot.
 */
function Scene({ mode, frame, onValueChange }: { mode: Mode; frame: Frame; onValueChange: Change }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <NavigationMenu value={frame.value} onValueChange={onValueChange} aria-label="Owners">
        <NavigationMenuList>
          <NavigationMenuItem value="one">
            <NavigationMenuTrigger style={frame.triggerPaint}>{frame.trigger}</NavigationMenuTrigger>
            <NavigationMenuContent keepMounted>
              <NavigationMenuLink href="#docs" style={frame.linkPaint}>
                {frame.link}
              </NavigationMenuLink>
              {frame.guide}
              {frame.quantity}
            </NavigationMenuContent>
          </NavigationMenuItem>
          {frame.second ? (
            <NavigationMenuItem value="two">
              <NavigationMenuTrigger>Reference surfaces</NavigationMenuTrigger>
              <NavigationMenuContent keepMounted>Second destination</NavigationMenuContent>
            </NavigationMenuItem>
          ) : null}
        </NavigationMenuList>
      </NavigationMenu>
    </CadenceProvider>
  );
}

/** Two items with one retained panel each, driven by the controlled owner. */
function SiblingsScene() {
  const [value, setValue] = useState<string | null>("one");
  return (
    <CadenceProvider mode="full" timeScale={0}>
      <NavigationMenu value={value} onValueChange={setValue} aria-label="Siblings">
        <NavigationMenuList>
          <NavigationMenuItem value="one">
            <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
            <NavigationMenuContent keepMounted>Docs</NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="two">
            <NavigationMenuTrigger>Build</NavigationMenuTrigger>
            <NavigationMenuContent keepMounted>API</NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </CadenceProvider>
  );
}

function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}

describe("NavigationMenu v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned action in %s", async (mode) => {
    const user = userEvent.setup();
    let frame = { ...initial };
    let view: ReturnType<typeof render>;
    const onValueChange: Change = (value, details) => {
      // Keep the closing surface so the owned exit can run; Base UI still decides when
      // the portal leaves after its own completion.
      if (value === null) details.preventUnmountOnClose?.();
      frame = { ...frame, value };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onValueChange={onValueChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };
    const trigger = (name: string) => screen.getByRole("button", { name });
    const owned = (binding: string, exercise: () => void | Promise<void>) =>
      expectV2MotionAction("navigation-menu", `navigation-menu.${binding}`, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}`);
      });

    view = render(scene());
    await user.click(trigger("Learn"));
    await waitFor(() => expect(pageSlot("navigation-menu-popup")).toHaveAttribute("data-motion", mode));

    // The chevron turns on its own region when the trigger's committed open state changes.
    await owned("indicator.change", async () => {
      await user.keyboard("{Escape}");
    });
    // The retained popup owns its entrance on reopen and its closing envelope after it.
    await owned("popup.enter", async () => {
      await user.click(trigger("Learn"));
    });
    await waitFor(() => expect(trigger("Learn")).toHaveAttribute("aria-expanded", "true"));
    await owned("popup.exit", async () => {
      await user.keyboard("{Escape}");
    });
    await user.click(trigger("Learn"));
    await waitFor(() => expect(trigger("Learn")).toHaveAttribute("aria-expanded", "true"));

    // The popup owns its surface paint; the trigger and link own disjoint surfaces.
    await owned("surface.colour", () => {
      const popup = pageSlot("navigation-menu-popup");
      popup.style.backgroundColor = "#202020";
      popup.style.color = "#f5f5f5";
    });
    expect(pageSlot("navigation-menu-popup").style.transitionProperty).toContain("background-color");
    await expectV2MotionAction("navigation-menu", "navigation-menu.item.colour", mode, () =>
      update({ triggerPaint: { backgroundColor: "#303030", color: "#ededed" } }),
    );
    await owned("link.colour", () => update({ linkPaint: { backgroundColor: "#313131" } }));

    // Every owned display slot keeps its own changed runs.
    await owned("label.replace", () => update({ trigger: "Learning", link: "Reference", guide: "Guidance" }));
    expect(pageSlot("navigation-menu-trigger-text").textContent).toBe("Learning");
    expect(pageSlot("navigation-menu-link-text").textContent).toBe("Reference");
    expect(pageSlot("navigation-menu-content-text").textContent).toBe("Guidance");

    // A direct numeric content child rolls its own places.
    await owned("value.change", () => update({ quantity: 18 }));
    expect(pageSlot("navigation-menu-content-number").textContent).toBe("18");

    // A second item exists only for the switch causes: one destination, one content revision.
    // The frame is the controlled owner, so a value-only switch is the committed cause.
    update({ second: true });
    // The trigger records the committed item order in its own attribute observer, so
    // the shared surface re-commits on the next React turn.
    await owned("viewport.resize", async () => {
      update({ value: "two" });
      await act(async () => {});
    });
    await owned("content.change", async () => {
      update({ value: "one" });
      await act(async () => {});
    });
    expect(trigger("Learning")).toHaveAttribute("aria-expanded", "true");
    expect(pageSlot("navigation-menu-content")).toHaveAttribute("data-motion", mode);
    expect(pageSlot("navigation-menu-viewport")).toHaveAttribute("data-motion", mode);

    expectMotionContract(mode, { policy: ["color"] });
  });

  it.each(modes)("keeps a live downgrade on one surface in %s", async (mode) => {
    const draw = (next: Mode) => (
      <CadenceProvider mode={next}>
        <NavigationMenu defaultValue="one" aria-label="Downgrade">
          <NavigationMenuList>
            <NavigationMenuItem value="one">
              <NavigationMenuTrigger>Learn</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    await waitFor(() => expect(document.querySelector('[data-slot="navigation-menu-popup"]')).not.toBeNull());
    const popup = pageSlot("navigation-menu-popup");
    const viewport = pageSlot("navigation-menu-viewport");
    expect(popup).toHaveAttribute("data-motion", "full");

    view.rerender(draw(mode));
    for (const node of [
      popup,
      viewport,
      pageSlot("navigation-menu-trigger-chevron"),
      pageSlot("navigation-menu-content"),
    ])
      expect(node).toHaveAttribute("data-motion", mode);
    // The shell keeps its own writer and never falls back to a CSS size clock.
    expect(popup.className).not.toContain("transition-[");
    for (const node of [popup, viewport])
      expect(node.getAnimations?.().filter((animation) => "animationName" in animation) ?? []).toHaveLength(0);
  });

  it("keeps the shared viewport as the only switch writer across sibling items", async () => {
    render(<SiblingsScene />);
    await waitFor(() => expect(document.querySelector('[data-slot="navigation-menu-viewport"]')).not.toBeNull());
    expect(document.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
    // Two mounted contents, one paint host: a retained panel adds no writer.
    expect(document.querySelectorAll('[data-slot="navigation-menu-content"]')).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Build" }));
    // Base UI's own toggle semantics close the surface here; open it again and switch
    // through the controlled value so the same shared viewport serves both items.
    await userEvent.click(screen.getByRole("button", { name: "Build" }));
    await waitFor(() => expect(pageSlot("navigation-menu-viewport")).toHaveAttribute("data-motion", "full"));
    expect(document.querySelectorAll('[data-slot="navigation-menu-viewport"]')).toHaveLength(1);
  });

  it("leaves the native Indicator and focus sentinels untouched", async () => {
    const user = userEvent.setup();
    render(
      <CadenceProvider mode="full">
        <NavigationMenu aria-label="Indicator">
          <NavigationMenuList>
            <NavigationMenuItem value="one">
              <NavigationMenuTrigger>
                Learn
                <NavigationMenuIndicator />
              </NavigationMenuTrigger>
              <NavigationMenuContent keepMounted>Docs</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </CadenceProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Learn" }));
    const indicator = pageSlot("navigation-menu-indicator");
    // The separately exported Icon keeps its native placement and gains no Cadence writer.
    expect(indicator).not.toHaveAttribute("data-motion");
    expect(indicator.style.transitionProperty).toBe("");
    expect(indicator.style.transform).toBe("");
    for (const guard of document.querySelectorAll("[data-base-ui-focus-guard]"))
      expect(guard).not.toHaveAttribute("aria-hidden");
  });
});
