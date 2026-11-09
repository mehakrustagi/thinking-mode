"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AgentChip } from "./AgentChip";
import { Bubble } from "./Bubble";
import { Composer } from "./Composer";
import { Header } from "./Header";
import { Skeleton } from "./Skeleton";
import { ThinkingCard } from "./ThinkingCard";
import { ThinkingPill } from "./ThinkingPill";
import { WordReveal } from "./WordReveal";
import {
  HOLD_BEFORE_OPEN_MS,
  LOOP_PAUSE_MS,
  MODES,
  MODE_DURATION_MS,
  STEP_INTERVAL_MS,
} from "@/lib/modes";
import { EASE_OUT } from "@/lib/motion";

/**
 * The run: the status element walks the four modes, each one streaming its own
 * steps, then settles and the answer it was writing replaces the placeholder
 * bars.
 *
 * `variant` only changes what sits at the top. "steps" is the pill that opens
 * into the agent's checklist; "scene" is the pill that opens into the
 * dot-matrix landscape it runs through while it works.
 */
export function ChatScreen({
  variant = "steps",
  onComplete,
}: {
  variant?: "steps" | "scene";
  /** Scene variant only: the run finished and is ready to go round again. */
  onComplete?: () => void;
}) {
  const [modeIndex, setModeIndex] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const [settled, setSettled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  // Replay remounts this component (it is keyed on the run), so the chain only
  // ever has to build itself up — there is no previous run left to unwind.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    let t = 700; // let the screen land before the agent starts talking
    MODES.forEach((mode, i) => {
      at(t, () => {
        setModeIndex(i);
        setStepCount(0);
      });
      mode.steps.forEach((_, s) => {
        at(t + (s + 1) * STEP_INTERVAL_MS, () => setStepCount(s + 1));
      });
      t += MODE_DURATION_MS;
    });
    at(t, () => setSettled(true));

    // The scene variant holds the collapsed pill for a beat before opening
    // out, so the pill is read as a pill first — then shrinks back to it at
    // the end and starts over.
    if (variant === "scene") {
      at(HOLD_BEFORE_OPEN_MS, () => setExpanded(true));
      at(t, () => {
        setExpanded(false);
        setModeIndex(0);
      });
      at(t + LOOP_PAUSE_MS, () => onComplete?.());
    }

    return () => timers.forEach(clearTimeout);
  }, [variant, onComplete]);

  // Open on the newest turn, then keep it in frame as the answer lands.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (settled) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    else el.scrollTop = el.scrollHeight;
  }, [settled]);

  const mode = MODES[modeIndex];

  return (
    <div className="relative size-full overflow-hidden bg-[color:var(--screen)]">
      <Header />

      {variant === "scene" ? (
        <ThinkingCard
          mode={mode}
          open={expanded}
          // The landscape loops, so the pill never parks on "Booked" — it
          // returns to Thinking and goes again.
          settled={false}
          onToggle={() => setExpanded((v) => !v)}
        />
      ) : (
        <ThinkingPill
          mode={mode}
          modeIndex={modeIndex}
          steps={mode.steps.slice(0, stepCount)}
          settled={settled}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      )}

      <div
        ref={scroller}
        className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col gap-[24px] px-[24px] pb-[240px] pt-[150px]">
          <Bubble
            delay={0.02}
            text="I'm flying from Bengaluru to Ho Chi Minh City with a 4-hour layover in Bangkok next month for a friend's wedding. Do I need a visa for Vietnam, what's the deal with the Thailand layover, and what do I need ready before flying?"
          />

          <Body delay={0.08}>
            Vietnam requires an online E-Visa before you fly; Thailand requires
            zero transit paperwork for your 4-hour layover as long as your bags
            are checked through.
          </Body>

          <RequirementsTable delay={0.14} />

          <Bubble delay={0.2} text="Can you book a flight for me?" />

          <div className="flex flex-col gap-[16px]">
            <Body delay={0.26}>
              Checked your calendar — you&rsquo;re clear from{" "}
              <AgentChip>Nov 25 to Dec 5</AgentChip>, which also happens to hit
              the lowest fare window.
            </Body>
            <Body delay={0.32}>
              Since you prefer a <AgentChip>window seat</AgentChip>, I&rsquo;ve
              already locked 12A to Bangkok and 34K into Ho Chi Minh City so you
              don&rsquo;t have to pick them later
            </Body>
            <Footnote delay={0.38}>
              Cross-referenced your Gmail &amp; 9 preferences
            </Footnote>
          </div>

          <Bubble
            delay={0.44}
            text="Could you check multiple OTAs and share the lowest available fare across them?"
          />

          {/* The turn the pill is working on. */}
          <div className="min-h-[76px]">
            <AnimatePresence mode="wait" initial={false}>
              {settled ? (
                <motion.div
                  key="answer"
                  className="flex flex-col gap-[16px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <WordReveal
                    className="text-[14px] font-medium leading-[20px] tracking-[-0.28px] text-[color:var(--ink-900)]"
                    segments={[
                      "Cheapest across 9 OTAs is ",
                      <AgentChip key="fare" delay={0.9}>
                        ₹38,420 · Vietnam Airlines
                      </AgentChip>,
                      " — ₹4,180 under the next best, and it keeps both held seats. I'm holding the fare for 20 minutes.",
                    ]}
                  />
                  <Footnote delay={1.5}>
                    Compared 9 OTAs &amp; 2 direct airline sites
                  </Footnote>
                </motion.div>
              ) : (
                <motion.div
                  key="skeleton"
                  exit={{ opacity: 0, filter: "blur(6px)", y: -6 }}
                  transition={{ duration: 0.32, ease: EASE_OUT }}
                >
                  <Skeleton />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Composer />
    </div>
  );
}

function Body({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.p
      className="text-[14px] font-medium leading-[20px] tracking-[-0.28px] text-[color:var(--ink-900)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
    >
      {children}
    </motion.p>
  );
}

function Footnote({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.p
      className="flex items-center gap-[6px] text-[12px] font-medium leading-[18px] tracking-[-0.12px] text-[color:var(--text-secondary)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay }}
    >
      {children}
      <Image src="/icons/call_made.svg" alt="" width={16} height={16} />
    </motion.p>
  );
}

const ROWS = [
  ["Bangkok Layover (4 hrs)", "Airside Transit (No visa needed)", "$0"],
  ["Vietnam Tourist Entry", "Official 90-Day E-Visa", "$25 USD (Single)"],
  ["Passport Condition", "Valid < 6 months, 2 blank pages", "—"],
];

function RequirementsTable({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="-mx-[4px] rounded-[var(--radius-card)] border border-[color:var(--hairline)] bg-[color:var(--card)] p-[20px] shadow-[var(--shadow-card)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT, delay }}
    >
      <div className="grid grid-cols-[1fr_1.1fr_0.6fr] gap-x-[12px] text-[12px] font-semibold leading-[18px] tracking-[-0.12px] text-[color:var(--ink-900)]">
        <span>Step / Leg</span>
        <span>Requirement</span>
        <span>Cost / Fee</span>
      </div>
      {ROWS.map((row, i) => (
        <div key={row[0]}>
          <div className="my-[12px] h-px bg-[color:var(--hairline)]" />
          <motion.div
            className="grid grid-cols-[1fr_1.1fr_0.6fr] gap-x-[12px] text-[12px] font-medium leading-[18px] tracking-[-0.12px] text-[color:var(--text-secondary)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              ease: EASE_OUT,
              delay: delay + 0.1 + i * 0.07,
            }}
          >
            {row.map((cell) => (
              <span key={cell}>{cell}</span>
            ))}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
