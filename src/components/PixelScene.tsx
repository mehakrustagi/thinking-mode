"use client";

import {
  cubicBezier,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import { RIG, horseSegments, sdCapsule, type Capsule } from "@/lib/horseRig";

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

const COLORS = {
  star: "255,255,255",
  moon: "255,255,255",
  far: "62,62,62",
  mid: "98,98,98",
  cap: "150,150,150",
  ground: "84,84,84",
  groundEdge: "150,150,150",
  horse: "255,255,255",
};

/** Strides per second. Continuous — there are no frames to step between. */
const STRIDE_HZ = 2.6;
/** Cells over which a dot fades out at the silhouette's edge. */
const HALFTONE_FALLOFF = 1.0;
/** The rig is authored at full size; it is scaled to fit the scene band. */
const HORSE_SCALE_MAX = 0.68;
/** Rig units from the top of the ears to the hooves, and from origin to hoof. */
const RIG_TALL = 16.6;
const RIG_DROP = 8.6;

/**
 * Share of the card that stays open sky. Nothing in the landscape may rise
 * into it: the label needs air beneath it, and the scene reads better as a
 * strip of ground under a lot of night than as a full frame.
 */
const SKY_BAND = 0.5;

/** Layer speeds in grid columns per second. */
const SPEED = { stars: 0.4, far: 1.6, mid: 4.5, ground: 11 };

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

/** Smoothed value noise — one octave. */
function noise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash(i + seed * 1013);
  const b = hash(i + 1 + seed * 1013);
  const u = f * f * (3 - 2 * f);
  return a * (1 - u) + b * u;
}

const fbm = (x: number, seed: number) =>
  noise(x * 0.5, seed) * 0.6 +
  noise(x * 1.7, seed + 7) * 0.3 +
  noise(x * 4.3, seed + 13) * 0.1;

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
  /** Foliage picks up the active mode's colour, so the landscape shifts with it. */
  accent = "#9edd01",
  className = "",
}: {
  width: number;
  height: number;
  active?: boolean;
  running?: boolean;
  accent?: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizedFor = useRef("");
  const startedAt = useRef<number | null>(null);
  const off = useRef({ stars: 0, far: 0, mid: 0, ground: 0, gallop: 0 });
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
    o.stars += SPEED.stars * spin * dt;
    o.far += SPEED.far * spin * dt;
    o.mid += SPEED.mid * spin * dt;
    o.ground += SPEED.ground * spin * dt;
    o.gallop += STRIDE_HZ * spin * dt;

    // ---- geometry ---------------------------------------------------------
    const cols = Math.ceil(width / PITCH) + 2;
    const rows = Math.floor(height / PITCH);
    const groundTop = rows - 3;
    // Ceiling for every moving thing: ridges, props, the horse and the moon.
    const ceilRow = Math.ceil(rows * SKY_BAND);
    const band = groundTop - ceilRow;
    const skyRows = Math.max(ceilRow - 1, 2);
    const half = PITCH / 2;

    const foliage = rgbOf(accent);
    const palette = {
      bush: mix(foliage, 0.92),
      bushDark: mix(foliage, 0.55),
      tuft: mix(foliage, 0.78),
    };

    // Amplitudes fill the band below the ceiling, whatever the card height is,
    // and are clamped so a tall peak can never reach the label.
    const farTop = (w: number) =>
      Math.max(
        ceilRow,
        groundTop - 2 - Math.round(Math.pow(fbm(w * 0.1, 1), 2.1) * band),
      );
    const midTop = (w: number) =>
      Math.max(
        ceilRow + 1,
        groundTop -
          1 -
          Math.round(Math.pow(fbm(w * 0.17, 2), 2.1) * (band - 2)),
      );

    const propAt = (bucket: number) => {
      const r = hash(bucket * 19.7);
      return r > 0.84
        ? ({ kind: "pine", w: 5, h: 5 } as const)
        : ({
            kind: "bush",
            w: 3 + Math.floor(hash(bucket * 31.1) * 3),
            h: 2 + Math.floor(hash(bucket * 7.3) * 2),
          } as const);
    };

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

    // --- sky ---------------------------------------------------------------
    const starSpan = cols * 3;
    for (let i = 0; i < 34; i++) {
      const x = hash(i * 3.3) * starSpan;
      const col = (((x - o.stars) % starSpan) + starSpan) % starSpan;
      if (col > cols) continue;
      const twinkle =
        0.65 + 0.35 * Math.sin(time / 620 + hash(i * 2.1 + 5) * 6.28);
      const base = 0.35 + hash(i * 5.9 + 3) * 0.5;
      put(
        COLORS.star,
        Math.floor(col),
        Math.floor(hash(i * 7.7 + 11) * skyRows),
        base * twinkle,
        col % 1,
      );
    }

    // --- ridges ------------------------------------------------------------
    const ridge = (
      topAt: (w: number) => number,
      offset: number,
      color: string,
      crest: number,
      fill: number,
      caps: boolean,
    ) => {
      const base = Math.floor(offset);
      const frac = offset - base;
      for (let c = -1; c <= cols; c++) {
        const w = c + base;
        const top = topAt(w);
        const prev = topAt(w - 1);
        const next = topAt(w + 1);
        // Crest, plus the vertical run connecting this column to the previous
        // one — that is what keeps the skyline unbroken on a slope.
        for (let r = Math.min(top, prev); r <= top; r++)
          put(color, c, r, r === top ? crest : crest * 0.72, frac);
        // Body of the hill: a third-density dither, so it has mass without
        // becoming a block.
        for (let r = top + 1; r < groundTop; r++)
          if ((w * 2 + r) % 3 === 0) put(color, c, r, fill, frac);
        if (caps && top <= prev && top < next) put(COLORS.cap, c, top, 1, frac);
      }
    };

    ridge(farTop, o.far, COLORS.far, 0.42, 0.18, false);
    ridge(midTop, o.mid, COLORS.mid, 0.95, 0.32, true);

    const MOON = ["..#..", ".###.", "#####", ".###.", "..#.."];
    MOON.forEach((line, r) =>
      [...line].forEach((c, i) => {
        if (c === "#") put(COLORS.moon, cols - 10 + i, 1 + r, 0.8, 0);
      }),
    );

    // Props stand on the mid ridge.
    {
      const base = Math.floor(o.mid);
      const frac = o.mid - base;
      for (let c = -1; c <= cols; c++) {
        const w = c + base;
        if (w % 6 !== 0) continue;
        const bucket = Math.floor(w / 6);
        if (hash(bucket * 11.3) <= 0.52) continue;
        const p = propAt(bucket);
        const top = Math.max(midTop(w), ceilRow + p.h);
        if (p.kind === "pine") {
          for (let r = 0; r < p.h; r++) {
            const halfW = Math.floor((r * (p.w - 1)) / (2 * (p.h - 1)));
            for (let d = -halfW; d <= halfW; d++)
              put(
                r < 2 ? palette.bush : palette.bushDark,
                c + d,
                top - p.h + r,
                1,
                frac,
              );
          }
        } else {
          for (let r = 0; r < p.h; r++)
            for (let d = 0; d < p.w; d++) {
              if (r === 0 && (d === 0 || d === p.w - 1)) continue;
              put(
                r === 0 ? palette.bush : palette.bushDark,
                c + d,
                top - p.h + r,
                1,
                frac,
              );
            }
        }
      }
    }

    // --- ground band -------------------------------------------------------
    // A full lattice rather than a dither: every cell is lit, and depth alone
    // carries the falloff. That is what makes it read as a panel of dots the
    // scene is printed on.
    {
      const base = Math.floor(o.ground);
      const frac = o.ground - base;
      for (let c = -1; c <= cols; c++) {
        const w = c + base;
        for (let r = groundTop; r < rows; r++) {
          const depth = (r - groundTop) / Math.max(rows - groundTop - 1, 1);
          if (r === groundTop) {
            const tuft = hash(w * 3.9) > 0.84;
            put(
              tuft ? palette.tuft : COLORS.groundEdge,
              c,
              r,
              tuft ? 1 : 0.85,
              frac,
            );
            continue;
          }
          const speck = hash(w * 7.1 + r * 13.7);
          put(
            speck > 0.93 ? COLORS.groundEdge : COLORS.ground,
            c,
            r,
            0.42 + depth * 0.45,
            frac,
          );
        }
      }
    }

    // --- horse -------------------------------------------------------------
    // Sampled as a distance field: inside the silhouette dots are full size,
    // and across the last cell or so at the edge they taper to nothing. That
    // taper is the halftone, and it is also why the gallop reads as fluid —
    // the edge moves continuously rather than a dot blinking on or off.
    const segs = horseSegments(o.gallop % 1, rigRef.current);
    const S = Math.min(HORSE_SCALE_MAX, (band + 0.6) / RIG_TALL);
    const originRow = groundTop - Math.round(RIG_DROP * S);
    const originCol = Math.round(cols * 0.27);
    const y0 = Math.floor(RIG.top * S);
    const y1 = Math.ceil(RIG.bottom * S);
    const x0 = Math.floor(RIG.left * S);
    const x1 = Math.ceil(RIG.right * S);
    for (let ly = y0; ly <= y1; ly++) {
      for (let lx = x0; lx <= x1; lx++) {
        const rx = lx / S;
        const ry = ly / S;
        let d = Infinity;
        for (let i = 0; i < segs.length; i++) {
          const v = sdCapsule(rx, ry, segs[i]);
          if (v < d) d = v;
        }
        d *= S; // rig units -> grid cells
        if (d >= HALFTONE_FALLOFF) continue;
        let k = (HALFTONE_FALLOFF - d) / (2 * HALFTONE_FALLOFF);
        if (k > 1) k = 1;
        k = k * k * (3 - 2 * k); // smoothstep
        if (k <= 0.04) continue;
        put(COLORS.horse, originCol + lx, originRow + ly, 1, 0, k);
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
        ctx.moveTo(x + qr, y);
        ctx.arc(x, y, qr, 0, Math.PI * 2);
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
