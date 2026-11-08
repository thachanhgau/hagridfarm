# Codex brief — Hagrid Farm expansion phase 1: the pond (08/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw masters.** Claude Code (Anthropic) reduces them to native
sprites, registers them, tests and commits after you. Keep repo exploration short.

Read first: `docs/art-bible.md` (sections 1–4), `garden-v05/palette.mjs` (`SPRITE_PALETTE`, the 24 sprite colours).
Style for everything: chunky low-resolution pixel art, every sprite pixel one flat square block, clean dark outline
`#231F2E`, big flat colour clusters with at most 2–3 shades per material, light from the top-left, isometric 2:1
(dimetric) view, no anti-aliasing, no gradients, no glow, no dithering or speckle noise, no text, no frames, no
drop shadow outside the object, **transparent background** (real alpha). Colours as close as possible to the 24
sprite colours. Open the style references named per section and match them.

## A. Pond scenery (one image per piece)

Style reference: `garden-v05/environment/layers/pond.png` (the current decorative pond: grey rocks, cattails, grass
tufts, lily pads, blue-violet water). Open it and match its look and pixel density.

Each piece has a **guide** in `docs/codex-briefs/pond-art/guide-<id>.png`: the pale-blue parallelogram is the exact
ground the piece occupies (tile seams drawn), seen from the game camera. Draw the piece so its ground fills that
parallelogram: the bank/rim follows the parallelogram outline with softly rounded corners (do not leave big empty
corners, do not spill outside it). Things that stand up (reeds, rocks, jetty posts) may rise above the ground into
the white space above the dashed red line, but never wider than the guide. Same canvas size and aspect as the guide,
transparent background (the guide's colours, seams, dot and dashed line must **not** appear in the master). You can
pass the guide to your image tool as a reference, then scale/place the result onto a transparent canvas of the guide's
size with a small script under `docs/codex-briefs/pond-art/` (nearest-neighbour only).

| master (in `garden-v05/environment/pond/masters/`) | guide | subject |
|---|---|---|
| `pond-1.png` | `guide-pond-1.png` (960×672) | «Ao cá»: a small fish pond, clear blue water with 2–3 dark fish shadows under the surface, a few rocks and cattail clumps on the rim, one lily pad |
| `pond-2.png` | `guide-pond-2.png` (1120×760) | «Hồ rong»: a bigger pond, more reeds and cattails along the back rim, visible green water weed (long ribbon weed) in the shallows, lily pads, a couple of fish shadows |
| `pond-3.png` | `guide-pond-3.png` (1152×768) | «Hồ sâu»: a large deep pond, shallow light-blue rim water fading in clear steps to a **deep dark-blue centre** (`#3E3B70`/`#41465C`), a **small wooden jetty** (3–4 planks wide, two posts) reaching from the front-right bank toward the middle, reeds and rocks on the far rim |
| `pond-bed.png` | `guide-pond-bed.png` (1024×704) | «Luống ven hồ»: a long shallow **water planting tray** following the 1×3 strip: low wooden plank walls, a mud-and-water bed inside with a few small green shoots, no big plants (crops are drawn on it later) |

All three ponds must look like one family that grows: same rock style, same water colours, same reeds.

## B. Item icons (one sheet)

Style reference: `garden-v05/native-items/supply_water.png`, `recipe_fish.png`, `seed_packet.png` (open them at
8× nearest-neighbour). These end up 64×64 with the object about 40×40 px, so: one big readable object, few large
shapes, thick outline, no tiny details.

One sheet `garden-v05/masters-items/pond/items-sheet.png`, **1024×1024, a 2×2 grid of 512×512 cells**, one object per
cell, centred, base at y ≈ 440 of its cell, ≥ 48 px empty margin to every cell edge:

| cell | id | object |
|---|---|---|
| top-left | `fry_carp` | a clear **water bag** (thin glassy pouch, tied at the top with brown string) holding 3 tiny bronze-grey **carp fry** |
| top-right | `fry_goldfish` | the same water bag shape tied with red string, holding 3 tiny bright orange **goldfish fry** |
| bottom-left | `goldfish` | one plump orange **goldfish**, side view facing left, fan tail, a cream belly, one dark eye |
| bottom-right | `produce_grindylow` | «Rong thủy quái»: a **bundle of slimy dark-green pond weed** tied with a reed, glossy wet highlights, two drips of water |

## C. The creature «Thủy quái» (Grindylow, species id `grindylow`)

**Book Grindylow (Harry Potter and the Prisoner of Azkaban), not the film:** a small water demon, **pale sickly green**
skin, **two short sharp little horns** on its head, **long, thin, spindly fingers** with a strong grip, thin arms and
legs, large dark eyes, a wide mouth with tiny pointed teeth, a little wet shine on the head. Two legs, **no tentacles,
no octopus parts**. In this cozy farm it is mischievous and a bit cheeky, not gory. Small creature, compact body.

Style reference: open `garden-v05/creature-motion-assets/masters/diricawl-right-motion-v01.png` (a 4×4 motion sheet)
and `garden-v05/native-levels/diricawl/frame-04.png` (its 96×96 native adult): match that pixel style. The native
adult will be about 56 × 58 px, so keep the silhouette big and clear and the fingers long enough to read at that size.

Sheets (in `garden-v05/creature-motion-assets/masters/`), every pose **one fully separated sprite** (fingers, horns,
held fish all touching the body; ≥ 32 px transparent gap between poses), centred in its cell, **feet on the same
ground line** (about 82% down each cell), same size and same design in every cell, no ground, no shadow, no props
except the ones named:

1. `grindylow-left-motion-v01.png` — **1024×1024, 4×4 cells of 256**. All 16 poses face **LEFT** in a clear
   three-quarter view (face and eyes toward image left; do not mirror a right-facing drawing). Rows:
   - row 1 idle: rest (crouched, fingers resting on knees) · breathe (shoulders up) · blink · settle (fingers flex);
   - row 2 action: prep (crouch low) · peak (springs up, both long-fingered hands raised, two water drops) · release
     (landing) · recovery;
   - row 3 eat: approach a tiny silver fish on the ground · bend and grab it with the long fingers · bite · lift and chew;
   - row 4 care: lean toward a small hand/brush cue · receive care with eyes closed, happy · blink · relaxed.
   Draw this sheet first; it is the design master. Make two candidates, keep the better one, say why.
2. `grindylow-right-motion-v01.png` — the same 4×4 layout and poses, all facing **RIGHT** (face toward image right;
   light still from the top-left, so do not just mirror the left sheet). Use sheet 1 as the reference for the design.
3. `grindylow-growth-v01.png` — **1024×512, 2 rows × 4 cells of 256**: row 1 faces LEFT, row 2 faces RIGHT; columns
   newborn (tiny, round, horn nubs) · juvenile · adolescent · adult (the same adult as sheets 1–2). Adult about 2–3×
   the newborn's height, all in a calm standing pose, feet on one ground line.

Two companion objects (in `garden-v05/masters-complete-objects/`), each **one object centred on a transparent square
image** (1024×1024), style reference `habitat_kneazle.png`/`keepsake_kneazle.png` there and their natives in
`garden-v05/native-complete-objects/habitat_kneazle/` and `keepsake_kneazle/`:

4. `habitat_grindylow.png` — the Grindylow's habitat prop, an empty tiny garden prop (native 36×28): a **small rock
   pool nook**: a ring of 4–5 grey stones holding a little blue water with one strand of weed, a small stone arch over
   one side to hide under. No creature. Squat silhouette, extraordinarily simple, broad flat blocks.
5. `keepsake_grindylow.png` — the keepsake statuette (native 44×44 including plinth): a **Grindylow statuette** (pale
   green, two little horns, long fingers raised) fixed on a low two-step warm grey stone plinth with a simple gold
   front inset. No lettering.

## D. 16×16 pixel icons (grids, no images)

Write them into a NEW file `docs/codex-briefs/pond-art/pixel-icons-new.mjs` exporting
`export const NEW_ICONS = { id: [16 strings of 16 chars], … }`, in exactly the format of `garden-v05/pixel-icons.mjs`
(one char per pixel, only the `INK` keys there, `.` = transparent). Match the weight, outline and light of the
existing `water`, `feed`, `chest`, `heart` grids: `pond` (a small oval pond with a reed and a ripple), `net` (a
fishing landing net: round hoop with mesh and a short handle), `rod` (a fishing rod with line and a red-and-white
bobber), `algae` (a clump of green pond algae/scum on a little water line, the thing you skim off).

## Delivery

- Append every image prompt (one entry per master: `id`, `master`, `prompt`, `generatedFile` = the path your image
  tool wrote, `referenceFiles`) to `garden-v05/environment/pond/prompts.json` (create it as `{"items": []}`).
- Do not write native frames, previews or any `.mjs` outside `docs/codex-briefs/pond-art/`, and do not run any builder
  or importer: Claude does the reduction.
- Hard rules: no git commit/push/deploy; do not edit existing files except appending to the prompts file; do not touch
  HPVNN or `functions/`. If image generation refuses a subject, stop that item, list it and the refusal text, and do
  not rename or describe around it. If image generation or usage is unavailable, stop and say so: never fake art with
  code.
- Report in `docs/codex-briefs/pond-art-01-report.md`: a table of id, master path, size, candidate kept and why, your
  verdict (good / redo), plus anything refused.
