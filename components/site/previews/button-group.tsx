"use client";

import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/cadence/button-group";
import { PreviewRow, PreviewStack } from "./shell";

/**
 * Two orientations, and the two ways a group holds non-buttons: `ButtonGroupText` for
 * a readout, `ButtonGroupSeparator` for the rule between segments. A group only
 * removes the inner radii — everything else is still a `Button`.
 */
export function ButtonGroupPreview() {
  return (
    <PreviewStack>
      <PreviewRow className="gap-4">
        <ButtonGroup aria-label="Text style">
          <Button variant="outline" size="icon-sm" aria-label="Bold">
            <BoldIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Italic">
            <ItalicIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Underline">
            <UnderlineIcon />
          </Button>
        </ButtonGroup>

        <ButtonGroup aria-label="Zoom">
          <ButtonGroupText>-</ButtonGroupText>
          <Button variant="outline" size="sm">
            100%
          </Button>
          <ButtonGroupSeparator />
          <ButtonGroupText>+</ButtonGroupText>
        </ButtonGroup>
      </PreviewRow>

      <PreviewRow>
        <ButtonGroup orientation="vertical" aria-label="Order">
          <Button variant="outline" size="sm">
            Move up
          </Button>
          <Button variant="outline" size="sm">
            Move down
          </Button>
          <Button variant="outline" size="sm">
            Duplicate
          </Button>
        </ButtonGroup>
      </PreviewRow>
    </PreviewStack>
  );
}
