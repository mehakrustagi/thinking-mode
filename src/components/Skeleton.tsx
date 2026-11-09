"use client";

import { motion } from "framer-motion";

/**
 * The two placeholder bars that stand in for the answer still being written.
 * Figma gives them a flat #eeeded -> #fafafa gradient; the sweep travelling
 * through is the "still generating" tell, and it uses the same highlight
 * grammar as the pill label.
 */
const TONES = {
  light: { base: "#e4e4e4", peak: "#f6f6f6" },
  dark: { base: "#2a2a2a", peak: "#4a4a4a" },
};

export function Skeleton({
  widths = [130, 80],
  /** The bars are a hole in the surface, so they follow it. */
  tone = "light",
}: {
  widths?: number[];
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="flex flex-col gap-[12px]">
      {widths.map((w, i) => (
        <motion.div
          key={w}
          className="h-[8px] rounded-[var(--radius-compact)]"
          style={{
            width: w,
            backgroundImage: `linear-gradient(100deg, ${TONES[tone].base} 34%, ${TONES[tone].peak} 50%, ${TONES[tone].base} 66%)`,
            backgroundSize: "260% 100%",
          }}
          initial={{ opacity: 0, backgroundPosition: "180% 0%" }}
          animate={{ opacity: 1, backgroundPosition: ["180% 0%", "-80% 0%"] }}
          transition={{
            opacity: { duration: 0.3 },
            backgroundPosition: {
              duration: 1.9,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.18,
            },
          }}
        />
      ))}
    </div>
  );
}
