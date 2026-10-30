"use client";

import { useState } from "react";
import { Label } from "@/registry/cadence/label/label";
import { Slider } from "@/registry/cadence/slider/slider";

export function SliderPreview() {
  const [volume, setVolume] = useState([68]);
  const [price, setPrice] = useState([120, 480]);

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="slider-volume">Volume</Label>
          <span className="text-sm text-muted-foreground tabular-nums">{volume[0]}%</span>
        </div>
        <Slider id="slider-volume" value={volume} onValueChange={(next) => setVolume([next[0] ?? 0])} max={100} />
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="slider-price">Price range</Label>
          <span className="text-sm text-muted-foreground tabular-nums">
            ${price[0]} – ${price[1]}
          </span>
        </div>
        <Slider
          id="slider-price"
          value={price}
          onValueChange={(next) => setPrice([next[0] ?? 0, next[1] ?? 0])}
          min={0}
          max={600}
          step={10}
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="slider-disabled">Disabled</Label>
        <Slider id="slider-disabled" defaultValue={[40]} disabled />
      </div>
    </div>
  );
}
