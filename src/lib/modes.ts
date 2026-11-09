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

export type Mode = {
  id: ModeId;
  label: string;
  /** Matrix dot colour. */
  dot: string;
  /** Hue shared by the dots and the label gradient. */
  hue: number;
  /** What the agent is actually doing, streamed one line at a time. */
  steps: string[];
};

export const MODES: Mode[] = [
  {
    id: "thinking",
    label: "Thinking",
    dot: "#9edd01",
    hue: 77,
    steps: [
      "Reading the request",
      "Splitting it into 3 sub-tasks",
      "Picking the agents to run",
    ],
  },
  {
    id: "checking",
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

export const MODE_DURATION_MS = 3400;
/** How long the landscape variant holds the plain pill before opening out. */
export const HOLD_BEFORE_OPEN_MS = 2000;
export const STEP_INTERVAL_MS = 950;
