"use client";

import { useEffect, useRef } from "react";
import { HORSE, HORSE_FRAMES, HORSE_H, HORSE_W } from "@/lib/horse";

/**
 * The dot-matrix landscape the agent runs through while it thinks.
 *
 * Everything is one grid of dots on a 4px pitch — sky, hills, ground texture
 * and the horse all snap to the same lattice, which is what makes it read as a
 * single display rather than a drawing with sprites on top. Terrain is sampled
 * by absolute world column from a seeded value-noise, so each layer scrolls
 * forever without holding any state; only the offsets advance.
 */

const PITCH = 4;
const DOT = 2.4;

const COLORS = {
  star: "255,255,255",
  moon: "255,255,255",
  far: "72,72,72",
  mid: "116,116,116",
  cap: "214,214,214",
  bush: "143,191,74",
  bushDark: "95,138,46",
  ground: "58,58,58",
  groundEdge: "107,107,107",
  tuft: "122,168,62",
  horse: "255,255,255",
};

/** Layer speeds in grid columns per second. */
const SPEED = { stars: 0.4, far: 1.6, mid: 4.5, ground: 11 };
const GALLOP_FPS = 11;

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

type Cell = [number, number, number]; // col, row, alpha

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

export function PixelScene({
  width,
  height,
  running = true,
  /** Foliage picks up the active mode's colour, so the landscape shifts with it. */
  accent = "#9edd01",
  className = "",
}: {
  width: number;
  height: number;
  running?: boolean;
  accent?: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    el.width = width * dpr;
    el.height = height * dpr;
    ctx.scale(dpr, dpr);

    const foliage = rgbOf(accent);
    const palette = {
      ...COLORS,
      bush: mix(foliage, 0.92),
      bushDark: mix(foliage, 0.55),
      tuft: mix(foliage, 0.78),
    };

    const cols = Math.ceil(width / PITCH) + 1;
    const rows = Math.floor(height / PITCH);

    const groundTop = rows - 4;
    const horseBase = groundTop - 1; // feet land just above the ground band
    const horseCol = Math.round(cols * 0.3);

    // Sky is everything above the tallest hill — where stars and the moon live.
    const skyRows = Math.max(groundTop - 10, 4);
    const stars = Array.from({ length: 34 }, (_, i) => ({
      x: hash(i * 3.3) * cols * 3,
      y: Math.floor(hash(i * 7.7 + 11) * skyRows),
      phase: hash(i * 2.1 + 5) * Math.PI * 2,
      base: 0.35 + hash(i * 5.9 + 3) * 0.5,
    }));

    // Figma draws the moon as a dot flower — the same motif as the pill's matrix.
    const MOON = ["..#..", ".###.", "#####", ".###.", "..#.."];
    const moonCol = cols - 9;
    const moonRow = 1;

    const buckets = new Map<
      number,
      { kind: "bush" | "pine"; w: number; h: number }
    >();
    const propAt = (bucket: number) => {
      let p = buckets.get(bucket);
      if (!p) {
        const r = hash(bucket * 19.7);
        p =
          r > 0.84
            ? { kind: "pine", w: 5, h: 5 }
            : {
                kind: "bush",
                w: 3 + Math.floor(hash(bucket * 31.1) * 3),
                h: 2 + Math.floor(hash(bucket * 7.3) * 2),
              };
        buckets.set(bucket, p);
      }
      return p;
    };

    const farTop = (w: number) =>
      groundTop - 2 - Math.round(Math.pow(fbm(w * 0.1, 1), 2.1) * 20);
    const midTop = (w: number) =>
      groundTop - 1 - Math.round(Math.pow(fbm(w * 0.17, 2), 2.1) * 14);

    let raf = 0;
    let last = performance.now();
    const t0 = last;
    const off = { stars: 0, far: 0, mid: 0, ground: 0 };

    const paint = (now: number) => {
      // rAF's timestamp can predate the performance.now() taken at setup, so
      // both the delta and the clock are floored at zero.
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.05);
      last = now;
      if (running) {
        off.stars += SPEED.stars * dt;
        off.far += SPEED.far * dt;
        off.mid += SPEED.mid * dt;
        off.ground += SPEED.ground * dt;
      }
      const t = Math.max((now - t0) / 1000, 0);

      ctx.clearRect(0, 0, width, height);

      const layers: Record<string, Cell[]> = {};
      const put = (color: string, col: number, row: number, alpha = 1) => {
        if (row < 0 || row >= rows || col < 0 || col > cols) return;
        (layers[color] ??= []).push([col, row, alpha]);
      };

      // --- sky -----------------------------------------------------------
      for (const s of stars) {
        const col = Math.round(
          (((s.x - off.stars) % (cols * 3)) + cols * 3) % (cols * 3),
        );
        if (col > cols) continue;
        const twinkle = running ? 0.65 + 0.35 * Math.sin(t * 1.6 + s.phase) : 1;
        put(COLORS.star, col, s.y, s.base * twinkle);
      }
      MOON.forEach((line, r) =>
        [...line].forEach((ch, c) => {
          if (ch === "#") put(COLORS.moon, moonCol + c, moonRow + r, 0.85);
        }),
      );

      // --- ridges ---------------------------------------------------------
      // Outlines, not fills: each column draws the crest plus whatever
      // vertical run connects it to its neighbour, so the skyline stays a
      // one-dot line and the space beneath it stays black.
      const ridge = (
        topAt: (w: number) => number,
        offset: number,
        color: string,
        fill: number,
        caps: boolean,
      ) => {
        for (let c = 0; c <= cols; c++) {
          const w = c + offset;
          const top = topAt(w);
          const prev = topAt(w - 1);
          const next = topAt(w + 1);
          // Crest, plus the vertical run that connects this column to the
          // previous one — that is what keeps the skyline unbroken on a slope.
          for (let r = Math.min(top, prev); r <= top; r++)
            put(color, c, r, r === top ? 1 : 0.75);
          // Body of the hill: a third-density dither, so it has mass without
          // becoming a block.
          for (let r = top + 1; r < groundTop; r++)
            if ((c * 2 + r) % 3 === 0) put(color, c, r, fill);
          if (caps && top <= prev && top < next) put(COLORS.cap, c, top, 1);
        }
      };

      ridge(farTop, off.far, COLORS.far, 0.3, false);
      ridge(midTop, off.mid, COLORS.mid, 0.4, true);

      // Props stand on the mid ridge.
      for (let c = 0; c <= cols; c++) {
        const w = c + off.mid;
        const top = midTop(w);
        const bucket = Math.floor(w / 6);
        if (hash(bucket * 11.3) > 0.52 && Math.floor(w) % 6 === 0) {
          const p = propAt(bucket);
          if (p.kind === "pine") {
            for (let r = 0; r < p.h; r++) {
              const halfWidth = Math.floor((r * (p.w - 1)) / (2 * (p.h - 1)));
              for (let d = -halfWidth; d <= halfWidth; d++) {
                put(
                  r < 2 ? palette.bush : palette.bushDark,
                  c + d,
                  top - p.h + r,
                  1,
                );
              }
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
                );
              }
          }
        }
      }

      // --- ground band ----------------------------------------------------
      // A full lattice rather than a dither: every cell is lit, and depth
      // alone carries the falloff. That is what makes it read as a panel of
      // dots the scene is printed on.
      for (let c = 0; c <= cols; c++) {
        const w = Math.floor(c + off.ground);
        for (let r = groundTop; r < rows; r++) {
          const depth = (r - groundTop) / Math.max(rows - groundTop - 1, 1);
          if (r === groundTop) {
            const tuft = hash(w * 3.9) > 0.84;
            put(tuft ? palette.tuft : COLORS.groundEdge, c, r, tuft ? 1 : 0.85);
            continue;
          }
          const speck = hash(w * 7.1 + r * 13.7);
          put(
            speck > 0.93 ? COLORS.groundEdge : COLORS.ground,
            c,
            r,
            0.42 + depth * 0.45,
          );
        }
      }

      // --- horse ----------------------------------------------------------
      const frame = running ? Math.floor(t * GALLOP_FPS) % HORSE_FRAMES : 0;
      const grid = HORSE[frame];
      for (let r = 0; r < HORSE_H; r++)
        for (let c = 0; c < HORSE_W; c++)
          if (grid[r][c])
            put(COLORS.horse, horseCol + c, horseBase - (HORSE_H - 1) + r, 1);

      // --- flush, one path per colour -------------------------------------
      const half = PITCH / 2;
      for (const [color, cells] of Object.entries(layers)) {
        // Alpha varies per dot, so group runs of equal alpha into one path.
        let current = -1;
        let open = false;
        for (const [c, r, a] of cells) {
          const q = Math.round(a * 16);
          if (q !== current) {
            if (open) ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = `rgba(${color},${q / 16})`;
            current = q;
            open = true;
          }
          ctx.moveTo(c * PITCH + half + DOT / 2, r * PITCH + half);
          ctx.arc(c * PITCH + half, r * PITCH + half, DOT / 2, 0, Math.PI * 2);
        }
        if (open) ctx.fill();
      }

      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [width, height, running, accent]);

  return (
    <canvas
      ref={canvas}
      className={className}
      style={{ width, height, display: "block" }}
      aria-hidden
    />
  );
}
