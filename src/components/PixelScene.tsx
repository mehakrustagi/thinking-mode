"use client";

import {
  cubicBezier,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import type { DotShape, ModeId } from "@/lib/modes";
import { PALETTES, type ThemeName } from "@/lib/palette";
import { SCENES, type SceneCtx } from "@/lib/scenes";

/**
 * The engine. It owns the grid, the clock and the paint; the scenes own what
 * goes on it.
 *
 * Everything is one grid of dots on a 4px pitch, which is what makes a scene
 * read as a single display rather than a drawing with sprites on top. Two
 * things keep it fluid:
 *
 * 1. Sub-pixel scrolling. The *pattern* advances one lattice cell at a time
 *    (it has to — it is a dot grid), but the field is drawn at a fractional
 *    pixel offset, so the dots glide instead of teleporting a whole cell.
 * 2. One driver. The loop runs on framer's animation frame rather than its own
 *    requestAnimationFrame, so it is scheduled alongside the layout springs
 *    driving the card rather than competing with them for the same frame.
 */

const PITCH = 4;
const DOT = 2.8;

/** Base scroll rate, in grid columns per second, at speed factor 1. */
const WORLD_SPEED = 13;
const SLOW_SPEED = 1.4;
/** Strides per second. Continuous — there are no frames to step between. */
const STRIDE_HZ = 2.6;
/** The run accelerates, like the game it is borrowed from. */
const SPEED_RAMP = { gain: 0.55, overSeconds: 22 };

/** Dots wipe in left to right, then the world starts moving. */
const REVEAL_MS = 900;
const SPINUP_MS = 1100;
const WIPE_COLS = 10;
/** A mode change wipes the new scene over the old one. */
const SWAP_MS = 620;

/**
 * Share of the card the label keeps for itself. Nothing reaches into it —
 * not the subject at the top of its arc, not a cloud, not a cactus.
 */
const LABEL_BAND = 0.46;

const easeOut = cubicBezier(0.22, 1, 0.36, 1);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** "#9edd01" -> "158,221,1" */
function rgbOf(hex: string) {
  if (hex.startsWith("rgb")) return hex.slice(hex.indexOf("(") + 1, -1);
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const mix = (rgb: string, k: number) =>
  rgb
    .split(",")
    .map((v) => Math.round(Number(v) * k))
    .join(",");

const SHAPES: DotShape[] = ["circle", "square", "bar", "diamond"];

/** x, y (px, already sub-pixel offset), alpha, radius, shape index. */
type Cell = [number, number, number, number, number];

export function PixelScene({
  width,
  height,
  /** Which mode's scene to draw. A change wipes the new one over the old. */
  scene,
  /** Flips true when the card opens: starts the wipe-in, then the scroll. */
  active = true,
  /** Freezes the world without hiding it. */
  running = true,
  /** The active mode's colour — whatever the scene is made of takes it. */
  accent = "#9edd01",
  theme = "night",
  className = "",
}: {
  width: number;
  height: number;
  scene: ModeId;
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
  const off = useRef({ world: 0, slow: 0, gallop: 0 });
  // Scene changes cross-wipe, so the previous one has to stick around.
  const swap = useRef<{ from: ModeId; at: number } | null>(null);
  const shown = useRef<ModeId>(scene);
  const accents = useRef({ scene, accent });
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
      shown.current = scene;
      swap.current = null;
      ctx.clearRect(0, 0, width, height);
      return;
    }
    if (startedAt.current === null) startedAt.current = time;
    const since = time - startedAt.current;

    if (scene !== shown.current) {
      swap.current = { from: shown.current, at: time };
      shown.current = scene;
    }
    const swapping =
      swap.current && time - swap.current.at < SWAP_MS ? swap.current : null;
    if (!swapping) swap.current = null;

    // Wipe-in, then spin-up. The wipe runs linear so its edge travels at a
    // constant speed — easing it makes the dots appear all at once and the
    // sweep stops reading. Reduced motion skips straight to a still frame.
    const reveal = reduced ? 1 : clamp01(since / REVEAL_MS);
    const spin =
      reduced || !running
        ? 0
        : easeOut(clamp01((since - REVEAL_MS * 0.55) / SPINUP_MS));

    const dt = Math.min(Math.max(delta, 0), 50) / 1000;
    // Everything shares one speed factor, so the ramp never desynchronises the
    // scenery from the stride and the subject never looks like it is skating.
    const ramp =
      1 +
      SPEED_RAMP.gain *
        Math.min(
          1,
          Math.max(0, (since - REVEAL_MS) / (SPEED_RAMP.overSeconds * 1000)),
        );
    const rate = spin * ramp * dt;
    const o = off.current;
    o.world += WORLD_SPEED * rate;
    o.slow += SLOW_SPEED * rate;
    o.gallop += STRIDE_HZ * ramp * spin * dt;

    // ---- grid -------------------------------------------------------------
    const cols = Math.ceil(width / PITCH) + 2;
    const rows = Math.floor(height / PITCH);
    const ceilRow = Math.ceil(rows * LABEL_BAND);
    const half = PITCH / 2;
    const COLORS = PALETTES[theme];

    ctx.clearRect(0, 0, width, height);
    const layers: Record<string, Cell[]> = {};

    // Set per scene: the mark it draws with, and how its columns are gated.
    let shapeIdx = 0;
    let gateOf: (col: number) => number = () => 1;

    const put = (
      color: string,
      col: number,
      row: number,
      alpha: number,
      frac: number,
      /** 1 = a full dot; below that it shrinks, which is the halftone. */
      size = 1,
    ) => {
      if (row < ceilRow || row >= rows) return;
      const gate = gateOf(col);
      if (gate <= 0.01) return;
      const x = snap((col - frac) * PITCH + half);
      if (x < -PITCH || x > width + PITCH) return;
      (layers[color] ??= []).push([
        x,
        row * PITCH + half,
        alpha * gate,
        (DOT / 2) * size * (0.35 + 0.65 * gate),
        shapeIdx,
      ]);
    };

    const baseCtx = (mode: ModeId): SceneCtx => {
      const a = rgbOf(
        accents.current.scene === mode ? accents.current.accent : accent,
      );
      return {
        cols,
        rows,
        ceilRow,
        band: rows - ceilRow,
        t: since / 1000,
        o,
        colors: COLORS,
        accent: a,
        accentDark: mix(a, 0.55),
        put,
      };
    };
    accents.current = { scene, accent };

    const draw = (mode: ModeId, gate: (col: number) => number) => {
      shapeIdx = Math.max(SHAPES.indexOf(SHAPE_OF[mode]), 0);
      gateOf = gate;
      SCENES[mode](baseCtx(mode));
    };

    const edgeGate = (p: number) => (col: number) =>
      clamp01((p * (cols + WIPE_COLS) - col) / WIPE_COLS);

    if (swapping) {
      const p = clamp01((time - swapping.at) / SWAP_MS);
      const g = edgeGate(p);
      // The old scene survives only ahead of the wipe edge.
      draw(swapping.from, (col) => 1 - g(col));
      draw(scene, g);
    } else {
      draw(scene, edgeGate(reveal));
    }

    // ---- flush, batched by colour then by quantised alpha/size/shape -------
    for (const color in layers) {
      const cells = layers[color];
      cells.sort((a, b) => a[4] - b[4] || a[2] - b[2] || a[3] - b[3]);
      let key = "";
      let open = false;
      for (const [x, y, a, r, sh] of cells) {
        const qa = Math.round(a * 20) / 20;
        const qr = Math.round(r * 8) / 8;
        const k = `${sh}|${qa}|${qr}`;
        if (k !== key) {
          if (open) ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = `rgba(${color},${qa})`;
          key = k;
          open = true;
        }
        switch (SHAPES[sh]) {
          case "square":
            ctx.roundRect(x - qr, y - qr, qr * 2, qr * 2, qr * 0.42);
            break;
          case "bar":
            ctx.roundRect(
              x - qr * 0.72,
              y - qr * 1.15,
              qr * 1.44,
              qr * 2.3,
              qr * 0.5,
            );
            break;
          case "diamond": {
            const d = qr * 1.28;
            ctx.moveTo(x, y - d);
            ctx.lineTo(x + d, y);
            ctx.lineTo(x, y + d);
            ctx.lineTo(x - d, y);
            ctx.closePath();
            break;
          }
          default:
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

const SHAPE_OF: Record<ModeId, DotShape> = {
  thinking: "circle",
  checking: "square",
  analyzing: "bar",
  booking: "diamond",
};
