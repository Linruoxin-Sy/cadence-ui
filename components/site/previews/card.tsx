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

/**
 * The card's characteristics are its parts, not a `variant` prop: header with a
 * title, description and a corner action, then content and footer — and `size`,
 * which repoints `--card-spacing` for every part at once.
 *
 * A grid, not a row: two cards of different content must still read as one pair, so
 * the columns are equal and both cards stretch to the taller one.
 */
export function CardPreview() {
  const [expanded, setExpanded] = useState(false);
  const fitRef = useRef<HTMLDivElement>(null);
  return (
    <PreviewStack>
      <div className="grid w-full max-w-lg grid-cols-1 sm:grid-cols-2 items-stretch gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Parity plan</CardTitle>
            <CardDescription>58 components, ten batches.</CardDescription>
            <CardAction>
              <Badge variant="secondary">0.2.0</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Batch B1 ships the eleven atoms.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              Open plan
            </Button>
          </CardFooter>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Compact</CardTitle>
            <CardDescription>1.5rem of padding becomes 1rem.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Every part follows one property.</p>
          </CardContent>
          <CardFooter>
            <span className="text-xs text-muted-foreground">size=&quot;sm&quot;</span>
          </CardFooter>
        </Card>
      </div>
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
    </PreviewStack>
  );
}
