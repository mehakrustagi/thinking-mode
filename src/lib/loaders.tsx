"use client";

import { DotMatrix } from "@/components/DotMatrix";
import type { GalleryItem } from "@/components/Gallery";
import { ShimmerText } from "@/components/ShimmerText";
import { Skeleton } from "@/components/Skeleton";
import { MODES, labelImage } from "@/lib/modes";

/**
 * The loader shelf.
 *
 * One entry per animation. Adding a loader is adding an object here — the
 * gallery handles the card, both palettes and the layout.
 */

const thinking = MODES[0];

export const LOADERS: GalleryItem[] = [
  {
    id: "dot-matrix",
    name: "Dot matrix",
    note: "The pill's 3×3 head. Figma's anti-diagonal opacity ramp is each dot's floor; a wave runs down the same diagonal on top, so the motion only ever adds light.",
    render: (theme) => (
      <DotMatrix
        color={theme === "day" ? thinking.muted : thinking.dot}
        active
      />
    ),
  },
  {
    id: "shimmer-label",
    name: "Shimmer sweep",
    note: "A highlight travelling through copy that is still changing. It parks at the loop's start when it settles, never mid-sweep.",
    render: (theme) => (
      <span className="text-[14px] font-semibold leading-[20px] tracking-[-0.28px]">
        <ShimmerText image={labelImage(thinking, theme)} duration={2.2}>
          Thinking...
        </ShimmerText>
      </span>
    ),
  },
  {
    id: "skeleton",
    name: "Placeholder bars",
    note: "Stands in for an answer still being written, then blurs out as the real text reveals.",
    render: (theme) => (
      <div className="px-[28px] py-[20px]">
        <Skeleton
          widths={[160, 96]}
          tone={theme === "day" ? "light" : "dark"}
        />
      </div>
    ),
  },
];
