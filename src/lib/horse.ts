/**
 * Galloping horse, 22x15, four frames.
 *
 * The body is identical in every frame — only the legs and a one-row bob
 * change, which is what keeps the silhouette readable at a 2.4px dot. Frames
 * run extension -> gather -> push-off -> suspension.
 */

const BODY = [
  "..................##..",
  ".................####.",
  ".................###..",
  "#...............#####.",
  "##.....##############.",
  "###...################",
  ".####################.",
  "..##################..",
  "...###############....",
];

const LEGS = [
  // extension — fore legs reaching forward, hind legs trailing
  [
    "...#.#..........#.#...",
    "..#...#........#...#..",
    ".#.....#......#.....#.",
    "#.......#....#.......#",
    "........#...#.........",
  ],
  // gather — legs folding under the belly
  [
    "....##..........##....",
    "....##..........##....",
    ".....##..........##...",
    ".....##...........#...",
    "......#...............",
  ],
  // push-off — driving off the hind legs
  [
    "...##...........##....",
    "..##.............##...",
    ".##...............##..",
    "##.................##.",
    "#..................#..",
  ],
  // suspension — all four off the ground
  [
    "....##..........##....",
    "...##............##...",
    "...#..............#...",
    "......................",
    "......................",
  ],
];

/** Body rises a row on the airborne frames. */
const BOB = [0, -1, 0, -1];

export const HORSE_W = 22;
export const HORSE_H = 15;
export const HORSE_FRAMES = LEGS.length;

/** [frame][row][col] — true where a dot should be lit. */
export const HORSE: boolean[][][] = LEGS.map((legs, f) => {
  const grid: boolean[][] = Array.from({ length: HORSE_H }, () =>
    Array.from({ length: HORSE_W }, () => false),
  );
  BODY.forEach((line, r) => {
    const row = r + BOB[f] + 1;
    if (row < 0 || row >= HORSE_H) return;
    for (let c = 0; c < HORSE_W; c++) if (line[c] === "#") grid[row][c] = true;
  });
  legs.forEach((line, r) => {
    const row = r + BODY.length + 1;
    if (row < 0 || row >= HORSE_H) return;
    for (let c = 0; c < HORSE_W; c++) if (line[c] === "#") grid[row][c] = true;
  });
  return grid;
});
