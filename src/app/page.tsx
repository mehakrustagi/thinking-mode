"use client";

import { MotionConfig, motion } from "framer-motion";
import { useState } from "react";
import { ChatScreen } from "@/components/ChatScreen";
import { EASE_OUT } from "@/lib/motion";

export default function Page() {
  const [runId, setRunId] = useState(0);

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-dvh flex-col items-center justify-center gap-[22px] py-[48px]">
        <motion.div
          className="relative h-[874px] w-[402px] shrink-0 overflow-hidden rounded-[44px] bg-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          <ChatScreen key={runId} />
        </motion.div>

        <div className="flex items-center gap-[14px] text-[12px] font-medium tracking-[-0.12px] text-white/40">
          <button
            type="button"
            onClick={() => setRunId((v) => v + 1)}
            className="rounded-full border border-white/15 px-[14px] py-[7px] text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            Replay
          </button>
          <span>Tap the pill to open the agent steps</span>
        </div>
      </main>
    </MotionConfig>
  );
}
