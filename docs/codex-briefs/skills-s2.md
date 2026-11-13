# Codex brief — Hagrid Farm Season 2 «Tài năng sinh vật»: 18 creature skill icons (13/11/2026)

You are Codex in the Hagrid Farm repo. **You only draw masters.** Claude Code (Anthropic) reduces them to native
icons, builds the atlas, tests and commits after you. Keep repo exploration short.

Every garden creature now has one skill that helps the garden. Each skill gets one square icon, shown at 40×40 px in
the «Chăm bé» panel next to the creature's name. The icon must say **what the skill does** at a glance, and the
creature in it must be recognisable as the game's own creature.

## Style

Match the game's detailed creature sprites, **not** chunky blocks: open these at 8× nearest-neighbour first and copy
their pixel density, outline and shading:

- `garden-v05/native-levels/kneazle/frame-04.png` and `garden-v05/native-levels/unicorn/frame-04.png` (the quality
  target: fine 1-px pixel detail, fur and mane drawn in small clusters, soft 3–4 step shading, a crisp dark outline);
- `garden-v05/native-items/produce_grindylow.png`, `garden-v05/native-items/supply_water.png` (64×64 item icons: one
  readable object filling the square).

Pixel art, every pixel one flat square, dark outline `#231F2E` (lighter inner lines allowed, like the Kneazle's
fur), light from the top-left, no anti-aliasing blur, no gradients, no glow or halo outside the object, no text or
letters, no frame or badge background, no drop shadow, **transparent background** (real alpha). Colours close to
the game palette: `#231F2E #4A3042 #735044 #A57554 #41465C #687486 #A6B1AE #D6D8BF #24483F #3F6A45 #71934B #B0BD67
#8B4A3F #C97952 #E7AE73 #F5D69A #874056 #C75B4B #ED8A45 #FFC36B #3E3B70 #6961A6 #70A8B6 #B7DEE0`.

Each icon ends up **64×64 with the subject about 52×52**, then shown at 40 px. So: one compact scene, the creature
(or its unmistakable part) big, at most one or two small props, strong silhouette. Nothing tiny that disappears at
40 px. All 18 must look like one set (same outline weight, same light, same scale of subject).

## The 18 icons

Creature look: copy the game's sprite of that species (path given). Creature names are the game's Vietnamese ones;
draw the creature itself, never a person.

| sheet, cell | id | skill (what it does) | draw | creature reference |
|---|---|---|---|---|
| 1, r1 c1 | `puffskein` | «Ăn vụn nhả hạt»: harvests a plot and gives one seed back | the round fluffy cream Puffskein with its **long thin pink tongue** out, curling round **one big seed**; a tiny green sprout below | `creature-motion-assets/native/puffskein/left-care-01.png` |
| 1, r1 c2 | `bowtruckle` | «Tỉa cành»: prunes a growing plot so it grows sooner | the little green **Bowtruckle** (stick-insect of twigs, leaf tufts on its head) holding a pair of **small garden shears** snipping a leafy twig | `creature-motion-assets/native/bowtruckle/left-care-01.png` |
| 1, r1 c3 | `niffler` | «Đào kho báu»: digs an empty plot, finds water and seeds | the black fluffy **Niffler** (duck-bill snout) digging out of a **brown soil mound**, a **blue water drop** and **one seed** flying up | `creature-motion-assets/native/niffler/left-care-01.png` |
| 1, r2 c1 | `mooncalf` | «Phân trăng»: at night makes a plot grow sooner | the pale blue-grey **Mooncalf** (huge round eyes, long thin legs) beside a **sprout**, a **pale yellow crescent moon** above | `native-levels/mooncalf/frame-04.png` |
| 1, r2 c2 | `kneazle` | «Mắt tinh»: spots ripe plots and creatures in trouble | the **Kneazle's head** (speckled tan cat, lynx ear tufts) large, with **bright green eyes** wide open, a small **round magnifying lens** in front of one eye | `native-levels/kneazle/frame-04.png` |
| 1, r2 c3 | `diricawl` | «Biến – hiện»: vanishes and reappears to harvest a ripe plot | the plump grey **Diricawl** bird **half fading into a puff of feathers** (one side drawn as scattered feather pixels), holding **one harvested carrot** in its beak | `native-levels/diricawl/frame-04.png` |
| 2, r1 c1 | `fwooper` | «Hát ru»: sings so every creature cheers up | the brightly coloured **Fwooper** bird singing with beak open, **two music notes** and **one small heart** floating | `native-levels/fwooper/frame-04.png` |
| 2, r1 c2 | `hippogriff` | «Chở nước»: carries water to the garden | a **Hippogriff** head and one big grey-brown **eagle wing** carrying a **wooden bucket of blue water** | `creature-motion-assets/native/hippogriff/left-care-01.png` |
| 2, r1 c3 | `thestral` | «Dẫn đường»: leads lost creatures home from the Forbidden Forest | the black skeletal winged **Thestral** head (white eyes) beside a small **lantern**, a dotted **path** curving home | `native-levels/thestral/frame-04.png` |
| 2, r2 c1 | `unicorn` | «Chữa lành»: heals a sick creature | the golden-cream **Unicorn's head** with its **spiral horn**, a **red heart** and a **small silver drop** by the horn tip | `native-levels/unicorn/frame-04.png` |
| 2, r2 c2 | `three-headed-dog` | «Canh đêm»: keeps the garden gnomes away at night | the **three brown dog heads** of the game's three-headed dog side by side, ears up, alert, a **crescent moon** above | `creature-motion-assets/native/three-headed-dog/left-action-01.png` |
| 2, r2 c3 | `dragon` | «Thiêu cỏ»: burns away a dried-out plot or weeds | the game's **dragon head** breathing a short **flat flame** (yellow, orange, red, hard edges) onto **one dry brown weed tuft** | `creature-motion-assets/native/dragon/left-care-01.png` |
| 3, r1 c1 | `grindylow` | «Chúa tể đáy hồ» (Lord of the lake bed): keeps the pond clear and pulls in the fish | the green **Grindylow** with a **tiny gold crown**, its **very long thin fingers** gripping a **fishing net** with **one orange carp** in it, a few water bubbles | `creature-motion-assets/native/grindylow/left-idle-01.png` |
| 3, r1 c2 | `crup` | «Ăn ma lùm»: chases off a garden gnome as it bites | the white-and-tan terrier **Crup** (its **forked tail** big and clear) bounding after a **small potato-headed ma lùm** (the garden gnome, see `environment/duty/masters/ma-lum.png`) running away; playful, not violent | `creature-motion-assets/native/crup/left-idle-01.png` |
| 3, r1 c3 | `knarl` | «Xới đất»: turns over tired soil | the grumpy **Knarl** curled into a **spiky ball** rolling over **brown soil furrows**, a little clod of earth flying | `creature-motion-assets/native/knarl/left-idle-01.png` |
| 3, r2 c1 | `salamander` | «Ở trong lửa»: lives in fire and keeps plots safe from fire and frost | the orange **fire salamander** curled round **one green sprout**, a few hard-edged flame licks behind it, a **small snowflake** on the other side | `creature-motion-assets/native/salamander/left-idle-01.png` |
| 3, r2 c2 | `kappa` | «Dẫn nước»: guides water to the crops in a drought | the green **Kappa** bowing, **water pouring from the dish on its head** onto **a sprout** | `creature-motion-assets/native/kappa/left-idle-01.png` |
| 3, r2 c3 | `porlock` | «Gác bãi chăn»: guards the horses so they stay happy | the small shaggy **Porlock** standing upright on its hoof, holding a **wooden shepherd's crook**, a **horseshoe** beside it | `creature-motion-assets/native/porlock/left-idle-01.png` |

All paths above are under `garden-v05/`.

## Sheets

Three sheets in `garden-v05/masters-items/skills-s2/`: `skills-sheet-1.png`, `skills-sheet-2.png`,
`skills-sheet-3.png`, each **1536×1024, 3 columns × 2 rows of 512×512 cells** (no drawn grid), one icon per cell,
centred, the subject about 420×420 inside the cell with **≥ 40 px empty margin** to every cell edge, every icon one
connected group of pixels or tightly grouped (props touching or within a few px of the creature).

Make **two candidates per sheet**, keep the better (clearest action at 40 px, closest to the Kneazle sprite's
detail). Rejected candidates stay under `docs/codex-briefs/skills-s2/`.

## Delivery

- Record every image prompt in `docs/codex-briefs/skills-s2/prompts.json` (create it as `{"items": []}`; one entry per
  sheet: `id`, `master`, `prompt`, `generatedFile` = the path your image tool wrote, `referenceFiles`).
- You may place generated art onto the exact canvas with a small script under `docs/codex-briefs/skills-s2/`
  (crop/place, nearest-neighbour only; no painting, no quantizing).
- Hard rules: no git commit/push/deploy; do not edit existing files; do not run any builder or importer; do not touch
  HPVNN or `functions/`. If image generation refuses a subject, stop that item, list it with the refusal text, and do
  not rename or describe around it. If image generation or usage is unavailable, stop and say so: never fake art with
  code.
- Report in `docs/codex-briefs/skills-s2-report.md`: a table of id, sheet, cell, candidate kept and why, your verdict
  (good / redo), plus anything refused.
