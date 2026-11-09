/**
 * The four thinking modes.
 *
 * `dot` is lifted straight from the Figma render of each pill (the 100%-opacity
 * dot, top-left of the 3x3 matrix). `hue` is that same colour's hue — the label
 * is the Figma gradient `hsl(hue 100% 60%)`, which reproduces the measured
 * #c7aa00 dot / #ffda34 text pairing on the Checking frame and extends it to
 * the other three consistently.
 */
export type ModeId = "thinking" | "checking" | "analyzing" | "booking";

/**
 * The mark each mode's grid is drawn with. Same lattice, different nib: the
 * runner's round dots read as a display, the scan's squares as records, the
 * chart's bars as measurement, the flight's diamonds as open sky.
 */
export type DotShape = "circle" | "square" | "bar" | "diamond";

export type Mode = {
  id: ModeId;
  label: string;
  /** Matrix dot colour. */
  dot: string;
  /** Hue shared by the dots and the label gradient. */
  hue: number;
  /** Explicit label gradient, where the design specifies one. */
  grad?: [string, string];
  /** The same mode in the daylight palette — muted enough to sit on paper. */
  muted: string;
  /** Each mode draws its grid with its own mark. */
  shape: DotShape;
  /** What the agent is actually doing, streamed one line at a time. */
  steps: string[];
};

export const MODES: Mode[] = [
  {
    id: "thinking",
    shape: "circle",
    muted: "#6f8f62",
    label: "Thinking",
    dot: "#a1e000",
    hue: 77,
    // The Thinking gradient from the file: #002411 -> #A1E000.
    grad: ["#002411", "#a1e000"],
    steps: [
      "Reading the request",
      "Splitting it into 3 sub-tasks",
      "Picking the agents to run",
    ],
  },
  {
    id: "checking",
    shape: "square",
    muted: "#b0893a",
    label: "Checking",
    dot: "#c7aa00",
    hue: 51,
    steps: [
      "Scanning your calendar",
      "Pulling your seat preferences",
      "Cross-referencing Gmail",
    ],
  },
  {
    id: "analyzing",
    shape: "bar",
    muted: "#c8663a",
    label: "Analyzing",
    dot: "#ddaa01",
    hue: 46,
    steps: [
      "Querying 9 OTAs in parallel",
      "Modelling the fare window",
      "Ranking by total landed cost",
    ],
  },
  {
    id: "booking",
    shape: "diamond",
    muted: "#6d7fa6",
    label: "Booking",
    dot: "#01ddd6",
    hue: 178,
    steps: [
      "Holding 12A to Bangkok",
      "Holding 34K into Ho Chi Minh",
      "Confirming with the airline",
    ],
  },
];

/** Label gradient endpoints for a mode. */
export const labelBase = (hue: number) => `hsl(${hue} 100% 60% / 0.42)`;
export const labelPeak = (hue: number) => `hsl(${hue} 100% 66%)`;

/** Multiply a hex colour, for deriving a darker stop from a mode's accent. */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(v * k),
  );
  return `rgb(${c.join(",")})`;
}

/**
 * The label's paint. A mode with an explicit gradient keeps its two stops and
 * gets the sweep highlight threaded between them; the rest derive both ends
 * from their hue.
 */
export function labelImage(mode: Mode, theme: "night" | "day" = "night") {
  if (theme === "day") {
    // On paper the label has to be dark; the sweep lifts it rather than
    // brightening past it.
    return `linear-gradient(100deg, ${shade(mode.muted, 0.6)} 38%, ${
      mode.muted
    } 50%, ${shade(mode.muted, 0.6)} 62%)`;
  }
  if (mode.grad) {
    const [from, to] = mode.grad;
    return `linear-gradient(100deg, ${from} 4%, ${to} 40%, #ffffff 50%, ${to} 60%, ${from} 96%)`;
  }
  return `linear-gradient(100deg, ${labelBase(mode.hue)} 38%, ${labelPeak(
    mode.hue,
  )} 50%, ${labelBase(mode.hue)} 62%)`;
}

export const MODE_DURATION_MS = 3400;
/** How long the landscape variant holds the plain pill before opening out. */
export const HOLD_BEFORE_OPEN_MS = 2000;
/** After the card shrinks back, how long before the landscape run repeats. */
export const LOOP_PAUSE_MS = 3200;
export const STEP_INTERVAL_MS = 950;
