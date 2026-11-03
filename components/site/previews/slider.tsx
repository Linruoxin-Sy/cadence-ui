"use client";

import { useState } from "react";
import { Button } from "@/registry/cadence/button";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { Slider } from "@/registry/cadence/slider";
import { PreviewStack } from "./shell";

export function VolumeSlider() {
  const [volume, setVolume] = useState(68);
  return (
    <div className="grid w-full max-w-72 gap-3">
      <p className="flex items-center justify-between gap-4 text-sm">
        <span>Volume</span>
        <span className="text-muted-foreground tabular-nums">{volume}%</span>
      </p>
      <Slider aria-label="Volume" value={volume} onValueChange={setVolume} />
    </div>
  );
}

export function ControlledSlider() {
  const [volume, setVolume] = useState(60);
  const [committed, setCommitted] = useState<number | null>(null);
  return (
    <div className="grid w-full max-w-72 gap-4">
      <Slider value={volume} onValueChange={setVolume} onValueCommitted={setCommitted} aria-label="Controlled volume" />
      <p role="status" className="text-sm text-muted-foreground tabular-nums">
        Volume: {volume}%; last committed: {committed === null ? "not changed" : `${committed}%`}
      </p>
      <Button variant="outline" size="sm" onClick={() => setVolume(60)}>
        Reset volume
      </Button>
    </div>
  );
}

export function PriceRange() {
  const [price, setPrice] = useState([120, 480]);
  return (
    <div className="grid w-full max-w-72 gap-3">
      <p className="text-sm tabular-nums">
        Price: ${price[0]} – ${price[1]}
      </p>
      <Slider
        value={price}
        onValueChange={setPrice}
        min={0}
        max={600}
        step={10}
        minStepsBetweenValues={2}
        format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
        locale="en-US"
        aria-label="Price"
      />
    </div>
  );
}

export function VerticalSlider() {
  return <Slider orientation="vertical" defaultValue={64} className="h-40" aria-label="Level" />;
}

export function DisabledSlider() {
  return (
    <div className="grid w-full max-w-72 gap-3">
      <p className="text-sm text-muted-foreground">Volume unavailable: 40%</p>
      <Slider defaultValue={40} disabled aria-label="Unavailable volume" />
    </div>
  );
}

export function SliderCollisions() {
  return (
    <div className="grid w-full max-w-72 gap-6">
      {(["push", "swap", "none"] as const).map((behavior) => (
        <div key={behavior} className="grid gap-3">
          <p className="text-sm">{behavior === "none" ? "Clamped" : behavior === "push" ? "Push" : "Swap"}</p>
          <Slider defaultValue={[30, 60]} thumbCollisionBehavior={behavior} aria-label={`${behavior} range`} />
        </div>
      ))}
    </div>
  );
}

export function SliderAlignment() {
  return (
    <div className="grid w-full max-w-72 gap-6">
      {(["edge", "center", "edge-client-only"] as const).map((alignment) => (
        <div key={alignment} className="grid gap-3">
          <p className="text-sm">{alignment}</p>
          <Slider defaultValue={0} thumbAlignment={alignment} aria-label={`${alignment} alignment`} />
        </div>
      ))}
    </div>
  );
}

export function StaticSlider() {
  return (
    <CadenceProvider mode="none">
      <div className="grid w-full max-w-72 gap-6">
        <div data-testid="initial-none">
          <Slider defaultValue={50} aria-label="Static slider" />
        </div>
        <CadenceProvider mode="full">
          <Slider defaultValue={50} aria-label="Explicit full slider" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function SliderPreview({ example }: { example?: string }) {
  return (
    <PreviewStack>
      {example === "controlled" ? (
        <ControlledSlider />
      ) : example === "range" ? (
        <PriceRange />
      ) : example === "vertical" ? (
        <VerticalSlider />
      ) : example === "disabled" ? (
        <DisabledSlider />
      ) : example === "collisions" ? (
        <SliderCollisions />
      ) : example === "alignment" ? (
        <SliderAlignment />
      ) : example === "without-motion" ? (
        <StaticSlider />
      ) : (
        <VolumeSlider />
      )}
    </PreviewStack>
  );
}
