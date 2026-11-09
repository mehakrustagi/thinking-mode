"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { EASE_OUT } from "@/lib/motion";
import type { ThemeName } from "@/lib/palette";

export type GalleryItem = {
  id: string;
  /** Shown under the card. */
  name: string;
  /** One line on what it is for — when this loader is the right one. */
  note?: string;
  /** Cards size themselves to their content; this sets the minimum. */
  minHeight?: number;
  render: (theme: ThemeName) => React.ReactNode;
};

/**
 * A shelf of animations, each in the same card as the status element uses, so
 * they are judged in the surface they will actually live on. Both palettes,
 * because a loader that reads on black can vanish on paper.
 */
export function Gallery({
  title,
  items,
  links,
}: {
  title: string;
  items: GalleryItem[];
  links: { href: string; label: string }[];
}) {
  const [theme, setTheme] = useState<ThemeName>("night");
  const day = theme === "day";

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-dvh w-full max-w-[760px] flex-col gap-[28px] px-[24px] py-[56px]">
        <header className="flex flex-wrap items-center gap-[12px]">
          <h1 className="mr-auto text-[15px] font-semibold tracking-[-0.3px] text-white/80">
            {title}
          </h1>
          <button
            type="button"
            onClick={() => setTheme(day ? "night" : "day")}
            className="rounded-full border border-white/15 px-[14px] py-[7px] text-[12px] font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white"
          >
            {day ? "Night" : "Daylight"}
          </button>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-white/15 px-[14px] py-[7px] text-[12px] font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </header>

        {items.length === 0 ? (
          <p className="text-[13px] text-white/35">Nothing here yet.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(313px,1fr))] gap-x-[24px] gap-y-[28px]">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                className="flex flex-col gap-[10px]"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.05 }}
              >
                <div
                  className={`relative grid w-full place-items-center overflow-hidden rounded-[28px] ${
                    day ? "border border-[#e7e3db] bg-[#fbfaf7]" : "bg-black"
                  }`}
                  style={{ minHeight: item.minHeight ?? 88 }}
                >
                  {item.render(theme)}
                </div>
                <div className="px-[4px]">
                  <p className="text-[13px] font-medium tracking-[-0.13px] text-white/70">
                    {item.name}
                  </p>
                  {item.note && (
                    <p className="mt-[2px] text-[12px] leading-[17px] text-white/35">
                      {item.note}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </MotionConfig>
  );
}
