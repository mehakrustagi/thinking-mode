"use client";

import {
  cubicBezier,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import {
  RIG,
  RIG_DROP,
  RIG_TALL,
  horseSegments,
  sdCapsule,
  type Capsule,
} from "@/lib/horseRig";
import { PALETTES, type ThemeName } from "@/lib/palette";
import {
  CACTUS_MAX_H,
  CACTUS_SPACING,
  CLOUD_SPACING,
  cactusInSlot,
  cloudInSlot,
} from "@/lib/scenery";

/**
 * The dot-matrix landscape the agent runs through while it thinks.
 *
 * Everything is one grid of dots on a 4px pitch — sky, hills, ground texture
 * and the horse all snap to the same lattice, which is what makes it read as a
 * single display rather than a drawing with sprites on top.
 *
 * Two things keep it fluid:
 *
 * 1. Sub-pixel scrolling. The *pattern* advances one lattice cell at a time
 *    (it has to — it is a dot grid), but the whole field is drawn at a
 *    fractional pixel offset, so the dots glide instead of teleporting 4px
 *    eleven times a second.
 * 2. One driver. The loop runs on framer's animation frame rather than its own
 *    requestAnimationFrame, so it is scheduled alongside the layout springs
 *    driving the card rather than competing with them for the same frame.
 */

const PITCH = 4;
const DOT = 2.8;

/** Strides per second. Continuous — there are no frames to step between. */
const STRIDE_HZ = 2.6;
/** Cells over which a dot fades out at the silhouette's edge. */
const HALFTONE_FALLOFF = 1.0;
/** The rig is authored at full size; it is scaled to fit the scene band. */
const HORSE_SCALE_MAX = 0.78;
/**
 * Share of the card the label keeps for itself. Nothing reaches into it —
 * not the horse at the top of its jump, not a cactus, not a cloud.
 */
const LABEL_BAND = 0.3;

/** How high the horse rises, in rows. Sized to clear the tallest cactus. */
const JUMP_ROWS = CACTUS_MAX_H + 0.6;
/** Columns of run-up and of landing the jump arc covers. */
const JUMP_BEFORE = 6;
const JUMP_AFTER = 5;
/** Legs stop cycling in the air and hold near full extension. */
const AIRBORNE_POSE = 0.06;

/** Layer speeds in grid columns per second, at speed factor 1. */
const SPEED = { stars: 0.25, clouds: 1.4, ground: 13 };
/** The run accelerates, like the game it is borrowed from. */
const SPEED_RAMP = { gain: 0.55, overSeconds: 22 };

/** Dots wipe in left to right, then the world starts moving. */
const REVEAL_MS = 900;
const SPINUP_MS = 1100;
const WIPE_COLS = 10;

const easeOut = cubicBezier(0.22, 1, 0.36, 1);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const hash = (n: number) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/** "#9edd01" -> "158,221,1" */
function rgbOf(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const mix = (rgb: string, k: number) =>
  rgb
    .split(",")
    .map((v) => Math.round(Number(v) * k))
    .join(",");

/** x, y (both in px, already sub-pixel offset), alpha, radius. */
type Cell = [number, number, number, number];

export function PixelScene({
  width,
  height,
  /** Flips true when the card opens: starts the wipe-in, then the scroll. */
  active = true,
  /** Freezes the world without hiding it — used once the run resolves. */
  running = true,
  /** Cacti pick up the active mode's colour, so the strip shifts with it. */
  accent = "#9edd01",
  theme = "night",
  className = "",
}: {
  width: number;
  height: number;
  active?: boolean;
  running?: boolean;
  accent?: string;
  theme?: ThemeName;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizedFor = useRef("");
  const startedAt = useRef<number | null>(null);
  const off = useRef({ stars: 0, clouds: 0, ground: 0, gallop: 0 });
  // Reused so the rig does not allocate 18 objects every frame.
  const rigRef = useRef<Capsule[]>([]);
  const reduced = useReducedMotion();

  useAnimationFrame((time, delta) => {
    const el = canvas.current;
    if (!el) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const key = `${width}x${height}@${dpr}`;
    if (sizedFor.current !== key) {
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      const c = el.getContext("2d");
      if (!c) return;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctxRef.current = c;
      sizedFor.current = key;
    }
    const ctx = ctxRef.current;
    if (!ctx) return;
    // Snap every dot to a whole device pixel. Sub-pixel offsets are what make
    // the scroll fluid; snapping to the device grid is what keeps each dot a
    // hard-edged dot instead of a smear. At dpr 3 that is still 33 sub-steps
    // per 4px cell, so nothing visibly steps.
    const snap = (v: number) => Math.round(v * dpr) / dpr;

    if (!active) {
      startedAt.current = null;
      ctx.clearRect(0, 0, width, height);
      return;
    }
    if (startedAt.current === null) startedAt.current = time;
    const since = time - startedAt.current;

    // Wipe-in, then spin-up. The wipe runs linear so its edge travels at a
    // constant speed — easing it makes the dots appear all at once and the
    // sweep stops reading. Reduced motion skips straight to a still frame.
    const reveal = reduced ? 1 : clamp01(since / REVEAL_MS);
    const spin =
      reduced || !running
        ? 0
        : easeOut(clamp01((since - REVEAL_MS * 0.55) / SPINUP_MS));

    const dt = Math.min(Math.max(delta, 0), 50) / 1000;
    const o = off.current;
    // Everything shares one speed factor, so the ramp never desynchronises
    // the ground from the stride and the horse never looks like it is
    // skating.
    const ramp =
      1 +
      SPEED_RAMP.gain *
        Math.min(
          1,
          Math.max(0, (since - REVEAL_MS) / (SPEED_RAMP.overSeconds * 1000)),
        );
    const rate = spin * ramp * dt;
    o.stars += SPEED.stars * rate;
    o.clouds += SPEED.clouds * rate;
    o.ground += SPEED.ground * rate;
    o.gallop += STRIDE_HZ * ramp * spin * dt;

    // ---- geometry ---------------------------------------------------------
    const cols = Math.ceil(width / PITCH) + 2;
    const rows = Math.floor(height / PITCH);
    const half = PITCH / 2;

    // The ground sits near the bottom; everything happens on the line.
    const groundRow = rows - 2;
    // Nothing may rise above this, jump apex included.
    const ceilRow = Math.ceil(rows * LABEL_BAND);
    // Scale the rig so a jumping horse still tops out at the ceiling.
    const S = Math.max(
      0.3,
      Math.min(HORSE_SCALE_MAX, (groundRow - JUMP_ROWS - ceilRow) / RIG_TALL),
    );
    const horseCol = Math.round(cols * 0.3);
    const skyTop = ceilRow;
    const skyRows = Math.max(
      groundRow - ceilRow - Math.round(RIG_TALL * S) + 1,
      1,
    );

    const COLORS = PALETTES[theme];
    const foliage = rgbOf(accent);
    const cactusLit = mix(foliage, 0.95);
    const cactusDark = mix(foliage, 0.5);

    // ---- collect ----------------------------------------------------------
    ctx.clearRect(0, 0, width, height);
    const layers: Record<string, Cell[]> = {};

    /** `frac` is the layer's sub-pixel offset; `col` is its screen column. */
    const put = (
      color: string,
      col: number,
      row: number,
      alpha: number,
      frac: number,
      /** 1 = a full dot; below that the dot shrinks, which is the halftone. */
      size = 1,
    ) => {
      if (row < 0 || row >= rows) return;
      // Dots grow as the wipe passes over them, so the field blooms in.
      const gate = clamp01((reveal * (cols + WIPE_COLS) - col) / WIPE_COLS);
      if (gate <= 0.01) return;
      const x = snap((col - frac) * PITCH + half);
      if (x < -PITCH || x > width + PITCH) return;
      (layers[color] ??= []).push([
        x,
        row * PITCH + half,
        alpha * gate,
        (DOT / 2) * size * (0.35 + 0.65 * gate),
      ]);
    };

    /** Stamp a string-art sprite with its bottom-left at (col, row). */
    const stamp = (
      art: string[],
      col: number,
      bottomRow: number,
      frac: number,
      lit: string,
      dark: string,
    ) => {
      for (let r = 0; r < art.length; r++) {
        const row = bottomRow - (art.length - 1 - r);
        for (let c = 0; c < art[r].length; c++) {
          if (art[r][c] !== "#") continue;
          put(r === 0 ? lit : dark, col + c, row, 1, frac);
        }
      }
    };

    // --- sky: stars and the moon, well clear of the ground -----------------
    const starSpan = cols * 3;
    for (let i = 0; i < 16; i++) {
      const x = hash(i * 3.3) * starSpan;
      const col = (((x - o.stars) % starSpan) + starSpan) % starSpan;
      if (col > cols) continue;
      const twinkle =
        0.6 + 0.4 * Math.sin(time / 620 + hash(i * 2.1 + 5) * 6.28);
      put(
        COLORS.star,
        Math.floor(col),
        1 + Math.floor(hash(i * 7.7 + 11) * Math.max(ceilRow - 2, 1)),
        (0.3 + hash(i * 5.9 + 3) * 0.4) * twinkle * COLORS.starAlpha,
        col % 1,
      );
    }

    const MOON = ["..#..", ".###.", "#####", ".###.", "..#.."];
    MOON.forEach((line, r) =>
      [...line].forEach((c, i) => {
        if (c === "#") put(COLORS.moon, cols - 10 + i, 1 + r, 0.8, 0);
      }),
    );

    // --- clouds: the slow layer --------------------------------------------
    {
      const base = Math.floor(o.clouds);
      const frac = o.clouds - base;
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
              put(COLORS.cloud, col + i, cloud.row + r, 0.4, frac);
          }),
        );
      }
    }

    // --- the ground line ---------------------------------------------------
    // One continuous row of dots with a scatter of grit under it — the whole
    // landscape, exactly as flat as the game it is borrowed from.
    {
      const base = Math.floor(o.ground);
      const frac = o.ground - base;
      for (let c = -1; c <= cols; c++) {
        const w = c + base;
        put(COLORS.ground, c, groundRow, 0.9, frac);
        const grit = hash(w * 7.1);
        if (grit > 0.78) put(COLORS.pebble, c, groundRow + 1, 0.55, frac);
        // Occasional longer scuff, like the dashes in the game's ground.
        if (grit > 0.955) {
          put(COLORS.pebble, c + 1, groundRow + 1, 0.55, frac);
          put(COLORS.pebble, c + 2, groundRow + 1, 0.55, frac);
        }
      }

      // --- cacti -----------------------------------------------------------
      const firstSlot = Math.floor(base / CACTUS_SPACING) - 1;
      const lastSlot = firstSlot + Math.ceil(cols / CACTUS_SPACING) + 2;
      for (let slot = firstSlot; slot <= lastSlot; slot++) {
        const cactus = cactusInSlot(slot);
        if (!cactus) continue;
        const col = cactus.col - base;
        if (col < -8 || col > cols + 2) continue;
        stamp(cactus.art, col, groundRow - 1, frac, cactusLit, cactusDark);
      }
    }

    // --- horse -------------------------------------------------------------
    // The jump is read, not simulated: the arc is a function of how far the
    // next cactus is from the horse, so it is always already in the right
    // place no matter what the frame rate did.
    const horseWorld = o.ground + horseCol;
    let lift = 0;
    {
      const nearSlot = Math.floor(horseWorld / CACTUS_SPACING);
      for (let slot = nearSlot - 1; slot <= nearSlot + 2; slot++) {
        const cactus = cactusInSlot(slot);
        if (!cactus) continue;
        const d = cactus.col - horseWorld;
        if (d > JUMP_BEFORE || d < -JUMP_AFTER) continue;
        const t01 = (JUMP_BEFORE - d) / (JUMP_BEFORE + JUMP_AFTER);
        const h = JUMP_ROWS * Math.sin(Math.PI * t01);
        if (h > lift) lift = h;
      }
    }

    const airborne = lift > 0.25;
    const pose = airborne ? AIRBORNE_POSE : o.gallop % 1;
    const segs = horseSegments(pose, rigRef.current);
    const originRow = groundRow - RIG_DROP * S - lift;
    const y0 = Math.floor(RIG.top * S);
    const y1 = Math.ceil(RIG.bottom * S);
    const x0 = Math.floor(RIG.left * S);
    const x1 = Math.ceil(RIG.right * S);
    // The lift is fractional, so the sample window shifts with it rather than
    // the horse hopping a whole cell at a time.
    const rowBase = Math.floor(originRow);
    const rowFrac = originRow - rowBase;
    for (let ly = y0 - 1; ly <= y1 + 1; ly++) {
      for (let lx = x0; lx <= x1; lx++) {
        const rx = lx / S;
        const ry = (ly + rowFrac) / S;
        let d = Infinity;
        for (let i = 0; i < segs.length; i++) {
          const v = sdCapsule(rx, ry, segs[i]);
          if (v < d) d = v;
        }
        d *= S; // rig units -> grid cells
        if (d >= HALFTONE_FALLOFF) continue;
        // Full size anywhere inside the silhouette, tapering only across the
        // falloff band outside it. Centring the ramp on the surface instead
        // halves every dot on a thin limb, and the legs disappear.
        let k = (HALFTONE_FALLOFF - d) / HALFTONE_FALLOFF;
        if (k > 1) k = 1;
        k = k * k * (3 - 2 * k); // smoothstep
        if (k <= 0.04) continue;
        put(COLORS.horse, horseCol + lx, rowBase + ly, 1, 0, k);
      }
    }

    // ---- flush, batched by colour then by quantised alpha/radius ----------
    for (const color in layers) {
      const cells = layers[color];
      cells.sort((a, b) => a[2] - b[2] || a[3] - b[3]);
      let key = "";
      let open = false;
      for (const [x, y, a, r] of cells) {
        const qa = Math.round(a * 20) / 20;
        const qr = Math.round(r * 8) / 8;
        const k = `${qa}|${qr}`;
        if (k !== key) {
          if (open) ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = `rgba(${color},${qa})`;
          key = k;
          open = true;
        }
        if (COLORS.shape === "square") {
          ctx.roundRect(x - qr, y - qr, qr * 2, qr * 2, qr * 0.42);
        } else {
          ctx.moveTo(x + qr, y);
          ctx.arc(x, y, qr, 0, Math.PI * 2);
        }
      }
      if (open) ctx.fill();
    }
  });

  return (
    <canvas
      ref={canvas}
      className={className}
      style={{ width, height, display: "block" }}
      aria-hidden
    />
  );
}
