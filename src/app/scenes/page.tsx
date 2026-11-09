"use client";

import { MotionConfig } from "framer-motion";
import { useState } from "react";
import { PixelScene } from "@/components/PixelScene";
import { ShimmerText } from "@/components/ShimmerText";
import { MODES, labelImage } from "@/lib/modes";
import type { ThemeName } from "@/lib/palette";

/** Every scene at once, so each can be judged on its own. */
export default function ScenesPage() {
  const [theme, setTheme] = useState<ThemeName>("night");
  const day = theme === "day";

  return (
    <MotionConfig reducedMotion="user">
      <main className="flex min-h-dvh flex-col items-center justify-center gap-[18px] py-[48px]">
        <button
          type="button"
          onClick={() => setTheme(day ? "night" : "day")}
          className="rounded-full border border-white/15 px-[14px] py-[7px] text-[12px] font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white"
        >
          {day ? "Night" : "Daylight"}
        </button>

        {MODES.map((mode) => (
          <div
            key={mode.id}
            className={`relative h-[88px] w-[313px] overflow-hidden rounded-[28px] ${
              day ? "border border-[#e7e3db] bg-[#fbfaf7]" : "bg-black"
            }`}
          >
            <PixelScene
              width={313}
              height={88}
              scene={mode.id}
              accent={day ? mode.muted : mode.dot}
              theme={theme}
            />
            <span className="absolute inset-x-0 top-[8px] flex justify-center text-[14px] font-semibold leading-[20px] tracking-[-0.28px]">
              <ShimmerText image={labelImage(mode, theme)} duration={2.2}>
                {mode.label}...
              </ShimmerText>
            </span>
          </div>
        ))}
      </main>
    </MotionConfig>
  );
}
