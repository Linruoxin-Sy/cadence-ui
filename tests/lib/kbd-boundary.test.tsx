import { expect, it } from "vitest";
import { unboundMotionSyntax } from "../../scripts/motion-v2.mjs";

it("allows only imported AnimatePresence's false initial lifecycle baseline", () => {
  const good =
    'import {AnimatePresence as Retain} from "motion/react";export function Group(){return <Retain initial={false}><span/></Retain>}';
  expect(unboundMotionSyntax(good)).toEqual([]);
  for (const bad of [
    good.replace("{false}", "{true}"),
    good.replace('"motion/react"', '"other"'),
    good.replace("<Retain initial", "<div initial"),
    good.replace("initial={false}", "animate={{opacity:1}}"),
  ])
    expect(unboundMotionSyntax(bad)).not.toEqual([]);
});
