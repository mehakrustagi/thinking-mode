"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

/** A user turn: white card, right-aligned, timestamp bottom-right. */
export function Bubble({
  text,
  time = "11:10 am",
  delay = 0,
}: {
  text: string;
  time?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="ml-auto w-[300px] rounded-[var(--radius-card)] border border-[color:var(--hairline)] bg-[color:var(--card)] p-[20px] shadow-[var(--shadow-card)]"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
    >
      <p className="text-[14px] font-medium leading-[20px] tracking-[-0.28px] text-[color:var(--ink-1000)]">
        {text}
      </p>
      <p className="mt-[12px] text-right text-[12px] font-medium leading-[18px] tracking-[-0.12px] text-[color:var(--text-secondary)]">
        {time}
      </p>
    </motion.div>
  );
}
