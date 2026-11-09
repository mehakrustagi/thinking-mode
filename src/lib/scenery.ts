/**
 * Scenery for the runner: cacti to clear and clouds to pass under.
 *
 * Both are placed by hashing an absolute world bucket rather than being
 * spawned and stored, so the strip is infinite, identical on every frame, and
 * the horse can look *ahead* at what is coming — which is what makes the jump
 * possible without a physics step.
 */

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/** Grid columns between cactus slots. Not every slot is filled. */
export const CACTUS_SPACING = 26;

/** Tallest a cactus gets, in rows — the jump height is sized off this. */
export const CACTUS_MAX_H = 3;

const CACTI = [
  // one stem, one arm
  [".#.", "###", ".#."],
  // two stems
  ["#.#", "###", ".#."],
  // a low one
  ["##", "##"],
  // a wide clump
  ["#.#.#", "#####", "..#.."],
];

export type Cactus = { col: number; art: string[]; w: number; h: number };

/** The cactus in a given slot, or null if that slot is empty. */
export function cactusInSlot(slot: number): Cactus | null {
  if (hash(slot * 41.3) < 0.42) return null;
  const art = CACTI[Math.floor(hash(slot * 17.9) * CACTI.length)];
  return {
    col: slot * CACTUS_SPACING + Math.floor(hash(slot * 7.7) * 10),
    art,
    w: art[0].length,
    h: art.length,
  };
}

const CLOUD = ["..####..", ".######.", "########", "...##..."];

export type Cloud = { col: number; row: number; art: string[] };

export const CLOUD_SPACING = 34;

export function cloudInSlot(
  slot: number,
  skyTop: number,
  skyRows: number,
): Cloud | null {
  if (hash(slot * 23.1 + 5) < 0.45) return null;
  return {
    col: slot * CLOUD_SPACING + Math.floor(hash(slot * 13.3) * 16),
    row: skyTop + Math.floor(hash(slot * 5.1 + 2) * Math.max(skyRows, 1)),
    art: CLOUD,
  };
}
