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
| `/pixel` | The dot-matrix scenes, at night. |
| `/day` | The same scenes in the woven daylight palette. |
| `/scenes` | All four scenes side by side, either palette — for judging them on their own. |
| `/loaders` | A shelf of loading animations, same card, either palette. Adding one is an entry in `lib/loaders.tsx`. |

The loaders page carries the three built here plus all 39 variants of
[`generative-loaders`](https://www.npmjs.com/package/generative-loaders) —
image, inline and text — each passed our Thinking accent rather than its own
default. That matters: its `TextLoader` defaults to `#111111`, which is
invisible on the black card the status element actually lives on.

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

Thinking's label uses that same `#002411 → #a1e000` gradient, with the sweep
highlight threaded between its two stops. The other three derive both ends from
their dot's hue.

Everything honours `prefers-reduced-motion` via `MotionConfig reducedMotion="user"`.

## The scenes (`/pixel`, `/day`)

The same black capsule, opened out into a window — and what is in the window
depends on what the agent is doing. The engine (`PixelScene`) owns the grid,
the clock and the paint; `scenes.ts` owns what goes on it.

| Mode | Scene | Mark |
| --- | --- | --- |
| Thinking | A side-scrolling runner, in the shape of the Chrome dino game: one flat ground line with grit, cacti coming at you, clouds overhead, and a horse that **jumps**. The run accelerates. | circles |
| Checking | A field of records drifting past while a bright head sweeps across them. Entries go hot as it reaches them and cool back to grey behind it, so only a band around the head is lit. | rounded squares |
| Analyzing | A scrolling bar field with the top of each bar in the mode's colour, and a read-head walking the series. | bars |
| Booking | An airliner holding station while three depths of cloud go past beneath it, trailing a contrail that lags its own bob. The ground is a sparse line a long way below. | diamonds |

The mark belongs to the **mode**, not the theme — same lattice, different nib —
so each scene is drawn with its own in either palette. A mode change wipes the
new scene over the old one from the left, reusing the same edge that reveals
the scene on open.

**Sequence.** The pill holds in its exact collapsed form for 2s. The box grows.
A beat later the dots sweep in left to right over 900ms and the world spins up
to speed. The four modes run. Then the card shrinks back to the pill, which
reads Thinking again, and the whole thing goes round.

### The morph follows the Dynamic Island

Apple specifies these springs as a response and a damping fraction; framer's
`duration`/`bounce` pair is the same thing (`bounce = 1 - dampingFraction`), so
`MORPH` is `.spring(response: 0.52, dampingFraction: 0.74)` — enough overshoot
to read as one shape stretching rather than two shapes swapping. The island's
other rules, all applied: the black shape itself never changes opacity, the
corner radius rides the same spring as the size, outgoing content leaves faster
than the shape moves (130ms), incoming content arrives late and scales up into
place, and nothing inside translates — it scales from the centre.

### The subjects

Neither the horse nor the plane is a sprite sheet. `horseRig.ts` is an
articulated rig — barrel, neck, head,
tail and four jointed legs as capsules — whose joints are continuous functions
of the gallop phase. Each leg's hip swing is a sine and its knee flex a raised
cosine a quarter-cycle behind; the four are phase-offset into a transverse
gallop, and the body takes one bounce per stride. `RIG_DROP` and `RIG_TALL` are
measured over a full stride rather than eyeballed, so the hooves graze the
ground line at full extension at any scale. `plane.ts` is the same
construction standing still — capsules whose round caps make the nose and the
tail — so the two read as one drawing system rather than two sprites.

The scene samples that rig as a signed distance field. A dot's **size** is how
deep inside the silhouette its cell sits — full size anywhere inside, tapering
only across the falloff band outside. (Centring that ramp *on* the surface
instead halves every dot on a thin limb, and the legs disappear.) That is the
halftone, and it is also why the gait reads as fluid rather than as frames: the
edge moves continuously instead of a dot blinking on or off.

### The jump is read, not simulated

Cacti are placed by hashing an absolute world slot, not spawned and stored. So
the strip is infinite, identical on every frame, and the horse can look *ahead*:
the lift is a sine arc over the distance to the next cactus. There is no
physics step and no state, which means the horse is always already in the right
place no matter what the frame rate did. Its legs hold near full extension
while airborne, the way the dino's do.

### Fluid and crisp are in tension here, and both are solved explicitly

- The *pattern* has to advance one lattice cell at a time — it is a dot grid.
  Scrolling it that way jumps 4px eleven times a second. So the field is drawn
  at a fractional pixel offset instead: the pattern steps, the dots glide.
- Fractional positions blur a dot. So every position is snapped to a whole
  *device* pixel. At dpr 3 that is still 33 sub-steps per cell, so nothing
  visibly steps, and every dot keeps a hard edge.
- The backing store is keyed on `width×height@dpr`, not just CSS size. Browser
  zoom changes dpr, and a canvas sized for the old one is what turns the whole
  scene to mush.
- The loop runs on framer's `useAnimationFrame`, not its own `requestAnimation-
  Frame`, so it is scheduled alongside the layout springs driving the card.
- `LABEL_BAND` reserves the top 46% of the card for the text and **nothing**
  may reach into it — not a cloud, not a cactus, not the horse at the top of
  its jump. The rig is scaled from whatever band is left, so changing the card
  height re-fits the scene instead of cropping it, and shortening the cacti
  (which sets the jump height) is what buys the runner its size back.

### Palettes

`palette.ts` holds both. `night` is the original — white runner on black, round
dots, the mode's own colour on the cacti. `day` is drawn from the pixel artwork:
muted sage, slate, terracotta and peach on paper, with **rounded-square** dots
rather than round ones, which is what gives that artwork its woven look. Each
mode carries a `muted` twin for it, and the faint layers get more weight because
a 40% cloud that reads on black vanishes on paper.

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
