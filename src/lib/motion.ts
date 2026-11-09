import type { Transition } from "framer-motion";

/** Shared easing + spring vocabulary, so every surface decelerates the same way. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.7, 0, 0.84, 0] as const;

/** Pill geometry changes. Soft enough to read as a morph, not a resize. */
export const MORPH: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.9,
};

/** Entrances — anything arriving on screen for the first time. */
export const ENTER: Transition = { duration: 0.5, ease: EASE_OUT };

/** Label swaps inside the pill. Fast, because something replaces it immediately. */
export const SWAP: Transition = { duration: 0.34, ease: EASE_OUT };
