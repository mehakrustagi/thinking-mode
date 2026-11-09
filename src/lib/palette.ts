/**
 * Scene palettes.
 *
 * "night" is the original: a white subject on black, the mode's own colour on
 * whatever the scene is made of. "day" is drawn from the pixel artwork — muted
 * sage, slate, terracotta and peach on paper.
 *
 * The *shape* of the mark is not here: it belongs to the mode, not the theme,
 * so each scene is drawn with its own nib in either palette.
 */

export type ThemeName = "night" | "day";

export type ScenePalette = {
  star: string;
  moon: string;
  cloud: string;
  ground: string;
  pebble: string;
  /** The horse, the plane, the scan head — whatever the scene's actor is. */
  subject: string;
  /** Faint layers need more weight on paper than they do on black. */
  cloudAlpha: number;
  starAlpha: number;
  /** Multiplier for every other dim element — grit, unread records, bars. */
  faint: number;
};

export const PALETTES: Record<ThemeName, ScenePalette> = {
  night: {
    star: "255,255,255",
    moon: "255,255,255",
    cloud: "150,150,150",
    ground: "150,150,150",
    pebble: "96,96,96",
    subject: "255,255,255",
    cloudAlpha: 0.4,
    starAlpha: 1,
    faint: 1,
  },
  day: {
    star: "195,201,218", // pale periwinkle
    moon: "210,118,74", // terracotta sun
    cloud: "240,205,176", // peach
    ground: "141,151,176", // slate
    pebble: "185,192,208",
    subject: "90,100,130", // the darkest slate in the artwork
    cloudAlpha: 0.85,
    starAlpha: 1.3,
    faint: 1.9,
  },
};
