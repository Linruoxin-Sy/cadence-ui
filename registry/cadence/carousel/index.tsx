"use client";

import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import * as React from "react";
import { Button } from "../button";
import { cn } from "../lib/cn";

import { carouselClock, transitionFor } from "../lib/motion";
import { useCadenceMotion, useCadenceMotionScope, useEngineEnvironment, withCadenceScope } from "../lib/provider";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const { cm, ref: scopeRef, element } = useCadenceMotionScope(props.ref);
  // Resolve the full base even while restricted; never reconstruct it from reduced output.
  const authored = cm.reduced
    ? transitionFor("data.transition", "full", { timeScale: cm.timeScale }, cm.scope)
    : cm.transition("data.transition");
  const clock = Number(authored.duration) * carouselClock.unitsPerSecond;
  const settings = React.useRef({ reduced: cm.reduced, clock, opts });
  const initialClock = React.useRef(clock);
  const nativeOptions = React.useMemo(
    () => ({
      duration: initialClock.current,
      ...opts,
      axis: orientation === "horizontal" ? ("x" as const) : ("y" as const),
    }),
    [opts, orientation],
  );
  const supplied = React.useRef(nativeOptions);
  const active = React.useRef<CarouselApi>(undefined);
  const flight = React.useRef<{
    engine: ReturnType<NonNullable<CarouselApi>["internalEngine"]>;
    running: boolean;
    generation: number;
    direct: boolean;
  } | null>(null);
  const refresh = React.useRef(() => {});
  const settle = React.useCallback(() => {
    const engine = active.current?.internalEngine();
    if (!engine) return;
    // biome-ignore lint/correctness/useHookAtTopLevel: Embla engine method, not a React hook.
    engine.scrollBody.useDuration(0);
    // Direct tracking belongs to Embla. A downgrade is never navigation to an older snap.
    const current = flight.current;
    if (engine.dragHandler.pointerDown() || current?.direct) return;
    const generation = current?.generation;
    const valid = () =>
      flight.current === current &&
      current?.generation === generation &&
      active.current?.internalEngine() === engine &&
      !current?.direct &&
      !engine.dragHandler.pointerDown();
    if (!current?.running && engine.scrollBody.settled()) {
      engine.animation.stop();
      return;
    }
    engine.animation.update();
    engine.animation.render(1);
    if (!valid()) return;
    engine.animation.update();
    // The first render commits the target offset. Let the same native owner
    // complete an actual running flight, then remove its queued RAF immediately.
    if (current?.running) engine.animation.render(1);
    if (!valid()) return;
    engine.animation.stop();
  }, []);
  const environment = useEngineEnvironment(element, settle);
  React.useLayoutEffect(() => {
    settings.current = { reduced: cm.reduced, clock, opts };
    supplied.current = nativeOptions;
    refresh.current();
    if (cm.reduced || clock === 0 || environment.blocked.current) settle();
  }, [cm.reduced, clock, opts, nativeOptions, environment.blocked, settle]);
  // Keep plugin identity stable: mode changes must preserve selection and drag state.
  const policy = React.useMemo<NonNullable<CarouselPlugin>[number]>(() => {
    let cleanup = () => {};
    // Track provenance only; values always come from the actual fresh engine.
    let explicit = false;
    let configured = false;
    const breakpoints = new Map<string, boolean>();
    const configure = (options: CarouselOptions) => {
      if (!options) return;
      if (Object.hasOwn(options, "duration")) explicit = true;
      for (const [query, value] of Object.entries(options.breakpoints ?? {})) {
        if (Object.hasOwn(value, "duration")) breakpoints.set(query, true);
      }
    };
    return {
      name: "cadenceMotion",
      options: {},
      init(embla) {
        if (!configured) {
          configure(useEmblaCarousel.globalOptions);
          // The React seed overrides a global top-level duration; global media
          // durations still participate in the actual native merge at creation.
          explicit = Object.hasOwn(settings.current.opts ?? {}, "duration");
          configure(settings.current.opts);
          configured = true;
        }
        active.current = embla;
        const engine = embla.internalEngine();
        const current = { engine, running: false, generation: 0, direct: false };
        flight.current = current;
        const originalStart = engine.animation.start;
        const originalStop = engine.animation.stop;
        const start = () => {
          current.generation++;
          current.running = true;
          originalStart();
        };
        const stop = () => {
          current.generation++;
          current.running = false;
          originalStop();
        };
        engine.animation.start = start;
        engine.animation.stop = stop;
        let requested = engine.options.duration;
        const prepare = () => {
          if (
            requested > 0 &&
            !settings.current.reduced &&
            settings.current.clock > 0 &&
            environment.blocked.current &&
            !environment.revalidate.current()
          )
            original(requested);
        };
        const originalIndex = engine.scrollTo.index,
          originalDistance = engine.scrollTo.distance;
        const after = (generation: number) => {
          if (
            flight.current === current &&
            current.generation === generation &&
            !current.direct &&
            (settings.current.reduced || settings.current.clock === 0 || environment.blocked.current)
          )
            settle();
        };
        const index: typeof originalIndex = (...args) => {
          const generation = ++current.generation;
          prepare();
          originalIndex(...args);
          after(generation);
        };
        const distance: typeof originalDistance = (...args) => {
          const generation = ++current.generation;
          prepare();
          originalDistance(...args);
          after(generation);
        };
        engine.scrollTo.index = index;
        engine.scrollTo.distance = distance;
        const body = engine.scrollBody;
        const original = body.useDuration;
        const originalBase = body.useBaseDuration;
        const owned =
          !explicit &&
          ![...breakpoints].some(([query]) => embla.rootNode().ownerDocument.defaultView?.matchMedia(query).matches);
        let last = engine.options.duration;
        let ownsDefault = owned;
        refresh.current = () => {
          // A plugin may replace the effective option after init. Never overwrite that owner.
          if (engine.options.duration !== last) ownsDefault = false;
          if (ownsDefault) engine.options.duration = settings.current.clock;
          last = engine.options.duration;
        };
        refresh.current();
        const duration = (value: number) => {
          requested = value;
          const restricted = settings.current.reduced || settings.current.clock === 0;
          const blocked = environment.blocked.current;
          return original(restricted || blocked ? 0 : value);
        };
        duration(engine.options.duration);
        body.useDuration = duration;
        const baseDuration = () => duration(engine.options.duration);
        body.useBaseDuration = baseDuration;
        const begin = () => {
          current.direct = true;
        };
        const release = () => {
          current.direct = false;
          // biome-ignore lint/correctness/useHookAtTopLevel: Embla engine method, not a React hook.
          body.useDuration(engine.options.duration);
          if (body.duration() === 0) {
            const generation = current.generation;
            queueMicrotask(() => {
              if (flight.current === current && current.generation === generation) settle();
            });
          }
        };
        const originalReInit = embla.reInit;
        const reInit: typeof embla.reInit = (options, plugins) => {
          if (options === supplied.current) explicit = Object.hasOwn(settings.current.opts ?? {}, "duration");
          else configure(options);
          // The real engine retains its optionsBase and performs the actual merge/media selection.
          if (options === supplied.current)
            for (const [query, value] of Object.entries(settings.current.opts?.breakpoints ?? {}))
              if (Object.hasOwn(value, "duration")) breakpoints.set(query, true);
          originalReInit(options, plugins);
        };
        embla.reInit = reInit;
        embla.on("pointerUp", release);
        embla.on("pointerDown", begin);
        cleanup = () => {
          if (body.useDuration === duration) body.useDuration = original;
          if (body.useBaseDuration === baseDuration) body.useBaseDuration = originalBase;
          if (embla.reInit === reInit) embla.reInit = originalReInit;
          if (engine.animation.start === start) engine.animation.start = originalStart;
          if (engine.animation.stop === stop) engine.animation.stop = originalStop;
          if (engine.scrollTo.index === index) engine.scrollTo.index = originalIndex;
          if (engine.scrollTo.distance === distance) engine.scrollTo.distance = originalDistance;
          if (flight.current === current) flight.current = null;
          embla.off("pointerUp", release);
          embla.off("pointerDown", begin);
          if (active.current === embla) active.current = undefined;
          refresh.current = () => {};
        };
      },
      destroy() {
        cleanup();
      },
    };
  }, [environment.blocked, environment.revalidate, settle]);
  // Keep native options stable when only mode changes; the policy clamps the runtime clock.
  const [carouselRef, api] = useEmblaCarousel(nativeOptions, [policy, ...(plugins ?? [])]);
  React.useLayoutEffect(() => {
    if (api && (cm.reduced || clock === 0 || environment.blocked.current)) settle();
  }, [api, cm.reduced, clock, environment.blocked, settle]);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api.off("reInit", onSelect);
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  return withCadenceScope(
    cm,
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      {/* biome-ignore lint/a11y/useSemanticElements: Upstream requires a div with native div props/ref. */}
      <div
        data-motion={cm.mode}
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
        ref={scopeRef}
      >
        {children}
      </div>
    </CarouselContext.Provider>,
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel();
  const cm = useCadenceMotion();

  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content" data-motion={cm.mode}>
      <div
        data-motion={cm.mode}
        className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    // biome-ignore lint/a11y/useSemanticElements: Upstream slide is a div, not a fieldset.
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={(state) =>
        cn(
          "absolute size-8 rounded-full",
          orientation === "horizontal"
            ? "top-1/2 -left-12 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          typeof className === "function" ? className(state) : className,
        )
      }
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon-sm",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={(state) =>
        cn(
          "absolute size-8 rounded-full",
          orientation === "horizontal"
            ? "top-1/2 -right-12 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          typeof className === "function" ? className(state) : className,
        )
      }
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export { Carousel, type CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel };
