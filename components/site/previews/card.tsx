"use client";

import { useRef, useState } from "react";
import { Badge } from "@/registry/cadence/badge";
import { Button } from "@/registry/cadence/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/cadence/card";
import { PreviewStack } from "./shell";

function CardHeaderAction() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Workspace setup</CardTitle>
        <CardDescription>Connect your first project.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" render={<a href="/docs/installation" />}>
            Setup
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Install a component to get started.</CardContent>
    </Card>
  );
}

function CardSizes() {
  return (
    <div className="grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
      {(["default", "sm"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <CardTitle>{size === "sm" ? "Compact" : "Default"}</CardTitle>
            <CardDescription>Workspace summary</CardDescription>
          </CardHeader>
          <CardContent>Every part follows one spacing property.</CardContent>
          <CardFooter>
            <span className="text-xs text-muted-foreground">size=&quot;{size}&quot;</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function ContentSizedCard() {
  const [expanded, setExpanded] = useState(false);
  const fitRef = useRef<HTMLDivElement>(null);
  return (
    <div className="grid w-full max-w-lg grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
      <Card fit="content" ref={fitRef} data-testid="fit-card" className="max-w-sm">
        <CardHeader>
          <CardTitle>Content fit</CardTitle>
        </CardHeader>
        <CardContent>
          {expanded
            ? "The surface follows its own content immediately. A caller ref still reaches the same measured shell while the text wraps as the viewport narrows."
            : "Short content."}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setExpanded((value) => !value)}>
            Toggle content
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Normal grid item</CardTitle>
          <CardDescription>This card stretches with its row.</CardDescription>
        </CardHeader>
        <CardContent>
          A longer summary can fill more vertical space. The content-sized neighbour keeps its own measured height
          rather than inheriting this card’s height.
        </CardContent>
      </Card>
    </div>
  );
}

function CardBoundaries() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="border-b">
        <CardTitle>Release notes</CardTitle>
        <CardDescription>Review the latest changes.</CardDescription>
      </CardHeader>
      <CardContent>Components, fixes and documentation updates.</CardContent>
      <CardFooter className="border-t">
        <Button variant="outline" render={<a href="/docs/changelog" />}>
          Read changelog
        </Button>
      </CardFooter>
    </Card>
  );
}

function CardSpecimen() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>A home for your component library.</CardDescription>
        <CardAction>
          <Badge variant="secondary">Team</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>Reusable components, shared tokens and clear documentation.</CardContent>
      <CardFooter>
        <Button variant="outline" render={<a href="/docs/installation" />}>
          Open setup
        </Button>
      </CardFooter>
    </Card>
  );
}

const examples = {
  "header-action": CardHeaderAction,
  sizes: CardSizes,
  "content-sized": ContentSizedCard,
  boundaries: CardBoundaries,
};

export function CardPreview({ example }: { example?: string }) {
  if (example !== undefined) {
    const Example = examples[example as keyof typeof examples];
    if (!Example) throw new Error(`Unknown Card example: ${example}`);
    return (
      <PreviewStack>
        <Example />
      </PreviewStack>
    );
  }
  return (
    <PreviewStack>
      <CardSpecimen />
    </PreviewStack>
  );
}
