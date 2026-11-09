"use client";

import { useState } from "react";
import { AnimatedNumber } from "@/registry/cadence/animated-number";
import { Button } from "@/registry/cadence/button";
import { PreviewRow } from "./shell";

export function AnimatedNumberPreview() {
  const [value, setValue] = useState(19);
  return (
    <PreviewRow>
      <Button variant="outline" onClick={() => setValue(value === 19 ? 20 : 19)}>
        Update quantity
      </Button>
      <AnimatedNumber value={value} />
      <AnimatedNumber value={value} locales="en-US" format={{ style: "currency", currency: "USD" }} />
    </PreviewRow>
  );
}
