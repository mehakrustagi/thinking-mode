"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DotMatrix } from "./DotMatrix";
import { PixelScene } from "./PixelScene";
import { ShimmerText } from "./ShimmerText";
import { labelImage, type Mode } from "@/lib/modes";
import type { ThemeName } from "@/lib/palette";
import { EASE_OUT, ISLAND_IN, ISLAND_OUT, MORPH, SWAP } from "@/lib/motion";

const CARD = { w: 313, h: 88, r: 28 };
const PILL_R = 60;

/** Beat between the box finishing its growth and the dots starting to arrive. */
const SCENE_DELAY_MS = 280;

/**
 * The expanded form of the status pill: the same black capsule opened out into
 * a window on the landscape the agent is running through.
 *
 * Collapsed, this is the pill from the steps variant, markup for markup —
 * auto width, so `layout` has a real size to morph from. The sequence is
 * deliberate: the pill holds, the box grows, and only then do the dots arrive.
 */
export function ThinkingCard({
  mode,
  open,
  settled,
  theme = "night",
  onToggle,
}: {
  mode: Mode;
  open: boolean;
  settled: boolean;
  theme?: ThemeName;
  onToggle: () => void;
}) {
  const shown = mode;
  const day = theme === "day";
  const [sceneOn, setSceneOn] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSceneOn(open), open ? SCENE_DELAY_MS : 0);
    return () => clearTimeout(id);
  }, [open]);

  const label = (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={shown.label}
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
        transition={SWAP}
        className="block whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[-0.28px]"
      >
        <ShimmerText
          active={!settled}
          duration={2.2}
          image={labelImage(shown, theme)}
        >
          {shown.label}
          {settled ? "" : "..."}
        </ShimmerText>
      </motion.span>
    </AnimatePresence>
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[96px] z-30 flex justify-center">
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${shown.label} — ${open ? "collapse" : "expand"}`}
        layout
        className={`pointer-events-auto relative overflow-hidden outline-none focus-visible:ring-2 ${
          day
            ? "border border-[#e7e3db] bg-[#fbfaf7] focus-visible:ring-black/20"
            : "bg-black focus-visible:ring-white/40"
        } ${open ? "h-[88px] w-[313px]" : "h-[44px]"}`}
        initial={{ opacity: 0, scale: 0.82, y: -10, filter: "blur(8px)" }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          // Radius rides the same spring as the size, so the capsule never
          // looks like it is being re-cut mid-morph.
          borderRadius: open ? CARD.r : PILL_R,
        }}
        transition={{ ...MORPH, filter: { duration: 0.4, ease: EASE_OUT } }}
        whileTap={{ scale: 0.975 }}
        style={{
          boxShadow: day
            ? "0 14px 30px -14px rgba(60,60,80,0.28)"
            : "0 18px 40px -12px rgba(0,0,0,0.45)",
        }}
      >
        {/* Collapsed: the pill, exactly. In flow so it sets the box's width. */}
        <motion.span
          className={
            open
              ? "absolute inset-0 flex origin-center items-center pl-[20px] pr-[10px]"
              : "flex h-full origin-center items-center pl-[20px] pr-[10px]"
          }
          animate={{ opacity: open ? 0 : 1 }}
          transition={{
            duration: open ? 0.16 : 0.3,
            ease: EASE_OUT,
            delay: open ? 0 : 0.14,
          }}
        >
          <DotMatrix color={day ? shown.muted : shown.dot} active={!settled} />
          <span className="relative ml-[12px] mr-[7px] flex items-center">
            {label}
          </span>
          <span className="flex size-[18px] items-center justify-center">
            <Image
              src="/icons/chevron.svg"
              alt=""
              width={18}
              height={18}
              className="-rotate-90"
            />
          </span>
        </motion.span>

        {/* Expanded: the scene, with the label moved up over the sky. */}
        <motion.span
          className="absolute inset-0 origin-center"
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.94 }}
          transition={open ? ISLAND_IN : ISLAND_OUT}
        >
          <PixelScene
            width={CARD.w}
            height={CARD.h}
            scene={shown.id}
            active={sceneOn}
            running={!settled}
            accent={day ? shown.muted : shown.dot}
            theme={theme}
          />
          <span className="absolute inset-x-0 top-[8px] flex justify-center">
            {label}
          </span>
        </motion.span>
      </motion.button>
    </div>
  );
}
