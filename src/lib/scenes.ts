/**
 * One scene per mode.
 *
 * They share an engine (PixelScene) and differ only in what they put on the
 * grid: the agent is doing something different in each mode, so it gets a
 * different thing to look at. Every scene draws into the same lattice, obeys
 * the same ceiling under the label, and scrolls off the same offsets.
 */
import {
  RIG,
  RIG_DROP,
  RIG_TALL,
  horseSegments,
  sdCapsule,
  type Capsule,
} from "./horseRig";
import type { ModeId } from "./modes";
import { PLANE, PLANE_EXTENT, PLANE_TALL } from "./plane";
import {
  CACTUS_MAX_H,
  CACTUS_SPACING,
  CLOUD_SPACING,
  cactusInSlot,
  cloudInSlot,
} from "./scenery";

export type SceneCtx = {
  cols: number;
  rows: number;
  /** Nothing may be drawn above this row — the label lives up there. */
  ceilRow: number;
  /** Rows between the ceiling and the bottom of the card. */
  band: number;
  /** Seconds since the scene started. */
  t: number;
  /** Scroll distances, in grid columns. */
  o: { world: number; slow: number; gallop: number };
  colors: {
    star: string;
    moon: string;
    cloud: string;
    ground: string;
    pebble: string;
    subject: string;
    cloudAlpha: number;
    starAlpha: number;
    faint: number;
  };
  /** The active mode's colour, and a darker shade of it. */
  accent: string;
  accentDark: string;
  put: (
    color: string,
    col: number,
    row: number,
    alpha: number,
    frac: number,
    size?: number,
  ) => void;
};

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Sample a capsule body as a halftone: full size inside, tapering outside. */
function halftone(
  ctx: SceneCtx,
  segs: Capsule[],
  extent: { left: number; right: number; top: number; bottom: number },
  scale: number,
  originCol: number,
  originRow: number,
  color: string,
  falloff = 1,
) {
  const rowBase = Math.floor(originRow);
  const rowFrac = originRow - rowBase;
  const colBase = Math.floor(originCol);
  const colFrac = originCol - colBase;
  for (
    let ly = Math.floor(extent.top * scale) - 1;
    ly <= Math.ceil(extent.bottom * scale) + 1;
    ly++
  ) {
    for (
      let lx = Math.floor(extent.left * scale) - 1;
      lx <= Math.ceil(extent.right * scale) + 1;
      lx++
    ) {
      const rx = (lx + colFrac) / scale;
      const ry = (ly + rowFrac) / scale;
      let d = Infinity;
      for (let i = 0; i < segs.length; i++) {
        const v = sdCapsule(rx, ry, segs[i]);
        if (v < d) d = v;
      }
      d *= scale;
      if (d >= falloff) continue;
      let k = (falloff - d) / falloff;
      if (k > 1) k = 1;
      k = k * k * (3 - 2 * k);
      if (k <= 0.04) continue;
      ctx.put(color, colBase + lx, rowBase + ly, 1, 0, k);
    }
  }
}

const JUMP_ROWS = CACTUS_MAX_H + 0.6;
const JUMP_BEFORE = 6;
const JUMP_AFTER = 5;
const AIRBORNE_POSE = 0.06;

const rigRef: Capsule[] = [];

/* ------------------------------------------------------------------ */
/* thinking — the runner                                               */
/* ------------------------------------------------------------------ */

export function drawRunner(ctx: SceneCtx) {
  const { cols, rows, ceilRow, colors, o } = ctx;
  const groundRow = rows - 2;

  // clouds
  {
    const base = Math.floor(o.slow);
    const frac = o.slow - base;
    const skyTop = ceilRow + 1;
    const skyRows = Math.max(groundRow - skyTop - 5, 1);
    const first = Math.floor(base / CLOUD_SPACING) - 1;
    for (
      let slot = first;
      slot <= first + Math.ceil(cols / CLOUD_SPACING) + 2;
      slot++
    ) {
      const cloud = cloudInSlot(slot, skyTop, skyRows);
      if (!cloud) continue;
      const col = cloud.col - base;
      if (col < -12 || col > cols + 2) continue;
      cloud.art.forEach((line, r) =>
        [...line].forEach((ch, i) => {
          if (ch === "#")
            ctx.put(colors.cloud, col + i, cloud.row + r, 0.4, frac);
        }),
      );
    }
  }

  // ground line and grit
  const base = Math.floor(o.world);
  const frac = o.world - base;
  for (let c = -1; c <= cols; c++) {
    const w = c + base;
    ctx.put(colors.ground, c, groundRow, 0.9, frac);
    const grit = hash(w * 7.1);
    if (grit > 0.78)
      ctx.put(colors.pebble, c, groundRow + 1, 0.55 * colors.faint, frac);
    if (grit > 0.955) {
      ctx.put(colors.pebble, c + 1, groundRow + 1, 0.55 * colors.faint, frac);
      ctx.put(colors.pebble, c + 2, groundRow + 1, 0.55 * colors.faint, frac);
    }
  }

  // cacti
  const firstSlot = Math.floor(base / CACTUS_SPACING) - 1;
  for (
    let slot = firstSlot;
    slot <= firstSlot + Math.ceil(cols / CACTUS_SPACING) + 2;
    slot++
  ) {
    const cactus = cactusInSlot(slot);
    if (!cactus) continue;
    const col = cactus.col - base;
    if (col < -8 || col > cols + 2) continue;
    cactus.art.forEach((line, r) => {
      const row = groundRow - 1 - (cactus.h - 1 - r);
      [...line].forEach((ch, i) => {
        if (ch === "#")
          ctx.put(r === 0 ? ctx.accent : ctx.accentDark, col + i, row, 1, frac);
      });
    });
  }

  // the runner, and its jump
  const horseCol = Math.round(cols * 0.3);
  const horseWorld = o.world + horseCol;
  let lift = 0;
  const nearSlot = Math.floor(horseWorld / CACTUS_SPACING);
  for (let slot = nearSlot - 1; slot <= nearSlot + 2; slot++) {
    const cactus = cactusInSlot(slot);
    if (!cactus) continue;
    const d = cactus.col - horseWorld;
    if (d > JUMP_BEFORE || d < -JUMP_AFTER) continue;
    const h =
      JUMP_ROWS *
      Math.sin((Math.PI * (JUMP_BEFORE - d)) / (JUMP_BEFORE + JUMP_AFTER));
    if (h > lift) lift = h;
  }

  const S = Math.max(
    0.3,
    Math.min(
      0.4,
      (groundRow - JUMP_ROWS - ceilRow) / (RIG_TALL + RIG_DROP - 10),
    ),
  );
  const segs = horseSegments(
    lift > 0.25 ? AIRBORNE_POSE : o.gallop % 1,
    rigRef,
  );
  halftone(
    ctx,
    segs,
    RIG,
    S,
    horseCol,
    groundRow - RIG_DROP * S - lift,
    colors.subject,
  );
}

/* ------------------------------------------------------------------ */
/* checking — a scan line reading a field of records                   */
/* ------------------------------------------------------------------ */

const SCAN_SECONDS = 2.4;

export function drawScan(ctx: SceneCtx) {
  const { cols, rows, ceilRow, colors, o, t } = ctx;
  const baseRow = rows - 2;
  const topRow = ceilRow + 2;
  const lines = 3;
  const lineGap = Math.max(Math.floor((baseRow - topRow) / lines), 1);

  // The head sweeps left to right, then starts over.
  const sweep = (t % SCAN_SECONDS) / SCAN_SECONDS;
  const head = sweep * (cols + 8) - 4;

  const drift = o.world * 0.18;
  const base = Math.floor(drift);
  const frac = drift - base;

  for (let line = 0; line < lines; line++) {
    const row = topRow + line * lineGap;
    for (let c = -2; c <= cols; c++) {
      const w = c + base + line * 37;
      // Entries are runs of columns — the run's length and gaps are hashed,
      // so the field reads as records rather than as texture.
      const cell = Math.floor(w / 9);
      const within = w - cell * 9;
      const len = 3 + Math.floor(hash(cell * 19.3 + line) * 4);
      if (within >= len) continue;
      if (hash(cell * 5.9 + line * 3) < 0.34) continue;

      const d = head - c;
      // Hot right at the head, cooling back to grey over the next dozen
      // columns — so only a band around the head is lit, not everything the
      // head has ever passed.
      const heat = d < -1.5 ? 0 : clamp01(1 - Math.max(d, 0) / 13);
      if (heat < 0.04) {
        ctx.put(colors.pebble, c, row, 0.26 * colors.faint, frac, 0.78);
      } else {
        ctx.put(
          ctx.accent,
          c,
          row,
          0.35 + heat * 0.65,
          frac,
          0.78 + heat * 0.22,
        );
      }
    }
  }

  // The head: a bright column with a short trail dragging behind it.
  for (let i = 1; i <= 4; i++) {
    const col = Math.round(head) - i;
    for (let row = topRow - 2; row <= baseRow; row++) {
      if ((row + i) % 2 !== 0) continue;
      ctx.put(colors.subject, col, row, 0.34 * (1 - i / 5), head % 1, 0.65);
    }
  }
  for (let row = topRow - 2; row <= baseRow; row++) {
    ctx.put(colors.subject, Math.round(head), row, 0.9, head % 1, 0.95);
  }

  // Baseline, so the field has a floor.
  for (let c = -1; c <= cols; c++) {
    ctx.put(
      colors.ground,
      c,
      baseRow + 1,
      (c % 2 === 0 ? 0.5 : 0.2) * colors.faint,
      frac,
      0.8,
    );
  }
}

/* ------------------------------------------------------------------ */
/* analyzing — a scrolling bar field                                   */
/* ------------------------------------------------------------------ */

export function drawChart(ctx: SceneCtx) {
  const { cols, rows, ceilRow, colors, o, t } = ctx;
  const baseRow = rows - 2;
  const topRow = ceilRow + 1;
  const span = baseRow - topRow;

  const base = Math.floor(o.world * 0.55);
  const frac = o.world * 0.55 - base;

  const heightAt = (w: number) =>
    0.5 +
    0.26 * Math.sin(w * 0.33) +
    0.16 * Math.sin(w * 0.11 + 1.7) +
    0.1 * Math.sin(w * 0.87 + t * 0.6);

  for (let c = -1; c <= cols; c++) {
    const w = c + base;
    const h = Math.max(1, Math.round(clamp01(heightAt(w)) * span));
    for (let i = 0; i < h; i++) {
      const row = baseRow - i;
      const top = i === h - 1;
      ctx.put(
        top ? ctx.accent : colors.ground,
        c,
        row,
        top ? 1 : (0.28 + (i / h) * 0.35) * colors.faint,
        frac,
        top ? 1 : 0.85,
      );
    }
  }

  // Baseline and a scanning read-head that walks the series.
  for (let c = -1; c <= cols; c++)
    ctx.put(colors.ground, c, baseRow + 1, 0.6, frac);
  const headCol = ((t * 9) % (cols + 8)) - 4;
  const hw = Math.round(headCol) + base;
  const hh = Math.max(1, Math.round(clamp01(heightAt(hw)) * span));
  ctx.put(
    colors.subject,
    Math.round(headCol),
    baseRow - hh + 1,
    1,
    headCol % 1,
    1.1,
  );
  ctx.put(
    colors.subject,
    Math.round(headCol),
    baseRow - hh,
    0.6,
    headCol % 1,
    0.8,
  );
}

/* ------------------------------------------------------------------ */
/* booking — the flight                                                */
/* ------------------------------------------------------------------ */

const CLOUD_LAYERS = [
  { speed: 0.3, alpha: 0.3, spacing: 15, seed: 3 },
  { speed: 0.58, alpha: 0.48, spacing: 19, seed: 11 },
  { speed: 1, alpha: 0.72, spacing: 24, seed: 23 },
];

const BIG_CLOUD = ["...####...", "..######..", ".########.", "##########"];

export function drawFlight(ctx: SceneCtx) {
  const { cols, rows, ceilRow, colors, o, t } = ctx;
  const topRow = ceilRow + 1;
  const floorRow = rows - 2;

  // Three depths of cloud, each on its own speed.
  for (const layer of CLOUD_LAYERS) {
    const dist = o.world * layer.speed;
    const base = Math.floor(dist);
    const frac = dist - base;
    const first = Math.floor(base / layer.spacing) - 1;
    for (
      let slot = first;
      slot <= first + Math.ceil(cols / layer.spacing) + 2;
      slot++
    ) {
      if (hash(slot * 31.7 + layer.seed) < 0.18) continue;
      const col =
        slot * layer.spacing +
        Math.floor(hash(slot * 9.1 + layer.seed) * 12) -
        base;
      if (col < -14 || col > cols + 2) continue;
      // Clouds sit below the aeroplane's lane, so it always has clear air.
      const laneTop = topRow + Math.round((floorRow - topRow) * 0.45);
      const rowSpan = Math.max(floorRow - laneTop - 2, 1);
      const row = laneTop + Math.floor(hash(slot * 4.3 + layer.seed) * rowSpan);
      const squash = layer.speed < 0.5 ? 2 : BIG_CLOUD.length;
      for (let r = BIG_CLOUD.length - squash; r < BIG_CLOUD.length; r++) {
        [...BIG_CLOUD[r]].forEach((ch, i) => {
          if (ch === "#")
            ctx.put(colors.cloud, col + i, row + r, layer.alpha, frac, 0.9);
        });
      }
    }
  }

  // Ground, a very long way down: a sparse line moving fastest of all.
  {
    const dist = o.world * 1.6;
    const base = Math.floor(dist);
    const frac = dist - base;
    for (let c = -1; c <= cols; c++) {
      const w = c + base;
      if (hash(w * 3.7) < 0.55) continue;
      ctx.put(colors.ground, c, floorRow + 1, 0.3 * colors.faint, frac, 0.75);
    }
  }

  // The aeroplane, holding station while the sky goes past.
  const planeCol = Math.round(cols * 0.32);
  const mid = topRow + (floorRow - topRow) * 0.34;
  const bob = Math.sin(t * 0.9) * 0.5 + Math.sin(t * 2.3) * 0.12;
  const S = Math.max(
    0.3,
    Math.min(0.72, ((floorRow - topRow) * 0.78) / PLANE_TALL),
  );

  // Contrail: it leaves the tail and thins out behind.
  for (let i = 2; i < 30; i++) {
    const col = planeCol - Math.round(6 * S) - i;
    if (col < -1) break;
    const lag = Math.sin((t - i * 0.05) * 0.9) * 0.5;
    const a = 0.45 * (1 - i / 30);
    ctx.put(
      colors.cloud,
      col,
      Math.round(mid + lag),
      a,
      0,
      0.8 - (i / 30) * 0.5,
    );
  }

  halftone(ctx, PLANE, PLANE_EXTENT, S, planeCol, mid + bob, colors.subject);
}

export const SCENES: Record<ModeId, (ctx: SceneCtx) => void> = {
  thinking: drawRunner,
  checking: drawScan,
  analyzing: drawChart,
  booking: drawFlight,
};
