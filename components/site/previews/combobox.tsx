"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import * as React from "react";
import { Button } from "@/registry/cadence/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from "@/registry/cadence/combobox";
import { CadenceProvider } from "@/registry/cadence/lib/provider";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];
function Options() {
  return (
    <>
      <ComboboxEmpty>No framework found.</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );
}
function Picker({
  label,
  side = "bottom",
  align = "start",
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  align?: "start" | "center" | "end";
}) {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput className="w-56 max-w-full" aria-label={label} placeholder={label} />
      <ComboboxContent side={side} align={align}>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

function GroupedPicker() {
  const groups = [
    { value: "Frontend", items: ["React", "Vue", "Svelte"] },
    { value: "Backend", items: ["Go", "Rust", "Elixir"] },
  ];
  return (
    <Combobox items={groups}>
      <ComboboxInput className="w-56 max-w-full" aria-label="Stack" placeholder="Choose a stack" />
      <ComboboxContent>
        <ComboboxEmpty>No stack found.</ComboboxEmpty>
        <ComboboxList>
          {(group: (typeof groups)[number], index: number) => (
            <React.Fragment key={group.value}>
              {index > 0 && <ComboboxSeparator />}
              <ComboboxGroup items={group.items}>
                <ComboboxLabel>{group.value}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            </React.Fragment>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function PickerControls() {
  return (
    <div className="flex flex-wrap gap-4">
      {[
        { label: "Trigger only", showTrigger: true, showClear: false },
        { label: "Clear and trigger", showTrigger: true, showClear: true },
        { label: "Clear only", showTrigger: false, showClear: true },
        { label: "Input only", showTrigger: false, showClear: false },
      ].map((props) => (
        <Combobox key={props.label} items={frameworks} defaultValue="Astro">
          <ComboboxInput
            className="w-48 max-w-full"
            aria-label={props.label}
            showTrigger={props.showTrigger}
            showClear={props.showClear}
          />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  );
}

function TopicEditor({ removable }: { removable: boolean }) {
  const anchor = useComboboxAnchor();
  const topics = ["Design", "Docs", "Testing", "Release"];
  return (
    <Combobox multiple items={topics} defaultValue={["Design", "Docs"]}>
      <ComboboxChips ref={anchor} className="w-64 max-w-full">
        <ComboboxValue>
          {(value: string[]) => (
            <>
              {value.map((topic) => (
                <ComboboxChip key={topic} showRemove={removable}>
                  {topic}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label={removable ? "Editable topics" : "Topics without remove buttons"}
                placeholder="Add topic"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No topic found.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
function TopicPickers() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <TopicEditor removable />
      <TopicEditor removable={false} />
    </div>
  );
}

function PickerStates() {
  const error = React.useId();
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Combobox items={frameworks} disabled defaultValue="Remix">
        <ComboboxInput className="w-48 max-w-full" disabled aria-label="Disabled framework" />
        <ComboboxContent>
          <Options />
        </ComboboxContent>
      </Combobox>
      <Combobox items={frameworks} readOnly defaultValue="Astro">
        <ComboboxInput className="w-48 max-w-full" aria-label="Read-only framework" />
        <ComboboxContent>
          <Options />
        </ComboboxContent>
      </Combobox>
      <div className="grid gap-2">
        <Combobox items={frameworks}>
          <ComboboxInput
            className="w-56 max-w-full"
            aria-label="Required framework"
            aria-invalid="true"
            aria-describedby={error}
            placeholder="Choose an available framework"
          />
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item} disabled={item === "Nuxt.js"}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p id={error} className="text-sm text-destructive">
          Choose an available framework.
        </p>
      </div>
    </div>
  );
}

function ControlledPicker() {
  const [value, setValue] = React.useState<string | null>("Remix");
  const [query, setQuery] = React.useState("Remix");
  const [open, setOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState("Not submitted");
  return (
    <form
      noValidate
      className="grid justify-items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get("framework") ?? ""));
      }}
    >
      <Combobox
        items={frameworks}
        name="framework"
        value={value}
        onValueChange={setValue}
        inputValue={query}
        onInputValueChange={setQuery}
        open={open}
        onOpenChange={setOpen}
      >
        <ComboboxInput className="w-56 max-w-full" aria-label="Controlled framework" showClear />
        <ComboboxContent>
          <Options />
        </ComboboxContent>
      </Combobox>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setValue("Astro");
            setQuery("Astro");
          }}
        >
          Set Astro externally
        </Button>
        <Button type="submit">Submit selection</Button>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        Selected: {value ?? "none"}; submitted: {submitted}
      </p>
    </form>
  );
}

function ObjectPicker() {
  const people = [
    { id: "ada", name: "Ada Lovelace" },
    { id: "grace", name: "Grace Hopper" },
    { id: "margaret", name: "Margaret Hamilton" },
  ];
  const [value, setValue] = React.useState<(typeof people)[number] | null>({ id: "ada", name: "Ada Lovelace" });
  return (
    <div className="grid gap-3">
      <Combobox
        items={people}
        value={value}
        onValueChange={setValue}
        itemToStringLabel={(person) => person.name}
        itemToStringValue={(person) => person.id}
        isItemEqualToValue={(a, b) => a.id === b.id}
      >
        <ComboboxInput className="w-64 max-w-full" aria-label="Assignee" showClear />
        <ComboboxContent>
          <ComboboxEmpty>No person found.</ComboboxEmpty>
          <ComboboxList>
            {(person: (typeof people)[number]) => (
              <ComboboxItem key={person.id} value={person}>
                {person.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p role="status" className="text-sm text-muted-foreground">
        Assignee id: {value?.id ?? "none"}
      </p>
    </div>
  );
}

function ResultPicker() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<string[]>(["London", "Paris", "Tokyo"]);
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    setPending(true);
    Promise.resolve(
      ["London", "Paris", "Tokyo"].filter((city) => city.toLowerCase().includes(query.toLowerCase())),
    ).then((next) => {
      if (active) {
        setResults(next);
        setPending(false);
      }
    });
    return () => {
      active = false;
    };
  }, [query]);
  return (
    <div className="grid gap-2">
      <Combobox items={results} filter={null} onInputValueChange={setQuery}>
        <ComboboxInput className="w-56 max-w-full" aria-label="City" placeholder="Search a city" />
        <ComboboxContent>
          {pending ? (
            <p role="status" className="p-2 text-sm">
              Searching cities…
            </p>
          ) : (
            <ComboboxEmpty>No city found.</ComboboxEmpty>
          )}
          <ComboboxList>
            {(city: string) => (
              <ComboboxItem key={city} value={city}>
                {city}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <p role="status" className="text-sm text-muted-foreground">
        {pending ? "Searching" : `${results.length} cities returned`}
      </p>
    </div>
  );
}

function HighlightPickers() {
  return (
    <div className="flex flex-wrap gap-4">
      {[false, true].map((automatic) => (
        <Combobox key={String(automatic)} items={frameworks} autoHighlight={automatic} loopFocus={!automatic}>
          <ComboboxInput
            className="w-56 max-w-full"
            aria-label={automatic ? "Automatic bounded highlight" : "Manual looping highlight"}
            placeholder={automatic ? "Automatic, bounded" : "Manual, looping"}
          />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  );
}

function PickerSides() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Picker key={side} label={`Side ${side}`} side={side} />
      ))}
    </div>
  );
}

function PickerAlignments() {
  return (
    <div className="flex flex-wrap gap-4">
      {(["start", "center", "end"] as const).map((align) => (
        <Picker key={align} label={`Align ${align}`} align={align} />
      ))}
    </div>
  );
}

function LogicalPickers() {
  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="flex flex-wrap gap-4">
        {(["inline-start", "inline-end"] as const).map((side) => (
          <Picker key={side} label={`RTL ${side}`} side={side} />
        ))}
      </div>
    </DirectionProvider>
  );
}

function PickerModality() {
  return (
    <div className="flex flex-wrap gap-4">
      {[false, true].map((modal) => (
        <Combobox key={String(modal)} items={frameworks} modal={modal}>
          <ComboboxInput
            className="w-56 max-w-full"
            aria-label={modal ? "Modal framework" : "Non-modal framework"}
            placeholder={modal ? "Modal" : "Non-modal"}
          />
          <ComboboxContent>
            <Options />
          </ComboboxContent>
        </Combobox>
      ))}
    </div>
  );
}

function SeparateTrigger() {
  return (
    <Combobox items={frameworks}>
      <div className="flex items-center gap-2">
        <ComboboxInput
          className="w-48 max-w-full"
          aria-label="Separate-trigger framework"
          showTrigger={false}
          placeholder="Choose a framework"
        />
        <ComboboxTrigger aria-label="Browse frameworks" />
      </div>
      <ComboboxContent>
        <Options />
      </ComboboxContent>
    </Combobox>
  );
}

function PickerMotion() {
  return (
    <CadenceProvider mode="none">
      <div className="flex flex-wrap gap-4">
        <Picker label="Instant framework" />
        <CadenceProvider mode="full">
          <Picker label="Nested full framework" />
        </CadenceProvider>
      </div>
    </CadenceProvider>
  );
}

export function ComboboxPreview({ example }: { example?: string }) {
  if (example === "groups") return <GroupedPicker />;
  if (example === "controls") return <PickerControls />;
  if (example === "multiple") return <TopicPickers />;
  if (example === "states") return <PickerStates />;
  if (example === "controlled") return <ControlledPicker />;
  if (example === "objects") return <ObjectPicker />;
  if (example === "results") return <ResultPicker />;
  if (example === "highlight") return <HighlightPickers />;
  if (example === "sides") return <PickerSides />;
  if (example === "alignments") return <PickerAlignments />;
  if (example === "logical-sides") return <LogicalPickers />;
  if (example === "modality") return <PickerModality />;
  if (example === "custom-trigger") return <SeparateTrigger />;
  if (example === "without-motion") return <PickerMotion />;
  return <Picker label="Framework" />;
}
