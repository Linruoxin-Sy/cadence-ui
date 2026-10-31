# Combobox

> Picking from a long list you can filter by typing.

- Registry item: https://cadence.dev/r/combobox.json
- Install: `npx shadcn@latest add @cadence/combobox`
- Type: registry:ui
- Since: 0.4.0
- Motion recipes: popup.anchored, exit.fade, state.morph

## Installation

```install
npx shadcn@latest add @cadence/combobox
```

## Usage

```tsx
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/cadence/combobox";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro"];

export function FrameworkPicker() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput placeholder="Select a framework" aria-label="Framework" />
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
  );
}
```

`ComboboxList` takes a render function, so the list is data, not markup: `items` on the root is what the
popup filters and what the render callback receives.

## Groups and separators

Long catalogues read better in labelled groups. Give each `ComboboxGroup` its own `items` so filtering
can drop a group as a whole.

```tsx
<Combobox items={groups}>
  <ComboboxInput placeholder="Assign reviewer" aria-label="Reviewer" />
  <ComboboxContent>
    <ComboboxEmpty>No reviewer found.</ComboboxEmpty>
    <ComboboxList>
      {(group) => (
        <ComboboxGroup key={group.value} items={group.items}>
          <ComboboxLabel>{group.value}</ComboboxLabel>
          {group.items.map((item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          ))}
        </ComboboxGroup>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

## Clear and trigger controls

`showClear` adds the undo affordance once a value is set; the chevron steps aside while both would be
fighting for the same 24px. Turn the chevron off entirely with `showTrigger={false}` when the field is
inside a form that submits on Enter.

```tsx
<Combobox items={frameworks} defaultValue="Astro">
  <ComboboxInput showClear placeholder="Select a framework" aria-label="Framework" />
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
```

## Multiple values

`multiple` turns the field into a tag editor: `ComboboxChips` is the frame, each `ComboboxChip` is a
value, and `ComboboxChipsInput` is the caret. Anchor the popup to the chips container so it lines up with
the field rather than with the input inside it.

```tsx
const anchor = useComboboxAnchor();

<Combobox multiple items={topics} defaultValue={["design"]}>
  <ComboboxChips ref={anchor}>
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
</Combobox>;
```

## Filtering a server list

For a remote catalogue, keep the list the server returned and hand it to `items`; Base UI filters what it
is given, so a new response replaces the list without the component deciding what to fetch.

```tsx
const [results, setResults] = useState<string[]>([]);

<Combobox items={results} onInputValueChange={(query) => search(query).then(setResults)}>
  <ComboboxInput placeholder="Search a city" aria-label="City" />
  <ComboboxContent>
    <ComboboxEmpty>No city found.</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxContent>
</Combobox>;
```

## When to use

- Choosing one value from a list too long to scan: countries, assignees, repositories.
- A search field that should also accept a typed value, for example a tag the catalogue does not list.
- Several values from the same catalogue, where each choice should stay visible as a chip.
- A picker whose options arrive from a search endpoint rather than from a constant.

## When not to use

- Fewer than about eight fixed options. Use `select`; a popup that has to be opened to show three items is
  slower than three radios.
- Commands rather than values — navigation, actions, "go to file". Use `command`.
- Free text with no catalogue behind it. Use `input`.
- A control that must not accept typing, such as a language picker in a settings form. Use `select`.

## API

| Part | Props | Notes |
| --- | --- | --- |
| `Combobox` | `items`, `value`, `defaultValue`, `onValueChange`, `multiple`, `disabled`, `name`, `required`, `onInputValueChange`, `itemToStringLabel` | Base UI root. `items` drives what the popup filters and what the render callbacks receive. |
| `ComboboxInput` | `showTrigger` (`true`), `showClear` (`false`), `disabled`, native input props | The field: a bare input inside an input-group frame, with the chevron and the optional clear button. |
| `ComboboxTrigger` | native button props | The chevron on its own, for a field built by hand. |
| `ComboboxValue` | render callback or children | The selected label; in the chips layout it renders the chips. |
| `ComboboxContent` | `side` (`"bottom"`), `sideOffset` (`6`), `align` (`"start"`), `alignOffset` (`0`), `anchor` | Portals, positions, and sizes to `--anchor-width`. |
| `ComboboxList` | children or render function `(item, index) => ReactNode` | Scrolls, and takes the height the popup has left. |
| `ComboboxItem` | `value`, `disabled` | Renders the label and the tick. |
| `ComboboxGroup` / `ComboboxLabel` | `items` on the group | Structural; the group's `items` let filtering drop it whole. |
| `ComboboxEmpty` | children | Shown when the filter matches nothing. |
| `ComboboxSeparator` | separator props | A hairline between unrelated groups. |
| `ComboboxChips` / `ComboboxChip` / `ComboboxChipsInput` | `showRemove` (`true`) on the chip | The multi-value layout. |
| `ComboboxCollection` | collection props | Escape hatch for virtualised lists. |
| `useComboboxAnchor` | – | A ref to anchor the popup to the chips frame. |

`ComboboxClear` is internal on purpose: it belongs to `ComboboxInput`'s layout, and a component that owns
an undo affordance should not also hand out half of one.

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| open | popup `opacity` 0→1, `scale` `--motion-scale-in`→1 | `popup.anchored` | yes: a CSS transition, so reopening reverses it |
| close | popup `opacity` 1→0 | `exit.fade` | yes |
| select | tick `scale` `0.96`→1, `opacity` 0→1 | `state.morph` | yes: a spring, retargeted from the current value |
| filter | none — rows are replaced, not moved | – | – |
| reduced | popup fades without scaling, tick appears at full size | – | – |
| none | every duration is zero | – | – |

The scale grows out of `--transform-origin`, which Base UI writes from the positioner, so the panel opens
from the field rather than from its own centre. The list itself never animates: a filter runs on every
keystroke, and a row that is still travelling when the next character arrives is a list the reader has to
chase.

## Keyboard interactions

- `ArrowDown` or `Alt+ArrowDown` opens the popup; with it open, `ArrowDown`/`ArrowUp` move the highlight.
- Typing filters the list and moves the highlight to the first match.
- `Enter` selects the highlighted item and closes the popup.
- `Escape` closes the popup without choosing anything; the typed query stays in the field.
- `Tab` closes the popup and moves focus to the next control.
- `Backspace` in the chips layout deletes the last chip when the input is empty.

## Accessibility

- Base UI renders the input as a `combobox` with `aria-expanded`, `aria-controls`, and
  `aria-activedescendant`, and the list as a `listbox` whose rows are `option`s.
- Name the field: `aria-label` on `ComboboxInput`, or a `Field`/`Label` pair around it. The placeholder is
  not a name.
- The selected row keeps `aria-selected="true"`; the tick is a visual duplicate, never the only signal.
- The empty state is a row inside the list, so it is reachable in the reading order and not a modal
  interruption.
- Under reduced motion nothing is conveyed by the panel's scale: the list is there, the tick is at full
  size, and `aria-selected` carries the state.

## Responsive behavior

The popup is exactly `--anchor-width` wide and at least `--spacing(7)` wider than the field, so a narrow
trigger still shows a readable row. It flips above the field near the viewport edge, and the list — not the
popup — scrolls inside `--available-height`. In the chips layout the frame wraps to a second line instead
of scrolling horizontally, and the popup widens to the chips container.

## Performance

- One CSS transition on `opacity` and `scale` per open and per close; no JS animation loop, and no layout
  read.
- One spring per selected row. The indicator is mounted once and animated in place, so filtering does not
  create and destroy an animation per item.
- The filter is synchronous over whatever `items` holds; a remote list is a debounce in the caller, not a
  behaviour of this component.
- Budget: T2 (10 KB gzip).

## Notes for AI

- Always pass `items` to `Combobox`; it drives filtering and is what the `ComboboxList` render callback
  receives. Without it the list renders nothing.
- Use `value`/`onValueChange` for a controlled picker, `defaultValue` otherwise — same contract as `select`.
- `multiple` requires the chips layout; do not pair `multiple` with a plain `ComboboxInput`.
- Do not add a "loading" prop: async feedback is the caller's state, and `ComboboxEmpty` is for an empty
  result, not for a pending one.
- For invalid state pass `aria-invalid` on `ComboboxInput`; the frame styles the border and the ring from
  the attribute.

---

Full index: https://cadence.dev/llms.txt
