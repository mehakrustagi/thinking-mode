"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { DotMatrix } from "./DotMatrix";
import { PixelScene } from "./PixelScene";
import { ShimmerText } from "./ShimmerText";
import { labelBase, labelPeak, type Mode } from "@/lib/modes";
import { EASE_OUT, MORPH, SWAP } from "@/lib/motion";

const PILL = { w: 161, h: 44, r: 60 };
const CARD = { w: 313, h: 112, r: 28 };

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
 * The container morphs between the two geometries with a single `layout`
 * spring; the contents cross-fade inside it. The scene stays mounted through
 * the morph so the horse never restarts its gallop.
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
  const box = open ? CARD : PILL;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[96px] z-30 flex justify-center">
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${shown.label} — ${open ? "collapse" : "expand"}`}
        layout
        className="pointer-events-auto relative overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        initial={{ opacity: 0, scale: 0.82, y: -10, filter: "blur(8px)" }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          width: box.w,
          height: box.h,
          borderRadius: box.r,
        }}
        transition={{ ...MORPH, filter: { duration: 0.4, ease: EASE_OUT } }}
        whileTap={{ scale: 0.975 }}
        style={{ boxShadow: "0 18px 40px -12px rgba(0,0,0,0.45)" }}
      >
        {/* Scene — always mounted, revealed only when the card is open. */}
        <motion.span
          className="absolute inset-0 grid place-items-center"
          animate={{ opacity: open ? 1 : 0 }}
          transition={{
            duration: open ? 0.45 : 0.18,
            ease: EASE_OUT,
            delay: open ? 0.12 : 0,
          }}
        >
          <PixelScene
            width={CARD.w}
            height={CARD.h}
            accent={shown.dot}
            running={!settled}
          />
        </motion.span>

        {/* Label. Centred over the sky when open, inline when collapsed. */}
        <motion.span
          layout="position"
          className="absolute inset-x-0 flex items-center justify-center"
          animate={{ top: open ? 14 : 12 }}
          transition={MORPH}
        >
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
        </motion.span>

        {/* Collapsed chrome: matrix on the left, chevron on the right. */}
        <motion.span
          className="absolute inset-0 flex items-center justify-between px-[20px] pr-[10px]"
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
        >
          <DotMatrix color={shown.dot} active={!settled} />
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
      </motion.button>
    </div>
  );
}
