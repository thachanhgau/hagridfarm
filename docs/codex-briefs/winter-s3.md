# Codex brief — 25.0 S3 «Mùa đông thật»: snowy hut, frozen pond, winter forest (1 sheet, 6 sprites)

Claude Code (Anthropic) writes the game code, imports, tests and commits after you. **Your job is the masters and the
six native PNGs only.** Keep exploration short.

Read first: `docs/art-bible.md` §1–3 (1 source px = 1 game px, palette in `garden-v05/palette.mjs`, light from top-left,
selective dark outline `#231F2E`, no anti-aliasing, no text) and `docs/grid-fit-guideline.md` §1–2.

## What it is for

From 01/12 the garden has a real winter. The game swaps six existing scenery sprites for winter versions while winter
is on. Each winter sprite **replaces the original in place**: same canvas size, same pivot, same silhouette and
footprint, so nothing else in the scene moves. Look at each original first and redraw *that object* in deep winter.

| out file (`garden-v05/environment/winter/`) | original to match | canvas · pivot | winter version |
|---|---|---|---|
| `hut-snow.png` | `environment/layers/hut.png` | 164×184 · (82,184) | Hagrid's stone hut under thick snow: heavy rounded snow on the whole roof and chimney top, short icicles on the eaves, snow drift against the walls and door step, windows glowing warm (`#FFC36B`/`#F5D69A`). Same walls, door, chimney position as the original. |
| `pond-ice.png` | `environment/layers/pond.png` | 160×100 · (80,99) | The same pond frozen solid: pale ice (`#B7DEE0` `#70A8B6` with `#E8F0ED` glints), a few white cracks and skate-scratch lines, snow-covered banks and stones, reeds sticking up through snow. Same outline/shape as the original. |
| `oak.png` | `environment/forest-v06/oak.png` | 190×176 · (95,174) | Bare winter oak: dark branches, snow lying on the upper side of the big branches and in the crown forks, no leaves. Same trunk base and overall crown size. |
| `pine.png` | `environment/forest-v06/pine.png` | 104×196 · (52,194) | Snow-laden pine: dark green tiers each topped with a thick snow shelf, snow at the foot. |
| `grove.png` | `environment/forest-v06/grove.png` | 190×136 · (95,134) | The same cluster of shrubs/young trees in winter, snow caps on every top, mostly bare twigs. |
| `log.png` | `environment/forest-v06/log.png` | 144×88 · (72,86) | The fallen log buried under a snow blanket, bark showing on the sides and cut end. |

(Check the exact width/height/pivot of each original in `garden-v05/forest-assets.json` and `garden-v05/scene-data.json`
`props`; if they differ from this table, the original wins.)

Colours: the 24 sprite colours of `palette.mjs` plus `#E8F0ED` for the brightest snow. Snow = `#E8F0ED` lit tops,
`#D6D8BF` body, `#B7DEE0` / `#A6B1AE` shaded undersides (cool shadow toward bottom-right). Forest trees are drawn
small in the backdrop: big readable shapes, chunky snow clusters, no fine noise.

## Steps

1. Generate ONE master sheet with your image tool: `garden-v05/environment/winter/masters/winter-sheet.png`, 2 rows ×
   3 columns, one object per cell in the order of the table, transparent (or flat key-colour) background, generous gaps.
   Look at the originals first so the drawing matches their shape. Keep variants in `masters/variants/`.
2. Reduce each object to its exact canvas: crop, nearest-neighbour resize so the ink box matches the original's ink box
   (±4 px), place it so the feet/base sit on the same pivot as the original, quantise to the colours above, alpha 0/255
   only, ≥1 px transparent margin. Write the six PNGs above.
3. `SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
   then `node garden-v05/build-runtime-webp.mjs --check`.
4. Preview `docs/codex-briefs/winter-s3-preview.png`: each original next to its winter version at 1× and 3× on a snowy
   ground colour `#D6D8BF`.
5. `git status`: only `garden-v05/environment/winter/**`, `garden-v05/runtime-webp/environment/winter/**`, the webp
   manifests / `runtime-image-url.mjs` the builder regenerates, and your report/preview may change.

## Hard rules

- No git commit, push or deploy. Do not edit any `.mjs` game code, CSS, tests, `functions/` or the HPVNN repo.
- If image generation is unavailable or you hit a usage limit, stop and say so; do not fake art with code.

## Report

`docs/codex-briefs/winter-s3-report.md`: per file the size, pivot, ink box vs the original's ink box, and your verdict.
End your final message with the same table.
