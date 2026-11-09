"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { DotMatrix } from "./DotMatrix";
import { PixelScene } from "./PixelScene";
import { ShimmerText } from "./ShimmerText";
import { labelBase, labelPeak, type Mode } from "@/lib/modes";
import { EASE_OUT, MORPH, SWAP } from "@/lib/motion";

const CARD = { w: 313, h: 112, r: 28 };
const PILL_R = 60;

/** Beat between the box finishing its growth and the dots starting to arrive. */
const SCENE_DELAY_MS = 280;

const SETTLED: Mode = {
  id: "booking",
  label: "Booked",
  dot: "#01ddd6",
  hue: 178,
  steps: [],
};

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
  onToggle,
}: {
  mode: Mode;
  open: boolean;
  settled: boolean;
  onToggle: () => void;
}) {
  const shown = settled ? SETTLED : mode;
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
          base={labelBase(shown.hue)}
          highlight={labelPeak(shown.hue)}
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
        className={`pointer-events-auto relative overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
          open ? "h-[112px] w-[313px]" : "h-[44px]"
        }`}
        initial={{ opacity: 0, scale: 0.82, y: -10, filter: "blur(8px)" }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          borderRadius: open ? CARD.r : PILL_R,
        }}
        transition={{ ...MORPH, filter: { duration: 0.4, ease: EASE_OUT } }}
        whileTap={{ scale: 0.975 }}
        style={{ boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)" }}
      >
        {/* Collapsed: the pill, exactly. In flow so it sets the box's width. */}
        <motion.span
          className={
            open
              ? "absolute inset-0 flex items-center pl-[20px] pr-[10px]"
              : "flex h-full items-center pl-[20px] pr-[10px]"
          }
          animate={{ opacity: open ? 0 : 1 }}
          transition={{
            duration: open ? 0.16 : 0.3,
            ease: EASE_OUT,
            delay: open ? 0 : 0.14,
          }}
        >
          <DotMatrix color={shown.dot} active={!settled} />
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
          className="absolute inset-0"
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT, delay: open ? 0.16 : 0 }}
        >
          <PixelScene
            width={CARD.w}
            height={CARD.h}
            active={sceneOn}
            running={!settled}
            accent={shown.dot}
          />
          <span className="absolute inset-x-0 top-[14px] flex justify-center">
            {label}
          </span>
        </motion.span>
      </motion.button>
    </div>
  );
}
