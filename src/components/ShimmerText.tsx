"use client";

import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/**
 * Text with a highlight travelling through it.
 *
 * The sweep is what separates "this is still happening" from "this is the
 * answer": when `active` goes false the highlight parks and the text settles.
 * It parks at the loop's own start position rather than mid-sweep — parking at
 * 50% would freeze a bright band through settled copy.
 */
export function ShimmerText({
  children,
  active = true,
  base = "#999999",
  highlight = "#ffffff",
  /** Overrides base/highlight when a mode specifies its own gradient. */
  image,
  /** Seconds for one pass. Slower reads as ambient; faster reads as a spinner. */
  duration = 2.6,
  className = "",
  style,
}: {
  children: ReactNode;
  active?: boolean;
  base?: string;
  highlight?: string;
  image?: string;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.span
      // Start at the animate values rather than transitioning into them, so
      // text arriving already-settled doesn't do a phantom half-sweep.
      initial={false}
      className={`gradient-text ${className}`}
      style={{
        backgroundImage:
          image ??
          `linear-gradient(100deg, ${base} 38%, ${highlight} 50%, ${base} 62%)`,
        backgroundSize: "260% 100%",
        ...style,
      }}
      animate={
        active
          ? { backgroundPosition: ["180% 0%", "-80% 0%"] }
          : { backgroundPosition: "180% 0%" }
      }
      transition={
        active
          ? { duration, repeat: Infinity, ease: "linear" }
          : { duration: 0.4, ease: "easeOut" }
      }
    >
      {children}
    </motion.span>
  );
}
