/**
 * The airliner, as capsules — the same construction as the horse, so it
 * samples through the identical distance field and the two read as one
 * drawing system rather than two sprites.
 *
 * Units are grid cells; +x is the direction of travel, +y is down, the origin
 * sits at the middle of the fuselage.
 */
import type { Capsule } from "./horseRig";

const c = (
  ax: number,
  ay: number,
  bx: number,
  by: number,
  r: number,
): Capsule => ({
  ax,
  ay,
  bx,
  by,
  r,
});

export const PLANE: Capsule[] = [
  c(-6.2, 0.2, 8.0, -0.1, 0.95), // fuselage — the round caps make the nose and tail
  c(-4.4, 0.1, -6.6, -0.2, 1.4), // fuller aft body
  c(-5.6, -0.9, -7.3, -4.6, 0.45), // fin
  c(-7.3, -4.6, -5.2, -4.2, 0.4), // fin tip, raked forward
  c(-6.6, -0.4, -3.8, -1.5, 0.38), // tailplane
  c(1.8, 0.4, -3.8, 4.2, 0.5), // near wing, swept back and down
  c(1.5, -0.3, -1.4, -2.6, 0.4), // far wing, foreshortened
  c(-0.9, 2.0, 1.5, 2.0, 0.55), // engine pod
];

export const PLANE_EXTENT = { left: -9, right: 10, top: -6, bottom: 6 };
/** Rig units across the longest axis, for scaling into a band. */
export const PLANE_TALL = 11.5;
