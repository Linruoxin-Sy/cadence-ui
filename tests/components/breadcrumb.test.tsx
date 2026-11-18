import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresenceContext } from "motion/react";
import { Fragment, useState } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/registry/cadence/breadcrumb";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { expectMotionContract } from "../motion-contract";
import { expectV2MotionAction, expectV2NativeBoundaries, prepareV2MotionPlan } from "../motion-v2-contract";

function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/files">Files</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>plan.pdf</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe("Breadcrumb", () => {
  it("is a labelled navigation landmark", () => {
    render(<Trail />);
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toHaveAttribute("data-slot", "breadcrumb");
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);
  });

  it("renders links as anchors with their slot", () => {
    render(<Trail />);
    const home = screen.getByRole("link", { name: "Home" });

    expect(home.tagName).toBe("A");
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("marks the current page and does not link it", () => {
    render(<Trail />);
    const page = screen.getByText("plan.pdf");

    expect(page.closest('[data-slot="breadcrumb-page"]')).toHaveAttribute("data-slot", "breadcrumb-page");
    expect(page.closest('[data-slot="breadcrumb-page"]')).toHaveAttribute("aria-current", "page");
    expect(page.closest('[data-slot="breadcrumb-page"]')?.tagName).toBe("SPAN");
  });

  it("swaps the link element through render, keeping the router's own component", () => {
    render(
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="/files" data-router="true" />}>Files</BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>,
    );

    const link = screen.getByRole("link", { name: "Files" });
    expect(link).toHaveAttribute("data-router", "true");
    expect(link).toHaveAttribute("data-slot", "breadcrumb-link");
  });

  it("hides separators and the ellipsis from assistive tech", () => {
    render(<Trail />);

    for (const separator of document.querySelectorAll('[data-slot="breadcrumb-separator"]')) {
      expect(separator).toHaveAttribute("aria-hidden", "true");
      expect(separator).toHaveAttribute("role", "presentation");
    }

    const ellipsis = document.querySelector('[data-slot="breadcrumb-ellipsis"]');
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("More")).toHaveClass("sr-only");
  });

  it("keeps the native ol/li structure and each caller ref", () => {
    const list = { current: null };
    const link = { current: null };
    render(
      <BreadcrumbList ref={list}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" ref={link}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>,
    );
    expect(list.current).toBe(document.querySelector('[data-slot="breadcrumb-list"]'));
    expect(link.current).toBe(screen.getByRole("link", { name: "Home" }));
    expect((list.current as unknown as HTMLElement).tagName).toBe("OL");
  });
});

const modes = ["full", "reduced", "none"] as const;
type Mode = (typeof modes)[number];
type Paint = { link?: string; page?: string; separator?: string; ellipsis?: string };

const presence = (id: string, isPresent: boolean) => ({
  id,
  initial: false as const,
  isPresent,
  register: () => () => {},
  onExitComplete: () => {},
});

/**
 * Exactly one host per owned slot: one item, one separator, one ellipsis, one link
 * label and one page label. The ellipsis sits directly in the list so its own
 * projection has one host; the shipped examples nest it inside its item, where it
 * follows that item instead of writing a second transform.
 */
function Scene({ mode, frame }: { mode: Mode; frame: Frame }) {
  return (
    <CadenceProvider mode={mode} timeScale={0}>
      <Breadcrumb aria-label="Owners">
        <PresenceContext.Provider value={presence("breadcrumb-list", frame.list)}>
          <BreadcrumbList>
            <PresenceContext.Provider value={presence("breadcrumb-crumb", frame.crumb)}>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home" style={frame.paint?.link ? { color: frame.paint.link } : undefined}>
                  {frame.link}
                </BreadcrumbLink>
                <BreadcrumbPage style={frame.paint?.page ? { color: frame.paint.page } : undefined}>
                  {frame.page}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator style={frame.paint?.separator ? { color: frame.paint.separator } : undefined} />
              <BreadcrumbEllipsis style={frame.paint?.ellipsis ? { color: frame.paint.ellipsis } : undefined} />
            </PresenceContext.Provider>
          </BreadcrumbList>
        </PresenceContext.Provider>
      </Breadcrumb>
    </CadenceProvider>
  );
}

type Frame = { list: boolean; crumb: boolean; link: string; page: string; paint?: Paint };
const initial: Frame = { list: true, crumb: true, link: "Home", page: "Plan" };

function slot(name: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
  if (!element) throw new Error(`no [data-slot="${name}"] in the document`);
  return element;
}

describe("Breadcrumb v2 owners", () => {
  beforeAll(() => prepareV2MotionPlan());

  it.each(modes)("executes every owned action in %s", async (mode) => {
    let frame = { ...initial };
    const draw = () => <Scene mode={mode} frame={frame} />;
    const view = render(draw());
    const update = (next: Partial<Frame>) => {
      frame = { ...frame, ...next };
      view.rerender(draw());
    };
    const owned = (binding: string, exercise: () => void | Promise<void>) =>
      expectV2MotionAction("breadcrumb", `breadcrumb.${binding}`, mode, exercise).catch((error) => {
        throw new Error(`${binding}: ${(error as Error).message}`);
      });

    // The list owns its own entrance on a committed insertion.
    update({ list: false });
    await owned("list.enter", () => update({ list: true }));

    // A committed rename is a path revision: retained crumbs project, the owned host
    // size follows, and only changed graphemes are replaced.
    await owned("item.move", () => update({ link: "Home page", page: "Plan.pdf" }));
    expect(slot("breadcrumb-link-text").textContent).toBe("Home page");
    expect(slot("breadcrumb-page-text").textContent).toBe("Plan.pdf");
    await owned("list.resize", () => update({ link: "Home page two", page: "Plan.pdf v2" }));
    await owned("label.replace", () => update({ link: "Workspace", page: "cadence" }));

    // Every text owner keeps its own scoped foreground clock.
    await owned("text.colour", () =>
      update({
        paint: { link: "#202020", page: "#303030", separator: "#404040", ellipsis: "#505050" },
      }),
    );

    // A retained crumb keeps its host across a presence revision.
    const item = slot("breadcrumb-item");
    await owned("item.exit", () => update({ crumb: false }));
    expect(slot("breadcrumb-item")).toBe(item);
    expect(item).toHaveAttribute("aria-hidden", "true");
    await owned("item.enter", () => update({ crumb: true }));
    expect(item).not.toHaveAttribute("aria-hidden");

    expectMotionContract(mode, { policy: ["color"] });
  });

  it.each(modes)("keeps one mode on one set of hosts in %s", async (mode) => {
    const draw = (next: Mode) => (
      <CadenceProvider mode={next}>
        <Breadcrumb aria-label="Downgrade">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Plan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CadenceProvider>
    );
    const view = render(draw("full"));
    const list = slot("breadcrumb-list");
    expect(list).toHaveAttribute("data-motion", "full");
    view.rerender(draw(mode));
    for (const name of [
      "breadcrumb-list",
      "breadcrumb-item",
      "breadcrumb-separator",
      "breadcrumb-link",
      "breadcrumb-page",
      "breadcrumb-link-text",
      "breadcrumb-page-text",
    ])
      expect(slot(name)).toHaveAttribute("data-motion", mode);
    // No CSS size clock survives on the owned surfaces.
    expect(list.className).not.toContain("transition-[");
    for (const node of [list, slot("breadcrumb-item")])
      expect(node.getAnimations?.().filter((animation) => "animationName" in animation) ?? []).toHaveLength(0);
  });

  it("keeps the token foreground clock when the caller supplies no palette", () => {
    render(
      <CadenceProvider mode="full">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </CadenceProvider>,
    );
    const link = slot("breadcrumb-link");
    expect(link.style.transitionProperty).toBe("color");
    expect(parseFloat(link.style.transitionDuration)).toBeGreaterThan(0);
  });

  it("leaves the surface and quantity rows to their native boundaries", () => {
    const view = render(
      <CadenceProvider mode="none">
        <Breadcrumb aria-label="Boundaries">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Plan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </CadenceProvider>,
    );
    return expectV2NativeBoundaries("breadcrumb", { container: view.container });
  });
});

/** A caller-owned path that grows and shrinks keeps surviving ancestor identity. */
function ChangingTrail() {
  const [trail, setTrail] = useState(["plan"]);
  const [label, setLabel] = useState("Files");
  return (
    <CadenceProvider mode="none">
      <button type="button" onClick={() => setTrail([...trail, `plan-${trail.length + 1}`])}>
        Add
      </button>
      <button type="button" onClick={() => setTrail(trail.slice(0, 1))}>
        Remove
      </button>
      <button type="button" onClick={() => setLabel("Documents")}>
        Rename
      </button>
      <Breadcrumb aria-label="Changing">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/files">{label}</BreadcrumbLink>
          </BreadcrumbItem>
          {trail.map((id) => (
            <Fragment key={id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{id}</BreadcrumbPage>
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </CadenceProvider>
  );
}

describe("Breadcrumb path revisions", () => {
  it("keeps surviving ancestor identity across inserted crumbs and a rename", async () => {
    const user = userEvent.setup();
    render(<ChangingTrail />);
    const home = screen.getByRole("link", { name: "Home" });
    const files = screen.getByRole("link", { name: "Files" });
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(4);
    expect(screen.getByRole("link", { name: "Home" })).toBe(home);
    expect(screen.getByRole("link", { name: "Files" })).toBe(files);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("link", { name: "Home" })).toBe(home);
    await user.click(screen.getByRole("button", { name: "Rename" }));
    expect(files).toHaveTextContent("Documents");
    expect(files).toHaveAttribute("href", "/files");
    expect(screen.getByRole("link", { name: "Home" })).toBe(home);
  });
});
