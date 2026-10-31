"use client";

import { useState } from "react";
import { Slider } from "@/registry/cadence/slider";
import { PreviewStack } from "./shell";

/**
 * One thumb, two thumbs, no thumb: the single value, the range, and the disabled
 * slider — then the vertical orientation, which takes its height from the box around
 * it rather than from the track. The readout beside each is the specimen's own label,
 * not a caption.
 */
export function SliderPreview() {
  const [volume, setVolume] = useState([68]);
  const [price, setPrice] = useState([120, 480]);

  return (
    <PreviewStack>
      <div className="flex items-start gap-10">
        <div className="grid w-72 gap-6">
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Volume</span>
              <span className="text-muted-foreground tabular-nums">{volume[0]}%</span>
            </div>
            <Slider aria-label="Volume" value={volume} onValueChange={(next) => setVolume([next[0] ?? 0])} max={100} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Price range</span>
              <span className="text-muted-foreground tabular-nums">
                ${price[0]} – ${price[1]}
              </span>
            </div>
            <Slider
              aria-label="Price range"
              value={price}
              onValueChange={(next) => setPrice([next[0] ?? 0, next[1] ?? 0])}
              min={0}
              max={600}
              step={10}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Disabled</span>
              <span className="tabular-nums">40%</span>
            </div>
            <Slider aria-label="Disabled" defaultValue={[40]} disabled />
          </div>
        </div>

        <div className="grid justify-items-center gap-2">
          <Slider aria-label="Vertical" orientation="vertical" defaultValue={[64]} className="h-32" />
          <span className="text-xs text-muted-foreground">Vertical</span>
        </div>
      </div>
    </PreviewStack>
  );
}
