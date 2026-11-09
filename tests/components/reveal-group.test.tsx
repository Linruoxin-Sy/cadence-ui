import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Reveal } from "@/registry/cadence/reveal";
import { RevealGroup } from "@/registry/cadence/reveal-group";
import { expectMotionContract } from "../motion-contract";

it.each(["full", "reduced", "none"] as const)("%s coordinates real targets with no group DOM", (mode) => {
  const view = render(
    <CadenceProvider mode={mode}>
      <RevealGroup stagger="cycle">
        <Reveal>
          <button type="button">Read</button>
          <Reveal>Nested</Reveal>
        </Reveal>
        <Reveal>Sibling</Reveal>
      </RevealGroup>
    </CadenceProvider>,
  );
  const parts = Array.from(view.container.querySelectorAll<HTMLElement>('[data-slot="reveal"]'));
  expectMotionContract(mode, {
    parts,
    behavior: () => {
      expect(view.container.firstElementChild?.children).toHaveLength(2);
      expect(parts).toHaveLength(3);
      expect(parts.every((n) => !n.hasAttribute("data-cadence-reveal"))).toBe(true);
    },
  });
});

it("preserves keyed hosts and native state across reorder and equivalent policy", () => {
  const ui = (ids: string[], amount = 0.08) => (
    <RevealGroup amount={amount}>
      {ids.map((id) => (
        <Reveal key={id} data-testid={id}>
          <input aria-label={id} defaultValue={id} />
        </Reveal>
      ))}
    </RevealGroup>
  );
  const view = render(ui(["a", "b"]));
  const a = view.getByTestId("a"),
    input = view.getByLabelText("a") as HTMLInputElement;
  input.value = "native edit";
  view.rerender(ui(["b", "a", "c"]));
  expect(view.getByTestId("a")).toBe(a);
  expect(input).toHaveValue("native edit");
  view.rerender(ui(["a", "c"], 0.2));
  expect(view.getByTestId("a")).toBe(a);
  expect(a).not.toHaveAttribute("data-cadence-reveal");
});
