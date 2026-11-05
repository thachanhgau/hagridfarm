# Codex brief — 25.0 S7 part 2: champion tree decoration + house tree, feast, carried tree (2 masters)

Claude Code (Anthropic) writes the game code, imports, tests and commits after you. **Your job is the masters and the
native PNGs only.** Keep exploration short.

Read first: `docs/art-bible.md` §1–3 (1 source px = 1 game px, palette in `garden-v05/palette.mjs`, light from top-left,
selective dark outline `#231F2E`, no anti-aliasing, no text), `docs/grid-fit-guideline.md` §1–3, and
`docs/codex-briefs/xmas-set-s7.md` + `docs/codex-briefs/xmas-hearth-s7.md` (the same two pipelines, done for part 1).
Match the look of `garden-v05/environment/xmas/hearth.png` and the Noel set (`event-assets/native/sp_xmas_*.png`).

## A. Decoration `ev_champion_tree` — `garden-v05/event-assets/masters/ev_champion_tree.png`

Spec and palette are already in `event-assets/specs.json` and `item-palettes.json` (2×2, canvas 128×208, pivot
(64,192), ink ≤ 120×184). Same two-view master as the Noel set: LEFT half default isometric view, RIGHT half the same
object turned 90° (a real turned view, not a mirror), same size and baseline. It must read clearly differently from
`sp_xmas_weasley_tree` (slender, gold stars, floating candles, stone planter, small gold cup; no gnome).

Build (writes only inside `event-assets/`):
`DECOR_PACK_DIR=$PWD/garden-v05/event-assets SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/halloween-assets/build-assets.mjs`
The existing items' native files (`ev_*`, `sp_xmas_*`) must stay byte-identical (`git status`); revert any the build rewrote.

## B. Sheet `garden-v05/environment/xmas/masters/xmas-part2-sheet.png` → six native PNGs in `environment/xmas/`

One master sheet, 2 rows × 3 columns, one object per cell in table order, flat key-colour background, generous gaps.

| out file | canvas · pivot | content |
|---|---|---|
| `house-tree-0.png` | 96×160 · (48,156) | A young fir sapling in a small wooden tub on snow, bare of decorations, ink only ~40 px tall, sitting on the pivot. |
| `house-tree-1.png` | 96×160 · (48,156) | The same tree grown to ~80 px tall, same tub, a little snow on the branches, no decorations. |
| `house-tree-2.png` | 96×160 · (48,156) | Grown to ~115 px, same tub, a few strands of silver tinsel, still no baubles. |
| `house-tree-3.png` | 96×160 · (48,156) | Full tree ~150 px tall like the twelve great trees of the Great Hall, same tub, tinsel, a bright gold star on top. **No baubles or ornaments anywhere**: twelve ornaments are drawn on top by code. |
| `feast.png` | 80×56 · (40,52) | A low rustic wooden table on snow laid for a Christmas feast by house-elves: a roast turkey on a platter, a round Christmas pudding with a holly sprig, a jug, a few plates and two lit candles. 3/4 isometric view like the hearth. |
| `carried-tree.png` | 64×48 · (8,40) | A freshly cut fir tree lying diagonally as if carried over a giant's shoulder: trunk end at the lower left (the pivot, where the hand holds it), crown up to the right, a little snow on it. |

All four tree stages: same fir, same tub, same pivot; only height, snow and tinsel change. Colours: the 24 sprite
colours of `palette.mjs`; the star and candles may add `#FFC36B` `#F5D69A`.

Steps: reduce each object to its exact canvas (crop, nearest-neighbour resize, ≥1 px transparent margin, base on the
pivot, quantise, alpha 0/255 only), write the six PNGs, then
`SHARP_MODULE=/Users/thachanh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp node garden-v05/build-runtime-webp.mjs`
and `node garden-v05/build-runtime-webp.mjs --check`.

## Preview and report

- `docs/codex-briefs/xmas-s7-part2-preview.png`: `ev_champion_tree` native default + right views, the four tree stages
  side by side, feast and carried tree, all at 3× nearest-neighbour on `#D6D8BF`.
- `docs/codex-briefs/xmas-s7-part2-report.md`: per file size, pivot, ink box, verdict. For each `house-tree-N.png` also
  the foliage triangle where ornaments can hang: apex (x,y), base y, base left x, base right x. For `feast.png` the table
  top box. End your final message with the same table.

## Hard rules

- `git status` afterwards: only `garden-v05/event-assets/**` (masters, native, manifests the build writes),
  `garden-v05/environment/xmas/**`, `garden-v05/runtime-webp/**`, the webp manifests / `runtime-image-url.mjs` the
  builders regenerate, and your preview/report. Do not edit `.mjs` game code, CSS, tests or the HPVNN repo.
- No git commit, push or deploy. If image generation is unavailable, refused, or you hit a usage limit, stop and say so;
  do not fake art with code and do not rename or describe around a refused subject.
