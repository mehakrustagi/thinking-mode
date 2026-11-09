# Thinking Modes

The agent status pill from [Motion → thinking mode animation](https://www.figma.com/design/TgmXGFeUbNqF9MRvnNWGE2/Motion?node-id=60-5910),
built as a running screen rather than four static frames.

```bash
npm run dev
```

Two variants of the same run:

| Route | What the pill opens into |
| --- | --- |
| `/` | The agent's steps — a done / active / pending ladder. |
| `/pixel` | The dot-matrix landscape it runs through while it works. |

## What runs

The Figma page has one frame per mode — **Thinking**, **Checking**, **Analyzing**,
**Booking**. Here they're one pill walking the sequence, then settling.

| Surface | Motion |
| --- | --- |
| Pill | `layout` spring morphs the width as the label changes length. Label swaps on a blur + y-slide (out up, in up); `popLayout` so the two never fight for the same slot. |
| Dot matrix | Figma's anti-diagonal opacity ramp (1.0 → 0.1) is each dot's **floor**; a 1.6s wave runs down the same diagonal on top of it, so the motion only ever adds light. `backgroundColor` is animated, not set, so a mode change cross-fades the whole matrix. |
| Label | Highlight sweep — the cue that this is still changing. It parks at the loop's start position on settle, never mid-sweep (a frozen bright band through settled text reads as a bug). |
| Panel | Tap the pill: the four modes as a done / active / pending ladder, with the live mode's steps streaming in a line at a time and a drawn-on tick for each one finished. |
| Answer | Placeholder bars shimmer until the run resolves, then blur out as the real answer reveals word by word. |
| Inline chips | The `#002411 → #a1e000` gradient from the design, with a one-shot sweep on arrival — marks a live lookup rather than emphasis. |

Everything honours `prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

## The landscape (`/pixel`)

The same black capsule, opened out into a window. One `layout` spring morphs
161×44 r60 into 313×112 r28 and the contents cross-fade inside it; the scene
stays mounted through the morph so the horse never restarts its gallop.

`PixelScene` is a canvas drawing one grid of dots on a 4px pitch — sky, ridges,
ground and horse all snap to the same lattice, which is what makes it read as a
single display rather than sprites on a drawing. Terrain is sampled by absolute
world column from a seeded value-noise, squared so the profile stays low and
spikes into peaks, so every layer scrolls forever without holding state; only
the offsets advance.

Four parallax rates, in grid columns per second: stars 0.4, far ridge 1.6, mid
ridge 4.5, ground 11. The horse is a 22×15 sprite in four frames — extension,
gather, push-off, suspension — at 11fps, with the body identical in each and
only the legs and a one-row bob changing. That's what keeps the silhouette
readable at a 2.4px dot.

Foliage takes the active mode's colour, so the landscape shifts from lime to
gold to teal as the run proceeds.

## Colours

Sampled from the Figma renders. Each mode's label is `hsl(<dot hue> 100% 60%)` —
the relationship the Checking frame defines (`#c7aa00` dots / `#ffda34` text),
extended to the other three.

| Mode | Dot | Hue |
| --- | --- | --- |
| Thinking | `#9edd01` | 77 |
| Checking | `#c7aa00` | 51 |
| Analyzing | `#ddaa01` | 46 |
| Booking | `#01ddd6` | 178 |

## Layout

`src/`
- `lib/modes.ts` — the four modes, their colours and their steps. Timing lives here.
- `lib/motion.ts` — shared easing and springs.
- `components/ThinkingPill.tsx` — the pill and its expanded panel.
- `components/DotMatrix.tsx`, `ShimmerText.tsx` — ported from the Motion Library
  (`snapmap-dot-shimmer`, `snapmap-shimmer-text`).
- `components/ChatScreen.tsx` — the run: one timeout chain, keyed so Replay remounts.

Icons in `public/icons/` are exported straight from the file. The one exception
is the back button: Figma's ellipse carries inner shadows authored for a much
larger node, and at 44px they crush it to a dark disc — it's rebuilt in CSS from
the same wash the input chips use.
