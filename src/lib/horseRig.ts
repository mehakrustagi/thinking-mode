/**
 * The horse, as an articulated rig rather than a sprite sheet.
 *
 * Four hand-drawn frames cut between poses eleven times a second — fine for
 * pixel art, wrong for this. Here the body is a set of capsules whose joints
 * are driven by continuous functions of the gallop phase, so there are no
 * frames at all: every rendered moment is a new pose.
 *
 * The scene samples the rig as a distance field, which is what produces the
 * halftone falloff — dots at full size through the body, tapering to nothing
 * across the last couple of cells at the edge.
 *
 * Units are grid cells. +x is forward, +y is down, the origin sits at the
 * centre of the barrel.
 */

export type Capsule = {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  r: number;
};

/** How far the rig reaches from its origin, for bounding the sample window. */
export const RIG = { left: -14, right: 14, top: -9, bottom: 10 };

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;

/**
 * One leg: a thigh swinging about the hip and a cannon folding at the knee.
 * The swing is a sine, the knee flex a raised cosine a quarter-cycle behind —
 * enough to read as reach, plant, push and tuck without a gait solver.
 */
function leg(
  out: Capsule[],
  hx: number,
  hy: number,
  upper: number,
  lower: number,
  p: number,
  swing: number,
  kneeBase: number,
  kneeAmp: number,
  ru: number,
  rl: number,
) {
  const sw = swing * Math.sin(TAU * p);
  const knee = kneeBase + (kneeAmp * (1 - Math.cos(TAU * p))) / 2;
  const a1 = (90 + sw) * RAD; // 90deg points straight down
  const kx = hx + Math.cos(a1) * upper;
  const ky = hy + Math.sin(a1) * upper;
  const a2 = a1 - knee * RAD;
  out.push({ ax: hx, ay: hy, bx: kx, by: ky, r: ru });
  out.push({
    ax: kx,
    ay: ky,
    bx: kx + Math.cos(a2) * lower,
    by: ky + Math.sin(a2) * lower,
    r: rl,
  });
}

/** Legs, in draw order: both hinds, then both fores. */
const GAIT = [
  { hind: true, phase: 0.0 },
  { hind: true, phase: 0.14 },
  { hind: false, phase: 0.48 },
  { hind: false, phase: 0.62 },
];

export function horseSegments(t: number, out: Capsule[] = []): Capsule[] {
  out.length = 0;
  // One bounce per stride — the suspension phase.
  const bob = -0.65 * Math.sin(TAU * t);
  const push = (ax: number, ay: number, bx: number, by: number, r: number) =>
    out.push({ ax, ay: ay + bob, bx, by: by + bob, r });

  // barrel, rump, chest
  push(-5.6, 0.2, 3.0, -0.1, 2.9);
  push(-6.2, -0.2, -4.8, 0.4, 3.1);
  push(2.2, 0.0, 3.4, -0.8, 2.6);
  // neck (thick at the base, tapering), head, muzzle, ear
  push(2.6, -1.2, 5.6, -3.4, 2.0);
  push(5.6, -3.4, 7.8, -5.0, 1.5);
  push(7.8, -5.4, 10.9, -6.1, 1.2);
  push(10.9, -6.1, 12.4, -5.6, 0.8);
  push(8.2, -6.5, 8.5, -7.6, 0.42);
  // tail
  push(-6.4, -1.9, -9.6, -3.8, 0.8);
  push(-9.6, -3.8, -12.4, -4.6, 0.42);

  for (const g of GAIT) {
    const p = (t + g.phase) % 1;
    if (g.hind) leg(out, -4.4, 1.7 + bob, 3.3, 3.6, p, 50, 10, 92, 1.2, 0.85);
    else leg(out, 2.0, 1.5 + bob, 3.2, 3.6, p, 46, 6, 86, 1.2, 0.85);
  }
  return out;
}

/** Distance from a point to a capsule's spine, minus its radius. */
export function sdCapsule(px: number, py: number, c: Capsule) {
  const vx = c.bx - c.ax;
  const vy = c.by - c.ay;
  const wx = px - c.ax;
  const wy = py - c.ay;
  const len = vx * vx + vy * vy;
  const h = len === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len));
  const dx = wx - vx * h;
  const dy = wy - vy * h;
  return Math.sqrt(dx * dx + dy * dy) - c.r;
}
