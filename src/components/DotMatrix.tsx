"use client";

import { motion } from "framer-motion";

/**
 * The 3x3 matrix that sits at the head of the pill.
 *
 * Figma draws it as nine 6.667px dots on a 6.667px pitch (they touch), with a
 * fixed anti-diagonal opacity ramp: 1.0 at the top-left falling to 0.1 at the
 * bottom-right. That ramp is kept as each dot's floor, and a wave runs across
 * the same diagonal on top of it — so the static design is what you see the
 * instant the wave passes, and the motion only ever adds light.
 */

const DOT = 6.667;
const SIZE = DOT * 3;

/** Figma's ramp, indexed [row][col]. */
const FLOOR = [
  [1.0, 0.8, 0.5],
  [0.8, 0.5, 0.2],
  [0.5, 0.2, 0.1],
];

const WAVE_S = 1.6;

export function DotMatrix({
  color,
  active = true,
  className = "",
}: {
  color: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: SIZE, height: SIZE }}
      aria-hidden
    >
      {FLOOR.map((row, r) =>
        row.map((floor, c) => (
          <motion.span
            key={`${r}-${c}`}
            className="absolute rounded-full"
            style={{ width: DOT, height: DOT, left: c * DOT, top: r * DOT }}
            // backgroundColor is animated (not set) so a mode change
            // cross-fades the whole matrix instead of cutting.
            animate={{
              backgroundColor: color,
              opacity: active ? [floor, 1, floor] : floor,
              scale: active ? [1, 1.18, 1] : 1,
            }}
            transition={{
              backgroundColor: { duration: 0.45, ease: "easeOut" },
              opacity: active
                ? {
                    duration: WAVE_S,
                    repeat: Infinity,
                    ease: "easeInOut",
                    // Anti-diagonal offset: the wave runs top-left to
                    // bottom-right, the same direction as Figma's ramp.
                    delay: ((c + r) * 0.16) % WAVE_S,
                  }
                : { duration: 0.4, ease: "easeOut" },
              scale: active
                ? {
                    duration: WAVE_S,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: ((c + r) * 0.16) % WAVE_S,
                  }
                : { duration: 0.4, ease: "easeOut" },
            }}
          />
        )),
      )}
    </div>
  );
}
