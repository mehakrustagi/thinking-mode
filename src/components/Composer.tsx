"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { EASE_OUT } from "@/lib/motion";

const CARD =
  "rounded-[var(--radius-input)] border border-[color:var(--hairline)] bg-[color:var(--card)] shadow-[var(--shadow-card)]";

/** Figma's `input-actions` chip: a 32px pill with a vertical grey wash. */
function ActionChip({
  icon,
  size = 16,
  label,
  rotate = 0,
}: {
  icon: string;
  size?: number;
  label: string;
  rotate?: number;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      className="relative size-[32px] shrink-0 overflow-hidden rounded-[var(--radius-compact)] border border-[#ecf3fe] opacity-80"
      style={{
        backgroundImage:
          "linear-gradient(180deg, #ffffff 0%, #f2f2f2 10.1%, #f2f2f2 80.8%, #ffffff 100%)",
        boxShadow: "inset 0 1px 1px #ffffff, inset 0 -1px 3px rgba(0,0,0,0.04)",
      }}
      whileHover={{ opacity: 1, scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <span className="absolute inset-0 grid place-items-center">
        <Image
          src={icon}
          alt=""
          width={size}
          height={size}
          style={{ transform: `rotate(${rotate}deg)` }}
        />
      </span>
    </motion.button>
  );
}

export function Composer() {
  return (
    <motion.div
      className="pointer-events-auto absolute inset-x-0 bottom-[22px] z-20 flex flex-col items-center gap-[12px] px-[24px]"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.18 }}
    >
      {/* Nudge bar */}
      <motion.button
        type="button"
        className={`flex h-[42px] w-full items-center gap-[8px] px-[12px] ${CARD}`}
        whileHover={{ y: -2, boxShadow: "0 12px 24px 0 rgba(0,0,0,0.06)" }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.25, ease: EASE_OUT }}
      >
        <Image src="/icons/offline_bolt.svg" alt="" width={18} height={18} />
        <span className="flex-1 text-left text-[12px] font-medium leading-[18px] tracking-[-0.12px] text-[color:var(--ink-1000)]">
          Power up your agents while you wait
        </span>
        <Image
          src="/icons/chevron.svg"
          alt=""
          width={18}
          height={18}
          className="rotate-180"
        />
      </motion.button>

      {/* Input */}
      <div className={`h-[125px] w-full ${CARD}`}>
        <p className="px-[16px] pt-[16px] text-[14px] font-medium leading-[20px] tracking-[-0.28px] text-[color:var(--text-secondary)] opacity-50">
          Ask anything
          <span className="caret ml-[1px] inline-block h-[14px] w-[1.5px] translate-y-[2px] bg-current" />
        </p>
        <div className="flex items-center justify-between px-[16px] pt-[25px]">
          <div className="flex gap-[12px]">
            <ActionChip icon="/icons/add.svg" label="Attach" rotate={90} />
            <ActionChip icon="/icons/dialpad.svg" label="Keypad" />
          </div>
          <div className="flex items-center gap-[12px]">
            <ActionChip icon="/icons/mic_none.svg" size={20} label="Voice" />
            <motion.button
              type="button"
              aria-label="Send"
              className="relative size-[32px] shrink-0 overflow-hidden rounded-full bg-black"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Image
                src="/icons/arrow_back.svg"
                alt=""
                width={18}
                height={18}
                className="rotate-90"
              />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
