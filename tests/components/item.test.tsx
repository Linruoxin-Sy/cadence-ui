import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnimatePresence, PresenceContext } from "motion/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/registry/cadence/item";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const presence = (isPresent: boolean, id: string) => ({
  id,
  initial: false as const,
  isPresent,
  register: () => () => {},
  onExitComplete: () => {},
});

function Row(props: { size?: "default" | "sm" | "xs"; variant?: "default" | "outline" | "muted" }) {
  return (
    <Item {...props}>
      <ItemMedia variant="icon">F</ItemMedia>
      <ItemContent>
        <ItemTitle>plan.pdf</ItemTitle>
        <ItemDescription>2.4 MB · updated today</ItemDescription>
      </ItemContent>
      <ItemActions>Open</ItemActions>
      <ItemFooter>Footer</ItemFooter>
    </Item>
  );
}

type State = {
  title?: string | number;
  description?: string | number;
  content?: string | number;
  header?: string | number;
  footer?: string | number;
  colour?: boolean;
  media?: string;
  partsPresent?: boolean;
};

function row(state: State = {}) {
  const {
    title = "plan.md",
    description = "Project notes.",
    content = "Attached",
    header = "Draft",
    footer = "2 pages",
    colour = false,
    media = "first",
    partsPresent = true,
  } = state;
  const surface = colour
    ? { backgroundColor: "#eee", color: "#222", borderColor: "#999" }
    : { backgroundColor: "#fff", color: "#111", borderColor: "#ddd" };
  return (
    <Item variant="outline" style={surface}>
      <PresenceContext.Provider value={presence(partsPresent, "parts")}>
        <ItemMedia variant="icon" key="media" style={surface}>
          <span key={media} data-media={media}>
            M
          </span>
        </ItemMedia>
        <ItemActions key="actions">Open</ItemActions>
      </PresenceContext.Provider>
      <ItemHeader>{header}</ItemHeader>
      <ItemContent>{content}</ItemContent>
      <ItemContent>
        <ItemTitle style={{ color: colour ? "#333" : "#111" }}>{title}</ItemTitle>
        <ItemDescription style={{ color: colour ? "#444" : "#222" }}>{description}</ItemDescription>
      </ItemContent>
      <ItemFooter>{footer}</ItemFooter>
    </Item>
  );
}

describe("Item", () => {
  it("renders every part with its slot", () => {
    render(
      <ItemGroup>
        <ItemHeader>Header</ItemHeader>
        <Row />
        <ItemSeparator />
      </ItemGroup>,
    );

    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "item-group");
    expect(screen.getByText("Header").closest('[data-slot="item-header"]')).toBeInTheDocument();
    expect(screen.getByText("plan.pdf").closest('[data-slot="item-title"]')).toBeInTheDocument();
    expect(screen.getByText("2.4 MB · updated today").closest('[data-slot="item-description"]')).toBeInTheDocument();
    expect(screen.getByText("Open").closest('[data-slot="item-actions"]')).toBeInTheDocument();
    expect(screen.getByText("F").closest('[data-slot="item-media"]')).toBeInTheDocument();
    expect(screen.getByText("Footer").closest('[data-slot="item-footer"]')).toBeInTheDocument();
    expect(screen.getByText("Header")).toHaveAttribute("data-slot", "item-text");
    expect(document.querySelector('[data-slot="item-separator"]')).toBeInTheDocument();
  });

  it("exposes variant and size through data attributes", () => {
    render(<Row variant="outline" size="sm" />);
    const item = screen.getByText("plan.pdf").closest('[data-slot="item"]');

    expect(item).toHaveAttribute("data-variant", "outline");
    expect(item).toHaveAttribute("data-size", "sm");
    expect(item?.className).toContain("border-border");
  });

  it("renders a whole-row link through render", () => {
    render(
      <Item render={<a href="/files/plan" />}>
        <ItemContent>
          <ItemTitle>plan.pdf</ItemTitle>
        </ItemContent>
      </Item>,
    );

    const link = screen.getByRole("link", { name: "plan.pdf" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/files/plan");
    expect(link).toHaveAttribute("data-slot", "item");
  });

  it("keeps a linking row a link inside a labelled group", () => {
    render(
      <ItemGroup aria-label="Files">
        <Item render={<a href="/files/plan" />}>
          <ItemContent>
            <ItemTitle>plan.pdf</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>,
    );

    // `role="list"` on the group would force `role="listitem"` onto every row, and that
    // role would override the anchor's: the row would stop being announced as a link.
    // A group accepts either kind of row and still carries the label.
    expect(screen.getByRole("group", { name: "Files" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "plan.pdf" })).toBeInTheDocument();
  });
});

describe("Item v2", () => {
  beforeAll(() => prepareV2MotionPlan(), 30000);

  it.each(["full", "reduced", "none"] as const)("preserves every native part, ref and caller prop in %s", (mode) => {
    const slots = [
      "item-group",
      "item",
      "item-media",
      "item-content",
      "item-title",
      "item-description",
      "item-actions",
      "item-header",
      "item-footer",
    ];
    const refs = slots.map(() => createRef<HTMLDivElement>()),
      cleanups = slots.map(() => vi.fn()),
      clicks = slots.map(() => vi.fn());
    const registrations = refs.map((ref, index) =>
      vi.fn((node: HTMLDivElement | null) => {
        (ref as { current: HTMLDivElement | null }).current = node;
        return cleanups[index];
      }),
    );
    const draw = () => (
      <CadenceProvider mode={mode} timeScale={0}>
        <ItemGroup aria-label="Files" {...{ ref: registrations[0], "data-slot": undefined }}>
          <Item ref={registrations[1]} onClick={clicks[1]} style={{ paddingTop: 13 }}>
            <ItemMedia ref={registrations[2]} onClick={clicks[2]}>
              M
            </ItemMedia>
            <ItemContent ref={registrations[3]} onClick={clicks[3]}>
              <ItemTitle ref={registrations[4]} onClick={clicks[4]}>
                Title
              </ItemTitle>
              <ItemDescription ref={registrations[5]} onClick={clicks[5]}>
                Description
              </ItemDescription>
            </ItemContent>
            <ItemActions ref={registrations[6]} onClick={clicks[6]}>
              <button type="button">Open</button>
            </ItemActions>
            <ItemHeader ref={registrations[7]} onClick={clicks[7]}>
              Header
            </ItemHeader>
            <ItemFooter ref={registrations[8]} onClick={clicks[8]}>
              <a href="#footer">Footer</a>
            </ItemFooter>
          </Item>
        </ItemGroup>
      </CadenceProvider>
    );
    const view = render(draw());
    const nodes = refs.map((ref) => ref.current);
    for (let pass = 0; pass < 3; pass += 1) {
      view.rerender(draw());
      nodes.forEach((node, index) => {
        expect(refs[index]?.current).toBe(node);
        if (index) expect(node).toHaveAttribute("data-slot", slots[index]);
        expect(node).toHaveAttribute("data-motion", mode === "full" ? "full" : mode);
      });
    }
    expect((nodes[1] as HTMLElement).style.paddingTop).toBe("13px");
    for (const index of [1, 2, 3, 4, 5, 6, 7, 8]) if (nodes[index]) fireEvent.click(nodes[index] as Element);
    expect(clicks[1]).toHaveBeenCalledTimes(8);
    for (const index of [2, 3, 4, 5, 6, 7, 8]) expect(clicks[index]).toHaveBeenCalled();
    for (const callback of registrations) expect(callback).toHaveBeenCalledTimes(1);
    for (const cleanup of cleanups) expect(cleanup).not.toHaveBeenCalled();
    view.unmount();
    for (const cleanup of cleanups) expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it.each(["full", "reduced", "none"] as const)("executes every row, part and display owner in %s", async (mode) => {
    const draw = (isPresent: boolean, partsPresent: boolean, state: State = {}) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(isPresent, "row")}>
          {row({ ...state, partsPresent })}
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const start = { title: "plan.md", description: "Notes", content: "A", header: "B", footer: "C" };
    const view = render(draw(false, false, start));
    await expectV2MotionAction("item", "item.root.enter", mode, () => view.rerender(draw(true, false, start)));
    const root = view.container.querySelector('[data-slot="item"]');
    expect(root).not.toHaveAttribute("inert");
    const media = view.container.querySelector('[data-slot="item-media"]');
    const actions = view.container.querySelector('[data-slot="item-actions"]');
    expect(media).toHaveAttribute("inert");
    await expectV2MotionAction("item", "item.part.enter", mode, () => view.rerender(draw(true, true, start)));
    expect(media).not.toHaveAttribute("inert");
    expect(actions).not.toHaveAttribute("inert");
    const span = view.container.querySelector<HTMLElement>('[data-slot="item-text"]')?.firstChild;
    await expectV2MotionAction("item", "item.text.replace", mode, () =>
      view.rerender(
        draw(true, true, {
          title: "plan.md current",
          description: "Current notes",
          content: "AA",
          header: "BB",
          footer: "CC",
        }),
      ),
    );
    expect(view.container.querySelector('[data-slot="item-text"]')?.firstChild).toBe(span);
    await expectV2MotionAction(
      "item",
      "item.root.resize",
      mode,
      () =>
        view.rerender(
          draw(true, true, {
            title: "plan.md current revision",
            description: "A longer current note that wraps onto another line",
            content: "AAA",
            header: "BBB",
            footer: "CCC",
          }),
        ),
      { container: view.container, properties: ["height"] },
    );
    await expectV2MotionAction("item", "item.surface.colour", mode, () =>
      view.rerender(draw(true, true, { title: "plan.md current revision", colour: true })),
    );
    await expectV2MotionAction("item", "item.foreground.colour", mode, () =>
      view.rerender(draw(true, true, { colour: false })),
    );
    await expectV2MotionAction("item", "item.media.replace", mode, () =>
      view.rerender(draw(true, true, { media: "second" })),
    );
    expect(view.container.querySelector("[data-media]")).toHaveAttribute("data-media", "second");
    await expectV2MotionAction("item", "item.part.exit", mode, () =>
      view.rerender(draw(true, false, { media: "second" })),
    );
    expect(media).toHaveAttribute("inert");
    expect(media).toHaveAttribute("aria-hidden", "true");
    await expectV2MotionAction("item", "item.root.exit", mode, () => view.rerender(draw(false, false)));
    expect(root).toHaveAttribute("inert");
    expect(root).toHaveAttribute("aria-hidden", "true");
    view.rerender(
      <CadenceProvider mode={mode} timeScale={0}>
        {row({ title: "plan.md", description: "Notes", content: "A", header: "B", footer: "C" })}
      </CadenceProvider>,
    );
    view.rerender(
      <CadenceProvider mode={mode}>
        <Item>
          <ItemTitle>
            <strong>Rich title</strong>
          </ItemTitle>
          <ItemDescription>
            <em>Rich description</em>
          </ItemDescription>
          <ItemContent>
            <strong>Rich content</strong>
          </ItemContent>
          <ItemHeader>
            <strong>Rich header</strong>
          </ItemHeader>
          <ItemFooter>
            <strong>Rich footer</strong>
          </ItemFooter>
        </Item>
      </CadenceProvider>,
    );
    expectMotionContract(mode);
    await expectV2NativeBoundaries("item", { container: view.container });
    view.unmount();
  });

  it.each(["full", "reduced", "none"] as const)(
    "reels direct quantities and keeps the same display span in %s",
    async (mode) => {
      const draw = (value: number) => (
        <CadenceProvider mode={mode} timeScale={0}>
          <Item>
            <ItemHeader>{value}</ItemHeader>
            <ItemContent>{value}</ItemContent>
            <ItemTitle>{value}</ItemTitle>
            <ItemDescription>{value}</ItemDescription>
            <ItemFooter>{value}</ItemFooter>
          </Item>
        </CadenceProvider>
      );
      const view = render(draw(19));
      const spans = Array.from(view.container.querySelectorAll('[data-slot="item-number"]')).map(
        (node) => node.firstChild,
      );
      expect(spans).toHaveLength(5);
      await expectV2MotionAction("item", "item.value.roll", mode, () => view.rerender(draw(20)));
      expect(
        Array.from(view.container.querySelectorAll('[data-slot="item-number"]')).map((node) => node.firstChild),
      ).toEqual(spans);
      expect(
        Array.from(view.container.querySelectorAll('[data-slot="item-number"]')).map((node) => node.textContent),
      ).toEqual(["20", "20", "20", "20", "20"]);
      view.unmount();
    },
  );

  it.each(["full", "reduced", "none"] as const)("places retained rows and enters as a group in %s", async (mode) => {
    const draw = (isPresent: boolean, rows: string[]) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(isPresent, "group")}>
          <ItemGroup aria-label="Files">
            {rows.map((key) => (
              <Item key={key}>
                <ItemContent>
                  <ItemTitle>{key}</ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(false, ["plan.md", "notes.md"]));
    await expectV2MotionAction("item", "item.group.enter", mode, () =>
      view.rerender(draw(true, ["plan.md", "notes.md"])),
    );
    const group = screen.getByRole("group");
    view.rerender(draw(true, ["plan.md", "inserted.md", "notes.md"]));
    expect(screen.getByRole("group")).toBe(group);
    expect(group).not.toHaveAttribute("inert");
    expect(view.container.querySelectorAll('[data-slot="item"]')).toHaveLength(3);
    view.unmount();
  });

  it.each(["full", "reduced", "none"] as const)("keeps the rendered rule on Separator's owners in %s", async (mode) => {
    const draw = (isPresent: boolean, width: number, colour: boolean, vertical = false) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider value={presence(isPresent, "rule")}>
          <ItemGroup aria-label="Files">
            <Item>
              <ItemContent>
                <ItemTitle>plan.md</ItemTitle>
              </ItemContent>
            </Item>
            <ItemSeparator
              orientation={vertical ? "vertical" : "horizontal"}
              style={{
                [vertical ? "height" : "width"]: width,
                backgroundColor: colour ? "#777" : "#555",
              }}
            />
          </ItemGroup>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(false, 80, false));
    await expectV2MotionAction("item", "item.separator.enter", mode, () => view.rerender(draw(true, 80, false)));
    const rule = view.container.querySelector('[data-slot="item-separator"]');
    expect(rule).toHaveAttribute("data-motion", mode);
    view.rerender(draw(true, 160, false, true));
    expect(view.container.querySelector('[data-slot="item-separator"]')).toBe(rule);
    expect(rule).toHaveAttribute("data-orientation", "vertical");
    await expectV2MotionAction("item", "item.separator.colour", mode, () => view.rerender(draw(true, 160, true, true)));
    await expectV2MotionAction("item", "item.separator.exit", mode, () => view.rerender(draw(false, 160, true, true)));
    view.unmount();
  });

  it.each(["full", "reduced", "none"] as const)(
    "keeps native editing, refs, controls and the rendered host in %s",
    async (mode) => {
      const ref = vi.fn();
      const click = vi.fn();
      const draw = (value: string | number, editable = true) => (
        <CadenceProvider mode={mode}>
          <div contentEditable={editable} suppressContentEditableWarning>
            <ItemGroup aria-label="Files">
              <Item ref={ref}>
                <ItemTitle>{value}</ItemTitle>
                <ItemDescription>
                  <em>Rich current note</em>
                </ItemDescription>
                <ItemActions>
                  <button type="button" onClick={click}>
                    Retry
                  </button>
                  <input aria-label="Memo" defaultValue="draft" />
                </ItemActions>
                <span data-native="untouched">Arbitrary row content</span>
              </Item>
            </ItemGroup>
          </div>
        </CadenceProvider>
      );
      const view = render(draw(19));
      const root = view.container.querySelector('[data-slot="item"]') as HTMLElement;
      const input = screen.getByRole("textbox");
      const span = view.container.querySelector('[data-slot="item-number"]');
      const text = span?.firstChild as Text;
      text.replaceData(0, text.length, "Native buffer");
      document.getSelection()?.setBaseAndExtent(text, 3, text, 3);
      for (const value of ["ERR_042", 20, "Current", 22]) {
        view.rerender(draw(value));
        expect(view.container.querySelector('[data-slot="item-text"],[data-slot="item-number"]')).toBe(span);
        expect(span?.firstChild).toBe(text);
        expect(text.data).toBe("Native buffer");
        expect(document.getSelection()?.anchorNode).toBe(text);
      }
      view.rerender(draw(22, false));
      view.rerender(draw(23, false));
      expect(text.data).toBe("23");
      document.getSelection()?.removeAllRanges();
      expect(view.container.querySelector('[data-slot="item"]')).toBe(root);
      expect(screen.getByRole("textbox")).toBe(input);
      fireEvent.change(input, { target: { value: "user draft" } });
      await userEvent.click(screen.getByRole("button", { name: "Retry" }));
      expect(click).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue("user draft");
      expect(ref.mock.calls.filter(([node]) => node === root)).toHaveLength(1);
      expect(root.querySelector("em")?.parentElement?.childElementCount).toBe(1);
      expect(root.querySelector('[data-native="untouched"]')?.textContent).toBe("Arbitrary row content");
      expect(view.container.querySelectorAll('[data-slot="item"]')).toHaveLength(1);
      expectMotionContract(mode, { parts: [root, span as Element] });
      view.unmount();
    },
  );

  it("completes caller-owned removal at zero without keeping a tab stop", async () => {
    const draw = (show: boolean) => (
      <CadenceProvider timeScale={0}>
        <ItemGroup aria-label="Files">
          <AnimatePresence>
            {show && (
              <Item key="row">
                <ItemActions>
                  <button type="button">Dismiss</button>
                </ItemActions>
              </Item>
            )}
          </AnimatePresence>
        </ItemGroup>
      </CadenceProvider>
    );
    const view = render(draw(true));
    view.rerender(draw(false));
    await waitFor(() => expect(view.container.querySelector('[data-slot="item"]')).toBeNull());
    expect(view.container.querySelector('[data-slot="item-actions"]')).toBeNull();
  });
});
