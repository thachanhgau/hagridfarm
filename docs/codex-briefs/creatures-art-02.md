# Codex brief — Hagrid Farm expansion phase 2: three new creatures (08/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw masters.** Claude Code (Anthropic) reduces them to native
sprites, registers them, tests and commits after you. Keep repo exploration short. This is the same job as
`docs/codex-briefs/pond-art-01.md` (phase 1, the Grindylow), now for three land creatures; read its report
`docs/codex-briefs/pond-art-01-report.md` for what worked.

Read first: `docs/art-bible.md` (sections 1–4), `garden-v05/palette.mjs` (`SPRITE_PALETTE`, the 24 sprite colours).
Style for everything: chunky low-resolution pixel art, every sprite pixel one flat square block, clean dark outline
`#231F2E`, big flat colour clusters with at most 2–3 shades per material, light from the top-left, isometric 2:1
(dimetric) view, no anti-aliasing, no gradients, no glow, no dithering or speckle noise, no text, no frames, no
drop shadow outside the object, **transparent background** (real alpha). Colours as close as possible to the 24
sprite colours: `#231F2E #4A3042 #735044 #A57554 #41465C #687486 #A6B1AE #D6D8BF #24483F #3F6A45 #71934B #B0BD67
#8B4A3F #C97952 #E7AE73 #F5D69A #874056 #C75B4B #ED8A45 #FFC36B #3E3B70 #6961A6 #70A8B6 #B7DEE0`.

## A. The three creatures

Style reference for all three: open `garden-v05/creature-motion-assets/masters/grindylow-left-motion-v01.png` and
`grindylow-growth-v01.png` (the phase-1 sheets, same layout as yours), `garden-v05/creature-motion-assets/masters/diricawl-right-motion-v01.png`,
and the 96×96 natives `garden-v05/creature-motion-assets/native/grindylow/left-growth-04.png` and
`garden-v05/native-levels/diricawl/frame-04.png`. Match that pixel style and density. Each native adult ends up
about 40–56 px tall in a 96×96 frame, so keep every silhouette big, simple and readable at that size.

| species id | name | subject | native adult (about) |
|---|---|---|---|
| `crup` | «Chó đuôi nĩa» (Crup, HP5) | a small **Jack Russell–like terrier**: white body with tan-brown patches on the head and back, pointed ears folded at the tips, short legs, keen dark eyes, a cheeky grin. Its tail is **forked**: one short tail that splits into **two prongs like a fork** (the one thing that tells it apart from a plain dog; make the fork big and obvious in every pose). Cheerful, bouncy. | 56 wide × 46 tall |
| `knarl` | «Nhím quậy» (Knarl, HP5) | a **hedgehog-like creature, spikier and grumpier than a normal hedgehog**: a round body under a thick coat of long, sharp, **dark brown quills with pale tips** sticking out in chunky spikes, a pointed snout with a black nose, small suspicious **frowning eyes** (heavy brow), tiny clawed feet. It distrusts food left out for it. | 52 wide × 40 tall |
| `salamander` | «Kỳ nhông lửa» (fire salamander, HP2) | a small **bright orange-red lizard** that lives in fire: slim body, four splayed little legs, a long tapering tail, a rounded head with bright yellow eyes, a few **darker red-brown spots** along the back. Small **flame accents** are allowed: two or three flat-colour flame licks (yellow `#FFC36B`, orange `#ED8A45`, red `#C75B4B`) rising from its back/tail, drawn as hard-edged pixel shapes **touching the body**; no glow, no halo, no gradient, no smoke. | 62 wide × 36 tall |

All three are cosy farm creatures, cute and characterful, not scary.

Sheets for **each** species `<id>` (in `garden-v05/creature-motion-assets/masters/`), every pose **one fully separated
sprite** (tail fork, quills, flames, held food all touching the body; ≥ 32 px transparent gap between poses), centred
in its cell, **feet on the same ground line** (local y = 210 in each 256 cell), same size and same design in every
cell, no ground, no shadow, no props except the ones named:

1. `<id>-left-motion-v01.png` — **1024×1024, 4×4 cells of 256** (no drawn grid). All 16 poses face **LEFT** in a clear
   three-quarter view (head and eyes toward image left; do not mirror a right-facing drawing). Rows:
   - row 1 **idle**: rest · breathe (chest up) · blink · settle (small shift: crup tail wags, knarl quills bristle, salamander tail curls);
   - row 2 **action**: prep · peak · release · recovery, per species:
     - crup: crouch, **springs up chasing its own forked tail**, lands, shakes itself;
     - knarl: tucks in, **curls into a tight spiky ball with quills fully raised**, unrolls, grumpy huff;
     - salamander: crouch, **rears up with a bigger flame lick on its back and a small puff of flame from the mouth** (flat shapes touching the mouth), drops, flame back to small;
   - row 3 **eat**: approach the food on the ground · bend to it · bite · lift and chew. Food (small, touching the
     mouth from pose 2 on): crup a **small bone-shaped meaty biscuit**; knarl **a few seeds and a little root**;
     salamander **a dry twig and a small red chilli**;
   - row 4 **care**: lean toward a small cue (a hand; for knarl a **hand holding out seeds**, it only eats from the
     hand) · receive care with eyes closed, happy (knarl: quills lowered, frown gone) · blink · relaxed.
   Draw this sheet first; it is the design master. Make two candidates, keep the better one, say why.
2. `<id>-right-motion-v01.png` — the same 4×4 layout and poses, all facing **RIGHT** (head toward image right; light
   still from the top-left, so do not just mirror the left sheet). Use sheet 1 as the design reference.
3. `<id>-growth-v01.png` — **1024×512, 2 rows × 4 cells of 256**: row 1 faces LEFT, row 2 faces RIGHT; columns
   newborn (tiny, round, big head) · juvenile · adolescent · adult (the same adult as sheets 1–2). Adult about 2–3×
   the newborn's height, all in a calm standing pose, feet on one ground line (local y = 210). The crup pup already
   has the forked tail; the knarl hoglet has soft short quills; the salamander hatchling has one tiny flame lick.

Keep the three species distinct from each other and from the existing creatures (the Kneazle cat, the Niffler, the
three-headed dog): the crup is clearly a small terrier with a fork tail, the knarl clearly a grumpy hedgehog ball of
quills, the salamander clearly an orange lizard.

## B. Habitats and keepsake statues

In `garden-v05/masters-complete-objects/`, each **one object centred on a transparent square image** (1024×1024).
Style reference: `habitat_kneazle.png`, `habitat_grindylow.png`, `keepsake_kneazle.png`, `keepsake_grindylow.png` there
and their natives in `garden-v05/native-complete-objects/habitat_kneazle/`, `habitat_grindylow/`, `keepsake_kneazle/`,
`keepsake_grindylow/`. Habitats end up 36×28 native, so: squat silhouette, extraordinarily simple, broad flat blocks,
no creature in it.

| master | subject |
|---|---|
| `habitat_crup.png` | a **small wooden dog kennel**: plank walls, a pitched roof with darker shingles, a round dark doorway, a little food bowl beside it |
| `habitat_knarl.png` | a **pile of fallen leaves on a short mossy log**, a dark hollow at the log's end to hide in |
| `habitat_salamander.png` | a **ring of grey campfire stones** with a few **glowing embers** (flat orange/yellow blocks on dark charcoal, no glow) and two crossed burnt sticks in the middle; one tiny flat flame |
| `keepsake_crup.png` | a **Crup statuette** (sitting terrier, forked tail clearly visible) on a low two-step warm grey stone plinth with a simple gold front inset; no lettering |
| `keepsake_knarl.png` | a **Knarl statuette** (grumpy quill ball with its snout out) on the same plinth style |
| `keepsake_salamander.png` | a **salamander statuette** (orange lizard, tail curled, one small flame lick) on the same plinth style |

The three keepsakes must look like one set with the existing keepsakes (same plinth, same gold inset).

## C. Item icons (one sheet)

Style reference: `garden-v05/native-items/produce_grindylow.png`, `goldfish.png`, `fry_carp.png`, `supply_water.png`
(open them at 8× nearest-neighbour). These end up 64×64 with the object about 40×40 px: one big readable object,
few large shapes, thick outline, no tiny details.

One sheet `garden-v05/masters-items/creatures-2/items-sheet.png`, **1536×1024, 3 columns × 2 rows of 512×512 cells**,
one object per cell, centred, base at y ≈ 440 of its cell, ≥ 48 px empty margin to every cell edge:

| cell | id | object |
|---|---|---|
| row 1, col 1 | `produce_crup` | a **tuft of white-and-tan terrier fur** tied with a thin red ribbon |
| row 1, col 2 | `produce_knarl` | a **bundle of 5–6 long Knarl quills** (dark brown, pale tips) tied with twine |
| row 1, col 3 | `produce_salamander` | a small **glass jar with a cork** holding a pinch of **glowing ash** (orange-yellow flat flecks on grey ash; no glow outside the jar) |
| row 2, col 1 | `crup_feed` | a **meaty bone-shaped dog biscuit**, golden-brown with a darker meat-red middle |
| row 2, col 2 | `knarl_feed` | a **small wooden bowl of seeds and little roots** |
| row 2, col 3 | `salamander_feed` | a **small bundle of dry twigs** tied together with **one red chilli** tucked in |

## D. 16×16 pixel icons (grids, no images)

Write them into a NEW file `docs/codex-briefs/creatures-art-2/pixel-icons-new.mjs` exporting
`export const NEW_ICONS = { id: [16 strings of 16 chars], … }`, in exactly the format of `garden-v05/pixel-icons.mjs`
(one char per pixel, only the `INK` keys there, `.` = transparent). Match the weight, outline and light of the
existing `feed`, `heart`, `pond`, `net` grids: `paw` (a dog paw print: one pad and four toes), `hand_feed` (an open
hand, palm up, holding two or three seeds), `campfire` (two crossed logs with a flat three-colour flame above them).

## Delivery

- Record every image prompt in `docs/codex-briefs/creatures-art-2/prompts.json` (create it as `{"items": []}`; one entry
  per master: `id`, `master`, `prompt`, `generatedFile` = the path your image tool wrote, `referenceFiles`).
- Masters (16 files): for each of `crup`, `knarl`, `salamander`: `<id>-left-motion-v01.png`, `<id>-right-motion-v01.png`,
  `<id>-growth-v01.png`, `habitat_<id>.png`, `keepsake_<id>.png`; plus the one item sheet.
- Do not write native frames, previews or any `.mjs`/`.json` outside `docs/codex-briefs/creatures-art-2/`, and do not run
  any builder or importer: Claude does the reduction. Rejected candidates stay under `docs/codex-briefs/creatures-art-2/`.
  You may place generated art onto the exact canvas with a small script there (crop/place, nearest-neighbour only; no
  painting, no quantizing).
- Hard rules: no git commit/push/deploy; do not edit existing files; do not touch HPVNN or `functions/`. If image
  generation refuses a subject, stop that item, list it and the refusal text, and do not rename or describe around it.
  If image generation or usage is unavailable, stop and say so: never fake art with code.
- Report in `docs/codex-briefs/creatures-art-02-report.md`: a table of id, master path, size, candidate kept and why,
  your verdict (good / redo), plus anything refused.
