"use client";

import { Inbox, Plus } from "lucide-react";
import { Button } from "@/registry/cadence/button/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/registry/cadence/empty/empty";

export function EmptyPreview() {
  return (
    <div className="flex flex-col gap-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
          <EmptyTitle>No invoices yet</EmptyTitle>
          <EmptyDescription>
            Invoices you send will land here. Start with a template, or import the last export.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm">
            <Plus />
            Create invoice
          </Button>
          <p className="text-xs text-muted-foreground">Nothing is deleted when you clear this list.</p>
        </EmptyContent>
      </Empty>

      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Empty without a media slot</EmptyTitle>
          <EmptyDescription>The header stacks the title and description; the icon is optional.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
