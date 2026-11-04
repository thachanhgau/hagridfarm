# Codex brief — 25.0 «Tượng gia tinh phát sáng ban đêm» (glow overlays for the elf statues)

Claude Code (Anthropic) writes the game code, imports, tests and commits after you. **Your job is the masters and the
native glow PNGs only.** Keep exploration short.

**This run: both statues.** The owner approved the trial look of `ev_dark_dobby_red` but wants a real **hào quang**
(aura) around BOTH Dobbys: redo `ev_dark_dobby_red` (keep its eyes, runes and rim, add the aura) and draw
`ev_dobby_spring_rider` the same way. Move the current dark-Dobby PNGs to `masters/variants/trial-v1/` first.

### Aura (hào quang) — the main change

- A glowing outline that **hugs the whole silhouette** of the statue (head, ears, raised arm/sock or waving hand,
  body, the hippogriff toy, and the plinth's top edges): a 1 px bright ring lying just OUTSIDE the original outline,
  then a 2–3 px outer band of dithered pixels (checker, thinning outward) so it reads as a soft glow at 1×.
- Brighter and denser toward the top-left (light from top-left), thinner on the bottom-right.
- A ground halo around the plinth foot: a flattened iso ellipse of dithered pixels on the grass, clearly visible,
  inside the 2×2 ground diamond. Do not cover the plinth's front faces (the runes must stay readable).
- Colours: dark Dobby `#FFC36B` ring, `#ED8A45` / `#C75B4B` outer band; spring rider `#B7DEE0` ring, `#70A8B6` /
  `#6961A6` outer band (`#E8F0ED` only for the eye hot spots and a few sparkles).
- Everything stays inside the canvas with ≥ 1 px transparent margin and inside x 4…123 (2×2 column).
- Frames: the aura breathes — `g1` outer band a little denser/1 px wider, `g2` a little thinner. Eyes stay lit in all three.

Read first: `docs/art-bible.md` §1–3 (1 source px = 1 game px, 32 colours in `garden-v05/palette.mjs`, light from
top-left, no anti-aliasing, no text) and `docs/grid-fit-guideline.md` §1–3 (row 2 × 2).

## What it is for

At dusk and at night the game darkens the garden with a tint (night `rgba(10,18,34,.44)`, dusk `rgba(56,30,48,.24)`).
After the tint it draws a **glow layer** exactly on top of each elf statue, so the glowing parts stay bright while the
rest of the statue is dark. The glow layer is a sprite with the **same canvas and pivot as the statue** that holds
**only the glowing pixels**; everything else is fully transparent. Three glow frames play in a slow loop (gentle
flicker, ~600 ms each); with reduced motion the game shows frame `g0` only, so `g0` must look good on its own.

| statue | originals (look at these first) | canvas · pivot | what glows |
|---|---|---|---|
| `ev_dark_dobby_red` «Dobby Hắc Ám» (red stone Dobby raising a sock, dark plinth with carved runes) | `garden-v05/event-assets/native/ev_dark_dobby_red_f0.png`, `…_right_f0.png` | 128×176 · (64,160) | amber eyes (`#FFC36B` core, `#F5D69A` 1 px hot spot); the carved runes on the plinth faces lit ember orange (`#ED8A45`/`#FFC36B`); a thin warm rim of light (1 px) along the top-left edges of head, ears, raised arm and sock (light from top-left); a soft halo on the ground around the plinth foot |
| `ev_dobby_spring_rider` «Dobby cưỡi thú nhún» (Dobby on a blue hippogriff spring rider, grey stone plinth) | `garden-v05/event-assets/native/ev_dobby_spring_rider.png`, `…_right.png` | 128×176 · (64,160) | Dobby's big eyes and the hippogriff's eye (`#B7DEE0` core, `#E8F0ED` hot spot); a thin cool magic rim (`#70A8B6`/`#B7DEE0`) along the top-left edges of Dobby's ears, waving hand and the hippogriff's wing; a few small sparkles on the spring coils; a soft halo on the ground around the plinth foot |

Ground halo: inside the 2×2 ground diamond (128 × 64 centred on x = 64, front corner at the pivot row). The statue must
still read as the same statue at night: the aura frames it, it does not paint over it.

Frames: `g0` = normal, `g1` = a touch brighter (halo a little denser, eye core 1 px larger or hot spot added),
`g2` = a touch dimmer (fewer halo/rim pixels). Same shapes, small differences only: no blinking on/off, no movement.

## Output files (`garden-v05/environment/statue-glow/`)

For each statue `<id>` and each facing: `<id>-g0.png`, `<id>-g1.png`, `<id>-g2.png` (default view) and
`<id>_right-g0.png`, `<id>_right-g1.png`, `<id>_right-g2.png` (turned view). 128×176 RGBA, alpha 0 or 255 only,
colours from `palette.mjs` `PALETTE` only. **Registration is the whole point:** every glowing pixel must sit on the
matching feature of the original (eyes on the eyes, runes on the runes, rim on the outline). Overlay each glow PNG on
its original and check it at 3×.

## Steps

1. Generate ONE master sheet with your image tool for the statue: `garden-v05/environment/statue-glow/masters/<id>.png`
   — the statue at night with its glowing parts, default view and turned view, three intensity steps each (2 rows ×
   3 columns), flat dark background so the aura shows. Use the originals (scaled up nearest-neighbour) as the reference
   so shapes match. Keep variants in `masters/variants/`. Save the exact prompt next to it (`masters/<id>.txt`).
2. Reduce each cell to the original's canvas: crop, nearest-neighbour resize so the ink box matches the original's ink
   box (±2 px), same pivot, quantise to `PALETTE`, then keep **only the glow pixels** (eye cores, lit runes, rim,
   sparkles, aura, ground halo). If the extracted glow sits 1–3 px off the original's features, shift those glow parts so they land
   on the features; do not invent shapes that the master does not have.
3. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   then `node garden-v05/build-runtime-webp.mjs --check`.
4. Preview `docs/codex-briefs/statue-glow-preview.png`, per facing, at 1× and 3× on grass `#3F6A45`:
   original by day · original under the night tint (`rgba(10,18,34,.44)` filled over it) · night tint + glow `g0` ·
   `g1` · `g2`.
5. `git status`: only `garden-v05/environment/statue-glow/**`, `garden-v05/runtime-webp/environment/statue-glow/**`,
   the webp manifests / `runtime-image-url.mjs` the builder regenerates, and your report/preview may change.

## Hard rules

- No git commit, push or deploy. Do not edit any `.mjs` game code, CSS, tests, `functions/` or the HPVNN repo.
- Do not touch the originals in `event-assets/` or `decor-assets/`.
- If image generation is unavailable or you hit a usage limit, stop and say so; do not fake the art with code.

## Report

`docs/codex-briefs/statue-glow-report.md`: per file the size, glow pixel count, glow ink box, whether every glow part
sits on its feature (eyes/runes/rim/aura/ground halo), and your verdict. End your final message with the same table.
