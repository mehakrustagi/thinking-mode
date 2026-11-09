"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { EASE_OUT } from "@/lib/motion";

/**
 * An inline reference the agent pulled from somewhere else — a date range, a
 * saved preference. Figma paints these with a #002411 -> #a1e000 gradient and
 * a trailing chevron; the one-shot sweep on arrival is what marks it as a
 * live lookup rather than emphasis.
 */
export function AgentChip({
  children,
  delay = 0,
}: {
  children: string;
  delay?: number;
}) {
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <motion.span
        className="gradient-text text-[14px] font-semibold leading-[20px] tracking-[-0.28px]"
        style={{
          backgroundImage:
            "linear-gradient(100deg, var(--chip-from) 20%, var(--chip-to) 44%, #ffffff 50%, var(--chip-to) 56%, var(--chip-from) 92%)",
          backgroundSize: "260% 100%",
        }}
        initial={{ backgroundPosition: "180% 0%" }}
        animate={{ backgroundPosition: ["180% 0%", "-80% 0%", "-80% 0%"] }}
        transition={{
          duration: 1.5,
          times: [0, 0.6, 1],
          ease: EASE_OUT,
          delay,
        }}
      >
        {children}
      </motion.span>
      <Image
        src="/icons/chevron.svg"
        alt=""
        width={18}
        height={18}
        className="-mx-[2px] -mb-[3px] rotate-180 self-center"
      />
    </span>
  );
}
