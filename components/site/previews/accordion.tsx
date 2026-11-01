"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/registry/cadence/accordion";
import { Button } from "@/registry/cadence/button";

export function AccordionPreview() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Accordion className="w-full max-w-lg" defaultValue={["install"]}>
      <AccordionItem value="install">
        <AccordionTrigger>How do I install a component?</AccordionTrigger>
        <AccordionContent>
          Install from the Cadence registry. The source is copied into your project, ready to customise.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="motion">
        <AccordionTrigger>Can I reduce the motion?</AccordionTrigger>
        <AccordionContent>
          <p>Yes. Your system preference is respected, and the provider can disable motion entirely.</p>
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            Toggle details
          </Button>
          {expanded && (
            <p className="mt-4">
              Disclosure heights update instantly in reduced and none modes. Full mode follows the measured content
              height and can reverse while moving.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>Upcoming integrations</AccordionTrigger>
        <AccordionContent>Not available yet.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
