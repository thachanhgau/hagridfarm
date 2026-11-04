# Codex brief — Dobby cưỡi thú nhún: vẽ lại phiên bản ban đêm

Claude Code (Anthropic) writes the game code, tests and commits after you. **Your job is the art only.** Keep
exploration short.

The previous run (`docs/codex-briefs/statue-night.md`, report `statue-night-report.md`) drew night versions of two
Dobby statues. The owner approved **Dobby Hắc Ám** (do NOT touch `ev_dark_dobby_red*` files) but rejected the
**spring rider** («ghê quá»): the whole statue was repainted one blue-purple colour, Dobby and the hippogriff melted
together, the face looked creepy, and the halo was a thin line. Redo only `ev_dobby_spring_rider`.

First move the current `garden-v05/environment/statue-night/ev_dobby_spring_rider*.png` and its master/prompt to
`garden-v05/environment/statue-night/masters/variants/rider-v1/`.

## What the owner wants

- **Same cheerful toy statue as by day, at night.** Keep the original colours: Dobby's pale skin, white pillowcase
  toga, the BLUE hippogriff spring toy, grey stone plinth, dark spring coil. Night only darkens and cools them a
  little (one or two palette steps); it never turns them into one colour. Dobby, the toy and the plinth must read as
  three clearly different things.
- **Friendly face**: same happy, waving Dobby as the day sprite. Big round eyes glowing soft pale cyan with a white
  hot spot, not hollow or staring. The hippogriff's eye glows too.
- **Halo**: a clear, thick round ring behind Dobby's head (core 2–3 px of `#E8F0ED`/`#B7DEE0`, outer 1–2 px
  `#70A8B6`), diameter about 1.5 × the head width (ears included); the head and ears cover its front part. It is the
  light source: warm-white/cyan rim light on the top of Dobby's head, ears, shoulders, waving hand and the top of the
  hippogriff's head and wing; light fades downward.
- A visible pool of cool light on the grass around the plinth foot (inside the 2×2 ground diamond: 128 × 64 centred
  on x = 64, front corner at the pivot row) and 2–4 tiny sparkles on the spring coil.
- Look at the approved `ev_dark_dobby_red-n0.png` for how much darker than day the stone can be: the rider should be
  in the same family, a bit brighter because its colours are lighter.

## Frames and files

Original (shape reference): `garden-v05/event-assets/native/ev_dobby_spring_rider.png` and `…_right.png` (128×176,
pivot 64,160). Rules: `docs/art-bible.md` §1–3 (1 source px = 1 game px, `garden-v05/palette.mjs` `PALETTE` only,
alpha 0 or 255, no anti-aliasing).

Write `garden-v05/environment/statue-night/ev_dobby_spring_rider-n0.png`, `-n1.png`, `-n2.png` and
`ev_dobby_spring_rider_right-n0.png`, `-n1.png`, `-n2.png`. `n0` normal, `n1` halo and rim a touch brighter, `n2` a
touch dimmer; no movement. **Cover rule:** every pixel opaque in the original is opaque in the night sprite. Inside
x 4…123 with ≥ 1 px transparent margin.

## Steps

1. Draw ONE detailed master sheet with your image tool (`masters/ev_dobby_spring_rider.png`, prompt in
   `masters/ev_dobby_spring_rider.txt`), 2 rows (default, turned) × 3 columns (n0 n1 n2), cells ≥ 4× game size, flat
   dark background, using the day original scaled up nearest-neighbour as the reference — start from its colours.
   If image generation is unavailable or you hit a usage limit, stop and say so; do not fake the art with code.
2. Reduce with the existing `masters/build-statue-night.mjs` method (area average, palette, lone-pixel clean-up,
   cover rule); change it only so the dark Dobby outputs stay byte-identical.
3. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   then `node garden-v05/build-runtime-webp.mjs --check`.
4. Preview `docs/codex-briefs/statue-night-rider-preview.png` at 1× and 3× on grass `#3F6A45`: day original ·
   original under `rgba(10,18,34,.44)` · new `n0` over the night-filled grass · `n1` · `n2`, both facings; add the
   approved dark Dobby `n0` beside it for comparison.

## Hard rules

- No git commit, push or deploy. Do not edit `.mjs` game code (except `statue-night/masters/build-statue-night.mjs`),
  CSS, tests, `functions/` or the HPVNN repo. Do not touch originals in `event-assets/`/`decor-assets/`, the
  `environment/statue-glow/` files, or any `ev_dark_dobby_red*` night file.

## Report

`docs/codex-briefs/statue-night-rider-report.md`: per file ink box vs the original, cover-rule check (must be 0
uncovered), colours used, and your verdict. End your final message with the same table.
