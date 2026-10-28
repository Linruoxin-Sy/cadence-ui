# Text reveal

> Reveal a heading or paragraph word by word, with a single accessible sentence.

- Registry item: /r/text-reveal.json
- Install: `npx shadcn@latest add @cadence/text-reveal`
- Type: registry:ui
- Since: 0.1.0
- Motion recipes: text.reveal, reveal

## When to use

- Page titles and section headings that deserve a moment of arrival.
- Short paragraphs (under ~40 words) where per-word rhythm reads as intentional.
- Landing pages where the copy is the main visual.

## When not to use

- Body copy people scan or re-read; per-word motion slows reading.
- Text that changes often (live data, counters); use a number component instead.
- Content with inline links, emphasis, or icons: this component takes a plain string only.

## Installation

```bash
npx shadcn@latest add @cadence/text-reveal
```

## Usage

```tsx
import { TextReveal } from "@/components/cadence/text-reveal/text-reveal";

export function Hero() {
  return (
    <TextReveal as="h1" stagger={0.04}>
      Motion that explains what just happened
    </TextReveal>
  );
}
```

## Examples

### Slower, heavier entrance

```tsx
<TextReveal as="h2" stagger={0.08} delay={0.1}>
  Built for products, not demos
</TextReveal>
```

### Reduce to a single fade

Set `data-motion="reduced"` on an ancestor (or enable the OS setting) and the whole string
fades once instead of word by word.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string` | – | Plain text. Inline markup is not supported. |
| `as` | `"h1" \| "h2" \| "h3" \| "p" \| "span"` | `"p"` | Semantic element. |
| `stagger` | `number` | `0.035` | Seconds between words. |
| `delay` | `number` | `0` | Seconds before the first word. |
| `once` | `boolean` | `true` | Reveal once or replay on entry. |
| `className` | `string` | – | Merged onto the semantic element. |

## Motion contract

| Phase | Properties | Token | Interruptible |
| --- | --- | --- | --- |
| enter | per word `opacity 0 → 1`, `translateY 0.35em → 0` | `text.reveal` (0.32s, stagger 0.035s) | n/a |
| reduced | whole string fades once | `reveal` | n/a |
| none | end state immediately | – | n/a |

## Keyboard interactions

None. Text is not interactive and does not enter the tab order.

## Accessibility

- The visible words are `aria-hidden`; the element itself carries `aria-label` with the full string,
  so screen readers announce the sentence once.
- The rendered element keeps its heading/paragraph role, so document structure is preserved.
- Reduced motion swaps the stagger for one fade; no content is delayed or hidden.

## Responsive behavior

Works at any width. Very narrow columns can produce many short lines; lower `stagger` to keep the
total under ~0.4s.

## Performance

- One span per word. Keep strings short; a 200-word paragraph creates 200 elements.
- Animates opacity and transform only.
- Splitting happens during render, so the DOM is stable after hydration.

## Notes for AI

- Only pass plain strings. If the copy needs a link or `<strong>`, split the sentence and wrap parts
  in separate `TextReveal` instances instead of injecting markup.
- Keep total stagger (`stagger × words`) under 0.4s.
- Do not use for navigation labels or buttons.

---

Full index: /llms.txt
