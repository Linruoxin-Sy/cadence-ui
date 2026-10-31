"use client";

import { Bold, Italic, Underline } from "lucide-react";
import { Button } from "@/registry/cadence/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/cadence/button-group";

export function ButtonGroupPreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Horizontal</p>
        <ButtonGroup aria-label="Text style">
          <Button variant="outline" size="icon-sm" aria-label="Bold">
            <Bold />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Italic">
            <Italic />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Underline">
            <Underline />
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
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Vertical</p>
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
      </div>
    </div>
  );
}
