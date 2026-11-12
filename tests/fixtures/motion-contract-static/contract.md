# Static fixture motion contract

Status: gate fixture; this component is not shipped.

The static fixture exists so the motion-contract gate can declare a colour recipe without a live
component's future migration changing the fixture. It owns one declared colour action and no
implementation.

## Contract references

```json motion-contract
{
  "schema": 1,
  "target": "motion-v2",
  "migration": "legacy",
  "parts": { "root": ["static-fixture#StaticFixture"] }
}
```

## Capability ownership

| Capability      | Coverage and owner                                                                                               | References                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Appearance      | not applicable: the fixture never animates an entrance or an exit.                                               | not-applicable: `@root`               |
| Size            | not applicable: the fixture has no measured box writer.                                                          | not-applicable: `@root`               |
| Surface colour  | not applicable: the fixture paints no surface of its own.                                                        | not-applicable: `@root`               |
| Text colour     | default: the fixture declares a foreground colour action without an installed owner, so the gate must reject it. | default: `static-fixture.root.colour` |
| Changed text    | not applicable: the fixture renders static text only.                                                            | not-applicable: `@root`               |
| Changed numbers | not applicable: the fixture has no numeric display.                                                              | not-applicable: `@root`               |

## Choreography and modes

| Trigger / owner                         | full                 | reduced              | none       | Binding → preset → recipe/form                                          |
| --------------------------------------- | -------------------- | -------------------- | ---------- | ----------------------------------------------------------------------- |
| Declared colour without an owner / root | Expected transition. | Expected transition. | Immediate. | `static-fixture.root.colour` → `state.color` → `state.color/foreground` |

## Interruption and lifecycle

The fixture has no runtime writer. It exists only to prove that a declared colour recipe without an
installed owner fails the gate instead of being certified by another component's motion.

## Geometry and performance

No measured geometry, no loop and no retained visual is declared. The fixture is a static box.

## Acceptance scenarios

The gate test asserts that the colour policy is reported missing, not that a transition occurs.
