# Codex brief — tượng Dobby: phiên bản ban đêm (vẽ lại cả tượng)

Claude Code (Anthropic) writes the game code, tests and commits after you. **Your job is the art only.** Keep
exploration short.

Until now the night look was a thin overlay of glow pixels on top of the day statue (`environment/statue-glow/`,
preview `docs/codex-briefs/statue-glow-halo-preview.png`). The owner finds it too thin: the halo looks pasted on
because the statue itself is not lit by it. **Now draw each statue again, whole, as it looks at night**, and the game
will swap the day sprite for the night one at dusk and night.

## The look

- The garden at night is dark blue-green (the game fills `rgba(10,18,34,.44)` over the scene). The night statue is
  drawn **after** that fill, so paint it already in night colours: the stone body darker and cooler than by day.
- A **round halo behind Dobby's head** (saint-statue style), the light source of the piece: it lights the top of the
  head, the ears, the shoulders and the raised arm / waving hand with a warm (dark Dobby) or cool (spring rider) rim
  and soft lit planes; the light falls off down the body to the plinth. Glowing eyes. Halo diameter about 1.3–1.6 ×
  the head width (ears included); the head covers the front of it.
- Dark Dobby «Dobby Hắc Ám» (red stone Dobby raising a sock, dark plinth with carved runes): amber/gold light
  (`#FFC36B`, `#F5D69A`, `#ED8A45`), runes on the plinth glowing ember orange.
- Spring rider «Dobby cưỡi thú nhún» (Dobby on a blue hippogriff spring toy, grey plinth): cool magic light
  (`#E8F0ED`, `#B7DEE0`, `#70A8B6`, `#6961A6`); Dobby's eyes and the hippogriff's eye glowing; a few sparkles on the
  spring coils.
- A small pool of light on the grass around the plinth foot, inside the 2×2 ground diamond (128 × 64 centred on
  x = 64, front corner at the pivot row).
- Same statue, same pose, same proportions and silhouette as the day sprite: someone must recognise it instantly.

## Frames and files

Originals (look at these first): `garden-v05/event-assets/native/ev_dark_dobby_red_f0.png`, `…_right_f0.png`,
`ev_dobby_spring_rider.png`, `…_right.png` — 128×176 RGBA, pivot (64,160). Read `docs/art-bible.md` §1–3 (1 source
px = 1 game px, colours from `garden-v05/palette.mjs` `PALETTE` only, alpha 0 or 255, no anti-aliasing, light now from
the halo) and `docs/grid-fit-guideline.md` §1–3 (2 × 2).

Write to `garden-v05/environment/statue-night/`: for each statue `<id>` (`ev_dark_dobby_red`, `ev_dobby_spring_rider`)
`<id>-n0.png`, `<id>-n1.png`, `<id>-n2.png` (default view) and `<id>_right-n0.png`, `<id>_right-n1.png`,
`<id>_right-n2.png` (turned view). 128×176, same pivot. `n0` normal; `n1` halo and lit rim a touch brighter;
`n2` a touch dimmer. Same shapes otherwise, no movement.

**Cover rule:** every pixel that is opaque in the original must be opaque in the night sprite (the night sprite is
drawn over the darkened day statue and must hide it completely). Extra opaque pixels (halo, light pool, sparkles) are
fine. Stay inside x 4…123 with ≥ 1 px transparent margin.

## Steps

1. With your image tool, draw ONE detailed master sheet per statue (`garden-v05/environment/statue-night/masters/<id>.png`,
   prompt in `masters/<id>.txt`): default view and turned view (2 rows) × n0 n1 n2 (3 columns), large cells (at least
   4× the game size), on a flat dark background. Use the originals scaled up nearest-neighbour as the shape reference.
   Keep tries in `masters/variants/`. If image generation is unavailable or you hit a usage limit, stop and say so;
   do not fake the art with code.
2. Reduce each cell to 128×176 the way the approved elf art was made (`garden-v05/build-elf-art.mjs`, read its header):
   shrink by **area average** (not nearest-neighbour) so the ink box matches the original's (±2 px) on the same pivot,
   map to `PALETTE`, absorb lone blur pixels into their neighbours except strong accents (eyes, halo core, sparkles),
   then enforce the cover rule against the original. You may write a small builder script next to the masters.
3. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   then `node garden-v05/build-runtime-webp.mjs --check`. If the builder does not pick up `environment/statue-night`,
   say so in the report (do not edit the builder).
4. Preview `docs/codex-briefs/statue-night-preview.png`, per statue and facing, at 1× and 3× on grass `#3F6A45`:
   day original · original under the night fill · night sprite `n0` drawn over the night-filled scene · `n1` · `n2`.

## Hard rules

- No git commit, push or deploy. Do not edit `.mjs` game code (except a new builder script under `statue-night/masters/`),
  CSS, tests, `functions/` or the HPVNN repo.
- Do not touch the originals in `event-assets/` or `decor-assets/`, or the files in `environment/statue-glow/`.

## Report

`docs/codex-briefs/statue-night-report.md`: per file the size, ink box vs the original's, cover-rule check (original
opaque pixels left uncovered: must be 0), colours used, and your verdict. End your final message with the same table.
