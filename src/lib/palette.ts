/**
 * Scene palettes.
 *
 * "night" is the original: white runner on black, the mode's own colour on the
 * cacti. "day" is drawn from the pixel artwork — muted sage, slate, terracotta
 * and peach on paper, with rounded-square dots rather than round ones, which
 * is what gives that artwork its woven look.
 */

export type ThemeName = "night" | "day";

export type ScenePalette = {
  star: string;
  moon: string;
  cloud: string;
  ground: string;
  pebble: string;
  horse: string;
  /** Rounded squares read as cloth; circles read as a display. */
  shape: "circle" | "square";
  /** Faint layers need more weight on paper than they do on black. */
  cloudAlpha: number;
  starAlpha: number;
};

export const PALETTES: Record<ThemeName, ScenePalette> = {
  night: {
    star: "255,255,255",
    moon: "255,255,255",
    cloud: "150,150,150",
    ground: "150,150,150",
    pebble: "96,96,96",
    horse: "255,255,255",
    shape: "circle",
    cloudAlpha: 0.4,
    starAlpha: 1,
  },
  day: {
    star: "195,201,218", // pale periwinkle
    moon: "210,118,74", // terracotta sun
    cloud: "240,205,176", // peach
    ground: "141,151,176", // slate
    pebble: "185,192,208",
    horse: "90,100,130", // the darkest slate in the artwork
    shape: "square",
    cloudAlpha: 0.85,
    starAlpha: 1.3,
  },
};
