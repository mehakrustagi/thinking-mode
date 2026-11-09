"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { EASE_OUT } from "@/lib/motion";

/**
 * Title bar. The Figma "bg overlay" is a 402x250 stack of stepped gradients
 * that fades the conversation out behind it — exported as-is so the falloff
 * matches, with a progressive blur layered under it for the frosted read.
 */
export function Header() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[200px]"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      {/* Frosted falloff: blur strongest at the top, gone by ~160px. */}
      <div
        className="absolute inset-x-0 top-0 h-[160px] backdrop-blur-[10px]"
        style={{
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 52%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 52%, transparent 100%)",
        }}
      />
      <Image
        src="/icons/header-fade.svg"
        alt=""
        width={402}
        height={250}
        className="absolute left-0 top-[-50px] w-[402px]"
        priority
      />

      <motion.button
        type="button"
        aria-label="Back"
        className="pointer-events-auto absolute left-[24px] top-[48px] grid size-[44px] place-items-center rounded-full border border-[#ecf3fe] opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #ffffff 0%, #f2f2f2 10.1%, #f2f2f2 80.8%, #ffffff 100%)",
          boxShadow:
            "inset 0 1px 1px #ffffff, inset 0 -1px 3px rgba(0,0,0,0.04)",
        }}
        whileHover={{ scale: 1.06, opacity: 1 }}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.2, ease: EASE_OUT }}
      >
        <Image src="/icons/chevron.svg" alt="" width={20} height={20} />
      </motion.button>

      <p className="absolute inset-x-0 top-[60px] text-center text-[14px] font-semibold leading-[20px] tracking-[-0.28px] text-[color:var(--ink-900)]">
        Flight to Ho Chi Minh
      </p>

      <motion.button
        type="button"
        aria-label="Settings"
        className="pointer-events-auto absolute right-[24px] top-[58px] size-[24px]"
        whileHover={{ rotate: 45 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <Image src="/icons/settings.svg" alt="" width={24} height={24} />
      </motion.button>
    </motion.div>
  );
}
