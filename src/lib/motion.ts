import type { Transition } from "framer-motion";

/** Shared easing + spring vocabulary, so every surface decelerates the same way. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.7, 0, 0.84, 0] as const;

/**
 * Geometry changes on the status element, tuned to the Dynamic Island.
 *
 * Apple specifies these as a response and a damping fraction; framer's
 * duration/bounce pair is the same thing (bounce = 1 - dampingFraction), so
 * this is `.spring(response: 0.52, dampingFraction: 0.74)` — a morph that
 * overshoots just enough to read as one shape stretching rather than two
 * shapes swapping.
 *
 * The island's other rules, applied in ThinkingCard: the black shape itself
 * never changes opacity, outgoing content leaves faster than the shape moves,
 * incoming content arrives late and scales up into place, and nothing inside
 * translates — it scales from the centre.
 */
export const MORPH: Transition = {
  type: "spring",
  duration: 0.52,
  bounce: 0.26,
};

/** Content leaving ahead of the shape. Short, so it is gone before the move. */
export const ISLAND_OUT: Transition = { duration: 0.13, ease: EASE_IN };

/** Content arriving behind the shape, once it is most of the way there. */
export const ISLAND_IN: Transition = {
  duration: 0.28,
  ease: EASE_OUT,
  delay: 0.17,
};

/** Entrances — anything arriving on screen for the first time. */
export const ENTER: Transition = { duration: 0.5, ease: EASE_OUT };

/** Label swaps inside the pill. Fast, because something replaces it immediately. */
export const SWAP: Transition = { duration: 0.34, ease: EASE_OUT };
