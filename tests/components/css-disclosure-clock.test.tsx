import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../registry/cadence/accordion";
import { Collapsible, CollapsibleContent } from "../../registry/cadence/collapsible";
import { CadenceProvider } from "../../registry/cadence/lib/provider";

describe("CSS disclosure local clock ownership", () => {
  for (const kind of ["accordion", "collapsible"])
    it(`${kind} restores nested full, inherits clock and preserves caller style/state and node`, () => {
      const content =
        kind === "accordion" ? (
          <Accordion defaultValue={["a"]}>
            <AccordionItem value="a">
              <AccordionTrigger>Open</AccordionTrigger>
              <AccordionContent style={(state) => ({ color: state.open ? "red" : "blue" })}>Body</AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <Collapsible defaultOpen>
            <CollapsibleContent style={(state) => ({ color: state.open ? "red" : "blue" })}>Body</CollapsibleContent>
          </Collapsible>
        );
      const fixture = (mode: "full" | "reduced" | "none", timeScale?: number) => (
        <CadenceProvider mode="none" timeScale={4}>
          <CadenceProvider mode={mode} timeScale={timeScale}>
            {content}
          </CadenceProvider>
        </CadenceProvider>
      );
      const view = render(fixture("full"));
      const panel = view.container.querySelector(`[data-slot="${kind}-content"]`) as HTMLElement;
      expect(panel.style.getPropertyValue("--motion-duration-slow")).toBe("1.28s");
      expect(panel.style.color).toBe("red");
      view.rerender(fixture("full", 2));
      expect(panel.style.getPropertyValue("--motion-duration-slow")).toBe("0.64s");
      view.rerender(fixture("reduced"));
      expect(view.container.querySelector(`[data-slot="${kind}-content"]`)).toBe(panel);
      expect(panel.className).toContain("duration-0");
      view.rerender(fixture("none"));
      expect(panel.style.getPropertyValue("--motion-duration-slow")).toBe("0s");
      expect(panel).toHaveAttribute("data-motion", "none");
    });
});
