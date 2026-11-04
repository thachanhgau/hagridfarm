# Codex brief — tượng Dobby: vòng hào quang sau đầu

Claude Code (Anthropic) writes the game code, tests and commits after you. **Your job is the art only.** Keep
exploration short.

The owner saw the night glow of both Dobby statues (`docs/codex-briefs/statue-glow-preview.png`, report
`statue-glow-report.md`) and wants **a round halo behind Dobby's head** («vòng sáng sau đầu»), saint-statue style.
Keep everything already in the glow layers (eyes, runes, rim, aura, ground halo); add the halo ring.

First copy the current 12 glow PNGs to `garden-v05/environment/statue-glow/masters/variants/aura-v1/` (keep them).

## The halo

- A circular ring centred on Dobby's head (tilted to a slight ellipse is fine), behind it: the ring passes behind the
  ears and head. **Behind = remove every ring pixel that lands on an opaque pixel of the original statue sprite**, so
  the head covers it.
- Ring: 2 px bright core plus 1–2 px dithered outer glow (checker, thinning outward), brighter on the top-left.
  Big enough to read at 1× in the game: diameter about 1.3–1.6 × the head width (ears included, so it shows above and
  around the ears).
- Colours: dark Dobby `#FFC36B` core, `#F5D69A` top-left highlights, `#ED8A45` outer dither. Spring rider `#B7DEE0`
  core, `#E8F0ED` top-left highlights, `#70A8B6` outer dither. Palette colours only (`garden-v05/palette.mjs`).
- Inside the canvas with ≥ 1 px transparent margin, inside x 4…123.
- Frames: `g0` normal, `g1` the outer dither a little denser, `g2` a little thinner. Same ring position in all three:
  no movement, no blinking.

Originals: `garden-v05/event-assets/native/ev_dark_dobby_red_f0.png`, `…_right_f0.png`,
`ev_dobby_spring_rider.png`, `…_right.png` (128×176, pivot 64,160). Read `docs/art-bible.md` §1–3 (1 source px =
1 game px, no anti-aliasing, light from top-left).

## Steps

1. Draw the halo with your image tool on a master sheet per statue (`masters/<id>-halo.png`, prompt in
   `masters/<id>-halo.txt`), using the night preview as the reference, then reduce it onto the 128×176 canvas as before.
   If image generation is unavailable or you hit a usage limit, stop and say so.
2. Merge the halo into each existing glow PNG (`<id>-g0..2.png`, `<id>_right-g0..2.png`): alpha 0 or 255 only.
3. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   then `node garden-v05/build-runtime-webp.mjs --check`.
4. Preview `docs/codex-briefs/statue-glow-halo-preview.png`: per statue and facing, at 1× and 3× on grass `#3F6A45`:
   original under the night tint (`rgba(10,18,34,.44)`) · tint + new `g0` · `g1` · `g2`.

## Hard rules

- No git commit, push or deploy. Do not edit `.mjs` game code, CSS, tests, `functions/` or the HPVNN repo.
- Do not touch the originals in `event-assets/` or `decor-assets/`.
- Only `garden-v05/environment/statue-glow/**`, `garden-v05/runtime-webp/environment/statue-glow/**`, the files the
  WebP builder regenerates, and your report/preview may change.

## Report

`docs/codex-briefs/statue-glow-halo-report.md`: per file the halo ring box, ring pixel count, ring pixels removed
behind the statue, and your verdict. End your final message with the same table.
