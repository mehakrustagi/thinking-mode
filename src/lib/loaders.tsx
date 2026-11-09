"use client";

import {
  ImageLoader,
  InlineLoader,
  TextLoader,
  type ImageLoaderVariant,
  type InlineLoaderVariant,
  type TextLoaderVariant,
} from "generative-loaders";
import { DotMatrix } from "@/components/DotMatrix";
import type { GalleryItem } from "@/components/Gallery";
import { ShimmerText } from "@/components/ShimmerText";
import { Skeleton } from "@/components/Skeleton";
import { MODES, labelImage } from "@/lib/modes";
import type { ThemeName } from "@/lib/palette";

/**
 * The loader shelf.
 *
 * One entry per animation; the gallery handles the card, both palettes and the
 * layout. Everything from `generative-loaders` is given our brand colour
 * rather than its own default — its TextLoader defaults to #111111, which is
 * invisible on the black card the status element actually lives on.
 */

const thinking = MODES[0];

/** Lime on black, sage on paper — the Thinking accent in either palette. */
const brand = (theme: ThemeName) =>
  theme === "day" ? thinking.muted : thinking.dot;

const IMAGE_VARIANTS: ImageLoaderVariant[] = [
  "resolution",
  "pixel-grid",
  "tiles",
  "bands",
  "scan",
  "shutter",
  "contour",
  "focus",
  "skeleton",
];

const INLINE_VARIANTS: InlineLoaderVariant[] = [
  "matrix",
  "pixel-drift",
  "glyph",
  "orbit",
  "ripple",
  "signal",
  "spark",
  "rotor",
  "chomp",
  "snake",
  "fold",
  "gravity",
  "domino",
  "aperture",
];

const TEXT_VARIANTS: TextLoaderVariant[] = [
  "decode",
  "typewriter",
  "cascade",
  "focus",
  "wipe",
  "flip",
  "redact",
  "line",
  "terminal",
  "wave",
  "dissolve",
  "slice",
  "tracking",
  "coalesce",
  "fragments",
  "skeleton",
];

const HOUSE: GalleryItem[] = [
  {
    id: "house-dot-matrix",
    group: "In this codebase",
    name: "Dot matrix",
    note: "The pill's 3×3 head. Figma's anti-diagonal opacity ramp is each dot's floor; a wave runs down the same diagonal on top, so the motion only ever adds light.",
    render: (theme) => <DotMatrix color={brand(theme)} active />,
  },
  {
    id: "house-shimmer",
    group: "In this codebase",
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
    id: "house-skeleton",
    group: "In this codebase",
    name: "Placeholder bars",
    note: "Stands in for an answer still being written, then blurs out as the real text reveals.",
    render: (theme) => (
      <div className="px-[28px] py-[20px]">
        <Skeleton
          widths={[150, 90]}
          tone={theme === "day" ? "light" : "dark"}
        />
      </div>
    ),
  },
];

const IMAGE: GalleryItem[] = IMAGE_VARIANTS.map((variant) => ({
  id: `image-${variant}`,
  group: "Image · generative-loaders",
  name: variant,
  minHeight: 220,
  render: (theme) => (
    <ImageLoader
      variant={variant}
      size={150}
      color={brand(theme)}
      label={`Generating image — ${variant}`}
    />
  ),
}));

const INLINE: GalleryItem[] = INLINE_VARIANTS.map((variant) => ({
  id: `inline-${variant}`,
  group: "Inline · generative-loaders",
  name: variant,
  minHeight: 96,
  render: (theme) => (
    <InlineLoader
      variant={variant}
      size={30}
      color={brand(theme)}
      label={`Working — ${variant}`}
    />
  ),
}));

const TEXT: GalleryItem[] = TEXT_VARIANTS.map((variant) => ({
  id: `text-${variant}`,
  group: "Text · generative-loaders",
  name: variant,
  minHeight: 96,
  render: (theme) => (
    <span className="px-[20px] text-[14px] font-semibold tracking-[-0.28px]">
      <TextLoader text="Thinking" variant={variant} color={brand(theme)} />
    </span>
  ),
}));

/**
 * Which families are on the shelf. The text loaders are built and ready —
 * flip this to true to bring them back.
 */
const SHOW = { house: true, image: true, inline: true, text: false };

export const LOADERS: GalleryItem[] = [
  ...(SHOW.house ? HOUSE : []),
  ...(SHOW.image ? IMAGE : []),
  ...(SHOW.inline ? INLINE : []),
  ...(SHOW.text ? TEXT : []),
];
