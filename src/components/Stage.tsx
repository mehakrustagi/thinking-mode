"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useState } from "react";
import { ChatScreen } from "./ChatScreen";
import { EASE_OUT } from "@/lib/motion";

/** The phone, its caption and the replay control — shared by both variants. */
export function Stage({
  variant,
  caption,
  hint,
  other,
}: {
  variant: "steps" | "scene";
  caption: string;
  hint: string;
  other: { href: string; label: string };
}) {
  const [runId, setRunId] = useState(0);
  const again = useCallback(() => setRunId((v) => v + 1), []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-dvh flex-col items-center justify-center gap-[18px] py-[48px]">
        <p className="w-[402px] text-[13px] font-medium tracking-[-0.13px] text-white/35">
          {caption}
        </p>

        <motion.div
          className="relative h-[874px] w-[402px] shrink-0 overflow-hidden rounded-[44px] bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <ChatScreen
            key={runId}
            variant={variant}
            onComplete={variant === "scene" ? again : undefined}
          />
        </motion.div>

        <div className="flex items-center gap-[14px] text-[12px] font-medium tracking-[-0.12px] text-white/40">
          <button
            type="button"
            onClick={again}
            className="rounded-full border border-white/15 px-[14px] py-[7px] text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            Replay
          </button>
          <span>{hint}</span>
          <Link
            href={other.href}
            className="rounded-full border border-white/15 px-[14px] py-[7px] text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            {other.label}
          </Link>
        </div>
      </main>
    </MotionConfig>
  );
}
