# Codex brief — Hagrid Farm expansion phase 3, part 2: Bìa Rừng Cấm scenery, trees and icons (08/11/2026)

You are Codex in the Hagrid Farm repo (a worktree on branch `edge-art`). **You only draw masters.** Claude Code
(Anthropic) reduces them to native sprites, registers them, tests and commits after you. Keep repo exploration short.
Same job as `docs/codex-briefs/pond-art-01.md` (pond scenery with footprint guides, item sheet, 16×16 grids); read its
report `docs/codex-briefs/pond-art-01-report.md` for what worked.

Read first: `docs/art-bible.md` (sections 1–4), `garden-v05/palette.mjs` (`SPRITE_PALETTE`, the 24 sprite colours).
Style for everything: chunky low-resolution pixel art, every sprite pixel one flat square block, clean dark outline
`#231F2E`, big flat colour clusters with at most 2–3 shades per material, light from the top-left, isometric 2:1
(dimetric) view, no anti-aliasing, no gradients, no glow, no dithering or speckle noise, no text, no frames, no
drop shadow outside the object, **transparent background** (real alpha). Colours as close as possible to the 24
sprite colours: `#231F2E #4A3042 #735044 #A57554 #41465C #687486 #A6B1AE #D6D8BF #24483F #3F6A45 #71934B #B0BD67
#8B4A3F #C97952 #E7AE73 #F5D69A #874056 #C75B4B #ED8A45 #FFC36B #3E3B70 #6961A6 #70A8B6 #B7DEE0`.

## A. Ground pieces (three images)

Style reference: the garden's grass in `garden-v05/environment/terrain-grass.png` and the rocks/grass of
`garden-v05/environment/layers/pond.png`, `garden-v05/environment/pond/pond-1.png`. Match their look and pixel density.

Each piece has a **guide** in `docs/codex-briefs/edge-art/guide-<id>.png`: the pale-blue parallelogram is the exact
ground the piece occupies (tile seams drawn), seen from the game camera. Draw the piece so its ground **fills that
parallelogram completely**: grass out to every edge and corner (a clean slightly irregular border is fine, but no big
empty corners and nothing outside it). Things that stand up (fence posts) may rise a little above the ground into the
white space above the dashed red line, never wider than the guide. Same canvas size and aspect as the guide, transparent
background (the guide's colours, seams, dot, dashed line and orange pits must **not** appear in the master). Pass the
guide to your image tool as a reference, then scale/place the result onto a transparent canvas of exactly the guide's
size with a small script under `docs/codex-briefs/edge-art/` (nearest-neighbour only; `pond-art/place-masters.py` is an
example). One native pixel = 2×2 master pixels for pasture/orchard (8×8 for trail), so use coarse blocks.

| master (in `garden-v05/environment/edge/masters/`) | guide (canvas) | subject |
|---|---|---|
| `pasture.png` | `guide-pasture.png` (1152×628) | «Bãi chăn thả»: lush green meadow grass in two or three flat shades, a few tufts and tiny white and yellow flowers, **a rough wooden post-and-rail fence** (dark brown logs, two rails) running along the whole outer border (back two edges drawn standing up, front two edges lower), with one **gap/gate** on the front-left edge; a small wooden water trough and a hay bale inside near the back corner; the middle stays open and plain so animals can walk over it |
| `orchard.png` | `guide-orchard.png` (1152×628) | «Vườn cây lâu năm»: the same grass, **no fence** but a few small stones and clover at the border; **exactly six dark-brown dirt planting pits**, each exactly filling one orange 2×2-tile square marked in the guide (rounded, a rim of loose soil, flat shades `#735044 #4A3042 #A57554`), the orange colour must not appear; the six pits are empty (trees are drawn separately) |
| `trail.png` | `guide-trail.png` (768×480) | «Lối mòn»: a worn **dirt trail** across the 2×1 strip joining two grass areas: packed brown earth (`#A57554 #C97952 #735044`), a few pebbles and wheel/hoof marks, grass tufts at both sides, the earth running edge to edge in the long (left-up to right-down) direction so it joins neighbouring ground |

## B. Perennial trees (nine images)

Each tree is one object standing in one 2×2-tile pit, **same guide for all nine**: `docs/codex-briefs/edge-art/guide-tree.png`
(1024×1152; the red dot is the trunk base and ground centre). Make the exact canvas, trunk base on the red dot; do **not**
draw the pit/ground itself beyond a small mound of earth at the trunk base (the pit is part of orchard.png). Style
reference: the trees in `garden-v05/environment/layers/` (and `garden-v05/environment/forest-v06/` if present).
Three stages per kind, **same trunk position and same trunk base in all three stages of a kind**, growing taller:

| stage | meaning |
|---|---|
| `-0` | sapling: a thin staked young tree, ~30–40% of the full height, a few leaves, a wooden stake with a tie |
| `-1` | grown: full leafy canopy and sturdy trunk, no fruit |
| `-2` | fruiting: exactly the `-1` tree with **plenty of big ripe fruit** (6–9 pieces, each a clear 3×3-native-pixel-ish blob) all over the canopy |

Kinds (master files `garden-v05/environment/edge/masters/tree-<kind>-<stage>.png`, each 1024×1152):
`apple` (round canopy, mid green, red apples `#C75B4B`), `pear` (taller narrower canopy, yellow-green, yellow-green pears
`#B0BD67`/`#F5D69A`), `plum` (rounder darker canopy `#24483F #3F6A45`, purple plums `#6961A6 #3E3B70`). The three kinds
must look like one family (same trunk style, leaf shapes) yet differ in silhouette and fruit colour. Canopy never wider
than the guide's 1024 px width and never touching the canvas edge. One native pixel = 8×8 master pixels: very coarse,
very simple, large flat clusters.

## C. Item icons (two sheets)

Style reference: `garden-v05/native-items/produce_grindylow.png`, `produce_crup.png`, `crup_feed.png`, `supply_water.png`
(open them at 8× nearest-neighbour). They end up 64×64 with the object about 40×40 px: one big readable object, few
large shapes, thick outline, no tiny details, no soft halo.

Sheet A `garden-v05/masters-items/edge/items-sheet-a.png`, **1536×1024, 3 columns × 2 rows of 512×512 cells**, and sheet B
`garden-v05/masters-items/edge/items-sheet-b.png`, **1024×1024, 2×2 cells of 512×512**; one object per cell, centred,
base at y ≈ 440 of its cell, ≥ 48 px empty margin to every cell edge:

| sheet / cell | id | object |
|---|---|---|
| A row 1 col 1 | `produce_kappa` | «Vảy ma da»: three **dull green-grey scales** (rounded plates) fanned out and tied with a thin blue-green cord, one drop of water |
| A row 1 col 2 | `produce_porlock` | «Lông bờm»: a **tuft of shaggy brown hair** bound with a red ribbon |
| A row 1 col 3 | `kappa_feed` | a **fresh cucumber with a sliced piece and a small orange pumpkin wedge** on a tiny wooden plate |
| A row 2 col 1 | `porlock_feed` | a **small wooden bowl heaped with oats** with a few clover leaves tucked in |
| A row 2 col 2 | `apple` | one big **red apple** with a short stem and a green leaf |
| A row 2 col 3 | `pear` | one big **yellow-green pear** with a stem and a leaf |
| B top-left | `plum` | one big **purple plum** with a pale bloom highlight, stem and leaf |
| B top-right | `sapling_apple` | a **young apple sapling in a small burlap root-ball sack** tied with string, two or three leaves, one tiny red apple |
| B bottom-left | `sapling_pear` | the same sack, a **pear sapling** (yellow-green leaves, one tiny pear) |
| B bottom-right | `sapling_plum` | the same sack, a **plum sapling** (darker leaves, one tiny purple plum) |

Sheet B cells in row-major order: `plum` top-left, `sapling_apple` top-right, `sapling_pear` bottom-left, `sapling_plum` bottom-right.

## D. 16×16 pixel icons (grids, no images)

Write them into a NEW file `docs/codex-briefs/edge-art/pixel-icons-new.mjs` exporting
`export const NEW_ICONS = { id: [16 strings of 16 chars], … }`, in exactly the format of `garden-v05/pixel-icons.mjs`
(one char per pixel, only the `INK` keys there, `.` = transparent). Match the weight, outline and light of the
existing `pond`, `paw`, `feed`, `heart` grids: `pasture` (a short wooden post-and-rail fence in front of a green tuft),
`orchard` (a small round-canopied tree on a trunk with two red dots of fruit), `fruit` (one red apple with a stem and a
green leaf).

## Delivery

- Record every image prompt in `docs/codex-briefs/edge-art/prompts-scenery.json` (create it as `{"items": []}`; one entry
  per master: `id`, `master`, `prompt`, `generatedFile` = the path your image tool wrote, `referenceFiles`).
- Masters: 3 ground pieces + 9 trees + 2 item sheets (all paths above).
- Do not write native frames, previews or any `.mjs` outside `docs/codex-briefs/edge-art/` (the `pixel-icons-new.mjs`
  there is yours), and do not run any builder or importer: Claude does the reduction. Rejected candidates stay under
  `docs/codex-briefs/edge-art/`.
- Another Codex run is drawing brief 01 (creatures) in the same worktree at the same time: touch only the files named here.
- Hard rules: no git commit/push/deploy; do not edit existing files; do not touch HPVNN or `functions/`. If image
  generation refuses a subject, stop that item, list it and the refusal text, and do not rename or describe around it.
  If image generation or usage is unavailable, stop and say so: never fake art with code.
- Report in `docs/codex-briefs/edge-art-02-report.md`: a table of id, master path, size, candidate kept and why, your
  verdict (good / redo), plus anything refused.
