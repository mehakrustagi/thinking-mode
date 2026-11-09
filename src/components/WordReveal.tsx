"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_OUT } from "@/lib/motion";

/**
 * Word-by-word reveal: opacity + blur + a small y-drop on a tight stagger.
 * Used for copy the agent produces live, so it reads as written rather than
 * pasted. `children` segments let an inline chip sit inside the stream.
 */
export function WordReveal({
  segments,
  delay = 0,
  staggerMs = 34,
  className = "",
}: {
  /** Plain strings are split into words; nodes are revealed as one unit. */
  segments: (string | ReactNode)[];
  delay?: number;
  staggerMs?: number;
  className?: string;
}) {
  let i = 0;
  const units: ReactNode[] = [];

  for (const seg of segments) {
    if (typeof seg === "string") {
      for (const word of seg.split(/(\s+)/)) {
        if (word === "") continue;
        if (/^\s+$/.test(word)) {
          units.push(<span key={`s${i++}`}>{word}</span>);
          continue;
        }
        units.push(
          <Unit key={`w${i}`} index={i++} delay={delay} staggerMs={staggerMs}>
            {word}
          </Unit>,
        );
      }
    } else {
      units.push(
        <Unit key={`n${i}`} index={i++} delay={delay} staggerMs={staggerMs}>
          {seg}
        </Unit>,
      );
    }
  }

  return <p className={className}>{units}</p>;
}

function Unit({
  children,
  index,
  delay,
  staggerMs,
}: {
  children: ReactNode;
  index: number;
  delay: number;
  staggerMs: number;
}) {
  return (
    <motion.span
      className="inline-block align-baseline"
      initial={{ opacity: 0, filter: "blur(8px)", y: 6 }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      transition={{
        delay: delay + index * (staggerMs / 1000),
        duration: 0.34,
        ease: EASE_OUT,
      }}
    >
      {children}
    </motion.span>
  );
}
