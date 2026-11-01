"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/registry/cadence/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/registry/cadence/carousel";

export function CarouselPreview() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const [vertical, setVertical] = useState(false);
  const [rtl, setRtl] = useState(false);
  const [free, setFree] = useState(false);
  const [drag, setDrag] = useState(true);
  const [loop, setLoop] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [count, setCount] = useState(4);
  const [pluginReady, setPluginReady] = useState(false);
  const plugins = useMemo(
    () => [
      {
        name: "exampleStatus",
        options: {},
        init() {
          setPluginReady(true);
        },
        destroy() {
          setPluginReady(false);
        },
      },
    ],
    [],
  );
  useEffect(() => {
    if (!api) return;
    const update = () => setCurrent(api.selectedScrollSnap() + 1);
    update();
    api.on("select", update).on("reInit", update);
    return () => {
      api.off("select", update).off("reInit", update);
    };
  }, [api]);
  return (
    <div className="flex min-w-0 w-full max-w-lg flex-col items-center gap-5">
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setVertical(!vertical)}>
          Toggle orientation
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLoop(!loop)}>
          Toggle loop
        </Button>
        <Button size="sm" variant="outline" onClick={() => setNarrow(!narrow)}>
          Resize track
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCount(count === 4 ? 5 : 4)}>
          Change slides
        </Button>
        <Button size="sm" variant="outline" onClick={() => api?.scrollTo(count - 1, false)}>
          Go to last slide
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setRtl(!rtl)}>
          Toggle RTL
        </Button>
        <Button size="sm" variant="outline" onClick={() => setFree(!free)}>
          Toggle free drag
        </Button>
        <Button size="sm" variant="outline" onClick={() => setDrag(!drag)}>
          Toggle dragging
        </Button>
      </div>
      <div className="w-full px-12 py-12">
        <Carousel
          aria-label="Project highlights"
          tabIndex={0}
          setApi={setApi}
          plugins={plugins}
          orientation={vertical ? "vertical" : "horizontal"}
          dir={rtl ? "rtl" : "ltr"}
          opts={{
            loop,
            align: "start",
            direction: rtl ? "rtl" : "ltr",
            dragFree: free,
            watchDrag: drag,
            breakpoints: { "(max-width: 480px)": { duration: 37 } },
          }}
          className={
            narrow
              ? "mx-auto w-3/4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              : "w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          }
        >
          <CarouselContent className={vertical ? "h-48 touch-pan-x" : "touch-pan-y"}>
            {[1, 2, 3, 4, 5].slice(0, count).map((slide) => (
              <CarouselItem key={slide} aria-label={`${slide} of ${count}`}>
                <div className="flex h-44 items-center justify-center rounded-xl border bg-muted text-4xl font-semibold">
                  {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Slide {current} of {count}
        {pluginReady ? " · Ready" : ""}
      </p>
    </div>
  );
}
