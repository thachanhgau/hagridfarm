# Hagrid Farm Season 2 skill masters — 2026-11-13

Three 1536×1024 RGBA masters were created, with six cells per sheet in the requested order. Two candidates were generated per sheet with the built-in image tool; candidate B was retained for each. All six original candidates remain in `skills-s2/`. These are review masters, **not accepted production art**: all 18 cells receive **redo** under the brief's strict pixel-art requirements.

## Shared quality finding

The selected masters have real transparent pixels and at least **46 px of fully transparent margin** at every cell edge. However, the generated subjects have partially transparent pixels, softened edges and residual low-opacity colour around them. None of the three selected sheets contains alpha=255 pixels (maximum alpha is 253–254). This violates the requested flat, crisp, unblurred pixel treatment. The generator also did not consistently follow an exact native pixel grid or preserve the game's creature likeness. Nearest-neighbour placement cannot repair these issues.

The placement script only crops each original 512×512 cell, resizes it to 420×420 using nearest-neighbour, and pastes it at offset (46,46) into its cell on a transparent canvas. It preserves source RGBA values; it performs no painting, alpha thresholding or colour quantization. Fine content may consequently occupy less than 420 px; low-opacity residual pixels count toward its bounds.

Visual review used each cell reduced 512→64→40 with nearest-neighbour, on white and dark backgrounds, plus a 2× enlarged view. This was an inspection only: no native icons, atlas, builder, importer, runtime integration or game tests were produced.

## Per-icon verdict

Every row inherits the shared alpha/pixel-style failure above. The reasons below compare candidate B against A and identify additional remaining problems.

| id | sheet | cell | candidate kept and why | verdict |
|---|---:|---|---|---|
| puffskein | 1 | r1 c1 | B: larger seed and clearer tongue loop. Tongue/seed details merge at 40 px; fluff differs from the reference. | redo |
| bowtruckle | 1 | r1 c2 | B: clearer upright twig silhouette and shears. Thin limbs and cutting action become too sparse at 40 px. | redo |
| niffler | 1 | r1 c3 | B: larger bill and clear soil mound; drop remains visible. Seed becomes very small and fur is too finely rendered for the requested native grid. | redo |
| mooncalf | 1 | r2 c1 | B: longer neck and broad ears closer to the game reference than A's deer-like form. Sprout is too small and separated at 40 px. | redo |
| kneazle | 1 | r2 c2 | B: more compact face and readable green lens-eye. Face is still generic fluffy tabby rather than the game's slender, strongly tufted Kneazle. | redo |
| diricawl | 1 | r2 c3 | B: more compact feather scatter and carrot action. Carrot becomes tiny; silhouette and feather pattern differ from game sprite. | redo |
| fwooper | 2 | r1 c1 | B: cleaner crest and less convoluted tail; singing pose remains readable. Notes are dark and weak on dark backgrounds; face differs from reference. | redo |
| hippogriff | 2 | r1 c2 | B: bucket and wing make a tighter group and blue water is clear. Head is a generic eagle rather than the game's specific Hippogriff. | redo |
| thestral | 2 | r1 c3 | B: lantern/path/home form a tighter group. Dotted path disappears at 40 px; face and lantern dominate over skeletal detail. | redo |
| unicorn | 2 | r2 c1 | B: simpler mane and closer heart/drop grouping. Heart/drop are very small at 40 px; pale face differs from game's warm golden-cream head. | redo |
| three-headed-dog | 2 | r2 c2 | B: compact three-head group and stronger moon silhouette. Brown heads follow the written brief but available motion reference has cream fur; likeness unresolved. | redo |
| dragon | 2 | r2 c3 | B: flame connects more closely to weed and head is less elongated. Flame still has soft colour/alpha spill and head differs from game sprite. | redo |
| grindylow | 3 | r1 c1 | B: narrower limbs and more visible long fingers; net/carp clear when enlarged. Head/body still too broad and fish is small at 40 px. | redo |
| crup | 3 | r1 c2 | B: removed A's incorrect red pointed gnome hat; Y-tail and playful chase remain. Gnome still looks like a round generic figure rather than the reference potato-headed ma lum. | redo |
| knarl | 3 | r1 c3 | B: tighter spiky ball and clearer rolling silhouette. Furrows remain detached, tiny and faint at 40 px. | redo |
| salamander | 3 | r2 c1 | B: tighter protective curl and closer snowflake. Still reads as a generic orange dragon; flame treatment has soft spill and sprout is too small. | redo |
| kappa | 3 | r2 c2 | B: compact head-dish stream and sprout; pouring action reads. Bowing posture and game head shape need stronger reference fidelity. | redo |
| porlock | 3 | r2 c3 | B: compact upright stance with clear crook/horseshoe. Face reads as a furry goblin/cat and differs from game's shaggy Porlock profile. | redo |

## Files and provenance

- Masters: `garden-v05/masters-items/skills-s2/skills-sheet-{1,2,3}.png`.
- Prompts: `docs/codex-briefs/skills-s2/prompts.json`, one top-level entry per sheet, containing the selected prompt and both candidate prompts, original tool output paths and reference lists.
- Candidate originals: `docs/codex-briefs/skills-s2/skills-sheet-{1,2,3}-candidate-{A,B}.png`.
- Placement only: `docs/codex-briefs/skills-s2/place-sheet.py`.
- Measured canvas, alpha and cell margins: `docs/codex-briefs/skills-s2/verification.json`.
- QA preview: `docs/codex-briefs/skills-s2/review-40px.png`. Rows correspond to sheets 1–3; within each sheet, six icons are in row-major order. Each tile shows 40 px and a 2× nearest-neighbour enlargement, on white and dark backgrounds.

Reference exception: `garden-v05/creature-motion-assets/native/three-headed-dog/left-action-01.png` does not exist in this checkout. The available `right-action-01.png` was inspected instead. Its cream coat conflicts with the brief's requested brown heads; the art follows the written brown instruction.

Kneazle and Unicorn were inspected at exactly 8× nearest-neighbour. Item references were inspected at 8×. Species references were inspected in nearest-neighbour montages. For candidates 2B and 3B, reference montages and a Kneazle enlargement were supplied directly to the image tool; exact tool paths are recorded in the prompts file and copies are retained here. The retained `skills-refs-3.png` supporting montage includes the ma lum reference.

Refusals: **none**. All six requested image generations returned images. No subject was renamed to bypass a refusal.

No commit, push, deployment, builder, importer, atlas or native-icon creation was performed. No HPVNN or `functions/` files were touched. Existing unrelated logs and notes were preserved. The pre-existing empty `prompts.json` was populated as explicitly requested; no other pre-existing repository file was edited.

