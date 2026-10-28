import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes without fighting the consumer's overrides. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
