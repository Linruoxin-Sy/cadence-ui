"use client";

import { Badge } from "@/registry/cadence/badge/badge";
import { Button } from "@/registry/cadence/button/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/cadence/card/card";

export function CardPreview() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Parity plan</CardTitle>
          <CardDescription>57 components, nine batches, one release train.</CardDescription>
          <CardAction>
            <Badge variant="secondary">0.2.0</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Batch B1 ships the eleven atoms: button, badge, kbd, separator, label, input, textarea, card, aspect ratio,
            avatar, skeleton.
          </p>
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
          <CardDescription>One custom property sets the spacing for every part.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <code>size="sm"</code> turns 1.5rem of padding into 1rem, and the header, body, and footer follow.
          </p>
        </CardContent>
        <CardFooter className="border-t">
          <span className="text-xs text-muted-foreground">data-slot=card-footer</span>
        </CardFooter>
      </Card>
    </div>
  );
}
