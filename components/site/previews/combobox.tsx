"use client";

import * as React from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/registry/cadence/combobox";
import { PreviewRow, PreviewStack } from "./shell";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

type StackGroup = { value: string; items: string[] };

const stacks: StackGroup[] = [
  { value: "Frontend", items: ["React", "Vue", "Svelte"] },
  { value: "Backend", items: ["Go", "Rust", "Elixir"] },
];

const topics = ["Design", "Docs", "Testing", "Release"];

/**
 * A combobox is a field first and a popup second, so the specimen shows three field
 * shapes rather than three open lists: the plain picker, the labelled one with a clear
 * button, and the chips layout, which is the shape a reader is most likely to get wrong.
 */
export function ComboboxPreview() {
  const anchor = useComboboxAnchor();

  return (
    <PreviewStack>
      <PreviewRow className="items-start">
        <Combobox items={frameworks}>
          <ComboboxInput className="w-56" placeholder="Select a framework" aria-label="Framework" />
          <ComboboxContent>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox items={["React", "Vue", "Svelte", "Go"]} defaultValue="Vue">
          <ComboboxInput className="w-48" showClear placeholder="Select a stack" aria-label="Stack" />
          <ComboboxContent>
            <ComboboxEmpty>No stack found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox items={["Remix"]} disabled defaultValue="Remix">
          <ComboboxInput className="w-44" placeholder="Disabled" aria-label="Disabled picker" />
          <ComboboxContent>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </PreviewRow>

      <PreviewRow className="items-start">
        <Combobox items={stacks}>
          <ComboboxInput className="w-56" placeholder="Assign a reviewer" aria-label="Reviewer" />
          <ComboboxContent>
            <ComboboxEmpty>No reviewer found.</ComboboxEmpty>
            <ComboboxList>
              {(group: StackGroup) => (
                <ComboboxGroup key={group.value} items={group.items}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  {group.items.map((item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <Combobox multiple items={topics} defaultValue={["Design"]}>
          <ComboboxChips ref={anchor} className="w-64">
            <ComboboxValue>
              {(value: string[]) => (
                <React.Fragment>
                  {value.map((topic) => (
                    <ComboboxChip key={topic}>{topic}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder="Add topic" aria-label="Topics" />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No topic found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </PreviewRow>
    </PreviewStack>
  );
}
