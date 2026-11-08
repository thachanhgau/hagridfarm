# Codex brief — Hagrid Farm expansion phase 3, part 1: Ma da and Ngựa lùn (08/11/2026)

You are Codex in the Hagrid Farm repo (a worktree on branch `edge-art`). **You only draw masters.** Claude Code
(Anthropic) reduces them to native sprites, registers them, tests and commits after you. Keep repo exploration short.
This is the same job as `docs/codex-briefs/creatures-art-02.md` (phase 2: crup, knarl, salamander); read its report
`docs/codex-briefs/creatures-art-02-report.md` for what worked (separate left and right sheets, two candidates for the
left sheet, ground line at local y = 210).

Read first: `docs/art-bible.md` (sections 1–4), `garden-v05/palette.mjs` (`SPRITE_PALETTE`, the 24 sprite colours).
Style for everything: chunky low-resolution pixel art, every sprite pixel one flat square block, clean dark outline
`#231F2E`, big flat colour clusters with at most 2–3 shades per material, light from the top-left, isometric 2:1
(dimetric) view, no anti-aliasing, no gradients, no glow, no dithering or speckle noise, no text, no frames, no
drop shadow outside the object, **transparent background** (real alpha). Colours as close as possible to the 24
sprite colours: `#231F2E #4A3042 #735044 #A57554 #41465C #687486 #A6B1AE #D6D8BF #24483F #3F6A45 #71934B #B0BD67
#8B4A3F #C97952 #E7AE73 #F5D69A #874056 #C75B4B #ED8A45 #FFC36B #3E3B70 #6961A6 #70A8B6 #B7DEE0`.

## A. The two creatures

Style reference for both: `garden-v05/creature-motion-assets/masters/grindylow-left-motion-v01.png`,
`grindylow-growth-v01.png`, `crup-left-motion-v01.png`, `crup-growth-v01.png` (same sheet layouts as yours) and the 96×96
natives `garden-v05/creature-motion-assets/native/grindylow/left-growth-04.png`, `native/crup/left-growth-04.png`. Match
that pixel style and density. Every silhouette must be big, simple and readable at its native size.

| species id | name | subject | native adult (about) |
|---|---|---|---|
| `kappa` | «Ma da» (Kappa, HP3) | **Book Kappa (Prisoner of Azkaban), not the Japanese film-style turtle**: a small **scaly water demon that looks like a monkey** — hunched, long arms, bare **dull green-grey scaly skin** with a few darker scale patches, webbed hands and feet, a pointed bony face with big pale eyes and a wide mouth, and on top of its head a **shallow dent holding a little puddle of water** (a small pale-blue `#70A8B6`/`#B7DEE0` oval inside a rim, clearly visible in every pose and in every facing). Mischievous, cheeky, a bit eerie but cosy, not gory; no turtle shell, no beak. | 54 wide × 56 tall (same tier as the Thủy quái) |
| `porlock` | «Ngựa lùn» (Porlock, HP5) | **Book Porlock (Half-Blood Prince)**: a shy little **horse-guardian that walks UPRIGHT on two cloven hooves**, about two feet tall, **covered in shaggy brown fur**, a **mop of rough shaggy hair on its head**, an **exceptionally large nose**, small arms ending in **four stubby fingers**, a worried, gentle expression. It is a cute shy guardian, NOT a pony on four legs and not a centaur. Two legs, two arms, upright posture, hooves clearly visible. | 52 wide × 56 tall (same tier as the Chó đuôi nĩa) |

Keep them distinct from each other and from existing creatures (the Thủy quái is pale green, thin and horned with long
fingers: the Ma da is stockier, grey-green, scaly, monkey-hunched with a head puddle and no horns).

Sheets for **each** species `<id>` (in `garden-v05/creature-motion-assets/masters/`), every pose **one fully separated
sprite** (everything touching the body; ≥ 32 px transparent gap between poses), centred in its cell, **feet on the same
ground line** (local y = 210 in each 256 cell), same size and same design in every cell, no ground, no shadow, no props
except the ones named:

1. `<id>-left-motion-v01.png` — **1024×1024, 4×4 cells of 256** (no drawn grid). All 16 poses face **LEFT** in a clear
   three-quarter view (head and eyes toward image left; do not mirror a right-facing drawing). Rows:
   - row 1 **idle**: rest · breathe (chest up) · blink · settle (kappa: head puddle ripples, fingers flex; porlock: nose twitches, shaggy hair sways);
   - row 2 **action**: prep · peak · release · recovery, per species:
     - kappa: crouch, **bows deeply (the Kappa's courtesy) so the head puddle tilts and a drop splashes**, straightens, shakes head;
     - porlock: shuffles back shyly, **hides behind its own shaggy arms** (arms crossed over the face) peeking out, lowers arms, relieved sigh;
   - row 3 **eat**: approach the food on the ground · bend to it · take it and bite · lift and chew. Food (small, touching the hands/mouth from pose 2 on): kappa **a fresh cucumber and a small silver fish**; porlock **a handful of oats and one red apple**;
   - row 4 **care**: lean toward a small cue (a hand) · receive care with eyes closed, happy · blink · relaxed.
   Draw this sheet first; it is the design master. Make two candidates, keep the better one, say why.
2. `<id>-right-motion-v01.png` — the same 4×4 layout and poses, all facing **RIGHT** (head toward image right; light
   still from the top-left, so do not just mirror the left sheet). Use sheet 1 as the design reference.
3. `<id>-growth-v01.png` — **1024×512, 2 rows × 4 cells of 256**: row 1 faces LEFT, row 2 faces RIGHT; columns
   newborn (tiny, round, big head; kappa already has its head puddle, porlock its shaggy mop and big nose) · juvenile ·
   adolescent · adult (the same adult as sheets 1–2). Adult about 2–3× the newborn's height, calm standing pose, feet on
   one ground line (local y = 210).

## B. Habitats and keepsake statues

In `garden-v05/masters-complete-objects/`, each **one object centred on a transparent square image** (1024×1024).
Style reference: `habitat_crup.png`, `habitat_grindylow.png`, `keepsake_crup.png`, `keepsake_grindylow.png` there and
their natives in `garden-v05/native-complete-objects/`. Habitats end up 36×28 native, so: squat silhouette,
extraordinarily simple, broad flat blocks, no creature in it.

| master | subject |
|---|---|
| `habitat_kappa.png` | a **mossy stone-rimmed puddle pool** (ring of 4–5 grey stones holding murky green-blue water) with a **small wooden bowl floating** in it and one cucumber on the rim; no creature |
| `habitat_porlock.png` | a **small thatched lean-to shelter** of grey-brown straw over two posts, a **heap of hay** under it and a small wooden water trough beside it; no creature |
| `keepsake_kappa.png` | a **Kappa statuette** (hunched monkey-like, head puddle shown as a small blue inset) on a low two-step warm grey stone plinth with a simple gold front inset; no lettering |
| `keepsake_porlock.png` | a **Porlock statuette** (upright shaggy guardian, big nose, hooves) on the same plinth style |

The keepsakes must look like one set with the existing keepsakes (same plinth, same gold inset).

## Delivery

- Record every image prompt in `docs/codex-briefs/edge-art/prompts-creatures.json` (create it as `{"items": []}`; one
  entry per master: `id`, `master`, `prompt`, `generatedFile` = the path your image tool wrote, `referenceFiles`).
- Masters (10 files): for each of `kappa`, `porlock`: `<id>-left-motion-v01.png`, `<id>-right-motion-v01.png`,
  `<id>-growth-v01.png`, `habitat_<id>.png`, `keepsake_<id>.png`.
- Do not write native frames, previews or any `.mjs`/`.json` outside `docs/codex-briefs/edge-art/`, and do not run
  any builder or importer: Claude does the reduction. Rejected candidates stay under `docs/codex-briefs/edge-art/`.
  You may place generated art onto the exact canvas with a small script there (crop/place, nearest-neighbour only; no
  painting, no quantizing); `docs/codex-briefs/creatures-art-2/place-masters.py` is a working example.
- Another Codex run is drawing brief 02 (scenery, icons) in the same worktree at the same time: touch only the files
  named here.
- Hard rules: no git commit/push/deploy; do not edit existing files; do not touch HPVNN or `functions/`. If image
  generation refuses a subject, stop that item, list it and the refusal text, and do not rename or describe around it.
  If image generation or usage is unavailable, stop and say so: never fake art with code.
- Report in `docs/codex-briefs/edge-art-01-report.md`: a table of id, master path, size, candidate kept and why,
  your verdict (good / redo), plus anything refused.
