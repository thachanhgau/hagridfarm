# Codex brief — Hagrid Farm: «Góc nghỉ» vignette between the paddies and the pond (08/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw one master.** Claude Code (Anthropic) reduces it to a native
sprite, registers it, tests and commits after you. Do not edit any `.mjs` outside `docs/codex-briefs/pond-art/`.

The owner: the open meadow behind the north fence now holds the rice paddies («Ruộng nước», west) and the big dark
pond («Bờ hồ», east). The middle between them is «trống … vô duyên» — empty and awkward. Draw a small **tiểu cảnh**
(vignette) that anchors that middle and balances the low paddies and the wide pond.

| master (new, `garden-v05/environment/pond/masters/`) | guide | subject |
|---|---|---|
| `pond-nook.png` | `docs/codex-briefs/pond-art/guide-pond-nook.png` (768×992, native 192×248 ×4) | «Góc nghỉ»: one old gnarled willow-like tree (dark trunk, drooping dark-green fronds, some hanging moss) rising from the BACK half of the ground; under it a weathered mossy stone bench facing the viewer, one short stone lantern with a faint warm-yellow flame, 3–4 mossy rocks, a few ferns and small pale toadstools, two flat stepping stones at the front edge |

The pale-blue diamond on the guide is the exact 3×3 tile ground: everything stands on it, nothing spills sideways
outside its left/right corners. The tree may rise into the white headroom (up to the top of the canvas, never wider
than the guide). Transparent background (real alpha); the guide's colours, seams, dot and dashed line must not appear.

Style: read `docs/codex-briefs/pond-art-03.md` (style + mood rules «hắc ám tí»: a little dark and eerie but cozy and
readable, no skulls/gore) and match `garden-v05/environment/pond/masters/pond-3.png` exactly in pixel block size
(the same block size per tile: this guide is ×4, pond-3 is ×3, so blocks here are 4/3 of pond-3's pixels), outline
`#231F2E`, rock style, moss, palette (`garden-v05/palette.mjs` SPRITE_PALETTE). Chunky low-res pixel art, isometric
2:1, light from the top-left, no anti-aliasing, gradients, glow halos, dithering or text, no ground shadow outside
the diamond. The lantern flame is a few flat yellow blocks, not a glow.

Pass the guide to your image tool as a reference, then place the result on a transparent 768×992 canvas with a small
script under `docs/codex-briefs/pond-art/` (nearest-neighbour only). Finish with `docs/codex-briefs/pond-art-05-report.md`
and `docs/codex-briefs/pond-art-05-preview.png` (the master at ×1/4 on #5E7B3B next to pond-3 at ×1/3).
