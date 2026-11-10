import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import * as React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/cadence/card";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function Example({
  value = "Parity plan",
  paint = false,
  size,
  fit,
}: {
  value?: string | number;
  paint?: boolean;
  size?: "default" | "sm";
  fit?: "content";
}) {
  const ink = { color: paint ? "#222" : "#111" };
  const surface = { backgroundColor: paint ? "#eee" : "#fff" };
  return (
    <Card size={size} fit={fit} style={{ ...ink, ...surface }}>
      <CardHeader style={surface}>
        <CardTitle style={ink}>{value}</CardTitle>
        <CardDescription style={ink}>{value}</CardDescription>
        <CardAction>Action</CardAction>
      </CardHeader>
      <CardContent style={ink}>{value}</CardContent>
      <CardFooter style={surface}>Footer</CardFooter>
    </Card>
  );
}
function StatefulBody({ mount, unmount }: { mount(): void; unmount(): void }) {
  React.useEffect(() => {
    mount();
    return unmount;
  }, [mount, unmount]);
  return (
    <label htmlFor="card-native">
      Memo
      <input id="card-native" name="memo" defaultValue="draft" />
    </label>
  );
}
function must<T>(value: T | null) {
  if (!value) throw new Error("Missing fixture element");
  return value;
}
describe("Card", () => {
  it.each(["full", "reduced", "none"] as const)(
    "%s keeps the editor span and Text when a primitive changes type",
    (mode) => {
      const draw = (editable: boolean, value: string | number) => (
        <CadenceProvider mode={mode}>
          <div contentEditable={editable} suppressContentEditableWarning>
            <Card>
              <CardContent>{value}</CardContent>
            </Card>
          </div>
        </CadenceProvider>
      );
      const view = render(draw(true, 19));
      const span = must(view.container.querySelector('[data-slot="card-number"]'));
      const text = span.firstChild as Text;
      text.replaceData(0, text.length, "Native buffer");
      document.getSelection()?.setBaseAndExtent(text, 3, text, 3);
      for (const value of ["Identifier", 20, "Label", 22]) {
        view.rerender(draw(true, value));
        const current = view.container.querySelector('[data-slot="card-text"],[data-slot="card-number"]');
        expect(current).toBe(span);
        expect(current?.firstChild).toBe(text);
        expect(text.data).toBe("Native buffer");
        expect(document.getSelection()?.anchorNode).toBe(text);
      }
      view.rerender(draw(false, 22));
      expect(text.data).toBe("Native buffer");
      view.rerender(draw(false, 23));
      expect(text.data).toBe("23");
      expect(span.firstChild).toBe(text);
      expectMotionContract(mode, { parts: [span] });
      document.getSelection()?.removeAllRanges();
    },
  );
  it("keeps typography-only classes out of inherited foreground ownership and preserves fit height over h-full", () => {
    const view = render(
      <Card fit="content" className="h-full">
        <CardTitle className="text-xl">Inherited</CardTitle>
        <CardContent className="text-center">Body</CardContent>
        <CardDescription>Owned foreground</CardDescription>
      </Card>,
    );
    const root = must(view.container.querySelector<HTMLElement>('[data-slot="card"]'));
    expect(root.style.height).toBe("fit-content");
    expect(root.querySelector<HTMLElement>('[data-slot="card-title"]')?.style.transitionDuration).toBe("0s");
    expect(root.querySelector<HTMLElement>('[data-slot="card-content"]')?.style.transitionDuration).toBe("0s");
    expect(
      Number.parseFloat(
        root.querySelector<HTMLElement>('[data-slot="card-description"]')?.style.transitionDuration ?? "0",
      ),
    ).toBeGreaterThan(0);
  });
  beforeAll(() => prepareV2MotionPlan());
  it.each(["full", "reduced", "none"] as const)("executes each actual part in %s", async (mode) => {
    const draw = (value: string | number, paint = false, size?: "default" | "sm") => (
      <CadenceProvider mode={mode} timeScale={0}>
        <Example value={value} paint={paint} size={size} fit="content" />
      </CadenceProvider>
    );
    const view = render(draw("Status pending"));
    const root = must(view.container.querySelector('[data-slot="card"]'));
    const texts = Array.from(root.querySelectorAll('[data-slot="card-text"]')).map((p) => p.firstChild);
    await expectV2MotionAction("card", "card.text.replace", mode, () => view.rerender(draw("Status ready")));
    expect(Array.from(root.querySelectorAll('[data-slot="card-text"]')).map((p) => p.firstChild)).toEqual(texts);
    await expectV2MotionAction("card", "card.root.resize", mode, () => view.rerender(draw("Ready", false, "sm")));
    await expectV2MotionAction("card", "card.root.colour", mode, () => view.rerender(draw("Ready", true)));
    await expectV2MotionAction("card", "card.surface.colour", mode, () => view.rerender(draw("Ready", false)));
    await expectV2MotionAction("card", "card.foreground.colour", mode, () => view.rerender(draw("Ready", true)));
    view.rerender(draw(19));
    await expectV2MotionAction("card", "card.value.roll", mode, () => view.rerender(draw(20)));
    expect(Array.from(root.querySelectorAll('[data-slot="card-number"]')).map((p) => p.textContent)).toEqual([
      "20",
      "20",
      "20",
    ]);
    expectMotionContract(mode, { parts: [root, ...Array.from(root.querySelectorAll("[data-motion]"))] });
    view.rerender(
      <CadenceProvider mode={mode}>
        <Card>
          <CardTitle>
            <h3>Rich heading</h3>
          </CardTitle>
          <CardDescription>
            <em>Rich description</em>
          </CardDescription>
          <CardContent>
            <input name="memo" defaultValue="native" />
          </CardContent>
        </Card>
      </CadenceProvider>,
    );
    await expectV2NativeBoundaries("card", { container: view.container });
  });
  it.each(["full", "reduced", "none"] as const)("retains and reverses one surface in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "card-retention",
            isPresent: present,
            initial: false,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Card>
            <CardContent>Retained body</CardContent>
            <CardFooter>
              <button type="button">Native action</button>
            </CardFooter>
          </Card>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true));
    const root = must(view.container.querySelector('[data-slot="card"]'));
    await expectV2MotionAction("card", "card.root.exit", mode, () => view.rerender(draw(false)));
    expect(root).toHaveAttribute("inert");
    expect(root).toHaveAttribute("aria-hidden", "true");
    await expectV2MotionAction("card", "card.root.enter", mode, () => view.rerender(draw(true)));
    expect(view.container.querySelector('[data-slot="card"]')).toBe(root);
    expect(root).not.toHaveAttribute("inert");
  });
  it.each(["full", "none"] as const)("finishes actual AnimatePresence at zero in %s", async (mode) => {
    const draw = (show: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <AnimatePresence>
          {show && (
            <Card key="record">
              <CardContent>Optional</CardContent>
            </Card>
          )}
        </AnimatePresence>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector('[data-slot="card"]')).toBeNull());
  });
  it("keeps every upstream slot and ordinary direct-child layout", () => {
    const view = render(<Example size="sm" />);
    const root = must(view.container.querySelector('[data-slot="card"]'));
    expect(root.tagName).toBe("DIV");
    expect(root).not.toHaveAttribute("role");
    expect(root).toHaveAttribute("data-size", "sm");
    for (const slot of ["card-header", "card-title", "card-description", "card-action", "card-content", "card-footer"])
      expect(root.querySelector(`[data-slot="${slot}"]`)).toBeTruthy();
    expect(root.querySelector('[data-slot="card-flow"]')).toBeNull();
    expect(root.firstElementChild).toHaveAttribute("data-slot", "card-header");
  });
  it("uses only the existing fit flow and natural CSS without a permanent pixel height", () => {
    const view = render(
      <Card fit="content">
        <CardContent>Body</CardContent>
      </Card>,
    );
    const root = view.container.querySelector('[data-slot="card"]') as HTMLElement;
    expect(root).toHaveAttribute("data-fit", "content");
    expect(root).toHaveClass("h-fit", "w-fit");
    expect(root.firstElementChild).toHaveAttribute("data-slot", "card-flow");
    expect(root.style.height).toBe("fit-content");
  });
  it("keeps caller refs, state, form participation and native keyboard focus", async () => {
    const clean = vi.fn(),
      first = vi.fn(() => clean),
      secondClean = vi.fn(),
      second = vi.fn(() => secondClean),
      object = React.createRef<HTMLDivElement>(),
      mount = vi.fn(),
      unmount = vi.fn();
    const draw = (ref: React.Ref<HTMLDivElement>, value: string | number) => (
      <form>
        <Card fit="content" ref={ref}>
          <CardTitle>{value}</CardTitle>
          <CardContent>
            <StatefulBody mount={mount} unmount={unmount} />
          </CardContent>
          <CardFooter>
            <button type="reset">Reset</button>
          </CardFooter>
        </Card>
      </form>
    );
    const view = render(draw(first, "Version 01"));
    const root = view.container.querySelector('[data-slot="card"]'),
      input = screen.getByRole("textbox");
    await userEvent.tab();
    expect(input).toHaveFocus();
    await userEvent.type(input, " changed");
    view.rerender(draw(second, 1000));
    expect(clean).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(root);
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("draft changed");
    expect(input).toHaveFocus();
    expect(mount).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll("#card-native")).toHaveLength(1);
    expect(new FormData(must(view.container.querySelector("form"))).getAll("memo")).toEqual(["draft changed"]);
    view.rerender(draw(object, 1.234567));
    expect(object.current).toBe(root);
    expect(secondClean).toHaveBeenCalledTimes(1);
    fireEvent.reset(must(view.container.querySelector("form")));
    view.unmount();
    expect(object.current).toBeNull();
    expect(unmount).toHaveBeenCalledTimes(1);
  });
  it("preserves exact numeric output and rich child identity across mode changes", () => {
    const ref = React.createRef<HTMLDivElement>();
    const child = <strong>Rich body</strong>;
    const draw = (mode: "full" | "reduced" | "none", value: string | number) => (
      <CadenceProvider mode={mode}>
        <Card>
          <CardTitle ref={ref}>{value}</CardTitle>
          <CardContent>{child}</CardContent>
        </Card>
      </CadenceProvider>
    );
    const view = render(draw("full", 1000));
    const title = ref.current,
      rich = screen.getByText("Rich body");
    for (const value of [1.234567, -0, 1e21, "00123", 42]) {
      view.rerender(draw("none", value));
      expect(ref.current).toBe(title);
      expect(title?.textContent).toBe(String(value));
      expect(screen.getByText("Rich body")).toBe(rich);
    }
  });
});
