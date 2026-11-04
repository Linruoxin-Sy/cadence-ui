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
  useCarousel,
} from "@/registry/cadence/carousel";
import { CadenceProvider } from "@/registry/cadence/lib/provider";
import { PreviewStack } from "./shell";

export function BasicExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Project highlights"
        tabIndex={0}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export function MultipleExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Project pairs"
        tabIndex={0}
        opts={{ align: "start" }}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`} className="md:basis-1/2">
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export function VerticalExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Vertical updates"
        tabIndex={0}
        orientation="vertical"
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="h-40 touch-pan-x">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export function LoopingExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Looping projects"
        tabIndex={0}
        opts={{ loop: true, align: "start" }}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export function RtlExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="RTL projects"
        tabIndex={0}
        opts={{ direction: "rtl", align: "start" }}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        dir="rtl"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export function DragExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <div className="grid gap-12">
        <div className="grid gap-3">
          <p className="text-sm font-medium">Snapping drag</p>
          <Carousel
            aria-label="Snapping drag"
            tabIndex={0}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Free drag</p>
          <Carousel
            aria-label="Free drag"
            tabIndex={0}
            opts={{ dragFree: true }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Buttons only</p>
          <Carousel
            aria-label="Buttons only"
            tabIndex={0}
            opts={{ watchDrag: false }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export function AlignmentExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <div className="grid gap-12">
        <div className="grid gap-3">
          <p className="text-sm font-medium">Alignment: start</p>
          <Carousel
            aria-label="Align start"
            tabIndex={0}
            opts={{ align: "start", containScroll: false, startIndex: 1 }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`} className="basis-2/3">
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Alignment: center</p>
          <Carousel
            aria-label="Align center"
            tabIndex={0}
            opts={{ align: "center", containScroll: false, startIndex: 1 }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`} className="basis-2/3">
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium">Alignment: end</p>
          <Carousel
            aria-label="Align end"
            tabIndex={0}
            opts={{ align: "end", containScroll: false, startIndex: 1 }}
            className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CarouselContent className="touch-pan-y">
              {[1, 2, 3, 4].map((slide) => (
                <CarouselItem key={slide} aria-label={`${slide} of 4`} className="basis-2/3">
                  <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                    {slide}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export function ChangingExample() {
  const [narrow, setNarrow] = useState(false);
  const [count, setCount] = useState(4);
  return (
    <div className="grid w-full max-w-lg gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setNarrow(!narrow)}>
          Resize track
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCount(count === 4 ? 5 : 4)}>
          Change slides
        </Button>
      </div>
      <div className="px-12 py-12">
        <Carousel
          aria-label="Changing projects"
          tabIndex={0}
          opts={{ align: "start" }}
          className={`${narrow ? "mx-auto w-3/4" : "w-full"} outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        >
          <CarouselContent className="touch-pan-y">
            {[1, 2, 3, 4, 5].slice(0, count).map((slide) => (
              <CarouselItem key={slide} aria-label={`${slide} of ${count}`}>
                <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                  {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
}

export function ApiExample() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(1);
  const [ready, setReady] = useState(false);
  const plugins = useMemo(
    () => [
      {
        name: "exampleStatus",
        options: {},
        init() {
          setReady(true);
        },
        destroy() {
          setReady(false);
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
    <div className="grid w-full max-w-lg gap-4">
      <Button size="sm" variant="outline" onClick={() => api?.scrollTo(3, false)}>
        Go to last slide
      </Button>
      <div className="px-12 py-12">
        <Carousel
          aria-label="API projects"
          tabIndex={0}
          className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          setApi={setApi}
          plugins={plugins}
          opts={{ breakpoints: { "(max-width: 480px)": { duration: 37 } } }}
        >
          <CarouselContent className="touch-pan-y">
            {[1, 2, 3, 4].map((slide) => (
              <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                  {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
      <p role="status" className="text-center text-sm text-muted-foreground">
        Slide {current} of 4{ready ? " · Ready" : ""}
      </p>
    </div>
  );
}

function ProjectControls() {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <Button size="sm" variant="outline" disabled={!canScrollPrev} onClick={scrollPrev}>
        Earlier project
      </Button>
      <Button size="sm" disabled={!canScrollNext} onClick={scrollNext}>
        Later project
      </Button>
    </div>
  );
}

export function CustomControlsExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <Carousel
        aria-label="Custom project controls"
        tabIndex={0}
        className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CarouselContent className="touch-pan-y">
          {[1, 2, 3, 4].map((slide) => (
            <CarouselItem key={slide} aria-label={`${slide} of 4`}>
              <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                {slide}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <ProjectControls />
      </Carousel>
    </div>
  );
}

export function WithoutMotionExample() {
  return (
    <div className="w-full max-w-lg px-12 py-12">
      <div className="grid gap-12">
        <CadenceProvider mode="none">
          <div className="grid gap-3">
            <p className="text-sm font-medium">Fixed none</p>
            <Carousel
              aria-label="Immediate projects"
              tabIndex={0}
              className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CarouselContent className="touch-pan-y">
                {[1, 2, 3, 4].map((slide) => (
                  <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                    <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </CadenceProvider>
        <CadenceProvider mode="full">
          <div className="grid gap-3">
            <p className="text-sm font-medium">Nested full</p>
            <Carousel
              aria-label="Nested full projects"
              tabIndex={0}
              className="w-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CarouselContent className="touch-pan-y">
                {[1, 2, 3, 4].map((slide) => (
                  <CarouselItem key={slide} aria-label={`${slide} of 4`}>
                    <div className="flex h-36 items-center justify-center rounded-xl border bg-muted text-3xl font-semibold">
                      {slide}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </CadenceProvider>
      </div>
    </div>
  );
}

export function CarouselPreview({ example }: { example?: string }) {
  const examples: Record<string, React.ReactNode> = {
    multiple: <MultipleExample />,
    vertical: <VerticalExample />,
    looping: <LoopingExample />,
    rtl: <RtlExample />,
    drag: <DragExample />,
    "changing-slides": <ChangingExample />,
    api: <ApiExample />,
    alignment: <AlignmentExample />,
    "custom-controls": <CustomControlsExample />,
    "without-motion": <WithoutMotionExample />,
  };
  return <PreviewStack>{example ? examples[example] : <BasicExample />}</PreviewStack>;
}
