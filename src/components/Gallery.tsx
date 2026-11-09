"use client";

import { MotionConfig, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { EASE_OUT } from "@/lib/motion";
import type { ThemeName } from "@/lib/palette";

export type GalleryItem = {
  id: string;
  /** Items are shown under their group's heading, in first-seen order. */
  group?: string;
  /** Shown under the card. */
  name: string;
  /** One line on what it is for — when this loader is the right one. */
  note?: string;
  /** Cards size themselves to their content; this sets the minimum. */
  minHeight?: number;
  /** The loader on its own. */
  render: (theme: ThemeName) => React.ReactNode;
  /** The loader doing its job, in a fragment of the product it belongs to. */
  usage?: (theme: ThemeName) => React.ReactNode;
  usageMinHeight?: number;
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
  const [inContext, setInContext] = useState(true);
  const day = theme === "day";
  const anyUsage = items.some((i) => i.usage);

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-dvh w-full max-w-[1080px] flex-col gap-[40px] px-[24px] py-[56px]">
        <header className="flex flex-wrap items-center gap-[12px]">
          <h1 className="mr-auto text-[15px] font-semibold tracking-[-0.3px] text-white/80">
            {title}
          </h1>
          {anyUsage && (
            <button
              type="button"
              onClick={() => setInContext((v) => !v)}
              className="rounded-full border border-white/15 px-[14px] py-[7px] text-[12px] font-medium text-white/70 transition-colors hover:border-white/35 hover:text-white"
            >
              {inContext ? "Show bare" : "Show in context"}
            </button>
          )}
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
          groups(items).map(([group, rows]) => (
            <section key={group} className="flex flex-col gap-[16px]">
              {group && (
                <h2 className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/30">
                  {group}
                </h2>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-x-[20px] gap-y-[26px]">
                {rows.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="flex flex-col gap-[10px]"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      ease: EASE_OUT,
                      delay: Math.min(i, 8) * 0.035,
                    }}
                  >
                    <div
                      className={`relative grid w-full place-items-center overflow-hidden rounded-[24px] ${
                        day
                          ? "border border-[#e7e3db] bg-[#fbfaf7]"
                          : "bg-black"
                      }`}
                      style={{
                        minHeight:
                          (inContext && item.usage
                            ? item.usageMinHeight
                            : item.minHeight) ?? 112,
                      }}
                    >
                      {inContext && item.usage
                        ? item.usage(theme)
                        : item.render(theme)}
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
            </section>
          ))
        )}
      </main>
    </MotionConfig>
  );
}

/** Group items by their `group`, keeping first-seen order. */
function groups(items: GalleryItem[]): [string, GalleryItem[]][] {
  const out = new Map<string, GalleryItem[]>();
  for (const item of items) {
    const key = item.group ?? "";
    const list = out.get(key);
    if (list) list.push(item);
    else out.set(key, [item]);
  }
  return [...out.entries()];
}
