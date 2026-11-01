"use client";

import { useState } from "react";
import { Slider } from "@/registry/cadence/slider";
import { ControlMotionScope } from "./control-motion-scope";
import { usePreviewVariant } from "./use-preview-variant";

const previewVariantOptions = ["horizontal", "vertical"] as const;

/**
 * One thumb, two thumbs, no thumb: the single value, the range, and the disabled
 * slider — then the vertical orientation, which takes its height from the box around
 * it rather than from the track. The readout beside each is the specimen's own label,
 * not a caption.
 */
export function SliderPreview() {
  const { control, choose } = usePreviewVariant("Slider", previewVariantOptions);
  const [volume, setVolume] = useState([68]);
  const [price, setPrice] = useState([120, 480]);

  return (
    <>
      {control}
      <ControlMotionScope
        staticControl={
          <Slider
            style={{ height: choose("horizontal") === "vertical" ? 128 : undefined }}
            aria-label="Static slider"
            value={50}
            className="max-w-20"
            orientation={choose("horizontal")}
          />
        }
      >
        <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:gap-10">
          <div className="grid w-full max-w-72 gap-6">
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>Volume</span>
                <span className="text-muted-foreground tabular-nums">{volume[0]}%</span>
              </div>
              <Slider
                style={{ height: choose("horizontal") === "vertical" ? 128 : undefined }}
                aria-label="Volume"
                value={volume}
                onValueChange={(next) => setVolume([next[0] ?? 0])}
                max={100}
                orientation={choose("horizontal")}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>Price range</span>
                <span className="text-muted-foreground tabular-nums">
                  ${price[0]} – ${price[1]}
                </span>
              </div>
              <Slider
                style={{ height: choose("horizontal") === "vertical" ? 128 : undefined }}
                aria-label="Price range"
                value={price}
                onValueChange={(next) => setPrice([next[0] ?? 0, next[1] ?? 0])}
                min={0}
                max={600}
                step={10}
                orientation={choose("horizontal")}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Disabled</span>
                <span className="tabular-nums">40%</span>
              </div>
              <Slider
                style={{ height: choose("horizontal") === "vertical" ? 128 : undefined }}
                aria-label="Disabled"
                defaultValue={[40]}
                disabled
                orientation={choose("horizontal")}
              />
            </div>
          </div>

          <div className="grid justify-items-center gap-2">
            <Slider
              style={{ height: choose("horizontal") === "vertical" ? 128 : undefined }}
              aria-label="Vertical"
              orientation={choose("vertical")}
              defaultValue={[64]}
              className="h-32"
            />
            <span className="text-xs text-muted-foreground">Vertical</span>
          </div>
        </div>
      </ControlMotionScope>
    </>
  );
}
