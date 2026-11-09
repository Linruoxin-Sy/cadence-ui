import { createRef } from "react";
import { AnimatedNumber, type AnimatedNumberProps } from "../../registry/cadence/animated-number";

/** Compiled against both repository source and the verbatim installed sibling tree. */
export function numericConsumer() {
  const ref = createRef<HTMLSpanElement>();
  const display = (
    <AnimatedNumber
      value={12345678901234567890n}
      locales={["en-US"]}
      format={{ style: "currency", currency: "USD" }}
      direction="shortest"
      ref={ref}
      onClick={(event) => event.currentTarget.focus()}
    />
  );
  // @ts-expect-error numeric-looking strings are not numeric values
  void (<AnimatedNumber value="00123" />);
  // @ts-expect-error arbitrary children do not own a numeric display
  void (<AnimatedNumber value={1}>rich</AnimatedNumber>);
  // @ts-expect-error an application cause is not a new public prop
  void (<AnimatedNumber value={1} cause="query" />);
  // @ts-expect-error only the four declared directions are available
  void (<AnimatedNumber value={1} direction="left" />);
  const markup: AnimatedNumberProps = {
    value: 1,
    // @ts-expect-error caller markup cannot replace the owned native string
    dangerouslySetInnerHTML: { __html: "1" },
  };
  void markup;
  return display;
}
