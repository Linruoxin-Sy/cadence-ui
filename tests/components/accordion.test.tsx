import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/cadence/accordion";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import {
  expectV2MotionAction,
  expectV2MotionInsertion,
  expectV2NativeBoundaries,
  prepareV2MotionPlan,
} from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;

function Items() {
  return (
    <>
      <AccordionItem value="one">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionContent className="custom-content">First answer</AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>Disabled</AccordionTrigger>
        <AccordionContent>Disabled answer</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second answer</AccordionContent>
      </AccordionItem>
    </>
  );
}

function Controlled({ change }: { change: (...args: unknown[]) => void }) {
  const [value, setValue] = useState<string[]>(["one"]);
  return (
    <Accordion
      multiple
      value={value}
      onValueChange={(next, details) => {
        change(next, details);
        setValue(next);
      }}
    >
      <Items />
    </Accordion>
  );
}

/** jsdom has no layout engine or compiled CSS; report hosts visible and record native frames. */
function stubAnimations() {
  const hadVisibility = "checkVisibility" in Element.prototype;
  const previousVisibility = Element.prototype.checkVisibility;
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

describe("Accordion", () => {
  it("preserves slots, heading, labelled region and inner classes", () => {
    const { container } = render(
      <Accordion defaultValue={["one"]}>
        <Items />
      </Accordion>,
    );
    for (const slot of [
      "accordion",
      "accordion-item",
      "accordion-trigger",
      "accordion-trigger-icon",
      "accordion-content",
    ])
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="accordion-trigger-icon"]')).toHaveLength(6);
    expect(screen.getByRole("region", { name: "First" })).toHaveTextContent("First answer");
    expect(screen.getByRole("heading", { name: "First" })).toBeTruthy();
    expect(screen.getByText("First answer")).toBeTruthy();
    expect(container.querySelector('[data-slot="accordion-content-inner"]')).toHaveClass("custom-content");
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles with Enter and Space and tabs past disabled items", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <Items />
      </Accordion>,
    );
    const first = screen.getByRole("button", { name: "First" });
    first.focus();
    await user.keyboard("{Enter}");
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowDown}");
    expect(first).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Second" })).toHaveFocus();
    await user.keyboard(" ");
    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
  });

  it("supports controlled arrays, multiple panels, root disabled and render/ref", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { unmount } = render(<Controlled change={change} />);
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(change.mock.calls[0]?.[0]).toEqual(["one", "two"]);
    expect(screen.getAllByRole("region")).toHaveLength(2);
    unmount();
    const ref = vi.fn();
    render(
      <Accordion disabled defaultValue={["x"]}>
        <AccordionItem value="x">
          <AccordionTrigger render={<button type="button" data-custom="yes" />} ref={ref}>
            Locked
          </AccordionTrigger>
          <AccordionContent>Locked answer</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Locked" })).toHaveAttribute("data-custom", "yes");
    expect(ref).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Locked" }));
    expect(screen.getByRole("button", { name: "Locked" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps closed panels mounted on request and forwards hidden-until-found", async () => {
    const { container } = render(
      <Accordion keepMounted hiddenUntilFound>
        <Items />
      </Accordion>,
    );
    const panel = container.querySelector('[data-slot="accordion-content"]');
    expect(panel).toHaveAttribute("hidden", "until-found");
    await act(async () => {
      fireEvent(panel as Element, new Event("beforematch"));
    });
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Accordion v2 motion", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes the measured content revision and changed label in %s", async (mode) => {
    const draw = (label: string, body: string) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Accordion defaultValue={["a"]} keepMounted>
          <AccordionItem value="a">
            <AccordionTrigger>{label}</AccordionTrigger>
            <AccordionContent>{body}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CadenceProvider>
    );
    const view = render(draw("First answer", "First body"));
    const panel = view.container.querySelector('[data-slot="accordion-content"]') as HTMLElement;
    await expectV2MotionAction(
      "accordion",
      "accordion.content.resize",
      mode,
      () => view.rerender(draw("First answer", "A longer first body")),
      { container: view.container },
    );
    await expectV2MotionAction(
      "accordion",
      "accordion.label.replace",
      mode,
      () => view.rerender(draw("Second answer", "A longer second body")),
      { container: view.container },
    );
    expect(panel).toBe(view.container.querySelector('[data-slot="accordion-content"]'));
    expectMotionContract(mode, { root: view.container, parts: [panel], policy: ["color"] });
    await expectV2NativeBoundaries("accordion", { container: view.container });
  });

  it.each(modes)("executes changed quantities in %s", async (mode) => {
    const draw = (value: number) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Accordion defaultValue={["a"]} keepMounted>
          <AccordionItem value="a">
            <AccordionTrigger>{value}</AccordionTrigger>
            <AccordionContent>{value}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CadenceProvider>
    );
    const view = render(draw(19));
    const panel = view.container.querySelector('[data-slot="accordion-content"]') as HTMLElement;
    await expectV2MotionAction("accordion", "accordion.value.change", mode, () => view.rerender(draw(20)), {
      container: view.container,
    });
    expect(screen.getByRole("button", { name: "20" })).toBeTruthy();
    expectMotionContract(mode, { root: view.container, parts: [panel] });
  });

  it.each(modes)("executes the trigger and item colour owners in %s", async (mode) => {
    const paint = (on: boolean) => ({
      color: on ? "#112233" : "#445566",
      borderColor: on ? "#778899" : "#aabbcc",
    });
    const draw = (on: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Accordion defaultValue={["a"]} keepMounted>
          <AccordionItem value="a" style={paint(on)}>
            <AccordionTrigger style={paint(on)}>Paint</AccordionTrigger>
            <AccordionContent>Paint body</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CadenceProvider>
    );
    const view = render(draw(false));
    await expectV2MotionAction("accordion", "accordion.trigger.colour", mode, () => view.rerender(draw(true)), {
      container: view.container,
    });
    await expectV2MotionAction("accordion", "accordion.item-paint.colour", mode, () => view.rerender(draw(false)), {
      container: view.container,
    });
    const trigger = view.container.querySelector('[data-slot="accordion-trigger"]') as HTMLElement;
    expect(trigger.style.color).toBe("rgb(68, 85, 102)");
    expect(trigger.dataset.cadenceColor).toContain("color");
  });

  it.each(modes)("crossfades the retained indicator in %s", async (mode) => {
    const user = userEvent.setup();
    const view = render(
      <CadenceProvider mode={mode}>
        <Accordion keepMounted>
          <AccordionItem value="a">
            <AccordionTrigger>Indicator</AccordionTrigger>
            <AccordionContent>Indicator body</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CadenceProvider>,
    );
    const panel = view.container.querySelector('[data-slot="accordion-content"]') as HTMLElement;
    await expectV2MotionAction(
      "accordion",
      "accordion.indicator.change",
      mode,
      () => user.click(screen.getByRole("button", { name: "Indicator" })),
      { container: view.container },
    );
    expectMotionContract(mode, { root: view.container, parts: [panel] });
  });

  it.each(modes)("retains the closing content paint in %s", async (mode) => {
    const user = userEvent.setup();
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <Accordion defaultValue={["a"]} keepMounted>
          <AccordionItem value="a">
            <AccordionTrigger>Retained</AccordionTrigger>
            <AccordionContent>Retained body</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CadenceProvider>,
    );
    const panel = view.container.querySelector('[data-slot="accordion-content"]') as HTMLElement;
    await expectV2MotionAction(
      "accordion",
      "accordion.content-paint.exit",
      mode,
      () => user.click(screen.getByRole("button", { name: "Retained" })),
      { container: view.container },
    );
    expect(panel).toHaveAttribute("hidden");
    await expectV2MotionAction(
      "accordion",
      "accordion.content-paint.enter",
      mode,
      () => user.click(screen.getByRole("button", { name: "Retained" })),
      { container: view.container },
    );
    expect(panel).not.toHaveAttribute("hidden");
  });

  it.each(modes)("inserts a later open content paint in %s", async (mode) => {
    const stub = stubAnimations();
    try {
      const draw = (open: boolean) => (
        <CadenceProvider mode={mode}>
          <Accordion value={open ? ["a"] : []}>
            <AccordionItem value="a">
              <AccordionTrigger>Later</AccordionTrigger>
              <AccordionContent>Later body</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionInsertion("accordion", "accordion.content-paint.enter", mode, async () => {
        await act(async () => {
          view.rerender(draw(true));
        });
      });
    } finally {
      stub();
    }
  });

  it.each(modes)("inserts a later item in %s", async (mode) => {
    const stub = stubAnimations();
    try {
      const draw = (show: boolean) => (
        <CadenceProvider mode={mode}>
          <Accordion>
            {show && (
              <AccordionItem value="later">
                <AccordionTrigger>Inserted</AccordionTrigger>
                <AccordionContent>Inserted body</AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </CadenceProvider>
      );
      const view = render(draw(false));
      await expectV2MotionInsertion("accordion", "accordion.item.enter", mode, async () => {
        await act(async () => {
          view.rerender(draw(true));
        });
      });
    } finally {
      stub();
    }
  });

  it.each(modes)("keeps the semantic open state and unmounts a closed panel in %s", async (mode) => {
    const view = render(
      <CadenceProvider mode={mode} timeScale={0}>
        <Accordion defaultValue={["a"]}>
          <AccordionItem value="a">
            <AccordionTrigger>Rolling</AccordionTrigger>
            <AccordionContent>Rolling body</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CadenceProvider>,
    );
    const panel = view.container.querySelector('[data-slot="accordion-content"]') as HTMLElement;
    expect(panel).not.toHaveAttribute("hidden");
    if (mode === "full") expect(panel.className).toContain("duration-(--motion-duration-slow)");
    else expect(panel.className).toContain("transition-none");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Rolling" }));
    });
    await waitFor(() => expect(view.container.querySelector('[data-slot="accordion-content"]')).toBeNull());
  });
});
