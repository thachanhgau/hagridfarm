# Codex brief — 25.0 S7 «Gia tinh đón đông»: hearth, vớ, dragon egg (1 sheet, 7 sprites)

Claude Code (Anthropic) writes the game code, imports, tests and commits after you. **Your job is the master sheet and
the seven native PNGs only.** Keep exploration short.

Read first: `docs/art-bible.md` §1–3 (1 source px = 1 game px, palette in `garden-v05/palette.mjs`, light from top-left,
selective dark outline `#231F2E`, no anti-aliasing, no text) and `docs/grid-fit-guideline.md` §1–2. Look at
`garden-v05/environment/elves/dobby/idle.png` (80×80, gia tinh ~56 px tall) for scale and style.

## What it is for

In December an outdoor stone hearth stands in Hagrid's garden. Ten knitted Christmas stockings («vớ», Advent calendar)
hang from its mantel; the game draws each stocking at code-chosen pins, closed or opened. From the Hagrid letters on, a
black dragon egg (Norbert, a Norwegian Ridgeback, Harry Potter book 1) sits in the fire; it cracks in 4 stages over 21
days. Everything stays small and readable on a phone.

| out file (`garden-v05/environment/xmas/`) | canvas · pivot | content |
|---|---|---|
| `hearth.png` | 112×120 · (56,116) | Free-standing outdoor fireplace of rough grey field-stone like Hagrid's hut, seen in the game's 3/4 isometric view, ~2 tiles wide: a squat chimney breast with a short chimney, an arched firebox at the bottom with an iron grate and a lit log fire (warm `#FFC36B`/`#E07A3A` flames), a thick dark-wood mantel beam across the front at about 40 % height, a sprig of holly at one end. **Leave the mantel's front face and the firebox floor empty**: stockings and the egg are drawn on top by code. |
| `sock.png` | 14×20 · (7,1) | One knitted wool Christmas stocking hanging from a short loop (pivot = the loop top): red body with white cuff and a green stripe, toe pointing right. |
| `sock-open.png` | 14×20 · (7,1) | The same stocking opened: cuff folded down, a small wrapped present and a sprig peeking out of the top, a few gold sparkle pixels. |
| `egg-0.png` | 22×26 · (11,25) | A large dragon egg, smooth, black with a faint dark-green sheen and a few darker speckles, sitting upright (pivot = bottom centre). |
| `egg-1.png` | 22×26 · (11,25) | Same egg, one thin crack near the top glowing faint orange. |
| `egg-2.png` | 22×26 · (11,25) | Same egg, a web of cracks over the upper half, orange glow in them, one tiny chip missing. |
| `egg-3.png` | 22×26 · (11,25) | Same egg about to hatch: big cracks, a small piece of shell lifted off the top, a tiny dark snout tip visible in the gap. |

Colours: the 24 sprite colours of `palette.mjs`; flames may add `#FFC36B` `#F5D69A` `#E07A3A`. Same black egg in all four
stages (only the cracks change), same stocking in both states.

## Steps

1. Generate ONE master sheet with your image tool: `garden-v05/environment/xmas/masters/xmas-hearth-sheet.png`, 2 rows ×
   4 columns, one object per cell in table order (last cell empty), flat key-colour background, generous gaps. Keep
   variants in `masters/variants/`.
2. Reduce each object to its exact canvas: crop, nearest-neighbour resize so the object fills the canvas with ≥1 px
   transparent margin, base/loop on the pivot, quantise to the colours above, alpha 0/255 only. Write the seven PNGs.
3. In your report give, for `hearth.png`: the mantel front-face box (x0,y0,x1,y1) where stockings may hang, and the
   firebox floor centre (x,y) where the egg's pivot goes.
4. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   then `node garden-v05/build-runtime-webp.mjs --check`.
5. Preview `docs/codex-briefs/xmas-hearth-s7-preview.png`: the hearth with 10 stockings composited along the mantel
   (5 closed, 5 open) and egg-2 in the fire, at 1× and 3×, on a snowy ground colour `#D6D8BF`; and the four eggs side by side.
6. `git status`: only `garden-v05/environment/xmas/**`, `garden-v05/runtime-webp/environment/xmas/**`, the webp
   manifests / `runtime-image-url.mjs` the builder regenerates, and your report/preview may change.

## Hard rules

- No git commit, push or deploy. Do not edit any `.mjs` game code, CSS, tests, `functions/` or the HPVNN repo.
- If image generation is unavailable or you hit a usage limit, stop and say so; do not fake art with code.

## Report

`docs/codex-briefs/xmas-hearth-s7-report.md`: per file the size, pivot, ink box and your verdict, plus the mantel box and
firebox point. End your final message with the same table.
