import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/cadence/card";

function Example({ size }: { size?: "default" | "sm" }) {
  return (
    <Card size={size}>
      <CardHeader>
        <CardTitle>Parity plan</CardTitle>
        <CardDescription>Nine batches.</CardDescription>
        <CardAction>Action</CardAction>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  );
}

describe("Card", () => {
  it("renders every part with its slot", () => {
    render(<Example />);

    expect(screen.getByText("Parity plan")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Nine batches.")).toHaveAttribute("data-slot", "card-description");
    expect(screen.getByText("Action")).toHaveAttribute("data-slot", "card-action");
    expect(screen.getByText("Body")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");

    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card).toHaveAttribute("data-size", "default");
    expect(screen.getByText("Parity plan").closest('[data-slot="card-header"]')).toBeInTheDocument();
  });

  it("exposes size through data-size", () => {
    render(<Example size="sm" />);
    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card).toHaveAttribute("data-size", "sm");
  });

  it("is a plain container, not a landmark", () => {
    render(<Example />);
    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card?.tagName).toBe("DIV");
    expect(card).not.toHaveAttribute("role");
  });
});

/**
 * jsdom lays nothing out, so the observed size has to be handed to the card: the
 * stub records what was observed and lets the test deliver a delivery on demand,
 * and `getBoundingClientRect` reports a height the test can change between
 * deliveries.
 */
function stubResizeObserver() {
  const observers: { elements: Element[]; fire: () => void }[] = [];

  vi.stubGlobal(
    "ResizeObserver",
    class {
      elements: Element[] = [];
      private callback: () => void;

      constructor(callback: () => void) {
        this.callback = callback;
        observers.push(this);
      }

      observe(element: Element) {
        this.elements.push(element);
      }

      unobserve(element: Element) {
        this.elements = this.elements.filter((entry) => entry !== element);
      }

      disconnect() {
        this.elements = [];
      }

      fire() {
        this.callback();
      }
    },
  );

  return observers;
}

function stubContentHeight(height: { current: number }) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () =>
      ({
        width: 200,
        height: height.current,
        top: 0,
        left: 0,
        right: 200,
        bottom: height.current,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );
}

describe("Card fit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the default card free of a wrapper", () => {
    render(<Example />);
    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    expect(card).not.toHaveAttribute("data-fit");
    expect(screen.getByText("Parity plan").closest('[data-slot="card"]')).toBe(card);
  });

  it("wraps the parts in a measured flow box", () => {
    render(
      <Card fit="content">
        <CardHeader>
          <CardTitle>Parity plan</CardTitle>
        </CardHeader>
        <CardContent>Body</CardContent>
      </Card>,
    );

    const card = screen.getByText("Parity plan").closest('[data-slot="card"]');
    const flow = screen.getByText("Body").closest('[data-slot="card-flow"]');

    expect(card).toHaveAttribute("data-fit", "content");
    expect(flow?.parentElement).toBe(card);
    expect(flow?.contains(screen.getByText("Parity plan"))).toBe(true);
  });

  it("observes the content, not the shell", () => {
    const observers = stubResizeObserver();
    stubContentHeight({ current: 120 });

    render(
      <Card fit="content">
        <CardContent>Body</CardContent>
      </Card>,
    );

    const flow = screen.getByText("Body").closest('[data-slot="card-flow"]');
    expect(observers).toHaveLength(1);
    expect(observers[0]?.elements).toEqual([flow]);
  });

  it("leaves the height to the layout until there is something to measure", () => {
    stubResizeObserver();
    stubContentHeight({ current: 0 });

    render(
      <Card fit="content">
        <CardContent>Body</CardContent>
      </Card>,
    );

    const card = screen.getByText("Body").closest('[data-slot="card"]') as HTMLElement;
    expect(card.style.height).toBe("");
  });

  it("pins the shell to the height each delivery reports", () => {
    const observers = stubResizeObserver();
    const height = { current: 120 };
    stubContentHeight(height);

    render(
      <Card fit="content">
        <CardContent>Body</CardContent>
      </Card>,
    );

    const card = screen.getByText("Body").closest('[data-slot="card"]') as HTMLElement;
    expect(card.style.height).toBe("120px");

    height.current = 180;
    observers[0]?.fire();

    expect(card.style.height).toBe("180px");
  });

  it("hands the shell back to the parent on unmount", () => {
    const observers = stubResizeObserver();
    stubContentHeight({ current: 120 });

    const { unmount } = render(
      <Card fit="content">
        <CardContent>Body</CardContent>
      </Card>,
    );

    const card = screen.getByText("Body").closest('[data-slot="card"]') as HTMLElement;
    expect(card.style.height).toBe("120px");

    unmount();
    expect(card.style.height).toBe("");
    expect(observers[0]?.elements).toEqual([]);
  });
});
