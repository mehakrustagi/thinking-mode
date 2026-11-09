"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { DotMatrix } from "./DotMatrix";
import { ShimmerText } from "./ShimmerText";
import { MODES, labelImage, type Mode } from "@/lib/modes";
import { EASE_OUT, MORPH, SWAP } from "@/lib/motion";

/** The mode the pill settles into once the run resolves. */
const SETTLED: Mode = {
  id: "booking",
  label: "Booked",
  dot: "#01ddd6",
  hue: 178,
  muted: "#6d7fa6",
  steps: [],
};

export function ThinkingPill({
  mode,
  modeIndex,
  steps,
  settled,
  expanded,
  onToggle,
}: {
  /** Mode currently being displayed. */
  mode: Mode;
  /** Index into MODES — drives the done/active/pending ladder in the panel. */
  modeIndex: number;
  /** Steps revealed so far for the active mode. */
  steps: string[];
  settled: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const shown = settled ? SETTLED : mode;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[96px] z-30 flex flex-col items-center">
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${shown.label} — show agent steps`}
        className="pointer-events-auto flex h-[44px] items-center rounded-[var(--radius-pill)] bg-black pl-[20px] pr-[10px] outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        // layout drives the width morph as the label changes length.
        layout
        initial={{ opacity: 0, scale: 0.82, y: -10, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        transition={{ ...MORPH, filter: { duration: 0.4, ease: EASE_OUT } }}
        whileTap={{ scale: 0.96 }}
      >
        <motion.span layout="position" className="flex items-center">
          <DotMatrix color={shown.dot} active={!settled} />
        </motion.span>

        {/* Fixed-slot label: the outgoing word leaves upward as the new one
            rises in, while `layout` retimes the pill's width around them. */}
        <motion.span
          layout="position"
          className="relative ml-[12px] mr-[7px] flex items-center"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={shown.label}
              layout="position"
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={SWAP}
              className="block whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[-0.28px]"
            >
              <ShimmerText
                active={!settled}
                duration={2.2}
                image={labelImage(shown)}
              >
                {shown.label}
                {settled ? "" : "..."}
              </ShimmerText>
            </motion.span>
          </AnimatePresence>
        </motion.span>

        <motion.span
          layout="position"
          className="flex size-[18px] items-center justify-center"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <Image
            src="/icons/chevron.svg"
            alt=""
            width={18}
            height={18}
            className="-rotate-90"
          />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            className="pointer-events-auto mt-[10px] w-[306px] overflow-hidden rounded-[var(--radius-card)] bg-black/95 backdrop-blur-xl"
            initial={{ opacity: 0, height: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, y: -8, scale: 0.96 }}
            transition={{ ...MORPH, opacity: { duration: 0.22 } }}
          >
            <div className="flex flex-col gap-[14px] px-[20px] py-[18px]">
              {MODES.map((m, i) => {
                const status =
                  settled || i < modeIndex
                    ? "done"
                    : i === modeIndex
                      ? "active"
                      : "pending";
                return (
                  <ModeRow
                    key={m.id}
                    mode={m}
                    status={status}
                    steps={status === "active" ? steps : []}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeRow({
  mode,
  status,
  steps,
}: {
  mode: Mode;
  status: "done" | "active" | "pending";
  steps: string[];
}) {
  return (
    <div className="flex gap-[10px]">
      <span className="mt-[3px] flex size-[12px] shrink-0 items-center justify-center">
        {status === "done" ? (
          <Tick color={mode.dot} />
        ) : status === "active" ? (
          <motion.span
            className="block size-[6px] rounded-full"
            style={{ backgroundColor: mode.dot }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.45, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : (
          <span className="block size-[6px] rounded-full bg-white/18" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <motion.p
          className="text-[13px] font-semibold leading-[18px] tracking-[-0.26px]"
          animate={{
            color:
              status === "pending"
                ? "rgba(255,255,255,0.30)"
                : status === "done"
                  ? "rgba(255,255,255,0.55)"
                  : mode.dot,
          }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
        >
          {mode.label}
        </motion.p>

        {/* Steps for the live mode, one line at a time. */}
        <AnimatePresence initial={false}>
          {steps.map((step, i) => (
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6, filter: "blur(5px)", height: 0 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", height: 18 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.38, ease: EASE_OUT, delay: i * 0.02 }}
              className="overflow-hidden text-[12px] font-medium leading-[18px] tracking-[-0.12px] text-white/45"
            >
              {step}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Tick({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <motion.path
        d="M2.5 6.4L4.8 8.7L9.5 3.6"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
      />
    </svg>
  );
}
