"use client";

import { useState } from "react";
import { AnimatedText } from "@/registry/cadence/animated-text";
import { Button } from "@/registry/cadence/button";
import { PreviewRow } from "./shell";

export function AnimatedTextPreview() {
  const [saved, setSaved] = useState(false);
  return (
    <PreviewRow>
      <Button variant="outline" onClick={() => setSaved(!saved)}>
        Rename display
      </Button>
      <AnimatedText value={saved ? "Saved" : "Save"} />
      <AnimatedText value={saved ? "Changes saved" : "Save changes"} granularity="word" />
    </PreviewRow>
  );
}
