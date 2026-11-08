# Codex brief — Hagrid Farm: bigger ponds (08/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw masters.** Claude Code (Anthropic) reduces them to native
sprites, registers them, tests and commits after you. Keep repo exploration short. Do not edit any `.mjs` file outside
`docs/codex-briefs/pond-art/`.

The owner said the ponds are too small (the first pond was smaller than a 3×3 crop plot). The three pond tiers now
sit on their own shore land and are much bigger: «Ao cá» 4×5 tiles, «Hồ rong» 5×7, «Hồ sâu» 6×9. Redraw the three
pond masters for the new guides. The shore bed (`pond-bed.png`) is NOT redrawn.

Read first: `docs/art-bible.md` (sections 1–4), `garden-v05/palette.mjs` (`SPRITE_PALETTE`, the 24 sprite colours),
and `docs/codex-briefs/pond-art-01.md` section A (the first pond brief: style rules, how to use a guide). All its
style rules apply: chunky low-resolution pixel art, one flat square block per sprite pixel, dark outline `#231F2E`,
2–3 shades per material, light from the top-left, isometric 2:1, no anti-aliasing, gradients, glow, dithering or
noise, no text, no drop shadow, **transparent background** (real alpha).

Style reference: the current masters `garden-v05/environment/pond/masters/pond-1.png`, `pond-2.png`, `pond-3.png`
(same family: grey rocks, cattails, grass tufts, lily pads, blue-violet water) and `garden-v05/environment/pond/pond-bed.png`.
Keep that look and the same **pixel block size per tile**: a bigger pond means more tiles of water, not bigger pixels.

| master (overwrite, in `garden-v05/environment/pond/masters/`) | guide | subject |
|---|---|---|
| `pond-1.png` | `docs/codex-briefs/pond-art/guide-pond-1.png` (1152×744) | «Ao cá»: a real fish pond now, murky dark water, 3–4 fish shadows, mossy rocks and dark cattail clumps on the rim, 2–3 grey-green lily pads |
| `pond-2.png` | `guide-pond-2.png` (1152×726) | «Hồ rong»: bigger, more reeds along the back rim, dark ribbon weed reaching up from the depths, a half-sunk log, two pale eyes under the surface |
| `pond-3.png` | `guide-pond-3.png` (1440×894) | «Hồ sâu»: a large lake-like pond, shallow light rim water stepping to a **deep dark-blue centre** (`#3E3B70`/`#41465C`), an **old rotting wooden jetty** (4 planks wide, posts, one plank missing) from the front-right bank toward the middle, a small rock islet, reeds and rocks on the far rim |

Each guide's pale-blue parallelogram is the exact ground (tile seams drawn). The bank follows that outline with
softly rounded corners, filling it (no big empty corners, nothing spilling outside it); reeds/rocks/posts may rise
above into the white space above the dashed red line, never wider than the guide. Same canvas size as the guide,
transparent; the guide's colours, seams, dot and dashed line must not appear in the master. Pass the guide to your
image tool as a reference, then place the result on a transparent canvas of the guide's size with a small script
under `docs/codex-briefs/pond-art/` (nearest-neighbour only).

**Mood (owner, 08/11): «hắc ám tí» — a little dark and eerie.** The pond sits at the edge of the Forbidden Forest
and holds Grindylows and a Kappa. Keep it cozy-readable, but darker than the old ponds: deep murky blue-black and
dark teal water (`#231F2E`, `#3E3B70`, `#41465C`, dark greens), only a thin lighter band at the shallow rim, black
reeds and dead cattails, mossy dark rocks, a twisted dead root or half-sunk log, a few pale eyes or a faint bubble
trail just under the surface, sparse grey-green lily pads (no bright flowers, no cheerful colours). No skulls, no
gore. «Ao cá» is the least dark, «Hồ sâu» the darkest (its centre almost black).

The three ponds must read as one family that grows. Make the bigger ones feel roomy, not empty: a few water details
(ripples, a leaf, a fish shadow) spread over the open water.

Finish with `docs/codex-briefs/pond-art-03-report.md`: for each master, the file, its size, what you drew, and a
contact image `docs/codex-briefs/pond-art-03-preview.png` (the three masters side by side on a grass-green #5E7B3B
background, nearest-neighbour, reduced to native: ×1/4, ×1/3, ×1/3).
