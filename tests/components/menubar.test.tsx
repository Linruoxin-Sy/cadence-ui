import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { beforeAll, describe, expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/registry/cadence/menubar";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];

function Demo({ mode }: { mode?: Mode }) {
  return (
    <CadenceProvider mode={mode}>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>File actions</MenubarLabel>
            <MenubarItem>
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarCheckboxItem defaultChecked>Sidebar</MenubarCheckboxItem>
            <MenubarRadioGroup defaultValue="comfortable">
              <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
              <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>Move to</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Backlog</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarItem variant="destructive">Delete</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Zoom</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </CadenceProvider>
  );
}

describe("Menubar", () => {
  it("renders the bar as a menubar with one tab stop", () => {
    render(<Demo />);

    const bar = screen.getByRole("menubar");
    expect(bar).toHaveAttribute("data-slot", "menubar");
    expect(bar).toHaveAttribute("data-motion", "full");
    expect(screen.getAllByRole("menuitem", { expanded: false })).toHaveLength(2);
  });

  it("opens a menu from its trigger", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "File" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /Save/ })).toHaveAttribute("data-slot", "menubar-item");
  });

  it("keeps the menubar slots on the parts it composes", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));

    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(pageSlot("menubar-label")).toBeInTheDocument();
    expect(pageSlot("menubar-checkbox-item")).toBeInTheDocument();
    expect(pageSlot("menubar-radio-group")).toBeInTheDocument();
    expect(pageSlot("menubar-radio-item")).toBeInTheDocument();
    expect(pageSlot("menubar-sub-trigger")).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Sidebar" })).toHaveAttribute("aria-checked", "true");
  });

  it("moves to the next menu with ArrowRight once one is open", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    await userEvent.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute("aria-expanded", "true"),
    );
    expect(screen.getByRole("menuitem", { name: "Zoom" })).toBeInTheDocument();
  });

  it("carries the mode from the provider onto the bar, its trigger and its panel", async () => {
    render(<Demo mode="reduced" />);

    expect(screen.getByRole("menubar")).toHaveAttribute("data-motion", "reduced");
    expect(screen.getByRole("menuitem", { name: "File" })).toHaveAttribute("data-motion", "reduced");
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    const panel = pageSlot("menubar-content");
    expect(panel).toHaveAttribute("data-motion", "reduced");
    expect(panel.className).not.toContain("scale-(--motion-scale-in)");
  });

  it("keeps the bar's own paint scoped and its strip on native layout", () => {
    render(<Demo />);
    const bar = screen.getByRole("menubar");
    // The bar's colour owner writes scoped transition properties inline, never classes:
    // the strip itself is native flex layout, so no class-level clock is authored here.
    expect(bar.getAttribute("data-cadence-color")).toContain("background-color");
    expect(bar.className).not.toContain("transition-");
    expect(pageSlot("menubar-trigger-text")).toHaveAttribute("data-motion", "full");
  });

  it("keeps a plain trigger label as its own owned display slot", async () => {
    render(<Demo />);
    await userEvent.click(screen.getByRole("menuitem", { name: "File" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());

    for (const slot of [
      "menubar-trigger-text",
      "dropdown-menu-item-text",
      "dropdown-menu-checkbox-item-text",
      "dropdown-menu-radio-item-text",
      "dropdown-menu-sub-trigger-text",
      "dropdown-menu-label-text",
      "dropdown-menu-shortcut-text",
    ])
      expect(pageSlot(slot)).toHaveAttribute("data-motion", "full");
  });

  it("keeps an unverified caller palette immediate on the bar", () => {
    render(
      <CadenceProvider mode="full">
        <Menubar style={{ backgroundColor: "black", color: "white" }} />
      </CadenceProvider>,
    );
    expect(screen.getByRole("menubar").style.transitionDuration).toBe("0s");
  });
});

/** Menu parts portal into `document.body`, so a container query would find nothing. */
function pageSlot(slot: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
  if (!element) throw new Error(`no [data-slot="${slot}"] in the document`);
  return element;
}

it.each(modes)("asserts the shared %s motion contract", async (mode) => {
  render(<Demo mode={mode} />);
  await userEvent.click(screen.getByRole("menuitem", { name: "View" }));
  await screen.findByRole("menu");
  expectMotionContract(mode, { policy: ["color"] });
});

type Frame = {
  open: boolean;
  labels: boolean;
  menuLabels: boolean;
  bar: boolean;
  trigger: boolean;
  row: boolean;
  surface: boolean;
  foreground: boolean;
  separator: boolean;
  checked: boolean;
  radio: "" | "a";
};

const triggerLabels = { file: "File" };
const renamedTriggers = { file: "Files" };

const menuLabels = {
  label: "Pull request",
  item: "Edit",
  shortcut: "⌘E",
  checkbox: "Description",
  radio: "Compact",
  sub: "Move to",
};

const renamedMenuLabels = {
  label: "Pull requests",
  item: "Rename",
  shortcut: "⌘R",
  checkbox: "Description shown",
  radio: "Compact rows",
  sub: "Move into",
};

type OpenChange = NonNullable<React.ComponentProps<typeof MenubarMenu>["onOpenChange"]>;

/**
 * One controlled menu whose every inherited owner has a real caller-controlled
 * revision: the bar/trigger paint, the four row variants, the shell, the label and
 * shortcut foreground, the separator rule, the selection marks, the six menu text
 * slots and the trigger label. `timeScale: 0` keeps the evidence about the owned
 * revision rather than about jsdom's missing layout engine.
 */
function Scene({ mode, frame, onOpenChange }: { mode: Mode; frame: Frame; onOpenChange: OpenChange }) {
  const trigger = frame.labels ? renamedTriggers : triggerLabels;
  const menu = frame.menuLabels ? renamedMenuLabels : menuLabels;
  const bar = frame.bar ? { backgroundColor: "#202020", color: "#fafafa", borderTopColor: "#404040" } : undefined;
  const triggerPaint = frame.trigger ? { backgroundColor: "#303030", color: "#ededed" } : undefined;
  const row = frame.row ? { backgroundColor: "#313131", color: "#e0e0e0" } : undefined;
  const surface = frame.surface ? { backgroundColor: "#232323", color: "#f0f0f0" } : undefined;
  const foreground = frame.foreground ? { color: "#123456" } : undefined;
  const rule = frame.separator ? { backgroundColor: "#444444" } : undefined;

  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Menubar style={bar}>
        <MenubarMenu open={frame.open} onOpenChange={onOpenChange}>
          <MenubarTrigger style={triggerPaint}>{trigger.file}</MenubarTrigger>
          <MenubarContent style={surface}>
            <MenubarLabel style={foreground}>{menu.label}</MenubarLabel>
            <MenubarItem style={row}>{menu.item}</MenubarItem>
            <MenubarShortcut style={foreground}>{menu.shortcut}</MenubarShortcut>
            <MenubarCheckboxItem
              checked={frame.checked}
              style={row}
              onCheckedChange={() => {
                /* the frame owns the accepted value */
              }}
            >
              {menu.checkbox}
            </MenubarCheckboxItem>
            <MenubarRadioGroup
              value={frame.radio}
              onValueChange={() => {
                /* the frame owns the accepted value */
              }}
            >
              <MenubarRadioItem value="a" style={row}>
                {menu.radio}
              </MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSeparator style={rule} />
            <MenubarSub>
              <MenubarSubTrigger style={row}>{menu.sub}</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Nested</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </CadenceProvider>
  );
}

describe("Menubar v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned action in %s", async (mode) => {
    let frame: Frame = {
      open: true,
      labels: false,
      menuLabels: false,
      bar: false,
      trigger: false,
      row: false,
      surface: false,
      foreground: false,
      separator: false,
      checked: false,
      radio: "",
    };
    let view: ReturnType<typeof render>;
    const onOpenChange: OpenChange = (open, details) => {
      // Keep the closing surface mounted so the owned exit can actually run; Base UI
      // still decides when the portal may leave after its own completion.
      if (!open) details.preventUnmountOnClose();
      frame = { ...frame, open };
      view.rerender(scene());
    };
    const scene = () => <Scene mode={mode} frame={frame} onOpenChange={onOpenChange} />;
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(scene());
    };

    view = render(scene());
    await screen.findByRole("menu");

    // The bar entrance is an independent insertion, proven separately below.
    await expectV2MotionAction("menubar", "menubar.trigger-label.change", mode, () => update({ labels: true }));
    await expectV2MotionAction("menubar", "menubar.root.colour", mode, () => update({ bar: true }));
    await expectV2MotionAction("menubar", "menubar.trigger.colour", mode, () => update({ trigger: true }));

    // Each menu row owns its merged pointer/checked/disabled/destructive palette.
    await expectV2MotionAction("menubar", "menubar.item.colour", mode, () => update({ row: true }));
    // The popup shell owns its own surface, Label/Shortcut their foreground and the
    // Separator its rule — all inherited from the mounted dropdown-menu.
    await expectV2MotionAction("menubar", "menubar.surface.colour", mode, () => update({ surface: true }));
    await expectV2MotionAction("menubar", "menubar.foreground.colour", mode, () => update({ foreground: true }));
    await expectV2MotionAction("menubar", "menubar.separator.colour", mode, () => update({ separator: true }));

    // A checkbox stays independent and the radio change is the same checked transaction.
    await expectV2MotionAction("menubar", "menubar.indicator.select", mode, () =>
      update({ checked: true, radio: "a" }),
    );
    expect(screen.getByRole("menuitemcheckbox", { name: menuLabels.checkbox })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: menuLabels.radio })).toHaveAttribute("aria-checked", "true");

    // A committed content revision is one measured shell transaction.
    await expectV2MotionAction("menubar", "menubar.content.resize", mode, () => update({ menuLabels: true }));

    // The six inherited menu display slots keep their own changed runs.
    await expectV2MotionAction("menubar", "menubar.label.change", mode, () =>
      update({ menuLabels: false, labels: false }),
    );

    await expectV2MotionAction("menubar", "menubar.content.exit", mode, async () => {
      await userEvent.keyboard("{Escape}");
    });
    await expectV2MotionAction("menubar", "menubar.content.enter", mode, () => update({ open: true }));

    expectMotionContract(mode, { policy: ["color"] });
    // Composed quantities stay a static boundary with no Cadence writer.
    await expectV2NativeBoundaries("menubar", { container: document.body });
  });

  it.each(modes)("runs the retained bar's presence in %s", async (mode) => {
    const draw = (present: boolean) => (
      <CadenceProvider mode={mode} timeScale={0}>
        <PresenceContext.Provider
          value={{
            id: "menubar-retention",
            isPresent: present,
            initial: false,
            register: () => () => {},
            onExitComplete: () => {},
          }}
        >
          <Menubar aria-label="Retained">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
            </MenubarMenu>
          </Menubar>
        </PresenceContext.Provider>
      </CadenceProvider>
    );
    const view = render(draw(true));
    const bar = screen.getByRole("menubar");
    await expectV2MotionAction("menubar", "menubar.root.exit", mode, () => view.rerender(draw(false)));
    // A retained exiting bar is no longer a live landmark or tab target.
    expect(bar).toHaveAttribute("inert");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    await expectV2MotionAction("menubar", "menubar.root.enter", mode, () => view.rerender(draw(true)));
    expect(bar).not.toHaveAttribute("inert");
    // The retained host survives its own presence envelope instead of remounting.
    expect(screen.getByRole("menubar")).toBe(bar);
    expect(bar).toHaveAttribute("data-motion", mode);
  });

  it("settles a live full to reduced to none downgrade on one bar", async () => {
    const draw = (next: Mode) => (
      <CadenceProvider mode={next}>
        <Menubar>
          <MenubarMenu open>
            <MenubarTrigger>Downgrade</MenubarTrigger>
            <MenubarContent>
              <MenubarItem style={{ backgroundColor: "#303030" }}>One</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    await screen.findByRole("menu");
    const bar = screen.getByRole("menubar");
    const trigger = screen.getByRole("menuitem", { name: "Downgrade" });

    view.rerender(draw("reduced"));
    expect(bar).toHaveAttribute("data-motion", "reduced");
    expect(trigger).toHaveAttribute("data-motion", "reduced");

    view.rerender(draw("none"));
    expect(bar).toHaveAttribute("data-motion", "none");
    expect(trigger).toHaveAttribute("data-motion", "none");
    for (const node of [bar, trigger])
      expect(node.getAnimations?.().filter((animation) => "animationName" in animation) ?? []).toHaveLength(0);
  });

  it("keeps sibling bars isolated on equal labels", async () => {
    render(
      <CadenceProvider mode="full" timeScale={0}>
        <Menubar style={{ backgroundColor: "#303030" }}>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
        <Menubar style={{ backgroundColor: "#313131" }}>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      </CadenceProvider>,
    );
    const bars = [...document.querySelectorAll<HTMLElement>('[data-slot="menubar"]')];
    expect(bars).toHaveLength(2);
    expect(bars[0]?.style.backgroundColor).toBe("rgb(48, 48, 48)");
    expect(bars[1]?.style.backgroundColor).toBe("rgb(49, 49, 49)");
  });
});
